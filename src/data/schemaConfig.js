const BASE_URL = "https://wgalmeida.com.br";

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
    "@type": "Organization",
    name: "Grupo WG Almeida",
    url: BASE_URL,
  },
  areaServed: {
    "@type": "City",
    name: "Sao Paulo",
  },
});

export const SCHEMAS = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Grupo WG Almeida",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo-96.webp`,
    email: "contato@wgalmeida.com.br",
    telephone: "+5511984650002",
  },

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Grupo WG Almeida",
    url: BASE_URL,
    telephone: "+5511984650002",
    email: "contato@wgalmeida.com.br",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sao Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "City",
      name: "Sao Paulo",
    },
  },

  serviceArchitecture: service(
    "Arquitetura de Alto Padrao em Sao Paulo",
    "Projetos de arquitetura residencial e corporativa com execucao integrada.",
    `${BASE_URL}/arquitetura`
  ),
  serviceEngineering: service(
    "Engenharia Integrada em Sao Paulo",
    "Engenharia para obras com planejamento, controle e previsibilidade.",
    `${BASE_URL}/engenharia`
  ),
  serviceWoodworking: service(
    "Marcenaria Sob Medida em Sao Paulo",
    "Marcenaria premium integrada ao projeto arquitetonico.",
    `${BASE_URL}/marcenaria`
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
  breadcrumbStore: breadcrumb([
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Loja", url: `${BASE_URL}/store` },
  ]),

  contactPage: {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contato | Grupo WG Almeida",
    url: `${BASE_URL}/contato`,
    description: "Solicite orcamento de arquitetura, engenharia e marcenaria em Sao Paulo.",
    mainEntity: {
      "@type": "Organization",
      name: "Grupo WG Almeida",
      telephone: "+5511984650002",
      email: "contato@wgalmeida.com.br",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+5511984650002",
        contactType: "customer service",
        availableLanguage: "Portuguese",
        areaServed: "BR",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sao Paulo",
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
    telephone: "+5511984650002",
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Guararapes, 305",
      addressLocality: "Brooklin, Sao Paulo",
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
        reviewBody: "Excelente atendimento e rigor tecnico em todas as etapas da obra.",
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "K. S." },
        reviewRating: { "@type": "Rating", ratingValue: "5" },
        reviewBody: "Marcenaria de altissima qualidade, integrada perfeitamente ao projeto.",
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
