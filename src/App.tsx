import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  MoonStar,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Target,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { CalendarGrid } from './components/CalendarGrid'
import { SafetyAnalyzer } from './components/SafetyAnalyzer'
import {
  addUtcDays,
  buildCalendarDays,
  buildCycleMetrics,
  clampNumber,
  daysInUtcMonth,
  formatUtcDateLabel,
  monthNames,
  splitUtcIso,
  toUtcIso,
  utcTodayIso,
} from './utils/calculator'
import type { CaseStudyResult, CycleDayInfo, CycleGoal, CycleInput, ThemeMode } from './types'
import './App.css'

type TabKey = 'overview' | 'calendar' | 'safety' | 'reports'

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
    title: 'Reports section',
    subtitle: 'Exports, summaries, and an executive view of the cycle data.',
  },
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
  const [symptomNotes, setSymptomNotes] = useState<Record<number, string>>({})
  const [sharedCaseStudy, setSharedCaseStudy] = useState<CaseStudyResult | null>(null)
  const [lastPeriodDate, setLastPeriodDate] = useState(() => addUtcDays(utcTodayIso(), -12))
  const [cycleLength, setCycleLength] = useState(28)
  const [bleedingDuration, setBleedingDuration] = useState(5)
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

  const selectedDayNote = activeDay ? symptomNotes[activeDay.cycleDay] ?? '' : ''
  const currentPhaseSentence = metrics.currentPhase === 'menstruation' ? 'Bleeding window'
      : metrics.currentPhase === 'follicular' ? 'Follicular build'
      : metrics.currentPhase === 'ovulation' ? 'Peak fertility window' : 'Luteal stabilization'

  const reportPhaseSplit = useMemo(() => [
      { label: 'Menstruation', value: bleedingDuration, tone: 'bg-red' },
      { label: 'Follicular', value: Math.max(0, metrics.fertileWindowStart - bleedingDuration - 1), tone: 'bg-cyan' },
      { label: 'Ovulation', value: Math.max(1, metrics.ovulationDay - metrics.fertileWindowStart + 1), tone: 'bg-amber' },
      { label: 'Luteal', value: Math.max(0, cycleLength - metrics.ovulationDay), tone: 'bg-fuchsia' },
    ], [bleedingDuration, cycleLength, metrics.fertileWindowStart, metrics.ovulationDay])

  function handleDatePartsChange(nextIso: string) {
    setLastPeriodDate(nextIso)
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="app-bg-glow" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="glass-card loading-card"
        >
          <div className="loading-icon">
            <Activity className="w-10 h-10" />
          </div>
          <p className="brand-text-sm" style={{ marginTop: '1.5rem' }}>Aura Femme</p>
          <h1 className="loading-title text-gradient">Clinical cycle intelligence</h1>
          <p className="loading-desc">
            Loading the phase model, calendar engine, and safety logic before the dashboard reveals the active cycle.
          </p>
          <div className="loading-steps">
            {['Cycle math', 'Phase overlay', 'Risk timeline'].map((label, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.08 }}
                className="loading-step"
              >
                {label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <div className="app-bg-glow" />
      <div className="app-container">
        <header className="glass-card app-header">
          <div className="header-content">
            <div className="header-brand">
              <h1 className="brand-title text-gradient">Aura Femme</h1>
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
        </header>

        <section className="main-layout">
          <aside className="sidebar animate-slide-up">
            <div className="glass-card panel">
              <div className="panel-header">
                <div>
                  <p className="panel-label">Biometric controller</p>
                  <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>Baseline parameters</h2>
                </div>
                <Target className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="panel-body">
                <DateTriplet value={lastPeriodDate} onChange={handleDatePartsChange} />

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

            <div className="glass-card panel">
              <div className="phase-summary highlight" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.125rem' }}>{advisory.icon}</div>
                <div>
                  <p className="panel-label">Goal advisory</p>
                  <h3 className="panel-title" style={{ fontSize: '1.125rem', marginTop: '0.5rem' }}>{advisory.title}</h3>
                  <p className="metric-helper" style={{ marginTop: '0.5rem' }}>{advisory.body}</p>
                </div>
              </div>
            </div>

            <div className="glass-card panel">
              <p className="panel-label">Clinical snapshot</p>
              <div className="snapshot-list" style={{ marginTop: '1rem' }}>
                <div className="snapshot-item">
                  <span>Current status</span>
                  <span className="snapshot-value">Day {metrics.cycleDay} of {metrics.cycleLength}</span>
                </div>
                <div className="snapshot-item">
                  <span>Phase</span>
                  <span className="snapshot-value">{metrics.currentPhaseLabel}</span>
                </div>
                <div className="snapshot-item">
                  <span>Ovulation</span>
                  <span className="snapshot-value">{metrics.ovulationCountdown === 0 ? 'Today' : `${metrics.ovulationCountdown} days`}</span>
                </div>
                <div className="snapshot-item">
                  <span>Next period</span>
                  <span className="snapshot-value">{metrics.isOverdue ? 'Due now' : `${metrics.nextPeriodCountdown} days`}</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="content-area animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <motion.section layout className="glass-card panel">
              <div className="metrics-grid">
                <MetricCard
                  label="Current status"
                  value={`Day ${metrics.cycleDay} of ${metrics.cycleLength}`}
                  helper={metrics.cycleStartIso === metrics.lastPeriodDate ? 'Current cycle anchor' : 'Rolled forward from baseline'}
                  icon={<Clock3 className="w-5 h-5" />}
                />
                <MetricCard label="Active phase" value={metrics.currentPhaseLabel} helper={currentPhaseSentence} icon={<CalendarDays className="w-5 h-5" />} />
                <MetricCard
                  label="Ovulation countdown"
                  value={metrics.ovulationCountdown === 0 ? 'Today' : `${metrics.ovulationCountdown} days`}
                  helper={`Peak release near day ${metrics.ovulationDay}`}
                  icon={<Sparkles className="w-5 h-5" />}
                />
                <MetricCard
                  label="Next expected period"
                  value={metrics.isOverdue ? 'Due now' : `${metrics.nextPeriodCountdown} days`}
                  helper={metrics.isOverdue ? 'Cycle window should be closing' : formatUtcDateLabel(metrics.nextPeriodIso)}
                  icon={<MoonStar className="w-5 h-5" />}
                />
              </div>
            </motion.section>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <div className="glass-card panel">
                  <div className="panel-header" style={{ alignItems: 'center' }}>
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

                  <div style={{ marginTop: '1.5rem' }}>
                    {activeTab === 'overview' && (
                      <div className="dashboard-content" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <div className="phase-summary highlight">
                          <p className="panel-label">Phase summary</p>
                          <h3 className="panel-title" style={{ fontSize: '1.25rem' }}>{metrics.currentPhaseLabel}</h3>
                          <p className="metric-helper">The current cycle anchor has been projected using UTC math to avoid locale shifts. The dashboard now reads the active cycle, fertile span, and period forecast as a unified model.</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                            <span className="badge">Fertile starts day {metrics.fertileWindowStart}</span>
                            <span className="badge">Ovulation day {metrics.ovulationDay}</span>
                            <span className="badge">Cycle length {metrics.cycleLength}</span>
                          </div>
                        </div>

                        <div className="phase-summary">
                          <p className="panel-label">Phase split</p>
                          <div className="progress-container" style={{ marginTop: '1rem', gap: '1rem' }}>
                            {reportPhaseSplit.map((segment) => (
                              <div key={segment.label}>
                                <div className="progress-header">
                                  <span className="field-label">{segment.label}</span>
                                  <span className="field-helper">{segment.value} days</span>
                                </div>
                                <div className="progress-track" style={{ marginTop: '0.25rem' }}>
                                  <div className={`progress-bar ${segment.tone}`} style={{ width: `${Math.max(8, (segment.value / cycleLength) * 100)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'calendar' && (
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

                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
                              <label className="field-group">
                                <span className="field-label">Symptom note</span>
                                <textarea
                                  value={selectedDayNote}
                                  onChange={(e) => setSymptomNotes(curr => ({ ...curr, [activeDay.cycleDay]: e.target.value }))}
                                  placeholder="Log mood shifts, cramps, discharge, etc."
                                  style={{ minHeight: '8rem', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-strong)', outline: 'none' }}
                                />
                              </label>
                            </div>
                          </section>
                        )}
                      </div>
                    )}

                    {activeTab === 'safety' && (
                      <SafetyAnalyzer initialCycleLength={cycleLength} initialLutealPhaseLength={lutealPhaseLength} onExport={(result) => { setSharedCaseStudy(result); setActiveTab('reports'); }} />
                    )}

                    {activeTab === 'reports' && (
                      <div className="dashboard-content">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div className="phase-summary">
                            <p className="panel-label">Reports</p>
                            <h3 className="panel-title" style={{ fontSize: '1.5rem' }}>Executive summary</h3>
                            <p className="metric-helper" style={{ marginTop: '0.75rem' }}>Consolidates cycle info, advisories, and exports.</p>
                            <div className="metrics-grid" style={{ marginTop: '1.5rem' }}>
                              <ReportStat label="Cycle phase" value={metrics.currentPhaseLabel} />
                              <ReportStat label="Fertile window" value={`${metrics.fertileWindowStart} - ${metrics.fertileWindowEnd}`} />
                              <ReportStat label="Next period" value={metrics.isOverdue ? 'Due' : `${metrics.nextPeriodCountdown} days`} />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div className="phase-summary">
                            <p className="panel-label">Exported case study</p>
                            {sharedCaseStudy ? (
                              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="badge">{sharedCaseStudy.riskLabel} Risk</div>
                                <div className="metric-helper">{sharedCaseStudy.summary}</div>
                              </div>
                            ) : (
                              <div className="metric-helper" style={{ marginTop: '1rem', fontStyle: 'italic' }}>No case study exported yet.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-helper">{helper}</p>
      </div>
      <div className="metric-icon">{icon}</div>
    </div>
  )
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="snapshot-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
      <p className="metric-label">{label}</p>
      <p className="metric-value" style={{ marginTop: 0 }}>{value}</p>
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
        <button key={option} type="button" onClick={() => onChange(option)} className={`theme-btn ${mode === option ? 'active' : ''}`}>
          {option === 'light' ? <SunMedium className="w-4 h-4" /> : option === 'dark' ? <MoonStar className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {themeModeLabels[option]}
        </button>
      ))}
    </div>
  )
}

function DateTriplet({ value, onChange }: { value: string; onChange: (nextIso: string) => void }) {
  const { year, month, day } = splitUtcIso(value)
  const yearOptions = Array.from({ length: 12 }, (_, i) => new Date().getUTCFullYear() - 5 + i)
  const dayOptions = daysInUtcMonth(year, month)

  return (
    <div className="field-group">
      <div className="field-header" style={{ justifyContent: 'flex-start' }}>
        <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span className="field-label">Last period start date</span>
      </div>
      <div className="date-triplet-grid">
        <SelectField value={year} onChange={(y) => onChange(toUtcIso(new Date(Date.UTC(y, month - 1, Math.min(day, daysInUtcMonth(y, month))))))} options={yearOptions.map(i => ({ value: i, label: String(i) }))} />
        <SelectField value={month} onChange={(m) => onChange(toUtcIso(new Date(Date.UTC(year, m - 1, Math.min(day, daysInUtcMonth(year, m))))))} options={monthNames.map((n, i) => ({ value: i + 1, label: n }))} />
        <SelectField value={day} onChange={(d) => onChange(toUtcIso(new Date(Date.UTC(year, month - 1, d))))} options={Array.from({ length: dayOptions }, (_, i) => i + 1).map(i => ({ value: i, label: String(i) }))} />
      </div>
      <p className="field-helper">{formatUtcDateLabel(value)}</p>
    </div>
  )
}

function SelectField({ value, options, onChange }: { value: number; options: Array<{ value: number; label: string }>; onChange: (val: number) => void }) {
  return (
    <div className="select-wrapper">
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="custom-select">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
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