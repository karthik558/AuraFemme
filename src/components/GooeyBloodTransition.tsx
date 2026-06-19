import type { CSSProperties } from 'react';
import type { ThemeMode } from '../types';
import { useRef } from 'react';
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

const dripLayout = [
  { left: '-4%', width: '16%', height: '34vh', delay: 0 },
  { left: '7%', width: '18%', height: '48vh', delay: 0.05 },
  { left: '21%', width: '13%', height: '30vh', delay: 0.11 },
  { left: '31%', width: '24%', height: '64vh', delay: 0.02 },
  { left: '49%', width: '16%', height: '40vh', delay: 0.14 },
  { left: '61%', width: '22%', height: '56vh', delay: 0.07 },
  { left: '78%', width: '15%', height: '36vh', delay: 0.17 },
  { left: '88%', width: '18%', height: '46vh', delay: 0.1 },
];

const dropletLayout = [
  { left: '12%', size: '0.9rem' },
  { left: '26%', size: '0.55rem' },
  { left: '43%', size: '0.8rem' },
  { left: '68%', size: '0.65rem' },
  { left: '83%', size: '0.95rem' },
];

export function GooeyBloodTransition({ isActive, targetTheme, targetAppMode, onSwitch, onComplete }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const switchedRef = useRef(false);

  const liquidColor = targetAppMode === 'pregnancy' ? '#8b5cf6' : '#ef4a5d';
  const liquidDark = targetAppMode === 'pregnancy'
    ? (targetTheme === 'dark' ? '#21123f' : '#6d28d9')
    : (targetTheme === 'dark' ? '#5f0f1b' : '#b91c2b');
  const liquidLight = targetAppMode === 'pregnancy' ? '#c4b5fd' : '#ff8fa0';

  useGSAP(() => {
    if (!isActive || !wrapperRef.current || !sheetRef.current || !frontRef.current || !surfaceRef.current) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    switchedRef.current = false;

    if (reduceMotion) {
      onSwitch();
      onComplete();
      return;
    }

    const drips = gsap.utils.toArray<HTMLElement>('.blood-drip', wrapperRef.current);
    const droplets = gsap.utils.toArray<HTMLElement>('.blood-droplet', wrapperRef.current);
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete,
    });

    gsap.set(wrapperRef.current, { autoAlpha: 1 });
    gsap.set(sheetRef.current, { yPercent: -112 });
    gsap.set(frontRef.current, { yPercent: -118 });
    gsap.set(surfaceRef.current, { scaleX: 0.9, y: 0 });
    gsap.set(highlightRef.current, { xPercent: -35, autoAlpha: 0 });
    gsap.set(drips, { yPercent: -80, scaleY: 0.3, transformOrigin: '50% 0%' });
    gsap.set(droplets, { y: -90, autoAlpha: 0, scale: 0.45 });

    tl.to(sheetRef.current, {
      yPercent: -4,
      duration: 0.58,
      ease: 'power3.in',
    }, 0)
      .to(frontRef.current, {
        yPercent: -8,
        duration: 0.72,
        ease: 'power2.inOut',
      }, 0.02)
      .to(surfaceRef.current, {
        scaleX: 1.04,
        y: 14,
        duration: 0.48,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      }, 0.08)
      .to(drips, {
        yPercent: 18,
        scaleY: 1,
        duration: 0.62,
        stagger: {
          each: 0.045,
          from: 'random',
        },
        ease: 'expo.out',
      }, 0.06)
      .to(droplets, {
        autoAlpha: 0.8,
        y: 120,
        scale: 1,
        duration: 0.76,
        stagger: 0.055,
        ease: 'power2.in',
      }, 0.12)
      .to(highlightRef.current, {
        autoAlpha: 0.42,
        xPercent: 45,
        duration: 0.7,
        ease: 'sine.inOut',
      }, 0.12)
      .call(() => {
        if (!switchedRef.current) {
          switchedRef.current = true;
          onSwitch();
        }
      }, undefined, 0.74)
      .to(frontRef.current, {
        yPercent: 112,
        duration: 0.74,
        ease: 'power3.inOut',
      }, 0.88)
      .to(sheetRef.current, {
        yPercent: 116,
        duration: 0.82,
        ease: 'power3.inOut',
      }, 0.9)
      .to(drips, {
        yPercent: 118,
        scaleY: 0.75,
        duration: 0.58,
        stagger: {
          each: 0.03,
          from: 'end',
        },
        ease: 'power2.in',
      }, 0.82)
      .to(droplets, {
        autoAlpha: 0,
        y: 260,
        scale: 0.65,
        duration: 0.42,
        ease: 'power2.in',
      }, 0.82)
      .to(wrapperRef.current, {
        autoAlpha: 0,
        duration: 0.18,
        ease: 'sine.out',
      }, 1.5);

    return () => {
      tl.kill();
    };
  }, { dependencies: [isActive, targetTheme, targetAppMode], scope: wrapperRef });

  if (!isActive) return null;

  return createPortal(
    <div
      ref={wrapperRef}
      className="gooey-transition-wrapper"
      style={{
        '--liquid-color': liquidColor,
        '--liquid-dark': liquidDark,
        '--liquid-light': liquidLight,
      } as CSSProperties}
    >
      <svg aria-hidden="true" focusable="false" className="gooey-filter-svg">
        <filter id="gooey-transition-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      <div className="liquid-sheet" ref={sheetRef}>
        <div className="liquid-front" ref={frontRef}>
          <div className="liquid-highlight" ref={highlightRef} />
          <div className="liquid-surface" ref={surfaceRef} />
          <div className="liquid-body" />
          {dripLayout.map((drip, i) => (
            <div
              key={i}
              className="blood-drip"
              style={{
                left: drip.left,
                width: drip.width,
                height: drip.height,
                animationDelay: `${drip.delay}s`,
              }}
            />
          ))}
        </div>
        {dropletLayout.map((drop, i) => (
          <div
            key={i}
            className="blood-droplet"
            style={{
              left: drop.left,
              width: drop.size,
              height: drop.size,
            }}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}
