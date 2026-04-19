import { COMPANY } from './company';

const BASE_URL = "https://wgalmeida.com.br";
const ORG_ID = `${BASE_URL}/#organization`;
const PERSON_WILLIAM_ID = `${BASE_URL}/sobre#william-almeida`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const PROJECTS_SERIES_ID = `${BASE_URL}/projetos#creativework-series`;
const SERVICE_ARCH_ID = `${BASE_URL}/servicos/arquitetura#service`;
const SERVICE_ENG_ID = `${BASE_URL}/servicos/engenharia#service`;
const SERVICE_WOOD_ID = `${BASE_URL}/servicos/marcenaria#service`;
const SERVICE_TURNKEY_ID = `${BASE_URL}/servicos/turn-key#service`;
const SERVICE_EXPERIENCE_ID = `${BASE_URL}/servicos/experiencia-visual#service`;
const APP_BUILDTECH_ID = `${BASE_URL}/buildtech#softwareapplication`;
const APP_MOODBOARD_ID = `${BASE_URL}/moodboard-generator#softwareapplication`;
const APP_ROOM_ID = `${BASE_URL}/room-visualizer#softwareapplication`;

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

const service = (name, description, url) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  url,
  provider: {
    "@id": ORG_ID,
  },
  areaServed: {
    "@type": "City",
    name: "São Paulo",
  },
});

