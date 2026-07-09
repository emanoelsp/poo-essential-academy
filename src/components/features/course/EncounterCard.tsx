'use client'

import Link from 'next/link'
import { Lock, CheckCircle, BookOpen, FlaskConical, Trophy, FileText, Mic, Sword, Gift, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Encounter } from '@/types'
import { useGamificationStore } from '@/stores/gamificationStore'

const TYPE_CONFIG = {
  teoria:      { icon: BookOpen,     label: 'Teoria + Lab',  color: 'text-blue-700   dark:text-blue-400'   },
  lab:         { icon: FlaskConical, label: 'Laboratório',   color: 'text-green-700  dark:text-green-400'  },
  avaliacao:   { icon: Trophy,       label: 'Avaliação',     color: 'text-amber-700  dark:text-amber-400'  },
  prova:       { icon: FileText,     label: 'Prova',         color: 'text-red-700    dark:text-red-400'    },
  apresentacao:{ icon: Mic,          label: 'Apresentação',  color: 'text-purple-700 dark:text-purple-400' },
  desafio:     { icon: Sword,        label: 'Desafio',       color: 'text-amber-700  dark:text-amber-400'  },
  bonus:       { icon: Gift,         label: 'Bônus',         color: 'text-teal-700   dark:text-teal-400'   },
  complementar:{ icon: PlusCircle,   label: 'Complementar',  color: 'text-violet-700 dark:text-violet-400' },
}

interface EncounterCardProps {
  encounter: Encounter
  locked?: boolean
}

export function EncounterCard({ encounter, locked = false }: EncounterCardProps) {
  const isCompleted = useGamificationStore((s) => s.isEncounterCompleted(encounter.slug))
  const config = TYPE_CONFIG[encounter.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.teoria
  const Icon = config.icon
  const isDesafio = encounter.type === 'desafio'
  const isBonus   = encounter.type === 'bonus'

  const card = (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 transition-all duration-200',
        isCompleted && 'border-green-500/40 bg-green-50/70 dark:bg-green-950/20',
        isDesafio && !isCompleted && 'border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10',
        isBonus && !isCompleted && 'border-teal-300/60 bg-teal-50/40 dark:bg-teal-950/10',
        locked && 'opacity-50 cursor-not-allowed',
        !isCompleted && !locked && 'hover:border-primary/50 hover:shadow-sm hover:bg-muted/30 cursor-pointer bg-card',
        (isDesafio || isBonus) && !isCompleted && !locked && 'hover:border-amber-400/80',
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
        isCompleted
          ? 'border-green-500 bg-green-500 text-white'
          : locked
            ? 'border-muted bg-muted/50 text-muted-foreground'
            : isDesafio
              ? 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
              : isBonus
                ? 'border-teal-400 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
                : 'border-muted bg-muted text-muted-foreground'
      )}>
        {isCompleted
          ? <CheckCircle size={18} />
          : locked
            ? <Lock size={16} />
            : (isDesafio || isBonus)
              ? <Icon size={16} />
              : encounter.number}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm truncate', isCompleted && 'text-muted-foreground')}>{encounter.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={cn('flex items-center gap-1 text-xs', config.color)}>
            <Icon size={11} />
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">⚡ {encounter.xp} XP</span>
          {encounter.exercises > 0 && (
            <span className="text-xs text-muted-foreground">📝 {encounter.exercises} ex.</span>
          )}
          {isDesafio && encounter.challengeTasks && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              🏆 {encounter.challengeTasks.length} tasks
            </span>
          )}
        </div>
      </div>

      {isCompleted && (
        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 shrink-0 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
          Concluído
        </span>
      )}
    </div>
  )

  if (locked) return card

  return (
    <Link href={`/cursos/poo-java/encontros/${encounter.slug}`} className="block">
      {card}
    </Link>
  )
}
