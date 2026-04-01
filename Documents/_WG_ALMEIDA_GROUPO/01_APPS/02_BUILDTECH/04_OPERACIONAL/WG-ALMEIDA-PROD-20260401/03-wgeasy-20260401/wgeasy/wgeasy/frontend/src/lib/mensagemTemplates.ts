// src/lib/mensagemTemplates.ts
// Sistema centralizado de templates de mensagens para WhatsApp e Email
// Permite customizaçÍo por tipo de mensagem com persistência em localStorage

// URL base do sistema em produçÍo
export const PRODUCTION_URL = "https://easy.wgalmeida.com.br";

// Tipos de template disponíveis
export type TipoTemplate =
  // Cadastro de pessoas
  | "CADASTRO_CLIENTE"
  | "CADASTRO_COLABORADOR"
  | "CADASTRO_FORNECEDOR"
  | "CADASTRO_ESPECIFICADOR"
  | "CADASTRO_SERVICO"
  // Área do Cliente
  | "AREA_CLIENTE"
  // Credenciais de acesso
  | "CREDENCIAIS_ACESSO"
  // Contato direto
  | "CONTATO_PESSOA";

// Interface para configuraçÍo de template
export interface TemplateConfig {
  tipo: TipoTemplate;
  nome: string;
  descricao: string;
  variaveis: string[];
  templatePadrao: string;
}

// Templates padrÍo do sistema
export const TEMPLATES_PADRAO: Record<TipoTemplate, TemplateConfig> = {
  // ============================================
  // CADASTRO DE PESSOAS
  // ============================================
  CADASTRO_CLIENTE: {
    tipo: "CADASTRO_CLIENTE",
    nome: "Cadastro de Cliente",
    descricao: "Mensagem enviada ao convidar um cliente para se cadastrar",
    variaveis: ["{{LINK}}"],
    templatePadrao: `Olá!

Você foi convidado a se cadastrar como *Cliente* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
  },

  CADASTRO_COLABORADOR: {
    tipo: "CADASTRO_COLABORADOR",
    nome: "Cadastro de Colaborador",
    descricao: "Mensagem enviada ao convidar um colaborador para se cadastrar",
    variaveis: ["{{LINK}}"],
    templatePadrao: `Olá!

Você foi convidado a se cadastrar como *Colaborador* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
  },

  CADASTRO_FORNECEDOR: {
    tipo: "CADASTRO_FORNECEDOR",
    nome: "Cadastro de Fornecedor",
    descricao: "Mensagem enviada ao convidar um fornecedor para se cadastrar",
    variaveis: ["{{LINK}}"],
    templatePadrao: `Olá!

Você foi convidado a se cadastrar como *Fornecedor* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
  },

  CADASTRO_ESPECIFICADOR: {
    tipo: "CADASTRO_ESPECIFICADOR",
    nome: "Cadastro de Especificador",
    descricao: "Mensagem enviada ao convidar um especificador para se cadastrar",
    variaveis: ["{{LINK}}"],
    templatePadrao: `Olá!

Você foi convidado a se cadastrar como *Especificador* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
  },

  CADASTRO_SERVICO: {
    tipo: "CADASTRO_SERVICO",
    nome: "SolicitaçÍo de Serviço",
    descricao: "Mensagem enviada ao solicitar um serviço",
    variaveis: ["{{LINK}}", "{{NOME_SERVICO}}"],
    templatePadrao: `Olá!

Você recebeu uma solicitaçÍo de serviço de *{{NOME_SERVICO}}* do Grupo WG Almeida.

Clique no link abaixo para visualizar os detalhes e aceitar o serviço:
{{LINK}}

Este link expira em 7 dias.

Após aceitar, entraremos em contato para alinhar os próximos passos.`,
  },

  // ============================================
  // ÁREA DO CLIENTE
  // ============================================
  AREA_CLIENTE: {
    tipo: "AREA_CLIENTE",
    nome: "Link da Área do Cliente",
    descricao: "Mensagem enviada ao compartilhar o link da área exclusiva do cliente",
    variaveis: ["{{LINK}}", "{{NOME_CLIENTE}}"],
    templatePadrao: `Olá {{NOME_CLIENTE}}!

Segue o link da sua *Área Exclusiva WG*:
{{LINK}}

Nela você pode acompanhar:
• Seus documentos e plantas
• Fotos da obra
• Cronograma e andamento
• Informações financeiras

Qualquer dúvida, estamos à disposiçÍo!

Atenciosamente,
Equipe WG Almeida`,
  },

  // ============================================
  // CREDENCIAIS DE ACESSO
  // ============================================
  CREDENCIAIS_ACESSO: {
    tipo: "CREDENCIAIS_ACESSO",
    nome: "Credenciais de Acesso",
    descricao: "Mensagem enviada ao compartilhar as credenciais de acesso",
    variaveis: ["{{NOME}}", "{{EMAIL_LOGIN}}", "{{SENHA}}"],
    templatePadrao: `*CREDENCIAIS DE ACESSO - WG Easy*
========================================

*Nome:* {{NOME}}
*E-mail (login):* {{EMAIL_LOGIN}}

*SENHA TEMPORÁRIA:* {{SENHA}}

*IMPORTANTE:* Altere sua senha no primeiro acesso!

*Acesse o sistema em:*
https://easy.wgalmeida.com.br

Atenciosamente,
Equipe WG Easy`,
  },

  // ============================================
  // CONTATO DIRETO
  // ============================================
  CONTATO_PESSOA: {
    tipo: "CONTATO_PESSOA",
    nome: "Contato com Pessoa",
    descricao: "Mensagem padrÍo ao entrar em contato com uma pessoa",
    variaveis: ["{{NOME}}"],
    templatePadrao: `Olá {{NOME}}, tudo bem?

Aqui é do Grupo WG Almeida.`,
  },
};

