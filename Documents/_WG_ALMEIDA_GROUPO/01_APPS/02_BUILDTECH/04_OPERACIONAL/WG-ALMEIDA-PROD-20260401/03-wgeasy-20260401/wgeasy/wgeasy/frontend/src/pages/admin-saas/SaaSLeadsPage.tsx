import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageSquare, UserPlus, Trash2, Clock, Globe, Loader2,
  Search, CheckCircle2, TrendingUp, Users, AlertCircle
} from "lucide-react";

export default function SaaSLeadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "convertido">("todos");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["saas-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_leads_landing")
        .select("*, saas_produtos(nome)")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: produtos } = useQuery({
    queryKey: ["saas-produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("saas_produtos").select("id, nome");
      return data || [];
    }
  });

  const converterLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saas_leads_landing").update({ convertido: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-leads"] });
      toast({ title: "Lead convertido!", variant: "success" });
    }
  });

  const deletarLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saas_leads_landing").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-leads"] });
      toast({ title: "Lead removido!", variant: "success" });
      setConfirmDel(null);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const total = leads?.length || 0;
  const convertidos = leads?.filter(l => l.convertido).length || 0;
  const pendentes = total - convertidos;
  const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0;

  const filtrados = (leads || []).filter(l => {
    const matchBusca = !busca ||
      l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      l.email?.toLowerCase().includes(busca.toLowerCase()) ||
      l.empresa?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || (filtroStatus === "convertido" ? l.convertido : !l.convertido);
    const matchProduto = filtroProduto === "todos" || l.produto_id === filtroProduto;
    return matchBusca && matchStatus && matchProduto;
  });

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#F25C26]" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Central de Leads</h1>
        <p className="text-gray-500 text-sm mt-1">Solicitações vindas das Landing Pages</p>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, icon: <Users size={18} />, color: "text-gray-700" },
          { label: "Pendentes", value: pendentes, icon: <AlertCircle size={18} />, color: "text-blue-600" },
          { label: "Convertidos", value: convertidos, icon: <CheckCircle2 size={18} />, color: "text-green-600" },
          { label: "ConversÍo", value: `${taxaConversao}%`, icon: <TrendingUp size={18} />, color: "text-orange-600" },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`flex items-center gap-2 mb-1`}>
              <span className={m.color}>{m.icon}</span>
              <span className="text-xs font-semibold uppercase text-gray-400">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, email ou empresa…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
        </div>
        <div className="flex gap-2">
          {(["todos", "pendente", "convertido"] as const).map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filtroStatus === s ? "bg-[#050C18] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {s === "todos" ? "Todos" : s === "pendente" ? "Pendentes" : "Convertidos"}
            </button>
          ))}
        </div>
        <select value={filtroProduto} onChange={e => setFiltroProduto(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200">
          <option value="todos">Todos os produtos</option>
          {produtos?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
            <tr>
              <th className="p-4">Lead / Empresa</th>
              <th className="p-4">Produto</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-900">{lead.nome}</div>
                  <div className="text-xs text-gray-500">{lead.empresa && `${lead.empresa} • `}{lead.email}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-[10px] font-bold uppercase">
                    {lead.saas_produtos?.nome || "—"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock size={12} /> {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <Globe size={10} /> Landing Page
                  </div>
                </td>
                <td className="p-4">
                  {lead.convertido
                    ? <span className="text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle2 size={13} /> Convertido</span>
                    : <span className="text-blue-600 text-xs font-medium flex items-center gap-1"><Clock size={13} /> Aguardando</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    {lead.whatsapp && (
                      <button onClick={() => window.open(`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`, "_blank")}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="WhatsApp">
                        <MessageSquare size={16} />
                      </button>
                    )}
                    {!lead.convertido && (
                      <button onClick={() => converterLead.mutate(lead.id)} disabled={converterLead.isPending}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Marcar convertido">
                        <UserPlus size={16} />
                      </button>
                    )}
                    <button onClick={() => setConfirmDel(lead.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum lead encontrado.</p>
          </div>
        )}
      </div>

      {/* Confirm Delete */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Excluir lead?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta açÍo não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => deletarLead.mutate(confirmDel)} disabled={deletarLead.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                {deletarLead.isPending ? <Loader2 size={16} className="animate-spin" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


