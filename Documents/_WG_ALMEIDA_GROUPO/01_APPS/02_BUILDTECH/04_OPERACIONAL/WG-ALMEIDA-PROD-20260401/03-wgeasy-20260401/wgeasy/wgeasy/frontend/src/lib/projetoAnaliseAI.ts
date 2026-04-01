/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// Análise de Projetos Arquitetônicos com IA
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "./supabaseClient";
import { anthropicChat } from "./apiSecure";

/**
 * Tipos de dados extraídos de projetos
 */
export interface AmbienteExtraido {
  nome: string;
  largura?: number;
  comprimento?: number;
  area?: number;
  pe_direito?: number;
  descricao?: string;
  tipo?: string; // quarto, sala, cozinha, etc.
}

export interface ElementoArquitetonico {
  tipo:
    | "porta"
    | "janela"
    | "vao"
    | "tomada"
    | "interruptor"
    | "luminaria"
    | "circuito";
  ambiente?: string;
  quantidade: number;
  descricao?: string;
  medidas?: {
    largura?: number;
    altura?: number;
    profundidade?: number;
  };
}

export interface AcabamentoExtraido {
  tipo:
    | "piso"
    | "parede"
    | "teto"
    | "pintura"
    | "papel_parede"
    | "marmore"
    | "vidro"
    | "box"
    | "espelho"
    | "revestimento";
  ambiente?: string;
  material?: string;
  area?: number;
  metragem_linear?: number;
  quantidade?: number;
  descricao?: string;
}

// Interface para serviços de obra extraídos do escopo
export interface ServicoExtraido {
  categoria: string;
  nucleo?: "arquitetura" | "engenharia" | "marcenaria" | "produtos";
  tipo: string;
  descricao: string;
  ambiente?: string;
  ambientes?: string[];
  unidade: string;
  quantidade?: number;
  area?: number;
  metragem_linear?: number;
  especificacoes?: {
    material?: string;
    dimensoes?: string;
    espessura?: number;
    modelo?: string;
    marca?: string;
  };
  vinculo_pricelist?: {
    termo_busca: string;
    palavras_chave: string[];
    categoria_sugerida?: string;
  };
  prioridade?: "critica" | "alta" | "media" | "baixa";
  status_item?: "a_definir" | "aprovado" | "excluido" | "em_andamento" | "concluido";
  observacoes?: string;
  ordem: number;
}

export interface RiscoExtraido {
  tema: string;
  severidade: "alto" | "medio" | "baixo";
  descricao: string;
  acao_necessaria?: string;
}

export interface ProjetoAnalisado {
  ambientes: AmbienteExtraido[];
  elementos: ElementoArquitetonico[];
  acabamentos: AcabamentoExtraido[];
  servicos: ServicoExtraido[];
  riscos: RiscoExtraido[];
  observacoes?: string[];
  metadados?: {
    tipo_projeto?: "arquitetonico" | "hidraulico" | "eletrico" | "estrutural" | string;
    escala?: string;
    data_projeto?: string;
    estilo_conceito?: string;
    intervencao_principal?: string;
    proximos_passos?: string[];
    perfil_cliente?: string;
  };
}

/**
 * ConfiguraçÍo da API de IA
 * Suporta OpenAI, Anthropic Claude, ou Google Gemini
 */
type AIProvider = "openai" | "anthropic" | "gemini";

const DEFAULT_PROVIDER =
  (import.meta.env.VITE_AI_PROVIDER as AIProvider) || "openai";

const AI_MODELS: Record<AIProvider, string> = {
  openai: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
  anthropic: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  gemini: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash",
};

// SEGURANÇA: não usar chaves de API no frontend - sempre usar backend proxy
const AI_KEYS: Record<AIProvider, string> = {
  openai: "", // Removido - usar backend proxy
  anthropic: "", // Removido - usar backend proxy
  gemini: "", // Removido - usar backend proxy
};

// URL do backend para proxy das chamadas de IA
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

// SEGURANÇA: Sempre usar backend proxy para não expor chaves de API
const USE_BACKEND_PROXY = true;

const AI_CONFIG = {
  provider: DEFAULT_PROVIDER,
  maxTokens: 4000, // Limite de 4000 tokens/min na Anthropic - use OpenAI para análises maiores
};

export function setAIProvider(provider: AIProvider) {
  AI_CONFIG.provider = provider;
}

function getModel(provider: AIProvider = AI_CONFIG.provider) {
  return AI_MODELS[provider];
}

function getApiKey(provider: AIProvider = AI_CONFIG.provider) {
  return AI_KEYS[provider];
}

/**
 * Contexto do projeto para a IA (área cadastrada, tipo, etc.)
 */
export interface ContextoAnaliseIA {
  areaTotalCadastrada?: number; // Área total do imóvel cadastrada pelo usuário
  tipoImovel?: string; // Tipo do imóvel (apartamento, casa, etc.)
  tipoProjeto?: string; // Tipo do projeto (reforma, construçÍo, etc.)
  padraoConstrutivo?: string; // PadrÍo construtivo (alto, médio, popular)
  numeroArquivos?: number; // Quantos arquivos estÍo sendo analisados
  arquivoAtual?: number; // Qual arquivo está sendo analisado agora (1, 2, 3...)
}

/**
 * Analisar projeto arquitetônico a partir de imagem
 */
export async function analisarProjetoComIA(
  imagemBase64: string,
  tipoAnalise:
    | "completo"
    | "ambientes"
    | "elementos"
    | "acabamentos" = "completo",
  mediaType:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp" = "image/jpeg",
  promptPersonalizado?: string,
  contexto?: ContextoAnaliseIA
): Promise<ProjetoAnalisado> {
  try {
    // Montar prompt específico para análise de projetos
    let prompt = montarPromptAnalise(tipoAnalise);

    // Adicionar contexto do projeto (ÁREA CADASTRADA) - CRÍTICO!
    if (contexto) {
      prompt += `\n\n### CONTEXTO DO PROJETO (INFORMAÇÕES CADASTRADAS PELO USUÁRIO):\n`;

      if (contexto.areaTotalCadastrada && contexto.areaTotalCadastrada > 0) {
        prompt += `
⚠️ ATENÇÍO - ÁREA TOTAL DO IMÓVEL: ${contexto.areaTotalCadastrada} m²

REGRA CRÍTICA: A área total de TODOS os ambientes somados não PODE ultrapassar ${contexto.areaTotalCadastrada} m².
- Se você está analisando múltiplos arquivos de plantas, eles sÍo VISTAS DIFERENTES do mesmo imóvel
- não sÍo pavimentos diferentes que devem ter as áreas somadas
- A soma total dos ambientes deve se ajustar a aproximadamente ${contexto.areaTotalCadastrada} m²
- Se identificar áreas maiores que o cadastrado, RECALCULE proporcionalmente
`;
      }

      if (contexto.numeroArquivos && contexto.numeroArquivos > 1) {
        prompt += `
📄 MÚLTIPLOS ARQUIVOS: Este é o arquivo ${contexto.arquivoAtual || 1} de ${
          contexto.numeroArquivos
        }.
- Os arquivos sÍo PLANTAS COMPLEMENTARES do mesmo projeto
- Podem ser: planta baixa, planta de layout, cortes, detalhes, etc.
- não DUPLIQUE ambientes que já foram identificados em outras plantas
- Extraia apenas informações NOVAS ou COMPLEMENTARES
`;
      }

      if (contexto.tipoImovel) {
        prompt += `\nTipo de imóvel: ${contexto.tipoImovel}`;
      }
      if (contexto.tipoProjeto) {
        prompt += `\nTipo de projeto: ${contexto.tipoProjeto}`;
      }
      if (contexto.padraoConstrutivo) {
        prompt += `\nPadrÍo construtivo: ${contexto.padraoConstrutivo}`;
      }
    }

    // Adicionar instruções personalizadas do usuário, se houver
    if (promptPersonalizado && promptPersonalizado.trim()) {
      prompt += `\n\n### INSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${promptPersonalizado.trim()}`;
    }

    // Chamar API de IA com visÍo
    const resultado = await chamarAPIVisao(imagemBase64, prompt, mediaType);

    // Parsear resposta e estruturar dados
    const projetoAnalisado = parsearRespostaIA(resultado);

    return projetoAnalisado;
  } catch (error: any) {
    console.error("Erro ao analisar projeto com IA:", error);
    // Propagar o erro original com detalhes
    const mensagemOriginal = error?.message || "Erro desconhecido";
    throw new Error(mensagemOriginal);
  }
}

/**
 * Montar prompt otimizado para análise de projetos
 */
