import { motion } from 'framer-motion'
import { CalendarDays, Star } from 'lucide-react'
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
      <div className="calendar-header">
        <div className="calendar-title-wrap">
          <p className="calendar-subtitle">
            <CalendarDays className="calendar-icon" />
            Interactive medical calendar
          </p>
          <h2 className="calendar-title">Cycle phase grid</h2>
        </div>
        <div className="calendar-legend">
          <LegendDot label="Bleeding" color="#f43f5e" />
          <LegendDot label="Follicular" color="#06b6d4" />
          <LegendDot label="Fertile" color="#f59e0b" />
          <LegendDot label="Luteal" color="#d946ef" />
        </div>
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const active = selectedDay?.cycleDay === day.cycleDay

          return (
            <motion.button
              key={day.cycleDay}
              type="button"
              onClick={() => onSelectDay(day)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: index * 0.015 }}
              className={`calendar-day-btn ${phaseClasses[day.phase]} ${active ? 'active' : ''}`}
            >
              <div className="day-circle">
                <span className="day-number">{day.cycleDay}</span>
              </div>
              
              <div>
                <p className="day-date">{formatUtcDateLabel(day.dateIso)}</p>
                <h3 className="day-phase-title">{phaseLabel[day.phase]}</h3>
                
                <div className="day-icons">
                  {day.isPeak ? (
                    <Star className="day-icon-star" fill="currentColor" />
                  ) : day.isFertile ? (
                    <div className="day-icon-dot" style={{ color: '#f59e0b' }} />
                  ) : day.isBleeding ? (
                    <div className="day-icon-dot" style={{ color: '#f43f5e' }} />
                  ) : null}
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
    <span className="legend-dot-wrap">
      <span className="legend-color-dot" style={{ color }} />
      {label}
    </span>
  )
}
