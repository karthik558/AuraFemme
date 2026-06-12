import auraLogo from './assets/icon-color.png'
import pregnancyLogo from './assets/icon-color-purple.png'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
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
  Baby,
  SunMedium,
  Target,
  FileText,
  BookOpen,
  Download,
  Upload,
} from 'lucide-react'
import React, { useEffect, useMemo, useState, useRef, Suspense } from 'react'
import { GooeyBloodTransition } from './components/GooeyBloodTransition'
import { CinematicPreloader } from './components/CinematicPreloader'
import { DateTriplet } from './components/DateTriplet'
import { DailyLogEditor } from './components/DailyLogEditor'
import { OnboardingModal } from './components/OnboardingModal'
import { LoginScreen } from './components/LoginScreen'
import { useAppStore, migrateLegacyStorage } from './store'

const CalendarGrid = React.lazy(() => import('./components/CalendarGrid').then(m => ({ default: m.CalendarGrid })))
const SafetyAnalyzer = React.lazy(() => import('./components/SafetyAnalyzer').then(m => ({ default: m.SafetyAnalyzer })))
const ReportExport = React.lazy(() => import('./components/ReportExport').then(m => ({ default: m.ReportExport })))
const KnowledgeBase = React.lazy(() => import('./components/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const HistoryDashboard = React.lazy(() => import('./components/HistoryDashboard').then(m => ({ default: m.HistoryDashboard })))
const PersonalDashboard = React.lazy(() => import('./components/PersonalDashboard').then(m => ({ default: m.PersonalDashboard })))
import {
  addUtcDays,
  buildCalendarDays,
  buildCycleMetrics,
  clampNumber,
  formatUtcDateLabel,
  utcTodayIso,
  diffUtcDays,
  buildPregnancyMetrics,
} from './utils/calculator'
import type { CycleDayInfo, CycleGoal, CycleInput, ThemeMode, UserProfile } from './types'
import './App.css'

export type TabKey = 'overview' | 'calendar' | 'safety' | 'reports' | 'history' | 'reference'

const tabCopy: Record<TabKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard',
    subtitle: 'Cycle intelligence, advisory signals, and the live metric stack.',
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Detailed phase map with day-level chronology and symptom logging.',
  },
  safety: {
    title: 'Safety',
    subtitle: 'A structured timeline that assesses theoretical overlap risk.',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Exportable data packages for review.',
  },
  history: {
    title: 'History',
    subtitle: 'Retrospective metrics and trend analysis over recorded cycles.',
  },
  reference: {
    title: 'Reference',
    subtitle: 'Peer-reviewed articles, guidelines, and extended learning.',
  },
}

