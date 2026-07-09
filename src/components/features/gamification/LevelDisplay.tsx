'use client'

import { useGamificationStore } from '@/stores/gamificationStore'
import { getLevelFromXP } from '@/lib/gamification'
import { cn } from '@/lib/utils'

const LEVEL_ICONS = ['🌱', '📖', '💻', '🏗️', '🏆']

export function LevelDisplay({ className }: { className?: string }) {
  const { xp, level, levelName, streak } = useGamificationStore()
  const currentLevel = getLevelFromXP(xp)
  const icon = LEVEL_ICONS[level - 1] ?? '🏆'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xl">{icon}</span>
      <div className="leading-tight">
        <p className={cn('text-sm font-bold', currentLevel.color)}>{levelName}</p>
        <p className="text-xs text-muted-foreground">{xp} XP · 🔥 {streak}d</p>
      </div>
    </div>
  )
}
