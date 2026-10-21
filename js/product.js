const STORAGE_CARRINHO = "mineironet_carrinho";
let loja = window.carregarLojaConfigurada();
const params = new URLSearchParams(window.location.search);
let produto = loja.produtos.find((item) => item.id === params.get("id"));
const PRODUCT_STORY_IMAGES = [
  {
    src: "imagens/produtos/Massageador_eletrico_de_joelho_premium-4.png",
    alt: "Massageador elétrico de joelho, vista do aparelho",
    caption: "Vista do massageador. Confirme cor e acabamento da versão disponível."
  },
  {
    src: "imagens/produtos/massageador-em-uso.webp",
    alt: "Ilustração do massageador posicionado sobre o joelho",
    caption: "Imagem ilustrativa do aparelho em uso; siga as instruções do fabricante."
  },
  {
    src: "imagens/produtos/massageador-recursos.png",
    alt: "Ilustração de aquecimento e níveis de temperatura no massageador",
    caption: "A imagem exibe níveis de temperatura; confirme se correspondem ao modelo vendido."
  },
  {
    src: "imagens/produtos/massageador-detalhes.webp",
    alt: "Imagem ilustrativa do massageador e de suas partes",
    caption: "Imagem de detalhes fornecida para o produto; confirme áreas de uso e acessórios com a loja."
  }
];
const PILLOW_STORY_IMAGES = [
  {
    src: "imagens/produtos/Travesseiro_borboleta_branco_para_dormir_de_lado-3.png",
    alt: "Pessoa descansando com o travesseiro cervical branco e cinza",
    caption: "Vista do travesseiro em uso. Confirme se a cor corresponde à versão disponível."
  },
  {
    src: "imagens/produtos/travesseiro-cervical-detalhe.png",
    alt: "Travesseiro cervical em formato anatômico visto de cima",
    caption: "Detalhe do formato e do acabamento do travesseiro."
  },
  {
    src: "imagens/produtos/travesseiro-cervical-uso.webp",
    alt: "Travesseiro cervical visto de perfil",
    caption: "Vista lateral para observar o contorno do modelo."
  },
  {
    src: "imagens/produtos/travesseiro-cervical-conforto.png",
    alt: "Pessoa usando o travesseiro cervical durante o descanso",
    caption: "Imagem ilustrativa de uso. A altura e o conforto variam de pessoa para pessoa."
  }
];
const COCCYX_STORY_IMAGES = [
  {
    src: "imagens/produtos/almofada-coccix-principal.png",
    alt: "Almofada massageadora para assento, vista superior",
    caption: "Vista do formato e da superfície da almofada. Confirme cor e acabamento da unidade."
  },
  {
    src: "imagens/produtos/almofada-coccix-detalhe.png",
    alt: "Pessoa utilizando a almofada massageadora em uma cadeira",
    caption: "Imagem ilustrativa de uso em cadeira."
  },
  {
    src: "imagens/produtos/almofada-coccix-superficie.png",
    alt: "Áreas destacadas na superfície da almofada massageadora",
    caption: "Detalhe ilustrativo da superfície; confirme as funções com a loja."
  },
  {
    src: "imagens/produtos/almofada-coccix-em-uso.png",
    alt: "Almofada massageadora posicionada sobre uma cadeira",
    caption: "Imagem ilustrativa. Verifique o modo de uso no manual do fabricante."
  }
];
const KNEE_SUPPORT_STORY_IMAGES = [
  {
    src: "imagens/produtos/joelheira-suporte-principal.webp",
    alt: "Par de joelheiras pretas de suporte, vista frontal",
    caption: "Vista do par de joelheiras. Confirme tamanho e acabamento da versão disponível."
  },
  {
    src: "imagens/produtos/joelheira-suporte-detalhes.png",
    alt: "Detalhes do formato e do material das joelheiras",
    caption: "Detalhes apresentados no anúncio. Consulte composição e cuidados com a loja."
  },
  {
    src: "imagens/produtos/joelheira-suporte-uso.png",
    alt: "Exemplos de uso das joelheiras em atividades físicas",
    caption: "Exemplos ilustrativos de uso durante atividades físicas."
  },
  {
    src: "imagens/produtos/joelheira-suporte-ajuste.webp",
    alt: "Detalhe do ajuste da joelheira de suporte",
    caption: "Observe o ajuste e confirme a tabela de tamanhos antes de comprar."
  }
];
const FOLDING_CUSHION_STORY_IMAGES = [
  {
    src: "imagens/produtos/almofada-dobravel-principal.webp",
    alt: "Almofada dobrável azul com amarras, vista frontal",
    caption: "Vista da almofada dobrável azul. Confirme cor e acabamento da unidade disponível."
  },
  {
    src: "imagens/produtos/almofada-dobravel-em-uso.png",
    alt: "Almofada dobrável posicionada em uma cadeira",
    caption: "Exemplo ilustrativo da almofada posicionada em um assento."
  },
  {
    src: "imagens/produtos/almofada-dobravel-preta.webp",
    alt: "Almofada dobrável preta com amarras",
    caption: "Outra cor apresentada no anúncio. Consulte as opções disponíveis com a loja."
  },
  {
    src: "imagens/produtos/almofada-dobravel-variacao.webp",
    alt: "Almofada dobrável em outra variação de cor",
    caption: "Variação ilustrativa. Confirme as cores disponíveis antes da compra."
  }
];
const LUMBAR_SUPPORT_STORY_IMAGES = [
  {
    src: "imagens/produtos/colete-lombar-principal.png",
    alt: "Colete lombar preto visto pela parte de trás",
    caption: "Vista traseira do colete. Confirme tamanho e acabamento da versão disponível."
  },
  {
    src: "imagens/produtos/colete-lombar-detalhe.png",
    alt: "Detalhe traseiro do colete ortopédico lombar",
    caption: "Detalhe do formato e dos painéis traseiros apresentados no anúncio."
  },
  {
    src: "imagens/produtos/colete-lombar-em-uso.png",
    alt: "Pessoa sentada utilizando o colete lombar",
    caption: "Imagem ilustrativa de uso. Procure orientação profissional sobre ajuste e utilização."
  },
  {
    src: "imagens/produtos/colete-lombar-recursos.png",
    alt: "Infográfico ilustrativo sobre os detalhes do colete lombar",
    caption: "Infográfico do anúncio de referência. Confirme materiais, recursos e especificações com a loja."
  }
];
const INFRARED_LAMP_STORY_IMAGES = [
  {
    src: "imagens/produtos/infravermelho-lampada-principal.png",
    alt: "Lâmpada de infravermelho em tripé ao lado de uma pessoa sentada",
    caption: "Vista do aparelho e do tripé. Confirme os itens inclusos na versão disponível."
  },
  {
    src: "imagens/produtos/infravermelho-lampada-detalhes.png",
    alt: "Detalhes do painel e da lâmpada de infravermelho",
    caption: "Detalhes do aparelho apresentados no anúncio. Confirme controles e especificações com a loja."
  },
  {
    src: "imagens/produtos/infravermelho-lampada-em-uso.png",
    alt: "Exemplo ilustrativo de uso da lâmpada de infravermelho",
    caption: "Imagem ilustrativa de uso; siga as instruções do fabricante e orientação profissional."
  },
  {
    src: "imagens/produtos/infravermelho-lampada-recursos.webp",
    alt: "Infográfico do aparelho de infravermelho",
    caption: "Infográfico do anúncio de referência. Confirme níveis, medidas e compatibilidade elétrica."
  }
];

function criarHistoriaProdutoReferencia({
  kicker,
  title,
  intro,
  featuresIntro,
  points,
  beforeText,
  packageText,
  disclaimer,
  captions
}) {
  return {
    kicker,
    title,
    intro,
    featuresTitle: "Detalhes para conferir",
    featuresIntro,
    points,
    beforeTitle: "Antes de escolher",
    beforeText,
    packageTitle: "Confira a versão",
    packageText,
    disclaimer,
    captions
  };
}

