/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// SERVICE: ImportaçÍo de Pedidos de Fornecedores
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "./supabaseClient";
import type {
  PedidoImportado,
  ItemPedidoImportado,
  FornecedorPedido,
  ResultadoParsing,
  ItemProcessado,
  PagamentoPedido,
} from "@/types/importacaoPedido";
import {
  normalizarUnidade,
  limparCNPJ,
  calcularSimilaridade,
} from "@/types/importacaoPedido";
import type { PricelistItemCompleto, PricelistItemFormData } from "@/types/pricelist";

// ============================================================
// PARSING DE PDF
// ============================================================

/**
 * Regex patterns para extraçÍo de dados do PDF
 */
const PATTERNS = {
  // Número da sequência/pedido
  sequencia: /Sequ[eê]ncia[:\s]*(\d+)/i,

  // Data e hora
  data: /(\d{2}\/\d{2}\/\d{4})/,
  hora: /(\d{2}:\d{2}:\d{2})/,

  // CNPJ
  cnpj: /(?:CPF\/CNPJ|CNPJ)[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i,

  // Fornecedor (nome da empresa que emitiu)
  fornecedorNome: /RECEBEMOS DA EMPRESA[:\s]*([^0-9]+?)(?:\d{2}\.\d{3})/i,
  fornecedorCNPJ: /RECEBEMOS DA EMPRESA[:\s]*[^0-9]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i,

  // Cliente
  clienteCodigo: /C[oó]digo\s*\/?\s*Cliente[:\s]*(\d+)/i,
  clienteNome: /C[oó]digo\s*\/?\s*Cliente[:\s]*\d+\s*-?\s*([^\n]+)/i,

  // Vendedor
  vendedor: /Vendedor[:\s]*([^\n-]+)/i,

  // Endereço
  endereco: /Endereco[:\s]*([^\n]+)/i,
  bairro: /Bairro[:\s]*([^\s]+)/i,
  cidade: /Cidade[:\s]*([^\s]+)/i,
  estado: /Estado[:\s]*([A-Z]{2})/i,
  cep: /CEP[:\s]*(\d{5}-?\d{3})/i,

  // Telefone
  telefone: /(?:Fone|Tel)[:\s]*\(?\d{2}\)?[\s-]?\d{4,5}[-\s]?\d{4}/gi,

  // Totais
  valorProdutos: /Produtos[:\s]*R?\$?\s*([\d.,]+)/i,
  valorFrete: /Frete[:\s]*R?\$?\s*([\d.,]+)/i,
  valorTotal: /Valor\s*Total[:\s]*R?\$?\s*([\d.,]+)/i,

  // Forma de pagamento
  formaPagamento: /(?:Forma\s*de\s*Pagamento|PAGTO)[:\s]*([^\n]+)/i,

  // Linha de item (código, descriçÍo, unidade, quantidade, preço unitário, total)
  itemLinha: /^(\d+)\s+(.+?)\s+(UN|UND|M2|M²|ML|M|PC|PÇ|CX|KG|L|BD|CT|MI|CE|SC)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/gim,
};

/**
 * Converte string de valor brasileiro para número
 */
function parseValorBR(valor: string): number {
  if (!valor) return 0;
  // Remove R$, espaços e converte vírgula para ponto
  const limpo = valor
    .replace(/R\$?\s*/g, "")
    .replace(/\./g, "") // Remove separador de milhar
    .replace(",", ".") // Converte decimal
    .trim();
  return parseFloat(limpo) || 0;
}

/**
 * Extrai dados do texto do PDF
 */
export function parsePedidoPDF(textoCompleto: string): ResultadoParsing {
  const erros: string[] = [];
  const avisos: string[] = [];

  try {
    // Limpar texto
    const texto = textoCompleto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // ============================================================
    // Extrair número da sequência
    // ============================================================
    const matchSequencia = texto.match(PATTERNS.sequencia);
    const numeroSequencia = matchSequencia ? matchSequencia[1] : "";
    if (!numeroSequencia) {
      avisos.push("Número da sequência não encontrado");
    }

    // ============================================================
    // Extrair data e hora
    // ============================================================
    const matchData = texto.match(PATTERNS.data);
    const dataStr = matchData ? matchData[1] : "";
    let dataPedido = "";
    if (dataStr) {
      const [dia, mes, ano] = dataStr.split("/");
      dataPedido = `${ano}-${mes}-${dia}`;
    }

    const matchHora = texto.match(PATTERNS.hora);
    const horaPedido = matchHora ? matchHora[1] : "";

    // ============================================================
    // Extrair fornecedor (quem emitiu o documento)
    // ============================================================
    const matchFornecedorNome = texto.match(PATTERNS.fornecedorNome);
    const matchFornecedorCNPJ = texto.match(PATTERNS.fornecedorCNPJ);

    const fornecedor: FornecedorPedido = {
      nome: matchFornecedorNome
        ? matchFornecedorNome[1].trim().replace(/\s+/g, " ")
        : "Fornecedor não identificado",
      cnpj: matchFornecedorCNPJ ? matchFornecedorCNPJ[1] : "",
    };

    // ============================================================
    // Extrair cliente
    // ============================================================
    const matchClienteCodigo = texto.match(PATTERNS.clienteCodigo);
    const matchClienteNome = texto.match(PATTERNS.clienteNome);
    const matchClienteCNPJ = texto.match(PATTERNS.cnpj);

    const cliente = {
      codigo: matchClienteCodigo ? matchClienteCodigo[1] : undefined,
      nome: matchClienteNome
        ? matchClienteNome[1].trim().split(/\s{2,}/)[0]
        : "Cliente não identificado",
      cnpj: matchClienteCNPJ ? matchClienteCNPJ[1] : undefined,
    };

    // ============================================================
    // Extrair vendedor
    // ============================================================
    const matchVendedor = texto.match(PATTERNS.vendedor);
    const vendedor = matchVendedor ? matchVendedor[1].trim() : undefined;

    // ============================================================
    // Extrair itens do pedido
    // ============================================================
    const itens: ItemPedidoImportado[] = [];

    // Buscar seçÍo de produtos
    const secaoProdutos = texto.match(
      /PRODUTOS\s*\/?\s*SERVI[CÇ]OS([\s\S]*?)(?:_{10,}|Forma\s*de\s*Pagamento)/i
    );

    if (secaoProdutos) {
      const linhasProdutos = secaoProdutos[1].split("\n");

      for (const linha of linhasProdutos) {
        // Tentar extrair dados da linha
        // Formato esperado: CODIGO DESCRICAO UNID QTDE PRECO_UNIT PRECO_TOTAL
        const match = linha.match(
          /^(\d+)\s+(.+?)\s+(UN|UND|M2|M²|ML|M|PC|PÇ|CX|KG|L|BD|CT|MI|CE|SC|1)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)$/i
        );

        if (match) {
          const [, codigo, descricao, unidade, qtdeStr, precoUnitStr, totalStr] =
            match;

          itens.push({
            codigo_fornecedor: codigo,
            descricao: descricao.trim(),
            unidade: normalizarUnidade(unidade),
            quantidade: parseInt(qtdeStr, 10),
            preco_unitario: parseValorBR(precoUnitStr),
            valor_total: parseValorBR(totalStr),
            status_match: "nao_encontrado",
          });
        }
      }
    }

    if (itens.length === 0) {
      erros.push("Nenhum item encontrado no pedido");
    }

    // ============================================================
    // Extrair valores totais
    // ============================================================
    const matchValorProdutos = texto.match(PATTERNS.valorProdutos);
    const matchValorFrete = texto.match(PATTERNS.valorFrete);
    const matchValorTotal = texto.match(PATTERNS.valorTotal);
    const matchFormaPagamento = texto.match(PATTERNS.formaPagamento);

    const pagamento: PagamentoPedido = {
      forma: matchFormaPagamento
        ? matchFormaPagamento[1].trim().split("\n")[0]
        : "não informado",
      valor_produtos: matchValorProdutos
        ? parseValorBR(matchValorProdutos[1])
        : itens.reduce((acc, i) => acc + i.valor_total, 0),
      valor_frete: matchValorFrete ? parseValorBR(matchValorFrete[1]) : 0,
      valor_total: matchValorTotal
        ? parseValorBR(matchValorTotal[1])
        : itens.reduce((acc, i) => acc + i.valor_total, 0),
    };

    // ============================================================
    // Montar objeto final
    // ============================================================
    const pedido: PedidoImportado = {
      numero_sequencia: numeroSequencia,
      data_pedido: dataPedido,
      hora_pedido: horaPedido,
      tipo: "VENDA",
      fornecedor,
      cliente,
      vendedor,
      itens,
      pagamento,
      data_importacao: new Date().toISOString(),
    };

    return {
      sucesso: erros.length === 0,
      pedido,
      erros: erros.length > 0 ? erros : undefined,
      avisos: avisos.length > 0 ? avisos : undefined,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erros: [`Erro ao processar PDF: ${error.message}`],
    };
  }
}

