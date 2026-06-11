import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicAudio } from '../hooks/useCinematicAudio';
import './CinematicPreloader.css';

interface Props {
  onComplete: () => void;
  appMode: 'cycle' | 'pregnancy' | 'postpartum';
}

export function CinematicPreloader({ onComplete, appMode }: Props) {
  const [phase, setPhase] = useState<'dripping' | 'shattering' | 'dissolving'>('dripping');
  const { playHeartbeat, playDrip, playShatter } = useCinematicAudio();

  useEffect(() => {
    // Audio loops for Phase 1
    const heartInterval = setInterval(playHeartbeat, 500); // 2 beats per second
    const dripInterval = setInterval(playDrip, 200); // Very fast dripping sound

    // Timeline
    const shatterTimer = setTimeout(() => {
      setPhase('shattering');
      clearInterval(heartInterval);
      clearInterval(dripInterval);
      playShatter();
    }, 1200); // Shatter after 1.2s instead of 2.5s
    const dissolveTimer = setTimeout(() => setPhase('dissolving'), 1600); // Dissolve after 1.6s
    const completeTimer = setTimeout(() => onComplete(), 2200); // Finish entirely at 2.2s

    return () => {
      clearInterval(heartInterval);
      clearInterval(dripInterval);
      clearTimeout(shatterTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, playHeartbeat, playDrip, playShatter]);

  // Precalculate drops to avoid impure Math.random during render
  const [drops] = useState(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      return {
        id: i,
        size: 8 + Math.random() * 8, // Realistic small drop
        targetY: 100 + Math.random() * 80,
        duration: 0.5 + Math.random() * 0.4, // Faster dripping
        delay: Math.random() * 0.5
      };
    });
  });

  // Precalculate Shards (60 shards for hyper-violence)
  const [shards] = useState(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const points = Array.from({ length: 3 }).map(() => `${Math.floor(Math.random() * 100)}% ${Math.floor(Math.random() * 100)}%`).join(', ');
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5);
      const distance = 200 + Math.random() * 600; // Explode much further
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 1080; 

      return {
        id: i,
        clipPath: `polygon(${points})`,
        width: 30 + Math.random() * 50,
        height: 30 + Math.random() * 50,
        x,
        y,
        rot,
        scale: 1 + Math.random() * 3 // Fly heavily towards camera
      };
    });
  });

  // Precalculate Particles
  const [particles] = useState(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 400; 
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 2 + Math.random() * 4,
        duration: 0.8 + Math.random() * 0.5
      };
    });
  });

  const themeColor = appMode === 'pregnancy' ? '#8b5cf6' : '#c52233';
  const heartPath = "M50 85 C50 85, 10 55, 10 30 A20 20 0 0 1 50 20 A20 20 0 0 1 90 30 C90 55, 50 85, 50 85 Z";

  return (
    <AnimatePresence>
      <motion.div 
        className="cinematic-preloader-wrapper"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'dissolving' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }} // Faster overall fade out
        style={{ '--accent-primary': themeColor } as React.CSSProperties}
      >
        <div className="cinematic-ambient-glow" />

        {/* Phase 1: The Dripping Glass Heart */}
        {phase === 'dripping' && (
          <motion.div 
            className="cinematic-svg-container"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <clipPath id="heart-clip">
                  <path d={heartPath} />
                </clipPath>
              </defs>
              
              {/* Gooey Drops from the bottom tip (50, 85) */}
              <g filter="url(#blood-goo)">
                {/* Anchor point for the liquid at the bottom of the heart */}
                <circle cx="50" cy="83" r="5" fill={themeColor} />
                
                {/* Falling Drops */}
                {drops.map((drop) => (
                  <motion.circle
                    key={`drop-${drop.id}`}
                    cx="50"
                    r={drop.size / 2}
                    fill={themeColor}
                    initial={{ cy: 85, scale: 0 }}
                    animate={{ cy: drop.targetY, scale: [0, 1, 1, 0.2] }}
                    transition={{
                      duration: drop.duration,
                      repeat: Infinity,
                      ease: "easeIn",
                      delay: drop.delay,
                      times: [0, 0.2, 0.8, 1]
                    }}
                  />
                ))}
              </g>

              {/* The Crystal Vessel Background/Outline */}
              <path 
                d={heartPath} 
                fill="rgba(0,0,0,0.4)" 
                stroke="rgba(255,255,255,0.6)" 
                strokeWidth="0.5" 
                style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' }} 
              />

              {/* The Liquid Filling Inside the Heart */}
              <g clipPath="url(#heart-clip)">
                <motion.rect 
                  x="0" 
                  width="100" 
                  height="100" 
                  fill={themeColor} 
                  initial={{ y: 90 }} 
                  animate={{ y: 25 }} 
                  transition={{ duration: 1.2, ease: "easeInOut" }} 
                />
                {/* Wavy top for liquid */}
                <motion.path 
                  d="M0 0 Q 25 10, 50 0 T 100 0 L 100 100 L 0 100 Z"
                  fill={themeColor}
                  initial={{ y: 88, x: -10 }}
                  animate={{ y: 23, x: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </g>

              {/* Crystal Shine Overlay */}
              <path 
                d="M50 20 A20 20 0 0 0 15 35 Q 15 50, 30 65 Q 40 40, 50 25 Z" 
                fill="rgba(255,255,255,0.15)" 
                style={{ filter: 'blur(1px)' }} 
              />
            </svg>
          </motion.div>
        )}

        {/* Phase 2: The Flash & Shatter */}
        {phase === 'shattering' && (
          <motion.div 
            className="cinematic-flash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}

        {/* Phase 2 & 3: Shards and Mist */}
        {(phase === 'shattering' || phase === 'dissolving') && (
          <div style={{ position: 'relative', width: 0, height: 0, zIndex: 30 }}>
            {/* The Shards */}
            {shards.map((shard) => (
              <motion.div
                key={`shard-${shard.id}`}
                className="cinematic-shard"
                style={{
                  width: shard.width,
                  height: shard.height,
                  clipPath: shard.clipPath,
                  marginLeft: -shard.width / 2,
                  marginTop: -shard.height / 2
                }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
                animate={{ 
                  x: shard.x, 
                  y: shard.y, 
                  rotate: shard.rot, 
                  opacity: phase === 'dissolving' ? 0 : 1,
                  filter: phase === 'dissolving' ? 'blur(15px)' : 'blur(0px)',
                  scale: shard.scale
                }}
                transition={{
                  type: 'spring',
                  stiffness: 140,
                  damping: 12,
                  mass: 0.8,
                  ...(phase === 'dissolving' && { type: 'tween', duration: 0.4, ease: 'easeOut' })
                }}
              />
            ))}

            {/* The Particle Mist */}
            {particles.map((p) => (
              <motion.div
                key={`particle-${p.id}`}
                className="cinematic-mist-particle"
                style={{
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ 
                  x: p.x, 
                  y: p.y, 
                  scale: phase === 'dissolving' ? 0 : 1.5,
                  opacity: phase === 'dissolving' ? 0 : 0.8
                }}
                transition={{
                  type: 'tween',
                  duration: p.duration,
                  ease: "easeOut",
                  ...(phase === 'dissolving' && { duration: 0.4 })
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
