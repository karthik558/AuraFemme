import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, DailyLog, UserProfile, CycleGoal, CaseStudyResult } from './types'
import type { TabKey } from './App'
import { addUtcDays, utcTodayIso } from './utils/calculator'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface AppState {
  // UI State (Not persisted)
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
  ready: boolean
  setReady: (ready: boolean) => void
  sharedCaseStudy: CaseStudyResult | null
  setSharedCaseStudy: (study: CaseStudyResult | null) => void
  toasts: ToastMessage[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void

  // Persisted State
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  logs: Record<string, DailyLog>
  setLogs: (logs: Record<string, DailyLog> | ((prev: Record<string, DailyLog>) => Record<string, DailyLog>)) => void
  addLog: (log: DailyLog) => void
  removeLog: (dateIso: string) => void
  authMode: 'unauthenticated' | 'authenticated' | 'guest'
  setAuthMode: (mode: 'unauthenticated' | 'authenticated' | 'guest') => void
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile | null) => void
  lastPeriodDate: string
  setLastPeriodDate: (date: string) => void
  cycleLength: number
  setCycleLength: (length: number) => void
  bleedingDuration: number
  setBleedingDuration: (duration: number) => void
  lutealPhaseLength: number
  setLutealPhaseLength: (length: number) => void
  goal: CycleGoal
  setGoal: (goal: CycleGoal) => void
  lastIntercourseDate: string
  setLastIntercourseDate: (date: string) => void
  pastPeriodDates: string[]
  setPastPeriodDates: (dates: string[]) => void

  // Multi-Account
  accountId: string | null
  setAccountId: (id: string | null) => void
  inactiveAccounts: Record<string, import('./types').SavedAccount>
  archiveCurrentAccount: () => void
  restoreAccount: (id: string) => void
  deleteAccount: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'overview',
      setActiveTab: (tab) => set({ activeTab: tab }),
      ready: false,
      setReady: (ready) => set({ ready }),
      sharedCaseStudy: null,
      setSharedCaseStudy: (study) => set({ sharedCaseStudy: study }),
      toasts: [],
      addToast: (message, type = 'info') => set((state) => ({ 
        toasts: [...state.toasts, { id: Date.now().toString() + Math.random(), type, message }] 
      })),
      removeToast: (id) => set((state) => ({ 
        toasts: state.toasts.filter(t => t.id !== id) 
      })),

      themeMode: 'light',
      setThemeMode: (mode) => set({ themeMode: mode }),
      logs: {},
      setLogs: (logsOrUpdater) => set((state) => ({
        logs: typeof logsOrUpdater === 'function' ? logsOrUpdater(state.logs) : logsOrUpdater
      })),
      addLog: (log) => set((state) => ({ logs: { ...state.logs, [log.dateIso]: log } })),
      removeLog: (dateIso) => set((state) => {
        const newLogs = { ...state.logs }
        delete newLogs[dateIso]
        return { logs: newLogs }
      }),
      authMode: 'unauthenticated',
      setAuthMode: (mode) => set({ authMode: mode }),
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      lastPeriodDate: addUtcDays(utcTodayIso(), -12),
      setLastPeriodDate: (date) => set({ lastPeriodDate: date }),
      cycleLength: 28,
      setCycleLength: (length) => set({ cycleLength: length }),
      bleedingDuration: 5,
      setBleedingDuration: (duration) => set({ bleedingDuration: duration }),
      lutealPhaseLength: 14,
      setLutealPhaseLength: (length) => set({ lutealPhaseLength: length }),
      goal: 'track',
      setGoal: (goal) => set({ goal }),
      lastIntercourseDate: utcTodayIso(),
      setLastIntercourseDate: (date) => set({ lastIntercourseDate: date }),
      pastPeriodDates: [],
      setPastPeriodDates: (dates) => set({ pastPeriodDates: dates }),

      accountId: null,
      setAccountId: (id) => set({ accountId: id }),
      inactiveAccounts: {},
      archiveCurrentAccount: () => set((state) => {
        if (!state.accountId || !state.userProfile) return state
        const account: import('./types').SavedAccount = {
          id: state.accountId,
          profile: state.userProfile,
          lastPeriodDate: state.lastPeriodDate,
          cycleLength: state.cycleLength,
          bleedingDuration: state.bleedingDuration,
          lutealPhaseLength: state.lutealPhaseLength,
          goal: state.goal,
          lastIntercourseDate: state.lastIntercourseDate,
          logs: state.logs,
          pastPeriodDates: state.pastPeriodDates
        }
        return {
          inactiveAccounts: { ...state.inactiveAccounts, [account.id]: account },
          accountId: null,
          userProfile: null,
          logs: {},
          pastPeriodDates: []
        }
      }),
      restoreAccount: (id) => set((state) => {
        const inactiveAccounts = { ...state.inactiveAccounts }
        if (state.accountId && state.userProfile) {
          inactiveAccounts[state.accountId] = {
            id: state.accountId,
            profile: state.userProfile,
            lastPeriodDate: state.lastPeriodDate,
            cycleLength: state.cycleLength,
            bleedingDuration: state.bleedingDuration,
            lutealPhaseLength: state.lutealPhaseLength,
            goal: state.goal,
            lastIntercourseDate: state.lastIntercourseDate,
            logs: state.logs,
            pastPeriodDates: state.pastPeriodDates
          }
        }
        const accToRestore = inactiveAccounts[id]
        if (!accToRestore) return state

        delete inactiveAccounts[id]

        return {
          inactiveAccounts,
          accountId: accToRestore.id,
          userProfile: accToRestore.profile,
          lastPeriodDate: accToRestore.lastPeriodDate,
          cycleLength: accToRestore.cycleLength,
          bleedingDuration: accToRestore.bleedingDuration,
          lutealPhaseLength: accToRestore.lutealPhaseLength,
          goal: accToRestore.goal,
          lastIntercourseDate: accToRestore.lastIntercourseDate,
          logs: accToRestore.logs,
          pastPeriodDates: accToRestore.pastPeriodDates || []
        }
      }),
      deleteAccount: (id) => set((state) => {
        const inactiveAccounts = { ...state.inactiveAccounts }
        delete inactiveAccounts[id]
        return { inactiveAccounts }
      }),
    }),
    {
      name: 'aura-femme-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        logs: state.logs,
        authMode: state.authMode,
        userProfile: state.userProfile,
        lastPeriodDate: state.lastPeriodDate,
        cycleLength: state.cycleLength,
        bleedingDuration: state.bleedingDuration,
        lutealPhaseLength: state.lutealPhaseLength,
        goal: state.goal,
        lastIntercourseDate: state.lastIntercourseDate,
        accountId: state.accountId,
        inactiveAccounts: state.inactiveAccounts,
        pastPeriodDates: state.pastPeriodDates
      }),
    }
  )
)

