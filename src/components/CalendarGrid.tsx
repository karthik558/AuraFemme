import { motion } from 'framer-motion'
import { CalendarDays, Dot, Star } from 'lucide-react'
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
          <LegendDot label="Bleeding" className="bg-red" />
          <LegendDot label="Follicular" className="bg-cyan" />
          <LegendDot label="Fertile" className="bg-amber" />
          <LegendDot label="Luteal" className="bg-fuchsia" />
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`calendar-day-btn ${phaseClasses[day.phase]} ${active ? 'active' : ''}`}
            >
              <div className="day-hover-overlay" />
              <div className="day-content-top">
                <div>
                  <p className="day-number">Day {day.cycleDay}</p>
                  <h3 className="day-phase-title">{phaseLabel[day.phase]}</h3>
                  <p className="day-date">{formatUtcDateLabel(day.dateIso)}</p>
                </div>
                {day.isPeak ? <Star className="day-icon" /> : day.isFertile ? <Dot className="day-icon" /> : null}
              </div>
              <div className="day-content-bottom">
                <span>{day.isBleeding ? 'Bleeding' : day.isFertile ? 'Fertile' : 'Stable'}</span>
                <span className="day-tag">
                  {day.isPeak ? 'Peak' : day.phaseLabel}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

function LegendDot({ label, className }: { label: string; className: string }) {
  return (
    <span className="legend-dot-wrap">
      <span className={`legend-color-dot ${className}`} />
      {label}
    </span>
  )
}
