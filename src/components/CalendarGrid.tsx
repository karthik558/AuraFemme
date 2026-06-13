import { useState, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Star, Droplet, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import type { CycleDayInfo, UserProfile } from '../types'
import { formatUtcDateLabel, buildPregnancyMetrics, toUtcIso, parseUtcIso } from '../utils/calculator'
import './CalendarGrid.css'

interface CalendarGridProps {
  days: CycleDayInfo[]
  selectedDay: CycleDayInfo | null
  onSelectDay: (day: CycleDayInfo) => void
  userProfile?: UserProfile | null
  draftLastPeriodDate?: string
}

const phaseClasses: Record<CycleDayInfo['phase'], string> = {
  menstruation: 'phase-menstruation',
  follicular: 'phase-follicular',
  ovulation: 'phase-ovulation',
  luteal: 'phase-luteal',
}

const phaseLabel: Record<CycleDayInfo['phase'], string> = {
  menstruation: 'Menstruation',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
}

export function CalendarGrid({ days, selectedDay, onSelectDay, userProfile, draftLastPeriodDate }: CalendarGridProps) {
  const isPregnancyMode = userProfile?.appMode === 'pregnancy'
  const gridRef = useRef<HTMLDivElement>(null)

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDay ? parseUtcIso(selectedDay.dateIso) : new Date()
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  })

  const nextMonth = () => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)))
  const prevMonth = () => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)))
    
    const todayIso = toUtcIso(today)
    const todayInfo = days.find(d => d.dateIso === todayIso)
    if (todayInfo) {
      onSelectDay(todayInfo)
    }
  }

  const calendarCells = useMemo(() => {
    const year = currentMonth.getUTCFullYear()
    const month = currentMonth.getUTCMonth()
    
    const firstDay = new Date(Date.UTC(year, month, 1))
    const startingDayOfWeek = firstDay.getUTCDay()
    
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    
    const cells = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push({ isPadding: true, key: `pad-start-${i}` })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateIso = toUtcIso(new Date(Date.UTC(year, month, i)))
      const dayInfo = days.find(d => d.dateIso === dateIso)
      cells.push({ isPadding: false, dateNumber: i, dateIso, dayInfo, key: dateIso })
    }
    
    const totalCells = cells.length
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    for (let i = 0; i < remainingCells; i++) {
      cells.push({ isPadding: true, key: `pad-end-${i}` })
    }
    
    return cells
  }, [currentMonth, days])

  const monthLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(currentMonth)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useGSAP(() => {
    if (calendarCells.length > 0) {
      gsap.fromTo('.calendar-day-cell:not(.padding)',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, stagger: 0.01, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, { scope: gridRef, dependencies: [currentMonth, days] });

  return (
    <section className="glass-card calendar-grid-section">
      <div className="calendar-header">
        <div className="calendar-legend-glass">
          {isPregnancyMode ? (
            <>
              <LegendDot label="Trimester 1" color="#f472b6" />
              <LegendDot label="Trimester 2" color="#c084fc" />
              <LegendDot label="Trimester 3" color="#38bdf8" />
            </>
          ) : (
            <>
              <LegendDot label="Bleeding" color="#f43f5e" />
              <LegendDot label="Follicular" color="#06b6d4" />
              <LegendDot label="Fertile" color="#f59e0b" />
              <LegendDot label="Luteal" color="#d946ef" />
            </>
          )}
        </div>

        <div className="calendar-nav-wrapper">
          <div className="calendar-nav-pill">
            <button className="nav-btn" onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={20} /></button>
            <h2 className="calendar-month-label">{monthLabel}</h2>
            <button className="nav-btn" onClick={nextMonth} aria-label="Next month"><ChevronRight size={20} /></button>
          </div>
          <button className="btn-today" onClick={goToToday} aria-label="Go to today">
            <CalendarIcon size={16} />
            <span className="hide-on-mobile">Today</span>
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrapper" ref={gridRef}>
        <div className="calendar-weekdays">
          {weekdays.map(day => (
            <div key={day} className="weekday-label">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days-grid">
          {calendarCells.map((cell) => {
            if (cell.isPadding) {
              return <div key={cell.key} className="calendar-day-cell padding" />
            }

            const day = cell.dayInfo
            const active = selectedDay?.dateIso === cell.dateIso

            if (!day) {
              // Day with no data
              return (
                <div key={cell.key} className={`calendar-day-cell empty ${active ? 'active' : ''}`}>
                  <span className="day-number-small">{cell.dateNumber}</span>
                </div>
              )
            }

            let cardClass = phaseClasses[day.phase]
            let pregnancyWeeks = 0
            
            if (isPregnancyMode && (draftLastPeriodDate || userProfile?.lastPeriodDate)) {
              const pMetrics = buildPregnancyMetrics(draftLastPeriodDate || userProfile!.lastPeriodDate, day.dateIso)
              cardClass = `phase-trimester-${pMetrics.trimester}`
              pregnancyWeeks = pMetrics.gestationalWeeks
            }

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`calendar-day-cell ${cardClass} ${active ? 'active' : ''}`}
                title={`${formatUtcDateLabel(day.dateIso)} - ${day.phaseLabel}`}
              >
                <div className="cell-top">
                  <span className="day-number-small">{cell.dateNumber}</span>
                  <span className="cycle-day-badge">
                    {isPregnancyMode ? `${pregnancyWeeks}w` : `Day ${day.cycleDay}`}
                  </span>
                </div>
                
                <div className="cell-content">
                  <div className="day-phase-indicator">
                    <span className="day-phase-text">{phaseLabel[day.phase] || day.phaseLabel}</span>
                  </div>
                  <div className="day-icons-small">
                    {!isPregnancyMode && day.isPeak ? (
                      <Star className="day-icon-star" fill="currentColor" />
                    ) : !isPregnancyMode && day.isFertile ? (
                      <div className="day-icon-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                    ) : !isPregnancyMode && day.isBleeding ? (
                      <Droplet className="day-icon-drop" fill="currentColor" />
                    ) : (
                      <div className="day-icon-empty" />
                    )}
                  </div>
                </div>
                {active && <div className="cell-active-glow"></div>}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="legend-badge">
      <div className="legend-badge-dot" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      <span>{label}</span>
    </div>
  )
}
