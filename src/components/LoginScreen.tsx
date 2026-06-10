import { LogIn, User, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserProfile } from '../types'
import logo from '../assets/favicon.png'
import './LoginScreen.css'

interface LoginScreenProps {
  profile: UserProfile
  onLogin: () => void
  onGuest: () => void
  onDeleteProfile: () => void
}

export function LoginScreen({ profile, onLogin, onGuest, onDeleteProfile }: LoginScreenProps) {
  return (
    <div className="login-overlay">
      <motion.div 
        className="glass-card login-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="login-icon-wrap">
          <img src={logo} alt="Aura Femme Logo" className="login-logo" />
        </div>
        
        <h1 className="heading-primary login-title">Welcome Back</h1>
        <p className="login-desc">Your private cycle data is securely stored on this device.</p>
        
        <div className="login-profile-card" onClick={onLogin}>
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{profile.name}</h4>
            <p>{profile.managementType === 'self' ? 'Patient Profile' : 'Managed Profile'}</p>
          </div>
          <LogIn className="login-arrow" size={20} />
        </div>

        <div className="login-actions-container">
          <button className="btn btn-outline btn-guest" onClick={onGuest}>
            <User size={16} />
            Continue as Guest
          </button>
          
          <button className="btn-danger-text" onClick={() => {
            if (window.confirm("Are you sure you want to permanently delete your profile and all logs? This cannot be undone.")) {
              onDeleteProfile()
            }
          }}>
            <Trash2 size={14} />
            Wipe Device Data
          </button>
        </div>
      </motion.div>
    </div>
  )
}
