// src/components/common/ActionButtons.tsx
import React, { ReactNode, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface ActionButtonsProps {
  onView?: () => void;
  onPDF?: () => void;
  onEmail?: () => void;
  onWhats?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  confirmDelete?: boolean;
  deleteTitle?: string;
  deleteMessage?: string;
  extraButtons?: ReactNode;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onPDF,
  onEmail,
  onWhats,
  onEdit,
  onDelete,
  onShare,
  onDuplicate,
  confirmDelete = true,
  deleteTitle = "Confirmar ExclusÍo",
  deleteMessage = "Tem certeza que deseja excluir este item? Esta açÍo não pode ser desfeita.",
  extraButtons,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      setShowDeleteConfirm(true);
    } else {
      onDelete?.();
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {onView && (
        <button
          onClick={onView}
          className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1 hover:bg-[#F5F5F5]"
        >
          👁 Visualizar
        </button>
      )}
      {onPDF && (
        <button
          onClick={onPDF}
          className="rounded-full bg-[#2E2E2E] px-3 py-1 text-white hover:bg-black"
        >
          📄 PDF
        </button>
      )}
      {onEmail && (
        <button
          onClick={onEmail}
          className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1 hover:bg-[#F5F5F5]"
        >
          ✉ E-mail
        </button>
      )}
      {onWhats && (
        <button
          onClick={onWhats}
          className="rounded-full bg-[#25D366] px-3 py-1 text-white hover:bg-[#1EBE59]"
        >
          📱 WhatsApp
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1 hover:bg-[#F5F5F5]"
        >
          ✏ Editar
        </button>
      )}
      {onShare && (
        <button
          onClick={onShare}
          className="rounded-full border border-blue-300 bg-blue-50 text-blue-700 px-3 py-1 hover:bg-blue-100"
        >
          🔗 Compartilhar
        </button>
      )}
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="rounded-full border border-gray-300 bg-gray-50 text-gray-700 px-3 py-1 hover:bg-gray-100"
        >
          📋 Duplicar
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="rounded-full border border-red-300 bg-red-50 text-red-700 px-3 py-1 hover:bg-red-100"
        >
          🗑 Excluir
        </button>
      )}
      {extraButtons}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={deleteTitle}
        message={deleteMessage}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </div>
  );
};

export default ActionButtons;

