// ============================================================
// API - MODELOS DE CONTRATOS
// Sistema WG Easy - Grupo WG Almeida
// Funções para gerenciar modelos de contratos
// ============================================================

import { supabase } from "./supabaseClient";
import modelosData from "@/data/modelos-contratos.json";
import type {
  ModeloContrato,
  ModelosContratosData,
  ContratoGerado,
  ValorVariavel,
  TipoContrato,
} from "@/types/modelo-contrato";

// ============================================================
// CARREGAR MODELOS
// ============================================================

/**
 * Carrega todos os modelos de contratos disponíveis
 */
export function carregarModelos(): ModeloContrato[] {
  const data = modelosData as unknown as ModelosContratosData;
  return data.modelos.filter((m) => m.status !== "inativo");
}

/**
 * Carrega um modelo específico pelo ID
 */
export function carregarModeloPorId(id: string): ModeloContrato | null {
  const modelos = carregarModelos();
  return modelos.find((m) => m.id === id) || null;
}

/**
 * Carrega modelos por tipo
 */
export function carregarModelosPorTipo(tipo: TipoContrato): ModeloContrato[] {
  const modelos = carregarModelos();
  return modelos.filter((m) => m.tipo === tipo);
}

/**
 * Retorna a versÍo dos modelos
 */
export function obterVersaoModelos(): string {
  const data = modelosData as unknown as ModelosContratosData;
  return data.versao;
}

// ============================================================
// CONTRATOS NO BANCO DE DADOS
// ============================================================

/**
 * Lista contratos gerados de um cliente
 */
