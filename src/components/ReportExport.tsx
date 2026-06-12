import { useRef, useState, useMemo } from 'react';
import { Download, Activity, ListChecks, CalendarDays } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine } from 'recharts';
import type { CaseStudyResult, DailyLog, UserProfile } from '../types';
import { buildPregnancyMetrics, formatUtcDateLabel } from '../utils/calculator';
import faviconGradient from '../assets/favicon-gradient.png';
import pregnancyLogo from '../assets/icon-color-purple.png';
import { useAppStore } from '../store';

interface ReportExportProps {
  metrics: any;
  cycleLength: number;
  lutealPhaseLength: number;
  userName: string;
  caseStudy?: CaseStudyResult | null;
  logs?: Record<string, DailyLog>;
  userProfile?: UserProfile | null;
}

export function ReportExport({ metrics, cycleLength, lutealPhaseLength, userName, caseStudy, logs = {}, userProfile }: ReportExportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const accountId = useAppStore(state => state.accountId);

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

  return (
    <div className="report-container" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={generatePDF} 
          disabled={isExporting}
          className="btn btn-primary"
          style={{
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          <Download size={18} />
          {isExporting ? 'Generating PDF...' : 'Download PDF'}
        </button>
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
            <img src={isPregnancyMode ? pregnancyLogo : faviconGradient} alt="Aura Femme Logo" style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(197, 34, 51, 0.3))' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>
                {isPregnancyMode ? 'Clinical Pregnancy Report' : 'Clinical Cycle Report'}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
                {isPregnancyMode ? 'Comprehensive maternal timeline and symptoms' : 'Comprehensive cycle mapping and symptoms'}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>User: <strong style={{ color: '#1a1a1a' }}>{userName}</strong></p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Generated: <strong style={{ color: '#1a1a1a' }}>{new Date().toLocaleString()}</strong></p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Aura ID: <strong style={{ color: '#1a1a1a' }}>{auraId}</strong></p>
          </div>
        </div>

        {/* Patient/Filter Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {isPregnancyMode && pMetrics ? (
            <>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gestational Age</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600 }}>Week {pMetrics.gestationalWeeks}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trimester</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600 }}>{pMetrics.trimester}</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Due Date</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600, color: '#8b5cf6' }}>
                  {formatUtcDateLabel(pMetrics.estimatedDueDate)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cycle Model</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600 }}>{activeCycleLength} days</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Luteal Phase</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600 }}>{activeLuteal} days</p>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{caseStudy ? 'Risk Assessment' : 'Current Status'}</p>
                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600, color: caseStudy ? (caseStudy.riskLevel === 'elevated' ? '#c52233' : '#059669') : '#c52233' }}>
                  {caseStudy ? caseStudy.riskLabel : metrics.currentPhaseLabel}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Cycle Analysis */}
        {!isPregnancyMode && (
          <>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: '#c52233' }} />
              {caseStudy ? 'Safety Case Study Analysis' : 'Active Cycle Analysis'}
            </h2>
            
            {caseStudy && (
               <>
                 <div style={{ padding: '15px', background: '#fff5f5', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #c52233', wordBreak: 'break-word' }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}><strong>Summary:</strong> {caseStudy.summary}</p>
                 </div>
                 
                 <div style={{ width: '100%', height: '220px', marginBottom: '30px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '40px' }}>
              <div style={{ border: '1px solid #eaeaea', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#c52233' }}>{caseStudy ? 'Intercourse Date' : 'Safe Dates / Fertile Window'}</h3>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                   {caseStudy ? new Date(caseStudy.input.intercourseDate).toLocaleDateString() : `${metrics.fertileWindowStart} - ${metrics.fertileWindowEnd}`}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                   {caseStudy ? `Cycle Day ${caseStudy.intercourseCycleDay}` : 'This represents the high-probability risk period. Unlisted dates are statistically safer.'}
                </p>
              </div>
              <div style={{ border: '1px solid #eaeaea', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#059669' }}>{caseStudy ? 'Ovulation Day' : 'Next Period Prediction'}</h3>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                  {caseStudy ? `Cycle Day ${caseStudy.ovulationDay}` : (metrics.isOverdue ? 'Overdue' : `Expected in ${metrics.nextPeriodCountdown} days`)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                  {caseStudy ? `Fertile window spans days ${caseStudy.fertileWindowStart} - ${caseStudy.fertileWindowEnd}` : `Based on a ${activeCycleLength}-day cycle model.`}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Aggregated Symptom Analytics */}
        <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListChecks size={18} style={{ color: '#06b6d4' }} />
          Symptom & History Analytics
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Logs Recorded</p>
            <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#1a1a1a' }}>{totalLogs}</p>
          </div>
          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', gridColumn: 'span 2' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Most Frequent Symptoms</p>
            {frequentSymptoms.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {frequentSymptoms.map((sym, i) => (
                  <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                    {sym.name} ({sym.count})
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: '#999', fontStyle: 'italic' }}>No symptom data imported.</p>
            )}
          </div>
        </div>

        {/* Detailed Symptom Ledger */}
        {recentLogs.length > 0 && (
          <>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={16} />
              Recent Clinical Ledger
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

        {/* Clinical Graph */}
        <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Endocrine Hormone Profile Model</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
          {isPregnancyMode ? 'Standardized endocrine tracking based on a 40-week gestation timeline.' : `Standardized endocrine tracking based on the active ${activeCycleLength}-day model with a ${activeLuteal}-day luteal phase.`}
        </p>
        
        <div style={{ width: '100%', height: '350px', marginBottom: '40px', background: '#fcfcfc', borderRadius: '12px', padding: '15px' }}>
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
              <Line type="monotone" dataKey="Estrogen" stroke="#06b6d4" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Progesterone" stroke="#d946ef" strokeWidth={3} dot={false} />
              {isPregnancyMode ? (
                <Line type="monotone" dataKey="hCG" stroke="#8b5cf6" strokeWidth={3} dot={false} />
              ) : (
                <Line type="monotone" dataKey="LH" stroke="#f59e0b" strokeWidth={3} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Medical Disclaimer */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
            <strong>CLINICAL DISCLAIMER:</strong> This report is algorithmically generated based on user-provided data and statistical cycle models. It does not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding reproductive health concerns.
          </p>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Generated securely by Aura Femme • Developed by Karthik Lal</p>
        </div>
      </div>
    </div>
  );
}