function montarPromptAnalise(tipoAnalise: string): string {
  const promptsBase = {
    completo: `
Você é uma IA Especialista em Arquitetura, Engenharia, BIM e OrçamentaçÍo de Obras, treinada para atuar em nível profissional (equivalente a um Arquiteto + Engenheiro + Orçamentista Sênior).

Analise esta planta arquitetônica e extraia TODAS as informações em formato JSON estruturado.

## REGRAS CRÍTICAS DE EXTRAÇÍO

### Regra 1: Área em m² TEM PRIORIDADE ABSOLUTA
- Quando a área estiver descrita no projeto (ex: "12,45 m²", "35m2", "STUDIO 35m²"), use EXATAMENTE esse valor
- NUNCA recalcule área quando ela já está informada no projeto
- Se largura × comprimento resultar em área diferente da informada, USE A ÁREA INFORMADA
- Para studio/monoambiente: a área total do imóvel informada é a área do ambiente principal
- Priorize SEMPRE valores escritos na planta antes de estimar

### Regra 1.1: Lógica Proporcional quando só tem Área
- Se a área está informada mas não tem largura/comprimento, calcule como ambiente quadrado equivalente:
  - Lado = √(área)
  - Exemplo: área 35m² → lado = 5.92m → largura ≈ 5.92m, comprimento ≈ 5.92m
- Nunca invente dimensões que resultem em área diferente da informada

### Regra 2: Cálculo de Perímetro
- Perímetro = soma de todos os lados do ambiente
- Para retângulos: P = 2 × (largura + comprimento)
- Se tem área mas não tem dimensões: P = 4 × √(área)

### Regra 3: Área de Paredes
- Área bruta = Perímetro × Pé-direito
- Área líquida = Área bruta - Área de vÍos (portas + janelas)

### Regra 4: IdentificaçÍo de VÍos (Descontar das Paredes)
PORTAS - Medidas padrÍo quando não especificado:
  - Banheiro: 0,62m ou 0,72m × 2,10m
  - Quartos: 0,72m ou 0,82m × 2,10m
  - Entrada: 0,82m ou 0,92m × 2,10m

JANELAS - Medidas padrÍo quando não especificado:
  - Quartos pequenos/médios: 1,00×1,20 ou 1,50×1,20
  - Quartos grandes/salas: 2,00×1,50
  - Banheiros/lavanderia: 0,60×0,60 ou 0,80×0,80
  - Janelas de corrida: 1,00×1,20 / 1,20×1,50 / 1,00×2,00 / 1,20×2,00
  - Regra: Área mínima da janela = Área do ambiente ÷ 6

### Regra 5: Pé-direito
- Se especificado na planta (ex: "PD 2,90m"), use exatamente
- PadrÍo residencial: 2,70m
- Áreas sociais podem ter 3,00m ou mais

### Regra 6: Instalações Elétricas
TOMADAS - Identificar por ambiente:
  - Tipo: 110V, 220V, ou uso específico (forno, cooktop, ar-condicionado)

ILUMINAÇÍO - Identificar:
  - Plafon, spots, LED embutido, fita LED
  - Quantidade por ambiente

INTERRUPTORES - Identificar:
  - Simples, Paralelo, Intermediário
  - Caixa: 4×2 ou 4×4

### Regra 7: Instalações Hidráulicas
Identificar pontos de:
  - Água fria
  - Água quente
  - Esgoto
  - Gás
  - TubulaçÍo seca (HDMI, etc.)

## PARA CADA AMBIENTE IDENTIFICAR:

1. IDENTIFICAÇÍO
   - Nome exato como aparece na planta
   - Tipo (quarto, suite, sala, cozinha, banheiro, lavabo, área_servico, etc.)
   - Dimensões lineares (largura × comprimento)

2. ÁREAS
   - Área do piso (m²)
   - Área do teto (m²) - geralmente igual ao piso
   - Pé-direito (m)
   - Perímetro (m)
   - Área de paredes bruta (m²)
   - Área de vÍos total (m²)
   - Área de paredes líquida (m²)

3. VÍOS
   - Portas: quantidade, largura, altura, tipo
   - Janelas: quantidade, largura, altura, tipo

4. INSTALAÇÕES ELÉTRICAS
   - Tomadas 110V: quantidade
   - Tomadas 220V: quantidade
   - Pontos de iluminaçÍo: quantidade
   - Interruptores: quantidade

5. INSTALAÇÕES HIDRÁULICAS (quando visível)
   - Pontos de água fria
   - Pontos de água quente
   - Pontos de esgoto
   - Pontos de gás

## FORMATO DE SAÍDA - Retorne APENAS JSON válido:

{
  "ambientes": [
    {
      "nome": "string",
      "tipo": "quarto|suite|sala|cozinha|banheiro|lavabo|area_servico|lavanderia|varanda|escritorio|closet|corredor|hall|outro",
      "largura": number,
      "comprimento": number,
      "area": number,
      "pe_direito": number,
      "perimetro": number,
      "area_paredes_bruta": number,
      "area_paredes_liquida": number,
      "descricao": "string"
    }
  ],
  "elementos": [
    {
      "tipo": "porta|janela|vao|tomada|interruptor|luminaria|circuito",
      "ambiente": "string",
      "quantidade": number,
      "descricao": "string",
      "medidas": {
        "largura": number,
        "altura": number
      }
    }
  ],
  "acabamentos": [
    {
      "tipo": "piso|parede|teto|pintura|papel_parede|marmore|vidro|box|espelho|revestimento|rodape|forro",
      "ambiente": "string",
      "material": "string",
      "area": number,
      "metragem_linear": number,
      "quantidade": number,
      "descricao": "string"
    }
  ],
  "observacoes": ["string"],
  "metadados": {
    "tipo_projeto": "arquitetonico|hidraulico|eletrico|estrutural",
    "escala": "string",
    "data_projeto": "string"
  }
}

## COMPORTAMENTO
- Nunca "chutar" sem indicar inferência nas observações
- Priorizar dados explícitos do projeto
- Ser conservador em quantitativos (preferir subestimar a superestimar)
- Pensar como obra real, não só projeto
- Incluir observações quando dados foram inferidos
- Adicionar margem técnica de 10-20% nas metragens lineares
`,

    ambientes: `
Analise esta planta e identifique TODOS os ambientes, extraindo:
- Nome do ambiente
- Dimensões (largura e comprimento em metros)
- Área em m²
- Pé-direito se houver indicaçÍo na planta (texto como "PD 2,90m", "pé direito 3,00 m", etc.)
- Tipo de ambiente

Copie os nomes e medidas exatamente como aparecem. Priorize as cotas escritas no desenho (inclusive metros lineares e valores em m²) antes de estimar.

Retorne JSON com formato:
{
  "ambientes": [
    {
      "nome": "string",
      "largura": number,
      "comprimento": number,
      "area": number,
      "pe_direito": number,
      "tipo": "string"
    }
  ]
}
`,

    elementos: `
Analise esta planta e identifique TODOS os elementos arquitetônicos:
- Portas (quantidade, tipo, medidas)
- Janelas (quantidade, tipo, medidas)
- Tomadas elétricas por ambiente
- Interruptores por ambiente
- Pontos de luz/luminárias
- Circuitos elétricos

Retorne JSON estruturado.
`,

    acabamentos: `
Analise esta planta e identifique todos os acabamentos e materiais especificados:
- Tipos de piso por ambiente e área
- Revestimentos de parede
- Áreas para pintura
- Mármore, granito, vidros
- Box de banheiro
- Espelhos
- Rodapés (metragem linear)
- Cortineiros

Retorne JSON estruturado.
`,
  };

  return (
    promptsBase[tipoAnalise as keyof typeof promptsBase] || promptsBase.completo
  );
}

/**
 * Chamar API de IA com suporte a visÍo
 * NOTA: Prefere Anthropic Claude que funciona no browser sem problemas de CORS
 */
async function chamarAPIVisao(
  imagemBase64: string,
  prompt: string,
  mediaType:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp" = "image/jpeg"
): Promise<string> {
  const provider = AI_CONFIG.provider;

  if (provider === "anthropic") {
    console.log("[IA] Usando Anthropic Claude (via backend proxy)");
    return await chamarClaudeVision(imagemBase64, prompt, mediaType);
  }

  if (provider === "openai") {
    console.log(
      `[IA] Usando OpenAI ${
        USE_BACKEND_PROXY ? "(via backend proxy)" : "(direto - pode ter CORS)"
      }`
    );
    return await chamarOpenAIVision(imagemBase64, prompt, mediaType);
  }

  if (provider === "gemini") {
    return await chamarGeminiVision(imagemBase64, prompt, mediaType);
  }

  throw new Error(
    "Provedor de IA não configurado. Configure VITE_ANTHROPIC_API_KEY ou VITE_OPENAI_API_KEY."
  );
}

/**
 * Chamar OpenAI Vision API
 * Usa backend como proxy para evitar problemas de CORS e proteger a chave de API
 */
async function chamarOpenAIVision(
  imagemBase64: string,
  prompt: string,
  mediaType: string = "image/jpeg"
): Promise<string> {
  const requestBody = {
    model: getModel("openai"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${imagemBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: AI_CONFIG.maxTokens,
    temperature: 0.1, // Baixa temperatura para respostas mais precisas
  };

  // Usar backend como proxy (recomendado)
  if (USE_BACKEND_PROXY) {
    const response = await fetch(`${BACKEND_URL}/api/openai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || errorData.error || response.statusText;
      throw new Error(
        `OpenAI Vision via proxy (${response.status}): ${errorMessage}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Resposta inválida da API OpenAI");
    }

    return data.choices[0].message.content;
  }

  // SEGURANÇA: não permitir chamada direta - sempre usar backend proxy
  throw new Error(
    "Backend não configurado. Configure VITE_BACKEND_URL e VITE_INTERNAL_API_KEY para usar a IA."
  );
}

/**
 * Chamar OpenAI para análise de texto (sem imagem)
 * Usado para análise de escopo com tokens maiores
 *
 * Usa backend como proxy para evitar problemas de CORS e proteger a chave de API
 */
async function chamarOpenAITexto(
  prompt: string,
  maxTokens: number = 16000,
  temperature: number = 0.1
): Promise<{ texto: string; finishReason: string; usage: any }> {
  const requestBody = {
    model: getModel("openai"),
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: maxTokens,
    temperature,
  };

  // Usar backend como proxy (recomendado)
  if (USE_BACKEND_PROXY) {
    const response = await fetch(`${BACKEND_URL}/api/openai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || errorData.error || response.statusText;
      throw new Error(
        `OpenAI API via proxy (${response.status}): ${errorMessage}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Resposta inválida da API OpenAI");
    }

    return {
      texto: data.choices[0].message.content || "",
      finishReason: data.choices[0].finish_reason || "unknown",
      usage: data.usage,
    };
  }

  // Segurança: chamada direta do browser desativada para não expor chaves.
  throw new Error(
    "Chamada direta à OpenAI desativada por segurança. Inicie o backend e configure VITE_BACKEND_URL e VITE_INTERNAL_API_KEY."
  );
}

/**
 * Chamar Anthropic Claude Vision API
 */
async function chamarClaudeVision(
  imagemBase64: string,
  prompt: string,
  mediaType:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp" = "image/jpeg"
): Promise<string> {
  const message = await anthropicChat(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imagemBase64,
            },
          },
        ],
      },
    ],
    {
      model: getModel("anthropic"),
      maxTokens: AI_CONFIG.maxTokens,
    }
  );

  const texto = (message?.content || [])
    .map((parte: any) => (parte.type === "text" ? parte.text : ""))
    .join("\n")
    .trim();

  if (!texto) {
    throw new Error("A resposta da Anthropic não pôde ser interpretada.");
  }

  return texto;
}

/**
 * Chamar Google Gemini Vision API
 */
async function chamarGeminiVision(
  imagemBase64: string,
  prompt: string,
  mediaType: string = "image/jpeg"
): Promise<string> {
  const apiKey = getApiKey("gemini");
  if (!apiKey) {
    throw new Error(
      "Configure VITE_GEMINI_API_KEY para usar o provedor Gemini."
    );
  }

  const model = getModel("gemini");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: mediaType,
                  data: imagemBase64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro na API Gemini: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ============================================================
// SISTEMA ROBUSTO DE PARSING JSON - TOLERANTE A ERROS
// ============================================================

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  strategy?: string;
}

