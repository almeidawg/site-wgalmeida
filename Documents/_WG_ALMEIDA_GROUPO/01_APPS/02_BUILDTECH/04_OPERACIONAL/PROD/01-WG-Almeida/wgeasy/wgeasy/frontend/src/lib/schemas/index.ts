// ============================================================
// SCHEMAS ZOD — ValidaçÍo de formulários críticos
// Usado com react-hook-form + zodResolver para feedback inline
// ============================================================

import { z } from "zod";

// --- Helpers reutilizáveis ---

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;

const telefoneOpcional = z
  .string()
  .regex(telefoneRegex, "Telefone inválido. Use (00) 00000-0000")
  .optional()
  .or(z.literal(""));

const cpfOpcional = z
  .string()
  .regex(cpfRegex, "CPF inválido. Use 000.000.000-00")
  .optional()
  .or(z.literal(""));

const cnpjOpcional = z
  .string()
  .regex(cnpjRegex, "CNPJ inválido. Use 00.000.000/0000-00")
  .optional()
  .or(z.literal(""));

// ============================================================
// SCHEMA: Cliente / Pessoa
// ============================================================

export const schemaCliente = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(150, "Nome muito longo"),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    telefone: telefoneOpcional,
    tipo_pessoa: z.enum(["fisica", "juridica"]).default("fisica"),
    cpf: cpfOpcional,
    cnpj: cnpjOpcional,
    cep: z.string().regex(cepRegex, "CEP inválido. Use 00000-000").optional().or(z.literal("")),
    cidade: z.string().max(100, "Cidade muito longa").optional().or(z.literal("")),
    estado: z.string().length(2, "Use a sigla do estado (ex: SP)").optional().or(z.literal("")),
    observacoes: z.string().max(1000, "Observações muito longas").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.tipo_pessoa === "fisica") return true; // CPF não é obrigatório
      return true;
    },
    { message: "Dados inválidos para o tipo de pessoa selecionado" }
  );

export type ClienteFormData = z.infer<typeof schemaCliente>;

// ============================================================
// SCHEMA: Oportunidade / Lead
// ============================================================

export const schemaOportunidade = z.object({
  titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres").max(200),
  cliente_nome: z.string().min(2, "Nome do cliente obrigatório").max(150),
  valor_estimado: z
    .number({ invalid_type_error: "Valor deve ser numérico" })
    .min(0, "Valor não pode ser negativo")
    .optional(),
  estagio: z.enum(["lead", "contato", "proposta", "negociacao", "fechado", "perdido"]).default("lead"),
  probabilidade: z.number().min(0).max(100).default(50),
  data_prevista_fechamento: z.string().optional().or(z.literal("")),
  descricao: z.string().max(2000, "DescriçÍo muito longa").optional().or(z.literal("")),
  responsavel_id: z.string().uuid("Responsável inválido").optional().or(z.literal("")),
});

export type OportunidadeFormData = z.infer<typeof schemaOportunidade>;

// ============================================================
// SCHEMA: Proposta Comercial
// ============================================================

export const schemaProposta = z.object({
  titulo: z.string().min(3, "Título obrigatório").max(200),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  valor_total: z
    .number({ invalid_type_error: "Valor deve ser numérico" })
    .min(1, "Valor deve ser maior que zero"),
  validade_dias: z.number().int().min(1).max(365).default(30),
  condicoes_pagamento: z.string().max(500).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
  desconto_percentual: z.number().min(0).max(100).default(0),
  incluir_impostos: z.boolean().default(true),
  status: z.enum(["rascunho", "enviada", "aprovada", "recusada", "expirada"]).default("rascunho"),
});

export type PropostaFormData = z.infer<typeof schemaProposta>;

// ============================================================
// SCHEMA: Contrato
// ============================================================

export const schemaContrato = z.object({
  titulo: z.string().min(3, "Título obrigatório").max(200),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  valor_total: z
    .number({ invalid_type_error: "Valor inválido" })
    .min(1, "Valor deve ser maior que zero"),
  data_inicio: z.string().min(1, "Data de início obrigatória"),
  data_termino_previsto: z.string().optional().or(z.literal("")),
  numero_parcelas: z.number().int().min(1).max(120).default(1),
  forma_pagamento: z.enum(["avista", "parcelado", "mensal", "personalizado"]).default("avista"),
  tipo_contrato: z.enum(["obra", "projeto", "consultoria", "manutencao", "outro"]).default("projeto"),
  descricao_servicos: z.string().min(10, "Descreva os serviços (mín. 10 caracteres)").max(5000),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});

export type ContratoFormData = z.infer<typeof schemaContrato>;

// ============================================================
// SCHEMA: Lançamento Financeiro
// ============================================================

export const schemaLancamento = z.object({
  descricao: z.string().min(3, "DescriçÍo obrigatória").max(200),
  valor: z
    .number({ invalid_type_error: "Valor inválido" })
    .refine((v) => v !== 0, "Valor não pode ser zero"),
  tipo: z.enum(["receita", "despesa"]),
  categoria_id: z.string().min(1, "Selecione uma categoria"),
  data_lancamento: z.string().min(1, "Data obrigatória"),
  data_vencimento: z.string().optional().or(z.literal("")),
  status: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  observacoes: z.string().max(500).optional().or(z.literal("")),
  comprovante_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type LancamentoFormData = z.infer<typeof schemaLancamento>;

// ============================================================
// SCHEMA: Projeto / Cronograma
// ============================================================

export const schemaProjeto = z.object({
  nome: z.string().min(3, "Nome obrigatório").max(150),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  tipo: z.enum(["residencial", "comercial", "industrial", "outro"]).default("residencial"),
  area_m2: z.number().min(1, "Área deve ser maior que zero").optional(),
  data_inicio_previsto: z.string().min(1, "Data de início obrigatória"),
  data_termino_previsto: z.string().optional().or(z.literal("")),
  endereco: z.string().max(300).optional().or(z.literal("")),
  descricao: z.string().max(2000).optional().or(z.literal("")),
  responsavel_id: z.string().uuid("Responsável inválido").optional().or(z.literal("")),
  status: z.enum(["planejamento", "em_andamento", "pausado", "concluido", "cancelado"]).default("planejamento"),
});

export type ProjetoFormData = z.infer<typeof schemaProjeto>;


