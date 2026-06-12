import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './CinematicPreloader.css';

interface Props {
  onComplete: () => void;
  appMode: 'cycle' | 'pregnancy' | 'postpartum';
  themeMode: 'dark' | 'light';
}

export function CinematicPreloader({ onComplete, appMode, themeMode }: Props) {
  const [phase, setPhase] = useState<'animating' | 'dissolving'>('animating');
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dissolveTimer = setTimeout(() => setPhase('dissolving'), 1500); 
    const completeTimer = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useGSAP(() => {
    if (phase === 'dissolving') {
      gsap.to(containerRef.current, { opacity: 0, filter: 'blur(20px)', duration: 0.5, ease: 'power2.inOut' });
    }
  }, [phase]);

  useGSAP(() => {
    const tops = gsap.utils.toArray('.dna-top', blobsRef.current);
    const bottoms = gsap.utils.toArray('.dna-bottom', blobsRef.current);

    tops.forEach((top: any, i) => {
      gsap.fromTo(top, 
        { y: -40, scale: 0.8, opacity: 0.6 },
        { y: 40, scale: 1.2, opacity: 1, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2 }
      );
    });

    bottoms.forEach((bottom: any, i) => {
      gsap.fromTo(bottom, 
        { y: 40, scale: 1.2, opacity: 1 },
        { y: -40, scale: 0.8, opacity: 0.6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2 }
      );
    });
  }, { scope: blobsRef });

  const themeColor = appMode === 'pregnancy' ? '#8b5cf6' : '#c52233';
  const bgColor = themeMode === 'light' ? '#ffffff' : '#0a0a0a';

  return (
    <div 
      ref={containerRef}
      className="cinematic-preloader-wrapper"
      style={{ '--accent-primary': themeColor, background: bgColor } as React.CSSProperties}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div ref={blobsRef} className="dna-blob-container">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="dna-column">
            <div className="dna-dot dna-top" />
            <div className="dna-dot dna-bottom" />
          </div>
        ))}
      </div>
    </div>
  );
}
