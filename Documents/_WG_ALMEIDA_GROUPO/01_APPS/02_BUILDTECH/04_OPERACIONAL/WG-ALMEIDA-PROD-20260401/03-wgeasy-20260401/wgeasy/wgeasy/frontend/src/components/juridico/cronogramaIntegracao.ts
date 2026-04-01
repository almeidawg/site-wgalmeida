// FunçÍo para criar projeto/tarefas no Cronograma ao definir previsao_inicio e previsao_termino de contrato
import { supabase } from "@/lib/supabaseClient";

export async function criarProjetoCronograma({
  contrato_id,
  titulo,
  previsao_inicio,
  previsao_termino,
  cliente_id
}: {
  contrato_id: string;
  titulo: string;
  previsao_inicio: string;
  previsao_termino: string;
  cliente_id: string;
}) {
  // Exemplo: inserir no projetos
  const { error } = await supabase.from("projetos").insert({
    contrato_id,
    titulo,
    data_inicio: previsao_inicio,
    data_termino: previsao_termino,
    cliente_id,
    origem: "juridico"
  });
  if (error) throw error;
}

// Para uso: chamar essa funçÍo ao criar/atualizar contrato com datas definidas

