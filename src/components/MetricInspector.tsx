import { useEffect, useRef } from 'react';
import { X, Calculator, Info, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import type { CycleMetrics, UserProfile } from '../types';

interface MetricInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'ovulation' | 'period' | 'quality' | 'phase' | null;
  metrics: CycleMetrics;
  userProfile: UserProfile | null;
  qualityScore: number;
}

export function MetricInspector({ isOpen, onClose, metricType, metrics, qualityScore }: MetricInspectorProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, 
        { y: '100%', opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }
      );
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen || !metricType) return null;

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(modalRef.current, { 
      y: '100%', 
      opacity: 0, 
      duration: 0.3, 
      ease: 'power3.in',
      onComplete: onClose
    });
  };

  const renderContent = () => {
    switch (metricType) {
      case 'ovulation':
        return (
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator className="w-5 h-5 text-accent-primary" />
              Ovulation Prediction Math
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The exact day of ovulation is estimated using the standard retrograde calculation method.
            </p>
            
            <div style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Cycle Length:</span>
                <span style={{ fontWeight: 700 }}>{metrics.cycleLength} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#ef4444' }}>
                <span>Minus Luteal Phase:</span>
                <span style={{ fontWeight: 700 }}>- {metrics.lutealPhaseLength} days</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                <span>Estimated Peak Day:</span>
                <span style={{ fontWeight: 700 }}>Day {metrics.cycleLength - metrics.lutealPhaseLength}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--accent-soft)', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)' }}>
              <Info className="w-5 h-5" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Your model assumes a fixed luteal phase. If you log consistent basal body temperatures (BBT) showing a temperature shift earlier or later, the algorithm will adapt this constant in future cycles.
              </p>
            </div>
          </>
        );

      case 'period':
        return (
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator className="w-5 h-5 text-accent-primary" />
              Next Period Projection
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The start of your next period is projected forward from your last logged period date.
            </p>
            
            <div style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Last Period Start:</span>
                <span style={{ fontWeight: 700 }}>{new Date(metrics.cycleStartIso).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                <span>Plus Cycle Length:</span>
                <span style={{ fontWeight: 700 }}>+ {metrics.cycleLength} days</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                <span>Expected Next Period:</span>
                <span style={{ fontWeight: 700 }}>{new Date(metrics.nextPeriodIso).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--accent-soft)', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)' }}>
              <Info className="w-5 h-5" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Currently, you are on <strong>Day {metrics.cycleDay}</strong>. The countdown is calculated as the difference between today and the expected next period.
              </p>
            </div>
          </>
        );

      case 'quality':
        return (
          <>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 className="w-5 h-5 text-accent-primary" />
              Data Quality Score
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your Data Quality Score determines how confident the Aura clinical engine is in its predictions.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(#10b981 ${qualityScore}%, var(--bg-inset) 0)` }}>
                <div style={{ position: 'absolute', inset: '8px', background: 'var(--bg-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: qualityScore > 75 ? '#10b981' : qualityScore > 40 ? '#f59e0b' : '#ef4444' }}>{qualityScore}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>How it's calculated:</p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                <li style={{ marginBottom: '0.25rem' }}>We scan your logs over the last 30 days.</li>
                <li style={{ marginBottom: '0.25rem' }}>A perfect score requires logging symptoms, mood, or notes on at least 15 of those 30 days.</li>
                <li>Consistent logging allows the engine to learn your unique symptom correlations and luteal constants.</li>
              </ul>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div 
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
        }}
        onClick={handleClose}
      />
      <div 
        ref={modalRef}
        className="glass-card"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          maxWidth: '500px',
          maxHeight: '85vh',
          background: 'var(--bg-main)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          zIndex: 100000,
          padding: '2rem',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          overflowY: 'auto'
        }}
      >
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--bg-inset)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}
      </div>
    </>
  );
}
