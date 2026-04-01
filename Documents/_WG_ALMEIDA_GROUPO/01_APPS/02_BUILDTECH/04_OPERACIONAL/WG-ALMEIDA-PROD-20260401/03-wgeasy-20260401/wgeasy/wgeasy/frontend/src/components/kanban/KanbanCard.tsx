// ============================================================
// COMPONENTE: KanbanCard (versÍo PREMIUM WG EASY)
// Sistema WG Almeida — Oportunidades Kanban
// Com ações, avatar corporativo e layout refinado
// ============================================================

import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  FileText,
  MessageCircle,
  Mail,
} from "lucide-react";

import { obterAvatarUrl, gerarCorPorNome } from "@/utils/avatarUtils";
import { formatarMoeda } from "@/utils/formatadores";
import type { UnidadeNegocio } from "@/types/contratos";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface KanbanCardData {
  id: string;
  titulo: string;
  descricao?: string;
  badge?: string;
  valor?: number;
  meta?: string;

  avatar_url?: string;
  avatar?: string;
  responsavel_nome?: string;
  responsavel_funcao?: string;

  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;

  unidades_negocio?: UnidadeNegocio[];

  total_checklist?: number;
  checklist_concluidos?: number;
  progresso?: number; // 0-100 (usado quando não tem checklist)

  total_anexos?: number;
  total_comentarios?: number;
  tem_contratos?: boolean;

  // Dados extras do projeto (opcionais)
  area_total?: number;
  tipo_projeto?: string;
  endereco_obra?: string;
  status?: string;
  contrato_id?: string;
  oportunidade_id?: string;
}

interface KanbanCardProps {
  card: KanbanCardData;
  onClick?: () => void;

  onEdit?: (card: KanbanCardData) => void;
  onDelete?: (card: KanbanCardData) => void;
  onPdf?: (card: KanbanCardData) => void;

  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  draggable?: boolean;
}

const UNIDADE_COLORS: Record<UnidadeNegocio, string> = {
  arquitetura: "#5E9B94", // Verde Mineral
  engenharia: "#2B4580", // Azul Técnico
  marcenaria: "#8B5E3C", // Marrom Carvalho
  moma_engenharia: "#2B4580",
  moma_planejados: "#5E9B94",
};

const UNIDADE_LABELS: Record<UnidadeNegocio, string> = {
  arquitetura: "ARQ",
  engenharia: "ENG",
  marcenaria: "MAR",
  moma_engenharia: "MOMA ENG",
  moma_planejados: "MOMA PLAN",
};

