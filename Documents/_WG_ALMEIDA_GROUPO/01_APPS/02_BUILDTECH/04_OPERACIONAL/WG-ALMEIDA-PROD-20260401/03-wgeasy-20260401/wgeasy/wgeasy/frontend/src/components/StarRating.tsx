import WGStarIcon from "@/components/icons/WGStarIcon";
// ============================================================
// COMPONENTE: WGStarIcon Rating (AvaliaçÍo em Estrelas)
// Sistema WG Easy - ExibiçÍo de avaliações de produtos
// ============================================================



interface StarRatingProps {
  /** Nota média (0-5) */
  rating: number;
  /** Total de avaliações (opcional) */
  totalReviews?: number;
  /** Tamanho das estrelas */
  size?: "sm" | "md" | "lg";
  /** Mostrar texto da nota ao lado */
  showRatingText?: boolean;
}

export default function StarRating({
  rating,
  totalReviews,
  size = "md",
  showRatingText = true,
}: StarRatingProps) {
  // Arredondar rating para 1 casa decimal
  const roundedRating = Math.round(rating * 10) / 10;

  // Calcular quantas estrelas cheias, metade e vazias
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 >= 0.3 && roundedRating % 1 < 0.8;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Tamanhos
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSize = sizes[size];
  const textSize = textSizes[size];

  // Se rating for 0 ou inválido, não renderizar
  if (!rating || rating <= 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Estrelas */}
      <div className="flex items-center gap-0.5">
        {/* Estrelas cheias */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <WGStarIcon
            key={`full-${i}`}
            className={`${iconSize} fill-yellow-400 text-yellow-400`}
          />
        ))}

        {/* Meia estrela */}
        {hasHalfStar && (
          <div className="relative">
            <WGStarIcon className={`${iconSize} text-yellow-400`} />
            <WGStarIcon
              className={`${iconSize} fill-yellow-400 text-yellow-400 absolute top-0 left-0`}
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>
        )}

        {/* Estrelas vazias */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <WGStarIcon
            key={`empty-${i}`}
            className={`${iconSize} text-gray-300`}
          />
        ))}
      </div>

      {/* Texto da nota */}
      {showRatingText && (
        <div className={`${textSize} text-gray-700 font-medium flex items-center gap-1`}>
          <span>{roundedRating.toFixed(1)}</span>
          {totalReviews !== undefined && totalReviews > 0 && (
            <span className="text-gray-500 font-normal">
              ({totalReviews.toLocaleString("pt-BR")})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente compacto de estrelas (apenas ícones, sem texto)
 */
export function StarRatingCompact({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  return <StarRating rating={rating} size={size} showRatingText={false} />;
}

/**
 * Componente de badge de avaliaçÍo (com background)
 */
export function StarRatingBadge({ rating, totalReviews }: { rating: number; totalReviews?: number }) {
  if (!rating || rating <= 0) return null;

  const roundedRating = Math.round(rating * 10) / 10;

  return (
    <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1">
      <WGStarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-normal text-gray-700">
        {roundedRating.toFixed(1)}
      </span>
      {totalReviews !== undefined && totalReviews > 0 && (
        <span className="text-xs text-gray-500">
          ({totalReviews.toLocaleString("pt-BR")})
        </span>
      )}
    </div>
  );
}


