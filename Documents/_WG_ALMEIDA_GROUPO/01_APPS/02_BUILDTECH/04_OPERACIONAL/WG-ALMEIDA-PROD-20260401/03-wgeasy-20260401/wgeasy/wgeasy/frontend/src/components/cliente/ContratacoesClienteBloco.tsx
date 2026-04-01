import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { Package, Wrench, Wind, ShoppingBag } from "lucide-react";

interface ContratacoesClienteBlocoProps {
  contratoId?: string;
  clienteId?: string;
  nucleo?: "arquitetura" | "engenharia" | "marcenaria" | string;
}

interface ItemContrato {
  id: string;
  descricao: string;
  tipo: string | null;
  tipo_financeiro: string | null;
  nucleo: string | null;
  contratado_pelo_cliente?: boolean | null;
  quantidade: number | null;
  unidade: string | null;
}

const KEYWORDS_CLIENTE = [
  "cliente",
  "por conta do cliente",
  "fornecimento cliente",
  "contratado pelo cliente",
  "ar condicionado",
  "#contratacao",
];

function normalizarNucleo(valor?: string | null): string {
  const txt = String(valor || "").toLowerCase().trim();
  if (txt.startsWith("eng")) return "engenharia";
  if (txt.startsWith("mar")) return "marcenaria";
  if (txt.startsWith("arq")) return "arquitetura";
  return txt;
}

function isItemCliente(
  item: ItemContrato,
  modalidadesGestao: Set<string>
): boolean {
  const texto = String(item.descricao || "").toLowerCase();
  const tipo = String(item.tipo || "").toLowerCase();
  const tipoFinanceiro = String(item.tipo_financeiro || "").toLowerCase();
  const nucleo = normalizarNucleo(item.nucleo);

  const keywordMatch = KEYWORDS_CLIENTE.some((k) => texto.includes(k));
  if (keywordMatch) return true;

  const materialOuProduto =
    tipo.includes("material") ||
    tipo.includes("produto") ||
    tipo.includes("insumo") ||
    tipoFinanceiro.includes("material") ||
    tipoFinanceiro.includes("produto");

  if (item.contratado_pelo_cliente === true) return true;

  return modalidadesGestao.has(nucleo) && materialOuProduto;
}

export default function ContratacoesClienteBloco({
  contratoId,
  clienteId,
  nucleo,
}: ContratacoesClienteBlocoProps) {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<ItemContrato[]>([]);

  const carregar = useCallback(async () => {
    if (!contratoId && !clienteId) return;
    setLoading(true);
    try {
      const itensAgregados: ItemContrato[] = [];
      const nucleosGestao = new Set<string>();

      if (contratoId) {
        const { data: modalidades } = await supabase
          .from("contratos_pagamentos_nucleo")
          .select("nucleo, modalidade_materiais")
          .eq("contrato_id", contratoId);

        (modalidades || [])
          .filter((m: any) => String(m.modalidade_materiais || "").toLowerCase() === "gestao")
          .forEach((m: any) => nucleosGestao.add(normalizarNucleo(m.nucleo)));

        const { data: itensContrato, error } = await supabase
          .from("contratos_itens")
          .select("id, descricao, tipo, tipo_financeiro, nucleo, contratado_pelo_cliente, quantidade, unidade")
          .eq("contrato_id", contratoId)
          .order("ordem", { ascending: true });

        if (error) throw error;

        for (const item of (itensContrato || []) as any[]) {
          itensAgregados.push({
            id: String(item.id),
            descricao: String(item.descricao || ""),
            tipo: item.tipo || null,
            tipo_financeiro: item.tipo_financeiro || null,
            nucleo: item.nucleo || null,
            contratado_pelo_cliente: item.contratado_pelo_cliente ?? null,
            quantidade: item.quantidade ?? null,
            unidade: item.unidade || null,
          });
        }
      }

      if (clienteId) {
        const { data: propostasAprovadas } = await supabase
          .from("propostas")
          .select("id")
          .eq("cliente_id", clienteId)
          .in("status", ["aprovada", "aprovado", "aceita"]);

        const propostaIds = (propostasAprovadas || []).map((p: any) => p.id).filter(Boolean);
        if (propostaIds.length > 0) {
          const { data: itensPropostaData, error: _itensPropostaError } = await supabase
            .from("propostas_itens")
            .select("id, descricao, descricao_customizada, tipo, nucleo, contratado_pelo_cliente, quantidade, unidade")
            .in("proposta_id", propostaIds)
            .order("ordem", { ascending: true });

          const itensProposta: any[] = itensPropostaData || [];

          for (const item of itensProposta as any[]) {
            itensAgregados.push({
              id: `proposta-${String(item.id)}`,
              descricao: String(item.descricao_customizada || item.descricao || ""),
              tipo: item.tipo || null,
              tipo_financeiro: item.tipo_financeiro || null,
              nucleo: item.nucleo || null,
              contratado_pelo_cliente: item.contratado_pelo_cliente ?? null,
              quantidade: item.quantidade ?? null,
              unidade: item.unidade || null,
            });
          }
        }
      }

      const filtrados = itensAgregados.filter((item) => {
        if (nucleo && normalizarNucleo(item.nucleo) !== normalizarNucleo(nucleo)) return false;
        return isItemCliente(item, nucleosGestao);
      });

      const itensUnicos = [...new Map(filtrados.map((item) => [item.id, item])).values()];
      setItens(itensUnicos.map((item) => ({
        ...item,
        descricao: item.descricao || "Item sem descriçÍo",
      })));
    } catch (err) {
      console.error("[ContratacoesClienteBloco] Erro ao carregar:", err);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [contratoId, clienteId, nucleo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const tituloNucleo = useMemo(() => {
    const n = normalizarNucleo(nucleo);
    if (n === "engenharia") return "Engenharia";
    if (n === "marcenaria") return "Marcenaria";
    if (n === "arquitetura") return "Arquitetura";
    return "Núcleo";
  }, [nucleo]);

  if ((!contratoId && !clienteId) || (!loading && itens.length === 0)) return null;

  return (
    <Card className="border border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-medium text-amber-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Contratações do Cliente ({tituloNucleo})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-[12px] text-gray-500">Carregando contratações...</p>
        ) : (
          itens.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-amber-100 bg-white px-3 py-2 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-[13px] text-gray-800 truncate">{item.descricao}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {item.tipo || "item"}
                  </Badge>
                  {item.tipo?.toLowerCase().includes("serv") ? (
                    <Wrench className="w-3.5 h-3.5 text-sky-600" />
                  ) : item.descricao.toLowerCase().includes("ar condicionado") ? (
                    <Wind className="w-3.5 h-3.5 text-sky-600" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                  )}
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-500 whitespace-nowrap">
                {item.quantidade || 1} {item.unidade || "un"}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

