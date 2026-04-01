/**
 * ============================================================
 * CARD PREMIUM - COMPONENTE REUTILIZÁVEL
 * Sistema WG Easy - Grupo WG Almeida
 * ============================================================
 *
 * Card estilo "premium" com gradiente, visual moderno e barra de progresso.
 * Baseado no design de cartões de crédito.
 *
 * USO:
 * - Cartões de Crédito
 * - Metas Financeiras
 * - Projetos/Obras
 * - Indicadores de Performance
 * - Assinaturas/Planos
 * - Investimentos
 */

import type { ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';

type LucideIcon = ComponentType<{ className?: string }>;

// Paleta de cores premium para cards
export const CORES_PREMIUM = [
  { value: '#1A1A2E', label: 'Preto Premium', gradient: 'from-[#1A1A2E] to-[#16213E]' },
  { value: '#16213E', label: 'Azul Noite', gradient: 'from-[#16213E] to-[#0F3460]' },
  { value: '#0F3460', label: 'Azul Profundo', gradient: 'from-[#0F3460] to-[#1A1A2E]' },
  { value: '#533483', label: 'Roxo Royal', gradient: 'from-[#533483] to-[#1A1A2E]' },
  { value: '#E94560', label: 'Vermelho Intense', gradient: 'from-[#E94560] to-[#533483]' },
  { value: '#F25C26', label: 'Laranja WG', gradient: 'from-[#F25C26] to-[#E94560]' },
  { value: '#22C55E', label: 'Verde Sucesso', gradient: 'from-[#22C55E] to-[#16213E]' },
  { value: '#3B82F6', label: 'Azul Céu', gradient: 'from-[#3B82F6] to-[#1A1A2E]' },
  { value: '#8B5CF6', label: 'Violeta', gradient: 'from-[#8B5CF6] to-[#533483]' },
  { value: '#EC4899', label: 'Pink', gradient: 'from-[#EC4899] to-[#8B5CF6]' },
  { value: '#EAB308', label: 'Dourado', gradient: 'from-[#EAB308] to-[#F25C26]' },
  { value: '#6B7280', label: 'Cinza Elegante', gradient: 'from-[#6B7280] to-[#1A1A2E]' },
];

interface CardPremiumProps {
  // Dados principais
  titulo: string;
  subtitulo?: string;
  badge?: string;
  badgeSecundario?: string;

  // Valores/Métricas
  valorPrincipal?: string | number;
  labelValorPrincipal?: string;
  valorSecundario?: string | number;
  labelValorSecundario?: string;

  // Barra de progresso
  progresso?: number; // 0-100
  progressoLabel?: string;
  progressoSubLabel?: string;

  // Visual
  cor?: string;
  icone?: LucideIcon;

  // Rodapé
  infoRodape?: ReactNode;
  acoes?: ReactNode;

  // AnimaçÍo
  delay?: number;

  // Clique
  onClick?: () => void;
}

export function CardPremium({
  titulo,
  subtitulo,
  badge,
  badgeSecundario,
  valorPrincipal,
  labelValorPrincipal,
  valorSecundario,
  labelValorSecundario,
  progresso,
  progressoLabel,
  progressoSubLabel,
  cor = '#1A1A2E',
  icone: Icone,
  infoRodape,
  acoes,
  delay = 0,
  onClick,
}: CardPremiumProps) {
  // Determinar cor da barra de progresso
  const getProgressoColor = (valor: number) => {
    if (valor > 80) return 'bg-red-400';
    if (valor > 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
      className={`relative overflow-hidden rounded-xl shadow-lg ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      style={{ backgroundColor: cor }}
      onClick={onClick}
    >
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Conteúdo */}
      <div className="p-5 text-white min-h-[200px] flex flex-col justify-between relative z-10">

        {/* TOPO: Título + Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icone && (
              <div className="p-2 bg-white/10 rounded-lg">
                <Icone className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs opacity-70">{subtitulo}</p>
              <h3 className="font-normal text-lg leading-tight">{titulo}</h3>
            </div>
          </div>
          <div className="text-right">
            {badge && (
              <span className="text-xs uppercase tracking-wider opacity-70">{badge}</span>
            )}
            {badgeSecundario && (
              <p className="text-[10px] opacity-50 mt-0.5">{badgeSecundario}</p>
            )}
          </div>
        </div>

        {/* MEIO: Valores + Progresso */}
        <div className="my-4 space-y-3">
          {/* Valor Principal */}
          {valorPrincipal !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs opacity-70">{labelValorPrincipal}</span>
              <span className="font-normal text-xl">{valorPrincipal}</span>
            </div>
          )}

          {/* Barra de Progresso */}
          {progresso !== undefined && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progresso, 100)}%` }}
                  transition={{ duration: 0.8, delay: delay * 0.05 + 0.2 }}
                  className={`h-full rounded-full ${getProgressoColor(progresso)}`}
                />
              </div>

              {/* Labels do Progresso */}
              {(progressoLabel || progressoSubLabel) && (
                <div className="flex justify-between text-xs opacity-70">
                  <span>{progressoLabel}</span>
                  <span>{progressoSubLabel}</span>
                </div>
              )}
            </>
          )}

          {/* Valor Secundário (se não tem progresso) */}
          {valorSecundario !== undefined && progresso === undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs opacity-70">{labelValorSecundario}</span>
              <span className="font-normal">{valorSecundario}</span>
            </div>
          )}
        </div>

        {/* RODAPÉ: Info + Ações */}
        <div className="flex items-end justify-between">
          <div className="flex-1 text-xs opacity-70">
            {infoRodape}
          </div>

          {acoes && (
            <div className="flex items-center gap-1">
              {acoes}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * BotÍo de açÍo para usar dentro do CardPremium
 */
interface CardPremiumActionProps {
  icon: LucideIcon;
  onClick: () => void;
  title?: string;
}

export function CardPremiumAction({ icon: Icon, onClick, title }: CardPremiumActionProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/**
 * Seletor de cores premium para formulários
 */
interface ColorPickerPremiumProps {
  value: string;
  onChange: (cor: string) => void;
}

export function ColorPickerPremium({ value, onChange }: ColorPickerPremiumProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CORES_PREMIUM.map(cor => (
        <button
          key={cor.value}
          type="button"
          onClick={() => onChange(cor.value)}
          className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
            value === cor.value
              ? 'border-[#F25C26] ring-2 ring-offset-2 ring-[#F25C26]'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: cor.value }}
          title={cor.label}
        />
      ))}
    </div>
  );
}

