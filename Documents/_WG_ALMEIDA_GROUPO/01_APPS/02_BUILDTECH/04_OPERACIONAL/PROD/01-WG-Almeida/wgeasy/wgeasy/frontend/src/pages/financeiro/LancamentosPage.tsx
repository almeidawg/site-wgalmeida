/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import { formatarData, formatarMoeda } from "@/lib/utils";
import {
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Copy,
  MoreHorizontal,
  Filter,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Mail,
  MessageCircle,
  Download,
  Check,
  CheckSquare,
  ClipboardPaste,
} from "lucide-react";
import ImportarComprovanteModal, {
  DadosLancamentoExtraido,
} from "@/components/financeiro/ImportarComprovanteModal";
import CategoriaHierarquicaSelect from "@/components/financeiro/CategoriaHierarquicaSelect";
import { DateInputBR, getTodayISO } from "@/components/ui/DateInputBR";
import {
  listarFinanceiro,
  deletarLancamento,
  criarLancamento,
  atualizarLancamento,
  listarPessoas,
  listarProjetos,
  listarContratos,
  buscarContratosPorClienteNucleo,
  buscarContratosPorNucleo,
  obterCategorias,
  listarEmpresasGrupo,
  type LancamentoFinanceiro,
  type TipoLancamento,
  type StatusLancamento,
  type CategoriaFinanceira,
  type EmpresaGrupo,
} from "@/lib/financeiroApi";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { useToast } from "@/components/ui/use-toast";


type UnidadeNegocio =
  | "designer"      // W.G. DE ALMEIDA DESIGNER DE INTERIORES (14540890000139)
  | "arquitetura"   // WG ALMEIDA ARQUITETURA E COMERCIO LTDA (45150970000101)
  | "engenharia"    // WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA (43716324000133)
  | "marcenaria"    // WG ALMEIDA MARCENARIA DE ALTO PADRAO LTDA (46836926000112)
  | "moma_engenharia"  // Moma Engenharia
  | "moma_planejados"  // Moma Planejados
  | "produtos"
  | "materiais"
  | "grupo";        // Empresas do Grupo

const NUCLEOS_LABELS: Record<UnidadeNegocio, string> = {
  designer: "WG Designer",
  arquitetura: "Arquitetura",
  engenharia: "Engenharia",
  marcenaria: "Marcenaria",
  moma_engenharia: "Moma Engenharia",
  moma_planejados: "Moma Planejados",
  produtos: "Produtos",
  materiais: "Materiais",
  grupo: "Empresas do Grupo",
};

const NUCLEOS_CORES: Record<UnidadeNegocio, string> = {
  designer: "#9333EA", // Roxo para Designer
  arquitetura: "#5E9B94", // Verde Mineral (cor oficial WG Arquitetura)
  engenharia: "#3B82F6", // Azul (cor oficial WG Engenharia)
  marcenaria: "#8B5E3C", // Marrom Carvalho (cor oficial WG Marcenaria)
  moma_engenharia: "#10B981", // Verde Esmeralda
  moma_planejados: "#EC4899", // Rosa/Pink
  produtos: "#F25C26", // Laranja WG
  materiais: "#6B7280", // Cinza
  grupo: "#374151", // Cinza escuro
};

// Mapeamento de CNPJ das empresas para núcleo
const CNPJ_TO_NUCLEO: Record<string, UnidadeNegocio> = {
  "45150970000101": "arquitetura",  // WG ALMEIDA ARQUITETURA E COMERCIO LTDA
  "43716324000133": "engenharia",   // WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA
  "46836926000112": "marcenaria",   // WG ALMEIDA MARCENARIA DE ALTO PADRAO LTDA
  "14540890000139": "designer",     // W.G. DE ALMEIDA DESIGNER DE INTERIORES
};

// Letras compactas para exibiçÍo do núcleo
const NUCLEO_LETRA: Record<string, string> = {
  arquitetura: "A",      // A = Arquitetura
  engenharia: "E",       // E = Engenharia
  marcenaria: "M",       // M = Marcenaria
  designer: "D",         // D = Designer
  grupo: "W",            // W = WG Geral
  produtos: "W",         // W = WG Geral
  materiais: "W",        // W = WG Geral
  moma_engenharia: "V",  // V = Virtual/Terceiros
  moma_planejados: "V",  // V = Virtual/Terceiros
};

// Cores compactas (terceiros = cinza, WG geral = laranja)
const NUCLEO_COR: Record<string, string> = {
  arquitetura: "#5E9B94",   // Verde Mineral (cor oficial)
  engenharia: "#3B82F6",    // Azul (cor oficial)
  marcenaria: "#8B5E3C",    // Marrom Carvalho (cor oficial)
  designer: "#9333EA",      // Roxo
  grupo: "#F25C26",         // Laranja WG
  produtos: "#F25C26",      // Laranja WG
  materiais: "#F25C26",     // Laranja WG
  moma_engenharia: "#6B7280", // Cinza (terceiros)
  moma_planejados: "#6B7280", // Cinza (terceiros)
};

// Helper para obter cor do núcleo
function getNucleoColor(nucleo: string | null | undefined): string {
  if (!nucleo) return "#6B7280";
  return NUCLEO_COR[nucleo.toLowerCase()] || "#6B7280";
}

// Helper para obter letra do núcleo
function getNucleoLetra(nucleo: string | null | undefined): string {
  if (!nucleo) return "-";
  return NUCLEO_LETRA[nucleo.toLowerCase()] || "?";
}

// Helper para obter label completo (tooltip)
function getNucleoLabel(nucleo: string | null | undefined): string {
  if (!nucleo) return "-";
  const key = nucleo.toLowerCase() as UnidadeNegocio;
  return NUCLEOS_LABELS[key] || nucleo;
}

function contaCodigo(l: LancamentoFinanceiro): "R" | "V" {
  // Usa o campo referencia_tipo do banco, padrÍo = Real (R)
  if (l.referencia_tipo === "V") return "V";
  return "R";
}