const REFERENCE_PRODUCT_STORIES = {
  "aparelho-laserterapia-portatil-recarregavel": {
    kicker: "Aparelho portátil recarregável",
    title: "Conheça o aparelho e seus detalhes",
    intro: "Veja o dispositivo em diferentes ângulos e confira o que verificar antes da compra. Consulte com a loja as especificações, os acessórios e as orientações de uso do modelo disponível.",
    featuresTitle: "Detalhes para conferir antes de usar",
    featuresIntro: "O anúncio apresenta um dispositivo portátil com luz. Confirme tipo de tecnologia, níveis, alimentação e instruções do fabricante; não interprete a descrição como promessa de tratamento.",
    points: [
      ["Formato portátil", "Verifique dimensões e o que acompanha a embalagem."],
      ["Alimentação recarregável", "Confirme cabo, carregador e autonomia informada."],
      ["Instruções do fabricante", "Consulte os cuidados e a finalidade indicada para o modelo."]
    ],
    beforeTitle: "Confirme as especificações",
    beforeText: "Verifique tecnologia utilizada, potência, acessórios, garantia e instruções de segurança com a loja antes da compra.",
    packageTitle: "Confira o que acompanha",
    packageText: "Confirme dispositivo, cabo de recarga e demais itens que serão enviados.",
    disclaimer: "Este produto não substitui avaliação, diagnóstico ou tratamento profissional. Não use dispositivos de luz para tratar condições de saúde sem orientação de profissional habilitado.",
    captions: ["Vista do aparelho portátil. Confirme o modelo e o acabamento da unidade disponível.", "Detalhes do dispositivo e dos controles; consulte as especificações com a loja.", "Imagem ilustrativa de uso. Siga o manual do fabricante.", "Recursos ilustrados no anúncio; confirme tecnologia, acessórios e instruções."]
  },
  "almofada-costas-pernas-6-em-1": {
    kicker: "Almofada multifuncional",
    title: "Apoio versátil para diferentes momentos de descanso",
    intro: "Confira o formato da almofada e as posições ilustradas no anúncio. Medidas, materiais e configurações podem variar; confirme a versão disponível com a loja.",
    featuresTitle: "Um formato para vários tipos de apoio",
    featuresIntro: "O modelo é apresentado como suporte para costas e pernas. Use sobre uma superfície estável e verifique se as dimensões se ajustam ao espaço de uso.",
    points: [
      ["Apoio para as costas", "Confira o ângulo e a estabilidade no local onde pretende usar."],
      ["Apoio para pernas", "Observe nas imagens os formatos e posições apresentados."],
      ["Formato multifuncional", "Confirme medidas, materiais e configurações incluídas."]
    ],
    beforeTitle: "Confira as dimensões",
    beforeText: "Pergunte à loja sobre comprimento, altura, composição, capa, limpeza e posições de uso do modelo disponível.",
    packageTitle: "Confirme a versão",
    packageText: "Verifique se a embalagem inclui somente a almofada ou outros acessórios.",
    disclaimer: "Artigo de conforto. Não é dispositivo médico e não substitui avaliação ou tratamento profissional.",
    captions: ["Vista da almofada em uso como apoio para as costas.", "Detalhe do formato e do material; confirme a composição com a loja.", "Exemplo ilustrativo de outra posição de apoio.", "Imagens demonstrativas das configurações apresentadas no anúncio."]
  },
  "almofada-massagem-portatil-aquecimento": {
    kicker: "Almofada de massagem portátil",
    title: "Conforto com massagem e aquecimento",
    intro: "Conheça o formato da almofada e os controles mostrados. Confirme com a loja as áreas de uso, os modos, a alimentação e os acessórios da versão disponível.",
    featuresTitle: "Recursos para conhecer antes de usar",
    featuresIntro: "O anúncio apresenta uma almofada elétrica com massagem e aquecimento. Consulte o manual para entender os controles, o tempo de uso e os cuidados.",
    points: [
      ["Formato portátil", "Verifique o tamanho e a forma de posicionamento."],
      ["Massagem e aquecimento", "Confirme modos e controles da versão à venda."],
      ["Alimentação elétrica", "Confira fonte, tensão compatível e acessórios inclusos."]
    ],
    beforeTitle: "Confira os cuidados",
    beforeText: "Verifique composição, áreas de uso, alimentação, garantia e instruções de segurança. Interrompa o uso se sentir desconforto.",
    packageTitle: "Itens da embalagem",
    packageText: "Confirme se fonte, controle ou outros acessórios mostrados acompanham o produto.",
    disclaimer: "Produto de conforto; não substitui avaliação, diagnóstico ou tratamento profissional. Siga o manual e evite o uso sobre áreas lesionadas.",
    captions: ["Almofada de massagem em uma poltrona. Confirme o modelo disponível.", "Detalhes da almofada e de seus controles; consulte as funções com a loja.", "Exemplo ilustrativo de uso. Siga o manual do fabricante.", "Vista adicional do produto; confirme alimentação e acessórios inclusos."]
  },
  "aquecedor-pes-eletrico": {
    kicker: "Aquecedor elétrico para os pés",
    title: "Um toque de aconchego nos dias frios",
    intro: "Veja o aquecedor em diferentes ângulos e confira os cuidados para a versão disponível. Verifique com a loja o tecido, a alimentação e as instruções de limpeza.",
    featuresTitle: "Conheça os detalhes do aquecedor",
    featuresIntro: "O produto é apresentado como aquecedor elétrico para os pés. Confira potência, controle de temperatura e recomendações do fabricante.",
    points: [
      ["Interior acolchoado", "Confirme materiais, dimensões e tamanho adequado."],
      ["Aquecimento elétrico", "Verifique níveis, potência e tensão compatível."],
      ["Cuidados e limpeza", "Consulte se a capa pode ser removida e como higienizar."]
    ],
    beforeTitle: "Verifique a compatibilidade elétrica",
    beforeText: "Confirme a tensão, a potência, o modo de controle, o tempo recomendado e os cuidados para uso seguro.",
    packageTitle: "Confirme o conteúdo",
    packageText: "Verifique se a fonte ou cabo de alimentação e o controle estão incluídos.",
    disclaimer: "Aquecedor elétrico de conforto. Use somente conforme o manual; não adormeça com o produto ligado e interrompa o uso se houver aquecimento excessivo.",
    captions: ["Aquecedor para os pés em uso em uma poltrona. Confira cor e formato.", "Vista do material e do acabamento do produto.", "Detalhe ilustrativo dos controles e da alimentação elétrica.", "Imagem demonstrativa; confirme os itens que acompanham a unidade."]
  },
  "aparelho-lipocavitacao-8-em-1": {
    kicker: "Aparelho corporal com acessórios",
    title: "Conheça o aparelho e os acessórios do conjunto",
    intro: "Confira o dispositivo e os acessórios apresentados no anúncio. Confirme a composição do kit, as funções e as instruções de segurança antes de comprar.",
    featuresTitle: "Confira cada função com a loja",
    featuresIntro: "A denominação do anúncio informa um aparelho 8 em 1. As funções podem variar conforme a versão; confirme modelo, acessórios e indicações no manual.",
    points: [
      ["Acessórios do conjunto", "Confira quantas ponteiras e cabeças acompanham o produto."],
      ["Controles e ajustes", "Consulte a função e o uso correto de cada modo."],
      ["Uso responsável", "Siga o manual e procure orientação habilitada antes de usar."]
    ],
    beforeTitle: "Confirme tecnologia e segurança",
    beforeText: "Verifique potência, contraindicações, áreas de uso, alimentação e certificações aplicáveis. Não confie em promessas de redução de medidas ou resultados estéticos garantidos.",
    packageTitle: "Confira o kit",
    packageText: "Peça à loja a lista dos acessórios incluídos na versão que será enviada.",
    disclaimer: "Equipamento de uso corporal; não substitui avaliação ou tratamento profissional. Confirme se o uso é adequado para você com profissional habilitado.",
    captions: ["Vista do aparelho corporal. Confirme os acessórios da unidade disponível.", "Detalhe das ponteiras e controles apresentados no anúncio.", "Exemplo ilustrativo de uso; siga as instruções do fabricante.", "Acessórios demonstrativos. Confirme o que compõe o kit."]
  },
  "palmilha-anatomica-nuvem": {
    kicker: "Palmilha anatômica",
    title: "Conforto para acompanhar sua rotina",
    intro: "Veja o formato e a superfície da palmilha. Consulte numeração, possibilidade de corte, composição e cuidados de limpeza antes de escolher.",
    featuresTitle: "Encontre o tamanho adequado",
    featuresIntro: "O modelo é apresentado como palmilha para uso diário. O encaixe depende da numeração do calçado e do formato do pé.",
    points: [
      ["Formato anatômico", "Confira o contorno e o encaixe dentro do calçado."],
      ["Superfície texturizada", "Observe os detalhes e confirme a composição."],
      ["Numeração", "Consulte a tabela de medidas e a possibilidade de ajuste."]
    ],
    beforeTitle: "Confira a numeração",
    beforeText: "Compare a tabela de tamanhos com seu calçado e confirme materiais, espessura, limpeza e instruções de uso.",
    packageTitle: "Confirme a quantidade",
    packageText: "Verifique se a embalagem inclui um par e se há tamanhos ou modelos diferentes.",
    disclaimer: "Acessório de conforto para calçados. Não substitui avaliação profissional em caso de dores ou condições nos pés.",
    captions: ["Vista superior das palmilhas. Confirme as cores da versão disponível.", "Detalhe da textura e do formato anatômico.", "Exemplo ilustrativo de colocação no calçado.", "Vista adicional da superfície. Consulte medidas e composição."]
  },
  "botas-massageadoras-eletricas-pernas-pes": {
    kicker: "Botas massageadoras elétricas",
    title: "Conheça as botas e os controles do conjunto",
    intro: "Confira o produto em uso e os detalhes das botas. Verifique com a loja os tamanhos, modos, níveis de compressão, alimentação e itens incluídos.",
    featuresTitle: "Recursos e ajuste da versão disponível",
    featuresIntro: "O anúncio apresenta botas elétricas para pernas e pés. Confirme os modos, o ajuste e as instruções de uso no manual.",
    points: [
      ["Cobertura para pernas e pés", "Confira medidas e compatibilidade com seu tamanho."],
      ["Controle de funcionamento", "Verifique modos, níveis e uso do controle."],
      ["Ajuste individual", "Siga as instruções e interrompa se sentir desconforto."]
    ],
    beforeTitle: "Consulte a adequação",
    beforeText: "Confirme tamanhos, pressão, tempo de uso, alimentação e contraindicações com o fabricante e um profissional habilitado.",
    packageTitle: "Confira o conjunto",
    packageText: "Verifique se controle, mangueiras, fonte e acessórios estão incluídos.",
    disclaimer: "Produto elétrico de bem-estar; não substitui avaliação ou tratamento profissional. Pessoas com condições circulatórias ou outras condições de saúde devem buscar orientação antes de usar.",
    captions: ["Botas massageadoras em uso. Confirme tamanho e acabamento.", "Vista adicional do conjunto e do encaixe.", "Detalhes do controle e dos tubos de conexão.", "Imagem demonstrativa do produto; consulte os acessórios inclusos."]
  },
  "massagem-joelho-calor": {
    kicker: "Massageador de joelho",
    title: "Conheça os recursos e o ajuste do massageador",
    intro: "Veja o aparelho em diferentes ângulos e confira os modos apresentados. Confirme com a loja o tamanho, a alimentação e as funções da versão disponível.",
    featuresTitle: "Detalhes do aparelho",
    featuresIntro: "O anúncio apresenta um dispositivo de massagem e aquecimento para o joelho. Consulte o manual sobre níveis, tempo e modo de uso.",
    points: [
      ["Formato para o joelho", "Confira as dimensões e o ajuste na perna."],
      ["Massagem e aquecimento", "Verifique controles e níveis do modelo à venda."],
      ["Uso com atenção", "Siga o manual e interrompa em caso de desconforto."]
    ],
    beforeTitle: "Confirme a versão",
    beforeText: "Verifique tamanho, alimentação, temperatura, duração do uso e áreas de contato antes de comprar.",
    packageTitle: "Itens inclusos",
    packageText: "Confirme o conteúdo da caixa e se cabos ou carregador acompanham o aparelho.",
    disclaimer: "Produto de conforto e bem-estar, não dispositivo médico. Não substitui diagnóstico ou tratamento profissional; siga o manual e peça orientação antes do uso se tiver condição de saúde.",
    captions: ["Vista dos massageadores de joelho. Confirme se o anúncio se refere a um par.", "Detalhe do ajuste e da área de contato.", "Exemplo ilustrativo de uso. Siga as orientações do fabricante.", "Vista adicional dos controles; confirme modos e acessórios com a loja."]
  },
  "massageador-ombro-aquecimento": {
    kicker: "Massageador para ombros",
    title: "Conforto ajustável para sua rotina",
    intro: "Veja o formato do massageador e os detalhes do aquecimento. Confirme os modos, a área de uso, a alimentação e os acessórios da versão disponível.",
    featuresTitle: "Detalhes para conferir",
    featuresIntro: "O anúncio apresenta um massageador para ombros com aquecimento. Verifique as instruções, o tempo de uso e os controles no manual.",
    points: [
      ["Formato para ombros", "Confira o ajuste, o tamanho e a forma de vestir."],
      ["Aquecimento", "Consulte níveis e cuidados no manual do fabricante."],
      ["Controles e alimentação", "Verifique o tipo de controle e a fonte compatível."]
    ],
    beforeTitle: "Confira o ajuste e os cuidados",
    beforeText: "Confirme materiais, dimensões, temperatura, limpeza e garantia com a loja. Interrompa o uso se sentir desconforto.",
    packageTitle: "Confirme os acessórios",
    packageText: "Verifique controle, cabos e acessórios inclusos na versão escolhida.",
    disclaimer: "Produto de conforto; não trata nem elimina dores. Não substitui avaliação profissional; siga o manual e procure orientação de saúde em caso de sintomas persistentes.",
    captions: ["Massageador posicionado sobre o ombro. Confira formato e acabamento.", "Detalhe do ajuste e das áreas de contato.", "Exemplo ilustrativo de aquecimento; confirme controles e modos.", "Vista adicional do aparelho em uso. Siga o manual do fabricante."]
  },
  "pistola-massageadora-bodyrelax": {
    kicker: "Pistola massageadora portátil",
    title: "Conheça a pistola e as ponteiras do conjunto",
    intro: "Confira o formato do aparelho e as ponteiras mostradas. Verifique potência, velocidades, autonomia e acessórios da versão disponível com a loja.",
    featuresTitle: "Controles e acessórios",
    featuresIntro: "O modelo é apresentado como pistola massageadora muscular. Consulte o manual para saber como selecionar as ponteiras e os níveis.",
    points: [
      ["Ponteiras intercambiáveis", "Confirme a quantidade e o formato dos acessórios inclusos."],
      ["Níveis de velocidade", "Verifique os ajustes e a duração da bateria."],
      ["Uso cuidadoso", "Evite áreas sensíveis e siga o manual do fabricante."]
    ],
    beforeTitle: "Confira as especificações",
    beforeText: "Consulte potência, peso, autonomia, tempo de recarga, garantia e cuidados. Evite aplicar sobre ossos, cabeça, pescoço ou áreas lesionadas.",
    packageTitle: "Confira o kit",
    packageText: "Verifique a lista de ponteiras, estojo e carregador que acompanham o produto.",
    disclaimer: "Aparelho de massagem para bem-estar; não substitui avaliação ou tratamento profissional. Suspenda o uso se sentir dor ou desconforto.",
    captions: ["Pistola massageadora com ponteiras. Confirme os acessórios do conjunto.", "Exemplo ilustrativo de uso. Siga as instruções do fabricante.", "Detalhe de uma ponteira e do corpo do aparelho.", "Vista adicional do conjunto; verifique os itens inclusos."]
  },
  "massageador-modelador-portatil": criarHistoriaProdutoReferencia({
    kicker: "Massageador corporal portátil",
    title: "Conheça o massageador e seus acessórios",
    intro: "Confira o aparelho e os discos apresentados nas imagens. Verifique com a loja o modelo, a alimentação, os acessórios incluídos e as instruções de uso.",
    featuresIntro: "O conjunto é apresentado com discos intercambiáveis. Consulte o manual para confirmar a função de cada peça e as áreas de uso permitidas.",
    points: [
      ["Acessórios intercambiáveis", "Confirme os discos e as peças que acompanham a unidade."],
      ["Alimentação elétrica", "Verifique a tensão, a potência e o comprimento do cabo."],
      ["Uso conforme o manual", "Siga as instruções e interrompa se sentir desconforto."]
    ],
    beforeText: "Confirme o modelo, a potência, os acessórios, a tensão compatível e as instruções de limpeza e segurança.",
    packageText: "Verifique a quantidade e o tipo de discos e se o cabo de alimentação acompanha o produto.",
    disclaimer: "Aparelho de massagem para conforto e bem-estar; não promete redução de medidas ou tratamento de condições de saúde. Siga o manual do fabricante.",
    captions: ["Massageador e acessórios do conjunto. Confirme os itens incluídos.", "Exemplo ilustrativo de uso no braço.", "Detalhe do massageador e dos discos intercambiáveis.", "Vista adicional do aparelho; confira a alimentação indicada."]
  }),
  "encosto-ergonomico-assento-carro": criarHistoriaProdutoReferencia({
    kicker: "Encosto para assento de carro",
    title: "Veja o formato e os detalhes do encosto",
    intro: "Conheça o encosto em diferentes vistas e exemplos de uso. Antes da compra, confira as dimensões e se o formato é compatível com o banco do veículo.",
    featuresIntro: "A galeria mostra o encosto posicionado em assentos. Confira o sistema de fixação e as medidas da versão disponível.",
    points: [
      ["Formato de apoio", "Compare as dimensões com o espaço do assento."],
      ["Fixação no banco", "Confirme como as tiras ou presilhas são instaladas."],
      ["Materiais e limpeza", "Consulte a composição e os cuidados recomendados."]
    ],
    beforeText: "Verifique dimensões, fixação, compatibilidade com o banco, materiais e condições de troca.",
    packageText: "Confirme se o produto inclui tiras de fixação e quais itens acompanham a embalagem.",
    disclaimer: "Acessório de conforto para assento; não é dispositivo médico nem substitui avaliação profissional.",
    captions: ["Vista frontal do encosto para assento de carro.", "Exemplo ilustrativo de posicionamento no banco.", "Vista do produto instalado em um assento.", "Detalhe do formato e do acabamento; confirme a versão."]
  }),
  "apoio-lombar-ergonomico": criarHistoriaProdutoReferencia({
    kicker: "Apoio lombar para cadeira",
    title: "Confira o formato e o ajuste do apoio",
    intro: "Veja o apoio lombar em diferentes ângulos e confira as tiras de fixação. As dimensões e a compatibilidade podem variar entre cadeiras.",
    featuresIntro: "O produto é apresentado com tiras para prender ao encosto. Confirme o ajuste e os materiais da unidade disponível.",
    points: [
      ["Tiras de fixação", "Confira o comprimento e a forma de prender à cadeira."],
      ["Formato do apoio", "Consulte altura, largura e profundidade."],
      ["Capa e cuidados", "Verifique a composição e as instruções de limpeza."]
    ],
    beforeText: "Compare as medidas com sua cadeira e confirme materiais, ajuste, limpeza e garantia com a loja.",
    packageText: "Confirme se a embalagem contém apenas o apoio ou inclui itens adicionais.",
    disclaimer: "Acessório de conforto para cadeira; não corrige condições de saúde nem substitui orientação profissional.",
    captions: ["Vista frontal do apoio lombar com tiras.", "Detalhe das tiras e do acabamento.", "Exemplo ilustrativo de colocação em cadeira.", "Vista adicional do produto; confirme medidas e materiais."]
  }),
  "manta-termica-eletrica": criarHistoriaProdutoReferencia({
    kicker: "Manta térmica elétrica",
    title: "Conheça a manta e seus controles",
    intro: "Confira o tecido, o controle e os detalhes mostrados nas imagens. Confirme dimensões, níveis e compatibilidade elétrica antes de usar.",
    featuresIntro: "A manta funciona ligada à energia. Consulte o manual para conhecer os controles, o tempo de uso e as orientações de limpeza.",
    points: [
      ["Controle de temperatura", "Verifique os níveis disponíveis na versão à venda."],
      ["Alimentação elétrica", "Confirme a tensão e os acessórios de alimentação."],
      ["Cuidados de limpeza", "Consulte se pode ser lavada e como desconectar o controle."]
    ],
    beforeText: "Confira dimensões, potência, tensão, controles, instruções de lavagem e medidas de segurança.",
    packageText: "Verifique se o controle e o cabo de alimentação estão incluídos.",
    disclaimer: "Produto elétrico de aquecimento. Use conforme o manual, mantenha seco e desligue da tomada antes de guardar ou limpar.",
    captions: ["Vista da manta térmica elétrica.", "Exemplo ilustrativo de uso da manta.", "Detalhe do controle e dos ajustes apresentados.", "Vista adicional do tecido e do aparelho; consulte o manual."]
  }),
  "travesseiro-ergonomico-cervical-mgc": criarHistoriaProdutoReferencia({
    kicker: "Travesseiro cervical MGC",
    title: "Confira o formato e os detalhes do travesseiro",
    intro: "Veja o travesseiro em uso e em diferentes vistas. Consulte as dimensões e os materiais para avaliar se o modelo atende às suas preferências de descanso.",
    featuresIntro: "A galeria apresenta o formato do travesseiro e alguns ângulos de uso. A sensação de conforto depende das preferências de cada pessoa.",
    points: [
      ["Formato ergonômico", "Observe o contorno e compare com sua posição de descanso."],
      ["Dimensões", "Confirme altura, largura e comprimento da unidade."],
      ["Capa e materiais", "Verifique composição, remoção e instruções de lavagem."]
    ],
    beforeText: "Confirme dimensões, composição, capa, cuidados de limpeza e política de troca.",
    packageText: "Verifique se a embalagem inclui o travesseiro e uma capa removível.",
    disclaimer: "Travesseiro de conforto; não trata ronco, dores ou condições clínicas. Procure orientação profissional para sintomas persistentes.",
    captions: ["Pessoa descansando com o travesseiro MGC.", "Vista do formato e do acabamento do travesseiro.", "Detalhe do contorno apresentado no anúncio.", "Exemplo ilustrativo de uso; conforto e adaptação são individuais."]
  }),
  "almofada-alinhamento-coluna-pernas": criarHistoriaProdutoReferencia({
    kicker: "Almofada de apoio para descanso",
    title: "Veja o formato da almofada e as posições de uso",
    intro: "Confira a almofada em diferentes vistas e posições ilustradas. Verifique as dimensões e o material da versão disponível.",
    featuresIntro: "As imagens apresentam uma almofada com contorno para apoiar o corpo durante o descanso. Confirme as medidas antes de escolher.",
    points: [
      ["Formato contornado", "Observe o desenho e as áreas de apoio."],
      ["Dimensões", "Confira largura, altura e comprimento."],
      ["Capa e limpeza", "Consulte materiais e instruções de higienização."]
    ],
    beforeText: "Confirme as dimensões, a composição, a capa e os cuidados de limpeza com a loja.",
    packageText: "Verifique a quantidade de peças e se a capa está incluída.",
    disclaimer: "Acessório de conforto para descanso; não substitui orientação ou tratamento profissional.",
    captions: ["Vista principal da almofada de apoio.", "Exemplo ilustrativo de uso durante o descanso.", "Detalhe do contorno da almofada.", "Vista adicional da peça e do material."]
  }),
  "massageador-pe-ems-6-modos": criarHistoriaProdutoReferencia({
    kicker: "Massageador de pés EMS",
    title: "Conheça o aparelho e os modos apresentados",
    intro: "Veja o massageador, o controle e as ilustrações de uso. Confirme funcionamento, alimentação e orientações do fabricante para a versão disponível.",
    featuresIntro: "O anúncio identifica seis modos EMS. Consulte o manual para entender os comandos, os níveis e as orientações de uso.",
    points: [
      ["Seis modos indicados", "Confira os modos e ajustes descritos no manual."],
      ["Controle do aparelho", "Verifique a forma de ligar e selecionar as funções."],
      ["Alimentação", "Confirme cabos, fonte e compatibilidade elétrica."]
    ],
    beforeText: "Verifique funções, alimentação, acessórios, contraindicações e orientações do fabricante antes do uso.",
    packageText: "Confirme se controle, cabos ou outros acessórios acompanham o produto.",
    disclaimer: "Dispositivo de bem-estar; não diagnostica nem trata doenças. Procure orientação profissional se tiver condição de saúde ou sentir desconforto.",
    captions: ["Massageador de pés EMS em uso ilustrativo.", "Detalhe do controle e dos comandos.", "Infográfico com modos apresentados no anúncio.", "Vista do aparelho e da superfície de contato."]
  }),
  "apoio-ergonomico-braco-kit-2-pecas": criarHistoriaProdutoReferencia({
    kicker: "Apoio ergonômico para braço · kit com 2 peças",
    title: "Confira o par de apoios e o formato",
    intro: "Veja as duas peças e exemplos de posicionamento em uma cadeira. Verifique dimensões, fixação e compatibilidade com o móvel.",
    featuresIntro: "O kit é apresentado com dois apoios. Confira os pontos de fixação e a quantidade de peças incluídas.",
    points: [
      ["Kit com duas peças", "Confirme se o conjunto contém o par."],
      ["Formato de apoio", "Compare o comprimento e a largura com os braços da cadeira."],
      ["Fixação e materiais", "Consulte como instalar e limpar cada peça."]
    ],
    beforeText: "Confira dimensões, distância entre apoios, forma de fixação e compatibilidade com sua cadeira.",
    packageText: "Verifique a quantidade de peças e os acessórios de instalação incluídos.",
    disclaimer: "Acessório de conforto para cadeira; não substitui avaliação profissional.",
    captions: ["Par de apoios ergonômicos para braço.", "Exemplo ilustrativo de posicionamento em cadeira.", "Vista lateral de um dos apoios instalados.", "Detalhe do formato e do acabamento do kit."]
  }),
  "apoio-ergonomico-para-os-pes": criarHistoriaProdutoReferencia({
    kicker: "Apoio ergonômico para os pés",
    title: "Conheça a superfície e o formato do apoio",
    intro: "Confira a superfície e as dimensões do apoio para os pés. Verifique altura, material e estabilidade no local em que pretende usar.",
    featuresIntro: "As imagens mostram o produto em diferentes ângulos e em exemplos de uso. Confirme o material e a versão disponível.",
    points: [
      ["Superfície de apoio", "Observe o formato e a textura apresentados."],
      ["Altura e dimensões", "Confira as medidas para o espaço de uso."],
      ["Material e limpeza", "Consulte a composição e os cuidados indicados."]
    ],
    beforeText: "Compare as dimensões com o espaço de uso e confirme material, estabilidade e cuidados de limpeza.",
    packageText: "Verifique se a embalagem contém somente o apoio ou inclui acessórios.",
    disclaimer: "Acessório de conforto; não é tratamento para dores ou condições de saúde.",
    captions: ["Vista principal do apoio ergonômico para os pés.", "Exemplo ilustrativo de posicionamento dos pés.", "Vista lateral para observar a altura do apoio.", "Detalhe da superfície; confirme material e acabamento."]
  }),
  "cinta-gestante-suporte-lombar": criarHistoriaProdutoReferencia({
    kicker: "Cinta de suporte para gestantes",
    title: "Confira o ajuste e a tabela de tamanhos",
    intro: "Veja a cinta em diferentes vistas e exemplos de ajuste. Consulte a tabela de medidas e converse com um profissional de saúde sobre a adequação durante a gestação.",
    featuresIntro: "O modelo é apresentado como cinta de suporte. Ajuste, conforto e indicação dependem da pessoa e do estágio da gestação.",
    points: [
      ["Tamanhos disponíveis", "Compare suas medidas com a tabela do produto."],
      ["Ajuste da cinta", "Verifique fechos e regulagens da versão."],
      ["Materiais", "Consulte composição e instruções de lavagem."]
    ],
    beforeText: "Confirme medidas, ajuste, materiais e modo de uso. Busque orientação profissional antes de usar durante a gestação.",
    packageText: "Verifique o tamanho escolhido e se a embalagem inclui uma ou mais peças.",
    disclaimer: "Acessório de suporte; não substitui acompanhamento pré-natal nem orientação de profissional de saúde.",
    captions: ["Cinta gestante em uso ilustrativo.", "Vista da cinta e das áreas de ajuste.", "Exemplo de posicionamento; siga as orientações de um profissional.", "Detalhe do fecho e do acabamento; confirme o tamanho."]
  }),
  "joelheira-ortopedica-articulada-anel-patelar": criarHistoriaProdutoReferencia({
    kicker: "Joelheira articulada com anel patelar",
    title: "Veja o formato e os ajustes da joelheira",
    intro: "Confira a joelheira em diferentes ângulos e observe as articulações e tiras. Verifique tamanhos e adequação com um profissional antes de escolher.",
    featuresIntro: "A galeria apresenta uma joelheira articulada com abertura patelar. Confirme as regulagens e o ajuste da versão disponível.",
    points: [
      ["Articulações laterais", "Consulte o funcionamento e os limites de movimento."],
      ["Ajuste por tamanho", "Compare a tabela de medidas antes da compra."],
      ["Materiais e cuidados", "Verifique composição, lavagem e instruções de uso."]
    ],
    beforeText: "Confirme tamanho, ajuste, articuladores, garantia e instruções. Procure orientação profissional sobre a adequação do modelo.",
    packageText: "Verifique se o produto é vendido individualmente ou em par e quais acessórios acompanham.",
    disclaimer: "A joelheira não substitui diagnóstico ou tratamento. Procure orientação de profissional habilitado, especialmente após lesões ou cirurgias.",
    captions: ["Vista da joelheira articulada e da embalagem.", "Detalhe das articulações e das tiras de ajuste.", "Vista lateral do modelo.", "Exemplo ilustrativo de uso; confira o tamanho adequado."]
  }),
  "almofada-ergonomica-apoio-descanso": criarHistoriaProdutoReferencia({
    kicker: "Almofada em formato cunha",
    title: "Veja as posições e os detalhes da almofada",
    intro: "Confira o formato da almofada e as posições ilustradas. Consulte dimensões, material e opções de ajuste da versão disponível.",
    featuresIntro: "A galeria mostra a almofada em uso e diferentes ângulos. As posições são demonstrativas; escolha com base nas medidas e no conforto desejado.",
    points: [
      ["Formato cunha", "Observe o contorno e as superfícies de apoio."],
      ["Posições ilustradas", "Confira as formas de posicionamento apresentadas."],
      ["Materiais e ajuste", "Consulte dimensões, capa, preenchimento e ajustes."]
    ],
    beforeText: "Confirme dimensões, materiais, capa, opções de ajuste e cuidados de limpeza antes da compra.",
    packageText: "Verifique se o conjunto inclui apenas a almofada ou outros acessórios.",
    disclaimer: "Almofada de conforto; não substitui avaliação, diagnóstico ou tratamento profissional.",
    captions: ["Vista principal da almofada em formato cunha.", "Exemplo ilustrativo de uso a dois.", "Detalhe do formato e da superfície.", "Vista adicional da almofada; confirme materiais e dimensões."]
  }),
  "travesseiro-derila-ergo": criarHistoriaProdutoReferencia({
    kicker: "Travesseiro Derila Ergo · 1 unidade",
    title: "Conheça o formato e os detalhes do travesseiro",
    intro: "Confira as imagens do travesseiro e consulte medidas, material e cuidados da versão disponível. O conforto e a adaptação variam de pessoa para pessoa.",
    featuresIntro: "O modelo é apresentado com formato anatômico. Verifique dimensões, composição e se a capa pode ser removida para lavagem.",
    points: [
      ["Formato anatômico", "Observe o contorno e as áreas de apoio."],
      ["Medidas", "Confirme largura, comprimento e altura."],
      ["Materiais e capa", "Consulte composição e instruções de limpeza."]
    ],
    beforeText: "Verifique dimensões, composição, capa, política de troca e condições de entrega com a loja.",
    packageText: "Esta opção corresponde a uma unidade. Confirme se a capa ou outros itens estão incluídos.",
    disclaimer: "Travesseiro de conforto; não trata ronco, dores ou condições clínicas. Procure orientação profissional para sintomas persistentes.",
    captions: ["Travesseiro Derila Ergo apresentado com a embalagem.", "Vista do formato anatômico do travesseiro.", "Detalhe da superfície e do material.", "Exemplo ilustrativo de uso; consulte as medidas."]
  }),
  "almofada-termica-pescoco": criarHistoriaProdutoReferencia({
    kicker: "Almofada térmica USB para pescoço e ombros",
    title: "Aquecimento ajustável para momentos de conforto",
    intro: "Veja a almofada em diferentes ângulos e exemplos de uso. O modelo oferece três níveis indicados de aquecimento: 35 °C, 45 °C e 55 °C.",
    featuresIntro: "A almofada é alimentada por USB e precisa permanecer conectada a uma fonte de 5 V/2 A. O adaptador de tomada e o power bank são vendidos separadamente.",
    points: [
      ["Três níveis de aquecimento", "As temperaturas indicadas são 35 °C, 45 °C e 55 °C; comece no nível mais baixo."],
      ["Alimentação USB", "Use uma saída compatível de 5 V/2 A. Algumas portas USB podem fornecer potência insuficiente."],
      ["Formato tipo xale", "A peça cobre a região do pescoço e dos ombros; não dobre a área aquecida."]
    ],
    beforeText: "Confirme o conteúdo da embalagem e use uma fonte USB compatível. Use acordado, observe a pele e desconecte ao terminar. Não durma com a almofada ligada.",
    packageText: "O conjunto inclui a almofada e o cabo USB. Adaptador de tomada e power bank são vendidos separadamente.",
    disclaimer: "Produto de aquecimento para conforto, não dispositivo médico. Siga as instruções do fabricante, interrompa o uso se sentir ardência ou desconforto e procure orientação profissional para dores persistentes.",
    captions: ["Vista frontal da almofada térmica para pescoço.", "Exemplo ilustrativo de uso da almofada.", "Detalhe do tecido, do formato e do controle.", "Exemplo ilustrativo da área de aquecimento nos ombros."]
  }),
  "touca-termica-gel": criarHistoriaProdutoReferencia({
    kicker: "Touca térmica reutilizável com gel",
    title: "Compressa fria ou morna para momentos de descanso",
    intro: "A touca elástica envolve a testa, as têmporas e os olhos e pode ser usada fria ou morna. Confira as cinco fotos do produto e leia os cuidados antes do uso.",
    featuresIntro: "Para uso frio, refrigere conforme as instruções. Para uso morno, aqueça por intervalos curtos, distribua o calor com as mãos e teste a temperatura na pele antes de vestir.",
    points: [
      ["Uso frio ou morno", "Pode ser resfriada na geladeira ou aquecida cuidadosamente no micro-ondas."],
      ["Ajuste elástico", "O formato veste a cabeça e pode cobrir os olhos."],
      ["Gel reutilizável", "Inspecione o produto antes do uso e não utilize se houver vazamento."]
    ],
    beforeText: "Siga as instruções do fabricante para resfriar ou aquecer. Teste a temperatura na mão antes de vestir, não use por períodos prolongados nem durma com a touca.",
    packageText: "O anúncio apresenta uma touca térmica. Confirme materiais, dimensões e conteúdo da embalagem com a loja.",
    disclaimer: "Compressa térmica para conforto, não tratamento para enxaqueca ou dor de cabeça. Evite temperaturas extremas e interrompa o uso se houver irritação ou desconforto. Pessoas com sensibilidade reduzida devem consultar um profissional de saúde.",
    captions: ["Vista da touca térmica com gel.", "Exemplo ilustrativo da touca sendo usada sobre os olhos.", "Uso ilustrativo durante um momento de descanso.", "Detalhe do formato e das áreas de cobertura."]
  })
};

