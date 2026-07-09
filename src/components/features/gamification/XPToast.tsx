'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useGamificationStore } from '@/stores/gamificationStore'

export function XPToastListener() {
  const { pendingEvents, clearPendingEvents } = useGamificationStore()

  useEffect(() => {
    if (pendingEvents.length === 0) return
    pendingEvents.forEach((event) => {
      if (event.type === 'badge_earned') {
        toast(`🏅 ${event.label}`, { duration: 4000 })
      } else {
        toast(`+${event.xp} XP — ${event.label}`, {
          icon: '⚡',
          duration: 3000,
          style: { background: '#1e293b', color: '#f8fafc', fontWeight: 600 },
        })
      }
    })
    clearPendingEvents()
  }, [pendingEvents, clearPendingEvents])

  return null
}
