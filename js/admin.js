const STORAGE_LOJA = "mineironet_loja";

let estado = window.carregarLojaConfigurada();
let pedidosAdmin = [];
let estoqueAdmin = [];
const estoqueBase = new Map();

function salvar() {
  localStorage.setItem(STORAGE_LOJA, JSON.stringify(estado));
}

function escaparHTML(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function novoIdProduto() {
  let id = `p${Date.now()}`;
  while (estado.produtos.some((produto) => produto.id === id)) {
    id = `p${Number(id.slice(1)) + 1}`;
  }
  return id;
}

function atualizarContagemProdutos() {
  const contador = document.getElementById("contagemProdutos");
  if (contador) {
    contador.textContent = `${estado.produtos.length} ${estado.produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}`;
  }
}

function fileParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(`Não foi possível ler o arquivo ${file.name}.`));
    reader.onabort = () => reject(new Error(`A leitura do arquivo ${file.name} foi cancelada.`));
    reader.readAsDataURL(file);
  });
}

function renderLogin(mensagem = "") {
  document.getElementById("app").innerHTML = `
    <div class="login">
      <h1>Painel da loja</h1>
      <p>Acesso exclusivo ao proprietário da loja.</p>
      <form id="loginForm">
        <label for="senha">Senha do administrador</label>
        <input type="password" id="senha" autocomplete="current-password" required>
        <button class="btn btn-verde" id="entrar" type="submit">Entrar</button>
      </form>
      <p id="loginStatus" role="status">${escaparHTML(mensagem)}</p>
    </div>`;
  document.getElementById("loginForm").onsubmit = async (event) => {
    event.preventDefault();
    const botao = document.getElementById("entrar");
    const status = document.getElementById("loginStatus");
    botao.disabled = true;
    status.textContent = "Verificando acesso...";
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: document.getElementById("senha").value })
      });
      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
      estado = await window.carregarLojaRemota();
      renderPainel();
    } catch (erro) {
      status.textContent = `Não foi possível entrar: ${erro.message}`;
      botao.disabled = false;
    }
  };
}

