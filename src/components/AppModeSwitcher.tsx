import { useState } from 'react';
import { Activity, Baby } from 'lucide-react';
import { GooeyBloodTransition } from './GooeyBloodTransition';
import type { ThemeMode } from '../types';

export function AppModeSwitcher({ mode, themeMode, onChange }: { mode: 'cycle' | 'pregnancy' | 'postpartum'; themeMode: ThemeMode; onChange: (mode: 'cycle' | 'pregnancy' | 'postpartum') => void }) {
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    targetAppMode: 'cycle' | 'pregnancy' | 'postpartum';
  }>({ isActive: false, targetAppMode: mode });

  const handleModeChange = (targetMode: 'cycle' | 'pregnancy' | 'postpartum') => {
    if (mode === targetMode || transitionState.isActive) return;
    setTransitionState({
      isActive: true,
      targetAppMode: targetMode
    });
  };

  const toggleMode = () => {
    handleModeChange(mode === 'cycle' ? 'pregnancy' : 'cycle');
  }

  return (
    <>
      {transitionState.isActive && (
        <GooeyBloodTransition
          isActive={transitionState.isActive}
          targetTheme={themeMode}
          targetAppMode={transitionState.targetAppMode}
          onSwitch={() => onChange(transitionState.targetAppMode)}
          onComplete={() => setTransitionState(prev => ({ ...prev, isActive: false }))}
        />
      )}
      <div className="theme-switcher">
        <button className={`theme-btn desktop-only ${mode === 'cycle' ? 'active' : ''}`} onClick={() => handleModeChange('cycle')} title="Cycle Tracking">
          <Activity className="w-4 h-4" />
          <span className="theme-btn-text hide-on-mobile">Cycle</span>
        </button>
        <button className={`theme-btn desktop-only ${mode === 'pregnancy' ? 'active' : ''}`} onClick={() => handleModeChange('pregnancy')} title="Pregnancy Tracking">
          <Baby className="w-4 h-4" />
          <span className="theme-btn-text hide-on-mobile">Pregnancy</span>
        </button>
        <button type="button" onClick={toggleMode} className="theme-btn mobile-only active" title={`Mode: ${mode === 'cycle' ? 'Cycle' : 'Pregnancy'}`}>
          {mode === 'cycle' ? <Activity className="w-4 h-4" /> : <Baby className="w-4 h-4" />}
        </button>
      </div>
    </>
  )
}
