import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Calculator, Database, Target, BarChart3, MapPin, TrendingUp, Layers, CheckCircle2 } from "lucide-react";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
      <Icon size={20} className="text-orange-500" />
      {title}
    </h2>
    {children}
  </section>
);

const Tag = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[color]}`}>{children}</span>;
};

const Row = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="text-right">
      <span className="text-sm font-semibold text-gray-900">{value}</span>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

export default function EasyRealStateMetodologiaPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          <ArrowLeft size={16} /> Voltar para AVM
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metodologia EasyRealState</h1>
            <p className="text-gray-500 text-sm mt-1">
              Estratégia, algoritmos, fontes de dados e critérios utilizados na precificação e avaliação imobiliária.
            </p>
          </div>
        </div>
      </header>

      {/* Visão Geral */}
      <Section icon={Target} title="Visão Geral — O que é o AVM?">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          O <strong>AVM (Automated Valuation Model)</strong> é um modelo estatístico automatizado para estimativa de valor de mercado de imóveis.
          Utiliza transações reais comparáveis, ajuste por fatores objetivos e dados de custos de construção (ICCRI/SINAPI) para gerar
          uma estimativa fundamentada e rastreável — sem depender de opinião subjetiva.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: "📍", title: "Geolocalização", desc: "CEP → coordenadas via Google Geocoding API" },
            { icon: "📊", title: "Comparáveis", desc: "Transações reais em raio de até 2km com similaridade calculada" },
            { icon: "🏗️", title: "Custo Construtivo", desc: "ICCRI × SINAPI com fator regional por estado" },
          ].map((c) => (
            <div key={c.title} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{c.icon}</div>
              <p className="text-sm font-bold text-gray-800">{c.title}</p>
              <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Fontes de Dados */}
      <Section icon={Database} title="Fontes de Dados">
        <div className="space-y-3">
          {[
            { fonte: "ViaCEP", tipo: "CEP → Endereço", desc: "Conversão de CEP em logradouro, bairro, cidade e UF. API pública do governo.", cor: "green" },
            { fonte: "Google Geocoding API", tipo: "Endereço → Coordenadas", desc: "Converte o endereço textual em latitude/longitude com alta precisão.", cor: "blue" },
            { fonte: "SINAPI / ICCRI", tipo: "Custos de Construção", desc: "Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil (Caixa/IBGE). Atualizado mensalmente. Base: Mar/2026 (índice 176.02).", cor: "orange" },
            { fonte: "Transações Internas", tipo: "Comparáveis de Mercado", desc: "Base de transações imobiliárias cadastradas manualmente ou integradas. Usadas para calcular a mediana de preço/m² por região.", cor: "purple" },
            { fonte: "MOCK (modo demo)", tipo: "Demonstração", desc: "Quando a base real tem menos de 5 transações no raio, usa dados de mercado representativos de São Paulo para demonstração. Score limitado a 55%.", cor: "gray" },
          ].map((f) => (
            <div key={f.fonte} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
              <Tag color={f.cor as any}>{f.tipo}</Tag>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{f.fonte}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Algoritmo AVM */}
      <Section icon={Calculator} title="Algoritmo AVM — Fórmula de Avaliação">
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm mb-4 overflow-x-auto">
          <p className="text-gray-500 text-xs mb-2">// Fórmula principal</p>
          <p>preco_m2_final = <span className="text-yellow-300">mediana</span>(comparáveis)</p>
          <p className="pl-4">× <span className="text-blue-300">fator_andar</span></p>
          <p className="pl-4">× <span className="text-blue-300">fator_vista</span></p>
          <p className="pl-4">× <span className="text-blue-300">fator_reformado</span></p>
          <p className="pl-4">× <span className="text-blue-300">fator_padrao</span></p>
          <p className="pl-4">× <span className="text-blue-300">fator_localizacao</span></p>
          <p className="mt-2 text-gray-500 text-xs">// Valor total</p>
          <p>valor_total = preco_m2_final × <span className="text-orange-300">area_m2</span></p>
          <p className="mt-2 text-gray-500 text-xs">// Faixa de confiança</p>
          <p>faixa = valor_total × <span className="text-red-300">[0.90 .. 1.10]</span></p>
        </div>

        <h3 className="text-sm font-bold text-gray-700 mb-2">Fatores de Ajuste</h3>
        <div className="space-y-1">
          <Row label="Padrão — Popular" value="× 0.75" sub="Abaixo do médio de referência" />
          <Row label="Padrão — Médio" value="× 1.00" sub="Referência base" />
          <Row label="Padrão — Alto" value="× 1.20" />
          <Row label="Padrão — Luxo" value="× 1.50" />
          <Row label="Vista privilegiada" value="+ 10%" sub="× 1.10" />
          <Row label="Imóvel reformado" value="+ 8%" sub="× 1.08" />
          <Row label="Andar (1–5)" value="+ 2% / andar" sub="× (1 + andar × 0.02)" />
          <Row label="Andar (6–15)" value="+ 1,5% / andar" />
          <Row label="Andar (16+)" value="+ 1% / andar" />
        </div>
      </Section>

      {/* Seleção de Comparáveis */}
      <Section icon={MapPin} title="Seleção de Comparáveis">
        <p className="text-sm text-gray-600 mb-4">
          Os comparáveis são transações imobiliárias reais dentro do raio geográfico, ordenadas por <strong>score de similaridade</strong>.
          Selecionamos até 30 comparáveis por avaliação.
        </p>
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm mb-4 overflow-x-auto">
          <p className="text-gray-500 text-xs mb-1">// Score de similaridade (0–1)</p>
          <p>score = <span className="text-yellow-300">0.40</span> × similaridade_area</p>
          <p className="pl-4">+ <span className="text-yellow-300">0.60</span> × proximidade_geografica</p>
          <p className="mt-2 text-gray-500 text-xs">// Distância Haversine (Terra = 6.371 km)</p>
          <p>distancia = <span className="text-blue-300">haversine</span>(lat1, lng1, lat2, lng2)</p>
          <p className="mt-2 text-gray-500 text-xs">// Raio máximo padrão: 2.000m</p>
        </div>
        <p className="text-xs text-gray-500">
          Transações fora do raio ou com tipo diferente são descartadas. O resultado final usa a <strong>mediana</strong> (não a média)
          do preço/m² dos comparáveis selecionados, tornando o modelo resistente a outliers.
        </p>
      </Section>

      {/* Score de Confiança */}
      <Section icon={BarChart3} title="Score de Confiança (0–100)">
        <p className="text-sm text-gray-600 mb-3">
          O score indica a confiabilidade da estimativa com base em três dimensões:
        </p>
        <div className="space-y-3">
          {[
            { dim: "Quantidade de comparáveis", peso: "40 pts", formula: "min(total / 20, 1) × 40", desc: "20 comparáveis = pontuação máxima" },
            { dim: "Recência das transações", peso: "35 pts", formula: "max(0, 1 – dias/730) × 35", desc: "Transações de até 2 anos; mais recentes valem mais" },
            { dim: "Proximidade geográfica", peso: "25 pts", formula: "max(0, 1 – distância/2000) × 25", desc: "Transações mais próximas de 2km = pontuação máxima" },
          ].map((d) => (
            <div key={d.dim} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-lg flex-shrink-0">{d.peso}</span>
              <div>
                <p className="text-sm font-bold text-gray-800">{d.dim}</p>
                <code className="text-xs text-blue-600">{d.formula}</code>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { range: "80–100", label: "Alta confiança", color: "text-green-700 bg-green-50" },
            { range: "60–79", label: "Boa estimativa", color: "text-blue-700 bg-blue-50" },
            { range: "40–59", label: "Estimativa indicativa", color: "text-yellow-700 bg-yellow-50" },
            { range: "0–39", label: "Dados insuficientes", color: "text-red-700 bg-red-50" },
          ].map((s) => (
            <div key={s.range} className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-sm font-bold">{s.range}</p>
              <p className="text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Custos ICCRI */}
      <Section icon={Layers} title="Custo Construtivo — ICCRI × SINAPI">
        <p className="text-sm text-gray-600 mb-4">
          Os custos de construção e reforma são calculados com base no <strong>ICCRI (Índice de Custo da Construção e Reforma para Interiores)</strong>,
          alimentado mensalmente com dados do SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil — Caixa Econômica/IBGE).
        </p>
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm mb-4">
          <p className="text-gray-500 text-xs mb-1">// Fórmula do custo construtivo</p>
          <p>custo_m2 = <span className="text-yellow-300">custo_base_2026</span>[padrão]</p>
          <p className="pl-4">× <span className="text-blue-300">multiplicador_SINAPI</span>[estado]</p>
          <p className="pl-4">× (iccri_atual / <span className="text-orange-300">176.02</span>)</p>
          <p className="mt-2 text-gray-500 text-xs">// Composição padrão (SINAPI Mar/2026)</p>
          <p>material = custo_m2 × <span className="text-green-300">0.56</span>  <span className="text-gray-500">// 56%</span></p>
          <p>mao_obra  = custo_m2 × <span className="text-green-300">0.44</span>  <span className="text-gray-500">// 44%</span></p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { padrao: "Popular", ref: "R$ 2.300/m²", faixa: "R$ 2.000–2.600" },
            { padrao: "Médio", ref: "R$ 3.200/m²", faixa: "R$ 2.700–3.800" },
            { padrao: "Alto", ref: "R$ 4.700/m²", faixa: "R$ 4.000–5.500" },
            { padrao: "Luxo", ref: "R$ 7.500/m²", faixa: "R$ 5.500–12.000" },
          ].map((p) => (
            <div key={p.padrao} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">{p.padrao}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{p.ref}</p>
              <p className="text-xs text-gray-400">{p.faixa}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Row label="Índice ICCRI atual" value="176.02" sub="Mar/2026 — base 100 = Jan/2020" />
          <Row label="INCC acumulado 12m" value="+5,81%" sub="Mar/2026" />
          <Row label="SP Capital (referência)" value="× 1.00" sub="Base SINAPI" />
          <Row label="Rio de Janeiro" value="× 0.95" />
          <Row label="Minas Gerais" value="× 0.86" />
          <Row label="Paraná" value="× 0.89" />
          <Row label="Estados do Norte/Nordeste" value="× 0.63 – 0.80" />
        </div>
      </Section>

      {/* Limitações */}
      <Section icon={TrendingUp} title="Limitações e Transparência">
        <div className="space-y-2">
          {[
            "O AVM é uma estimativa estatística, não uma avaliação técnica (laudo ABNT NBR 14.653).",
            "A precisão depende diretamente da quantidade e qualidade das transações cadastradas na região.",
            "Imóveis com características únicas (tombados, irregulares, pendências jurídicas) podem divergir significativamente.",
            "Os custos ICCRI/SINAPI são médios regionais — projetos personalizados podem ter variação de ±30%.",
            "Não inclui terreno, projetos arquitetônicos/estruturais, fundações especiais, condomínio ou ITBI.",
            "O índice ICCRI é atualizado mensalmente no banco de dados — valores exibidos refletem o último registro disponível.",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Rodapé */}
      <div className="text-center text-xs text-gray-400 mt-8 pb-4">
        EasyRealState · Motor de Inteligência Imobiliária WG Build Tech · Mar/2026
        <br />
        Dados SINAPI: Caixa Econômica Federal · IBGE · FGV IBRE
      </div>
    </div>
  );
}