// ============================================================
// MATCH COM PRICELIST
// ============================================================

/**
 * Busca itens similares no pricelist
 */
export async function buscarMatchesPricelist(
  itens: ItemPedidoImportado[]
): Promise<ItemPedidoImportado[]> {
  const itensAtualizados: ItemPedidoImportado[] = [];

  // Buscar todos os itens do pricelist para comparaçÍo
  const { data: pricelistItens, error } = await supabase
    .from("pricelist_itens")
    .select("id, nome, descricao, codigo, unidade, preco")
    .eq("tipo", "material")
    .eq("ativo", true)
    .limit(5000);

  if (error || !pricelistItens) {
    console.error("Erro ao buscar pricelist:", error);
    return itens;
  }

  for (const item of itens) {
    let melhorMatch: ItemPedidoImportado["pricelist_match"] | undefined;
    let maiorSimilaridade = 0;

    // Buscar melhor match
    for (const plItem of pricelistItens) {
      // Comparar com nome e descriçÍo
      const simNome = calcularSimilaridade(item.descricao, plItem.nome);
      const simDescricao = plItem.descricao
        ? calcularSimilaridade(item.descricao, plItem.descricao)
        : 0;
      const simCodigo = plItem.codigo
        ? item.codigo_fornecedor === plItem.codigo
          ? 100
          : 0
        : 0;

      const similaridade = Math.max(simNome, simDescricao, simCodigo);

      if (similaridade > maiorSimilaridade && similaridade >= 50) {
        maiorSimilaridade = similaridade;
        melhorMatch = {
          id: plItem.id,
          nome: plItem.nome,
          preco: plItem.preco,
          similaridade,
        };
      }
    }

    // Determinar status do match
    let statusMatch: ItemPedidoImportado["status_match"] = "nao_encontrado";
    if (maiorSimilaridade >= 90) {
      statusMatch = "encontrado";
    } else if (maiorSimilaridade >= 50) {
      statusMatch = "similar";
    }

    itensAtualizados.push({
      ...item,
      pricelist_match: melhorMatch,
      pricelist_item_id: statusMatch === "encontrado" ? melhorMatch?.id : undefined,
      status_match: statusMatch,
    });
  }

  return itensAtualizados;
}

