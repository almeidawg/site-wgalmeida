// ==========================================
// WG EASY · ESTRUTURA DE MENU CORPORATIVO 2026
// Identidade Visual: WG Almeida
// ==========================================

export interface MenuItem {
  label: string;
  path?: string;
  icon?: string;
  hoverColor?: string; // Cor personalizada para hover (núcleos)
  restrictTo?: string | string[]; // Restringir item a tipo(s) de usuário específico(s) (ex: "MASTER" ou ["MASTER", "ADMIN"])
  children?: MenuItem[]; // Subnível opcional (ex: Sistema > Financeiro > ...)
}

export interface MenuSection {
  section: string;
  icon: string;
  items: MenuItem[];
  maxVisible?: number; // Limite de itens visíveis antes do "Ver mais"
  path?: string; // Caminho direto ao clicar no título da seçÍo
  restrictTo?: string | string[]; // Restringir seçÍo inteira a tipo(s) de usuário
}

const wgMenus: MenuSection[] = [
  {
    section: "Dashboard",
    icon: "📊",
    path: "/", // Clique no título navega direto para o Dashboard
    items: [
      { label: "Tarefas", path: "/criacao-checklist", icon: "✅" }
    ]
  },
  {
    section: "Pessoas",
    icon: "👥",
    path: "/pessoas/cadastros", // Clique no título navega direto
    items: []
  },
  {
    section: "Oportunidades",
    icon: "🎯",
    path: "/oportunidades", // Clique no título navega direto
    items: []
  },
  {
    section: "Comercial",
    icon: "💼",
    maxVisible: 4,
    items: [
      { label: "Estudo (EVF)", path: "/evf" },
      { label: "Análise de Projeto", path: "/analise-projeto" },
      { label: "Propostas", path: "/propostas" },
      { label: "Contratos", path: "/contratos" }
    ]
  },
  {
    section: "Arquitetura",
    icon: "🏛️",
    path: "/oportunidades/kanban/arquitetura", // Verde Mineral #5E9B94
    items: [
      { label: "Templates de Checklists", path: "/sistema/checklists", icon: "✅" }
    ]
  },
  {
    section: "Engenharia",
    icon: "⚙️",
    path: "/oportunidades/kanban/engenharia", // Azul Técnico #2B4580
    items: []
  },
  {
    section: "Marcenaria",
    icon: "🪵",
    path: "/marcenaria", // Marrom Carvalho #8B5E3C
    maxVisible: 6,
    items: [
      { label: "Dashboard", path: "/marcenaria/dashboard", icon: "📊" },
      { label: "Projetos", path: "/marcenaria/projetos", icon: "📁" },
      { label: "Importar XML", path: "/marcenaria/importar", icon: "📥" },
      { label: "Projeto Executivo", path: "/marcenaria/executivo", icon: "📐" },
      { label: "Aprovações", path: "/marcenaria/aprovacoes", icon: "✅" },
      { label: "Fornecedores", path: "/marcenaria/fornecedores", icon: "🏭" },
      { label: "Pedidos", path: "/marcenaria/pedidos", icon: "📦" },
      { label: "Logística", path: "/marcenaria/logistica", icon: "🚚" },
      { label: "Montagem", path: "/marcenaria/montagem", icon: "🔧" },
      { label: "Assistência", path: "/marcenaria/assistencia", icon: "🛠️" },
      { label: "Termo de Aceite", path: "/marcenaria/aceite", icon: "📝" },
      { label: "Garantias", path: "/marcenaria/garantias", icon: "🛡️" },
      { label: "Financeiro", path: "/marcenaria/financeiro", icon: "💰" }
    ]
  },
  {
    section: "Planejamento",
    icon: "📋",
    path: "/planejamento", // Dashboard de Planejamento
    maxVisible: 5,
    items: [
      { label: "Novo Pedido", path: "/planejamento/novo", icon: "➕" },
      { label: "Composições", path: "/planejamento/composicoes", icon: "🧩" },
      { label: "Aprovações", path: "/planejamento/aprovacoes", icon: "✅" },
      { label: "Orçamentos", path: "/planejamento/orcamentos", icon: "📄" },
      { label: "Memorial de Acabamentos", path: "/memorial-acabamentos", icon: "🎨" },
      { label: "Compras", path: "/compras", icon: "🛒" }
    ]
  },
  {
    section: "Serviços",
    icon: "🚚",
    path: "/servicos",
    items: []
  },
  {
    section: "Cronograma",
    icon: "📅",
    path: "/cronograma", // Clique no título navega direto para o Dashboard
    items: [
      { label: "Projetos", path: "/cronograma/projects" }
    ]
  },
  {
    section: "Financeiro",
    icon: "💰",
    maxVisible: 7,
    path: "/financeiro", // Clique no título navega direto para o Dashboard
    restrictTo: ["MASTER", "FINANCEIRO"], // ADMIN não vê esta seçÍo
    items: [
      { label: "Lançamentos", path: "/financeiro/lancamentos" },
      { label: "Cobranças", path: "/financeiro/cobrancas" },
      { label: "Dívidas", path: "/financeiro/dividas" },
      { label: "Reembolsos", path: "/financeiro/reembolsos" },
      { label: "Comissionamento", path: "/financeiro/comissionamento" },
      { label: "Obras", path: "/financeiro/obras" },
      { label: "Categorias", path: "/financeiro/categorias" },
      { label: "Importar Extrato", path: "/financeiro/importar-extrato" },
      { label: "Importar Inteligente", path: "/financeiro/importar-inteligente" },
      { label: "Relatórios", path: "/financeiro/relatorios" }
    ]
  },
  {
    section: "Jurídico",
    restrictTo: ["MASTER", "JURIDICO"], // Apenas MASTER e JURIDICO veem esta seçÍo
    icon: "⚖️",
    path: "/juridico", // Clique no título navega direto (Dashboard com Clientes Ativos)
    items: [
      { label: "Assistência Jurídica", path: "/juridico/assistencia", icon: "🆘" }, // Visível para todos incluindo ADMIN
      { label: "Financeiro Jurídico", path: "/juridico/financeiro", icon: "💰", restrictTo: ["MASTER", "JURIDICO"] },
      { label: "Empresas do Grupo WG", path: "/juridico/empresas", icon: "🏢", restrictTo: ["MASTER", "JURIDICO"] },
      { label: "Modelos de Contrato", path: "/juridico/modelos", icon: "📝", restrictTo: ["MASTER", "JURIDICO"] }
    ]
  },
  {
    section: "WGXperience",
    icon: "⭐",
    items: [
      { label: "Portal do Cliente", path: "/portal-cliente" },
      { label: "Cadastro de Clientes", path: "/sistema/area-cliente/clientes" },
      { label: "Drive Compartilhado", path: "/sistema/area-cliente/drive" }
    ]
  },
  {
    section: "Pós Vendas",
    icon: "🛠️",
    maxVisible: 3,
    items: [
      { label: "Assistência", path: "/assistencia" },
      { label: "Termo de Aceite", path: "/termo-aceite" },
      { label: "Garantia", path: "/garantia" }
    ]
  },
  {
    section: "Onboarding",
    icon: "🚀",
    path: "/onboarding", // Clique no título navega direto
    items: []
  },
  {
    section: "WG Store",
    icon: "🛒",
    items: [
      { label: "Loja Virtual", path: "/wg-store" },
    ]
  },
  {
    section: "Liz IA",
    icon: "🤖",
    path: "/liz",
    restrictTo: "MASTER",
    items: []
  },
  {
    section: "Depósito WG",
    icon: "📦",
    path: "/deposito", // Clique no título navega direto
    items: []
  },
  {
    section: "Gestão SaaS",
    icon: "🧠",
    restrictTo: "MASTER",
    items: [
      { label: "Dashboard Geral", path: "/admin-saas", restrictTo: "MASTER" },
      { label: "Central de Leads", path: "/admin-saas/leads", restrictTo: "MASTER" },
      { label: "Clientes SaaS", path: "/admin-saas/clientes", restrictTo: "MASTER" },
      { label: "Produtos", path: "/admin-saas/produtos", restrictTo: "MASTER" },
      { label: "Planos e Cobrança", path: "/admin-saas/billing", restrictTo: "MASTER" },
      { label: "Construtor de SaaS", path: "/admin-saas/builder", restrictTo: "MASTER" },
      { label: "Landing Pages", path: "/admin-saas/landing-pages", restrictTo: "MASTER" }
    ]
  },
  {
    section: "Sistema",
    icon: "🔧",
    maxVisible: 11,
    restrictTo: "MASTER", // Apenas MASTER vê esta seçÍo
    items: [
      {
        label: "Financeiro",
        restrictTo: "MASTER",
        children: [
          { label: "Pricelist", path: "/pricelist", restrictTo: "MASTER" },
          { label: "AutomaçÍo SINAPI", path: "/pricelist/automacao-sinapi", restrictTo: "MASTER" },
          { label: "Categorias", path: "/financeiro/categorias", restrictTo: "MASTER" },
          { label: "PrecificaçÍo", path: "/sistema/precificacao", restrictTo: "MASTER" },
          { label: "Import / Export", path: "/sistema/importar-exportar", restrictTo: "MASTER" },
          { label: "Comissões", path: "/financeiro/comissionamento", restrictTo: "MASTER" }
        ]
      },

      {
        label: "Pessoas",
        restrictTo: "MASTER",
        children: [
          { label: "Importar", path: "/pessoas/importar", restrictTo: "MASTER" },
          { label: "Exportar/Importar", path: "/pessoas/exportar-importar", restrictTo: "MASTER" },
          { label: "Aprovações Pendentes", path: "/sistema/cadastros-pendentes", restrictTo: "MASTER" },
          { label: "Central de Links", path: "/sistema/central-links", restrictTo: "MASTER" }
        ]
      },

      {
        label: "ICCRI",
        restrictTo: "MASTER",
        children: [
          { label: "Dashboard ICCRI", path: "/sistema/iccri", restrictTo: "MASTER" },
          { label: "Categorias / Subcategorias", path: "/sistema/iccri/categorias", restrictTo: "MASTER" },
          { label: "Serviços e MDO", path: "/sistema/iccri/servicos", restrictTo: "MASTER" },
          { label: "Composições", path: "/sistema/iccri/composicoes", restrictTo: "MASTER" },
          { label: "Preços Regionais", path: "/sistema/iccri/precos", restrictTo: "MASTER" },
          { label: "Tarefas de Obra", path: "/sistema/iccri/tarefas", restrictTo: "MASTER" },
          { label: "Fluxo de Caixa", path: "/sistema/iccri/fluxos", restrictTo: "MASTER" },
        ]
      },

      {
        label: "EasyRealState",
        restrictTo: "MASTER",
        children: [
          { label: "Avaliação AVM", path: "/sistema/easy-real-state", restrictTo: "MASTER" },
          { label: "Cálculo EVF", path: "/sistema/easy-real-state/evf", restrictTo: "MASTER" },
          { label: "Dashboard m² Bairros", path: "/sistema/easy-real-state/dashboard-calculo", restrictTo: "MASTER" },
          { label: "Metodologia AVM", path: "/sistema/easy-real-state/metodologia", restrictTo: "MASTER" },
        ]
      },

      { label: "Empresas do Grupo WG", path: "/empresas", restrictTo: "MASTER" },
      { label: "Planta do Sistema", path: "/sistema/planta", restrictTo: "MASTER" },
      { label: "Saúde do Sistema", path: "/sistema/saude", restrictTo: "MASTER" },
      { label: "Usuários", path: "/usuarios", restrictTo: "MASTER" }
    ]
  },

  {
    section: "WillHub",
    icon: "🧭",
    path: "/sistema/william-hub",
    restrictTo: "MASTER",
    items: []
  },
  {
    section: "Sessão",
    icon: "🚪",
    path: "/logout", // Clique no título faz logout direto
    items: []
  },
  // ============================================================
  // ÁREAS EXCLUSIVAS POR TIPO DE USUÁRIO
  // ============================================================
  {
    section: "Minha Área",
    icon: "👷",
    path: "/colaborador", // Área exclusiva do colaborador
    items: [
      { label: "Dashboard", path: "/colaborador", icon: "📊" },
      { label: "Meus Projetos", path: "/colaborador/projetos", icon: "📁" },
      { label: "Serviços", path: "/colaborador/servicos", icon: "🔧" },
      { label: "Materiais", path: "/colaborador/materiais", icon: "📦" },
      { label: "Solicitações", path: "/colaborador/solicitacoes", icon: "📋" },
      { label: "Financeiro", path: "/colaborador/financeiro", icon: "💰" },
      { label: "Meu Perfil", path: "/colaborador/perfil", icon: "👤" }
    ]
  },
  {
    section: "Área do Cliente",
    icon: "🏠",
    path: "/wgx", // Área exclusiva do cliente
    items: [
      { label: "Meu Projeto", path: "/wgx", icon: "🏗️" },
      { label: "Arquivos", path: "/wgx/arquivos", icon: "📁" },
      { label: "Cronograma", path: "/wgx/cronograma", icon: "📅" },
      { label: "Financeiro", path: "/wgx/financeiro", icon: "💰" },
      { label: "Fornecedores", path: "/wgx/fornecedores", icon: "🔧" },
      { label: "Pós-Vendas", path: "/wgx/pos-vendas", icon: "🛠️" }
    ]
  }
];

export default wgMenus;


