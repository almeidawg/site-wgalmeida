/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo, useCallback } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Pessoa, PessoaTipo, PessoaStatus } from "@/types/pessoas";
import { listarPessoasComDataVinculo, deletarPessoa, mesclarPessoas, atualizarPessoa } from "@/lib/pessoasApi";
import { gerarFichaClientePDF } from "@/lib/pdfFichaCliente";
import PessoaCard from "./PessoaCard";
import { BotaoGerarLink } from "@/components/cadastro-link/GerarLinkCadastroModal";
import { criarLinkCadastro, type TipoCadastro } from "@/lib/cadastroLinkApi";
import { Search, Calendar, Users, CheckSquare, GitMerge, CheckCircle, Eye, EyeOff, X, Plus, Filter, FileText, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type OrdenacaoTipo = "vinculo_asc" | "vinculo_desc" | "nome_asc" | "nome_desc" | "recente";

interface PessoasListProps {
  tipo: PessoaTipo | PessoaTipo[];
  titulo: string;
  descricao?: string;
  novoPath: string;
  corModulo?: string;
  ocultarBotoesHeader?: boolean;
  resolverPath?: (pessoa: Pessoa, acao: "editar" | "visualizar" | "novo") => string;
}

export default function PessoasList({
  tipo,
  titulo,
  descricao,
  novoPath,
  corModulo = "#F25C26",
  ocultarBotoesHeader = false,
  resolverPath,
}: PessoasListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pessoas, setPessoas] = useState<(Pessoa & { data_vinculo?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("nome_asc");

  // Estados de seleçÍo
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Estados de filtros
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);

  // Estado para modal de mesclagem
  const [mesclando, setMesclando] = useState(false);
  const [modalMesclar, setModalMesclar] = useState<{
    pessoa1: Pessoa | null;
    pessoa2: Pessoa | null;
    etapa: 'escolher' | 'confirmar' | null;
    escolhido: '1' | '2' | null;
  }>({ pessoa1: null, pessoa2: null, etapa: null, escolhido: null });

  // Determina se é cliente (para mostrar toggle de concluídos)
  const tiposFiltro = useMemo(() => (Array.isArray(tipo) ? tipo : [tipo]), [tipo]);
  const isCliente = tiposFiltro.length === 1 && tiposFiltro[0] === "CLIENTE";
  // Determina se deve mostrar toggle de ativos (para outros tipos)
  const mostrarToggleAtivo = !isCliente;
  const tipoCadastroHeader = (Array.isArray(tipo) ? tipo[0] : tipo).toUpperCase() as TipoCadastro;

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      // Se mostrarInativos é true, não filtrar por ativo
      // Se mostrarConcluidos é true para clientes, incluir concluídos
      const respostas = await Promise.all(
        tiposFiltro.map((tipoAtual) =>
          listarPessoasComDataVinculo({
            tipo: tipoAtual,
            ativo: mostrarInativos ? undefined : true,
            incluirConcluidos: mostrarConcluidos,
          })
        )
      );
      const data = respostas.flat();
      const unicos = Array.from(new Map(data.map((p) => [p.id, p])).values());
      
      // DEBUG: Log para verificar avatares carregados
      if (data.length > 0) {
        console.log("[PessoasList] Pessoas carregadas:", data.length);
        const pessoasComAvatar = data.filter(p => p.avatar_url || p.foto_url || p.avatar);
        console.log("[PessoasList] Pessoas com avatar:", pessoasComAvatar.length);
        if (pessoasComAvatar.length > 0) {
          console.log("[PessoasList] Exemplo de avatar:", {
            nome: pessoasComAvatar[0].nome,
            avatar_url: pessoasComAvatar[0].avatar_url,
            foto_url: pessoasComAvatar[0].foto_url,
            avatar: pessoasComAvatar[0].avatar?.substring(0, 50)
          });
        }
      }
      
      setPessoas(unicos);
      setErro(null);
    } catch (e: any) {
      setErro(e.message ?? "Erro ao carregar cadastro.");
    } finally {
      setLoading(false);
    }
  }, [tiposFiltro, mostrarInativos, mostrarConcluidos]);

  // Recarrega quando: tipo muda, filtros mudam, ou navegaçÍo ocorre (location.key muda)
  useEffect(() => {
    carregar();
  }, [carregar, location.key]);

  // Normalizar texto (remover acentos e converter para minúsculas)
  const normalizar = (texto: string | null | undefined): string => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim();
  };

  // Filtrar e ordenar pessoas
  const pessoasFiltradas = useMemo(() => {
    let resultado = [...pessoas];

    // Filtrar por busca (flexível - ignora acentos e maiúsculas)
    if (busca.trim()) {
      const termoNormalizado = normalizar(busca);
      const termos = termoNormalizado.split(" ").filter(t => t.length > 0);

      resultado = resultado.filter((p) => {
        const nomeNorm = normalizar(p.nome);
        const emailNorm = normalizar(p.email);
        const telefoneNorm = normalizar(p.telefone);
        const cpfNorm = normalizar(p.cpf);
        const cnpjNorm = normalizar(p.cnpj);
        const cargoNorm = normalizar(p.cargo);
        const empresaNorm = normalizar(p.empresa);
        const categoriaNorm = normalizar(p.categoria);

        // Todos os termos devem estar presentes em algum campo
        return termos.every(termo =>
          nomeNorm.includes(termo) ||
          emailNorm.includes(termo) ||
          telefoneNorm.includes(termo) ||
          cpfNorm.includes(termo) ||
          cnpjNorm.includes(termo) ||
          cargoNorm.includes(termo) ||
          empresaNorm.includes(termo) ||
          categoriaNorm.includes(termo)
        );
      });
    }

    // Ordenar
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case "vinculo_asc":
          // Data de vínculo mais antiga primeiro
          if (a.data_vinculo && !b.data_vinculo) return -1;
          if (!a.data_vinculo && b.data_vinculo) return 1;
          if (a.data_vinculo && b.data_vinculo) {
            return new Date(a.data_vinculo).getTime() - new Date(b.data_vinculo).getTime();
          }
          return a.nome.localeCompare(b.nome);

        case "vinculo_desc":
          // Data de vínculo mais recente primeiro
          if (a.data_vinculo && !b.data_vinculo) return -1;
          if (!a.data_vinculo && b.data_vinculo) return 1;
          if (a.data_vinculo && b.data_vinculo) {
            return new Date(b.data_vinculo).getTime() - new Date(a.data_vinculo).getTime();
          }
          return a.nome.localeCompare(b.nome);

        case "nome_asc":
          return a.nome.localeCompare(b.nome);

        case "nome_desc":
          return b.nome.localeCompare(a.nome);

        case "recente":
          // Mais recente (criado_em) primeiro
          return new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime();

        default:
          return 0;
      }
    });

    return resultado;
  }, [pessoas, busca, ordenacao]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = pessoas.length;
    const comVinculo = pessoas.filter(p => p.data_vinculo).length;
    const inativos = pessoas.filter(p => !p.ativo).length;
    const concluidos = pessoas.filter(p => p.status === "concluido").length;
    return { total, comVinculo, inativos, concluidos };
  }, [pessoas]);

  const handleEdit = (pessoa: Pessoa) => {
    const editPath = resolverPath
      ? resolverPath(pessoa, "editar")
      : novoPath.replace("/novo", `/editar/${pessoa.id}`);
    navigate(editPath);
  };

  const handleDelete = async (pessoa: Pessoa) => {
    if (!confirm(`Deseja realmente excluir ${pessoa.nome}?`)) return;

    try {
      await deletarPessoa(pessoa.id);
      setPessoas((prev) => prev.filter((p) => p.id !== pessoa.id));
    } catch (e: any) {
      alert(e.message ?? "Erro ao excluir");
    }
  };

  const handleView = (pessoa: Pessoa) => {
    const viewPath = resolverPath
      ? resolverPath(pessoa, "visualizar")
      : novoPath.replace("/novo", `/${pessoa.id}`);
    navigate(viewPath);
  };

  const handleLinkAtualizacao = async (pessoa: Pessoa) => {
    try {
      const tipoCadastro = pessoa.tipo as TipoCadastro;
      const result = await criarLinkCadastro({
        tipo: tipoCadastro,
        pessoaAlvoId: pessoa.id,
        descricaoLink: "atualizacao_cadastral",
        tituloPagina: `Atualizacao cadastral - ${pessoa.nome}`,
      });
      await navigator.clipboard.writeText(result.url);
      alert(`Link de atualizaçÍo gerado e copiado para ${pessoa.nome}.`);
    } catch (e: any) {
      alert(e?.message || "Erro ao gerar link de atualizaçÍo");
    }
  };

  const handlePdf = async (pessoa: Pessoa) => {
    try {
      await gerarFichaClientePDF({ pessoaId: pessoa.id, pessoa });
    } catch (error) {
      console.error("Erro ao gerar PDF do cliente:", error);
      const message =
        error instanceof Error
          ? error.message
          : "não foi possível gerar o PDF.";
      alert(message);
    }
  };

  const handleVerPropostas = (pessoa: Pessoa) => {
    navigate(`/propostas/cliente/${pessoa.id}`);
  };

  // Handlers de seleçÍo
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (pessoaId: string, selected: boolean) => {
    console.log("[Selecao] handleSelect chamado:", pessoaId, selected);
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(pessoaId);
    } else {
      newSet.delete(pessoaId);
    }
    console.log("[Selecao] Novo tamanho:", newSet.size, Array.from(newSet));
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    const allIds = new Set(pessoasFiltradas.map(p => p.id));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Handler de mesclagem - abre o modal
  const handleMesclar = () => {
    console.log("[Mesclar] Iniciando... selectedIds:", selectedIds.size, Array.from(selectedIds));

    if (selectedIds.size !== 2) {
      return;
    }

    const ids = Array.from(selectedIds);
    const pessoa1 = pessoas.find(p => p.id === ids[0]) || null;
    const pessoa2 = pessoas.find(p => p.id === ids[1]) || null;

    console.log("[Mesclar] Pessoas encontradas:", pessoa1?.nome, pessoa2?.nome);

    if (!pessoa1 || !pessoa2) {
      return;
    }

    // Abrir modal de mesclagem
    setModalMesclar({ pessoa1, pessoa2, etapa: 'escolher', escolhido: null });
  };

  // Executar mesclagem após confirmaçÍo no modal
  const executarMesclagem = async () => {
    const { pessoa1, pessoa2, escolhido } = modalMesclar;
    if (!pessoa1 || !pessoa2 || !escolhido) return;

    const destinoId = escolhido === "1" ? pessoa1.id : pessoa2.id;
    const origemId = escolhido === "1" ? pessoa2.id : pessoa1.id;

    setMesclando(true);
    setModalMesclar({ pessoa1: null, pessoa2: null, etapa: null, escolhido: null });

    try {
      const resultado = await mesclarPessoas(destinoId, origemId);
      console.log("[Mesclar] Sucesso:", resultado);
      // Recarregar lista
      await carregar();
      setSelectionMode(false);
      setSelectedIds(new Set());
    } catch (e: any) {
      console.error("[Mesclar] Erro:", e);
    } finally {
      setMesclando(false);
    }
  };

  // Fechar modal de mesclagem
  const fecharModalMesclar = () => {
    setModalMesclar({ pessoa1: null, pessoa2: null, etapa: null, escolhido: null });
  };

  // Handler para marcar como concluído (clientes)
  const handleMarcarConcluido = async () => {
    if (selectedIds.size === 0) return;

    const nomes = Array.from(selectedIds)
      .map(id => pessoas.find(p => p.id === id)?.nome)
      .filter(Boolean)
      .join(", ");

    if (!confirm(`Marcar como concluído:\n${nomes}\n\nEles não aparecerÍo mais nas buscas do sistema.`)) {
      return;
    }

    setMesclando(true);
    try {
      for (const id of selectedIds) {
        await atualizarPessoa(id, { status: "concluido" as PessoaStatus });
      }
      await carregar();
      setSelectionMode(false);
      setSelectedIds(new Set());
      alert("Cadastros marcados como concluídos.");
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setMesclando(false);
    }
  };

  // Handler para reativar clientes concluídos
  const handleReativarConcluido = async () => {
    if (selectedIds.size === 0) return;

    const selecionados = Array.from(selectedIds)
      .map((id) => pessoas.find((p) => p.id === id))
      .filter(Boolean) as Pessoa[];

    const concluidos = selecionados.filter((p) => p.status === "concluido");
    if (concluidos.length === 0) {
      alert("Selecione ao menos 1 cliente concluído para reativar.");
      return;
    }

    const nomes = concluidos.map((p) => p.nome).join(", ");
    if (!confirm(`Reativar clientes concluídos:\n${nomes}`)) {
      return;
    }

    setMesclando(true);
    try {
      for (const pessoa of concluidos) {
        await atualizarPessoa(pessoa.id, {
          status: "ativo" as PessoaStatus,
          ativo: true,
        });
      }
      await carregar();
      setSelectionMode(false);
      setSelectedIds(new Set());
      alert("Clientes reativados com sucesso.");
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setMesclando(false);
    }
  };

  // Handler para marcar como ativo/inativo
  const handleToggleAtivo = async (ativo: boolean) => {
    if (selectedIds.size === 0) return;

    const nomes = Array.from(selectedIds)
      .map(id => pessoas.find(p => p.id === id)?.nome)
      .filter(Boolean)
      .join(", ");

    const acao = ativo ? "ativar" : "desativar";
    if (!confirm(`${ativo ? "Ativar" : "Desativar"} cadastros:\n${nomes}`)) {
      return;
    }

    setMesclando(true);
    try {
      for (const id of selectedIds) {
        await atualizarPessoa(id, { ativo });
      }
      await carregar();
      setSelectionMode(false);
      setSelectedIds(new Set());
      alert(`Cadastros ${ativo ? "ativados" : "desativados"}.`);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setMesclando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header com titulo e botoes */}
      {!ocultarBotoesHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${corModulo}, ${corModulo}dd)` }}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-light tracking-tight text-gray-900">{titulo}</h1>
              {descricao && (
                <p className="text-[12px] text-gray-600">{descricao}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <BotaoGerarLink tipo={tipoCadastroHeader} />
            <button
              type="button"
              onClick={() => {
                if (resolverPath) {
                  navigate(
                    resolverPath(
                      {
                        id: "",
                        nome: "",
                        email: "",
                        tipo: tiposFiltro[0],
                        ativo: true,
                      } as Pessoa,
                      "novo"
                    )
                  );
                  return;
                }
                navigate(novoPath);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
              style={{ background: `linear-gradient(135deg, ${corModulo}, ${corModulo}dd)` }}
            >
              <Plus className="w-5 h-5" />
              Novo cadastro
            </button>
          </div>
        </div>
      )}

      {/* Cards de Estatisticas */}
      {!loading && pessoas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.total}</span>
              <span className="text-[12px] text-gray-500">Cadastros</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md" style={{ backgroundColor: `${corModulo}15` }}>
                <Calendar className="w-4 h-4" style={{ color: corModulo }} />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.comVinculo}</span>
              <span className="text-[12px] text-gray-500">Com historico</span>
            </div>
          </div>

          {mostrarInativos && stats.inativos > 0 && (
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-md">
                  <EyeOff className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-[18px] font-light text-gray-900">{stats.inativos}</span>
                <span className="text-[12px] text-gray-500">Inativos</span>
              </div>
            </div>
          )}

          {mostrarConcluidos && stats.concluidos > 0 && (
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-[18px] font-light text-gray-900">{stats.concluidos}</span>
                <span className="text-[12px] text-gray-500">Concluidos</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca e Ordenacao */}
          <div className="flex items-center gap-4">
            {/* Campo de Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone, CPF ou CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ "--tw-ring-color": `${corModulo}40` } as CSSProperties}
              />
            </div>

            {/* Ordenacao */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                title="Ordenar cadastros"
                aria-label="Ordenar cadastros"
              >
                <option value="nome_asc">Nome A-Z</option>
                <option value="nome_desc">Nome Z-A</option>
                <option value="vinculo_desc">Vinculo mais recente</option>
                <option value="vinculo_asc">Vinculo mais antigo</option>
                <option value="recente">Cadastro recente</option>
              </select>
            </div>
          </div>

          {/* Linha 2: Toggles e Modo de Selecao */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Toggle de inativos (para fornecedores, especificadores, colaboradores) */}
            {mostrarToggleAtivo && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={mostrarInativos}
                  onCheckedChange={setMostrarInativos}
                  id="mostrar-inativos"
                />
                <label htmlFor="mostrar-inativos" className="text-[12px] text-gray-600 cursor-pointer">
                  Mostrar inativos
                </label>
              </div>
            )}

            {/* Toggle de concluidos (para clientes) */}
            {isCliente && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={mostrarConcluidos}
                  onCheckedChange={setMostrarConcluidos}
                  id="mostrar-concluidos"
                />
                <label htmlFor="mostrar-concluidos" className="text-[12px] text-gray-600 cursor-pointer">
                  Mostrar concluidos
                </label>
              </div>
            )}

            {/* Botao de modo de selecao */}
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-normal transition ${
                selectionMode
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={selectionMode ? { backgroundColor: corModulo } : {}}
            >
              <CheckSquare size={14} />
              {selectionMode ? "Cancelar selecao" : "Selecionar"}
            </button>
          </div>

          {/* Linha 3: Acoes de selecao (quando em modo de selecao) */}
          {selectionMode && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[12px] text-gray-600">
                {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
              </span>

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1.5 text-[11px] rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-[11px] rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Limpar selecao
                </button>
              </div>

              {/* Acoes de selecao */}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4 border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-4 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleMesclar()}
                  disabled={selectedIds.size !== 2 || mesclando}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] rounded bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Selecione exatamente 2 cadastros para mesclar (atual: ${selectedIds.size})`}
                >
                  <GitMerge size={14} />
                  Mesclar ({selectedIds.size})
                </button>

                {isCliente && (
                  <button
                    type="button"
                    onClick={handleMarcarConcluido}
                    disabled={selectedIds.size === 0 || mesclando}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={14} />
                    Concluido
                  </button>
                )}

                {isCliente && (
                  <button
                    type="button"
                    onClick={handleReativarConcluido}
                    disabled={selectedIds.size === 0 || mesclando}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] rounded bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye size={14} />
                    Reativar
                  </button>
                )}

                {mostrarToggleAtivo && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(true)}
                      disabled={selectedIds.size === 0 || mesclando}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={14} />
                      Ativar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(false)}
                      disabled={selectedIds.size === 0 || mesclando}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] rounded bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeOff size={14} />
                      Desativar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${corModulo} transparent transparent transparent` }}
            />
            <p className="text-[12px] text-gray-500">Carregando cadastros...</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <p className="text-[12px] text-red-600">{erro}</p>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !erro && pessoas.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">Nenhum cadastro ainda</h3>
          <p className="text-[12px] text-gray-500 mb-6">Comece criando seu primeiro cadastro.</p>
          <button
            onClick={() => {
              if (resolverPath) {
                navigate(
                  resolverPath(
                    {
                      id: "",
                      nome: "",
                      email: "",
                      tipo: tiposFiltro[0],
                      ativo: true,
                    } as Pessoa,
                    "novo"
                  )
                );
                return;
              }
              navigate(novoPath);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all"
            style={{ backgroundColor: corModulo }}
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Cadastro
          </button>
        </div>
      )}

      {/* Busca sem resultados */}
      {!loading && !erro && pessoas.length > 0 && pessoasFiltradas.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">Nenhum resultado encontrado</h3>
          <p className="text-[12px] text-gray-500">Tente ajustar os filtros de busca para "{busca}"</p>
        </div>
      )}

      {/* Contador de resultados */}
      {!loading && busca && pessoasFiltradas.length > 0 && (
        <div className="text-[12px] text-gray-500">
          {pessoasFiltradas.length} resultado{pessoasFiltradas.length !== 1 ? "s" : ""} encontrado{pessoasFiltradas.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Lista de Cards */}
      <div className="grid gap-4">
        {pessoasFiltradas.map((p) => (
          <PessoaCard
            key={p.id}
            pessoa={p}
            onClick={() => handleView(p)}
            onEdit={() => handleEdit(p)}
            onDelete={() => handleDelete(p)}
            onPdf={() => handlePdf(p)}
            onVerPropostas={() => handleVerPropostas(p)}
            onLinkAtualizacao={() => handleLinkAtualizacao(p)}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(p.id)}
            onSelect={(selected) => handleSelect(p.id, selected)}
            corModulo={corModulo}
          />
        ))}
      </div>

      {/* Modal de Mesclagem */}
      {modalMesclar.etapa && modalMesclar.pessoa1 && modalMesclar.pessoa2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-600" />
                <h3 className="text-[18px] font-light text-gray-900">Mesclar Cadastros</h3>
              </div>
              <button
                type="button"
                onClick={fecharModalMesclar}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {modalMesclar.etapa === 'escolher' && (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecione qual cadastro deseja <strong>MANTER</strong>. O outro será excluído e seus vínculos transferidos.
                  </p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setModalMesclar(prev => ({ ...prev, etapa: 'confirmar', escolhido: '1' }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="font-normal text-gray-900 text-[13px]">{modalMesclar.pessoa1.nome}</div>
                      <div className="text-sm text-gray-500">{modalMesclar.pessoa1.email || "Sem email"}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMesclar(prev => ({ ...prev, etapa: 'confirmar', escolhido: '2' }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="font-normal text-gray-900 text-[13px]">{modalMesclar.pessoa2.nome}</div>
                      <div className="text-sm text-gray-500">{modalMesclar.pessoa2.email || "Sem email"}</div>
                    </button>
                  </div>
                </>
              )}

              {modalMesclar.etapa === 'confirmar' && modalMesclar.escolhido && (
                <>
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <div className="text-[12px] text-purple-600 font-normal mb-2">MANTER:</div>
                    <div className="font-normal text-gray-900 text-[13px]">
                      {modalMesclar.escolhido === '1' ? modalMesclar.pessoa1.nome : modalMesclar.pessoa2.nome}
                    </div>
                  </div>
                  <div className="mb-4 p-4 bg-red-50 rounded-lg">
                    <div className="text-[12px] text-red-600 font-normal mb-2">EXCLUIR:</div>
                    <div className="font-normal text-gray-900 text-[13px]">
                      {modalMesclar.escolhido === '1' ? modalMesclar.pessoa2.nome : modalMesclar.pessoa1.nome}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Todos os vínculos (contratos, lançamentos, etc.) serÍo transferidos para o cadastro mantido.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
              {modalMesclar.etapa === 'escolher' && (
                <button
                  type="button"
                  onClick={fecharModalMesclar}
                  className="px-4 py-2 text-[12px] font-normal text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
              )}
              {modalMesclar.etapa === 'confirmar' && (
                <>
                  <button
                    type="button"
                    onClick={() => setModalMesclar(prev => ({ ...prev, etapa: 'escolher', escolhido: null }))}
                    className="px-4 py-2 text-[12px] font-normal text-gray-600 hover:text-gray-800"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={executarMesclagem}
                    disabled={mesclando}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg text-[13px] font-normal hover:bg-purple-700 disabled:opacity-50"
                  >
                    {mesclando ? "Mesclando..." : "Confirmar Mesclagem"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