export async function listarContratosCliente(clienteId: string) {
  const { data, error } = await supabase
    .from("contratos_gerados")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Busca um contrato gerado pelo ID
 */
export async function buscarContratoGerado(id: string) {
  const { data, error } = await supabase
    .from("contratos_gerados")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ContratoGerado;
}

/**
 * Cria um novo contrato gerado (rascunho)
 */
export async function criarContratoGerado(contrato: Omit<ContratoGerado, "id" | "criado_em" | "atualizado_em">) {
  const { data, error } = await supabase
    .from("contratos_gerados")
    .insert({
      ...contrato,
      status: "rascunho",
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualiza um contrato gerado
 */
export async function atualizarContratoGerado(
  id: string,
  dados: Partial<ContratoGerado>
) {
  const { data, error } = await supabase
    .from("contratos_gerados")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Exclui um contrato gerado (apenas rascunhos)
 */
export async function excluirContratoGerado(id: string) {
  // Primeiro verifica se é rascunho
  const contrato = await buscarContratoGerado(id);
  if (contrato.status !== "rascunho") {
    throw new Error("Apenas contratos em rascunho podem ser excluídos");
  }

  const { error } = await supabase
    .from("contratos_gerados")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// GERAÇÍO DE DOCUMENTO
// ============================================================

/**
 * Substitui variáveis no texto do contrato
 */
export function substituirVariaveis(
  texto: string,
  valores: Record<string, string | number | boolean>
): string {
  let resultado = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, "g");
    resultado = resultado.replace(regex, String(valor));
  }

  return resultado;
}

/**
 * Formata valor monetário para extenso
 */
export function valorParaExtenso(valor: number): string {
  const unidades = [
    "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
    "dezessete", "dezoito", "dezenove"
  ];

  const dezenas = [
    "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta",
    "setenta", "oitenta", "noventa"
  ];

  const centenas = [
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos"
  ];

  function converterGrupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    if (n < 20) return unidades[n];
    if (n < 100) {
      const dezena = Math.floor(n / 10);
      const unidade = n % 10;
      return dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "");
    }
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[centena] + (resto > 0 ? " e " + converterGrupo(resto) : "");
  }

  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);

  if (reais === 0 && centavos === 0) return "zero reais";

  let resultado = "";

  if (reais > 0) {
    if (reais >= 1000000) {
      const milhoes = Math.floor(reais / 1000000);
      resultado += converterGrupo(milhoes) + (milhoes === 1 ? " milhÍo" : " milhões");
      const resto = reais % 1000000;
      if (resto > 0) {
        resultado += resto < 100 ? " e " : ", ";
      }
    }

    const restoMilhao = reais % 1000000;
    if (restoMilhao >= 1000) {
      const milhares = Math.floor(restoMilhao / 1000);
      resultado += converterGrupo(milhares) + " mil";
      const resto = restoMilhao % 1000;
      if (resto > 0) {
        resultado += resto < 100 ? " e " : ", ";
      }
    }

    const restoMilhar = reais % 1000;
    if (restoMilhar > 0) {
      resultado += converterGrupo(restoMilhar);
    }

    resultado += reais === 1 ? " real" : " reais";
  }

  if (centavos > 0) {
    if (reais > 0) resultado += " e ";
    resultado += converterGrupo(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }

  return resultado;
}

/**
 * Formata valor monetário brasileiro
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formata data no formato brasileiro
 */
export function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? parseDataLocal(data) : data;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parseDataLocal(valor: string): Date {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

/**
 * Gera o texto completo do contrato
 */
export function gerarTextoContrato(
  modelo: ModeloContrato,
  valores: ValorVariavel[]
): string {
  // Converte array de valores para objeto
  const valoresMap: Record<string, string | number | boolean> = {};
  for (const v of valores) {
    valoresMap[v.variavel_id] = v.valor as string | number | boolean;
  }

  // Adiciona valor por extenso se houver valor_total
  if (valoresMap.valor_total) {
    valoresMap.valor_total_extenso = valorParaExtenso(Number(valoresMap.valor_total));
    valoresMap.valor_total = formatarMoeda(Number(valoresMap.valor_total));
  }

  // Formata data
  if (valoresMap.data_contrato) {
    valoresMap.data_contrato_formatada = formatarData(String(valoresMap.data_contrato));
  }

  let texto = "";

  // Cabeçalho
  texto += `${modelo.nome.toUpperCase()}\n\n`;

  // Dados da empresa
  texto += `CONTRATADA: ${modelo.empresa.razao_social}, pessoa jurídica de direito privado, `;
  texto += `sediada na Cidade de ${modelo.empresa.cidade}, Estado de ${modelo.empresa.estado}, `;
  texto += `sito à ${modelo.empresa.endereco}, CEP ${modelo.empresa.cep}, `;
  texto += `inscrita no CNPJ sob o nº ${modelo.empresa.cnpj}`;
  if (modelo.empresa.inscricao_estadual) {
    texto += ` e InscriçÍo Estadual sob o nº ${modelo.empresa.inscricao_estadual}`;
  }
  texto += `.\n\n`;

  // Dados do contratante
  texto += `CONTRATANTE: ${valoresMap.contratante_nome || "{{contratante_nome}}"}, `;
  texto += `${valoresMap.contratante_nacionalidade || "brasileiro(a)"}, `;
  texto += `${valoresMap.contratante_estado_civil || "{{contratante_estado_civil}}"}, `;
  texto += `portador(a) do RG nº ${valoresMap.contratante_rg || "{{contratante_rg}}"} `;
  texto += `e inscrito(a) no CPF/MF sob o nº ${valoresMap.contratante_cpf || "{{contratante_cpf}}"}, `;
  texto += `residente e domiciliado(a) na ${valoresMap.contratante_endereco || "{{contratante_endereco}}"}.\n\n`;

  // Cláusulas
  for (const clausula of modelo.clausulas) {
    texto += `CLÁUSULA ${numeroParaRomano(clausula.numero)} – ${clausula.titulo}\n\n`;

    for (const item of clausula.itens) {
      const textoItem = substituirVariaveis(item.texto, valoresMap);
      texto += `${item.numero}. ${textoItem}\n`;

      if (item.sub_itens) {
        for (const subItem of item.sub_itens) {
          texto += `\n${subItem.titulo}:\n`;
          for (const i of subItem.itens) {
            texto += `  - ${i}\n`;
          }
        }
      }
      texto += "\n";
    }
    texto += "\n";
  }

  // Assinaturas
  texto += "\nE por estarem justos e contratados, assinam o presente:\n\n";
  texto += `${modelo.empresa.cidade}, ${valoresMap.data_contrato_formatada || "{{data_contrato}}"}.\n\n`;
  texto += "_______________________________\n";
  texto += `${valoresMap.contratante_nome || "{{contratante_nome}}"}\n`;
  texto += "CONTRATANTE\n\n";
  texto += "_______________________________\n";
  texto += `${modelo.empresa.razao_social}\n`;
  texto += "CONTRATADA\n";

  return texto;
}

/**
 * Converte número para romano
 */
function numeroParaRomano(num: number): string {
  const romanos: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let resultado = "";
  for (const [valor, simbolo] of romanos) {
    while (num >= valor) {
      resultado += simbolo;
      num -= valor;
    }
  }
  return resultado;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Retorna estatísticas de contratos gerados
 */
export async function obterEstatisticasContratos() {
  const { data: contratos, error } = await supabase
    .from("contratos_gerados")
    .select("modelo_id, status, criado_em");

  if (error) throw error;

  const stats = {
    total: contratos?.length || 0,
    por_status: {
      rascunho: 0,
      aguardando_assinatura: 0,
      assinado: 0,
      cancelado: 0,
    },
    por_tipo: {} as Record<string, number>,
    ultimos_30_dias: 0,
  };

  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const contrato of contratos || []) {
    // Por status
    if (contrato.status in stats.por_status) {
      stats.por_status[contrato.status as keyof typeof stats.por_status]++;
    }

    // Por tipo (modelo)
    const modelo = carregarModeloPorId(contrato.modelo_id);
    if (modelo) {
      const tipo = modelo.tipo;
      stats.por_tipo[tipo] = (stats.por_tipo[tipo] || 0) + 1;
    }

    // Últimos 30 dias
    const dataCriacao = new Date(contrato.criado_em);
    if (dataCriacao >= trintaDiasAtras) {
      stats.ultimos_30_dias++;
    }
  }

  return stats;
}

export default {
  carregarModelos,
  carregarModeloPorId,
  carregarModelosPorTipo,
  obterVersaoModelos,
  listarContratosCliente,
  buscarContratoGerado,
  criarContratoGerado,
  atualizarContratoGerado,
  excluirContratoGerado,
  substituirVariaveis,
  valorParaExtenso,
  formatarMoeda,
  formatarData,
  gerarTextoContrato,
  obterEstatisticasContratos,
};

