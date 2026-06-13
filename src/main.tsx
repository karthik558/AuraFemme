import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { LandingPage } from './components/LandingPage'
import { ToastContainer } from './components/ToastContainer'
import { useAppStore } from './store'
import './index.css'

function Root() {
  const themeMode = useAppStore(state => state.themeMode)
  const userProfile = useAppStore(state => state.userProfile)
  const authMode = useAppStore(state => state.authMode)
  
  // If they are already authenticated or a guest, default to showing the app
  const [showApp, setShowApp] = useState(authMode !== 'unauthenticated')

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
    return (
      <>
        <App onGoHome={() => setShowApp(false)} />
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <LandingPage onGoToApp={navigateToApp} />
      <ToastContainer />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
