import { useRef, useState, useEffect } from 'react';
import {
  ArrowRight,
  Lock,
  Brain,
  Activity,
  Download,
  Heart,
  ShieldAlert,
  Users,
  CalendarDays,
  FileText,
  Zap,
  Shield,
  CheckCircle2,
  CloudOff,
  Cpu,
  ServerOff,
  Code2
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DataCore3D from './DataCore3D';
import { CinematicPreloader } from './CinematicPreloader';
import { useAppStore } from '../store';
import auraLogo from '../assets/icon-color.png';
import pregnancyLogo from '../assets/icon-color-purple.png';
import './LandingPage.css';

interface LandingPageProps {
  onGoToApp: () => void;
}

/* Animated counter for stat values */
function AnimatedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const dur = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span ref={ref}>{displayed}{suffix}</span>;
}

export function LandingPage({ onGoToApp }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const themeMode = useAppStore(state => state.themeMode);
  const userProfile = useAppStore(state => state.userProfile);
  const [activeTab, setActiveTab] = useState<'mission' | 'features' | 'guide'>('mission');

  useGSAP(() => {
    if (!ready) return;
    const master = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Initial App Load Animations matching App.tsx
    master.fromTo('.app-header', 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, clearProps: 'transform' }
    );
    master.fromTo('.app-nav',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, clearProps: 'transform' },
      '-=0.6'
    );
    master.fromTo('.sidebar > .panel',
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, stagger: 0.15, clearProps: 'transform' },
      '-=0.4'
    );
    master.fromTo('.main-content > .panel',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, clearProps: 'transform' },
      '-=0.6'
    );
    master.fromTo('.metrics-grid > .metric-card',
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, clearProps: 'all' },
      '-=0.4'
    );

    // Hover effects for cards handled via CSS, but let's add a subtle float to 3D canvas wrapper
    gsap.to('.lp-3d-float', {
      y: 8,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

  }, { scope: containerRef, dependencies: [ready] });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!ready) {
    return (
      <CinematicPreloader
        onComplete={() => setReady(true)}
        appMode={userProfile?.appMode || 'cycle'}
        themeMode={themeMode}
      />
    );
  }

  return (
    <div className="app-wrapper lp-wrapper" ref={containerRef}>
      <div className="app-bg-glow" />
      <div className="app-container">

        {/* ===== HEADER ===== */}
        <header className="app-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
            <div className="header-brand" style={{ cursor: 'default' }}>
              <img src={userProfile?.appMode === 'pregnancy' ? pregnancyLogo : auraLogo} alt="Aura Femme Logo" className="brand-logo-img" />
            </div>

            <div className="header-actions">
              <button className="lp-open-app-btn" onClick={onGoToApp}>
                Open App <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* ===== CAPSULE NAV ===== */}
        <nav className="app-nav">
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'mission' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mission'); scrollToSection('mission'); }}
          >
            {activeTab === 'mission' && <div className="nav-active-bg" />}
            <span className="nav-item-content">
              <ShieldAlert className="w-5 h-5" />
              <span className="nav-item-text">Mission</span>
            </span>
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => { setActiveTab('features'); scrollToSection('features'); }}
          >
            {activeTab === 'features' && <div className="nav-active-bg" />}
            <span className="nav-item-content">
              <Zap className="w-5 h-5" />
              <span className="nav-item-text">Features</span>
            </span>
          </button>
          <button 
            type="button" 
            className={`nav-item ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => { setActiveTab('guide'); scrollToSection('guide'); }}
          >
            {activeTab === 'guide' && <div className="nav-active-bg" />}
            <span className="nav-item-content">
              <Activity className="w-5 h-5" />
              <span className="nav-item-text">Guide</span>
            </span>
          </button>
        </nav>

        {/* ===== DASHBOARD LAYOUT ===== */}
        <section className="main-layout" style={{ marginTop: '0.5rem' }}>
          
          {/* LEFT SIDEBAR */}
          <aside className="sidebar lp-sidebar">
            <div className="glass-card panel lp-hover-card" id="mission">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title" style={{ fontSize: '1.25rem' }}>Clinical Profile</h2>
                </div>
                <Lock className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="sidebar-section">
                  <p className="panel-label" style={{ marginBottom: '0.35rem' }}>Platform Philosophy</p>
                  <h3 className="panel-title" style={{ fontSize: '1.05rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>100% Private & Local</h3>
                  <p className="metric-helper" style={{ lineHeight: 1.6 }}>
                    No cloud. No trackers. No subscriptions. AuraFemme runs entirely on your device, ensuring your reproductive data never leaves your control.
                  </p>
                </div>
                
                <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.125rem', boxShadow: '0 4px 12px rgba(197, 34, 51, 0.25)' }}>
                      A
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        Application Status
                      </p>
                      <p style={{ fontWeight: 600, color: 'var(--text-strong)', margin: '0.15rem 0 0 0', fontSize: '0.95rem' }}>
                        Ready to Track
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={onGoToApp} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
                    Start Tracking Free
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card panel lp-hover-card">
              <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <p className="panel-label">Target Audience</p>
                  <h3 className="panel-title" style={{ fontSize: '1.15rem', marginTop: '0.25rem' }}>Who it's for</h3>
                </div>
                <Users className="w-5 h-5 text-accent-primary" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="panel-body">
                <p className="metric-helper" style={{ lineHeight: 1.6 }}>
                  AuraFemme is for women who demand total control over their health data. Those who want clinical-grade insights — fertile window predictions, luteal phase analysis, pregnancy tracking — without sacrificing digital privacy or paying subscription fees.
                </p>
              </div>
            </div>

            {/* Quote Card */}
            <div className="glass-card panel lp-hover-card" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', lineHeight: 1, margin: '0 0 0.5rem 0', fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold' }}>
                "
              </p>
              <p style={{ color: 'var(--text-strong)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem', fontWeight: 500 }}>
                Finally, an app that respects my privacy and actually understands my body.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <svg key={i} style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="var(--accent-primary)">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="metric-helper" style={{ margin: 0, fontSize: '0.8rem' }}>– Verified User</p>
            </div>

            {/* Feature Bullets Card */}
            <div className="glass-card panel lp-hover-card">
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { label: 'Works Offline', icon: <CloudOff className="w-5 h-5" /> },
                  { label: 'On-Device Processing', icon: <Cpu className="w-5 h-5" /> },
                  { label: 'No Cloud Sync', icon: <ServerOff className="w-5 h-5" /> },
                  { label: 'Open Source', icon: <Code2 className="w-5 h-5" /> }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-strong)', fontWeight: 500 }}>
                    <div style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>{item.icon}</div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="main-content">
            
            {/* Hero Insight Card */}
            <div className="glass-card panel lp-hero-insight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Activity style={{ color: 'var(--accent-primary)' }} size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Biological Insight
                </span>
              </div>
              <h1 className="lp-hero-title">
                Your body. <span className="text-gradient">Your data.</span>
              </h1>
              <p className="lp-hero-subtitle">
                "A clinical-grade menstrual health dashboard built on absolute privacy. Just powerful biological intelligence running entirely on your device."
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div className="clinical-badge badge-green">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clinical math online</span>
                </div>
                <div className="clinical-badge badge-green" style={{ background: 'var(--bg-panel)' }}>
                  <Shield className="w-4 h-4" />
                  <span>Zero Trackers</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid (Stats) */}
            <div className="metrics-grid lp-metrics-4col">
              <div className="metric-card lp-hover-card">
                <div>
                  <p className="metric-label">Local Storage</p>
                  <p className="metric-value"><AnimatedValue value={100} suffix="%" /></p>
                  <p className="metric-helper">All data stored locally on device</p>
                </div>
                <div className="metric-icon"><Lock size={20} /></div>
              </div>
              <div className="metric-card lp-hover-card">
                <div>
                  <p className="metric-label">Data Trackers</p>
                  <p className="metric-value">Zero</p>
                  <p className="metric-helper">No ads or third-party scripts</p>
                </div>
                <div className="metric-icon"><Shield size={20} /></div>
              </div>
              <div className="metric-card lp-hover-card">
                <div>
                  <p className="metric-label">Cycle Intelligence</p>
                  <p className="metric-value"><AnimatedValue value={28} /> days</p>
                  <p className="metric-helper">Phase-by-phase mapping</p>
                </div>
                <div className="metric-icon"><Activity size={20} /></div>
              </div>
              <div className="metric-card lp-hover-card">
                <div>
                  <p className="metric-label">Architecture</p>
                  <p className="metric-value">Zero-Knowledge</p>
                  <p className="metric-helper">Data never leaves your device</p>
                </div>
                <div className="metric-icon"><Lock size={20} /></div>
              </div>
            </div>

            {/* CSS Orb Panel */}
            <div className="glass-card panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="lp-datacore-grid">
                <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
                  <div>
                    <p className="panel-label" style={{ marginBottom: '0.5rem' }}>Local-First Architecture</p>
                    <h3 className="panel-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>Zero-Knowledge Data Core</h3>
                    <p className="metric-helper" style={{ fontSize: '0.95rem' }}>Your data stays with you. Always.</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      'End-to-end encryption',
                      'No telemetry collection',
                      'No data sharing',
                      '100% local processing'
                    ].map((text, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-strong)', fontWeight: 500, fontSize: '0.95rem' }}>
                        <CheckCircle2 className="w-5 h-5 text-green-500" style={{ color: '#10b981' }} />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lp-3d-float" style={{ width: '100%', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div className="css-orb-container">
                    <div className="css-orb-core"></div>
                    <div className="css-orb-ring ring-1"></div>
                    <div className="css-orb-ring ring-2"></div>
                    <div className="css-orb-particle p1"></div>
                    <div className="css-orb-particle p2"></div>
                    <div className="css-orb-particle p3"></div>
                    <div className="css-orb-particle p4"></div>
                    <div className="css-orb-particle p5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="glass-card panel" id="features">
              <div className="panel-header">
                <div>
                  <p className="panel-label">Phase Split & Features</p>
                  <h3 className="panel-title">Everything you need. Nothing you don't.</h3>
                </div>
              </div>
              <div className="panel-body lp-features-grid">
                {[
                  { icon: <CalendarDays size={18} />, title: 'Cycle & Pregnancy', desc: 'Switch seamlessly between cycle tracking and fetal development.' },
                  { icon: <Brain size={18} />, title: 'Clinical Intelligence', desc: 'Algorithms adapt to your baseline, analyzing luteal phase lengths.' },
                  { icon: <Activity size={18} />, title: 'Symptom Tracking', desc: 'Log daily symptoms, BBT, and cervical mucus instantly.' },
                  { icon: <FileText size={18} />, title: 'PDF Reports', desc: 'Generate clinical reports to share securely with your OBGYN.' },
                  { icon: <Download size={18} />, title: 'Data Export', desc: 'Export your profile to raw JSON. Never be locked in.' },
                  { icon: <Zap size={18} />, title: 'Instant Access', desc: 'No accounts, no sign-ups. Boot the app and start tracking.' },
                ].map((feature, i) => (
                  <div key={i} className="lp-feature-row">
                    <div className="metric-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>{feature.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '0.2rem' }}>{feature.title}</h4>
                      <p className="metric-helper">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it Works (Timeline) */}
            <div className="glass-card panel" id="guide">
              <div className="panel-header">
                <div>
                  <p className="panel-label">Timeline Sequence</p>
                  <h3 className="panel-title">Three steps to cycle intelligence</h3>
                </div>
              </div>
              <div className="panel-body">
                <div className="lp-timeline-row">
                  {[
                    { num: '01', title: 'Open the App', desc: 'Click "Start Tracking". AuraFemme runs entirely in your browser — no sign-up.' },
                    { num: '02', title: 'Set Your Baseline', desc: 'Enter the date of your last period. Our algorithms calculate your phase immediately.' },
                    { num: '03', title: 'Log & Analyze', desc: 'Log symptoms daily to update the 3D visualizer and receive clinical guidance.' },
                  ].map((step, i) => (
                    <div key={i} className="lp-timeline-item-wrapper">
                      <div className="glass-card lp-timeline-card">
                        <div className="lp-timeline-marker">{step.num}</div>
                        <div className="lp-timeline-content">
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '0.25rem' }}>{step.title}</h4>
                          <p className="metric-helper">{step.desc}</p>
                        </div>
                      </div>
                      {i < 2 && <ArrowRight className="lp-timeline-arrow" size={24} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </main>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <p className="footer-text">
            Designed & Developed with <Heart size={14} className="footer-heart" fill="currentColor" /> by <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="footer-link">Karthik Lal</a>
          </p>
        </footer>

      </div>
    </div>
  );
}
