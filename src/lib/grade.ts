// Lógica pura de presença semanal, penalidade de XP e nota da UC (0–10).
// Sem dependências de React/Firebase — testável isoladamente.

import { COURSE_END_DATE, WEEKLY_MISS_XP_PENALTY, GRADE_WEIGHTS } from '@/content/data/course'

// Converte qualquer forma de data (Firestore Timestamp, Date, string, epoch) em Date.
export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object') {
    const v = value as { seconds?: number; toDate?: () => Date }
    if (typeof v.toDate === 'function') { try { return v.toDate() } catch { return null } }
    if (typeof v.seconds === 'number')  return new Date(v.seconds * 1000)
  }
  return null
}

// Chave ISO da semana, ex.: "2026-W31". Semanas começam na segunda-feira.
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7          // domingo (0) → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)  // quinta-feira da semana ISO
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Lista (sem repetição) das chaves de semana entre start e end, inclusive.
export function weekKeysBetween(start: Date, end: Date): string[] {
  if (end < start) return []
  const keys: string[] = []
  const seen = new Set<string>()
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  while (cur <= end) {
    const k = isoWeekKey(cur)
    if (!seen.has(k)) { seen.add(k); keys.push(k) }
    cur.setDate(cur.getDate() + 1)
  }
  return keys
}

export interface GradeResult {
  weeksElapsed:    number   // semanas decorridas desde o cadastro
  weeksPresent:    number   // semanas com presença registrada
  weeksMissed:     number   // semanas decorridas sem presença
  presenceRatio:   number   // 0..1
  activitiesRatio: number   // 0..1
  xpPenalty:       number   // XP a descontar (weeksMissed × 50)
  grade:           number   // 0..10, uma casa decimal
  complete:        boolean  // todos os encontros concluídos
}

export function computeGrade(params: {
  createdAt:            unknown
  weeklyPresence:       string[] | undefined
  completedEncounters:  number
  totalEncounters:      number
  now?:                 Date
}): GradeResult {
  const now       = params.now ?? new Date()
  const endDate   = new Date(`${COURSE_END_DATE}T23:59:59`)
  const start     = toDate(params.createdAt) ?? now
  const effEnd    = now < endDate ? now : endDate

  const elapsedKeys  = weekKeysBetween(start, effEnd)
  const weeksElapsed = elapsedKeys.length
  const presentSet   = new Set(params.weeklyPresence ?? [])
  const weeksPresent = elapsedKeys.filter((k) => presentSet.has(k)).length
  const weeksMissed  = Math.max(0, weeksElapsed - weeksPresent)

  const presenceRatio   = weeksElapsed > 0 ? weeksPresent / weeksElapsed : 1
  const activitiesRatio = params.totalEncounters > 0
    ? Math.min(1, params.completedEncounters / params.totalEncounters)
    : 0

  const xpPenalty = weeksMissed * WEEKLY_MISS_XP_PENALTY
  const grade = Math.round(
    (GRADE_WEIGHTS.activities * activitiesRatio + GRADE_WEIGHTS.presence * presenceRatio) * 10 * 10,
  ) / 10
  const complete = params.totalEncounters > 0 && params.completedEncounters >= params.totalEncounters

  return {
    weeksElapsed, weeksPresent, weeksMissed,
    presenceRatio, activitiesRatio, xpPenalty, grade, complete,
  }
}

// XP efetivo após a penalidade semanal (nunca negativo).
export function effectiveXP(baseXP: number, xpPenalty: number): number {
  return Math.max(0, baseXP - xpPenalty)
}
