const BASE_URL = "https://wgalmeida.com.br";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-home-1200x630.jpg`;

const defaultConfig = {
  title: "Grupo WG Almeida | Arquitetura, Engenharia, Marcenaria, Easy Locker e WG.BuildTech",
  description:
    "Grupo WG Almeida integra arquitetura, engenharia, marcenaria, Easy Locker e WG.BuildTech em um ecossistema de execucao, tecnologia e solucoes de alto padrao.",
  canonical: `${BASE_URL}/`,
  og: {
    title: "Grupo WG Almeida | Arquitetura, Engenharia, Marcenaria, Easy Locker e WG.BuildTech",
    description:
      "Grupo WG Almeida integra arquitetura, engenharia, marcenaria, Easy Locker e WG.BuildTech em um ecossistema de execucao, tecnologia e solucoes de alto padrao.",
    image: DEFAULT_OG_IMAGE,
    url: `${BASE_URL}/`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Grupo WG Almeida | Arquitetura, Engenharia, Marcenaria, Easy Locker e WG.BuildTech",
    description:
      "Grupo WG Almeida integra arquitetura, engenharia, marcenaria, Easy Locker e WG.BuildTech em um ecossistema de execucao, tecnologia e solucoes de alto padrao.",
    image: DEFAULT_OG_IMAGE,
  },
};

function page(path, title, description, image = DEFAULT_OG_IMAGE) {
  const canonical = `${BASE_URL}${path}`;
  return {
    title,
    description,
    canonical,
    og: { title, description, image, url: canonical },
    twitter: { card: "summary_large_image", title, description, image },
  };
}

export const SEO_CONFIG = {
  "/": defaultConfig,
  "/sobre": page(
    "/sobre",
    "Grupo WG Almeida: 14 Anos Entregando Arquitetura, Engenharia e Marcenaria em SP",
    "Conheça a metodologia Turn Key do Grupo WG Almeida — projeto, obra e marcenaria integrados, sem ruído operacional. Atendemos residências e corporativos de alto padrão em São Paulo.",
    `${BASE_URL}/og-sobre-1200x630.jpg`
  ),
  "/a-marca": page(
    "/a-marca",
    "A Marca | Grupo WG Almeida",
    "Identidade e posicionamento do Grupo WG Almeida.",
    `${BASE_URL}/og-sobre-1200x630.jpg`
  ),
  "/arquitetura": page(
    "/arquitetura",
    "Arquitetura Residencial e Corporativa em Sao Paulo | Grupo WG Almeida",
    "Projetos de arquitetura residencial e corporativa em Sao Paulo com conceito autoral, detalhamento tecnico e entrega integrada.",
    `${BASE_URL}/og-arquitetura-1200x630.jpg`
  ),
  "/engenharia": page(
    "/engenharia",
    "Engenharia e Gerenciamento de Obras em Sao Paulo | Turn Key WG Almeida",
    "Engenharia com planejamento, compatibilizacao e gerenciamento de obras em Sao Paulo para reduzir atrasos, retrabalho e risco de custo.",
    `${BASE_URL}/og-engenharia-1200x630.jpg`
  ),
  "/marcenaria": page(
    "/marcenaria",
    "Marcenaria Sob Medida e Moveis Planejados em Sao Paulo | Grupo WG Almeida",
    "Marcenaria sob medida e moveis planejados com projeto tecnico, acabamento premium e instalacao integrada para residencias e corporativo.",
    `${BASE_URL}/og-marcenaria-1200x630.jpg`
  ),
  "/projetos": page(
    "/projetos",
    "Projetos de Arquitetura e Reformas em Sao Paulo | Portfolio WG Almeida",
    "Veja projetos residenciais e corporativos executados pela WG Almeida em Sao Paulo, com arquitetura autoral, engenharia e marcenaria integradas.",
    `${BASE_URL}/og-projetos-1200x630.jpg`
  ),
  "/processo": page(
    "/processo",
    "Processo | Grupo WG Almeida",
    "Conheca o processo integrado do Grupo WG Almeida.",
    `${BASE_URL}/og-processo-1200x630.jpg`
  ),
  "/depoimentos": page(
    "/depoimentos",
    "Depoimentos | Grupo WG Almeida",
    "Avaliacoes e resultados de clientes do Grupo WG Almeida.",
    `${BASE_URL}/og-sobre-1200x630.jpg`
  ),
  "/contato": page(
    "/contato",
    "Contato WG Almeida | Solicite Orcamento de Arquitetura e Reforma",
    "Fale com a equipe WG Almeida para solicitar orcamento de arquitetura, engenharia e marcenaria em Sao Paulo.",
    `${BASE_URL}/og-home-1200x630.jpg`
  ),
  "/store": page(
    "/store",
    "Loja de Decoracao e Design Premium | Grupo WG Almeida",
    "Compre produtos de decoracao e design premium com curadoria WG Almeida para ambientes residenciais e corporativos.",
    `${BASE_URL}/og-loja-1200x630.jpg`
  ),
  "/blog": page(
    "/blog",
    "Blog | Grupo WG Almeida",
    "Conteudos sobre arquitetura, engenharia, marcenaria e obras.",
    `${BASE_URL}/og-home-1200x630.jpg`
  ),
  "/iccri": page(
    "/iccri",
    "ICCRI 2026 | Indice de Custo de Construcao e Reforma Inteligente",
    "Indice proprietario da WG Almeida para estimar custo de reforma por m2 com base em dados reais de obras e variacao de mercado.",
    `${BASE_URL}/og-engenharia-1200x630.jpg`
  ),
  "/iccri-para-imobiliarias": page(
    "/iccri-para-imobiliarias",
    "ICCRI para Imobiliarias, Corretores e Bancos | WG Almeida",
    "Use o ICCRI como referencia tecnica para precificacao, analise de viabilidade e apoio comercial no mercado imobiliario.",
    `${BASE_URL}/og-engenharia-1200x630.jpg`
  ),
  "/faq": page(
    "/faq",
    "FAQ | Grupo WG Almeida",
    "Perguntas frequentes sobre o processo e servicos."
  ),
  "/solicite-proposta": page(
    "/solicite-proposta",
    "Solicite Proposta | Grupo WG Almeida",
    "Solicite sua proposta para arquitetura, engenharia, marcenaria e sistema de experiencia visual aplicado a briefing, prevenda e execucao."
  ),
  "/obra-turn-key": page(
    "/obra-turn-key",
    "Obra Turn Key SP | Grupo WG Almeida",
    "Sistema Turn Key premium com projeto, execucao e entrega integrados."
  ),
  "/arquitetura-corporativa": page(
    "/arquitetura-corporativa",
    "Arquitetura Corporativa SP | Grupo WG Almeida",
    "Projetos corporativos e comerciais em Sao Paulo com metodo Turn Key."
  ),
  "/construtora-alto-padrao-sp": page(
    "/construtora-alto-padrao-sp",
    "Construtora Alto Padrao SP | Grupo WG Almeida",
    "Construtora e executora premium em Sao Paulo para obras de alto padrao."
  ),
  "/reforma-apartamento-sp": page(
    "/reforma-apartamento-sp",
    "Reforma de Apartamento SP | Grupo WG Almeida",
    "Reformas completas de apartamentos em Sao Paulo com execucao integrada."
  ),
  "/reforma-apartamento-itaim": page(
    "/reforma-apartamento-itaim",
    "Reforma Apartamento Itaim Bibi | Grupo WG Almeida",
    "Reforma premium de apartamentos no Itaim com projeto e obra integrados."
  ),
  "/buildtech": page(
    "/buildtech",
    "WG Build.tech | Consultoria de IA e Tecnologia para Construção",
    "Conheca a frente WG BuildTech para sistemas inteligentes, automacao e experiencia visual aplicada a construcao, retrofit e mercado imobiliario."
  ),
  "/easylocker": page(
    "/easylocker",
    "Easy Locker | Armários Inteligentes para Condomínios de Luxo",
    "A solução definitiva para gestão de encomendas. Armários inteligentes automatizados com a tecnologia do Grupo WG Almeida."
  ),
  "/obraeasy": page(
    "/obraeasy",
    "ObraEasy | Plataforma de Gestão de Obras com EVF e Cronograma",
    "Conheça o ObraEasy: plataforma para orçamento, EVF, cronograma, contratos e gestão financeira de obras para clientes, corretores e construtoras."
  ),
  "/easy-real-state": page(
    "/easy-real-state",
    "EasyRealState | Calculadora de Valor Imobiliário para Corretores",
    "Use o EasyRealState para ler valor de mercado com base real em São Paulo. AVM comercial, link compartilhável e trial assistido para corretores e imobiliárias."
  ),
  "/revista-estilos": page(
    "/revista-estilos",
    "Revista de Estilos | Descubra seu Estilo de Decoracao | WG Almeida",
    "Explore estilos de decoracao: Minimalismo, Classico, Moderno, Vintage, Tropical, Boho e mais. Descubra qual estilo combina com voce."
  ),
  "/moodboard": page(
    "/moodboard",
    "Moodboard | Sistema de Experiencia Visual | WG Almeida",
    "Organize estilo, referencias e decisoes visuais em uma jornada de alinhamento estetico pronta para briefing, proposta e projeto."
  ),
  "/moodboard-generator": page(
    "/moodboard-generator",
    "Gerador de Moodboard Profissional | WG Almeida",
    "Monte apresentacoes de moodboard e transforme referencias em uma experiencia visual clara para clientes, corretores e profissionais."
  ),
  "/room-visualizer": page(
    "/room-visualizer",
    "Visualizador de Ambientes com IA | WG Almeida",
    "Visualize cenarios de reforma com IA e use a leitura visual como apoio para alinhamento, proposta e proximo passo comercial."
  ),
};

export function getSEOConfig(pathname = "/") {
  return SEO_CONFIG[pathname] || page(pathname, defaultConfig.title, defaultConfig.description);
}

export default SEO_CONFIG;




