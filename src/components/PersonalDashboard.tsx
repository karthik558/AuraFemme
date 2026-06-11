import { motion } from 'framer-motion';
import { CalendarDays, Clock3, MoonStar, Activity, Sparkles } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Legend
} from 'recharts';
import type { UserProfile, CycleMetrics } from '../types';
import { formatUtcDateLabel, buildPregnancyMetrics } from '../utils/calculator';
import HormoneWave3D from './HormoneWave3D';
import './PersonalDashboard.css';

interface PersonalDashboardProps {
  userProfile: UserProfile | null;
  metrics: CycleMetrics;
  authMode: 'guest' | 'authenticated';
}

const mockCycleHistory = [
  { month: 'Jan', length: 28 },
  { month: 'Feb', length: 29 },
  { month: 'Mar', length: 27 },
  { month: 'Apr', length: 30 },
  { month: 'May', length: 28 },
  { month: 'Jun', length: 28 },
];

const mockSymptoms = [
  { subject: 'Cramps', frequency: 85, fullMark: 100 },
  { subject: 'Fatigue', frequency: 65, fullMark: 100 },
  { subject: 'Headache', frequency: 40, fullMark: 100 },
  { subject: 'Bloating', frequency: 70, fullMark: 100 },
  { subject: 'Acne', frequency: 30, fullMark: 100 },
  { subject: 'Mood', frequency: 60, fullMark: 100 },
];

const generateCycleHormoneData = () => {
  const data = [];
  for (let i = 1; i <= 28; i++) {
    // Smoothed simulated hormone curve approximations
    const estrogenBase = Math.sin((i / 28) * Math.PI) * 60;
    const estrogenPeak = i > 10 && i < 16 ? Math.sin(((i - 10) / 6) * Math.PI) * 60 : 0;
    const estrogen = Math.max(10, estrogenBase + estrogenPeak); 
    
    const progesterone = i > 14 ? Math.sin(((i - 14) / 14) * Math.PI) * 90 : 5;
    data.push({ day: `Day ${i}`, Estrogen: estrogen, Progesterone: progesterone });
  }
  return data;
};

const generatePregnancyHormoneData = () => {
  const data = [];
  for (let i = 1; i <= 40; i++) {
    // hCG peaks around week 10-12
    const hcg = i < 12 ? Math.pow(i / 10, 2) * 100 : Math.max(10, 100 - (i - 12) * 2);
    // Estrogen steadily rises
    const estrogen = Math.pow(i / 40, 1.5) * 80 + 10;
    // Progesterone steadily rises
    const progesterone = Math.pow(i / 40, 1.2) * 90 + 5;
    
    data.push({ day: `Wk ${i}`, Estrogen: estrogen, Progesterone: progesterone, hCG: hcg });
  }
  return data;
};

const cycleHormoneData = generateCycleHormoneData();
const pregnancyHormoneData = generatePregnancyHormoneData();

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

export function PersonalDashboard({ userProfile, metrics, authMode }: PersonalDashboardProps) {
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
  const activeHormoneData = isPregnancyMode ? pregnancyHormoneData : cycleHormoneData;

  const historyData = mockCycleHistory.map((item, index) => {
    if (index === mockCycleHistory.length - 1) {
      return { ...item, length: metrics.cycleLength };
    }
    return item;
  });

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

  return (
    <motion.div 
      className="personal-dashboard-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="dashboard-header-premium">
        <h2 className="dashboard-greeting-premium">
          {greeting}
        </h2>
        <p className="dashboard-subtitle-premium">Here's a look at your cycle insights today.</p>
      </div>

      <div className="dashboard-kpi-row">
        {isPregnancyMode ? (() => {
          const pMetrics = buildPregnancyMetrics(userProfile?.lastPeriodDate || metrics.cycleStartIso);
          return (
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
                <span className="kpi-helper">Until due date</span>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <Sparkles className="w-4 h-4" />
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
          )
        })() : (
          <>
            <div className="kpi-card">
              <div className="kpi-header">
                <Clock3 className="w-4 h-4" />
                <span className="kpi-label">Current status</span>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.75rem' }}>Day {metrics.cycleDay} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>of {metrics.cycleLength}</span></span>
              <span className="kpi-helper">{metrics.cycleStartIso === userProfile?.lastPeriodDate ? 'Current cycle anchor' : 'Rolled forward from baseline'}</span>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header">
                <CalendarDays className="w-4 h-4" />
                <span className="kpi-label">Active phase</span>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>{metrics.currentPhaseLabel}</span>
              <span className="kpi-helper">{currentPhaseSentence}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <Sparkles className="w-4 h-4" />
                <span className="kpi-label">Ovulation</span>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.75rem' }}>{metrics.ovulationCountdown === 0 ? 'Today' : `${metrics.ovulationCountdown} days`}</span>
              <span className="kpi-helper">{`Peak release near day ${metrics.ovulationDay}`}</span>
            </div>

            <div className="kpi-card" style={{ background: 'linear-gradient(145deg, rgba(253, 164, 175, 0.1), transparent)'}}>
              <div className="kpi-header">
                <MoonStar className="w-4 h-4" style={{ color: '#e11d48' }} />
                <span className="kpi-label">Next Period Due</span>
              </div>
              <span className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{formatUtcDateLabel(metrics.nextPeriodIso)}</span>
              <span className="kpi-helper">{metrics.isOverdue ? 'Cycle window closing' : `In ${metrics.nextPeriodCountdown} days`}</span>
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
                <h3 className="chart-title">Cycle Length History</h3>
                <p className="chart-subtitle">Last 6 cycles recorded</p>
              </div>
              <CalendarDays className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} domain={[20, 35]} />
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
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="chart-wrapper" style={{ minHeight: '300px', padding: '1rem 0' }}>
             <HormoneWave3D day={userProfile?.appMode === 'pregnancy' ? buildPregnancyMetrics(userProfile.lastPeriodDate).gestationalDays : metrics.cycleDay} mode={userProfile?.appMode || 'cycle'} />
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
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProgesterone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHcg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }}/>
                <Area type="monotone" dataKey="Estrogen" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorEstrogen)" />
                <Area type="monotone" dataKey="Progesterone" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorProgesterone)" />
                {isPregnancyMode && <Area type="monotone" dataKey="hCG" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorHcg)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
