import { useRef } from 'react';
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
  FileText
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import HormoneWave3D from './HormoneWave3D';
import auraLogo from '../assets/icon-color.png';
import './LandingPage.css';

interface LandingPageProps {
  onGoToApp: () => void;
}

export function LandingPage({ onGoToApp }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });

    tl.fromTo('.lp-nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo('.lp-hero-badge', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.4')
      .fromTo('.lp-hero-title', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.8')
      .fromTo('.lp-hero-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.8')
      .fromTo('.lp-btn-primary', { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1 }, '-=0.8')
      .fromTo('.lp-hero-visual', { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach((el) => {
      gsap.set(el, { y: 30, opacity: 0 });
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, { scope: containerRef });

  return (
    <div className="lp-container" ref={containerRef}>
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
          <Lock size={14} /> 100% Local Storage
        </div>
        <h1 className="lp-hero-title">
          Your body.<br />
          <span>Your data.</span>
        </h1>
        <p className="lp-hero-subtitle">
          AuraFemme is a high-performance, clinical-grade menstrual health dashboard built on absolute privacy. No cloud databases. No tracking pixels. Just powerful biological insights.
        </p>
        <button className="lp-btn-primary" onClick={onGoToApp}>
          Start Tracking Free <ArrowRight size={20} />
        </button>

        <div className="lp-hero-visual fade-up">
          <div className="lp-glass-panel">
            <div className="lp-3d-wrapper">
              <HormoneWave3D day={14} mode="cycle" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== MISSION (WHY & FOR WHOM) ===== */}
      <section id="mission" className="lp-section fade-up">
        <div className="lp-section-header">
          <div className="lp-section-tag">Our Mission</div>
          <h2 className="lp-section-title">Built for autonomy.</h2>
          <p className="lp-section-desc">
            In an era where reproductive health data is constantly monetized and surveilled, AuraFemme was created as an uncompromising alternative.
          </p>
        </div>

        <div className="lp-mission-grid">
          <div className="lp-mission-card lp-glass-panel">
            <div className="lp-mission-icon">
              <ShieldAlert size={32} />
            </div>
            <h3 className="lp-mission-title">Why it exists</h3>
            <p className="lp-section-desc">
              Your menstrual data is your most intimate medical record. Mainstream tracking apps store this data in the cloud, often sharing it with advertisers or exposing it to data breaches. AuraFemme was built to solve this by functioning entirely offline. When you use AuraFemme, you are the sole owner and custodian of your data.
            </p>
          </div>
          <div className="lp-mission-card lp-glass-panel">
            <div className="lp-mission-icon">
              <Users size={32} />
            </div>
            <h3 className="lp-mission-title">Who it's for</h3>
            <p className="lp-section-desc">
              AuraFemme is for women who demand total control over their personal health information. It is for those who want clinical-grade insights—such as fertile window predictions, luteal phase analysis, and pregnancy tracking—without sacrificing their digital privacy or paying predatory subscription fees.
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
          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <CalendarDays size={24} />
            </div>
            <h3 className="lp-feature-title">Cycle & Pregnancy Modes</h3>
            <p className="lp-section-desc">
              Seamlessly switch between tracking your menstrual cycle and monitoring fetal development during pregnancy, all within the same unified dashboard.
            </p>
          </div>
          
          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <Brain size={24} />
            </div>
            <h3 className="lp-feature-title">Clinical Intelligence</h3>
            <p className="lp-section-desc">
              Our algorithms adapt to your unique baseline, analyzing luteal phase lengths and providing real-time advisories based on established medical guidelines.
            </p>
          </div>

          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <Activity size={24} />
            </div>
            <h3 className="lp-feature-title">Symptom Tracking</h3>
            <p className="lp-section-desc">
              Log daily symptoms, basal body temperature, and cervical mucus. Watch your dashboard update instantly with phase-aligned physiological insights.
            </p>
          </div>

          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <FileText size={24} />
            </div>
            <h3 className="lp-feature-title">PDF Clinical Reports</h3>
            <p className="lp-section-desc">
              Generate beautiful, comprehensive PDF reports of your cycle history or pregnancy progress to share securely with your OBGYN or healthcare provider.
            </p>
          </div>

          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <Download size={24} />
            </div>
            <h3 className="lp-feature-title">Raw Data Export</h3>
            <p className="lp-section-desc">
              Because it's your data, you can export your entire profile to raw JSON at any time. You are never locked into the AuraFemme ecosystem.
            </p>
          </div>

          <div className="lp-feature-card lp-glass-panel">
            <div className="lp-feature-icon">
              <Lock size={24} />
            </div>
            <h3 className="lp-feature-title">Zero Cloud Architecture</h3>
            <p className="lp-section-desc">
              Every prediction, every chart, and every data point is calculated and stored locally in your browser's secure IndexedDB storage.
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
            No accounts. No email verification. Start understanding your body immediately.
          </p>
        </div>

        <div className="lp-steps-container">
          <div className="lp-step-card lp-glass-panel fade-up">
            <div className="lp-step-number">01</div>
            <h3 className="lp-step-title">Initialize Platform</h3>
            <p className="lp-section-desc">
              Click "Start Tracking". Since AuraFemme runs entirely in your browser, there is no sign-up process. The application boots instantly into your secure local environment.
            </p>
          </div>

          <div className="lp-step-card lp-glass-panel fade-up">
            <div className="lp-step-number">02</div>
            <h3 className="lp-step-title">Set Your Baseline</h3>
            <p className="lp-section-desc">
              Input the date of your last period and your average cycle length. Our local algorithms immediately calculate your current phase and predict your upcoming fertile window.
            </p>
          </div>

          <div className="lp-step-card lp-glass-panel fade-up">
            <div className="lp-step-number">03</div>
            <h3 className="lp-step-title">Log & Analyze</h3>
            <p className="lp-section-desc">
              Log your symptoms daily. The dashboard will automatically update the 3D hormone visualizer and provide real-time clinical guidance based on your current cycle day.
            </p>
          </div>
        </div>
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
