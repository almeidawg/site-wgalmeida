// ============================================================
// PROMPTS AVANÇADOS PARA ANÁLISE DE PROJETOS COM IA
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Este módulo contém prompts especializados para detecçÍo
// visual de símbolos em plantas arquitetônicas e MEP
// ============================================================

/**
 * Prompt especializado para detecçÍo de símbolos elétricos
 * Baseado na NBR 5444 - Símbolos gráficos para instalações elétricas prediais
 */
export const PROMPT_ELETRICO_NBR5444 = `
## DETECÇÍO DE INSTALAÇÕES ELÉTRICAS - NBR 5444

Você é um especialista em projetos elétricos. Analise a planta e identifique TODOS os símbolos elétricos.

### SÍMBOLOS DE TOMADAS (NBR 5444)
| Símbolo | DescriçÍo | Características Visuais |
|---------|-----------|------------------------|
| ○● | Tomada baixa 2P+T | Círculo com ponto, h=30cm |
| ○●● | Tomada média 2P+T | Círculo com 2 pontos, h=110cm |
| ○●●● | Tomada alta 2P+T | Círculo com 3 pontos, h=200cm |
| ○(220) | Tomada 220V | Círculo com indicaçÍo 220V |
| ○(AC) | Tomada ar condicionado | Círculo com AC, altura alta |
| ○(F) | Tomada forno | Círculo com F, 220V exclusivo |
| ○(C) | Tomada cooktop | Círculo com C, 220V exclusivo |

### SÍMBOLOS DE ILUMINAÇÍO
| Símbolo | DescriçÍo | Características Visuais |
|---------|-----------|------------------------|
| ○ | Ponto de luz (plafon) | Círculo vazio no teto |
| ● | Spot embutido | Círculo preenchido pequeno |
| ◎ | Arandela | Semicírculo junto à parede |
| ⬬ | Pendente | Círculo com linha descendente |
| --- | Fita LED | Linha tracejada em sanca |
| ✶ | Lustre | Símbolo de estrela |

### SÍMBOLOS DE INTERRUPTORES
| Símbolo | DescriçÍo | Características Visuais |
|---------|-----------|------------------------|
| ⊗ | Interruptor simples | Círculo com X |
| ⊗⊗ | Interruptor duplo | Dois símbolos juntos |
| ⊗// | Interruptor paralelo | Círculo com duas barras |
| ⊗D | Dimmer | Círculo com D |
| ⊗S | Sensor presença | Círculo com S ou ondas |

### SÍMBOLOS DE INFRAESTRUTURA
| Símbolo | DescriçÍo | Características Visuais |
|---------|-----------|------------------------|
| ▭ | Quadro distribuiçÍo | Retângulo com subdivisões |
| === | Eletroduto embutido | Linha tracejada grossa |
| ─── | Circuito (C1, C2...) | Linha com número |
| [HDMI] | Ponto HDMI | Retângulo com HDMI |
| [TV] | Ponto TV | Retângulo com TV |

### INSTRUÇÕES DE CONTAGEM
1. CONTE cada símbolo individualmente por ambiente
2. ANOTE a altura quando visível (h=30, h=110, h=200)
3. IDENTIFIQUE circuitos quando numerados (C1, C2, C3...)
4. SOME o total por tipo e por ambiente
5. CALCULE metragem estimada de fio: (distância ao QD × 2 × 1.2)

### SAÍDA ESPERADA
\`\`\`json
{
  "eletrico": {
    "tomadas": [
      {"tipo": "comum_baixa", "voltagem": 127, "ambiente": "string", "quantidade": number, "altura": 30}
    ],
    "iluminacao": [
      {"tipo": "plafon|spot|fita_led|pendente|arandela", "ambiente": "string", "quantidade": number}
    ],
    "interruptores": [
      {"tipo": "simples|duplo|paralelo|dimmer", "ambiente": "string", "quantidade": number}
    ],
    "infraestrutura": [
      {"tipo": "hdmi|tv|rede", "ambiente": "string", "quantidade": number}
    ],
    "quadroDistribuicao": {
      "local": "string",
      "circuitos": number
    },
    "totais": {
      "tomadas110v": number,
      "tomadas220v": number,
      "pontosLuz": number,
      "interruptores": number,
      "metragemFioEstimada": number
    }
  }
}
\`\`\`
`;