/**
 * Parser JSON robusto e inteligente
 * Tenta múltiplas estratégias para recuperar JSON malformado
 */
function parseJsonRobusto<T = any>(texto: string): ParseResult<T> {
  const estrategias: Array<{
    nome: string;
    transformar: (str: string) => string;
  }> = [
    // 1. Tentativa direta (JSON perfeito)
    {
      nome: "parse_direto",
      transformar: (str) => str,
    },
    // 2. Remover vírgulas extras antes de ] ou }
    {
      nome: "remover_virgulas_extras",
      transformar: (str) => str.replace(/,(\s*[\]}])/g, "$1"),
    },
    // 3. Adicionar vírgulas faltantes entre elementos
    {
      nome: "adicionar_virgulas",
      transformar: (str) =>
        str
          .replace(/}(\s*){/g, "},$1{")
          .replace(/](\s*)\[/g, "],$1[")
          .replace(/"(\s*)"/g, '",$1"')
          .replace(/}(\s*)"/g, '},$1"')
          .replace(/"(\s*){/g, '",$1{'),
    },
    // 4. Corrigir aspas escapadas incorretamente
    {
      nome: "corrigir_aspas",
      transformar: (str) =>
        str
          .replace(/\\'/g, "'")
          .replace(/(?<!\\)\\(?!["\\bfnrt])/g, "\\\\")
          // eslint-disable-next-line no-control-regex
          .replace(/[\x00-\x1F\x7F]/g, (c) => {
            if (c === "\n") return "\\n";
            if (c === "\r") return "\\r";
            if (c === "\t") return "\\t";
            return "";
          }),
    },
    // 5. Remover comentários JavaScript/JSON5
    {
      nome: "remover_comentarios",
      transformar: (str) =>
        str.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, ""),
    },
    // 6. Normalizar quebras de linha em strings
    {
      nome: "normalizar_quebras",
      transformar: (str) => {
        // Encontrar strings e substituir quebras reais por \n
        let resultado = "";
        let dentroString = false;
        let charAnterior = "";
        for (let i = 0; i < str.length; i++) {
          const c = str[i];
          if (c === '"' && charAnterior !== "\\") {
            dentroString = !dentroString;
          }
          if (dentroString && c === "\n") {
            resultado += "\\n";
          } else if (dentroString && c === "\r") {
            // Ignorar \r
          } else {
            resultado += c;
          }
          charAnterior = c;
        }
        return resultado;
      },
    },
    // 7. Limpeza agressiva - remover tudo após erro de sintaxe
    {
      nome: "truncar_no_erro",
      transformar: (str) => {
        // Tentar encontrar onde o JSON está "completo"
        let depth = 0;
        let lastValidEnd = -1;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === "{" || str[i] === "[") depth++;
          if (str[i] === "}" || str[i] === "]") {
            depth--;
            if (depth === 0) {
              lastValidEnd = i;
              break;
            }
          }
        }
        return lastValidEnd > 0 ? str.substring(0, lastValidEnd + 1) : str;
      },
    },
    // 8. Balanceamento de chaves
    {
      nome: "balancear_chaves",
      transformar: (str) => {
        let open = 0;
        let close = 0;
        for (const c of str) {
          if (c === "{") open++;
          if (c === "}") close++;
        }
        // Adicionar chaves faltantes no final
        while (close < open) {
          str += "}";
          close++;
        }
        return str;
      },
    },
    // 9. Limpeza completa e normalizaçÍo
    {
      nome: "limpeza_completa",
      transformar: (str) => {
        return (
          str
            // Remover BOM e caracteres invisíveis
            .replace(/^\uFEFF/, "")
            .replace(/[\u200B-\u200D\uFEFF]/g, "")
            // Normalizar espaços
            .replace(/\s+/g, " ")
            // Remover vírgulas extras
            .replace(/,(\s*[\]}])/g, "$1")
            // Corrigir números com vírgula (pt-BR) para ponto
            .replace(/(\d),(\d)/g, "$1.$2")
            // Remover trailing commas em arrays/objects
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
        );
      },
    },
  ];

  // Pré-processamento: extrair JSON do texto
  let jsonStr = texto.trim();

  // Remover markdown code blocks de forma mais agressiva
  jsonStr = jsonStr.replace(/^```json\s*/i, "");
  jsonStr = jsonStr.replace(/^```\s*/i, "");
  jsonStr = jsonStr.replace(/```$/g, "");
  jsonStr = jsonStr.replace(/```json/gi, "");
  jsonStr = jsonStr.replace(/```/g, "");
  jsonStr = jsonStr.trim();

  // Encontrar o JSON principal
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    // Tentar encontrar array
    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      lastBracket > firstBracket
    ) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    } else {
      return {
        success: false,
        error: "Nenhum JSON encontrado na resposta",
      };
    }
  } else {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  // Tentar cada estratégia
  for (const estrategia of estrategias) {
    try {
      const transformado = estrategia.transformar(jsonStr);
      const parsed = JSON.parse(transformado);
      console.log(`[JSON Parser] Sucesso com estratégia: ${estrategia.nome}`);
      return {
        success: true,
        data: parsed as T,
        strategy: estrategia.nome,
      };
    } catch (e) {
      // Continuar para próxima estratégia
    }
  }

  // Todas as estratégias simples falharam, tentar combinações
  const combinacoes = [
    ["remover_virgulas_extras", "corrigir_aspas"],
    ["remover_comentarios", "remover_virgulas_extras"],
    ["normalizar_quebras", "remover_virgulas_extras", "balancear_chaves"],
    ["limpeza_completa", "balancear_chaves"],
    ["truncar_no_erro", "limpeza_completa"],
  ];

  for (const combo of combinacoes) {
    try {
      let resultado = jsonStr;
      for (const nomeEstrategia of combo) {
        const estrategia = estrategias.find((e) => e.nome === nomeEstrategia);
        if (estrategia) {
          resultado = estrategia.transformar(resultado);
        }
      }
      const parsed = JSON.parse(resultado);
      console.log(`[JSON Parser] Sucesso com combinaçÍo: ${combo.join(" + ")}`);
      return {
        success: true,
        data: parsed as T,
        strategy: combo.join(" + "),
      };
    } catch (e) {
      // Continuar para próxima combinaçÍo
    }
  }

  // Última tentativa: usar regex para extrair dados manualmente
  try {
    const dadosExtraidos = extrairDadosManualmente(jsonStr);
    if (dadosExtraidos) {
      console.log("[JSON Parser] Sucesso com extraçÍo manual");
      return {
        success: true,
        data: dadosExtraidos as T,
        strategy: "extracao_manual",
      };
    }
  } catch (e) {
    // Ignorar
  }

  // Falha total - retornar erro detalhado
  const posicaoErro = encontrarPosicaoErro(jsonStr);
  return {
    success: false,
    error: `Impossível parsear JSON. Erro próximo à posiçÍo ${posicaoErro.posicao}: "${posicaoErro.contexto}"`,
  };
}

/**
 * Extrair dados manualmente quando JSON está muito corrompido
 */
function extrairDadosManualmente(texto: string): any {
  const resultado: any = {
    ambientes: [],
    elementos: [],
    acabamentos: [],
    servicos: [],
    observacoes: [],
  };

  // Tentar extrair arrays individuais
  const padraoAmbientes = /"ambientes"\s*:\s*\[([\s\S]*?)\]/;
  const padraoServicos = /"servicos"\s*:\s*\[([\s\S]*?)\]/;
  const padraoElementos = /"elementos"\s*:\s*\[([\s\S]*?)\]/;

  const matchAmbientes = texto.match(padraoAmbientes);
  if (matchAmbientes) {
    try {
      resultado.ambientes = JSON.parse(`[${matchAmbientes[1]}]`);
    } catch {
      resultado.ambientes = extrairObjetosDeArray(matchAmbientes[1]);
    }
  }

  const matchServicos = texto.match(padraoServicos);
  if (matchServicos) {
    try {
      resultado.servicos = JSON.parse(`[${matchServicos[1]}]`);
    } catch {
      resultado.servicos = extrairObjetosDeArray(matchServicos[1]);
    }
  }

  const matchElementos = texto.match(padraoElementos);
  if (matchElementos) {
    try {
      resultado.elementos = JSON.parse(`[${matchElementos[1]}]`);
    } catch {
      resultado.elementos = extrairObjetosDeArray(matchElementos[1]);
    }
  }

  // Verificar se extraiu algo útil
  const temDados =
    resultado.ambientes.length > 0 ||
    resultado.servicos.length > 0 ||
    resultado.elementos.length > 0;

  return temDados ? resultado : null;
}

/**
 * Extrair objetos individuais de um array corrompido
 */
function extrairObjetosDeArray(conteudo: string): any[] {
  const objetos: any[] = [];
  const regex = /\{[^{}]*\}/g;
  let match;

  while ((match = regex.exec(conteudo)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      objetos.push(obj);
    } catch {
      // Objeto individual inválido, tentar limpar
      try {
        const limpo = match[0].replace(/,(\s*})/g, "$1").replace(/'/g, '"');
        const obj = JSON.parse(limpo);
        objetos.push(obj);
      } catch {
        // Ignorar objeto inválido
      }
    }
  }

  return objetos;
}

/**
 * Encontrar posiçÍo aproximada do erro no JSON
 */
function encontrarPosicaoErro(json: string): {
  posicao: number;
  contexto: string;
} {
  try {
    JSON.parse(json);
    return { posicao: 0, contexto: "" };
  } catch (e: any) {
    const match = e.message.match(/position\s+(\d+)/i);
    if (match) {
      const pos = parseInt(match[1]);
      const inicio = Math.max(0, pos - 20);
      const fim = Math.min(json.length, pos + 20);
      return {
        posicao: pos,
        contexto: json.substring(inicio, fim),
      };
    }
    return { posicao: 0, contexto: json.substring(0, 50) };
  }
}

/**
 * Parsear resposta da IA e estruturar dados
 * VersÍo robusta com múltiplas estratégias de recuperaçÍo
 */
function parsearRespostaIA(resposta: string): ProjetoAnalisado {
  if (detectarRespostaRecusada(resposta)) {
    throw new Error(
      "A IA recusou a solicitacao. Tente trocar o provedor ou ajustar o arquivo antes de analisar."
    );
  }

  const resultado = parseJsonRobusto<any>(resposta);

  if (!resultado.success) {
    console.error("[parsearRespostaIA] Falha no parsing:", resultado.error);
    console.error(
      "[parsearRespostaIA] Resposta (primeiros 1000 chars):",
      resposta.substring(0, 1000)
    );
    throw new Error(
      `não foi possível interpretar a resposta da IA: ${resultado.error}`
    );
  }

  const json = resultado.data;

  // Validar e normalizar dados com fallbacks seguros
  return {
    ambientes: validarArray(json?.ambientes, validarAmbiente),
    elementos: validarArray(json?.elementos, validarElemento),
    acabamentos: validarArray(json?.acabamentos, validarAcabamento),
    servicos: validarArray(json?.servicos, validarServico),
    riscos: Array.isArray(json?.riscos)
      ? json.riscos.filter((r: any) => r && typeof r.tema === "string" && typeof r.severidade === "string")
      : [],
    observacoes: Array.isArray(json?.observacoes)
      ? json.observacoes.filter((o: any) => typeof o === "string")
      : [],
    metadados: json?.metadados || {},
  };
}

/**
 * Detecta respostas de recusa/seguranca (sem JSON)
 */
function detectarRespostaRecusada(resposta: string): boolean {
  const primeiros500 = resposta.substring(0, 500).toLowerCase();
  const padroes = [
    /i\s*'?m\s*sorry/i,
    /i\s*cannot\s*assist/i,
    /i\s*can't\s*assist/i,
    /desculpe/i,
    /nao\s*posso\s*ajudar/i,
    /nao\s*posso\s*assistir/i,
  ];
  return padroes.some((p) => p.test(primeiros500));
}

/**
 * Validar e filtrar array com funçÍo de validaçÍo
 */
function validarArray<T>(arr: any, validador: (item: any) => T | null): T[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      try {
        return validador(item);
      } catch {
        return null;
      }
    })
    .filter((item): item is T => item !== null);
}

/**
 * Validar e normalizar ambiente
 */
function validarAmbiente(item: any): AmbienteExtraido | null {
  if (!item || typeof item !== "object") return null;
  if (!item.nome && !item.tipo) return null;

  return {
    nome: String(item.nome || item.tipo || "Ambiente"),
    largura: typeof item.largura === "number" ? item.largura : undefined,
    comprimento:
      typeof item.comprimento === "number" ? item.comprimento : undefined,
    area: typeof item.area === "number" ? item.area : undefined,
    pe_direito:
      typeof item.pe_direito === "number" ? item.pe_direito : undefined,
    descricao: item.descricao ? String(item.descricao) : undefined,
    tipo: item.tipo ? String(item.tipo) : undefined,
  };
}

/**
 * Validar e normalizar elemento
 */
function validarElemento(item: any): ElementoArquitetonico | null {
  if (!item || typeof item !== "object") return null;
  if (!item.tipo) return null;

  return {
    tipo: item.tipo as ElementoArquitetonico["tipo"],
    ambiente: item.ambiente ? String(item.ambiente) : undefined,
    quantidade: typeof item.quantidade === "number" ? item.quantidade : 1,
    descricao: item.descricao ? String(item.descricao) : undefined,
    medidas: item.medidas
      ? {
          largura:
            typeof item.medidas.largura === "number"
              ? item.medidas.largura
              : undefined,
          altura:
            typeof item.medidas.altura === "number"
              ? item.medidas.altura
              : undefined,
          profundidade:
            typeof item.medidas.profundidade === "number"
              ? item.medidas.profundidade
              : undefined,
        }
      : undefined,
  };
}

/**
 * Validar e normalizar acabamento
 */
function validarAcabamento(item: any): AcabamentoExtraido | null {
  if (!item || typeof item !== "object") return null;
  if (!item.tipo) return null;

  return {
    tipo: item.tipo as AcabamentoExtraido["tipo"],
    ambiente: item.ambiente ? String(item.ambiente) : undefined,
    material: item.material ? String(item.material) : undefined,
    area: typeof item.area === "number" ? item.area : undefined,
    metragem_linear:
      typeof item.metragem_linear === "number"
        ? item.metragem_linear
        : undefined,
    quantidade:
      typeof item.quantidade === "number" ? item.quantidade : undefined,
    descricao: item.descricao ? String(item.descricao) : undefined,
  };
}

/**
 * Mapa de categoria → núcleo para inferir núcleo quando não informado
 */
const CATEGORIA_NUCLEO_MAP: Record<string, ServicoExtraido["nucleo"]> = {
  // ARQUITETURA
  arquitetura: "arquitetura",
  projeto: "arquitetura",
  design: "arquitetura",
  // MARCENARIA
  marcenaria: "marcenaria",
  moveis: "marcenaria",
  armarios: "marcenaria",
  mobiliario: "marcenaria",
  // PRODUTOS
  loucas_metais: "produtos",
  loucas: "produtos",
  metais: "produtos",
  pedras: "produtos",
  marmoraria: "produtos",
  vidracaria: "produtos",
  serralheria: "produtos",
  // ENGENHARIA (default para obras)
  demolicao: "engenharia",
  construcao: "engenharia",
  instalacoes_eletricas: "engenharia",
  instalacoes_hidraulicas: "engenharia",
  revestimentos: "engenharia",
  pintura: "engenharia",
  forros: "engenharia",
  esquadrias: "engenharia",
  impermeabilizacao: "engenharia",
  gerais: "engenharia",
  outros: "engenharia",
};

/**
 * Validar e normalizar serviço (versÍo permissiva)
 */
function validarServico(item: any): ServicoExtraido | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  // Aceitar se tiver qualquer campo útil
  const temDados =
    item.tipo || item.descricao || item.categoria || item.ambiente;
  if (!temDados) {
    console.log(
      "[validarServico] Rejeitado - sem dados úteis:",
      Object.keys(item)
    );
    return null;
  }

  const categoria = String(item.categoria || "outros").toLowerCase();

  // Determinar núcleo: usar informado pela IA ou inferir da categoria
  let nucleo: ServicoExtraido["nucleo"] = undefined;
  if (
    item.nucleo &&
    ["arquitetura", "engenharia", "marcenaria", "produtos"].includes(
      item.nucleo
    )
  ) {
    nucleo = item.nucleo;
  } else {
    nucleo = CATEGORIA_NUCLEO_MAP[categoria] || "engenharia";
  }

  return {
    categoria,
    nucleo,
    tipo: String(item.tipo || item.descricao?.substring(0, 50) || "servico"),
    descricao: String(item.descricao || item.tipo || "Serviço"),
    ambiente: item.ambiente ? String(item.ambiente) : "geral",
    ambientes: Array.isArray(item.ambientes)
      ? item.ambientes.map((a: any) => String(a))
      : undefined,
    unidade: String(item.unidade || "un"),
    quantidade:
      typeof item.quantidade === "number" ? item.quantidade : undefined,
    area: typeof item.area === "number" ? item.area : undefined,
    metragem_linear:
      typeof item.metragem_linear === "number"
        ? item.metragem_linear
        : undefined,
    especificacoes: item.especificacoes || undefined,
    vinculo_pricelist: item.vinculo_pricelist || undefined,
    observacoes: item.observacoes ? String(item.observacoes) : undefined,
    ordem: typeof item.ordem === "number" ? item.ordem : 0,
  };
}

/**
 * Processar arquivo de projeto e converter para base64
 * Nota: A API de visÍo aceita apenas JPEG, PNG, GIF e WebP
 */
export async function processarArquivoProjeto(arquivo: File): Promise<string> {
  // Verificar se é .docx — retornar flag especial para tratamento diferente
  if (arquivo.name.toLowerCase().endsWith(".docx")) {
    return "__DOCX__"; // Sinaliza que deve usar analisarDocumentoEscopo
  }

  return new Promise((resolve, reject) => {
    // Verificar tipo de arquivo - apenas imagens suportadas pela API de visÍo
    const tiposAceitos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!tiposAceitos.includes(arquivo.type)) {
      reject(
        new Error(
          "Tipo de arquivo não suportado. Use JPEG, PNG, GIF, WebP ou DOCX."
        )
      );
      return;
    }

    // Verificar tamanho (máximo 20MB para imagens)
    if (arquivo.size > 20 * 1024 * 1024) {
      reject(new Error("Arquivo muito grande. Tamanho máximo: 20MB"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"));
    };

    reader.readAsDataURL(arquivo);
  });
}

/**
 * Analisar documento de escopo técnico (.docx) e extrair dados estruturados
 * Extrai texto do .docx e envia para a IA parsear em formato AnaliseIAResultado
 */
export async function analisarDocumentoEscopo(
  textoDocumento: string,
  contexto?: ContextoAnaliseIA
): Promise<ProjetoAnalisado> {
  const promptEscopo = `
Você é uma IA Especialista em Arquitetura, Engenharia, BIM e OrçamentaçÍo de Obras.

Analise o documento de ANÁLISE TÉCNICA DE ESCOPO abaixo e extraia TODAS as informações em formato JSON estruturado.

## REGRAS DE EXTRAÇÍO

### 1. AMBIENTES
- Extrair TODOS os ambientes mencionados no quadro de áreas
- Para cada ambiente: nome, tipo, dimensões (largura × comprimento), área em m², observações
- Tipos válidos: quarto, suite, sala, cozinha, banheiro, lavabo, area_servico, lavanderia, varanda, sacada, escritorio, closet, corredor, hall, outro

### 2. ITENS DE ESCOPO (SERVIÇOS)
- Extrair TODOS os itens da tabela de escopo detalhado
- Para cada item: categoria, tipo, descriçÍo, ambiente, prioridade, status
- Categorias: gerais, demolicao, construcao, instalacoes_eletricas, instalacoes_hidraulicas, revestimentos, pintura, esquadrias, forros, marcenaria, loucas_metais, pedras, vidracaria, serralheria, climatizacao, automacao, paisagismo, outros
- Prioridade: critica, alta, media, baixa
- Status: a_definir, aprovado, excluido

### 3. RISCOS E PONTOS DE ATENÇÍO
- Extrair TODOS os riscos/pontos de atençÍo mencionados
- Para cada risco: tema, severidade (alto/medio/baixo), descriçÍo, açÍo necessária

### 4. ACABAMENTOS
- Extrair pisos, revestimentos, pinturas mencionados
- Para cada: tipo, ambiente, material, descriçÍo

### 5. METADADOS
- estilo_conceito: estilo do projeto (ex: "Industrial / Contemporâneo / Moderno")
- intervencao_principal: descriçÍo da intervençÍo principal
- proximos_passos: lista de próximas ações recomendadas
- perfil_cliente: preferências e perfil do cliente
- tipo_projeto: tipo da análise
- data_projeto: data do documento

## FORMATO DE SAÍDA - Retorne APENAS JSON válido:

{
  "ambientes": [
    {
      "nome": "string",
      "tipo": "string",
      "largura": number,
      "comprimento": number,
      "area": number,
      "pe_direito": 2.70,
      "descricao": "string"
    }
  ],
  "elementos": [],
  "acabamentos": [
    {
      "tipo": "piso|parede|teto|revestimento",
      "ambiente": "string",
      "material": "string",
      "descricao": "string"
    }
  ],
  "servicos": [
    {
      "categoria": "string",
      "tipo": "string",
      "descricao": "string",
      "ambiente": "string",
      "ambientes": ["string"],
      "unidade": "un",
      "quantidade": 1,
      "prioridade": "critica|alta|media|baixa",
      "status_item": "a_definir|aprovado|excluido",
      "especificacoes": {
        "material": "string",
        "dimensoes": "string",
        "modelo": "string",
        "marca": "string"
      },
      "observacoes": "string",
      "ordem": number
    }
  ],
  "riscos": [
    {
      "tema": "string",
      "severidade": "alto|medio|baixo",
      "descricao": "string",
      "acao_necessaria": "string"
    }
  ],
  "observacoes": ["string"],
  "metadados": {
    "tipo_projeto": "string",
    "data_projeto": "string",
    "estilo_conceito": "string",
    "intervencao_principal": "string",
    "proximos_passos": ["string"],
    "perfil_cliente": "string"
  }
}

## DOCUMENTO DE ESCOPO:
${textoDocumento}
`;

  // Adicionar contexto se disponível
  let promptFinal = promptEscopo;
  if (contexto?.areaTotalCadastrada) {
    promptFinal += `\n\nÁrea total cadastrada: ${contexto.areaTotalCadastrada} m²`;
  }
  if (contexto?.tipoImovel) {
    promptFinal += `\nTipo de imóvel: ${contexto.tipoImovel}`;
  }

  const respostaIA = await chamarOpenAITexto(promptFinal, 16000, 0.1);
  const resultado = parsearRespostaIA(respostaIA.texto);

  return resultado;
}

/**
 * Salvar análise de projeto no banco de dados
 */
export async function salvarAnaliseNoBanco(
  projetoId: string,
  analise: ProjetoAnalisado,
  nucleoId?: string | null
): Promise<void> {
  try {
    // Salvar ambientes
    if (analise.ambientes.length > 0) {
      const ambientesParaInserir = analise.ambientes.map((amb) => ({
        projeto_id: projetoId,
        nucleo_id: nucleoId || null,
        nome: amb.nome,
        largura: amb.largura,
        comprimento: amb.comprimento,
        area:
          amb.area ||
          (amb.largura && amb.comprimento ? amb.largura * amb.comprimento : 0),
        pe_direito: amb.pe_direito || 2.7,
        tipo_ambiente: amb.tipo,
        descricao: amb.descricao,
      }));

      const { error: erroAmbientes } = await supabase
        .from("quantitativos_ambientes")
        .insert(ambientesParaInserir);

      if (erroAmbientes) {
        console.error("Erro ao salvar ambientes:", erroAmbientes);
        throw erroAmbientes;
      }
    }

    // Salvar elementos arquitetônicos
    if (analise.elementos.length > 0) {
      const elementosParaInserir = analise.elementos.map((elem) => ({
        projeto_id: projetoId,
        nucleo_id: nucleoId || null,
        tipo_elemento: elem.tipo,
        ambiente: elem.ambiente,
        quantidade: elem.quantidade,
        descricao: elem.descricao,
        largura: elem.medidas?.largura,
        altura: elem.medidas?.altura,
      }));

      const { error: erroElementos } = await supabase
        .from("quantitativos_elementos")
        .insert(elementosParaInserir);

      if (erroElementos) {
        console.error("Erro ao salvar elementos:", erroElementos);
        // não bloquear se a tabela não existir ainda
      }
    }

    // Salvar acabamentos
    if (analise.acabamentos.length > 0) {
      const acabamentosParaInserir = analise.acabamentos.map((acab) => ({
        projeto_id: projetoId,
        nucleo_id: nucleoId || null,
        tipo_acabamento: acab.tipo,
        ambiente: acab.ambiente,
        material: acab.material,
        area_m2: acab.area,
        metragem_linear: acab.metragem_linear,
        quantidade: acab.quantidade,
        descricao: acab.descricao,
      }));

      const { error: erroAcabamentos } = await supabase
        .from("quantitativos_acabamentos")
        .insert(acabamentosParaInserir);

      if (erroAcabamentos) {
        console.error("Erro ao salvar acabamentos:", erroAcabamentos);
        // não bloquear se a tabela não existir ainda
      }
    }
  } catch (error) {
    console.error("Erro ao salvar análise no banco:", error);
    throw new Error("Erro ao salvar dados da análise");
  }
}

/**
 * FunçÍo auxiliar para validar configuraçÍo de IA
 */
export function validarConfiguracaoIA(): {
  valido: boolean;
  mensagem?: string;
} {
  const provider = AI_CONFIG.provider;
  const modelo = getModel(provider);

  console.log("[IA Config] Provider:", provider);
  console.log("[IA Config] Modelo:", modelo);
  console.log("[IA Config] Backend Proxy:", USE_BACKEND_PROXY ? "SIM" : "não");
  console.log("[IA Config] Backend URL:", BACKEND_URL);

  // Quando usa backend proxy, a configuraçÍo é válida se o backend estiver configurado
  if (USE_BACKEND_PROXY) {
    if (!BACKEND_URL) {
      return {
        valido: false,
        mensagem: "Configure VITE_BACKEND_URL para usar o proxy de IA.",
      };
    }
    // Backend proxy está configurado - válido
    return { valido: true };
  }

  // Modo legado: verificar chaves no frontend (não recomendado)
  const chave = getApiKey(provider);
  console.log(
    "[IA Config] Chave configurada:",
    chave ? `${chave.substring(0, 10)}...` : "não"
  );

  if (!chave) {
    const providerLabel =
      provider === "openai"
        ? "VITE_OPENAI_API_KEY"
        : provider === "anthropic"
        ? "VITE_ANTHROPIC_API_KEY"
        : "VITE_GEMINI_API_KEY";
    return {
      valido: false,
      mensagem: `Configure ${providerLabel} para usar o provedor ${provider}.`,
    };
  }

  return { valido: true };
}

// ============================================================
// ANÁLISE DE ESCOPO TEXTUAL - ESPECIALISTA MASTER
// ============================================================

/**
 * Prompt OTIMIZADO para análise de escopo
 * VersÍo avançada: cruza memorial com medidas dos ambientes
 */
const PROMPT_ESPECIALISTA_MASTER = `Você é um orçamentista ESPECIALISTA de obras de alto padrÍo. Extraia TODOS os serviços do escopo e CRUZE com as medidas dos ambientes.

## REGRAS CRÍTICAS:

### 1. SEPARAR ITEM POR ITEM
- Cada serviço mencionado = 1 linha separada POR AMBIENTE
- "Demolir piso na cozinha e lavanderia" = 2 serviços (1 cozinha, 1 lavanderia)
- "Pintura de paredes em todos os ambientes" = 1 serviço para CADA ambiente

### 2. USAR MEDIDAS DOS AMBIENTES FORNECIDOS
- Se o memorial menciona "piso da cozinha" e você tem área_piso da cozinha → USE ESSA ÁREA!
- Se menciona "paredes da sala" e você tem area_paredes → USE ESSA ÁREA!
- Se menciona "proteçÍo de portas" e você tem total de portas → USE ESSA QUANTIDADE!

### 3. REGRAS AUTOMÁTICAS (ADICIONAR ITENS COMPLEMENTARES)
- FORRO DE GESSO/DRYWALL → Adicionar: "Pintura de forro (emassamento 3 demÍos + pintura 2 demÍos)"
- REBAIXO DE TETO → Adicionar: "Pintura de forro com emassamento"
- INSTALAÇÍO DE PORCELANATO → Verificar se precisa: regularizaçÍo de contrapiso
- PAREDE NOVA → Adicionar: emboço + reboco OU gesso liso + pintura

### 4. TIPOS DE QUANTIDADE POR SERVIÇO
- PISO/REVESTIMENTO → usar area_piso do ambiente (m²)
- PAREDE/PINTURA PAREDE → usar area_paredes_liquida (descontando vÍos) (m²)
- TETO/FORRO → usar area_teto ou area_piso (m²)
- RODAPÉ/SANCA → usar perimetro (ml)
- PORTAS → usar quantidade de portas (un)
- JANELAS → usar quantidade de janelas (un)
- PONTOS ELÉTRICOS → usar quantidade de pontos (pt)

### 5. CATEGORIAS E NÚCLEOS
| Categoria | Núcleo |
|-----------|--------|
| gerais | engenharia |
| demolicao | engenharia |
| construcao | engenharia |
| instalacoes_eletricas | engenharia |
| instalacoes_hidraulicas | engenharia |
| revestimentos | engenharia |
| pintura | engenharia |
| forros | engenharia |
| esquadrias | engenharia |
| impermeabilizacao | engenharia |
| loucas_metais | produtos |
| pedras | produtos |
| vidracaria | produtos |
| marmoraria | produtos |
| serralheria | produtos |
| marcenaria | marcenaria |
| projeto | arquitetura |
| outros | engenharia |

### 6. FORMATO DO SERVIÇO
{
  "categoria": "revestimentos",
  "nucleo": "engenharia",
  "tipo": "mao_obra",
  "descricao": "InstalaçÍo de porcelanato 60x60 retificado - Cozinha",
  "ambiente": "Cozinha",
  "unidade": "m2",
  "quantidade": 12.5,
  "area": 12.5,
  "ordem": 1,
  "vinculo_pricelist": {
    "termo_busca": "porcelanato instalaçÍo mÍo de obra",
    "palavras_chave": ["porcelanato", "piso", "instalaçÍo", "assentamento"],
    "categoria_sugerida": "revestimentos"
  }
}

### 7. TIPO DO SERVIÇO
- MÍO DE OBRA: instalaçÍo, assentamento, execuçÍo, demoliçÍo, pintura, aplicaçÍo, montagem
- MATERIAL: fornecimento, compra, material para...

## FORMATO DE RESPOSTA - APENAS JSON:
{
  "servicos": [...]
}

IMPORTANTE:
- Retorne APENAS JSON válido
- SEMPRE calcule a quantidade quando tiver as medidas do ambiente
- Separe CADA ambiente em uma linha distinta

## REGRA ABSOLUTA - não VIOLE:
- SEMPRE retorne JSON válido, NUNCA texto conversacional ou pedindo mais informações
- Se faltar informaçÍo, retorne JSON com "quantidade": null e "observacoes": "Dados insuficientes"
- NUNCA peça mais informações - trabalhe com o que foi fornecido
- Se o escopo estiver vazio ou muito curto, retorne: {"servicos": [], "erro": "Escopo insuficiente para análise"}
- PROIBIDO responder com frases como "Desculpe", "Por favor forneça", "Preciso de mais informações"
`;

/**
 * Formatar ambientes com medidas para o prompt da IA
 * Se não houver ambientes, instrui a IA a identificá-los do texto
 */
function formatarAmbientesParaPrompt(ambientes: AmbienteExtraido[]): string {
  // Se não houver ambientes conhecidos, instruir IA a extrair do texto
  if (!ambientes || ambientes.length === 0) {
    return `

## ATENÇÍO: não HÁ AMBIENTES CADASTRADOS

Como não há ambientes com medidas fornecidos, você DEVE:

1. **IDENTIFICAR AMBIENTES** mencionados no texto (cozinha, sala, quarto, banheiro, etc.)
2. **CRIAR UM SERVIÇO PARA CADA AMBIENTE** mencionado
3. Para quantidade/área, deixe o campo "quantidade" como null e adicione no campo "observacoes": "Aguardando medidas do ambiente"
4. **SEMPRE preencha o campo "ambiente"** com o nome do ambiente identificado no texto

### IMPORTANTE - CATEGORIZAÇÍO:
- Cada serviço DEVE ter: categoria, nucleo, ambiente, descricao, unidade
- Se o texto falar "todos os ambientes", liste os ambientes típicos: Sala, Cozinha, Quartos, Banheiros, etc.
- Use "ambiente": "Geral" apenas para itens que não sÍo específicos de um ambiente

### EXEMPLO DE SERVIÇO SEM MEDIDAS:
{
  "categoria": "revestimentos",
  "nucleo": "engenharia",
  "tipo": "mao_obra",
  "descricao": "InstalaçÍo de porcelanato - Cozinha",
  "ambiente": "Cozinha",
  "unidade": "m2",
  "quantidade": null,
  "observacoes": "Aguardando medidas do ambiente",
  "vinculo_pricelist": {
    "termo_busca": "porcelanato instalaçÍo",
    "palavras_chave": ["porcelanato", "piso", "instalaçÍo"]
  }
}

### LEMBRETE CRÍTICO:
- RETORNE APENAS JSON, mesmo sem ambientes cadastrados
- Se o texto do escopo não mencionar nenhum serviço específico, retorne: {"servicos": [], "erro": "Nenhum serviço identificado no texto"}
- NUNCA responda com texto conversacional ou pedindo mais informações
`;
  }

  let texto = `\n\n## AMBIENTES DO PROJETO COM MEDIDAS:\n`;
  texto += `| Ambiente | Piso (m²) | Parede Líq. (m²) | Teto (m²) | Perímetro (ml) | Portas | Janelas |\n`;
  texto += `|----------|-----------|------------------|-----------|----------------|--------|----------|\n`;

  // Totais
  let totalPiso = 0,
    totalParede = 0,
    totalTeto = 0,
    totalPerimetro = 0,
    totalPortas = 0,
    totalJanelas = 0;

  ambientes.forEach((amb) => {
    const areaPiso =
      amb.area ||
      (amb.largura && amb.comprimento ? amb.largura * amb.comprimento : 0);
    const peDireito = amb.pe_direito || 2.7;
    const largura = amb.largura || (amb.area ? Math.sqrt(amb.area) : 0);
    const comprimento = amb.comprimento || (amb.area ? Math.sqrt(amb.area) : 0);
    const perimetro = largura && comprimento ? 2 * (largura + comprimento) : 0;
    const areaParedeBruta = perimetro * peDireito;

    // Estimar área de vÍos (10% da parede bruta como estimativa se não tiver dados)
    const areaVaos = areaParedeBruta * 0.1;
    const areaParedeLiquida = areaParedeBruta - areaVaos;
    const areaTeto = areaPiso;

    // Estimar portas e janelas baseado no perímetro
    const numPortas = Math.max(1, Math.floor(perimetro / 4)); // ~1 porta a cada 4m
    const numJanelas =
      amb.nome.toLowerCase().includes("banheiro") ||
      amb.nome.toLowerCase().includes("lavabo")
        ? 1
        : Math.max(0, Math.floor(perimetro / 6));

    texto += `| ${amb.nome} | ${areaPiso.toFixed(
      1
    )} | ${areaParedeLiquida.toFixed(1)} | ${areaTeto.toFixed(
      1
    )} | ${perimetro.toFixed(1)} | ${numPortas} | ${numJanelas} |\n`;

    totalPiso += areaPiso;
    totalParede += areaParedeLiquida;
    totalTeto += areaTeto;
    totalPerimetro += perimetro;
    totalPortas += numPortas;
    totalJanelas += numJanelas;
  });

  texto += `|----------|-----------|------------------|-----------|----------------|--------|----------|\n`;
  texto += `| **TOTAL** | **${totalPiso.toFixed(1)}** | **${totalParede.toFixed(
    1
  )}** | **${totalTeto.toFixed(1)}** | **${totalPerimetro.toFixed(
    1
  )}** | **${totalPortas}** | **${totalJanelas}** |\n`;

  texto += `\n⚠️ USE ESTES VALORES! Quando o memorial mencionar um ambiente, BUSQUE a medida correspondente na tabela acima.\n`;

  return texto;
}

