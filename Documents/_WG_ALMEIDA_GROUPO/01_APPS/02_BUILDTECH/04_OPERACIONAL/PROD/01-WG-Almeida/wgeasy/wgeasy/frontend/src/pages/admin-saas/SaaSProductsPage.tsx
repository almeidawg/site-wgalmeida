import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  Package, Plus, Search, Settings, Trash2, Edit3, ToggleLeft, ToggleRight,
  Loader2, Users, Copy, ExternalLink
} from "lucide-react";

type Produto = {
  id: string; nome: string; slug: string; descricao: string;
  status: string; ativo: boolean; criado_em: string;
  _tenants?: number; _modulos?: number;
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SaaSProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({ nome: "", slug: "", descricao: "" });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["saas_products_full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_produtos")
        .select("id, nome, slug, descricao, status, ativo, criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all((data || []).map(async (p) => {
        const [{ count: tenants }, { count: modulos }] = await Promise.all([
          supabase.from("saas_tenants").select("id", { count: "exact", head: true }).eq("produto_id", p.id),
          supabase.from("saas_produtos_modulos").select("modulo_id", { count: "exact", head: true }).eq("produto_id", p.id),
        ]);
        return { ...p, _tenants: tenants || 0, _modulos: modulos || 0 };
      }));
      return enriched as Produto[];
    },
  });

  const salvarProduto = useMutation({
    mutationFn: async () => {
      if (editando) {
        const { error } = await supabase.from("saas_produtos")
          .update({ nome: form.nome, slug: form.slug, descricao: form.descricao })
          .eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saas_produtos")
          .insert({ nome: form.nome, slug: form.slug, descricao: form.descricao, status: "ativo", ativo: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas_products_full"] });
      qc.invalidateQueries({ queryKey: ["saas-produtos"] });
      toast({ title: editando ? "Produto atualizado!" : "Produto criado!", variant: "success" });
      setShowModal(false); setEditando(null); setForm({ nome: "", slug: "", descricao: "" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("saas_produtos")
        .update({ ativo, status: ativo ? "ativo" : "inativo" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas_products_full"] }); },
  });

  const deletarProduto = useMutation({
    mutationFn: async (id: string) => {
      // Desvincular tenants antes de deletar o produto (FK constraint)
      const { error: unlinkError } = await supabase
        .from("saas_tenants")
        .update({ produto_id: null })
        .eq("produto_id", id);
      if (unlinkError) throw unlinkError;
      const { error } = await supabase.from("saas_produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas_products_full"] });
      qc.invalidateQueries({ queryKey: ["saas-produtos"] });
      toast({ title: "Produto removido!", variant: "success" });
      setConfirmDel(null);
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  function abrirEditar(p: Produto) {
    setEditando(p); setForm({ nome: p.nome, slug: p.slug, descricao: p.descricao || "" }); setShowModal(true);
  }

  const filtrados = (produtos || []).filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.slug.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos SaaS</h1>
          <p className="text-gray-500 text-sm mt-1">{produtos?.length || 0} produtos cadastrados</p>
        </div>
        <button onClick={() => { setEditando(null); setForm({ nome: "", slug: "", descricao: "" }); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#F25C26] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
          <Plus size={16} /> Novo Produto
        </button>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou slug…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${p.ativo ? "bg-orange-50" : "bg-gray-100"}`}>📦</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.nome}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.slug}</code>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} /> {p._tenants} clientes</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Package size={11} /> {p._modulos} módulos</span>
                  </div>
                  {p.descricao && <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{p.descricao}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => navigate("/admin-saas/landing-pages")} title="Landing Page"
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"><Settings size={16} /></button>
                <button onClick={() => navigate("/admin-saas/clientes")} title="Ver clientes"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><ExternalLink size={16} /></button>
                <button onClick={() => { navigator.clipboard.writeText(p.slug); toast({ title: "Slug copiado!" }); }} title="Copiar slug"
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><Copy size={16} /></button>
                <button onClick={() => toggleAtivo.mutate({ id: p.id, ativo: !p.ativo })} title={p.ativo ? "Desativar" : "Ativar"}
                  className={`p-2 rounded-lg transition-all ${p.ativo ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                  {p.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => abrirEditar(p)} title="Editar"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                <button onClick={() => setConfirmDel(p.id)} title="Excluir"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="font-bold text-gray-900 text-xl mb-6">{editando ? `Editar: ${editando.nome}` : "Novo Produto SaaS"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nome *</label>
                <input value={form.nome}
                  onChange={e => { const nome = e.target.value; setForm(p => ({ ...p, nome, slug: editando ? p.slug : slugify(nome) })); }}
                  placeholder="Ex: WGEasy Food, WillHub…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Slug (URL único)</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">DescriçÍo</label>
                <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  rows={3} placeholder="Descreva o produto…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => salvarProduto.mutate()} disabled={salvarProduto.isPending || !form.nome || !form.slug}
                className="flex-1 px-4 py-3 bg-[#F25C26] text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-60">
                {salvarProduto.isPending ? <Loader2 size={16} className="animate-spin" /> : editando ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Confirmar exclusÍo?</h3>
            <p className="text-sm text-gray-500 mb-6">Tenants e módulos associados serÍo desvinculados.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => deletarProduto.mutate(confirmDel)} disabled={deletarProduto.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                {deletarProduto.isPending ? <Loader2 size={16} className="animate-spin" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

