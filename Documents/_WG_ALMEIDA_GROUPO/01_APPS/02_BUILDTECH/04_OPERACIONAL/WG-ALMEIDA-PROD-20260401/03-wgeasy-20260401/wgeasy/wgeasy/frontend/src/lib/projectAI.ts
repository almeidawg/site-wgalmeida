// src/lib/projectAI.ts
import dayjs from "dayjs";

/**
 * Estrutura esperada para cada tarefa analisada pela IA.
 */
export interface TaskAI {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  progresso: number; // 0 a 100%
  caminhoCritico: boolean; // definido pelo criticalPath.ts
}

/**
 * Resultado final da análise IA
 */
export interface PredictResult {
  risco: "baixo" | "medio" | "alto";
  score: number;               // 0 a 100
  atrasoPrevistoDias: number;  // estimativa de atraso
}

/**
 * PrevisÍo de atraso do projeto com base em:
 * - Progresso X linha do tempo
 * - Atrasos individuais
 * - Peso para tarefas do caminho crítico
 * - Estimativa heurística WG EASY 2026
 */
export function preverAtrasoProjeto(tasks: TaskAI[]): PredictResult {
  let score = 0;

  tasks.forEach((t) => {
    const hoje = dayjs();

    // DuraçÍo planejada
    const total = dayjs(t.fim).diff(dayjs(t.inicio), "day") || 1;

    // Dias já decorridos
    const decorrido = hoje.diff(dayjs(t.inicio), "day");

    // Progresso esperado até hoje
    const progressoEsperado = Math.max(
      0,
      Math.min(100, (decorrido / total) * 100)
    );

    // Penalidade para tarefas do caminho crítico
    if (t.caminhoCritico && t.progresso < progressoEsperado) score += 25;

    // Penalidade por atraso grande
    if (t.progresso < progressoEsperado - 20) score += 15;

    // Tarefa já passou do fim e não está concluída
    if (dayjs(t.fim).isBefore(hoje) && t.progresso < 100) score += 30;

    // Tarefa muito lenta
    if (t.progresso < 30) score += 10;

    // Task quase concluída antes do prazo → bônus (reduz risco)
    if (t.progresso > 90 && dayjs(t.fim).isAfter(hoje)) score -= 10;
  });

  // Nunca deixar score negativo ou acima de 100
  score = Math.max(0, Math.min(score, 100));

  // Estimativa de atraso
  const atrasoPrevistoDias = Math.floor(score / 10);

  let risco: PredictResult["risco"] = "baixo";
  if (score >= 80) risco = "alto";
  else if (score >= 40) risco = "medio";

  return {
    risco,
    score,
    atrasoPrevistoDias,
  };
}


