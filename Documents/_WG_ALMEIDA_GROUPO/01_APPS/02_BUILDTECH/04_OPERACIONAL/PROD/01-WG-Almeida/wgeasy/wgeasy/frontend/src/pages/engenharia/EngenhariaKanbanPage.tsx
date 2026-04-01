/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/engenharia/EngenhariaKanbanPage.tsx
// Kanban de Engenharia - Usa contratos_nucleos via jornadaClienteApi
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarCardsNucleo,
  listarStatusKanban,
  moverCardKanban,
  CardNucleo,
  StatusKanbanConfig,
} from "@/lib/jornadaClienteApi";
import KanbanBoard, { KanbanColuna, KanbanCard } from "@/components/kanban/KanbanBoard";
import { HardHat, RefreshCw } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

const EngenhariaKanbanPage = () => {
  const navigate = useNavigate();
  const [colunas, setColunas] = useState<KanbanColuna[]>([]);
  const [statusConfig, setStatusConfig] = useState<StatusKanbanConfig[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarDados() {
    setLoading(true);
    try {
      // Carregar configuraçÍo de status do Kanban
      const config = await listarStatusKanban("engenharia");
      setStatusConfig(config);

      // Carregar cards do núcleo
      const cards = await listarCardsNucleo("engenharia");

      // Montar colunas com cards
      const colunasFormatadas: KanbanColuna[] = config.map((status) => ({
        id: status.codigo,
        titulo: status.titulo,
        cards: cards
          .filter((c) => c.status_kanban === status.codigo)
          .map((c) => cardNucleoParaKanbanCard(c)),
      }));

      setColunas(colunasFormatadas);
    } catch (err) {
      console.error("Erro ao carregar kanban de engenharia:", err);
    } finally {
      setLoading(false);
    }
  }

  // Converter CardNucleo para formato do KanbanCard
  function cardNucleoParaKanbanCard(card: CardNucleo): KanbanCard {
    return {
      id: card.id,
      titulo: card.cliente_nome || card.contrato_numero || "Obra",
      descricao: card.oportunidade_titulo || card.contrato_titulo || undefined,
      valor: card.valor_previsto || undefined,
      cliente_nome: card.cliente_nome || "Cliente nÍo informado",
      status: card.status_kanban,
      progresso: card.progresso,
      unidades_negocio: ["engenharia"],
      // Dados extras
      contrato_id: card.contrato_id,
      oportunidade_id: card.oportunidade_id,
      area_total: card.area_total,
      tipo_projeto: card.tipo_projeto,
      endereco_obra: card.endereco_obra,
      responsavel_nome: card.responsavel_nome,
    } as KanbanCard;
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function moverCard(cardId: string, novaColuna: string) {
    try {
      // Buscar oportunidade_id para registrar na timeline
      const card = colunas
        .flatMap((c) => c.cards)
        .find((c) => c.id === cardId);

      await moverCardKanban(
        cardId,
        novaColuna as any,
        (card as any)?.oportunidade_id
      );
      await carregarDados();
    } catch (err) {
      console.error("Erro ao mover card:", err);
    }
  }

  function abrirDetalhe(card: KanbanCard) {
    // Navegar para detalhe do card do núcleo ou contrato
    if ((card as any).contrato_id) {
      navigate(`/contratos/${(card as any).contrato_id}`);
    } else {
      navigate(`/contratos/${card.id}`);
    }
  }

  if (loading) {
    return (
      <div className={`${LAYOUT.pageContainer} flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:h-8 border-b-2 border-[#3B82F6] mx-auto mb-3 sm:mb-4"></div>
          <p className={TYPOGRAPHY.cardSubtitle}>Carregando obras de engenharia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.pageHeader}>
        <div className={LAYOUT.pageTitleWrapper}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
            <HardHat className={TYPOGRAPHY.iconLarge + " text-[#3B82F6]"} />
          </div>
          <h1 className={TYPOGRAPHY.pageTitle}>
            Kanban Engenharia
          </h1>
        </div>
        <div className={LAYOUT.pageActions}>
          <button
            type="button"
            onClick={carregarDados}
            className="p-2 text-gray-500 hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-all"
            title="Atualizar"
          >
            <RefreshCw className={TYPOGRAPHY.iconMedium} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/contratos/novo")}
            className="px-3 py-1.5 bg-[#2B4580] text-white rounded-lg text-[12px] sm:text-[14px] hover:bg-[#1E3366] transition-all flex items-center gap-1.5"
          >
            + Nova Obra
          </button>
        </div>
      </div>

      {/* Info de contagem */}
      <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-4 text-[11px] sm:text-[12px] text-gray-500">
        <span>{colunas.reduce((acc, c) => acc + c.cards.length, 0)} obras no total</span>
      </div>

      <KanbanBoard
        colunas={colunas}
        onCardClick={abrirDetalhe}
        onMoveCard={moverCard}
      />
    </div>
  );
};

export default EngenhariaKanbanPage;

