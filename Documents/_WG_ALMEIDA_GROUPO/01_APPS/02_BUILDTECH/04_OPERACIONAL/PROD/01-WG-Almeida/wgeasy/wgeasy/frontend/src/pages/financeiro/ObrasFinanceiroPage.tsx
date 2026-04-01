import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { Building2, Search, ExternalLink, ArrowUpRight, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import StripePaymentButton from "@/components/stripe/StripePaymentButton";
import { formatarData, formatarMoeda } from "@/lib/utils";

type Resumo = {
  contrato_id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  numero: string | null;
  nucleo: string | null;
  valor_total: number | null;
  valor_entrada: number | null;
  numero_parcelas: number | null;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  status: string | null;
};

type PessoaLookup = Record<
  string,
  {
    nome?: string | null;
    avatar_url?: string | null;
    foto_url?: string | null;
  }
>;

const formatMoney = (v?: number | null) => formatarMoeda(v || 0);

const statusColor = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (s === "ativo") return "bg-green-100 text-green-700";
  if (s === "rascunho") return "bg-yellow-100 text-yellow-700";
  if (s === "cancelado") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const isMissingColumnError = (error: any, column: string) => {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || error.msg || "");
  return (
    code === "PGRST204" ||
    code === "42703" ||
    message.includes(column) ||
    message.includes(`'${column}'`)
  );
};

