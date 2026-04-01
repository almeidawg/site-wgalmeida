// FunçÍo utilitária para calcular a data final considerando apenas dias úteis
export function adicionarDiasUteis(dataInicial: Date, diasUteis: number): Date {
  let data = new Date(dataInicial);
  let adicionados = 0;
  while (adicionados < diasUteis) {
    data.setDate(data.getDate() + 1);
    // 0 = domingo, 6 = sábado
    if (data.getDay() !== 0 && data.getDay() !== 6) {
      adicionados++;
    }
  }
  return data;
}

// Exemplo de uso:
// const previsaoTermino = adicionarDiasUteis(new Date(), 10);

