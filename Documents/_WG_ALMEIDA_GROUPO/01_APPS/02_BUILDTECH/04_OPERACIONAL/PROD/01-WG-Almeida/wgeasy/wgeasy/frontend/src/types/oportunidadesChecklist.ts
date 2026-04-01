// ============================================================
// TYPES: Módulo de Checklists de Oportunidades
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { UnidadeNegocio } from "./contratos";

// Re-exportar UnidadeNegocio para que seja acessível via este módulo
export type { UnidadeNegocio };

// ============================================================
// Interface: Template de Checklist
// ============================================================
export interface OportunidadeChecklistTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  items: ChecklistTemplateItem[];
  unidade_negocio: UnidadeNegocio | "geral";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Item do Template
// ============================================================
export interface ChecklistTemplateItem {
  item: string;
  obrigatorio: boolean;
}

// ============================================================
// Interface: Checklist de Oportunidade
// ============================================================
export interface OportunidadeChecklist {
  id: string;
  oportunidade_id: string;
  template_id: string | null;

  item: string;
  ordem: number;
  obrigatorio: boolean;

  concluido: boolean;
  concluido_em: string | null; // ISO datetime
  concluido_por_id: string | null;
  concluido_por_nome: string | null;

  observacoes: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Checklist com dados agregados
// ============================================================
export interface OportunidadeChecklistCompleto extends OportunidadeChecklist {
  template_nome?: string;
}

// ============================================================
// Interface: Resumo de Checklist por Oportunidade
// ============================================================
export interface OportunidadeChecklistResumo {
  oportunidade_id: string;
  oportunidade_titulo: string;
  total_checklist: number;
  checklist_concluidos: number;
  obrigatorios_pendentes: number;
  percentual_concluido: number;
}

// ============================================================
// Interface: Formulário de template
// ============================================================
export interface ChecklistTemplateFormData {
  nome: string;
  descricao?: string;
  items: ChecklistTemplateItem[];
  unidade_negocio: UnidadeNegocio | "geral";
  ativo?: boolean;
}

// ============================================================
// Interface: Formulário de checklist
// ============================================================
export interface OportunidadeChecklistFormData {
  oportunidade_id: string;
  template_id?: string;
  item: string;
  ordem?: number;
  obrigatorio?: boolean;
  observacoes?: string;
}

// ============================================================
// Interface: Aplicar template
// ============================================================
export interface AplicarTemplateRequest {
  oportunidade_id: string;
  template_id: string;
  substituir_existentes?: boolean; // se true, remove checklists existentes
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const UNIDADE_NEGOCIO_CHECKLIST_LABELS: Record<
  UnidadeNegocio | "geral",
  string
> = {
  arquitetura: "Arquitetura",
  engenharia: "Engenharia",
  marcenaria: "Marcenaria",
  moma_engenharia: "MOMA Engenharia",
  moma_planejados: "MOMA Planejados",
  geral: "Geral",
};

export const UNIDADE_NEGOCIO_CHECKLIST_COLORS: Record<
  UnidadeNegocio | "geral",
  string
> = {
  arquitetura: "#8B5CF6", // Roxo
  engenharia: "#3B82F6", // Azul
  marcenaria: "#F59E0B", // Laranja
  moma_engenharia: "#6366F1", // Índigo
  moma_planejados: "#14B8A6", // Teal
  geral: "#10B981", // Verde
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarDataHora(data?: string | null): string {
  if (!data) return "-";
  const date = new Date(data);
  return date.toLocaleString("pt-BR");
}

export function calcularPercentualConcluido(
  checklists: OportunidadeChecklist[]
): number {
  if (checklists.length === 0) return 0;

  const concluidos = checklists.filter((c) => c.concluido).length;
  return Math.round((concluidos / checklists.length) * 100);
}

export function verificarObrigatoriosPendentes(
  checklists: OportunidadeChecklist[]
): boolean {
  return checklists.some((c) => c.obrigatorio && !c.concluido);
}

export function contarObrigatoriosPendentes(
  checklists: OportunidadeChecklist[]
): number {
  return checklists.filter((c) => c.obrigatorio && !c.concluido).length;
}

export function validarTemplate(
  template: ChecklistTemplateFormData
): string[] {
  const erros: string[] = [];

  if (!template.nome || template.nome.trim() === "") {
    erros.push("Nome é obrigatório");
  }

  if (!template.items || template.items.length === 0) {
    erros.push("Template deve ter pelo menos 1 item");
  }

  template.items.forEach((item, index) => {
    if (!item.item || item.item.trim() === "") {
      erros.push(`Item ${index + 1} está vazio`);
    }
  });

  return erros;
}

export function validarChecklist(
  checklist: OportunidadeChecklistFormData
): string[] {
  const erros: string[] = [];

  if (!checklist.oportunidade_id) {
    erros.push("Oportunidade é obrigatória");
  }

  if (!checklist.item || checklist.item.trim() === "") {
    erros.push("Item é obrigatório");
  }

  return erros;
}

export function ordenarChecklists(
  checklists: OportunidadeChecklist[]
): OportunidadeChecklist[] {
  return [...checklists].sort((a, b) => {
    // Primeiro por ordem
    if (a.ordem !== b.ordem) {
      return a.ordem - b.ordem;
    }
    // Depois por data de criaçÍo
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function agruparPorStatus(checklists: OportunidadeChecklist[]): {
  concluidos: OportunidadeChecklist[];
  pendentes: OportunidadeChecklist[];
  obrigatoriosPendentes: OportunidadeChecklist[];
} {
  return {
    concluidos: checklists.filter((c) => c.concluido),
    pendentes: checklists.filter((c) => !c.concluido),
    obrigatoriosPendentes: checklists.filter((c) => c.obrigatorio && !c.concluido),
  };
}

export function gerarResumo(
  checklists: OportunidadeChecklist[]
): {
  total: number;
  concluidos: number;
  pendentes: number;
  obrigatorios: number;
  obrigatoriosPendentes: number;
  percentual: number;
} {
  const total = checklists.length;
  const concluidos = checklists.filter((c) => c.concluido).length;
  const pendentes = total - concluidos;
  const obrigatorios = checklists.filter((c) => c.obrigatorio).length;
  const obrigatoriosPendentes = checklists.filter(
    (c) => c.obrigatorio && !c.concluido
  ).length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return {
    total,
    concluidos,
    pendentes,
    obrigatorios,
    obrigatoriosPendentes,
    percentual,
  };
}

export function podeAvancarOportunidade(
  checklists: OportunidadeChecklist[]
): {
  pode: boolean;
  motivo?: string;
} {
  const obrigatoriosPendentes = verificarObrigatoriosPendentes(checklists);

  if (obrigatoriosPendentes) {
    const quantidade = contarObrigatoriosPendentes(checklists);
    return {
      pode: false,
      motivo: `Existem ${quantidade} item${
        quantidade > 1 ? "ns" : ""
      } obrigatório${quantidade > 1 ? "s" : ""} pendente${
        quantidade > 1 ? "s" : ""
      }`,
    };
  }

  return {
    pode: true,
  };
}

export function converterTemplateParaChecklists(
  template: OportunidadeChecklistTemplate,
  oportunidade_id: string
): Omit<OportunidadeChecklistFormData, "template_id">[] {
  return template.items.map((item, index) => ({
    oportunidade_id,
    item: item.item,
    ordem: index,
    obrigatorio: item.obrigatorio,
  }));
}

export function filtrarTemplatesPorUnidade(
  templates: OportunidadeChecklistTemplate[],
  unidade: UnidadeNegocio
): OportunidadeChecklistTemplate[] {
  return templates.filter(
    (t) => t.unidade_negocio === unidade || t.unidade_negocio === "geral"
  );
}

export function getStatusChecklistIcon(checklist: OportunidadeChecklist): string {
  if (checklist.concluido) {
    return "✅";
  }

  if (checklist.obrigatorio) {
    return "🔴";
  }

  return "⚪";
}

export function getCorProgresso(percentual: number): string {
  if (percentual === 0) return "#EF4444"; // Vermelho
  if (percentual < 50) return "#F59E0B"; // Amarelo
  if (percentual < 100) return "#3B82F6"; // Azul
  return "#10B981"; // Verde
}

export function gerarOrdemProximoItem(
  checklists: OportunidadeChecklist[]
): number {
  if (checklists.length === 0) return 0;

  const ordens = checklists.map((c) => c.ordem);
  return Math.max(...ordens) + 1;
}

// ============================================================
// Templates PadrÍo (para referência)
// ============================================================

export const TEMPLATES_PADRAO: Omit<
  ChecklistTemplateFormData,
  "id" | "created_at" | "updated_at"
>[] = [
  {
    nome: "Checklist Arquitetura",
    descricao: "Checklist padrÍo para oportunidades de arquitetura",
    unidade_negocio: "arquitetura",
    items: [
      { item: "Levantamento no local", obrigatorio: true },
      { item: "Briefing com cliente", obrigatorio: true },
      { item: "Medições realizadas", obrigatorio: true },
      { item: "DocumentaçÍo recebida", obrigatorio: false },
      { item: "Proposta enviada", obrigatorio: true },
    ],
    ativo: true,
  },
  {
    nome: "Checklist Engenharia",
    descricao: "Checklist padrÍo para oportunidades de engenharia",
    unidade_negocio: "engenharia",
    items: [
      { item: "Vistoria técnica", obrigatorio: true },
      { item: "Análise de projeto", obrigatorio: true },
      { item: "Orçamento de materiais", obrigatorio: true },
      { item: "Cronograma preliminar", obrigatorio: false },
      { item: "Proposta técnica enviada", obrigatorio: true },
    ],
    ativo: true,
  },
  {
    nome: "Checklist Marcenaria",
    descricao: "Checklist padrÍo para oportunidades de marcenaria",
    unidade_negocio: "marcenaria",
    items: [
      { item: "MediçÍo dos ambientes", obrigatorio: true },
      { item: "DefiniçÍo de acabamentos", obrigatorio: true },
      { item: "AprovaçÍo de projeto 3D", obrigatorio: true },
      { item: "SeleçÍo de materiais", obrigatorio: true },
      { item: "Orçamento aprovado", obrigatorio: true },
    ],
    ativo: true,
  },
];

