const STORAGE_CARRINHO = "mineironet_carrinho";
let loja = window.carregarLojaConfigurada();
const params = new URLSearchParams(window.location.search);
let produto = loja.produtos.find((item) => item.id === params.get("id"));

const $ = (seletor) => document.querySelector(seletor);

function atribuirImagem(imagem, origem, alternativa = "imagens/logo-pc-simbolo.svg") {
  imagem.onerror = () => {
    imagem.onerror = null;
    imagem.src = alternativa;
  };
  imagem.src = origem || alternativa;
}

function dinheiro(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function produtoTemPreco(item) {
  return typeof item.preco === "number" && Number.isFinite(item.preco) && item.preco > 0;
}

function montarEspecificacoesProduto() {
  const specs = $("#productSpecs");
  specs.replaceChildren();
  const especificacoes = [
    ["SKU", produto.sku],
    ["Cor da armação", produto.corArmacao],
    ["Lente", produto.lente],
    ["Tamanho", produto.tamanho]
  ].filter(([, valor]) => typeof valor === "string" && valor.trim());
  especificacoes.forEach(([titulo, valor]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = titulo;
    dd.textContent = valor;
    specs.append(dt, dd);
  });
  specs.hidden = especificacoes.length === 0;

  const referencia = $("#productPriceReference");
  if (produto.precoPromocional && produto.precoPix) {
    referencia.textContent = `Preço promocional informado: ${dinheiro(produto.precoPromocional)}. O valor principal é o PIX informado para o checkout; confirme os preços com a loja.`;
    referencia.hidden = false;
    $("#productPixNote").textContent = "Valor de referência; confirme preço e disponibilidade com a loja antes de pagar.";
  } else if (produto.paginaOrigem) {
    referencia.textContent = "Preço de referência informado; confirme o valor atual com a loja.";
    referencia.hidden = false;
    $("#productPixNote").textContent = "O valor final só será cobrado depois que o preço e o estoque forem confirmados.";
  } else {
    referencia.hidden = true;
  }

  if (produto.paginaOrigem) {
    try {
      const origem = new URL(produto.paginaOrigem);
      if (origem.protocol === "https:") {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        const link = document.createElement("a");
        dt.textContent = "Página de referência";
        link.href = origem.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = "Consultar o vendedor";
        dd.append(link);
        specs.append(dt, dd);
        specs.hidden = false;
      }
    } catch (erro) {
      console.error("O link de referência deste produto não é válido.", erro);
    }
  }
}

function lerCarrinho() {
  const salvo = localStorage.getItem(STORAGE_CARRINHO);
  if (!salvo) return [];

  const carrinho = JSON.parse(salvo);
  if (!Array.isArray(carrinho)) throw new Error("O formato salvo para o carrinho não é válido.");
  return carrinho.filter((item) => (
    item && typeof item.id === "string" && Number.isInteger(Number(item.qtd))
    && Number(item.qtd) > 0 && Number.isFinite(Number(item.preco))
  )).map((item) => ({ ...item, qtd: Number(item.qtd), preco: Number(item.preco) }));
}

function atualizarSubtotal() {
  const limite = Math.max(1, Number(produto.estoque) || 1);
  const quantidade = Math.min(limite, Math.max(1, Number($("#productQuantity").value) || 1));
  $("#productQuantity").value = String(quantidade);
  $("#productSubtotal").textContent = produtoTemPreco(produto)
    ? dinheiro(produto.preco * quantidade)
    : "Consulte o preço";
}

function selecionarImagem(imagem, indice, total) {
  const principal = $("#productMainImage");
  atribuirImagem(principal, imagem);
  principal.alt = `Foto ${indice + 1} de ${total} · ${produto.nome}`;
  $("#productThumbnails").querySelectorAll("button").forEach((botao, posicao) => {
    const ativa = posicao === indice;
    botao.classList.toggle("ativa", ativa);
    botao.setAttribute("aria-pressed", String(ativa));
  });
}

function renderizarGaleria() {
  const fotos = [produto.imagem, ...(Array.isArray(produto.imagens) ? produto.imagens : [])]
    .filter((foto, indice, todas) => typeof foto === "string" && foto.trim() && todas.indexOf(foto) === indice);
  const miniaturas = $("#productThumbnails");
  miniaturas.replaceChildren();

  atribuirImagem($("#productMainImage"), fotos[0] || produto.imagem);
  $("#productMainImage").alt = `Foto principal · ${produto.nome}`;
  miniaturas.hidden = fotos.length < 2;

  fotos.forEach((foto, indice) => {
    const botao = document.createElement("button");
    const imagem = document.createElement("img");
    botao.type = "button";
    botao.className = `product-thumbnail${indice === 0 ? " ativa" : ""}`;
    botao.setAttribute("aria-label", `Ver foto ${indice + 1} de ${fotos.length}`);
    botao.setAttribute("aria-pressed", String(indice === 0));
    atribuirImagem(imagem, foto);
    imagem.alt = "";
    botao.append(imagem);
    botao.addEventListener("click", () => selecionarImagem(foto, indice, fotos.length));
    miniaturas.append(botao);
  });
}

function renderizarProduto() {
  const nomeLoja = loja.loja.nome;
  $("#productStoreName").textContent = nomeLoja;
  $("#productFooterName").textContent = nomeLoja;
  atribuirImagem($("#productLogo"), loja.loja.logo);
  $("#productLogo").alt = nomeLoja;
  atribuirImagem($("#productFooterLogo"), loja.loja.logo);
  $("#productFooterLogo").alt = nomeLoja;
  $("#productFavicon").href = loja.loja.favicon || loja.loja.logo;
  $("#produtoWhatsApp").href = `https://wa.me/${loja.loja.whatsapp}`;
  $("#productFooterLegal").textContent = loja.loja.razaoSocial;
  $("#productFooterCnpj").textContent = loja.loja.cnpj || "";
  $("#productFooterAddress").textContent = loja.loja.endereco;
  $("#productFooterEmail").textContent = loja.loja.email;
  $("#productFooterEmail").href = `mailto:${loja.loja.email}`;
  $("#productFooterWhatsApp").href = `https://wa.me/${loja.loja.whatsapp}`;

  if (!produto) {
    document.title = `Produto não encontrado · ${nomeLoja}`;
    $("#productNotFound").hidden = false;
    return;
  }

  window.registrarProdutoVisitado(produto.id);
  $("#productBreadcrumbName").textContent = produto.nome;
  $("#productCategory").textContent = produto.categoria;
  $("#productBreadcrumbCategory").textContent = produto.categoria;
  $("#productName").textContent = produto.nome;
  $("#productDescription").textContent = produto.descricao;
  const temPreco = produtoTemPreco(produto);
  $("#productPrice").textContent = temPreco ? dinheiro(produto.preco) : "Consulte o preço";
  $("#productPrice").classList.toggle("preco-consulta", !temPreco);
  $("#productOldPrice").textContent = produto.antigo ? dinheiro(produto.antigo) : "";
  $("#productOldPrice").hidden = !temPreco || !produto.antigo;
  montarEspecificacoesProduto();
  $("#productStock").textContent = produto.estoque > 0
    ? `${produto.estoque} unidade(s) disponível(is)`
    : "Disponibilidade a confirmar com a loja";
  $("#productStock").classList.toggle("indisponivel", produto.estoque <= 0);
  $("#productQuantity").max = String(Math.max(1, Number(produto.estoque) || 1));
  $("#productQuantity").disabled = produto.estoque <= 0 || !temPreco;
  $("#quantityMinus").disabled = produto.estoque <= 0 || !temPreco;
  $("#quantityPlus").disabled = produto.estoque <= 0 || !temPreco;
  $("#productAddButton").disabled = produto.estoque <= 0 || !temPreco;
  $("#productAddButton").textContent = !temPreco
    ? "Consulte o preço"
    : produto.estoque > 0 ? "Adicionar ao carrinho" : "Estoque a confirmar";
  $("#productStockWarning").hidden = produto.estoque > 0 && temPreco;
  if (!temPreco) $("#productStockWarning").textContent = "O preço deste produto ainda precisa ser confirmado. Fale com a loja antes de comprar.";
  $("#productPurchaseCheck").textContent = produto.sku
    ? "Confirme cor, lente, tamanho e disponibilidade com a loja."
    : "Confirme detalhes, medidas, preço e disponibilidade com a loja.";

  const contato = `Olá! Tenho interesse no produto: ${produto.nome}`;
  const linkWhatsApp = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(contato)}`;
  $("#productContactLink").href = linkWhatsApp;
  document.title = `${produto.nome} · ${nomeLoja}`;
  document.querySelector('meta[name="description"]').content = produto.descricao;
  $("#productPageContent").hidden = false;
  renderizarGaleria();
  atualizarSubtotal();

  $("#productQuantity").addEventListener("input", atualizarSubtotal);
  $("#quantityMinus").addEventListener("click", () => {
    $("#productQuantity").value = String(Math.max(1, Number($("#productQuantity").value) - 1));
    atualizarSubtotal();
  });
  $("#quantityPlus").addEventListener("click", () => {
    const maximo = Number(produto.estoque) || 1;
    $("#productQuantity").value = String(Math.min(maximo, Number($("#productQuantity").value) + 1));
    atualizarSubtotal();
  });

  try {
    const carrinho = lerCarrinho();
    $("#productCartCount").textContent = String(carrinho.reduce((total, item) => total + (Number(item.qtd) || 0), 0));
  } catch (erro) {
    $("#productAddButton").disabled = true;
    $("#productStockWarning").hidden = false;
    $("#productStockWarning").textContent = `Não foi possível ler o carrinho: ${erro.message}`;
  }

  $("#productAddButton").addEventListener("click", adicionarAoCarrinho);
}

function adicionarAoCarrinho() {
  if (!produtoTemPreco(produto)) {
    $("#productStockWarning").hidden = false;
    $("#productStockWarning").textContent = "O preço deste produto ainda precisa ser confirmado. Fale com a loja antes de comprar.";
    return;
  }
  let carrinho;
  try {
    carrinho = lerCarrinho();
  } catch (erro) {
    $("#productStockWarning").hidden = false;
    $("#productStockWarning").textContent = `Não foi possível ler o carrinho: ${erro.message}`;
    return;
  }

  const quantidade = Math.max(1, Number($("#productQuantity").value) || 1);
  const item = carrinho.find((entrada) => entrada.id === produto.id);
  if (quantidade + (Number(item?.qtd) || 0) > produto.estoque) {
    $("#productStockWarning").hidden = false;
    $("#productStockWarning").textContent = `Há somente ${produto.estoque} unidade(s) disponível(is) deste produto.`;
    return;
  }

  if (item) {
    item.qtd += quantidade;
    item.nome = produto.nome;
    item.preco = produto.preco;
    item.imagem = produto.imagem;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      qtd: quantidade
    });
  }

  try {
    localStorage.setItem(STORAGE_CARRINHO, JSON.stringify(carrinho));
  } catch (erro) {
    $("#productStockWarning").hidden = false;
    $("#productStockWarning").textContent = `Não foi possível salvar o carrinho: ${erro.message}`;
    return;
  }

  $("#productCartCount").textContent = String(carrinho.reduce((total, entrada) => total + (Number(entrada.qtd) || 0), 0));
  $("#productAddedMessage").textContent = `${quantidade} unidade(s) de ${produto.nome} no carrinho.`;
  $("#productAfterAdd").hidden = false;
  $("#productAfterAdd").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function iniciarProduto() {
  loja = await window.carregarLojaRemota();
  produto = loja.produtos.find((item) => item.id === params.get("id"));
  renderizarProduto();
}

iniciarProduto();