// ============================================================
// FORNECEDOR
// ============================================================

/**
 * Busca ou cadastra fornecedor
 */
export async function buscarOuCadastrarFornecedor(
  fornecedor: FornecedorPedido
): Promise<{ id: string; novo: boolean }> {
  const cnpjLimpo = limparCNPJ(fornecedor.cnpj);

  // Buscar fornecedor existente por CNPJ
  if (cnpjLimpo) {
    const { data: existente } = await supabase
      .from("pessoas")
      .select("id")
      .eq("cnpj", cnpjLimpo)
      .eq("tipo", "FORNECEDOR")
      .single();

    if (existente) {
      return { id: existente.id, novo: false };
    }
  }

  // Buscar por nome similar
  const { data: porNome } = await supabase
    .from("pessoas")
    .select("id, nome")
    .eq("tipo", "FORNECEDOR")
    .ilike("nome", `%${fornecedor.nome.split(" ")[0]}%`)
    .limit(5);

  if (porNome && porNome.length > 0) {
    // Verificar similaridade
    for (const p of porNome) {
      if (calcularSimilaridade(p.nome, fornecedor.nome) >= 80) {
        return { id: p.id, novo: false };
      }
    }
  }

  // Cadastrar novo fornecedor
  const { data: novo, error } = await supabase
    .from("pessoas")
    .insert({
      nome: fornecedor.nome,
      cnpj: cnpjLimpo || null,
      tipo: "FORNECEDOR",
      endereco: fornecedor.endereco,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      ativo: true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar fornecedor: ${error.message}`);
  }

  return { id: novo.id, novo: true };
}

// ============================================================
// CADASTRO NO PRICELIST
// ============================================================

/**
 * Cadastra item no pricelist
 */
export async function cadastrarItemPricelist(
  item: ItemPedidoImportado,
  fornecedorId?: string,
  categoriaId?: string
): Promise<string> {
  const dados: PricelistItemFormData = {
    nome: item.descricao,
    codigo: item.codigo_fornecedor,
    tipo: "material",
    unidade: item.unidade,
    preco: item.preco_unitario,
    fornecedor_id: fornecedorId,
    categoria_id: categoriaId || null,
    ativo: true,
  };

  const { data, error } = await supabase
    .from("pricelist_itens")
    .insert(dados)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar item: ${error.message}`);
  }

  return data.id;
}