const getTabCopy = (tab: TabKey, appMode: 'cycle' | 'pregnancy' | 'postpartum' | undefined) => {
  const base = { ...tabCopy[tab] }
  if (appMode === 'pregnancy') {
    if (tab === 'overview') {
      base.title = 'Dashboard'
      base.subtitle = 'Trimester intelligence and maternal signals.'
    } else if (tab === 'reports') {
      base.title = 'Reports'
      base.subtitle = 'Generate clinical maternal exports.'
    }
  }
  return base
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
  light: 'Light',
  dark: 'Dark',
}

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)

  useEffect(() => {
    migrateLegacyStorage()
  }, [])

  const store = useAppStore()
  const {
    activeTab, setActiveTab,
    ready, setReady,
    sharedCaseStudy, setSharedCaseStudy,
    themeMode, setThemeMode,
    logs, setLogs,
    authMode, setAuthMode,
    userProfile, setUserProfile,
    lastPeriodDate, setLastPeriodDate,
    cycleLength, setCycleLength,
    bleedingDuration, setBleedingDuration,
    lutealPhaseLength, setLutealPhaseLength,
    goal, setGoal,
  } = store

  useGSAP(() => {
    if (!ready || authMode === 'unauthenticated') return;
    
    // Initial App Load Animations
    gsap.fromTo('.app-header', 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }
    );
    gsap.fromTo('.main-content', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, delay: 0.15, ease: 'power3.out', clearProps: 'transform' }
    );
    gsap.fromTo('.app-sidebar', 
      { x: 30, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power3.out', clearProps: 'transform' }
    );
  }, { scope: appRef, dependencies: [ready, authMode] });

  const [selectedDay, setSelectedDay] = useState<CycleDayInfo | null>(null)

  // Swipe navigation logic
  const touchStartRef = useRef<number | null>(null)
  const touchEndRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchEndYRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignore touches on interactive elements like sliders, buttons, or charts
    const target = e.target as HTMLElement;
    if (target.closest('input, button, select, a, .recharts-wrapper, .slider-wrapper, .input-group, .calendar-grid, .history-logs, .no-swipe')) return;

    touchEndRef.current = null
    touchEndYRef.current = null
    touchStartRef.current = e.targetTouches[0].clientX
    touchStartYRef.current = e.targetTouches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return; // Prevent move if start was ignored
    touchEndRef.current = e.targetTouches[0].clientX
    touchEndYRef.current = e.targetTouches[0].clientY
  }

  const handleTouchEnd = () => {
    if (touchStartRef.current === null || touchEndRef.current === null || touchStartYRef.current === null || touchEndYRef.current === null) return
    
    const distanceX = touchStartRef.current - touchEndRef.current
    const distanceY = touchStartYRef.current - touchEndYRef.current
    
    // Determine if the swipe is mostly horizontal and meets a distance threshold (e.g. 50px)
    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      const availableTabs = (Object.keys(tabCopy) as TabKey[]).filter(tab => !(userProfile?.appMode === 'pregnancy' && tab === 'safety'))
      const currentIndex = availableTabs.indexOf(activeTab)
      
      if (distanceX > 0 && currentIndex < availableTabs.length - 1) { // Swipe left -> next tab
        setActiveTab(availableTabs[currentIndex + 1])
      }
      if (distanceX < 0 && currentIndex > 0) { // Swipe right -> previous tab
        setActiveTab(availableTabs[currentIndex - 1])
      }
    }
  }

  const handleSaveLog = store.addLog
  const handleDeleteLog = store.removeLog

  const handleSetAuthMode = setAuthMode
  
  useEffect(() => {
    document.documentElement.setAttribute('data-app-mode', userProfile?.appMode || 'cycle')
  }, [userProfile?.appMode])

  useEffect(() => {
    if (userProfile?.appMode === 'pregnancy' && activeTab === 'safety') {
      setActiveTab('overview')
    }
  }, [userProfile?.appMode, activeTab, setActiveTab])

  const handleCompleteOnboarding = (profile: UserProfile) => {
    const newId = Date.now().toString()
    store.setAccountId(newId)
    setUserProfile(profile)
    setLastPeriodDate(profile.lastPeriodDate)
    setCycleLength(profile.cycleLength)
    setBleedingDuration(profile.bleedingDuration)
    setLogs({})
    setIsCreatingProfile(false)
    handleSetAuthMode('authenticated')
  }

  const handleLogin = (id?: string) => {
    if (id) {
      store.restoreAccount(id)
    } else if (userProfile) {
      setLastPeriodDate(userProfile.lastPeriodDate)
      setCycleLength(userProfile.cycleLength)
      setBleedingDuration(userProfile.bleedingDuration)
    }
    setIsCreatingProfile(false)
    handleSetAuthMode('authenticated')
  }

  const handleGuestLogin = () => {
    store.archiveCurrentAccount()
    setLastPeriodDate(addUtcDays(utcTodayIso(), -12))
    setCycleLength(28)
    setBleedingDuration(5)
    setUserProfile({
      name: 'Guest User',
      managementType: 'self',
      lastPeriodDate: addUtcDays(utcTodayIso(), -12),
      cycleLength: 28,
      bleedingDuration: 5,
      appMode: 'cycle'
    })
    store.setAccountId(null)
    setIsCreatingProfile(false)
    handleSetAuthMode('guest')
  }

  const handleDeleteProfile = () => {
    setUserProfile(null)
    setLogs({})
    store.setAccountId(null)
    handleSetAuthMode('unauthenticated')
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify({ userName: userProfile?.name, userProfile: userProfile, logs: logs }, null, 2)
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
        setLogs((prev) => ({ ...prev, ...parsed.logs }))
        alert('Data imported successfully!')
      } else {
        alert('Invalid data format. Could not import.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to parse file.')
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImportData(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  useEffect(() => {
    const resolvedTheme = themeMode
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
  }, [themeMode])

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
    if (userProfile?.appMode === 'pregnancy') {
      return {
        title: 'Pregnancy Mode Active',
        body: 'Maternal tracking is currently engaged. Standard cycle parameters and goals are suppressed to focus on gestational progress.',
        icon: <Activity className="w-5 h-5" />,
      }
    }

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
          icon: <Baby className="w-5 h-5" />,
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
  }, [goal, metrics.currentPhase, metrics.ovulationCountdown, userProfile?.appMode])

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
    if (!isCreatingProfile && (userProfile || Object.keys(store.inactiveAccounts).length > 0)) {
      return <LoginScreen 
        activeProfile={userProfile} 
        inactiveAccounts={store.inactiveAccounts}
        onLogin={handleLogin} 
        onGuest={handleGuestLogin} 
        onDeleteProfile={(id) => {
          if (!id || id === store.accountId) {
            handleDeleteProfile()
          } else {
            store.deleteAccount(id)
          }
        }}
        onCreateNew={() => {
          store.archiveCurrentAccount()
          setUserProfile(null)
          setLogs({})
          store.setAccountId(null)
          setIsCreatingProfile(true)
        }}
      />
    }
    return <OnboardingModal onComplete={handleCompleteOnboarding} onGuest={handleGuestLogin} themeMode={themeMode} />
  }

  // Hide logs if we are in guest mode
  const activeLogs = authMode === 'guest' ? {} : logs;

  if (!ready) {
    return <CinematicPreloader onComplete={() => setReady(true)} appMode={userProfile?.appMode || 'cycle'} themeMode={themeMode} />
  }

  return (
    <div ref={appRef} className="app-wrapper" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="app-bg-glow" />
      <div className="app-container">
        <header 
          className="glass-card app-header"
        >
          <div className="header-content header-content-responsive">
            
            {/* Mobile Left: AppModeSwitcher */}
            <div className="mobile-only header-left">
              <AppModeSwitcher 
                mode={userProfile?.appMode || 'cycle'} 
                themeMode={themeMode}
                onChange={(newMode) => {
                  if (userProfile) {
                    const nextProfile = { ...userProfile, appMode: newMode }
                    setUserProfile(nextProfile)
                    localStorage.setItem('aura-femme-profile', JSON.stringify(nextProfile))
                  } else {
                    setUserProfile({
                      name: 'Guest User',
                      managementType: 'self',
                      lastPeriodDate: addUtcDays(utcTodayIso(), -12),
                      cycleLength: 28,
                      bleedingDuration: 5,
                      appMode: newMode
                    })
                  }
                }} 
              />
            </div>

            {/* Center Logo */}
            <div className="header-brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
              <picture>
                <source media="(max-width: 768px)" srcSet={userProfile?.appMode === 'pregnancy' ? pregnancyLogo : auraLogo} />
                <img src={userProfile?.appMode === 'pregnancy' ? pregnancyLogo : auraLogo} alt="Aura Femme Logo" className="brand-logo-img" />
              </picture>
            </div>
            
            {/* Right: Actions */}
            <div className="header-actions">
              <div className="desktop-only">
                <AppModeSwitcher 
                  mode={userProfile?.appMode || 'cycle'} 
                  themeMode={themeMode}
                  onChange={(newMode) => {
                    if (userProfile) {
                      const nextProfile = { ...userProfile, appMode: newMode }
                      setUserProfile(nextProfile)
                      localStorage.setItem('aura-femme-profile', JSON.stringify(nextProfile))
                    } else {
                      setUserProfile({
                        name: 'Guest User',
                        managementType: 'self',
                        lastPeriodDate: addUtcDays(utcTodayIso(), -12),
                        cycleLength: 28,
                        bleedingDuration: 5,
                        appMode: newMode
                      })
                    }
                  }} 
                />
              </div>
              <div className="today-badge desktop-only">
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <p className="today-label">Today</p>
                <div className="today-divider" />
                <p className="today-date">{formatUtcDateLabel(utcTodayIso())}</p>
              </div>
              <ThemeSwitcher mode={themeMode} appMode={userProfile?.appMode || 'cycle'} onChange={setThemeMode} />
            </div>
          </div>
          <nav className="app-nav">
            {(Object.keys(tabCopy) as TabKey[]).filter(tab => !(userProfile?.appMode === 'pregnancy' && tab === 'safety')).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                {activeTab === tab && (
                  <div
                    className="nav-active-bg"
                  />
                )}
                <span className="nav-item-content">
                  {getMobileNavIcon(tab)}
                  <span className="nav-item-text">{getTabCopy(tab, userProfile?.appMode).title}</span>
                </span>
              </button>
            ))}
          </nav>
        </header>

        <section className="main-layout">
          <aside 
            className={`sidebar ${activeTab !== 'overview' ? 'mobile-hidden' : ''}`}
          >
            <div className="glass-card panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>Baseline parameters</h2>
                </div>
                <Target className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="panel-body">
                {userProfile?.appMode === 'pregnancy' ? (
                  <DateTriplet label="Last period (LMP)" value={lastPeriodDate} onChange={handleDatePartsChange} />
                ) : (
                  <>
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
                  </>
                )}
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
                      {authMode === 'guest' ? 'Guest Mode' : (userProfile?.managementType === 'self' ? 'Personal Account' : 'Managed Account')}
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--text-strong)', margin: '0.15rem 0 0 0', fontSize: '0.95rem' }}>
                      {authMode === 'guest' ? 'Guest User' : userProfile?.name}
                    </p>
                  </div>
                </div>

                {/* App Tracking Mode was moved to the header */}
                <button 
                  onClick={() => handleSetAuthMode('unauthenticated')}
                  className="btn btn-outline"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.55rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleExportData} 
                    title={authMode === 'guest' ? 'Guests cannot export data' : 'Export Profile Data'}
                    disabled={authMode === 'guest'}
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.55rem', fontSize: '0.85rem' }}
                  >
                    <Download size={14} /> Export
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => fileInputRef.current?.click()} 
                    title={authMode === 'guest' ? 'Guests cannot import data' : 'Import Profile Data'}
                    disabled={authMode === 'guest'}
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.55rem', fontSize: '0.85rem' }}
                  >
                    <Upload size={14} /> Import
                  </button>
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </aside>

          <main 
            className="main-content"
          >
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading module...</div>}>
              <div>
                <div className="tab-panel-container">
                  <div className="glass-card panel">
                    <div className="panel-header" style={{ alignItems: 'center', display: activeTab === 'overview' ? 'none' : 'flex' }}>
                      <div>
                        <p className="panel-label">Dashboard</p>
                        <h2 className="panel-title">{getTabCopy(activeTab, userProfile?.appMode).title}</h2>
                        <p className="metric-helper" style={{ maxWidth: '42rem' }}>{getTabCopy(activeTab, userProfile?.appMode).subtitle}</p>
                      </div>
                      <div className="nav-item">
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />
                        Clinical math online
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', position: 'relative' }}>
                      
                      {/* Clinical Dashboard (Overview) */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'overview' ? 'block' : 'none' }}
                      >
                        <PersonalDashboard 
                          userProfile={userProfile} 
                          metrics={metrics} 
                          authMode={authMode} 
                        />
                      </div>

                      {/* Calendar Terminal */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-0.5rem' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                              onClick={() => setActiveTab('reports')}
                            >
                              <Download size={16} /> Generate Clinical Report
                            </button>
                          </div>
                          <CalendarGrid days={calendarDays} selectedDay={activeDay} onSelectDay={setSelectedDay} userProfile={userProfile} />
                          {activeDay && (
                            <section className="phase-summary">
                              <div className="panel-header">
                                <div>
                                  <p className="panel-label">{userProfile?.appMode === 'pregnancy' ? 'Pregnancy Timeline' : 'Chronology terminal'}</p>
                                  {userProfile?.appMode === 'pregnancy' ? (
                                    <h3 className="panel-title" style={{ fontSize: '1.5rem' }}>Week {Math.floor(diffUtcDays(activeDay.dateIso, userProfile.lastPeriodDate) / 7)}</h3>
                                  ) : (
                                    <h3 className="panel-title" style={{ fontSize: '1.5rem' }}>Day {activeDay.cycleDay}: {activeDay.phaseLabel}</h3>
                                  )}
                                  <p className="metric-helper">{formatUtcDateLabel(activeDay.dateIso)}</p>
                                </div>
                                <div className="badge">
                                  {userProfile?.appMode === 'pregnancy' 
                                    ? `Trimester ${Math.floor(diffUtcDays(activeDay.dateIso, userProfile.lastPeriodDate) / 7) >= 28 ? 3 : Math.floor(diffUtcDays(activeDay.dateIso, userProfile.lastPeriodDate) / 7) >= 13 ? 2 : 1}` 
                                    : (activeDay.isPeak ? 'Peak ovulation' : activeDay.isFertile ? 'Fertile' : 'Phase stable')}
                                </div>
                              </div>
                              
                              <div className="metrics-grid" style={{ marginTop: '1.5rem' }}>
                                {userProfile?.appMode === 'pregnancy' ? (() => {
                                  const pMetrics = buildPregnancyMetrics(userProfile.lastPeriodDate, activeDay.dateIso)
                                  return (
                                    <>
                                      <InfoTile label="Gestational age" value={`${pMetrics.gestationalWeeks} weeks, ${pMetrics.gestationalDays % 7} days`} />
                                      <InfoTile label="Pregnancy progress" value={`Trimester ${pMetrics.trimester}`} />
                                      <InfoTile label="Date anchor" value={formatUtcDateLabel(activeDay.dateIso)} />
                                    </>
                                  )
                                })() : (
                                  <>
                                    <InfoTile label="Cycle logic" value={phaseLogic(activeDay)} />
                                    <InfoTile label="Phase status" value={activeDay.isBleeding ? 'Menstrual onset' : activeDay.isFertile ? 'Fertile window' : 'Outside fertile window'} />
                                    <InfoTile label="Date anchor" value={formatUtcDateLabel(activeDay.dateIso)} />
                                  </>
                                )}
                              </div>

                                <DailyLogEditor 
                                  dateIso={activeDay.dateIso} 
                                  existingLog={activeLogs[activeDay.dateIso] || null} 
                                  onSave={handleSaveLog} 
                                  onDelete={() => handleDeleteLog(activeDay.dateIso)}
                                  isGuest={authMode === 'guest'}
                                  onClose={() => setSelectedDay(null)}
                                  userProfile={userProfile}
                                />


                            </section>
                          )}
                        </div>
                      </div>

                      {/* Safety Analyzer */}
                      <div 
                        className="tab-content fade-transition"
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
                      </div>

                      {/* History Section */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'history' ? 'block' : 'none' }}
                      >
                        <HistoryDashboard 
                          logs={activeLogs} 
                          currentCycleStartIso={metrics.cycleStartIso}
                          onDeleteLog={handleDeleteLog}
                        />
                      </div>

                      {/* Reports Section */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'reports' ? 'block' : 'none' }}
                      >
                        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>


                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                            <div className="phase-summary" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
                              <div style={{ width: '100%', overflowX: 'auto', minWidth: 0 }}>
                                <ReportExport 
                                  metrics={metrics} 
                                  cycleLength={userProfile?.cycleLength || 28} 
                                  lutealPhaseLength={lutealPhaseLength} 
                                  userName={userProfile?.name || 'Ayana'} 
                                  logs={activeLogs} 
                                  userProfile={userProfile} 
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
                      </div>

                      {/* Reference Library */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'reference' ? 'block' : 'none' }}
                      >
                        <KnowledgeBase />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </Suspense>
          </main>
        </section>

        {/* Footer */}
        <footer 
          className="app-footer desktop-only"
        >
          <p className="footer-text">
            &copy; 2026 <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="footer-link">Karthik Lal</a>. All rights reserved
          </p>
        </footer>
      </div>

      <nav className="mobile-bottom-nav">
        {(Object.keys(tabCopy) as TabKey[]).filter(tab => !(userProfile?.appMode === 'pregnancy' && tab === 'safety')).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && <div className="active-capsule-bg" />}
              <div className={`icon-label-wrapper ${isActive ? 'active' : ''}`}>
                <div className={`icon-container ${isActive ? 'active' : ''}`}>
                  {getMobileNavIcon(tab)}
                </div>
                {isActive && (
                  <span className="mobile-nav-label active">
                    {getMobileNavTitle(tab)}
                  </span>
                )}
              </div>
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

