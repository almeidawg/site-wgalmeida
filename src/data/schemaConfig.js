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
    telephone: "+55-11-98465-0002",
  },

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Grupo WG Almeida",
    url: BASE_URL,
    telephone: "+55-11-98465-0002",
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
      telephone: "+55-11-98465-0002",
      email: "contato@wgalmeida.com.br",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+55-11-98465-0002",
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
    telephone: "+55-11-98465-0002",
    email: "contato@wgalmeida.com.br",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sao Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "50",
    },
  },
};

export default SCHEMAS;