// Helper to migrate legacy local storage keys to the new zustand store
export const migrateLegacyStorage = () => {
  if (typeof window === 'undefined') return

  const store = useAppStore.getState()
  const hasMigrated = localStorage.getItem('aura-femme-migrated')
  if (hasMigrated) return

  console.log('Migrating legacy Aura Femme storage...')

  // Theme
  const theme = localStorage.getItem('aura-femme-theme')
  if (theme === 'light' || theme === 'dark') store.setThemeMode(theme)

  // Logs
  try {
    const logsStr = localStorage.getItem('aura-femme-logs')
    if (logsStr) store.setLogs(JSON.parse(logsStr))
  } catch {
    console.error('Failed to parse legacy logs')
  }

  // Auth Mode
  const authMode = localStorage.getItem('aura-femme-authmode')
  if (authMode === 'guest' || authMode === 'authenticated' || authMode === 'unauthenticated') {
    store.setAuthMode(authMode)
  }

  // User Profile
  let migratedProfile = null
  try {
    const profileStr = localStorage.getItem('aura-femme-profile')
    if (profileStr) migratedProfile = JSON.parse(profileStr)
  } catch {
    console.error('Failed to parse legacy profile')
  }

  // Fallback for very old 'user' key
  if (!migratedProfile) {
    const oldName = localStorage.getItem('aura-femme-user')
    if (oldName) {
      migratedProfile = {
        name: oldName,
        managementType: 'self',
        lastPeriodDate: addUtcDays(utcTodayIso(), -12),
        cycleLength: 28,
        bleedingDuration: 5
      }
    }
  }

  if (migratedProfile) {
    store.setUserProfile(migratedProfile)
    if (migratedProfile.lastPeriodDate) store.setLastPeriodDate(migratedProfile.lastPeriodDate)
    if (migratedProfile.cycleLength) store.setCycleLength(migratedProfile.cycleLength)
    if (migratedProfile.bleedingDuration) store.setBleedingDuration(migratedProfile.bleedingDuration)
    store.setAuthMode('authenticated')
  }

  // Mark as migrated
  localStorage.setItem('aura-femme-migrated', 'true')
}
