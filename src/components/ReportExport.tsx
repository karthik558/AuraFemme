import { useRef, useState, useMemo } from 'react';
import { Download, Activity, ListChecks, CalendarDays } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CaseStudyResult, DailyLog } from '../types';
import faviconGradient from '../assets/favicon-gradient.png';

interface ReportExportProps {
  metrics: any;
  cycleLength: number;
  lutealPhaseLength: number;
  userName: string;
  caseStudy?: CaseStudyResult | null;
  logs?: Record<string, DailyLog>;
}

export function ReportExport({ metrics, cycleLength, lutealPhaseLength, userName, caseStudy, logs = {} }: ReportExportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      pdf.save(`Aura-Femme-Report-${dateStr}-${timeStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const activeCycleLength = caseStudy ? caseStudy.input.cycleLength : cycleLength;
  const activeLuteal = caseStudy ? caseStudy.input.lutealPhaseLength : lutealPhaseLength;

  // Generate mock hormone data over the cycle length
  const hormoneData = Array.from({ length: activeCycleLength }, (_, i) => {
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
            <img src={faviconGradient} alt="Aura Femme Logo" style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(197, 34, 51, 0.3))' }} />
            <div>
              {/* Title removed */}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Patient Name: <strong style={{ color: '#1a1a1a' }}>{userName}</strong></p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Generated: <strong style={{ color: '#1a1a1a' }}>{new Date().toLocaleDateString()}</strong></p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Aura ID: <strong style={{ color: '#1a1a1a' }}>AF-{Math.floor(Math.random() * 10000)}</strong></p>
          </div>
        </div>

        {/* Patient/Filter Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
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
        </div>

        {/* Cycle Analysis */}
        <h2 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: '#c52233' }} />
          {caseStudy ? 'Safety Case Study Analysis' : 'Active Cycle Analysis'}
        </h2>
        
        {caseStudy && (
           <div style={{ padding: '15px', background: '#fff5f5', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #c52233', wordBreak: 'break-word' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}><strong>Summary:</strong> {caseStudy.summary}</p>
           </div>
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
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Standardized endocrine tracking based on the active {activeCycleLength}-day model with a {activeLuteal}-day luteal phase.</p>
        
        <div style={{ width: '100%', height: '350px', marginBottom: '40px', background: '#fcfcfc', borderRadius: '12px', padding: '15px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hormoneData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#333' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Estrogen" stroke="#06b6d4" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="LH" stroke="#f59e0b" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Progesterone" stroke="#d946ef" strokeWidth={3} dot={false} />
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
