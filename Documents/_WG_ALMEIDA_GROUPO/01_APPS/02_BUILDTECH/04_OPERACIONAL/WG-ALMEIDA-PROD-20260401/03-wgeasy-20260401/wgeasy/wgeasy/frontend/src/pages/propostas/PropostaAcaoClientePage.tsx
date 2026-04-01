// ============================================================
// PÁGINA: AçÍo do Cliente na Proposta (Aprovar/Recusar)
// Sistema WG Easy - Grupo WG Almeida
// Página pública acessível via link do PDF
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { criarContrato } from "@/lib/contratosApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

interface Proposta {
  id: string;
  numero: string | null;
  valor_total: number;
  cliente_id: string;
  status: string;
  created_at: string;
  cliente?: {
    nome: string;
  };
  observacoes_internas?: string;
  nucleo?: string;
}

export default function PropostaAcaoClientePage() {
  const { id, acao } = useParams<{ id: string; acao: string }>();

  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const isAprovacao = acao === "aprovar";

  const carregarProposta = useCallback(async () => {
    if (!id) {
      setErro("ID da proposta nÍo informado");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("propostas")
        .select(`
          id,
          numero,
          valor_total,
          cliente_id,
          status,
          created_at,
          cliente:pessoas!propostas_cliente_id_fkey(nome),
          observacoes_internas,
          nucleo
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        setErro("Proposta nÍo encontrada");
        setLoading(false);
        return;
      }

      if (data.status !== "enviada" && data.status !== "pendente") {
        setErro(
          `Esta proposta já foi ${
            data.status === "aprovada" ? "aprovada" : data.status === "recusada" ? "recusada" : "processada"
          }.`
        );
        setLoading(false);
        return;
      }

      const clienteJoin = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;

      setProposta({
        ...data,
        cliente: clienteJoin as { nome: string } | undefined,
      });
    } catch (error: unknown) {
      console.error("Erro ao carregar proposta:", error);
      setErro("Erro ao carregar proposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregarProposta();
  }, [carregarProposta]);

  async function processarAcao() {
    if (!proposta || !id) return;

    setProcessando(true);

    try {
      const novoStatus = isAprovacao ? "aprovada" : "recusada";

      // Atualizar status da proposta
      const { error: updateError } = await supabase
        .from("propostas")
        .update({
          status: novoStatus,
          observacoes_internas: observacao
            ? `${proposta.status === "enviada" ? "" : proposta.observacoes_internas || ""}\n[${new Date().toLocaleDateString("pt-BR")}] Cliente ${
                isAprovacao ? "aprovou" : "recusou"
              }: ${observacao}`
            : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Criar notificaçÍo no sistema
      await supabase.from("notificacoes").insert({
        tipo: isAprovacao ? "proposta_aprovada" : "proposta_recusada",
        titulo: `Proposta ${proposta.numero || id} ${isAprovacao ? "aprovada" : "recusada"}`,
        mensagem: `O cliente ${proposta.cliente?.nome || "N/A"} ${isAprovacao ? "aprovou" : "recusou"} a proposta ${proposta.numero || id}. ${observacao ? `ObservaçÍo: ${observacao}` : ""}`,
        lida: false,
        dados: {
          proposta_id: id,
          cliente_id: proposta.cliente_id,
          acao: novoStatus,
          valor: proposta.valor_total,
        },
      });

      // Se aprovada, iniciar workflow de contrato
      if (isAprovacao) {
        try {
          const contrato = await criarContrato(
            {
              proposta_id: id,
              cliente_id: proposta.cliente_id,
              valor_total: proposta.valor_total,
              tipo_contrato: proposta.nucleo || "servico",
              unidade_negocio: (proposta.nucleo as any) || "arquitetura",
              data_inicio: new Date().toISOString(),
              observacoes: `Contrato gerado automaticamente a partir da proposta ${proposta.numero || id}`,
            } as any,
            true
          );

          // Notificar sobre novo contrato
          await supabase.from("notificacoes").insert({
            tipo: "contrato_criado",
            titulo: `Novo contrato gerado`,
            mensagem: `Contrato criado automaticamente a partir da proposta ${proposta.numero || id} aprovada pelo cliente.`,
            lida: false,
            dados: {
              contrato_id: contrato.id,
              proposta_id: id,
              cliente_id: proposta.cliente_id,
            },
          });
        } catch (contratoError) {
          console.error("Erro ao criar contrato:", contratoError);
        }
      }

      setConcluido(true);
      toast.success(
        isAprovacao
          ? "Proposta aprovada com sucesso! Entraremos em contato em breve."
          : "Proposta recusada. Agradecemos seu feedback."
      );

    } catch (error: unknown) {
      console.error("Erro ao processar açÍo:", error);
      toast.error("Erro ao processar sua solicitaçÍo. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  // Estado de carregamento
  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${LAYOUT.pageContainer}`}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
          <p className={TYPOGRAPHY.bodySmall}>Carregando proposta...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (erro) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4`}>
        <Card className={`${LAYOUT.modalMedium}`}>
          <CardContent className="pt-4 sm:pt-6 text-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-3 sm:mb-4" />
            <h2 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>AtençÍo</h2>
            <p className={`${TYPOGRAPHY.bodySmall} mb-4 sm:mb-6`}>{erro}</p>
            <Button variant="outline" onClick={() => window.close()}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de conclusÍo
  if (concluido) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4`}>
        <Card className={`${LAYOUT.modalMedium}`}>
          <CardContent className="pt-4 sm:pt-6 text-center">
            {isAprovacao ? (
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-3 sm:mb-4" />
            ) : (
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-3 sm:mb-4" />
            )}
            <h2 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>
              {isAprovacao ? "Proposta Aprovada!" : "Proposta Recusada"}
            </h2>
            <p className={`${TYPOGRAPHY.bodySmall} mb-4 sm:mb-6`}>
              {isAprovacao
                ? "Sua aprovaçÍo foi registrada com sucesso. Nossa equipe entrará em contato em breve para dar continuidade ao processo."
                : "Agradecemos seu feedback. Se desejar, entre em contato conosco para ajustarmos a proposta às suas necessidades."}
            </p>
            <div className={`${TYPOGRAPHY.cardSubtitle} mb-3 sm:mb-4`}>
              Proposta: {proposta?.numero || id}
            </div>
            <Button variant="outline" onClick={() => window.close()}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de açÍo
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4`}>
      <Card className={`${LAYOUT.modalMedium}`}>
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="mx-auto mb-3 sm:mb-4">
            <img
              src="/logo-wg.png"
              alt="WG Almeida"
              className="h-12 sm:h-16 mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <CardTitle className={TYPOGRAPHY.pageTitle}>
            {isAprovacao ? "Aprovar Proposta" : "Recusar Proposta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
          {/* Detalhes da proposta */}
          <div className={`${LAYOUT.card} bg-gray-100 space-y-2`}>
            <div className="flex justify-between">
              <span className={TYPOGRAPHY.bodySmall}>Proposta:</span>
              <span className={TYPOGRAPHY.cardTitle}>{proposta?.numero || id}</span>
            </div>
            <div className="flex justify-between">
              <span className={TYPOGRAPHY.bodySmall}>Cliente:</span>
              <span className={TYPOGRAPHY.cardTitle}>{proposta?.cliente?.nome || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className={TYPOGRAPHY.bodySmall}>Valor Total:</span>
              <span className={TYPOGRAPHY.moneyMedium}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(proposta?.valor_total || 0)}
              </span>
            </div>
          </div>

          {/* Campo de observaçÍo */}
          <div>
            <label className={`${TYPOGRAPHY.formLabel} block mb-2`}>
              {isAprovacao
                ? "Observações (opcional)"
                : "Motivo da recusa (opcional)"}
            </label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder={isAprovacao
                ? "Alguma observaçÍo sobre a aprovaçÍo..."
                : "Por favor, nos conte o motivo da recusa para podermos melhorar..."}
              rows={3}
            />
          </div>

          {/* Botões de açÍo */}
          <div className="flex gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.close()}
              disabled={processando}
            >
              Cancelar
            </Button>
            <Button
              className={`flex-1 ${
                isAprovacao
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={processarAcao}
              disabled={processando}
            >
              {processando ? (
                <>
                  <Loader2 className={`${TYPOGRAPHY.iconSmall} animate-spin mr-2`} />
                  Processando...
                </>
              ) : (
                <>
                  {isAprovacao ? (
                    <CheckCircle className={`${TYPOGRAPHY.iconSmall} mr-2`} />
                  ) : (
                    <XCircle className={`${TYPOGRAPHY.iconSmall} mr-2`} />
                  )}
                  {isAprovacao ? "Confirmar AprovaçÍo" : "Confirmar Recusa"}
                </>
              )}
            </Button>
          </div>

          {/* Aviso */}
          <p className={`${TYPOGRAPHY.caption} text-center`}>
            Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

