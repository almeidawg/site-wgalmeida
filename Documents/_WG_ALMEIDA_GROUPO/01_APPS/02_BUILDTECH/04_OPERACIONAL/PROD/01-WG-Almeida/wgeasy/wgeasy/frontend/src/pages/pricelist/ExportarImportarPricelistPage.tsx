// ============================================================
// PÁGINA: Exportar/Importar Pricelist (Excel)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { recalcularPreco } from "@/lib/precificacaoUtils";

interface PricelistItem {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipo: string;
  unidade: string;
  preco: number;
  custo_aquisicao: number | null;
  margem_lucro: number | null;
  nucleo_id: string;
  nucleo_nome?: string;
  categoria_id: string;
  categoria_nome?: string;
  preco_calculado?: number;
}

interface Nucleo {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
  codigo?: string;
}

type RawPreviewRow = Record<string, unknown>;

interface ProcessedPreviewRow extends RawPreviewRow {
  _id?: string;
  _codigo?: string;
  _nome?: string;
  _descricao?: string;
  _tipo?: string;
  _unidade?: string;
  _nucleo_nome?: string;
  _nucleo_id?: string | null;
  _categoria_id?: string | null;
  _linha: number;
  _status: "novo" | "atualizar";
  _preco_calculado: number;
  _custo: number;
}

interface ImportPreview {
  dados: ProcessedPreviewRow[];
  erros: string[];
  novos: number;
  atualizados: number;
}

interface SupabaseItemRow extends PricelistItem {
  nucleos?: { nome?: string };
  pricelist_categorias?: { nome?: string };
}

const loadXLSX = () => import("@/lib/xlsxCompat");

