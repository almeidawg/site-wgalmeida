const BASE_URL = "https://wgalmeida.com.br";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-home-1200x630.jpg`;

const defaultConfig = {
  title: "Grupo WG Almeida | Arquitetura, Engenharia e Marcenaria",
  description:
    "Grupo WG Almeida: arquitetura, engenharia e marcenaria premium em Sao Paulo. Projetos autorais com execucao integrada.",
  canonical: `${BASE_URL}/`,
  og: {
    title: "Grupo WG Almeida | Arquitetura, Engenharia e Marcenaria",
    description:
      "Arquitetura, engenharia e marcenaria premium com gestao integrada.",
    image: DEFAULT_OG_IMAGE,
    url: `${BASE_URL}/`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Grupo WG Almeida | Arquitetura, Engenharia e Marcenaria",
    description:
      "Arquitetura, engenharia e marcenaria premium com gestao integrada.",
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
    "Sobre a WG Almeida: Arquitetura, Engenharia e Marcenaria em SP",
    "Conheca a historia, metodologia e equipe da WG Almeida para projetos e obras de alto padrao em Sao Paulo."
  ),
  "/a-marca": page(
    "/a-marca",
    "A Marca | Grupo WG Almeida",
    "Identidade e posicionamento do Grupo WG Almeida."
  ),
  "/arquitetura": page(
    "/arquitetura",
    "Arquitetura Residencial e Corporativa em Sao Paulo | Grupo WG Almeida",
    "Projetos de arquitetura residencial e corporativa em Sao Paulo com conceito autoral, detalhamento tecnico e entrega integrada."
  ),
  "/engenharia": page(
    "/engenharia",
    "Engenharia e Gerenciamento de Obras em Sao Paulo | Turn Key WG Almeida",
    "Engenharia com planejamento, compatibilizacao e gerenciamento de obras em Sao Paulo para reduzir atrasos, retrabalho e risco de custo."
  ),
  "/marcenaria": page(
    "/marcenaria",
    "Marcenaria Sob Medida e Moveis Planejados em Sao Paulo | Grupo WG Almeida",
    "Marcenaria sob medida e moveis planejados com projeto tecnico, acabamento premium e instalacao integrada para residencias e corporativo."
  ),
  "/projetos": page(
    "/projetos",
    "Projetos de Arquitetura e Reformas em Sao Paulo | Portfolio WG Almeida",
    "Veja projetos residenciais e corporativos executados pela WG Almeida em Sao Paulo, com arquitetura autoral, engenharia e marcenaria integradas."
  ),
  "/processo": page(
    "/processo",
    "Processo | Grupo WG Almeida",
    "Conheca o processo integrado do Grupo WG Almeida."
  ),
  "/depoimentos": page(
    "/depoimentos",
    "Depoimentos | Grupo WG Almeida",
    "Avaliacoes e resultados de clientes do Grupo WG Almeida."
  ),
  "/contato": page(
    "/contato",
    "Contato WG Almeida | Solicite Orcamento de Arquitetura e Reforma",
    "Fale com a equipe WG Almeida para solicitar orcamento de arquitetura, engenharia e marcenaria em Sao Paulo."
  ),
  "/store": page(
    "/store",
    "Loja de Decoracao e Design Premium | Grupo WG Almeida",
    "Compre produtos de decoracao e design premium com curadoria WG Almeida para ambientes residenciais e corporativos."
  ),
  "/blog": page(
    "/blog",
    "Blog | Grupo WG Almeida",
    "Conteudos sobre arquitetura, engenharia, marcenaria e obras."
  ),
  "/faq": page(
    "/faq",
    "FAQ | Grupo WG Almeida",
    "Perguntas frequentes sobre o processo e servicos."
  ),
  "/solicite-proposta": page(
    "/solicite-proposta",
    "Solicite Proposta | Grupo WG Almeida",
    "Solicite sua proposta para arquitetura, engenharia e marcenaria."
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
  "/revista-estilos": page(
    "/revista-estilos",
    "Revista de Estilos | Descubra seu Estilo de Decoracao | WG Almeida",
    "Explore estilos de decoracao: Minimalismo, Classico, Moderno, Vintage, Tropical, Boho e mais. Descubra qual estilo combina com voce."
  ),
  "/moodboard": page(
    "/moodboard",
    "Moodboard | Crie sua Visao de Design de Interiores | WG Almeida",
    "Crie seu moodboard de design de interiores. Selecione cores, estilos e referencias para visualizar sua visao de decoracao."
  ),
  "/moodboard-generator": page(
    "/moodboard-generator",
    "Gerador de Moodboard Profissional | WG Almeida",
    "Gere moodboards profissionais de design de interiores com imagens curadas por ambiente, material e paleta de cores."
  ),
  "/room-visualizer": page(
    "/room-visualizer",
    "Visualizador de Ambientes com IA | WG Almeida",
    "Visualize seu ambiente reformado com inteligencia artificial. Envie uma foto e veja o resultado com o estilo que voce escolheu."
  ),
};

export function getSEOConfig(pathname = "/") {
  return SEO_CONFIG[pathname] || page(pathname, defaultConfig.title, defaultConfig.description);
}

export default SEO_CONFIG;
