import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useNextBestAction } from '@/hooks/useNextBestAction'

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

export default function SmartCTA({ className = '', showSecondary = false }) {
  const action = useNextBestAction()
  const Icon = action.external ? ExternalLink : ArrowRight

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <CTALink
        href={action.href}
        external={action.external}
        className="inline-flex items-center gap-2 rounded-full bg-wg-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wg-orange/90"
      >
        {action.label}
        <Icon className="w-4 h-4" />
      </CTALink>

      {showSecondary && action.secondary && (
        <CTALink
          href={action.secondary.href}
          external={action.secondary.external}
          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm text-black transition-colors hover:bg-black/5"
        >
          {action.secondary.label}
          {action.secondary.external && <ExternalLink className="w-3 h-3 opacity-60" />}
        </CTALink>
      )}
    </div>
  )
}
