// ============================================================
// CONFIGURAÇÍO: Central de ImportaçÍo/ExportaçÍo
// Sistema WG Easy - Grupo WG Almeida
//
// Para adicionar um novo módulo de import/export:
// 1. Adicione ao array MODULOS_IMPORT_EXPORT abaixo
// 2. Crie a página seguindo o padrÍo ExportarImportar[Modulo]Page.tsx
// 3. Adicione a rota no App.tsx
// ============================================================

export interface ModuloImportExport {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  corHover: string;
  rota: string;
  funcionalidades: string[];
  disponivel: boolean;
  ordem: number; // Para ordenaçÍo na lista
}

/**
 * Lista de módulos de importaçÍo/exportaçÍo disponíveis no sistema
 * Adicione novos módulos aqui e eles aparecerÍo automaticamente na Central
 */
export const MODULOS_IMPORT_EXPORT: ModuloImportExport[] = [
  {
    id: "pricelist",
    nome: "Pricelist",
    descricao: "Catálogo de produtos e serviços com precificaçÍo automática",
    icone: "📦",
    cor: "bg-purple-100",
    corHover: "hover:bg-purple-200",
    rota: "/pricelist/exportar-importar",
    funcionalidades: [
      "Exportar todos os itens para Excel",
      "Importar itens com cálculo automático de preço",
      "Suporte a formato brasileiro (R$ 1.500,00)",
      "Fórmula de precificaçÍo por núcleo",
    ],
    disponivel: true,
    ordem: 1,
  },
  {
    id: "pessoas",
    nome: "Pessoas",
    descricao: "Clientes, fornecedores, colaboradores e especificadores",
    icone: "👥",
    cor: "bg-blue-100",
    corHover: "hover:bg-blue-200",
    rota: "/pessoas/exportar-importar",
    funcionalidades: [
      "Exportar por tipo de pessoa",
      "Importar clientes, fornecedores, etc.",
      "ValidaçÍo de campos obrigatórios",
      "DetecçÍo automática de duplicatas",
    ],
    disponivel: true,
    ordem: 2,
  },
  {
    id: "financeiro",
    nome: "Extrato Bancário",
    descricao: "Importar extratos de bancos para conciliaçÍo",
    icone: "💰",
    cor: "bg-green-100",
    corHover: "hover:bg-green-200",
    rota: "/financeiro/importar-extrato",
    funcionalidades: [
      "Suporte a múltiplos formatos de banco",
      "DetecçÍo automática de categorias",
      "ConciliaçÍo com lançamentos existentes",
      "Parser para formato brasileiro",
    ],
    disponivel: true,
    ordem: 3,
  },
  {
    id: "pricelist-ia",
    nome: "Catálogos (IA)",
    descricao: "Importar catálogos de fornecedores com inteligência artificial",
    icone: "🤖",
    cor: "bg-orange-100",
    corHover: "hover:bg-orange-200",
    rota: "/pricelist/importar-catalogo",
    funcionalidades: [
      "Processamento com IA",
      "ExtraçÍo automática de dados",
      "DetecçÍo de duplicatas",
      "CategorizaçÍo inteligente",
    ],
    disponivel: true,
    ordem: 4,
  },
  {
    id: "propostas",
    nome: "Propostas",
    descricao: "Exportar e importar propostas comerciais",
    icone: "📄",
    cor: "bg-yellow-100",
    corHover: "hover:bg-yellow-200",
    rota: "/propostas/exportar-importar",
    funcionalidades: [
      "Exportar propostas para Excel",
      "Backup de propostas",
      "Relatórios consolidados",
    ],
    disponivel: false,
    ordem: 10,
  },
  {
    id: "contratos",
    nome: "Contratos",
    descricao: "Exportar e importar contratos",
    icone: "📑",
    cor: "bg-indigo-100",
    corHover: "hover:bg-indigo-200",
    rota: "/contratos/exportar-importar",
    funcionalidades: [
      "Exportar contratos para Excel",
      "Relatórios de contratos ativos",
      "Histórico de faturamento",
    ],
    disponivel: false,
    ordem: 11,
  },
];

/**
 * Retorna apenas módulos disponíveis (ativos)
 */
export function getModulosAtivos(): ModuloImportExport[] {
  return MODULOS_IMPORT_EXPORT
    .filter((m) => m.disponivel)
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Retorna módulos marcados como "em breve"
 */
export function getModulosEmBreve(): ModuloImportExport[] {
  return MODULOS_IMPORT_EXPORT
    .filter((m) => !m.disponivel)
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Busca um módulo por ID
 */
export function getModuloPorId(id: string): ModuloImportExport | undefined {
  return MODULOS_IMPORT_EXPORT.find((m) => m.id === id);
}

/**
 * Adiciona um novo módulo programaticamente (útil para plugins/extensões)
 */
export function registrarModulo(modulo: ModuloImportExport): void {
  const existe = MODULOS_IMPORT_EXPORT.find((m) => m.id === modulo.id);
  if (!existe) {
    MODULOS_IMPORT_EXPORT.push(modulo);
  }
}

