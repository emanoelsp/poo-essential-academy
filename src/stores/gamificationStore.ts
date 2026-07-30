'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getNextLevel,
  getXPProgressPercent,
  deriveTotals,
  BADGES,
} from '@/lib/gamification'
import { isoWeekKey } from '@/lib/grade'
import type { GamificationState, XPEvent, ChallengeProgress } from '@/types'

export const COIN_VALUES: Record<string, number> = {
  complete_encounter: 10,
  earn_badge:         15,
  daily_login:        2,
  complete_module:    50,
  first_login:        5,
  challenge_task:     0, // coins come from the task itself
}

interface GamificationStore extends GamificationState {
  pendingEvents:      XPEvent[]
  completedEncounters: string[]
  coins:              number
  challengeProgress:  Record<string, ChallengeProgress>
  weeklyPresence:     string[]

  addXP:               (event: XPEvent) => void
  earnBadge:           (badgeId: string) => void
  checkDailyLogin:     () => void
  checkWeeklyPresence: () => void
  clearPendingEvents:  () => void
  completeEncounter:   (slug: string) => void
  isEncounterCompleted:(slug: string) => boolean
  addCoins:            (amount: number) => void
  getProgressPercent:  () => number
  getNextLevelXP:      () => number | null

  // Challenge system
  completeChallengeTask:   (challengeSlug: string, taskId: string, coins: number) => void
  isChallengeTaskDone:     (challengeSlug: string, taskId: string) => boolean
  getChallengeCoins:       (challengeSlug: string) => number

  // Firestore sync
  hydrateFromFirestore: (data: {
    xp: number; level: number; levelName: string; badges: string[]
    streak: number; lastLoginDate: string | null
    completedEncounters: string[]; coins: number
    challengeProgress?: Record<string, ChallengeProgress>
    weeklyPresence?: string[]
  }) => void
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      xp: 0, level: 1, levelName: 'Iniciante', badges: [], streak: 0,
      lastLoginDate: null, pendingEvents: [], completedEncounters: [],
      coins: 0, challengeProgress: {}, weeklyPresence: [],

      addXP: (event) => {
        // XP is DERIVED from completed work (see deriveTotals) — it is never
        // accumulated directly, so a tampered value can't stick. addXP only
        // records the event for the on-screen XP toast / feed.
        set((state) => ({ pendingEvents: [...state.pendingEvents, event] }))
      },

      earnBadge: (badgeId) => {
        const { badges, addXP } = get()
        if (badges.includes(badgeId)) return
        const badge = BADGES.find((b) => b.id === badgeId)
        if (!badge) return
        set((state) => {
          const newBadges = [...state.badges, badgeId]
          return {
            badges: newBadges,
            ...deriveTotals({
              completedEncounters: state.completedEncounters,
              badges:              newBadges,
              challengeProgress:   state.challengeProgress,
            }),
          }
        })
        if (badge.xpBonus > 0) {
          addXP({ type: 'badge_earned', xp: badge.xpBonus, label: `Badge: ${badge.name}` })
        }
      },

      checkDailyLogin: () => {
        const today = new Date().toISOString().split('T')[0]
        const { lastLoginDate, streak, addXP } = get()
        if (lastLoginDate === today) return
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const newStreak = lastLoginDate === yesterday ? streak + 1 : 1
        set({ streak: newStreak, lastLoginDate: today })
        addXP({ type: 'daily_login', xp: 10, label: `Login diário (${newStreak} dias)` })
      },

      checkWeeklyPresence: () => {
        const key = isoWeekKey(new Date())
        if (get().weeklyPresence.includes(key)) return
        set((state) => ({ weeklyPresence: [...state.weeklyPresence, key] }))
      },

      completeEncounter: (slug) => {
        const { completedEncounters } = get()
        if (completedEncounters.includes(slug)) return
        set((state) => {
          const newCompleted = [...state.completedEncounters, slug]
          return {
            completedEncounters: newCompleted,
            ...deriveTotals({
              completedEncounters: newCompleted,
              badges:              state.badges,
              challengeProgress:   state.challengeProgress,
            }),
          }
        })
      },