/**
 * Prompt especializado para detecçÍo de símbolos hidráulicos
 */
export const PROMPT_HIDRAULICO = `
## DETECÇÍO DE INSTALAÇÕES HIDRÁULICAS

Você é um especialista em projetos hidrossanitários. Analise a planta e identifique TODOS os pontos hidráulicos.

### SÍMBOLOS DE ÁGUA
| Símbolo | DescriçÍo | Cor/IndicaçÍo |
|---------|-----------|---------------|
| ○(AF) | Ponto água fria | Azul ou AF |
| ○(AQ) | Ponto água quente | Vermelho ou AQ |
| ○(RET) | Retorno água quente | Vermelho tracejado |

### SÍMBOLOS DE ESGOTO
| Símbolo | DescriçÍo | Características |
|---------|-----------|-----------------|
| □ | Ralo sifonado | Quadrado |
| ═══ | Ralo linear | Linha grossa |
| ⊙ | Caixa sifonada | Círculo duplo |
| ◫ | Caixa gordura | Retângulo com divisÍo |
| ▣ | Caixa inspeçÍo | Quadrado com X |

### SÍMBOLOS DE GÁS
| Símbolo | DescriçÍo | Cor |
|---------|-----------|-----|
| △ | Ponto gás | Amarelo |
| ◇ | Registro gás | Losango |

### EQUIPAMENTOS
| Símbolo | DescriçÍo |
|---------|-----------|
| VS | Vaso sanitário |
| CA | Caixa acoplada |
| BID | Bidê |
| CH | Chuveiro |
| DH | Ducha higiênica |
| LV | Lavatório/Cuba |
| PIA | Pia cozinha |
| TQ | Tanque |
| MLR | Máquina lavar roupa |
| MLL | Máquina lavar louça |
| AQ | Aquecedor |

### TUBULAÇÕES
| Linha | Tipo | Diâmetro Típico |
|-------|------|-----------------|
| Azul contínua | Água fria | 25mm |
| Vermelha contínua | Água quente (PPR) | 25mm |
| Marrom/Preta | Esgoto | 40-100mm |
| Amarela | Gás | 20-25mm |

### REGRAS DE CONTAGEM HIDRÁULICA
1. CADA equipamento = pontos específicos:
   - Vaso sanitário: 1 AF + 1 ESG (100mm)
   - Lavatório: 1 AF + 1 AQ + 1 ESG (40mm)
   - Chuveiro: 1 AF + 1 AQ + 1 ESG (40mm)
   - Pia cozinha: 1 AF + 1 AQ + 1 ESG (50mm)
   - Tanque: 1 AF + 1 ESG (40mm)

2. CONTAR ralos por ambiente:
   - Banheiro: mínimo 1 ralo (box + piso)
   - Cozinha: 1 ralo
   - Área serviço: 1 ralo
   - Sacada: 1 ralo pluvial

### SAÍDA ESPERADA
\`\`\`json
{
  "hidraulico": {
    "pontosAgua": [
      {"tipo": "agua_fria|agua_quente|esgoto|gas", "ambiente": "string", "quantidade": number, "diametro": "string"}
    ],
    "ralos": [
      {"tipo": "sifonado|linear|seco", "ambiente": "string", "quantidade": number}
    ],
    "equipamentos": [
      {"tipo": "vaso|lavatorio|chuveiro|pia|tanque", "ambiente": "string", "quantidade": number}
    ],
    "totais": {
      "pontosAguaFria": number,
      "pontosAguaQuente": number,
      "pontosEsgoto": number,
      "pontosGas": number,
      "totalRalos": number,
      "metragemTubulacaoEstimada": number
    }
  }
}
\`\`\`
`;

/**
 * Prompt especializado para análise arquitetônica completa
 */
