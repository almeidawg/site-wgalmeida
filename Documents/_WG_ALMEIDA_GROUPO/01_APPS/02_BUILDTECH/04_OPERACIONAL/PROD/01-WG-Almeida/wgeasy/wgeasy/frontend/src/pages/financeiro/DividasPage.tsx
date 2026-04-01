/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { formatarMoedaInput, desformatarMoeda } from "@/utils/formatadores";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  FileText,
  Upload,
  X,
  ExternalLink,
  Image,
  File,
  CheckCircle,
  Clock,
  XCircle,
  Scale,
  Copy,
  Download,
  ChevronDown,
} from "lucide-react";
import { DateInputBR, getTodayISO } from "@/components/ui/DateInputBR";
import {
  listarDividas,
  criarDivida,
  atualizarDivida,
  deletarDivida,
  marcarDividaComoPaga,
  listarCartorios,
  listarCredores,
  criarFornecedorRapido,
  listarAnexosDivida,
  registrarAnexoDivida,
  deletarAnexoDivida,
  obterResumoDividas,
  type Divida,
  type StatusDivida,
  type DevedorTipo,
  type CredorTipo,
  type TipoAnexoDivida,
  type CartorioProtesto,
  type DividaAnexo,
  type ResumoDividas,
} from "@/lib/dividasApi";
import { listarEmpresas, listarSocios } from "@/lib/empresasApi";
import type { EmpresaGrupo, SocioEmpresa } from "@/types/empresas";
import { googleDriveService } from "@/services/googleDriveBrowserService";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { buscarEmpresaPorCNPJ } from "@/lib/cnpjApi";
import {
  exportarDividasPDF,
  exportarDividasExcel,
  agruparPorEmpresa,
  agruparPorSocio,
  type GrupoDividas,
  type ModoExportacao,
} from "@/lib/exportarDividas";

const DIVIDAS_DRIVE_FOLDER_ID = "156SVFlP472sjUohva9FonXJRBByJRJY1";

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG: Record<StatusDivida, { label: string; bg: string; text: string }> = {
  pendente:       { label: "Pendente",       bg: "bg-yellow-100", text: "text-yellow-800" },
  em_negociacao:  { label: "Em NegociaçÍo",  bg: "bg-blue-100",   text: "text-blue-800" },
  acordo:         { label: "Acordo",         bg: "bg-purple-100", text: "text-purple-800" },
  paga:           { label: "Paga",           bg: "bg-green-100",  text: "text-green-800" },
  protestada:     { label: "Protestada",     bg: "bg-red-100",    text: "text-red-800" },
  prescrita:      { label: "Prescrita",      bg: "bg-gray-100",   text: "text-gray-600" },
  cancelada:      { label: "Cancelada",      bg: "bg-gray-100",   text: "text-gray-500" },
};

const TIPO_ANEXO_OPTIONS: { value: TipoAnexoDivida; label: string }[] = [
  { value: "boleto",      label: "Boleto" },
  { value: "comprovante", label: "Comprovante" },
  { value: "foto",        label: "Foto" },
  { value: "documento",   label: "Documento" },
  { value: "outro",       label: "Outro" },
];

type FormData = {
  descricao: string;
  credor_id: string;
  credor_tipo: CredorTipo | "";
  devedor_tipo: DevedorTipo;
  empresa_id: string;
  socio_id: string;
  valor_original: string;
  valor_negociado: string;
  protestada: boolean;
  cartorio_id: string;
  custas_cartorio: string;
  status: StatusDivida;
  data_vencimento_original: string;
  data_acordo: string;
  data_quitacao: string;
  nucleo: string;
  observacoes: string;
};

const EMPTY_FORM: FormData = {
  descricao: "",
  credor_id: "",
  credor_tipo: "",
  devedor_tipo: "empresa",
  empresa_id: "",
  socio_id: "",
  valor_original: "",
  valor_negociado: "",
  protestada: false,
  cartorio_id: "",
  custas_cartorio: "",
  status: "pendente",
  data_vencimento_original: "",
  data_acordo: "",
  data_quitacao: "",
  nucleo: "",
  observacoes: "",
};

const NUCLEOS = [
  { value: "arquitetura", label: "Arquitetura" },
  { value: "engenharia", label: "Engenharia" },
  { value: "marcenaria", label: "Marcenaria" },
  { value: "designer", label: "WG Designer" },
  { value: "grupo", label: "Empresas do Grupo" },
];

// ============================================================
// COMPONENT
// ============================================================

