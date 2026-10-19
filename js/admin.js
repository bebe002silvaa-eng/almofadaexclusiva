const STORAGE_LOJA = "mineironet_loja";
const AUTH = "mineironet_admin_ok";

let estado = window.carregarLojaConfigurada();

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

function renderLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login">
      <h1>Painel da loja</h1>
      <p>Senha padrão: <strong>mineiro123</strong></p>
      <label>Senha</label>
      <input type="password" id="senha">
      <button class="btn btn-verde" id="entrar">Entrar</button>
    </div>`;
  document.getElementById("entrar").onclick = async () => {
    if (document.getElementById("senha").value !== estado.senhaAdmin) {
      alert("Senha incorreta.");
      return;
    }
    sessionStorage.setItem(AUTH, "1");
    estado = await window.carregarLojaRemota();
    renderPainel();
  };
}

function renderPainel() {
  document.getElementById("app").innerHTML = `
    <div class="painel">
      <div class="topo">
        <h1>Editar loja</h1>
        <div>
          <a class="btn btn-ghost" href="index.html">Ver loja</a>
          <button class="btn btn-ghost" id="resetar">Restaurar padrão</button>
        </div>
      </div>
      <p class="aviso">O catálogo inicial usa imagens ilustrativas e preços de referência. Confirme os preços e o estoque reais antes de vender. Envie JPG, PNG ou WebP para logo, banner e produtos; você pode cadastrar várias fotos por produto.</p>

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
          <label>Senha do painel<input id="senhaAdminCampo" value="${estado.senhaAdmin}"></label>
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
      const sincronizado = await sincronizarLojaComServidor();
      if (sincronizado === false) {
        alert("As alterações foram salvas neste navegador, mas não no servidor. Para publicar os produtos e ativar pagamentos, execute o servidor da loja e sincronize novamente.");
        return;
      }
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
  estado.senhaAdmin = document.getElementById("senhaAdminCampo").value || estado.senhaAdmin;
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

async function sincronizarLojaComServidor() {
  if (window.location.protocol === "file:") return false;
  let health;
  try {
    health = await fetch("/api/health", { cache: "no-store" });
  } catch {
    return false;
  }
  if (health.status === 404) return false;
  if (!health.ok) throw new Error("A API da loja não está disponível.");
  const senha = window.prompt("Digite a senha de sincronização configurada no servidor. Ela não será salva no navegador.");
  if (!senha) return false;
  const response = await fetch("/api/admin/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": senha
    },
    body: JSON.stringify(estado)
  });
  const resultado = await response.json();
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

if (sessionStorage.getItem(AUTH) === "1") renderPainel();
else renderLogin();
