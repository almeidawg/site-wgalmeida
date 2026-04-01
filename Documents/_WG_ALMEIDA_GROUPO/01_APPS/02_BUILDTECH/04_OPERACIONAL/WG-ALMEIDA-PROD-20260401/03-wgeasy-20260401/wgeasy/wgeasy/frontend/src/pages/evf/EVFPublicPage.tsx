import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  buscarEVFPublicoPorToken,
  registrarAcaoPublicaEVF,
  type EVFPublicoResumo,
} from "@/lib/evfApi";
import {
  formatarMoeda,
  formatarNumero,
  getCorCategoria as getCorCategoriaEVF,
  agruparItensPorFase,
  type EVFItem,
  type EVFCategoriaConfig,
  type GrupoFaseEVF,
} from "@/types/evf";
import { buscarCategoriasConfig } from "@/lib/evfApi";
import { getCorCategoria as getCorCategoriaPricelist } from "@/config/categoriasConfig";

const PALETA_CATEGORIA_CLASSES = [
  "bg-amber-700",
  "bg-blue-900",
  "bg-violet-400",
  "bg-sky-500",
  "bg-teal-500",
  "bg-pink-600",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-stone-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-gray-500",
];

function resolverCorCategoriaPublic(item: EVFItem, categoriasConfig: EVFCategoriaConfig[]): string {
  // 1. Cor do categoriasConfig (inclui categorias sintéticas)
  const configCat = categoriasConfig.find((c) => c.codigo === item.categoria);
  if (configCat?.cor && configCat.cor !== "#6B7280") {
    return configCat.cor;
  }
  // 2. Cor do pricelist config estático
  const corPricelist = getCorCategoriaPricelist(item.nome);
  if (corPricelist && corPricelist !== "#6B7280") {
    return corPricelist;
  }
  // 3. Fallback EVF config local
  return getCorCategoriaEVF(item.categoria);
}

function resolverClasseCorCategoria(item: EVFItem): string {
  const ordemCategoria = Math.max(item.ordem, 1);
  const iÍndice = (ordemCategoria - 1) % PALETA_CATEGORIA_CLASSES.length;
  return PALETA_CATEGORIA_CLASSES[iÍndice];
}

