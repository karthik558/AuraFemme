import { CalendarPlus, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { DailyLog } from '../types'
import { formatUtcDateLabel } from '../utils/calculator'
import './DailyLogEditor.css'

interface DailyLogEditorProps {
  dateIso: string
  existingLog: DailyLog | null
  onSave: (log: DailyLog) => void
  onDelete?: () => void
  onClose: () => void
  isGuest?: boolean
  userProfile?: import('../types').UserProfile | null
}

const SYMPTOMS = ['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Spotting', 'Tender Breasts', 'Acne', 'Nausea', 'Unprotected Intercourse', 'Protected Intercourse']
const PREGNANCY_SYMPTOMS = ['Morning Sickness', 'Fatigue', 'Baby Kicks', 'Cravings', 'Heartburn', 'Backache', 'Frequent Urination', 'Prenatal Vitamins', 'Folic Acid']
const MOODS = ['Calm', 'Happy', 'Energetic', 'Anxious', 'Sad', 'Irritable', 'Sensitive']

export function DailyLogEditor({ dateIso, existingLog, onSave, onDelete, onClose, isGuest, userProfile }: DailyLogEditorProps) {
  const [symptoms, setSymptoms] = useState<string[]>(existingLog?.symptoms || [])
  const [mood, setMood] = useState<string | null>(existingLog?.mood || null)
  const [notes, setNotes] = useState(existingLog?.notes || '')

  useEffect(() => {
    setSymptoms(existingLog?.symptoms || [])
    setMood(existingLog?.mood || null)
    setNotes(existingLog?.notes || '')
  }, [dateIso, existingLog])

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) => (prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]))
  }

  const handleSave = () => {
    onSave({
      dateIso,
      symptoms,
      mood,
      notes,
    })
    onClose()
  }

  return (
    <div className="glass-card log-editor-panel">
      <div className="log-header">
        <div>
          <h3 className="log-title">
            <CalendarPlus className="log-icon" /> Log Entry
          </h3>
          <p className="log-date">{formatUtcDateLabel(dateIso)}</p>
        </div>
        <button onClick={onClose} className="log-close-btn" aria-label="Close editor">
          <X size={20} />
        </button>
      </div>

      <div className="log-section">
        <p className="log-label">{userProfile?.appMode === 'pregnancy' ? 'Pregnancy Tracking' : 'Physical Symptoms'}</p>
        <div className="chip-group">
          {(userProfile?.appMode === 'pregnancy' ? PREGNANCY_SYMPTOMS : SYMPTOMS).map((sym) => (
            <button
              key={sym}
              type="button"
              className={`chip ${symptoms.includes(sym) ? 'chip-active' : ''}`}
              onClick={() => toggleSymptom(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="log-section">
        <p className="log-label">Mood</p>
        <div className="chip-group">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${mood === m ? 'chip-active' : ''}`}
              onClick={() => setMood(m === mood ? null : m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="log-section">
        <p className="log-label">Personal Notes</p>
        <textarea
          className="log-textarea"
          placeholder="How are you feeling today?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

        <div className="log-editor-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          {existingLog && onDelete && (
            <button 
              className="btn btn-outline" 
              style={{ color: 'var(--tone-danger)', borderColor: 'rgba(197, 34, 51, 0.3)' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this log?")) {
                  onDelete()
                  onClose()
                }
              }}
              disabled={isGuest}
            >
              <Trash2 size={16} />
              Delete Log
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isGuest}>
            {isGuest ? 'Guest Users Cannot Save' : 'Save Log'}
          </button>
        </div>
    </div>
  )
}
