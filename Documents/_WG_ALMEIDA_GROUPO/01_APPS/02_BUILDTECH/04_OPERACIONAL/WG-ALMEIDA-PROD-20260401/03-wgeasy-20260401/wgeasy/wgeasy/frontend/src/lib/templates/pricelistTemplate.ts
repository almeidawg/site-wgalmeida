// src/lib/templates/pricelistTemplate.ts
const loadXLSX = () => import("../xlsxCompat");

/**
 * Gera e faz download de um arquivo Excel modelo para importaçÍo de pricelist
 *
 * Colunas:
 * - Código (opcional)
 * - Nome (obrigatório)
 * - DescriçÍo
 * - Categoria
 * - Tipo (material/mao_obra/ambos)
 * - Unidade (m², m³, un, kg, etc.)
 * - Preço Unitário
 * - Controla Estoque (Sim/não)
 * - Estoque Atual
 * - Estoque Mínimo
 */
export async function downloadPricelistTemplate() {
  const XLSX = await loadXLSX();
  // Cabeçalhos
  const headers = [
    "Código",
    "Nome",
    "DescriçÍo",
    "Categoria",
    "Tipo",
    "Unidade",
    "Preço Unitário",
    "Controla Estoque",
    "Estoque Atual",
    "Estoque Mínimo"
  ];

  // Linhas de exemplo
  const exampleRows = [
    [
      "MAT-001",
      "Argamassa AC-II",
      "Argamassa colante para revestimentos cerâmicos",
      "Revestimentos",
      "material",
      "kg",
      "25.50",
      "Sim",
      "500",
      "100"
    ],
    [
      "MAT-002",
      "Cerâmica 45x45",
      "Piso cerâmico esmaltado 45x45cm",
      "Revestimentos",
      "material",
      "m²",
      "45.00",
      "Sim",
      "200",
      "50"
    ],
    [
      "MO-001",
      "Pedreiro",
      "MÍo de obra de pedreiro",
      "MÍo de Obra",
      "mao_obra",
      "h",
      "45.00",
      "não",
      "",
      ""
    ],
    [
      "SERV-001",
      "InstalaçÍo Elétrica",
      "Serviço completo de instalaçÍo elétrica",
      "Serviços",
      "ambos",
      "m²",
      "120.00",
      "não",
      "",
      ""
    ]
  ];

  // Instruções
  const instructions = [
    ["INSTRUÇÕES PARA IMPORTAÇÍO DE PRICELIST"],
    [""],
    ["1. Preencha os dados nas colunas abaixo conforme o exemplo"],
    ["2. Campos obrigatórios: Nome, Tipo, Unidade, Preço Unitário"],
    ["3. Tipos válidos: material, mao_obra, ambos"],
    ["4. Controla Estoque: Sim ou não"],
    ["5. Se Controla Estoque = não, deixe Estoque Atual e Mínimo em branco"],
    ["6. Use vírgula para separar decimais (ex: 25,50)"],
    ["7. não altere os nomes das colunas"],
    ["8. Após preencher, importe o arquivo no sistema"],
    [""]
  ];

  // Criar planilha de instruções
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);

  // Criar planilha de dados
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 12 }, // Código
    { wch: 25 }, // Nome
    { wch: 35 }, // DescriçÍo
    { wch: 18 }, // Categoria
    { wch: 12 }, // Tipo
    { wch: 12 }, // Unidade
    { wch: 15 }, // Preço Unitário
    { wch: 18 }, // Controla Estoque
    { wch: 15 }, // Estoque Atual
    { wch: 15 }  // Estoque Mínimo
  ];
  dataSheet['!cols'] = columnWidths;

  // Criar workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instruções");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Pricelist");

  // Download do arquivo
  XLSX.writeFile(workbook, "template-pricelist.xlsx");
}