function renderPainel() {
  estoqueBase.clear();
  estado.produtos.forEach((produto) => estoqueBase.set(String(produto.id), Number(produto.estoque) || 0));
  document.getElementById("app").innerHTML = `
    <div class="painel">
      <div class="topo">
        <h1>Editar loja</h1>
        <div>
          <a class="btn btn-ghost" href="index.html">Ver loja</a>
          <button class="btn btn-ghost" id="sairPainel" type="button">Sair</button>
          <button class="btn btn-ghost" id="resetar">Restaurar padrão</button>
        </div>
      </div>
      <p class="aviso">O catálogo inicial usa imagens ilustrativas e preços de referência. Confirme os preços e o estoque reais antes de vender. Envie JPG, PNG ou WebP para logo, banner e produtos; você pode cadastrar várias fotos por produto.</p>

      <section class="admin-orders" aria-labelledby="ordersTitle">
        <div class="admin-section-heading">
          <div><h2 id="ordersTitle">Pedidos, vendas e estoque</h2><p>Pedidos e reservas sincronizados com o servidor.</p></div>
          <button class="btn btn-ghost" id="atualizarPedidos" type="button">Atualizar painel</button>
        </div>
        <div id="orderMetrics" class="order-metrics" aria-live="polite"></div>
        <div class="orders-toolbar">
          <label for="filtroStatusPedido">Status
            <select id="filtroStatusPedido">
              <option value="">Todos os pedidos</option>
              <option value="AWAITING_PAYMENT">Aguardando pagamento</option>
              <option value="PAYMENT_REPORTED">Pagamento informado</option>
              <option value="GATEWAY_REVIEW">Revisão do gateway</option>
              <option value="PAID">Pago</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="REFUNDED">Estornado</option>
            </select>
          </label>
          <label for="buscarPedido">Buscar pedido
            <input id="buscarPedido" type="search" placeholder="Número, cliente ou produto">
          </label>
        </div>
        <p id="ordersStatus" class="orders-status" role="status">Carregando pedidos...</p>
        <div id="listaPedidos" class="order-list"></div>
        <div class="inventory-heading"><h3>Estoque rápido</h3><p>As alterações usam o estoque atual do servidor para evitar sobrescrever vendas simultâneas.</p></div>
        <div id="listaEstoque" class="inventory-list"></div>
      </section>

      <h2>Identidade e fotos da loja</h2>
      <div class="grid2">
        <div>
          <label>Nome da loja<input id="loja_nome" value="${estado.loja.nome}"></label>
          <label>Razão social<input id="loja_razaoSocial" value="${estado.loja.razaoSocial}"></label>
          <label>CNPJ<input id="loja_cnpj" inputmode="numeric" value="${escaparHTML(estado.loja.cnpj || "")}"></label>
          <label>Slogan<input id="loja_slogan" value="${estado.loja.slogan}"></label>
          <label>WhatsApp (55DDDNUMERO)<input id="loja_whatsapp" value="${estado.loja.whatsapp}"></label>
          <label>Telefone<input id="loja_telefone" value="${estado.loja.telefone}"></label>
          <label>E-mail<input id="loja_email" value="${estado.loja.email}"></label>
          <label>Endereço comercial<textarea id="loja_endereco" rows="5">${escaparHTML(estado.loja.endereco)}</textarea></label>
          <label>Horário<input id="loja_horario" value="${estado.loja.horario}"></label>
        </div>
        <div>
          <p>Logo atual</p>
          <img class="preview" id="prevLogo" src="${estado.loja.logo}" alt="logo">
          <label>Arquivo do logo<input type="file" accept="image/*" id="fileLogo"></label>
          <label>Caminho/URL do logo<input id="loja_logo" value="${estado.loja.logo.startsWith("data:") ? "" : estado.loja.logo}"></label>
          <p>Banner atual</p>
          <img class="preview" id="prevBanner" src="${estado.loja.banner}" alt="banner">
          <label>Arquivo do banner<input type="file" accept="image/*" id="fileBanner"></label>
          <label>Caminho/URL do banner<input id="loja_banner" value="${estado.loja.banner.startsWith("data:") ? "" : estado.loja.banner}"></label>
        </div>
      </div>

      <h2>Forma de pagamento do site</h2>
      <p>Escolha como quer receber. PIX pode gerar QR Code no checkout. Gateway só deve ser ativado depois de configurar a integração segura no servidor.</p>
      <div class="payment-method-options" role="radiogroup" aria-label="Forma de pagamento">
        <label class="payment-method-option">
          <input type="radio" name="metodoPagamento" value="pix" ${estado.pagamento.metodo === "pix" ? "checked" : ""}>
          <span><strong>PIX</strong><small>QR Code e código Copia e Cola gerados para cada pedido.</small></span>
        </label>
        <label class="payment-method-option">
          <input type="radio" name="metodoPagamento" value="gateway" ${estado.pagamento.metodo === "gateway" ? "checked" : ""}>
          <span><strong>Gateway de pagamento</strong><small>Checkout automático via API, depois de configurado no servidor.</small></span>
        </label>
      </div>

      <div id="pixSettings">
      <h2>Chave PIX e QR Code</h2>
      <p class="aviso">Cadastre uma chave PIX válida. Ela será usada para gerar o QR Code da cobrança no checkout. Confira os dados com cuidado antes de receber pagamentos.</p>
      <div class="grid2">
        <label>Tipo de chave PIX
          <select id="pix_tipo">
            ${["CPF", "CNPJ", "Telefone", "E-mail", "Aleatória"].map((tipo) => `<option value="${tipo}" ${String(estado.pix.tipo).toLowerCase() === tipo.toLowerCase() ? "selected" : ""}>${tipo}</option>`).join("")}
          </select>
        </label>
        <label>Chave PIX<input id="pix_chave" value="${esc(estado.pix.chave)}" autocomplete="off" placeholder="Informe a chave cadastrada no seu banco"></label>
        <label>Nome do recebedor<input id="pix_nomeRecebedor" value="${esc(estado.pix.nomeRecebedor)}" maxlength="25"></label>
        <label>Cidade do recebedor<input id="pix_cidade" value="${esc(estado.pix.cidade)}" maxlength="15"></label>
      </div>
      <div class="pix-admin-preview">
        <div>
          <h3>Prévia do QR Code</h3>
          <p>Gere uma prévia do QR PIX estático da chave informada. Este QR de prévia não define valor; o QR de cada pedido mostrará o total no checkout.</p>
          <button class="btn btn-ghost" id="gerarPixPreview" type="button">Gerar prévia do QR Code</button>
          <p id="pixPreviewStatus" class="pix-preview-status" role="status"></p>
        </div>
        <div class="pix-preview-image" id="pixPreviewImage" hidden></div>
      </div>
      </div>

      <div id="gatewaySettings" hidden>
        <h2>Gateway BlackCat</h2>
        <div class="grid2">
          <label>Provedor<input id="gateway_provedor" value="${esc(estado.pagamento.gateway.provedor || "BlackCat")}" readonly></label>
        </div>
        <div class="aviso gateway-security-note">
          <strong>Chave privada: configure somente no servidor</strong>
          <p>Adicione a chave API da BlackCat à variável <code>BLACKCAT_API_KEY</code> no arquivo local <code>.env</code> do servidor. Nunca cole a chave neste painel. Este site usa a chave no servidor para criar cobranças PIX e consultar o status.</p>
          <p>O campo “código de split” não é enviado: ele não aparece no endpoint de criação de venda da documentação BlackCat. Confirme com o suporte qual integração de split é aceita antes de dividir valores.</p>
        </div>
      </div>

      <div class="products-heading">
        <div>
          <h2>Produtos</h2>
          <p id="contagemProdutos" class="products-count"></p>
        </div>
        <button class="btn btn-ouro" id="novoProduto" type="button">＋ Adicionar produto</button>
      </div>
      <p class="aviso">Você pode cadastrar quantos produtos quiser; o painel não impõe um limite fixo. O navegador tem um limite de armazenamento, principalmente para fotos enviadas. Para catálogos grandes, prefira imagens hospedadas no site e informe o caminho ou URL.</p>
      <div class="products-tools">
        <label for="buscarProduto">Localizar produto
          <input id="buscarProduto" type="search" placeholder="Busque por nome ou categoria">
        </label>
        <p class="products-help">Abra um produto para editar. Preço, estoque e imagem são conferidos antes de salvar.</p>
      </div>
      <div id="listaProdutos"></div>
      <div class="save-bar">
        <span>Salve as alterações antes de sair do painel.</span>
        <button class="btn btn-verde" id="salvarTudo" type="button">Salvar alterações</button>
      </div>
    </div>`;

  document.getElementById("fileLogo").onchange = async (e) => {
    if (!e.target.files[0]) return;
    estado.loja.logo = await fileParaDataUrl(e.target.files[0]);
    document.getElementById("prevLogo").src = estado.loja.logo;
  };
  document.getElementById("fileBanner").onchange = async (e) => {
    if (!e.target.files[0]) return;
    estado.loja.banner = await fileParaDataUrl(e.target.files[0]);
    document.getElementById("prevBanner").src = estado.loja.banner;
  };
  document.getElementById("sairPainel").onclick = async () => {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
      renderLogin("Você saiu do painel.");
    } catch (erro) {
      alert(`Não foi possível encerrar a sessão: ${erro.message}`);
    }
  };
  document.getElementById("novoProduto").onclick = () => {
    lerCamposLoja();
    estado.produtos.unshift({
      id: novoIdProduto(),
      nome: "Novo produto",
      categoria: estado.categorias.find((categoria) => categoria !== "Todos") || estado.categorias[0],
      preco: 0,
      antigo: 0,
      estoque: 0,
      destaque: false,
      imagem: "",
      imagens: [],
      descricao: "Descreva o produto."
    });
    renderProdutos();
    const novoNome = document.querySelector('[data-p="0"][data-k="nome"]');
    novoNome?.focus();
    novoNome?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  document.getElementById("salvarTudo").onclick = async () => {
    lerCamposLoja();
    const produtoInvalido = estado.produtos.find((produto) => (
      !String(produto.nome || "").trim()
      || !String(produto.categoria || "").trim()
      || !Number.isFinite(Number(produto.preco))
      || Number(produto.preco) <= 0
      || !Number.isFinite(Number(produto.antigo || 0))
      || Number(produto.antigo || 0) < 0
      || !Number.isInteger(Number(produto.estoque))
      || Number(produto.estoque) < 0
      || !String(produto.imagem || "").trim()
      || !estado.categorias.includes(produto.categoria)
    ));
    if (produtoInvalido) {
      const indice = estado.produtos.indexOf(produtoInvalido);
      const card = document.querySelector(`[data-product-card="${indice}"]`);
      if (card) {
        card.open = true;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.querySelector(`[data-p="${indice}"][data-k="nome"]`)?.focus();
      }
      alert(`Confira o produto "${produtoInvalido.nome || "sem nome"}": preencha nome, categoria existente, preço maior que zero, preço anterior igual ou maior que zero, estoque inteiro igual ou maior que zero e foto principal.`);
      return;
    }
    if (estado.pagamento.metodo === "pix" && estado.pix.chave && !window.PixBR.validarChave(estado.pix.tipo, estado.pix.chave)) {
      alert("A chave PIX não parece válida para o tipo selecionado. Confira o tipo e a chave antes de salvar.");
      document.getElementById("pix_chave").focus();
      return;
    }
    const stockChanges = estado.produtos.flatMap((produto) => {
      const id = String(produto.id);
      const expectedStock = estoqueBase.get(id);
      const stock = Number(produto.estoque);
      return Number.isInteger(expectedStock) && expectedStock !== stock
        ? [{ id, stock, expectedStock }]
        : [];
    });
    try {
      salvar();
    } catch (erro) {
      const armazenamentoCheio = erro.name === "QuotaExceededError" || erro.name === "NS_ERROR_DOM_QUOTA_REACHED";
      alert(armazenamentoCheio
        ? "O armazenamento do navegador está cheio. Use imagens menores ou URLs/caminhos de fotos hospedadas no site e tente salvar novamente."
        : `Não foi possível salvar as alterações: ${erro.message}`);
      return;
    }
    try {
      const sincronizado = await sincronizarLojaComServidor(stockChanges);
      if (sincronizado === false) {
        alert("As alterações foram salvas neste navegador, mas não no servidor. Para publicar os produtos e ativar pagamentos, execute o servidor da loja e sincronize novamente.");
        return;
      }
      await carregarPedidosAdmin();
    } catch (erro) {
      alert(`As alterações ficaram salvas apenas neste navegador. Não foi possível sincronizar o servidor: ${erro.message}`);
      return;
    }
    alert(estado.pagamento.metodo === "gateway"
      ? "Loja sincronizada com o servidor. O gateway será habilitado quando a chave de API estiver configurada no ambiente seguro do servidor."
      : "Loja atualizada. Abra a vitrine para ver as fotos novas.");
  };
  document.getElementById("gerarPixPreview").onclick = gerarPixPreview;
  document.getElementById("buscarProduto").addEventListener("input", filtrarProdutos);
  document.getElementById("atualizarPedidos").onclick = carregarPedidosAdmin;
  document.getElementById("filtroStatusPedido").addEventListener("change", renderPedidosAdmin);
  document.getElementById("buscarPedido").addEventListener("input", renderPedidosAdmin);
  document.getElementById("listaPedidos").addEventListener("click", agirNoPedido);
  document.getElementById("listaEstoque").addEventListener("click", alterarEstoqueRapido);
  document.querySelectorAll('input[name="metodoPagamento"]').forEach((radio) => {
    radio.addEventListener("change", atualizarConfiguracaoPagamento);
  });
  atualizarConfiguracaoPagamento();
  document.getElementById("resetar").onclick = () => {
    if (!confirm("Voltar para os produtos e fotos originais?")) return;
    localStorage.removeItem(STORAGE_LOJA);
    estado = structuredClone(window.LOJA_PADRAO);
    renderPainel();
  };
  renderProdutos();
  carregarPedidosAdmin();
}

