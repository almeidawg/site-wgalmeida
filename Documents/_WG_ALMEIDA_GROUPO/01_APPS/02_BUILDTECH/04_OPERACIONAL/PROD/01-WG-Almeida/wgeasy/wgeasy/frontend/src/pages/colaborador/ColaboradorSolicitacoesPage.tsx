import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColaboradorLancamento,
  listarLancamentosFavorecido,
} from "@/lib/colaboradorApi";
import { formatarData, formatarMoeda } from "@/lib/utils";

type LancamentoStatus =
  | "pendente"
  | "previsto"
  | "parcial"
  | "pago"
  | "atrasado"
  | "cancelado";

const STATUS_CONFIG: Record<
  LancamentoStatus,
  { label: string; color: string; icon: ComponentType<{ className?: string }> }
> = {
  pendente: {
    label: "Pendente",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  previsto: {
    label: "Previsto",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  parcial: {
    label: "Parcial",
    color: "bg-sky-100 text-sky-700",
    icon: Wallet,
  },
  pago: {
    label: "Pago",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  atrasado: {
    label: "Atrasado",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-gray-200 text-gray-600",
    icon: X,
  },
};

const STATUS_ORDER: LancamentoStatus[] = [
  "pendente",
  "previsto",
  "parcial",
  "pago",
  "atrasado",
  "cancelado",
];

export default function ColaboradorSolicitacoesPage() {
  const { usuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lancamentos, setLancamentos] = useState<ColaboradorLancamento[]>([]);
  const [filtro, setFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<LancamentoStatus | "todos">(
    "todos"
  );
  const [lancamentoDetalhe, setLancamentoDetalhe] =
    useState<ColaboradorLancamento | null>(null);

  useEffect(() => {
    const carregar = async () => {
      if (!usuarioCompleto?.pessoa_id) return;

      try {
        setLoading(true);
        const data = await listarLancamentosFavorecido(
          usuarioCompleto.pessoa_id
        );
        setLancamentos(data);
      } catch (error) {
        console.error("Erro ao carregar lançamentos:", error);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [usuarioCompleto?.pessoa_id]);


  const lancamentosFiltrados = useMemo(() => {
    const termo = normalizeSearchTerm(filtro);

    return lancamentos.filter((item) => {
      const status = (item.status as LancamentoStatus) || "pendente";
      const matchStatus =
        statusFiltro === "todos" ? true : status === statusFiltro;

      const matchTermo =
        !termo ||
        [
          item.descricao,
          item.contrato?.numero,
          item.contrato?.titulo,
          item.projeto?.nome,
          item.id?.toString(),
        ]
          .filter(Boolean)
          .some((campo) => normalizeSearchTerm(campo!.toString()).includes(termo));

      return matchStatus && matchTermo;
    });
  }, [lancamentos, filtro, statusFiltro]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
          Seus lançamentos como favorecido
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pagamentos e lançamentos vinculados ao seu CPF/CNPJ na WGeasy.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const count = lancamentos.filter(
            (item) =>
              ((item.status as LancamentoStatus) || "pendente") === status
          ).length;
          const Icon = config.icon;

          return (
            <Card
              key={status}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFiltro(status)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[20px] font-normal">{count}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descriçÍo, contrato ou projeto"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFiltro}
              onValueChange={(value) =>
                setStatusFiltro(value as LancamentoStatus | "todos")
              }
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {lancamentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum lançamento encontrado</p>
              <p className="text-sm mt-1">
                {filtro || statusFiltro !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Nada listado para você como favorecido"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lancamentosFiltrados.map((lancamento) => {
            const status =
              (lancamento.status as LancamentoStatus) || "pendente";
            const statusConfig = STATUS_CONFIG[status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={lancamento.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLancamentoDetalhe(lancamento)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">
                              {lancamento.contrato?.numero || lancamento.id}
                            </span>
                            {lancamento.tipo && (
                              <Badge variant="outline" className="text-xs">
                                {lancamento.tipo === "saida" ? "Pagamento" : lancamento.tipo}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mt-1 truncate">
                            {lancamento.descricao}
                          </h3>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        {lancamento.contrato?.numero && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{lancamento.contrato.numero}</span>
                          </div>
                        )}
                        {lancamento.vencimento && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Venc: {formatarData(lancamento.vencimento)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:min-w-[120px]">
                      <p className="text-lg font-normal text-wg-primary">
                        {formatarMoeda(lancamento.valor_total)}
                      </p>
                      {lancamento.data_pagamento && (
                        <p className="text-xs text-gray-500">
                          Pago em: {formatarData(lancamento.data_pagamento)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!lancamentoDetalhe}
        onOpenChange={() => setLancamentoDetalhe(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Lançamento {lancamentoDetalhe?.contrato?.numero || lancamentoDetalhe?.id}
            </DialogTitle>
          </DialogHeader>

          {lancamentoDetalhe && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const status =
                    (lancamentoDetalhe.status as LancamentoStatus) ||
                    "pendente";
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </span>
                  );
                })()}
                {lancamentoDetalhe.tipo && (
                  <Badge variant="outline">{lancamentoDetalhe.tipo}</Badge>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  DescriçÍo
                </h4>
                <p className="text-gray-900">{lancamentoDetalhe.descricao}</p>
              </div>

              <div className="p-4 bg-wg-primary/5 rounded-lg">
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-3xl font-normal text-wg-primary">
                  {formatarMoeda(lancamentoDetalhe.valor_total)}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
                {lancamentoDetalhe.data_competencia && (
                  <span>
                    Competência:{" "}
                    {formatarData(lancamentoDetalhe.data_competencia)}
                  </span>
                )}
                {lancamentoDetalhe.vencimento && (
                  <span>
                    Vencimento: {formatarData(lancamentoDetalhe.vencimento)}
                  </span>
                )}
                {lancamentoDetalhe.data_pagamento && (
                  <span>
                    Pago em: {formatarData(lancamentoDetalhe.data_pagamento)}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