export default function LancamentosPage() {
  const { toast } = useToast();
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [empresasGrupo, setEmpresasGrupo] = useState<EmpresaGrupo[]>([]);
  const [nucleosDisponiveis, setNucleosDisponiveis] = useState<UnidadeNegocio[]>([]);
  const [contratosFiltrados, setContratosFiltrados] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [todasCategorias, setTodasCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<LancamentoFinanceiro | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportHubOpen, setIsImportHubOpen] = useState(false);
  const [importTab, setImportTab] = useState<'comprovante' | 'lancamentos'>('comprovante');

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoLancamento | "">("");
  const [filterStatus, setFilterStatus] = useState<StatusLancamento | "">("");
  const [filterNucleo, setFilterNucleo] = useState<UnidadeNegocio | "">("");
  const [filterEmpresaGrupo, setFilterEmpresaGrupo] = useState<string>(""); // ID da empresa do grupo
  const [filterContaTipo, setFilterContaTipo] = useState<"" | "R" | "V">("");
  const [filterCentroCusto, setFilterCentroCusto] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshOnly, setIsRefreshOnly] = useState(false); // true = manter página atual
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Estados para seleçÍo de lançamentos
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal de taxa de administraçÍo antes de gerar relatório
  const [showTaxaModal, setShowTaxaModal] = useState(false);
  const [taxaAdm, setTaxaAdm] = useState<string>("15");

  // Estados para ediçÍo inline de campos
  const [editingField, setEditingField] = useState<{id: string; field: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Estados para ediçÍo inline de selects (pessoa, contrato, categoria, cliente_centro_custo)
  const [editingSelectField, setEditingSelectField] = useState<{id: string; field: 'pessoa_id' | 'contrato_id' | 'categoria_id' | 'centro_custo'} | null>(null);
  // Tipo de centro de custo na ediçÍo inline
  const [editingCentroCustoTipo, setEditingCentroCustoTipo] = useState<"contrato" | "cliente" | "empresa">("contrato");
  // Tipo de favorecido na ediçÍo inline
  const [editingFavorecidoTipo, setEditingFavorecidoTipo] = useState<"favorecido" | "empresa">("favorecido");

  // Estado para modal de atualizaçÍo em lote (quando há filtros ativos)
  const [modalAtualizacaoLote, setModalAtualizacaoLote] = useState<{
    aberto: boolean;
    field: 'pessoa_id' | 'categoria_id' | 'centro_custo' | 'descricao' | null;
    value: string;
    idOriginal: string;
    labelCampo: string;
    labelValor: string;
    outrosIds: string[];
  }>({ aberto: false, field: null, value: '', idOriginal: '', labelCampo: '', labelValor: '', outrosIds: [] });

  // Estados debounced para campos de texto (evita busca a cada letra)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedCentroCusto, setDebouncedCentroCusto] = useState("");

  // Debounce para searchTerm (500ms de delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce para filterCentroCusto (500ms de delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCentroCusto(filterCentroCusto);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterCentroCusto]);

  // PaginaçÍo
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [formData, setFormData] = useState({
    pessoa_id: "",  // Favorecido (quem recebe)
    tipo: "entrada" as TipoLancamento,
    nucleo: "" as "" | UnidadeNegocio,
    contrato_id: "", // Centro de Custo (contrato vinculado)
    cliente_centro_custo_id: "", // Cliente direto como Centro de Custo (sem contrato)
    descricao: "",
    valor: "",
    categoria_id: "",
    subcategoria: "", // Categoria específica (ex: Pintura, Pedreiro)
    status: "previsto" as StatusLancamento,
    data_competencia: getTodayISO(),
    vencimento: "",
    data_pagamento: "", // Data em que o pagamento foi efetivamente realizado
    projeto_id: "",
    observacoes: "",
    conta_tipo: "R" as "R" | "V",
  });

  // Tipo de Centro de Custo: 'contrato', 'cliente' ou 'empresa' (empresas do grupo)
  const [tipoCentroCusto, setTipoCentroCusto] = useState<"contrato" | "cliente" | "empresa">("contrato");

  // Tipo de Favorecido: 'favorecido' (colaboradores, fornecedores, etc) ou 'empresa' (empresas do grupo)
  const [tipoFavorecido, setTipoFavorecido] = useState<"favorecido" | "empresa">("favorecido");

  // Estado para busca de favorecido no formulário
  const [buscaFavorecido, setBuscaFavorecido] = useState("");
  const [isFavorecidoOpen, setIsFavorecidoOpen] = useState(false);
  // Estado para busca de centro de custo (contrato/cliente)
  const [buscaCentroCusto, setBuscaCentroCusto] = useState("");
  const [isCentroCustoOpen, setIsCentroCustoOpen] = useState(false);

  // FAVORECIDO PESSOAS = Colaboradores, Fornecedores, Especificadores, Prestadores (quem RECEBE pagamento)
  const pessoasFavorecidosPessoas = useMemo(() => {
    return pessoas.filter((p) => {
      const tipo = (p.tipo || "").toLowerCase();
      return (
        tipo.includes("colaborador") ||
        tipo.includes("fornecedor") ||
        tipo.includes("especificador") ||
        tipo.includes("prestador")
      );
    });
  }, [pessoas]);

  // FAVORECIDO EMPRESAS (legado - mantido para compatibilidade)
  const pessoasFavorecidosEmpresas = useMemo(() => {
    return pessoas.filter((p) => {
      const tipo = (p.tipo || "").toLowerCase();
      return tipo === "empresa_grupo";
    });
  }, [pessoas]);

  // Empresas do Grupo formatadas para o select de favorecido
  // CORREÇÍO: Usar tabela empresas_grupo ao invés de filtrar pessoas
  const empresasGrupoFormatadas = useMemo(() => {
    return empresasGrupo.map((emp) => ({
      id: emp.id,
      nome: emp.nome_fantasia || emp.razao_social,
      nome_fantasia: emp.nome_fantasia || "",
      razao_social: emp.razao_social || "",
      tipo: "empresa_grupo",
      cpf: null,
      cnpj: emp.cnpj,
    }));
  }, [empresasGrupo]);

  // Todos os favorecidos (para exibiçÍo na tabela)
  // CORREÇÍO: Incluir empresasGrupoFormatadas ao invés de pessoasFavorecidosEmpresas
  const pessoasFavorecidos = useMemo(() => {
    return [...pessoasFavorecidosPessoas, ...empresasGrupoFormatadas];
  }, [pessoasFavorecidosPessoas, empresasGrupoFormatadas]);

  // Favorecidos filtrados pela busca (baseado no tipo selecionado)
  const favorecidosFiltrados = useMemo(() => {
    // CORREÇÍO: Quando tipo "empresa", usar empresasGrupo da tabela empresas_grupo
    const baseLista = tipoFavorecido === "favorecido" ? pessoasFavorecidosPessoas : empresasGrupoFormatadas;
    if (!buscaFavorecido.trim()) return baseLista;
    const termo = normalizeSearchTerm(buscaFavorecido);
    return baseLista.filter((p: any) => {
      const nome = normalizeSearchTerm(p.nome || "");
      const nomeFantasia = normalizeSearchTerm(p.nome_fantasia || "");
      const razaoSocial = normalizeSearchTerm(p.razao_social || "");
      const nomeBusca = `${nome} ${nomeFantasia} ${razaoSocial}`.trim();
      const cpf = (p.cpf || "").replace(/\D/g, "");
      const cnpj = (p.cnpj || "").replace(/\D/g, "");
      const termoBusca = termo.replace(/\D/g, "");
      return nomeBusca.includes(termo) || cpf.includes(termoBusca) || cnpj.includes(termoBusca);
    });
  }, [tipoFavorecido, pessoasFavorecidosPessoas, empresasGrupoFormatadas, buscaFavorecido]);

  // CENTRO DE CUSTO = Contratos (mostra cliente do contrato)
  // Filtrar contratos pela busca (por número do contrato OU nome do cliente)
  const contratosFiltradosBusca = useMemo(() => {
    const baseContratos = contratosFiltrados.length > 0 ? contratosFiltrados : contratos;
    if (!buscaCentroCusto.trim()) return baseContratos;
    const termo = normalizeSearchTerm(buscaCentroCusto);
    return baseContratos.filter((c) => {
      const numero = normalizeSearchTerm(c.numero || "");
      const titulo = normalizeSearchTerm(c.titulo || "");
      const nomeCliente = (
        Array.isArray((c as any)?.pessoas)
          ? ((c as any)?.pessoas?.[0]?.nome || "")
          : ((c as any)?.pessoas?.nome || "")
      )
        .toString();
      const nomeClienteNorm = normalizeSearchTerm(nomeCliente);
      return numero.includes(termo) || titulo.includes(termo) || nomeClienteNorm.includes(termo);
    });
  }, [contratos, contratosFiltrados, buscaCentroCusto]);

  // CLIENTES para Centro de Custo direto (sem contrato)
  // A API filtra por ativo=true e inclui status=ativo/null/concluido quando configurado
  const pessoasClientes = useMemo(() => {
    return pessoas.filter((p) => {
      const tipo = (p.tipo || "").toLowerCase();
      return tipo === "cliente";
    });
  }, [pessoas]);

  // Clientes filtrados pela busca
  const clientesFiltradosBusca = useMemo(() => {
    if (!buscaCentroCusto.trim()) return pessoasClientes;
    const termo = normalizeSearchTerm(buscaCentroCusto);
    return pessoasClientes.filter((p) => {
      const nome = normalizeSearchTerm(p.nome || "");
      const cpf = (p.cpf || "").replace(/\D/g, "");
      const cnpj = (p.cnpj || "").replace(/\D/g, "");
      const termoBusca = termo.replace(/\D/g, "");
      return nome.includes(termo) || cpf.includes(termoBusca) || cnpj.includes(termoBusca);
    });
  }, [pessoasClientes, buscaCentroCusto]);

  // Carregar lista principal + filtros
  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [lancs, pess, projs, conts, allCats, empresas] = await Promise.all([
          listarFinanceiro(),
          listarPessoas({ incluirConcluidos: true }),
          listarProjetos(),
          listarContratos(),
          obterCategorias(), // Todas as categorias para exibiçÍo
          listarEmpresasGrupo(), // Empresas do grupo para centro de custo
        ]);
        setTodasCategorias(allCats);
        setEmpresasGrupo(empresas);

        let filtrados = lancs;

        if (debouncedSearchTerm) {
          const termo = normalizeSearchTerm(debouncedSearchTerm);
          filtrados = filtrados.filter((l) =>
            normalizeSearchTerm(l.descricao).includes(termo)
          );
        }

        if (filterTipo) {
          filtrados = filtrados.filter((l) => l.tipo === filterTipo);
        }

        if (filterStatus) {
          filtrados = filtrados.filter((l) => {
            // Tratar status null/undefined como "previsto" (padrÍo)
            const statusLancamento = l.status || 'previsto';
            return statusLancamento === filterStatus;
          });
        }

        if (filterNucleo) {
          filtrados = filtrados.filter((l) => {
            const nucleo =
              (l.nucleo as UnidadeNegocio | null) ||
              ((l.contrato as any)?.unidade_negocio as UnidadeNegocio | null);
            return nucleo === filterNucleo;
          });
        }

        if (filterContaTipo) {
          filtrados = filtrados.filter(
            (l) => contaCodigo(l) === filterContaTipo
          );
        }

        if (debouncedCentroCusto) {
          const termoCentro = normalizeSearchTerm(debouncedCentroCusto);
          filtrados = filtrados.filter((l) => {
            // Buscar em contrato, cliente do contrato, ou cliente direto
            const centro = [
              l.contrato?.numero,
              (l.contrato as any)?.pessoas?.nome,
              l.cliente_centro_custo?.nome
            ]
              .filter(Boolean)
              .join(" ");
            return normalizeSearchTerm(centro).includes(termoCentro);
          });
        }

        if (filterDataInicio) {
          filtrados = filtrados.filter((l) => (l.data_competencia || "") >= filterDataInicio);
        }

        if (filterDataFim) {
          filtrados = filtrados.filter((l) => (l.data_competencia || "") <= filterDataFim);
        }

        if (filterCategoria) {
          filtrados = filtrados.filter((l) => l.categoria_id === filterCategoria);
        }

        // Filtro por Empresa do Grupo (usando CNPJ para mapear ao núcleo)
        if (filterEmpresaGrupo) {
          const empresaSelecionada = empresas.find(e => e.id === filterEmpresaGrupo);
          if (empresaSelecionada?.cnpj) {
            // Usar CNPJ para encontrar o núcleo correspondente
            const cnpjLimpo = (empresaSelecionada.cnpj || "").replace(/\D/g, "");
            const nucleoMapeado = CNPJ_TO_NUCLEO[cnpjLimpo];
            if (nucleoMapeado) {
              filtrados = filtrados.filter((l) => {
                const nucleo = (l.nucleo || (l.contrato as any)?.unidade_negocio || "").toLowerCase();
                return nucleo === nucleoMapeado;
              });
            }
          }
        }

        // DEBUG: Mostrar todos os status distintos para diagnóstico
        const statusDistintos = [...new Set(lancs.map(l => l.status || 'NULL/UNDEFINED'))];
        if (import.meta.env.DEV) console.log("🔍 Status distintos no banco:", statusDistintos);
        if (import.meta.env.DEV) console.log("🔍 Contagem por status:", statusDistintos.map(s => ({
          status: s,
          count: lancs.filter(l => (l.status || 'NULL/UNDEFINED') === s).length
        })));

        if (import.meta.env.DEV) console.log("🎯 Filtros aplicados:", {
          total: lancs.length,
          filtrados: filtrados.length,
          filtros: { debouncedSearchTerm, filterTipo, filterStatus, filterNucleo, filterEmpresaGrupo, filterContaTipo, debouncedCentroCusto }
        });
        setLancamentos(filtrados);
        // Só reseta para página 1 se NÍO for apenas refresh (filtros mudaram)
        if (!isRefreshOnly) {
          setCurrentPage(1);
        }
        setIsRefreshOnly(false); // Resetar flag
        setPessoas(pess);
        setProjetos(projs);
        setContratos(conts);
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        toast({ variant: "destructive", title: "Erro ao carregar lançamentos", description: error?.message });
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [debouncedSearchTerm, filterTipo, filterStatus, filterNucleo, filterEmpresaGrupo, filterContaTipo, debouncedCentroCusto, filterDataInicio, filterDataFim, filterCategoria, refreshKey]);

  // Núcleos sempre disponíveis
  useEffect(() => {
    // SEMPRE mostrar TODAS as opções de núcleo
    setNucleosDisponiveis([
      "designer",     // W.G. DE ALMEIDA DESIGNER DE INTERIORES
      "arquitetura",  // WG ALMEIDA ARQUITETURA E COMERCIO LTDA
      "engenharia",   // WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA
      "marcenaria",   // WG ALMEIDA MARCENARIA DE ALTO PADRAO LTDA
      "moma_engenharia",  // Moma Engenharia
      "moma_planejados",  // Moma Planejados
      "produtos",
      "materiais",
      "grupo",
    ]);
  }, []);

  // Atualizar contratos filtrados por núcleo
  // Para ENTRADA: filtra por cliente
  // Para SAÍDA (despesa): busca TODOS os contratos do núcleo
  useEffect(() => {
    async function buscarContratosParaLancamento() {
      if (!formData.nucleo) {
        setContratosFiltrados([]);
        setFormData((prev) => ({ ...prev, contrato_id: "" }));
        return;
      }

      try {
        // Para despesa (saída): busca todos os contratos do núcleo
        // Para receita (entrada): filtra por cliente
        if (formData.tipo === "saida") {
          // Buscar todos os contratos ativos do núcleo
          const lista = await buscarContratosPorNucleo(formData.nucleo);
          setContratosFiltrados(lista);
        } else if (formData.pessoa_id) {
          // Buscar contratos do cliente específico
          const lista = await buscarContratosPorClienteNucleo(
            formData.pessoa_id,
            formData.nucleo
          );
          setContratosFiltrados(lista);
        } else {
          setContratosFiltrados([]);
        }
      } catch (error) {
        console.error("Erro ao buscar contratos:", error);
        setContratosFiltrados([]);
      }
    }

    buscarContratosParaLancamento();
  }, [formData.pessoa_id, formData.nucleo, formData.tipo]);

  // Categorias por tipo (entrada / saída)
  useEffect(() => {
    async function carregarCategorias() {
      try {
        const cats = await obterCategorias(formData.tipo);
        setCategorias(cats);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setCategorias([]);
      }
    }
    carregarCategorias();
  }, [formData.tipo]);

  function abrirForm(l?: LancamentoFinanceiro) {
    if (l) {
      const contrato = contratos.find((c) => c.id === l.contrato_id);
      setEditing(l);
      // Definir tipo de centro de custo baseado nos dados
      if (l.contrato_id) {
        setTipoCentroCusto("contrato");
      } else if (l.cliente_centro_custo_id) {
        // Verificar se é cliente (pessoa) ou empresa do grupo
        const isEmpresaGrupo = empresasGrupo.some(emp => emp.id === l.cliente_centro_custo_id);
        setTipoCentroCusto(isEmpresaGrupo ? "empresa" : "cliente");
      } else {
        setTipoCentroCusto("contrato");
      }
      // Definir tipo de favorecido baseado nos dados (pessoa ou empresa do grupo)
      // CORREÇÍO: Verificar se pessoa_id existe na tabela empresas_grupo
      const isEmpresaGrupoFavorecido = empresasGrupo.some(emp => emp.id === l.pessoa_id);
      if (isEmpresaGrupoFavorecido) {
        setTipoFavorecido("empresa");
      } else {
        setTipoFavorecido("favorecido");
      }
      setFormData({
        pessoa_id: l.pessoa_id || "",
        tipo: l.tipo,
        nucleo:
          (l.nucleo as UnidadeNegocio) ||
          ((contrato?.unidade_negocio as UnidadeNegocio) || ""),
        contrato_id: l.contrato_id || "",
        cliente_centro_custo_id: l.cliente_centro_custo_id || "",
        descricao: l.descricao,
        valor: String(l.valor_total || ""),
        categoria_id: l.categoria_id || "",
        subcategoria: l.subcategoria || "",
        status: l.status || "previsto",
        data_competencia:
          l.data_competencia || getTodayISO(),
        vencimento: l.vencimento || "",
        data_pagamento: l.data_pagamento || "",
        projeto_id: l.projeto_id || "",
        observacoes: l.observacoes || "",
        conta_tipo: contaCodigo(l),
      });
    } else {
      setEditing(null);
      setTipoCentroCusto("contrato");
      setTipoFavorecido("favorecido");
      setFormData({
        pessoa_id: "",
        tipo: "entrada",
        nucleo: "",
        contrato_id: "",
        cliente_centro_custo_id: "",
        descricao: "",
        valor: "",
        categoria_id: "",
        subcategoria: "",
        status: "previsto",
        data_competencia: getTodayISO(),
        vencimento: "",
        data_pagamento: "",
        projeto_id: "",
        observacoes: "",
        conta_tipo: "R",
      });
    }
    // Limpar estados de busca do formulário
    setBuscaFavorecido("");
    setBuscaCentroCusto("");
    setIsFavorecidoOpen(false);
    setIsCentroCustoOpen(false);
    setIsFormOpen(true);
  }

  async function salvarCampoDataInline(
    id: string,
    field: "data_competencia" | "vencimento" | "data_pagamento",
    value: string
  ) {
    try {
      const payload: any = {};
      payload[field] = value || null;
      await atualizarLancamento(id, payload);
      setEditingField(null);
      setEditingValue("");
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao salvar data:", error);
      toast({ variant: "destructive", title: "Erro ao salvar data", description: error?.message });
    }
  }

  function fecharForm() {
    setIsFormOpen(false);
    setEditing(null);
    setBuscaFavorecido("");
    setBuscaCentroCusto("");
    setIsFavorecidoOpen(false);
    setIsCentroCustoOpen(false);
    setTipoCentroCusto("contrato");
    setTipoFavorecido("favorecido");
    setFormData({
      pessoa_id: "",
      tipo: "entrada" as TipoLancamento,
      nucleo: "" as "" | UnidadeNegocio,
      contrato_id: "",
      cliente_centro_custo_id: "",
      descricao: "",
      valor: "",
      categoria_id: "",
      subcategoria: "",
      status: "previsto" as StatusLancamento,
      data_competencia: getTodayISO(),
      vencimento: "",
      data_pagamento: "",
      projeto_id: "",
      observacoes: "",
      conta_tipo: "R" as "R" | "V",
    });
  }

  async function salvar(e: React.FormEvent) {
  e.preventDefault();

  if (!formData.descricao || !formData.valor) {
    toast({ variant: "destructive", title: "Preencha descriçÍo e valor." });
    return;
  }

  // Favorecido é obrigatório
  if (!formData.pessoa_id) {
    toast({ variant: "destructive", title: "Selecione o favorecido." });
    return;
  }

  // Núcleo é obrigatório para todos os lançamentos
  if (!formData.nucleo) {
    toast({ variant: "destructive", title: "Selecione o núcleo." });
    return;
  }
  // Centro de Custo: pode ser Contrato OU Cliente diretamente (mutuamente exclusivos)

  // Obter nome do favorecido selecionado
  const favorecidoSel = pessoasFavorecidos.find(p => p.id === formData.pessoa_id);

  const payload: any = {
    descricao: formData.descricao,
    valor_total: parseFloat(formData.valor),
    tipo: formData.tipo,
    categoria_id: formData.categoria_id || null,
    subcategoria: formData.subcategoria || null,
    status: formData.status,
    data_competencia: formData.data_competencia,
    vencimento: formData.vencimento || null,
    pessoa_id: formData.pessoa_id || null,
    favorecido_id: formData.pessoa_id || null,
    favorecido_nome: favorecidoSel?.nome || null,
    projeto_id: formData.projeto_id || null,
    // Centro de Custo: Contrato, Cliente ou Empresa (exclusivos)
    contrato_id: tipoCentroCusto === "contrato" ? (formData.contrato_id || null) : null,
    cliente_centro_custo_id: (tipoCentroCusto === "cliente" || tipoCentroCusto === "empresa") ? (formData.cliente_centro_custo_id || null) : null,
    observacoes: formData.observacoes || null,
    nucleo: formData.nucleo || null,
    referencia_tipo: formData.conta_tipo,
  };

  try {
    if (editing) {
      await atualizarLancamento(editing.id!, payload);
    } else {
      await criarLancamento(payload);
    }

    fecharForm();
    setIsRefreshOnly(true); // Manter na página atual
    setRefreshKey((k) => k + 1); // força recarga da lista
    toast({ title: "Lançamento salvo com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao salvar lançamento:", error);
    toast({ variant: "destructive", title: "Erro ao salvar lançamento", description: error?.message });
  }
}


  async function excluir(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await deletarLancamento(id);
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao excluir lançamento:", error);
      toast({ variant: "destructive", title: "Erro ao excluir lançamento", description: error?.message });
    }
  }

  async function marcarPago(id: string) {
    try {
      await atualizarLancamento(id, {
        status: "pago",
        data_pagamento: getTodayISO(),
      });
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao marcar como pago:", error);
      toast({ variant: "destructive", title: "Erro ao marcar como pago", description: error?.message });
    }
  }

  // Alterar status diretamente na tabela
  async function alterarStatus(id: string, novoStatus: StatusLancamento) {
    try {
      const dados: Partial<LancamentoFinanceiro> = { status: novoStatus };

      // Se marcando como pago, adicionar data de pagamento
      if (novoStatus === "pago") {
        dados.data_pagamento = getTodayISO();
      }

      await atualizarLancamento(id, dados);
      setEditingStatusId(null);
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      toast({ variant: "destructive", title: "Erro ao alterar status", description: error?.message });
    }
  }

  // Iniciar ediçÍo inline de um campo
  function iniciarEdicaoInline(id: string, field: string, valorAtual: string) {
    setEditingField({ id, field });
    setEditingValue(valorAtual);
  }

  // Salvar ediçÍo inline
  async function salvarEdicaoInline() {
    if (!editingField) return;

    try {
      const payload: any = {};

      if (editingField.field === 'descricao') {
        payload.descricao = editingValue;
      } else if (editingField.field === 'valor') {
        payload.valor_total = parseFloat(editingValue) || 0;
      } else if (editingField.field === 'categoria_id') {
        payload.categoria_id = editingValue || null;
      } else if (editingField.field === 'vencimento') {
        payload.vencimento = editingValue || null;
      }

      // INTELIGENTE: Para descricao, verificar se há outros registros filtrados
      // e oferecer aplicar a mesma alteraçÍo em lote
      if (editingField.field === 'descricao' && debouncedSearchTerm && lancamentos.length > 1) {
        // Encontrar outros lançamentos filtrados (excluindo o atual)
        const outrosIds = lancamentos.filter(l => l.id !== editingField.id).map(l => l.id!);

        if (outrosIds.length > 0) {
          // Salvar o registro atual primeiro
          await atualizarLancamento(editingField.id, payload);
          setEditingField(null);
          setEditingValue("");

          // Mostrar modal perguntando se quer aplicar aos demais
          setModalAtualizacaoLote({
            aberto: true,
            field: 'descricao',
            value: editingValue,
            idOriginal: editingField.id,
            labelCampo: 'DescriçÍo',
            labelValor: editingValue || '(vazio)',
            outrosIds,
          });
          return; // NÍo dar refresh ainda, esperar decisÍo do usuário
        }
      }

      await atualizarLancamento(editingField.id, payload);
      setEditingField(null);
      setEditingValue("");
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error?.message });
    }
  }

  // Cancelar ediçÍo inline
  function cancelarEdicaoInline() {
    setEditingField(null);
    setEditingValue("");
  }

  // Salvar ediçÍo de select inline (pessoa, contrato, categoria, centro_custo)
  async function salvarSelectInline(id: string, field: 'pessoa_id' | 'contrato_id' | 'categoria_id' | 'centro_custo', value: string) {
    try {
      const payload: any = {};

      // Tratamento especial para centro_custo (pode ser contrato, cliente ou empresa do grupo)
      if (field === 'centro_custo') {
        if (editingCentroCustoTipo === 'contrato') {
          payload.contrato_id = value || null;
          payload.cliente_centro_custo_id = null; // Limpa o outro
          // Atualiza núcleo baseado no contrato
          if (value) {
            const contratoSelecionado = contratos.find(c => c.id === value);
            if (contratoSelecionado?.unidade_negocio) {
              payload.nucleo = contratoSelecionado.unidade_negocio;
            }
          }
        } else if (editingCentroCustoTipo === 'empresa') {
          // Empresa do grupo - o ID já é o ID da pessoa correspondente
          payload.cliente_centro_custo_id = value || null;
          payload.contrato_id = null; // Limpa o outro
          // Usar núcleo da empresa selecionada (se disponível)
          if (value) {
            const empresaSelecionada = empresasGrupo.find(e => e.id === value);
            payload.nucleo = empresaSelecionada?.nucleo_nome || 'grupo';
          } else {
            payload.nucleo = 'grupo';
          }
        } else {
          payload.cliente_centro_custo_id = value || null;
          payload.contrato_id = null; // Limpa o outro
        }
      } else {
        payload[field] = value || null;

        // Se estamos alterando pessoa_id (favorecido), também atualiza favorecido_id e favorecido_nome
        if (field === 'pessoa_id') {
          payload.favorecido_id = value || null;
          if (value) {
            const pessoa = pessoasFavorecidos.find(p => p.id === value);
            payload.favorecido_nome = pessoa?.nome || null;
          } else {
            payload.favorecido_nome = null;
          }
        }

        // Se estamos alterando o contrato, também atualiza o núcleo baseado no contrato selecionado
        if (field === 'contrato_id' && value) {
          const contratoSelecionado = contratos.find(c => c.id === value);
          if (contratoSelecionado?.unidade_negocio) {
            payload.nucleo = contratoSelecionado.unidade_negocio;
          }
        }
      }

      // INTELIGENTE: Para pessoa_id, categoria_id e centro_custo, verificar se há outros registros filtrados
      // e oferecer aplicar a mesma alteraçÍo em lote
      if ((field === 'pessoa_id' || field === 'categoria_id' || field === 'centro_custo') && debouncedSearchTerm && lancamentos.length > 1) {
        // Encontrar outros lançamentos filtrados (excluindo o atual)
        const outrosIds = lancamentos.filter(l => l.id !== id).map(l => l.id!);

        if (outrosIds.length > 0) {
          // Obter label do campo e valor para exibir no modal
          let labelCampo = '';
          let labelValor = '';

          if (field === 'pessoa_id') {
            labelCampo = 'Favorecido';
            const pessoa = pessoasFavorecidos.find(p => p.id === value);
            labelValor = pessoa?.nome || 'Nenhum';
          } else if (field === 'categoria_id') {
            labelCampo = 'Tipo';
            const categoria = todasCategorias.find(c => c.id === value);
            labelValor = categoria?.name || 'Nenhuma';
          } else if (field === 'centro_custo') {
            labelCampo = 'Centro de Custo';
            if (editingCentroCustoTipo === 'contrato') {
              const contrato = contratos.find(c => c.id === value);
              labelValor = contrato?.numero || 'Nenhum';
            } else if (editingCentroCustoTipo === 'empresa') {
              const empresa = empresasGrupo.find(e => e.id === value);
              labelValor = empresa?.nome_fantasia || empresa?.razao_social || 'Nenhuma';
            } else {
              const cliente = pessoas.find(p => p.id === value);
              labelValor = cliente?.nome || 'Nenhum';
            }
          }

          // Salvar o registro atual primeiro
          await atualizarLancamento(id, payload);
          setEditingSelectField(null);

          // Mostrar modal perguntando se quer aplicar aos demais
          setModalAtualizacaoLote({
            aberto: true,
            field,
            value,
            idOriginal: id,
            labelCampo,
            labelValor,
            outrosIds,
          });
          return; // NÍo dar refresh ainda, esperar decisÍo do usuário
        }
      }

      await atualizarLancamento(id, payload);
      setEditingSelectField(null);
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error?.message });
    }
  }

  // Aplicar alteraçÍo em lote para todos os registros filtrados
  async function aplicarAlteracaoEmLote() {
    if (!modalAtualizacaoLote.field || !modalAtualizacaoLote.outrosIds.length) return;

    try {
      let payload: any = {};

      // Tratamento especial para centro_custo (pode ser contrato, cliente ou empresa)
      if (modalAtualizacaoLote.field === 'centro_custo') {
        if (editingCentroCustoTipo === 'contrato') {
          payload.contrato_id = modalAtualizacaoLote.value || null;
          payload.cliente_centro_custo_id = null;
          // Atualiza núcleo baseado no contrato
          if (modalAtualizacaoLote.value) {
            const contratoSelecionado = contratos.find(c => c.id === modalAtualizacaoLote.value);
            if (contratoSelecionado?.unidade_negocio) {
              payload.nucleo = contratoSelecionado.unidade_negocio;
            }
          }
        } else if (editingCentroCustoTipo === 'empresa') {
          payload.cliente_centro_custo_id = modalAtualizacaoLote.value || null;
          payload.contrato_id = null;
          // Usar núcleo da empresa selecionada (se disponível)
          if (modalAtualizacaoLote.value) {
            const empresaSelecionada = empresasGrupo.find(e => e.id === modalAtualizacaoLote.value);
            payload.nucleo = empresaSelecionada?.nucleo_nome || 'grupo';
          } else {
            payload.nucleo = 'grupo';
          }
        } else {
          payload.cliente_centro_custo_id = modalAtualizacaoLote.value || null;
          payload.contrato_id = null;
        }
      } else {
        // Para outros campos, usar mapeamento direto
        payload = {
          [modalAtualizacaoLote.field]: modalAtualizacaoLote.value || null,
        };

        // Se for pessoa_id (favorecido), também atualiza campos relacionados
        if (modalAtualizacaoLote.field === 'pessoa_id') {
          payload.favorecido_id = modalAtualizacaoLote.value || null;
          if (modalAtualizacaoLote.value) {
            const pessoa = pessoasFavorecidos.find(p => p.id === modalAtualizacaoLote.value);
            payload.favorecido_nome = pessoa?.nome || null;
          } else {
            payload.favorecido_nome = null;
          }
        }
      }

      // Atualizar todos os outros registros
      await Promise.all(
        modalAtualizacaoLote.outrosIds.map(id => atualizarLancamento(id, payload))
      );

      setModalAtualizacaoLote({ aberto: false, field: null, value: '', idOriginal: '', labelCampo: '', labelValor: '', outrosIds: [] });
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("Erro ao aplicar em lote:", error);
      toast({ variant: "destructive", title: "Erro ao aplicar alteraçÍo em lote", description: error?.message });
    }
  }

  // Fechar modal sem aplicar em lote
  function fecharModalAtualizacaoLote() {
    setModalAtualizacaoLote({ aberto: false, field: null, value: '', idOriginal: '', labelCampo: '', labelValor: '', outrosIds: [] });
    setIsRefreshOnly(true);
    setRefreshKey((k) => k + 1);
  }

  // === SELEÇÍO DE LANÇAMENTOS ===
  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectedIds(new Set());
    }
    setSelectionMode(!selectionMode);
  }

  function toggleSelectItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      lancamentosPaginados.forEach((l) => {
        if (l.id) next.add(l.id);
      });
      return next;
    });
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // Gerar PDF do relatório com timbrado
  function gerarPDFRelatorio() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: 'destructive', title: 'Permita pop-ups para gerar o PDF' });
      return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');

    // Filtrar apenas os lançamentos visíveis (aplicando os mesmos filtros)
    const dadosRelatorio = lancamentos;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - Grupo WG Almeida</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #333; }

          .header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 3px solid #F25C26; padding-bottom: 15px; margin-bottom: 20px;
          }
          .logo-area { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #F25C26, #d94d1f);
                  border-radius: 10px; display: flex; align-items: center; justify-content: center;
                  color: white; font-weight: bold; font-size: 18px; }
          .company-info h1 { font-size: 18px; color: #2B4580; margin-bottom: 3px; }
          .company-info p { font-size: 9px; color: #666; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 14px; color: #F25C26; margin-bottom: 5px; }
          .doc-info p { font-size: 9px; color: #666; }

          .summary {
            display: flex; gap: 20px; margin-bottom: 20px; padding: 15px;
            background: #f8f9fa; border-radius: 8px;
          }
          .summary-item { flex: 1; text-align: center; padding: 10px; background: white; border-radius: 6px; }
          .summary-item.entrada { border-left: 4px solid #22c55e; }
          .summary-item.saida { border-left: 4px solid #ef4444; }
          .summary-item.resultado { border-left: 4px solid #F25C26; }
          .summary-label { font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .summary-value { font-size: 16px; font-weight: bold; }
          .summary-value.green { color: #22c55e; }
          .summary-value.red { color: #ef4444; }

          .filters-applied { font-size: 9px; color: #666; margin-bottom: 15px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #2B4580; color: white; padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; }
          td { padding: 6px; border-bottom: 1px solid #eee; font-size: 9px; }
          tr:nth-child(even) { background: #f8f9fa; }
          tr:hover { background: #fff3e0; }

          .tipo-entrada { color: #22c55e; font-weight: bold; }
          .tipo-saida { color: #ef4444; font-weight: bold; }
          .status-pago { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; }
          .status-pendente { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 10px; }
          .status-atrasado { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 10px; }

          .footer {
            position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 15mm;
            border-top: 2px solid #F25C26; background: white; font-size: 8px; color: #666;
            display: flex; justify-content: space-between;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <div class="logo">WG</div>
            <div class="company-info">
              <h1>GRUPO WG ALMEIDA</h1>
              <p>Arquitetura | Engenharia | Marcenaria | Design de Interiores</p>
              <p>CNPJ: 14.540.890/0001-39 | contato@wgalmeida.com.br</p>
            </div>
          </div>
          <div class="doc-info">
            <h2>RELATÓRIO FINANCEIRO</h2>
            <p>Emitido em: ${dataAtual} às ${horaAtual}</p>
            <p>Total de registros: ${dadosRelatorio.length}</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-item entrada">
            <div class="summary-label">Total Entradas</div>
            <div class="summary-value green">R$ ${resumoFinanceiro.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item saida">
            <div class="summary-label">Total Saídas</div>
            <div class="summary-value red">R$ ${resumoFinanceiro.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item resultado">
            <div class="summary-label">Resultado</div>
            <div class="summary-value ${resumoFinanceiro.resultado >= 0 ? 'green' : 'red'}">
              R$ ${resumoFinanceiro.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        ${filtrosAtivos > 0 ? `<div class="filters-applied">Filtros aplicados: ${filtrosAtivos}</div>` : ''}

        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>DescriçÍo</th>
              <th>Centro de Custo</th>
              <th>Favorecido</th>
              <th>Categoria</th>
              <th style="text-align: right">Valor</th>
              <th>CriaçÍo</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dadosRelatorio.map(l => `
              <tr>
                <td class="${l.tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida'}">${l.tipo === 'entrada' ? '↑ ENT' : '↓ SAÍ'}</td>
                <td>${l.descricao}</td>
                <td>${l.contrato?.numero || (l as any).cliente_centro_custo?.nome || '-'}</td>
                <td>${l.pessoa?.nome || '-'}</td>
                <td>${todasCategorias.find(c => c.id === l.categoria_id)?.name || '-'}</td>
                <td style="text-align: right" class="${l.tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida'}">
                  ${l.tipo === 'entrada' ? '+' : '-'}R$ ${Number(l.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td>${l.data_competencia ? new Date(l.data_competencia).toLocaleDateString('pt-BR') : '-'}</td>
                <td>${l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                <td><span class="status-${l.status === 'pago' ? 'pago' : l.status === 'atrasado' ? 'atrasado' : 'pendente'}">${l.status || 'previsto'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <span>Grupo WG Almeida - Sistema WG Easy</span>
          <span>Documento gerado automaticamente - ${dataAtual}</span>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  // Abrir modal de taxa antes de gerar relatório
  function abrirModalRelatorio() {
    if (resumoSelecionados.count === 0) {
      toast({ variant: 'destructive', title: 'Selecione ao menos um lançamento para gerar o relatório.' });
      return;
    }
    setShowTaxaModal(true);
  }

  // Gerar relatório profissional para cliente (layout idêntico à proposta WG)
  function gerarRelatorioCliente() {
    setShowTaxaModal(false);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: 'destructive', title: 'Permita pop-ups para gerar o relatório' });
      return;
    }

    const taxa = parseFloat(taxaAdm) || 0;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const periodoTexto = filterDataInicio || filterDataFim
      ? `${filterDataInicio ? formatarData(filterDataInicio) : '...'} a ${filterDataFim ? formatarData(filterDataFim) : '...'}`
      : 'Todos os períodos';

    const { totalEntradas, totalSaidas, resultado, totalAbsoluto, items } = resumoSelecionados;
    const valorTaxaTotal = (totalAbsoluto * taxa) / 100;
    const resultadoComTaxa = resultado - valorTaxaTotal;

    // Gerar linhas da tabela no formato grid da proposta
    const linhasTabela = items.map((l, idx) => {
      const valor = Number(l.valor_total || 0);
      const pct = totalAbsoluto > 0 ? ((valor / totalAbsoluto) * 100).toFixed(1) : '0.0';
      const taxaItem = (valor * taxa) / 100;
      const nomeCategoria = todasCategorias.find(c => c.id === l.categoria_id)?.name || '-';
      const nomeFavorecido = l.pessoa?.nome || empresasGrupoFormatadas.find((e) => e.id === l.pessoa_id)?.nome || '-';
      const centroCusto = l.contrato?.numero
        ? `${l.contrato.numero}${(l.contrato as any)?.pessoas?.nome ? ' - ' + (l.contrato as any).pessoas.nome : ''}`
        : l.cliente_centro_custo?.nome || '-';
      const statusLabel = l.status === 'pago' ? (l.tipo === 'entrada' ? 'Recebido' : 'Pago')
        : l.status === 'parcial' ? 'Parcial'
        : l.status === 'atrasado' ? 'Atrasado'
        : l.status === 'cancelado' ? 'Cancelado'
        : l.status === 'pendente' ? 'Pendente'
        : 'Previsto';
      const statusColor = l.status === 'pago' ? (l.tipo === 'entrada' ? '#16a34a' : '#dc2626')
        : l.status === 'atrasado' ? '#dc2626'
        : l.status === 'cancelado' ? '#6b7280'
        : l.status === 'pendente' ? '#ea580c'
        : '#d97706';
      const tipoBg = l.tipo === 'entrada' ? '#dcfce7' : '#fef2f2';
      const tipoCor = l.tipo === 'entrada' ? '#16a34a' : '#dc2626';

      return `<div class="item-row" style="display:grid;grid-template-columns:${taxa > 0 ? '0.6fr 1.6fr 1fr 0.9fr 0.8fr 0.8fr 0.4fr 0.7fr 0.6fr 0.6fr' : '0.6fr 1.8fr 1.1fr 1fr 0.9fr 0.9fr 0.5fr 0.7fr 0.6fr'};align-items:center;border-top:1px solid #F1F5F9;padding:7px 16px;font-size:9px;color:#3A342D;">
        <span style="text-align:center;"><span style="display:inline-block;padding:1px 6px;border-radius:10px;font-size:8px;font-weight:500;background:${tipoBg};color:${tipoCor};">${l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></span>
        <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.descricao || '-'}</span>
        <span style="color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${centroCusto}</span>
        <span style="color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nomeFavorecido}</span>
        <span style="color:#6b7280;text-align:center;">${nomeCategoria}</span>
        <span style="text-align:right;font-weight:600;color:${tipoCor};">${l.tipo === 'entrada' ? '+' : '-'}R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span style="text-align:center;color:#8A8176;">${pct}%</span>
        ${taxa > 0 ? `<span style="text-align:right;color:#F25C26;font-weight:500;">R$ ${taxaItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>` : ''}
        <span style="text-align:center;color:#8A8176;">${l.vencimento ? formatarData(l.vencimento) : '-'}</span>
        <span style="text-align:center;color:${statusColor};font-weight:500;">${statusLabel}</span>
      </div>`;
    }).join('');

    const htmlRelatorio = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Lançamentos - Grupo WG Almeida</title>
  <style>
    :root {
      --wg-ink: #1C1B1A;
      --wg-sand: #F6F2EB;
      --wg-cream: #FFF9F1;
      --wg-orange: #F25C26;
      --wg-teal: #0ABAB5;
      --wg-green: #5E9B94;
      --wg-charcoal: #2B2A28;
    }
    @page { size: A4 portrait; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--wg-ink);
      min-height: 100vh;
      background: radial-gradient(circle at top left, rgba(10,186,181,0.18), transparent 55%),
                  radial-gradient(circle at bottom right, rgba(242,92,38,0.15), transparent 55%);
      background-color: var(--wg-sand);
    }
    .container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }

    /* Header card - idêntico PropostaVisualizar */
    .header-card {
      display: flex; flex-direction: column; gap: 20px;
      border-radius: 24px; border: 1px solid #E7DED2;
      background: rgba(255,255,255,0.9); padding: 24px;
    }
    .header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
    .header-logo { display: flex; align-items: center; gap: 12px; }
    .header-logo img { height: 56px; width: auto; }
    .overline { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; color: #8A8176; }
    .header-title { font-size: 16px; font-weight: 300; letter-spacing: -0.3px; margin-top: 8px; color: var(--wg-charcoal); }
    .header-sub { font-size: 10px; color: #6E655A; margin-top: 4px; }

    /* Grid header: info esquerda + card valor direita */
    .header-grid { display: grid; gap: 16px; grid-template-columns: 1.2fr 0.8fr; }

    /* Card info período/resumo */
    .info-card {
      border-radius: 16px; border: 1px solid #EFE6DA;
      background: #fff; padding: 16px;
    }
    .info-card h2 { font-size: 12px; font-weight: 400; color: var(--wg-orange); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #EFE6DA; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
    .info-label { font-size: 9px; color: #8A8176; }
    .info-value { font-size: 10px; font-weight: 500; color: #3A342D; }

    /* Card valor total (laranja) - idêntico proposta */
    .valor-card {
      border-radius: 16px; border: 1px solid #F0D6C9;
      background: var(--wg-orange); padding: 16px; color: #fff; text-align: right;
    }
    .valor-card .overline { color: rgba(255,255,255,0.8); }
    .valor-total { font-size: 22px; font-weight: 600; margin-top: 8px; color: #fff; }
    .valor-detail { font-size: 9px; color: rgba(255,255,255,0.8); margin-top: 4px; }
    .valor-breakdown { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 9px; }
    .valor-breakdown-row { display: flex; justify-content: space-between; align-items: center; }

    /* Seções - cards arredondados como proposta */
    .section {
      margin-top: 20px; border-radius: 24px; border: 1px solid #E7DED2;
      background: #fff; padding: 20px;
    }
    .section h2 { font-size: 12px; font-weight: 400; color: var(--wg-charcoal); }
    .section .count { font-size: 8px; color: #8A8176; }
    .section-header { display: flex; align-items: center; justify-content: space-between; }

    /* Tabela grid - estilo proposta */
    .table-container { margin-top: 16px; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; }
    .table-header {
      display: grid;
      grid-template-columns: ${taxa > 0 ? '0.6fr 1.6fr 1fr 0.9fr 0.8fr 0.8fr 0.4fr 0.7fr 0.6fr 0.6fr' : '0.6fr 1.8fr 1.1fr 1fr 0.9fr 0.9fr 0.5fr 0.7fr 0.6fr'};
      background: #fff; padding: 10px 16px;
      font-size: 8px; font-weight: 400; color: #8A8176;
      border-bottom: 1px solid #E5E7EB;
    }
    .item-row:hover { background: #FAFAF8; }
    .total-row {
      display: grid;
      border-top: 2px solid #E5E7EB;
      padding: 10px 16px;
      font-size: 9px;
      font-weight: 600;
      color: var(--wg-charcoal);
      background: #FAFAF8;
    }

    /* Taxa card */
    .taxa-card {
      margin-top: 20px; border-radius: 24px; border: 1px solid #E7DED2;
      background: #fff; padding: 20px;
    }
    .taxa-inner {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, #FFF7ED, #FFEDD5);
      border: 1px solid #FDBA74; border-radius: 16px; padding: 16px 20px;
    }
    .taxa-label { font-size: 10px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .taxa-sub { font-size: 9px; color: #78716c; margin-top: 2px; }
    .taxa-valor { font-size: 20px; font-weight: 700; color: var(--wg-orange); }

    /* Badges estilo proposta */
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #fff; font-size: 8px; color: #6E655A; }

    /* Footer */
    .footer { margin-top: 32px; text-align: center; font-size: 9px; color: #9ca3af; padding-top: 16px; border-top: 1px solid #E7DED2; }

    @media print {
      body { background: var(--wg-sand) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Card (idêntico proposta) -->
    <div class="header-card">
      <div class="header-top">
        <div>
          <div class="header-logo">
            <img src="${window.location.origin}/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png" alt="WG" loading="lazy" onerror="this.style.display='none'" />
            <p class="overline">WG Easy &middot; Relatório Financeiro</p>
          </div>
          <h1 class="header-title">Relatório de Lançamentos</h1>
          <p class="header-sub">
            Gerado em ${dataAtual}
            &middot; Período: ${periodoTexto}
            &middot; ${resumoSelecionados.count} lançamento${resumoSelecionados.count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div class="header-grid">
        <!-- Card Info -->
        <div class="info-card">
          <h2>Resumo Financeiro</h2>
          <div class="info-row">
            <span class="info-label">Total de Entradas</span>
            <span class="info-value" style="color:#16a34a;">+R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total de Saídas</span>
            <span class="info-value" style="color:#dc2626;">-R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="info-row" style="border-top:1px solid #EFE6DA;padding-top:8px;margin-top:4px;">
            <span class="info-label">Resultado (Ent. - Saí.)</span>
            <span class="info-value" style="color:${resultado >= 0 ? '#16a34a' : '#dc2626'};">R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          ${taxa > 0 ? `
          <div class="info-row">
            <span class="info-label">Taxa de AdministraçÍo (${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%)</span>
            <span class="info-value" style="color:#F25C26;">R$ ${valorTaxaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          ` : ''}
          <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
            <span class="badge">${resumoSelecionados.count} itens</span>
            ${taxa > 0 ? `<span class="badge">Taxa: ${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</span>` : ''}
          </div>
        </div>

        <!-- Card Valor Total (Laranja) - idêntico proposta -->
        <div class="valor-card">
          <p class="overline">${taxa > 0 ? 'Resultado com Taxa' : 'Resultado Total'}</p>
          <p class="valor-total">R$ ${resultadoComTaxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p class="valor-detail">${resumoSelecionados.count} lançamentos${taxa > 0 ? ` &middot; Taxa ${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%` : ''}</p>
          <div class="valor-breakdown">
            <div class="valor-breakdown-row">
              <span>Entradas</span>
              <span>+R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="valor-breakdown-row">
              <span>Saídas</span>
              <span>-R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            ${taxa > 0 ? `<div class="valor-breakdown-row">
              <span>Taxa Adm. ${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</span>
              <span>R$ ${valorTaxaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabela de Itens (seçÍo card como proposta) -->
    <div class="section">
      <div class="section-header">
        <h2>Lançamentos</h2>
        <span class="count">${resumoSelecionados.count} itens</span>
      </div>
      <div class="table-container">
        <div class="table-header">
          <span style="text-align:center;">Tipo</span>
          <span>DescriçÍo</span>
          <span>Centro de Custo</span>
          <span>Favorecido</span>
          <span style="text-align:center;">Categoria</span>
          <span style="text-align:right;">Valor R$</span>
          <span style="text-align:center;">%</span>
          ${taxa > 0 ? '<span style="text-align:right;">Taxa Adm.</span>' : ''}
          <span style="text-align:center;">Venc.</span>
          <span style="text-align:center;">Status</span>
        </div>
        ${linhasTabela}
        <!-- Linha de TotalizaçÍo -->
        <div class="total-row" style="grid-template-columns:${taxa > 0 ? '0.6fr 1.6fr 1fr 0.9fr 0.8fr 0.8fr 0.4fr 0.7fr 0.6fr 0.6fr' : '0.6fr 1.8fr 1.1fr 1fr 0.9fr 0.9fr 0.5fr 0.7fr 0.6fr'};">
          <span></span>
          <span style="font-size:8px;color:#8A8176;">TOTAL (${items.length} itens)</span>
          <span></span>
          <span></span>
          <span></span>
          <span style="text-align:right;">
            <div style="color:#16a34a;">+R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div style="color:#dc2626;">-R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div style="margin-top:3px;padding-top:3px;border-top:1px solid #E5E7EB;color:${resultado >= 0 ? '#16a34a' : '#dc2626'};">R$ ${resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </span>
          <span style="text-align:center;color:#8A8176;">100%</span>
          ${taxa > 0 ? `<span style="text-align:right;color:#F25C26;font-weight:600;">R$ ${valorTaxaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>` : ''}
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    ${taxa > 0 ? `
    <!-- Card Taxa de AdministraçÍo -->
    <div class="taxa-card">
      <div class="section-header" style="margin-bottom:16px;">
        <h2>Taxa de AdministraçÍo e Gerenciamento</h2>
      </div>
      <div class="taxa-inner">
        <div>
          <div class="taxa-label">Taxa aplicada: ${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</div>
          <div class="taxa-sub">Sobre o valor total de R$ ${totalAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="taxa-valor">R$ ${valorTaxaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      Grupo WG Almeida &mdash; Sistema WG Easy &mdash; Gerado em ${dataAtual}
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(htmlRelatorio);
    printWindow.document.close();
  }

  // Enviar relatório por Email
  function enviarPorEmail() {
    const assunto = encodeURIComponent(`Relatório Financeiro - Grupo WG Almeida - ${new Date().toLocaleDateString('pt-BR')}`);
    const corpo = encodeURIComponent(`
Relatório Financeiro - Grupo WG Almeida
========================================

Total de Entradas: R$ ${resumoFinanceiro.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Total de Saídas: R$ ${resumoFinanceiro.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Resultado: R$ ${resumoFinanceiro.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Total de registros: ${lancamentos.length}

Para visualizar o relatório completo, acesse o sistema WG Easy.

--
Grupo WG Almeida
Sistema WG Easy
    `);

    window.open(`mailto:?subject=${assunto}&body=${corpo}`, '_blank');
  }

  // Enviar relatório por WhatsApp
  function enviarPorWhatsApp() {
    const texto = encodeURIComponent(`
*Relatório Financeiro - Grupo WG Almeida*
📅 ${new Date().toLocaleDateString('pt-BR')}

💰 *Resumo:*
✅ Entradas: R$ ${resumoFinanceiro.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
❌ Saídas: R$ ${resumoFinanceiro.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📊 Resultado: R$ ${resumoFinanceiro.resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

📋 Total de registros: ${lancamentos.length}

_Sistema WG Easy - Grupo WG Almeida_
    `);

    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  // Duplicar lançamento (útil para reembolsos)
  async function duplicarLancamento(l: LancamentoFinanceiro) {
    try {
      const payload = {
        descricao: `${l.descricao} (Cópia)`,
        valor_total: l.valor_total,
        tipo: l.tipo,
        categoria_id: l.categoria_id || null,
        status: "pendente" as StatusLancamento,
        data_competencia: getTodayISO(),
        vencimento: null,
        pessoa_id: l.pessoa_id || null,
        projeto_id: l.projeto_id || null,
        contrato_id: l.contrato_id || null,
        cliente_centro_custo_id: l.cliente_centro_custo_id || null,
        observacoes: l.observacoes || null,
        nucleo: l.nucleo || null,
        referencia_tipo: l.referencia_tipo || "R",
      };
      await criarLancamento(payload);
      setIsRefreshOnly(true);
      setRefreshKey((k) => k + 1);
      setActionMenuId(null);
      toast({ title: "Lançamento duplicado com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao duplicar lançamento:", error);
      toast({ variant: "destructive", title: "Erro ao duplicar lançamento", description: error?.message });
    }
  }

  // Limpar todos os filtros
  function limparFiltros() {
    setSearchTerm("");
    setFilterTipo("");
    setFilterStatus("");
    setFilterNucleo("");
    setFilterEmpresaGrupo("");
    setFilterContaTipo("");
    setFilterCentroCusto("");
    setFilterDataInicio("");
    setFilterDataFim("");
    setFilterCategoria("");
  }

  // Contar filtros ativos
  const filtrosAtivos = [
    filterTipo, filterStatus, filterNucleo, filterEmpresaGrupo, filterContaTipo,
    filterCentroCusto, filterDataInicio, filterDataFim, filterCategoria
  ].filter(Boolean).length;

  // PaginaçÍo calculada
  const totalPages = Math.ceil(lancamentos.length / itemsPerPage);
  const lancamentosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return lancamentos.slice(startIndex, endIndex);
  }, [lancamentos, currentPage, itemsPerPage]);

  // Resumo financeiro dos lançamentos filtrados (mesmos filtros da tabela)
  const resumoFinanceiro = useMemo(() => {
    const entradas = lancamentos
      .filter((l) => l.tipo === "entrada")
      .reduce((acc, l) => acc + Number(l.valor_total || 0), 0);
    const saidas = lancamentos
      .filter((l) => l.tipo === "saida")
      .reduce((acc, l) => acc + Number(l.valor_total || 0), 0);
    return {
      entradas,
      saidas,
      resultado: entradas - saidas,
    };
  }, [lancamentos]);

  // Resumo dos lançamentos selecionados
  const resumoSelecionados = useMemo(() => {
    const items = lancamentos.filter((l) => l.id && selectedIds.has(l.id));
    const totalEntradas = items
      .filter((l) => l.tipo === "entrada")
      .reduce((acc, l) => acc + Number(l.valor_total || 0), 0);
    const totalSaidas = items
      .filter((l) => l.tipo === "saida")
      .reduce((acc, l) => acc + Number(l.valor_total || 0), 0);
    const resultado = totalEntradas - totalSaidas;
    const totalAbsoluto = totalEntradas + totalSaidas;
    return { totalEntradas, totalSaidas, resultado, totalAbsoluto, items, count: items.length };
  }, [lancamentos, selectedIds]);

  const allVisibleSelected = useMemo(() => {
    if (lancamentosPaginados.length === 0) return false;
    return lancamentosPaginados.every((l) => l.id && selectedIds.has(l.id));
  }, [lancamentosPaginados, selectedIds]);

  // Favorecido selecionado no formulário (para mostrar email/telefone)
  const favorecidoSelecionado = pessoasFavorecidos.find((p) => p.id === formData.pessoa_id);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Lancamentos Financeiros
              </h1>
              <p className="text-[12px] text-gray-600">
                Nucleo, centro de custo e conta Real / Virtual
              </p>
            </div>
          </div>

          {/* Botoes de Acao */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Atualizar lista"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsImportHubOpen(true);
                setImportTab('comprovante');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-normal hover:bg-gray-50 transition-all"
              title="Importar de comprovante ou planilha"
            >
              <ClipboardPaste className="w-4 h-4" />
              Importar
            </button>
            <button
              type="button"
              onClick={() => abrirForm()}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Lançamento
            </button>
          </div>
        </div>
      </div>

      {/* CARDS DE ESTATISTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-md">
              <ArrowUpCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[18px] font-light text-green-600">+{formatarMoeda(resumoFinanceiro.entradas)}</span>
            <span className="text-[12px] text-gray-500">Entradas</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-md">
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[18px] font-light text-red-600">-{formatarMoeda(resumoFinanceiro.saidas)}</span>
            <span className="text-[12px] text-gray-500">Saídas</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${resumoFinanceiro.resultado >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <CheckCircle className={`w-4 h-4 ${resumoFinanceiro.resultado >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
            <span className={`text-[18px] font-light ${resumoFinanceiro.resultado >= 0 ? "text-green-600" : "text-red-600"}`}>{formatarMoeda(resumoFinanceiro.resultado)}</span>
            <span className="text-[12px] text-gray-500">Resultado</span>
          </div>
        </div>
      </div>

      {/* AREA DE FILTROS */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Busca */}
          <div className="flex-1 relative min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar descriçÍo..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent outline-none"
            />
          </div>

          {/* Filtro por Empresa do Grupo */}
          <select
            value={filterEmpresaGrupo}
            onChange={(e) => setFilterEmpresaGrupo(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent outline-none min-w-[180px]"
            title="Filtrar por Empresa do Grupo"
          >
            <option value="">Todas Empresas</option>
            {empresasGrupo.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome_fantasia || emp.razao_social}
              </option>
            ))}
          </select>

          {/* Botao Filtros */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 text-[12px] font-normal transition-all ${
              showFilters || filtrosAtivos > 0
                ? "border-[#16a34a] text-[#16a34a] bg-green-50"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="bg-[#16a34a] text-white text-[12px] px-1.5 py-0.5 rounded-full">
                {filtrosAtivos}
              </span>
            )}
          </button>

          {/* Limpar Filtros */}
          {filtrosAtivos > 0 && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-3 py-2.5 text-[12px] text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}

          {/* Separador */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* Botoes de Acao/Exportacao */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`px-3 py-2.5 rounded-lg flex items-center gap-2 text-[12px] font-normal transition-colors ${
                selectionMode
                  ? "bg-primary text-white hover:bg-[#e04d1a]"
                  : "bg-orange-50 text-[#F25C26] hover:bg-orange-100"
              }`}
              title={selectionMode ? "Desativar seleçÍo" : "Ativar modo seleçÍo"}
            >
              <CheckSquare className="w-4 h-4" />
              Selecionar
            </button>
            <button
              type="button"
              onClick={gerarPDFRelatorio}
              className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 text-[12px] font-normal transition-colors"
              title="Gerar PDF do relatório"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={enviarPorEmail}
              className="px-3 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-2 text-[12px] font-normal transition-colors"
              title="Enviar por e-mail"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={enviarPorWhatsApp}
              className="px-3 py-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg flex items-center gap-2 text-[12px] font-normal transition-colors"
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>

          {/* Contagem */}
          <span className="text-[12px] text-gray-400 ml-auto">
            {lancamentos.length} lançamento{lancamentos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* BARRA DE RESUMO DA SELEÇÍO */}
      {selectionMode && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-[12px]">
            <span className="font-medium text-[#F25C26]">
              {resumoSelecionados.count} selecionado{resumoSelecionados.count !== 1 ? 's' : ''}
            </span>
            {resumoSelecionados.count > 0 && (
              <>
                <span className="text-green-600">Entradas: +{formatarMoeda(resumoSelecionados.totalEntradas)}</span>
                <span className="text-red-600">Saídas: -{formatarMoeda(resumoSelecionados.totalSaidas)}</span>
                <span className={resumoSelecionados.resultado >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  Resultado: {formatarMoeda(resumoSelecionados.resultado)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allVisibleSelected ? deselectAll : selectAllVisible}
              className="px-3 py-1.5 text-[12px] border border-orange-300 text-[#F25C26] rounded-lg hover:bg-orange-100 transition-colors"
            >
              {allVisibleSelected ? "Desmarcar página" : "Selecionar página"}
            </button>
            {resumoSelecionados.count > 0 && (
              <button
                type="button"
                onClick={deselectAll}
                className="px-3 py-1.5 text-[12px] text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Limpar
              </button>
            )}
            {resumoSelecionados.count > 0 && (
              <button
                type="button"
                onClick={abrirModalRelatorio}
                className="px-4 py-1.5 text-[12px] font-medium text-white rounded-lg bg-gradient-to-r from-[#F25C26] to-[#e04d1a] hover:opacity-90 transition-all shadow-sm"
              >
                Gerar Relatório ({resumoSelecionados.count})
              </button>
            )}
          </div>
        </div>
      )}

      {/* TABELA */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando lançamentos...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                {/* Linha de Filtros */}
                {showFilters && (
                  <tr className="bg-gray-100/50">
                    {selectionMode && <th className="px-1 py-1.5 w-8 bg-gray-100/50"></th>}
                    <th className="px-1 py-1.5 w-16 sticky left-0 z-20 bg-gray-100/50">
                      <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value as TipoLancamento | "")}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por tipo"
                      >
                        <option value="">-</option>
                        <option value="entrada">Ent.</option>
                        <option value="saida">Sai.</option>
                      </select>
                    </th>
                    <th className="px-1 py-1.5 w-14">
                      <select
                        value={filterNucleo}
                        onChange={(e) => setFilterNucleo(e.target.value as UnidadeNegocio | "")}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por núcleo"
                      >
                        <option value="">-</option>
                        {nucleosDisponiveis.map((n) => (
                          <option key={n} value={n}>{NUCLEO_LETRA[n] || n} - {NUCLEOS_LABELS[n]?.substring(0, 5) || n}</option>
                        ))}
                      </select>
                    </th>
                    <th className="px-2 py-1.5 min-w-[140px]">
                      {/* Descricao - usa busca principal */}
                    </th>
                    <th className="px-2 py-1.5 min-w-[120px]">
                      <input
                        type="text"
                        value={filterCentroCusto}
                        onChange={(e) => setFilterCentroCusto(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full px-1.5 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por centro de custo"
                      />
                    </th>
                    <th className="px-2 py-1.5 min-w-[100px]">
                      {/* Favorecido - sem filtro por enquanto */}
                    </th>
                    <th className="px-2 py-1.5">
                      <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        className="w-full px-1.5 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por tipo"
                      >
                        <option value="">Todos</option>
                        {todasCategorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </th>
                    <th className="px-1 py-1.5 w-10">
                      <select
                        value={filterContaTipo}
                        onChange={(e) => setFilterContaTipo(e.target.value as "" | "R" | "V")}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por conta"
                      >
                        <option value="">-</option>
                        <option value="R">R</option>
                        <option value="V">V</option>
                      </select>
                    </th>
                    <th className="px-1 py-1.5">
                      {/* Valor - sem filtro */}
                    </th>
                    <th className="px-1 py-1.5">
                      <DateInputBR
                        value={filterDataInicio}
                        onChange={setFilterDataInicio}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Data de"
                        placeholder="dd/mm/aaaa"
                      />
                    </th>
                    <th className="px-1 py-1.5">
                      <DateInputBR
                        value={filterDataFim}
                        onChange={setFilterDataFim}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Data até"
                        placeholder="dd/mm/aaaa"
                      />
                    </th>
                    <th className="px-1 py-1.5"></th>
                    <th className="px-1 py-1.5">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as StatusLancamento | "")}
                        className="w-full px-1 py-1 text-[12px] border border-gray-200 rounded bg-white"
                        title="Filtrar por status"
                      >
                        <option value="">Todos</option>
                        <option value="pendente">Pendente</option>
                        <option value="previsto">Previsto</option>
                        <option value="parcial">Parcial</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </th>
                    <th className="px-1 py-1.5 w-12"></th>
                  </tr>
                )}
                {/* Linha de Titulos */}
                <tr>
                  {selectionMode && (
                    <th className="px-1 py-2 w-8 bg-gray-50">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={() => allVisibleSelected ? deselectAll() : selectAllVisible()}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#F25C26] focus:ring-[#F25C26] cursor-pointer"
                        title="Selecionar todos da página"
                      />
                    </th>
                  )}
                  <th className="px-1 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide w-16 sticky left-0 z-20 bg-gray-50">
                    Tipo
                  </th>
                  <th className="px-1 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide w-10">
                    Nuc
                  </th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide min-w-[140px] max-w-[180px]">
                    DescriçÍo
                  </th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide min-w-[120px]">
                    Centro de custo
                  </th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide min-w-[100px]">
                    Favorecido
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide w-10">
                    Cta
                  </th>
                  <th className="px-2 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Valor
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    CriaçÍo
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Venc.
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Pgto
                  </th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-1 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide w-12">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lancamentosPaginados.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400 text-[12px]" colSpan={selectionMode ? 14 : 13}>
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                ) : (
                  lancamentosPaginados.map((l) => {
                    const conta = contaCodigo(l);
                    const nucleo =
                      (l.nucleo as UnidadeNegocio | null) ||
                      ((l.contrato as any)?.unidade_negocio as UnidadeNegocio | null);
                    const nomeCliente = l.pessoa?.nome || empresasGrupoFormatadas.find((e) => e.id === l.pessoa_id)?.nome || "";
                    const codigoContrato = l.contrato?.numero || "";
                    const nomeProjeto = l.projeto?.nome || "";
                    // Cliente direto como centro de custo (quando nÍo tem contrato)
                    const clienteCentroCusto = l.cliente_centro_custo?.nome || "";
                    return (
                      <tr key={l.id} className={`hover:bg-gray-50/50 group ${selectionMode && l.id && selectedIds.has(l.id) ? 'bg-orange-50/60' : ''}`}>
                        {/* Checkbox de SeleçÍo */}
                        {selectionMode && (
                          <td className="px-1 py-1.5 text-center w-8">
                            <input
                              type="checkbox"
                              checked={!!(l.id && selectedIds.has(l.id))}
                              onChange={() => l.id && toggleSelectItem(l.id)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-[#F25C26] focus:ring-[#F25C26] cursor-pointer"
                            />
                          </td>
                        )}
                        {/* Tipo (Entrada/Saída) - COLUNA FIXA */}
                        <td className={`px-1 py-1.5 text-center sticky left-0 z-10 group-hover:bg-gray-50/50 ${selectionMode && l.id && selectedIds.has(l.id) ? 'bg-orange-50/60' : 'bg-white'}`}>
                          {l.tipo === "entrada" ? (
                            <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-normal">
                              <ArrowUpCircle className="w-3 h-3" />
                              Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-normal">
                              <ArrowDownCircle className="w-3 h-3" />
                              Saída
                            </span>
                          )}
                        </td>
                        {/* Núcleo - Letra com cor */}
                        <td className="px-1 py-1.5 text-center">
                          {nucleo ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 text-[12px] rounded font-normal text-white"
                              style={{ backgroundColor: getNucleoColor(nucleo) }}
                              title={getNucleoLabel(nucleo)}
                            >
                              {getNucleoLetra(nucleo)}
                            </span>
                          ) : (
                            <span className="text-[12px] text-gray-300">-</span>
                          )}
                        </td>
                        {/* DescriçÍo */}
                        <td className="px-2 py-1.5">
                          <div className="min-w-0 max-w-[180px]">
                            {editingField?.id === l.id && editingField?.field === 'descricao' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') salvarEdicaoInline();
                                    if (e.key === 'Escape') cancelarEdicaoInline();
                                  }}
                                  onBlur={() => salvarEdicaoInline()}
                                  autoFocus
                                  title="Editar descriçÍo"
                                  placeholder="Digite a descriçÍo"
                                  className="w-full px-1.5 py-0.5 text-[12px] border border-wg-primary rounded bg-white focus:outline-none"
                                />
                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={salvarEdicaoInline} className="p-0.5 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancelarEdicaoInline} className="p-0.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="font-normal text-[12px] truncate cursor-pointer hover:bg-orange-50 px-1 -mx-1 rounded transition-colors"
                                style={{ color: nucleo ? getNucleoColor(nucleo) : '#1f2937' }}
                                title={`${l.descricao} (clique para editar)`}
                                onClick={() => iniciarEdicaoInline(l.id!, 'descricao', l.descricao)}
                              >
                                {l.descricao}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Centro Custo (Contrato ou Cliente) - Editável */}
                        <td className="px-2 py-1.5">
                          {editingSelectField?.id === l.id && editingSelectField?.field === 'centro_custo' ? (
                            <div className="space-y-1 max-w-[160px]">
                              {/* Toggle Contrato/Cliente/Empresa */}
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingCentroCustoTipo("contrato")}
                                  className={`flex-1 py-0.5 px-1 text-[12px] font-normal rounded border ${
                                    editingCentroCustoTipo === "contrato"
                                      ? "bg-orange-100 border-orange-300 text-orange-700"
                                      : "bg-gray-50 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  Contrato
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCentroCustoTipo("cliente")}
                                  className={`flex-1 py-0.5 px-1 text-[12px] font-normal rounded border ${
                                    editingCentroCustoTipo === "cliente"
                                      ? "bg-blue-100 border-blue-300 text-blue-700"
                                      : "bg-gray-50 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  Cliente
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCentroCustoTipo("empresa")}
                                  className={`flex-1 py-0.5 px-1 text-[12px] font-normal rounded border ${
                                    editingCentroCustoTipo === "empresa"
                                      ? "bg-green-100 border-green-300 text-green-700"
                                      : "bg-gray-50 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  Empresa
                                </button>
                              </div>
                              {/* Select baseado no tipo */}
                              {editingCentroCustoTipo === "contrato" ? (
                                <select
                                  autoFocus
                                  value={l.contrato_id || ''}
                                  onChange={(e) => salvarSelectInline(l.id!, 'centro_custo', e.target.value)}
                                  className="w-full px-1 py-0.5 text-[12px] border border-orange-300 rounded bg-white focus:outline-none"
                                  title="Selecionar contrato"
                                >
                                  <option value="">Sem contrato</option>
                                  {contratos.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.numero} - {(c.pessoas as any)?.nome || c.titulo || 'Cliente'}
                                    </option>
                                  ))}
                                </select>
                              ) : editingCentroCustoTipo === "cliente" ? (
                                <select
                                  autoFocus
                                  value={l.cliente_centro_custo_id || ''}
                                  onChange={(e) => salvarSelectInline(l.id!, 'centro_custo', e.target.value)}
                                  className="w-full px-1 py-0.5 text-[12px] border border-blue-300 rounded bg-blue-50 focus:outline-none"
                                  title="Selecionar cliente"
                                >
                                  <option value="">Selecione cliente</option>
                                  {pessoasClientes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.nome}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  autoFocus
                                  value={l.cliente_centro_custo_id || ''}
                                  onChange={(e) => salvarSelectInline(l.id!, 'centro_custo', e.target.value)}
                                  className="w-full px-1 py-0.5 text-[12px] border border-green-300 rounded bg-green-50 focus:outline-none"
                                  title="Selecionar empresa do grupo"
                                >
                                  <option value="">Selecione empresa</option>
                                  {empresasGrupo.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.nome_fantasia || emp.razao_social}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingSelectField(null)}
                                className="w-full text-[12px] text-gray-400 hover:text-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div
                              className="max-w-[140px] cursor-pointer hover:bg-orange-50 px-1 -mx-1 rounded transition-colors"
                              onClick={() => {
                                // Define o tipo baseado no que já está selecionado
                                if (l.cliente_centro_custo_id) {
                                  // Verificar se é empresa do grupo ou cliente
                                  const isEmpresaGrupo = empresasGrupo.some(emp => emp.id === l.cliente_centro_custo_id);
                                  setEditingCentroCustoTipo(isEmpresaGrupo ? "empresa" : "cliente");
                                } else if (l.contrato_id) {
                                  setEditingCentroCustoTipo("contrato");
                                } else {
                                  setEditingCentroCustoTipo("contrato"); // default
                                }
                                setEditingSelectField({ id: l.id!, field: 'centro_custo' });
                              }}
                              title="Clique para alterar centro de custo"
                            >
                              {codigoContrato ? (
                                <div
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${getNucleoColor(nucleo)}15`,
                                    borderLeft: `3px solid ${getNucleoColor(nucleo)}`
                                  }}
                                >
                                  <div
                                    className="font-normal text-[12px] truncate"
                                    style={{ color: getNucleoColor(nucleo) }}
                                  >
                                    {codigoContrato}
                                  </div>
                                  {(l.contrato as any)?.pessoas?.nome && (
                                    <div className="text-[12px] text-gray-600 truncate">
                                      {(l.contrato as any).pessoas.nome}
                                    </div>
                                  )}
                                </div>
                              ) : clienteCentroCusto ? (
                                <div
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${getNucleoColor(nucleo)}15`,
                                    borderLeft: `3px solid ${getNucleoColor(nucleo)}`
                                  }}
                                >
                                  <div
                                    className="font-normal text-[12px] truncate"
                                    style={{ color: getNucleoColor(nucleo) }}
                                  >
                                    {clienteCentroCusto}
                                  </div>
                                  <div className="text-[12px] text-gray-500">
                                    Cliente direto
                                  </div>
                                </div>
                              ) : nomeProjeto ? (
                                <div className="text-[12px] text-blue-600 truncate">
                                  {nomeProjeto}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-[12px]">Sem centro de custo</span>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Favorecido - Editável - Colaboradores, Fornecedores e Empresas do Grupo */}
                        <td className="px-2 py-1.5">
                          {editingSelectField?.id === l.id && editingSelectField?.field === 'pessoa_id' ? (
                            <div className="space-y-1 max-w-[160px]">
                              {/* Toggle Favorecido/Empresa */}
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingFavorecidoTipo("favorecido")}
                                  className={`flex-1 py-0.5 px-1 text-[12px] font-normal rounded border ${
                                    editingFavorecidoTipo === "favorecido"
                                      ? "bg-orange-100 border-orange-300 text-orange-700"
                                      : "bg-gray-50 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  Favorecido
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingFavorecidoTipo("empresa")}
                                  className={`flex-1 py-0.5 px-1 text-[12px] font-normal rounded border ${
                                    editingFavorecidoTipo === "empresa"
                                      ? "bg-purple-100 border-purple-300 text-purple-700"
                                      : "bg-gray-50 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  Empresa
                                </button>
                              </div>
                              {/* Select baseado no tipo */}
                              {editingFavorecidoTipo === "favorecido" ? (
                                <select
                                  autoFocus
                                  value={l.pessoa_id || ''}
                                  onChange={(e) => salvarSelectInline(l.id!, 'pessoa_id', e.target.value)}
                                  className="w-full px-1 py-0.5 text-[12px] border border-orange-300 rounded bg-white focus:outline-none"
                                  title="Selecionar favorecido (Colaboradores, Fornecedores, Especificadores)"
                                >
                                  <option value="">Sem favorecido</option>
                                  {pessoasFavorecidosPessoas.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nome}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  autoFocus
                                  value={l.pessoa_id || ''}
                                  onChange={(e) => salvarSelectInline(l.id!, 'pessoa_id', e.target.value)}
                                  className="w-full px-1 py-0.5 text-[12px] border border-purple-300 rounded bg-purple-50 focus:outline-none"
                                  title="Selecionar empresa do grupo"
                                >
                                  <option value="">Sem favorecido</option>
                                  {empresasGrupoFormatadas.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.nome}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingSelectField(null)}
                                className="w-full text-[12px] text-gray-400 hover:text-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div
                              className="max-w-[120px] cursor-pointer hover:bg-orange-50 px-1 -mx-1 rounded transition-colors"
                              onClick={() => {
                                // Detectar tipo atual do favorecido
                                // CORREÇÍO: Verificar se pessoa_id existe na tabela empresas_grupo
                                const isEmpresaGrupoFavorecido = empresasGrupo.some(emp => emp.id === l.pessoa_id);
                                if (isEmpresaGrupoFavorecido) {
                                  setEditingFavorecidoTipo("empresa");
                                } else {
                                  setEditingFavorecidoTipo("favorecido");
                                }
                                setEditingSelectField({ id: l.id!, field: 'pessoa_id' });
                              }}
                              title="Clique para alterar favorecido"
                            >
                              {nomeCliente ? (
                                <div
                                  className="text-[12px] font-normal truncate"
                                  style={{ color: nucleo ? getNucleoColor(nucleo) : '#374151' }}
                                >
                                  {nomeCliente}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-[12px]">Clique para definir</span>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Categoria - Editável */}
                        <td className="px-2 py-1.5 text-center">
                          {editingSelectField?.id === l.id && editingSelectField?.field === 'categoria_id' ? (
                            <select
                              autoFocus
                              value={l.categoria_id || ''}
                              onChange={(e) => salvarSelectInline(l.id!, 'categoria_id', e.target.value)}
                              onBlur={() => setEditingSelectField(null)}
                              className="px-1 py-0.5 text-[12px] border border-wg-primary rounded bg-white focus:outline-none"
                              title="Selecionar categoria"
                            >
                              <option value="">Sem categoria</option>
                              {todasCategorias
                                .filter((c) => l.tipo === "entrada" ? c.kind === "income" : c.kind === "expense")
                                .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className="text-[12px] whitespace-nowrap cursor-pointer hover:bg-orange-50 px-1 rounded transition-colors font-normal"
                              style={{ color: nucleo ? getNucleoColor(nucleo) : '#4b5563' }}
                              onClick={() => setEditingSelectField({ id: l.id!, field: 'categoria_id' })}
                              title="Clique para alterar categoria"
                            >
                              {todasCategorias.find(c => c.id === l.categoria_id)?.name || "Clique para definir"}
                            </span>
                          )}
                        </td>
                        {/* Conta */}
                        <td className="px-1 py-1.5 text-center">
                          <span className={`px-1 py-0.5 rounded text-[12px] font-normal ${
                            conta === "R"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {conta}
                          </span>
                        </td>
                        {/* Valor */}
                        <td className="px-2 py-1.5 text-right whitespace-nowrap">
                          {editingField?.id === l.id && editingField?.field === 'valor' ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') salvarEdicaoInline();
                                  if (e.key === 'Escape') cancelarEdicaoInline();
                                }}
                                onBlur={() => salvarEdicaoInline()}
                                autoFocus
                                title="Editar valor"
                                placeholder="0.00"
                                className="w-20 px-1.5 py-0.5 text-[12px] border border-wg-primary rounded bg-white focus:outline-none text-right"
                              />
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={salvarEdicaoInline} className="p-0.5 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                                <Check className="w-3 h-3" />
                              </button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancelarEdicaoInline} className="p-0.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`font-normal text-[12px] cursor-pointer hover:bg-orange-50 px-1 rounded transition-colors ${
                                l.tipo === "entrada" ? "text-green-600" : "text-red-600"
                              }`}
                              title="Clique para editar valor"
                              onClick={() => iniciarEdicaoInline(l.id!, 'valor', String(l.valor_total || 0))}
                            >
                              {l.tipo === "entrada" ? "+" : "-"}{formatarMoeda(Number(l.valor_total))}
                            </span>
                          )}
                        </td>
                        {/* Data CriaçÍo */}
                          <td className="px-1 py-1.5 text-center text-gray-500 text-[12px] whitespace-nowrap">
                            {editingField?.id === l.id && editingField?.field === "data_competencia" ? (
                              <DateInputBR
                                value={l.data_competencia || ""}
                                onChange={(val) => salvarCampoDataInline(l.id!, "data_competencia", val)}
                                onBlur={() => setEditingField(null)}
                                className="w-24 px-1 py-0.5 border border-gray-300 rounded focus:outline-none text-[12px]"
                                placeholder="dd/mm/aaaa"
                                title="Editar data de competência"
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-wg-primary"
                                onClick={() =>
                                  setEditingField({
                                    id: l.id!,
                                    field: "data_competencia",
                                  })
                                }
                                title="Clique para editar a data de competência"
                              >
                                {l.data_competencia
                                  ? formatarData(l.data_competencia)
                                  : "-"}
                              </span>
                            )}
                          </td>
                          {/* Data Vencimento */}
                          <td className="px-1 py-1.5 text-center text-[12px] whitespace-nowrap">
                            {editingField?.id === l.id && editingField?.field === "vencimento" ? (
                              <DateInputBR
                                value={l.vencimento || ""}
                                onChange={(val) => salvarCampoDataInline(l.id!, "vencimento", val)}
                                onBlur={() => setEditingField(null)}
                                className="w-24 px-1 py-0.5 border border-orange-400 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 text-[12px]"
                                placeholder="dd/mm/aaaa"
                                title="Editar data de vencimento"
                                autoFocus
                              />
                            ) : l.vencimento ? (
                              <span
                                className={`cursor-pointer ${
                                  new Date(l.vencimento) < new Date() &&
                                  l.status !== "pago" &&
                                  l.status !== "cancelado"
                                    ? "text-red-600"
                                    : "text-gray-500"
                                }`}
                                onClick={() =>
                                  setEditingField({ id: l.id!, field: "vencimento" })
                                }
                                title="Clique para editar o vencimento"
                              >
                                {formatarData(l.vencimento)}
                              </span>
                            ) : (
                              <span
                                className="text-gray-300 cursor-pointer"
                                onClick={() =>
                                  setEditingField({ id: l.id!, field: "vencimento" })
                                }
                                title="Clique para definir vencimento"
                              >
                                -
                              </span>
                            )}
                          </td>
                          {/* Data Pagamento */}
                          <td className="px-1 py-1.5 text-center text-[12px] whitespace-nowrap">
                            {editingField?.id === l.id && editingField?.field === "data_pagamento" ? (
                              <DateInputBR
                                value={l.data_pagamento || ""}
                                onChange={(val) => salvarCampoDataInline(l.id!, "data_pagamento", val)}
                                onBlur={() => setEditingField(null)}
                                className="w-24 px-1 py-0.5 border border-green-400 rounded focus:outline-none focus:ring-2 focus:ring-green-300 text-[12px]"
                                placeholder="dd/mm/aaaa"
                                title="Editar data de pagamento"
                                autoFocus
                              />
                            ) : l.data_pagamento ? (
                              <span
                                className="text-green-600 font-normal cursor-pointer hover:text-green-700"
                                onClick={() =>
                                  setEditingField({ id: l.id!, field: "data_pagamento" })
                                }
                                title="Clique para editar a data de pagamento"
                              >
                                {formatarData(l.data_pagamento)}
                              </span>
                            ) : (
                              <span
                                className="text-gray-300 cursor-pointer"
                                onClick={() =>
                                  setEditingField({ id: l.id!, field: "data_pagamento" })
                                }
                                title="Clique para definir a data de pagamento"
                              >
                                -
                              </span>
                            )}
                          </td>
                        {/* Status - Clicável para editar */}
                        <td className="px-1 py-1.5 text-center relative">
                          {editingStatusId === l.id ? (
                            <select
                              autoFocus
                              value={l.status || 'previsto'}
                              onChange={(e) => alterarStatus(l.id!, e.target.value as StatusLancamento)}
                              onBlur={() => setEditingStatusId(null)}
                              title="Selecionar status do lançamento"
                              className="text-[12px] px-1 py-0.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#F25C26] cursor-pointer"
                            >
                              <option value="pendente">Pendente</option>
                              <option value="previsto">Previsto</option>
                              <option value="parcial">Parcial</option>
                              <option value="pago">{l.tipo === "entrada" ? "Recebido" : "Pago"}</option>
                              <option value="atrasado">Atrasado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingStatusId(l.id!)}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              title="Clique para alterar status"
                            >
                              {l.status === "pago" ? (
                                l.tipo === "entrada" ? (
                                  <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    Recebido
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                                    <CheckCircle className="w-3 h-3" />
                                    Pago
                                  </span>
                                )
                              ) : l.status === "parcial" ? (
                                <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                  <Calendar className="w-3 h-3" />
                                  Parcial
                                </span>
                              ) : l.status === "atrasado" ? (
                                <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                                  <XCircle className="w-3 h-3" />
                                  Atrasado
                                </span>
                              ) : l.status === "cancelado" ? (
                                <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  <XCircle className="w-3 h-3" />
                                  Cancelado
                                </span>
                              ) : l.status === "pendente" ? (
                                <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
                                  <Calendar className="w-3 h-3" />
                                  Pendente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[12px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                  <Calendar className="w-3 h-3" />
                                  Previsto
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                        {/* Ações */}
                        <td className="px-1 py-1.5">
                          <div className="flex items-center justify-center gap-0.5 relative">
                            {l.status === "previsto" && (
                              <button
                                type="button"
                                onClick={() => marcarPago(l.id!)}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Marcar como pago"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => abrirForm(l)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {/* Menu de mais ações */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActionMenuId(actionMenuId === l.id ? null : l.id!)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Mais ações"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                              {actionMenuId === l.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                                  <button
                                    type="button"
                                    onClick={() => duplicarLancamento(l)}
                                    className="w-full px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Duplicar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(null);
                                      excluir(l.id!);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PaginaçÍo */}
          {lancamentos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span>Exibindo {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, lancamentos.length)} de {lancamentos.length}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded text-[12px]"
                  title="Itens por página"
                >
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                  <option value={200}>200 por página</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-3 py-1 text-[12px] text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Taxa de AdministraçÍo */}
      {showTaxaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-light text-gray-900">Taxa de AdministraçÍo</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Defina a taxa de administraçÍo e gerenciamento</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTaxaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-5">
              {/* Resumo dos selecionados */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Itens selecionados</span>
                  <span className="font-medium text-gray-900">{resumoSelecionados.count}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Total (base de cálculo)</span>
                  <span className="font-medium text-gray-900">R$ {resumoSelecionados.totalAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Resultado (Entradas - Saídas)</span>
                  <span className={`font-medium ${resumoSelecionados.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarMoeda(resumoSelecionados.resultado)}
                  </span>
                </div>
              </div>

              {/* Input da taxa */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                  Taxa de AdministraçÍo e Gerenciamento (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={taxaAdm}
                    onChange={(e) => setTaxaAdm(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[16px] font-medium text-center focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
                    placeholder="15"
                    autoFocus
                  />
                  <span className="text-[18px] font-light text-gray-400">%</span>
                </div>
                {/* Atalhos de taxa */}
                <div className="flex gap-2 mt-3">
                  {[0, 10, 12, 15, 18, 20].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTaxaAdm(String(v))}
                      className={`flex-1 py-1.5 text-[12px] rounded-lg border transition-colors ${
                        taxaAdm === String(v)
                          ? 'bg-primary text-white border-[#F25C26]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
                      }`}
                    >
                      {v === 0 ? 'Sem taxa' : `${v}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview do valor da taxa */}
              {parseFloat(taxaAdm) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[11px] text-orange-700 uppercase font-medium tracking-wide">Valor da Taxa</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {parseFloat(taxaAdm).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}% sobre R$ {resumoSelecionados.totalAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-[20px] font-bold text-[#F25C26]">
                      R$ {((resumoSelecionados.totalAbsoluto * (parseFloat(taxaAdm) || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer com botões */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTaxaModal(false)}
                className="px-4 py-2.5 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={gerarRelatorioCliente}
                className="px-6 py-2.5 text-[13px] font-medium text-white rounded-lg bg-gradient-to-r from-[#F25C26] to-[#e04d1a] hover:opacity-90 transition-all shadow-lg"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criaçÍo/ediçÍo - Layout Melhorado */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-[24px] font-light text-gray-900">
                  {editing ? "Editar Lançamento" : "Novo Lançamento"}
                </h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {editing ? "Atualize as informações do lançamento" : "Preencha os dados para criar um novo lançamento"}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <form onSubmit={salvar} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">

                {/* LINHA 1: Favorecido + Tipo + Núcleo */}
                <div className="grid grid-cols-12 gap-3">
                  {/* Favorecido (6 cols) */}
                  <div className="col-span-12 lg:col-span-6">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">
                      Favorecido <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => { setTipoFavorecido("favorecido"); setFormData((p) => ({ ...p, pessoa_id: "" })); setBuscaFavorecido(""); }}
                        className={`flex-1 py-1.5 px-3 text-[12px] font-normal rounded-md transition-all ${
                          tipoFavorecido === "favorecido" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Favorecido
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTipoFavorecido("empresa"); setFormData((p) => ({ ...p, pessoa_id: "" })); setBuscaFavorecido(""); }}
                        className={`flex-1 py-1.5 px-3 text-[12px] font-normal rounded-md transition-all ${
                          tipoFavorecido === "empresa" ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Empresa
                      </button>
                    </div>
                    {/* Select com busca unificada */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                      <input
                        type="text"
                        value={buscaFavorecido}
                        onChange={(e) => setBuscaFavorecido(e.target.value)}
                        placeholder={formData.pessoa_id ? pessoasFavorecidos.find(f => f.id === formData.pessoa_id)?.nome || "Buscar..." : "Buscar favorecido..."}
                        className={`w-full pl-8 pr-3 py-2 border rounded-md text-[12px] ${tipoFavorecido === "empresa" ? "border-purple-200 bg-purple-50" : "border-gray-200"} ${formData.pessoa_id ? "text-gray-900 font-normal" : ""}`}
                        title="Buscar favorecido"
                        onFocus={() => {
                          setIsFavorecidoOpen(true);
                          setBuscaFavorecido("");
                        }}
                        onBlur={() => setTimeout(() => setIsFavorecidoOpen(false), 150)}
                      />
                      {(isFavorecidoOpen || buscaFavorecido.trim().length > 0) && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                          {favorecidosFiltrados.length > 0 ? (
                            favorecidosFiltrados.map((p) => (
                              <div
                                key={p.id}
                                onMouseDown={() => {
                                  setFormData((prev) => ({ ...prev, pessoa_id: p.id }));
                                  setBuscaFavorecido("");
                                  setIsFavorecidoOpen(false);
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-orange-50 text-[12px] ${formData.pessoa_id === p.id ? "bg-orange-100" : ""}`}
                              >
                                {p.nome} {tipoFavorecido === "favorecido" && p.tipo ? <span className="text-gray-400">({p.tipo})</span> : ""}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-[12px] text-gray-400">Nenhum resultado</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tipo (2 cols) */}
                  <div className="col-span-6 lg:col-span-2">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value as TipoLancamento }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-[12px] mt-[26px]"
                      title="Tipo"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>

                  {/* Núcleo (2 cols) */}
                  <div className="col-span-6 lg:col-span-2">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">Núcleo <span className="text-red-500">*</span></label>
                    <select
                      value={formData.nucleo}
                      onChange={(e) => setFormData((p) => ({ ...p, nucleo: e.target.value as UnidadeNegocio | "", contrato_id: "" }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-[12px] mt-[26px]"
                      required
                      title="Núcleo"
                    >
                      <option value="">Selecione</option>
                      {nucleosDisponiveis.map((n) => (
                        <option key={n} value={n}>{NUCLEOS_LABELS[n]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Conta (2 cols) */}
                  <div className="col-span-12 lg:col-span-2">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">Conta</label>
                    <select
                      value={formData.conta_tipo}
                      onChange={(e) => setFormData((p) => ({ ...p, conta_tipo: e.target.value as "R" | "V" }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-[12px] mt-[26px]"
                      title="Conta"
                    >
                      <option value="R">Real (R)</option>
                      <option value="V">Virtual (V)</option>
                    </select>
                  </div>
                </div>

                {/* LINHA 2: Centro de Custo */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 lg:col-span-6">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">Centro de Custo</label>
                    <div className="flex gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => { setTipoCentroCusto("contrato"); setFormData((p) => ({ ...p, cliente_centro_custo_id: "" })); setBuscaCentroCusto(""); }}
                        className={`flex-1 py-1.5 px-3 text-[12px] font-normal rounded-md transition-all ${
                          tipoCentroCusto === "contrato" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Contrato
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTipoCentroCusto("cliente"); setFormData((p) => ({ ...p, contrato_id: "" })); setBuscaCentroCusto(""); }}
                        className={`flex-1 py-1.5 px-3 text-[12px] font-normal rounded-md transition-all ${
                          tipoCentroCusto === "cliente" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTipoCentroCusto("empresa"); setFormData((p) => ({ ...p, contrato_id: "", cliente_centro_custo_id: "" })); setBuscaCentroCusto(""); }}
                        className={`flex-1 py-1.5 px-3 text-[12px] font-normal rounded-md transition-all ${
                          tipoCentroCusto === "empresa" ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Empresa
                      </button>
                    </div>
                    {/* Select com busca unificada */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                      {tipoCentroCusto === "contrato" ? (
                        <>
                          <input
                            type="text"
                            value={buscaCentroCusto}
                            onChange={(e) => setBuscaCentroCusto(e.target.value)}
                            placeholder={formData.contrato_id
                              ? (() => {
                                  const c = contratosFiltradosBusca.find(c => c.id === formData.contrato_id);
                                  return c ? `${c.numero} - ${Array.isArray(c?.pessoas) ? c?.pessoas?.[0]?.nome : c?.pessoas?.nome || c.titulo}` : "Buscar contrato...";
                                })()
                              : "Buscar contrato..."}
                            className={`w-full pl-8 pr-3 py-2 border rounded-md text-[12px] ${formData.contrato_id ? "border-orange-200 bg-orange-50 font-normal" : "border-gray-200"}`}
                            title="Buscar contrato"
                            onFocus={() => {
                              setIsCentroCustoOpen(true);
                              setBuscaCentroCusto("");
                            }}
                            onBlur={() => setTimeout(() => setIsCentroCustoOpen(false), 150)}
                          />
                          {(isCentroCustoOpen || buscaCentroCusto.trim().length > 0) && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                              <div
                                onMouseDown={() => {
                                  setFormData((p) => ({ ...p, contrato_id: "" }));
                                  setBuscaCentroCusto("");
                                  setIsCentroCustoOpen(false);
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-[12px] text-gray-400 ${!formData.contrato_id ? "bg-gray-100" : ""}`}
                              >
                                Sem contrato vinculado
                              </div>
                              {contratosFiltradosBusca.length > 0 ? (
                                contratosFiltradosBusca.map((c) => (
                                  <div
                                    key={c.id}
                                    onMouseDown={() => {
                                      setFormData((p) => ({ ...p, contrato_id: c.id }));
                                      setBuscaCentroCusto("");
                                      setIsCentroCustoOpen(false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-orange-50 text-[12px] ${formData.contrato_id === c.id ? "bg-orange-100" : ""}`}
                                  >
                                    <span className="font-medium">{c.numero}</span> - {Array.isArray(c?.pessoas) ? c?.pessoas?.[0]?.nome : c?.pessoas?.nome || c.titulo}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-[12px] text-gray-400">Nenhum contrato encontrado</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : tipoCentroCusto === "cliente" ? (
                        <>
                          <input
                            type="text"
                            value={buscaCentroCusto}
                            onChange={(e) => setBuscaCentroCusto(e.target.value)}
                            placeholder={formData.cliente_centro_custo_id
                              ? pessoas.find(c => c.id === formData.cliente_centro_custo_id)?.nome || "Buscar cliente..."
                              : "Buscar cliente..."}
                            className={`w-full pl-8 pr-3 py-2 border rounded-md text-[12px] ${formData.cliente_centro_custo_id ? "border-blue-200 bg-blue-50 font-normal" : "border-gray-200"}`}
                            title="Buscar cliente"
                            onFocus={() => {
                              setIsCentroCustoOpen(true);
                              setBuscaCentroCusto("");
                            }}
                            onBlur={() => setTimeout(() => setIsCentroCustoOpen(false), 150)}
                          />
                          {(isCentroCustoOpen || buscaCentroCusto.trim().length > 0) && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                              <div
                                onMouseDown={() => {
                                  setFormData((p) => ({ ...p, cliente_centro_custo_id: "" }));
                                  setBuscaCentroCusto("");
                                  setIsCentroCustoOpen(false);
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-[12px] text-gray-400 ${!formData.cliente_centro_custo_id ? "bg-gray-100" : ""}`}
                              >
                                Selecione o cliente
                              </div>
                              {clientesFiltradosBusca.length > 0 ? (
                                clientesFiltradosBusca.map((c) => (
                                  <div
                                    key={c.id}
                                    onMouseDown={() => {
                                      setFormData((p) => ({ ...p, cliente_centro_custo_id: c.id }));
                                      setBuscaCentroCusto("");
                                      setIsCentroCustoOpen(false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-[12px] ${formData.cliente_centro_custo_id === c.id ? "bg-blue-100" : ""}`}
                                  >
                                    {c.nome}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-[12px] text-gray-400">Nenhum cliente encontrado</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Empresa do Grupo */
                        <>
                          <select
                            value={formData.cliente_centro_custo_id || ""}
                            onChange={(e) => {
                              const empresaSel = empresasGrupo.find(emp => emp.id === e.target.value);
                              setFormData((p) => ({
                                ...p,
                                cliente_centro_custo_id: e.target.value,
                                // Atualizar núcleo automaticamente se a empresa tiver núcleo definido
                                nucleo: empresaSel?.nucleo_nome as UnidadeNegocio || p.nucleo
                              }));
                            }}
                            className={`w-full pl-8 pr-3 py-2 border rounded-md text-[12px] ${formData.cliente_centro_custo_id ? "border-purple-200 bg-purple-50 font-normal" : "border-gray-200"}`}
                            title="Selecionar empresa do grupo"
                          >
                            <option value="">Selecione a empresa...</option>
                            {empresasGrupo.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.nome_fantasia || emp.razao_social}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DescriçÍo (6 cols) */}
                  <div className="col-span-12 lg:col-span-6">
                    <label className="block text-[12px] font-normal text-gray-600 mb-1">
                      DescriçÍo <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.descricao}
                      onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-[12px] mt-[26px]"
                      required
                      placeholder="Ex: Pagamento de mÍo de obra - Pintura"
                      title="DescriçÍo"
                    />
                  </div>
                </div>

                {/* LINHA 3: Valores e Datas */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-[13px] font-medium text-gray-500 mb-3 uppercase tracking-wide">Valores e Datas</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Valor */}
                    <div>
                      <label className="block text-[12px] font-normal text-gray-700 mb-2">
                        Valor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[12px] font-normal">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.valor}
                          onChange={(e) => setFormData((p) => ({ ...p, valor: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-orange-500"
                          required
                          placeholder="0,00"
                          title="Valor"
                        />
                      </div>
                    </div>

                    {/* Data de Competência */}
                    <div>
                      <label className="block text-[12px] font-normal text-gray-700 mb-2">Competência</label>
                      <DateInputBR
                        value={formData.data_competencia}
                        onChange={(val) => setFormData((p) => ({ ...p, data_competencia: val }))}
                        disabled
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-100 text-[12px]"
                        title="Data de competência"
                      />
                    </div>

                    {/* Vencimento */}
                    <div>
                      <label className="block text-[12px] font-normal text-gray-700 mb-2">Vencimento</label>
                      <DateInputBR
                        value={formData.vencimento}
                        onChange={(val) => setFormData((p) => ({ ...p, vencimento: val }))}
                        className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-lg text-[12px] focus:ring-2 focus:ring-orange-500 bg-orange-50"
                        title="Data de vencimento"
                      />
                    </div>

                    {/* Data de Pagamento */}
                    <div>
                      <label className="block text-[12px] font-normal text-gray-700 mb-2">
                        Data Pagamento
                        <span className="ml-1 text-[12px] text-gray-400">(efetivo)</span>
                      </label>
                      <DateInputBR
                        value={formData.data_pagamento}
                        onChange={(val) => setFormData((p) => ({ ...p, data_pagamento: val }))}
                        className="w-full px-4 py-2.5 border-2 border-green-200 rounded-lg text-[12px] focus:ring-2 focus:ring-green-500 bg-green-50"
                        title="Data em que o pagamento foi efetivamente realizado"
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÍO 5: CategorizaçÍo e Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Categoria Hierarquica */}
                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[12px] text-gray-400 mb-2">Selecione a categoria financeira</p>
                    <CategoriaHierarquicaSelect
                      tipo={formData.tipo === "entrada" ? "income" : "expense"}
                      nucleo={formData.nucleo || undefined}
                      value={formData.categoria_id || null}
                      onChange={(id) => setFormData((p) => ({ ...p, categoria_id: id || "" }))}
                      placeholder="Selecione uma categoria..."
                      nivelMinimo={2}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[12px] font-normal text-gray-700 mb-1">Status</label>
                    <p className="text-[12px] text-gray-400 mb-2">SituaçÍo atual</p>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as StatusLancamento }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-[12px] font-normal focus:ring-2 focus:ring-orange-500"
                      title="Status"
                    >
                      <option value="pendente">⏳ Pendente</option>
                      <option value="previsto">📅 Previsto</option>
                      <option value="parcial">🔄 Parcialmente Pago</option>
                      <option value="pago">✅ Pago</option>
                      <option value="recebido">✅ Recebido</option>
                      <option value="atrasado">⚠️ Atrasado</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* SEÇÍO 6: Observações */}
                <div>
                  <label className="block text-[12px] font-normal text-gray-700 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[12px] focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Informações adicionais (opcional)"
                    title="Observações"
                  />
                </div>
              </div>

              {/* Footer com botões */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharForm}
                  className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 text-[13px] font-normal hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-[13px] font-normal hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all"
                >
                  {editing ? "💾 Salvar Alterações" : "✨ Criar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importar Comprovante */}
      {isImportHubOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-light text-gray-900">Importar</h3>
                <p className="text-[12px] text-gray-500">Escolha a melhor forma de importar seus lançamentos</p>
              </div>
              <button
                onClick={() => setIsImportHubOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setImportTab('comprovante')}
                className={`px-4 py-2 rounded-t-md text-[12px] font-normal ${
                  importTab === 'comprovante'
                    ? 'bg-white border border-b-0 border-gray-200 text-wg-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Comprovante
              </button>
              <button
                onClick={() => setImportTab('lancamentos')}
                className={`px-4 py-2 rounded-t-md text-[12px] font-normal ${
                  importTab === 'lancamentos'
                    ? 'bg-white border border-b-0 border-gray-200 text-wg-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Lançamentos (CSV/Excel)
              </button>
            </div>

            <div className="p-5 space-y-4">
              {importTab === 'comprovante' && (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <h4 className="text-[13px] font-normal text-orange-800 mb-1">Importar a partir de Comprovante</h4>
                    <p className="text-[12px] text-orange-700">
                      Cole o texto do comprovante (PIX, TED, boleto) e o sistema extrai valor, data, favorecido e descriçÍo.
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[12px] text-gray-700">
                      <p className="font-normal text-gray-900">AutomaçÍo</p>
                      <ul className="list-disc list-inside text-[12px] text-gray-600 space-y-1">
                        <li>Identifica entrada/saída pela descriçÍo do comprovante</li>
                        <li>Preenche valor, data, favorecido e banco</li>
                        <li>Gera observaçÍo com ID da transaçÍo</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setIsImportHubOpen(false);
                        setIsImportModalOpen(true);
                      }}
                      className="px-4 py-2 bg-wg-primary text-white rounded-lg text-[13px] hover:bg-wg-primary/90"
                    >
                      Iniciar importaçÍo de comprovante
                    </button>
                  </div>
                </div>
              )}

              {importTab === 'lancamentos' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-[13px] font-normal text-blue-800 mb-1">Importar planilha de lançamentos</h4>
                    <p className="text-[12px] text-blue-700">
                      Use o modelo completo (CSV/Excel). O importador tenta casar automaticamente Categoria, Centro de Custo, Núcleo, Projeto, Favorecido, Conta e Status.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-gray-700">
                    <div className="p-3 bg-white border border-gray-100 rounded-lg">
                      <p className="font-normal text-gray-900 mb-1">Métrica de match</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nome exato ou parcial para Categoria/Projeto/Favorecido</li>
                        <li>Centro de Custo por nome ou código</li>
                        <li>Conta por nome ou número</li>
                        <li>Núcleo normalizado (ENG, ARQ, MARC, GERAL)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-lg">
                      <p className="font-normal text-gray-900 mb-1">Atalhos</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Exportar modelo direto da tela de importaçÍo</li>
                        <li>Preview com confiança e duplicatas</li>
                        <li>Campos de status, vencimento e pagamento lidos da planilha</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[12px] text-gray-700">Abrir importador avançado</p>
                    <a
                      href="/financeiro/importar-extrato"
                      className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] hover:bg-primary-dark"
                    >
                      Ir para Importar Lançamentos
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de AtualizaçÍo em Lote - Inteligente */}
      {modalAtualizacaoLote.aberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4">
              <h3 className="text-[18px] font-light text-white flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Aplicar para todos?
              </h3>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-gray-700 mb-4">
                Você alterou o <strong>{modalAtualizacaoLote.labelCampo}</strong> para:
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-4">
                <span className="font-normal text-purple-800 text-[13px]">
                  {modalAtualizacaoLote.labelValor || '(vazio)'}
                </span>
              </div>
              <p className="text-gray-600 text-[12px]">
                Existem mais <strong className="text-purple-700">{modalAtualizacaoLote.outrosIds.length}</strong> lançamentos
                com o mesmo filtro. Deseja aplicar essa mesma alteraçÍo a todos eles?
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={fecharModalAtualizacaoLote}
                className="px-4 py-2 text-[13px] font-normal text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                NÍo, apenas este
              </button>
              <button
                type="button"
                onClick={aplicarAlteracaoEmLote}
                className="px-4 py-2 text-[13px] font-normal text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Sim, aplicar a todos ({modalAtualizacaoLote.outrosIds.length + 1})
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportarComprovanteModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportar={async (dados: DadosLancamentoExtraido) => {
          // Preencher formulário com dados extraídos
          setEditing(null);
          setFormData({
            pessoa_id: "",
            tipo: dados.tipo === "receita" ? "entrada" : "saida",
            nucleo: "" as UnidadeNegocio | "",
            contrato_id: "",
            cliente_centro_custo_id: "",
            descricao: dados.descricao,
            valor: String(dados.valor),
            categoria_id: "",
            subcategoria: "",
            status: "previsto",
            data_competencia: dados.data ? dados.data.toISOString().split("T")[0] : getTodayISO(),
            vencimento: dados.data ? dados.data.toISOString().split("T")[0] : getTodayISO(),
            data_pagamento: dados.data ? dados.data.toISOString().split("T")[0] : getTodayISO(),
            projeto_id: "",
            observacoes: `Importado de comprovante ${dados.formaPagamento}\nID: ${dados.idTransacao}\nFavorecido: ${dados.favorecido}\nBanco: ${dados.banco}`,
            conta_tipo: "R",
          });
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}




