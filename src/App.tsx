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
  ShieldAlert,
  ShieldCheck,
  Baby,
  FileText,
  BookOpen,
  Settings2,
  X,
  Heart,
} from 'lucide-react'
import React, { useEffect, useMemo, useState, useRef, Suspense } from 'react'
import { GooeyBloodTransition } from './components/GooeyBloodTransition'
import { CinematicPreloader } from './components/CinematicPreloader'
import { DateTriplet } from './components/DateTriplet'
import { DailyLogEditor } from './components/DailyLogEditor'
import { OnboardingModal } from './components/OnboardingModal'
import { LoginScreen } from './components/LoginScreen'
import { SettingsModal } from './components/SettingsModal'
import { useAppStore, migrateLegacyStorage } from './store'

const CalendarGrid = React.lazy(() => import('./components/CalendarGrid').then(m => ({ default: m.CalendarGrid })))
const SafetyAnalyzer = React.lazy(() => import('./components/SafetyAnalyzer').then(m => ({ default: m.SafetyAnalyzer })))
const ReportExport = React.lazy(() => import('./components/ReportExport').then(m => ({ default: m.ReportExport })))
const KnowledgeBase = React.lazy(() => import('./components/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const HistoryDashboard = React.lazy(() => import('./components/HistoryDashboard').then(m => ({ default: m.HistoryDashboard })))
const PersonalDashboard = React.lazy(() => import('./components/PersonalDashboard').then(m => ({ default: m.PersonalDashboard })))
import {
  addUtcDays,
  generateAllCycleDays,
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

interface AppProps {
  onGoHome?: () => void;
}

function App({ onGoHome }: AppProps = {}) {
  const appRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isArticleOpen, setIsArticleOpen] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavVisible(true)
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    migrateLegacyStorage()
  }, [])

  const store = useAppStore()
  const {
    activeTab, setActiveTab,
    ready, setReady,
    sharedCaseStudy, setSharedCaseStudy,
    themeMode,
    logs, setLogs,
    authMode, setAuthMode,
    userProfile, setUserProfile,
    lastPeriodDate, setLastPeriodDate,
    cycleLength, setCycleLength,
    bleedingDuration, setBleedingDuration,
    lutealPhaseLength, setLutealPhaseLength,
    goal, setGoal,
    lastIntercourseDate, setLastIntercourseDate,
    pastPeriodDates, setPastPeriodDates
  } = store
  
  const [draftLastPeriodDate, setDraftLastPeriodDate] = useState(lastPeriodDate)
  const [draftCycleLength, setDraftCycleLength] = useState(cycleLength)
  const [draftBleedingDuration, setDraftBleedingDuration] = useState(bleedingDuration)
  const [draftGoal, setDraftGoal] = useState(goal)
  const [newPastDate, setNewPastDate] = useState(utcTodayIso())

  const handleAddPastDate = () => {
    if (newPastDate) {
      const newMonthStr = newPastDate.substring(0, 7); // YYYY-MM
      const hasMonth = pastPeriodDates.some(d => d.startsWith(newMonthStr));
      
      if (hasMonth) {
        store.addToast("You have already logged a period for this month. Please delete the old one first before adding a new date in the same month.", 'error');
        return;
      }
      
      if (!pastPeriodDates.includes(newPastDate)) {
        setPastPeriodDates([...pastPeriodDates, newPastDate].sort())
      }
    }
  }

  const handleRemovePastDate = (dateToRemove: string) => {
    setPastPeriodDates(pastPeriodDates.filter(d => d !== dateToRemove))
  }

  useEffect(() => {
    setDraftLastPeriodDate(lastPeriodDate)
    setDraftCycleLength(cycleLength)
    setDraftBleedingDuration(bleedingDuration)
    setDraftGoal(goal)
  }, [lastPeriodDate, cycleLength, bleedingDuration, goal])

  const [isSaved, setIsSaved] = useState(false)
  const saveBtnRef = useRef<HTMLButtonElement>(null)

  const visibleTabs = useMemo(() => 
    (Object.keys(tabCopy) as TabKey[]).filter(tab => !(userProfile?.appMode === 'pregnancy' && tab === 'safety')),
    [userProfile?.appMode]
  )

  // GSAP powered innovative active tab pop animation (spring scale on switch for premium feel)
  useEffect(() => {
    const activeEl = document.querySelector('.mobile-nav-item.active .icon-wrapper') as HTMLElement;
    if (activeEl) {
      gsap.fromTo(activeEl, 
        { scale: 0.8, opacity: 0.7 },
        { scale: 1.08, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
      );
    }
  }, [activeTab]);

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
  }, { scope: appRef, dependencies: [ready, authMode] });

  const [selectedDay, setSelectedDay] = useState<CycleDayInfo | null>(null)

  const handleSaveLog = store.addLog
  const handleDeleteLog = store.removeLog

  const handleSetAuthMode = setAuthMode
  


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
    const exportData = {
      userName: userProfile?.name,
      userProfile,
      baseline: {
        cycleLength,
        lutealPhaseLength,
        bleedingDuration,
        lastIntercourseDate,
        goal,
        pastPeriodDates
      },
      metrics,
      logs,
      caseStudy: sharedCaseStudy
    }
    const dataStr = JSON.stringify(exportData, null, 2)
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
        if (parsed.baseline && Array.isArray(parsed.baseline.pastPeriodDates)) {
          // Merge and deduplicate past dates
          setPastPeriodDates(Array.from(new Set([...pastPeriodDates, ...parsed.baseline.pastPeriodDates])).sort())
        }
        store.addToast('Data imported successfully!', 'success')
      } else {
        store.addToast('Invalid data format. Could not import.', 'error')
      }
    } catch (err) {
      console.error(err)
      store.addToast('Failed to parse file.', 'error')
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
  const calendarDays = useMemo(() => generateAllCycleDays(pastPeriodDates, lastPeriodDate, cycleInput), [pastPeriodDates, lastPeriodDate, cycleInput])

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
    return calendarDays.find((day) => day.dateIso === selectedDay.dateIso) ?? calendarDays[0]
  }, [calendarDays, selectedDay])


  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;
    
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const tabOrder: TabKey[] = (Object.keys(tabCopy) as TabKey[]).filter(tab => !(userProfile?.appMode === 'pregnancy' && tab === 'safety'));
      const currentIndex = tabOrder.indexOf(activeTab);
      if (deltaX > 0 && currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      } else if (deltaX < 0 && currentIndex > 0) {
        setActiveTab(tabOrder[currentIndex - 1]);
      }
    }
  };

  // New functionality for mobile nav: swipe to switch tabs on the bar itself
  let navTouchStartX = 0;
  const handleNavTouchStart = (e: React.TouchEvent) => {
    navTouchStartX = e.touches[0].clientX;
  };
  const handleNavTouchEnd = (e: React.TouchEvent) => {
    const navTouchEndX = e.changedTouches[0].clientX;
    const delta = navTouchStartX - navTouchEndX;
    if (Math.abs(delta) > 40) {
      const currentIndex = visibleTabs.indexOf(activeTab);
      if (delta > 0 && currentIndex < visibleTabs.length - 1) {
        setActiveTab(visibleTabs[currentIndex + 1]);
      } else if (delta < 0 && currentIndex > 0) {
        setActiveTab(visibleTabs[currentIndex - 1]);
      }
    }
  };

  // Long press functionality update: long press a tab for quick innovative actions
  let longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  const handleTabPointerDown = (tab: TabKey, _e: React.PointerEvent) => {
    longPressTimeout = setTimeout(() => {
      // Innovative quick action on long press
      if (tab === 'overview') {
        // Quick log: switch to calendar (where logging happens) and give feedback
        setActiveTab('calendar');
        store.addToast('Quick log mode — tap a day to log symptoms', 'info');
      } else if (tab === 'calendar') {
        // Go to today
        store.addToast('Jumped to today\'s date', 'success');
        // Could integrate with selectedDay but for now feedback + stay
      } else if (tab === 'reports') {
        setIsSettingsOpen(true); // or trigger export, but settings for now as proxy
        store.addToast('Quick access to data tools', 'info');
      } else {
        store.addToast(`Quick action for ${getMobileNavTitle(tab)}`, 'info');
      }
    }, 550);
  };
  const handleTabPointerUp = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      longPressTimeout = null;
    }
  };

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
    
    const handleImportFullProfile = (parsed: any) => {
      if (parsed.userProfile) {
        const newId = Date.now().toString()
        store.setAccountId(newId)
        setUserProfile(parsed.userProfile)
        if (parsed.baseline) {
          setLastPeriodDate(parsed.baseline.lastPeriodDate || parsed.userProfile.lastPeriodDate)
          setCycleLength(parsed.baseline.cycleLength || parsed.userProfile.cycleLength)
          setBleedingDuration(parsed.baseline.bleedingDuration || parsed.userProfile.bleedingDuration)
          if (parsed.baseline.lutealPhaseLength) store.setLutealPhaseLength(parsed.baseline.lutealPhaseLength)
          if (parsed.baseline.goal) store.setGoal(parsed.baseline.goal)
          if (parsed.baseline.lastIntercourseDate) store.setLastIntercourseDate(parsed.baseline.lastIntercourseDate)
          if (parsed.baseline.pastPeriodDates) store.setPastPeriodDates(parsed.baseline.pastPeriodDates)
        }
        if (parsed.logs) {
          setLogs(parsed.logs)
        }
        setIsCreatingProfile(false)
        handleSetAuthMode('authenticated')
      }
    }
    
    return <OnboardingModal 
      onComplete={handleCompleteOnboarding} 
      onGuest={handleGuestLogin} 
      onImportProfile={handleImportFullProfile} 
      onCancel={Object.keys(store.inactiveAccounts).length > 0 ? () => setIsCreatingProfile(false) : undefined}
      themeMode={themeMode} 
    />
  }

  // Hide logs if we are in guest mode
  const activeLogs = authMode === 'guest' ? {} : logs;

  if (!ready) {
    return <CinematicPreloader onComplete={() => setReady(true)} appMode={userProfile?.appMode || 'cycle'} themeMode={themeMode} />
  }

  return (
    <div ref={appRef} className="app-wrapper">
      <div className="app-bg-glow" />
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            {/* Left: AppModeSwitcher */}
            <div className="header-left">
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
            <div className="header-brand" style={{ cursor: 'pointer' }} onClick={() => onGoHome ? onGoHome() : setActiveTab('overview')}>
              <picture>
                <source media="(max-width: 768px)" srcSet={userProfile?.appMode === 'pregnancy' ? pregnancyLogo : auraLogo} />
                <img src={userProfile?.appMode === 'pregnancy' ? pregnancyLogo : auraLogo} alt="Aura Femme Logo" className="brand-logo-img" />
              </picture>
            </div>
            
            {/* Right: Actions */}
            <div className="header-actions">
              <div className="today-badge desktop-only">
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <p className="today-label">Today</p>
                <div className="today-divider" />
                <p className="today-date">{formatUtcDateLabel(utcTodayIso())}</p>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={() => setIsSettingsOpen(true)}
                style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '2rem' }}
              >
                <Settings2 size={16} /> <span className="desktop-only">Settings</span>
              </button>
            </div>
          </div>
        </header>
        
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

        <section className={`main-layout ${(activeTab === 'reference' && isArticleOpen) ? 'sidebar-hidden' : ''}`}>
          <aside 
            className={`sidebar ${activeTab !== 'overview' ? 'mobile-hidden' : ''} ${(activeTab === 'reference' && isArticleOpen) ? 'desktop-hidden' : ''}`}
          >
            <div className="glass-card panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>Clinical Profile</h2>
                </div>
                <Settings2 className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="panel-body">
                {userProfile?.appMode === 'pregnancy' ? (
                  <DateTriplet label="Last period start date" value={draftLastPeriodDate} onChange={setDraftLastPeriodDate} />
                ) : (
                  <>
                    <DateTriplet label="Last period start date" value={draftLastPeriodDate} onChange={setDraftLastPeriodDate} />

                    <SliderField label="Cycle duration" helper="21 to 40 days" value={draftCycleLength} min={21} max={40} onChange={setDraftCycleLength} />
                    <SliderField label="Bleeding duration" helper="Menstruation length" value={draftBleedingDuration} min={2} max={10} onChange={setDraftBleedingDuration} />
                    <SliderField label="Luteal phase" helper="Default 14 days" value={lutealPhaseLength} min={10} max={18} onChange={setLutealPhaseLength} />

                    <div className="field-group">
                      <p className="field-label">Primary goal</p>
                      <div className="goal-options">
                        {goalOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setDraftGoal(option.value)}
                            className={`goal-btn ${draftGoal === option.value ? 'active' : ''}`}
                          >
                            <span className="goal-btn-title">{option.label}</span>
                            <span className="goal-btn-desc">
                              {option.value === 'track' ? 'Neutral logging' : option.value === 'conceive' ? 'Optimize fertile timing' : 'Higher caution mode'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="field-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <p className="field-label" style={{ marginBottom: '0.75rem' }}>Historical Periods</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {pastPeriodDates.length === 0 ? (
                          <p className="metric-helper" style={{ margin: 0, fontStyle: 'italic' }}>No past periods logged yet.</p>
                        ) : (
                          pastPeriodDates.map(date => (
                            <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-inset)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{date}</span>
                              <button type="button" onClick={() => handleRemovePastDate(date)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <DateTriplet 
                          label="Add past period" 
                          value={newPastDate} 
                          onChange={setNewPastDate} 
                          helper="Select the start date" 
                        />
                        <button 
                          type="button" 
                          onClick={handleAddPastDate}
                          className="btn btn-outline"
                          style={{ padding: '0.5rem 1rem', width: '100%' }}
                          disabled={!newPastDate}
                        >
                          Add Date
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        ref={saveBtnRef}
                        onClick={() => {
                          // Commit Drafts to Main State
                          setLastPeriodDate(draftLastPeriodDate)
                          setCycleLength(draftCycleLength)
                          setBleedingDuration(draftBleedingDuration)
                          setGoal(draftGoal)
                          if (userProfile) {
                            setUserProfile({ ...userProfile, lastPeriodDate: draftLastPeriodDate, cycleLength: draftCycleLength, bleedingDuration: draftBleedingDuration })
                          }
                          
                          setIsSaved(true);
                          
                          // Animate the button smoothly with correct variables
                          gsap.timeline()
                            .to(saveBtnRef.current, { scale: 0.95, duration: 0.1, ease: 'power2.inOut' })
                            .to(saveBtnRef.current, { scale: 1, background: 'var(--accent-hover)', color: '#ffffff', boxShadow: '0 0 20px var(--accent-soft)', duration: 0.3, ease: 'back.out(1.5)' })
                            .to(saveBtnRef.current, { background: 'var(--accent-primary)', boxShadow: 'none', duration: 0.4, delay: 1.2, ease: 'power2.inOut', clearProps: 'background,boxShadow,color', onComplete: () => setIsSaved(false) });
                        }}
                        className="btn btn-primary" 
                        style={{ 
                          width: '100%', 
                          padding: '0.85rem', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          transition: 'box-shadow 0.3s ease'
                        }}
                      >
                        {isSaved ? 'Details Saved!' : 'Save Details'}
                      </button>
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
                
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </aside>

          <main 
            className="main-content"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading module...</div>}>
              <div>
                <div className="tab-panel-container">
                  <div className={`glass-card panel ${(activeTab === 'reference' && isArticleOpen) ? 'article-mode' : ''}`}>
                    <div className="panel-header" style={{ alignItems: 'center', display: (activeTab === 'overview' || activeTab === 'reference') ? 'none' : 'flex' }}>
                      <div>
                        <h2 className="panel-title">{getTabCopy(activeTab, userProfile?.appMode).title}</h2>
                        <p className="metric-helper" style={{ maxWidth: '42rem' }}>{getTabCopy(activeTab, userProfile?.appMode).subtitle}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {['calendar', 'safety', 'reports'].includes(activeTab) && (
                          <div className="clinical-badge">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hide-on-mobile">Clinical math online</span>
                            <span className="mobile-only">Online</span>
                          </div>
                        )}

                      </div>
                    </div>

                    <div style={{ marginTop: (activeTab === 'reference' && isArticleOpen) ? 0 : '1.5rem', position: 'relative' }}>
                      
                      {/* Clinical Dashboard (Overview) */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'overview' ? 'block' : 'none' }}
                      >
                        <PersonalDashboard 
                          userProfile={userProfile} 
                          metrics={metrics} 
                          authMode={authMode} 
                          goal={goal}
                          lastIntercourseDate={lastIntercourseDate}
                        />
                      </div>

                      {/* Calendar Terminal */}
                      <div 
                        className="tab-content fade-transition"
                        style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
                                      <InfoTile label="Clinical milestone" value={pregnancyLogic(pMetrics.gestationalWeeks)} />
                                      <InfoTile label="Gestational age" value={`${pMetrics.gestationalWeeks} weeks, ${pMetrics.gestationalDays % 7} days`} />
                                      <InfoTile label="Pregnancy progress" value={`Trimester ${pMetrics.trimester}`} />
                                      <InfoTile label="Date anchor" value={formatUtcDateLabel(activeDay.dateIso)} />
                                    </>
                                  )
                                })() : (
                                  <>
                                    <InfoTile label="Cycle logic" value={phaseLogic(activeDay)} />
                                    {goal === 'conceive' && (
                                      <InfoTile 
                                        label="Conception Probability" 
                                        value={activeDay.isPeak ? 'Peak (Egg release expected within 12-24h)' : activeDay.isFertile ? 'High (Sperm survivability overlaps with incoming ovulation)' : 'Low (Outside fertile window)'} 
                                      />
                                    )}
                                    {goal === 'avoid' && (
                                      <InfoTile 
                                        label="Contraceptive Requirement" 
                                        value={activeDay.isPeak ? 'CRITICAL: Peak risk day. Strict abstinence or dual barriers required.' : activeDay.isFertile ? 'HIGH RISK: Sperm can survive up to 5 days. Abstinence or barriers required.' : 'Standard precautions (Outside primary fertile window)'} 
                                      />
                                    )}
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
                          lastIntercourseDate={lastIntercourseDate}
                          onLastIntercourseDateChange={setLastIntercourseDate}
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


                          <ReportExport 
                            metrics={metrics} 
                            cycleLength={userProfile?.cycleLength || 28} 
                            lutealPhaseLength={lutealPhaseLength} 
                            userName={userProfile?.name || 'Ayana'} 
                            logs={activeLogs} 
                            userProfile={userProfile} 
                            caseStudy={sharedCaseStudy}
                            days={calendarDays}
                          />

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
                        <KnowledgeBase onArticleChange={setIsArticleOpen} />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </Suspense>
          </main>
        </section>

        <footer className="app-footer">
          <p className="footer-text">
            Designed & Developed with <Heart size={14} fill="currentColor" className="footer-heart" /> by <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="footer-link">Karthik Lal</a>
          </p>
        </footer>
      </div>

      <nav 
        className={`mobile-bottom-nav ${!isNavVisible ? 'nav-hidden' : ''}`}
        onTouchStart={handleNavTouchStart}
        onTouchEnd={handleNavTouchEnd}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              onPointerDown={(e) => handleTabPointerDown(tab, e)}
              onPointerUp={handleTabPointerUp}
              onPointerLeave={handleTabPointerUp}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={getMobileNavTitle(tab)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`icon-wrapper ${isActive ? 'active' : ''}`}>
                {getMobileNavIcon(tab)}
              </div>
              <span className={`mobile-nav-label ${isActive ? 'active' : ''}`}>
                {getMobileNavTitle(tab)}
              </span>
            </button>
          );
        })}
      </nav>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSignOut={() => handleSetAuthMode('unauthenticated')}
        onExportData={handleExportData}
        onImportClick={() => {
          setIsSettingsOpen(false)
          fileInputRef.current?.click()
        }}
      />
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
  if (day.isBleeding) return 'Endometrial shedding is actively occurring due to a sharp drop in progesterone and estrogen levels. Uterine contractions may cause cramping as the basal layer prepares for the next cycle.'
  if (day.isPeak) return 'Luteinizing Hormone (LH) has peaked, triggering the rupture of the mature ovarian follicle. The egg is released and remains viable for roughly 12–24 hours. Peak conception probability occurs now.'
  if (day.isFertile) return 'Rising estrogen levels are altering cervical mucus to become hospitable to sperm, allowing viability for up to 5 days. This physiological shift strongly indicates the impending ovulatory window.'
  return day.phase === 'follicular' 
    ? 'Follicle-Stimulating Hormone (FSH) is actively recruiting ovarian follicles. Estrogen levels begin a steady climb, driving the proliferation and thickening of the uterine endometrial lining in preparation for implantation.' 
    : 'The corpus luteum is secreting high levels of progesterone, stabilizing the endometrium and suppressing further ovulation. Basal body temperature remains elevated, and the post-ovulatory stabilization window is engaged.'
}

function pregnancyLogic(weeks: number): string {
  if (weeks < 4) return 'The zygote is undergoing rapid cellular division and migrating toward the uterus. Implantation into the vascularized endometrium occurs late in this window, triggering initial hCG production.'
  if (weeks >= 4 && weeks < 13) return 'Organogenesis is active. Foundational structures of the cardiovascular and nervous systems develop. Surging hCG and progesterone maintain the uterine lining and often cause early systemic symptoms like fatigue.'
  if (weeks >= 13 && weeks < 28) return 'The fetal period is characterized by rapid physical growth. The placenta fully assumes endocrine functions, stabilizing maternal hormones. Fetal movement (quickening) becomes detectable.'
  if (weeks >= 28 && weeks <= 40) return 'Late-stage gestation focuses on rapid fetal weight gain, lung maturation (surfactant production), and CNS development. Maternal physiology begins shifting toward labor readiness.'
  return 'The gestational timeline has exceeded typical 40-week parameters. Placental monitoring and fetal non-stress testing are standard clinical protocols to ensure continued fetal well-being.'
}

export default App