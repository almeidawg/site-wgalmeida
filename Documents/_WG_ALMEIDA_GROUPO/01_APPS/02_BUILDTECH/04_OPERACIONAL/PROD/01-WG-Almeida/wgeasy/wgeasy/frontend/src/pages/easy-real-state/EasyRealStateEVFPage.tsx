// EasyRealState — Cálculo EVF (Estimativa de Valor Final)
import React, { useState } from "react";
import { Calculator, MapPin, Building2, TrendingUp, Info, BarChart3, ChevronRight } from "lucide-react";
import { realEstateService } from "@/modules/realEstate/services/realEstateService";
import { useAVM } from "@/modules/realEstate/hooks/useAVM";
import type { PadraoImovel, TipoImovel } from "@/modules/realEstate/models/types";

// ─── Fatores de ajuste EVF ─────────────────────────────────────────────────
const FATOR_PADRAO: Record<PadraoImovel, number> = {
  popular: 0.70,
  medio:   1.00,
  alto:    1.35,
  luxo:    1.80,
};

const FATOR_CONSERVACAO: Record<number, number> = {
  1: 1.00, // Novo / Lançamento
  2: 0.92, // Bom estado
  3: 0.82, // Regular
  4: 0.68, // Necessita reformas
  5: 0.55, // Ruim / Demolição
};

const LABEL_CONSERVACAO: Record<number, string> = {
  1: "Novo / Lançamento",
  2: "Bom estado",
  3: "Regular",
  4: "Necessita reformas",
  5: "Ruim",
};

