import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { LandingPage } from './components/LandingPage'
import './index.css'

function Root() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToApp = () => {
    window.history.pushState({}, '', '/app')
    setPath('/app')
  }

  // If we're on /app, render the main App
  if (path === '/app') {
    return <App />
  }

  // Otherwise, render the LandingPage
  return <LandingPage onGoToApp={navigateToApp} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
