import React, { useState } from "react";
import {
  gerarAvatarUrl,
  gerarCorPorNome,
  gerarIniciais,
  obterAvatarUrl,
} from "@/utils/avatarUtils";

// Tamanhos padronizados do sistema WG
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  "2xl": 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
  "2xl": "text-3xl",
};

const NUCLEO_BG_MAP: Record<string, string> = {
  arquitetura: "#5E9B94",
  engenharia: "#2B4580",
  marcenaria: "#8B5E3C",
};

interface AvatarProps {
  nome: string;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
  size?: number | AvatarSize; // px ou tamanho padronizado
  tamanho?: number; // alias para compatibilidade (deprecated)
  className?: string;
  onClick?: () => void;
  bordered?: boolean; // Adiciona borda branca
  shadow?: boolean | "md"; // Adiciona sombra
  clickable?: boolean; // Adiciona efeito hover
}

const Avatar: React.FC<AvatarProps> = ({
  nome,
  avatar_url,
  foto_url,
  avatar,
  size,
  tamanho,
  className = "",
  onClick,
  bordered = false,
  shadow = false,
  clickable,
}) => {
  const [imageError, setImageError] = useState(false);

  // Determinar tamanho final
  let finalSize: number;
  let sizeClass = "";

  if (typeof size === "string" && size in SIZE_MAP) {
    finalSize = SIZE_MAP[size as AvatarSize];
    sizeClass = `wg-avatar-${size}`;
  } else {
    finalSize = (size as number) ?? tamanho ?? 40;
  }

  const hasImage = !!(avatar_url || foto_url || avatar);
  const isClickable = clickable ?? !!onClick;

  if (!nome) nome = "Sem Nome";

  // Classes base do WG Avatar
  const baseClasses = [
    "wg-avatar",
    sizeClass,
    bordered && "wg-avatar-bordered",
    shadow === true && "wg-avatar-shadow",
    shadow === "md" && "wg-avatar-shadow-md",
    isClickable && "wg-avatar-clickable",
    className,
  ].filter(Boolean).join(" ");

  // Se não houver imagem ou se houve erro ao carregar, geramos iniciais com cor WG
  if (!hasImage || imageError) {
    const nomeNormalizado = (nome || "").trim().toLowerCase();
    const bg = NUCLEO_BG_MAP[nomeNormalizado] ?? ("#" + gerarCorPorNome(nome));
    const iniciais = gerarIniciais(nome);
    const fontSize = typeof size === "string" ? FONT_SIZE_MAP[size as AvatarSize] : "text-xs";
    const ehNumero = /^\d+$/.test(iniciais);

    return (
      <div
        onClick={onClick}
        style={{
          width: finalSize,
          height: finalSize,
          minWidth: finalSize,
          backgroundColor: bg,
          ...(ehNumero ? { fontSize: "calc(1em - 1px)" } : {}),
        }}
        className={`${baseClasses} wg-avatar-fallback ${fontSize} font-normal text-white select-none`}
        tabIndex={isClickable ? 0 : undefined}
      >
        {iniciais}
      </div>
    );
  }

  const url = obterAvatarUrl(nome, avatar_url, foto_url, avatar);

  // Handler de erro melhorado
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`[Avatar] Erro ao carregar imagem para ${nome}:`, {
      avatar_url,
      foto_url,
      avatar: avatar?.substring(0, 50),
      url,
      error: e
    });
    setImageError(true);
  };

  return (
    <img
      src={url || gerarAvatarUrl(nome)}
      alt={nome}
      onClick={onClick}
      onError={handleImageError}
      style={{
        width: finalSize,
        height: finalSize,
        minWidth: finalSize,
      }}
      className={baseClasses}
      tabIndex={isClickable ? 0 : undefined}
    />
  );
};

export default Avatar;


