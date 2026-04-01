// ============================================================
// COMPONENTE: CriarPropostaButton
// BotÍo para criar proposta a partir de oportunidade
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useNavigate } from "react-router-dom";
import { FileEdit } from "lucide-react";

interface CriarPropostaButtonProps {
  oportunidadeId?: string;
  clienteId?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function CriarPropostaButton({
  oportunidadeId,
  clienteId,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
}: CriarPropostaButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Construir URL com query params para pré-preencher proposta
    const params = new URLSearchParams();
    if (oportunidadeId) params.append("oportunidade_id", oportunidadeId);
    if (clienteId) params.append("cliente_id", clienteId);

    const url = params.toString()
      ? `/propostas/nova?${params.toString()}`
      : "/propostas/nova";

    navigate(url);
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outline: "bg-white text-[#F25C26] border-2 border-[#F25C26] hover:bg-orange-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        font-medium rounded-lg
        flex items-center justify-center gap-2
        transition-all duration-200
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      <FileEdit size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
      <span>Criar Proposta</span>
    </button>
  );
}

