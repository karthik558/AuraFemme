import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CinematicPreloader.css';

interface Props {
  onComplete: () => void;
  appMode: 'cycle' | 'pregnancy' | 'postpartum';
  themeMode: 'dark' | 'light';
}

export function CinematicPreloader({ onComplete, appMode, themeMode }: Props) {
  const [phase, setPhase] = useState<'animating' | 'dissolving'>('animating');

  useEffect(() => {
    // 1.5 seconds of hypnotic DNA rotation, then dissolve
    const dissolveTimer = setTimeout(() => setPhase('dissolving'), 1500); 
    const completeTimer = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const themeColor = appMode === 'pregnancy' ? '#8b5cf6' : '#c52233';
  const bgColor = themeMode === 'light' ? '#ffffff' : '#0a0a0a';

  return (
    <AnimatePresence>
      <motion.div 
        className="cinematic-preloader-wrapper"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'dissolving' ? 0 : 1, filter: phase === 'dissolving' ? 'blur(20px)' : 'blur(0px)' }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ '--accent-primary': themeColor, background: bgColor } as React.CSSProperties}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </svg>

        <div className="dna-blob-container">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const delay = i * 0.2;
            return (
              <div key={i} className="dna-column">
                <motion.div
                  className="dna-dot dna-top"
                  animate={{ 
                    y: ['-40px', '40px', '-40px'],
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay
                  }}
                />
                <motion.div
                  className="dna-dot dna-bottom"
                  animate={{ 
                    y: ['40px', '-40px', '40px'],
                    scale: [1.2, 0.8, 1.2],
                    opacity: [1, 0.6, 1]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay
                  }}
                />
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