export const PROMPT_ARQUITETONICO_COMPLETO = `
## ANÁLISE ARQUITETÔNICA COMPLETA

Você é um arquiteto especialista em levantamento de quantitativos. Analise CADA ambiente da planta.

### VÍOS - PORTAS
| Símbolo | Tipo | Medidas PadrÍo |
|---------|------|----------------|
| ◠ (arco 90°) | Porta de abrir | 0.72×2.10, 0.82×2.10, 0.92×2.10 |
| ▷▷ | Porta de correr | 0.82×2.10, 1.00×2.10 |
| ◆ | Porta pivotante | 1.00×2.40, 1.20×2.50 |
| ▭ 2 folhas | Porta dupla | 1.40×2.10, 1.60×2.10 |

### VÍOS - JANELAS
| Símbolo | Tipo | Medidas PadrÍo |
|---------|------|----------------|
| ▭ na parede | Janela correr | 1.00×1.20, 1.50×1.20, 2.00×1.50 |
| ▭/ | Maxim-ar | 0.60×0.60, 0.80×0.80 |
| ═══ | Janela guilhotina | 1.00×1.50 |

### REGRA NBR 15575 - ILUMINAÇÍO NATURAL
Área mínima de janela = Área do piso ÷ 6 (16.67%)

### PARA CADA AMBIENTE EXTRAIR:

1. **IDENTIFICAÇÍO**
   - Nome exato (como aparece na planta)
   - Tipo (quarto, sala, cozinha, banheiro, etc.)
   - Código se houver (ex: "Q1", "BWC1")

2. **DIMENSÕES** (priorizar cotas escritas)
   - Largura (m)
   - Comprimento (m)
   - Pé-direito (se indicado, senão usar 2.70m)
   - Área do piso (m²) - PRIORIZAR se escrita!

3. **ÁREAS CALCULADAS**
   - Área piso = largura × comprimento
   - Perímetro = 2 × (largura + comprimento)
   - Área paredes bruta = perímetro × pé_direito
   - Área vÍos = soma(largura × altura de cada vÍo)
   - Área paredes líquida = bruta - vÍos

4. **VÍOS** (contar e medir)
   - Portas: quantidade, tipo, largura×altura
   - Janelas: quantidade, tipo, largura×altura
   - VÍos abertos: quantidade, largura×altura

### REGRAS DE EXTRAÇÍO
1. Se a ÁREA está escrita na planta (ex: "12.45 m²"), USE EXATAMENTE esse valor
2. Se apenas dimensões estÍo escritas, CALCULE a área
3. Se nada está escrito, ESTIME baseado em proporções visuais
4. SEMPRE inclua o grau de confiança (medido/calculado/estimado)

### SAÍDA ESPERADA
\`\`\`json
{
  "ambientes": [
    {
      "nome": "string",
      "tipo": "quarto|sala|cozinha|banheiro|lavabo|area_servico|varanda|escritorio|closet|corredor|hall|outro",
      "largura": number,
      "comprimento": number,
      "area": number,
      "peDireito": number,
      "perimetro": number,
      "areaParedes": number,
      "areaVaos": number,
      "areaParedesLiquida": number,
      "portas": [{"largura": number, "altura": number, "tipo": "string"}],
      "janelas": [{"largura": number, "altura": number, "tipo": "string"}],
      "confianca": "medido|calculado|estimado"
    }
  ],
  "totais": {
    "areaTotal": number,
    "perimetroTotal": number,
    "areaParedesTotal": number,
    "totalPortas": number,
    "totalJanelas": number
  }
}
\`\`\`
`;

/**
 * Prompt para análise de automaçÍo e smart home
 */
