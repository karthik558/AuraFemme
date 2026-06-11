import type {
  CaseStudyInput,
  CaseStudyResult,
  CaseStudyTimelineItem,
  CycleDayInfo,
  CycleInput,
  CycleMetrics,
  CyclePhase,
  RiskLevel,
} from '../types'

export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function utcTodayIso(referenceDate = new Date()): string {
  return toUtcIso(referenceDate)
}

export function toUtcIso(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10)
}

export function parseUtcIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function splitUtcIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

export function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function addUtcDays(iso: string, amount: number): string {
  const date = parseUtcIso(iso)
  date.setUTCDate(date.getUTCDate() + amount)
  return toUtcIso(date)
}

export function diffUtcDays(laterIso: string, earlierIso: string): number {
  const later = parseUtcIso(laterIso).getTime()
  const earlier = parseUtcIso(earlierIso).getTime()
  return Math.round((later - earlier) / MS_PER_DAY)
}

export function formatUtcDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(parseUtcIso(iso))
}

export function formatUtcShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(parseUtcIso(iso))
}

export function describePhase(phase: CyclePhase): string {
  switch (phase) {
    case 'menstruation':
      return 'Menstruation'
    case 'follicular':
      return 'Follicular'
    case 'ovulation':
      return 'Ovulation Window'
    case 'luteal':
      return 'Luteal'
  }
}

export function getPhase(cycleDay: number, bleedingDuration: number, fertileWindowStart: number, ovulationDay: number): CyclePhase {
  if (cycleDay <= bleedingDuration) {
    return 'menstruation'
  }

  if (cycleDay < fertileWindowStart) {
    return 'follicular'
  }

  if (cycleDay <= ovulationDay) {
    return 'ovulation'
  }

  return 'luteal'
}

export function buildCycleMetrics(input: CycleInput, todayIso = utcTodayIso()): CycleMetrics {
  const cycleLength = clampNumber(input.cycleLength, 21, 40)
  const bleedingDuration = clampNumber(input.bleedingDuration, 2, Math.min(10, cycleLength - 2))
  const lutealPhaseLength = clampNumber(input.lutealPhaseLength, 10, Math.min(18, cycleLength - bleedingDuration - 1))
  const ovulationDay = clampNumber(cycleLength - lutealPhaseLength, bleedingDuration + 1, cycleLength - 1)
  const fertileWindowStart = Math.max(1, ovulationDay - 5)
  const fertileWindowEnd = Math.min(cycleLength, ovulationDay + 1)
  const cycleStartIso = input.lastPeriodDate
  const cycleDay = diffUtcDays(todayIso, cycleStartIso) + 1
  const currentPhase = getPhase(cycleDay, bleedingDuration, fertileWindowStart, ovulationDay)
  const nextPeriodIso = addUtcDays(cycleStartIso, cycleLength)
  const nextPeriodCountdown = diffUtcDays(nextPeriodIso, todayIso)
  const ovulationCountdown = Math.max(0, ovulationDay - cycleDay)

  return {
    ...input,
    cycleLength,
    bleedingDuration,
    lutealPhaseLength,
    todayIso,
    cycleStartIso,
    cycleDay,
    currentPhase,
    currentPhaseLabel: describePhase(currentPhase),
    ovulationDay,
    fertileWindowStart,
    fertileWindowEnd,
    nextPeriodIso,
    nextPeriodCountdown,
    ovulationCountdown,
    isOverdue: nextPeriodCountdown <= 0,
  }
}

export function buildCalendarDays(cycleStartIso: string, input: CycleInput, todayIso = utcTodayIso()): CycleDayInfo[] {
  const cycleLength = clampNumber(input.cycleLength, 21, 40)
  const bleedingDuration = clampNumber(input.bleedingDuration, 2, Math.min(10, cycleLength - 2))
  const lutealPhaseLength = clampNumber(input.lutealPhaseLength, 10, Math.min(18, cycleLength - bleedingDuration - 1))
  const ovulationDay = clampNumber(cycleLength - lutealPhaseLength, bleedingDuration + 1, cycleLength - 1)
  const fertileWindowStart = Math.max(1, ovulationDay - 5)
  const fertileWindowEnd = Math.min(cycleLength, ovulationDay + 1)
  
  const daysSinceStart = Math.max(0, diffUtcDays(todayIso, cycleStartIso))
  const displayLength = Math.max(cycleLength, daysSinceStart + 7)

  return Array.from({ length: displayLength }, (_, index) => {
    const cycleDay = index + 1
    const dateIso = addUtcDays(cycleStartIso, index)
    const phase = getPhase(cycleDay, bleedingDuration, fertileWindowStart, ovulationDay)

    return {
      cycleDay,
      dateIso,
      phase,
      phaseLabel: describePhase(phase),
      isFertile: cycleDay >= fertileWindowStart && cycleDay <= fertileWindowEnd,
      isPeak: cycleDay === ovulationDay,
      isBleeding: cycleDay <= bleedingDuration,
    }
  })
}

