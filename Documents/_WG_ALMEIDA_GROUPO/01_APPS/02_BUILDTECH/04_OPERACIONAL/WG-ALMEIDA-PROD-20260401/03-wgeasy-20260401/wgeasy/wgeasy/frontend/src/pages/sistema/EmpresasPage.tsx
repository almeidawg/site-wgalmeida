/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// EMPRESAS DO GRUPO WG
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { buscarEmpresaPorCNPJ, formatarCNPJ, validarCNPJ, type DadosEmpresaCNPJ } from "@/lib/cnpjApi";
import { buscarEnderecoPorCep } from "@/lib/viaCepApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import {
  Edit2,
  Plus,
  DollarSign,
  Trash2,
  FileText,
  Building2,
  Users,
  FolderOpen,
  ExternalLink,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import EmpresaEditModal from "@/components/empresas/EmpresaEditModal";
import ContaBancariaForm from "@/components/ContaBancariaForm";
import DocumentosDriveModal from "@/components/empresas/DocumentosDriveModal";
import {
  buscarEmpresaCompleta,
  atualizarEmpresa,
  listarContasPorEmpresa,
  criarConta,
  atualizarConta,
  excluirConta,
  definirContaPadrao,
  excluirEmpresa,
  listarSocios,
  criarSocio,
  atualizarSocio,
  excluirSocioPermanente,
} from "@/lib/empresasApi";
import { gerarEmpresaPDFCompleto } from "@/lib/empresaPdfUtils";
import type {
  EmpresaGrupo,
  ContaBancaria,
  EmpresaFormData,
  ContaBancariaFormData,
  SocioEmpresa,
  SocioFormData,
} from "@/types/empresas";
import {
  formatarAgencia,
  formatarConta,
  formatarBanco,
  formatarCPF,
  formatarTelefone,
  getEstadoCivilLabel,
} from "@/types/empresas";
import { useToast } from "@/components/ui/use-toast";

interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  criado_em: string;
  google_drive_folder_id?: string;
  google_drive_folder_url?: string;
}

type TabAtiva = 'empresas' | 'socios';

const obterMensagemErro = (error: unknown, fallback = "Erro inesperado") => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