[...PRODUTOS_LIVRECONFORTO, ...PRODUTOS_ORTOPEDICOS_REFERENCIA].forEach((item) => {
  REFERENCE_PRODUCT_STORIES[item.id] = criarHistoriaProdutoReferencia({
    kicker: item.categoria,
    title: "Conheça os detalhes deste modelo",
    intro: `Confira as fotos e as informações de ${item.nome}. ${item.descricao}`,
    featuresIntro: "Observe o formato, os materiais e os acessórios apresentados nas imagens. A configuração pode variar conforme a versão disponível.",
    points: [
      ["Formato e acabamento", "Confira as fotos e confirme cores, medidas e materiais da unidade disponível."],
      ["Especificações", "Consulte alimentação, acessórios e características do modelo com a loja."],
      ["Uso e conservação", "Leia as instruções do fabricante e interrompa o uso se sentir desconforto."]
    ],
    beforeText: "Antes de escolher, confirme as dimensões, a composição, a compatibilidade e os cuidados de uso ou limpeza.",
    packageText: "Verifique com a loja quais itens, acessórios e instruções acompanham a versão que será enviada.",
    disclaimer: item.categoria === "Beleza e estética"
      ? "Este produto não substitui orientação dermatológica ou tratamento profissional. Siga as instruções do fabricante e interrompa o uso se houver irritação ou desconforto."
      : item.categoria === "Cuidados para os pés"
        ? "Este produto não substitui avaliação, diagnóstico ou tratamento profissional. Confirme se o uso é adequado para você com um profissional habilitado."
        : item.categoria === "Joelheiras"
          ? "Órtese para uso ortopédico. Ajustes e período de utilização devem seguir orientação de profissional de saúde; não substitui avaliação ou tratamento."
          : item.categoria === "Cadeiras de rodas"
            ? "Equipamento de mobilidade. A configuração deve ser adequada ao usuário por profissional habilitado. Confirme medidas, capacidade, acessórios e condições de entrega antes de comprar."
        : "Produto de conforto; não substitui avaliação, diagnóstico ou tratamento profissional. Consulte as instruções do fabricante.",
    captions: [
      `Vista principal de ${item.nome}.`,
      `Detalhe de ${item.nome}; confira medidas e acabamento com a loja.`,
      "Imagem demonstrativa. Consulte as instruções do fabricante.",
      "Confira a versão e os itens inclusos antes da compra."
    ]
  });
});