export default function DividasPage() {
  // Data
  const { toast } = useToast();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [credores, setCredores] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaGrupo[]>([]);
  const [socios, setSocios] = useState<SocioEmpresa[]>([]);
  const [cartorios, setCartorios] = useState<CartorioProtesto[]>([]);
  const [anexos, setAnexos] = useState<DividaAnexo[]>([]);
  const [resumo, setResumo] = useState<ResumoDividas>({ totalAtivas: 0, valorTotal: 0, totalProtestadas: 0, totalVencidas: 0 });

  // UI
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusDivida | "">("");
  const [filterDevedorTipo, setFilterDevedorTipo] = useState<DevedorTipo | "">("");
  const [filterProtestada, setFilterProtestada] = useState<"" | "true" | "false">("");
  const [filterNucleo, setFilterNucleo] = useState("");
  const [groupBy, setGroupBy] = useState<"" | "empresa" | "socio">("");

  // Export menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Credor search
  const [buscaCredor, setBuscaCredor] = useState("");
  const [isCredorOpen, setIsCredorOpen] = useState(false);

  // Ref para click-outside do dropdown credor
  const credorDropdownRef = useRef<HTMLDivElement>(null);

  // Novo fornecedor rápido
  const [showNovoFornecedor, setShowNovoFornecedor] = useState(false);
  const [novoFornecedorNome, setNovoFornecedorNome] = useState("");
  const [novoFornecedorCnpj, setNovoFornecedorCnpj] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjDados, setCnpjDados] = useState<{ razao_social: string; nome_fantasia: string } | null>(null);

  // Anexos no form
  const [tipoAnexo, setTipoAnexo] = useState<TipoAnexoDivida>("documento");
  const [uploading, setUploading] = useState(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [divs, creds, emps, socs, carts, res] = await Promise.all([
          listarDividas(),
          listarCredores(),
          listarEmpresas(),
          listarSocios(),
          listarCartorios(),
          obterResumoDividas(),
        ]);
        setDividas(divs);
        setCredores(creds);
        if (import.meta.env.DEV) console.log(`[Dívidas] ${creds.length} credores carregados`);
        setEmpresas(emps);
        setSocios(socs);
        setCartorios(carts);
        setResumo(res);
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar dívidas: " + error.message });
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [refreshKey]);

  // Carregar anexos quando editando
  useEffect(() => {
    if (editingId) {
      listarAnexosDivida(editingId).then(setAnexos).catch(console.error);
    } else {
      setAnexos([]);
    }
  }, [editingId]);

  // Fechar dropdown credor ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (credorDropdownRef.current && !credorDropdownRef.current.contains(e.target as Node)) {
        setIsCredorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar export menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // FILTROS
  // ============================================================

  const filteredDividas = useMemo(() => {
    let result = [...dividas];

    if (searchTerm.trim()) {
      const termo = normalizeSearchTerm(searchTerm);
      result = result.filter((d) => {
        const campos = [
          d.numero,
          d.descricao,
          d.credor?.nome,
          d.empresa?.razao_social,
          d.empresa?.nome_fantasia,
          d.socio?.nome,
          d.nucleo,
          d.observacoes,
          d.valor_original != null ? formatarMoeda(Number(d.valor_original)) : "",
          d.valor_negociado != null ? formatarMoeda(Number(d.valor_negociado)) : "",
          d.valor_divida != null ? formatarMoeda(Number(d.valor_divida)) : "",
          d.valor_original != null ? String(d.valor_original) : "",
          d.valor_negociado != null ? String(d.valor_negociado) : "",
          d.valor_divida != null ? String(d.valor_divida) : "",
        ].filter(Boolean).join(" ");
        return normalizeSearchTerm(campos).includes(termo);
      });
    }

    if (filterStatus) {
      result = result.filter((d) => d.status === filterStatus);
    }

    if (filterDevedorTipo) {
      result = result.filter((d) => d.devedor_tipo === filterDevedorTipo);
    }

    if (filterProtestada === "true") {
      result = result.filter((d) => d.protestada === true);
    } else if (filterProtestada === "false") {
      result = result.filter((d) => d.protestada === false || !d.protestada);
    }

    if (filterNucleo) {
      result = result.filter((d) => d.nucleo === filterNucleo);
    }

    return result;
  }, [dividas, searchTerm, filterStatus, filterDevedorTipo, filterProtestada, filterNucleo]);

  // Agrupamento visual da tabela
  const groupedDividas = useMemo((): GrupoDividas[] | null => {
    if (!groupBy) return null;
    if (groupBy === "empresa") return agruparPorEmpresa(filteredDividas, empresas);
    return agruparPorSocio(filteredDividas, socios);
  }, [filteredDividas, groupBy, empresas, socios]);

  // Total geral para rodapé agrupado
  const totalGeralGrouped = useMemo(() => {
    if (!groupedDividas) return null;
    return {
      original: filteredDividas.reduce((s, d) => s + Number(d.valor_original || 0), 0),
      negociado: filteredDividas.reduce((s, d) => s + Number(d.valor_divida || 0), 0),
    };
  }, [groupedDividas, filteredDividas]);

  // Credores filtrados pela busca
  const credoresFiltrados = useMemo(() => {
    if (!buscaCredor.trim()) return credores;
    const termo = normalizeSearchTerm(buscaCredor);
    return credores.filter((c: any) => {
      const campos = [c.nome, c.email, c.cpf, c.cnpj, c.tipo].filter(Boolean).join(" ");
      return normalizeSearchTerm(campos).includes(termo);
    });
  }, [credores, buscaCredor]);

  // Valor dívida computado no form
  const valorDividaComputed = useMemo(() => {
    const negociado = desformatarMoeda(formData.valor_negociado);
    const custas = desformatarMoeda(formData.custas_cartorio);
    return negociado + custas;
  }, [formData.valor_negociado, formData.custas_cartorio]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  function abrirForm(divida?: Divida) {
    if (divida) {
      setEditingId(divida.id);
      setFormData({
        descricao: divida.descricao || "",
        credor_id: divida.credor_id || "",
        credor_tipo: divida.credor_tipo || "",
        devedor_tipo: divida.devedor_tipo || "empresa",
        empresa_id: divida.empresa_id || "",
        socio_id: divida.socio_id || "",
        valor_original: divida.valor_original != null ? formatarMoeda(Number(divida.valor_original)) : "",
        valor_negociado: divida.valor_negociado != null ? formatarMoeda(Number(divida.valor_negociado)) : "",
        protestada: divida.protestada || false,
        cartorio_id: divida.cartorio_id || "",
        custas_cartorio: divida.custas_cartorio != null ? formatarMoeda(Number(divida.custas_cartorio)) : "",
        status: divida.status || "pendente",
        data_vencimento_original: divida.data_vencimento_original || "",
        data_acordo: divida.data_acordo || "",
        data_quitacao: divida.data_quitacao || "",
        nucleo: divida.nucleo || "",
        observacoes: divida.observacoes || "",
      });
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
    }
    setBuscaCredor("");
    setIsCredorOpen(false);
    setShowNovoFornecedor(false);
    setIsFormOpen(true);
  }

  function fecharForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setAnexos([]);
  }

  async function salvar() {
    if (!formData.descricao.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "DescriçÍo é obrigatória." });
      return;
    }
    if (formData.devedor_tipo === "empresa" && !formData.empresa_id) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione a empresa devedora." });
      return;
    }
    if (formData.devedor_tipo === "socio" && !formData.socio_id) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione o sócio devedor." });
      return;
    }
    if (formData.protestada && !formData.cartorio_id) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione o cartório de protesto." });
      return;
    }

    const dados: any = {
      descricao: formData.descricao,
      credor_id: formData.credor_id || null,
      credor_tipo: formData.credor_tipo || null,
      devedor_tipo: formData.devedor_tipo,
      empresa_id: formData.devedor_tipo === "empresa" ? formData.empresa_id || null : null,
      socio_id: formData.devedor_tipo === "socio" ? formData.socio_id || null : null,
      valor_original: formData.valor_original ? desformatarMoeda(formData.valor_original) : null,
      valor_negociado: formData.valor_negociado ? desformatarMoeda(formData.valor_negociado) : null,
      protestada: formData.protestada,
      cartorio_id: formData.protestada ? formData.cartorio_id || null : null,
      custas_cartorio: formData.protestada ? (desformatarMoeda(formData.custas_cartorio) || 0) : 0,
      status: formData.status,
      data_vencimento_original: formData.data_vencimento_original || null,
      data_acordo: formData.data_acordo || null,
      data_quitacao: formData.data_quitacao || null,
      nucleo: formData.nucleo || null,
      observacoes: formData.observacoes || null,
    };

    try {
      if (editingId) {
        await atualizarDivida(editingId, dados);
      } else {
        await criarDivida(dados);
      }
      fecharForm();
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar: " + error.message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta dívida?")) return;
    try {
      await deletarDivida(id);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir: " + error.message });
    }
  }

  function handleDuplicar(divida: Divida) {
    setEditingId(null);
    setFormData({
      descricao: divida.descricao || "",
      credor_id: divida.credor_id || "",
      credor_tipo: divida.credor_tipo || "",
      devedor_tipo: divida.devedor_tipo || "empresa",
      empresa_id: divida.empresa_id || "",
      socio_id: divida.socio_id || "",
      valor_original: divida.valor_original != null ? formatarMoeda(Number(divida.valor_original)) : "",
      valor_negociado: divida.valor_negociado != null ? formatarMoeda(Number(divida.valor_negociado)) : "",
      protestada: divida.protestada || false,
      cartorio_id: divida.cartorio_id || "",
      custas_cartorio: divida.custas_cartorio != null ? formatarMoeda(Number(divida.custas_cartorio)) : "",
      status: "pendente",
      data_vencimento_original: "",
      data_acordo: "",
      data_quitacao: "",
      nucleo: divida.nucleo || "",
      observacoes: divida.observacoes || "",
    });
    setBuscaCredor(divida.credor?.nome || "");
    setIsCredorOpen(false);
    setShowNovoFornecedor(false);
    setIsFormOpen(true);
  }

  async function handleMarcarPaga(id: string) {
    try {
      await marcarDividaComoPaga(id);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao marcar como paga: " + error.message });
    }
  }

  // Exportar relatório
  async function handleExportar(formato: "pdf" | "excel", modo: ModoExportacao) {
    setShowExportMenu(false);
    try {
      if (formato === "pdf") {
        exportarDividasPDF(filteredDividas, empresas, socios, modo);
      } else {
        await exportarDividasExcel(filteredDividas, empresas, socios, modo);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao exportar: " + error.message });
    }
  }

  // Selecionar credor
  function selecionarCredor(credor: any) {
    const tipoMap: Record<string, CredorTipo> = {
      COLABORADOR: "colaborador",
      FORNECEDOR: "fornecedor",
      CLIENTE: "cliente",
      ESPECIFICADOR: "especificador",
      PRESTADOR: "prestador",
      EMPRESA_GRUPO: "empresa_grupo",
    };
    const tipo = (credor.tipo || "").toUpperCase();
    setFormData((prev) => ({
      ...prev,
      credor_id: credor.id,
      credor_tipo: tipoMap[tipo] || "fornecedor",
    }));
    setBuscaCredor(credor.nome);
    setIsCredorOpen(false);
  }

  // Buscar CNPJ para novo fornecedor
  async function handleBuscarCnpj() {
    const cnpjLimpo = novoFornecedorCnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "CNPJ deve conter 14 dígitos." });
      return;
    }
    setCnpjLoading(true);
    setCnpjDados(null);
    try {
      const dados = await buscarEmpresaPorCNPJ(cnpjLimpo);
      setCnpjDados({ razao_social: dados.razao_social, nome_fantasia: dados.nome_fantasia });
      setNovoFornecedorNome(dados.nome_fantasia || dados.razao_social);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao consultar CNPJ: " + error.message });
    } finally {
      setCnpjLoading(false);
    }
  }

  // Criar fornecedor rápido
  async function handleCriarFornecedor() {
    if (!novoFornecedorNome.trim()) return;
    try {
      const cnpjLimpo = novoFornecedorCnpj.replace(/\D/g, "") || undefined;
      const novo = await criarFornecedorRapido(novoFornecedorNome.trim(), cnpjLimpo);
      setCredores((prev) => [...prev, novo]);
      setFormData((prev) => ({ ...prev, credor_id: novo.id, credor_tipo: "fornecedor" }));
      setBuscaCredor(novo.nome);
      setShowNovoFornecedor(false);
      setNovoFornecedorNome("");
      setNovoFornecedorCnpj("");
      setCnpjDados(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar fornecedor: " + error.message });
    }
  }

  // Upload anexo
  async function handleUploadAnexo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    setUploading(true);
    try {
      const driveFile = await googleDriveService.uploadArquivo(file, DIVIDAS_DRIVE_FOLDER_ID);
      await registrarAnexoDivida(editingId, {
        nome_arquivo: file.name,
        tipo: tipoAnexo,
        drive_file_id: driveFile.id,
        drive_url: driveFile.webViewLink,
        mime_type: file.type,
        tamanho_bytes: file.size,
      });
      const updated = await listarAnexosDivida(editingId);
      setAnexos(updated);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro no upload: " + error.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteAnexo(id: string) {
    if (!confirm("Remover este anexo?")) return;
    try {
      await deletarAnexoDivida(id);
      setAnexos((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao remover anexo: " + error.message });
    }
  }

  // Helper para nome do credor
  function nomeCredor(d: Divida): string {
    return d.credor?.nome || "—";
  }

  // Helper para nome do devedor
  function nomeDevedor(d: Divida): string {
    if (d.devedor_tipo === "empresa") {
      return d.empresa?.nome_fantasia || d.empresa?.razao_social || "—";
    }
    return d.socio?.nome || "—";
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500 text-[14px]">Carregando dívidas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Dívidas
              </h1>
              <p className="text-[12px] text-gray-600">
                GestÍo de débitos, protestos e negociações
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Atualizar lista"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Export dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-[13px] font-normal hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Relatorio
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                  <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider">PDF</div>
                  <button type="button" onClick={() => handleExportar("pdf", "geral")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    PDF Geral
                  </button>
                  <button type="button" onClick={() => handleExportar("pdf", "por_empresa")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    PDF por Empresa
                  </button>
                  <button type="button" onClick={() => handleExportar("pdf", "por_socio")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    PDF por Socio
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider">Excel</div>
                  <button type="button" onClick={() => handleExportar("excel", "geral")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    Excel Geral
                  </button>
                  <button type="button" onClick={() => handleExportar("excel", "por_empresa")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    Excel por Empresa
                  </button>
                  <button type="button" onClick={() => handleExportar("excel", "por_socio")} className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                    Excel por Socio
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => abrirForm()}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nova Divida
            </button>
          </div>
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[18px] font-light text-blue-600">{resumo.totalAtivas}</span>
            <span className="text-[12px] text-gray-500">Ativas</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-md">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-[18px] font-light text-orange-600">{formatarMoeda(resumo.valorTotal)}</span>
            <span className="text-[12px] text-gray-500">Total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[18px] font-light text-red-600">{resumo.totalProtestadas}</span>
            <span className="text-[12px] text-gray-500">Protestadas</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 rounded-md">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-[18px] font-light text-yellow-600">{resumo.totalVencidas}</span>
            <span className="text-[12px] text-gray-500">Vencidas</span>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Busca */}
          <div className="flex-1 relative min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nº, descriçÍo, credor, R$..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent outline-none"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusDivida | "")}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
          >
            <option value="">Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Devedor */}
          <select
            value={filterDevedorTipo}
            onChange={(e) => setFilterDevedorTipo(e.target.value as DevedorTipo | "")}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
          >
            <option value="">Devedor</option>
            <option value="empresa">Empresa</option>
            <option value="socio">Sócio PF</option>
          </select>

          {/* Protestada */}
          <select
            value={filterProtestada}
            onChange={(e) => setFilterProtestada(e.target.value as "" | "true" | "false")}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
          >
            <option value="">Protesto</option>
            <option value="true">Protestada</option>
            <option value="false">NÍo protestada</option>
          </select>

          {/* Núcleo */}
          <select
            value={filterNucleo}
            onChange={(e) => setFilterNucleo(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
          >
            <option value="">Núcleo</option>
            {NUCLEOS.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>

          {/* Agrupar */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as "" | "empresa" | "socio")}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
          >
            <option value="">Agrupar por</option>
            <option value="empresa">Empresa</option>
            <option value="socio">Socio</option>
          </select>

          {/* Contagem */}
          <span className="text-[12px] text-gray-400 ml-auto">
            {filteredDividas.length} divida{filteredDividas.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-normal text-gray-500 uppercase tracking-wider">Nº</th>
                <th className="px-3 py-3 text-left text-[10px] font-normal text-gray-500 uppercase tracking-wider max-w-[180px]">DescriçÍo</th>
                <th className="px-3 py-3 text-left text-[10px] font-normal text-gray-500 uppercase tracking-wider max-w-[180px]">Credor</th>
                <th className="px-3 py-3 text-left text-[10px] font-normal text-gray-500 uppercase tracking-wider">Devedor</th>
                <th className="px-3 py-3 text-right text-[10px] font-normal text-gray-500 uppercase tracking-wider">Original</th>
                <th className="px-3 py-3 text-right text-[10px] font-normal text-gray-500 uppercase tracking-wider">Negociado</th>
                <th className="px-3 py-3 text-center text-[10px] font-normal text-gray-500 uppercase tracking-wider">Desc.</th>
                <th className="px-3 py-3 text-center text-[10px] font-normal text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-center text-[10px] font-normal text-gray-500 uppercase tracking-wider">Protesto</th>
                <th className="px-3 py-3 text-center text-[10px] font-normal text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-3 py-3 text-center text-[10px] font-normal text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDividas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-[11px] text-gray-400">
                    Nenhuma divida encontrada
                  </td>
                </tr>
              ) : groupedDividas ? (
                <>
                  {groupedDividas.map((grupo, gi) => (
                    <React.Fragment key={`group-${gi}`}>
                      {/* Group header row */}
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="px-3 py-2.5 text-[12px] font-medium text-gray-800">
                          {grupo.label}
                          {grupo.sublabel && (
                            <span className="ml-2 text-[11px] font-normal text-gray-500">({grupo.sublabel})</span>
                          )}
                          <span className="ml-2 text-[10px] font-normal text-gray-400">
                            {grupo.dividas.length} divida{grupo.dividas.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-medium text-gray-700 text-right whitespace-nowrap">
                          {formatarMoeda(grupo.subtotalOriginal)}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-medium text-gray-700 text-right whitespace-nowrap">
                          {formatarMoeda(grupo.subtotalNegociado)}
                        </td>
                        <td colSpan={5} />
                      </tr>
                      {/* Group data rows */}
                      {grupo.dividas.map((d) => {
                        const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pendente;
                        const valOriginal = Number(d.valor_original || 0);
                        const valNegociado = Number(d.valor_divida || 0);
                        const desconto = valOriginal > 0 && valNegociado < valOriginal
                          ? ((valOriginal - valNegociado) / valOriginal) * 100
                          : 0;
                        return (
                          <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-3.5 text-[11px] text-gray-500 font-mono whitespace-nowrap">{d.numero}</td>
                            <td className="px-3 py-3.5 text-[11px] text-gray-900 max-w-[180px] truncate">{d.descricao}</td>
                            <td className="px-3 py-3.5 text-[11px] text-gray-700 max-w-[180px] truncate">{nomeCredor(d)}</td>
                            <td className="px-3 py-3.5 text-[11px] text-gray-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${d.devedor_tipo === "empresa" ? "bg-blue-400" : "bg-purple-400"}`} />
                                {nomeDevedor(d)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-[11px] text-gray-900 text-right whitespace-nowrap">
                              {valOriginal > 0 ? formatarMoeda(valOriginal) : "\u2014"}
                            </td>
                            <td className="px-3 py-3.5 text-[11px] text-gray-900 text-right whitespace-nowrap font-normal">
                              {valNegociado > 0 ? formatarMoeda(valNegociado) : "\u2014"}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {desconto > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-normal bg-green-100 text-green-700">
                                  {desconto.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">{"\u2014"}</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {d.protestada ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-normal bg-red-100 text-red-700">
                                  Sim
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Nao</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center text-[11px] text-gray-600 whitespace-nowrap">
                              {d.data_vencimento_original ? formatarData(d.data_vencimento_original) : "\u2014"}
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <button type="button" onClick={() => abrirForm(d)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Editar">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => handleDuplicar(d)} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all" title="Duplicar">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {d.status !== "paga" && (
                                  <button type="button" onClick={() => handleMarcarPaga(d.id)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all" title="Marcar como paga">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button type="button" onClick={() => handleDelete(d.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Excluir">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  {/* Total geral row */}
                  {totalGeralGrouped && (
                    <tr className="bg-gray-200 font-medium">
                      <td colSpan={4} className="px-3 py-2.5 text-[12px] text-gray-900">
                        Total Geral
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-gray-900 text-right whitespace-nowrap">
                        {formatarMoeda(totalGeralGrouped.original)}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-gray-900 text-right whitespace-nowrap">
                        {formatarMoeda(totalGeralGrouped.negociado)}
                      </td>
                      <td colSpan={5} />
                    </tr>
                  )}
                </>
              ) : (
                filteredDividas.map((d) => {
                  const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pendente;
                  const valOriginal = Number(d.valor_original || 0);
                  const valNegociado = Number(d.valor_divida || 0);
                  const desconto = valOriginal > 0 && valNegociado < valOriginal
                    ? ((valOriginal - valNegociado) / valOriginal) * 100
                    : 0;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3.5 text-[11px] text-gray-500 font-mono whitespace-nowrap">{d.numero}</td>
                      <td className="px-3 py-3.5 text-[11px] text-gray-900 max-w-[180px] truncate">{d.descricao}</td>
                      <td className="px-3 py-3.5 text-[11px] text-gray-700 max-w-[180px] truncate">{nomeCredor(d)}</td>
                      <td className="px-3 py-3.5 text-[11px] text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${d.devedor_tipo === "empresa" ? "bg-blue-400" : "bg-purple-400"}`} />
                          {nomeDevedor(d)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[11px] text-gray-900 text-right whitespace-nowrap">
                        {valOriginal > 0 ? formatarMoeda(valOriginal) : "\u2014"}
                      </td>
                      <td className="px-3 py-3.5 text-[11px] text-gray-900 text-right whitespace-nowrap font-normal">
                        {valNegociado > 0 ? formatarMoeda(valNegociado) : "\u2014"}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {desconto > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-normal bg-green-100 text-green-700">
                            {desconto.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {d.protestada ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-normal bg-red-100 text-red-700">
                            Sim
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Nao</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center text-[11px] text-gray-600 whitespace-nowrap">
                        {d.data_vencimento_original ? formatarData(d.data_vencimento_original) : "\u2014"}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => abrirForm(d)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicar(d)}
                            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {d.status !== "paga" && (
                            <button
                              type="button"
                              onClick={() => handleMarcarPaga(d.id)}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                              title="Marcar como paga"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL FORM */}
      {/* ============================================================ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/30" onMouseDown={(e) => { if (e.target === e.currentTarget) fecharForm(); }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
          >
            {/* Header modal */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[18px] font-light text-gray-900">
                {editingId ? "Editar Dívida" : "Nova Dívida"}
              </h2>
              <button type="button" onClick={fecharForm} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">

              {/* GRUPO 1: DescriçÍo */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">DescriçÍo *</label>
                <input
                  value={formData.descricao}
                  onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="DescriçÍo da dívida"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                />
              </div>

              {/* GRUPO 2: Credor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[13px] font-medium text-gray-800 mb-3">Credor</h3>
                <div className="relative" ref={credorDropdownRef}>
                  <label className="block text-[12px] text-gray-600 mb-1">Buscar pessoa cadastrada</label>
                  <input
                    value={buscaCredor}
                    onChange={(e) => { setBuscaCredor(e.target.value); setIsCredorOpen(true); }}
                    onFocus={() => setIsCredorOpen(true)}
                    placeholder="Digite o nome..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                  />
                  {isCredorOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {credoresFiltrados.length > 0 ? (
                        credoresFiltrados.slice(0, 50).map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selecionarCredor(c)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[12px] border-b border-gray-50 last:border-0"
                          >
                            <span className="font-normal text-gray-900">{c.nome}</span>
                            <span className="text-gray-400 ml-2">{c.tipo}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-[12px] text-gray-400 text-center">
                          Nenhuma pessoa encontrada para "{buscaCredor}"
                        </div>
                      )}
                      {credoresFiltrados.length > 50 && (
                        <div className="px-3 py-2 text-[11px] text-gray-400 text-center border-t border-gray-100">
                          +{credoresFiltrados.length - 50} resultados — refine a busca
                        </div>
                      )}
                    </div>
                  )}
                  {formData.credor_id && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-green-600">
                        Selecionado: {credores.find((c: any) => c.id === formData.credor_id)?.nome || formData.credor_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setFormData((p) => ({ ...p, credor_id: "", credor_tipo: "" })); setBuscaCredor(""); }}
                        className="text-[11px] text-red-400 hover:text-red-600"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setShowNovoFornecedor(!showNovoFornecedor); setNovoFornecedorCnpj(""); setNovoFornecedorNome(""); setCnpjDados(null); }}
                  className="mt-2 text-[12px] text-blue-600 hover:text-blue-800"
                >
                  + Cadastrar novo fornecedor
                </button>
                {showNovoFornecedor && (
                  <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                    {/* CNPJ com busca automática */}
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">CNPJ (opcional - busca automática)</label>
                      <div className="flex gap-2">
                        <input
                          value={novoFornecedorCnpj}
                          onChange={(e) => setNovoFornecedorCnpj(e.target.value)}
                          placeholder="00.000.000/0000-00"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={handleBuscarCnpj}
                          disabled={cnpjLoading}
                          className="px-3 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-[12px] hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {cnpjLoading ? "Buscando..." : "Buscar"}
                        </button>
                      </div>
                      {cnpjDados && (
                        <div className="mt-1.5 text-[11px] text-green-600 bg-green-50 px-2 py-1 rounded">
                          {cnpjDados.razao_social}
                          {cnpjDados.nome_fantasia && cnpjDados.nome_fantasia !== cnpjDados.razao_social && (
                            <span className="text-green-500 ml-1">({cnpjDados.nome_fantasia})</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Nome */}
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Nome do fornecedor *</label>
                      <div className="flex gap-2">
                        <input
                          value={novoFornecedorNome}
                          onChange={(e) => setNovoFornecedorNome(e.target.value)}
                          placeholder="RazÍo social ou nome fantasia"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={handleCriarFornecedor}
                          disabled={!novoFornecedorNome.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-[12px] hover:bg-primary-dark disabled:opacity-50 transition-all"
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 3: Devedor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[13px] font-medium text-gray-800 mb-3">Devedor</h3>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="devedor_tipo"
                      value="empresa"
                      checked={formData.devedor_tipo === "empresa"}
                      onChange={() => setFormData((p) => ({ ...p, devedor_tipo: "empresa", socio_id: "" }))}
                      className="text-[#16a34a]"
                    />
                    <span className="text-[12px] text-gray-700">Empresa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="devedor_tipo"
                      value="socio"
                      checked={formData.devedor_tipo === "socio"}
                      onChange={() => setFormData((p) => ({ ...p, devedor_tipo: "socio", empresa_id: "" }))}
                      className="text-[#16a34a]"
                    />
                    <span className="text-[12px] text-gray-700">Sócio PF</span>
                  </label>
                </div>

                {formData.devedor_tipo === "empresa" ? (
                  <select
                    value={formData.empresa_id}
                    onChange={(e) => setFormData((p) => ({ ...p, empresa_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                  >
                    <option value="">Selecione a empresa...</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome_fantasia || emp.razao_social}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.socio_id}
                    onChange={(e) => setFormData((p) => ({ ...p, socio_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                  >
                    <option value="">Selecione o sócio...</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} {s.cpf ? `(${s.cpf})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* GRUPO 4: Valores */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[13px] font-medium text-gray-800 mb-3">Valores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Valor Original</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.valor_original}
                      onChange={(e) => setFormData((p) => ({ ...p, valor_original: formatarMoedaInput(e.target.value) }))}
                      placeholder="R$ 0,00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Valor Negociado</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.valor_negociado}
                      onChange={(e) => setFormData((p) => ({ ...p, valor_negociado: formatarMoedaInput(e.target.value) }))}
                      placeholder="R$ 0,00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Valor Dívida</label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-gray-700 font-medium">
                      {formatarMoeda(valorDividaComputed)}
                    </div>
                    <span className="text-[10px] text-gray-400">Negociado + Custas cartório</span>
                  </div>
                </div>
              </div>

              {/* GRUPO 5: Protesto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[13px] font-medium text-gray-800 mb-3">Protesto</h3>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.protestada}
                    onChange={(e) => setFormData((p) => ({
                      ...p,
                      protestada: e.target.checked,
                      cartorio_id: e.target.checked ? p.cartorio_id : "",
                      custas_cartorio: e.target.checked ? p.custas_cartorio : "",
                    }))}
                    className="rounded text-[#16a34a]"
                  />
                  <span className="text-[12px] text-gray-700">Dívida protestada em cartório</span>
                </label>

                {formData.protestada && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-gray-600 mb-1">Cartório</label>
                      <select
                        value={formData.cartorio_id}
                        onChange={(e) => setFormData((p) => ({ ...p, cartorio_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                      >
                        <option value="">Selecione o cartório...</option>
                        {cartorios.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.numero}º Tabelionato - {c.nome.split(" de SÍo Paulo")[0].split("Títulos de ").pop() || c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-600 mb-1">Custas do Cartório</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.custas_cartorio}
                        onChange={(e) => setFormData((p) => ({ ...p, custas_cartorio: formatarMoedaInput(e.target.value) }))}
                        placeholder="R$ 0,00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GRUPO 6: Status + Datas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[13px] font-medium text-gray-800 mb-3">Status e Datas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as StatusDivida }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Vencimento Original</label>
                    <DateInputBR
                      value={formData.data_vencimento_original}
                      onChange={(v) => setFormData((p) => ({ ...p, data_vencimento_original: v }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Data Acordo</label>
                    <DateInputBR
                      value={formData.data_acordo}
                      onChange={(v) => setFormData((p) => ({ ...p, data_acordo: v }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-600 mb-1">Data QuitaçÍo</label>
                    <DateInputBR
                      value={formData.data_quitacao}
                      onChange={(v) => setFormData((p) => ({ ...p, data_quitacao: v }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GRUPO 7: Contexto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Núcleo</label>
                  <select
                    value={formData.nucleo}
                    onChange={(e) => setFormData((p) => ({ ...p, nucleo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none"
                  >
                    <option value="">Sem núcleo</option>
                    {NUCLEOS.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
                    placeholder="Observações..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#16a34a]/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* GRUPO 8: Anexos (apenas no modo ediçÍo) */}
              {editingId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-[13px] font-medium text-gray-800 mb-3">Anexos</h3>

                  {/* Upload */}
                  <div className="flex items-center gap-3 mb-4">
                    <select
                      value={tipoAnexo}
                      onChange={(e) => setTipoAnexo(e.target.value as TipoAnexoDivida)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-[12px] outline-none"
                    >
                      {TIPO_ANEXO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer transition-all">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Enviando..." : "Anexar Arquivo"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleUploadAnexo}
                        disabled={uploading}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                    </label>
                  </div>

                  {/* Lista de anexos */}
                  {anexos.length > 0 ? (
                    <div className="space-y-2">
                      {anexos.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-100">
                          <div className="p-1.5 bg-gray-50 rounded-md">
                            {a.mime_type?.startsWith("image/") ? (
                              <Image className="w-4 h-4 text-blue-500" />
                            ) : (
                              <File className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-gray-700 truncate">{a.nome_arquivo}</p>
                            <p className="text-[10px] text-gray-400">
                              {TIPO_ANEXO_OPTIONS.find((o) => o.value === a.tipo)?.label || a.tipo}
                            </p>
                          </div>
                          {a.drive_url && (
                            <a
                              href={a.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md"
                              title="Abrir no Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAnexo(a.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-400">Nenhum anexo adicionado.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="sticky bottom-0 bg-white z-10 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={fecharForm}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-[13px] hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] hover:opacity-90 transition-all shadow-lg"
              >
                {editingId ? "Salvar Alterações" : "Criar Dívida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