const ObrasFinanceiroPage = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<Resumo[]>([]);
  const [pessoas, setPessoas] = useState<PessoaLookup>({});
  const [reembolsos, setReembolsos] = useState<Record<string, number>>({});
  const [solicitacoes, setSolicitacoes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [nucleoFilter, setNucleoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const navigate = useNavigate();

  const handleDeleteProjeto = async (contratoId: string, numero: string | null) => {
    if (!confirm(`Deseja realmente excluir o projeto ${numero || contratoId}?\n\nATENÇÍO: Esta açÍo nÍo pode ser desfeita!`)) {
      return;
    }

    try {
      setLoading(true);

      // 1. Excluir da tabela de resumo financeiro (os cards)
      const { error: resumoError } = await supabase
        .from("financeiro_projetos_resumo")
        .delete()
        .eq("contrato_id", contratoId);

      if (resumoError) {
        console.warn("Aviso ao excluir resumo:", resumoError);
        // Continua mesmo se der erro aqui (pode nÍo existir)
      }

      // 2. Excluir lançamentos financeiros associados
      const { error: lancError } = await supabase
        .from("financeiro_lancamentos")
        .delete()
        .eq("contrato_id", contratoId);

      if (lancError) {
        console.warn("Aviso ao excluir lançamentos:", lancError);
      }

      // 3. Excluir cobranças associadas (se existirem)
      let { error: cobrancaError } = await supabase
        .from("cobrancas")
        .delete()
        .eq("contrato_id", contratoId);

      if (cobrancaError && isMissingColumnError(cobrancaError, "contrato_id")) {
        const fallback = await supabase
          .from("cobrancas")
          .delete()
          .eq("dados_bancarios->>contrato_id", contratoId);

        cobrancaError = fallback.error;
      }

      if (cobrancaError) {
        console.warn("Aviso ao excluir cobranças:", cobrancaError);
      }

      // 4. Excluir o contrato principal
      const { error: contratoError } = await supabase
        .from("contratos")
        .delete()
        .eq("id", contratoId);

      if (contratoError) {
        throw contratoError;
      }

      toast({
        title: "Projeto excluído",
        description: `O projeto ${numero || contratoId} foi excluído com sucesso.`,
      });

      // Remover da lista local
      setCards((prev) => prev.filter((c) => c.contrato_id !== contratoId));
    } catch (error: any) {
      console.error("Erro ao excluir projeto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir projeto",
        description: error?.message || "NÍo foi possível excluir o projeto.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Range de até 50000 para evitar limite padrÍo de 1000 do Supabase
        const { data, error } = await supabase
          .from("financeiro_projetos_resumo")
          .select("*")
          .order("data_inicio", { ascending: false })
          .range(0, 49999);

        if (error) {
          throw error;
        }

        const lista = (data || []) as Resumo[];
        setCards(lista);

        // Buscar avatares dos clientes (uma única chamada)
        const ids = Array.from(
          new Set(lista.map((c) => c.cliente_id).filter(Boolean))
        ) as string[];

        if (ids.length > 0) {
          const { data: pessoasData, error: pessoasError } = await supabase
            .from("pessoas")
            .select("id, nome, avatar_url, foto_url")
            .in("id", ids);

          if (!pessoasError && pessoasData) {
            const lookup: PessoaLookup = {};
            pessoasData.forEach((p: any) => {
              lookup[p.id] = {
                nome: p.nome,
                avatar_url: p.avatar_url || p.foto_url,
                foto_url: p.foto_url,
              };
            });
            setPessoas(lookup);
          } else {
            console.error("Erro ao buscar pessoas:", pessoasError);
            setPessoas({});
          }
        } else {
          setPessoas({});
        }

        // Contadores de reembolsos e solicitações por contrato
        const contratoIds = Array.from(
          new Set(lista.map((c) => c.contrato_id).filter(Boolean))
        ) as string[];

        if (contratoIds.length > 0) {
          const { data: reemb, error: reembError } = await supabase
            .from("reembolsos")
            .select("id, contrato_id")
            .in("contrato_id", contratoIds);

          if (!reembError) {
            const rmap: Record<string, number> = {};
            (reemb || []).forEach((r: any) => {
              if (r.contrato_id) {
                rmap[r.contrato_id] = (rmap[r.contrato_id] || 0) + 1;
              }
            });
            setReembolsos(rmap);
          } else {
            console.error("Erro ao buscar reembolsos:", reembError);
            setReembolsos({});
          }

          const { data: soli, error: soliError } = await supabase
            .from("solicitacoes_pagamento")
            .select("id, contrato_id")
            .in("contrato_id", contratoIds);

          if (!soliError) {
            const smap: Record<string, number> = {};
            (soli || []).forEach((s: any) => {
              if (s.contrato_id) {
                smap[s.contrato_id] = (smap[s.contrato_id] || 0) + 1;
              }
            });
            setSolicitacoes(smap);
          } else {
            console.error(
              "Erro ao buscar solicitações de pagamento:",
              soliError
            );
            setSolicitacoes({});
          }
        } else {
          setReembolsos({});
          setSolicitacoes({});
        }
      } catch (error: any) {
        console.error("Erro ao carregar projetos:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar projetos",
          description: error?.message || "Erro desconhecido",
        });
        setCards([]);
        setPessoas({});
        setReembolsos({});
        setSolicitacoes({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filtered = useMemo(() => {
    const term = normalizeSearchTerm(search);
    return cards.filter((c) => {
      const matchesTerm =
        !term ||
        normalizeSearchTerm(c.cliente_nome || "").includes(term) ||
        normalizeSearchTerm(c.numero || "").includes(term) ||
        normalizeSearchTerm(c.nucleo || "").includes(term);
      const matchesNucleo =
        nucleoFilter === "todos" ||
        (c.nucleo || "").toLowerCase() === nucleoFilter;
      const matchesStatus =
        statusFilter === "todos" ||
        (c.status || "").toLowerCase() === statusFilter;
      return matchesTerm && matchesNucleo && matchesStatus;
    });
  }, [cards, search, nucleoFilter, statusFilter]);

  const nucleosDisponiveis = useMemo(() => {
    const list = Array.from(
      new Set(cards.map((c) => c.nucleo).filter(Boolean))
    ) as string[];
    return list;
  }, [cards]);

  const statusesDisponiveis = useMemo(() => {
    const list = Array.from(
      new Set(cards.map((c) => c.status).filter(Boolean))
    ) as string[];
    return list;
  }, [cards]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
            Projetos (Financeiro)
          </h1>
          <p className="text-[12px] text-gray-600 mt-1">
            Resumo de contratos ativos para acompanhamento financeiro.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, número ou núcleo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-700">Núcleo</span>
            <select
              className="border rounded-md px-2 py-1 text-[14px]"
              value={nucleoFilter}
              onChange={(e) => setNucleoFilter(e.target.value.toLowerCase())}
            >
              <option value="todos">Todos</option>
              {nucleosDisponiveis.map((n) => (
                <option key={n} value={n?.toLowerCase() || ""}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-700">Status</span>
            <select
              className="border rounded-md px-2 py-1 text-[14px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value.toLowerCase())}
            >
              <option value="todos">Todos</option>
              {statusesDisponiveis.map((s) => (
                <option key={s} value={s?.toLowerCase() || ""}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wg-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filtered.map((card, index) => (
            <motion.div
              key={card.contrato_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="wg-card p-6 hover:shadow-lg transition-shadow cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage
                      src={
                        (card.cliente_id &&
                          pessoas[card.cliente_id]?.avatar_url) || undefined
                      }
                      alt={card.cliente_nome || ""}
                    />
                    <AvatarFallback>
                      {card.cliente_nome
                        ?.split(" ")
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase() || <Building2 size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-[13px] font-light text-gray-900">
                      {card.numero || "Sem número"}
                    </h3>
                    <p className="text-[12px] text-gray-600">
                      {card.cliente_nome || "Cliente nÍo informado"}
                    </p>
                    {card.nucleo && (
                      <Badge
                        className="mt-1 bg-gray-100 text-gray-700 cursor-pointer"
                        onClick={() =>
                          setNucleoFilter(card.nucleo!.toLowerCase())
                        }
                      >
                        {card.nucleo}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={statusColor(card.status)}>
                    {card.status || "ativo"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleDeleteProjeto(card.contrato_id, card.numero)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                    title="Excluir projeto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-[12px] text-gray-700">
                <div className="flex justify-between">
                  <span>Valor total</span>
                  <span className="text-gray-900">
                    {formatMoney(card.valor_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Entrada</span>
                  <span className="text-gray-900">
                    {formatMoney(card.valor_entrada)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Parcelas</span>
                  <span className="text-gray-900">
                    {card.numero_parcelas || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Início</span>
                  <span className="text-gray-900">
                    {card.data_inicio
                      ? formatarData(card.data_inicio)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PrevisÍo término</span>
                  <span className="text-gray-900">
                    {card.data_previsao_termino
                      ? formatarData(card.data_previsao_termino)
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between text-[12px] text-gray-600 mt-2">
                  <span>Reembolsos</span>
                  <span className="text-gray-900">
                    {reembolsos[card.contrato_id] || 0}
                  </span>
                </div>
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Solicitações de pagamento</span>
                  <span className="text-gray-900">
                    {solicitacoes[card.contrato_id] || 0}
                  </span>
                </div>

                {/* BotÍo Stripe para gerar link de pagamento */}
                <div className="pt-3 border-t border-gray-200 mt-3">
                  <StripePaymentButton
                    parcelaId={card.contrato_id}
                    valor={card.valor_total || 0}
                    descricao={`Contrato ${card.numero || ''}`}
                    clienteNome={card.cliente_nome || undefined}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  />
                </div>

                <div className="pt-3 flex flex-wrap gap-2 justify-end">
                  {card.cliente_id && (
                    <button
                      onClick={() =>
                        navigate(`/pessoas/clientes/${card.cliente_id}`)
                      }
                      className="text-[12px] text-[#2B4580] hover:text-wg-primary inline-flex items-center gap-1"
                    >
                      Cliente
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/contratos/${card.contrato_id}`)}
                    className="text-[12px] text-[#2B4580] hover:text-wg-primary inline-flex items-center gap-1"
                  >
                    Ver contrato
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/financeiro/cobrancas`)}
                    className="text-[12px] text-[#2B4580] hover:text-wg-primary inline-flex items-center gap-1"
                  >
                    Cobranças
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/cronograma/projects`)}
                    className="text-[12px] text-[#2B4580] hover:text-wg-primary inline-flex items-center gap-1"
                  >
                    Cronograma
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObrasFinanceiroPage;