const $ = (seletor) => document.querySelector(seletor);

function atribuirImagem(imagem, origem, alternativa = "imagens/logo-pc-horizontal.png") {
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

  $("#productPixNote").textContent = "Pagamento via PIX no checkout da loja.";
  const precoPix = Number(produto.precoPix);
  if (Number.isFinite(precoPix) && precoPix > 0 && precoPix < Number(produto.preco)) {
    $("#productPixNote").textContent = `${dinheiro(precoPix)} no PIX`;
  }
}

function renderizarAvaliacoes() {
  const avaliacoes = (Array.isArray(produto.avaliacoes) ? produto.avaliacoes : [])
    .filter((item) => item && typeof item === "object" && Number.isFinite(Number(item.nota))
      && Number(item.nota) >= 1 && Number(item.nota) <= 5);
  const avaliacaoContato = `Olá! Gostaria de enviar uma avaliação sobre o produto ${produto.nome}.`;
  $("#productReviewContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(avaliacaoContato)}`;

  if (!avaliacoes.length) {
    if ([
      "massageador-ortopedico-joelhos-4-em-1",
      "travesseiro-cervical-ergonomico-5-em-1",
      ...Object.keys(REFERENCE_PRODUCT_STORIES)
    ].includes(produto.id)) {
      $("#productReviews").hidden = false;
      $("#productReviewEmpty").hidden = false;
      $("#productReviewsSummary").textContent = "Sua opinião ajuda outros clientes.";
    }
    return;
  }

  const quantidade = avaliacoes.length;
  const media = avaliacoes.reduce((soma, avaliacao) => soma + Number(avaliacao.nota), 0) / quantidade;
  $("#productRating").hidden = false;
  $("#productRatingStars").textContent = "★★★★★";
  $("#productRatingValue").textContent = media.toFixed(1);
  $("#productRatingCount").textContent = `(${quantidade} ${quantidade === 1 ? "avaliação" : "avaliações"})`;
  $("#productReviews").hidden = false;
  $("#productReviewsSummary").textContent = `${media.toFixed(1)} de 5 · ${quantidade} ${quantidade === 1 ? "avaliação" : "avaliações"}`;
  $("#productReviewsOverview").hidden = false;
  $("#productReviewsAverage").textContent = media.toFixed(1);
  $("#productReviewsStars").textContent = "★★★★★";
  $("#productReviewsStars").setAttribute("aria-label", `${media.toFixed(1)} de 5 estrelas`);
  $("#productReviewsCount").textContent = `${quantidade} ${quantidade === 1 ? "avaliação" : "avaliações"}`;
  const distribuicao = $("#productReviewsDistribution");
  distribuicao.replaceChildren();
  for (let nota = 5; nota >= 1; nota -= 1) {
    const contagem = avaliacoes.filter((avaliacao) => Math.round(Number(avaliacao.nota)) === nota).length;
    const linha = document.createElement("div");
    linha.className = "product-review-distribution-row";
    const rotulo = document.createElement("span");
    rotulo.textContent = String(nota);
    const barra = document.createElement("span");
    barra.className = "product-review-distribution-track";
    const preenchimento = document.createElement("span");
    preenchimento.style.width = `${(contagem / quantidade) * 100}%`;
    barra.append(preenchimento);
    const total = document.createElement("small");
    total.textContent = String(contagem);
    linha.append(rotulo, barra, total);
    distribuicao.append(linha);
  }
  $("#productReviewEmpty").hidden = true;

  const grade = $("#productReviewGrid");
  grade.replaceChildren();
  avaliacoes.slice(0, 8).forEach((avaliacao) => {
    if (!avaliacao || typeof avaliacao !== "object") return;
    const card = document.createElement("article");
    card.className = "product-review-card";
    const estrelas = document.createElement("div");
    estrelas.className = "product-review-stars";
    estrelas.textContent = "★".repeat(Math.round(Number(avaliacao.nota)));
    const autor = document.createElement("strong");
    autor.textContent = String(avaliacao.nome || "Cliente");
    const texto = document.createElement("p");
    texto.textContent = String(avaliacao.comentario || "");
    card.append(estrelas, autor, texto);
    grade.append(card);
  });
}

function renderizarGaleriaEditorial(prefixo = "productStory", imagens = PRODUCT_STORY_IMAGES) {
  let indiceAtual = 0;
  const imagem = $(`#${prefixo}Image`);
  const legenda = $(`#${prefixo}GalleryCaption`);
  const contador = $(`#${prefixo}GalleryCount`);
  const pontos = $(`#${prefixo}GalleryDots`);

  const mostrarImagem = (indice) => {
    indiceAtual = (indice + imagens.length) % imagens.length;
    const item = imagens[indiceAtual];
    imagem.src = item.src;
    imagem.alt = item.alt;
    legenda.textContent = item.caption;
    contador.textContent = `${indiceAtual + 1} / ${imagens.length}`;
    pontos.querySelectorAll("button").forEach((botao, posicao) => {
      const ativo = posicao === indiceAtual;
      botao.classList.toggle("ativo", ativo);
      botao.setAttribute("aria-current", String(ativo));
      botao.setAttribute("aria-label", `Ver imagem ${posicao + 1}: ${imagens[posicao].alt}`);
    });
  };

  pontos.replaceChildren();
  imagens.forEach((item, indice) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "product-story-gallery-dot";
    botao.addEventListener("click", () => mostrarImagem(indice));
    pontos.append(botao);
  });
  $(`#${prefixo}Previous`).addEventListener("click", () => mostrarImagem(indiceAtual - 1));
  $(`#${prefixo}Next`).addEventListener("click", () => mostrarImagem(indiceAtual + 1));
  mostrarImagem(0);
}