const rotulosStatusPedido = {
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_REPORTED: "Pagamento informado",
  GATEWAY_REVIEW: "Revisão do gateway",
  PAID: "Pago",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  REFUNDED: "Estornado"
};

function dataPedido(valor) {
  const data = new Date(Number(valor) * 1000);
  return Number.isNaN(data.getTime()) ? "Data indisponível" : data.toLocaleString("pt-BR");
}

function valorPedido(valorCentavos) {
  return dinheiroAdmin(Number(valorCentavos) / 100);
}

async function carregarPedidosAdmin() {
  const status = document.getElementById("ordersStatus");
  if (status) status.textContent = "Atualizando pedidos e estoque...";
  const botao = document.getElementById("atualizarPedidos");
  if (botao) botao.disabled = true;
  try {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const resultado = await response.json();
    if (response.status === 401) {
      renderLogin(resultado.error || "Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
    pedidosAdmin = Array.isArray(resultado.orders) ? resultado.orders : [];
    estoqueAdmin = Array.isArray(resultado.inventory) ? resultado.inventory : [];
    const erroCopiaLocal = sincronizarEstoqueLocal(estoqueAdmin);
    renderResumoPedidos();
    renderPedidosAdmin();
    renderEstoqueAdmin();
    if (status) {
      status.textContent = `${pedidosAdmin.length} pedido(s) carregado(s).${erroCopiaLocal ? ` O servidor está atualizado, mas não foi possível guardar a cópia local: ${erroCopiaLocal}` : ""}`;
    }
  } catch (erro) {
    if (status) status.textContent = `Não foi possível carregar os pedidos: ${erro.message}`;
  } finally {
    if (botao && document.contains(botao)) botao.disabled = false;
  }
}

function sincronizarEstoqueLocal(inventario) {
  inventario.forEach((entrada) => {
    const indice = estado.produtos.findIndex((item) => String(item.id) === String(entrada.id));
    const produto = estado.produtos[indice];
    if (!produto) return;
    const estoque = Number(entrada.stock);
    if (!Number.isInteger(estoque) || estoque < 0) return;
    const input = document.querySelector(`[data-p="${indice}"][data-k="estoque"]`);
    const estoqueAnterior = estoqueBase.get(String(produto.id));
    const valorEditado = Number(input?.value);
    const temAlteracaoPendente = Number.isInteger(estoqueAnterior) && Number.isInteger(valorEditado) && valorEditado !== estoqueAnterior;
    produto.estoque = temAlteracaoPendente ? valorEditado : estoque;
    if (input && !temAlteracaoPendente) input.value = String(estoque);
    const resumo = document.querySelector(`[data-product-card="${indice}"] [data-summary-stock]`);
    if (resumo && !temAlteracaoPendente) resumo.textContent = `${estoque} em estoque`;
    estoqueBase.set(String(produto.id), estoque);
  });
  try {
    salvar();
    return "";
  } catch (erro) {
    console.error("Não foi possível atualizar a cópia local do estoque.", erro);
    return erro.message || "falha de armazenamento";
  }
}

function renderResumoPedidos() {
  const container = document.getElementById("orderMetrics");
  if (!container) return;
  const finalizados = pedidosAdmin.filter((pedido) => ["PAID", "SHIPPED", "DELIVERED"].includes(pedido.status));
  const pendentes = pedidosAdmin.filter((pedido) => ["AWAITING_PAYMENT", "PAYMENT_REPORTED", "GATEWAY_REVIEW"].includes(pedido.status));
  const receita = finalizados.reduce((soma, pedido) => soma + Number(pedido.amountCents || 0), 0);
  const unidadesVendidas = finalizados.reduce(
    (soma, pedido) => soma + (Array.isArray(pedido.items) ? pedido.items.reduce((subtotal, item) => subtotal + Number(item.quantity || 0), 0) : 0),
    0
  );
  container.innerHTML = `
    <article><span>Vendas confirmadas</span><strong>${finalizados.length}</strong><small>${unidadesVendidas} unidade(s) vendida(s)</small></article>
    <article><span>Valor confirmado</span><strong>${valorPedido(receita)}</strong><small>Pedidos pagos, enviados ou entregues</small></article>
    <article><span>Pedidos pendentes</span><strong>${pendentes.length}</strong><small>Inclui reservas aguardando ação</small></article>
    <article><span>Pedidos registrados</span><strong>${pedidosAdmin.length}</strong><small>Histórico central da loja</small></article>`;
}

function renderPedidosAdmin() {
  const container = document.getElementById("listaPedidos");
  if (!container) return;
  const filtro = document.getElementById("filtroStatusPedido").value;
  const termo = document.getElementById("buscarPedido").value.trim().toLocaleLowerCase("pt-BR");
  const filtrados = pedidosAdmin.filter((pedido) => {
    if (filtro && pedido.status !== filtro) return false;
    const palavras = [
      pedido.id,
      pedido.customer?.name,
      pedido.customer?.email,
      pedido.customer?.phone,
      ...(pedido.items || []).map((item) => item.name)
    ].join(" ").toLocaleLowerCase("pt-BR");
    return palavras.includes(termo);
  });
  if (!filtrados.length) {
    container.innerHTML = '<p class="orders-empty">Nenhum pedido corresponde ao filtro.</p>';
    return;
  }
  container.innerHTML = filtrados.map((pedido) => {
    const customer = pedido.customer || {};
    const shipping = customer.shipping || {};
    const itens = Array.isArray(pedido.items) ? pedido.items : [];
    const statusClass = String(pedido.status || "").toLowerCase().replace(/[^a-z_]/g, "");
    const endereco = [shipping.street, shipping.number, shipping.complement, shipping.neighborhood, shipping.city, shipping.state, shipping.zipCode]
      .filter(Boolean).join(", ");
    const reservaEstoque = pedido.status === "AWAITING_PAYMENT" && pedido.paymentMethod === "manual_pix"
      ? `Estoque reservado até ${dataPedido(pedido.expiresAt)}`
      : pedido.status === "PAYMENT_REPORTED"
        ? "Reserva mantida enquanto a loja confere o pagamento"
        : pedido.status === "EXPIRED" || pedido.status === "CANCELLED"
          ? "Reserva de estoque liberada"
          : ["PAID", "SHIPPED", "DELIVERED"].includes(pedido.status)
            ? "Unidades baixadas do estoque"
            : pedido.inventoryReserved
              ? "Estoque reservado durante a cobrança"
              : "";
    const acoes = [];
    if (["AWAITING_PAYMENT", "PAYMENT_REPORTED"].includes(pedido.status) && pedido.paymentMethod === "manual_pix") {
      acoes.push('<button class="btn btn-small btn-confirm" data-order-action="confirm_payment" type="button">Confirmar após conferir</button>');
      acoes.push('<button class="btn btn-small btn-cancel" data-order-action="cancel" type="button">Cancelar e liberar estoque</button>');
    }
    if (pedido.status === "EXPIRED" && pedido.paymentMethod === "manual_pix") {
      acoes.push('<button class="btn btn-small btn-confirm" data-order-action="confirm_payment" type="button">Confirmar pagamento tardio</button>');
    }
    if (pedido.status === "GATEWAY_REVIEW") {
      if (pedido.transactionId) acoes.push('<button class="btn btn-small" data-order-action="check_gateway" type="button">Consultar gateway</button>');
      acoes.push('<button class="btn btn-small btn-confirm" data-order-action="confirm_payment" type="button">Confirmar após conferência</button>');
      acoes.push('<button class="btn btn-small btn-cancel" data-order-action="cancel_gateway_review" type="button">Cancelar e liberar estoque</button>');
    } else if (pedido.paymentMethod === "blackcat" && pedido.status === "AWAITING_PAYMENT") {
      acoes.push('<button class="btn btn-small" data-order-action="check_gateway" type="button">Consultar gateway</button>');
    }
    if (pedido.status === "PAID") acoes.push('<button class="btn btn-small btn-confirm" data-order-action="mark_shipped" type="button">Marcar como enviado</button>');
    if (pedido.status === "SHIPPED") acoes.push('<button class="btn btn-small btn-confirm" data-order-action="mark_delivered" type="button">Marcar como entregue</button>');
    const historico = Array.isArray(pedido.history) ? pedido.history : [];
    return `
      <article class="order-card">
        <header class="order-card-heading">
          <div><strong>Pedido ${esc(pedido.id)}</strong><small>${dataPedido(pedido.createdAt)}</small></div>
          <span class="order-status status-${statusClass}">${esc(rotulosStatusPedido[pedido.status] || pedido.status || "Status indisponível")}</span>
        </header>
        <div class="order-card-grid">
          <section><h4>Cliente e entrega</h4>
            <p><strong>${esc(customer.name || "Sem nome")}</strong></p>
            <p>${esc(customer.phone || "Sem telefone")}${customer.email ? ` · ${esc(customer.email)}` : ""}</p>
            <p>${esc(endereco || "Endereço indisponível")}</p>
          </section>
          <section><h4>Pagamento</h4>
            <p>${pedido.paymentMethod === "blackcat" ? "BlackCat" : "PIX manual"} · ${esc(pedido.paymentStatus || "PENDING")}</p>
            ${pedido.transactionId ? `<p>Transação: ${esc(pedido.transactionId)}</p>` : ""}
            ${reservaEstoque ? `<p>${esc(reservaEstoque)}</p>` : ""}
            <p class="order-total">${valorPedido(pedido.amountCents)}</p>
          </section>
        </div>
        <div class="order-items">
          <h4>Produtos</h4>
          ${itens.map((item) => `<p>${Number(item.quantity) || 0} × ${esc(item.name || "Produto")} <span>${valorPedido(item.lineTotalCents)}</span></p>`).join("")}
        </div>
        <details class="order-history"><summary>Histórico do pedido (${historico.length})</summary>
          ${historico.length ? historico.map((evento) => `<p>${esc(rotulosStatusPedido[evento.event] || evento.event)} · ${dataPedido(evento.at)}</p>`).join("") : "<p>Sem eventos registrados.</p>"}
        </details>
        ${acoes.length ? `<div class="order-actions" data-order-id="${esc(pedido.id)}">${acoes.join("")}</div>` : ""}
      </article>`;
  }).join("");
}

function renderEstoqueAdmin() {
  const container = document.getElementById("listaEstoque");
  if (!container) return;
  const vendidos = new Map();
  pedidosAdmin.filter((pedido) => ["PAID", "SHIPPED", "DELIVERED"].includes(pedido.status)).forEach((pedido) => {
    (pedido.items || []).forEach((item) => {
      const id = String(item.productId);
      vendidos.set(id, (vendidos.get(id) || 0) + Number(item.quantity || 0));
    });
  });
  const produtos = estado.produtos.slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
  if (!produtos.length) {
    container.innerHTML = '<p class="orders-empty">Não há produtos cadastrados.</p>';
    return;
  }
  container.innerHTML = produtos.map((produto) => {
    const estoque = Number(produto.estoque) || 0;
    return `<div class="inventory-row">
      <div><strong>${esc(produto.nome)}</strong><small>${Number(vendidos.get(String(produto.id)) || 0)} unidade(s) vendida(s)</small></div>
      <label>Estoque<input type="number" min="0" step="1" value="${estoque}" data-stock-input="${esc(produto.id)}" aria-label="Novo estoque de ${esc(produto.nome)}"></label>
      <button class="btn btn-small" data-stock-save="${esc(produto.id)}" type="button">Atualizar</button>
    </div>`;
  }).join("");
}

async function agirNoPedido(event) {
  const botao = event.target.closest("[data-order-action]");
  if (!botao) return;
  const order = pedidosAdmin.find((pedido) => pedido.id === botao.closest("[data-order-id]")?.dataset.orderId);
  if (!order) return;
  const action = botao.dataset.orderAction;
  if (action === "check_gateway") {
    if (!order.transactionId) {
      alert("A cobrança não tem um identificador confirmado. Confira o painel da BlackCat antes de agir.");
      return;
    }
    botao.disabled = true;
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(order.transactionId)}`, { cache: "no-store" });
      const resultado = await response.json();
      if (!response.ok || !resultado.success) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
      alert(`Status confirmado pela BlackCat: ${resultado.data.status}.`);
      await carregarPedidosAdmin();
    } catch (erro) {
      alert(`Não foi possível consultar a cobrança: ${erro.message}`);
      botao.disabled = false;
    }
    return;
  }
  const mensagens = {
    confirm_payment: order.status === "EXPIRED"
      ? "Confirme somente após verificar o crédito no extrato. O estoque será reservado novamente e a ação falhará se não houver unidades disponíveis."
      : "Confirme somente depois de conferir o crédito no extrato bancário. O pedido será registrado como venda paga.",
    cancel: "Cancelar este pedido e devolver as unidades reservadas ao estoque?",
    cancel_gateway_review: "Só cancele se confirmou na BlackCat que a cobrança não foi paga. O estoque reservado será liberado.",
    mark_shipped: "Marcar este pedido pago como enviado?",
    mark_delivered: "Marcar este pedido enviado como entregue?"
  };
  if (!confirm(mensagens[action] || "Confirmar esta ação?")) return;
  botao.disabled = true;
  try {
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const resultado = await response.json();
    if (response.status === 401) {
      renderLogin(resultado.error || "Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok || !resultado.success) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
    await carregarPedidosAdmin();
  } catch (erro) {
    alert(`Não foi possível atualizar o pedido: ${erro.message}`);
    botao.disabled = false;
  }
}

async function alterarEstoqueRapido(event) {
  const botao = event.target.closest("[data-stock-save]");
  if (!botao) return;
  const id = botao.dataset.stockSave;
  const input = document.querySelector(`[data-stock-input="${CSS.escape(id)}"]`);
  const stock = Number(input?.value);
  const expectedStock = estoqueBase.get(id);
  if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(expectedStock)) {
    alert("Informe um número inteiro igual ou maior que zero.");
    return;
  }
  if (stock === expectedStock) return;
  botao.disabled = true;
  try {
    const response = await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id, stock, expectedStock }] })
    });
    const resultado = await response.json();
    if (response.status === 401) {
      renderLogin(resultado.error || "Sua sessão expirou. Entre novamente.");
      return;
    }
    if (!response.ok || !resultado.success) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
    estoqueBase.set(id, stock);
    const indice = estado.produtos.findIndex((produto) => String(produto.id) === id);
    if (indice >= 0) {
      estado.produtos[indice].estoque = stock;
      const estoqueInput = document.querySelector(`[data-p="${indice}"][data-k="estoque"]`);
      if (estoqueInput) estoqueInput.value = String(stock);
      const resumo = document.querySelector(`[data-product-card="${indice}"] [data-summary-stock]`);
      if (resumo) resumo.textContent = `${stock} em estoque`;
    }
    await carregarPedidosAdmin();
  } catch (erro) {
    alert(`Não foi possível atualizar o estoque: ${erro.message}`);
    botao.disabled = false;
  }
}

function lerCamposLoja() {
  estado.loja.nome = document.getElementById("loja_nome").value;
  estado.loja.razaoSocial = document.getElementById("loja_razaoSocial").value;
  estado.loja.cnpj = document.getElementById("loja_cnpj").value.trim();
  estado.loja.slogan = document.getElementById("loja_slogan").value;
  estado.loja.whatsapp = document.getElementById("loja_whatsapp").value;
  estado.loja.telefone = document.getElementById("loja_telefone").value;
  estado.loja.email = document.getElementById("loja_email").value;
  estado.loja.endereco = document.getElementById("loja_endereco").value;
  estado.loja.horario = document.getElementById("loja_horario").value;
  const logoPath = document.getElementById("loja_logo").value.trim();
  const bannerPath = document.getElementById("loja_banner").value.trim();
  if (logoPath) estado.loja.logo = logoPath;
  if (bannerPath) estado.loja.banner = bannerPath;
  estado.pix.chave = document.getElementById("pix_chave").value.trim();
  estado.pix.tipo = document.getElementById("pix_tipo").value.trim();
  estado.pix.nomeRecebedor = document.getElementById("pix_nomeRecebedor").value;
  estado.pix.cidade = document.getElementById("pix_cidade").value;
  estado.pagamento.metodo = document.querySelector('input[name="metodoPagamento"]:checked').value;
  estado.pagamento.gateway.provedor = document.getElementById("gateway_provedor").value.trim();
}

async function sincronizarLojaComServidor(stockChanges = []) {
  if (window.location.protocol === "file:") return false;
  let health;
  try {
    health = await fetch("/api/health", { cache: "no-store" });
  } catch {
    return false;
  }
  if (health.status === 404) return false;
  if (!health.ok) throw new Error("A API da loja não está disponível.");
  const response = await fetch("/api/admin/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...estado, stockChanges })
  });
  const resultado = await response.json();
  if (response.status === 401) {
    renderLogin(resultado.error || "Sua sessão expirou. Entre novamente.");
    throw new Error(resultado.error || "Sua sessão expirou. Entre novamente.");
  }
  if (!response.ok) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
  return true;
}

function atualizarConfiguracaoPagamento() {
  const metodo = document.querySelector('input[name="metodoPagamento"]:checked').value;
  document.getElementById("pixSettings").hidden = metodo !== "pix";
  document.getElementById("gatewaySettings").hidden = metodo !== "gateway";
}

function gerarPixPreview() {
  const tipo = document.getElementById("pix_tipo").value;
  const chave = document.getElementById("pix_chave").value.trim();
  const status = document.getElementById("pixPreviewStatus");
  const preview = document.getElementById("pixPreviewImage");
  preview.hidden = true;
  preview.replaceChildren();
  if (!window.PixBR.validarChave(tipo, chave)) {
    status.textContent = "Informe uma chave PIX válida para o tipo selecionado.";
    return;
  }
  if (typeof window.qrcode !== "function") {
    status.textContent = "Não foi possível carregar o gerador de QR Code. Verifique sua conexão e tente novamente.";
    return;
  }
  try {
    const payload = window.PixBR.gerarPayload({
      chave,
      nomeRecebedor: document.getElementById("pix_nomeRecebedor").value,
      cidade: document.getElementById("pix_cidade").value,
      txid: "***"
    });
    const qr = window.qrcode(0, "M");
    qr.addData(payload, "Byte");
    qr.make();
    const imagem = document.createElement("img");
    imagem.alt = "Prévia do QR Code PIX da loja";
    imagem.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag(6, 4, "QR Code PIX"))}`;
    preview.append(imagem);
    preview.hidden = false;
    status.textContent = "Prévia gerada. O QR Code do pedido incluirá o valor da compra.";
  } catch (erro) {
    console.error("Não foi possível gerar a prévia do QR Code PIX.", erro);
    status.textContent = "Não foi possível gerar a prévia. Confira os dados do recebedor.";
  }
}

function renderProdutos() {
  const box = document.getElementById("listaProdutos");
  atualizarContagemProdutos();
  box.innerHTML = estado.produtos
    .map(
      (p, i) => {
        const fotosExtras = Array.isArray(p.imagens) ? p.imagens : [];
        const fotosGaleria = [p.imagem, ...fotosExtras].filter(Boolean);
        const categoriaAtual = p.categoria || estado.categorias.find((categoria) => categoria !== "Todos") || "";
        return `
      <details class="prod-card" data-product-card="${i}" ${i === 0 ? "open" : ""}>
        <summary class="prod-summary">
          <span class="prod-number">${String(i + 1).padStart(2, "0")}</span>
          <span class="prod-summary-name"><span data-summary-name>${esc(p.nome || "Produto sem nome")}</span><small data-summary-category>${esc(categoriaAtual)}</small></span>
          <span class="prod-summary-meta"><span data-summary-price>${Number(p.preco) > 0 ? dinheiroAdmin(p.preco) : "Preço pendente"}</span><small data-summary-stock>${Number(p.estoque) || 0} em estoque</small></span>
          <span class="prod-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="prod-card-content">
        <div class="prod-gallery-admin">
          <p class="prod-gallery-count">${fotosGaleria.length} foto(s) cadastrada(s)</p>
          <div class="prod-gallery-preview">
            ${fotosGaleria.map((foto, fotoIndex) => `
              <div class="prod-gallery-item">
                <img src="${esc(foto)}" alt="Foto ${fotoIndex + 1} de ${esc(p.nome)}">
                ${fotoIndex === 0
                  ? '<span class="prod-cover-label">Principal</span>'
                  : `<button class="prod-remove-photo" data-remove-photo="${i}" data-photo-index="${fotoIndex - 1}" type="button" aria-label="Remover foto ${fotoIndex + 1}">Remover</button>`}
              </div>
            `).join("")}
            ${fotosGaleria.length ? "" : '<p class="prod-no-photo">Nenhuma foto. Envie uma imagem ou informe o caminho abaixo.</p>'}
          </div>
          <label>Enviar foto principal<input type="file" accept="image/jpeg,image/png,image/webp" data-img="${i}"></label>
          <label>Adicionar fotos extras<input type="file" accept="image/jpeg,image/png,image/webp" data-imgs="${i}" multiple></label>
        </div>
        <div class="prod-fields">
          <div class="grid2">
            <label>Nome do produto<input required maxlength="120" data-p="${i}" data-k="nome" value="${esc(p.nome)}"></label>
          <label>Categoria
            <select data-p="${i}" data-k="categoria">
              ${[...new Set([...estado.categorias.filter((c) => c !== "Todos"), categoriaAtual])]
                .map((c) => `<option value="${esc(c)}" ${c === categoriaAtual ? "selected" : ""}>${esc(c)}</option>`)
                .join("")}
            </select>
          </label>
            <label>Preço atual (R$)<input type="number" min="0.01" step="0.01" required data-p="${i}" data-k="preco" value="${esc(p.preco)}"></label>
            <label>Preço anterior (R$)<input type="number" min="0" step="0.01" data-p="${i}" data-k="antigo" value="${esc(p.antigo || 0)}"></label>
            <label>Estoque (unidades)<input type="number" min="0" step="1" required data-p="${i}" data-k="estoque" value="${esc(p.estoque)}"></label>
            <label>Foto principal — caminho ou URL<input required data-p="${i}" data-k="imagem" value="${p.imagem && p.imagem.startsWith("data:") ? "" : esc(p.imagem || "")}" placeholder="imagens/produtos/foto.jpg ou https://..."></label>
          </div>
          <label>Fotos extras — um caminho ou URL por linha<textarea data-p="${i}" data-k="imagens" rows="3">${esc((p.imagens || []).join("\n"))}</textarea></label>
          <label>Descrição do produto<textarea data-p="${i}" data-k="descricao" rows="4">${esc(p.descricao)}</textarea></label>
          <div class="prod-card-footer">
            <label class="prod-featured"><input type="checkbox" data-p="${i}" data-k="destaque" ${p.destaque ? "checked" : ""}> Mostrar como destaque</label>
            <button class="btn btn-remove" data-del="${i}" type="button">Remover produto</button>
          </div>
        </div>
        </div>
      </details>`;
      }
    )
    .join("");

  box.querySelectorAll("[data-p]").forEach((el) => {
    const aplicar = () => {
      const i = Number(el.dataset.p);
      const k = el.dataset.k;
      if (el.type === "checkbox") estado.produtos[i][k] = el.checked;
      else if (el.type === "number") {
        estado.produtos[i][k] = el.value.trim() ? Number(el.value) : null;
        if (k === "preco" && estado.produtos[i].precoPix !== null && estado.produtos[i].precoPix !== undefined) {
          estado.produtos[i].precoPix = estado.produtos[i][k];
        }
      }
      else if (k === "imagem" && !el.value.trim()) return;
      else if (k === "imagens") estado.produtos[i][k] = el.value.split(/\r?\n/).map((foto) => foto.trim()).filter(Boolean);
      else estado.produtos[i][k] = el.value;
      if (k === "imagem") estado.produtos[i].imagemPendente = false;
      if (k === "preco") estado.produtos[i].precoReferencia = false;
      const resumo = document.querySelector(`[data-product-card="${i}"]`);
      if (resumo) {
        if (k === "nome") resumo.querySelector("[data-summary-name]").textContent = estado.produtos[i].nome || "Produto sem nome";
        if (k === "categoria") resumo.querySelector("[data-summary-category]").textContent = estado.produtos[i].categoria;
        if (k === "preco") resumo.querySelector("[data-summary-price]").textContent =
          Number(estado.produtos[i].preco) > 0 ? dinheiroAdmin(estado.produtos[i].preco) : "Preço pendente";
        if (k === "estoque") resumo.querySelector("[data-summary-stock]").textContent =
          `${Number(estado.produtos[i].estoque) || 0} em estoque`;
      }
    };
    el.addEventListener("input", aplicar);
    el.addEventListener("change", aplicar);
  });
  box.querySelectorAll("[data-img]").forEach((el) => {
    el.onchange = async () => {
      if (!el.files[0]) return;
      try {
        estado.produtos[Number(el.dataset.img)].imagem = await fileParaDataUrl(el.files[0]);
        estado.produtos[Number(el.dataset.img)].imagemPendente = false;
      } catch (erro) {
        alert(`Não foi possível carregar a foto principal: ${erro.message}`);
        return;
      }
      renderProdutos();
    };
  });
  box.querySelectorAll("[data-imgs]").forEach((el) => {
    el.onchange = async () => {
      const files = Array.from(el.files || []);
      if (!files.length) return;
      const produto = estado.produtos[Number(el.dataset.imgs)];
      try {
        const novasFotos = await Promise.all(files.map(fileParaDataUrl));
        produto.imagens = [...(produto.imagens || []), ...novasFotos];
      } catch (erro) {
        alert(`Não foi possível carregar as fotos selecionadas: ${erro.message}`);
        return;
      }
      renderProdutos();
    };
  });
  box.querySelectorAll("[data-remove-photo]").forEach((el) => {
    el.onclick = () => {
      const produto = estado.produtos[Number(el.dataset.removePhoto)];
      produto.imagens.splice(Number(el.dataset.photoIndex), 1);
      renderProdutos();
    };
  });
  box.querySelectorAll("[data-del]").forEach((el) => {
    el.onclick = () => {
      if (!confirm(`Remover "${estado.produtos[Number(el.dataset.del)].nome}" do catálogo?`)) return;
      estado.produtos.splice(Number(el.dataset.del), 1);
      renderProdutos();
    };
  });
  filtrarProdutos();
}

function filtrarProdutos() {
  const busca = document.getElementById("buscarProduto");
  const termo = busca ? busca.value.trim().toLocaleLowerCase("pt-BR") : "";
  const cards = [...document.querySelectorAll("[data-product-card]")];
  let visiveis = 0;
  cards.forEach((card) => {
    const produto = estado.produtos[Number(card.dataset.productCard)];
    const corresponde = `${produto.nome || ""} ${produto.categoria || ""}`.toLocaleLowerCase("pt-BR").includes(termo);
    card.hidden = !corresponde;
    if (corresponde) visiveis += 1;
  });
  const contador = document.getElementById("contagemProdutos");
  if (contador) contador.textContent = termo
    ? `${visiveis} de ${estado.produtos.length} produtos encontrados`
    : `${estado.produtos.length} ${estado.produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}`;
}

function dinheiroAdmin(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function esc(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function iniciarPainel() {
  if (window.location.protocol === "file:") {
    renderLogin("Abra o painel pelo endereço do servidor da loja para autenticar.");
    document.getElementById("loginForm").querySelectorAll("input, button").forEach((elemento) => {
      elemento.disabled = true;
    });
    return;
  }
  try {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || `O servidor respondeu ${response.status}.`);
    if (!resultado.authenticated) {
      renderLogin();
      return;
    }
    estado = await window.carregarLojaRemota();
    renderPainel();
  } catch (erro) {
    renderLogin(`Não foi possível verificar a sessão: ${erro.message}`);
  }
}

iniciarPainel();