function ThemeSwitcher({ mode, appMode, onChange }: { mode: ThemeMode; appMode: 'cycle' | 'pregnancy' | 'postpartum'; onChange: (mode: ThemeMode) => void }) {
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    targetTheme: ThemeMode;
  }>({ isActive: false, targetTheme: mode });

  const handleThemeChange = (targetMode: ThemeMode) => {
    if (mode === targetMode || transitionState.isActive) return;
    setTransitionState({
      isActive: true,
      targetTheme: targetMode
    });
  };

  const toggleMode = () => {
    const targetMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    handleThemeChange(targetMode);
  };

  return (
    <>
      {transitionState.isActive && (
        <GooeyBloodTransition
          isActive={transitionState.isActive}
          targetTheme={transitionState.targetTheme}
          targetAppMode={appMode}
          onSwitch={() => onChange(transitionState.targetTheme)}
          onComplete={() => setTransitionState(prev => ({ ...prev, isActive: false }))}
        />
      )}
      <div className="theme-switcher">
        {(Object.keys(themeModeLabels) as ThemeMode[]).map((option) => (
          <button key={option} type="button" onClick={() => handleThemeChange(option)} className={`theme-btn desktop-only ${mode === option ? 'active' : ''}`}>
            {option === 'light' ? <SunMedium className="w-4 h-4" /> : option === 'dark' ? <MoonStar className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            <span className="theme-btn-text">{themeModeLabels[option]}</span>
          </button>
        ))}
        <button type="button" onClick={toggleMode} className="theme-btn mobile-only active" title={`Theme: ${themeModeLabels[mode]}`}>
          {mode === 'light' ? <SunMedium className="w-4 h-4" /> : mode === 'dark' ? <MoonStar className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
        </button>
      </div>
    </>
  )
}

function AppModeSwitcher({ mode, themeMode, onChange }: { mode: 'cycle' | 'pregnancy' | 'postpartum'; themeMode: ThemeMode; onChange: (mode: 'cycle' | 'pregnancy' | 'postpartum') => void }) {
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    targetAppMode: 'cycle' | 'pregnancy' | 'postpartum';
  }>({ isActive: false, targetAppMode: mode });

  const handleModeChange = (targetMode: 'cycle' | 'pregnancy' | 'postpartum') => {
    if (mode === targetMode || transitionState.isActive) return;
    setTransitionState({
      isActive: true,
      targetAppMode: targetMode
    });
  };

  const toggleMode = () => {
    handleModeChange(mode === 'cycle' ? 'pregnancy' : 'cycle');
  }

  return (
    <>
      {transitionState.isActive && (
        <GooeyBloodTransition
          isActive={transitionState.isActive}
          targetTheme={themeMode}
          targetAppMode={transitionState.targetAppMode}
          onSwitch={() => onChange(transitionState.targetAppMode)}
          onComplete={() => setTransitionState(prev => ({ ...prev, isActive: false }))}
        />
      )}
      <div className="theme-switcher">
        <button className={`theme-btn desktop-only ${mode === 'cycle' ? 'active' : ''}`} onClick={() => handleModeChange('cycle')} title="Cycle Tracking">
        <Activity className="w-4 h-4" />
        <span className="theme-btn-text hide-on-mobile">Cycle</span>
      </button>
      <button className={`theme-btn desktop-only ${mode === 'pregnancy' ? 'active' : ''}`} onClick={() => handleModeChange('pregnancy')} title="Pregnancy Tracking">
        <Baby className="w-4 h-4" />
        <span className="theme-btn-text hide-on-mobile">Pregnancy</span>
      </button>
      <button type="button" onClick={toggleMode} className="theme-btn mobile-only active" title={`Mode: ${mode === 'cycle' ? 'Cycle' : 'Pregnancy'}`}>
        {mode === 'cycle' ? <Activity className="w-4 h-4" /> : <Baby className="w-4 h-4" />}
      </button>
    </div>
    </>
  )
}

function phaseLogic(day: CycleDayInfo): string {
  if (day.isBleeding) return 'Cycle day is still within menstruation, so the bleeding duration rule has precedence.'
  if (day.isPeak) return 'Cycle day hits the ovulation point, where the fertile window peaks and the egg release is expected.'
  if (day.isFertile) return 'The date is inside the modeled fertile window where sperm survivability can overlap the ovulatory cycle.'
  return day.phase === 'follicular' ? 'The follicular interval is building toward ovulation while staying outside the peak release day.' : 'The luteal phase follows ovulation and typically reflects the post-ovulatory stabilization window.'
}

export default App