'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamificationStore } from '@/stores/gamificationStore'
import { watchUserSubmissions } from '@/lib/firestore'

// Watches the student's challenge submissions. When the teacher approves one,
// applies the XP/coins/badge exactly like a normal completion — but only once
// (guarded by completedEncounters, so it's idempotent). Runs globally so an
// approval lands regardless of which page the student is on.
export function SubmissionSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const unsub = watchUserSubmissions(user.uid, (subs) => {
      const store = useGamificationStore.getState()
      for (const s of subs) {
        if (s.status === 'approved' && !store.isEncounterCompleted(s.slug)) {
          store.completeEncounter(s.slug)
          store.addXP({
            type: 'complete_encounter',
            xp: s.xp,
            label: `Desafio ${s.encounterNumber}: ${s.encounterTitle}`,
          })
          if (s.badgeId) store.earnBadge(s.badgeId)
        }
      }
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  return null
}
