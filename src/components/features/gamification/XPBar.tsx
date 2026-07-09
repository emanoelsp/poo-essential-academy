'use client'

import { Progress } from '@/components/ui/progress'
import { useGamificationStore } from '@/stores/gamificationStore'
import { getLevelFromXP, getNextLevel, LEVELS } from '@/lib/gamification'

export function XPBar() {
  const { xp, level, levelName, getProgressPercent } = useGamificationStore()
  const currentLevel = getLevelFromXP(xp)
  const nextLevel = getNextLevel(level)
  const percent = getProgressPercent()

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-semibold ${currentLevel.color}`}>{levelName}</span>
        <span className="text-muted-foreground">
          {xp} XP{nextLevel ? ` / ${nextLevel.xpRequired}` : ' (Máximo!)'}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
      {nextLevel && (
        <p className="text-xs text-muted-foreground">
          {nextLevel.xpRequired - xp} XP para {nextLevel.name}
        </p>
      )}
    </div>
  )
}
