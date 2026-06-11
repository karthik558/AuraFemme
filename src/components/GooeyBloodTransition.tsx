import type { ThemeMode } from '../types';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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

  if (!isActive && phase === 'idle') return null;

  return createPortal(
    <div className="gooey-transition-wrapper">
      <div className="gooey-filter-container">
        {phase === 'animating' && (
          <motion.div
            className="blood-wipe"
            initial={{ y: '-120vh' }}
            animate={{ y: ['-120vh', '0vh', '150vh'] }}
            transition={{ duration: 1.8, times: [0, 0.5, 1], ease: 'easeInOut' }}
          >
            <div className="blood-solid-block" style={{ backgroundColor: liquidColor }} />
            {drips.map((drip, i) => (
              <motion.div
                key={i}
                className="blood-drip"
                style={{
                  left: drip.left,
                  width: drip.width,
                  height: drip.height,
                  backgroundColor: liquidColor,
                }}
                animate={{ 
                  y: ['0%', '20%', '0%'] // Subtle stretching physics as it falls
                }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>,
    document.body
  );
}
