import type { ThemeMode } from '../types';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './GooeyBloodTransition.css';

interface Props {
  isActive: boolean;
  targetTheme: ThemeMode;
  targetAppMode: 'cycle' | 'pregnancy' | 'postpartum';
  onSwitch: () => void;
  onComplete: () => void;
}

export function GooeyBloodTransition({ isActive, targetTheme, targetAppMode, onSwitch, onComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'animating'>('idle');

  const isDark = targetTheme === 'dark';
  
  let liquidColor = '#c52233'; // default blood red
  if (targetAppMode === 'pregnancy') {
    liquidColor = isDark ? '#0f0a1c' : '#8b5cf6'; // Dark purple vs Light purple
  } else {
    liquidColor = isDark ? '#120a0b' : '#c52233'; // Deep black vs Blood red
  }

  // Deterministic drips for stable render
  const drips = [
    { left: '-5%', width: '15%', height: '30vh' },
    { left: '5%', width: '20%', height: '45vh' },
    { left: '20%', width: '12%', height: '25vh' },
    { left: '30%', width: '25%', height: '60vh' }, // Longest drip
    { left: '45%', width: '18%', height: '35vh' },
    { left: '60%', width: '22%', height: '50vh' },
    { left: '75%', width: '15%', height: '30vh' },
    { left: '85%', width: '20%', height: '40vh' },
  ];

  useEffect(() => {
    if (isActive && phase === 'idle') {
      setTimeout(() => setPhase('animating'), 10);
      
      // Theme switch halfway through (when solid block covers the viewport)
      // The animation takes 1.8s. At 0.9s, y is 0vh, so the 120vh solid block perfectly covers the 100vh screen.
      setTimeout(() => {
        onSwitch();
      }, 900); 
      
      // Complete after 1.8s
      setTimeout(() => {
        setPhase('idle');
        onComplete();
      }, 1800);
    }
  }, [isActive, phase, onSwitch, onComplete]);

  const wipeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isActive && phase === 'animating' && wipeRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(wipeRef.current,
        { y: '-120vh' },
        { y: '150vh', duration: 1.8, ease: 'power1.inOut' }
      );

      const dripsElements = gsap.utils.toArray('.blood-drip', wipeRef.current);
      dripsElements.forEach((drip: any) => {
        gsap.to(drip, {
          y: '20%',
          duration: 0.9,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut'
        });
      });
    }
  }, [isActive, phase]);

  if (!isActive && phase === 'idle') return null;

  return createPortal(
    <div className="gooey-transition-wrapper">
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="blood-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -10" result="blood-goo" />
            <feComposite in="SourceGraphic" in2="blood-goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="gooey-filter-container">
        {phase === 'animating' && (
          <div ref={wipeRef} className="blood-wipe" style={{ transform: 'translateY(-120vh)' }}>
            <div className="blood-solid-block" style={{ backgroundColor: liquidColor }} />
            {drips.map((drip, i) => (
              <div
                key={i}
                className="blood-drip"
                style={{
                  left: drip.left,
                  width: drip.width,
                  height: drip.height,
                  backgroundColor: liquidColor,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
