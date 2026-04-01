import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Clock3, FileText, Loader2, Plus } from "lucide-react";

interface PropostasTabProps {
  pessoaId: string;
}

type PropostaResumo = {
  id: string;
  titulo: string | null;
  numero: string | null;
  status: string | null;
  valor_total: number | null;
  criado_em: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  em_revisao: "Em revisÍo",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-600",
  enviada: "bg-blue-100 text-blue-700",
  em_revisao: "bg-amber-100 text-amber-700",
  aprovada: "bg-emerald-100 text-emerald-700",
  rejeitada: "bg-red-100 text-red-700",
  cancelada: "bg-zinc-100 text-zinc-500",
};

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  return new Date(value).toLocaleDateString("pt-BR");
}

export const PropostasTab: React.FC<PropostasTabProps> = ({ pessoaId }) => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pessoa-propostas", pessoaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propostas")
        .select("id, titulo, numero, status, valor_total, criado_em")
        .eq("cliente_id", pessoaId)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return (data || []) as PropostaResumo[];
    },
  });

  const propostas = data || [];
  const propostasAbertas = propostas.filter((item) =>
    ["rascunho", "enviada", "em_revisao"].includes(item.status || "")
  ).length;
  const valorPipeline = propostas.reduce(
    (total, item) => total + Number(item.valor_total || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{propostas.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{propostasAbertas}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pipeline</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(valorPipeline)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Propostas vinculadas</h2>
            <p className="text-sm text-gray-500">Acompanhe o pipeline comercial desta pessoa.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/propostas/nova?pessoaId=${pessoaId}`)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#050C18] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={16} />
            Nova proposta
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando propostas...
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 text-sm text-red-600">Erro ao carregar propostas vinculadas.</div>
        )}

        {!isLoading && !error && propostas.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhuma proposta foi vinculada a esta pessoa ainda.
          </div>
        )}

        {!isLoading && !error && propostas.length > 0 && (
          <div className="divide-y divide-gray-100">
            {propostas.map((proposta) => {
              const status = proposta.status || "rascunho";
              return (
                <button
                  key={proposta.id}
                  type="button"
                  onClick={() => navigate(`/propostas/${proposta.id}/visualizar`)}
                  className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {proposta.titulo || "Proposta sem título"}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} />
                        {proposta.numero || "Sem número"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        {formatDate(proposta.criado_em)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(proposta.valor_total)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