export const PROMPT_AUTOMACAO = `
## ANÁLISE DE AUTOMAÇÍO E SMART HOME

Identifique todos os pontos de automaçÍo na planta.

### ELEMENTOS A DETECTAR
1. **CONTROLE DE ILUMINAÇÍO**
   - Interruptores inteligentes
   - Dimmers
   - Painéis de controle de cena
   - Sensores de presença

2. **CONTROLE DE ACESSO**
   - Fechaduras digitais/biométricas
   - Videoporteiros
   - Câmeras de segurança

3. **CORTINAS/PERSIANAS**
   - Motores de cortina
   - Pontos elétricos para motorizaçÍo

4. **CLIMATIZAÇÍO**
   - Controles de ar condicionado
   - Termostatos

5. **INFRAESTRUTURA**
   - Central de automaçÍo
   - Hub/Controladores
   - Repetidores de sinal

### SAÍDA ESPERADA
\`\`\`json
{
  "automacao": {
    "dispositivos": [
      {"tipo": "string", "ambiente": "string", "quantidade": number, "protocolo": "wifi|zigbee|cabeado"}
    ],
    "infraestrutura": [
      {"tipo": "central|hub|repetidor", "local": "string"}
    ],
    "pontosPreparacao": [
      {"tipo": "string", "ambiente": "string", "observacao": "string"}
    ]
  }
}
\`\`\`
`;

/**
 * Prompt unificado para análise MEP completa
 */
export const PROMPT_ANALISE_MEP_COMPLETA = `
${PROMPT_ARQUITETONICO_COMPLETO}

---

${PROMPT_ELETRICO_NBR5444}

---

${PROMPT_HIDRAULICO}

---

${PROMPT_AUTOMACAO}

---

## INSTRUÇÕES FINAIS DE INTEGRAÇÍO

1. ANALISE a planta em múltiplas camadas:
   - Camada 1: Arquitetônico (ambientes, dimensões, vÍos)
   - Camada 2: Elétrico (tomadas, luz, interruptores)
   - Camada 3: Hidráulico (água, esgoto, gás)
   - Camada 4: AutomaçÍo (smart home)

2. CRUZE os dados entre camadas:
   - Cada ambiente deve ter análise completa
   - Totais devem ser consistentes

3. RETORNE um único JSON consolidado:

\`\`\`json
{
  "analise": {
    "arquitetonico": { /* conforme especificado */ },
    "eletrico": { /* conforme especificado */ },
    "hidraulico": { /* conforme especificado */ },
    "automacao": { /* conforme especificado */ }
  },
  "validacao": {
    "confiancaGeral": number,
    "alertas": ["string"],
    "sugestoes": ["string"]
  },
  "metadados": {
    "tipoPlanta": "arquitetonico|eletrico|hidraulico|completo",
    "escala": "string",
    "dataAnalise": "string"
  }
}
\`\`\`
`;

// ============================================================
// FUNÇÕES DE CONSTRUÇÍO DE PROMPT
// ============================================================

/**
 * Tipos de análise disponíveis
 */
export type TipoAnalise = 'arquitetonico' | 'eletrico' | 'hidraulico' | 'automacao' | 'completo';

/**
 * Contexto adicional para personalizaçÍo do prompt
 */
export interface ContextoPrompt {
  areaTotalCadastrada?: number;
  tipoImovel?: string;
  tipoProjeto?: string;
  padraoConstrutivo?: string;
  ambientesPreIdentificados?: string[];
  focoAnalise?: TipoAnalise[];
}

/**
 * Construir prompt personalizado baseado no contexto
 */