// Chave do localStorage
const STORAGE_KEY = "wgeasy_templates_mensagem_v2";

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE TEMPLATES
// ============================================

/**
 * Obtém todos os templates personalizados do localStorage
 */
export function getTemplatesPersonalizados(): Partial<Record<TipoTemplate, string>> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Partial<Record<TipoTemplate, string>>) : {};
  } catch {
    return {};
  }
}

/**
 * Salva um template personalizado
 */
export function salvarTemplate(tipo: TipoTemplate, template: string): void {
  const templates = getTemplatesPersonalizados();
  templates[tipo] = template;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Restaura um template para o padrÍo (remove customizaçÍo)
 */
export function restaurarTemplatePadrao(tipo: TipoTemplate): void {
  const templates = getTemplatesPersonalizados();
  delete templates[tipo];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Obtém o template atual (personalizado ou padrÍo)
 */
export function getTemplate(tipo: TipoTemplate): string {
  const personalizados = getTemplatesPersonalizados();
  return personalizados[tipo] || TEMPLATES_PADRAO[tipo]?.templatePadrao || "";
}

/**
 * Verifica se um template está personalizado
 */
export function isTemplatePersonalizado(tipo: TipoTemplate): boolean {
  const personalizados = getTemplatesPersonalizados();
  return tipo in personalizados;
}

/**
 * Obtém a configuraçÍo de um template
 */
export function getTemplateConfig(tipo: TipoTemplate): TemplateConfig | undefined {
  return TEMPLATES_PADRAO[tipo];
}

// ============================================
// FUNÇÕES DE GERAÇÍO DE MENSAGENS
// ============================================

/**
 * Substitui variáveis no template
 */
export function processarTemplate(
  tipo: TipoTemplate,
  variaveis: Record<string, string>
): string {
  let template = getTemplate(tipo);

  // Substituir cada variável
  for (const [chave, valor] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, "g");
    template = template.replace(regex, valor);
  }

  return template;
}

/**
 * Gera URL de produçÍo (substitui localhost)
 */
export function getUrlProducao(url: string): string {
  return url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);
}

/**
 * Gera mensagem para WhatsApp
 */
export function gerarMensagemWhatsApp(
  tipo: TipoTemplate,
  variaveis: Record<string, string>
): string {
  // Se tiver LINK, garantir que use URL de produçÍo
  if (variaveis.LINK) {
    variaveis.LINK = getUrlProducao(variaveis.LINK);
  }
  return processarTemplate(tipo, variaveis);
}

/**
 * Gera URL do WhatsApp com mensagem
 */
export function gerarUrlWhatsApp(mensagem: string, telefone?: string): string {
  const encoded = encodeURIComponent(mensagem);
  if (telefone) {
    const tel = telefone.replace(/\D/g, "");
    // Adicionar 55 se não tiver código do país
    const telFormatado = tel.length <= 11 ? `55${tel}` : tel;
    return `https://wa.me/${telFormatado}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Gera mensagem para Email (remove asteriscos do markdown)
 */
export function gerarMensagemEmail(
  tipo: TipoTemplate,
  variaveis: Record<string, string>
): string {
  // Se tiver LINK, garantir que use URL de produçÍo
  if (variaveis.LINK) {
    variaveis.LINK = getUrlProducao(variaveis.LINK);
  }
  // Processar template e remover asteriscos (markdown)
  return processarTemplate(tipo, variaveis).replace(/\*/g, "");
}

/**
 * Gera URL mailto para email
 */
export function gerarUrlEmail(
  assunto: string,
  corpo: string,
  email?: string
): string {
  const encodedAssunto = encodeURIComponent(assunto);
  const encodedCorpo = encodeURIComponent(corpo);
  return `mailto:${email || ""}?subject=${encodedAssunto}&body=${encodedCorpo}`;
}

// ============================================
// MAPEAMENTOS DE TIPO (para compatibilidade)
// ============================================

/**
 * Mapeia tipo de cadastro antigo para novo tipo de template
 */
export function mapearTipoCadastroParaTemplate(
  tipoCadastro: string,
  isServico = false
): TipoTemplate {
  if (isServico) return "CADASTRO_SERVICO";

  const mapa: Record<string, TipoTemplate> = {
    CLIENTE: "CADASTRO_CLIENTE",
    COLABORADOR: "CADASTRO_COLABORADOR",
    FORNECEDOR: "CADASTRO_FORNECEDOR",
    ESPECIFICADOR: "CADASTRO_ESPECIFICADOR",
  };

  return mapa[tipoCadastro] || "CADASTRO_CLIENTE";
}

/**
 * Obtém label amigável do tipo de template
 */
export function getLabelTipoTemplate(tipo: TipoTemplate): string {
  return TEMPLATES_PADRAO[tipo]?.nome || tipo;
}


