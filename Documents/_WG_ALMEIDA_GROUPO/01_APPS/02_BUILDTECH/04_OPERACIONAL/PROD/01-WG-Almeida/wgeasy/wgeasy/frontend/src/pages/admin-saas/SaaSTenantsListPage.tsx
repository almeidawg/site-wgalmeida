import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Gift,
  Globe,
  Loader2,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  Wand2,
  XCircle,
} from "lucide-react";

type TenantStatus = "ativo" | "trial" | "cortesia" | "suspenso" | "inativo";

type Produto = {
  id: string;
  nome: string;
  slug?: string | null;
};

type Tenant = {
  id: string;
  nome_empresa: string;
  produto_id: string | null;
  status: string;
  dominio: string | null;
  dominio_personalizado: string | null;
  criado_em: string;
  data_inicio_trial?: string | null;
  saas_produtos?: { nome: string | null };
};

type TenantForm = {
  nome_empresa: string;
  produto_id: string;
  dominio: string;
  dominio_personalizado: string;
  status: TenantStatus;
};

const STATUS_CONFIG: Record<
  TenantStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  ativo: {
    label: "Ativo",
    className: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={12} />,
  },
  trial: {
    label: "Trial 7d",
    className: "bg-blue-100 text-blue-700",
    icon: <Clock size={12} />,
  },
  cortesia: {
    label: "Cortesia",
    className: "bg-purple-100 text-purple-700",
    icon: <Gift size={12} />,
  },
  suspenso: {
    label: "Suspenso",
    className: "bg-red-100 text-red-700",
    icon: <XCircle size={12} />,
  },
  inativo: {
    label: "Inativo",
    className: "bg-gray-100 text-gray-500",
    icon: <AlertTriangle size={12} />,
  },
};