/**
 * ConfiguraçÍo de retry para análise de escopo
 */
const RETRY_CONFIG = {
  maxTentativas: 3,
  delayBase: 2000, // 2 segundos base (aumentado para rate limit)
  delayRateLimit: 15000, // 15 segundos para erro 429
  promptsCorrecao: [
    // Primeira correçÍo: pedir JSON mais simples
    `

ATENÇÍO: Retorne um JSON VÁLIDO e SIMPLES.
`,
    // Segunda correçÍo: pedir apenas a estrutura essencial
    `

Retorne APENAS o JSON com os serviços, sem texto adicional.
`,
  ],
};

/**
 * Analisar ESCOPO TEXTUAL de projeto usando IA
 * Esta funçÍo processa memoriais descritivos e escopos de obra
 * VersÍo robusta com sistema de retry inteligente
 */
export async function analisarEscopoComIA(
  escopoTexto: string,
  ambientesConhecidos?: AmbienteExtraido[]
): Promise<ProjetoAnalisado> {
  let ultimoErro: Error | null = null;
  let tentativa = 0;

  while (tentativa < RETRY_CONFIG.maxTentativas) {
    try {
      console.log(
        `[analisarEscopoComIA] Tentativa ${tentativa + 1} de ${
          RETRY_CONFIG.maxTentativas
        }`
      );
      console.log(
        `[analisarEscopoComIA] Tamanho do escopo: ${escopoTexto.length} caracteres`
      );

      // Montar prompt com tabela de ambientes e medidas
      let promptCompleto = PROMPT_ESPECIALISTA_MASTER;

      // Adicionar tabela de ambientes COM MEDIDAS se disponível
      if (ambientesConhecidos && ambientesConhecidos.length > 0) {
        promptCompleto += formatarAmbientesParaPrompt(ambientesConhecidos);
      }

      // Adicionar escopo/memorial descritivo
      promptCompleto += `\n\n## ESCOPO DO PROJETO (MEMORIAL DESCRITIVO):\n${escopoTexto}\n`;

      // Instruções finais
      promptCompleto += `\n\n## INSTRUÇÕES FINAIS:
1. Para CADA item do memorial, crie um serviço SEPARADO por ambiente
2. SEMPRE inclua a quantidade/área baseada na tabela de ambientes acima
3. Se o memorial fala de "todos os ambientes", crie um serviço para CADA ambiente da tabela
4. Adicione serviços complementares conforme as regras (ex: forro → pintura)
5. Retorne APENAS o JSON com a lista de serviços
`;

      // Adicionar prompt de correçÍo se não for a primeira tentativa
      if (tentativa > 0 && tentativa <= RETRY_CONFIG.promptsCorrecao.length) {
        promptCompleto += RETRY_CONFIG.promptsCorrecao[tentativa - 1];
        console.log(
          `[analisarEscopoComIA] Aplicando correçÍo de prompt #${tentativa}`
        );
      }

      // Usar OpenAI para análise de escopo (limites mais altos que Anthropic)
      const respostaIA = await chamarOpenAITexto(
        promptCompleto,
        16000, // GPT-4o suporta até 16k tokens de saída
        tentativa === 0 ? 0.1 : 0 // Reduzir temperatura em retries
      );

      const texto = respostaIA.texto.trim();
      const finishReason = respostaIA.finishReason;

      console.log(
        `[analisarEscopoComIA] Resposta recebida - ${texto.length} caracteres`
      );
      console.log(`[analisarEscopoComIA] Finish reason: ${finishReason}`);
      console.log(
        `[analisarEscopoComIA] Usage: prompt=${respostaIA.usage?.prompt_tokens}, completion=${respostaIA.usage?.completion_tokens}`
      );

      if (!texto) {
        throw new Error("A resposta da IA está vazia.");
      }

      // Verificar se a resposta foi truncada
      // 1. Por finish_reason (OpenAI usa "length", Anthropic usa "max_tokens")
      let foiTruncada =
        finishReason === "length" || finishReason === "max_tokens";

      // 2. Por heurística: se o JSON parece estar cortado no meio
      if (!foiTruncada) {
        const textoLimpo = texto.trim();
        // Verificar se termina corretamente com }
        const terminaComFechamento =
          textoLimpo.endsWith("}") || textoLimpo.endsWith("```");
        // Verificar balanceamento de chaves
        const numAbre = (textoLimpo.match(/{/g) || []).length;
        const numFecha = (textoLimpo.match(/}/g) || []).length;

        if (!terminaComFechamento || numAbre > numFecha) {
          foiTruncada = true;
          console.warn(
            `[analisarEscopoComIA] ATENÇÍO: JSON parece truncado (chaves: ${numAbre} abertas, ${numFecha} fechadas)`
          );
        }
      }

      if (foiTruncada) {
        console.warn(
          "[analisarEscopoComIA] ATENÇÍO: Resposta foi TRUNCADA - tentando recuperar serviços parciais"
        );
      }

      // Log da resposta para debug
      console.log(
        `[analisarEscopoComIA] Início da resposta: ${texto.substring(0, 300)}`
      );
      console.log(
        `[analisarEscopoComIA] Final da resposta: ${texto.substring(
          Math.max(0, texto.length - 200)
        )}`
      );

      // Tentar parsear (mesmo que truncada, o parser robusto pode recuperar)
      const resultado = parsearRespostaEscopo(texto, foiTruncada);

      console.log(`[analisarEscopoComIA] Parsing concluído:`);
      console.log(`  - Serviços: ${resultado.servicos?.length || 0}`);
      console.log(`  - Ambientes: ${resultado.ambientes?.length || 0}`);
      console.log(`  - Acabamentos: ${resultado.acabamentos?.length || 0}`);

      // Validar que temos SERVIÇOS - é o objetivo principal da análise de escopo
      if (resultado.servicos.length === 0) {
        console.error(
          "[analisarEscopoComIA] ERRO: Nenhum serviço extraído do escopo!"
        );
        console.error(
          "[analisarEscopoComIA] Resposta completa:",
          texto.substring(0, 3000)
        );

        // Verificar se a IA retornou um erro específico
        try {
          const jsonResposta = JSON.parse(texto.replace(/```json\s*/i, "").replace(/```/g, "").trim());
          if (jsonResposta.erro) {
            throw new Error(
              `${jsonResposta.erro}. Por favor, adicione mais detalhes ao memorial descritivo (tipos de serviços, ambientes, materiais) ou cadastre os ambientes com medidas primeiro.`
            );
          }
        } catch (parseErr: any) {
          // Se for o erro que acabamos de lançar, re-lançar
          if (parseErr.message && parseErr.message.includes("Por favor, adicione mais detalhes")) {
            throw parseErr;
          }
          // Ignorar erro de parse JSON, usar mensagem padrÍo
        }

        throw new Error(
          "A análise não retornou nenhum serviço. Verifique se o texto do escopo está correto e inclui descriçÍo de serviços a realizar."
        );
      }

      // Mesclar com ambientes conhecidos se disponível
      if (ambientesConhecidos && ambientesConhecidos.length > 0) {
        resultado.ambientes = ambientesConhecidos;
      }

      console.log(
        `[analisarEscopoComIA] Sucesso na tentativa ${tentativa + 1}! ${
          resultado.servicos.length
        } serviços extraídos.`
      );
      return resultado;
    } catch (error: any) {
      console.warn(
        `[analisarEscopoComIA] Tentativa ${tentativa + 1} falhou:`,
        error.message
      );
      ultimoErro = error;
      tentativa++;

      // Verificar se é erro de rate limit (429)
      const isRateLimit =
        error.message?.includes("429") || error.message?.includes("rate_limit");

      // Aguardar antes de tentar novamente
      if (tentativa < RETRY_CONFIG.maxTentativas) {
        // Delay maior para rate limit
        const delay = isRateLimit
          ? RETRY_CONFIG.delayRateLimit
          : RETRY_CONFIG.delayBase * Math.pow(2, tentativa - 1);

        console.log(
          `[analisarEscopoComIA] ${
            isRateLimit ? "Rate limit detectado!" : ""
          } Aguardando ${delay}ms antes de tentar novamente...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (isRateLimit) {
        // Mensagem específica para rate limit
        throw new Error(
          "Limite de requisições da API atingido. Aguarde alguns segundos e tente novamente."
        );
      }
    }
  }

  // Todas as tentativas falharam
  console.error("[analisarEscopoComIA] Todas as tentativas falharam.");
  throw new Error(
    `Erro na análise do escopo após ${RETRY_CONFIG.maxTentativas} tentativas: ${
      ultimoErro?.message || "Erro desconhecido"
    }`
  );
}

/**
 * Extrair serviços completos de um JSON truncado
 * Estratégia: encontrar cada objeto de serviço individualmente
 */
function extrairServicosDeJsonTruncado(texto: string): ServicoExtraido[] {
  const servicos: ServicoExtraido[] = [];

  // Limpar o texto
  let json = texto.trim();
  json = json.replace(/^```json\s*/i, "");
  json = json.replace(/```$/g, "");
  json = json.replace(/```/g, "");

  // Encontrar a seçÍo de serviços
  const inicioServicos = json.indexOf('"servicos"');
  if (inicioServicos === -1) {
    console.log(
      "[extrairServicosDeJsonTruncado] Array 'servicos' não encontrado"
    );
    return servicos;
  }

  // Encontrar o início do array de serviços
  const inicioArray = json.indexOf("[", inicioServicos);
  if (inicioArray === -1) {
    console.log(
      "[extrairServicosDeJsonTruncado] Array de serviços não encontrado"
    );
    return servicos;
  }

  // Extrair cada objeto de serviço individualmente
  let posicao = inicioArray + 1;
  let objetoAtual = "";
  let profundidade = 0;
  let dentroString = false;
  let charAnterior = "";

  while (posicao < json.length) {
    const char = json[posicao];

    // Controlar strings
    if (char === '"' && charAnterior !== "\\") {
      dentroString = !dentroString;
    }

    if (!dentroString) {
      if (char === "{") {
        if (profundidade === 0) {
          objetoAtual = "";
        }
        profundidade++;
      }
      if (char === "}") {
        profundidade--;
        if (profundidade === 0) {
          objetoAtual += char;
          // Tentar parsear o objeto completo
          try {
            const obj = JSON.parse(objetoAtual);
            const servicoValidado = validarServico(obj);
            if (servicoValidado) {
              servicos.push(servicoValidado);
            }
          } catch (e) {
            // Tentar limpar e parsear novamente
            try {
              const limpo = objetoAtual
                .replace(/,\s*}/g, "}")
                // eslint-disable-next-line no-control-regex
                .replace(/[\x00-\x1F]/g, " ");
              const obj = JSON.parse(limpo);
              const servicoValidado = validarServico(obj);
              if (servicoValidado) {
                servicos.push(servicoValidado);
              }
            } catch {
              console.log(
                `[extrairServicosDeJsonTruncado] Objeto inválido ignorado: ${objetoAtual.substring(
                  0,
                  100
                )}...`
              );
            }
          }
          objetoAtual = "";
          posicao++;
          continue;
        }
      }
      // Final do array de serviços
      if (char === "]" && profundidade === 0) {
        break;
      }
    }

    if (profundidade > 0) {
      objetoAtual += char;
    }

    charAnterior = char;
    posicao++;
  }

  console.log(
    `[extrairServicosDeJsonTruncado] ${servicos.length} serviços extraídos com sucesso`
  );
  return servicos;
}

/**
 * Tentar completar um JSON truncado fechando arrays e objetos abertos
 */
function tentarCompletarJsonTruncado(texto: string): string {
  let json = texto.trim();

  // Remover markdown code blocks
  json = json.replace(/^```json\s*/i, "");
  json = json.replace(/```$/g, "");
  json = json.replace(/```/g, "");
  json = json.trim();

  // Encontrar o início do JSON
  const inicioObjeto = json.indexOf("{");
  if (inicioObjeto === -1) return texto;

  json = json.substring(inicioObjeto);

  // Estratégia 1: Truncar no último objeto completo
  // Procurar o último "}" que fecha um serviço completo
  const ultimoFechamentoServico = json.lastIndexOf("},");
  if (ultimoFechamentoServico > 0) {
    // Truncar após esse ponto e fechar corretamente
    const jsonTruncado = json.substring(0, ultimoFechamentoServico + 1);

    // Contar estruturas abertas no JSON truncado
    let objetosAbertos = 0;
    let arraysAbertos = 0;
    let dentroString = false;
    let charAnterior = "";

    for (const char of jsonTruncado) {
      if (char === '"' && charAnterior !== "\\") {
        dentroString = !dentroString;
      }
      if (!dentroString) {
        if (char === "{") objetosAbertos++;
        if (char === "}") objetosAbertos--;
        if (char === "[") arraysAbertos++;
        if (char === "]") arraysAbertos--;
      }
      charAnterior = char;
    }

    // Fechar estruturas abertas
    let jsonCompleto = jsonTruncado;
    while (arraysAbertos > 0) {
      jsonCompleto += "]";
      arraysAbertos--;
    }
    while (objetosAbertos > 0) {
      jsonCompleto += "}";
      objetosAbertos--;
    }

    console.log(
      `[tentarCompletarJsonTruncado] JSON truncado no último serviço completo: ${jsonCompleto.length} chars`
    );
    return jsonCompleto;
  }

  // Estratégia 2: Fechar estruturas abertas manualmente (fallback)
  let objetosAbertos = 0;
  let arraysAbertos = 0;
  let dentroString = false;
  let charAnterior = "";

  for (const char of json) {
    if (char === '"' && charAnterior !== "\\") {
      dentroString = !dentroString;
    }
    if (!dentroString) {
      if (char === "{") objetosAbertos++;
      if (char === "}") objetosAbertos--;
      if (char === "[") arraysAbertos++;
      if (char === "]") arraysAbertos--;
    }
    charAnterior = char;
  }

  // Se está dentro de uma string, fechar a string
  if (dentroString) {
    json += '"';
  }

  // Remover vírgula pendente no final
  json = json.replace(/,\s*$/, "");

  // Fechar arrays e objetos abertos
  while (arraysAbertos > 0) {
    json += "]";
    arraysAbertos--;
  }
  while (objetosAbertos > 0) {
    json += "}";
    objetosAbertos--;
  }

  console.log(
    `[tentarCompletarJsonTruncado] JSON completado: ${json.length} chars`
  );
  return json;
}

/**
 * Detecta se a IA retornou uma resposta conversacional em vez de JSON
 * Isso acontece quando a IA pede mais informações ou se desculpa
 */
function detectarRespostaConversacional(resposta: string): boolean {
  const primeiros500 = resposta.substring(0, 500).toLowerCase();
  const padroes = [
    /desculpe/i,
    /por favor.*forne[cç]a/i,
    /preciso.*mais.*informa[cç][oõ]es/i,
    /n[aÍ]o.*poss[ií]vel.*gerar/i,
    /para.*criar.*json/i,
    /para.*gerar.*json/i,
    /n[aÍ]o.*consigo.*extrair/i,
    /forne[cç]a.*essas.*informa[cç][oõ]es/i,
    /preciso.*que.*voc[eê]/i,
    /sem.*as.*medidas/i,
  ];
  return padroes.some(p => p.test(primeiros500));
}

/**
 * Parsear resposta da análise de escopo
 * VersÍo robusta usando o sistema de parsing inteligente
 */
function parsearRespostaEscopo(
  resposta: string,
  foiTruncada: boolean = false
): ProjetoAnalisado {
  // Se foi truncada, tentar completar o JSON
  let respostaProcessada = resposta;
  if (foiTruncada) {
    console.log("[parsearRespostaEscopo] Tentando recuperar JSON truncado...");
    respostaProcessada = tentarCompletarJsonTruncado(resposta);
  }

  // Usar o parser robusto
  let resultado = parseJsonRobusto<any>(respostaProcessada);

  // Se o parsing falhar, tentar extraçÍo direta de serviços
  let servicosExtraidosDiretamente: ServicoExtraido[] = [];
  if (!resultado.success) {
    console.log(
      "[parsearRespostaEscopo] Parsing falhou, tentando extraçÍo direta de serviços..."
    );
    servicosExtraidosDiretamente = extrairServicosDeJsonTruncado(resposta);

    if (servicosExtraidosDiretamente.length > 0) {
      console.log(
        `[parsearRespostaEscopo] ExtraçÍo direta recuperou ${servicosExtraidosDiretamente.length} serviços!`
      );
      // Criar resultado sintético
      resultado = {
        success: true,
        data: { servicos: servicosExtraidosDiretamente },
        strategy: "extracao_direta_truncado",
      };
    } else {
      console.error(
        "[parsearRespostaEscopo] Falha no parsing:",
        resultado.error
      );
      console.error(
        "[parsearRespostaEscopo] Resposta (primeiros 1500 chars):",
        resposta.substring(0, 1500)
      );

      // Verificar se a IA retornou resposta conversacional em vez de JSON
      if (detectarRespostaConversacional(resposta)) {
        throw new Error(
          "O escopo fornecido não contém informações suficientes para extrair serviços. " +
          "Por favor, adicione mais detalhes ao memorial descritivo (ex: tipos de serviços, " +
          "ambientes, materiais) ou cadastre os ambientes com suas medidas primeiro."
        );
      }

      throw new Error(
        `não foi possível interpretar a resposta do escopo: ${resultado.error}`
      );
    }
  }

  const json = resultado.data;
  console.log(
    `[parsearRespostaEscopo] Parsing bem-sucedido com estratégia: ${resultado.strategy}`
  );
  console.log(
    `[parsearRespostaEscopo] Chaves no JSON: ${Object.keys(json || {}).join(
      ", "
    )}`
  );
  console.log(
    `[parsearRespostaEscopo] json.servicos existe? ${!!json?.servicos}, é array? ${Array.isArray(
      json?.servicos
    )}, length: ${json?.servicos?.length || 0}`
  );

  // Tentar extrair de diferentes chaves possíveis
  let servicosRaw =
    json?.servicos || json?.services || json?.itens || json?.items || [];
  console.log(
    `[parsearRespostaEscopo] servicosRaw (antes da validaçÍo): ${
      servicosRaw?.length || 0
    } itens`
  );

  // Se já extraímos diretamente, usar esses serviços
  let servicos: ServicoExtraido[];
  if (servicosExtraidosDiretamente.length > 0) {
    servicos = servicosExtraidosDiretamente;
  } else {
    // Converter para formato ProjetoAnalisado com validaçÍo robusta
    servicos = validarArray(servicosRaw, validarServico);
  }
  console.log(
    `[parsearRespostaEscopo] servicos (após validaçÍo): ${servicos.length} válidos`
  );

  // Extrair ambientes mencionados nos serviços
  const ambientesSet = new Set<string>();
  servicos.forEach((s) => {
    if (s.ambiente && s.ambiente !== "geral") {
      ambientesSet.add(s.ambiente);
    }
    if (s.ambientes) {
      s.ambientes.forEach((a) => {
        if (a !== "geral") ambientesSet.add(a);
      });
    }
  });

  // Adicionar ambientes identificados pelo JSON se existirem
  if (Array.isArray(json?.ambientes_identificados)) {
    json.ambientes_identificados.forEach((a: any) => {
      if (typeof a === "string" && a !== "geral") {
        ambientesSet.add(a);
      }
    });
  }

  const ambientesExtraidos: AmbienteExtraido[] = Array.from(ambientesSet).map(
    (nome) => ({
      nome,
      tipo: inferirTipoAmbiente(nome),
    })
  );

  // Criar acabamentos a partir dos serviços de revestimento/pintura
  const acabamentos: AcabamentoExtraido[] = servicos
    .filter((s) => ["revestimentos", "pintura"].includes(s.categoria))
    .map((s) => ({
      tipo: mapearTipoAcabamento(s.tipo),
      ambiente: s.ambiente,
      material: s.especificacoes?.material,
      area: s.area,
      metragem_linear: s.metragem_linear,
      quantidade: s.quantidade,
      descricao: s.descricao,
    }));

  // Extrair observações/alertas do resumo
  const observacoes: string[] = [];
  if (Array.isArray(json?.resumo?.alertas)) {
    observacoes.push(
      ...json.resumo.alertas.filter((a: any) => typeof a === "string")
    );
  }
  if (Array.isArray(json?.observacoes)) {
    observacoes.push(
      ...json.observacoes.filter((o: any) => typeof o === "string")
    );
  }

  return {
    ambientes: ambientesExtraidos,
    elementos: [],
    acabamentos,
    servicos,
    riscos: [],
    observacoes,
    metadados: {
      tipo_projeto: "arquitetonico",
    },
  };
}

/**
 * Inferir tipo de ambiente pelo nome
 */
function inferirTipoAmbiente(nome: string): string {
  const nomeLower = nome.toLowerCase();

  if (nomeLower.includes("suíte") || nomeLower.includes("suite"))
    return "suite";
  if (nomeLower.includes("quarto")) return "quarto";
  if (nomeLower.includes("sala")) return "sala";
  if (nomeLower.includes("cozinha")) return "cozinha";
  if (nomeLower.includes("banheiro") || nomeLower.includes("wc"))
    return "banheiro";
  if (nomeLower.includes("lavabo")) return "lavabo";
  if (nomeLower.includes("lavanderia")) return "lavanderia";
  if (
    nomeLower.includes("varanda") ||
    nomeLower.includes("terraço") ||
    nomeLower.includes("sacada")
  )
    return "varanda";
  if (nomeLower.includes("escritório") || nomeLower.includes("home office"))
    return "escritorio";
  if (nomeLower.includes("closet")) return "closet";
  if (nomeLower.includes("circulaçÍo") || nomeLower.includes("corredor"))
    return "corredor";
  if (nomeLower.includes("hall")) return "hall";

  return "outro";
}

/**
 * Mapear tipo de serviço para tipo de acabamento
 */
function mapearTipoAcabamento(tipoServico: string): AcabamentoExtraido["tipo"] {
  const mapa: Record<string, AcabamentoExtraido["tipo"]> = {
    assentamento_porcelanato: "piso",
    assentamento_ceramica: "piso",
    assentamento_piso_vinilico: "piso",
    assentamento_piso_laminado: "piso",
    revestimento_parede: "parede",
    revestimento_pastilha: "parede",
    pintura_parede: "pintura",
    pintura_teto: "teto",
    pintura_latex: "pintura",
    pintura_acrilica: "pintura",
    aplicacao_textura: "parede",
    aplicacao_cimento_queimado: "piso",
  };

  return mapa[tipoServico] || "revestimento";
}

/**
 * Combinar análise de imagem com análise de escopo
 */
export async function analisarProjetoCompleto(
  imagemBase64?: string,
  escopoTexto?: string,
  mediaType:
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp" = "image/jpeg"
): Promise<ProjetoAnalisado> {
  let resultadoImagem: ProjetoAnalisado | null = null;
  let resultadoEscopo: ProjetoAnalisado | null = null;

  // Analisar imagem se disponível
  if (imagemBase64) {
    try {
      resultadoImagem = await analisarProjetoComIA(
        imagemBase64,
        "completo",
        mediaType
      );
    } catch (error) {
      console.warn("Análise de imagem falhou:", error);
    }
  }

  // Analisar escopo se disponível
  if (escopoTexto && escopoTexto.trim().length > 50) {
    try {
      resultadoEscopo = await analisarEscopoComIA(
        escopoTexto,
        resultadoImagem?.ambientes
      );
    } catch (error) {
      console.warn("Análise de escopo falhou:", error);
    }
  }

  // Combinar resultados
  if (resultadoImagem && resultadoEscopo) {
    return {
      ambientes: resultadoImagem.ambientes,
      elementos: resultadoImagem.elementos,
      acabamentos: [
        ...resultadoImagem.acabamentos,
        ...resultadoEscopo.acabamentos.filter(
          (a) =>
            !resultadoImagem!.acabamentos.some(
              (ra) => ra.tipo === a.tipo && ra.ambiente === a.ambiente
            )
        ),
      ],
      servicos: resultadoEscopo.servicos,
      riscos: [
        ...(resultadoImagem.riscos || []),
        ...(resultadoEscopo.riscos || []),
      ],
      observacoes: [
        ...(resultadoImagem.observacoes || []),
        ...(resultadoEscopo.observacoes || []),
      ],
      metadados: resultadoImagem.metadados,
    };
  }

  if (resultadoImagem) return { ...resultadoImagem, servicos: [] };
  if (resultadoEscopo) return resultadoEscopo;

  throw new Error(
    "Nenhuma análise foi possível. Forneça uma imagem ou escopo textual."
  );
}


