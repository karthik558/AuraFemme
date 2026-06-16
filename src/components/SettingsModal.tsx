import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X, Moon, Sun, Download, Upload, LogOut, Settings as SettingsIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import { GooeyBloodTransition } from './GooeyBloodTransition';
import type { ThemeMode } from '../types';
import './SettingsModal.css';

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

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const handleThemeChange = (targetMode: ThemeMode) => {
    if (themeMode === targetMode || transitionState.isActive) return;
    
    // Visually hide the modal immediately
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 });
    gsap.to(modalRef.current, { y: 16, opacity: 0, scale: 0.97, duration: 0.18 });
    
    setTransitionState({
      isActive: true,
      targetTheme: targetMode
    });
  };

  // Keyboard support: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      gsap.fromTo(modalRef.current, 
        { y: 32, opacity: 0, scale: 0.96 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 });
    gsap.to(modalRef.current, { 
      y: 16, opacity: 0, scale: 0.97, duration: 0.18, 
      onComplete: onClose 
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  const profileInitial = authMode === 'guest' ? 'G' : (userProfile?.name?.charAt(0).toUpperCase() || '?');
  const profileName = authMode === 'guest' ? 'Guest User' : (userProfile?.name || 'User');
  const profileType = authMode === 'guest' 
    ? 'Guest Mode' 
    : (userProfile?.managementType === 'self' ? 'Personal Account' : 'Managed Account');

  const isGuest = authMode === 'guest';

  return (
    <>
      {transitionState.isActive && (
        <GooeyBloodTransition
          isActive={transitionState.isActive}
          targetTheme={transitionState.targetTheme}
          targetAppMode={userProfile?.appMode || 'cycle'}
          onSwitch={() => setThemeMode(transitionState.targetTheme)}
          onComplete={() => {
            setTransitionState(prev => ({ ...prev, isActive: false }));
            onClose();
          }}
        />
      )}

      <div 
        ref={overlayRef}
        className="settings-overlay"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div 
          ref={modalRef}
          className="settings-modal"
        >
          {/* Close */}
          <button 
            onClick={handleClose}
            className="settings-close-btn"
            aria-label="Close settings"
          >
            <X size={17} />
          </button>

          {/* Header */}
          <div className="settings-header">
            <div className="settings-header-icon">
              <SettingsIcon size={22} />
            </div>
            <div className="settings-header-text">
              <h2 className="settings-title">Settings</h2>
              <p className="settings-subtitle">Preferences &amp; account</p>
            </div>
          </div>

          {/* Profile */}
          <div className="settings-profile">
            <div className="settings-avatar" aria-hidden="true">
              {profileInitial}
            </div>
            <div className="settings-profile-info">
              <div className="settings-profile-type">{profileType}</div>
              <div className="settings-profile-name">{profileName}</div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="settings-section">
            <div className="settings-section-title">Appearance</div>
            <div className="theme-switcher-group" role="radiogroup" aria-label="Theme">
              <button
                type="button"
                className={`theme-option ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
                role="radio"
                aria-checked={themeMode === 'light'}
                disabled={transitionState.isActive}
              >
                <Sun size={18} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`theme-option ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
                role="radio"
                aria-checked={themeMode === 'dark'}
                disabled={transitionState.isActive}
              >
                <Moon size={18} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Data & Backup Section */}
          <div className="settings-section">
            <div className="settings-section-title">Data &amp; Backup</div>
            
            <div className="setting-row">
              <div className="setting-row-icon">
                <Download size={19} />
              </div>
              <div className="setting-row-content">
                <p className="setting-row-label">Export Data</p>
                <p className="setting-row-desc">Download a JSON backup of your profile, logs, and history.</p>
              </div>
              <div className="setting-row-actions">
                <button 
                  className="setting-action-btn" 
                  onClick={onExportData} 
                  disabled={isGuest}
                  title={isGuest ? "Not available in guest mode" : "Export your data"}
                >
                  <Download size={15} /> Export
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row-icon">
                <Upload size={19} />
              </div>
              <div className="setting-row-content">
                <p className="setting-row-label">Import Data</p>
                <p className="setting-row-desc">Restore a previous backup file. Replaces current data.</p>
              </div>
              <div className="setting-row-actions">
                <button 
                  className="setting-action-btn" 
                  onClick={onImportClick} 
                  disabled={isGuest}
                  title={isGuest ? "Not available in guest mode" : "Import backup"}
                >
                  <Upload size={15} /> Import
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <div className="settings-section">
            <button 
              onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', outline: 'none' }}
              aria-expanded={isShortcutsOpen}
            >
              <div className="settings-section-title" style={{ margin: 0 }}>Keyboard Shortcuts</div>
              {isShortcutsOpen ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
            </button>
            
            {isShortcutsOpen && (
              <div className="shortcuts-grid" style={{ marginTop: '0.25rem' }}>
                <div className="shortcut-row">
                  <span>Open Settings</span>
                  <div className="shortcut-keys"><kbd>⌘/Ctrl</kbd> + <kbd>,</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Navigate Tabs</span>
                  <div className="shortcut-keys"><kbd>1</kbd> - <kbd>6</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Export Data</span>
                  <div className="shortcut-keys"><kbd>⌘/Ctrl</kbd> + <kbd>E</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Import Data</span>
                  <div className="shortcut-keys"><kbd>⌘/Ctrl</kbd> + <kbd>I</kbd></div>
                </div>
                <div className="shortcut-row">
                  <span>Close Modals</span>
                  <div className="shortcut-keys"><kbd>Esc</kbd></div>
                </div>
              </div>
            )}
          </div>

          {/* Account Section */}
          <div className="settings-section settings-footer-action">
            <div className="settings-section-title">Account</div>
            <button 
              onClick={() => { handleClose(); onSignOut(); }}
              className="signout-btn"
            >
              <LogOut size={17} /> Sign Out
            </button>
          </div>

          {/* Privacy reassurance footer */}
          <p className="settings-footer-note">
            All data is stored <strong>locally on your device</strong>. 100% private &amp; offline.
          </p>
        </div>
      </div>
    </>
  );
}
