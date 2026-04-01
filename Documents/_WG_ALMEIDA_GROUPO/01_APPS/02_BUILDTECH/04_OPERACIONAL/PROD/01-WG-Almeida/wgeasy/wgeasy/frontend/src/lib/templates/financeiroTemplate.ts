// src/lib/templates/financeiroTemplate.ts
const loadXLSX = () => import("../xlsxCompat");

/**
 * Gera e faz download de um arquivo Excel modelo para importaçÍo de lançamentos financeiros
 *
 * Colunas:
 * - data (dd/mm/yyyy)
 * - descricao
 * - valor
 * - tipo (entrada/saida ou receita/despesa)
 * - nucleo
 * - categoria
 * - projeto
 * - contrato
 * - pessoa
 * - status
 * - forma_pagamento (dinheiro/pix/cartao_credito/cartao_debito/boleto/transferencia)
 * - conta_bancaria
 * - documento
 * - centro_custo
 * - parcela
 * - data_vencimento (dd/mm/yyyy)
 * - data_pagamento (dd/mm/yyyy)
 * - observacoes
 */
export async function downloadFinanceiroTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  // Cabeçalhos
  const headers = [
    "data",
    "descricao",
    "valor",
    "tipo",
    "nucleo",
    "categoria",
    "projeto",
    "contrato",
    "pessoa",
    "status",
    "forma_pagamento",
    "conta_bancaria",
    "documento",
    "centro_custo",
    "parcela",
    "data_vencimento",
    "data_pagamento",
    "observacoes"
  ];

  // Linhas de exemplo
  const exampleRows = [
    [
      "01/12/2025",
      "Venda de material - Cliente ABC",
      "1500.00",
      "entrada",
      "GERAL",
      "Vendas",
      "",
      "CONT-123",
      "Cliente ABC",
      "pago",
      "pix",
      "Conta Principal",
      "TX-20251201",
      "Administrativo",
      "1/3",
      "",
      "01/12/2025",
      "Pagamento via PIX"
    ],
    [
      "05/12/2025",
      "Compra de materiais de construçÍo",
      "850,50",
      "saida",
      "ENGENHARIA",
      "Fornecedores",
      "Obra Residencial",
      "",
      "Fornecedor XYZ",
      "pendente",
      "boleto",
      "Conta Obras",
      "BOL-20251205",
      "Materiais",
      "",
      "15/12/2025",
      "",
      "Vencimento em 15/12/2025"
    ],
    [
      "10/12/2025",
      "ExecuçÍo de obra - Contrato 123",
      "5000.00",
      "receita",
      "ARQUITETURA",
      "Serviços",
      "Obra Residencial",
      "CONT-123",
      "Cliente ABC",
      "pago",
      "transferencia",
      "Conta Principal",
      "TED-20251210",
      "Projetos",
      "",
      "",
      "10/12/2025",
      "Primeira parcela do contrato"
    ],
    [
      "15/12/2025",
      "Pagamento de funcionarios",
      "8500.00",
      "despesa",
      "GERAL",
      "Salarios",
      "",
      "",
      "Equipe Interna",
      "pendente",
      "transferencia",
      "Conta RH",
      "FOLHA-202512",
      "RH",
      "",
      "",
      "",
      "Folha de pagamento dezembro/2025"
    ]
  ];

  // Instruções
  const instructions = [
    ["INSTRUÇÕES PARA IMPORTAÇÍO DE LANÇAMENTOS FINANCEIROS"],
    [""],
    ["1. Preencha os dados nas colunas abaixo conforme o exemplo"],
    ["2. Campos obrigatórios: data, descricao, valor, tipo"],
    ["3. Formato da data: dd/mm/yyyy (ex: 01/12/2025)"],
    ["4. Tipos válidos: entrada/saida ou receita/despesa"],
    ["5. Formas de pagamento válidas:"],
    ["   - dinheiro"],
    ["   - pix"],
    ["   - cartao_credito"],
    ["   - cartao_debito"],
    ["   - boleto"],
    ["   - transferencia"],
    ["6. Status válidos: pendente, pago, cancelado"],
    ["7. Valor aceita 1500.00 ou 1.500,00"],
    ["8. Campos adicionais sao opcionais (categoria, centro_custo, projeto, etc.)"],
    ["9. Nao altere os nomes das colunas"],
    ["10. Apos preencher, importe o arquivo no sistema"],
    [""]
  ];

  if (format === 'csv') {
    const csvRows = [headers, ...exampleRows].map((row) =>
      row
        .map((cell) =>
          `"${String(cell ?? '').replace(/"/g, '""')}"`
        )
        .join(',')
    );
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-lancamentos-financeiros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    return;
  }

  const XLSX = await loadXLSX();

  // Criar planilha de instruções
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);

  // Criar planilha de dados
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 12 },
    { wch: 40 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 35 }
  ];
  dataSheet['!cols'] = columnWidths;

  // Criar workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instruções");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Lançamentos");

  // Download do arquivo
  XLSX.writeFile(workbook, "template-lancamentos-financeiros.xlsx");
}