const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  onClick,
  onEdit,
  onDelete,
  onPdf,
  onDragStart,
  draggable = true,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calcula progresso: prioriza checklist, senão usa progresso direto
  const percentualChecklist =
    card.total_checklist && card.total_checklist > 0
      ? Math.round((card.checklist_concluidos || 0) / card.total_checklist * 100)
      : (card.progresso || 0);

  const temProgresso = (card.total_checklist && card.total_checklist > 0) || (card.progresso && card.progresso > 0);

  // Avatar do responsável (ou cliente)
  const avatarUrl = obterAvatarUrl(
    card.responsavel_nome || card.cliente_nome || "",
    card.avatar_url,
    undefined,
    card.avatar,
    gerarCorPorNome(card.responsavel_nome || card.cliente_nome || "")
  );

  const whatsapp = card.cliente_telefone
    ? "https://wa.me/55" + card.cliente_telefone.replace(/\D/g, "")
    : null;

  const email = card.cliente_email ? `mailto:${card.cliente_email}` : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(card);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-white p-3 shadow-sm border border-gray-200 hover:border-[#F25C26] hover:shadow-md transition-all"
    >
      {/* ===== TOPO (Avatar + Unidades + Ações) ===== */}
      <div className="flex items-start justify-between mb-2">
        
        {/* Avatar + Nome */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={avatarUrl}
            alt={card.responsavel_nome}
            className="w-8 h-8 rounded-full object-cover border"
          />

          <div className="flex flex-col min-w-0">
            {card.responsavel_nome && (
              <span className="text-[11px] font-normal text-gray-700 truncate">
                {card.responsavel_nome}
              </span>
            )}
            {card.responsavel_funcao && (
              <span className="text-[10px] text-gray-500 truncate">
                {card.responsavel_funcao}
              </span>
            )}
          </div>
        </div>

        {/* Unidades + Ações */}
        <div
          className="flex flex-col items-end gap-1"
          onClick={(e) => e.stopPropagation()} // evita abrir card ao clicar nas ações
        >
          {/* TAGS de Unidade */}
          {card.unidades_negocio && card.unidades_negocio.length > 0 && (
            <div className="flex gap-1 mb-1">
              {card.unidades_negocio.map((u) => (
                <span
                  key={u}
                  className="px-2 py-0.5 rounded text-[9px] font-normal text-white"
                  style={{ backgroundColor: UNIDADE_COLORS[u] }}
                >
                  {UNIDADE_LABELS[u]}
                </span>
              ))}
            </div>
          )}

          {/* AÇÕES */}
          <div className="flex gap-1">

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(card)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            )}

            {onPdf && (
              <button
                type="button"
                onClick={() => onPdf(card)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                title="Gerar PDF"
              >
                <FileText size={14} />
              </button>
            )}

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-green-50 text-green-600"
                title="WhatsApp"
              >
                <MessageCircle size={14} />
              </a>
            )}

            {email && (
              <a
                href={email}
                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                title="Email"
              >
                <Mail size={14} />
              </a>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-1.5 rounded-md hover:bg-red-50 text-red-600"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== TÍTULO ===== */}
      <div className="text-[20px] font-normal text-[#2E2E2E] mb-1 line-clamp-2">
        {card.titulo}
      </div>

      {/* ===== DESCRIÇÍO / CLIENTE ===== */}
      {card.descricao && (
        <div className="text-xs text-gray-500 line-clamp-1 mb-2">
          {card.descricao}
        </div>
      )}

      {/* ===== INFO DO PROJETO (área, tipo) ===== */}
      {(card.area_total || card.tipo_projeto) && (
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
          {card.tipo_projeto && (
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{card.tipo_projeto}</span>
          )}
          {card.area_total && (
            <span>{card.area_total}m²</span>
          )}
        </div>
      )}

      {/* ===== PROGRESSO (Checklist ou Progresso Direto) ===== */}
      {temProgresso && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>
              {card.total_checklist && card.total_checklist > 0
                ? `Checklist: ${card.checklist_concluidos}/${card.total_checklist}`
                : "Progresso"
              }
            </span>
            <span>{percentualChecklist}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F25C26] to-[#e04a1a]"
              style={{ width: `${percentualChecklist}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== INDICADORES ===== */}
      <div className="flex items-center gap-3 text-[10px] mb-2 text-gray-600">

        {(card.total_anexos ?? 0) > 0 && (
          <span>📎 {card.total_anexos}</span>
        )}

        {(card.total_comentarios ?? 0) > 0 && (
          <span>💬 {card.total_comentarios}</span>
        )}

        {card.tem_contratos && (
          <span className="text-green-600 font-normal">✓ Contrato</span>
        )}
      </div>

      {/* ===== VALOR ===== */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-500">{card.badge}</span>

        {card.valor != null && (
          <span className="font-normal text-[#F25C26]">
            {formatarMoeda(card.valor)}
          </span>
        )}
      </div>

      {/* ===== META / DATA ===== */}
      {card.meta && (
        <div className="mt-1 text-[10px] text-gray-400">{card.meta}</div>
      )}

      {/* ===== MODAL DE CONFIRMAÇÍO ===== */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remover Card deste Núcleo?"
        message={`Deseja remover "${card.titulo}" deste núcleo? O card continuará disponível nos outros núcleos.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        type="warning"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default KanbanCard;



