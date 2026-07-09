'use client'

import { BADGES } from '@/lib/gamification'
import { useGamificationStore } from '@/stores/gamificationStore'
import { cn } from '@/lib/utils'

export function BadgeGrid() {
  const { badges: earned } = useGamificationStore()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {BADGES.map((badge) => {
        const unlocked = earned.includes(badge.id)
        return (
          <div
            key={badge.id}
            title={unlocked ? badge.description : 'Bloqueado'}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all',
              unlocked
                ? 'border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 shadow-sm'
                : 'border-dashed border-muted bg-muted/30 opacity-40 grayscale'
            )}
          >
            <span className="text-3xl">{badge.icon}</span>
            <span className="text-xs font-medium leading-tight">{badge.name}</span>
            {unlocked && (
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">+{badge.xpBonus} XP</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
