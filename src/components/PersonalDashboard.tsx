import { useMemo, memo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalendarDays, Clock3, MoonStar, Activity, Baby, Target, Dna, Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Legend
} from 'recharts';
import type { UserProfile, CycleMetrics } from '../types';
import { formatUtcDateLabel, buildPregnancyMetrics, diffUtcDays } from '../utils/calculator';
import { useAppStore } from '../store';
import HormoneWave3D from './HormoneWave3D';
import './PersonalDashboard.css';

interface PersonalDashboardProps {
  userProfile: UserProfile | null;
  metrics: CycleMetrics;
  authMode: 'guest' | 'authenticated' | 'unauthenticated';
  goal: 'track' | 'conceive' | 'avoid';
  lastIntercourseDate?: string | null;
  qualityScore?: number;
  onInspectMetric?: (type: 'ovulation' | 'period' | 'quality' | 'phase') => void;
}



const mockSymptoms = [
  { subject: 'Cramps', frequency: 85, fullMark: 100 },
  { subject: 'Fatigue', frequency: 65, fullMark: 100 },
  { subject: 'Headache', frequency: 40, fullMark: 100 },
  { subject: 'Bloating', frequency: 70, fullMark: 100 },
  { subject: 'Acne', frequency: 30, fullMark: 100 },
  { subject: 'Mood', frequency: 60, fullMark: 100 },
];

