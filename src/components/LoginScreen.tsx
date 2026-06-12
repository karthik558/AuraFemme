import { LogIn, User, Trash2, PlusCircle } from 'lucide-react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { UserProfile, SavedAccount } from '../types'
import logo from '../assets/favicon.png'
import './LoginScreen.css'

interface LoginScreenProps {
  activeProfile: UserProfile | null
  inactiveAccounts: Record<string, SavedAccount>
  onLogin: (id?: string) => void
  onGuest: () => void
  onDeleteProfile: (id?: string) => void
  onCreateNew: () => void
}

export function LoginScreen({ activeProfile, inactiveAccounts, onLogin, onGuest, onDeleteProfile, onCreateNew }: LoginScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const isMobile = window.innerWidth < 768;
    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? 30 : 0 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out', willChange: 'transform, opacity' }
    );
  }, { scope: containerRef });

  return (
    <div className="login-overlay">
      <div 
        ref={containerRef}
        className="glass-card login-modal"
      >
        <div className="login-icon-wrap">
          <img src={logo} alt="Aura Femme Logo" className="login-logo" />
        </div>
        
        <h1 className="heading-primary login-title">Welcome Back</h1>
        <p className="login-desc">Select an existing profile or create a new one.</p>
        
        <div className="login-profiles-list">
          {activeProfile && (
            <div className="login-profile-card">
              <div className="login-profile-content" onClick={() => onLogin()}>
                <div className="profile-avatar active-avatar">
                  {activeProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h4>{activeProfile.name} (Active)</h4>
                  <p>{activeProfile.managementType === 'self' ? 'Personal Account' : 'Managed Account'}</p>
                </div>
                <LogIn className="login-arrow" size={20} />
              </div>
              <button 
                className="delete-profile-btn"
                title="Delete Profile"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete profile ${activeProfile.name} permanently?`)) {
                    onDeleteProfile();
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {Object.values(inactiveAccounts).map(acc => (
            <div key={acc.id} className="login-profile-card">
              <div className="login-profile-content" onClick={() => onLogin(acc.id)}>
                <div className="profile-avatar">
                  {acc.profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h4>{acc.profile.name}</h4>
                  <p>{acc.profile.managementType === 'self' ? 'Personal Account' : 'Managed Account'}</p>
                </div>
                <LogIn className="login-arrow" size={20} />
              </div>
              <button 
                className="delete-profile-btn"
                title="Delete Profile"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete profile ${acc.profile.name} permanently?`)) {
                    onDeleteProfile(acc.id);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="login-actions-container">
          <button className="btn btn-primary btn-new-profile" onClick={onCreateNew}>
            <PlusCircle size={16} />
            Create New Profile
          </button>

          <button className="btn btn-outline btn-guest" onClick={onGuest}>
            <User size={16} />
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}
