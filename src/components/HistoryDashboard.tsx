import { motion } from 'framer-motion'
import { CalendarClock, Trash2, Download, Upload } from 'lucide-react'
import { useMemo, useState, useRef } from 'react'
import type { DailyLog } from '../types'
import { formatUtcDateLabel } from '../utils/calculator'
import './HistoryDashboard.css'

interface HistoryDashboardProps {
  logs: Record<string, DailyLog>
  currentCycleStartIso: string
  onDeleteLog?: (dateIso: string) => void
  onExportData?: () => void
  onImportData?: (file: File) => void
  isGuest?: boolean
}

type FilterOption = 'all' | 'this_cycle' | 'last_7_days'

export function HistoryDashboard({ logs, currentCycleStartIso, onDeleteLog, onExportData, onImportData, isGuest }: HistoryDashboardProps) {
  const [filter, setFilter] = useState<FilterOption>('this_cycle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredLogs = useMemo(() => {
    const allLogs = Object.values(logs).sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    
    if (filter === 'all') return allLogs
    
    if (filter === 'this_cycle') {
      return allLogs.filter(log => log.dateIso >= currentCycleStartIso)
    }
    
    if (filter === 'last_7_days') {
      const today = new Date()
      today.setDate(today.getDate() - 7)
      const sevenDaysAgoIso = today.toISOString().split('T')[0]
      return allLogs.filter(log => log.dateIso >= sevenDaysAgoIso)
    }

    return allLogs
  }, [logs, filter, currentCycleStartIso])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImportData) {
      onImportData(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="history-dashboard animate-fade-in">
      <div className="history-header">
        <div className="history-title-row">
          <div className="history-title-wrap">
            <CalendarClock className="history-icon" />
            <h2 className="heading-primary" style={{ fontSize: '1.75rem', margin: 0 }}>Symptom History</h2>
          </div>
          
          <div className="history-actions">
            {onExportData && (
              <button 
                className="btn-icon" 
                onClick={onExportData} 
                title={isGuest ? 'Guests cannot export data' : 'Export JSON'}
                disabled={isGuest}
              >
                <Download size={18} />
              </button>
            )}
            {onImportData && (
              <>
                <button 
                  className="btn-icon" 
                  onClick={() => fileInputRef.current?.click()} 
                  title={isGuest ? 'Guests cannot import data' : 'Import JSON'}
                  disabled={isGuest}
                >
                  <Upload size={18} />
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        </div>
        
        <div className="history-segmented-control">
          <button 
            className={`segment-btn ${filter === 'last_7_days' ? 'active' : ''}`}
            onClick={() => setFilter('last_7_days')}
          >
            7 Days
          </button>
          <button 
            className={`segment-btn ${filter === 'this_cycle' ? 'active' : ''}`}
            onClick={() => setFilter('this_cycle')}
          >
            This Cycle
          </button>
          <button 
            className={`segment-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="history-feed">
        {filteredLogs.length === 0 ? (
          <div className="glass-card empty-state">
            <p className="empty-title">No logs found</p>
            <p className="empty-desc">You haven't recorded any symptoms or notes for this timeframe.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div 
              key={log.dateIso}
              className="glass-card history-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="history-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <p className="history-date">{formatUtcDateLabel(log.dateIso)}</p>
                  {log.mood && (
                    <span className="history-mood">Mood: {log.mood}</span>
                  )}
                </div>
                {onDeleteLog && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this log?')) {
                        onDeleteLog(log.dateIso)
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    aria-label="Delete log"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {log.symptoms.length > 0 && (
                <div className="history-symptoms">
                  {log.symptoms.map(sym => (
                    <span key={sym} className="history-sym-chip">{sym}</span>
                  ))}
                </div>
              )}

              {log.notes && (
                <p className="history-notes">{log.notes}</p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </section>
  )
}
