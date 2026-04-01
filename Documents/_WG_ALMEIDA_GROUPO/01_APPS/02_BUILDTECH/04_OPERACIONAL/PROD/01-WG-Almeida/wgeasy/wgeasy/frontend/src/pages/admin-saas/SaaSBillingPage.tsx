import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  CreditCard, Plus, Loader2, Star, Users, DollarSign, CheckCircle2,
  Clock, XCircle, Trash2, Edit3, Package, Building2, TrendingUp, AlertCircle
} from "lucide-react";
import { saasService, SaasPlano, SaasAssinatura } from "@/services/saasService";

type TabType = "planos" | "assinaturas";

const GATEWAYS = ["manual", "stripe", "infinitepay", "pagseguro", "mercadopago"];
const STATUS_ASS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ativo:     { label: "Ativo",     cls: "bg-green-100 text-green-700",  icon: <CheckCircle2 size={12} /> },
  trial:     { label: "Trial",     cls: "bg-blue-100 text-blue-700",    icon: <Clock size={12} /> },
  suspenso:  { label: "Suspenso",  cls: "bg-red-100 text-red-700",      icon: <XCircle size={12} /> },
  cancelado: { label: "Cancelado", cls: "bg-gray-100 text-gray-500",    icon: <AlertCircle size={12} /> },
};

