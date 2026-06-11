export type ThemeMode = 'light' | 'dark'

export type CycleGoal = 'track' | 'conceive' | 'avoid'

export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal'

export type RiskLevel = 'negligible' | 'low' | 'elevated'

export interface CycleInput {
  lastPeriodDate: string
  cycleLength: number
  bleedingDuration: number
  lutealPhaseLength: number
  goal: CycleGoal
}

export interface CycleMetrics extends CycleInput {
  todayIso: string
  cycleStartIso: string
  cycleDay: number
  currentPhase: CyclePhase
  currentPhaseLabel: string
  ovulationDay: number
  fertileWindowStart: number
  fertileWindowEnd: number
  nextPeriodIso: string
  nextPeriodCountdown: number
  ovulationCountdown: number
  isOverdue: boolean
}

export interface CycleDayInfo {
  cycleDay: number
  dateIso: string
  phase: CyclePhase
  phaseLabel: string
  isFertile: boolean
  isPeak: boolean
  isBleeding: boolean
}

export interface CaseStudyInput {
  lastPeriodDate: string
  intercourseDate: string
  cycleLength: number
  lutealPhaseLength: number
}

export interface CaseStudyTimelineItem {
  title: string
  dateIso: string
  cycleDay: number
  detail: string
  tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success'
}

export interface CaseStudyResult {
  input: CaseStudyInput
  ovulationDay: number
  fertileWindowStart: number
  fertileWindowEnd: number
  intercourseCycleDay: number
  daysBeforeOvulation: number
  riskLevel: RiskLevel
  riskLabel: string
  summary: string
  timeline: CaseStudyTimelineItem[]
  confidence: number
}

export interface DailyLog {
  dateIso: string
  symptoms: string[]
  mood: string | null
  notes: string
}

export interface UserProfile {
  name: string
  managementType: 'self' | 'other'
  lastPeriodDate: string
  cycleLength: number
  bleedingDuration: number
  appMode?: 'cycle' | 'pregnancy' | 'postpartum'
}

export interface PregnancyMetrics {
  lmpIso: string
  todayIso: string
  gestationalDays: number
  gestationalWeeks: number
  remainingDays: number
  trimester: 1 | 2 | 3
  estimatedDueDate: string
}
