import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, TrendingUp, Search, MapPin, BarChart3, Loader2, AlertCircle, CheckCircle2, ArrowUpRight, BookOpen } from "lucide-react";
import { realEstateService } from "@/modules/realEstate/services/realEstateService";
import { calcularCustoObra } from "@/modules/realEstate/engine/iccriIntegration";
import { CUSTO_M2_2026 } from "@/modules/realEstate/models/types";
import type { PadraoImovel, TipoImovel, ResultadoAVM } from "@/modules/realEstate/models/types";
import { useAVM } from "@/modules/realEstate/hooks/useAVM";

const INSIGHT_CONFIG = {
  oportunidade:    { label: "Oportunidade",        color: "bg-green-100 text-green-700",  icon: "🎯" },
  abaixo_mercado:  { label: "Abaixo do Mercado",   color: "bg-blue-100 text-blue-700",    icon: "📉" },
  mercado:         { label: "No Mercado",           color: "bg-gray-100 text-gray-600",    icon: "✅" },
  acima_mercado:   { label: "Acima do Mercado",     color: "bg-yellow-100 text-yellow-700", icon: "📈" },
  supervalorizado: { label: "Supervalorizado",      color: "bg-red-100 text-red-700",      icon: "⚠️" },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export default function EasyRealStateDashboard() {
  const navigate = useNavigate();
  const { resultado, comparaveis, loading, erro, avaliar, limpar } = useAVM();
  const [cep, setCep] = useState("");
  const [area, setArea] = useState<number>(100);
  const [tipo, setTipo] = useState<TipoImovel>("apartamento");
  const [padrao, setPadrao] = useState<PadraoImovel>("medio");
  const [andar, setAndar] = useState<number | undefined>();
  const [temVista, setTemVista] = useState(false);
  const [reformado, setReformado] = useState(false);
  const [geocodando, setGeocodando] = useState(false);
  const [geoErro, setGeoErro] = useState<string | null>(null);

  async function handleAvaliar() {
    setGeoErro(null);
    setGeocodando(true);
    const geo = await realEstateService.geocodarCep(cep);
    setGeocodando(false);

    if (!geo) {
      setGeoErro("CEP não encontrado ou sem cobertura geográfica.");
      return;
    }

    await avaliar({
      id: `temp-${Date.now()}`,
      endereco: geo.endereco,
      cep: cep.replace(/\D/g, ""),
      bairro: geo.bairro || "",
      cidade: geo.cidade || "",
      estado: geo.estado || "",
      lat: geo.lat,
      lng: geo.lng,
      area_m2: area,
      tipo,
      padrao,
      andar,
      tem_vista: temVista,
      reformado,
    });
  }

  const custoObra = calcularCustoObra(area, padrao, "construcao");
  const custoReforma = calcularCustoObra(area, padrao, "reforma");
  const refM2 = CUSTO_M2_2026[padrao];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <Building2 className="text-orange-500" size={28} />
              EasyRealState
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Motor de Inteligência Imobiliária
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Avaliação AVM · Radar de preços · ICCRI integrado · Insights de mercado
            </p>
          </div>
          <button
            onClick={() => navigate("/sistema/easy-real-state/metodologia")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-4 py-2 rounded-xl transition-all flex-shrink-0"
          >
            <BookOpen size={15} /> Metodologia
          </button>
        </div>
      </header>

      {/* ─── Formulário de Avaliação ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Search size={16} className="text-orange-500" /> Avaliar Imóvel
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">CEP do Imóvel</label>
            <input
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Área (m²)</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoImovel)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="comercial">Comercial</option>
              <option value="terreno">Terreno</option>
              <option value="galpao">Galpão</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Padrão</label>
            <select
              value={padrao}
              onChange={(e) => setPadrao(e.target.value as PadraoImovel)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="popular">Popular</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto Padrão</option>
              <option value="luxo">Luxo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Andar (opcional)</label>
            <input
              type="number"
              value={andar ?? ""}
              onChange={(e) => setAndar(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ex: 10"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={temVista} onChange={(e) => setTemVista(e.target.checked)} className="accent-orange-500" />
              Vista privilegiada (+10%)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={reformado} onChange={(e) => setReformado(e.target.checked)} className="accent-orange-500" />
              Reformado (+8%)
            </label>
          </div>
        </div>

        {geoErro && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600 mb-4">
            <AlertCircle size={14} /> {geoErro}
          </div>
        )}

        <button
          onClick={handleAvaliar}
          disabled={loading || geocodando || !cep || !area}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition disabled:opacity-60"
        >
          {(loading || geocodando) ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
          {geocodando ? "Geocodando CEP..." : loading ? "Calculando AVM..." : "Avaliar Imóvel"}
        </button>
      </div>

      {/* ─── Resultado AVM ───────────────────────────────────────────────────── */}
      {erro && (
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm text-yellow-700 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {resultado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6 gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800 text-lg">Resultado da Avaliação AVM</h3>
              <div className="flex gap-2 flex-wrap">
                {resultado.score_confianca <= 55 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-yellow-100 text-yellow-700">
                    Modo Demo — dados de referência
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${INSIGHT_CONFIG[resultado.insight.label].color}`}>
                  {INSIGHT_CONFIG[resultado.insight.label].icon} {INSIGHT_CONFIG[resultado.insight.label].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-600 font-semibold mb-1">VALOR ESTIMADO</p>
                <p className="text-2xl font-bold text-orange-700">{fmt(resultado.preco_total_estimado)}</p>
                <p className="text-xs text-gray-500 mt-1">{fmt(resultado.preco_m2_ajustado)}/m²</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-1">FAIXA DE MERCADO</p>
                <p className="text-sm font-bold text-gray-700">{fmt(resultado.faixa_minima)}</p>
                <p className="text-xs text-gray-400">até</p>
                <p className="text-sm font-bold text-gray-700">{fmt(resultado.faixa_maxima)}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-4">
              {resultado.insight.descricao}
              {resultado.insight.percentual_desvio !== 0 && (
                <span className="ml-1 font-semibold">
                  ({resultado.insight.percentual_desvio > 0 ? "+" : ""}{resultado.insight.percentual_desvio.toFixed(1)}% da mediana)
                </span>
              )}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{resultado.total_comparaveis} imóveis comparáveis analisados</span>
              <span className={`font-bold ${resultado.score_confianca >= 70 ? "text-green-600" : resultado.score_confianca >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                Confiança: {resultado.score_confianca}/100
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Fatores de Ajuste</h4>
              {Object.entries(resultado.fatores).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-500">{k.replace("fator_", "")}</span>
                  <span className={`font-semibold ${v > 1 ? "text-green-600" : v < 1 ? "text-red-500" : "text-gray-600"}`}>
                    ×{(v as number).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Comparáveis Utilizados ──────────────────────────────────────────── */}
      {comparaveis.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={16} className="text-orange-500" />
            Imóveis Comparáveis Utilizados
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
              {comparaveis.length} imóveis
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="text-left pb-3 pr-4">Endereço</th>
                  <th className="text-right pb-3 pr-4">Área m²</th>
                  <th className="text-right pb-3 pr-4">Preço m²</th>
                  <th className="text-right pb-3 pr-4">Valor Total</th>
                  <th className="text-right pb-3 pr-4">Distância</th>
                  <th className="text-right pb-3">Similaridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comparaveis.slice(0, 10).map((c) => (
                  <tr key={c.transacao.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-2.5 pr-4">
                      <p className="text-gray-700 font-medium truncate max-w-[200px]">{c.transacao.endereco}</p>
                      <p className="text-xs text-gray-400">{c.transacao.bairro} · {new Date(c.transacao.data).toLocaleDateString("pt-BR")}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-gray-600">{c.transacao.area_m2}m²</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-gray-800">{fmt(c.preco_m2)}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-600">{fmt(c.transacao.valor)}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-500">{c.distancia_metros < 1000 ? `${c.distancia_metros}m` : `${(c.distancia_metros/1000).toFixed(1)}km`}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${c.similaridade_score >= 70 ? "bg-green-100 text-green-700" : c.similaridade_score >= 40 ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-500"}`}>
                        {c.similaridade_score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparaveis.length > 10 && (
            <p className="text-xs text-gray-400 mt-3 text-center">Mostrando 10 de {comparaveis.length} comparáveis ordenados por similaridade</p>
          )}
        </div>
      )}

      {/* ─── ICCRI — Custo de Obra Integrado ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <BarChart3 size={16} className="text-orange-500" /> ICCRI — Custo de Construção/Reforma 2026
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Padrão selecionado: <strong>{padrao}</strong> · {area}m² · Base SINAPI Mar/2026 · Referência SP Capital
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-bold mb-2">CONSTRUÇÃO NOVA</p>
            <p className="text-xl font-bold text-blue-700">{fmt(custoObra.referencia)}</p>
            <p className="text-xs text-gray-500">{fmt(custoObra.por_m2)}/m² · Faixa: {fmt(custoObra.minimo)} – {fmt(custoObra.maximo)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600 font-bold mb-2">REFORMA COMPLETA</p>
            <p className="text-xl font-bold text-purple-700">{fmt(custoReforma.referencia)}</p>
            <p className="text-xs text-gray-500">{fmt(custoReforma.por_m2)}/m² · Faixa: {fmt(custoReforma.minimo)} – {fmt(custoReforma.maximo)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["popular","medio","alto","luxo"] as PadraoImovel[]).map((p) => (
            <div key={p}
              onClick={() => setPadrao(p)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition text-center ${padrao === p ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}
            >
              <p className="text-xs font-bold text-gray-600 capitalize mb-1">{p}</p>
              <p className="text-sm font-bold text-gray-800">{fmt(CUSTO_M2_2026[p].referencia)}/m²</p>
              <p className="text-[10px] text-gray-400">{fmt(CUSTO_M2_2026[p].min)}–{fmt(CUSTO_M2_2026[p].max)}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Valores de referência ICCRI/SINAPI. Inclui material (56%) + mão de obra (44%).
          Não inclui terreno, projetos, fundações especiais, áreas externas ou instalações de automação.
          INCC acumulado 12m: 5,81% (Mar/2026).
        </p>
      </div>
    </div>
  );
}
