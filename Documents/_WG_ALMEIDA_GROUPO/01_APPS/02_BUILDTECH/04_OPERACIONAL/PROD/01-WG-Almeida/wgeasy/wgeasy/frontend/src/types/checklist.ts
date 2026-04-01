// ============================================================
// TYPES: Checklists
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type VinculoTipo = "oportunidade" | "contrato" | "projeto" | "proposta" | "pessoa";
export type CategoriaTemplate = "oportunidade" | "projeto" | "contrato" | "geral";

// Template de Checklist
export interface ChecklistTemplate {
  id: string;
  nome: string;
  descricao?: string;
  nucleo_id: string;
  categoria?: CategoriaTemplate;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Item do Template
export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  texto: string;
  ordem: number;
  secao?: string;
  created_at: string;
}

// Checklist
export interface Checklist {
  id: string;
  titulo: string;
  descricao?: string;
  vinculo_tipo: VinculoTipo;
  vinculo_id: string;
  template_id?: string;
  nucleo_id: string;
  created_at: string;
  updated_at: string;
}

// Item do Checklist
export interface ChecklistItem {
  id: string;
  checklist_id: string;
  texto: string;
  concluido: boolean;
  concluido_por?: string;
  concluido_em?: string | null;
  ordem: number;
  secao?: string;
  created_at: string;
  updated_at: string;
}

// DTOs para criaçÍo
export interface CreateChecklistDTO {
  titulo: string;
  descricao?: string;
  vinculo_tipo: VinculoTipo;
  vinculo_id: string;
  template_id?: string;
  nucleo_id: string;
}

export interface CreateChecklistItemDTO {
  checklist_id: string;
  texto: string;
  ordem?: number;
  secao?: string;
}

export interface CreateTemplateDTO {
  nome: string;
  descricao?: string;
  nucleo_id: string;
  categoria?: CategoriaTemplate;
}

export interface CreateTemplateItemDTO {
  template_id: string;
  texto: string;
  ordem?: number;
  secao?: string;
}

