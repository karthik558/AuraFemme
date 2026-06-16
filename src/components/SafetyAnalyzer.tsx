import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRightLeft, Settings2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useMemo } from 'react'
import type { CaseStudyResult } from '../types'
import { buildCaseStudyResult, clampNumber, formatUtcDateLabel } from '../utils/calculator'
import { DateTriplet } from './DateTriplet'
import './SafetyAnalyzer.css'

interface SafetyAnalyzerProps {
  lastPeriodDate: string
  onLastPeriodDateChange: (date: string) => void
  cycleLength: number
  onCycleLengthChange: (length: number) => void
  lutealPhaseLength: number
  onLutealPhaseLengthChange: (length: number) => void
  lastIntercourseDate: string
  onLastIntercourseDateChange: (date: string) => void
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
  lastIntercourseDate,
  onLastIntercourseDateChange,
  onExport,
}: SafetyAnalyzerProps) {

  const result = useMemo(
    () =>
      buildCaseStudyResult({
        lastPeriodDate,
        intercourseDate: lastIntercourseDate,
        cycleLength,
        lutealPhaseLength,
      }),
    [lastPeriodDate, lastIntercourseDate, cycleLength, lutealPhaseLength],
  )

  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const isMobile = window.innerWidth < 768;
    if (listRef.current && listRef.current.querySelectorAll('.timeline-item').length > 0) {
      gsap.fromTo('.timeline-item',
        { opacity: 0, y: isMobile ? 15 : 8 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', willChange: 'opacity, transform' }
      );
    }
  }, { scope: listRef, dependencies: [result] });

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 1; i <= cycleLength; i++) {
      let riskVal = 0;
      if (i >= result.fertileWindowStart && i <= result.fertileWindowEnd) {
        riskVal = i === result.ovulationDay ? 100 : 75; // Peak at ovulation
        if (i < result.ovulationDay) {
          riskVal = 40 + ((i - result.fertileWindowStart) / (result.ovulationDay - result.fertileWindowStart)) * 60;
        } else {
          riskVal = 100 - ((i - result.ovulationDay) / (result.fertileWindowEnd - result.ovulationDay + 1)) * 60;
        }
      } else if (i === result.fertileWindowStart - 1 || i === result.fertileWindowEnd + 1) {
        riskVal = 15;
      } else if (i >= result.fertileWindowStart - 3 && i < result.fertileWindowStart - 1) {
        riskVal = 5;
      }
      data.push({
        day: i,
        Risk: Math.round(riskVal)
      });
    }
    return data;
  }, [cycleLength, result]);

  return (
    <section className="analyzer-grid">

      <div className="glass-card analyzer-panel">

        <div className="controls-grid" style={{ marginTop: '0' }}>
          <DateTriplet
            label="Last period date"
            value={lastPeriodDate}
            onChange={onLastPeriodDateChange}
            helper="Baseline for all calculations"
          />
          <DateTriplet
            label="Last intercourse date"
            value={lastIntercourseDate}
            onChange={onLastIntercourseDateChange}
            helper="Risk level relative to this date"
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
          <div className="risk-pill-label" style={{ marginBottom: '0.25rem', opacity: 0.7 }}>SAFETY RISK ASSESSMENT</div>
          <div className="risk-pill-value">{result.riskLabel}</div>
          <p className="risk-pill-desc">Based on current inputs, the theoretical risk of fertilization is {result.riskLevel}.</p>
        </div>

        <div className="summary-box">
          <div className="summary-inner" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p className="summary-title" style={{ marginBottom: '0.5rem' }}>Timeline summary</p>
              <p className="summary-value" style={{ lineHeight: 1.6, display: 'block' }}>{result.summary}</p>
            </div>
            
            <div style={{ width: '100%', height: '200px', minWidth: 0, minHeight: 0, marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={result.riskLevel === 'elevated' ? '#ef4444' : result.riskLevel === 'low' ? '#f59e0b' : '#10b981'} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={result.riskLevel === 'elevated' ? '#ef4444' : result.riskLevel === 'low' ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Day ${val}`} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--text-strong)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                  />
                  <Area type="monotone" dataKey="Risk" name="Risk Level" stroke={result.riskLevel === 'elevated' ? '#ef4444' : result.riskLevel === 'low' ? '#f59e0b' : '#10b981'} strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                  <ReferenceLine x={result.intercourseCycleDay} stroke="var(--text-strong)" strokeWidth={2} strokeDasharray="4 4" label={{ position: 'top', value: 'Intercourse', fill: 'var(--text-strong)', fontSize: 12, fontWeight: 600 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={() => onExport(result)}
                className="btn btn-primary"
              >
                <ArrowRightLeft size={18} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card analyzer-panel">
        <div className="analyzer-header" style={{ alignItems: 'flex-start', borderBottom: 'none', paddingBottom: 0, marginBottom: '1.5rem' }}>
          <div className="analyzer-title-wrap">
            <h3 className="analyzer-title" style={{ fontSize: '1.25rem' }}>Biological Timeline</h3>
            <p className="analyzer-subtitle" style={{ letterSpacing: 'normal', textTransform: 'none', fontSize: '0.9rem', color: 'var(--text-strong)', marginTop: '0.25rem' }}>
              Step-by-step assessment
            </p>
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
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <label className="control-field">
      <div className="range-header">
        <span className="control-label">{label}</span>
        <span className="slider-value-badge">
          {value} {unit}
        </span>
      </div>
      <div className="slider-track-wrapper">
        <div className="slider-track-bg">
          <div className="slider-track-fill" style={{ width: `${percent}%` }} />
        </div>
        <input
          type="range"
          className="slider-input"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
        />
      </div>
      <div className="slider-range-labels">
        <span>{min} {unit}</span>
        <span>{max}</span>
      </div>
    </label>
  )
}
