import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Resumo = {
  total_oportunidades: number;
  oportunidades_ganhas: number;
  oportunidades_perdidas: number;
  valor_total: number | null;
  valor_ganho: number | null;
  valor_perdido: number | null;
  ticket_medio: number | null;
  taxa_conversao: number;
};

type PorEstagio = {
  estagio: string;
  qtde: number;
  valor: number;
};

type Forecast = {
  mes: string;
  qtde: number;
  valor: number;
};

export default function DashboardComercialPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [porEstagio, setPorEstagio] = useState<PorEstagio[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);

  useEffect(() => {
    async function carregar() {
      const { data: r } = await supabase
        .from("dashboard_comercial_resumo")
        .select("*")
        .single();

      const { data: e } = await supabase
        .from("dashboard_comercial_por_estagio")
        .select("*");

      const { data: f } = await supabase
        .from("dashboard_comercial_forecast_mensal")
        .select("*");

      setResumo(r as Resumo);
      setPorEstagio((e || []) as PorEstagio[]);
      setForecast((f || []) as Forecast[]);
    }

    carregar();
  }, []);

  if (!resumo) {
    return <div className="p-6">Carregando dashboard comercial...</div>;
  }

  const formatMoney = (v: number | null) => {
    if (v === null || v === undefined) {
      return "R$ 0,00";
    }
    return `R$ ${v.toLocaleString("pt-BR")}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight mb-2">
        Dashboard Comercial — WG Easy
      </h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Oportunidades Totais" value={resumo.total_oportunidades} />
        <Card
          title="Valor Total em Pipeline"
          value={formatMoney(resumo.valor_total)}
        />
        <Card
          title="Ticket Médio"
          value={formatMoney(resumo.ticket_medio)}
        />
        <Card
          title="Taxa de ConversÍo"
          value={`${resumo.taxa_conversao.toFixed(1)}%`}
        />
      </div>

      {/* Ganho vs Perdido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Ganhos"
          value={`${resumo.oportunidades_ganhas} • ${formatMoney(
            resumo.valor_ganho
          )}`}
        />
        <Card
          title="Perdidos"
          value={`${resumo.oportunidades_perdidas} • ${formatMoney(
            resumo.valor_perdido
          )}`}
        />
        <Card
          title="Pipeline Value (Abertas)"
          value={formatMoney(
            (resumo.valor_total || 0) - (resumo.valor_ganho || 0)
          )}
        />
      </div>

      {/* Tabelas analíticas simples — prontos para virar gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-[20px] font-light mb-3">
            Oportunidades por estágio
          </h2>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Estágio</th>
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Qtde</th>
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody>
              {porEstagio.map((e) => (
                <tr key={e.estagio} className="border-b last:border-0">
                  <td className="py-1">{e.estagio}</td>
                  <td className="py-1">{e.qtde}</td>
                  <td className="py-1">
                    {formatMoney(e.valor ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-[20px] font-light mb-3">
            Forecast Mensal (previsÍo de fechamento)
          </h2>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Mês</th>
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Qtde</th>
                <th className="py-1 text-[13px] font-medium uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.mes} className="border-b last:border-0">
                  <td className="py-1">
                    {new Date(f.mes).toLocaleDateString("pt-BR", {
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-1">{f.qtde}</td>
                  <td className="py-1">
                    {formatMoney(f.valor ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type CardProps = Readonly<{ title: string; value: string | number }>;

function Card({ title, value }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-[12px] text-gray-500 mb-1">{title}</p>
      <p className="text-[18px] font-light">{value}</p>
    </div>
  );
}

