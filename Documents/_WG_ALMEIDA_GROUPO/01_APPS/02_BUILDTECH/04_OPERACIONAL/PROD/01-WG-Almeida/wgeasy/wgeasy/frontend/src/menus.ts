const menus = [
  {
    section: "Principal",
    items: [{ label: "Dashboard", icon: "??", path: "/" }],
  },
  {
    section: "GestÍo SaaS",
    moduleSlug: "saas-management", // Slug for the entire section
    items: [
      {
        label: "Dashboard SaaS",
        icon: "🚀",
        path: "/admin-saas",
      },
      {
        label: "Construtor de SaaS",
        icon: "✨",
        path: "/admin-saas/builder",
      },
      {
        label: "Landing Pages",
        icon: "📄",
        path: "/admin-saas/landing-pages",
      },
      {
        label: "Leads",
        icon: "🎯",
        path: "/admin-saas/leads",
      },
      {
        label: "Clientes (Tenants)",
        icon: "🏢",
        path: "/admin-saas/clientes",
      },
    ],
  },
  {
    section: "Gestao",
    items: [
      {
        label: "Pessoas",
        icon: "??",
        path: "/pessoas",
        moduleSlug: "crm",
        children: [
          { label: "Clientes", path: "/pessoas/clientes" },
          { label: "Colaboradores", path: "/pessoas/colaboradores" },
          { label: "Fornecedores", path: "/pessoas/fornecedores" },
          { label: "Especificadores", path: "/pessoas/especificadores" },
        ],
      },
      {
        label: "Comercial",
        icon: "??",
        path: "/comercial",
        moduleSlug: "sales",
        children: [
          { label: "Oportunidades", path: "/oportunidades" },
          { label: "Oportunidades IA", path: "/oportunidades/inteligentes" },
          { label: "Propostas", path: "/propostas" },
          { label: "Contratos", path: "/contratos" },
        ],
      },
    ],
  },
  {
    section: "Projetos",
    moduleSlug: "projects",
    items: [
      { label: "Arquitetura", icon: "??", path: "/arquitetura/kanban" },
      { label: "Engenharia", icon: "??", path: "/engenharia/kanban" },
      { label: "Marcenaria", icon: "??", path: "/marcenaria" },
      { label: "Projetos", icon: "??", path: "/projects" },
    ],
  },
  {
    section: "Operacoes",
    moduleSlug: "operations",
    items: [
      {
        label: "Operacoes",
        icon: "??",
        path: "/operacoes",
        children: [
          { label: "Compras", path: "/compras" },
          { label: "Ideias", path: "/operacoes/ideias" },
          { label: "Planejamento", path: "/operacoes/planejamento" },
          { label: "Aprovacoes", path: "/operacoes/aprovacoes" },
        ],
      },
      {
        label: "Cronogramas",
        icon: "???",
        path: "/cronograma",
        children: [
          { label: "Visao Geral", path: "/cronograma" },
          { label: "Projetos", path: "/cronograma/projects" },
          { label: "Times", path: "/cronograma/teams" },
          { label: "Catalogo", path: "/cronograma/catalog" },
          { label: "Kanban", path: "/cronograma/kanban" },
          { label: "Graficos", path: "/cronograma/graficos" },
          { label: "Financeiro", path: "/cronograma/financeiro" },
        ],
      },
      { label: "Assistencia", icon: "??", path: "/assistencia" },
    ],
  },
  {
    section: "Financeiro",
    moduleSlug: "finance",
    items: [
      {
        label: "Financeiro",
        icon: "??",
        path: "/financeiro",
        children: [
          { label: "Dashboard", path: "/financeiro" },
          { label: "Lancamentos", path: "/financeiro/lancamentos" },
          { label: "Cobrancas", path: "/financeiro/cobrancas" },
          { label: "Reembolsos", path: "/financeiro/reembolsos" },
          { label: "Comissionamento", path: "/financeiro/comissionamento" },
          { label: "Obras", path: "/financeiro/obras" },
          { label: "Categorias", path: "/financeiro/categorias" },
          { label: "Importar Extrato", path: "/financeiro/importar-extrato" },
          { label: "Relatorios", path: "/financeiro/relatorios" },
        ],
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      // ... (Sistema items don't need slugs as they are likely admin-only)
      {
        label: "Onboarding",
        icon: "??",
        path: "/onboarding",
        children: [
          { label: "Clientes", path: "/onboarding/clientes" },
          { label: "Time WG", path: "/onboarding/time" },
        ],
      },
      { label: "WGStore", icon: "??", path: "/wg-store" },
      {
        label: "Administrativo",
        icon: "??",
        path: "/administrativo",
        children: [
          { label: "Usuarios", path: "/usuarios" },
          { label: "Configuracoes", path: "/configuracoes" },
          { label: "Comissoes", path: "/administrativo/comissoes" },
          { label: "Melhorias Tecnicas", path: "/sistema/melhorias" },
          { label: "Assinatura", path: "/sistema/billing" },
          { label: "Relatórios", path: "/relatorios" },
        ],
      },
      {
        label: "Financeiro",
        icon: "??",
        path: "/sistema/financeiro",
        children: [
          { label: "Categorias", path: "/financeiro/categorias" },
          { label: "Precificacao", path: "/sistema/precificacao" },
          { label: "Pricelist", path: "/pricelist" },
          { label: "Calculadora m²", path: "/orcamentos/calculadora" },
          { label: "Import/Export", path: "/sistema/importar-exportar" },
        ],
      },
      {
        label: "Pessoas",
        icon: "??",
        path: "/sistema/pessoas",
        children: [
          { label: "Importar Pessoas", path: "/pessoas/importar" },
          { label: "Exportar/Importar", path: "/pessoas/exportar-importar" },
          { label: "Aprovacoes Pendentes", path: "/sistema/cadastros-pendentes" },
          { label: "Central de Links", path: "/sistema/central-links" },
        ],
      },
      { label: "Sair", icon: "??", path: "/logout" },
    ],
  },
];

export default menus;