function renderizarHistoriaProdutoReferencia() {
  const historia = REFERENCE_PRODUCT_STORIES[produto.id];
  const secao = $("#referenceProductStory");
  secao.hidden = !historia;
  if (!historia) return;

  const imagens = [produto.imagem, ...(Array.isArray(produto.imagens) ? produto.imagens : [])]
    .filter((src, indice, todas) => typeof src === "string" && src.trim() && todas.indexOf(src) === indice)
    .slice(0, 4)
    .map((src, indice) => ({
      src,
      alt: `${produto.nome} · ${indice === 0 ? "vista principal" : `detalhe ${indice}`}`,
      caption: historia.captions[indice] || `Vista ${indice + 1} do produto. Confirme os detalhes com a loja.`
    }));
  if (!imagens.length) throw new Error(`A galeria editorial de ${produto.id} não tem imagens.`);

  $("#referenceProductStoryKicker").textContent = historia.kicker;
  $("#referenceProductStoryTitle").textContent = historia.title;
  $("#referenceProductStoryIntro").textContent = historia.intro;
  $("#referenceProductStoryGallery").setAttribute("aria-label", `Galeria de imagens de ${produto.nome}`);
  $("#referenceProductStoryGalleryNote").textContent = "Imagens ilustrativas. Confirme detalhes, acessórios e versão disponível com a loja.";
  $("#referenceProductStoryFeaturesTitle").textContent = historia.featuresTitle;
  $("#referenceProductStoryFeaturesIntro").textContent = historia.featuresIntro;
  $("#referenceProductStoryBeforeTitle").textContent = historia.beforeTitle;
  $("#referenceProductStoryBeforeText").textContent = historia.beforeText;
  $("#referenceProductStoryPackageTitle").textContent = historia.packageTitle;
  $("#referenceProductStoryPackageText").textContent = historia.packageText;
  $("#referenceProductStoryDisclaimer").textContent = historia.disclaimer;

  const lista = $("#referenceProductStoryFeatureList");
  lista.replaceChildren();
  historia.points.forEach(([titulo, detalhe], indice) => {
    const item = document.createElement("li");
    const numero = document.createElement("span");
    const texto = document.createElement("div");
    const nome = document.createElement("strong");
    const descricao = document.createElement("small");
    numero.setAttribute("aria-hidden", "true");
    numero.textContent = String(indice + 1).padStart(2, "0");
    nome.textContent = titulo;
    descricao.textContent = detalhe;
    texto.append(nome, descricao);
    item.append(numero, texto);
    lista.append(item);
  });

  const mensagemDetalhes = `Olá! Gostaria de confirmar detalhes e conteúdo da embalagem do produto: ${produto.nome}.`;
  $("#referenceProductStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
  renderizarGaleriaEditorial("referenceProductStory", imagens);
}

function iniciarConsultaEntrega() {
  const formulario = $("#productDeliveryForm");
  const campoCep = $("#productZipCode");
  campoCep.addEventListener("input", () => {
    const numeros = campoCep.value.replace(/\D/g, "").slice(0, 8);
    campoCep.value = numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
  });
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const cep = campoCep.value.replace(/\D/g, "");
    const feedback = $("#productDeliveryFeedback");
    if (cep.length !== 8) {
      feedback.textContent = "Digite um CEP válido com 8 números.";
      campoCep.focus();
      return;
    }
    const mensagem = `Olá! Gostaria de consultar prazo e valor de entrega para o CEP ${cep}. Produto: ${produto.nome}.`;
    window.open(`https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
    feedback.textContent = "Abrimos uma conversa para a loja confirmar o prazo e o frete.";
  });
}

function consultarDisponibilidade() {
  const mensagem = `Olá! Gostaria de consultar a disponibilidade do produto: ${produto.nome}.`;
  window.open(`https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
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
  $("#productGalleryNote").hidden = !produto.imagensIlustrativas;

  atribuirImagem($("#productMainImage"), fotos[0] || produto.imagem);
  $("#productMainImage").alt = `Foto principal · ${produto.nome}`;
  miniaturas.hidden = fotos.length < 2;

  fotos.forEach((foto, indice) => {
    const botao = document.createElement("button");
    const imagem = document.createElement("img");
    botao.type = "button";
    botao.className = `product-thumbnail${indice === 0 ? " ativa" : ""}`;
    botao.setAttribute("aria-label", `Ver ${produto.imagensIlustrativas && indice > 0 ? "imagem ilustrativa" : "foto"} ${indice + 1} de ${fotos.length}`);
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
  document.querySelector("#productImageNote").hidden = !produto.imagemPendente;
  const temPreco = produtoTemPreco(produto);
  $("#productPrice").textContent = temPreco ? dinheiro(produto.preco) : "Consulte o preço";
  $("#productPrice").classList.toggle("preco-consulta", !temPreco);
  $("#productOldPrice").textContent = produto.antigo ? dinheiro(produto.antigo) : "";
  $("#productOldPrice").hidden = !temPreco || !produto.antigo;
  const percentualDesconto = Number(produto.antigo) > Number(produto.preco)
    ? Math.round((1 - Number(produto.preco) / Number(produto.antigo)) * 100)
    : 0;
  $("#productDiscount").hidden = percentualDesconto <= 0;
  $("#productDiscount").textContent = percentualDesconto > 0 ? `-${percentualDesconto}%` : "";
  montarEspecificacoesProduto();
  renderizarAvaliacoes();
  iniciarConsultaEntrega();
  $("#productStock").textContent = produto.estoque > 0
    ? `${produto.estoque} unidade(s) disponível(is)`
    : "Disponibilidade sob consulta";
  $("#productStock").classList.toggle("indisponivel", produto.estoque <= 0);
  $("#productQuantity").max = String(Math.max(1, Number(produto.estoque) || 1));
  $("#productQuantity").disabled = produto.estoque <= 0 || !temPreco;
  $("#quantityMinus").disabled = produto.estoque <= 0 || !temPreco;
  $("#quantityPlus").disabled = produto.estoque <= 0 || !temPreco;
  $("#productAddButton").disabled = !temPreco;
  $("#productAddButton").textContent = !temPreco
    ? "Consulte o preço"
    : produto.estoque > 0 ? "Adicionar ao carrinho" : "Consultar disponibilidade";
  $("#productStockWarning").hidden = temPreco;
  if (!temPreco) $("#productStockWarning").textContent = "O preço deste produto ainda precisa ser confirmado. Fale com a loja antes de comprar.";
  $("#productPurchaseCheck").textContent = produto.sku
    ? "Confirme cor, lente, tamanho e disponibilidade com a loja."
    : "Confirme detalhes, medidas, preço e disponibilidade com a loja.";

  const contato = `Olá! Tenho interesse no produto: ${produto.nome}`;
  const linkWhatsApp = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(contato)}`;
  $("#productContactLink").href = linkWhatsApp;
  const exibirDetalhesMassageador = produto.id === "massageador-ortopedico-joelhos-4-em-1";
  const exibirDetalhesTravesseiro = produto.id === "travesseiro-cervical-ergonomico-5-em-1";
  $("#productStory").hidden = !exibirDetalhesMassageador;
  $("#productPillowStory").hidden = !exibirDetalhesTravesseiro;
  const exibirDetalhesAlmofada = produto.id === "almofada-ortopedica-massageadora-para-coccix-e-coluna";
  $("#productCoccyxStory").hidden = !exibirDetalhesAlmofada;
  const exibirDetalhesJoelheira = produto.id === "joelheira-de-suporte-fitness";
  $("#kneeSupportStory").hidden = !exibirDetalhesJoelheira;
  const exibirDetalhesAlmofadaDobrável = produto.id === "almofada-funcional-dobravel-com-amarras";
  $("#foldingCushionStory").hidden = !exibirDetalhesAlmofadaDobrável;
  const exibirDetalhesColeteLombar = produto.id === "colete-ortopedico-lombar";
  $("#lumbarSupportStory").hidden = !exibirDetalhesColeteLombar;
  const exibirDetalhesInfravermelho = produto.id === "aparelho-infravermelho-relaxamento-muscular";
  $("#infraredLampStory").hidden = !exibirDetalhesInfravermelho;
  if (exibirDetalhesMassageador) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar as especificações e o conteúdo da embalagem do produto: ${produto.nome}.`;
    $("#productStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial();
  }
  if (exibirDetalhesTravesseiro) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar composição, medidas e conteúdo da embalagem do produto: ${produto.nome}.`;
    $("#pillowStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("pillowStory", PILLOW_STORY_IMAGES);
  }
  if (exibirDetalhesAlmofada) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar as funções, medidas e conteúdo da embalagem do produto: ${produto.nome}.`;
    $("#coccyxStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("coccyxStory", COCCYX_STORY_IMAGES);
  }
  if (exibirDetalhesJoelheira) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar tamanho, composição e conteúdo da embalagem do produto: ${produto.nome}.`;
    $("#kneeSupportStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("kneeSupportStory", KNEE_SUPPORT_STORY_IMAGES);
  }
  if (exibirDetalhesAlmofadaDobrável) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar medidas, cores e conteúdo da embalagem do produto: ${produto.nome}.`;
    $("#foldingCushionStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("foldingCushionStory", FOLDING_CUSHION_STORY_IMAGES);
  }
  if (exibirDetalhesColeteLombar) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar tamanho, medidas, materiais e orientações de uso do produto: ${produto.nome}.`;
    $("#lumbarSupportStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("lumbarSupportStory", LUMBAR_SUPPORT_STORY_IMAGES);
  }
  if (exibirDetalhesInfravermelho) {
    const mensagemDetalhes = `Olá! Gostaria de confirmar as especificações, a alimentação e os cuidados de uso do produto: ${produto.nome}.`;
    $("#infraredLampStoryContact").href = `https://wa.me/${loja.loja.whatsapp}?text=${encodeURIComponent(mensagemDetalhes)}`;
    renderizarGaleriaEditorial("infraredLampStory", INFRARED_LAMP_STORY_IMAGES);
  }
  renderizarHistoriaProdutoReferencia();
  document.title = `${produto.nome} · ${nomeLoja}`;
  document.querySelector('meta[name="description"]').content = produto.descricao;
  const urlProduto = new URL(`/produto.html?id=${encodeURIComponent(produto.id)}`, "https://pcalmofadasexclusivas.online");
  document.getElementById("productCanonical").href = urlProduto.href;
  document.getElementById("productOgUrl").content = urlProduto.href;
  document.getElementById("productOgTitle").content = document.title;
  document.getElementById("productOgDescription").content = produto.descricao;
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
  if (Number(produto.estoque) <= 0) {
    consultarDisponibilidade();
    return;
  }
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
