import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { LandingPage } from './components/LandingPage'
import { NotFound } from './components/NotFound'
import { ToastContainer } from './components/ToastContainer'
import { useAppStore } from './store'
import './index.css'

function Root() {
  const themeMode = useAppStore(state => state.themeMode)
  const userProfile = useAppStore(state => state.userProfile)
  const authMode = useAppStore(state => state.authMode)
  
  // If they are already authenticated or a guest, default to showing the app
  const [showApp, setShowApp] = useState(authMode !== 'unauthenticated')
  const [showNotFound, setShowNotFound] = useState(false)

  useEffect(() => {
    const resolvedTheme = themeMode
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
  }, [themeMode])

  useEffect(() => {
    document.documentElement.setAttribute('data-app-mode', userProfile?.appMode || 'cycle')
  }, [userProfile?.appMode])

  // Detect client-side 404 situations (direct access to unknown paths in SPA)
  useEffect(() => {
    const path = window.location.pathname
    const search = window.location.search
    const isRoot = path === '/' || path === '' || path === '/index.html'
    // Allow clean root, allow query/hash on root, treat anything else as potential 404
    const looksLike404 = !isRoot && 
      !path.startsWith('/?') && 
      !path.match(/^\/(#|$)/) &&
      path.length > 1

    // Easy testing in dev: /?404 or /foo?test
    const force404 = search.includes('404') || search.includes('nf=1') || search.includes('notfound')

    if (looksLike404 || force404) {
      // Keep the bad path visible in address bar until user acts
      setShowNotFound(true)
    }
  }, [])

  const navigateToApp = () => {
    setShowApp(true)
    setShowNotFound(false)
  }

  const handleNotFoundGoHome = () => {
    setShowNotFound(false)
    setShowApp(false)
    // Clean path
    if (window.history && window.location.pathname !== '/') {
      window.history.replaceState({}, document.title, '/')
    }
  }

  if (showNotFound) {
    return (
      <>
        <NotFound onGoHome={handleNotFoundGoHome} />
        <ToastContainer />
      </>
    )
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
