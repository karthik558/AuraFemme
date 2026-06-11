import auraLogo from './assets/icon-color.png'
import faviconGradient from './assets/favicon-gradient.png'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  LogOut,
  MoonStar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Target,
  FileText,
  BookOpen,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CalendarGrid } from './components/CalendarGrid'
import { SafetyAnalyzer } from './components/SafetyAnalyzer'
import { ReportExport } from './components/ReportExport'
import { KnowledgeBase } from './components/KnowledgeBase'
import { DateTriplet } from './components/DateTriplet'
import { DailyLogEditor } from './components/DailyLogEditor'
import { HistoryDashboard } from './components/HistoryDashboard'
import { PersonalDashboard } from './components/PersonalDashboard'
import { OnboardingModal } from './components/OnboardingModal'
import { LoginScreen } from './components/LoginScreen'
import {
  addUtcDays,
  buildCalendarDays,
  buildCycleMetrics,
  clampNumber,
  formatUtcDateLabel,
  utcTodayIso,
} from './utils/calculator'
import type { CaseStudyResult, CycleDayInfo, CycleGoal, CycleInput, ThemeMode, DailyLog, UserProfile } from './types'
import './App.css'

type TabKey = 'overview' | 'calendar' | 'safety' | 'reports' | 'history' | 'reference'

const tabCopy: Record<TabKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Clinical dashboard',
    subtitle: 'Cycle intelligence, advisory signals, and the live metric stack.',
  },
  calendar: {
    title: 'Calendar terminal',
    subtitle: 'Detailed phase map with day-level chronology and symptom logging.',
  },
  safety: {
    title: 'Safety analyzer',
    subtitle: 'A structured timeline that assesses theoretical overlap risk.',
  },
  reports: {
    title: 'Executive reports',
    subtitle: 'Generate and export clean, analytical clinical summaries.',
  },
  history: {
    title: 'Symptom history',
    subtitle: 'A chronological feed of all logged physical and emotional data.',
  },
  reference: {
    title: 'Clinical reference',
    subtitle: 'Peer-reviewed articles, guidelines, and extended learning.',
  },
}

const getMobileNavIcon = (tab: TabKey) => {
  switch (tab) {
    case 'overview': return <Activity className="w-5 h-5" />
    case 'calendar': return <CalendarDays className="w-5 h-5" />
    case 'safety': return <ShieldCheck className="w-5 h-5" />
    case 'reports': return <FileText className="w-5 h-5" />
    case 'history': return <Clock3 className="w-5 h-5" />
    case 'reference': return <BookOpen className="w-5 h-5" />
  }
}

const getMobileNavTitle = (tab: TabKey) => {
  switch (tab) {
    case 'overview': return 'Overview'
    case 'calendar': return 'Calendar'
    case 'safety': return 'Safety'
    case 'reports': return 'Reports'
    case 'history': return 'History'
    case 'reference': return 'Reference'
  }
}

const goalOptions: Array<{ value: CycleGoal; label: string; tone: string }> = [
  { value: 'track', label: 'Track setup', tone: 'active' },
  { value: 'conceive', label: 'Conceive', tone: 'active' },
  { value: 'avoid', label: 'Avoid pregnancy', tone: 'active' },
]

