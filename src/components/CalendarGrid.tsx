import { motion } from 'framer-motion'
import { Star, Droplet } from 'lucide-react'
import type { CycleDayInfo, UserProfile } from '../types'
import { formatUtcDateLabel, buildPregnancyMetrics } from '../utils/calculator'
import './CalendarGrid.css'

interface CalendarGridProps {
  days: CycleDayInfo[]
  selectedDay: CycleDayInfo | null
  onSelectDay: (day: CycleDayInfo) => void
  userProfile?: UserProfile | null
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

export function CalendarGrid({ days, selectedDay, onSelectDay, userProfile }: CalendarGridProps) {
  const isPregnancyMode = userProfile?.appMode === 'pregnancy'

  return (
    <section className="glass-card calendar-grid-section">

      <div className="calendar-legend-glass" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
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

      <div className="calendar-grid">
        {days.map((day, index) => {
          const active = selectedDay?.cycleDay === day.cycleDay

          let cardClass = phaseClasses[day.phase]
          let displayLabel = phaseLabel[day.phase]
          let pregnancyWeeks = 0
          
          if (isPregnancyMode && userProfile?.lastPeriodDate) {
            const pMetrics = buildPregnancyMetrics(userProfile.lastPeriodDate, day.dateIso)
            cardClass = `phase-trimester-${pMetrics.trimester}`
            displayLabel = `Trimester ${pMetrics.trimester}`
            pregnancyWeeks = pMetrics.gestationalWeeks
          }

          return (
            <motion.button
              key={day.cycleDay}
              type="button"
              onClick={() => onSelectDay(day)}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.02 }}
              className={`calendar-day-card ${cardClass} ${active ? 'active' : ''}`}
            >
              <div className="day-circle-wrap">
                <div className="day-circle">
                  <span className="day-number">{isPregnancyMode ? `${pregnancyWeeks}w` : day.cycleDay}</span>
                </div>
                {active && <div className="day-circle-glow"></div>}
              </div>
              
              <div className="day-info-wrap">
                <p className="day-date">{formatUtcDateLabel(day.dateIso)}</p>
                <h3 className="day-phase-title">{displayLabel}</h3>
                
                <div className="day-icons">
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
            </motion.button>
          )
        })}
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
