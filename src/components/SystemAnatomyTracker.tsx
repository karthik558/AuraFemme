import { useRef, useMemo, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Brain, Heart, Shield, Flame, Droplets, Activity, Baby, Target, ChevronDown, ChevronUp } from 'lucide-react';
import type { CycleMetrics, UserProfile } from '../types';

interface SystemAnatomyTrackerProps {
  metrics: CycleMetrics;
  userProfile: UserProfile | null;
  gestationalWeeks?: number;
  overridePhase?: string;
}

interface BodySystem {
  id: string;
  icon: React.ReactNode;
  name: string;
  status: string;
  description: string;
  intensity: number; // 0 to 100
  color: string;
}

export default function SystemAnatomyTracker({ metrics, userProfile, gestationalWeeks, overridePhase }: SystemAnatomyTrackerProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const isPregnancyMode = userProfile?.appMode === 'pregnancy';
  const phase = overridePhase || metrics.currentPhase;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Determine bodily effects based on phase or pregnancy
  const systems = useMemo<BodySystem[]>(() => {
    if (isPregnancyMode) {
      const w = gestationalWeeks || 0;
      return [
        {
          id: 'brain',
          icon: <Brain />,
          name: 'Neurological',
          status: w < 14 ? 'Foggy / Dreams' : 'Nesting Insticts',
          description: w < 14 ? 'High hCG and progesterone can cause fatigue and vivid dreams.' : 'Surging oxytocin prepares the brain for bonding.',
          intensity: 80,
          color: '#ec4899' // Pink (Brain)
        },
        {
          id: 'cardio',
          icon: <Heart />,
          name: 'Cardiovascular',
          status: 'High Output',
          description: 'Blood volume increases by up to 50% to support fetal growth. Resting heart rate is elevated.',
          intensity: 95,
          color: '#ef4444' // Red (Heart)
        },
        {
          id: 'metabolism',
          icon: <Flame />,
          name: 'Metabolic',
          status: 'Accelerated',
          description: 'Basal metabolic rate is highly elevated. The body is rapidly burning energy to support the placenta.',
          intensity: 85,
          color: '#f97316' // Orange (Fire/Metabolism)
        },
        {
          id: 'reproductive',
          icon: <Baby />,
          name: 'Uterine',
          status: 'Expanding',
          description: 'Round ligaments are stretching. The uterus is rapidly increasing in size and vascularity.',
          intensity: 100,
          color: '#e11d48' // Deep Red (Reproductive)
        }
      ];
    }

    // Cycle Mode
    switch (phase) {
      case 'menstruation':
        return [
          {
            id: 'brain',
            icon: <Brain />,
            name: 'Neurological',
            status: 'Resetting',
            description: 'Estrogen and progesterone are at baseline. You may experience brain fog or fatigue as hormones hit their lowest point.',
          intensity: 30,
            color: '#ec4899' // Pink
          },
          {
            id: 'skin',
            icon: <Shield />,
            name: 'Integumentary (Skin)',
            status: 'Sensitive',
            description: 'Low estrogen means low collagen production and dry skin. Sensitivity to pain is higher.',
            intensity: 40,
            color: '#fb923c' // Peach
          },
          {
            id: 'reproductive',
            icon: <Droplets />,
            name: 'Reproductive',
            status: 'Active Shedding',
            description: 'Prostaglandins trigger uterine contractions to shed the lining, which can cause cramping and localized inflammation.',
            intensity: 90,
            color: '#e11d48' // Deep Red
          }
        ];
      case 'follicular':
        return [
          {
            id: 'brain',
            icon: <Brain />,
            name: 'Neurological',
            status: 'Optimized',
            description: 'Rising estrogen boosts serotonin and dopamine production. Expect sharp focus, mental clarity, and improved mood.',
            intensity: 85,
            color: '#ec4899'
          },
          {
            id: 'skin',
            icon: <Shield />,
            name: 'Integumentary (Skin)',
            status: 'Glowing',
            description: 'Estrogen stimulates hyaluronic acid and collagen. Skin hydration peaks, giving a natural healthy glow.',
            intensity: 90,
            color: '#fb923c'
          },
          {
            id: 'metabolism',
            icon: <Activity />,
            name: 'Musculoskeletal',
            status: 'High Stamina',
            description: 'Increased pain tolerance and faster muscle recovery. Excellent time for high-intensity physical activity.',
            intensity: 80,
            color: '#f97316'
          }
        ];
      case 'ovulation':
        return [
          {
            id: 'brain',
            icon: <Brain />,
            name: 'Neurological',
            status: 'Peak Confidence',
            description: 'Testosterone and estrogen hit their absolute peaks, driving libido, social energy, and assertiveness.',
            intensity: 100,
            color: '#ec4899'
          },
          {
            id: 'reproductive',
            icon: <Target />,
            name: 'Reproductive',
            status: 'Follicle Rupture',
            description: 'LH surge triggers the release of the egg. You may feel a slight pinch (mittelschmerz) on one side of your pelvis.',
            intensity: 95,
            color: '#e11d48'
          },
          {
            id: 'cardio',
            icon: <Heart />,
            name: 'Cardiovascular',
            status: 'Elevated Temp',
            description: 'Basal body temperature drops slightly, then spikes up to 0.5°F immediately following egg release.',
            intensity: 80,
            color: '#ef4444'
          }
        ];
      case 'luteal':
      default:
        return [
          {
            id: 'brain',
            icon: <Brain />,
            name: 'Neurological',
            status: 'Sedated / Fluctuating',
            description: 'Progesterone acts as a mild sedative, promoting calm. Late in the phase, hormone drops can trigger PMS mood swings.',
            intensity: 60,
            color: '#ec4899'
          },
          {
            id: 'metabolism',
            icon: <Flame />,
            name: 'Metabolic',
            status: 'Hyperactive',
            description: 'Your basal metabolic rate increases. The body burns up to 300 extra calories per day, increasing hunger and cravings.',
            intensity: 90,
            color: '#f97316'
          },
          {
            id: 'skin',
            icon: <Shield />,
            name: 'Integumentary (Skin)',
            status: 'Sebum Production',
            description: 'Progesterone stimulates sebum (oil) production, which can trap bacteria and cause premenstrual breakouts.',
            intensity: 75,
            color: '#fb923c'
          }
        ];
    }
  }, [phase, isPregnancyMode, gestationalWeeks]);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Scanner line animation
    gsap.fromTo('.scanner-line', 
      { scaleY: 0, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 1.5, ease: 'power3.inOut' }
    );

    // Node sequential pop-in
    gsap.fromTo('.system-node',
      { x: -30, opacity: 0, scale: 0.8 },
      { x: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.5)', delay: 0.5 }
    );

  }, { scope: containerRef, dependencies: [systems] });

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {systems.map((sys, index) => (
          <div key={sys.id} className="system-node" style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
            
            {/* Left Column: Icon and Timeline Line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Icon Orb */}
              <div style={{ position: 'relative', width: '2.5rem', height: '2.5rem', flexShrink: 0 }}>
                <div style={{ 
                  position: 'relative', width: '100%', height: '100%', borderRadius: '50%', 
                  background: sys.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ffffff', zIndex: 1, boxShadow: `0 4px 12px ${sys.color}60`
                }}>
                  {sys.icon}
                </div>
              </div>
              
              {/* Vertical Connecting Line (Stretches to fill gap between items) */}
              {index < systems.length - 1 && (
                <div 
                  className="scanner-line"
                  style={{ 
                    flex: 1, width: '2px', background: sys.color, opacity: 0.3, 
                    margin: '0.5rem 0', minHeight: '1.5rem', borderRadius: '1px',
                    transformOrigin: 'top center'
                  }} 
                />
              )}
            </div>

            {/* Right Column: Content Box */}
            <div style={{ flex: 1, paddingBottom: index < systems.length - 1 ? '1.5rem' : '0', minWidth: 0 }}>
              <div 
                onClick={() => setExpandedId(expandedId === sys.id ? null : sys.id)}
                style={{ 
                  background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)',
                  borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedId === sys.id ? '0.75rem' : '0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-strong)' }}>{sys.name}</h4>
                    <span style={{ 
                      fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: sys.color, background: `${sys.color}15`, padding: '0.2rem 0.6rem', borderRadius: '999px'
                    }}>
                      {sys.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {expandedId === sys.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {expandedId === sys.id && (
                  <div className="system-details-content" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {sys.description}
                    </p>
                    
                    {/* Intensity meter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>System Intensity</span>
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-panel)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${sys.intensity}%`, height: '100%', background: sys.color, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: sys.color, fontWeight: 700, minWidth: '24px', textAlign: 'right' }}>{sys.intensity}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
