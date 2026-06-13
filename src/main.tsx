import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { LandingPage } from './components/LandingPage'
import { useAppStore } from './store'
import './index.css'

function Root() {
  const themeMode = useAppStore(state => state.themeMode)
  const userProfile = useAppStore(state => state.userProfile)
  const authMode = useAppStore(state => state.authMode)
  
  // If they are already authenticated or a guest, default to showing the app
  const [showApp, setShowApp] = useState(authMode !== 'unauthenticated')

  // Automatically return to Landing Page when signed out
  useEffect(() => {
    if (authMode === 'unauthenticated') {
      setShowApp(false)
    }
  }, [authMode])

  useEffect(() => {
    const resolvedTheme = themeMode
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
  }, [themeMode])

  useEffect(() => {
    document.documentElement.setAttribute('data-app-mode', userProfile?.appMode || 'cycle')
  }, [userProfile?.appMode])

  const navigateToApp = () => {
    setShowApp(true)
  }

  if (showApp) {
    return <App onGoHome={() => setShowApp(false)} />
  }

  return <LandingPage onGoToApp={navigateToApp} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
