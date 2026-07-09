export type UserRole = 'aluno' | 'professor'

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  createdAt: Date
}

export interface Progress {
  userId: string
  encounterSlug: string
  completedAt: Date
  xpEarned: number
}

export interface Exercise {
  id: string
  title: string
  difficulty: 'facil' | 'medio' | 'dificil'
  completed: boolean
}

export interface ChallengeTask {
  id: string
  label: string
  coins: number
  difficulty: 'basico' | 'intermediario' | 'avancado' | 'expert'
}

export interface Encounter {
  slug: string
  number: number
  title: string
  module: number
  type: 'teoria' | 'lab' | 'avaliacao' | 'prova' | 'apresentacao' | 'desafio' | 'bonus' | 'complementar'
  xp: number
  exercises: number
  challengeTasks?: ChallengeTask[]
}

export interface Module {
  number: number
  title: string
  slug: string
  description: string
  encounters: Encounter[]
  color: string
}

// ── Gamification ────────────────────────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  xpBonus: number
  condition: string
}

export interface Level {
  level: number
  name: string
  xpRequired: number
  color: string
}

export interface GamificationState {
  xp: number
  level: number
  levelName: string
  badges: string[]
  streak: number
  lastLoginDate: string | null
}

export interface XPEvent {
  type: 'complete_encounter' | 'complete_exercise' | 'submit_tp' | 'daily_login' | 'badge_earned' | 'challenge_task'
  xp: number
  label: string
}

export interface ChallengeProgress {
  completedTaskIds: string[]
  totalCoins: number
}
