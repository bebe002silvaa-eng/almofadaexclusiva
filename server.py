import hmac
import json
import os
import re
import secrets
import threading
import time
import uuid
from http.cookies import CookieError, SimpleCookie
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / ".data"
STORE_FILE = DATA_DIR / "store.json"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
ORDERS_FILE = DATA_DIR / "orders.json"
BLACKCAT_API = "https://api.blackcatoficial.com/api"
MAX_BODY_SIZE = 8 * 1024 * 1024
state_lock = threading.Lock()
rate_lock = threading.Lock()
rate_limits = {}
admin_session_lock = threading.Lock()
admin_sessions = {}
ADMIN_SESSION_TTL = 8 * 60 * 60
ADMIN_SESSION_COOKIE = "pc_admin_session"


def load_env_file():
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def send_json(handler, status, value, headers=None):
    body = json.dumps(value, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    for name, header_value in (headers or {}).items():
        handler.send_header(name, header_value)
    handler.end_headers()
    handler.wfile.write(body)


def safe_store(value):
    public = dict(value)
    public.pop("senhaAdmin", None)
    public.pop("stockChanges", None)
    public.pop("orders", None)
    payment = dict(public.get("pagamento") or {})
    gateway = dict(payment.get("gateway") or {})
    for key in list(gateway):
        normalized_key = key.lower().replace("_", "")
        if any(word in normalized_key for word in ("private", "privad", "secret", "segred", "token", "apikey", "chaveapi")):
            gateway.pop(key, None)
    payment["gateway"] = gateway
    public["pagamento"] = payment
    return public


def read_store_unlocked():
    try:
        return json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except (OSError, json.JSONDecodeError):
        return None


def read_store():
    with state_lock:
        return read_store_unlocked()


def write_json_atomic(path, value):
    DATA_DIR.mkdir(exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(path)


def load_transactions():
    try:
        with state_lock:
            value = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
            return value if isinstance(value, dict) else {}
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return {}


def save_transaction(transaction_id, transaction):
    with state_lock:
        try:
            transactions = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
        except FileNotFoundError:
            transactions = {}
        except (OSError, json.JSONDecodeError) as error:
            raise OSError("Não foi possível ler o histórico de cobranças.") from error
        if not isinstance(transactions, dict):
            raise OSError("O histórico de cobranças está em formato inválido.")
        transactions[transaction_id] = transaction
        write_json_atomic(TRANSACTIONS_FILE, transactions)


def load_orders_unlocked():
    try:
        value = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except (OSError, json.JSONDecodeError) as error:
        raise OSError("Não foi possível ler o histórico de pedidos.") from error
    if not isinstance(value, dict):
        raise OSError("O histórico de pedidos está em formato inválido.")
    return value


def save_orders_and_store_unlocked(orders, store=None):
    previous_orders = load_orders_unlocked()
    write_json_atomic(ORDERS_FILE, orders)
    if store is None:
        return
    try:
        write_json_atomic(STORE_FILE, store)
    except OSError:
        try:
            write_json_atomic(ORDERS_FILE, previous_orders)
        except OSError as rollback_error:
            raise OSError("Falha ao salvar o estoque e ao restaurar o histórico de pedidos.") from rollback_error
        raise


def append_order_event(order, event, now):
    order.setdefault("history", []).append({"event": event, "at": now})
    order["history"] = order["history"][-20:]


def restore_order_stock(store, order):
    products = {str(product.get("id")): product for product in store.get("produtos", []) if isinstance(product, dict)}
    for item in order.get("items", []):
        product = products.get(str(item.get("productId")))
        if product is None:
            continue
        try:
            stock = int(product.get("estoque", 0))
            quantity = int(item.get("quantity", 0))
        except (TypeError, ValueError):
            raise OSError("Não foi possível liberar o estoque deste pedido.")
        product["estoque"] = max(0, stock + quantity)
    order["inventoryReserved"] = False


def reserve_expired_order_stock(store, order):
    products = {
        str(product.get("id")): product
        for product in store.get("produtos", [])
        if isinstance(product, dict)
    }
    items = order.get("items", [])
    if not isinstance(items, list) or not items:
        raise ValueError("Não foi possível conferir os produtos deste pedido expirado.")
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Não foi possível conferir os produtos deste pedido expirado.")
        product = products.get(str(item.get("productId")))
        try:
            stock = int(product.get("estoque", 0)) if product else -1
            quantity = int(item.get("quantity", 0))
        except (TypeError, ValueError):
            raise ValueError("O estoque deste pedido não pode ser conferido.") from None
        if product is None or quantity < 1 or quantity > stock:
            raise ValueError("Estoque insuficiente para confirmar este pagamento tardio. Atualize o estoque e tente novamente.")
    for item in items:
        product = products[str(item["productId"])]
        product["estoque"] = int(product.get("estoque", 0)) - int(item["quantity"])
    order["inventoryReserved"] = True


def expire_manual_orders_unlocked(store, orders, now):
    changed = False
    for order in orders.values():
        if (
            order.get("paymentMethod") == "manual_pix"
            and order.get("status") == "AWAITING_PAYMENT"
            and float(order.get("expiresAt", 0)) <= now
            and order.get("inventoryReserved")
        ):
            restore_order_stock(store, order)
            order["status"] = "EXPIRED"
            order["paymentStatus"] = "EXPIRED"
            order["updatedAt"] = now
            append_order_event(order, "EXPIRED", now)
            changed = True
    return changed


def validate_order_customer(customer, shipping):
    if not isinstance(customer, dict) or not isinstance(shipping, dict):
        raise ValueError("Preencha os dados do cliente e o endereço de entrega.")
    name = required_text(customer.get("name"), "nome", 120)
    email = str(customer.get("email", "")).strip()
    if len(email) > 254 or (email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email)):
        raise ValueError("Informe um e-mail válido.")
    phone = re.sub(r"\D", "", str(customer.get("phone", "")))
    if not 10 <= len(phone) <= 13:
        raise ValueError("Informe um telefone válido com DDD.")
    address = {
        "street": required_text(shipping.get("street"), "rua", 200),
        "number": required_text(shipping.get("number"), "número", 30),
        "complement": str(shipping.get("complement", "")).strip()[:120],
        "neighborhood": required_text(shipping.get("neighborhood"), "bairro", 120),
        "city": required_text(shipping.get("city"), "cidade", 120),
        "state": required_text(shipping.get("state"), "estado", 2).upper(),
        "zipCode": re.sub(r"\D", "", str(shipping.get("zipCode", "")))
    }
    if len(address["state"]) != 2 or len(address["zipCode"]) != 8:
        raise ValueError("Confira o estado e o CEP do endereço de entrega.")
    return {"name": name, "email": email, "phone": phone, "shipping": address}


def reserve_order(order_id, customer, requested_items, payment_method):
    now = time.time()
    with state_lock:
        store = read_store_unlocked()
        if store is None:
            raise ValueError("A loja ainda não foi sincronizada com o servidor.")
        payment_method_expected = "pix" if payment_method == "manual_pix" else "gateway"
        if (store.get("pagamento") or {}).get("metodo") != payment_method_expected:
            raise ValueError("A forma de pagamento da loja foi alterada. Atualize a página e tente novamente.")
        orders = load_orders_unlocked()
        expired = expire_manual_orders_unlocked(store, orders, now)
        if expired:
            save_orders_and_store_unlocked(orders, store)
            expired = False
        products = {
            str(product.get("id")): product
            for product in store.get("produtos", [])
            if isinstance(product, dict)
        }
        quantities = {}
        for requested in requested_items:
            if not isinstance(requested, dict):
                raise ValueError("Um item do pedido não está válido.")
            product_id = required_text(str(requested.get("id", "")), "produto", 120)
            try:
                quantity = int(requested.get("quantity", 0))
            except (TypeError, ValueError):
                raise ValueError("A quantidade de um produto não é válida.") from None
            if quantity < 1 or quantity > 99:
                raise ValueError("A quantidade de cada produto deve estar entre 1 e 99.")
            quantities[product_id] = quantities.get(product_id, 0) + quantity
        if not quantities or len(quantities) > 50:
            raise ValueError("O carrinho está vazio ou contém itens demais.")
        items = []
        total_cents = 0
        for product_id, quantity in quantities.items():
            product = products.get(product_id)
            if product is None:
                raise ValueError("Um produto do carrinho não está no catálogo atual. Atualize a página e tente novamente.")
            try:
                stock = int(product.get("estoque", 0))
            except (TypeError, ValueError):
                raise ValueError(f"O estoque de {product.get('nome', 'um produto')} não está válido.") from None
            if quantity > stock:
                raise ValueError(f"Estoque insuficiente para {product.get('nome', 'um produto')}.")
            unit_price = money_in_cents(product.get("preco"))
            line_total = unit_price * quantity
            total_cents += line_total
            items.append({
                "productId": product_id,
                "name": required_text(str(product.get("nome", "")), "nome do produto", 200),
                "quantity": quantity,
                "unitPriceCents": unit_price,
                "lineTotalCents": line_total
            })
        if total_cents < 1:
            raise ValueError("O total do pedido não é válido.")
        for item in items:
            products[item["productId"]]["estoque"] = int(products[item["productId"]].get("estoque", 0)) - item["quantity"]
        order = {
            "id": order_id,
            "createdAt": now,
            "updatedAt": now,
            "expiresAt": now + 24 * 60 * 60,
            "paymentMethod": payment_method,
            "paymentStatus": "PENDING",
            "status": "AWAITING_PAYMENT",
            "inventoryReserved": True,
            "amountCents": total_cents,
            "customer": customer,
            "items": items,
            "transactionId": "",
            "history": []
        }
        append_order_event(order, "AWAITING_PAYMENT", now)
        orders[order_id] = order
        try:
            save_orders_and_store_unlocked(orders, store)
        except OSError:
            if expired:
                raise OSError("O estoque expirado foi liberado, mas não foi possível registrar a reserva do pedido.")
            raise
        return order


def update_order_action(order_id, action, allow_gateway_cancel=False):
    now = time.time()
    with state_lock:
        orders = load_orders_unlocked()
        order = orders.get(order_id)
        if not isinstance(order, dict):
            raise KeyError("Pedido não encontrado.")
        store = read_store_unlocked()
        if store is None:
            raise OSError("A loja ainda não foi sincronizada com o servidor.")
        if action == "confirm_payment":
            late_manual_payment = order.get("paymentMethod") == "manual_pix" and order.get("status") == "EXPIRED"
            if order.get("status") not in ("AWAITING_PAYMENT", "PAYMENT_REPORTED", "GATEWAY_REVIEW") and not late_manual_payment:
                raise ValueError("Este pedido não está aguardando confirmação de pagamento.")
            if order.get("paymentMethod") != "manual_pix" and order.get("status") != "GATEWAY_REVIEW":
                raise ValueError("Pagamentos do gateway devem ser confirmados pela consulta automática.")
            if late_manual_payment and not order.get("inventoryReserved"):
                reserve_expired_order_stock(store, order)
            order["paymentStatus"] = "PAID"
            order["status"] = "PAID"
            order["paidAt"] = now
        elif action == "cancel":
            manual_pending = order.get("paymentMethod") == "manual_pix" and order.get("status") in ("AWAITING_PAYMENT", "PAYMENT_REPORTED")
            gateway_review = (
                allow_gateway_cancel
                and order.get("paymentMethod") == "blackcat"
                and order.get("status") in ("AWAITING_PAYMENT", "GATEWAY_REVIEW")
            )
            if not manual_pending and not gateway_review:
                raise ValueError("Só é possível cancelar pedidos PIX manual ainda não pagos.")
            if order.get("inventoryReserved"):
                restore_order_stock(store, order)
            order["status"] = "CANCELLED"
            order["paymentStatus"] = "CANCELLED"
        elif action == "mark_shipped":
            if order.get("status") != "PAID":
                raise ValueError("Confirme o pagamento antes de marcar o envio.")
            order["status"] = "SHIPPED"
            order["shippedAt"] = now
        elif action == "mark_delivered":
            if order.get("status") != "SHIPPED":
                raise ValueError("Marque o pedido como enviado antes de concluir a entrega.")
            order["status"] = "DELIVERED"
            order["deliveredAt"] = now
        else:
            raise ValueError("A ação solicitada não é válida.")
        order["updatedAt"] = now
        append_order_event(order, order["status"], now)
        save_orders_and_store_unlocked(orders, store if not order.get("inventoryReserved") else None)
        return order


def attach_gateway_transaction(order_id, transaction_id):
    with state_lock:
        orders = load_orders_unlocked()
        order = orders.get(order_id)
        if not isinstance(order, dict) or order.get("status") != "AWAITING_PAYMENT":
            raise OSError("Não foi possível vincular a cobrança ao pedido.")
        order["transactionId"] = transaction_id
        order["updatedAt"] = time.time()
        append_order_event(order, "GATEWAY_CHARGE_CREATED", order["updatedAt"])
        write_json_atomic(ORDERS_FILE, orders)


def mark_gateway_review(order_id, transaction_id=None):
    now = time.time()
    with state_lock:
        orders = load_orders_unlocked()
        order = orders.get(order_id)
        if not isinstance(order, dict):
            raise OSError("Não foi possível localizar o pedido da cobrança.")
        if transaction_id and re.fullmatch(r"[A-Za-z0-9_-]{1,100}", str(transaction_id)):
            order["transactionId"] = str(transaction_id)
        order["status"] = "GATEWAY_REVIEW"
        order["paymentStatus"] = "UNKNOWN"
        order["updatedAt"] = now
        append_order_event(order, "GATEWAY_RESPONSE_UNKNOWN", now)
        write_json_atomic(ORDERS_FILE, orders)


def update_gateway_order(transaction_id, state, paid_at=None):
    now = time.time()
    with state_lock:
        orders = load_orders_unlocked()
        order = next(
            (item for item in orders.values() if isinstance(item, dict) and item.get("transactionId") == transaction_id),
            None
        )
        if order is None or order.get("status") in ("CANCELLED", "EXPIRED"):
            return
        changed_inventory = False
        if state == "PAID" and order.get("status") in ("AWAITING_PAYMENT", "PAYMENT_REPORTED", "GATEWAY_REVIEW"):
            order["status"] = "PAID"
            order["paymentStatus"] = "PAID"
            order["paidAt"] = paid_at or now
            append_order_event(order, "PAID", now)
        elif state == "CANCELLED" and order.get("status") in ("AWAITING_PAYMENT", "PAYMENT_REPORTED", "GATEWAY_REVIEW"):
            store = read_store_unlocked()
            if store is None:
                raise OSError("Não foi possível liberar o estoque de um pedido cancelado.")
            if order.get("inventoryReserved"):
                restore_order_stock(store, order)
                changed_inventory = True
            order["status"] = "CANCELLED"
            order["paymentStatus"] = "CANCELLED"
            append_order_event(order, "CANCELLED", now)
        elif state == "REFUNDED":
            order["paymentStatus"] = "REFUNDED"
            order["status"] = "REFUNDED"
            append_order_event(order, "REFUNDED", now)
        else:
            return
        order["updatedAt"] = now
        save_orders_and_store_unlocked(orders, store if changed_inventory else None)


def apply_stock_changes_unlocked(store, changes):
    if not isinstance(changes, list) or len(changes) > 500:
        raise ValueError("A lista de alterações de estoque não está válida.")
    products = {
        str(product.get("id")): product
        for product in store.get("produtos", [])
        if isinstance(product, dict)
    }
    changes_by_id = {}
    for change in changes:
        if not isinstance(change, dict):
            raise ValueError("Uma alteração de estoque não está válida.")
        product_id = required_text(str(change.get("id", "")), "produto", 120)
        try:
            stock = int(change.get("stock"))
            expected_stock = int(change.get("expectedStock"))
        except (TypeError, ValueError):
            raise ValueError("Informe um estoque inteiro válido.")
        if stock < 0 or expected_stock < 0:
            raise ValueError("O estoque não pode ser negativo.")
        if product_id not in products:
            raise ValueError("Um produto informado para estoque não existe mais.")
        if product_id in changes_by_id:
            raise ValueError("O mesmo produto foi informado mais de uma vez.")
        changes_by_id[product_id] = (stock, expected_stock)
    for product_id, (stock, expected_stock) in changes_by_id.items():
        try:
            current_stock = int(products[product_id].get("estoque", 0))
        except (TypeError, ValueError):
            raise ValueError("O estoque atual do produto não está válido.") from None
        if current_stock != expected_stock:
            raise ValueError(f"O estoque de {products[product_id].get('nome', 'um produto')} mudou. Atualize os dados antes de salvar.")
    for product_id, (stock, _) in changes_by_id.items():
        products[product_id]["estoque"] = stock


def too_many_requests(client_ip, bucket, limit, window_seconds):
    now = time.time()
    with rate_lock:
        recent = [stamp for stamp in rate_limits.get((client_ip, bucket), []) if now - stamp < window_seconds]
        if len(recent) >= limit:
            rate_limits[(client_ip, bucket)] = recent
            return True
        recent.append(now)
        rate_limits[(client_ip, bucket)] = recent
        return False


def required_text(value, label, maximum=200):
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > maximum:
        raise ValueError(f"Confira o campo {label}.")
    return value.strip()


def money_in_cents(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError("O preço de um produto não é válido.") from None
    if not amount.is_finite() or amount <= 0:
        raise ValueError("O preço de um produto não é válido.")
    return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def valid_cpf(value):
    cpf = re.sub(r"\D", "", str(value or ""))
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    for position in (9, 10):
        total = sum(int(cpf[index]) * (position + 1 - index) for index in range(position))
        digit = (total * 10) % 11 % 10
        if int(cpf[position]) != digit:
            return False
    return True


def call_blackcat(path, method, api_key, payload=None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"X-API-Key": api_key, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = Request(f"{BLACKCAT_API}{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=25) as response:
            response_body = response.read(1024 * 1024)
            parsed = json.loads(response_body)
            return response.status, parsed
    except HTTPError as error:
        try:
            details = json.loads(error.read(256 * 1024))
            message = details.get("message") if isinstance(details, dict) else None
        except (OSError, json.JSONDecodeError):
            message = None
        return error.code, {"message": message or "O gateway recusou a solicitação."}
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError("Não foi possível confirmar a resposta da BlackCat. Tente novamente mais tarde.") from error


class StoreHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def log_message(self, format_string, *args):
        if self.path.startswith("/api/"):
            return
        super().log_message(format_string, *args)

    def has_same_origin(self):
        origin = urlparse(self.headers.get("Origin", ""))
        return (
            origin.scheme in ("http", "https")
            and origin.netloc.lower() == self.headers.get("Host", "").lower()
        )

    def get_admin_session(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except CookieError:
            return None
        morsel = cookie.get(ADMIN_SESSION_COOKIE)
        if morsel is None:
            return None
        token = morsel.value
        now = time.time()
        with admin_session_lock:
            expires_at = admin_sessions.get(token)
            if expires_at is None:
                return None
            if expires_at <= now:
                del admin_sessions[token]
                return None
            return token

    def admin_cookie(self, token, max_age):
        secure = "; Secure" if self.headers.get("X-Forwarded-Proto", "").lower() == "https" else ""
        return (
            f"{ADMIN_SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Strict; "
            f"Max-Age={max_age}{secure}"
        )

    def do_GET(self):
        path = urlparse(self.path).path
        decoded_path = unquote(path).replace("\\", "/")
        path_parts = [part for part in decoded_path.split("/") if part]
        if any(part.startswith(".") or part.lower() == "server.py" for part in path_parts):
            send_json(self, 404, {"error": "Não encontrado."})
            return
        if path == "/api/health":
            send_json(self, 200, {"ok": True, "paymentConfigured": bool(os.environ.get("BLACKCAT_API_KEY"))})
            return
        if path == "/api/admin/session":
            send_json(self, 200, {"authenticated": self.get_admin_session() is not None})
            return
        if path == "/api/admin/orders":
            self.list_admin_orders()
            return
        if path == "/api/store":
            store = read_store()
            if store is None:
                send_json(self, 404, {"error": "A loja ainda não foi sincronizada com o servidor."})
                return
            send_json(self, 200, safe_store(store))
            return
        match = re.fullmatch(r"/api/payments/([A-Za-z0-9_-]{1,100})", path)
        if match:
            self.get_payment_status(match.group(1))
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/admin/login":
            self.admin_login()
            return
        if path == "/api/admin/logout":
            self.admin_logout()
            return
        if path == "/api/admin/store":
            self.save_store()
            return
        if path == "/api/admin/stock":
            self.update_stock()
            return
        if path == "/api/orders/manual":
            self.create_manual_order()
            return
        order_match = re.fullmatch(r"/api/orders/(PC[A-F0-9]{20})/(report-payment|cancel)", path)
        if order_match:
            if order_match.group(2) == "report-payment":
                self.report_order_payment(order_match.group(1))
            else:
                self.cancel_manual_order(order_match.group(1))
            return
        admin_order_match = re.fullmatch(r"/api/admin/orders/(PC[A-F0-9]{20})/action", path)
        if admin_order_match:
            self.update_admin_order(admin_order_match.group(1))
            return
        if path == "/api/payments/blackcat":
            self.create_blackcat_payment()
            return
        send_json(self, 404, {"error": "Não encontrado."})

    def admin_login(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if too_many_requests(self.client_address[0], "admin-login", 5, 15 * 60):
            send_json(self, 429, {"error": "Muitas tentativas de acesso. Aguarde 15 minutos e tente novamente."})
            return
        admin_password = os.environ.get("ADMIN_SYNC_PASSWORD", "")
        if not admin_password:
            send_json(self, 503, {"error": "A senha de acesso ainda não foi configurada no servidor."})
            return
        try:
            value = self.read_json_body(16 * 1024)
        except ValueError as error:
            send_json(self, 400, {"error": str(error)})
            return
        provided_password = value.get("password")
        if not isinstance(provided_password, str) or not hmac.compare_digest(provided_password, admin_password):
            send_json(self, 401, {"error": "Senha incorreta."})
            return
        token = secrets.token_urlsafe(32)
        with admin_session_lock:
            now = time.time()
            expired = [session for session, expiry in admin_sessions.items() if expiry <= now]
            for session in expired:
                del admin_sessions[session]
            admin_sessions[token] = now + ADMIN_SESSION_TTL
        send_json(self, 200, {"authenticated": True}, {
            "Set-Cookie": self.admin_cookie(token, ADMIN_SESSION_TTL)
        })

    def admin_logout(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        token = self.get_admin_session()
        if token is not None:
            with admin_session_lock:
                admin_sessions.pop(token, None)
        send_json(self, 200, {"authenticated": False}, {
            "Set-Cookie": self.admin_cookie("", 0)
        })

    def read_json_body(self, limit=MAX_BODY_SIZE):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Corpo da solicitação inválido.") from None
        if length < 1 or length > limit:
            raise ValueError("A solicitação está vazia ou excede o limite permitido.")
        try:
            value = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("Envie os dados em formato JSON válido.") from None
        if not isinstance(value, dict):
            raise ValueError("O formato dos dados enviados não é válido.")
        return value

    def save_store(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if self.get_admin_session() is None:
            send_json(self, 401, {"error": "Sua sessão expirou. Entre novamente no painel da loja."})
            return
        try:
            value = self.read_json_body()
            if not isinstance(value.get("loja"), dict) or not isinstance(value.get("produtos"), list):
                raise ValueError("Dados da loja ou do catálogo não estão válidos.")
            if len(value["produtos"]) > 500:
                raise ValueError("O catálogo excede o limite de produtos do servidor.")
            payment = value.get("pagamento")
            if payment is not None and (
                not isinstance(payment, dict)
                or payment.get("metodo") not in ("pix", "gateway")
            ):
                raise ValueError("Escolha PIX ou gateway como forma de pagamento.")
            if payment is not None and payment.get("gateway") is not None and not isinstance(payment["gateway"], dict):
                raise ValueError("As configurações do gateway não estão válidas.")
            stock_changes = value.pop("stockChanges", [])
            with state_lock:
                current = read_store_unlocked()
                if current is not None:
                    requested_product_ids = {
                        str(product.get("id"))
                        for product in value["produtos"]
                        if isinstance(product, dict) and product.get("id") is not None
                    }
                    orders = load_orders_unlocked()
                    reserved_product_ids = {
                        str(item.get("productId"))
                        for order in orders.values()
                        if isinstance(order, dict)
                        and order.get("status") in ("AWAITING_PAYMENT", "PAYMENT_REPORTED", "GATEWAY_REVIEW")
                        and order.get("inventoryReserved")
                        for item in order.get("items", [])
                        if isinstance(item, dict)
                    }
                    if reserved_product_ids - requested_product_ids:
                        raise ValueError("Não remova produtos que ainda têm unidades reservadas por pedidos pendentes.")
                    apply_stock_changes_unlocked(current, stock_changes)
                    current_products = {
                        str(product.get("id")): product
                        for product in current.get("produtos", [])
                        if isinstance(product, dict)
                    }
                    changed_ids = {
                        str(change.get("id"))
                        for change in stock_changes
                        if isinstance(change, dict)
                    }
                    for product in value["produtos"]:
                        if not isinstance(product, dict):
                            continue
                        product_id = str(product.get("id", ""))
                        existing = current_products.get(product_id)
                        if existing is not None and product_id not in changed_ids:
                            product["estoque"] = existing.get("estoque", 0)
                        elif existing is not None:
                            product["estoque"] = existing.get("estoque", 0)
                write_json_atomic(STORE_FILE, safe_store(value))
        except ValueError as error:
            send_json(self, 409 if "mudou" in str(error) or "reservadas" in str(error) or "reservados" in str(error) else 400, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível gravar as configurações no servidor."})
            return
        send_json(self, 200, {"success": True})

    def list_admin_orders(self):
        if self.get_admin_session() is None:
            send_json(self, 401, {"error": "Sua sessão expirou. Entre novamente no painel da loja."})
            return
        try:
            with state_lock:
                store = read_store_unlocked()
                if store is None:
                    send_json(self, 404, {"error": "A loja ainda não foi sincronizada com o servidor."})
                    return
                orders = load_orders_unlocked()
                if expire_manual_orders_unlocked(store, orders, time.time()):
                    save_orders_and_store_unlocked(orders, store)
                inventory = [
                    {"id": str(product.get("id")), "stock": int(product.get("estoque", 0))}
                    for product in store.get("produtos", [])
                    if isinstance(product, dict)
                ]
                result = sorted(orders.values(), key=lambda order: float(order.get("createdAt", 0)), reverse=True)
        except (OSError, TypeError, ValueError):
            send_json(self, 500, {"error": "Não foi possível carregar os pedidos e o estoque."})
            return
        send_json(self, 200, {"orders": result, "inventory": inventory})

    def update_stock(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if self.get_admin_session() is None:
            send_json(self, 401, {"error": "Sua sessão expirou. Entre novamente no painel da loja."})
            return
        try:
            value = self.read_json_body(64 * 1024)
            changes = value.get("items")
            with state_lock:
                store = read_store_unlocked()
                if store is None:
                    send_json(self, 404, {"error": "A loja ainda não foi sincronizada com o servidor."})
                    return
                apply_stock_changes_unlocked(store, changes)
                write_json_atomic(STORE_FILE, store)
        except ValueError as error:
            send_json(self, 409 if "mudou" in str(error) else 400, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível salvar as alterações de estoque."})
            return
        send_json(self, 200, {"success": True})

    def create_manual_order(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if too_many_requests(self.client_address[0], "manual-order", 8, 60):
            send_json(self, 429, {"error": "Muitos pedidos em pouco tempo. Aguarde um minuto e tente novamente."})
            return
        try:
            value = self.read_json_body(128 * 1024)
            customer = validate_order_customer(value.get("customer"), value.get("shipping"))
            items = value.get("items")
            if not isinstance(items, list):
                raise ValueError("O carrinho está vazio ou não está válido.")
            order_id = f"PC{uuid.uuid4().hex[:20].upper()}"
            order = reserve_order(order_id, customer, items, "manual_pix")
        except ValueError as error:
            send_json(self, 400, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível reservar o estoque e registrar o pedido."})
            return
        send_json(self, 201, {
            "success": True,
            "orderId": order["id"],
            "amountCents": order["amountCents"],
            "expiresAt": order["expiresAt"],
            "items": order["items"]
        })

    def report_order_payment(self, order_id):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        try:
            with state_lock:
                store = read_store_unlocked()
                orders = load_orders_unlocked()
                order = orders.get(order_id)
                if not isinstance(order, dict):
                    raise KeyError("Pedido não encontrado.")
                if store is not None and expire_manual_orders_unlocked(store, orders, time.time()):
                    save_orders_and_store_unlocked(orders, store)
                    order = orders.get(order_id)
                if order.get("paymentMethod") != "manual_pix" or order.get("status") != "AWAITING_PAYMENT":
                    raise ValueError("Este pedido não está aguardando confirmação de pagamento.")
                order["status"] = "PAYMENT_REPORTED"
                order["paymentStatus"] = "REPORTED"
                order["updatedAt"] = time.time()
                append_order_event(order, "PAYMENT_REPORTED", order["updatedAt"])
                write_json_atomic(ORDERS_FILE, orders)
        except KeyError as error:
            send_json(self, 404, {"error": str(error).strip("'")})
            return
        except ValueError as error:
            send_json(self, 409, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível atualizar o pedido."})
            return
        send_json(self, 200, {"success": True, "status": "PAYMENT_REPORTED"})

    def cancel_manual_order(self, order_id):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        try:
            update_order_action(order_id, "cancel")
        except KeyError as error:
            send_json(self, 404, {"error": str(error).strip("'")})
            return
        except ValueError as error:
            send_json(self, 409, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível cancelar o pedido e liberar o estoque."})
            return
        send_json(self, 200, {"success": True})

    def update_admin_order(self, order_id):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if self.get_admin_session() is None:
            send_json(self, 401, {"error": "Sua sessão expirou. Entre novamente no painel da loja."})
            return
        try:
            value = self.read_json_body(16 * 1024)
            action = value.get("action")
            allow_gateway_cancel = action == "cancel_gateway_review"
            if allow_gateway_cancel:
                action = "cancel"
            order = update_order_action(order_id, action, allow_gateway_cancel=allow_gateway_cancel)
        except KeyError as error:
            send_json(self, 404, {"error": str(error).strip("'")})
            return
        except ValueError as error:
            send_json(self, 409, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível atualizar o pedido."})
            return
        send_json(self, 200, {"success": True, "order": order})

    def create_blackcat_payment(self):
        if not self.has_same_origin():
            send_json(self, 403, {"error": "Acesso permitido somente pelo site da loja."})
            return
        if too_many_requests(self.client_address[0], "create", 8, 60):
            send_json(self, 429, {"error": "Muitas tentativas. Aguarde um minuto e tente novamente."})
            return
        api_key = os.environ.get("BLACKCAT_API_KEY", "").strip()
        if not api_key:
            send_json(self, 503, {"error": "O gateway não está configurado no servidor."})
            return
        store = read_store()
        if store is None or (store.get("pagamento") or {}).get("metodo") != "gateway":
            send_json(self, 409, {"error": "A loja ainda não ativou o gateway no painel sincronizado."})
            return
        try:
            request_data = self.read_json_body(128 * 1024)
            customer_data = request_data.get("customer")
            shipping_data = request_data.get("shipping")
            requested_items = request_data.get("items")
            customer = validate_order_customer(customer_data, shipping_data)
            if not customer["email"]:
                raise ValueError("Informe um e-mail válido.")
            if not isinstance(requested_items, list) or not requested_items or len(requested_items) > 50:
                raise ValueError("O carrinho está vazio ou contém itens demais.")
            document = re.sub(r"\D", "", str((customer_data.get("document") or {}).get("number", "")))
            if not valid_cpf(document):
                raise ValueError("Informe um CPF válido para o pagamento.")
            order_id = f"PC{uuid.uuid4().hex[:20].upper()}"
            order = reserve_order(order_id, customer, requested_items, "blackcat")
        except ValueError as error:
            send_json(self, 400, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível reservar o estoque e registrar o pedido."})
            return
        name = customer["name"]
        email = customer["email"]
        phone = customer["phone"]
        address = {"name": name, **customer["shipping"]}
        total_cents = order["amountCents"]
        sale_items = [
            {
                "title": item["name"],
                "unitPrice": item["unitPriceCents"],
                "quantity": item["quantity"],
                "tangible": True
            }
            for item in order["items"]
        ]
        external_ref = order_id
        sale_payload = {
            "amount": total_cents,
            "currency": "BRL",
            "paymentMethod": "pix",
            "items": sale_items,
            "customer": {
                "name": name,
                "email": email,
                "phone": phone,
                "document": {"number": document, "type": "cpf"}
            },
            "shipping": address,
            "pix": {"expiresInDays": 1},
            "externalRef": external_ref
        }
        try:
            status, response = call_blackcat("/sales/create-sale", "POST", api_key, sale_payload)
        except RuntimeError:
            try:
                mark_gateway_review(order_id)
            except OSError:
                send_json(self, 500, {"error": "Não foi possível confirmar a resposta do gateway nem atualizar o pedido. Verifique o painel e a BlackCat antes de repetir a cobrança."})
                return
            send_json(self, 502, {
                "error": "A resposta da BlackCat não foi confirmada. O estoque ficou reservado; confira o pedido no painel antes de tentar novamente.",
                "orderId": order_id
            })
            return
        transaction = response.get("data") if isinstance(response, dict) else None
        payment_data = transaction.get("paymentData") if isinstance(transaction, dict) else None
        resposta_inconclusiva = status not in (200, 201) and not 400 <= status < 500
        resposta_sem_cobranca = status in (200, 201) and (not isinstance(transaction, dict) or not transaction.get("transactionId"))
        if resposta_inconclusiva or resposta_sem_cobranca:
            transaction_id = transaction.get("transactionId") if isinstance(transaction, dict) else None
            try:
                mark_gateway_review(order_id, transaction_id)
            except OSError:
                send_json(self, 500, {
                    "error": "A resposta da BlackCat é inconclusiva e o pedido não pôde ser atualizado. Confira o pedido e o gateway antes de tentar novamente.",
                    "orderId": order_id
                })
                return
            send_json(self, 502, {
                "error": "A resposta da BlackCat é inconclusiva. O estoque ficou reservado; confira este pedido no painel antes de tentar novamente.",
                "orderId": order_id,
                "transactionId": transaction_id or ""
            })
            return
        if status not in (200, 201) or not isinstance(transaction, dict) or not transaction.get("transactionId"):
            message = response.get("message") if isinstance(response, dict) else None
            try:
                update_order_action(order_id, "cancel", allow_gateway_cancel=True)
            except (OSError, ValueError, KeyError):
                send_json(self, 500, {"error": "A BlackCat recusou a cobrança e o servidor não conseguiu liberar a reserva de estoque. Revise o pedido no painel."})
                return
            send_json(self, 502, {"error": message or "A BlackCat não criou a cobrança. Confira a configuração do gateway."})
            return
        transaction_id = str(transaction["transactionId"])
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", transaction_id):
            try:
                mark_gateway_review(order_id)
            except OSError:
                send_json(self, 500, {
                    "error": "A BlackCat retornou um identificador inválido e o pedido não pôde ser atualizado. Confira o estoque e o painel antes de repetir a cobrança.",
                    "orderId": order_id
                })
                return
            send_json(self, 502, {
                "error": "A BlackCat retornou um identificador inválido. O pedido ficou reservado para conferência; entre em contato com a loja.",
                "orderId": order_id
            })
            return
        if not isinstance(payment_data, dict):
            payment_data = {}
        try:
            attach_gateway_transaction(order_id, transaction_id)
        except OSError:
            try:
                mark_gateway_review(order_id, transaction_id)
            except OSError:
                send_json(self, 500, {
                    "error": "A cobrança foi criada, mas o pedido não pôde ser atualizado. Confira a BlackCat e o estoque antes de repetir a cobrança.",
                    "orderId": order_id,
                    "transactionId": transaction_id
                })
                return
            send_json(self, 500, {
                "error": "A cobrança foi criada, mas o pedido ficou reservado para conferência. Confira a BlackCat antes de pagar novamente.",
                "orderId": order_id,
                "transactionId": transaction_id
            })
            return
        transaction_record = {
            "amount": total_cents,
            "externalRef": external_ref,
            "createdAt": int(time.time()),
            "orderId": order_id
        }
        try:
            save_transaction(transaction_id, transaction_record)
        except OSError:
            print("Cobrança vinculada ao pedido; índice de transações indisponível, o histórico será consultado.")
        send_json(self, 201, {
            "success": True,
            "data": {
                "orderId": order_id,
                "transactionId": transaction_id,
                "status": transaction.get("status", "PENDING"),
                "amount": total_cents,
                "items": order["items"],
                "invoiceUrl": transaction.get("invoiceUrl"),
                "paymentData": {
                    "qrCode": payment_data.get("qrCode"),
                    "qrCodeBase64": payment_data.get("qrCodeBase64"),
                    "copyPaste": payment_data.get("copyPaste"),
                    "expiresAt": payment_data.get("expiresAt")
                }
            }
        })

    def get_payment_status(self, transaction_id):
        api_key = os.environ.get("BLACKCAT_API_KEY", "").strip()
        if not api_key:
            send_json(self, 503, {"error": "O gateway não está configurado no servidor."})
            return
        if too_many_requests(self.client_address[0], "status", 60, 60):
            send_json(self, 429, {"error": "Muitas consultas. Aguarde e tente novamente."})
            return
        transaction = load_transactions().get(transaction_id)
        if transaction is None:
            try:
                with state_lock:
                    order = next(
                        (
                            item for item in load_orders_unlocked().values()
                            if isinstance(item, dict) and item.get("transactionId") == transaction_id
                        ),
                        None
                    )
            except OSError:
                send_json(self, 500, {"error": "Não foi possível consultar o histórico do pedido."})
                return
            if order is None:
                send_json(self, 404, {"error": "Não foi encontrado um pedido correspondente a esta cobrança."})
                return
            transaction = {"amount": order.get("amountCents")}
        try:
            status, response = call_blackcat(
                f"/sales/{unquote(transaction_id)}/status",
                "GET",
                api_key
            )
        except RuntimeError:
            send_json(self, 502, {"error": "Não foi possível consultar o status na BlackCat."})
            return
        data = response.get("data") if isinstance(response, dict) else None
        if status != 200 or not isinstance(data, dict) or data.get("transactionId") != transaction_id:
            send_json(self, 502, {"error": "A BlackCat não confirmou o status desta cobrança."})
            return
        if data.get("amount") != transaction.get("amount"):
            send_json(self, 502, {"error": "O valor confirmado pelo gateway não corresponde ao pedido."})
            return
        state = data.get("status")
        if state not in ("PENDING", "PAID", "CANCELLED", "REFUNDED"):
            send_json(self, 502, {"error": "A BlackCat retornou um status de pagamento desconhecido."})
            return
        try:
            update_gateway_order(transaction_id, state, data.get("paidAt"))
        except OSError:
            send_json(self, 500, {"error": "O pagamento foi consultado, mas não foi possível atualizar o pedido e seu estoque."})
            return
        send_json(self, 200, {
            "success": True,
            "data": {
                "transactionId": transaction_id,
                "status": state,
                "amount": data["amount"],
                "paidAt": data.get("paidAt")
            }
        })


if __name__ == "__main__":
    load_env_file()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), lambda *args, **kwargs: StoreHandler(*args, directory=str(ROOT), **kwargs))
    print(f"Loja e API disponíveis em http://{host}:{port}")
    print("Configure BLACKCAT_API_KEY e ADMIN_SYNC_PASSWORD no ambiente do servidor para ativar a integração.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()