/**
 * ============================================================
 * EXEMPLOS DE USO
 * ============================================================
 *
 * 1. CARTÍO DE CRÉDITO:
 * <CardPremium
 *   titulo="Nubank Ultravioleta"
 *   subtitulo="Nubank"
 *   badge="Mastercard"
 *   valorPrincipal="R$ 1.500,00"
 *   labelValorPrincipal="Fatura Atual"
 *   progresso={45}
 *   progressoLabel="Disponível: R$ 3.500"
 *   progressoSubLabel="Limite: R$ 5.000"
 *   cor="#533483"
 *   infoRodape={<span>Venc. dia 10</span>}
 *   acoes={<><CardPremiumAction icon={Edit} onClick={...} /></>}
 * />
 *
 * 2. META FINANCEIRA:
 * <CardPremium
 *   titulo="Viagem Europa"
 *   subtitulo="Meta de Economia"
 *   valorPrincipal="R$ 8.500,00"
 *   labelValorPrincipal="Economizado"
 *   progresso={68}
 *   progressoLabel="68% concluído"
 *   progressoSubLabel="Meta: R$ 12.500"
 *   cor="#22C55E"
 *   icone={Target}
 * />
 *
 * 3. PROJETO/OBRA:
 * <CardPremium
 *   titulo="Apt. 1402 - Torre Sul"
 *   subtitulo="Cliente: JoÍo Silva"
 *   badge="Arquitetura"
 *   valorPrincipal="R$ 450.000"
 *   labelValorPrincipal="Valor Total"
 *   progresso={35}
 *   progressoLabel="35% executado"
 *   cor="#5E9B94"
 *   icone={Building2}
 *   infoRodape={<span>Prazo: 120 dias</span>}
 * />
 *
 * 4. INVESTIMENTO:
 * <CardPremium
 *   titulo="Tesouro Selic 2029"
 *   subtitulo="Renda Fixa"
 *   badge="+12,5%"
 *   valorPrincipal="R$ 25.000,00"
 *   labelValorPrincipal="Valor Investido"
 *   valorSecundario="R$ 28.125,00"
 *   labelValorSecundario="Valor Atual"
 *   cor="#EAB308"
 *   icone={TrendingUp}
 * />
 */