export function construirPromptPersonalizado(
  tipoAnalise: TipoAnalise | TipoAnalise[],
  contexto?: ContextoPrompt
): string {
  const tipos = Array.isArray(tipoAnalise) ? tipoAnalise : [tipoAnalise];
  let prompt = '';

  // Adicionar prompts específicos
  if (tipos.includes('completo')) {
    prompt = PROMPT_ANALISE_MEP_COMPLETA;
  } else {
    if (tipos.includes('arquitetonico')) {
      prompt += PROMPT_ARQUITETONICO_COMPLETO + '\n\n---\n\n';
    }
    if (tipos.includes('eletrico')) {
      prompt += PROMPT_ELETRICO_NBR5444 + '\n\n---\n\n';
    }
    if (tipos.includes('hidraulico')) {
      prompt += PROMPT_HIDRAULICO + '\n\n---\n\n';
    }
    if (tipos.includes('automacao')) {
      prompt += PROMPT_AUTOMACAO + '\n\n---\n\n';
    }
  }

  // Adicionar contexto se fornecido
  if (contexto) {
    prompt += '\n\n## CONTEXTO DO PROJETO\n';

    if (contexto.areaTotalCadastrada) {
      prompt += `
⚠️ ÁREA TOTAL CADASTRADA: ${contexto.areaTotalCadastrada} m²
A soma das áreas dos ambientes não PODE ultrapassar este valor.
Se encontrar valores maiores, RECALCULE proporcionalmente.
`;
    }

    if (contexto.tipoImovel) {
      prompt += `\n- Tipo de imóvel: ${contexto.tipoImovel}`;
    }

    if (contexto.tipoProjeto) {
      prompt += `\n- Tipo de projeto: ${contexto.tipoProjeto}`;
    }

    if (contexto.padraoConstrutivo) {
      prompt += `\n- PadrÍo construtivo: ${contexto.padraoConstrutivo}`;

      // Adicionar regras específicas por padrÍo
      if (contexto.padraoConstrutivo === 'alto') {
        prompt += `
### REGRAS PARA ALTO PADRÍO:
- Tomadas: mínimo 1 a cada 2m de parede
- IluminaçÍo: considerar spots e fita LED em todos os ambientes
- AutomaçÍo: prever pontos para cortinas motorizadas e ar-condicionado
- Hidráulica: considerar água quente em todos os pontos
`;
      }
    }

    if (contexto.ambientesPreIdentificados?.length) {
      prompt += `\n\n### AMBIENTES PRÉ-IDENTIFICADOS:\n`;
      contexto.ambientesPreIdentificados.forEach((amb, i) => {
        prompt += `${i + 1}. ${amb}\n`;
      });
      prompt += `\nUSE estes nomes ao identificar os ambientes na planta.\n`;
    }
  }

  return prompt;
}

/**
 * Prompt para validaçÍo cruzada entre planta e memorial
 */
export function construirPromptValidacaoCruzada(
  dadosPlanta: any,
  textoMemorial: string
): string {
  return `
## VALIDAÇÍO CRUZADA: PLANTA × MEMORIAL

Você recebeu dois conjuntos de dados:
1. DADOS EXTRAÍDOS DA PLANTA (análise visual)
2. TEXTO DO MEMORIAL DESCRITIVO (escopo do projeto)

Sua tarefa é COMPARAR e VALIDAR a consistência entre eles.

### DADOS DA PLANTA (ANÁLISE VISUAL):
\`\`\`json
${JSON.stringify(dadosPlanta, null, 2)}
\`\`\`

### TEXTO DO MEMORIAL DESCRITIVO:
${textoMemorial}

### INSTRUÇÕES DE VALIDAÇÍO:

1. **PARA CADA ITEM DO MEMORIAL:**
   - Verifique se existe correspondente na análise da planta
   - Compare quantidades
   - Identifique divergências

2. **PARA CADA ELEMENTO DA PLANTA:**
   - Verifique se está mencionado no memorial
   - Identifique itens faltantes no memorial

3. **CALCULE:**
   - Total de itens que conferem
   - Total de itens divergentes
   - Total de itens faltantes

### FORMATO DE SAÍDA:
\`\`\`json
{
  "validacao": {
    "status": "aprovado|pendencias|divergente",
    "confianca": number,
    "itensConferem": [
      {"item": "string", "quantidadePlanta": number, "quantidadeMemorial": number}
    ],
    "itensDivergentes": [
      {"item": "string", "quantidadePlanta": number, "quantidadeMemorial": number, "diferenca": number, "sugestao": "string"}
    ],
    "itensFaltantesMemorial": [
      {"item": "string", "quantidade": number, "sugestaoIncluir": "string"}
    ],
    "itensFaltantesPlanta": [
      {"item": "string", "descricaoMemorial": "string", "observacao": "string"}
    ]
  },
  "resumo": {
    "totalItens": number,
    "conferem": number,
    "divergentes": number,
    "faltantesMemorial": number,
    "faltantesPlanta": number
  },
  "alertas": ["string"],
  "recomendacoes": ["string"]
}
\`\`\`
`;
}

// exportações já sÍo feitas inline nas constantes acima


