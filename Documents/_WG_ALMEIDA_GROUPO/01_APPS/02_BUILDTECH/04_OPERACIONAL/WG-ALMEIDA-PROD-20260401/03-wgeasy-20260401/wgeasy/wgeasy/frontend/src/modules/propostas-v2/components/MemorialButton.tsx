// ============================================================
// Memorial Button - BotÍo de Acesso Rápido para Memorial
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import MemorialUploadModal from "./MemorialUploadModal";

interface MemorialButtonProps {
  onMemorialImported?: (propostaId: string) => void;
}

export default function MemorialButton({ onMemorialImported }: MemorialButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleMemorialProcessado = async (memorialId: string) => {
    console.log("Memorial processado:", memorialId);

    // Fechar modal
    setShowModal(false);

    // TODO: Navegar para revisÍo de matching
    // ou chamar callback se fornecido
    if (onMemorialImported) {
      onMemorialImported(memorialId);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F25C26] to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
      >
        <FileText className="w-5 h-5" />
        <span>Importar Memorial</span>
        <Sparkles className="w-4 h-4" />
      </button>

      <MemorialUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onMemorialProcessado={handleMemorialProcessado}
      />
    </>
  );
}