const DEFAULT_THEME = {
  primary_color: "#F25C26",
  secondary_color: "#2B4580",
  logo_url: "",
  favicon_url: "",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function getDomainLabel(tenant: Tenant) {
  return tenant.dominio_personalizado || tenant.dominio || "—";
}

const EMPTY_FORM: TenantForm = {
  nome_empresa: "",
  produto_id: "",
  dominio: "",
  dominio_personalizado: "",
  status: "trial",
};

export default function SaaSTenantsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantForm>(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: produtos } = useQuery({
    queryKey: ["saas-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_produtos")
        .select("id, nome, slug")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as Produto[];
    },
  });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["saas-tenants", filtroProduto],
    queryFn: async () => {
      let query = supabase
        .from("saas_tenants")
        .select(
          "id, nome_empresa, produto_id, status, dominio, dominio_personalizado, criado_em, data_inicio_trial, saas_produtos(nome)"
        )
        .order("criado_em", { ascending: false });

      if (filtroProduto !== "todos") {
        query = query.eq("produto_id", filtroProduto);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Tenant[];
    },
  });

  const tenantsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return tenants || [];

    return (tenants || []).filter((tenant) =>
      [
        tenant.nome_empresa,
        tenant.dominio,
        tenant.dominio_personalizado,
        tenant.saas_produtos?.nome,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(termo))
    );
  }, [busca, tenants]);

  const salvarTenant = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_empresa: form.nome_empresa.trim(),
        produto_id: form.produto_id || null,
        dominio: form.dominio.trim() || null,
        dominio_personalizado: form.dominio_personalizado.trim() || null,
        status: form.status,
        data_inicio_trial: form.status === "trial" ? new Date().toISOString() : null,
        config_white_label: DEFAULT_THEME,
      };

      if (editando) {
        const { error } = await supabase
          .from("saas_tenants")
          .update(payload)
          .eq("id", editando.id);
        if (error) throw error;
        return editando.id;
      }

      const { data, error } = await supabase
        .from("saas_tenants")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenants"] });
      toast({
        title: editando ? "Tenant atualizado" : "Tenant criado",
        variant: "success",
      });
      setShowModal(false);
      setEditando(null);
      setForm(EMPTY_FORM);
    },
    onError: (error: any) =>
      toast({
        title: "Erro ao salvar tenant",
        description: error.message,
        variant: "destructive",
      }),
  });

  const criarTenantDemo = useMutation({
    mutationFn: async () => {
      const produtoSelecionado =
        produtos?.find((item) => item.id === filtroProduto) || produtos?.[0];

      if (!produtoSelecionado) {
        throw new Error("Cadastre um produto SaaS antes de criar o demo.");
      }

      const now = Date.now().toString().slice(-6);
      const slugBase = slugify(`${produtoSelecionado.slug || produtoSelecionado.nome}-${now}`);
      const nomeEmpresa = `Demo ${produtoSelecionado.nome} ${now}`;
      const dominio = `${slugBase}.wgeasy.app`;
      const dominioPersonalizado = `${slugBase}.demo.wgalmeida.com.br`;

      const { data: tenant, error: tenantError } = await supabase
        .from("saas_tenants")
        .insert({
          produto_id: produtoSelecionado.id,
          nome_empresa: nomeEmpresa,
          dominio,
          dominio_personalizado: dominioPersonalizado,
          status: "trial",
          data_inicio_trial: new Date().toISOString(),
          config_white_label: DEFAULT_THEME,
        })
        .select("id")
        .single();

      if (tenantError) throw tenantError;

      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 7);

      const { error: assinaturaError } = await supabase.from("saas_assinaturas").insert({
        tenant_id: tenant.id,
        gateway: "manual",
        status: "trial",
        plano_nome: "Demo 7 dias",
        valor_mensal: 0,
        data_inicio: new Date().toISOString(),
        data_vencimento: dataVencimento.toISOString(),
        observacoes: "Tenant demo criado automaticamente para validacao comercial.",
      });

      if (assinaturaError) {
        await supabase.from("saas_tenants").delete().eq("id", tenant.id);
        throw assinaturaError;
      }

      return tenant.id as string;
    },
    onSuccess: (tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["saas-assinaturas"] });
      toast({
        title: "Tenant demo criado",
        description: "Ambiente trial gerado e pronto para configuracao.",
        variant: "success",
      });
      navigate(`/admin-saas/clientes/${tenantId}`);
    },
    onError: (error: any) =>
      toast({
        title: "Erro ao criar tenant demo",
        description: error.message,
        variant: "destructive",
      }),
  });

  const criarCortesia = useMutation({
    mutationFn: async () => {
      const produtoSelecionado =
        produtos?.find((item) => item.id === filtroProduto) || produtos?.[0];

      if (!produtoSelecionado) {
        throw new Error("Cadastre um produto SaaS antes de criar acesso cortesia.");
      }

      const now = Date.now().toString().slice(-6);
      const slugBase = slugify(`${produtoSelecionado.slug || produtoSelecionado.nome}-parceiro-${now}`);
      const nomeEmpresa = `Parceiro ${produtoSelecionado.nome} ${now}`;
      const dominio = `${slugBase}.wgeasy.app`;
      const dominioPersonalizado = `${slugBase}.parceiro.wgalmeida.com.br`;

      const { data: tenant, error: tenantError } = await supabase
        .from("saas_tenants")
        .insert({
          produto_id: produtoSelecionado.id,
          nome_empresa: nomeEmpresa,
          dominio,
          dominio_personalizado: dominioPersonalizado,
          status: "cortesia",
          data_inicio_trial: new Date().toISOString(),
          config_white_label: DEFAULT_THEME,
        })
        .select("id")
        .single();

      if (tenantError) throw tenantError;

      const { error: assinaturaError } = await supabase.from("saas_assinaturas").insert({
        tenant_id: tenant.id,
        gateway: "manual",
        status: "cortesia",
        plano_nome: "Cortesia Parceiro",
        valor_mensal: 0,
        data_inicio: new Date().toISOString(),
        observacoes: "Acesso cortesia para parceiro estrategico — sem prazo definido.",
      });

      if (assinaturaError) {
        await supabase.from("saas_tenants").delete().eq("id", tenant.id);
        throw assinaturaError;
      }

      return tenant.id as string;
    },
    onSuccess: (tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["saas-assinaturas"] });
      toast({
        title: "Acesso Cortesia criado",
        description: "Parceiro cadastrado com acesso livre. Configure e envie o link.",
        variant: "success",
      });
      navigate(`/admin-saas/clientes/${tenantId}`);
    },
    onError: (error: any) =>
      toast({
        title: "Erro ao criar cortesia",
        description: error.message,
        variant: "destructive",
      }),
  });

  const alterarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("saas_tenants").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenants"] });
      toast({ title: "Status atualizado", variant: "success" });
    },
  });

  const deletarTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saas_tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenants"] });
      toast({ title: "Tenant removido", variant: "success" });
      setConfirmDel(null);
    },
    onError: (error: any) =>
      toast({
        title: "Erro ao remover tenant",
        description: error.message,
        variant: "destructive",
      }),
  });

  function resetForm() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setShowModal(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function abrirEditar(tenant: Tenant) {
    setEditando(tenant);
    setForm({
      nome_empresa: tenant.nome_empresa,
      produto_id: tenant.produto_id || "",
      dominio: tenant.dominio || "",
      dominio_personalizado: tenant.dominio_personalizado || "",
      status: (tenant.status as TenantStatus) || "trial",
    });
    setShowModal(true);
  }

  const totais = {
    total: tenants?.length || 0,
    ativos: (tenants || []).filter((item) => item.status === "ativo").length,
    trials: (tenants || []).filter((item) => item.status === "trial").length,
    suspensos: (tenants || []).filter((item) =>
      ["suspenso", "inativo"].includes(item.status)
    ).length,
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants SaaS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestao dos clientes, dominios, trials e ambientes de demonstracao.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => criarCortesia.mutate()}
            disabled={criarCortesia.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60"
          >
            {criarCortesia.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Gift size={16} />
            )}
            Cortesia Parceiro
          </button>
          <button
            type="button"
            onClick={() => criarTenantDemo.mutate()}
            disabled={criarTenantDemo.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-60"
          >
            {criarTenantDemo.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            Trial 7 dias
          </button>
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#050C18] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={16} />
            Novo tenant
          </button>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totais.total}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ativos</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totais.ativos}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Trials</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totais.trials}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Suspensos</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totais.suspensos}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por empresa, produto ou dominio..."
            className="w-full rounded-2xl border border-gray-200 py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            <button
              type="button"
              onClick={() => setFiltroProduto("todos")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filtroProduto === "todos"
                  ? "bg-[#050C18] text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>
            {produtos?.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => setFiltroProduto(produto.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filtroProduto === produto.id
                    ? "bg-[#050C18] text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {produto.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando tenants...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Produto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Dominio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Trial
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Criado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenantsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">
                      Nenhum tenant encontrado.
                    </td>
                  </tr>
                )}

                {tenantsFiltrados.map((tenant) => {
                  const status =
                    STATUS_CONFIG[(tenant.status as TenantStatus) || "inativo"] ||
                    STATUS_CONFIG.inativo;

                  return (
                    <tr key={tenant.id} className="transition hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 font-bold text-orange-700">
                            {tenant.nome_empresa?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{tenant.nome_empresa}</p>
                            <p className="text-xs text-gray-400">{tenant.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.saas_produtos?.nome || "Sem produto"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tenant.dominio ? (
                          <div className="flex flex-col gap-0.5">
                            <a
                              href={`https://wgeasy.vercel.app/${tenant.dominio}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-orange-600 hover:underline font-medium"
                            >
                              <Globe size={11} />
                              wgeasy.vercel.app/{tenant.dominio}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`https://wgeasy.vercel.app/${tenant.dominio}`);
                                toast({ title: "Link copiado!", variant: "success" });
                              }}
                              className="text-[11px] text-gray-400 hover:text-gray-600 text-left"
                            >
                              Copiar link
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(tenant.data_inicio_trial)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(tenant.criado_em)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const link = tenant.dominio_personalizado || tenant.dominio || window.location.origin;
                              const msg = encodeURIComponent(
                                `Olá! Seu acesso ao WGEasy está pronto 🚀\n\nEmpresa: ${tenant.nome_empresa}\nLink: https://${link}\n\nQualquer dúvida estou à disposição.`
                              );
                              window.open(`https://wa.me/?text=${msg}`, "_blank");
                            }}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-green-50 hover:text-green-600"
                            title="Enviar link por WhatsApp"
                          >
                            <Send size={15} />
                          </button>
                          {tenant.status === "ativo" || tenant.status === "cortesia" ? (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus.mutate({ id: tenant.id, status: "suspenso" })
                              }
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Suspender"
                            >
                              <XCircle size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus.mutate({ id: tenant.id, status: "ativo" })
                              }
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-green-50 hover:text-green-600"
                              title="Ativar"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => abrirEditar(tenant)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-saas/clientes/${tenant.id}`)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                            title="Configurar"
                          >
                            <Settings size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDel(tenant.id)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="text-orange-500" size={22} />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editando ? "Editar tenant" : "Novo tenant"}
                </h2>
                <p className="text-sm text-gray-500">
                  Configure o cliente, dominio e status do ambiente SaaS.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Nome da empresa
                </label>
                <input
                  value={form.nome_empresa}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nome_empresa: event.target.value }))
                  }
                  placeholder="Ex: Demo EasyFood Prime"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Produto SaaS
                </label>
                <select
                  value={form.produto_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, produto_id: event.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="">Selecionar produto...</option>
                  {produtos?.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as TenantStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="trial">Trial 7 dias</option>
                  <option value="cortesia">Cortesia Parceiro</option>
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Dominio interno
                </label>
                <input
                  value={form.dominio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dominio: event.target.value }))
                  }
                  placeholder="tenant.wgeasy.app"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Dominio personalizado
                </label>
                <input
                  value={form.dominio_personalizado}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dominio_personalizado: event.target.value,
                    }))
                  }
                  placeholder="cliente.demo.wgalmeida.com.br"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => salvarTenant.mutate()}
                disabled={salvarTenant.isPending || !form.nome_empresa.trim()}
                className="flex-1 rounded-xl bg-[#050C18] px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
              >
                {salvarTenant.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Salvando...
                  </span>
                ) : editando ? (
                  "Salvar alteracoes"
                ) : (
                  "Criar tenant"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <Trash2 size={40} className="mx-auto mb-4 text-red-500" />
            <h3 className="mb-2 text-lg font-bold text-gray-900">Excluir tenant?</h3>
            <p className="mb-6 text-sm text-gray-500">
              Essa acao remove o ambiente SaaS e sua configuracao principal.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deletarTenant.mutate(confirmDel)}
                disabled={deletarTenant.isPending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletarTenant.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo...
                  </span>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
