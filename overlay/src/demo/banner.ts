export function installDemoBanner(): void {
  const banner = document.createElement('div')
  banner.setAttribute('role', 'note')
  banner.setAttribute('aria-label', 'This is a static demo with fake data')
  banner.textContent = 'Demo · dati finti, nessuna connessione reale'

  Object.assign(banner.style, {
    position: 'fixed',
    left: '16px',
    bottom: '16px',
    zIndex: '2147483647',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.92)',
    color: '#ffffff',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.01em',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28)',
    pointerEvents: 'none',
    userSelect: 'none',
  })

  document.body.appendChild(banner)
}
