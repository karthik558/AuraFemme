import { CalendarDays } from 'lucide-react';
import { daysInUtcMonth, formatUtcDateLabel, monthNames, splitUtcIso, toUtcIso } from '../utils/calculator';

export function SelectField({ value, options, onChange }: { value: number; options: Array<{ value: number; label: string }>; onChange: (val: number) => void }) {
  return (
    <div className="select-wrapper">
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="custom-select">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

export function DateTriplet({ value, onChange, label = "Date", helper }: { value: string; onChange: (nextIso: string) => void; label?: string; helper?: string }) {
  const { year, month, day } = splitUtcIso(value)
  const yearOptions = Array.from({ length: 12 }, (_, i) => new Date().getUTCFullYear() - 5 + i)
  const dayOptions = daysInUtcMonth(year, month)

  return (
    <div className="field-group">
      <div className="field-header" style={{ justifyContent: 'flex-start' }}>
        <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span className="field-label">{label}</span>
      </div>
      <div className="date-triplet-grid">
        <SelectField value={year} onChange={(y) => onChange(toUtcIso(new Date(Date.UTC(y, month - 1, Math.min(day, daysInUtcMonth(y, month))))))} options={yearOptions.map(i => ({ value: i, label: String(i) }))} />
        <SelectField value={month} onChange={(m) => onChange(toUtcIso(new Date(Date.UTC(year, m - 1, Math.min(day, daysInUtcMonth(year, m))))))} options={monthNames.map((n, i) => ({ value: i + 1, label: n }))} />
        <SelectField value={day} onChange={(d) => onChange(toUtcIso(new Date(Date.UTC(year, month - 1, d))))} options={Array.from({ length: dayOptions }, (_, i) => i + 1).map(i => ({ value: i, label: String(i) }))} />
      </div>
      <p className="field-helper">{helper || formatUtcDateLabel(value)}</p>
    </div>
  )
}