const themeModeLabels: Record<ThemeMode, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto'
    const stored = window.localStorage.getItem('aura-femme-theme') as ThemeMode | null
    return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
  })
  
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [ready, setReady] = useState(false)
  const [selectedDay, setSelectedDay] = useState<CycleDayInfo | null>(null)

  const [sharedCaseStudy, setSharedCaseStudy] = useState<CaseStudyResult | null>(null)
  
  const [logs, setLogs] = useState<Record<string, DailyLog>>(() => {
    try {
      const savedLogs = localStorage.getItem('aura-femme-logs')
      return savedLogs ? JSON.parse(savedLogs) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem('aura-femme-logs', JSON.stringify(logs))
  }, [logs])

  const handleSaveLog = (log: DailyLog) => {
    setLogs(prev => ({ ...prev, [log.dateIso]: log }))
  }

  const handleDeleteLog = (dateIso: string) => {
    setLogs(prev => {
      const nextLogs = { ...prev }
      delete nextLogs[dateIso]
      return nextLogs
    })
  }

  const [authMode, setAuthMode] = useState<'unauthenticated' | 'authenticated' | 'guest'>(() => {
    const savedMode = localStorage.getItem('aura-femme-authmode')
    if (savedMode === 'guest' || savedMode === 'unauthenticated' || savedMode === 'authenticated') {
      return savedMode
    }
    return localStorage.getItem('aura-femme-profile') ? 'authenticated' : 'unauthenticated'
  })

  const handleSetAuthMode = (mode: 'unauthenticated' | 'authenticated' | 'guest') => {
    setAuthMode(mode)
    localStorage.setItem('aura-femme-authmode', mode)
  }
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aura-femme-profile')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) {}
    }
    const oldName = localStorage.getItem('aura-femme-user')
    if (oldName) {
      return {
        name: oldName,
        managementType: 'self',
        lastPeriodDate: addUtcDays(utcTodayIso(), -12),
        cycleLength: 28,
        bleedingDuration: 5
      }
    }
    return null
  })

  const handleCompleteOnboarding = (profile: UserProfile) => {
    localStorage.setItem('aura-femme-profile', JSON.stringify(profile))
    localStorage.removeItem('aura-femme-user')
    setUserProfile(profile)
    setLastPeriodDate(profile.lastPeriodDate)
    setCycleLength(profile.cycleLength)
    setBleedingDuration(profile.bleedingDuration)
    handleSetAuthMode('authenticated')
  }

  const handleLogin = () => {
    if (userProfile) {
      setLastPeriodDate(userProfile.lastPeriodDate)
      setCycleLength(userProfile.cycleLength)
      setBleedingDuration(userProfile.bleedingDuration)
    }
    handleSetAuthMode('authenticated')
  }

  const handleGuestLogin = () => {
    setLastPeriodDate(addUtcDays(utcTodayIso(), -12))
    setCycleLength(28)
    setBleedingDuration(5)
    handleSetAuthMode('guest')
  }

  const handleDeleteProfile = () => {
    localStorage.removeItem('aura-femme-profile')
    localStorage.removeItem('aura-femme-authmode')
    setUserProfile(null)
    setLogs({})
    handleSetAuthMode('unauthenticated')
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify({ userName: userProfile?.name, userProfile, logs }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aura-femme-data-${utcTodayIso()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (parsed && parsed.logs && typeof parsed.logs === 'object') {
        setLogs(prev => ({ ...prev, ...parsed.logs }))
        alert('Data imported successfully!')
      } else {
        alert('Invalid data format. Could not import.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to parse file.')
    }
  }

  const [lastPeriodDate, setLastPeriodDate] = useState<string>(() => {
    const savedMode = localStorage.getItem('aura-femme-authmode')
    if (savedMode === 'guest') return addUtcDays(utcTodayIso(), -12)
    return userProfile?.lastPeriodDate || addUtcDays(utcTodayIso(), -12)
  })
  
  const [cycleLength, setCycleLength] = useState<number>(() => {
    const savedMode = localStorage.getItem('aura-femme-authmode')
    if (savedMode === 'guest') return 28
    return userProfile?.cycleLength || 28
  })
  
  const [bleedingDuration, setBleedingDuration] = useState<number>(() => {
    const savedMode = localStorage.getItem('aura-femme-authmode')
    if (savedMode === 'guest') return 5
    return userProfile?.bleedingDuration || 5
  })
  const [lutealPhaseLength, setLutealPhaseLength] = useState(14)
  const [goal, setGoal] = useState<CycleGoal>('track')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light')
    handleChange()
    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }
    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const resolvedTheme = themeMode === 'auto' ? systemTheme : themeMode
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
    window.localStorage.setItem('aura-femme-theme', themeMode)
  }, [systemTheme, themeMode])

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1300)
    return () => window.clearTimeout(timer)
  }, [])

  const cycleInput = useMemo<CycleInput>(
    () => ({
      lastPeriodDate,
      cycleLength,
      bleedingDuration,
      lutealPhaseLength,
      goal,
    }),
    [lastPeriodDate, cycleLength, bleedingDuration, lutealPhaseLength, goal],
  )

  const metrics = useMemo(() => buildCycleMetrics(cycleInput), [cycleInput])
  const calendarDays = useMemo(() => buildCalendarDays(metrics.cycleStartIso, cycleInput), [cycleInput, metrics.cycleStartIso])

  const advisory = useMemo(() => {
    const fertileCaution = metrics.currentPhase === 'ovulation' || metrics.currentPhase === 'luteal'
    switch (goal) {
      case 'track':
        return {
          title: 'Tracking mode engaged',
          body: fertileCaution
            ? 'Phase transition is active. Keep logging symptoms and compare against the fertile window to preserve cycle accuracy.'
            : 'Baseline tracking is running. Use the calendar and symptom notes to refine the model over time.',
          icon: <HeartPulse className="w-5 h-5" />,
        }
      case 'conceive':
        return {
          title: 'Conception guidance',
          body: metrics.ovulationCountdown <= 5
              ? 'The fertile window is in play. The current math places ovulation close enough that timing matters now.'
              : 'You are outside the peak window, but the model can still help you time the next fertile swing.',
          icon: <Sparkles className="w-5 h-5" />,
        }
      case 'avoid':
        return {
          title: 'Avoid-pregnancy advisory',
          body: fertileCaution
            ? 'This is a higher-caution interval. The model shows overlap between fertile timing and potential sperm survivability.'
            : 'Risk pressure is lower outside the fertile window, but the dashboard continues to monitor phase drift.',
          icon: <ShieldAlert className="w-5 h-5" />,
        }
    }
  }, [goal, metrics.currentPhase, metrics.ovulationCountdown])

  const activeDay = useMemo(() => {
    if (!calendarDays.length) return null
    if (!selectedDay) return calendarDays[0]
    return calendarDays.find((day) => day.cycleDay === selectedDay.cycleDay) ?? calendarDays[0]
  }, [calendarDays, selectedDay])


  function handleDatePartsChange(nextIso: string) {
    setLastPeriodDate(nextIso)
    if (userProfile && authMode === 'authenticated') {
      const nextProfile = { ...userProfile, lastPeriodDate: nextIso }
      setUserProfile(nextProfile)
      localStorage.setItem('aura-femme-profile', JSON.stringify(nextProfile))
    }
  }

  if (authMode === 'unauthenticated') {
    if (userProfile) {
      return <LoginScreen 
        profile={userProfile} 
        onLogin={handleLogin} 
        onGuest={handleGuestLogin} 
        onDeleteProfile={handleDeleteProfile}
      />
    }
    return <OnboardingModal onComplete={handleCompleteOnboarding} onGuest={handleGuestLogin} />
  }

  // Hide logs if we are in guest mode
  const activeLogs = authMode === 'guest' ? {} : logs;

  if (!ready) {
    return (
      <div className="loading-screen" style={{ flexDirection: 'column' }}>
        <div className="app-bg-glow" />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, height: '140px' }}>
          
          {/* Main Logo */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <motion.img 
              src={faviconGradient} 
              alt="Loading" 
              animate={{ 
                opacity: [0.8, 1, 0.8], 
                filter: [
                  'drop-shadow(0 4px 12px rgba(197, 34, 51, 0.3))', 
                  'drop-shadow(0 12px 24px rgba(197, 34, 51, 0.7))', 
                  'drop-shadow(0 4px 12px rgba(197, 34, 51, 0.3))'
                ] 
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '7.5rem', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </div>
          
          {/* Enhanced Blood Dripping Effect */}
          <motion.div
            style={{ 
              position: 'absolute', 
              top: '65%', 
              left: '50%', 
              marginLeft: '-0.3rem', 
              width: '0.6rem', 
              height: '0.6rem', 
              borderRadius: '0 50% 50% 50%', 
              background: 'linear-gradient(135deg, #e02443, #8a0c1c)',
              boxShadow: '0 4px 12px rgba(197, 34, 51, 0.9), inset -1px -1px 2px rgba(0,0,0,0.3)',
              zIndex: 5
            }}
            animate={{ 
              y: [0, 80], 
              scale: [0.3, 1, 0.8],
              opacity: [0, 1, 0],
              rotate: [45, 45, 45]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeIn", times: [0, 0.6, 1], delay: 0.2 }}
          />
          <motion.div
            style={{ 
              position: 'absolute', 
              top: '65%', 
              left: '50%', 
              marginLeft: '-0.15rem', 
              width: '0.3rem', 
              height: '0.3rem', 
              borderRadius: '0 50% 50% 50%', 
              background: '#e02443',
              zIndex: 5
            }}
            animate={{ 
              y: [0, 60], 
              scale: [0.2, 1, 0],
              opacity: [0, 0.8, 0],
              rotate: [45, 45, 45]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeIn", times: [0, 0.7, 1], delay: 0.4 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <div className="app-bg-glow" />
      <div className="app-container">
        <motion.header 
          className="glass-card app-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 1 }}
        >
          <div className="header-content">
            <div className="header-brand">
              <picture>
                <source media="(max-width: 768px)" srcSet="/icon-color.png" />
                <img src={auraLogo} alt="Aura Femme Logo" className="brand-logo-img" />
              </picture>
            </div>
            <div className="header-actions">
              <div className="today-badge">
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <p className="today-label">Today</p>
                <div className="today-divider" />
                <p className="today-date">{formatUtcDateLabel(utcTodayIso())}</p>
              </div>
              <ThemeSwitcher mode={themeMode} onChange={setThemeMode} />
            </div>
          </div>
          <nav className="app-nav">
            {(Object.keys(tabCopy) as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              >
                {tabCopy[tab].title}
              </button>
            ))}
          </nav>
        </motion.header>

        <section className="main-layout">
          <motion.aside 
            className={`sidebar ${activeTab !== 'overview' ? 'mobile-hidden' : ''}`}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
          >
            <div className="glass-card panel">
              <div className="panel-header">
                <div>
                  <p className="panel-label">Biometric controller</p>
                  <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>Baseline parameters</h2>
                </div>
                <Target className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="panel-body">
                <DateTriplet label="Last period start date" value={lastPeriodDate} onChange={handleDatePartsChange} />

                <SliderField label="Cycle duration" helper="21 to 40 days" value={cycleLength} min={21} max={40} onChange={setCycleLength} />
                <SliderField label="Bleeding duration" helper="Menstruation length" value={bleedingDuration} min={2} max={10} onChange={setBleedingDuration} />
                <SliderField label="Luteal phase" helper="Default 14 days" value={lutealPhaseLength} min={10} max={18} onChange={setLutealPhaseLength} />

                <div className="field-group">
                  <p className="field-label">Primary goal</p>
                  <div className="goal-options">
                    {goalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGoal(option.value)}
                        className={`goal-btn ${goal === option.value ? 'active' : ''}`}
                      >
                        <span className="goal-btn-title">{option.label}</span>
                        <span className="goal-btn-desc">
                          {option.value === 'track' ? 'Neutral logging' : option.value === 'conceive' ? 'Optimize fertile timing' : 'Higher caution mode'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between', height: '100%' }}>
              <div className="sidebar-section" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.125rem', padding: '0.65rem', background: 'var(--accent-soft)', borderRadius: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {advisory.icon}
                </div>
                <div>
                  <p className="panel-label" style={{ marginBottom: '0.35rem' }}>Goal advisory</p>
                  <h3 className="panel-title" style={{ fontSize: '1.15rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>{advisory.title}</h3>
                  <p className="metric-helper" style={{ lineHeight: 1.6 }}>{advisory.body}</p>
                </div>
              </div>

              <div style={{ padding: '1.15rem', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '1rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.125rem', boxShadow: '0 4px 12px rgba(197, 34, 51, 0.25)' }}>
                    {authMode === 'guest' ? 'G' : userProfile?.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                      {authMode === 'guest' ? 'Guest Mode' : (userProfile?.managementType === 'self' ? 'Patient Profile' : 'Managed Profile')}
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--text-strong)', margin: '0.15rem 0 0 0', fontSize: '0.95rem' }}>
                      {authMode === 'guest' ? 'Guest User' : userProfile?.name}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleSetAuthMode('unauthenticated')}
                  className="btn btn-outline"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.55rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </motion.aside>

          <motion.main 
            className="main-content"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
          >
            <div>
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.2 }}>
                <div className="glass-card panel">
                  <div className="panel-header" style={{ alignItems: 'center', display: activeTab === 'overview' ? 'none' : 'flex' }}>
                    <div>
                      <p className="panel-label">Dashboard</p>
                      <h2 className="panel-title">{tabCopy[activeTab].title}</h2>
                      <p className="metric-helper" style={{ maxWidth: '42rem' }}>{tabCopy[activeTab].subtitle}</p>
                    </div>
                    <div className="nav-item">
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />
                      Clinical math online
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', position: 'relative' }}>
                    
                    {/* Clinical Dashboard (Overview) */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'overview' ? 1 : 0, 
                        x: activeTab === 'overview' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'overview' ? 'block' : 'none' }}
                    >
                      <PersonalDashboard 
                        userProfile={userProfile} 
                        metrics={metrics} 
                        authMode={authMode} 
                      />
                    </motion.div>

                    {/* Calendar Terminal */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'calendar' ? 1 : 0, 
                        x: activeTab === 'calendar' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <CalendarGrid days={calendarDays} selectedDay={activeDay} onSelectDay={setSelectedDay} />
                        {activeDay && (
                          <section className="phase-summary">
                            <div className="panel-header">
                              <div>
                                <p className="panel-label">Chronology terminal</p>
                                <h3 className="panel-title" style={{ fontSize: '1.5rem' }}>Day {activeDay.cycleDay}: {activeDay.phaseLabel}</h3>
                                <p className="metric-helper">{formatUtcDateLabel(activeDay.dateIso)}</p>
                              </div>
                              <div className="badge">{activeDay.isPeak ? 'Peak ovulation' : activeDay.isFertile ? 'Fertile' : 'Phase stable'}</div>
                            </div>
                            
                            <div className="metrics-grid" style={{ marginTop: '1.5rem' }}>
                              <InfoTile label="Cycle logic" value={phaseLogic(activeDay)} />
                              <InfoTile label="Phase status" value={activeDay.isBleeding ? 'Menstrual onset' : activeDay.isFertile ? 'Fertile window' : 'Outside fertile window'} />
                              <InfoTile label="Date anchor" value={formatUtcDateLabel(activeDay.dateIso)} />
                            </div>

                            <DailyLogEditor 
                              dateIso={activeDay.dateIso} 
                              existingLog={activeLogs[activeDay.dateIso] || null} 
                              onSave={handleSaveLog} 
                              onDelete={() => handleDeleteLog(activeDay.dateIso)}
                              isGuest={authMode === 'guest'}
                              onClose={() => setSelectedDay(null)} 
                            />


                          </section>
                        )}
                      </div>
                    </motion.div>

                    {/* Safety Analyzer */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'safety' ? 1 : 0, 
                        x: activeTab === 'safety' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'safety' ? 'block' : 'none' }}
                    >
                      <SafetyAnalyzer 
                        lastPeriodDate={lastPeriodDate}
                        onLastPeriodDateChange={setLastPeriodDate}
                        cycleLength={cycleLength}
                        onCycleLengthChange={setCycleLength}
                        lutealPhaseLength={lutealPhaseLength}
                        onLutealPhaseLengthChange={setLutealPhaseLength}
                        onExport={(result) => { setSharedCaseStudy(result); setActiveTab('reports'); }} 
                      />
                    </motion.div>

                    {/* History Section */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'history' ? 1 : 0, 
                        x: activeTab === 'history' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'history' ? 'block' : 'none' }}
                    >
                      <HistoryDashboard 
                        logs={activeLogs} 
                        currentCycleStartIso={metrics.cycleStartIso}
                        onDeleteLog={handleDeleteLog}
                        onExportData={handleExportData}
                        onImportData={handleImportData}
                        isGuest={authMode === 'guest'}
                      />
                    </motion.div>

                    {/* Reports Section */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'reports' ? 1 : 0, 
                        x: activeTab === 'reports' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'reports' ? 'block' : 'none' }}
                    >
                      <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>


                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                          <div className="phase-summary" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
                            <div style={{ width: '100%', overflowX: 'auto', minWidth: 0 }}>
                              <ReportExport 
                                metrics={metrics} 
                                cycleLength={cycleLength} 
                                lutealPhaseLength={lutealPhaseLength} 
                                userName={userProfile?.name || 'Guest User'}
                                caseStudy={sharedCaseStudy}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                          <div className="phase-summary">
                            <p className="panel-label">Exported case study</p>
                            {sharedCaseStudy ? (
                              <div className={`risk-card ${sharedCaseStudy.riskLevel === 'elevated' ? 'risk-high' : 'risk-low'}`}>
                                <div className="risk-card-header">
                                  {sharedCaseStudy.riskLevel === 'elevated' ? <ShieldAlert size={18} className="risk-icon" /> : <ShieldCheck size={18} className="risk-icon" />}
                                  <span className="risk-title">{sharedCaseStudy.riskLabel} Risk Assessment</span>
                                </div>
                                <div className="risk-card-body">
                                  {sharedCaseStudy.summary}
                                </div>
                              </div>
                            ) : (
                              <div className="metric-helper" style={{ marginTop: '1rem', fontStyle: 'italic' }}>No case study exported yet.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Reference Library */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: activeTab === 'reference' ? 1 : 0, 
                        x: activeTab === 'reference' ? 0 : 30 
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: activeTab === 'reference' ? 'block' : 'none' }}
                    >
                      <KnowledgeBase />
                    </motion.div>

                  </div>
                </div>
              </motion.div>
            </div>
          </motion.main>

          {/* Footer */}
          <motion.footer 
            className="app-footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
          >
            <p className="footer-text">
              &copy; 2026 <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="footer-link">Karthik Lal</a>. All rights reserved
            </p>
          </motion.footer>
        </section>
      </div>

      <nav className="mobile-bottom-nav">
        {(Object.keys(tabCopy) as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-capsule"
                  className="active-capsule-bg"
                  transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.8 }}
                />
              )}
              <motion.div
                initial={false}
                animate={{ y: isActive ? -4 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="icon-label-wrapper"
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="icon-container"
                >
                  {getMobileNavIcon(tab)}
                </motion.div>
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="mobile-nav-label"
                    >
                      {getMobileNavTitle(tab)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="phase-summary">
      <p className="metric-label">{label}</p>
      <p className="field-label" style={{ marginTop: '0.5rem', lineHeight: 1.5 }}>{value}</p>
    </div>
  )
}

function SliderField({ label, helper, value, min, max, onChange }: { label: string; helper: string; value: number; min: number; max: number; onChange: (val: number) => void }) {
  return (
    <label className="field-group">
      <div className="field-header">
        <span className="field-label">{label}</span>
        <span className="field-helper">{helper}</span>
      </div>
      <div className="slider-wrapper">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(clampNumber(Number(e.target.value), min, max))} />
        <span className="slider-value">{value}</span>
      </div>
    </label>
  )
}

function ThemeSwitcher({ mode, onChange }: { mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className="theme-switcher">
      {(Object.keys(themeModeLabels) as ThemeMode[]).map((option) => (
        <button key={option} type="button" onClick={() => onChange(option)} className={`theme-btn ${option === 'auto' ? 'theme-btn-auto' : ''} ${mode === option ? 'active' : ''}`}>
          {option === 'light' ? <SunMedium className="w-4 h-4" /> : option === 'dark' ? <MoonStar className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          <span className="theme-btn-text">{themeModeLabels[option]}</span>
        </button>
      ))}
    </div>
  )
}

function phaseLogic(day: CycleDayInfo): string {
  if (day.isBleeding) return 'Cycle day is still within menstruation, so the bleeding duration rule has precedence.'
  if (day.isPeak) return 'Cycle day hits the ovulation point, where the fertile window peaks and the egg release is expected.'
  if (day.isFertile) return 'The date is inside the modeled fertile window where sperm survivability can overlap the ovulatory cycle.'
  return day.phase === 'follicular' ? 'The follicular interval is building toward ovulation while staying outside the peak release day.' : 'The luteal phase follows ovulation and typically reflects the post-ovulatory stabilization window.'
}

export default App