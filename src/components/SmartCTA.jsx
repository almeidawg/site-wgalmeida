import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useNextBestAction } from '@/hooks/useNextBestAction'

export default function SmartCTA({ className = '', showSecondary = false }) {
  const action = useNextBestAction()

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <Link
        to={action.href}
        className="inline-flex items-center gap-2 rounded-full bg-wg-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wg-orange/90"
      >
        {action.label}
        <ArrowRight className="w-4 h-4" />
      </Link>

      {showSecondary && action.secondary && (
        <Link
          to={action.secondary.href}
          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm text-black transition-colors hover:bg-black/5"
        >
          {action.secondary.label}
        </Link>
      )}
    </div>
  )
}
