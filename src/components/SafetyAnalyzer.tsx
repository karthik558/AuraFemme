import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRightLeft, Radar, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CaseStudyResult } from '../types'
import { buildCaseStudyResult, clampNumber, formatUtcDateLabel, utcTodayIso } from '../utils/calculator'
import { DateTriplet } from './DateTriplet'
import './SafetyAnalyzer.css'

interface SafetyAnalyzerProps {
  lastPeriodDate: string
  onLastPeriodDateChange: (date: string) => void
  cycleLength: number
  onCycleLengthChange: (length: number) => void
  lutealPhaseLength: number
  onLutealPhaseLengthChange: (length: number) => void
  onExport: (result: CaseStudyResult) => void
}

const toneClasses = {
  neutral: 'tone-neutral',
  info: 'tone-info',
  warning: 'tone-warning',
  danger: 'tone-danger',
  success: 'tone-success',
} as const

const riskStyles: Record<'elevated' | 'low' | 'negligible', string> = {
  elevated: 'risk-elevated',
  low: 'risk-low',
  negligible: 'risk-negligible',
}

export function SafetyAnalyzer({
  lastPeriodDate,
  onLastPeriodDateChange,
  cycleLength,
  onCycleLengthChange,
  lutealPhaseLength,
  onLutealPhaseLengthChange,
  onExport,
}: SafetyAnalyzerProps) {
  const [intercourseDate, setIntercourseDate] = useState(() => utcTodayIso())

  const result = useMemo(
    () =>
      buildCaseStudyResult({
        lastPeriodDate,
        intercourseDate,
        cycleLength,
        lutealPhaseLength,
      }),
    [lastPeriodDate, intercourseDate, cycleLength, lutealPhaseLength],
  )

  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const isMobile = window.innerWidth < 768;
    gsap.fromTo('.timeline-item',
      { opacity: 0, y: isMobile ? 15 : 8 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', willChange: 'opacity, transform' }
    );
  }, { scope: listRef, dependencies: [result] });

  return (
    <section className="analyzer-grid">

      <div className="glass-card analyzer-panel">

        <div className="controls-grid" style={{ marginTop: '0' }}>
          <DateTriplet
            label="Last period date"
            value={lastPeriodDate}
            onChange={onLastPeriodDateChange}
            helper="The cycle baseline used for the model."
          />
          <DateTriplet
            label="Intercourse date"
            value={intercourseDate}
            onChange={setIntercourseDate}
            helper="Event being evaluated against the fertile window."
          />
          <RangeField
            label="Cycle length"
            value={cycleLength}
            min={21}
            max={40}
            onChange={onCycleLengthChange}
            unit="days"
          />
          <RangeField
            label="Luteal phase"
            value={lutealPhaseLength}
            min={10}
            max={18}
            onChange={onLutealPhaseLengthChange}
            unit="days"
          />
        </div>

        <div className={`risk-badge-pill ${riskStyles[result.riskLevel]}`}>
          <span className="risk-pill-label">Safety Risk Assessment:</span>
          <span className="risk-pill-value">{result.riskLabel}</span>
        </div>

        <div className="summary-box">
          <div className="summary-inner">
            <div>
              <p className="summary-title">Timeline summary</p>
              <p className="summary-value">{result.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => onExport(result)}
              className="btn btn-primary"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Generate Clinical Safety Report
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card analyzer-panel">
        <div className="analyzer-header" style={{ alignItems: 'center' }}>
          <div className="analyzer-title-wrap">
            <p className="analyzer-subtitle">
              <Radar className="analyzer-icon" />
              Biological timeline
            </p>
            <h3 className="analyzer-title" style={{ fontSize: '1.25rem' }}>Step-by-step assessment</h3>
          </div>
          <div className="confidence-badge">
            Confidence {Math.round(result.confidence * 100)}%
          </div>
        </div>

        <div className="timeline-list" ref={listRef}>
          {result.timeline.map((item, index) => (
            <article
              key={item.title}
              className="timeline-item"
            >
              <div className="timeline-item-header">
                <div>
                  <p className="timeline-step">
                    {index + 1}. {item.title}
                  </p>
                  <p className="timeline-date">{formatUtcDateLabel(item.dateIso)}</p>
                  <p className="timeline-day">Cycle day {item.cycleDay}</p>
                </div>
                <span className={`timeline-tone ${toneClasses[item.tone]}`}>
                  {item.tone}
                </span>
              </div>
              <p className="timeline-detail">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="model-inputs">
          <div className="model-inputs-title">
            <Settings2 className="analyzer-icon" />
            Model inputs
          </div>
          <dl className="model-inputs-grid">
            <Metric label="Ovulation day" value={`Day ${result.ovulationDay}`} />
            <Metric label="Fertile window" value={`Day ${result.fertileWindowStart} - ${result.fertileWindowEnd}`} />
            <Metric label="Intercourse day" value={`Day ${result.intercourseCycleDay}`} />
            <Metric label="Days before ovulation" value={`${result.daysBeforeOvulation} days`} />
          </dl>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="input-metric">
      <dt className="input-metric-label">{label}</dt>
      <dd className="input-metric-value">{value}</dd>
    </div>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="control-field">
      <div className="range-header">
        <span className="control-label">{label}</span>
        <span className="range-value">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
      />
      <div className="range-footer">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </label>
  )
}
