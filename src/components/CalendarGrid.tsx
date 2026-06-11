import { motion } from 'framer-motion'
import { CalendarDays, Star, Droplet } from 'lucide-react'
import type { CycleDayInfo } from '../types'
import { formatUtcDateLabel } from '../utils/calculator'
import './CalendarGrid.css'

interface CalendarGridProps {
  days: CycleDayInfo[]
  selectedDay: CycleDayInfo | null
  onSelectDay: (day: CycleDayInfo) => void
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

export function CalendarGrid({ days, selectedDay, onSelectDay }: CalendarGridProps) {
  return (
    <section className="glass-card calendar-grid-section">

      <div className="calendar-legend-glass" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
        <LegendDot label="Bleeding" color="#f43f5e" />
        <LegendDot label="Follicular" color="#06b6d4" />
        <LegendDot label="Fertile" color="#f59e0b" />
        <LegendDot label="Luteal" color="#d946ef" />
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const active = selectedDay?.cycleDay === day.cycleDay

          return (
            <motion.button
              key={day.cycleDay}
              type="button"
              onClick={() => onSelectDay(day)}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.02 }}
              className={`calendar-day-card ${phaseClasses[day.phase]} ${active ? 'active' : ''}`}
            >
              <div className="day-circle-wrap">
                <div className="day-circle">
                  <span className="day-number">{day.cycleDay}</span>
                </div>
                {active && <div className="day-circle-glow"></div>}
              </div>
              
              <div className="day-info-wrap">
                <p className="day-date">{formatUtcDateLabel(day.dateIso)}</p>
                <h3 className="day-phase-title">{phaseLabel[day.phase]}</h3>
                
                <div className="day-icons">
                  {day.isPeak ? (
                    <Star className="day-icon-star" fill="currentColor" />
                  ) : day.isFertile ? (
                    <div className="day-icon-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                  ) : day.isBleeding ? (
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
