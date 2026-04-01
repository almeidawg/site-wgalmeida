/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  ExternalLink,
  FolderOpen,
  Loader2,
  Mail,
  MessageCircle,
  PlusCircle,
  Search,
  Trash2,
  UserPlus,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClientesArea, type ClienteAreaInfo } from "@/hooks/useClientesArea";
import { BotaoGerarLink } from "@/components/cadastro-link/GerarLinkCadastroModal";
import Avatar from "@/components/common/Avatar";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

interface ClienteDisponivel {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
}

const formatPhoneDigits = (telefone?: string | null) =>
  (telefone || "").replace(/\D/g, "");

// Gera senha dinâmica baseada no cliente: primeiras 3 letras do nome + últimos 4 dígitos do telefone
const gerarSenhaCliente = (nome: string, telefone?: string | null): string => {
  const nomeClean = nome.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const prefixo = nomeClean.substring(0, 3) || "wg";
  const telefoneDigitos = (telefone || "").replace(/\D/g, "");
  const sufixo = telefoneDigitos.slice(-4) || "2025";
  return `${prefixo}${sufixo}`;
};

// Chama Edge Function para criar usuário Auth para o cliente
interface CriarUsuarioResult {
  sucesso: boolean;
  ja_existia?: boolean;
  auth_user_id?: string;
  usuario_id?: string;
  mensagem?: string;
  erro?: string;
}

const criarUsuarioAuthCliente = async (
  cliente: { id: string; nome: string; email?: string | null; telefone?: string | null }
): Promise<CriarUsuarioResult> => {
  if (!cliente.email) {
    return { sucesso: false, erro: "Cliente nÍo possui e-mail cadastrado" };
  }

  const senha = gerarSenhaCliente(cliente.nome, cliente.telefone);

  try {
    const { data, error } = await supabase.functions.invoke("criar-usuario-admin", {
      body: {
        email: cliente.email,
        senha: senha,
        pessoa_id: cliente.id,
        tipo_usuario: "CLIENTE",
        nome: cliente.nome,
        telefone: cliente.telefone,
      },
    });

    if (error) {
      console.error("[AreaCliente] Erro ao invocar Edge Function:", error);
      return { sucesso: false, erro: error.message };
    }

    return data as CriarUsuarioResult;
  } catch (err) {
    console.error("[AreaCliente] Erro inesperado:", err);
    return { sucesso: false, erro: String(err) };
  }
};