function determineRisk(daysBeforeOvulation: number, intercourseCycleDay: number, fertileWindowStart: number, fertileWindowEnd: number): RiskLevel {
  if (intercourseCycleDay >= fertileWindowStart && intercourseCycleDay <= fertileWindowEnd) {
    return 'elevated'
  }

  if (daysBeforeOvulation >= 6 && daysBeforeOvulation <= 7) {
    return 'low'
  }

  if (intercourseCycleDay >= fertileWindowStart - 2 && intercourseCycleDay < fertileWindowStart) {
    return 'low'
  }

  if (intercourseCycleDay > fertileWindowEnd && intercourseCycleDay <= fertileWindowEnd + 2) {
    return 'low'
  }

  return 'negligible'
}

function riskLabelForLevel(level: RiskLevel): string {
  switch (level) {
    case 'elevated':
      return 'Elevated Risk'
    case 'low':
      return 'Low Risk'
    case 'negligible':
      return 'Negligible'
  }
}

export function buildCaseStudyResult(input: CaseStudyInput): CaseStudyResult {
  const cycleLength = clampNumber(input.cycleLength, 21, 40)
  const lutealPhaseLength = clampNumber(input.lutealPhaseLength, 10, Math.min(18, cycleLength - 3))
  const ovulationDay = clampNumber(cycleLength - lutealPhaseLength, 7, cycleLength - 1)
  const fertileWindowStart = Math.max(1, ovulationDay - 5)
  const fertileWindowEnd = Math.min(cycleLength, ovulationDay + 1)
  const intercourseCycleDay = diffUtcDays(input.intercourseDate, input.lastPeriodDate) + 1
  const daysBeforeOvulation = ovulationDay - intercourseCycleDay
  const riskLevel = determineRisk(daysBeforeOvulation, intercourseCycleDay, fertileWindowStart, fertileWindowEnd)
  const riskLabel = riskLabelForLevel(riskLevel)

  const timeline: CaseStudyTimelineItem[] = [
    {
      title: 'Menstruation onset',
      dateIso: input.lastPeriodDate,
      cycleDay: 1,
      detail: 'Cycle baseline established. The follicular sequence begins from day one.',
      tone: 'info' as const,
    },
    {
      title: 'Predicted ovulation',
      dateIso: addUtcDays(input.lastPeriodDate, ovulationDay - 1),
      cycleDay: ovulationDay,
      detail: 'Estimated egg release based on the cycle length and luteal phase target.',
      tone: 'warning' as const,
    },
    {
      title: 'Intercourse incident',
      dateIso: input.intercourseDate,
      cycleDay: intercourseCycleDay,
      detail: 'Logged event is compared against sperm survivability and the fertile window.',
      tone: 'neutral' as const,
    },
    {
      title: 'Outcome assessment',
      dateIso: addUtcDays(input.intercourseDate, 1),
      cycleDay: intercourseCycleDay + 1,
      detail:
        riskLevel === 'elevated'
          ? 'Intercourse overlaps the modeled fertile interval, so conception potential is materially present.'
          : riskLevel === 'low'
            ? 'The event sits near, but not inside, the modeled fertile overlap. Continue tracking the timeline.'
            : 'The event falls outside the modeled overlap between sperm survivability and egg lifespan.',
      tone: riskLevel === 'elevated' ? 'danger' : riskLevel === 'low' ? 'warning' : 'success',
    },
  ]

  return {
    input,
    ovulationDay,
    fertileWindowStart,
    fertileWindowEnd,
    intercourseCycleDay,
    daysBeforeOvulation,
    riskLevel,
    riskLabel,
    summary:
      riskLevel === 'elevated'
        ? 'Intercourse occurs inside the fertile window where sperm survivability can align with ovulation.'
        : riskLevel === 'low'
          ? 'Intercourse sits near the fertile window, but the modeled overlap is partial rather than direct.'
          : 'Intercourse is outside the modeled fertile overlap, so the estimated risk is minimal.',
    timeline,
    confidence: riskLevel === 'elevated' ? 0.91 : riskLevel === 'low' ? 0.66 : 0.28,
  }
}
