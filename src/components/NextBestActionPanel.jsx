import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ExternalLink, ArrowRight, Sparkles } from 'lucide-react'
import { useNextBestAction } from '@/hooks/useNextBestAction'
import { useLocation } from 'react-router-dom'

const STAGE_LABELS = {
  exploracao: 'Explorando opções',
  decisao: 'Próximo de decidir',
  acao: 'Pronto para agir',
}

const STAGE_COLOR = {
  exploracao: 'bg-wg-orange/10 text-wg-orange',
  decisao: 'bg-amber-100 text-amber-700',
  acao: 'bg-green-100 text-green-700',
}

// Routes where we hide the panel to avoid double CTA noise
const SUPPRESSED_PATHS = ['/solicite-proposta', '/login', '/register', '/admin', '/moodboard']

function CTALink({ href, external, className, children }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return <Link to={href} className={className}>{children}</Link>
}

export default function NextBestActionPanel() {
  const { href, label, external, secondary, score, stage } = useNextBestAction()
  const location = useLocation()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Reset dismiss when route changes so panel can re-evaluate
  useEffect(() => {
    setDismissed(false)
  }, [location.pathname])

  // Animate in when score crosses threshold
  useEffect(() => {
    if (score >= 40 && !dismissed) {
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
    setVisible(false)
  }, [score, dismissed])

  const suppressed = SUPPRESSED_PATHS.some((p) => location.pathname.startsWith(p))
  if (suppressed || !visible || score < 40) return null

  const Icon = external ? ExternalLink : ArrowRight
  const stageLabel = STAGE_LABELS[stage] || STAGE_LABELS.exploracao
  const stageClass = STAGE_COLOR[stage] || STAGE_COLOR.exploracao

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg
                 bg-white border border-black/10 rounded-[1.6rem] shadow-[0_20px_60px_rgba(30,24,20,0.14)]
                 px-5 py-4 flex items-center gap-4
                 animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="complementary"
      aria-label="Próximo passo recomendado"
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-xl bg-wg-orange/10 text-wg-orange flex items-center justify-center">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${stageClass}`}>
          {stageLabel}
        </span>
        <CTALink
          href={href}
          external={external}
          className="flex items-center gap-1.5 text-sm font-semibold text-wg-black hover:text-wg-orange transition-colors truncate"
        >
          {label}
          <Icon className="w-3.5 h-3.5 shrink-0" />
        </CTALink>
        {secondary && (
          <CTALink
            href={secondary.href}
            external={secondary.external}
            className="text-[11px] text-wg-gray hover:text-wg-orange transition-colors"
          >
            {secondary.label}
          </CTALink>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-black/30 hover:text-black/60 hover:bg-black/5 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