export default function EmpresasPage() {
  // Estados gerais
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('empresas');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // ========================================
  // ESTADOS - EMPRESAS
  // ========================================
  const [cnpj, setCnpj] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [dadosEncontrados, setDadosEncontrados] = useState<DadosEmpresaCNPJ | null>(null);
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaGrupo | undefined>(undefined);
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);
  const [empresaExpandida, setEmpresaExpandida] = useState<string | null>(null);
  const [contasPorEmpresa, setContasPorEmpresa] = useState<{ [key: string]: ContaBancaria[] }>({});
  const [mostrarFormConta, setMostrarFormConta] = useState<string | null>(null);
  const [contaEditando, setContaEditando] = useState<ContaBancaria | undefined>(undefined);

  // Modal de Documentos
  const [mostrarModalDocumentos, setMostrarModalDocumentos] = useState(false);
  const [entidadeDocumentos, setEntidadeDocumentos] = useState<{
    tipo: 'empresa' | 'socio';
    id: string;
    nome: string;
    folderId?: string | null;
    folderUrl?: string | null;
  } | null>(null);

  // ========================================
  // ESTADOS - SÓCIOS
  // ========================================
  const [socios, setSocios] = useState<SocioEmpresa[]>([]);
  const [mostrarFormSocio, setMostrarFormSocio] = useState(false);
  const [socioEditando, setSocioEditando] = useState<SocioEmpresa | null>(null);
  const [socioForm, setSocioForm] = useState<SocioFormData>({
    nome: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    nacionalidade: 'Brasileiro(a)',
    estado_civil: undefined,
    profissao: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: '',
    ativo: true,
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      if (tabAtiva === 'empresas') {
        const { data, error } = await supabase
          .from("empresas_grupo")
          .select("*")
          .order("criado_em", { ascending: false });

        if (error) throw error;
        setEmpresas((data || []) as Empresa[]);
      } else {
        const lista = await listarSocios();
        setSocios(lista);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErro(obterMensagemErro(error, "Erro ao carregar dados"));
    } finally {
      setLoading(false);
    }
  }, [tabAtiva]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-expandir empresa via query param ?id=
  useEffect(() => {
    const empresaId = searchParams.get("id");
    if (empresaId && empresas.length > 0) {
      setEmpresaExpandida(empresaId);
    }
  }, [searchParams, empresas]);

  // ========================================
  // FUNÇÕES - EMPRESAS
  // ========================================

  async function handleBuscarCNPJ() {
    setErro("");
    setSucesso("");
    setDadosEncontrados(null);

    if (!cnpj.trim()) {
      setErro("Digite um CNPJ");
      return;
    }

    if (!validarCNPJ(cnpj)) {
      setErro("CNPJ inválido");
      return;
    }

    try {
      setBuscando(true);
      const dados = await buscarEmpresaPorCNPJ(cnpj);
      setDadosEncontrados(dados);
      setErro("");
    } catch (error: unknown) {
      console.error("Erro ao buscar CNPJ:", error);
      setErro(obterMensagemErro(error, "Erro ao buscar CNPJ"));
      setDadosEncontrados(null);
    } finally {
      setBuscando(false);
    }
  }

  async function handleSalvarEmpresa() {
    if (!dadosEncontrados) return;

    try {
      setSalvando(true);

      const { data: empresaExistente } = await supabase
        .from("empresas_grupo")
        .select("*")
        .eq("cnpj", dadosEncontrados.cnpj)
        .single();

      if (empresaExistente) {
        setErro("Esta empresa já está cadastrada");
        return;
      }

      const { data, error } = await supabase
        .from("empresas_grupo")
        .insert({
          cnpj: dadosEncontrados.cnpj,
          razao_social: dadosEncontrados.razao_social,
          nome_fantasia: dadosEncontrados.nome_fantasia,
          email: dadosEncontrados.email,
          telefone: dadosEncontrados.telefone,
          logradouro: dadosEncontrados.logradouro,
          numero: dadosEncontrados.numero,
          bairro: dadosEncontrados.bairro,
          cidade: dadosEncontrados.municipio,
          estado: dadosEncontrados.uf,
          cep: dadosEncontrados.cep,
          tipo: 'matriz',
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSucesso("Empresa cadastrada com sucesso!");
      setCnpj("");
      setDadosEncontrados(null);
      await carregarDados();

      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao salvar empresa:", error);
      setErro(obterMensagemErro(error, "Erro ao salvar empresa"));
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    try {
      const { error } = await supabase
        .from("empresas_grupo")
        .update({ ativo: !ativo })
        .eq("id", id);

      if (error) throw error;
      await carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar empresa" });
    }
  }

  async function handleEditarEmpresa(empresa: Empresa) {
    try {
      const empresaCompleta = await buscarEmpresaCompleta(empresa.id);
      setEmpresaEditando(empresaCompleta as EmpresaGrupo);
      setMostrarModalEmpresa(true);
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar dados da empresa" });
    }
  }

  async function handleSalvarEmpresaModal(dados: EmpresaFormData) {
    try {
      if (empresaEditando) {
        await atualizarEmpresa(empresaEditando.id, dados);
        setSucesso("Empresa atualizada com sucesso!");
      }
      setMostrarModalEmpresa(false);
      setEmpresaEditando(undefined);
      await carregarDados();
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao salvar empresa:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao salvar empresa") });
      throw error;
    }
  }

  async function handleExpandirEmpresa(empresaId: string) {
    if (empresaExpandida === empresaId) {
      setEmpresaExpandida(null);
      return;
    }

    setEmpresaExpandida(empresaId);

    if (!contasPorEmpresa[empresaId]) {
      try {
        const contas = await listarContasPorEmpresa(empresaId);
        setContasPorEmpresa({
          ...contasPorEmpresa,
          [empresaId]: contas,
        });
      } catch (error) {
        console.error("Erro ao carregar contas:", error);
      }
    }
  }

  async function handleAdicionarConta(empresaId: string) {
    setContaEditando(undefined);
    setMostrarFormConta(empresaId);
  }

  async function handleEditarConta(conta: ContaBancaria) {
    setContaEditando(conta);
    setMostrarFormConta(conta.empresa_id);
  }

  async function handleSalvarConta(empresaId: string, dados: ContaBancariaFormData) {
    try {
      if (contaEditando) {
        await atualizarConta(contaEditando.id, dados);
        setSucesso("Conta atualizada com sucesso!");
      } else {
        await criarConta(empresaId, dados);
        setSucesso("Conta adicionada com sucesso!");
      }

      const contas = await listarContasPorEmpresa(empresaId);
      setContasPorEmpresa({
        ...contasPorEmpresa,
        [empresaId]: contas,
      });

      setMostrarFormConta(null);
      setContaEditando(undefined);
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao salvar conta:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao salvar conta") });
    }
  }

  async function handleExcluirConta(empresaId: string, contaId: string) {
    if (!confirm("Deseja realmente excluir esta conta bancária?")) return;

    try {
      await excluirConta(contaId);

      const contas = await listarContasPorEmpresa(empresaId);
      setContasPorEmpresa({
        ...contasPorEmpresa,
        [empresaId]: contas,
      });

      setSucesso("Conta excluída com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao excluir conta:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao excluir conta") });
    }
  }

  async function handleDefinirPadrao(empresaId: string, contaId: string) {
    try {
      await definirContaPadrao(contaId);

      const contas = await listarContasPorEmpresa(empresaId);
      setContasPorEmpresa({
        ...contasPorEmpresa,
        [empresaId]: contas,
      });

      setSucesso("Conta definida como padrÍo!");
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao definir conta padrÍo:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao definir conta padrÍo") });
    }
  }

  async function handleGerarPDF(empresaId: string) {
    try {
      const empresaCompleta = await buscarEmpresaCompleta(empresaId);
      if (!empresaCompleta || !empresaCompleta.conta_padrao) {
        toast({ variant: "destructive", title: "Erro", description: "Empresa nÍo possui conta bancária padrÍo" });
        return;
      }

      await gerarEmpresaPDFCompleto(empresaCompleta as EmpresaGrupo, empresaCompleta.conta_padrao);
      setSucesso("PDF gerado com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao gerar PDF" });
    }
  }

  async function handleExcluirEmpresa(empresaId: string, razaoSocial: string) {
    if (!confirm(`Deseja realmente EXCLUIR PERMANENTEMENTE a empresa "${razaoSocial}"?\n\nEsta açÍo NÍO pode ser desfeita e irá remover todos os dados associados.`)) {
      return;
    }

    if (!confirm("Tem CERTEZA ABSOLUTA? Esta açÍo é IRREVERSÍVEL!")) {
      return;
    }

    try {
      await excluirEmpresa(empresaId);
      setSucesso("Empresa excluída permanentemente!");
      await carregarDados();
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao excluir empresa:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao excluir empresa") });
    }
  }

  function handleAbrirDocumentos(empresa: Empresa) {
    setEntidadeDocumentos({
      tipo: 'empresa',
      id: empresa.id,
      nome: empresa.razao_social,
      folderId: empresa.google_drive_folder_id,
      folderUrl: empresa.google_drive_folder_url,
    });
    setMostrarModalDocumentos(true);
  }

  function handleAbrirDocumentosSocio(socio: SocioEmpresa) {
    setEntidadeDocumentos({
      tipo: 'socio',
      id: socio.id,
      nome: socio.nome,
      folderId: socio.google_drive_folder_id,
      folderUrl: socio.google_drive_folder_url,
    });
    setMostrarModalDocumentos(true);
  }

  // ========================================
  // FUNÇÕES - SÓCIOS
  // ========================================

  function handleNovoSocio() {
    setSocioEditando(null);
    setSocioForm({
      nome: '',
      cpf: '',
      rg: '',
      email: '',
      telefone: '',
      nacionalidade: 'Brasileiro(a)',
      estado_civil: undefined,
      profissao: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
      ativo: true,
    });
    setMostrarFormSocio(true);
  }

  function handleEditarSocio(socio: SocioEmpresa) {
    setSocioEditando(socio);
    setSocioForm({
      nome: socio.nome,
      cpf: socio.cpf || '',
      rg: socio.rg || '',
      email: socio.email || '',
      telefone: socio.telefone || '',
      nacionalidade: socio.nacionalidade || 'Brasileiro(a)',
      estado_civil: socio.estado_civil,
      profissao: socio.profissao || '',
      cep: socio.cep || '',
      logradouro: socio.logradouro || '',
      numero: socio.numero || '',
      complemento: socio.complemento || '',
      bairro: socio.bairro || '',
      cidade: socio.cidade || '',
      estado: socio.estado || '',
      observacoes: socio.observacoes || '',
      ativo: socio.ativo,
    });
    setMostrarFormSocio(true);
  }

  async function handleBuscarCepSocio() {
    const cepLimpo = (socioForm.cep || "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    const endereco = await buscarEnderecoPorCep(cepLimpo);
    if (endereco) {
      setSocioForm((prev) => ({
        ...prev,
        logradouro: endereco.logradouro || prev.logradouro,
        bairro: endereco.bairro || prev.bairro,
        cidade: endereco.localidade || prev.cidade,
        estado: endereco.uf || prev.estado,
      }));
    }
  }

  async function handleSalvarSocio() {
    if (!socioForm.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      if (socioEditando) {
        await atualizarSocio(socioEditando.id, socioForm);
        setSucesso("Sócio atualizado com sucesso!");
      } else {
        await criarSocio(socioForm);
        setSucesso("Sócio cadastrado com sucesso!");
      }

      setMostrarFormSocio(false);
      setSocioEditando(null);
      await carregarDados();
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao salvar sócio:", error);
      setErro(obterMensagemErro(error, "Erro ao salvar sócio"));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirSocio(socio: SocioEmpresa) {
    if (!confirm(`Deseja realmente EXCLUIR PERMANENTEMENTE "${socio.nome}"?\n\nEsta açÍo NÍO pode ser desfeita.`)) {
      return;
    }

    try {
      await excluirSocioPermanente(socio.id);
      setSucesso("Sócio excluído com sucesso!");
      await carregarDados();
      setTimeout(() => setSucesso(""), 3000);
    } catch (error: unknown) {
      console.error("Erro ao excluir sócio:", error);
      toast({ variant: "destructive", title: "Erro", description: obterMensagemErro(error, "Erro ao excluir sócio") });
    }
  }

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F25C26] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            Empresas do Grupo WG
          </h1>
          <p className="text-[12px] text-gray-600 mt-1">
            Cadastro de empresas do grupo e sócios - coloque o CNPJ e busca automaticamente. Serve para emissÍo de contratos.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              <button
                type="button"
                onClick={() => setTabAtiva('empresas')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-[12px] transition-colors ${
                  tabAtiva === 'empresas'
                    ? 'border-[#F25C26] text-[#F25C26]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 size={20} />
                Empresas Cadastradas ({empresas.length})
              </button>
              <button
                type="button"
                onClick={() => setTabAtiva('socios')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-[12px] transition-colors ${
                  tabAtiva === 'socios'
                    ? 'border-[#F25C26] text-[#F25C26]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={20} />
                Pessoas Físicas / Sócios ({socios.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12px] text-red-800">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12px] text-green-800">{sucesso}</p>
          </div>
        )}

        {/* TAB: EMPRESAS */}
        {tabAtiva === 'empresas' && (
          <>
            {/* Busca por CNPJ */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-[20px] font-light text-gray-900 mb-4">
                Adicionar Nova Empresa
              </h2>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d]/g, '');
                    setCnpj(formatarCNPJ(valor));
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarCNPJ()}
                  placeholder="Digite o CNPJ (ex: 00.000.000/0000-00)"
                  maxLength={18}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleBuscarCNPJ}
                  disabled={buscando}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-normal flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                >
                  {buscando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Buscar CNPJ
                    </>
                  )}
                </button>
              </div>

              {/* Dados da Empresa Encontrada */}
              {dadosEncontrados && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[20px] font-light text-gray-900">
                      Dados da Empresa
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-[12px] ${
                      dadosEncontrados.situacao === 'ATIVA' || dadosEncontrados.situacao === 'Ativa'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dadosEncontrados.situacao}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[12px] text-gray-600">CNPJ</p>
                      <p className="text-[12px] font-normal text-gray-900">{dadosEncontrados.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-600">RazÍo Social</p>
                      <p className="text-[12px] font-normal text-gray-900">{dadosEncontrados.razao_social}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-600">Nome Fantasia</p>
                      <p className="text-[12px] font-normal text-gray-900">{dadosEncontrados.nome_fantasia || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-600">Porte</p>
                      <p className="text-[12px] font-normal text-gray-900">{dadosEncontrados.porte}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[12px] text-gray-600">Endereço</p>
                      <p className="text-[12px] font-normal text-gray-900">
                        {dadosEncontrados.logradouro}, {dadosEncontrados.numero}
                        {dadosEncontrados.complemento && ` - ${dadosEncontrados.complemento}`}
                        {` - ${dadosEncontrados.bairro}, ${dadosEncontrados.municipio}/${dadosEncontrados.uf}`}
                        {` - CEP: ${dadosEncontrados.cep}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSalvarEmpresa}
                    disabled={salvando}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {salvando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Cadastrar Empresa
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Empresas */}
            <div className="bg-white rounded-lg shadow">
              {empresas.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
                  </div>
                  <h3 className="text-[20px] font-light text-gray-700 mb-2">
                    Nenhuma empresa cadastrada
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    Use o formulário acima para adicionar empresas do grupo
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <div key={empresa.id} className="hover:bg-gray-50 transition-colors">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-[13px] font-light text-gray-900">
                                {empresa.razao_social}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-[12px] ${
                                empresa.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {empresa.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>

                            {empresa.nome_fantasia && (
                              <p className="text-[12px] text-gray-600 mb-1">
                                Nome Fantasia: {empresa.nome_fantasia}
                              </p>
                            )}

                            <p className="text-[12px] text-gray-600 mb-1">
                              CNPJ: {empresa.cnpj}
                            </p>

                            {(empresa.logradouro || empresa.cidade) && (
                              <p className="text-[12px] text-gray-600 flex items-center gap-1">
                                <MapPin size={14} />
                                {empresa.logradouro && `${empresa.logradouro}, ${empresa.numero || 'S/N'}`}
                                {empresa.cidade && ` - ${empresa.cidade}/${empresa.estado}`}
                              </p>
                            )}

                            {(empresa.email || empresa.telefone) && (
                              <div className="flex items-center gap-4 mt-2">
                                {empresa.email && (
                                  <p className="text-[12px] text-gray-600 flex items-center gap-1">
                                    <Mail size={14} />
                                    {empresa.email}
                                  </p>
                                )}
                                {empresa.telefone && (
                                  <p className="text-[12px] text-gray-600 flex items-center gap-1">
                                    <Phone size={14} />
                                    {empresa.telefone}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Botões de AçÍo */}
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditarEmpresa(empresa)}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Editar empresa"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExpandirEmpresa(empresa.id)}
                              className="p-2 text-[#F25C26] hover:bg-orange-50 rounded-lg transition-colors"
                              title="Contas bancárias"
                            >
                              <DollarSign size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirDocumentos(empresa)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Documentos (Drive)"
                            >
                              <FolderOpen size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGerarPDF(empresa.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Gerar PDF"
                            >
                              <FileText size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleAtivo(empresa.id, empresa.ativo)}
                              className={`px-4 py-2 rounded-lg text-[12px] transition-colors ${
                                empresa.ativo
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {empresa.ativo ? 'Desativar' : 'Ativar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExcluirEmpresa(empresa.id, empresa.razao_social)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                              title="Excluir empresa permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* SeçÍo Expansível de Contas Bancárias */}
                        {empresaExpandida === empresa.id && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[13px] font-light text-gray-900">
                                Contas Bancárias
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleAdicionarConta(empresa.id)}
                                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-[12px] flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Adicionar Conta
                              </button>
                            </div>

                            {/* Formulário de Conta */}
                            {mostrarFormConta === empresa.id && (
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h5 className="text-[12px] font-normal text-gray-900 mb-3">
                                  {contaEditando ? 'Editar Conta' : 'Nova Conta Bancária'}
                                </h5>
                                <ContaBancariaForm
                                  conta={contaEditando}
                                  onSave={(dados) => handleSalvarConta(empresa.id, dados)}
                                  onCancel={() => {
                                    setMostrarFormConta(null);
                                    setContaEditando(undefined);
                                  }}
                                />
                              </div>
                            )}

                            {/* Lista de Contas */}
                            <div className="space-y-3">
                              {contasPorEmpresa[empresa.id]?.length === 0 && (
                                <p className="text-[12px] text-gray-500 text-center py-4">
                                  Nenhuma conta bancária cadastrada
                                </p>
                              )}

                              {contasPorEmpresa[empresa.id]?.map((conta) => (
                                <div
                                  key={conta.id}
                                  className="p-4 bg-white border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="font-normal text-gray-900">
                                          {formatarBanco(conta.banco_codigo, conta.banco_nome)}
                                        </p>
                                        {conta.padrao && (
                                          <span className="px-2 py-1 bg-primary text-white text-[12px] rounded">
                                            PADRÍO
                                          </span>
                                        )}
                                        {conta.apelido && (
                                          <span className="text-[12px] text-gray-500">
                                            ({conta.apelido})
                                          </span>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-3 gap-4 text-[12px]">
                                        <div>
                                          <p className="text-gray-600">Agência</p>
                                          <p className="text-[12px] font-normal text-gray-900">
                                            {formatarAgencia(conta.agencia, conta.agencia_digito)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Conta</p>
                                          <p className="text-[12px] font-normal text-gray-900">
                                            {formatarConta(conta.conta, conta.conta_digito)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Tipo</p>
                                          <p className="text-[12px] font-normal text-gray-900">
                                            {conta.tipo_conta === 'corrente' ? 'Corrente' : conta.tipo_conta === 'poupanca' ? 'Poupança' : 'Pagamento'}
                                          </p>
                                        </div>
                                      </div>

                                      {conta.pix_chave && (
                                        <div className="mt-2 text-[12px]">
                                          <p className="text-gray-600">
                                            PIX ({conta.pix_tipo}): <span className="text-[12px] font-normal text-gray-900">{conta.pix_chave}</span>
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                      {!conta.padrao && (
                                        <button
                                          type="button"
                                          onClick={() => handleDefinirPadrao(empresa.id, conta.id)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-[12px]"
                                          title="Definir como padrÍo"
                                        >
                                          <span className="text-[12px]">*</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleEditarConta(conta)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Editar"
                                      >
                                        <Edit2 size={16} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleExcluirConta(empresa.id, conta.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB: SÓCIOS */}
        {tabAtiva === 'socios' && (
          <>
            {/* BotÍo Adicionar Sócio */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-light text-gray-900">
                    Pessoas Físicas / Sócios
                  </h2>
                  <p className="text-[12px] text-gray-600 mt-1">
                    Cadastro de sócios, administradores e representantes das empresas do grupo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNovoSocio}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-normal text-[12px] sm:text-[13px] flex items-center gap-2"
                >
                  <Plus size={18} />
                  Adicionar Pessoa Física
                </button>
              </div>
            </div>

            {/* Formulário de Sócio */}
            {mostrarFormSocio && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-[18px] font-light text-gray-900 mb-4">
                  {socioEditando ? 'Editar Pessoa Física' : 'Nova Pessoa Física'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {/* Dados Pessoais */}
                  <div className="lg:col-span-2">
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={socioForm.nome}
                      onChange={(e) => setSocioForm({ ...socioForm, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={socioForm.cpf}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '');
                        setSocioForm({ ...socioForm, cpf: formatarCPF(valor) });
                      }}
                      maxLength={14}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      RG
                    </label>
                    <input
                      type="text"
                      value={socioForm.rg}
                      onChange={(e) => setSocioForm({ ...socioForm, rg: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="RG"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={socioForm.email}
                      onChange={(e) => setSocioForm({ ...socioForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={socioForm.telefone}
                      onChange={(e) => setSocioForm({ ...socioForm, telefone: formatarTelefone(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Nacionalidade
                    </label>
                    <input
                      type="text"
                      value={socioForm.nacionalidade}
                      onChange={(e) => setSocioForm({ ...socioForm, nacionalidade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Brasileiro(a)"
                    />
                  </div>

                  <div>
                    <label htmlFor="estado_civil" className="block text-[12px] font-normal text-gray-700 mb-1">
                      Estado Civil
                    </label>
                    <select
                      id="estado_civil"
                      title="Estado Civil"
                      value={socioForm.estado_civil || ''}
                      onChange={(e) => setSocioForm({ ...socioForm, estado_civil: (e.target.value || undefined) as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    >
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">UniÍo Estável</option>
                      <option value="separado">Separado(a)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      ProfissÍo
                    </label>
                    <input
                      type="text"
                      value={socioForm.profissao}
                      onChange={(e) => setSocioForm({ ...socioForm, profissao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Empresário"
                    />
                  </div>

                  {/* Endereço */}
                  <div className="lg:col-span-3 border-t pt-4 mt-2">
                    <h4 className="text-[12px] font-normal text-gray-700 mb-3">Endereço</h4>
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={socioForm.cep}
                      onChange={(e) => setSocioForm({ ...socioForm, cep: e.target.value })}
                      onBlur={handleBuscarCepSocio}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={socioForm.logradouro}
                      onChange={(e) => setSocioForm({ ...socioForm, logradouro: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={socioForm.numero}
                      onChange={(e) => setSocioForm({ ...socioForm, numero: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={socioForm.complemento}
                      onChange={(e) => setSocioForm({ ...socioForm, complemento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Apto, Sala, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={socioForm.bairro}
                      onChange={(e) => setSocioForm({ ...socioForm, bairro: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={socioForm.cidade}
                      onChange={(e) => setSocioForm({ ...socioForm, cidade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={socioForm.estado}
                      onChange={(e) => setSocioForm({ ...socioForm, estado: e.target.value.toUpperCase() })}
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="SP"
                    />
                  </div>

                  {/* Observações */}
                  <div className="lg:col-span-3">
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={socioForm.observacoes}
                      onChange={(e) => setSocioForm({ ...socioForm, observacoes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      placeholder="Observações gerais..."
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormSocio(false);
                      setSocioEditando(null);
                      setErro("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-normal text-[12px] sm:text-[13px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarSocio}
                    disabled={salvando}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-normal text-[12px] sm:text-[13px] disabled:opacity-50 flex items-center gap-2"
                  >
                    {salvando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Sócios */}
            <div className="bg-white rounded-lg shadow">
              {socios.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">
                    <Users className="w-16 h-16 text-gray-300 mx-auto" />
                  </div>
                  <h3 className="text-[18px] font-light text-gray-700 mb-2">
                    Nenhuma pessoa física cadastrada
                  </h3>
                  <p className="text-gray-500">
                    Clique no botÍo acima para adicionar sócios e representantes
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {socios.map((socio) => (
                    <div key={socio.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-light text-gray-900 mb-1">
                              {socio.nome}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-600">
                              {socio.cpf && (
                                <span>CPF: {formatarCPF(socio.cpf)}</span>
                              )}
                              {socio.profissao && (
                                <span>{socio.profissao}</span>
                              )}
                              {socio.estado_civil && (
                                <span>{getEstadoCivilLabel(socio.estado_civil)}</span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12px] text-gray-500">
                              {socio.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={14} />
                                  {socio.email}
                                </span>
                              )}
                              {socio.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={14} />
                                  {formatarTelefone(socio.telefone)}
                                </span>
                              )}
                            </div>

                            {socio.cidade && (
                              <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin size={14} />
                                {socio.cidade}/{socio.estado}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botões de AçÍo */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditarSocio(socio)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAbrirDocumentosSocio(socio)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Documentos (Drive)"
                          >
                            <FolderOpen size={18} />
                          </button>

                          {socio.google_drive_folder_url && (
                            <button
                              type="button"
                              onClick={() => window.open(socio.google_drive_folder_url!, '_blank')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Abrir pasta no Drive"
                            >
                              <ExternalLink size={18} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExcluirSocio(socio)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de EdiçÍo de Empresa */}
        {mostrarModalEmpresa && (
          <EmpresaEditModal
            empresa={empresaEditando}
            onSave={handleSalvarEmpresaModal}
            onClose={() => {
              setMostrarModalEmpresa(false);
              setEmpresaEditando(undefined);
            }}
          />
        )}

        {/* Modal de Documentos do Drive */}
        {mostrarModalDocumentos && entidadeDocumentos && (
          <DocumentosDriveModal
            isOpen={mostrarModalDocumentos}
            onClose={() => {
              setMostrarModalDocumentos(false);
              setEntidadeDocumentos(null);
            }}
            tipo={entidadeDocumentos.tipo}
            entidadeId={entidadeDocumentos.id}
            entidadeNome={entidadeDocumentos.nome}
            folderId={entidadeDocumentos.folderId}
            folderUrl={entidadeDocumentos.folderUrl}
            onFolderUpdated={(folderId, folderUrl) => {
              // Atualizar na lista local
              if (entidadeDocumentos.tipo === 'empresa') {
                setEmpresas(empresas.map(e =>
                  e.id === entidadeDocumentos.id
                    ? { ...e, google_drive_folder_id: folderId, google_drive_folder_url: folderUrl }
                    : e
                ));
              } else {
                setSocios(socios.map(s =>
                  s.id === entidadeDocumentos.id
                    ? { ...s, google_drive_folder_id: folderId, google_drive_folder_url: folderUrl }
                    : s
                ));
              }
            }}
          />
        )}
      </div>
    </div>
  );
}



