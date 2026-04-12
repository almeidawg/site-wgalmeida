const canUseWindow = () => typeof window !== 'undefined'

export function pushDataLayerEvent(eventName, payload = {}) {
  if (!canUseWindow()) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: eventName,
    ...payload,
  })
}

export function trackCtaClick({
  ctaId,
  ctaLabel,
  ctaContext,
  ctaDestination,
}) {
  pushDataLayerEvent('cta_click', {
    cta_id: ctaId || 'unknown_cta',
    cta_label: ctaLabel || 'unknown_label',
    cta_context: ctaContext || 'unknown_context',
    cta_destination: ctaDestination || '',
    page_path: canUseWindow() ? window.location.pathname : '',
  })
}
