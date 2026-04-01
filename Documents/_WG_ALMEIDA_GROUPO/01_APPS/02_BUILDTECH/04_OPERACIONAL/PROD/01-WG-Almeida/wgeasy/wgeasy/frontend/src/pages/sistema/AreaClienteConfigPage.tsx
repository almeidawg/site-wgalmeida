/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowRight,
  Edit2,
  ExternalLink,
  Mail,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
  Search,
  Loader2,
  FolderOpen,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { defaultDriveLink } from "./area-cliente/data";
import { useClientesArea, type ClienteAreaInfo } from "@/hooks/useClientesArea";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import {
  gerarMensagemWhatsApp,
  gerarUrlWhatsApp,
  gerarMensagemEmail,
  gerarUrlEmail,
  getTemplate,
  salvarTemplate,
  restaurarTemplatePadrao,
  isTemplatePersonalizado,
  TEMPLATES_PADRAO,
  PRODUCTION_URL,
} from "@/lib/mensagemTemplates";

const formatPhoneDigits = (telefone?: string | null) => (telefone || "").replace(/\D/g, "");

interface ClienteDisponivel {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
}

export default function AreaClienteConfigPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { clientes, loading, setClientes, reload } = useClientesArea();
  const [lista, setLista] = useState<ClienteAreaInfo[]>([]);

  // Modal adicionar cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientesDisponiveis, setClientesDisponiveis] = useState<ClienteDisponivel[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDisponivel | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDriveLink, setLoadingDriveLink] = useState(false);
  const [driveLinkExistente, setDriveLinkExistente] = useState(false);

  // Modal de ediçÍo de template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateEditando, setTemplateEditando] = useState("");

  useEffect(() => {
    setLista(clientes);
  }, [clientes]);

  const ativos = useMemo(() => lista.filter((c) => c.acessoLiberado).length, [lista]);

  // Buscar clientes disponíveis (que ainda nÍo estÍo na lista)
  const buscarClientesDisponiveis = async (termo: string) => {
    if (termo.length < 2) {
      setClientesDisponiveis([]);
      return;
    }

    setLoadingClientes(true);
    try {
      const idsJaNaLista = lista.map((c) => c.id);

      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone")
        .eq("tipo_pessoa", "cliente")
        .ilike("nome", `%${termo}%`)
        .limit(10);

      if (error) throw error;

      // Filtrar os que já estÍo na lista
      const disponiveis = (data || []).filter((p) => !idsJaNaLista.includes(p.id));
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

  // Buscar drive_link do cliente selecionado
  const buscarDriveLinkCliente = async (clienteId: string) => {
    setLoadingDriveLink(true);
    setDriveLinkExistente(false);
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("drive_link")
        .eq("id", clienteId)
        .single();

      if (error) throw error;

      if (data?.drive_link) {
        setDriveLink(data.drive_link);
        setDriveLinkExistente(true);
      } else {
        setDriveLink("");
        setDriveLinkExistente(false);
      }
    } catch (err) {
      console.error("Erro ao buscar drive_link:", err);
      setDriveLink("");
      setDriveLinkExistente(false);
    } finally {
      setLoadingDriveLink(false);
    }
  };

  // Selecionar cliente e buscar drive_link
  const handleSelecionarCliente = async (cliente: ClienteDisponivel) => {
    setSelectedCliente(cliente);
    await buscarDriveLinkCliente(cliente.id);
  };

  const handleAdicionarCliente = async () => {
    if (!selectedCliente) return;

    setSaving(true);
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

      // Adicionar à lista local
      const novoCliente: ClienteAreaInfo = {
        id: selectedCliente.id,
        nome: selectedCliente.nome,
        email: selectedCliente.email,
        telefone: selectedCliente.telefone,
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
      setDriveLinkExistente(false);

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
      toast({ title: "Cliente sem telefone para WhatsApp." });
      return;
    }
    // Gerar link da área do cliente (usar URL de produçÍo)
    const linkArea = `${PRODUCTION_URL}/area-cliente?cliente_id=${cliente.id}`;
    const mensagem = gerarMensagemWhatsApp("AREA_CLIENTE", {
      LINK: linkArea,
      NOME_CLIENTE: cliente.nome,
    });
    const whatsappUrl = gerarUrlWhatsApp(mensagem, numero);
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = (cliente: ClienteAreaInfo) => {
    if (!cliente.email) {
      toast({ title: "Cliente sem e-mail cadastrado." });
      return;
    }
    // Gerar link da área do cliente (usar URL de produçÍo)
    const linkArea = `${PRODUCTION_URL}/area-cliente?cliente_id=${cliente.id}`;
    const corpo = gerarMensagemEmail("AREA_CLIENTE", {
      LINK: linkArea,
      NOME_CLIENTE: cliente.nome,
    });
    const assunto = "Sua Área Exclusiva WG - Grupo WG Almeida";
    const mailtoUrl = gerarUrlEmail(assunto, corpo, cliente.email);
    window.open(mailtoUrl, "_blank");
  };

  // Abrir modal de ediçÍo de template
  const handleAbrirTemplateModal = () => {
    setTemplateEditando(getTemplate("AREA_CLIENTE"));
    setShowTemplateModal(true);
  };

  // Salvar template personalizado
  const handleSalvarTemplate = () => {
    salvarTemplate("AREA_CLIENTE", templateEditando);
    setShowTemplateModal(false);
    toast({ title: "Sucesso", description: "Mensagem padrÍo salva com sucesso!" });
  };

  // Restaurar template padrÍo
  const handleRestaurarTemplate = () => {
    restaurarTemplatePadrao("AREA_CLIENTE");
    setTemplateEditando(TEMPLATES_PADRAO.AREA_CLIENTE.templatePadrao);
    toast({ title: "Mensagem restaurada para o padrÍo!" });
  };

  const handleEditar = (id: string) => navigate(`/pessoas/clientes/${id}`);

  const handleExcluir = (id: string) => {
    if (!confirm("Remover acesso deste cliente?")) return;
    setLista((prev) => prev.filter((c) => c.id !== id));
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-10">
      <header className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#111827] text-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-[12px] uppercase tracking-[0.4em] text-white/60">Configurações · Área do Cliente</p>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight">
              Centralizamos o link do Drive e os logins do cliente dentro do layout WG.
            </h1>
            <p className="text-[12px] text-white/80 max-w-3xl">
              Assim que um contrato é emitido, cadastramos o cliente automaticamente aqui. Configure os acessos e
              comunicações abaixo.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[13px] font-normal text-black hover:opacity-90"
              >
                Adicionar cliente
                <UserPlus className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-[13px] text-white hover:bg-white/10">
                Ver experiência publicada
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md min-w-[260px]">
            <p className="text-[12px] uppercase tracking-[0.3em] text-white/70">Acessos ativos</p>
            <p className="text-[18px] font-light">{ativos}</p>
            <p className="text-[12px] text-white/80">Clientes com login liberado para o hub WG.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[20px] font-light text-gray-900">Clientes com área habilitada</h2>
              <p className="text-[12px] text-gray-500 mt-1">
                Os links do Drive sÍo hospedados dentro do layout WG, nÍo abrimos a UI do Google.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
            >
              Adicionar cliente
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-[12px] text-gray-500">Carregando clientes...</p>
          ) : lista.length === 0 ? (
            <p className="text-[12px] text-gray-500">Nenhum cliente habilitado no momento.</p>
          ) : (
            <div className="space-y-4">
              {lista.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-[12px] font-normal text-gray-900">{cliente.nome}</p>
                    <p className="text-[12px] text-gray-500">
                      Contratos: {cliente.contratos.length} {cliente.contratos.length > 0 && `• Status: ${cliente.contratos.map((c) => c.status).join(", ")}`}
                    </p>
                    {cliente.drive_link ? (
                      <a
                        href={cliente.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] text-[#F25C26] font-normal inline-flex items-center gap-1"
                      >
                        Pasta hospedada <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-[12px] text-gray-400">Sem pasta vinculada.</p>
                    )}
                    <div className="mt-2">
                      <a
                        href={`/area-cliente?cliente_id=${cliente.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-normal text-blue-700 hover:text-blue-900"
                      >
                        Acessar área do cliente
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 text-[12px] text-gray-600">
                      <button
                        onClick={() => handleShareWhatsapp(cliente)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleShareEmail(cliente)}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100"
                      >
                        <Mail className="w-3 h-3" /> E-mail
                      </button>
                      <button
                        onClick={() => handleEditar(cliente.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(cliente.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-gray-700">{cliente.email || "Sem e-mail"}</p>
                    <p className={`text-[12px] font-normal ${cliente.acessoLiberado ? "text-emerald-600" : "text-gray-400"}`}>
                      {cliente.acessoLiberado ? "Acesso liberado" : "Aguardando ativaçÍo"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-[20px] font-light text-gray-900">Hospedagem do Drive</h3>
            <p className="text-[12px] text-gray-500 mt-1">
              Informe o link que será carregado em nosso layout (iframe seguro com autenticaçÍo WG).
            </p>
            <div className="mt-3 space-y-2">
              <label className="text-[12px] uppercase tracking-[0.3em] text-gray-400">Pasta mestre</label>
              <input
                type="text"
                defaultValue={defaultDriveLink}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
              />
            </div>
            <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary hover:bg-[#d94d1a] px-4 py-2 text-[13px] font-normal text-white transition">
              Atualizar link
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-[12px] font-normal text-gray-900">Mensagem de Compartilhamento</p>
              </div>
              {isTemplatePersonalizado("AREA_CLIENTE") && (
                <span className="text-[12px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  Personalizado
                </span>
              )}
            </div>
            <p className="text-[12px] text-gray-500">
              Mensagem enviada por WhatsApp/E-mail ao compartilhar o link da área do cliente.
            </p>
            <button
              onClick={handleAbrirTemplateModal}
              className="inline-flex items-center gap-2 text-[12px] font-normal text-[#F25C26] hover:underline"
            >
              <Pencil className="w-3 h-3" />
              Editar mensagem padrÍo
            </button>
          </div>
        </div>
      </section>

      {/* Modal Adicionar Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-[20px] font-light text-gray-900">Adicionar Cliente à Área</h3>
                <p className="text-[12px] text-gray-500 mt-1">Busque um cliente cadastrado e vincule sua pasta do Drive</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCliente(null);
                  setDriveLink("");
                  setSearchTerm("");
                  setDriveLinkExistente(false);
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
                      className="w-full pl-10 pr-4 py-3 border rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
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
                          onClick={() => handleSelecionarCliente(cliente)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-[#F25C26] hover:bg-orange-50 transition text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-normal text-gray-600">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-normal text-gray-900 truncate">{cliente.nome}</p>
                            <p className="text-[12px] text-gray-500 truncate">{cliente.email || "Sem e-mail"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm.length >= 2 ? (
                    <p className="text-[12px] text-gray-500 text-center py-4">
                      Nenhum cliente encontrado com esse nome.
                    </p>
                  ) : (
                    <p className="text-[12px] text-gray-400 text-center py-4">
                      Digite pelo menos 2 caracteres para buscar...
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Cliente selecionado */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-[18px] font-normal text-green-700">
                      {selectedCliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-normal text-gray-900">{selectedCliente.nome}</p>
                      <p className="text-[12px] text-gray-500">{selectedCliente.email || "Sem e-mail"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCliente(null);
                        setDriveLink("");
                        setDriveLinkExistente(false);
                      }}
                      className="text-[12px] text-gray-500 hover:text-gray-700"
                    >
                      Trocar
                    </button>
                  </div>

                  {/* Link do Drive */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-normal text-gray-700 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Link da pasta do Google Drive
                      {loadingDriveLink && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </label>

                    {loadingDriveLink ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-[12px] text-gray-500">Verificando pasta existente...</span>
                      </div>
                    ) : driveLinkExistente ? (
                      <>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                          <ShieldCheck className="w-4 h-4 text-green-600" />
                          <span className="text-[12px] text-green-700">Pasta do Drive já configurada!</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                          className="w-full px-4 py-3 border rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#F25C26] bg-green-50 border-green-200"
                        />
                        <p className="text-[12px] text-gray-500">
                          O link foi carregado automaticamente. Você pode alterá-lo se necessário.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                          <FolderOpen className="w-4 h-4 text-yellow-600" />
                          <span className="text-[12px] text-yellow-700">Cliente ainda nÍo possui pasta do Drive</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                          className="w-full px-4 py-3 border rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                        />
                        <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                          <p className="text-[12px] text-gray-600 font-normal">Para criar uma nova pasta:</p>
                          <ol className="text-[12px] text-gray-500 space-y-1 list-decimal pl-4">
                            <li>Acesse o <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-[#F25C26] underline">Google Drive</a></li>
                            <li>Crie uma pasta com o nome do cliente</li>
                            <li>Dentro dela, crie as subpastas: Plantas, Fotos, Documentos, Diário de Obra</li>
                            <li className="font-medium text-orange-700">
                              ⚠️ IMPORTANTE: Clique direito na pasta → "Compartilhar" → "Qualquer pessoa com o link pode visualizar"
                            </li>
                            <li>Copie o link e cole acima</li>
                          </ol>
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-[12px] text-yellow-800">
                              <strong>Sem compartilhamento público, o cliente nÍo conseguirá ver os arquivos!</strong>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCliente(null);
                  setDriveLink("");
                  setSearchTerm("");
                  setDriveLinkExistente(false);
                }}
                className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarCliente}
                disabled={!selectedCliente || saving}
                className="px-4 py-2 text-[13px] font-normal text-white bg-primary rounded-lg hover:bg-[#d94d1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Adicionar à Área do Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-[20px] font-light text-gray-900">Editar Mensagem PadrÍo</h3>
                <p className="text-[12px] text-gray-500 mt-1">Personalize a mensagem enviada aos clientes</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Dicas de variáveis */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[12px] font-normal text-blue-700 mb-2">Variáveis disponíveis:</p>
                <ul className="text-[12px] text-blue-600 space-y-1">
                  <li><code className="bg-blue-100 px-1 rounded">{"{{LINK}}"}</code> - URL da área do cliente</li>
                  <li><code className="bg-blue-100 px-1 rounded">{"{{NOME_CLIENTE}}"}</code> - Nome do cliente</li>
                </ul>
                <p className="text-[12px] text-blue-500 mt-2">
                  Use <code className="bg-blue-100 px-1 rounded">*texto*</code> para negrito no WhatsApp
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-[12px] font-normal text-gray-700">Mensagem</label>
                <textarea
                  value={templateEditando}
                  onChange={(e) => setTemplateEditando(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border rounded-xl text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-[#F25C26] resize-none"
                  placeholder="Digite a mensagem..."
                />
              </div>

              {/* Indicador de personalizado */}
              {isTemplatePersonalizado("AREA_CLIENTE") && (
                <div className="flex items-center gap-2 text-[12px] text-amber-600">
                  <span className="px-2 py-0.5 bg-amber-100 rounded-full text-[12px] font-normal">
                    Personalizado
                  </span>
                  <span>Este template foi personalizado</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={handleRestaurarTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar PadrÍo
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarTemplate}
                  className="px-4 py-2 text-[13px] font-normal text-white bg-primary rounded-lg hover:bg-[#d94d1a]"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