// ================================================================
// FUNÇÍO PARA CONVERTER VALORES EM FORMATO BRASILEIRO
// Ex: "R$ 15,00" → 15.00 | "1.500,00" → 1500.00
// ================================================================
function parseValorBR(valor: unknown): number {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  // Se já for número, retorna direto
  if (typeof valor === "number") {
    return valor;
  }

  // Converter para string
  let str = String(valor).trim();

  // Remover "R$" e espaços
  str = str.replace(/R\$\s*/gi, "").trim();

  // Verificar se é formato brasileiro (usa vírgula como decimal)
  // Ex: "1.500,00" ou "15,00"
  if (str.includes(",")) {
    // Remover pontos de milhar e trocar vírgula por ponto
    str = str.replace(/\./g, "").replace(",", ".");
  }

  // Converter para número
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ================================================================
// FUNÇÍO PARA BUSCAR VALOR POR NOME DE COLUNA (FLEXÍVEL)
// Tenta múltiplas variações do nome da coluna
// ================================================================
function getColumnValue(row: RawPreviewRow, ...possibleNames: string[]): unknown {
  for (const name of possibleNames) {
    // Tentar nome exato
    if (row[name] !== undefined) return row[name];

    // Tentar variações
    const keys = Object.keys(row);
    for (const key of keys) {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (keyLower.includes(nameLower) || nameLower.includes(keyLower)) {
        return row[key];
      }
    }
  }
  return undefined;
}

function toText(valor: unknown): string {
  return String(valor ?? "").trim();
}

export default function ExportarImportarPricelistPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PricelistItem[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [exportStatus, setExportStatus] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importando, setImportando] = useState(false);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // Carregar núcleos
      const { data: nucleosData } = await supabase
        .from("nucleos")
        .select("id, nome")
        .eq("ativo", true);
      setNucleos(nucleosData || []);

      // Carregar categorias
      const { data: categoriasData } = await supabase
        .from("pricelist_categorias")
        .select("id, nome, codigo");
      setCategorias(categoriasData || []);

      // Carregar itens com joins
      const { data: itemsData, error } = await supabase
        .from("pricelist_itens")
        .select(`
          id,
          codigo,
          nome,
          descricao,
          tipo,
          unidade,
          preco,
          custo_aquisicao,
          margem_lucro,
          nucleo_id,
          categoria_id,
          nucleos(nome),
          pricelist_categorias(nome)
        `)
        .order("nome");

      if (error) throw error;

      // Mapear dados
      const mappedItems = ((itemsData || []) as SupabaseItemRow[]).map((item) => ({
        ...item,
        nucleo_nome: item.nucleos?.nome || "",
        categoria_nome: item.pricelist_categorias?.nome || "",
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ================================================================
  // EXPORTAR PARA EXCEL
  // ================================================================
  async function exportarExcel() {
    setExportStatus("Gerando planilha...");

    try {
      const XLSX = await loadXLSX();
      // Preparar dados para Excel
      const dadosExcel = items.map((item) => {
        // Calcular preço sugerido se tiver custo
        let precoCalculado = null;
        if (item.custo_aquisicao && item.custo_aquisicao > 0) {
          precoCalculado = recalcularPreco(item.custo_aquisicao, item.nucleo_nome);
        }

        return {
          "ID": item.id,
          "Código": item.codigo || "",
          "Nome": item.nome,
          "DescriçÍo": item.descricao || "",
          "Tipo": item.tipo,
          "Unidade": item.unidade,
          "Núcleo": item.nucleo_nome || "",
          "Categoria": item.categoria_nome || "",
          "Custo AquisiçÍo (R$)": item.custo_aquisicao || 0,
          "Preço Atual (R$)": item.preco || 0,
          "Preço Calculado (R$)": precoCalculado || item.preco || 0,
          "Margem (%)": item.margem_lucro || 20,
          "Diferença (%)": precoCalculado && item.preco > 0
            ? (((precoCalculado - item.preco) / item.preco) * 100).toFixed(1)
            : "0",
        };
      });

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(dadosExcel);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 36 },  // ID
        { wch: 15 },  // Código
        { wch: 40 },  // Nome
        { wch: 50 },  // DescriçÍo
        { wch: 12 },  // Tipo
        { wch: 10 },  // Unidade
        { wch: 15 },  // Núcleo
        { wch: 20 },  // Categoria
        { wch: 18 },  // Custo AquisiçÍo
        { wch: 15 },  // Preço Atual
        { wch: 18 },  // Preço Calculado
        { wch: 12 },  // Margem
        { wch: 15 },  // Diferença
      ];
      ws["!cols"] = colWidths;

      // Criar workbook com múltiplas abas
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pricelist");

      // Aba de instruções
      const instrucoes = [
        ["INSTRUÇÕES DE USO"],
        [""],
        ["1. Revise os dados na aba 'Pricelist'"],
        ["2. A coluna 'Custo AquisiçÍo' é o valor base para cálculo"],
        ["3. A coluna 'Preço Calculado' mostra o preço sugerido pela fórmula"],
        ["4. A coluna 'Diferença' mostra a variaçÍo entre atual e calculado"],
        ["5. Edite os valores conforme necessário"],
        ["6. Salve o arquivo e faça upload na mesma página"],
        [""],
        ["FÓRMULA DE PRECIFICAÇÍO:"],
        ["1. Custo de AquisiçÍo (valor base)"],
        ["2. + Impostos (5%)"],
        ["3. + Custo Hora William (21.3%)"],
        ["4. + Custos Variáveis (0%)"],
        ["5. + Custos Fixos (por núcleo: Design 3%, Arq 5%, Eng 8%, Marc 12%)"],
        ["= CUSTO REAL"],
        ["+ Margem (20%)"],
        ["= PREÇO DE VENDA"],
        [""],
        ["IMPORTANTE:"],
        ["- NÍo altere a coluna ID"],
        ["- Para adicionar novos itens, deixe o ID vazio"],
        ["- Os campos Núcleo e Categoria devem corresponder aos existentes"],
      ];
      const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
      wsInstrucoes["!cols"] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInstrucoes, "Instruções");

      // Aba de referência de núcleos
      const nucleosRef = [
        ["Núcleo", "Custos Fixos"],
        ...nucleos.map((n) => [n.nome, `${n.nome === "Design" ? "3%" : n.nome === "Arquitetura" ? "5%" : n.nome === "Engenharia" ? "8%" : n.nome === "Marcenaria" ? "12%" : "0%"}`]),
      ];
      const wsNucleos = XLSX.utils.aoa_to_sheet(nucleosRef);
      wsNucleos["!cols"] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsNucleos, "Núcleos");

      // Aba de referência de categorias
      const categoriasRef = [
        ["Categoria", "Código"],
        ...categorias.map((c) => [c.nome, c.codigo || ""]),
      ];
      const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasRef);
      wsCategorias["!cols"] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsCategorias, "Categorias");

      // Gerar arquivo
      const dataAtual = new Date().toISOString().split("T")[0];
      const fileName = `Pricelist_WGEasy_${dataAtual}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setExportStatus(`Arquivo "${fileName}" baixado com sucesso!`);
      setTimeout(() => setExportStatus(""), 5000);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      setExportStatus("Erro ao gerar planilha");
    }
  }

  // ================================================================
  // IMPORTAR DO EXCEL
  // ================================================================
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await loadXLSX();
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = await XLSX.read(data, { type: "array" });

        // Ler primeira aba
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as RawPreviewRow[];

        // Processar preview
        processarPreview(jsonData);
      } catch (error) {
        console.error("Erro ao ler arquivo:", error);
        toast({ title: "Erro", description: "Erro ao ler arquivo Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function processarPreview(dados: RawPreviewRow[]) {
    const erros: string[] = [];
    let novos = 0;
    let atualizados = 0;

    // Log para debug - mostrar colunas da primeira linha
    if (dados.length > 0) {
      if (import.meta.env.DEV) console.log("[Import Debug] Colunas encontradas:", Object.keys(dados[0]));
      if (import.meta.env.DEV) console.log("[Import Debug] Primeira linha completa:", dados[0]);
    }

    const dadosProcessados: ProcessedPreviewRow[] = dados.map((row, index) => {
      const linha = index + 2; // +2 porque Excel começa em 1 e tem header

      // Buscar valores com funçÍo flexível
      const nome = toText(getColumnValue(row, "Nome", "nome", "NOME"));
      const tipo = toText(getColumnValue(row, "Tipo", "tipo", "TIPO"));
      const unidade = toText(getColumnValue(row, "Unidade", "unidade", "UNIDADE", "Und", "und"));

      // Validar campos obrigatórios
      if (!nome) {
        erros.push(`Linha ${linha}: Nome é obrigatório`);
      }
      if (!tipo) {
        erros.push(`Linha ${linha}: Tipo é obrigatório`);
      }
      if (!unidade) {
        erros.push(`Linha ${linha}: Unidade é obrigatória`);
      }

      // Verificar se é novo ou atualizaçÍo
      const id = toText(getColumnValue(row, "ID", "id", "Id"));
      if (id && items.find((i) => i.id === id)) {
        atualizados++;
      } else if (!id) {
        novos++;
      }

      // Buscar IDs de núcleo e categoria
      const nucleoNome = toText(getColumnValue(row, "Núcleo", "Nucleo", "nucleo", "NUCLEO"));
      const categoriaNome = toText(getColumnValue(row, "Categoria", "categoria", "CATEGORIA"));
      const nucleo = nucleos.find((n) => n.nome.toLowerCase() === nucleoNome.toLowerCase());
      const categoria = categorias.find((c) => c.nome.toLowerCase() === categoriaNome.toLowerCase());

      if (nucleoNome && !nucleo) {
        erros.push(`Linha ${linha}: Núcleo "${nucleoNome}" nÍo encontrado`);
      }

      // CALCULAR PREÇO AUTOMATICAMENTE para preview
      // Usar parseValorBR + getColumnValue para suportar formato brasileiro e nomes flexíveis
      const custoRaw = getColumnValue(row, "Custo AquisiçÍo (R$)", "Custo Aquisicao", "custo_aquisicao", "Custo");
      const custoAquisicao = parseValorBR(custoRaw);

      const precoAtualRaw = getColumnValue(row, "Preço Atual (R$)", "Preco Atual", "preco", "Preço");
      const precoCalculadoRaw = getColumnValue(row, "Preço Calculado (R$)", "Preco Calculado");
      let precoCalculadoPreview = parseValorBR(precoCalculadoRaw) || parseValorBR(precoAtualRaw);

      // Log para debug
      if (import.meta.env.DEV) console.log(`[Import Preview] Linha ${linha}: custoRaw="${custoRaw}" → custo=${custoAquisicao}, nucleo="${nucleoNome}"`);

      if (custoAquisicao > 0 && nucleoNome) {
        precoCalculadoPreview = recalcularPreco(custoAquisicao, nucleoNome);
      }

      // Buscar código e descriçÍo também
      const codigo = toText(getColumnValue(row, "Código", "Codigo", "codigo", "CODIGO"));
      const descricao = toText(getColumnValue(row, "DescriçÍo", "Descricao", "descricao", "DESCRICAO"));

      return {
        ...row,
        _id: id || undefined,
        _codigo: codigo || undefined,
        _nome: nome || undefined,
        _descricao: descricao || undefined,
        _tipo: tipo || undefined,
        _unidade: unidade || undefined,
        _nucleo_nome: nucleoNome,
        _nucleo_id: nucleo?.id || null,
        _categoria_id: categoria?.id || null,
        _linha: linha,
        _status: id ? "atualizar" : "novo",
        _preco_calculado: precoCalculadoPreview,
        _custo: custoAquisicao,
      };
    }) as ProcessedPreviewRow[];

    setImportPreview({
      dados: dadosProcessados,
      erros,
      novos,
      atualizados,
    });
  }

  async function executarImportacao() {
    if (!importPreview || importPreview.erros.length > 0) {
      toast({ title: "AtençÍo", description: "Corrija os erros antes de importar" });
      return;
    }

    setImportando(true);
    let sucessos = 0;
    let falhas = 0;

    try {
      for (const row of importPreview.dados) {
        // Usar valores já processados no preview (já usou parseValorBR + getColumnValue)
        const custoAquisicao = row._custo > 0 ? row._custo : null;
        const nucleoNome = row._nucleo_nome || "";

        // CALCULAR PREÇO AUTOMATICAMENTE se tiver custo e núcleo
        let precoFinal = row._preco_calculado || 0;
        const margemRaw = getColumnValue(row, "Margem (%)", "Margem", "margem_lucro");
        let margemFinal = Number(margemRaw) || 20;

        if (custoAquisicao && custoAquisicao > 0 && nucleoNome) {
          // Aplicar fórmula de precificaçÍo automaticamente
          precoFinal = recalcularPreco(custoAquisicao, nucleoNome);
          margemFinal = 20; // Margem padrÍo das regras
          if (import.meta.env.DEV) console.log(`Item "${row._nome}": Custo R$${custoAquisicao} → Preço calculado R$${precoFinal} (Núcleo: ${nucleoNome})`);
        }

        const payload = {
          codigo: row._codigo || null,
          nome: row._nome,
          descricao: row._descricao || null,
          tipo: row._tipo,
          unidade: row._unidade,
          preco: precoFinal,
          custo_aquisicao: custoAquisicao,
          margem_lucro: margemFinal,
          nucleo_id: row._nucleo_id,
          categoria_id: row._categoria_id,
        };

        try {
          if (row._id && row._status === "atualizar") {
            // Atualizar existente
            const { error } = await supabase
              .from("pricelist_itens")
              .update(payload)
              .eq("id", row._id);

            if (error) throw error;
          } else {
            // Criar novo
            const { error } = await supabase
              .from("pricelist_itens")
              .insert(payload);

            if (error) throw error;
          }
          sucessos++;
        } catch (err) {
          console.error(`Erro na linha ${row._linha}:`, err);
          falhas++;
        }
      }

      toast({ title: "ImportaçÍo concluída", description: `Sucessos: ${sucessos} | Falhas: ${falhas}` });

      // Limpar e recarregar
      setImportPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      carregarDados();
    } catch (error) {
      console.error("Erro na importaçÍo:", error);
      toast({ title: "Erro", description: "Erro ao importar dados", variant: "destructive" });
    } finally {
      setImportando(false);
    }
  }

  function cancelarImportacao() {
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26]" />
          <p className="text-sm text-gray-600 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/pricelist")}
          className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Pricelist
        </button>
        <h1 className="text-2xl font-normal text-[#2E2E2E]">Exportar / Importar Pricelist</h1>
        <p className="text-sm text-gray-600 mt-1">
          Baixe a planilha Excel, revise os preços e faça upload para atualizar em massa
        </p>
      </div>

      {/* Cards de AçÍo */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Card Exportar */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-normal text-[#2E2E2E]">Exportar para Excel</h2>
              <p className="text-sm text-gray-500">{items.length} itens no catálogo</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Baixe todos os itens do Pricelist em uma planilha Excel.
            A planilha inclui o preço atual e o preço calculado pela fórmula de precificaçÍo.
          </p>

          <button
            onClick={exportarExcel}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar Planilha Excel
          </button>

          {exportStatus && (
            <p className="mt-3 text-sm text-green-600 text-center">{exportStatus}</p>
          )}
        </div>

        {/* Card Importar */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-normal text-[#2E2E2E]">Importar do Excel</h2>
              <p className="text-sm text-gray-500">Atualizar itens em massa</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Faça upload de uma planilha Excel revisada para atualizar os preços.
            Você poderá revisar as alterações antes de confirmar.
          </p>

          <label className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Selecionar Arquivo Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview da ImportaçÍo */}
      {importPreview && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-normal text-[#2E2E2E] mb-4">Preview da ImportaçÍo</h3>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-normal text-blue-600">{importPreview.dados.length}</p>
              <p className="text-sm text-blue-700">Total de linhas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-normal text-green-600">{importPreview.novos}</p>
              <p className="text-sm text-green-700">Novos itens</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-normal text-yellow-600">{importPreview.atualizados}</p>
              <p className="text-sm text-yellow-700">Atualizações</p>
            </div>
          </div>

          {/* Info sobre cálculo automático */}
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
            <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm text-purple-800 font-medium">Cálculo Automático de Preços</p>
              <p className="text-xs text-purple-700 mt-0.5">
                Itens com <strong>Custo de AquisiçÍo</strong> e <strong>Núcleo</strong> terÍo o preço calculado automaticamente
                usando a fórmula de precificaçÍo. Os preços marcados com <span className="text-purple-600 font-medium">(auto)</span> serÍo recalculados.
              </p>
            </div>
          </div>

          {/* Erros */}
          {importPreview.erros.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-normal text-red-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Erros encontrados ({importPreview.erros.length})
              </h4>
              <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {importPreview.erros.map((erro, i) => (
                  <li key={i}>{erro}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela de Preview */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Código</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Núcleo</th>
                    <th className="px-3 py-2 text-right text-xs font-normal text-gray-600">Custo</th>
                    <th className="px-3 py-2 text-right text-xs font-normal text-gray-600">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importPreview.dados.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row._status === "novo"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {row._status === "novo" ? "Novo" : "Atualizar"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row._codigo || "-"}</td>
                      <td className="px-3 py-2 text-gray-900 font-medium">{row._nome}</td>
                      <td className="px-3 py-2 text-gray-600">{row._nucleo_nome || "-"}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        R$ {Number(row._custo || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-normal text-green-600">
                        R$ {Number(row._preco_calculado || 0).toFixed(2)}
                        {row._custo > 0 && row._nucleo_nome && (
                          <span className="ml-1 text-xs text-purple-500" title="Calculado automaticamente">
                            (auto)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreview.dados.length > 20 && (
              <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-500">
                Mostrando 20 de {importPreview.dados.length} linhas
              </div>
            )}
          </div>

          {/* Botões de AçÍo */}
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelarImportacao}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={executarImportacao}
              disabled={importPreview.erros.length > 0 || importando}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importando ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar ImportaçÍo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-normal text-blue-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Como funciona a precificaçÍo automática
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Fórmula de Cálculo</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Custo de AquisiçÍo (valor base)</li>
              <li>2. + Impostos (5%)</li>
              <li>3. + Custo Hora William (21.3%)</li>
              <li>4. + Custos Variáveis (0%)</li>
              <li>5. + Custos Fixos (por núcleo)</li>
              <li className="font-medium text-gray-800">= CUSTO REAL</li>
              <li>6. + Margem de Lucro (20%)</li>
              <li className="font-normal text-green-700">= PREÇO DE VENDA</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Custos Fixos por Núcleo</h4>
            <div className="space-y-2">
              {[
                { nome: "Design", perc: "3%", valor: "R$ 3.000" },
                { nome: "Arquitetura", perc: "5%", valor: "R$ 5.000" },
                { nome: "Engenharia", perc: "8%", valor: "R$ 8.000" },
                { nome: "Marcenaria", perc: "12%", valor: "R$ 12.000" },
              ].map((n) => (
                <div key={n.nome} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{n.nome}</span>
                  <span className="text-gray-500">{n.valor} ({n.perc})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

