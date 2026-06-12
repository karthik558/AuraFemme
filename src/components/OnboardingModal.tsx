import { useState } from 'react'
import { ArrowRight, User, HeartHandshake, Calendar, Activity, Droplet, CheckCircle } from 'lucide-react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { UserProfile } from '../types'
import { utcTodayIso, addUtcDays } from '../utils/calculator'
import logo from '../assets/favicon.png'
import './OnboardingModal.css'

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void
  onGuest: () => void
}

export function OnboardingModal({ onComplete, onGuest }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  
  // Profile State
  const [managementType, setManagementType] = useState<'self' | 'other' | null>(null)
  const [name, setName] = useState('')
  const [lastPeriodDate, setLastPeriodDate] = useState(() => addUtcDays(utcTodayIso(), -12))
  const [cycleLength, setCycleLength] = useState(28)
  const [bleedingDuration, setBleedingDuration] = useState(5)

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1)
    } else {
      onComplete({
        name: name.trim(),
        managementType: managementType as 'self' | 'other',
        lastPeriodDate,
        cycleLength,
        bleedingDuration
      })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1)
    }
  }

  // Generate last 45 days for horizontal picker
  const recentDays = Array.from({ length: 45 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (modalRef.current) {
      const isMobile = window.innerWidth < 768;
      gsap.fromTo(modalRef.current,
        { opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 },
        { opacity: 1, x: 0, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [step]);

  return (
    <div className="onboarding-overlay">
        {step === 1 && (
          <div 
            ref={modalRef}
            className="glass-card onboarding-modal"
          >
            <div className="onboarding-icon-wrap" style={{ background: 'transparent' }}>
              <img src={logo} alt="Aura Femme Logo" style={{ width: '48px', height: '48px' }} />
            </div>
            <h1 className="heading-primary onboarding-title">Welcome to Aura Femme</h1>
            <p className="onboarding-desc">Your private, 100% offline cycle intelligence companion. To get started, tell us how you'll be using the app.</p>
            
            <div className="role-selection">
              <button 
                className={`role-card ${managementType === 'self' ? 'active' : ''}`}
                onClick={() => setManagementType('self')}
              >
                {managementType === 'self' && <CheckCircle size={18} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--accent-primary)' }} />}
                <User className="role-icon" />
                <h4>For Myself</h4>
                <p>I am tracking my own cycle.</p>
              </button>
              
              <button 
                className={`role-card ${managementType === 'other' ? 'active' : ''}`}
                onClick={() => setManagementType('other')}
              >
                {managementType === 'other' && <CheckCircle size={18} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--accent-primary)' }} />}
                <HeartHandshake className="role-icon" />
                <h4>For Someone Else</h4>
                <p>I am managing this for a partner or patient.</p>
              </button>
            </div>

            <div className="onboarding-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-primary onboarding-btn" disabled={!managementType} onClick={handleNext}>
                Continue <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline onboarding-btn" onClick={onGuest}>
                Skip & Explore as Guest
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div 
            ref={modalRef}
            className="glass-card onboarding-modal"
          >
            <div className="onboarding-icon-wrap">
              <User className="onboarding-icon" />
            </div>
            <h1 className="heading-primary onboarding-title">
              {managementType === 'self' ? "What's your name?" : "What is their name?"}
            </h1>
            <p className="onboarding-desc">
              {managementType === 'self' ? "We'll use this to personalize your dashboard." : "We'll use this to personalize the dashboard and exports."}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleNext() }} className="onboarding-form">
              <input
                type="text"
                className="onboarding-input"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <div className="onboarding-actions split">
                <button type="button" className="btn btn-outline" onClick={handleBack}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div 
            ref={modalRef}
            className="glass-card onboarding-modal step-3"
          >
            <div className="onboarding-icon-wrap">
              <Activity className="onboarding-icon" />
            </div>
            <h1 className="heading-primary onboarding-title">Baseline Biometrics</h1>
            <p className="onboarding-desc">Let's calibrate the cycle intelligence algorithms.</p>

            <div className="biometric-inputs">
              <div className="bio-field">
                <div className="bio-label-wrap">
                  <Calendar size={18} className="bio-icon text-muted" />
                  <label>Last Period Start Date</label>
                  <span className="bio-value" style={{ background: 'transparent' }}>
                    {new Date(lastPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </span>
                </div>
                <div className="horizontal-date-selector">
                  {recentDays.map(dateIso => {
                    const d = new Date(dateIso)
                    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
                    const day = d.getUTCDate()
                    const isSelected = dateIso === lastPeriodDate
                    return (
                      <div 
                        key={dateIso} 
                        className={`date-bubble ${isSelected ? 'selected' : ''}`}
                        onClick={() => setLastPeriodDate(dateIso)}
                      >
                        <span className="date-bubble-month">{month}</span>
                        <span className="date-bubble-day">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bio-field">
                <div className="bio-label-wrap">
                  <Activity size={18} className="bio-icon text-muted" />
                  <label>Average Cycle Length <span className="bio-value">{cycleLength} days</span></label>
                </div>
                <input 
                  type="range" 
                  min="21" 
                  max="35" 
                  value={cycleLength}
                  onChange={e => setCycleLength(Number(e.target.value))}
                />
              </div>

              <div className="bio-field">
                <div className="bio-label-wrap">
                  <Droplet size={18} className="bio-icon text-muted" style={{ color: 'var(--tone-danger)' }} />
                  <label>Average Bleeding Duration <span className="bio-value">{bleedingDuration} days</span></label>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="10" 
                  value={bleedingDuration}
                  onChange={e => setBleedingDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="onboarding-actions split" style={{ marginTop: '2rem', width: '100%' }}>
              <button type="button" className="btn btn-outline" onClick={handleBack}>Back</button>
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Complete Setup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
