'use client'

import { useGamificationStore } from '@/stores/gamificationStore'

interface CourseProgressBarProps {
  totalEncounters: number
}

export function CourseProgressBar({ totalEncounters }: CourseProgressBarProps) {
  const completed = useGamificationStore((s) => s.completedEncounters.length)
  const percent = Math.round((completed / totalEncounters) * 100)

  if (completed === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{completed} de {totalEncounters} encontros concluídos</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