export default function EVFPublicPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<EVFPublicoResumo | null>(null);
  const [categoriasConfig, setCategoriasConfig] = useState<EVFCategoriaConfig[]>([]);

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setErro("Token inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);
        const [payload, categorias] = await Promise.all([
          buscarEVFPublicoPorToken(token),
          buscarCategoriasConfig(),
        ]);
        setDados(payload);
        setCategoriasConfig(categorias);
      } catch (error: any) {
        setErro(error?.message || "NÍo foi possível carregar o EVF público");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [token]);

  const itensOrdenados = useMemo(() => {
    const itens = dados?.estudo?.itens || [];
    return [...itens].sort((a, b) => {
      return a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [dados]);

  // Agrupar itens por fase
  const itensPorFase = useMemo<GrupoFaseEVF[]>(() => {
    return agruparItensPorFase(itensOrdenados, categoriasConfig);
  }, [itensOrdenados, categoriasConfig]);

  // Dados para o gráfico - agrupa categorias <2% em "Outros"
  const dadosGrafico = useMemo(() => {
    const todos = itensOrdenados
      .filter((item) => item.valorEstudoReal > 0)
      .map((item) => ({
        name: item.nome,
        value: item.valorEstudoReal,
        percentual: item.percentualTotal,
        cor: resolverCorCategoriaPublic(item, categoriasConfig),
        corClasse: resolverClasseCorCategoria(item),
      }));

    const grandes = todos.filter((i) => i.percentual >= 2);
    const pequenos = todos.filter((i) => i.percentual < 2);

    if (pequenos.length > 0) {
      const outrosValue = pequenos.reduce((s, i) => s + i.value, 0);
      const outrosPerc = pequenos.reduce((s, i) => s + i.percentual, 0);
      grandes.push({
        name: "Outros",
        value: outrosValue,
        percentual: outrosPerc,
        cor: "#9CA3AF",
        corClasse: "bg-gray-400",
      });
    }

    return grandes;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensOrdenados]);

  async function handleAcao(acao: "aprovar" | "rejeitar") {
    if (!token || dados?.status !== "pendente") return;

    try {
      setEnviando(true);
      const response = await registrarAcaoPublicaEVF(token, acao);
      setDados({ ...dados, status: response.status, data_acao: response.data_acao });
    } catch (error: any) {
      setErro(error?.message || "Falha ao registrar açÍo");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-wg-primary" />
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-lg w-full">
          <h1 className="text-[20px] font-medium text-red-700 mb-2">Link inválido</h1>
          <p className="text-[14px] text-gray-600">{erro || "Este link de EVF nÍo está disponível."}</p>
        </div>
      </div>
    );
  }

  const estudo = dados.estudo;
  let statusClass = "bg-yellow-100 text-yellow-700";
  let statusLabel = "Pendente";
  if (dados.status === "aprovado") {
    statusClass = "bg-green-100 text-green-700";
    statusLabel = "Aprovado";
  } else if (dados.status === "rejeitado") {
    statusClass = "bg-red-100 text-red-700";
    statusLabel = "Rejeitado";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[24px] font-light text-gray-900">{estudo.titulo}</h1>
            <p className="text-[12px] text-gray-500">
              Cliente: {estudo.cliente?.nome || "NÍo informado"} • Metragem: {formatarNumero(estudo.metragem_total)} m²
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border p-3">
            <p className="text-[11px] text-gray-500">Total Estimado</p>
            <p className="text-[16px] font-semibold text-gray-900">{formatarMoeda(estudo.valor_total || 0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[11px] text-gray-500">Valor/m²</p>
            <p className="text-[16px] font-semibold text-gray-900">{formatarMoeda(estudo.valor_m2_medio || 0)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[11px] text-gray-500">PadrÍo</p>
            <p className="text-[16px] font-semibold text-gray-900">{estudo.padrao_acabamento}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[11px] text-gray-500">Emitido em</p>
            <p className="text-[16px] font-semibold text-gray-900">{new Date(dados.data_envio).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-4">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full min-w-[680px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-[11px] text-gray-600">#</th>
                  <th className="px-2 py-2 text-left text-[11px] text-gray-600">Categoria</th>
                  <th className="px-2 py-2 text-right text-[11px] text-gray-600">R$/m²</th>
                  <th className="px-2 py-2 text-right text-[11px] text-gray-600">PrevisÍo</th>
                  <th className="px-2 py-2 text-right text-[11px] text-gray-600">Estudo Real</th>
                  <th className="px-2 py-2 text-center text-[11px] text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {itensPorFase.map((grupo) => (
                  <React.Fragment key={`fase-${grupo.fase}`}>
                    {/* Header da Fase */}
                    <tr style={{ backgroundColor: `${grupo.cor}18` }}>
                      <td colSpan={4} className="px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: grupo.cor }}>
                          Fase {grupo.fase} — {grupo.nome}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right" colSpan={2}>
                        <span className="text-[11px] font-semibold" style={{ color: grupo.cor }}>
                          {formatarMoeda(grupo.subtotal)}
                        </span>
                      </td>
                    </tr>
                    {grupo.itens.map((item) => (
                      <tr key={item.id || item.categoria} className="border-b last:border-b-0">
                        <td className="px-2 py-2 text-[12px] text-gray-500">{String(item.ordem).padStart(2, "0")}</td>
                        <td className="px-2 py-2 text-[12px] text-gray-800">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${resolverClasseCorCategoria(item)}`} />
                          {item.nome}
                        </td>
                        <td className="px-2 py-2 text-[12px] text-right text-gray-700">{formatarMoeda(item.valorM2Ajustado)}</td>
                        <td className="px-2 py-2 text-[12px] text-right text-gray-700">{formatarMoeda(item.valorPrevisao)}</td>
                        <td className="px-2 py-2 text-[12px] text-right font-medium text-gray-900">{formatarMoeda(item.valorEstudoReal)}</td>
                        <td className="px-2 py-2 text-[12px] text-center text-gray-700">{formatarNumero(item.percentualTotal, 1)}%</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border p-3">
            <h2 className="text-[14px] font-medium text-gray-800 mb-2">DistribuiçÍo por Categoria</h2>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={126}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={1100}
                    animationEasing="ease-out"
                    label={({ percentual }: any) => (percentual > 5 ? `${percentual.toFixed(1)}%` : "")}
                    labelLine={false}
                  >
                    {dadosGrafico.map((entry) => (
                      <Cell key={entry.name} fill={entry.cor} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatarMoeda(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 border-t pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 max-h-[180px] overflow-y-auto">
              {dadosGrafico.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.corClasse}`} />
                  <span className="truncate text-gray-600 flex-1">{item.name}</span>
                  <span className="font-medium text-gray-800">{item.percentual.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            disabled={enviando || dados.status !== "pendente"}
            onClick={() => handleAcao("rejeitar")}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={enviando || dados.status !== "pendente"}
            onClick={() => handleAcao("aprovar")}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Aprovar
          </Button>
        </div>
      </div>
    </div>
  );
}