export default function SaaSBillingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>("planos");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [showModalPlano, setShowModalPlano] = useState(false);
  const [showModalAss, setShowModalAss] = useState(false);
  const [editandoPlano, setEditandoPlano] = useState<SaasPlano | null>(null);
  const [formPlano, setFormPlano] = useState({ produto_id: "", nome: "", descricao: "", valor_mensal: "", valor_anual: "", limite_usuarios: "5", features: "", destaque: false, ativo: true });
  const [formAss, setFormAss] = useState({ tenant_id: "", plano_id: "", plano_nome: "", valor_mensal: "", status: "ativo", gateway: "manual", data_vencimento: "", observacoes: "" });
  const [confirmDelPlano, setConfirmDelPlano] = useState<string | null>(null);

  const { data: produtos } = useQuery({ queryKey: ["saas-produtos"], queryFn: saasService.getProdutos });
  const { data: tenants } = useQuery({
    queryKey: ["saas-tenants-all"],
    queryFn: async () => {
      const { data } = await supabase.from("saas_tenants").select("id, nome_empresa, produto_id").order("nome_empresa");
      return data || [];
    }
  });
  const { data: planos, isLoading: loadingPlanos } = useQuery({
    queryKey: ["saas-planos", filtroProduto],
    queryFn: () => saasService.getPlanos(filtroProduto !== "todos" ? filtroProduto : undefined),
  });
  const { data: assinaturas, isLoading: loadingAss } = useQuery({
    queryKey: ["saas-assinaturas"],
    queryFn: () => saasService.getAssinaturas(),
  });

  // Métricas
  const mrrTotal = (assinaturas || []).filter(a => a.status === "ativo").reduce((s, a) => s + (Number(a.valor_mensal) || 0), 0);
  const totalAtivos = (assinaturas || []).filter(a => a.status === "ativo").length;
  const totalTrials = (assinaturas || []).filter(a => a.status === "trial").length;
  const mrrFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(mrrTotal);

  const salvarPlano = useMutation({
    mutationFn: async () => {
      const features = formPlano.features.split("\n").map(f => f.trim()).filter(Boolean);
      const payload = {
        produto_id: formPlano.produto_id,
        nome: formPlano.nome,
        descricao: formPlano.descricao,
        valor_mensal: Number(formPlano.valor_mensal) || 0,
        valor_anual: formPlano.valor_anual ? Number(formPlano.valor_anual) : null,
        limite_usuarios: Number(formPlano.limite_usuarios) || 5,
        features,
        destaque: formPlano.destaque,
        ativo: formPlano.ativo,
      };
      if (editandoPlano) await saasService.updatePlano(editandoPlano.id, payload);
      else await saasService.createPlano(payload as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas-planos"] });
      toast({ title: editandoPlano ? "Plano atualizado!" : "Plano criado!", variant: "success" });
      setShowModalPlano(false); setEditandoPlano(null);
      setFormPlano({ produto_id: "", nome: "", descricao: "", valor_mensal: "", valor_anual: "", limite_usuarios: "5", features: "", destaque: false, ativo: true });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deletarPlano = useMutation({
    mutationFn: (id: string) => saasService.deletePlano(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-planos"] }); toast({ title: "Plano removido!", variant: "success" }); setConfirmDelPlano(null); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const criarAssinatura = useMutation({
    mutationFn: async () => {
      const planoSel = planos?.find(p => p.id === formAss.plano_id);
      await saasService.createAssinatura({
        tenant_id: formAss.tenant_id,
        plano_id: formAss.plano_id || undefined,
        plano_nome: formAss.plano_nome || planoSel?.nome || "Manual",
        valor_mensal: Number(formAss.valor_mensal) || planoSel?.valor_mensal || 0,
        status: formAss.status,
        gateway: formAss.gateway,
        data_vencimento: formAss.data_vencimento || undefined,
        data_inicio: new Date().toISOString(),
        observacoes: formAss.observacoes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas-assinaturas"] });
      qc.invalidateQueries({ queryKey: ["saas-metricas"] });
      toast({ title: "Assinatura criada!", variant: "success" });
      setShowModalAss(false);
      setFormAss({ tenant_id: "", plano_id: "", plano_nome: "", valor_mensal: "", status: "ativo", gateway: "manual", data_vencimento: "", observacoes: "" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const alterarStatusAss = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await saasService.updateAssinatura(id, { status });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-assinaturas"] }); qc.invalidateQueries({ queryKey: ["saas-metricas"] }); },
  });

  function abrirEditarPlano(p: SaasPlano) {
    setEditandoPlano(p);
    setFormPlano({
      produto_id: p.produto_id, nome: p.nome, descricao: p.descricao || "",
      valor_mensal: String(p.valor_mensal), valor_anual: p.valor_anual ? String(p.valor_anual) : "",
      limite_usuarios: String(p.limite_usuarios), features: (p.features || []).join("\n"),
      destaque: p.destaque, ativo: p.ativo,
    });
    setShowModalPlano(true);
  }

  // Preencher valor ao selecionar plano
  function onSelectPlano(planoId: string) {
    const p = planos?.find(pl => pl.id === planoId);
    setFormAss(f => ({ ...f, plano_id: planoId, valor_mensal: p ? String(p.valor_mensal) : f.valor_mensal, plano_nome: p?.nome || f.plano_nome }));
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Planos e Cobrança</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie planos, assinaturas e faturamento</p>
        </div>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {[
          { label: "MRR Ativo", value: mrrFormatado, icon: <TrendingUp size={18} />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Assinaturas Ativas", value: totalAtivos, icon: <CheckCircle2 size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Trials em curso", value: totalTrials, icon: <Clock size={18} />, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">{m.label}</span>
              <div className={`${m.bg} ${m.color} p-2 rounded-lg`}>{m.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max min-w-full sm:min-w-0 sm:w-fit">
        {(["planos", "assinaturas"] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "planos" ? "Planos" : "Assinaturas"}
          </button>
        ))}
        </div>
      </div>

      {/* ── TAB PLANOS ── */}
      {tab === "planos" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              <button onClick={() => setFiltroProduto("todos")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filtroProduto === "todos" ? "bg-[#050C18] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>Todos</button>
              {produtos?.map(p => (
                <button key={p.id} onClick={() => setFiltroProduto(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filtroProduto === p.id ? "bg-[#050C18] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{p.nome}</button>
              ))}
            </div>
            <button onClick={() => { setEditandoPlano(null); setFormPlano({ produto_id: "", nome: "", descricao: "", valor_mensal: "", valor_anual: "", limite_usuarios: "5", features: "", destaque: false, ativo: true }); setShowModalPlano(true); }}
              className="flex w-full md:w-auto items-center justify-center gap-2 bg-[#F25C26] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600">
              <Plus size={15} /> Novo Plano
            </button>
          </div>

          {loadingPlanos ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(planos || []).length === 0 && (
                <div className="col-span-3 text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Package size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">Nenhum plano cadastrado.</p>
                </div>
              )}
              {planos?.map(plano => (
                <div key={plano.id} className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-6 flex flex-col relative ${plano.destaque ? "border-[#F25C26] ring-1 ring-[#F25C26]/30" : "border-gray-100"}`}>
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F25C26] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={10} fill="white" /> DESTAQUE
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-900 text-lg">{plano.nome}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plano.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {plano.ativo ? "ATIVO" : "INATIVO"}
                      </span>
                    </div>
                    {plano.descricao && <p className="text-xs text-gray-400 mt-1">{plano.descricao}</p>}
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plano.valor_mensal)}
                    </span>
                    <span className="text-xs text-gray-400">/mês</span>
                    {plano.valor_anual && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plano.valor_anual)}/ano (economia de {Math.round((1 - plano.valor_anual / (plano.valor_mensal * 12)) * 100)}%)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <Users size={12} /> Até {plano.limite_usuarios} usuários
                  </div>
                  {(plano.features || []).length > 0 && (
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plano.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                    <button onClick={() => abrirEditarPlano(plano)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50">
                      <Edit3 size={13} /> Editar
                    </button>
                    <button onClick={() => setConfirmDelPlano(plano.id)}
                      className="p-2 border border-gray-200 rounded-lg text-xs text-red-400 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB ASSINATURAS ── */}
      {tab === "assinaturas" && (
        <>
          <div className="flex justify-end mb-5">
            <button onClick={() => setShowModalAss(true)}
              className="flex w-full md:w-auto items-center justify-center gap-2 bg-[#F25C26] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600">
              <Plus size={15} /> Nova Assinatura
            </button>
          </div>
          {loadingAss ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" /></div> : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  <tr>
                    <th className="p-4 text-left">Cliente</th>
                    <th className="p-4 text-left">Plano</th>
                    <th className="p-4 text-left">Valor/mês</th>
                    <th className="p-4 text-left">Gateway</th>
                    <th className="p-4 text-left">Vencimento</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(assinaturas || []).length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center text-gray-400 text-sm">Nenhuma assinatura cadastrada</td></tr>
                  )}
                  {assinaturas?.map(a => {
                    const s = STATUS_ASS[a.status] ?? STATUS_ASS.cancelado;
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                              {a.saas_tenants?.nome_empresa?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{a.saas_tenants?.nome_empresa || a.tenant_id.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{a.plano_nome || a.saas_planos?.nome || "—"}</td>
                        <td className="p-4 text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(a.valor_mensal) || 0)}
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{a.gateway}</span>
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${s.cls}`}>
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select value={a.status}
                            onChange={e => alterarStatusAss.mutate({ id: a.id, status: e.target.value })}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                            {Object.entries(STATUS_ASS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Plano */}
      {showModalPlano && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h2 className="font-bold text-gray-900 text-xl mb-6">{editandoPlano ? "Editar Plano" : "Novo Plano"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Produto *</label>
                <select value={formPlano.produto_id} onChange={e => setFormPlano(p => ({ ...p, produto_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="">Selecionar produto…</option>
                  {produtos?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              {[
                { key: "nome", label: "Nome do Plano *", placeholder: "Ex: Starter, Professional, Enterprise" },
                { key: "descricao", label: "DescriçÍo", placeholder: "Breve descriçÍo do plano" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">{f.label}</label>
                  <input value={(formPlano as any)[f.key]} onChange={e => setFormPlano(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Valor Mensal (R$) *</label>
                  <input type="number" value={formPlano.valor_mensal} onChange={e => setFormPlano(p => ({ ...p, valor_mensal: e.target.value }))}
                    placeholder="297"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Valor Anual (R$)</label>
                  <input type="number" value={formPlano.valor_anual} onChange={e => setFormPlano(p => ({ ...p, valor_anual: e.target.value }))}
                    placeholder="2673"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Limite de Usuários</label>
                <input type="number" value={formPlano.limite_usuarios} onChange={e => setFormPlano(p => ({ ...p, limite_usuarios: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Features (uma por linha)</label>
                <textarea value={formPlano.features} onChange={e => setFormPlano(p => ({ ...p, features: e.target.value }))}
                  rows={4} placeholder={"Módulos essenciais\nSuporte por email\n10 GB armazenamento"}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={formPlano.destaque} onChange={e => setFormPlano(p => ({ ...p, destaque: e.target.checked }))} className="rounded" />
                  Plano destaque
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={formPlano.ativo} onChange={e => setFormPlano(p => ({ ...p, ativo: e.target.checked }))} className="rounded" />
                  Ativo
                </label>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button onClick={() => setShowModalPlano(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => salvarPlano.mutate()} disabled={salvarPlano.isPending || !formPlano.nome || !formPlano.produto_id || !formPlano.valor_mensal}
                className="flex-1 px-4 py-3 bg-[#F25C26] text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-60">
                {salvarPlano.isPending ? <Loader2 size={16} className="animate-spin" /> : editandoPlano ? "Salvar" : "Criar Plano"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Assinatura */}
      {showModalAss && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-orange-500" size={22} />
              <h2 className="font-bold text-gray-900 text-xl">Nova Assinatura</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Cliente (Tenant) *</label>
                <select value={formAss.tenant_id} onChange={e => setFormAss(f => ({ ...f, tenant_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="">Selecionar cliente…</option>
                  {tenants?.map(t => <option key={t.id} value={t.id}>{t.nome_empresa}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Plano</label>
                <select value={formAss.plano_id} onChange={e => onSelectPlano(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="">Selecionar plano (ou digitar manual)</option>
                  {planos?.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor_mensal}/mês</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Valor/mês (R$) *</label>
                  <input type="number" value={formAss.valor_mensal} onChange={e => setFormAss(f => ({ ...f, valor_mensal: e.target.value }))}
                    placeholder="297"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Status</label>
                  <select value={formAss.status} onChange={e => setFormAss(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {Object.entries(STATUS_ASS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Gateway</label>
                  <select value={formAss.gateway} onChange={e => setFormAss(f => ({ ...f, gateway: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {GATEWAYS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Próx. Vencimento</label>
                  <input type="date" value={formAss.data_vencimento} onChange={e => setFormAss(f => ({ ...f, data_vencimento: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Observações</label>
                <input value={formAss.observacoes} onChange={e => setFormAss(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Notas internas sobre esta assinatura"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button onClick={() => setShowModalAss(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => criarAssinatura.mutate()} disabled={criarAssinatura.isPending || !formAss.tenant_id || !formAss.valor_mensal}
                className="flex-1 px-4 py-3 bg-[#F25C26] text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-60">
                {criarAssinatura.isPending ? <Loader2 size={16} className="animate-spin" /> : "Criar Assinatura"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Plano */}
      {confirmDelPlano && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Excluir plano?</h3>
            <p className="text-sm text-gray-500 mb-6">Assinaturas vinculadas perderÍo a referência ao plano.</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={() => setConfirmDelPlano(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => deletarPlano.mutate(confirmDelPlano)} disabled={deletarPlano.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                {deletarPlano.isPending ? <Loader2 size={16} className="animate-spin" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

