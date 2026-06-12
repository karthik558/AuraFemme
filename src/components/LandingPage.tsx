import { useRef, useState } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import HormoneWave3D from './HormoneWave3D';
import { CinematicPreloader } from './CinematicPreloader';
import { useAppStore } from '../store';
import auraLogo from '../assets/icon-color.png';
import './LandingPage.css';

interface LandingPageProps {
  onGoToApp: () => void;
}

export function LandingPage({ onGoToApp }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const themeMode = useAppStore(state => state.themeMode);
  const userProfile = useAppStore(state => state.userProfile);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } });

    tl.fromTo('.lp-nav', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
      .fromTo('.lp-hero-badge', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1 }, '-=0.3')
      .fromTo('.lp-hero-title', { y: 50, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)' }, '-=0.7')
      .fromTo('.lp-hero-subtitle', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.8')
      .fromTo('.lp-hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.8')
      .fromTo('.lp-hero-visual', { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.4 }, '-=0.6');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll('.lp-glass, .lp-stat, .lp-section-header');
            if (children.length > 0) {
              gsap.to(children, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 });
            }
            gsap.to(entry.target, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach((el) => {
      gsap.set(el, { y: 40, opacity: 0 });
      const children = el.querySelectorAll('.lp-glass, .lp-stat, .lp-section-header');
      if (children.length > 0) {
        gsap.set(children, { y: 25, opacity: 0 });
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, { scope: containerRef });

  const scrollToMission = () => {
    document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="lp-container" ref={containerRef}>
      {/* Ambient aurora glow */}
      <div className="lp-ambient">
        <div className="lp-ambient-orb" />
        <div className="lp-ambient-orb" />
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <img src={auraLogo} alt="Aura Femme Logo" />
        </div>
        <div className="lp-nav-links">
          <a href="#mission" className="lp-nav-link">Mission</a>
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
        </div>
        <button className="lp-btn-nav" onClick={onGoToApp}>
          Open App
        </button>
      </nav>

      {/* ===== HERO ===== */}
      <section className="lp-hero">
        <div className="lp-hero-badge">
          <Lock size={13} /> 100% Private & Local
        </div>
        <h1 className="lp-hero-title">
          Your body.<br />
          <span>Your data.</span>
        </h1>
        <p className="lp-hero-subtitle">
          A clinical-grade menstrual health dashboard built on absolute privacy. No cloud. No trackers. No subscriptions. Just powerful biological intelligence—running entirely on your device.
        </p>
        <div className="lp-hero-cta">
          <button className="lp-btn-primary" onClick={onGoToApp}>
            Start Tracking Free <ArrowRight size={18} />
          </button>
          <button className="lp-btn-secondary" onClick={scrollToMission}>
            Learn more <ChevronDown size={16} />
          </button>
        </div>

        <div className="lp-hero-visual fade-up">
          <div className="lp-glass lp-3d-wrapper">
            <HormoneWave3D day={14} mode="cycle" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="lp-stats fade-up">
        <div className="lp-stat">
          <div className="lp-stat-value">100%</div>
          <div className="lp-stat-label">Offline</div>
        </div>
        <div className="lp-stat">
          <div className="lp-stat-value">0</div>
          <div className="lp-stat-label">Data Trackers</div>
        </div>
        <div className="lp-stat">
          <div className="lp-stat-value">28d</div>
          <div className="lp-stat-label">Cycle Mapping</div>
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section id="mission" className="lp-section fade-up">
        <div className="lp-section-header">
          <div className="lp-section-tag">Our Mission</div>
          <h2 className="lp-section-title">Built for autonomy, not profit.</h2>
          <p className="lp-section-desc">
            In an era where reproductive health data is constantly monetized and surveilled, AuraFemme exists as an uncompromising alternative.
          </p>
        </div>

        <div className="lp-mission-grid">
          <div className="lp-mission-card lp-glass">
            <div className="lp-mission-icon">
              <ShieldAlert size={28} />
            </div>
            <h3 className="lp-mission-title">Why it exists</h3>
            <p className="lp-section-desc">
              Your menstrual data is your most intimate medical record. Mainstream apps store it in the cloud, sharing with advertisers or exposing it to breaches. AuraFemme was built to solve this—functioning entirely offline. You are the sole custodian of your data.
            </p>
          </div>
          <div className="lp-mission-card lp-glass">
            <div className="lp-mission-icon">
              <Users size={28} />
            </div>
            <h3 className="lp-mission-title">Who it's for</h3>
            <p className="lp-section-desc">
              AuraFemme is for women who demand total control over their health data. Those who want clinical-grade insights—fertile window predictions, luteal phase analysis, pregnancy tracking—without sacrificing digital privacy or paying subscription fees.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="lp-section fade-up">
        <div className="lp-section-header">
          <div className="lp-section-tag">Core Features</div>
          <h2 className="lp-section-title">Everything you need. Nothing you don't.</h2>
        </div>

        <div className="lp-features-grid">
          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <CalendarDays size={22} />
            </div>
            <h3 className="lp-feature-title">Cycle & Pregnancy</h3>
            <p className="lp-section-desc">
              Switch seamlessly between menstrual cycle tracking and fetal development monitoring in a unified dashboard.
            </p>
          </div>

          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <Brain size={22} />
            </div>
            <h3 className="lp-feature-title">Clinical Intelligence</h3>
            <p className="lp-section-desc">
              Algorithms adapt to your unique baseline, analyzing luteal phase lengths and providing real-time medical advisories.
            </p>
          </div>

          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <Activity size={22} />
            </div>
            <h3 className="lp-feature-title">Symptom Tracking</h3>
            <p className="lp-section-desc">
              Log daily symptoms, BBT, and cervical mucus. See your dashboard update with phase-aligned insights instantly.
            </p>
          </div>

          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <FileText size={22} />
            </div>
            <h3 className="lp-feature-title">PDF Reports</h3>
            <p className="lp-section-desc">
              Generate comprehensive clinical reports to share securely with your OBGYN or healthcare provider.
            </p>
          </div>

          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <Download size={22} />
            </div>
            <h3 className="lp-feature-title">Data Export</h3>
            <p className="lp-section-desc">
              Export your entire profile to raw JSON at any time. You are never locked into this ecosystem.
            </p>
          </div>

          <div className="lp-feature-card lp-glass">
            <div className="lp-feature-icon">
              <Lock size={22} />
            </div>
            <h3 className="lp-feature-title">Zero Cloud</h3>
            <p className="lp-section-desc">
              Every prediction, chart, and data point is computed and stored locally in your browser's secure storage.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="lp-section fade-up">
        <div className="lp-section-header">
          <div className="lp-section-tag">How It Works</div>
          <h2 className="lp-section-title">Three steps to cycle intelligence.</h2>
          <p className="lp-section-desc">
            No accounts. No email. Start understanding your body immediately.
          </p>
        </div>

        <div className="lp-steps-container">
          <div className="lp-step-card lp-glass">
            <div className="lp-step-number">1</div>
            <h3 className="lp-step-title">Open the App</h3>
            <p className="lp-section-desc">
              Click "Start Tracking". AuraFemme runs entirely in your browser—no sign-up, no email, no verification. It boots instantly into your secure local environment.
            </p>
          </div>

          <div className="lp-step-card lp-glass">
            <div className="lp-step-number">2</div>
            <h3 className="lp-step-title">Set Your Baseline</h3>
            <p className="lp-section-desc">
              Enter the date of your last period and your average cycle length. Our algorithms immediately calculate your current phase and predict your fertile window.
            </p>
          </div>

          <div className="lp-step-card lp-glass">
            <div className="lp-step-number">3</div>
            <h3 className="lp-step-title">Log & Analyze</h3>
            <p className="lp-section-desc">
              Log your symptoms daily. The dashboard updates the 3D hormone visualizer and provides real-time clinical guidance based on your current cycle day.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="lp-cta-section fade-up">
        <h2 className="lp-cta-title">Ready to take control?</h2>
        <p className="lp-cta-desc">
          Start tracking your cycle with absolute privacy. Free forever, no strings attached.
        </p>
        <button className="lp-btn-primary" onClick={onGoToApp}>
          Launch Dashboard <ArrowRight size={18} />
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-logo">
            <img src={auraLogo} alt="Aura Femme Logo" />
          </div>
          <div className="lp-footer-copy">
            Designed & Developed with <Heart size={14} fill="var(--accent-primary)" stroke="none" /> by <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer">Karthik Lal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
