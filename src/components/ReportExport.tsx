import { useRef, useState, useMemo } from 'react';
import { Download, Activity, ListChecks, CalendarDays } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine } from 'recharts';
import type { CaseStudyResult, DailyLog, UserProfile, CycleDayInfo } from '../types';
import { buildPregnancyMetrics, formatUtcDateLabel } from '../utils/calculator';
import auraLogo from '../assets/icon-color.png';
import pregnancyLogo from '../assets/icon-color-purple.png';
import { useAppStore } from '../store';
import { t, languageNames } from '../utils/translations';
import type { SupportedLanguage } from '../utils/translations';

interface ReportExportProps {
  metrics: any;
  cycleLength: number;
  lutealPhaseLength: number;
  userName: string;
  caseStudy?: CaseStudyResult | null;
  logs?: Record<string, DailyLog>;
  userProfile?: UserProfile | null;
  days?: CycleDayInfo[];
}

export function ReportExport({ metrics, cycleLength, lutealPhaseLength, userName, caseStudy, logs = {}, userProfile, days = [] }: ReportExportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const accountId = useAppStore(state => state.accountId);

  // Configuration Toggles
  const [includeSafety, setIncludeSafety] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeHormone, setIncludeHormone] = useState(true);
  const [includeFullData, setIncludeFullData] = useState(false);

  const auraId = useMemo(() => {
    if (accountId && accountId !== 'guest') {
      let hash = 0;
      for (let i = 0; i < accountId.length; i++) {
        hash = (hash << 5) - hash + accountId.charCodeAt(i);
        hash = hash & hash;
      }
      return `AF-${Math.abs(hash).toString().substring(0, 4).padStart(4, '0')}`;
    }
    return 'AF-GUEST';
  }, [accountId]);

  // Group days into cycles
  const cycles = useMemo(() => {
    const cycleGroups: { startIso: string; days: CycleDayInfo[] }[] = [];
    let currentGroup: CycleDayInfo[] = [];
    
    for (const day of days) {
      if (day.cycleDay === 1) {
        if (currentGroup.length > 0) {
          cycleGroups.push({ startIso: currentGroup[0].dateIso, days: currentGroup });
        }
        currentGroup = [day];
      } else {
        if (currentGroup.length > 0) {
          currentGroup.push(day);
        }
      }
    }
    if (currentGroup.length > 0) {
      cycleGroups.push({ startIso: currentGroup[0].dateIso, days: currentGroup });
    }
    return cycleGroups;
  }, [days]);

  const currentCycleStart = metrics.cycleStartIso;
  const [selectedCycleIsos, setSelectedCycleIsos] = useState<string[]>([currentCycleStart]);

  const toggleCycle = (iso: string) => {
    setSelectedCycleIsos(prev => 
      prev.includes(iso) 
        ? prev.filter(i => i !== iso)
        : [...prev, iso]
    );
  };

  // Process logs
  const { totalLogs, frequentSymptoms, recentLogs } = useMemo(() => {
    const logArray = Object.values(logs).sort((a, b) => b.dateIso.localeCompare(a.dateIso));
    const sympCounts: Record<string, number> = {};
    
    logArray.forEach(log => {
      log.symptoms.forEach(sym => {
        sympCounts[sym] = (sympCounts[sym] || 0) + 1;
      });
    });

    const frequent = Object.entries(sympCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalLogs: logArray.length,
      frequentSymptoms: frequent,
      recentLogs: logArray.slice(0, 14) // Max 14 recent logs on the report to prevent massive bloat
    };
  }, [logs]);

  const caseStudyChartData = useMemo(() => {
    if (!caseStudy) return [];
    const data = [];
    const activeCycleLength = caseStudy.input.cycleLength;
    for (let i = 1; i <= activeCycleLength; i++) {
      let riskVal = 0;
      if (i >= caseStudy.fertileWindowStart && i <= caseStudy.fertileWindowEnd) {
        riskVal = i === caseStudy.ovulationDay ? 100 : 75;
        if (i < caseStudy.ovulationDay) {
          riskVal = 40 + ((i - caseStudy.fertileWindowStart) / (caseStudy.ovulationDay - caseStudy.fertileWindowStart)) * 60;
        } else {
          riskVal = 100 - ((i - caseStudy.ovulationDay) / (caseStudy.fertileWindowEnd - caseStudy.ovulationDay + 1)) * 60;
        }
      } else if (i === caseStudy.fertileWindowStart - 1 || i === caseStudy.fertileWindowEnd + 1) {
        riskVal = 15;
      } else if (i >= caseStudy.fertileWindowStart - 3 && i < caseStudy.fertileWindowStart - 1) {
        riskVal = 5;
      }
      data.push({
        day: i,
        Risk: Math.round(riskVal)
      });
    }
    return data;
  }, [caseStudy]);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('pdf-report-container');
          if (el) {
            // Force desktop layout for PDF on the cloned DOM
            el.style.width = '800px';
            el.style.minWidth = '800px';
            el.style.maxWidth = '800px';
            el.style.padding = '40px';
            el.style.position = 'absolute';
            el.style.left = '0';
            el.style.top = '0';
            el.style.height = 'auto'; // allow it to expand fully
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Dynamic format ensures long reports fit on a single continuous page
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const firstName = userName.split(' ')[0] || 'User';
      pdf.save(`${firstName}-Aura-Report-${dateStr}-${timeStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };



  const activeCycleLength = caseStudy ? caseStudy.input.cycleLength : cycleLength;
  const activeLuteal = caseStudy ? caseStudy.input.lutealPhaseLength : lutealPhaseLength;

  const isPregnancyMode = userProfile?.appMode === 'pregnancy';
  const pMetrics = isPregnancyMode && userProfile?.lastPeriodDate ? buildPregnancyMetrics(userProfile.lastPeriodDate) : null;

  // Generate mock hormone data over the cycle length
  const hormoneData = isPregnancyMode ? Array.from({ length: 40 }, (_, i) => {
    const week = i + 1;
    const hcg = week < 12 ? Math.pow(week / 10, 2) * 100 : Math.max(10, 100 - (week - 12) * 2);
    const estrogen = Math.pow(week / 40, 1.5) * 80 + 10;
    const progesterone = Math.pow(week / 40, 1.2) * 90 + 5;
    return {
      day: `Wk ${week}`,
      Estrogen: Math.round(estrogen),
      Progesterone: Math.round(progesterone),
      hCG: Math.round(hcg)
    };
  }) : Array.from({ length: activeCycleLength }, (_, i) => {
    const day = i + 1;
    const ovulationDay = activeCycleLength - activeLuteal;
    
    // Simplistic mock curves for visual representation
    const estrogen = 50 + 
      Math.max(0, 150 * Math.exp(-Math.pow(day - (ovulationDay - 1), 2) / 10)) + 
      Math.max(0, 60 * Math.exp(-Math.pow(day - (ovulationDay + 7), 2) / 20));
      
    const progesterone = day < ovulationDay ? 5 : 
      5 + Math.max(0, 100 * Math.exp(-Math.pow(day - (ovulationDay + 7), 2) / 25));
      
    const lh = 5 + Math.max(0, 200 * Math.exp(-Math.pow(day - ovulationDay, 2) / 2));

    return {
      day,
      Estrogen: Math.round(estrogen),
      Progesterone: Math.round(progesterone),
      LH: Math.round(lh)
    };
  });

  const riskSummaryText = caseStudy ? t(lang, `risk_${caseStudy.riskLevel}`) : '';

  return (
    <div className="report-container" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* Configuration Panel */}
      <div className="report-config-panel" style={{ maxWidth: '850px', margin: '0 auto 1.5rem auto', background: 'var(--panel-bg)', padding: 'clamp(15px, 4vw, 24px)', borderRadius: '16px', border: '1px solid var(--panel-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-strong)' }}>
            <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
            {t(lang, 'report_config')}
          </h3>
          <div className="report-actions-wrapper">
            <select 
              className="report-lang-select"
              value={lang} 
              onChange={(e) => setLang(e.target.value as SupportedLanguage)}
            >
              {Object.entries(languageNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <div className="report-actions-divider" />

            <button 
              onClick={generatePDF} 
              disabled={isExporting}
              className="btn btn-primary report-download-btn"
              style={{ opacity: isExporting ? 0.7 : 1, padding: '0.65rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>

        <div className="report-config-grid">
          <label className="report-config-item">
            <span className="report-config-label">{t(lang, 'toggle_safety')}</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={includeSafety} onChange={e => setIncludeSafety(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          <label className="report-config-item">
            <span className="report-config-label">{t(lang, 'toggle_analytics')}</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={includeAnalytics} onChange={e => setIncludeAnalytics(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          <label className={`report-config-item ${includeFullData ? 'disabled' : ''}`}>
            <span className="report-config-label">{t(lang, 'toggle_notes')}</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} disabled={includeFullData} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          <label className="report-config-item">
            <span className="report-config-label">{t(lang, 'toggle_hormone')}</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={includeHormone} onChange={e => setIncludeHormone(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          <label className="report-config-item" style={{ gridColumn: '1 / -1', background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
            <span className="report-config-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t(lang, 'toggle_full_data')}</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={includeFullData} onChange={e => {
                setIncludeFullData(e.target.checked);
                if (e.target.checked) setIncludeNotes(false);
              }} />
              <span className="toggle-slider"></span>
            </div>
          </label>

        {!isPregnancyMode && cycles.length > 0 && (
          <div className="report-config-item" style={{ gridColumn: '1 / -1', background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.2)', display: 'block', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <CalendarDays size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                {t(lang, 'cycle_map')} Selection
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto',
              paddingBottom: '10px', /* space for scrollbar */
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}>
              {cycles.map(c => {
                const isSelected = selectedCycleIsos.includes(c.startIso);
                let title = c.startIso === currentCycleStart ? t(lang, 'current_cycle') : t(lang, 'past_cycle');
                let dateStr = formatUtcDateLabel(c.startIso);
                
                return (
                  <button 
                    key={c.startIso}
                    onClick={() => toggleCycle(c.startIso)}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--bg-inset)' : 'var(--panel-bg)',
                      color: isSelected ? 'var(--text-strong)' : 'var(--text-main)',
                      border: isSelected ? '2px solid var(--text-strong)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      padding: isSelected ? 'calc(0.75rem - 1px) calc(1rem - 1px)' : '0.75rem 1rem',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      minWidth: '150px'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: '4px' }}>
                      {title}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      {dateStr}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* The Printable Document */}
      <div 
        id="pdf-report-container"
        ref={reportRef} 
        style={{
          background: '#ffffff',
          color: '#1a1a1a',
          padding: 'clamp(15px, 5vw, 40px)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '800px',
          minWidth: 0,
          boxSizing: 'border-box',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={isPregnancyMode ? pregnancyLogo : auraLogo} alt="Aura Femme Logo" style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(197, 34, 51, 0.3))' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>
                {isPregnancyMode ? t(lang, 'clinical_pregnancy_report') : t(lang, 'clinical_cycle_report')}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
                {isPregnancyMode ? t(lang, 'preg_desc') : t(lang, 'cycle_desc')}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>{t(lang, 'user')}: <strong style={{ color: '#1a1a1a' }}>{userName}</strong></p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>{t(lang, 'generated')}: <strong style={{ color: '#1a1a1a' }}>{new Date().toLocaleString()}</strong></p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{t(lang, 'aura_id')}: <strong style={{ color: '#1a1a1a' }}>{auraId}</strong></p>
          </div>
        </div>

        {/* Patient/Filter Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '15px', marginBottom: '30px' }}>
          {!isPregnancyMode && (
            <>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'last_period')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '15px', fontWeight: 600, color: '#c52233' }}>{metrics.cycleStartIso ? formatUtcDateLabel(metrics.cycleStartIso) : '-'}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'next_period_short')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{metrics.nextPeriodIso ? formatUtcDateLabel(metrics.nextPeriodIso) : '-'}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'phase_split')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '15px', fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                  {metrics.currentPhaseLabel} ({t(lang, 'day_label')} {metrics.cycleDay})
                </p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'ovulation_day')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{t(lang, 'day_label')} {metrics.ovulationDay}</p>
              </div>
            </>
          )}

          {isPregnancyMode && (
            <>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'gestational_age')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{pMetrics?.gestationalWeeks} {t(lang, 'week')}, {pMetrics?.gestationalDays} {t(lang, 'days')}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'trimester')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{pMetrics?.trimester}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'estimated_due_date')}</p>
                <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>{pMetrics ? formatUtcDateLabel(pMetrics.estimatedDueDate) : '-'}</p>
              </div>
            </>
          )}
        </div>

        {/* Calendar Grid Visual */}
        {!isPregnancyMode && selectedCycleIsos.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} style={{ color: 'var(--primary)' }} />
              {t(lang, 'cycle_map')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cycles.filter(c => selectedCycleIsos.includes(c.startIso)).map(c => (
                <div key={c.startIso}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', margin: '0 0 8px 0' }}>
                    {c.startIso === currentCycleStart ? t(lang, 'current_cycle') : `${t(lang, 'cycle_map')} (${formatUtcDateLabel(c.startIso)})`}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {c.days.map((day) => {
                      let bg = '#e5e7eb'; // default grey
                      let color = '#4b5563';
                      if (day.phase === 'menstruation') { bg = '#ffe4e6'; color = '#e11d48'; }
                      else if (day.phase === 'follicular') { bg = '#cffafe'; color = '#0891b2'; }
                      else if (day.phase === 'ovulation') { bg = '#fef3c7'; color = '#d97706'; }
                      else if (day.phase === 'luteal') { bg = '#fae8ff'; color = '#c026d3'; }

                      return (
                        <div key={day.cycleDay} style={{
                          width: '32px', height: '32px', borderRadius: '6px', 
                          background: bg, color: color, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 600,
                          border: metrics.cycleDay === day.cycleDay && day.dateIso === metrics.todayIso ? `2px solid ${color}` : '1px solid transparent',
                          boxShadow: metrics.cycleDay === day.cycleDay && day.dateIso === metrics.todayIso ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none'
                        }}>
                          {parseInt(day.dateIso.split('-')[2], 10)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', fontSize: '11px', color: '#666', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffe4e6' }}></div> {t(lang, 'bleeding')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#cffafe' }}></div> {t(lang, 'follicular')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fef3c7' }}></div> {t(lang, 'fertile')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fae8ff' }}></div> {t(lang, 'luteal')}</span>
            </div>
          </div>
        )}

        {/* Cycle Analysis */}
        {!isPregnancyMode && includeSafety && (
          <>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: '#c52233' }} />
              {caseStudy ? t(lang, 'safety_case_study') : t(lang, 'active_cycle_analysis')}
            </h2>
            
            {caseStudy && (
               <>
                 <div style={{ padding: '15px', background: '#fff5f5', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #c52233', wordBreak: 'break-word' }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}><strong>{t(lang, 'summary')}:</strong> {riskSummaryText}</p>
                 </div>
                 
                 <div style={{ width: '100%', height: '220px', minWidth: 0, minHeight: 0, marginBottom: '30px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={caseStudyChartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                       <defs>
                         <linearGradient id="pdfColorRisk" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={caseStudy.riskLevel === 'elevated' ? '#ef4444' : caseStudy.riskLevel === 'low' ? '#f59e0b' : '#10b981'} stopOpacity={0.6}/>
                           <stop offset="95%" stopColor={caseStudy.riskLevel === 'elevated' ? '#ef4444' : caseStudy.riskLevel === 'low' ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                       <XAxis dataKey="day" stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Day ${val}`} />
                       <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                       <Area type="monotone" dataKey="Risk" name="Risk Level" stroke={caseStudy.riskLevel === 'elevated' ? '#ef4444' : caseStudy.riskLevel === 'low' ? '#f59e0b' : '#10b981'} strokeWidth={3} fillOpacity={1} fill="url(#pdfColorRisk)" />
                       <ReferenceLine x={caseStudy.intercourseCycleDay} stroke="#333" strokeWidth={2} strokeDasharray="4 4" label={{ position: 'top', value: 'Intercourse', fill: '#333', fontSize: 12, fontWeight: 600 }} />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginBottom: '40px' }}>
              <div style={{ border: '1px solid #eaeaea', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#c52233' }}>{caseStudy ? t(lang, 'intercourse_date') : t(lang, 'safe_dates')}</h3>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                   {caseStudy ? new Date(caseStudy.input.intercourseDate).toLocaleDateString() : `${metrics.fertileWindowStart} - ${metrics.fertileWindowEnd}`}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                   {caseStudy ? `${t(lang, 'cycle_day')} ${caseStudy.intercourseCycleDay}` : t(lang, 'safe_dates_desc')}
                </p>
              </div>
              <div style={{ border: '1px solid #eaeaea', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#059669' }}>{caseStudy ? t(lang, 'ovulation_day') : t(lang, 'next_period')}</h3>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                  {caseStudy ? `${t(lang, 'cycle_day')} ${caseStudy.ovulationDay}` : (metrics.isOverdue ? t(lang, 'overdue') : `${t(lang, 'expected_in')} ${metrics.nextPeriodCountdown} ${t(lang, 'days')}`)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                  {caseStudy ? `${t(lang, 'fertile_window_spans')} ${caseStudy.fertileWindowStart} - ${caseStudy.fertileWindowEnd}` : `${t(lang, 'based_on_cycle')} ${activeCycleLength} ${t(lang, 'day_cycle_model')}`}
                </p>
              </div>
            </div>


            {caseStudy && caseStudy.timeline && caseStudy.timeline.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '15px', color: '#1a1a1a', marginBottom: '15px' }}>{t(lang, 'timeline_events')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {caseStudy.timeline.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '15px', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: `4px solid ${item.tone === 'danger' ? '#ef4444' : item.tone === 'warning' ? '#f59e0b' : item.tone === 'success' ? '#10b981' : '#3b82f6'}` }}>
                      <div style={{ flexShrink: 0, width: '60px' }}>
                        <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Day {item.cycleDay}</span>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1a1a1a' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Aggregated Symptom Analytics */}
        {includeAnalytics && (
          <>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListChecks size={18} style={{ color: '#06b6d4' }} />
              {t(lang, 'symptom_analytics')}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginBottom: '30px' }}>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'total_logs')}</p>
                <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{totalLogs}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', gridColumn: 'span 2' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{t(lang, 'most_frequent_symptoms')}</p>
                {frequentSymptoms.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {frequentSymptoms.map((sym, i) => (
                      <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                        {sym.name} ({sym.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '14px', color: '#999', fontStyle: 'italic' }}>{t(lang, 'no_symptoms_logged')}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Detailed Symptom Ledger */}
        {includeNotes && !includeFullData && recentLogs.length > 0 && (
          <>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={16} />
              {t(lang, 'recent_clinical_notes')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
              {recentLogs.map((log) => (
                <div key={log.dateIso} style={{ borderLeft: '3px solid #c52233', paddingLeft: '15px', paddingBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 600, color: '#666' }}>
                    {new Date(log.dateIso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {log.mood && <span style={{ marginLeft: '10px', color: '#059669' }}>Mood: {log.mood}</span>}
                  </p>
                  {log.symptoms.length > 0 && (
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#1a1a1a' }}>
                      <strong style={{ color: '#444' }}>Symptoms:</strong> {log.symptoms.join(', ')}
                    </p>
                  )}
                  {log.notes && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>"{log.notes}"</p>
                  )}
                </div>
              ))}
              {totalLogs > 14 && (
                <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>* Displaying 14 most recent logs of {totalLogs} total.</p>
              )}
            </div>
          </>
        )}

        {/* Comprehensive Health Data (Full Table) */}
        {includeFullData && (
          <>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '20px' }}>
              <ListChecks size={16} />
              {t(lang, 'comprehensive_health_data')}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginBottom: '40px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eaeaea', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px' }}>{t(lang, 'date')}</th>
                  <th style={{ padding: '10px' }}>{t(lang, 'mood')}</th>
                  <th style={{ padding: '10px' }}>{t(lang, 'symptoms')}</th>
                  <th style={{ padding: '10px' }}>{t(lang, 'notes')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(logs).sort((a, b) => b.dateIso.localeCompare(a.dateIso)).map((log) => (
                  <tr key={log.dateIso} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{formatUtcDateLabel(log.dateIso)}</td>
                    <td style={{ padding: '10px' }}>{log.mood || '-'}</td>
                    <td style={{ padding: '10px' }}>{log.symptoms.length > 0 ? log.symptoms.join(', ') : '-'}</td>
                    <td style={{ padding: '10px' }}>{log.notes || '-'}</td>
                  </tr>
                ))}
                {Object.keys(logs).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '15px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>{t(lang, 'no_symptoms_logged')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Clinical Graph */}
        {includeHormone && (
          <>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>{t(lang, 'endocrine_profile_model')}</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
          {isPregnancyMode 
            ? t(lang, 'endocrine_desc_preg') 
            : <>{t(lang, 'endocrine_desc_cycle_1')}{activeCycleLength}{t(lang, 'endocrine_desc_cycle_2')}{activeLuteal}{t(lang, 'endocrine_desc_cycle_3')}</>}
        </p>
        
        <div style={{ width: '100%', height: '350px', minWidth: 0, minHeight: 0, marginBottom: '40px', background: '#fcfcfc', borderRadius: '12px', padding: '15px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hormoneData as any[]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#333' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Estrogen" name={t(lang, 'estrogen')} stroke="#06b6d4" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Progesterone" name={t(lang, 'progesterone')} stroke="#d946ef" strokeWidth={3} dot={false} />
              {isPregnancyMode ? (
                <Line type="monotone" dataKey="hCG" name={t(lang, 'hcg')} stroke="#8b5cf6" strokeWidth={3} dot={false} />
              ) : (
                <Line type="monotone" dataKey="LH" name={t(lang, 'lh')} stroke="#f59e0b" strokeWidth={3} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
          </>
        )}

        {/* Medical Disclaimer */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
            <strong>{t(lang, 'clinical_disclaimer_title')}</strong> {t(lang, 'clinical_disclaimer')}
          </p>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>{t(lang, 'footer_note')}</p>
        </div>
      </div>
    </div>
  );
}
