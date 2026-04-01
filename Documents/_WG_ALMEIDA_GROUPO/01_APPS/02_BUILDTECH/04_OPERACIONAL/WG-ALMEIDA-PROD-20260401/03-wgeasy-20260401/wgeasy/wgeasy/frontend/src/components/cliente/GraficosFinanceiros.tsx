// ============================================================
// COMPONENTE: GraficosFinanceiros
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Gráficos: Fluxo de Caixa Mensal, DistribuiçÍo por Núcleo, Comparativo de Custos
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  PieChart,
  BarChart3,
  AlertCircle,
  DollarSign
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface GraficosFinanceirosProps {
  clienteId: string;
  contratoId?: string;
}

interface FluxoCaixaItem {
  mes: string;
  entradas: number;
  saidas: number;
}

interface DistribuicaoItem {
  name: string;
  value: number;
  color: string;
}

interface ComparativoItem {
  categoria: string;
  previsto: number;
  realizado: number;
}

const COLORS = ["#5E9B94", "#F25C26", "#2B4580", "#8B5E3C", "#6366f1"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function GraficosFinanceiros({ clienteId, contratoId }: GraficosFinanceirosProps) {
  const [loading, setLoading] = useState(true);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem[]>([]);
  const [distribuicao, setDistribuicao] = useState<DistribuicaoItem[]>([]);
  const [comparativo, setComparativo] = useState<ComparativoItem[]>([]);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [temDados, setTemDados] = useState(false);

  type LancamentoRow = {
    data_vencimento?: string | null;
    created_at?: string | null;
    tipo?: string | null;
    valor?: number | null;
    status?: string | null;
    categoria?: string | null;
  };

  type ContratoRow = { nucleo?: string | null; valor_total?: number | null };

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar lançamentos financeiros do cliente
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from("financeiro_lancamentos")
        .select("*")
        .eq("pessoa_id", clienteId)
        .order("data_vencimento", { ascending: true });

      if (lancamentosError) {
        console.error("Erro ao carregar lançamentos:", lancamentosError);
      }

      // Processar fluxo de caixa por mês
      if (lancamentos && lancamentos.length > 0) {
        setTemDados(true);

        const fluxoPorMes = new Map<string, { entradas: number; saidas: number }>();

        (lancamentos as LancamentoRow[]).forEach((l) => {
          const data = new Date(l.data_vencimento || l.created_at || new Date());
          const mesAno = `${MESES[data.getMonth()]}/${data.getFullYear().toString().slice(-2)}`;

          if (!fluxoPorMes.has(mesAno)) {
            fluxoPorMes.set(mesAno, { entradas: 0, saidas: 0 });
          }

          const fluxo = fluxoPorMes.get(mesAno)!;
          if (l.tipo === "receita" || l.tipo === "entrada") {
            fluxo.entradas += l.valor || 0;
          } else {
            fluxo.saidas += l.valor || 0;
          }
        });

        const fluxoArray: FluxoCaixaItem[] = [];
        fluxoPorMes.forEach((valores, mes) => {
          fluxoArray.push({
            mes,
            entradas: valores.entradas,
            saidas: valores.saidas
          });
        });

        setFluxoCaixa(fluxoArray.slice(-12)); // Últimos 12 meses
      } else {
        setFluxoCaixa([]);
      }

      // Buscar distribuiçÍo por núcleo dos contratos
      const { data: contratos } = await supabase
        .from("contratos")
        .select("nucleo, valor_total")
        .eq("cliente_id", clienteId);

      if (contratos && contratos.length > 0) {
        const nucleosMap = new Map<string, number>();
        let valorTotal = 0;

        (contratos as ContratoRow[]).forEach((c) => {
          const nucleo = c.nucleo || "Outros";
          const valor = c.valor_total || 0;
          nucleosMap.set(nucleo, (nucleosMap.get(nucleo) || 0) + valor);
          valorTotal += valor;
        });

        const distribuicaoArray: DistribuicaoItem[] = [];
        let colorIndex = 0;
        nucleosMap.forEach((valor, nucleo) => {
          const percentual = valorTotal > 0 ? Math.round((valor / valorTotal) * 100) : 0;
          distribuicaoArray.push({
            name: nucleo,
            value: percentual,
            color: COLORS[colorIndex % COLORS.length]
          });
          colorIndex++;
        });

        setDistribuicao(distribuicaoArray);
      } else {
        setDistribuicao([]);
      }

      // Buscar comparativo de custos
      const { data: custos } = await supabase
        .from("financeiro_lancamentos")
        .select("categoria, valor, tipo")
        .eq("pessoa_id", clienteId)
        .in("tipo", ["despesa", "saida"]);

      if (custos && custos.length > 0) {
        const categoriasMap = new Map<string, { previsto: number; realizado: number }>();

        (custos as LancamentoRow[]).forEach((c) => {
          const categoria = c.categoria || "Outros";
          if (!categoriasMap.has(categoria)) {
            categoriasMap.set(categoria, { previsto: 0, realizado: 0 });
          }
          const cat = categoriasMap.get(categoria)!;
          cat.realizado += c.valor || 0;
        });

        const comparativoArray: ComparativoItem[] = [];
        categoriasMap.forEach((valores, categoria) => {
          comparativoArray.push({
            categoria,
            previsto: valores.previsto,
            realizado: valores.realizado
          });
        });

        setComparativo(comparativoArray.slice(0, 5)); // Top 5 categorias
      } else {
        setComparativo([]);
      }

      // Calcular alertas
      const novosAlertas: string[] = [];
      if (lancamentos && lancamentos.length > 0) {
        const hoje = new Date();
        const vencidos = (lancamentos as LancamentoRow[]).filter((l) => {
          if (l.status === "pago") return false;
          if (!l.data_vencimento) return false;
          const vencimento = new Date(l.data_vencimento);
          return vencimento < hoje;
        });

        if (vencidos.length > 0) {
          const valorVencido = vencidos.reduce((acc: number, l) => acc + (l.valor || 0), 0);
          novosAlertas.push(`${vencidos.length} parcela(s) vencida(s) - Total: R$ ${valorVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
        }
      }
      setAlertas(novosAlertas);

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      setFluxoCaixa([]);
      setDistribuicao([]);
      setComparativo([]);
      setTemDados(false);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados, contratoId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`bg-white rounded-2xl p-6 shadow-sm animate-pulse ${i === 1 ? 'lg:col-span-2' : ''}`}>
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Estado vazio quando não há dados
  if (!temDados && fluxoCaixa.length === 0 && distribuicao.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-600">Resumo Financeiro</h3>
          <p className="text-sm text-gray-400 mt-2">
            Os dados financeiros do seu projeto aparecerÍo aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-normal text-amber-800">Alertas</p>
                {alertas.map((alerta, i) => (
                  <p key={i} className="text-sm text-amber-700">{alerta}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa Mensal - Gráfico de Linha */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Fluxo de Caixa Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fluxoCaixa.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="entradas"
                      stroke="#5E9B94"
                      strokeWidth={2}
                      dot={{ fill: "#5E9B94", strokeWidth: 2 }}
                      name="Entradas"
                    />
                    <Line
                      type="monotone"
                      dataKey="saidas"
                      stroke="#F25C26"
                      strokeWidth={2}
                      dot={{ fill: "#F25C26", strokeWidth: 2 }}
                      name="Saídas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Nenhum dado de fluxo de caixa disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DistribuiçÍo por Núcleo - Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              DistribuiçÍo por Núcleo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {distribuicao.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={distribuicao}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {distribuicao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  {distribuicao.map((item, i) => (
                    <p key={i} className="text-sm text-gray-500">{item.name}: {item.value}%</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Nenhum dado de distribuiçÍo disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparativo de Custos - Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Comparativo de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparativo.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                    <Legend />
                    <Bar dataKey="previsto" fill="#5E9B94" name="Previsto" />
                    <Bar dataKey="realizado" fill="#F25C26" name="Realizado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Nenhum dado de custos disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