export default function AreaClienteCadastroPage() {
  const navigate = useNavigate();
  const { clientes, loading, setClientes, reload } = useClientesArea();
  const { toast } = useToast();
  const [lista, setLista] = useState<ClienteAreaInfo[]>([]);

  // Modal adicionar cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientesDisponiveis, setClientesDisponiveis] = useState<
    ClienteDisponivel[]
  >([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteDisponivel | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    tipo: "sucesso" | "aviso" | "erro";
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    setLista(clientes);
  }, [clientes]);

  const ativos = useMemo(
    () => lista.filter((item) => item.acessoLiberado).length,
    [lista]
  );

  // Buscar clientes cadastrados na tabela pessoas
  const buscarClientesDisponiveis = async (termo: string) => {
    if (termo.length < 2) {
      setClientesDisponiveis([]);
      return;
    }

    setLoadingClientes(true);
    try {
      const idsJaNaLista = lista.map((c) => c.id);

      // Buscar pessoas pelo nome
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, avatar_url, foto_url")
        .ilike("nome", `%${termo}%`)
        .order("nome")
        .limit(30);

      if (error) {
        console.error("Erro na query:", error);
        throw error;
      }

      // Filtrar os que ainda nÍo estÍo na lista
      const disponiveis = (data || []).filter(
        (p) => !idsJaNaLista.includes(p.id)
      );

      setClientesDisponiveis(disponiveis);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setClientesDisponiveis([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showAddModal) {
        buscarClientesDisponiveis(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, showAddModal]);

  const handleAdicionarCliente = async () => {
    if (!selectedCliente) return;

    setSaving(true);
    setAuthFeedback(null);

    try {
      // Atualizar o drive_link na tabela pessoas
      if (driveLink.trim()) {
        const { error } = await supabase
          .from("pessoas")
          .update({ drive_link: driveLink.trim() })
          .eq("id", selectedCliente.id);

        if (error) {
          console.error("Erro ao salvar drive_link:", error);
        }
      }

      // Criar usuário Auth para o cliente (se tiver email)
      let authResult: CriarUsuarioResult | null = null;
      if (selectedCliente.email) {
        authResult = await criarUsuarioAuthCliente(selectedCliente);

        if (authResult.sucesso) {
          if (authResult.ja_existia) {
            setAuthFeedback({
              tipo: "aviso",
              mensagem: `Usuário já existe para ${selectedCliente.email}. Cliente pode usar "Esqueci minha senha" no login.`,
            });
          } else {
            const senha = gerarSenhaCliente(selectedCliente.nome, selectedCliente.telefone);
            setAuthFeedback({
              tipo: "sucesso",
              mensagem: `Acesso criado! Login: ${selectedCliente.email} | Senha: ${senha}`,
            });
          }
        } else {
          setAuthFeedback({
            tipo: "erro",
            mensagem: `Erro ao criar acesso: ${authResult.erro || "Erro desconhecido"}`,
          });
        }
      } else {
        setAuthFeedback({
          tipo: "aviso",
          mensagem: "Cliente sem e-mail. Cadastre um e-mail para criar acesso ao sistema.",
        });
      }

      // Adicionar à lista local
      const novoCliente: ClienteAreaInfo = {
        id: selectedCliente.id,
        nome: selectedCliente.nome,
        email: selectedCliente.email,
        telefone: selectedCliente.telefone,
        avatar_url: selectedCliente.avatar_url ?? null,
        foto_url: selectedCliente.foto_url ?? null,
        drive_link: driveLink.trim() || null,
        contratos: [],
        acessoLiberado: true,
      };

      setLista((prev) => [...prev, novoCliente]);
      setClientes((prev) => [...prev, novoCliente]);

      // Fechar modal e limpar
      setShowAddModal(false);
      setSelectedCliente(null);
      setDriveLink("");
      setSearchTerm("");
      setClientesDisponiveis([]);

      // Recarregar lista
      reload();
    } catch (err) {
      console.error("Erro ao adicionar cliente:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao adicionar cliente. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsapp = (cliente: ClienteAreaInfo) => {
    const numero = formatPhoneDigits(cliente.telefone);
    if (!numero) {
      toast({ variant: "destructive", title: "Erro", description: "Cliente sem telefone cadastrado para envio pelo WhatsApp." });
      return;
    }

    // SEGURANÇA: NÍo enviar senha na URL - cliente deve usar login normal
    const linkAcesso = `${window.location.origin}/login?tipo=cliente`;
    const primeiroNome = cliente.nome.split(" ")[0];

    const mensagem = `Ola ${primeiroNome}!

Bem-vindo(a) a sua *Area do Cliente WG Almeida*!

Aqui voce tera acesso exclusivo a:
- Acompanhamento da sua obra em tempo real
- Galeria de fotos do progresso
- Documentos e contratos
- Cronograma de execucao
- Resumo financeiro
- Etapas do projeto

*Link de Acesso:*
${linkAcesso}

*Login:* ${cliente.email || "(cadastrar e-mail)"}
*Senha:* A senha cadastrada no sistema

_Para primeiro acesso, use "Esqueci minha senha" no login._

Qualquer duvida, estamos a disposicao!
*Equipe WG Almeida*`;

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  };

  const handleShareEmail = (cliente: ClienteAreaInfo) => {
    if (!cliente.email) {
      toast({ variant: "destructive", title: "Erro", description: "Cliente sem e-mail cadastrado." });
      return;
    }

    // SEGURANÇA: NÍo enviar senha na URL - cliente deve usar login normal
    const linkAcesso = `${window.location.origin}/login?tipo=cliente`;
    const primeiroNome = cliente.nome.split(" ")[0];

    const assunto = encodeURIComponent(
      "Seu Acesso Exclusivo a Area do Cliente WG Almeida"
    );
    const corpo = encodeURIComponent(
      `Ola ${primeiroNome}!

Bem-vindo(a) a sua Area do Cliente WG Almeida!

Aqui voce tera acesso exclusivo a:
- Acompanhamento da sua obra em tempo real
- Galeria de fotos do progresso
- Documentos e contratos
- Cronograma de execucao
- Resumo financeiro
- Etapas do projeto

========================================
SEUS DADOS DE ACESSO
========================================

Link: ${linkAcesso}

Login: ${cliente.email}
Senha: A senha cadastrada no sistema

Para primeiro acesso, use "Esqueci minha senha" no login.
========================================

Qualquer duvida, estamos a disposicao!

Atenciosamente,
Equipe WG Almeida`
    );
    window.open(
      `mailto:${cliente.email}?subject=${assunto}&body=${corpo}`,
      "_blank"
    );
  };

  const handleEditar = (clienteId: string) => {
    navigate(`/pessoas/clientes/${clienteId}`);
  };

  const handleExcluir = async (cliente: ClienteAreaInfo) => {
    // Se cliente tem contratos ativos, nÍo pode remover
    if (cliente.contratos.length > 0) {
      toast({ variant: "destructive", title: "Erro", description: "Este cliente possui contratos vinculados e nÍo pode ser removido da área do cliente. Para remover, cancele ou conclua os contratos primeiro." });
      return;
    }

    if (
      !confirm(
        `Deseja remover "${cliente.nome}" da área do cliente?\n\nIsso irá limpar o link do Drive vinculado.`
      )
    ) {
      return;
    }

    try {
      // Limpar drive_link no banco para remover da área do cliente
      const { error } = await supabase
        .from("pessoas")
        .update({ drive_link: null })
        .eq("id", cliente.id);

      if (error) {
        console.error("Erro ao remover cliente:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao remover cliente. Tente novamente." });
      }

      // Atualizar lista local
      setLista((prev) => prev.filter((c) => c.id !== cliente.id));
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao remover cliente. Tente novamente." });
    }
  };

  // FunçÍo utilitária para extrair o ano de cadastro
  const getAnoCadastro = (
    cliente:
      | ClienteAreaInfo
      | (ClienteDisponivel & { criado_em?: string | null })
  ) => {
    // Tenta pegar do campo criado_em, se nÍo, retorna vazio
    const data = (cliente as any).criado_em || (cliente as any).data_inicio_wg;
    if (!data) return "";
    return new Date(data).getFullYear();
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#111827] text-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="wg-text-xs uppercase tracking-[0.24em] text-white/60">
              Área do Cliente · Cadastros
            </p>
            <h1 className="text-[24px] tracking-tight text-white">
              Controle quem tem acesso.
            </h1>
            <p className="wg-text-body leading-relaxed text-white/80 max-w-3xl">
              Clientes com contratos emitidos aparecem automaticamente aqui.
              Compartilhe o link do drive e libere o acesso em um clique.
            </p>
            <div className="flex flex-wrap gap-3">
              <BotaoGerarLink
                tipo="CLIENTE"
                className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full bg-white px-3.5 py-1.5 wg-text-sm text-black hover:opacity-90"
              />
              <button
                onClick={() => navigate("/pessoas/clientes/novo")}
                className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full border border-white/30 px-3.5 py-1.5 wg-text-sm text-white hover:bg-white/10"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Criar cadastro manual
              </button>
              <button className="inline-flex items-center whitespace-nowrap gap-1.5 rounded-full border border-white/30 px-3.5 py-1.5 wg-text-sm text-white hover:bg-white/10">
                Ver área publicada
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md min-w-[260px]">
            <p className="wg-text-xs uppercase tracking-[0.22em] text-white/70">
              Acessos ativos
            </p>
            <p className="wg-text-h2 text-white">{ativos}</p>
            <p className="wg-text-body text-white/80">
              Clientes liberados para entrar no hub.
            </p>
          </div>
        </div>
      </header>

      {/* Feedback de criaçÍo de acesso */}
      {authFeedback && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 ${
            authFeedback.tipo === "sucesso"
              ? "bg-green-50 border border-green-200"
              : authFeedback.tipo === "aviso"
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {authFeedback.tipo === "sucesso" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : authFeedback.tipo === "aviso" ? (
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`wg-text-body ${
                authFeedback.tipo === "sucesso"
                  ? "text-green-800"
                  : authFeedback.tipo === "aviso"
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              {authFeedback.tipo === "sucesso"
                ? "Acesso criado com sucesso!"
                : authFeedback.tipo === "aviso"
                ? "AtençÍo"
                : "Erro ao criar acesso"}
            </p>
            <p
              className={`wg-text-sm leading-relaxed ${
                authFeedback.tipo === "sucesso"
                  ? "text-green-700"
                  : authFeedback.tipo === "aviso"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
            >
              {authFeedback.mensagem}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthFeedback(null)}
            className="text-gray-400 hover:text-gray-600"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="wg-text-h2 text-gray-900">
              Clientes com área habilitada
            </h2>
            <p className="wg-text-body leading-relaxed text-gray-500">
              Inclua novos contatos, atualize e-mails e garanta que cada cliente
              receba o Drive compartilhado.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 wg-text-body text-gray-700 hover:bg-gray-50"
          >
            Adicionar cliente
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <p className="wg-text-body text-gray-500">
            Carregando clientes com contratos...
          </p>
        ) : lista.length === 0 ? (
          <p className="wg-text-body leading-relaxed text-gray-500">
            Nenhum cliente com contrato emitido ainda. Assim que um contrato for
            gerado, o acesso aparece automaticamente.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lista.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-2xl border border-gray-100 p-4 h-full flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    nome={cliente.nome}
                    avatar_url={cliente.avatar_url}
                    foto_url={cliente.foto_url}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="wg-text-h2 text-gray-900 truncate">
                    {cliente.nome}
                    {((cliente as any).criado_em ||
                      (cliente as any).data_inicio_wg) && (
                      <span className="ml-2 wg-text-sm text-gray-400">
                        ({getAnoCadastro(cliente)})
                      </span>
                    )}
                    </p>
                    <p className="wg-text-sm text-gray-500">
                    Contratos: {cliente.contratos.length} • Status:{" "}
                    {cliente.contratos.map((c) => c.status).join(", ")}
                    </p>
                    {cliente.drive_link ? (
                      <a
                        href={cliente.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="wg-text-sm text-[#F25C26] inline-flex items-center gap-1"
                      >
                        Pasta hospedada <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="wg-text-sm text-gray-400">
                        Sem pasta vinculada.
                      </p>
                    )}
                    <div className="mt-2">
                      <a
                        href={`/area-cliente?cliente_id=${cliente.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 wg-text-sm text-blue-700 hover:text-blue-900"
                      >
                        Acessar área do cliente
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-3 wg-text-xs text-gray-600">
                      <button
                        onClick={() => handleShareWhatsapp(cliente)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShareEmail(cliente)}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 hover:bg-blue-100"
                      >
                        <Mail className="w-3 h-3" />
                        E-mail
                      </button>
                      <button
                        onClick={() => handleEditar(cliente.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(cliente)}
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <p className="wg-text-sm text-gray-700">
                    {cliente.email || "Sem e-mail"}
                  </p>
                  <p
                    className={`wg-text-sm ${
                      cliente.acessoLiberado
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                  >
                    {cliente.acessoLiberado
                      ? "Acesso liberado"
                      : "Aguardando ativaçÍo"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Adicionar Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="wg-text-h2 text-gray-900">
                  Adicionar Cliente à Área
                </h3>
                <p className="wg-text-body text-gray-500">
                  Busque um cliente cadastrado e vincule sua pasta do Drive
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCliente(null);
                  setDriveLink("");
                  setSearchTerm("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {!selectedCliente ? (
                <>
                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cliente pelo nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl wg-text-body focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                      autoFocus
                    />
                  </div>

                  {/* Resultados */}
                  {loadingClientes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : clientesDisponiveis.length > 0 ? (
                    <div className="space-y-2">
                      {clientesDisponiveis.map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => setSelectedCliente(cliente)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-[#F25C26] hover:bg-orange-50 transition text-left"
                        >
                          <Avatar
                            nome={cliente.nome}
                            avatar_url={cliente.avatar_url}
                            foto_url={cliente.foto_url}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="wg-text-h3 text-gray-900 truncate">
                              {cliente.nome}
                              {/* Ano de cadastro, se disponível */}
                              {(cliente as any).criado_em && (
                                <span className="ml-2 wg-text-sm text-gray-400">
                                  ({getAnoCadastro(cliente)})
                                </span>
                              )}
                            </p>
                            <p className="wg-text-sm text-gray-500 truncate">
                              {cliente.email || "Sem e-mail"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm.length >= 2 ? (
                    <p className="wg-text-body text-gray-500 text-center py-4">
                      Nenhum cliente encontrado com esse nome.
                    </p>
                  ) : (
                    <p className="wg-text-body text-gray-400 text-center py-4">
                      Digite pelo menos 2 caracteres para buscar...
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Cliente selecionado */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                    <Avatar
                      nome={selectedCliente.nome}
                      avatar_url={selectedCliente.avatar_url}
                      foto_url={selectedCliente.foto_url}
                      size={48}
                      className="ring-2 ring-green-100"
                    />
                    <div className="flex-1">
                      <p className="wg-text-h3 text-gray-900">
                        {selectedCliente.nome}
                      </p>
                      <p className="wg-text-sm text-gray-500">
                        {selectedCliente.email || "Sem e-mail"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCliente(null)}
                      className="wg-text-sm text-gray-500 hover:text-gray-700"
                    >
                      Trocar
                    </button>
                  </div>

                  {/* Link do Drive */}
                  <div className="space-y-2">
                    <label className="wg-text-body text-gray-700 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Link da pasta do Google Drive
                    </label>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl wg-text-body focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                    <p className="wg-text-sm leading-relaxed text-gray-400">
                      Cole o link da pasta do Drive do cliente. Deixe em branco
                      se ainda nÍo tiver.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCliente(null);
                  setDriveLink("");
                  setSearchTerm("");
                }}
                className="px-4 py-2 wg-text-body text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarCliente}
                disabled={!selectedCliente || saving}
                className="px-4 py-2 wg-text-body text-white bg-primary rounded-lg hover:bg-[#d94d1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Adicionar à Área do Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

