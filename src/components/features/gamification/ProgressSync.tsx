'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamificationStore } from '@/stores/gamificationStore'
import { getUserProgress, saveUserProgress, watchUserProgress } from '@/lib/firestore'

// Syncs Zustand gamification state ↔ Firestore when user is logged in
export function ProgressSync() {
  const { user } = useAuth()
  const store     = useGamificationStore()
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On login: load Firestore data and hydrate the store
  useEffect(() => {
    if (!user) return
    getUserProgress(user.uid).then((data) => {
      store.hydrateFromFirestore(data)
      store.checkWeeklyPresence()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Watch Firestore for external changes (e.g. admin reset)
  useEffect(() => {
    if (!user) return
    const unsub = watchUserProgress(user.uid, (data) => {
      store.hydrateFromFirestore(data)
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Debounced save: whenever store changes, save to Firestore after 2s idle
  useEffect(() => {
    if (!user) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      saveUserProgress(user.uid, {
        xp:                  store.xp,
        level:               store.level,
        levelName:           store.levelName,
        badges:              store.badges,
        streak:              store.streak,
        lastLoginDate:       store.lastLoginDate,
        completedEncounters: store.completedEncounters,
        coins:               store.coins,
        challengeProgress:   store.challengeProgress,
        weeklyPresence:      store.weeklyPresence,
      })
    }, 2000)
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.uid,
    store.xp,
    store.coins,
    store.badges.length,
    store.completedEncounters.length,
    store.streak,
    store.weeklyPresence.length,
    // challengeProgress changes are tracked via coins (each task adds coins)
    // so no extra dep needed — store.coins already triggers the save
  ])

  return null
}
