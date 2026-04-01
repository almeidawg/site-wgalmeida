/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/marcenaria/MarcenariaKanbanPage.tsx
// Kanban de Marcenaria - Usa contratos_nucleos via jornadaClienteApi
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  listarCardsNucleo,
  listarStatusKanban,
  moverCardKanban,
  CardNucleo,
  StatusKanbanConfig,
} from "@/lib/jornadaClienteApi";
import KanbanBoard, { KanbanColuna, KanbanCard } from "@/components/kanban/KanbanBoard";
import { Hammer, RefreshCw } from "lucide-react";

const MarcenariaKanbanPage = () => {
  const navigate = useNavigate();
  const [colunas, setColunas] = useState<KanbanColuna[]>([]);
  const [statusConfig, setStatusConfig] = useState<StatusKanbanConfig[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarDados() {
    setLoading(true);
    try {
      // Carregar configuraçÍo de status do Kanban
      const config = await listarStatusKanban("marcenaria");
      setStatusConfig(config);

      // Carregar cards do núcleo
      const cards = await listarCardsNucleo("marcenaria");

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
      console.error("Erro ao carregar kanban de marcenaria:", err);
    } finally {
      setLoading(false);
    }
  }

  // Converter CardNucleo para formato do KanbanCard
  function cardNucleoParaKanbanCard(card: CardNucleo): KanbanCard {
    return {
      id: card.id,
      titulo: card.cliente_nome || card.contrato_numero || "Projeto",
      descricao: card.oportunidade_titulo || card.contrato_titulo || undefined,
      valor: card.valor_previsto || undefined,
      cliente_nome: card.cliente_nome || "Cliente nÍo informado",
      status: card.status_kanban,
      progresso: card.progresso,
      unidades_negocio: ["marcenaria"],
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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5E3C] mx-auto mb-4"></div>
          <p className="text-[16px] text-gray-600">Carregando projetos de marcenaria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#8B5E3C]/10 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-[#8B5E3C]" />
          </div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#8B5E3C]">
            Kanban Marcenaria
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregarDados}
            className="p-2 text-gray-500 hover:text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-lg transition-all"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/contratos/novo")}
            className="px-4 py-2 bg-[#8B5E3C] text-white rounded-lg text-[14px] hover:bg-[#6B4A2E] transition-all shadow-sm hover:shadow-md"
          >
            + Novo Projeto
          </button>
        </div>
      </div>

      {/* Info de contagem */}
      <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
        <span>{colunas.reduce((acc, c) => acc + c.cards.length, 0)} projetos no total</span>
      </div>

      <KanbanBoard
        colunas={colunas}
        onCardClick={abrirDetalhe}
        onMoveCard={moverCard}
      />
    </div>
  );
};

export default MarcenariaKanbanPage;