export const SCHEMAS = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Grupo WG Almeida",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo-96.webp`,
    email: COMPANY.email,
    telephone: COMPANY.phoneRaw,
    founder: { "@id": PERSON_WILLIAM_ID },
    hasPart: [{ "@id": APP_BUILDTECH_ID }, { "@id": APP_MOODBOARD_ID }, { "@id": APP_ROOM_ID }],
    makesOffer: [
      { "@id": SERVICE_ARCH_ID },
      { "@id": SERVICE_ENG_ID },
      { "@id": SERVICE_WOOD_ID },
      { "@id": SERVICE_TURNKEY_ID },
      { "@id": SERVICE_EXPERIENCE_ID },
    ],
  },

  personWilliam: {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_WILLIAM_ID,
    name: "William Almeida",
    jobTitle: "CEO e Diretor de Arquitetura",
    url: `${BASE_URL}/sobre`,
    worksFor: { "@id": ORG_ID },
    knowsAbout: [
      "Arquitetura de alto padrao",
      "Arquitetura de alto padrão",
      "Engenharia de obras",
      "Marcenaria sob medida",
      "Gestão de obras turn key",
      "Tecnologia aplicada à construção",
    ],
  },

  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BASE_URL,
    name: "Grupo WG Almeida",
    publisher: { "@id": ORG_ID },
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/blog?busca={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },

  softwareBuildTech: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_BUILDTECH_ID,
    name: "WG BuildTech",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}/buildtech`,
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=buildtech`,
    },
  },

  softwareMoodboard: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_MOODBOARD_ID,
    name: "WG Moodboard Generator",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}/moodboard-generator`,
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard`,
    },
  },

  softwareRoomVisualizer: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_ROOM_ID,
    name: "WG Room Visualizer",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}/room-visualizer`,
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=room`,
    },
  },

  knowledgeGraph: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Grupo WG Almeida",
        url: BASE_URL,
        logo: `${BASE_URL}/images/logo-96.webp`,
        email: COMPANY.email,
        telephone: COMPANY.phoneRaw,
        areaServed: { "@type": "City", name: "São Paulo" },
        founder: { "@id": PERSON_WILLIAM_ID },
        hasPart: [{ "@id": APP_BUILDTECH_ID }, { "@id": APP_MOODBOARD_ID }, { "@id": APP_ROOM_ID }],
        makesOffer: [
          { "@id": SERVICE_ARCH_ID },
          { "@id": SERVICE_ENG_ID },
          { "@id": SERVICE_WOOD_ID },
          { "@id": SERVICE_TURNKEY_ID },
          { "@id": SERVICE_EXPERIENCE_ID },
        ],
      },
      {
        "@type": "Person",
        "@id": PERSON_WILLIAM_ID,
        name: "William Almeida",
        jobTitle: "CEO e Diretor de Arquitetura",
        url: `${BASE_URL}/sobre`,
        worksFor: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_ARCH_ID,
        name: "Arquitetura de Alto Padrão",
        serviceType: "Arquitetura",
        url: `${BASE_URL}/arquitetura`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_ENG_ID,
        name: "Engenharia Integrada",
        serviceType: "Engenharia",
        url: `${BASE_URL}/engenharia`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_WOOD_ID,
        name: "Marcenaria Sob Medida",
        serviceType: "Marcenaria",
        url: `${BASE_URL}/marcenaria`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_TURNKEY_ID,
        name: "Obra Turn Key",
        serviceType: "Execucao turn key",
        url: `${BASE_URL}/obra-turn-key`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_EXPERIENCE_ID,
        name: "Sistema de Experiência Visual",
        serviceType: "Experiência visual aplicada a projeto e pré-venda",
        url: `${BASE_URL}/moodboard`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "SoftwareApplication",
        "@id": APP_BUILDTECH_ID,
        name: "WG BuildTech",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${BASE_URL}/buildtech`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "SoftwareApplication",
        "@id": APP_MOODBOARD_ID,
        name: "WG Moodboard Generator",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: `${BASE_URL}/moodboard-generator`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "SoftwareApplication",
        "@id": APP_ROOM_ID,
        name: "WG Room Visualizer",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: `${BASE_URL}/room-visualizer`,
        provider: { "@id": ORG_ID },
      },
      {
        "@type": "CreativeWorkSeries",
        "@id": PROJECTS_SERIES_ID,
        name: "Projetos Grupo WG Almeida",
        url: `${BASE_URL}/projetos`,
        creator: { "@id": ORG_ID },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: BASE_URL,
        name: "Grupo WG Almeida",
        publisher: { "@id": ORG_ID },
        inLanguage: "pt-BR",
      },
    ],
  },

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Grupo WG Almeida",
    url: BASE_URL,
    telephone: COMPANY.phoneRaw,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "City",
      name: "São Paulo",
    },
  },

  serviceArchitecture: service(
    "Arquitetura de Alto Padrão em São Paulo",
    "Projetos de arquitetura residencial e corporativa com execução integrada.",
    `${BASE_URL}/arquitetura`
  ),
  serviceEngineering: service(
    "Engenharia Integrada em São Paulo",
    "Engenharia para obras com planejamento, controle e previsibilidade.",
    `${BASE_URL}/engenharia`
  ),
  serviceWoodworking: service(
    "Marcenaria Sob Medida em São Paulo",
    "Marcenaria premium integrada ao projeto arquitetônico.",
    `${BASE_URL}/marcenaria`
  ),
  serviceExperienceVisual: service(
    "Sistema de Experiência Visual em São Paulo",
    "Camada de alinhamento visual e decisão estética para briefing, pré-venda, projeto e obra.",
    `${BASE_URL}/moodboard`
  ),

  breadcrumbHome: breadcrumb([{ name: "Home", url: `${BASE_URL}/` }]),
  breadcrumbAbout: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sobre", url: `${BASE_URL}/sobre` },
  ]),
  breadcrumbProjects: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Projetos", url: `${BASE_URL}/projetos` },
  ]),
  breadcrumbProcess: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Processo", url: `${BASE_URL}/processo` },
  ]),
  breadcrumbArchitecture: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Arquitetura", url: `${BASE_URL}/arquitetura` },
  ]),
  breadcrumbEngineering: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Engenharia", url: `${BASE_URL}/engenharia` },
  ]),
  breadcrumbWoodworking: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Marcenaria", url: `${BASE_URL}/marcenaria` },
  ]),
  breadcrumbBuildTech: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "BuildTech", url: `${BASE_URL}/buildtech` },
  ]),
  breadcrumbStore: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Loja", url: `${BASE_URL}/store` },
  ]),

  contactPage: {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contato | Grupo WG Almeida",
    url: `${BASE_URL}/contato`,
    description: "Solicite orçamento de arquitetura, engenharia e marcenaria em São Paulo.",
    mainEntity: {
      "@type": "Organization",
      name: "Grupo WG Almeida",
      telephone: COMPANY.phoneRaw,
      email: COMPANY.email,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: COMPANY.phoneRaw,
        contactType: "customer service",
        availableLanguage: "Portuguese",
        areaServed: "BR",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        addressCountry: "BR",
      },
    },
  },

  aggregateRating: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Grupo WG Almeida",
    url: BASE_URL,
    image: `${BASE_URL}/og-home-1200x630.jpg`,
    telephone: COMPANY.phoneRaw,
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Guararapes, 305",
      addressLocality: "Brooklin, São Paulo",
      addressRegion: "SP",
      postalCode: "04561-000",
      addressCountry: "BR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "50",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "William Almeida" },
        reviewRating: { "@type": "Rating", ratingValue: "5" },
        reviewBody: "Excelente atendimento e rigor técnico em todas as etapas da obra.",
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "K. S." },
        reviewRating: { "@type": "Rating", ratingValue: "5" },
        reviewBody: "Marcenaria de altíssima qualidade, integrada perfeitamente ao projeto.",
      }
    ]
  },

  faq: (questions) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }),
};

export default SCHEMAS;
