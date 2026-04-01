// ============================================================
// GRUPO EMPRESAS SECTION — Dashboard Principal
// Cards das empresas do Grupo WG Almeida com stats rápidos
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Briefcase, ChevronRight, TrendingUp } from "lucide-react";
import { listarEmpresas } from "@/lib/empresasApi";
import type { EmpresaGrupo } from "@/types/empresas";
import { supabase } from "@/lib/supabaseClient";
import { formatarCNPJ } from "@/types/empresas";

interface EmpresaStats {
  clientes: number;
  obras: number;
}

interface EmpresaComStats extends EmpresaGrupo {
  stats?: EmpresaStats;
}

// Mapa de nucleo_nome → ícone de negócio e cor de fundo do card
const NUCLEO_STYLE: Record<string, { bg: string; border: string; badge: string }> = {
  Arquitetura:              { bg: "bg-teal-50",   border: "border-teal-100",   badge: "bg-teal-100 text-teal-700" },
  Engenharia:               { bg: "bg-blue-50",   border: "border-blue-100",   badge: "bg-blue-100 text-blue-700" },
  Marcenaria:               { bg: "bg-amber-50",  border: "border-amber-100",  badge: "bg-amber-100 text-amber-700" },
  "WG Designer de Interiores": { bg: "bg-violet-50", border: "border-violet-100", badge: "bg-violet-100 text-violet-700" },
  "MOMA Planejados":        { bg: "bg-orange-50", border: "border-orange-100", badge: "bg-orange-100 text-orange-700" },
  Produtos:                 { bg: "bg-yellow-50", border: "border-yellow-100", badge: "bg-yellow-100 text-yellow-700" },
};

const DEFAULT_STYLE = { bg: "bg-gray-50", border: "border-gray-100", badge: "bg-gray-100 text-gray-600" };

export default function GrupoEmpresasSection() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaComStats[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalObras, setTotalObras] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [lista, clientesRes, obrasRes] = await Promise.all([
          listarEmpresas(),
          supabase.from("pessoas").select("id", { count: "exact", head: true }).eq("tipo", "CLIENTE").eq("ativo", true),
          supabase.from("obras").select("id", { count: "exact", head: true }),
        ]);

        setEmpresas(lista);
        setTotalClientes(clientesRes.count ?? 0);
        setTotalObras(obrasRes.count ?? 0);
      } catch (e) {
        console.error("[GrupoEmpresas]", e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Header da seçÍo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-caption uppercase tracking-wider text-gray-500 font-medium">
            Grupo WG Almeida · {empresas.length} empresas
          </h2>
        </div>

        {/* Totalizadores rápidos */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/pessoas/clientes")}
            className="flex items-center gap-1.5 text-caption text-gray-500 hover:text-violet-600 transition-colors group"
          >
            <Users className="w-3.5 h-3.5 group-hover:text-violet-500" />
            <span className="font-medium text-gray-700">{totalClientes.toLocaleString("pt-BR")}</span>
            <span>clientes</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/obras")}
            className="flex items-center gap-1.5 text-caption text-gray-500 hover:text-blue-600 transition-colors group"
          >
            <Briefcase className="w-3.5 h-3.5 group-hover:text-blue-500" />
            <span className="font-medium text-gray-700">{totalObras}</span>
            <span>obras</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Cards das empresas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {empresas.map((empresa) => {
          const style = empresa.nucleo_nome
            ? (NUCLEO_STYLE[empresa.nucleo_nome] ?? DEFAULT_STYLE)
            : DEFAULT_STYLE;

          const corNucleo = empresa.nucleo_cor ?? "#999";

          return (
            <button
              key={empresa.id}
              type="button"
              onClick={() => navigate(`/empresas?id=${empresa.id}`)}
              className={`
                text-left p-4 rounded-xl border transition-all
                ${style.bg} ${style.border}
                hover:shadow-md hover:scale-[1.02] active:scale-[0.99]
                group
              `}
            >
              {/* Indicador de cor do núcleo */}
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: corNucleo }}
                />
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>

              {/* Nome fantasia */}
              <p className="text-[11px] sm:text-[12px] font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
                {empresa.nome_fantasia || empresa.razao_social}
              </p>

              {/* Badge do núcleo */}
              {empresa.nucleo_nome && (
                <span className={`inline-block text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>
                  {empresa.nucleo_nome}
                </span>
              )}

              {/* CNPJ */}
              {empresa.cnpj && (
                <p className="text-[9px] text-gray-400 mt-1.5 font-mono">
                  {formatarCNPJ(empresa.cnpj)}
                </p>
              )}
            </button>
          );
        })}

        {/* Card de açÍo: Adicionar empresa */}
        <button
          type="button"
          onClick={() => navigate("/empresas")}
          className="text-left p-4 rounded-xl border border-dashed border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-[11px] sm:text-[12px] font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
            Ver todas as empresas
          </p>
          <p className="text-[9px] text-gray-300 mt-1">
            Gerenciar grupo
          </p>
        </button>
      </div>
    </section>
  );
}

