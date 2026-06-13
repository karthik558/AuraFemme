import { useRef } from 'react'
import { Home, Heart } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAppStore } from '../store'
import auraLogo from '../assets/icon-color.png'
import pregnancyLogo from '../assets/icon-color-purple.png'
import './NotFound.css'

interface NotFoundProps {
  onGoHome?: () => void
}

export function NotFound({ onGoHome }: NotFoundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const store = useAppStore()
  const themeMode = store.themeMode
  const userProfile = store.userProfile
  const appMode = userProfile?.appMode || 'cycle'

  const isPregnancy = appMode === 'pregnancy'
  const logo = isPregnancy ? pregnancyLogo : auraLogo

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.fromTo('.nf-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
  }, { scope: containerRef, dependencies: [themeMode, appMode] })

  const handleGoHome = () => {
    if (window.history && window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/')
    }
    onGoHome?.()
    setTimeout(() => { window.location.href = '/' }, 30)
  }

  return (
    <div ref={containerRef} className="app-wrapper nf-wrapper">
      <div className="app-bg-glow" />

      <div className="app-container nf-container">
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', width: '100%' }}>
          <div className="glass-card nf-card" style={{ maxWidth: '520px', width: '100%', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            
            <img src={logo} alt="Aura Femme" style={{ width: '90px', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(197,34,51,0.2))' }} />

            <h1 className="nf-number" style={{ fontSize: '6rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, var(--accent-primary), var(--text-strong))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 0.9 }}>404</h1>
            
            <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-strong)', margin: 0 }}>Pathway Not Found</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '320px' }}>
                The specified clinical coordinate does not exist in the current cycle model.
              </p>
              
              <div style={{ background: 'var(--bg-inset)', padding: '0.85rem 1.5rem', borderRadius: '2rem', border: '1px solid var(--border-subtle)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-main)', maxWidth: '380px', lineHeight: 1.5 }}>
                "Clinical target lost. We've navigated completely off the biological map."
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleGoHome} style={{ marginTop: '0.5rem', padding: '0.8rem 2rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
              <Home size={18} /> Return to Baseline
            </button>
          </div>
        </div>

        <footer className="app-footer">
          <p className="footer-text">
            Designed & Developed with <Heart size={14} fill="currentColor" className="footer-heart" /> by <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="footer-link">Karthik Lal</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