// The data generation functions will be defined inside the component using useMemo

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="tooltip-value" style={{ color: entry.color || 'var(--accent-primary)' }}>
            {entry.name}: {Math.round(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const getBiologicalFact = (isPregnancy: boolean, day: number, week: number, phase: string): string => {
  if (isPregnancy) {
    if (week < 4) return "Early cell division is rapidly occurring. Your body is increasing blood volume to prepare for the placenta.";
    if (week >= 4 && week <= 8) return "The neural tube is closing right now, laying the foundation for your baby's brain and spinal cord.";
    if (week >= 9 && week <= 12) return "Organogenesis is nearly complete. Your baby's heart is beating twice as fast as yours!";
    if (week >= 13 && week <= 16) return "The placenta has fully taken over hormone production, which often brings a welcome relief from early nausea.";
    if (week >= 17 && week <= 22) return "Fetal bones are hardening (ossification), and you might start feeling the first subtle flutters of movement, known as 'quickening'.";
    if (week >= 23 && week <= 28) return "Your baby's lungs are beginning to produce surfactant, a crucial substance that will help them breathe air after birth.";
    if (week >= 29 && week <= 34) return "Your baby is putting on fat rapidly. Your own metabolic rate has increased significantly to support this growth spurt.";
    return "Maternal antibodies are actively crossing the placenta to your baby, granting them passive immunity for their first few months of life.";
  }

  if (phase === 'menstruation') {
    if (day <= 2) return `Day ${day}: Estrogen and progesterone are at their absolute lowest. This drop triggers prostaglandins, causing the uterus to contract and shed its lining.`;
    return `Day ${day}: As your period tapers off, your brain is already releasing FSH (Follicle Stimulating Hormone) to recruit a new batch of eggs for the upcoming cycle.`;
  }
  if (phase === 'follicular') {
    return `Day ${day}: Estrogen is steadily rising as your ovarian follicles grow. This naturally boosts serotonin and dopamine, leading to higher energy levels and sharper focus!`;
  }
  if (phase === 'ovulation') {
    return `Day ${day}: Luteinizing Hormone (LH) is surging. This triggers a slight drop in basal body temperature followed by a sharp spike right as the mature egg is released.`;
  }
  if (day <= 21) {
    return `Day ${day}: The corpus luteum is pumping out progesterone. This hormone acts as a natural sedative and muscle relaxant, making you feel more relaxed but also a bit sleepy.`;
  }
  return `Day ${day}: Progesterone levels are peaking and starting their decline. This hormonal shift can decrease serotonin synthesis, which is why late-luteal mood dips are common.`;
};

export const PersonalDashboard = memo(function PersonalDashboard({ userProfile, metrics, authMode, goal, lastIntercourseDate, qualityScore = 0, onInspectMetric }: PersonalDashboardProps) {
  // Determine name to display
  let displayName = "Ayana";
  if (userProfile?.name && userProfile.name.trim() !== '') {
    displayName = userProfile.name.trim().split(' ')[0];
  }

  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17) timeGreeting = 'Good evening';

  const greeting = authMode === 'guest' ? 'Welcome to Aura' : `${timeGreeting}, ${displayName}`;
  const isPregnancyMode = userProfile?.appMode === 'pregnancy';
  
  const daysSinceIntercourse = useMemo(() => {
    if (!lastIntercourseDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const intercourseDate = new Date(lastIntercourseDate);
    return Math.max(0, Math.floor((today.getTime() - intercourseDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, [lastIntercourseDate]);
  
  const pMetrics = useMemo(() => isPregnancyMode ? buildPregnancyMetrics(userProfile?.lastPeriodDate || metrics.cycleStartIso) : null, [isPregnancyMode, userProfile?.lastPeriodDate, metrics.cycleStartIso]);

  const activeHormoneData = useMemo(() => {
    if (isPregnancyMode) {
      const data = [];
      for (let i = 1; i <= 40; i++) {
        const hcg = i < 12 ? Math.pow(i / 10, 2) * 100 : Math.max(10, 100 - (i - 12) * 2);
        const estrogen = Math.pow(i / 40, 1.5) * 80 + 10;
        const progesterone = Math.pow(i / 40, 1.2) * 90 + 5;
        data.push({ day: `Wk ${i}`, Estrogen: estrogen, Progesterone: progesterone, hCG: hcg });
      }
      return data;
    } else {
      const data = [];
      const cLength = metrics.cycleLength || 28;
      const oDay = metrics.ovulationDay || 14;
      for (let i = 1; i <= cLength; i++) {
        // Estrogen starts building, peaks right before ovulation, drops, and has a smaller secondary peak
        const estrogenPhase = Math.sin((i / cLength) * Math.PI) * 50;
        const estrogenOvulationSpike = Math.max(0, Math.exp(-Math.pow((i - (oDay - 1)) / 1.5, 2)) * 70);
        const estrogenLutealBump = i > oDay ? Math.sin(((i - oDay) / (cLength - oDay)) * Math.PI) * 30 : 0;
        const estrogen = Math.max(10, estrogenPhase + estrogenOvulationSpike + estrogenLutealBump); 
        
        // Progesterone is very low in follicular phase, rises sharply after ovulation, peaks mid-luteal, drops before period
        const progesterone = i > oDay ? Math.sin(((i - oDay) / (cLength - oDay)) * Math.PI) * 100 + 5 : 5;
        
        data.push({ day: `Day ${i}`, Estrogen: estrogen, Progesterone: progesterone });
      }
      return data;
    }
  }, [isPregnancyMode, metrics.cycleLength, metrics.ovulationDay]);

  const pastPeriodDates = useAppStore(state => state.pastPeriodDates) || [];
  const lastPeriodDate = useAppStore(state => state.lastPeriodDate);

  const historyData = useMemo(() => {
    const allDates = [...pastPeriodDates];
    if (lastPeriodDate && !allDates.includes(lastPeriodDate)) {
      allDates.push(lastPeriodDate);
    }
    allDates.sort();

    if (allDates.length < 2) {
      return [];
    }

    let data = [];
    for (let i = 1; i < allDates.length; i++) {
      const length = diffUtcDays(allDates[i], allDates[i - 1]);
      const date = new Date(allDates[i - 1]);
      const monthLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(date);
      data.push({ month: monthLabel, length });
    }
    
    // Show last 5 months by default
    return data.slice(-5);
  }, [pastPeriodDates, lastPeriodDate, metrics.cycleLength]);

  const hasRealHistory = pastPeriodDates.length >= 1; // Since lastPeriodDate is also included, this means at least 2 dates

  const reportPhaseSplit = [
    { label: 'Menstruation', value: userProfile?.bleedingDuration || 5, tone: 'bg-red' },
    { label: 'Follicular', value: Math.max(1, metrics.ovulationDay - (userProfile?.bleedingDuration || 5) - 3), tone: 'bg-cyan' },
    { label: 'Fertile window', value: 6, tone: 'bg-amber' },
    { label: 'Luteal phase', value: metrics.lutealPhaseLength, tone: 'bg-fuchsia' },
  ];

  const currentPhaseSentence = 
    metrics.currentPhase === 'menstruation' ? 'Shedding and baseline reset'
      : metrics.currentPhase === 'follicular' ? 'Follicular build'
      : metrics.currentPhase === 'ovulation' ? 'Peak fertility window' : 'Luteal stabilization';

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      className="personal-dashboard-container"
    >
      <div className="dashboard-header-premium">
        <h2 className="dashboard-greeting-premium">
          {greeting}
        </h2>
        <p className="dashboard-subtitle-premium">Here's a look at your cycle insights today.</p>
      </div>

      <div className="bio-fact-card liquid-aurora" style={{
        position: 'relative',
        borderRadius: '1.5rem',
        padding: '2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.04)'
      }}>
        {/* Organic background blobs */}
        <div style={{
          position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px',
          background: 'var(--accent-primary)', opacity: 0.08, filter: 'blur(50px)', borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-50%', right: '-10%', width: '250px', height: '250px',
          background: 'var(--text-main)', opacity: 0.05, filter: 'blur(50px)', borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{ background: 'var(--accent-soft)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dna className="w-4 h-4" style={{ color: 'var(--accent-primary)', animation: 'biologicalPulse 3s infinite' }} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 800 }}>
                Biological Insight
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-strong)', lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              "{getBiologicalFact(isPregnancyMode, metrics.cycleDay, pMetrics?.gestationalWeeks || 0, metrics.currentPhase)}"
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-row">
        {isPregnancyMode && pMetrics ? (
            <>
              <div className="kpi-card">
                <div className="kpi-header">
                  <Clock3 className="w-4 h-4" />
                  <span className="kpi-label">Current status</span>
                </div>
                <span className="kpi-value" style={{ fontSize: '1.75rem' }}>Week {pMetrics.gestationalWeeks}</span>
                <span className="kpi-helper">Trimester {pMetrics.trimester}</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <Activity className="w-4 h-4" />
                  <span className="kpi-label">Days left</span>
                </div>
                <span className="kpi-value" style={{ fontSize: '1.75rem' }}>{pMetrics.remainingDays}</span>
                <span className="log-value">{daysSinceIntercourse !== null ? daysSinceIntercourse : '--'} days</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <Baby className="w-4 h-4" />
                  <span className="kpi-label">Development</span>
                </div>
                <span className="kpi-value" style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>{pMetrics.trimester === 1 ? 'Embryonic' : pMetrics.trimester === 2 ? 'Fetal growth' : 'Maturation'}</span>
                <span className="kpi-helper">Current growth stage</span>
              </div>
              <div className="kpi-card" style={{ background: 'linear-gradient(145deg, rgba(167, 139, 250, 0.1), transparent)'}}>
                <div className="kpi-header">
                  <MoonStar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="kpi-label">Due Date</span>
                </div>
                <span className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{formatUtcDateLabel(pMetrics.estimatedDueDate)}</span>
                <span className="kpi-helper">Estimated arrival</span>
              </div>
            </>
        ) : (
          <>
            <div className="kpi-card">
              <div className="kpi-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock3 className="w-4 h-4" />
                  <span className="kpi-label">Current status</span>
                </div>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.75rem' }}>Day {metrics.cycleDay} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>of {metrics.cycleLength}</span></span>
              <span className="kpi-helper">{metrics.cycleStartIso === userProfile?.lastPeriodDate ? 'Current cycle anchor' : 'Rolled forward from baseline'}</span>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CalendarDays className="w-4 h-4" />
                  <span className="kpi-label">Active phase</span>
                </div>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>{metrics.currentPhaseLabel}</span>
              <span className="kpi-helper">{currentPhaseSentence}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Target className="w-4 h-4" />
                  <span className="kpi-label">Ovulation</span>
                </div>
                {onInspectMetric && (
                  <button onClick={() => onInspectMetric('ovulation')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="kpi-value" style={{ fontSize: '1.75rem' }}>{metrics.ovulationCountdown === 0 ? 'Today' : `${metrics.ovulationCountdown} days`}</span>
              <span className="kpi-helper">{`Peak release near day ${metrics.ovulationDay}`}</span>
            </div>

            <div className="kpi-card" style={{ background: 'linear-gradient(145deg, rgba(253, 164, 175, 0.1), transparent)'}}>
              <div className="kpi-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MoonStar className="w-4 h-4" style={{ color: '#e11d48' }} />
                  <span className="kpi-label">Next Period Due</span>
                </div>
                {onInspectMetric && (
                  <button onClick={() => onInspectMetric('period')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{formatUtcDateLabel(metrics.nextPeriodIso)}</span>
              <span className="kpi-helper">{metrics.isOverdue ? 'Cycle window closing' : `In ${metrics.nextPeriodCountdown} days`}</span>
            </div>

            <div className="kpi-card" style={{ background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05), transparent)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div className="kpi-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Activity className="w-4 h-4" style={{ color: '#10b981' }} />
                  <span className="kpi-label">Data Quality</span>
                </div>
                {onInspectMetric && (
                  <button onClick={() => onInspectMetric('quality')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                <span className="kpi-value" style={{ fontSize: '1.75rem', color: '#10b981' }}>{qualityScore}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
              </div>
              <span className="kpi-helper">Prediction confidence</span>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-content" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {userProfile?.appMode === 'pregnancy' ? (
          <>
            <div className="phase-summary highlight" style={{ background: 'var(--accent-soft)', borderColor: 'var(--border-subtle)' }}>
              <p className="panel-label">Pregnancy Tracker</p>
              {(() => {
                const pMetrics = buildPregnancyMetrics(userProfile.lastPeriodDate);
                return (
                  <>
                    <h3 className="panel-title" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>Trimester {pMetrics.trimester}</h3>
                    <p className="metric-helper">You are currently {pMetrics.gestationalWeeks} weeks pregnant. Estimated Due Date: {formatUtcDateLabel(pMetrics.estimatedDueDate)}.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white' }}>Week {pMetrics.gestationalWeeks}</span>
                      <span className="badge" style={{ background: 'var(--panel-bg)', color: 'var(--text-strong)' }}>{pMetrics.remainingDays} days left</span>
                      <span className="badge" style={{ background: 'var(--panel-bg)', color: 'var(--text-strong)' }}>Baby Size: Lemon 🍋</span>
                    </div>
                  </>
                )
              })()}
            </div>
            
            <div className="phase-summary">
              <p className="panel-label">Trimester progress</p>
              <div className="progress-container" style={{ marginTop: '1rem', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: 'Trimester 1', value: Math.min(13, buildPregnancyMetrics(userProfile.lastPeriodDate).gestationalWeeks), max: 13, tone: 'bg-violet' },
                  { label: 'Trimester 2', value: Math.max(0, Math.min(14, buildPregnancyMetrics(userProfile.lastPeriodDate).gestationalWeeks - 13)), max: 14, tone: 'bg-indigo' },
                  { label: 'Trimester 3', value: Math.max(0, Math.min(13, buildPregnancyMetrics(userProfile.lastPeriodDate).gestationalWeeks - 27)), max: 13, tone: 'bg-purple' }
                ].map((segment) => (
                  <div key={segment.label}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="field-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{segment.label}</span>
                      <span className="field-helper" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{segment.value} / {segment.max} wks</span>
                    </div>
                    <div className="progress-track" style={{ marginTop: '0.35rem', background: 'var(--bg-inset)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div className={`progress-bar ${segment.tone}`} style={{ height: '100%', width: `${(segment.value / segment.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="phase-summary highlight">
            <p className="panel-label">Phase summary</p>
            <h3 className="panel-title" style={{ fontSize: '1.25rem' }}>{metrics.currentPhaseLabel}</h3>
            <p className="metric-helper">The current cycle anchor has been projected using UTC math to avoid locale shifts. The dashboard now reads the active cycle, fertile span, and period forecast as a unified model.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              <span className="badge">Fertile starts day {metrics.fertileWindowStart}</span>
              <span className="badge">Ovulation day {metrics.ovulationDay}</span>
              <span className="badge">Cycle length {metrics.cycleLength}</span>
            </div>
          </div>
        )}

        {!isPregnancyMode && (
          <div className="phase-summary">
            <p className="panel-label">Phase split</p>
            <div className="progress-container" style={{ marginTop: '1rem', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
              {reportPhaseSplit.map((segment) => (
                <div key={segment.label}>
                  <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="field-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{segment.label}</span>
                    <span className="field-helper" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{segment.value} days</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: '0.35rem', background: 'var(--bg-inset)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className={`progress-bar ${segment.tone}`} style={{ height: '100%', width: `${Math.max(8, (segment.value / metrics.cycleLength) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isPregnancyMode && (
        <div className="dashboard-content" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
          <div className="phase-summary highlight">
            <p className="panel-label">Goal Strategy</p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Target className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="panel-title" style={{ fontSize: '1.25rem', margin: 0 }}>{goal === 'conceive' ? 'Conception Planning' : goal === 'avoid' ? 'Pregnancy Prevention' : 'Neutral Tracking'}</h3>
            </div>
            {goal === 'conceive' && (
              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Intercourse Timing</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Target intercourse every 1-2 days during the 5-day fertile window leading up to peak ovulation day ({metrics.ovulationDay}) for maximum probability. 
                    <br/><br/>
                    <span style={{ color: daysSinceIntercourse !== null && daysSinceIntercourse > 2 && metrics.currentPhase === 'ovulation' ? '#ef4444' : 'var(--accent-primary)', fontWeight: 600 }}>
                      Last logged: {daysSinceIntercourse === null ? 'Never' : daysSinceIntercourse === 0 ? 'Today' : `${daysSinceIntercourse} days ago`}. 
                      {daysSinceIntercourse !== null && daysSinceIntercourse > 2 && metrics.currentPhase === 'ovulation' ? ' High priority to try again today!' : ''}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Basal Body Temp (BBT)</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Track morning BBT to confirm ovulation. A sustained rise of 0.4°F indicates the egg has been released and the fertile window is closing.</p>
                </div>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>LH Strips</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Begin using ovulation predictor kits (OPKs) around day {Math.max(1, metrics.fertileWindowStart - 2)}. A positive test means ovulation is likely within 12-36 hours.</p>
                </div>
              </div>
            )}
            {goal === 'avoid' && (
              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Strict Abstinence Window</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Sperm can survive up to 5 days in fertile cervical mucus. Use primary barriers or abstain strictly from day {Math.max(1, metrics.fertileWindowStart - 1)} through day {metrics.fertileWindowEnd + 1}.
                    <br/><br/>
                    <span style={{ color: daysSinceIntercourse !== null && daysSinceIntercourse <= 5 && metrics.currentPhase === 'ovulation' ? '#ef4444' : 'var(--accent-primary)', fontWeight: 600 }}>
                      Last logged: {daysSinceIntercourse === null ? 'Never' : daysSinceIntercourse === 0 ? 'Today' : `${daysSinceIntercourse} days ago`}. 
                      {daysSinceIntercourse !== null && daysSinceIntercourse <= 5 && metrics.currentPhase === 'ovulation' ? ' WARNING: Risk of conception overlaps with sperm survival window!' : ''}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Peak Risk</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Ovulation day ({metrics.ovulationDay}) represents the absolute highest risk of conception. The egg remains viable for up to 24 hours post-release.</p>
                </div>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Secondary Tracking</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Relying solely on calendar math is risky. Combine tracking with BBT and cervical mucus observation (Symptothermal method) for highest efficacy.</p>
                </div>
              </div>
            )}
            {goal === 'track' && (
              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Baseline Mapping</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Consistent daily logging of symptoms, bleeding, and mood helps the algorithm understand your unique hormonal baseline.</p>
                </div>
                <div>
                  <p className="field-label" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-strong)' }}>Cycle Regularity</p>
                  <p className="metric-helper" style={{ margin: 0 }}>Monitor phase lengths across multiple cycles. Significant variance in follicular phase length may warrant further clinical observation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Cycle History Chart vs Fetal Growth Chart */}
        {isPregnancyMode ? (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Fetal Growth Tracker</h3>
                <p className="chart-subtitle">Average weight progression</p>
              </div>
              <Activity className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={Array.from({length: 40}, (_, i) => ({ week: i+1, weight: Math.pow(i/10, 3) * 50 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="weight" stroke="var(--accent-primary)" fill="url(#growthGrad)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">{hasRealHistory ? 'Cycle Length History' : 'Cycle Variance Projection'}</h3>
                <p className="chart-subtitle">{hasRealHistory ? 'Actual recorded variance' : 'Expected baseline fluctuations'}</p>
              </div>
              <CalendarDays className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="chart-wrapper">
              {hasRealHistory ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} domain={[0, 'auto']} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="length" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {historyData.map((_entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === historyData.length - 1 ? 'url(#activeCycleGrad)' : 'var(--border-subtle)'} 
                        />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="activeCycleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#fda4af" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', padding: '2rem', textAlign: 'center' }}>
                  <CalendarDays className="w-12 h-12" style={{ color: 'var(--border-subtle)', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '300px', lineHeight: 1.5 }}>
                    Log at least one past period date in your Clinical Profile to generate your historical variance chart.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Symptom Radar */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Symptom Frequency</h3>
              <p className="chart-subtitle">Most common logs</p>
            </div>
            <Activity className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockSymptoms}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-main)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Radar
                  name="Frequency"
                  dataKey="frequency"
                  stroke="#34d399"
                  fill="#6ee7b7"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D Interactive Hormone Visualization */}
        <div className="chart-card chart-card-full">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">3D Hormonal Wave</h3>
              <p className="chart-subtitle">Interactive continuous flow of Estrogen, Progesterone, LH, and FSH. Drag to rotate.</p>
            </div>
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="chart-wrapper" style={{ minHeight: '300px', padding: '1rem 0', background: 'var(--bg-card-raised)', borderRadius: 'var(--radius-xl)', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05)' }}>
             <HormoneWave3D 
               day={userProfile?.appMode === 'pregnancy' ? buildPregnancyMetrics(userProfile.lastPeriodDate).gestationalDays : metrics.cycleDay} 
               mode={userProfile?.appMode || 'cycle'} 
               cycleLength={metrics.cycleLength}
               ovulationDay={metrics.ovulationDay}
             />
          </div>
        </div>

        {/* Hormone Area Chart */}
        <div className="chart-card chart-card-full" style={{ marginTop: '1rem' }}>
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Hormonal Profile Simulation (2D)</h3>
              <p className="chart-subtitle">{isPregnancyMode ? 'Estimated hCG, Estrogen, and Progesterone over 40 weeks' : 'Estimated estrogen and progesterone levels across an average 28-day cycle'}</p>
            </div>
          </div>
          <div className="chart-wrapper" style={{ minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={activeHormoneData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEstrogen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorProgesterone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c026d3" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#c026d3" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorHcg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Legend verticalAlign="top" height={40} wrapperStyle={{ paddingBottom: '10px', paddingTop: '10px', fontWeight: 600, fontSize: '0.875rem' }}/>
                <Area type="monotone" dataKey="Estrogen" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorEstrogen)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }} style={{ filter: 'url(#glow)' }} />
                <Area type="monotone" dataKey="Progesterone" stroke="#c026d3" strokeWidth={4} fillOpacity={1} fill="url(#colorProgesterone)" activeDot={{ r: 6, strokeWidth: 0, fill: '#c026d3' }} style={{ filter: 'url(#glow)' }} />
                {isPregnancyMode && <Area type="monotone" dataKey="hCG" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorHcg)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} style={{ filter: 'url(#glow)' }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
});
