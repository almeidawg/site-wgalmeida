// ============================================================
// PAGINA: Exportar/Importar Pessoas (Excel)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useToast } from "@/components/ui/use-toast";

interface Pessoa {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cnpj: string;
  rg: string;
  tipo: string;
  cargo: string;
  empresa: string;
  unidade: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  banco: string;
  agencia: string;
  conta: string;
  pix: string;
  observacoes: string;
  ativo: boolean;
}

interface ImportPreview {
  dados: Array<Record<string, unknown>>;
  erros: string[];
  novos: number;
  atualizados: number;
}

const loadXLSX = () => import("@/lib/xlsxCompat");

// Converter valores em formato brasileiro (R$ 15,00 ou CPF)
function parseValorBR(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "";
  return String(valor).trim();
}

// Formatar CPF/CNPJ removendo caracteres especiais
function limparDocumento(doc: unknown): string {
  if (!doc) return "";
  return String(doc).replace(/[^\d]/g, "");
}

export default function ExportarImportarPessoasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [tipoPessoa, setTipoPessoa] = useState<string>(searchParams.get("tipo") || "COLABORADOR");
  const [exportStatus, setExportStatus] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importando, setImportando] = useState(false);
  const { toast } = useToast();

  const tiposDisponiveis = [
    { valor: "COLABORADOR", label: "Colaboradores" },
    { valor: "CLIENTE", label: "Clientes" },
    { valor: "FORNECEDOR", label: "Fornecedores" },
    { valor: "ESPECIFICADOR", label: "Especificadores" },
  ];

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("*")
        .eq("tipo", tipoPessoa)
        .order("nome");

      if (error) throw error;
      setPessoas(data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoPessoa]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ================================================================
  // EXPORTAR PARA EXCEL
  // ================================================================
  async function exportarExcel() {
    setExportStatus("Gerando planilha...");

    try {
      const XLSX = await loadXLSX();
      const dadosExcel = pessoas.map((p) => ({
        "ID": p.id,
        "Nome": p.nome || "",
        "Email": p.email || "",
        "Telefone": p.telefone || "",
        "CPF": p.cpf || "",
        "CNPJ": p.cnpj || "",
        "RG": p.rg || "",
        "Cargo": p.cargo || "",
        "Empresa": p.empresa || "",
        "Unidade": p.unidade || "",
        "CEP": p.cep || "",
        "Logradouro": p.logradouro || "",
        "Numero": p.numero || "",
        "Complemento": p.complemento || "",
        "Bairro": p.bairro || "",
        "Cidade": p.cidade || "",
        "Estado": p.estado || "",
        "Banco": p.banco || "",
        "Agencia": p.agencia || "",
        "Conta": p.conta || "",
        "PIX": p.pix || "",
        "Observacoes": p.observacoes || "",
        "Ativo": p.ativo ? "Sim" : "Nao",
      }));

      const ws = XLSX.utils.json_to_sheet(dadosExcel);

      const colWidths = [
        { wch: 36 },  // ID
        { wch: 35 },  // Nome
        { wch: 30 },  // Email
        { wch: 15 },  // Telefone
        { wch: 14 },  // CPF
        { wch: 18 },  // CNPJ
        { wch: 12 },  // RG
        { wch: 20 },  // Cargo
        { wch: 25 },  // Empresa
        { wch: 15 },  // Unidade
        { wch: 10 },  // CEP
        { wch: 35 },  // Logradouro
        { wch: 8 },   // Numero
        { wch: 15 },  // Complemento
        { wch: 20 },  // Bairro
        { wch: 20 },  // Cidade
        { wch: 5 },   // Estado
        { wch: 15 },  // Banco
        { wch: 10 },  // Agencia
        { wch: 15 },  // Conta
        { wch: 20 },  // PIX
        { wch: 40 },  // Observacoes
        { wch: 6 },   // Ativo
      ];
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tipoPessoa);

      // Aba de instrucoes
      const instrucoes = [
        ["INSTRUCOES DE USO"],
        [""],
        [`1. Esta planilha contem ${tiposDisponiveis.find(t => t.valor === tipoPessoa)?.label || tipoPessoa}`],
        ["2. Edite os dados conforme necessario"],
        ["3. Para adicionar novos registros, deixe o ID vazio"],
        ["4. Salve o arquivo e faca upload na mesma pagina"],
        [""],
        ["CAMPOS IMPORTANTES:"],
        ["- Nome: obrigatorio"],
        ["- Email: obrigatorio, deve ser unico"],
        ["- CPF: apenas numeros (11 digitos)"],
        ["- CNPJ: apenas numeros (14 digitos)"],
        ["- Telefone: apenas numeros"],
        ["- Estado: sigla UF (ex: SP, RJ)"],
        [""],
        ["NAO ALTERE A COLUNA ID para registros existentes!"],
      ];
      const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
      wsInstrucoes["!cols"] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInstrucoes, "Instrucoes");

      const dataAtual = new Date().toISOString().split("T")[0];
      const fileName = `${tipoPessoa}_WGEasy_${dataAtual}.xlsx`;
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

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        processarPreview(jsonData);
      } catch (error) {
        console.error("Erro ao ler arquivo:", error);
        toast({ title: "Erro ao ler arquivo Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function processarPreview(dados: Array<Record<string, unknown>>) {
    const erros: string[] = [];
    let novos = 0;
    let atualizados = 0;

    const dadosProcessados = dados.map((row, index) => {
      const linha = index + 2;

      const nome = row["Nome"] ? String(row["Nome"]).trim() : "";
      const email = row["Email"] ? String(row["Email"]).trim() : "";

      if (!nome) {
        erros.push(`Linha ${linha}: Nome e obrigatorio`);
      }
      if (!email) {
        erros.push(`Linha ${linha}: Email e obrigatorio`);
      }

      const id = row["ID"] ? String(row["ID"]).trim() : "";
      if (id && pessoas.find((p) => p.id === id)) {
        atualizados++;
      } else if (!id) {
        novos++;
      }

      return {
        ...row,
        _linha: linha,
        _status: id ? "atualizar" : "novo",
      };
    });

    setImportPreview({
      dados: dadosProcessados,
      erros,
      novos,
      atualizados,
    });
  }

  async function executarImportacao() {
    if (!importPreview || importPreview.erros.length > 0) {
      toast({ title: "Corrija os erros antes de importar", variant: "destructive" });
      return;
    }

    setImportando(true);
    let sucessos = 0;
    let falhas = 0;

    try {
      for (const row of importPreview.dados) {
        const payload = {
          nome: parseValorBR(row["Nome"]),
          email: parseValorBR(row["Email"]),
          telefone: limparDocumento(row["Telefone"]),
          cpf: limparDocumento(row["CPF"]),
          cnpj: limparDocumento(row["CNPJ"]),
          rg: parseValorBR(row["RG"]),
          cargo: parseValorBR(row["Cargo"]),
          empresa: parseValorBR(row["Empresa"]),
          unidade: parseValorBR(row["Unidade"]),
          cep: limparDocumento(row["CEP"]),
          logradouro: parseValorBR(row["Logradouro"]),
          numero: parseValorBR(row["Numero"]),
          complemento: parseValorBR(row["Complemento"]),
          bairro: parseValorBR(row["Bairro"]),
          cidade: parseValorBR(row["Cidade"]),
          estado: parseValorBR(row["Estado"]),
          banco: parseValorBR(row["Banco"]),
          agencia: parseValorBR(row["Agencia"]),
          conta: parseValorBR(row["Conta"]),
          pix: parseValorBR(row["PIX"]),
          observacoes: parseValorBR(row["Observacoes"]),
          tipo: tipoPessoa,
          ativo: row["Ativo"] !== "Nao",
        };

        try {
          if (row["ID"] && row._status === "atualizar") {
            const { error } = await supabase
              .from("pessoas")
              .update(payload)
              .eq("id", row["ID"]);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("pessoas")
              .insert(payload);

            if (error) throw error;
          }
          sucessos++;
        } catch (err) {
          console.error(`Erro na linha ${row._linha}:`, err);
          falhas++;
        }
      }

      toast({ title: "ImportaçÍo concluída!", description: `Sucessos: ${sucessos} | Falhas: ${falhas}` });

      setImportPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      carregarDados();
    } catch (error) {
      console.error("Erro na importacao:", error);
      toast({ title: "Erro ao importar dados", variant: "destructive" });
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
      <div className={`${LAYOUT.pageContainer} flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#F25C26]" />
          <p className={`${TYPOGRAPHY.cardSubtitle} mt-4`}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <button
          onClick={() => navigate("/pessoas")}
          className={`text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 ${TYPOGRAPHY.cardTitle}`}
        >
          <svg className={TYPOGRAPHY.iconSmall} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className={TYPOGRAPHY.pageTitle}>Exportar / Importar Pessoas</h1>
        <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
          Baixe a planilha Excel, edite e faca upload para atualizar em massa
        </p>
      </div>

      {/* Seletor de Tipo */}
      <div className={`mb-4 sm:mb-6 ${LAYOUT.card}`}>
        <label className={`block ${TYPOGRAPHY.formLabel} mb-2`}>Tipo de Pessoa</label>
        <div className="flex gap-2 flex-wrap">
          {tiposDisponiveis.map((tipo) => (
            <button
              key={tipo.valor}
              onClick={() => setTipoPessoa(tipo.valor)}
              className={`px-3 sm:px-4 py-2 rounded-lg ${TYPOGRAPHY.cardTitle} transition-colors ${
                tipoPessoa === tipo.valor
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Acao */}
      <div className={`${LAYOUT.gridHalf} mb-6 sm:mb-8`}>
        {/* Card Exportar */}
        <div className={LAYOUT.card}>
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className={`${TYPOGRAPHY.iconLarge} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h2 className={TYPOGRAPHY.sectionTitle}>Exportar para Excel</h2>
              <p className={TYPOGRAPHY.cardSubtitle}>{pessoas.length} registros encontrados</p>
            </div>
          </div>

          <p className={`${TYPOGRAPHY.bodySmall} mb-3 sm:mb-4`}>
            Baixe todos os {tiposDisponiveis.find(t => t.valor === tipoPessoa)?.label?.toLowerCase()} em uma planilha Excel.
          </p>

          <button
            onClick={exportarExcel}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${TYPOGRAPHY.cardTitle} flex items-center justify-center gap-2`}
          >
            <svg className={TYPOGRAPHY.iconMedium} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Baixar Planilha Excel</span>
            <span className="sm:hidden">Baixar Excel</span>
          </button>

          {exportStatus && (
            <p className={`mt-3 ${TYPOGRAPHY.cardSubtitle} text-green-600 text-center`}>{exportStatus}</p>
          )}
        </div>

        {/* Card Importar */}
        <div className={LAYOUT.card}>
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className={`${TYPOGRAPHY.iconLarge} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className={TYPOGRAPHY.sectionTitle}>Importar do Excel</h2>
              <p className={TYPOGRAPHY.cardSubtitle}>Atualizar registros em massa</p>
            </div>
          </div>

          <p className={`${TYPOGRAPHY.bodySmall} mb-3 sm:mb-4`}>
            Faca upload de uma planilha Excel para atualizar ou adicionar novos registros.
          </p>

          <label className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors ${TYPOGRAPHY.cardTitle} flex items-center justify-center gap-2 cursor-pointer`}>
            <svg className={TYPOGRAPHY.iconMedium} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="hidden sm:inline">Selecionar Arquivo Excel</span>
            <span className="sm:hidden">Selecionar Arquivo</span>
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

      {/* Preview da Importacao */}
      {importPreview && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-[16px] font-normal text-[#2E2E2E] mb-4">Preview da Importacao</h3>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-[20px] font-normal text-blue-600">{importPreview.dados.length}</p>
              <p className="text-[12px] text-blue-700">Total de linhas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-[20px] font-normal text-green-600">{importPreview.novos}</p>
              <p className="text-[12px] text-green-700">Novos registros</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-[20px] font-normal text-yellow-600">{importPreview.atualizados}</p>
              <p className="text-[12px] text-yellow-700">Atualizacoes</p>
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
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Telefone</th>
                    <th className="px-3 py-2 text-left text-xs font-normal text-gray-600">Cargo</th>
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
                      <td className="px-3 py-2 text-gray-900 font-medium">{String(row["Nome"] ?? "")}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row["Email"] ?? "")}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row["Telefone"] ?? "-")}</td>
                      <td className="px-3 py-2 text-gray-600">{String(row["Cargo"] ?? "-")}</td>
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

          {/* Botoes de Acao */}
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
                  Confirmar Importacao
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

