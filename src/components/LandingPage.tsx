import { useRef } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Brain,
  Lock,
  Activity,
  Sparkles,
  Download,
  Heart,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import HormoneWave3D from './HormoneWave3D';
import auraLogo from '../assets/icon-color.png';
import './LandingPage.css';

interface LandingPageProps {
  onGoToApp: () => void;
}

const chartData = [
  { day: 'Day 1', estrogen: 30, progesterone: 8, lh: 5 },
  { day: 'Day 5', estrogen: 55, progesterone: 10, lh: 7 },
  { day: 'Day 9', estrogen: 130, progesterone: 12, lh: 15 },
  { day: 'Day 12', estrogen: 240, progesterone: 18, lh: 35 },
  { day: 'Day 14', estrogen: 190, progesterone: 25, lh: 140 },
  { day: 'Day 17', estrogen: 150, progesterone: 90, lh: 20 },
  { day: 'Day 21', estrogen: 130, progesterone: 170, lh: 12 },
  { day: 'Day 25', estrogen: 80, progesterone: 120, lh: 8 },
  { day: 'Day 28', estrogen: 35, progesterone: 15, lh: 5 },
];

export function LandingPage({ onGoToApp }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.lp-hero-badge',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.15 }
      )
        .fromTo(
          '.lp-hero-heading',
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          '-=0.5'
        )
        .fromTo(
          '.lp-hero-sub',
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          '-=0.7'
        )
        .fromTo(
          '.lp-hero-actions',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          '-=0.6'
        )
        .fromTo(
          '.lp-hero-3d',
          { y: 40, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2 },
          '-=0.7'
        )
        .fromTo(
          '.lp-hero-stats',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          '-=0.8'
        );

      // Scroll-triggered reveals via IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const delay = parseFloat(el.dataset.delay || '0');
              gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 0.9,
                delay,
                ease: 'power3.out',
              });
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      );

      document.querySelectorAll('.sa').forEach((el) => {
        gsap.set(el, { y: 45, opacity: 0 });
        observer.observe(el);
      });

      return () => observer.disconnect();
    },
    { scope: containerRef }
  );

  return (
    <div className="landing-page" ref={containerRef}>
      {/* Animated aurora blobs */}
      <div className="lp-aurora">
        <div className="lp-aurora-blob" />
        <div className="lp-aurora-blob" />
        <div className="lp-aurora-blob" />
      </div>
      <div className="lp-grid-overlay" />

      {/* ── Navigation ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <img src={auraLogo} alt="Aura Femme" />
        </div>

        <div className="lp-nav-center">
          <a href="#features" className="lp-nav-pill">
            Features
          </a>
          <a href="#how" className="lp-nav-pill">
            How it works
          </a>
          <a href="#data" className="lp-nav-pill">
            Intelligence
          </a>
        </div>

        <button onClick={onGoToApp} className="lp-nav-cta">
          Open App <ArrowRight size={16} />
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge">
          <span className="lp-hero-badge-dot" />
          Privacy-first cycle intelligence
        </div>

        <h1 className="lp-hero-heading">
          Your cycle,{' '}
          <span className="gradient-text">scientifically decoded.</span>
        </h1>

        <p className="lp-hero-sub">
          AuraFemme is a local-first, clinical-grade menstrual health platform.
          No cloud. No tracking. Just powerful insights that live on your device.
        </p>

        <div className="lp-hero-actions">
          <button onClick={onGoToApp} className="lp-btn-primary">
            Start Tracking Free <ArrowRight size={18} />
          </button>
          <a href="#features" className="lp-btn-ghost">
            See how it works <ChevronRight size={18} />
          </a>
        </div>

        {/* Interactive 3D Canvas */}
        <div className="lp-hero-3d">
          <HormoneWave3D
            day={14}
            mode="cycle"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Stats */}
        <div className="lp-hero-stats">
          <div className="lp-stat">
            <div className="lp-stat-value">100%</div>
            <div className="lp-stat-label">Local Storage</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-value">28-day</div>
            <div className="lp-stat-label">Cycle Mapping</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-value">6+</div>
            <div className="lp-stat-label">Phase Metrics</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-value">0</div>
            <div className="lp-stat-label">Data Sent to Cloud</div>
          </div>
        </div>
      </section>

      {/* ── Features — Bento Grid ── */}
      <section id="features" className="lp-section">
        <div className="lp-section-header sa">
          <div>
            <div className="lp-section-tag">Platform</div>
            <h2 className="lp-section-title">
              Built different. Designed for women who demand better.
            </h2>
          </div>
        </div>

        <div className="lp-bento">
          {/* Card 1 — Large */}
          <div className="lp-bento-card sa" data-delay="0">
            <div className="lp-bento-icon">
              <Lock size={26} />
            </div>
            <h3 className="lp-bento-title">Absolute Privacy Architecture</h3>
            <p className="lp-bento-desc">
              Your most intimate health data never leaves your device. We built
              AuraFemme on a strict local-first storage model — zero cloud sync,
              zero tracking, zero third-party access. Your body, your data, your
              rules.
            </p>
          </div>

          {/* Card 2 */}
          <div className="lp-bento-card sa" data-delay="0.1">
            <div className="lp-bento-icon">
              <Brain size={26} />
            </div>
            <h3 className="lp-bento-title">Clinical Intelligence</h3>
            <p className="lp-bento-desc">
              Algorithms trained on gynecological guidelines adapt to your unique
              cycle, analyzing luteal phase length and fertile windows with
              real-time advisories.
            </p>
          </div>

          {/* Card 3 */}
          <div className="lp-bento-card sa" data-delay="0.15">
            <div className="lp-bento-icon">
              <Activity size={26} />
            </div>
            <h3 className="lp-bento-title">Real-time Signals</h3>
            <p className="lp-bento-desc">
              Log symptoms daily and watch your dashboard update with
              phase-aligned insights mapped to physiological markers.
            </p>
          </div>

          {/* Card 4 */}
          <div className="lp-bento-card sa" data-delay="0.2">
            <div className="lp-bento-icon">
              <Download size={26} />
            </div>
            <h3 className="lp-bento-title">Portable & Exportable</h3>
            <p className="lp-bento-desc">
              Export your entire profile to JSON or generate clinical PDF reports
              at any time. You are never locked in.
            </p>
          </div>

          {/* Card 5 */}
          <div className="lp-bento-card sa" data-delay="0.25">
            <div className="lp-bento-icon">
              <ShieldCheck size={26} />
            </div>
            <h3 className="lp-bento-title">Scientific Rigor</h3>
            <p className="lp-bento-desc">
              Peer-reviewed references, built-in knowledge base, and clinical
              accuracy you can trust for conception or avoidance goals.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="lp-section">
        <div className="lp-section-header sa">
          <div>
            <div className="lp-section-tag">How it works</div>
            <h2 className="lp-section-title">
              From zero to full cycle intelligence in 30 seconds.
            </h2>
          </div>
        </div>

        <div className="lp-steps">
          <div className="lp-step sa" data-delay="0">
            <div className="lp-step-number">01</div>
            <h3 className="lp-step-title">Open & Start</h3>
            <p className="lp-step-desc">
              No sign-up or account creation required. Click "Start Tracking"
              and instantly access the full platform. Create an offline profile
              or continue as a guest.
            </p>
          </div>

          <div className="lp-step sa" data-delay="0.1">
            <div className="lp-step-number">02</div>
            <h3 className="lp-step-title">Set Your Baseline</h3>
            <p className="lp-step-desc">
              Enter your last period date, average cycle length, and bleeding
              duration. Our algorithms immediately generate a complete calendar
              and phase map.
            </p>
          </div>

          <div className="lp-step sa" data-delay="0.2">
            <div className="lp-step-number">03</div>
            <h3 className="lp-step-title">Track & Understand</h3>
            <p className="lp-step-desc">
              Log daily symptoms securely. The dashboard predicts fertile
              windows, ovulation timing, and future periods — all calculated
              locally on your device.
            </p>
          </div>
        </div>
      </section>

      {/* ── Data Showcase ── */}
      <section id="data" className="lp-data-showcase">
        {/* Legend */}
        <div className="lp-chart-legend sa">
          <div className="lp-legend-item">
            <span
              className="lp-legend-dot"
              style={{ background: '#0ea5e9' }}
            />
            Estrogen
          </div>
          <div className="lp-legend-item">
            <span
              className="lp-legend-dot"
              style={{ background: '#c026d3' }}
            />
            Progesterone
          </div>
          <div className="lp-legend-item">
            <span
              className="lp-legend-dot"
              style={{ background: '#f59e0b' }}
            />
            LH Surge
          </div>
        </div>

        <div className="lp-data-card sa">
          <div className="lp-data-text">
            <div className="lp-section-tag">Intelligence</div>
            <h2>
              Visualize the invisible shifts inside your body.
            </h2>
            <p>
              Experience your hormonal rhythms through interactive, clinically
              accurate charts. AuraFemme transforms symptomatic data into a
              clear, navigable biological landscape.
            </p>
            <div>
              <button onClick={onGoToApp} className="lp-btn-primary">
                <Sparkles size={18} /> Experience the Dashboard
              </button>
            </div>
          </div>

          <div className="lp-data-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient
                    id="gEst"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#0ea5e9"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="gProg"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#c026d3" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#c026d3"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gLh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#f59e0b"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  dy={8}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(5, 2, 8, 0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    padding: '14px 18px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  labelStyle={{
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '6px',
                    fontWeight: 600,
                  }}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <Area
                  type="monotone"
                  dataKey="estrogen"
                  name="Estrogen"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gEst)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#0ea5e9' }}
                />
                <Area
                  type="monotone"
                  dataKey="progesterone"
                  name="Progesterone"
                  stroke="#c026d3"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gProg)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#c026d3' }}
                />
                <Area
                  type="monotone"
                  dataKey="lh"
                  name="LH Surge"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gLh)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta sa">
        <h2 className="lp-cta-title">
          Ready to own
          <br />
          your health data?
        </h2>
        <p className="lp-cta-sub">
          No sign-up. No cloud. Just open the app and start understanding your
          body in ways you never could before.
        </p>
        <button onClick={onGoToApp} className="lp-btn-primary">
          Launch Application <ArrowRight size={18} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src={auraLogo} alt="Aura Femme" />
          </div>
          <div className="lp-footer-copy">
            Designed & Developed with <Heart size={14} fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', color: '#ef4a5d' }} /> by <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="lp-footer-link">Karthik Lal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
