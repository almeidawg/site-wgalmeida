import type { MedicaoProjeto } from "@/types/cronograma";
import { formatarData, formatarMoeda, formatarPercentual } from "@/types/cronograma";

type PublicoRelatorio = "colaborador" | "fornecedor" | "cliente";

function montarShellHtml(titulo: string, subtitulo: string, conteudo: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; background: #f9fafb; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .head { background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #F25C26; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .title { font-size: 20px; margin: 0; color: #111827; }
    .sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
    .card .k { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .card .v { font-size: 18px; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    th, td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; text-align: left; }
    th { background: #f8fafc; color: #475569; }
    .r { text-align: right; }
    .c { text-align: center; }
    .foot { margin-top: 12px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1 class="title">${titulo}</h1>
      <p class="sub">${subtitulo}</p>
    </div>
    ${conteudo}
  </div>
</body>
</html>`;
}

function resumoCards(medicao: MedicaoProjeto): string {
  return `
  <div class="cards">
    <div class="card"><div class="k">Contrato</div><div class="v">${formatarMoeda(medicao.resumo.total_valor_contrato)}</div></div>
    <div class="card"><div class="k">Realizado</div><div class="v">${formatarMoeda(medicao.resumo.total_valor_realizado)}</div></div>
    <div class="card"><div class="k">Custo Equipe</div><div class="v">${formatarMoeda(medicao.resumo.total_custo_profissional_realizado)}</div></div>
    <div class="card"><div class="k">Progresso</div><div class="v">${formatarPercentual(medicao.resumo.percentual_geral)}</div></div>
  </div>`;
}

function linhasPorPublico(medicao: MedicaoProjeto, publico: PublicoRelatorio): string {
  return medicao.itens
    .map((item) => {
      const colunaQtd = `${item.quantidade_executada_acumulada ?? "-"}${item.unidade_item ? ` ${item.unidade_item}` : ""}`;
      const colunaProgresso = formatarPercentual(item.progresso || 0);
      const valorCliente = formatarMoeda(item.valor_realizado || 0);
      const valorEquipe = formatarMoeda(item.custo_profissional_realizado || 0);
      const margem = formatarMoeda(item.margem_bruta || 0);

      if (publico === "cliente") {
        return `<tr>
          <td>${item.tarefa_nome}</td>
          <td class="c">${colunaQtd}</td>
          <td class="c">${colunaProgresso}</td>
          <td class="r">${valorCliente}</td>
        </tr>`;
      }

      return `<tr>
        <td>${item.tarefa_nome}</td>
        <td class="c">${colunaQtd}</td>
        <td class="c">${colunaProgresso}</td>
        <td class="r">${valorEquipe}</td>
        <td class="r">${publico === "fornecedor" ? valorCliente : margem}</td>
      </tr>`;
    })
    .join("");
}

export function gerarRelatorioPagamentosHtml(
  medicao: MedicaoProjeto,
  publico: PublicoRelatorio
): string {
  const tituloMap: Record<PublicoRelatorio, string> = {
    colaborador: "Relatório de Pagamento de Colaboradores",
    fornecedor: "Relatório de Pagamento de Fornecedores",
    cliente: "Relatório de MediçÍo para Cliente",
  };

  const subtitulo = `${medicao.projeto_titulo} · ${medicao.cliente_nome} · Corte ${formatarData(medicao.data_corte)}`;

  const tabelaHead =
    publico === "cliente"
      ? `<tr><th>Item</th><th class="c">Executado</th><th class="c">Progresso</th><th class="r">Valor Proporcional</th></tr>`
      : `<tr><th>Item</th><th class="c">Executado</th><th class="c">Progresso</th><th class="r">Valor Pagável</th><th class="r">${publico === "fornecedor" ? "Valor Venda" : "Margem"}</th></tr>`;

  const html = `
    ${resumoCards(medicao)}
    <table>
      <thead>${tabelaHead}</thead>
      <tbody>${linhasPorPublico(medicao, publico)}</tbody>
    </table>
    <p class="foot">Gerado automaticamente pelo workflow financeiro de execuçÍo do cronograma.</p>
  `;

  return montarShellHtml(tituloMap[publico], subtitulo, html);
}

export function abrirRelatorioHtml(html: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}


