// FunçÍo para gerar transações a receber no módulo Financeiro ao criar parcelas de contrato
import { supabase } from "@/lib/supabaseClient";

export async function gerarTransacaoFinanceiraParcela(parcela: {
  contrato_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  cliente_id: string;
}) {
  // Exemplo: inserir no financeiro_lancamentos
  const { error } = await supabase.from("financeiro_lancamentos").insert({
    contrato_id: parcela.contrato_id,
    numero_parcela: parcela.numero_parcela,
    valor: parcela.valor,
    data_vencimento: parcela.data_vencimento,
    tipo: "receita",
    pessoa_id: parcela.cliente_id,
    status: "pendente",
    origem: "juridico"
  });
  if (error) throw error;
}

// Para uso: chamar essa funçÍo ao criar cada parcela de contrato

