// ============================================================
// PÁGINA: Propostas do Cliente com AprovaçÍo por Núcleo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { PropostaCompleta, Nucleo } from "@/types/propostas";
import {
  getStatusPropostaLabel,
  getStatusPropostaColor,
} from "@/types/propostas";
import { gerarPropostaPDF, type DadosBancariosNucleo } from "@/lib/propostaPdfUtils";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function ClientePropostasPage() {
  const { toast } = useToast();
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  const [propostas, setPropostas] = useState<PropostaCompleta[]>([]);
  const [clienteNome, setClienteNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [nucleoFiltro, setNucleoFiltro] = useState<Nucleo | "todos">("todos");

  const carregarDados = useCallback(async () => {
    if (!clienteId) {
      return;
    }
    setLoading(true);
    try {
      const { data: clienteData } = await supabase
        .from("pessoas")
        .select("nome")
        .eq("id", clienteId)
        .single();

      const novoNomeCliente = clienteData?.nome || "";
      if (novoNomeCliente) {
        setClienteNome(novoNomeCliente);
      }

      const { data: propostasData, error } = await supabase
        .from("propostas")
        .select(`
          *,
          proposta_itens (*)
        `)
        .eq("cliente_id", clienteId)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const nomeParaPropostas = novoNomeCliente || clienteNome;

      const propostasCompletas: PropostaCompleta[] = (propostasData || []).map((p: any) => ({
        ...p,
        cliente_nome: nomeParaPropostas,
        itens: p.proposta_itens || [],
      }));

      setPropostas(propostasCompletas);
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar propostas do cliente" });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, clienteNome]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function aprovarProposta(propostaId: string) {
    if (!confirm("Deseja aprovar esta proposta?")) return;

    try {
      const { error } = await supabase
        .from("propostas")
        .update({ status: "aprovada" })
        .eq("id", propostaId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Proposta aprovada com sucesso!" });
      carregarDados();
    } catch (error) {
      console.error("Erro ao aprovar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aprovar proposta" });
    }
  }

  async function rejeitarProposta(propostaId: string) {
    if (!confirm("Deseja rejeitar esta proposta?")) return;

    try {
      const { error } = await supabase
        .from("propostas")
        .update({ status: "rejeitada" })
        .eq("id", propostaId);

      if (error) throw error;

      toast({ title: "Proposta rejeitada" });
      carregarDados();
    } catch (error) {
      console.error("Erro ao rejeitar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao rejeitar proposta" });
    }
  }

  function gerarContrato(propostaId: string) {
    navigate(`/contratos/novo?proposta_id=${propostaId}`);
  }

  const buscarDadosBancarios = async (nucleo?: string | null): Promise<DadosBancariosNucleo | null> => {
    if (!nucleo) return null;
    try {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("banco, agencia, conta, tipo_conta, pix_chave, pix_tipo, nome, nucleo")
        .eq("ativo", true)
        .in("nucleo", [nucleo, "grupo"])
        .order("nucleo", { ascending: false });

      if (error) return null;
      const conta = (data || []).find((item) => item.nucleo === nucleo) || (data || [])[0];
      return conta || null;
    } catch (error) {
      console.warn("Falha ao carregar contas bancarias:", error);
      return null;
    }
  };

  async function handleVisualizarPDF(proposta: PropostaCompleta) {
    const dadosBancarios = await buscarDadosBancarios(proposta.nucleo || null);
    await gerarPropostaPDF(proposta, dadosBancarios);
  }

  const propostasFiltradas = propostas.filter((p) => {
    if (nucleoFiltro === "todos") return true;
    return p.nucleo === nucleoFiltro;
  });

  // Agrupar por núcleo
  const propostasPorNucleo = {
    arquitetura: propostasFiltradas.filter((p) => p.nucleo === "arquitetura"),
    engenharia: propostasFiltradas.filter((p) => p.nucleo === "engenharia"),
    marcenaria: propostasFiltradas.filter((p) => p.nucleo === "marcenaria"),
    sem_nucleo: propostasFiltradas.filter((p) => !p.nucleo),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando propostas...</div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className={LAYOUT.pageHeader}>
          <div>
            <h1 className={TYPOGRAPHY.pageTitle}>
              Propostas - {clienteNome}
            </h1>
            <p className={`${TYPOGRAPHY.pageSubtitle} mt-1 ${LAYOUT.hideOnMobile}`}>
              Visualize e gerencie as propostas deste cliente
            </p>
          </div>
          <button
            onClick={() => navigate("/pessoas/clientes")}
            className="px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] text-[#F25C26] hover:underline"
          >
            ← Voltar
          </button>
        </div>

        {/* Filtro por Nucleo */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setNucleoFiltro("todos")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors ${
              nucleoFiltro === "todos"
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setNucleoFiltro("arquitetura")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors ${
              nucleoFiltro === "arquitetura"
                ? "bg-purple-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className={LAYOUT.hideOnMobile}>Arquitetura</span>
            <span className={LAYOUT.showOnMobile}>Arq</span>
          </button>
          <button
            onClick={() => setNucleoFiltro("engenharia")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors ${
              nucleoFiltro === "engenharia"
                ? "bg-amber-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className={LAYOUT.hideOnMobile}>Engenharia</span>
            <span className={LAYOUT.showOnMobile}>Eng</span>
          </button>
          <button
            onClick={() => setNucleoFiltro("marcenaria")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors ${
              nucleoFiltro === "marcenaria"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className={LAYOUT.hideOnMobile}>Marcenaria</span>
            <span className={LAYOUT.showOnMobile}>Marc</span>
          </button>
        </div>
      </div>

      {/* Lista de Propostas por Núcleo */}
      {nucleoFiltro === "todos" ? (
        <div className="space-y-6 sm:space-y-8">
          {/* Arquitetura */}
          {propostasPorNucleo.arquitetura.length > 0 && (
            <NucleoSection
              titulo="Arquitetura"
              cor="#8B5CF6"
              propostas={propostasPorNucleo.arquitetura}
              onAprovar={aprovarProposta}
              onRejeitar={rejeitarProposta}
              onGerarContrato={gerarContrato}
              onVisualizarPDF={handleVisualizarPDF}
            />
          )}

          {/* Engenharia */}
          {propostasPorNucleo.engenharia.length > 0 && (
            <NucleoSection
              titulo="Engenharia"
              cor="#F59E0B"
              propostas={propostasPorNucleo.engenharia}
              onAprovar={aprovarProposta}
              onRejeitar={rejeitarProposta}
              onGerarContrato={gerarContrato}
              onVisualizarPDF={handleVisualizarPDF}
            />
          )}

          {/* Marcenaria */}
          {propostasPorNucleo.marcenaria.length > 0 && (
            <NucleoSection
              titulo="Marcenaria"
              cor="#10B981"
              propostas={propostasPorNucleo.marcenaria}
              onAprovar={aprovarProposta}
              onRejeitar={rejeitarProposta}
              onGerarContrato={gerarContrato}
              onVisualizarPDF={handleVisualizarPDF}
            />
          )}

          {/* Sem Núcleo */}
          {propostasPorNucleo.sem_nucleo.length > 0 && (
            <NucleoSection
              titulo="Outras Propostas"
              cor="#6B7280"
              propostas={propostasPorNucleo.sem_nucleo}
              onAprovar={aprovarProposta}
              onRejeitar={rejeitarProposta}
              onGerarContrato={gerarContrato}
              onVisualizarPDF={handleVisualizarPDF}
            />
          )}
        </div>
      ) : (
        <PropostasGrid
          propostas={propostasFiltradas}
          onAprovar={aprovarProposta}
          onRejeitar={rejeitarProposta}
          onGerarContrato={gerarContrato}
          onVisualizarPDF={handleVisualizarPDF}
        />
      )}

      {propostas.length === 0 && (
        <div className={`${LAYOUT.card} text-center py-8 sm:py-12`}>
          <p className={TYPOGRAPHY.cardSubtitle}>Nenhuma proposta encontrada para este cliente</p>
          <button
            onClick={() => navigate("/propostas/nova")}
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            + Nova Proposta
          </button>
        </div>
      )}
    </div>
  );
}

// Componente: SeçÍo de Núcleo
function NucleoSection({
  titulo,
  cor,
  propostas,
  onAprovar,
  onRejeitar,
  onGerarContrato,
  onVisualizarPDF,
}: {
  titulo: string;
  cor: string;
  propostas: PropostaCompleta[];
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onGerarContrato: (id: string) => void;
  onVisualizarPDF: (proposta: PropostaCompleta) => void;
}) {
  return (
    <div className={`${LAYOUT.card} p-4 sm:p-6`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div
          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
          style={{ backgroundColor: cor }}
        />
        <h2 className={TYPOGRAPHY.sectionTitle}>{titulo}</h2>
        <span className={TYPOGRAPHY.cardMeta}>({propostas.length})</span>
      </div>

      <PropostasGrid
        propostas={propostas}
        onAprovar={onAprovar}
        onRejeitar={onRejeitar}
        onGerarContrato={onGerarContrato}
        onVisualizarPDF={onVisualizarPDF}
      />
    </div>
  );
}

// Componente: Grid de Propostas
function PropostasGrid({
  propostas,
  onAprovar,
  onRejeitar,
  onGerarContrato,
  onVisualizarPDF,
}: {
  propostas: PropostaCompleta[];
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onGerarContrato: (id: string) => void;
  onVisualizarPDF: (proposta: PropostaCompleta) => void;
}) {
  return (
    <div className={LAYOUT.gridHalf}>
      {propostas.map((proposta) => (
        <PropostaCard
          key={proposta.id}
          proposta={proposta}
          onAprovar={onAprovar}
          onRejeitar={onRejeitar}
          onGerarContrato={onGerarContrato}
          onVisualizarPDF={onVisualizarPDF}
        />
      ))}
    </div>
  );
}

// Componente: Card de Proposta
function PropostaCard({
  proposta,
  onAprovar,
  onRejeitar,
  onGerarContrato,
  onVisualizarPDF,
}: {
  proposta: PropostaCompleta;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onGerarContrato: (id: string) => void;
  onVisualizarPDF: (proposta: PropostaCompleta) => void;
}) {
  const statusColor = getStatusPropostaColor(proposta.status);
  const statusLabel = getStatusPropostaLabel(proposta.status);

  return (
    <div className={`${LAYOUT.cardHover} p-3 sm:p-4 bg-gray-50 border border-gray-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div>
          <h3 className={TYPOGRAPHY.cardTitle}>{proposta.titulo}</h3>
          <p className={`${TYPOGRAPHY.cardMeta} mt-1`}>
            {proposta.numero || `#${proposta.id.slice(0, 8)}`}
          </p>
        </div>
        <span
          className={`${TYPOGRAPHY.badgeSmall} text-white`}
          style={{ backgroundColor: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* DescriçÍo */}
      {proposta.descricao && (
        <p className={`${TYPOGRAPHY.bodySmall} mb-2 sm:mb-3 line-clamp-2`}>
          {proposta.descricao}
        </p>
      )}

      {/* Data de CriaçÍo */}
      <div className={`${TYPOGRAPHY.cardMeta} mb-2 sm:mb-3`}>
        Criada em: {new Date(proposta.criado_em).toLocaleDateString("pt-BR")}
      </div>

      {/* Valores */}
      <div className="mb-3 sm:mb-4">
        <div className={TYPOGRAPHY.bodySmall}>
          <span className="font-medium">Valor Total:</span>{" "}
          <span className={TYPOGRAPHY.moneySmall}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(proposta.valor_total)}
          </span>
        </div>
        <div className={`${TYPOGRAPHY.cardMeta} mt-1`}>
          {proposta.itens.length} {proposta.itens.length === 1 ? "item" : "itens"}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {/* Visualizar PDF */}
        <button
          onClick={() => onVisualizarPDF(proposta)}
          className="flex-1 px-2 sm:px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-300 transition-colors"
        >
          PDF
        </button>

        {/* Aprovar */}
        {proposta.status !== "aprovada" && proposta.status !== "rejeitada" && (
          <button
            onClick={() => onAprovar(proposta.id)}
            className="flex-1 px-2 sm:px-3 py-2 bg-green-500 text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-green-600 transition-colors"
          >
            Aprovar
          </button>
        )}

        {/* Rejeitar */}
        {proposta.status !== "aprovada" && proposta.status !== "rejeitada" && (
          <button
            onClick={() => onRejeitar(proposta.id)}
            className="flex-1 px-2 sm:px-3 py-2 bg-red-500 text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-red-600 transition-colors"
          >
            Rejeitar
          </button>
        )}

        {/* Gerar Contrato (só se aprovada) */}
        {proposta.status === "aprovada" && (
          <button
            onClick={() => onGerarContrato(proposta.id)}
            className="w-full px-2 sm:px-3 py-2 bg-primary text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-primary/90 transition-colors mt-2"
          >
            Gerar Contrato
          </button>
        )}
      </div>
    </div>
  );
}