      isEncounterCompleted: (slug) => get().completedEncounters.includes(slug),

      // Coins are derived from completed work; kept for API compatibility but
      // intentionally a no-op — direct coin grants would not survive a recompute.
      addCoins: () => {},

      clearPendingEvents: () => set({ pendingEvents: [] }),
      getProgressPercent: () => getXPProgressPercent(get().xp),
      getNextLevelXP: () => {
        const next = getNextLevel(get().level)
        return next?.xpRequired ?? null
      },

      // ── Challenge task system ───────────────────────────────────────────

      completeChallengeTask: (challengeSlug, taskId, coins) => {
        const prev = get().challengeProgress[challengeSlug] ?? { completedTaskIds: [], totalCoins: 0 }
        if (prev.completedTaskIds.includes(taskId)) return

        const updated: ChallengeProgress = {
          completedTaskIds: [...prev.completedTaskIds, taskId],
          totalCoins:       prev.totalCoins + coins,
        }
        set((state) => {
          const cp = { ...state.challengeProgress, [challengeSlug]: updated }
          return {
            challengeProgress: cp,
            ...deriveTotals({
              completedEncounters: state.completedEncounters,
              badges:              state.badges,
              challengeProgress:   cp,
            }),
          }
        })
        // Record the XP event for the toast/feed (XP itself is derived)
        get().addXP({ type: 'challenge_task', xp: Math.round(coins * 0.5), label: `Desafio task: ${taskId}` })
      },

      isChallengeTaskDone: (challengeSlug, taskId) =>
        get().challengeProgress[challengeSlug]?.completedTaskIds.includes(taskId) ?? false,

      getChallengeCoins: (challengeSlug) =>
        get().challengeProgress[challengeSlug]?.totalCoins ?? 0,

      // ── Firestore sync ───────────────────────────────────────────────────

      hydrateFromFirestore: (data) => {
        const state = get()
        const mergedChallenge: Record<string, ChallengeProgress> = { ...data.challengeProgress }
        for (const [slug, local] of Object.entries(state.challengeProgress)) {
          const remote = mergedChallenge[slug]
          if (!remote) { mergedChallenge[slug] = local; continue }
          mergedChallenge[slug] = {
            completedTaskIds: Array.from(new Set([...local.completedTaskIds, ...remote.completedTaskIds])),
            totalCoins:       Math.max(local.totalCoins, remote.totalCoins),
          }
        }
        const badges              = Array.from(new Set([...state.badges, ...data.badges]))
        const completedEncounters = Array.from(new Set([...state.completedEncounters, ...data.completedEncounters]))
        // xp / level / levelName / coins from `data` are ignored on purpose —
        // they are recomputed from the merged source facts below.
        set({
          badges,
          streak:              Math.max(state.streak, data.streak),
          lastLoginDate:       data.lastLoginDate ?? state.lastLoginDate,
          completedEncounters,
          challengeProgress:   mergedChallenge,
          weeklyPresence:      Array.from(new Set([...state.weeklyPresence, ...(data.weeklyPresence ?? [])])),
          ...deriveTotals({ completedEncounters, badges, challengeProgress: mergedChallenge }),
        })
      },
    }),
    {
      name: 'poo-academy-gamification',
      // Persist only source-of-truth facts. xp/level/levelName/coins are derived
      // and deliberately NOT stored, so editing them in localStorage has no effect.
      partialize: (s) => ({
        completedEncounters: s.completedEncounters,
        badges:              s.badges,
        streak:              s.streak,
        lastLoginDate:       s.lastLoginDate,
        challengeProgress:   s.challengeProgress,
        weeklyPresence:      s.weeklyPresence,
        pendingEvents:       s.pendingEvents,
      }),
      // Recompute derived totals from the rehydrated facts on load.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GamificationStore>
        const merged = { ...current, ...p }
        return {
          ...merged,
          ...deriveTotals({
            completedEncounters: merged.completedEncounters ?? [],
            badges:              merged.badges ?? [],
            challengeProgress:   merged.challengeProgress ?? {},
          }),
        }
      },
    }
  )
)
