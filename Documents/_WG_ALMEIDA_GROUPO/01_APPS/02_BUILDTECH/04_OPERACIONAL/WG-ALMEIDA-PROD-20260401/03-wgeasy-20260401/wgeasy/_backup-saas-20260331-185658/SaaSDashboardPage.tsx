import React from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Users, Package, CreditCard, ArrowUpRight, TrendingUp, Loader2, Eye, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { saasService } from "@/services/saasService";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/lib/supabaseClient";

export default function SaaSDashboardPage() {
  const navigate = useNavigate();
  const { setTenantOverride } = useTenant();

  const { data: produtos, isLoading: loadingProds } = useQuery({
    queryKey: ["saas-produtos"],
    queryFn: saasService.getProdutos,
  });

  const { data: metricas, isLoading: loadingMetricas } = useQuery({
    queryKey: ["saas-metricas"],
    queryFn: saasService.getMetrasGlobais,
  });

  async function handlePreviewTheme(produtoId: string) {
    const { data } = await supabase
      .from("saas_tenants").select("*").eq("produto_id", produtoId).limit(1).single();
    if (data) setTenantOverride(data);
  }

  if (loadingProds || loadingMetricas) {
    return <div className="h-full w-full flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#F25C26]" size={40} /></div>;
  }

  const mrrFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metricas?.mrrTotal || 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-light text-gray-900">
          <Rocket className="text-[#F25C26] shrink-0" />
          WG BuildTech Hub
          <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            Cérebro SaaS
          </span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie seu portfólio de produtos e faturamento multi-tenant.</p>
      </header>

      {/* MÉTRICAS GLOBAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        <MetricCard
          title="MRR Total" value={mrrFormatado} sub="Receita recorrente mensal"
          icon={<TrendingUp size={20} />} color="text-green-600" bg="bg-green-50"
          onClick={() => navigate("/admin-saas/billing")} />
        <MetricCard
          title="Clientes Ativos" value={metricas?.clientesAtivos || 0} sub="Contratos pagos"
          icon={<Users size={20} />} color="text-blue-600" bg="bg-blue-50"
          onClick={() => navigate("/admin-saas/clientes")} />
        <MetricCard
          title="Trials Ativos" value={metricas?.trialsAtivos || 0} sub="Em período de avaliaçÍo"
          icon={<Package size={20} />} color="text-orange-600" bg="bg-orange-50"
          onClick={() => navigate("/admin-saas/clientes")} />
        <MetricCard
          title="Taxa de Churn" value={`${metricas?.churnRate || 0}%`} sub="Cancelamentos / total"
          icon={<CreditCard size={20} />} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3 mb-8">
        <button onClick={() => navigate("/admin-saas/builder")}
          className="flex w-full items-center justify-center gap-2 bg-[#F25C26] px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-orange-600 transition-all xl:w-auto">
          <Plus size={15} /> Criar Produto
        </button>
        <button onClick={() => navigate("/admin-saas/clientes")}
          className="flex w-full items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all xl:w-auto">
          <Users size={15} /> Gerenciar Clientes
        </button>
        <button onClick={() => navigate("/admin-saas/leads")}
          className="flex w-full items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all xl:w-auto">
          <TrendingUp size={15} /> Central de Leads
        </button>
        <button onClick={() => navigate("/admin-saas/billing")}
          className="flex w-full items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all xl:w-auto">
          <CreditCard size={15} /> Planos e Cobrança
        </button>
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-4">Seus Produtos ({produtos?.length || 0})</h2>

      {/* CARDS DE PRODUTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {(produtos || []).length === 0 && (
          <div className="col-span-3 p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-gray-400 text-sm">Nenhum produto cadastrado ainda.</p>
            <button onClick={() => navigate("/admin-saas/builder")}
              className="mt-4 text-[#F25C26] font-medium text-sm">+ Criar Primeiro Produto</button>
          </div>
        )}
        {produtos?.map(prod => (
          <div key={prod.id} onClick={() => navigate("/admin-saas/produtos")}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 group cursor-pointer flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">📦</div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${prod.status === "ativo" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {prod.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-[#F25C26] transition-colors">{prod.nome}</h3>
              <p className="text-xs text-gray-400 mb-4 line-clamp-2">{prod.descricao}</p>
            </div>
            <div className="space-y-2 mt-4">
              <button onClick={e => { e.stopPropagation(); handlePreviewTheme(prod.id); }}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors border border-gray-100 flex items-center justify-center gap-2">
                <Eye size={14} /> Preview White-Label
              </button>
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[#F25C26] font-medium text-sm">
                <span>Gerenciar Clientes</span>
                <ArrowUpRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon, color, bg, onClick }: any) {
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase">{title}</span>
        <div className={`${bg} ${color} p-2 rounded-lg`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