/**
 * Atualiza preço de item existente no pricelist
 */
export async function atualizarPrecoPricelist(
  itemId: string,
  novoPreco: number
): Promise<void> {
  const { error } = await supabase
    .from("pricelist_itens")
    .update({
      preco: novoPreco,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    throw new Error(`Erro ao atualizar preço: ${error.message}`);
  }
}

// ============================================================
// IMPORTAÇÍO COMPLETA
// ============================================================

/**
 * Importa pedido completo para o sistema
 */
export async function importarPedidoCompleto(
  pedido: PedidoImportado,
  itensProcessados: ItemProcessado[],
  opcoes: {
    cadastrarFornecedor?: boolean;
    cadastrarItensNovos?: boolean;
    atualizarPrecos?: boolean;
    categoriaIdPadrao?: string;
  } = {}
): Promise<{
  sucesso: boolean;
  fornecedorId?: string;
  fornecedorNovo?: boolean;
  itensCadastrados: number;
  itensAtualizados: number;
  erros: string[];
}> {
  const erros: string[] = [];
  let fornecedorId: string | undefined;
  let fornecedorNovo = false;
  let itensCadastrados = 0;
  let itensAtualizados = 0;

  try {
    // 1. Cadastrar/buscar fornecedor
    if (opcoes.cadastrarFornecedor !== false && pedido.fornecedor.cnpj) {
      const resultado = await buscarOuCadastrarFornecedor(pedido.fornecedor);
      fornecedorId = resultado.id;
      fornecedorNovo = resultado.novo;
    }

    // 2. Processar itens
    for (const item of itensProcessados) {
      try {
        // Cadastrar item novo no pricelist
        if (
          opcoes.cadastrarItensNovos &&
          item.cadastrar_pricelist &&
          item.status_match === "nao_encontrado"
        ) {
          await cadastrarItemPricelist(
            item,
            fornecedorId,
            opcoes.categoriaIdPadrao
          );
          itensCadastrados++;
        }

        // Atualizar preço de item existente
        if (
          opcoes.atualizarPrecos &&
          item.pricelist_item_id &&
          item.pricelist_match
        ) {
          // Só atualiza se o preço for diferente
          if (item.preco_unitario !== item.pricelist_match.preco) {
            await atualizarPrecoPricelist(
              item.pricelist_item_id,
              item.preco_unitario
            );
            itensAtualizados++;
          }
        }
      } catch (error: any) {
        erros.push(`Erro no item "${item.descricao}": ${error.message}`);
      }
    }

    return {
      sucesso: erros.length === 0,
      fornecedorId,
      fornecedorNovo,
      itensCadastrados,
      itensAtualizados,
      erros,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erros: [error.message],
      itensCadastrados: 0,
      itensAtualizados: 0,
    };
  }
}

// ============================================================
// CONVERSÍO PARA ITENS DO PEDIDO
// ============================================================

/**
 * Converte itens importados para formato do pedido de materiais
 */
export function converterParaItensPedido(
  itens: ItemPedidoImportado[]
): Array<{
  id: string;
  descricao: string;
  classificacao: "INSUMO" | "ACABAMENTO" | "CONSUMIVEL" | "FERRAMENTA";
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  valor_total: number;
  origem: "importado";
  pricelist_item_id?: string;
}> {
  return itens.map((item, index) => ({
    id: `imp_${Date.now()}_${index}`,
    descricao: item.descricao,
    classificacao: "INSUMO" as const,
    quantidade: item.quantidade,
    unidade: item.unidade,
    preco_unitario: item.preco_unitario,
    valor_total: item.valor_total,
    origem: "importado" as const,
    pricelist_item_id: item.pricelist_item_id,
  }));
}



