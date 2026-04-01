/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// PÁGINA: Calculadora de Projeto por m²
// Sistema WG Easy - Grupo WG Almeida
// R$ 180,00/m² — Projeto Arquitetônico + simulaçÍo de parcelamento
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  useConfiguracoesPagamento,
  PLATAFORMAS_INFO,
  type TaxaCartaoItem,
} from "@/hooks/useConfiguracoesPagamento";
import {
  Calculator,
  Ruler,
  FileText,
  ArrowRight,
  ChevronRight,
  Building2,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Info,
  Layers,
  CreditCard,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────
interface ServicoM2 {
  id: string;
  nome: string;
  descricao: string;
  valor_unitario: number; // preço por m²
  icone?: string;
}

// Re-export tipo do hook para uso local
type TaxaCartao = TaxaCartaoItem;

// ── Serviços por m² (hard-coded + complementado com DB) ────
const SERVICOS_FIXOS: ServicoM2[] = [
  {
    id: "projeto-arquitetonico",
    nome: "Projeto Arquitetônico",
    descricao: "Projeto completo de arquitetura de interiores",
    valor_unitario: 180,
    icone: "Building2",
  },
];

// Formata número com separador BR
function fmtM2(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  if (isNaN(n) || n <= 0) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Componente principal ───────────────────────────────────
export default function CalculadoraProjetoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Taxas de cartÍo do Supabase via hook
  const { taxasCartao: taxasCartaoConfig, plataforma, loading: loadingTaxas } =
    useConfiguracoesPagamento();

  // Serviços disponíveis (DB + fixos)
  const [servicos, setServicos] = useState<ServicoM2[]>(SERVICOS_FIXOS);
  const [carregando, setCarregando] = useState(true);

  // Taxas de cartÍo (do hook, com débito à vista como primeiro item)
  const taxasCartao: TaxaCartao[] = loadingTaxas
    ? [{ nome: "À vista (débito)", parcelas: 0, percentual: 0 }]
    : [{ nome: "À vista (débito)", parcelas: 0, percentual: 0 }, ...taxasCartaoConfig];
  const [mostrarParcelamento, setMostrarParcelamento] = useState(false);

  // SeleçÍo e cálculo
  const [servicoId, setServicoId] = useState<string>(SERVICOS_FIXOS[0].id);
  const [areaInput, setAreaInput] = useState("");
  const [valorUnitario, setValorUnitario] = useState(SERVICOS_FIXOS[0].valor_unitario);
  const [areaNumerica, setAreaNumerica] = useState<number | null>(null);

  // Dados do cliente (opcional)
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  // UI
  const [salvandoOportunidade, setSalvandoOportunidade] = useState(false);
  const [oportunidadeCriada, setOportunidadeCriada] = useState(false);

  // ── Carregar serviços do pricelist com unidade m² ─────────
  useEffect(() => {
    async function carregarServicos() {
      setCarregando(true);
      const { data } = await supabase
        .from("pricelist_itens")
        .select("id, nome, descricao, preco, unidade")
        .in("unidade", ["m2", "m²"])
        .eq("tipo", "servico")
        .order("nome");

      if (data && data.length > 0) {
        const dbServicos: ServicoM2[] = data.map((row: any) => ({
          id: row.id,
          nome: row.nome,
          descricao: row.descricao || "",
          valor_unitario: Number(row.preco),
        }));
        setServicos(dbServicos);
        // Manter seleçÍo no primeiro item
        setServicoId(dbServicos[0].id);
        setValorUnitario(dbServicos[0].valor_unitario);
      } else {
        // Mantém os serviços fixos se nÍo houver dados no DB
        setServicos(SERVICOS_FIXOS);
        setServicoId(SERVICOS_FIXOS[0].id);
        setValorUnitario(SERVICOS_FIXOS[0].valor_unitario);
      }
      setCarregando(false);
    }
    carregarServicos();
  }, []);

  // ── Sincronizar valor unitário ao trocar serviço ──────────
  useEffect(() => {
    const svc = servicos.find((s) => s.id === servicoId);
    if (svc) setValorUnitario(svc.valor_unitario);
  }, [servicoId, servicos]);

  // ── Parsear área ──────────────────────────────────────────
  useEffect(() => {
    if (!areaInput.trim()) {
      setAreaNumerica(null);
      return;
    }
    const n = parseFloat(areaInput.replace(",", "."));
    setAreaNumerica(isNaN(n) || n <= 0 ? null : n);
  }, [areaInput]);

  const valorTotal = areaNumerica !== null ? areaNumerica * valorUnitario : null;
  const servicoAtual = servicos.find((s) => s.id === servicoId);

  // ── Criar oportunidade no CRM ─────────────────────────────
  async function handleCriarOportunidade() {
    if (!areaNumerica || !valorTotal) return;
    if (!clienteNome.trim()) {
      toast({ title: "Informe o nome do cliente", variant: "destructive" });
      return;
    }

    setSalvandoOportunidade(true);
    try {
      // Buscar ou criar cliente pelo nome
      let clienteId: string | null = null;
      if (clienteNome.trim()) {
        const { data: clienteExistente } = await supabase
          .from("pessoas")
          .select("id")
          .ilike("nome", `%${clienteNome.trim()}%`)
          .limit(1)
          .single();
        clienteId = clienteExistente?.id || null;
      }

      // Criar oportunidade
      const { error } = await supabase.from("oportunidades").insert({
        titulo: `${servicoAtual?.nome || "Projeto"} — ${fmtM2(areaNumerica)} m²`,
        valor_estimado: valorTotal,
        status: "novo",
        descricao: `Calculadora: ${fmtM2(areaNumerica)} m² × ${formatarMoeda(valorUnitario)}/m² = ${formatarMoeda(valorTotal)}\nCliente: ${clienteNome}\nTelefone: ${clienteTelefone}\nEmail: ${clienteEmail}`,
        pessoa_id: clienteId,
      });

      if (error) throw error;

      setOportunidadeCriada(true);
      toast({
        title: "✅ Oportunidade criada!",
        description: `${servicoAtual?.nome} — ${formatarMoeda(valorTotal)}`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao criar oportunidade", description: e.message, variant: "destructive" });
    } finally {
      setSalvandoOportunidade(false);
    }
  }

  // ── Navegar para orçamento formal ─────────────────────────
  function handleCriarOrcamento() {
    if (!areaNumerica || !valorTotal) return;
    const descricao = `${servicoAtual?.nome || "Projeto"} — ${fmtM2(areaNumerica)} m²`;
    const params = new URLSearchParams({
      titulo: descricao,
      descricao_item: descricao,
      quantidade: String(areaNumerica),
      valor_unitario: String(valorUnitario),
    });
    navigate(`/orcamentos/novo?${params.toString()}`);
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary text-white rounded-xl">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Calculadora de Projetos</h1>
            <p className="text-sm text-slate-500">Calcule o valor do projeto em segundos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Painel esquerdo: SeleçÍo e cálculo ─────────── */}
          <div className="space-y-4">

            {/* SeleçÍo de serviço */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Layers size={14} /> Tipo de Projeto
              </h2>

              {carregando ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Carregando serviços...
                </div>
              ) : (
                <div className="space-y-2">
                  {servicos.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => setServicoId(svc.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        servicoId === svc.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className={`mt-0.5 p-1.5 rounded-lg ${servicoId === svc.id ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        <Building2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{svc.nome}</p>
                        {svc.descricao && (
                          <p className="text-xs text-slate-500 truncate">{svc.descricao}</p>
                        )}
                        <p className="text-xs font-medium text-blue-600 mt-0.5">
                          {formatarMoeda(svc.valor_unitario)}/m²
                        </p>
                      </div>
                      {servicoId === svc.id && <CheckCircle2 size={16} className="text-blue-500 mt-1 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input de área */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Ruler size={14} /> Área do Projeto
              </h2>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-full text-4xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 pr-16 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                  m²
                </span>
              </div>

              {areaNumerica !== null && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  Área informada: {fmtM2(areaNumerica)} m²
                </p>
              )}
            </div>
          </div>

          {/* ── Painel direito: Resultado ───────────────────── */}
          <div className="space-y-4">

            {/* Card de resultado */}
            <div className={`rounded-2xl shadow-sm border p-6 transition-all ${
              valorTotal !== null
                ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white"
                : "bg-white border-slate-100"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className={valorTotal !== null ? "text-blue-200" : "text-slate-400"} />
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${valorTotal !== null ? "text-blue-100" : "text-slate-500"}`}>
                  Valor Estimado
                </h2>
              </div>

              {valorTotal !== null && areaNumerica !== null ? (
                <>
                  {/* Cálculo detalhado */}
                  <div className="bg-blue-500/30 rounded-xl p-3 mb-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-100">Área</span>
                      <span className="font-medium">{fmtM2(areaNumerica)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100">Preço por m²</span>
                      <span className="font-medium">{formatarMoeda(valorUnitario)}/m²</span>
                    </div>
                    <div className="border-t border-blue-400/40 pt-1 flex justify-between font-semibold">
                      <span className="text-blue-100">Cálculo</span>
                      <span>{fmtM2(areaNumerica)} × {formatarMoeda(valorUnitario)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="text-center">
                    <p className="text-blue-200 text-sm mb-1">Total estimado</p>
                    <p className="text-4xl font-extrabold tracking-tight">
                      {formatarMoeda(valorTotal)}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">
                      {servicoAtual?.nome}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Calculator size={40} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    Selecione o tipo de projeto e informe a área em m² para ver o valor estimado
                  </p>
                </div>
              )}
            </div>

            {/* Ações rápidas */}
            {valorTotal !== null && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <FileText size={14} /> Ações
                </h2>

                <button
                  onClick={handleCriarOrcamento}
                  className="w-full flex items-center justify-between bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-3 font-semibold text-sm transition-colors"
                >
                  <span>Criar Orçamento Formal</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => navigate("/propostas/nova")}
                  className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 py-3 font-semibold text-sm transition-colors"
                >
                  <span>Gerar Proposta Comercial</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Registrar como oportunidade */}
            {valorTotal !== null && !oportunidadeCriada && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  💼 Registrar Oportunidade (opcional)
                </h2>
                <p className="text-xs text-slate-400">
                  Salve esta consulta como uma oportunidade no CRM para fazer follow-up.
                </p>

                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente *"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="Telefone (WhatsApp)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />

                <button
                  onClick={handleCriarOportunidade}
                  disabled={salvandoOportunidade || !clienteNome.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl px-4 py-3 font-semibold text-sm transition-colors"
                >
                  {salvandoOportunidade ? (
                    <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                  ) : (
                    <><CheckCircle2 size={14} /> Salvar no CRM</>
                  )}
                </button>
              </div>
            )}

            {/* Feedback de oportunidade criada */}
            {oportunidadeCriada && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Oportunidade registrada!</p>
                  <button
                    onClick={() => navigate("/oportunidades")}
                    className="text-xs text-emerald-600 underline mt-0.5"
                  >
                    Ver no CRM →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SimulaçÍo de Parcelamento */}
        {valorTotal !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <CreditCard size={14} /> SimulaçÍo de Parcelamento
                </h2>
                {!loadingTaxas && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLATAFORMAS_INFO[plataforma].cor}`}>
                    {PLATAFORMAS_INFO[plataforma].label}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMostrarParcelamento((v) => !v)}
                className="text-xs text-blue-600 underline"
              >
                {mostrarParcelamento ? "Ocultar" : "Mostrar todas"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-slate-500 font-medium py-2 pr-4">Forma de Pagamento</th>
                    <th className="text-right text-slate-500 font-medium py-2 pr-4">Taxa</th>
                    <th className="text-right text-slate-500 font-medium py-2 pr-4">Total c/ taxa</th>
                    <th className="text-right text-slate-500 font-medium py-2">Valor por parcela</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(mostrarParcelamento ? taxasCartao : taxasCartao.slice(0, 6)).map((taxa) => {
                    const totalComTaxa = valorTotal! * (1 + taxa.percentual / 100);
                    const valorParcela = totalComTaxa / (taxa.parcelas || 1);
                    const isAvista = taxa.percentual === 0;
                    return (
                      <tr key={taxa.nome} className={isAvista ? "bg-emerald-50" : "hover:bg-slate-50"}>
                        <td className="py-2.5 pr-4">
                          <span className={`font-medium ${isAvista ? "text-emerald-700" : "text-slate-700"}`}>
                            {taxa.nome}
                            {isAvista && <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">melhor opçÍo</span>}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-slate-400 text-xs">
                          {taxa.percentual === 0 ? "—" : `+${taxa.percentual.toFixed(2)}%`}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-semibold text-slate-800">
                          {formatarMoeda(totalComTaxa)}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {taxa.parcelas > 1 ? (
                            <span className="font-bold text-blue-700">{taxa.parcelas}× {formatarMoeda(valorParcela)}</span>
                          ) : (
                            <span className="text-slate-500">à vista</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Info size={11} />
              Taxas configuradas em Sistema → PrecificaçÍo → Taxas de CartÍo
            </p>
          </div>
        )}

        {/* Tabela de referência (exemplos de metragens) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1">
            <Info size={14} /> Exemplos de Referência — {servicoAtual?.nome}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-500 font-medium py-2 pr-4">Tipo de Imóvel</th>
                  <th className="text-right text-slate-500 font-medium py-2 pr-4">Área</th>
                  <th className="text-right text-slate-500 font-medium py-2 pr-4">Preço/m²</th>
                  <th className="text-right text-slate-500 font-medium py-2">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { tipo: "Studio / Kitnet", area: 28 },
                  { tipo: "Apartamento 1 quarto", area: 42 },
                  { tipo: "Apartamento 2 quartos", area: 68 },
                  { tipo: "Apartamento 3 quartos", area: 95 },
                  { tipo: "Cobertura / Duplex", area: 150 },
                  { tipo: "Casa térrea média", area: 120 },
                  { tipo: "Casa ampla", area: 200 },
                ].map((ex) => {
                  const total = ex.area * valorUnitario;
                  const isAtual = areaNumerica === ex.area;
                  return (
                    <tr
                      key={ex.tipo}
                      onClick={() => setAreaInput(String(ex.area))}
                      className={`cursor-pointer transition-colors ${
                        isAtual
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 pr-4">
                        <span className={`font-medium ${isAtual ? "text-blue-700" : "text-slate-700"}`}>
                          {ex.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-500">{ex.area} m²</td>
                      <td className="py-2.5 pr-4 text-right text-slate-500">{formatarMoeda(valorUnitario)}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">
                        {formatarMoeda(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            💡 Clique em qualquer linha para usar essa metragem na calculadora
          </p>
        </div>

      </div>
    </div>
  );
}

