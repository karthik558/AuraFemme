import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X, Moon, Sun, Download, Upload, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from '../store';
import { GooeyBloodTransition } from './GooeyBloodTransition';
import type { ThemeMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onExportData: () => void;
  onImportClick: () => void;
}

export function SettingsModal({ isOpen, onClose, onSignOut, onExportData, onImportClick }: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const themeMode = useAppStore(state => state.themeMode);
  const setThemeMode = useAppStore(state => state.setThemeMode);
  const userProfile = useAppStore(state => state.userProfile);
  const authMode = useAppStore(state => state.authMode);

  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    targetTheme: ThemeMode;
  }>({ isActive: false, targetTheme: themeMode });

  const handleThemeChange = (targetMode: ThemeMode) => {
    if (themeMode === targetMode || transitionState.isActive) return;
    setTransitionState({
      isActive: true,
      targetTheme: targetMode
    });
  };

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, 
        { y: 50, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.1)' }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, { 
      y: 20, opacity: 0, scale: 0.95, duration: 0.2, 
      onComplete: onClose 
    });
  };

  return (
    <>
    {transitionState.isActive && (
      <GooeyBloodTransition
        isActive={transitionState.isActive}
        targetTheme={transitionState.targetTheme}
        targetAppMode={userProfile?.appMode || 'cycle'}
        onSwitch={() => setThemeMode(transitionState.targetTheme)}
        onComplete={() => setTransitionState(prev => ({ ...prev, isActive: false }))}
      />
    )}
    <div 
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div 
        ref={modalRef}
        className="glass-card"
        style={{ position: 'relative', padding: '2rem 1.5rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-gradient-start)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--panel-border)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)', margin: 'auto' }}
      >
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'var(--accent-soft)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-strong)'; e.currentTarget.style.background = 'var(--panel-border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-strong)' }}>Settings</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your preferences.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(197, 34, 51, 0.25)' }}>
            {authMode === 'guest' ? 'G' : userProfile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
              {authMode === 'guest' ? 'Guest Mode' : (userProfile?.managementType === 'self' ? 'Personal Account' : 'Managed Account')}
            </p>
            <p style={{ fontWeight: 600, color: 'var(--text-strong)', margin: '0.15rem 0 0 0', fontSize: '1.1rem' }}>
              {authMode === 'guest' ? 'Guest User' : userProfile?.name}
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)' }}>
            <div>
              <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-strong)', fontSize: '0.9rem' }}>Appearance</p>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={() => handleThemeChange(themeMode === 'light' ? 'dark' : 'light')}
              style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)' }}>
            <div>
              <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-strong)', fontSize: '0.9rem' }}>Data Profile</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>Export or import data</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={onExportData} disabled={authMode === 'guest'} title="Export" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export
              </button>
              <button className="btn btn-outline" onClick={onImportClick} disabled={authMode === 'guest'} title="Import" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                <Upload size={14} /> Import
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '0.5rem' }}>
          <button 
            onClick={() => { handleClose(); onSignOut(); }}
            className="btn btn-outline"
            style={{ 
              width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', 
              padding: '0.85rem', color: 'var(--tone-danger, #c52233)', borderColor: 'rgba(197, 34, 51, 0.2)',
              background: 'rgba(197, 34, 51, 0.05)', borderRadius: 'var(--radius-md)'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

      </div>
    </div>
    </>
  );
}