const DIFERENCIAIS = [
  { id: "elevador",      label: "Elevador",       peso: 0.03 },
  { id: "piscina",       label: "Piscina",         peso: 0.05 },
  { id: "academia",      label: "Academia",        peso: 0.02 },
  { id: "portaria_24h",  label: "Portaria 24h",    peso: 0.03 },
  { id: "churrasqueira", label: "Churrasqueira",   peso: 0.02 },
  { id: "vista",         label: "Vista privilegiada", peso: 0.04 },
  { id: "reformado",     label: "Recém reformado", peso: 0.05 },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

interface EVFResultado {
  valor_avaliado: number;
  valor_m2: number;
  faixa_minima: number;
  faixa_maxima: number;
  valor_base: number;
  fator_padrao: number;
  fator_conservacao: number;
  fator_diferenciais: number;
  m2_base_mercado: number;
  comparaveis_usados: number;
}

export default function EasyRealStateEVFPage() {
  // Localização
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [geocodando, setGeocodando] = useState(false);
  const [geoErro, setGeoErro] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);

  // Dados do imóvel
  const [area, setArea] = useState<number>(80);
  const [tipo, setTipo] = useState<TipoImovel>("apartamento");
  const [padrao, setPadrao] = useState<PadraoImovel>("medio");
  const [conservacao, setConservacao] = useState<number>(2);
  const [dormitorios, setDormitorios] = useState<number>(2);
  const [vagas, setVagas] = useState<number>(1);
  const [diferenciais, setDiferenciais] = useState<Set<string>>(new Set());

  const [resultado, setResultado] = useState<EVFResultado | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erroCalculo, setErroCalculo] = useState<string | null>(null);

  const { avaliar, resultado: avmResultado, comparaveis } = useAVM();

  async function handleGeocod() {
    setGeoErro(null);
    setGeocodando(true);
    const geo = await realEstateService.geocodarCep(cep);
    setGeocodando(false);
    if (!geo) {
      setGeoErro("CEP não encontrado.");
      return;
    }
    setEndereco(geo.endereco);
    setCoordenadas({ lat: geo.lat, lng: geo.lng });
  }

  function toggleDiferencial(id: string) {
    setDiferenciais((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCalcular() {
    if (!coordenadas) {
      setErroCalculo("Geocodifique o CEP primeiro.");
      return;
    }
    setErroCalculo(null);
    setCalculando(true);

    try {
      await avaliar({
        id: `evf-${Date.now()}`,
        endereco,
        cep: cep.replace(/\D/g, ""),
        bairro: "",
        cidade: "",
        estado: "",
        lat: coordenadas.lat,
        lng: coordenadas.lng,
        area_m2: area,
        tipo,
        padrao,
        andar: undefined,
        tem_vista: diferenciais.has("vista"),
        reformado: diferenciais.has("reformado"),
      });
    } catch {
      setErroCalculo("Erro ao buscar dados de mercado.");
    } finally {
      setCalculando(false);
    }
  }

  // Calcular EVF quando AVM retorna
  React.useEffect(() => {
    if (!avmResultado) return;

    const m2_base = avmResultado.valor_m2_estimado;
    const fp = FATOR_PADRAO[padrao];
    const fc = FATOR_CONSERVACAO[conservacao];
    const fd = DIFERENCIAIS.filter((d) => diferenciais.has(d.id)).reduce((s, d) => s + d.peso, 0);

    const valor_base = m2_base * area;
    const valor_avaliado = Math.round(valor_base * fp * fc * (1 + fd));
    const valor_m2_final = Math.round(valor_avaliado / area);

    setResultado({
      valor_avaliado,
      valor_m2: valor_m2_final,
      faixa_minima: Math.round(valor_avaliado * 0.85),
      faixa_maxima: Math.round(valor_avaliado * 1.15),
      valor_base,
      fator_padrao: fp,
      fator_conservacao: fc,
      fator_diferenciais: fd,
      m2_base_mercado: m2_base,
      comparaveis_usados: comparaveis?.length ?? 0,
    });
  }, [avmResultado]);

  const somaDiferenciais = DIFERENCIAIS.filter((d) => diferenciais.has(d.id)).reduce((s, d) => s + d.peso, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Calculator className="text-orange-500" size={28} />
          Cálculo EVF
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
            Estimativa de Valor Final
          </span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Valor avaliado com fatores de padrão, conservação, localização e diferenciais — baseado em comparáveis reais
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Formulário ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Localização */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
              <MapPin size={16} className="text-orange-500" /> Localização
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="CEP (ex: 04561-000)"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={9}
              />
              <button
                onClick={handleGeocod}
                disabled={geocodando || cep.replace(/\D/g, "").length < 8}
                className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {geocodando ? "..." : "Buscar"}
              </button>
            </div>
            {geoErro && <p className="text-red-500 text-xs mt-2">{geoErro}</p>}
            {endereco && (
              <p className="text-green-700 text-xs mt-2 flex items-center gap-1">
                <span className="text-green-500">✓</span> {endereco}
              </p>
            )}
          </section>

          {/* Dados do imóvel */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
              <Building2 size={16} className="text-orange-500" /> Dados do Imóvel
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoImovel)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="comercial">Comercial</option>
                  <option value="terreno">Terreno</option>
                  <option value="galpao">Galpão</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Padrão</label>
                <select
                  value={padrao}
                  onChange={(e) => setPadrao(e.target.value as PadraoImovel)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="popular">Popular</option>
                  <option value="medio">Médio</option>
                  <option value="alto">Alto</option>
                  <option value="luxo">Luxo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Área privativa (m²)</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  min={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Conservação</label>
                <select
                  value={conservacao}
                  onChange={(e) => setConservacao(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} — {LABEL_CONSERVACAO[n]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dormitórios</label>
                <input
                  type="number"
                  value={dormitorios}
                  onChange={(e) => setDormitorios(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vagas de garagem</label>
                <input
                  type="number"
                  value={vagas}
                  onChange={(e) => setVagas(Number(e.target.value))}
                  min={0}
                  max={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Diferenciais */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
              <TrendingUp size={16} className="text-orange-500" /> Diferenciais
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {DIFERENCIAIS.map((d) => (
                <label
                  key={d.id}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    diferenciais.has(d.id)
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={diferenciais.has(d.id)}
                    onChange={() => toggleDiferencial(d.id)}
                  />
                  <span>{diferenciais.has(d.id) ? "✓" : "○"}</span>
                  {d.label}
                  <span className="ml-auto text-xs opacity-60">{fmtPct(d.peso)}</span>
                </label>
              ))}
            </div>
            {somaDiferenciais > 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Fator diferenciais: {fmtPct(somaDiferenciais)} ({diferenciais.size} item(s))
              </p>
            )}
          </section>

          <button
            onClick={handleCalcular}
            disabled={!coordenadas || calculando}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {calculando ? (
              <>
                <span className="animate-spin text-base">⟳</span> Calculando...
              </>
            ) : (
              <>
                <Calculator size={18} /> Calcular Valor EVF
              </>
            )}
          </button>
          {erroCalculo && (
            <p className="text-red-500 text-sm text-center">{erroCalculo}</p>
          )}
        </div>

        {/* ─── Resultado ──────────────────────────────────────────────── */}
        <div className="space-y-5">
          {!resultado ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center text-gray-400 min-h-[300px]">
              <Calculator size={40} className="mb-3 opacity-30" />
              <p className="font-medium">Preencha o formulário e clique em Calcular</p>
              <p className="text-sm mt-1">O resultado aparecerá aqui com detalhamento completo</p>
            </div>
          ) : (
            <>
              {/* Valor principal */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <p className="text-sm font-medium opacity-80 mb-1">Valor EVF Estimado</p>
                <p className="text-4xl font-bold">{fmt(resultado.valor_avaliado)}</p>
                <p className="text-sm opacity-80 mt-1">{fmt(resultado.valor_m2)} / m²</p>
                <div className="mt-4 flex gap-3 text-sm">
                  <div className="bg-white/20 rounded-lg px-3 py-2">
                    <p className="opacity-75 text-xs">Mínimo (−15%)</p>
                    <p className="font-semibold">{fmt(resultado.faixa_minima)}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg px-3 py-2">
                    <p className="opacity-75 text-xs">Máximo (+15%)</p>
                    <p className="font-semibold">{fmt(resultado.faixa_maxima)}</p>
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-3">
                  Baseado em {resultado.comparaveis_usados} comparáveis da região
                </p>
              </div>

              {/* Detalhamento dos fatores */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
                  <BarChart3 size={16} className="text-orange-500" /> Detalhamento dos Fatores
                </h2>
                <div className="space-y-3">
                  <FactorRow
                    label="Valor base mercado"
                    value={fmt(resultado.valor_base)}
                    sub={`${fmt(resultado.m2_base_mercado)}/m² × ${area}m²`}
                    neutral
                  />
                  <FactorRow
                    label="Fator padrão"
                    value={`× ${resultado.fator_padrao.toFixed(2)}`}
                    sub={padrao.charAt(0).toUpperCase() + padrao.slice(1)}
                    positive={resultado.fator_padrao >= 1}
                  />
                  <FactorRow
                    label="Fator conservação"
                    value={`× ${resultado.fator_conservacao.toFixed(2)}`}
                    sub={LABEL_CONSERVACAO[conservacao]}
                    positive={resultado.fator_conservacao >= 0.9}
                    negative={resultado.fator_conservacao < 0.75}
                  />
                  <FactorRow
                    label="Fator diferenciais"
                    value={fmtPct(resultado.fator_diferenciais)}
                    sub={`${diferenciais.size} diferencial(is) selecionado(s)`}
                    positive={resultado.fator_diferenciais > 0}
                    neutral={resultado.fator_diferenciais === 0}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Valor Final</span>
                    <span className="font-bold text-orange-600 text-lg">{fmt(resultado.valor_avaliado)}</span>
                  </div>
                </div>
              </div>

              {/* Fórmula */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-gray-700 mb-3 text-sm">
                  <Info size={14} /> Fórmula aplicada
                </h2>
                <code className="text-xs text-gray-600 font-mono block leading-relaxed">
                  Valor = m²_mercado × área × F_padrão × F_conservação × (1 + F_diferenciais)
                  <br />
                  = {fmt(resultado.m2_base_mercado)} × {area} × {resultado.fator_padrao.toFixed(2)} × {resultado.fator_conservacao.toFixed(2)} × (1 + {resultado.fator_diferenciais.toFixed(2)})
                  <br />
                  = <strong>{fmt(resultado.valor_avaliado)}</strong>
                </code>
                <p className="text-xs text-gray-400 mt-2">
                  Referência: ABNT NBR 14.653 adaptada · Dados: {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FactorRow({
  label,
  value,
  sub,
  positive,
  negative,
  neutral,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
  neutral?: boolean;
}) {
  const valueClass = negative
    ? "text-red-600"
    : positive
    ? "text-green-600"
    : "text-gray-700";

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <span className={`font-semibold text-sm whitespace-nowrap ${valueClass}`}>{value}</span>
    </div>
  );
}
