import hmac
import json
import os
import re
import threading
import time
import uuid
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
BLACKCAT_API = "https://api.blackcatoficial.com/api"
MAX_BODY_SIZE = 8 * 1024 * 1024
state_lock = threading.Lock()
rate_lock = threading.Lock()
rate_limits = {}


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


def send_json(handler, status, value):
    body = json.dumps(value, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def safe_store(value):
    public = dict(value)
    public.pop("senhaAdmin", None)
    payment = dict(public.get("pagamento") or {})
    gateway = dict(payment.get("gateway") or {})
    for key in list(gateway):
        normalized_key = key.lower().replace("_", "")
        if any(word in normalized_key for word in ("private", "privad", "secret", "segred", "token", "apikey", "chaveapi")):
            gateway.pop(key, None)
    payment["gateway"] = gateway
    public["pagamento"] = payment
    return public


def read_store():
    try:
        with state_lock:
            return json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except (OSError, json.JSONDecodeError):
        return None


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
        if path == "/api/admin/store":
            self.save_store()
            return
        if path == "/api/payments/blackcat":
            self.create_blackcat_payment()
            return
        send_json(self, 404, {"error": "Não encontrado."})

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
        admin_password = os.environ.get("ADMIN_SYNC_PASSWORD", "")
        provided_password = self.headers.get("X-Admin-Password", "")
        if not admin_password or not hmac.compare_digest(provided_password, admin_password):
            send_json(self, 401, {"error": "Senha de sincronização inválida ou não configurada no servidor."})
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
            write_json_atomic(STORE_FILE, safe_store(value))
        except ValueError as error:
            send_json(self, 400, {"error": str(error)})
            return
        except OSError:
            send_json(self, 500, {"error": "Não foi possível gravar as configurações no servidor."})
            return
        send_json(self, 200, {"success": True})

    def create_blackcat_payment(self):
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
            customer = request_data.get("customer")
            shipping = request_data.get("shipping")
            requested_items = request_data.get("items")
            if not isinstance(customer, dict) or not isinstance(shipping, dict):
                raise ValueError("Preencha os dados do cliente e o endereço de envio.")
            if not isinstance(requested_items, list) or not requested_items or len(requested_items) > 50:
                raise ValueError("O carrinho está vazio ou contém itens demais.")
            name = required_text(customer.get("name"), "nome", 120)
            email = required_text(customer.get("email"), "e-mail", 254)
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
                raise ValueError("Informe um e-mail válido.")
            phone = re.sub(r"\D", "", str(customer.get("phone", "")))
            if not 10 <= len(phone) <= 13:
                raise ValueError("Informe um telefone válido com DDD.")
            document = re.sub(r"\D", "", str((customer.get("document") or {}).get("number", "")))
            if len(document) != 11:
                raise ValueError("Informe um CPF válido para o pagamento.")
            address = {
                "name": name,
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
            products = {str(product.get("id")): product for product in store["produtos"] if isinstance(product, dict)}
            sale_items = []
            total_cents = 0
            for requested in requested_items:
                product_id = str(requested.get("id", ""))
                product = products.get(product_id)
                if product is None:
                    raise ValueError("Um produto do carrinho não está no catálogo atual. Atualize a página e tente novamente.")
                try:
                    quantity = int(requested.get("quantity", 0))
                    stock = int(product.get("estoque", 0))
                except (TypeError, ValueError):
                    raise ValueError("A quantidade de um produto não é válida.") from None
                if quantity < 1 or quantity > stock:
                    raise ValueError(f"Estoque insuficiente para {product.get('nome', 'um produto')}.")
                unit_price = money_in_cents(product.get("preco"))
                total_cents += unit_price * quantity
                sale_items.append({
                    "title": required_text(product.get("nome"), "nome do produto", 200),
                    "unitPrice": unit_price,
                    "quantity": quantity,
                    "tangible": True
                })
            if total_cents < 1:
                raise ValueError("O total do pedido não é válido.")
        except ValueError as error:
            send_json(self, 400, {"error": str(error)})
            return
        external_ref = f"MN{uuid.uuid4().hex[:24].upper()}"
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
            send_json(self, 502, {"error": "Não foi possível contactar a BlackCat. Nenhum resultado de pagamento foi confirmado."})
            return
        transaction = response.get("data") if isinstance(response, dict) else None
        payment_data = transaction.get("paymentData") if isinstance(transaction, dict) else None
        if status not in (200, 201) or not isinstance(transaction, dict) or not transaction.get("transactionId"):
            message = response.get("message") if isinstance(response, dict) else None
            send_json(self, 502, {"error": message or "A BlackCat não criou a cobrança. Confira a configuração do gateway."})
            return
        transaction_id = str(transaction["transactionId"])
        if not isinstance(payment_data, dict):
            payment_data = {}
        transaction_record = {
            "amount": total_cents,
            "externalRef": external_ref,
            "createdAt": int(time.time())
        }
        try:
            save_transaction(transaction_id, transaction_record)
        except OSError:
            send_json(self, 500, {"error": "A cobrança foi criada, mas o servidor não conseguiu registrar a referência do pedido. Entre em contato com a loja antes de tentar pagar novamente."})
            return
        send_json(self, 201, {
            "success": True,
            "data": {
                "transactionId": transaction_id,
                "status": transaction.get("status", "PENDING"),
                "amount": total_cents,
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
            send_json(self, 404, {"error": "Não foi encontrado um pedido correspondente a esta cobrança."})
            return
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
