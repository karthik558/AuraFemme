import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface HormoneLevel {
  name: string;
  value: number; // 0 to 100
  color: string;
}

interface BiologicalDialProps {
  hormones: HormoneLevel[];
  day: number;
}

export default function BiologicalDial({ hormones, day }: BiologicalDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const ctx = gsap.context(() => {
      const groups = svgRef.current?.querySelectorAll('.dial-group');
      if (!groups) return;

      // Animate progress strokes
      const circles = svgRef.current?.querySelectorAll('.dial-progress');
      if (circles) {
        gsap.fromTo(circles, 
          { strokeDasharray: '0 2000' }, 
          { 
            strokeDasharray: (_i, el) => {
              const radius = parseFloat(el.getAttribute('r') || '0');
              const circumference = 2 * Math.PI * radius;
              const percentage = parseFloat(el.getAttribute('data-value') || '0') / 100;
              // Make sure we have a minimum visual representation
              const visualPercent = Math.max(0.02, percentage);
              return `${circumference * visualPercent} ${circumference}`;
            },
            duration: 2, 
            ease: 'power3.out',
            stagger: 0.15
          }
        );
      }

      // Add continuous organic rotation to each ring for a "living" effect
      groups.forEach((g, i) => {
        gsap.to(g, {
          rotation: 360,
          transformOrigin: '100px 100px',
          duration: 30 + (i * 10), // inner rings rotate slower
          repeat: -1,
          ease: 'none',
          // Alternate rotation direction
          modifiers: {
            rotation: gsap.utils.unitize(value => parseFloat(value) * (i % 2 === 0 ? 1 : -1))
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [hormones]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%' }}>
      <div style={{ position: 'relative', width: '320px', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', inset: '10%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          filter: 'blur(20px)', zIndex: 0
        }} />

        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', zIndex: 1, overflow: 'visible' }}>
          <defs>
            <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {hormones.map((h, i) => {
            const radius = 85 - (i * 18);
            const circumference = 2 * Math.PI * radius;
            return (
              <g key={h.name} className="dial-group">
                {/* Ambient Track */}
                <circle 
                  cx="100" cy="100" r={radius} 
                  fill="none" 
                  stroke={h.color} 
                  strokeWidth="10" 
                  opacity="0.08" 
                />
                {/* Glowing Progress */}
                <circle 
                  className="dial-progress"
                  data-value={h.value}
                  cx="100" cy="100" r={radius} 
                  fill="none" 
                  stroke={h.color} 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  filter="url(#heavyGlow)"
                  opacity="0.6"
                  style={{ strokeDasharray: `0 ${circumference}` }}
                />
                {/* Solid Core Progress */}
                <circle 
                  className="dial-progress"
                  data-value={h.value}
                  cx="100" cy="100" r={radius} 
                  fill="none" 
                  stroke={h.color} 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  style={{ strokeDasharray: `0 ${circumference}` }}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Center Content */}
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'var(--bg-panel)', width: '90px', height: '90px', borderRadius: '50%',
          justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.05)', 
          border: '1px solid var(--border-subtle)', zIndex: 2,
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.15rem' }}>Day</span>
          <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1, letterSpacing: '-0.05em' }}>{day}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', width: '100%', maxWidth: '500px' }}>
        {hormones.map(h => (
          <div key={h.name} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(255,255,255,0.02)', 
            padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ position: 'relative', width: '14px', height: '14px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: h.color, filter: 'blur(4px)', opacity: 0.6 }} />
              <div style={{ position: 'absolute', inset: '2px', borderRadius: '50%', background: h.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h.name.replace(/\s*\(.*\)/, '')} {/* Strip out acronyms for cleaner look */}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <p style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-strong)', fontWeight: 700 }}>{Math.round(h.value)}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
