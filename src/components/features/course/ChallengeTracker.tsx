'use client'

import { useState } from 'react'
import { Coins, Sword, CheckCircle, Lock, Star, Zap } from 'lucide-react'
import { useGamificationStore } from '@/stores/gamificationStore'
import { cn } from '@/lib/utils'
import type { ChallengeTask } from '@/types'

const DIFFICULTY_CONFIG = {
  basico:        { label: 'Básico',        color: 'text-green-600  bg-green-50  border-green-200  dark:bg-green-950/30  dark:border-green-800  dark:text-green-400'  },
  intermediario: { label: 'Intermediário', color: 'text-blue-600   bg-blue-50   border-blue-200   dark:bg-blue-950/30   dark:border-blue-800   dark:text-blue-400'   },
  avancado:      { label: 'Avançado',      color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400' },
  expert:        { label: 'Expert',        color: 'text-rose-600   bg-rose-50   border-rose-200   dark:bg-rose-950/30   dark:border-rose-800   dark:text-rose-400'   },
}

interface ChallengeTrackerProps {
  slug:  string
  tasks: ChallengeTask[]
  xp:    number
}

export function ChallengeTracker({ slug, tasks, xp }: ChallengeTrackerProps) {
  const { completeChallengeTask, isChallengeTaskDone, getChallengeCoins } = useGamificationStore()
  const [justEarned, setJustEarned] = useState<string | null>(null)

  const totalPossible   = tasks.reduce((s, t) => s + t.coins, 0)
  const earnedCoins     = getChallengeCoins(slug)
  const completedCount  = tasks.filter((t) => isChallengeTaskDone(slug, t.id)).length
  const allDone         = completedCount === tasks.length
  const pct             = Math.round((earnedCoins / totalPossible) * 100)

  const handleToggle = (task: ChallengeTask) => {
    if (isChallengeTaskDone(slug, task.id)) return
    completeChallengeTask(slug, task.id, task.coins)
    setJustEarned(task.id)
    setTimeout(() => setJustEarned(null), 1500)
  }

  return (
    <div className="my-8 rounded-2xl border-2 border-amber-300 dark:border-amber-700 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-900/30">
              <Sword size={22} className="text-amber-950" />
            </div>
            <div>
              <p className="font-black text-amber-950 text-lg leading-none">Desafio Gamificado</p>
              <p className="text-xs text-amber-800 font-medium mt-0.5">Complete as tasks para ganhar POO Coins</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-amber-950">{earnedCoins}<span className="text-sm font-semibold ml-1">/ {totalPossible}</span></p>
            <p className="text-xs text-amber-800 flex items-center gap-1 justify-end"><Coins size={11} /> coins ganhos</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2.5 rounded-full bg-amber-900/20 overflow-hidden">
          <div
            className="h-full bg-amber-950/70 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-amber-800">{completedCount} de {tasks.length} tasks</p>
          <p className="text-xs font-bold text-amber-950">{pct}% completo</p>
        </div>
      </div>

      {/* XP reward info */}
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-6 py-2 border-b border-amber-200 dark:border-amber-800">
        <Zap size={13} className="text-amber-600" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Conclua todas as tasks para ganhar <span className="font-bold">+{xp} XP</span> e marcar o desafio como concluído
        </p>
      </div>

      {/* Task list */}
      <div className="divide-y divide-border">
        {tasks.map((task, idx) => {
          const done    = isChallengeTaskDone(slug, task.id)
          const earning = justEarned === task.id
          const cfg     = DIFFICULTY_CONFIG[task.difficulty]

          return (
            <div
              key={task.id}
              onClick={() => handleToggle(task)}
              className={cn(
                'flex items-center gap-4 px-6 py-4 transition-all select-none',
                done
                  ? 'bg-green-50/60 dark:bg-green-950/20'
                  : 'hover:bg-muted/40 cursor-pointer',
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                done
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground/30 bg-background hover:border-amber-400',
              )}>
                {done
                  ? <CheckCircle size={16} />
                  : <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                  {task.label}
                </p>
                <span className={cn('inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.color)}>
                  {cfg.label}
                </span>
              </div>

              {/* Coins badge */}
              <div className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-all',
                done
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : earning
                    ? 'bg-amber-400 text-amber-950 scale-110'
                    : 'bg-muted text-muted-foreground'
              )}>
                {done ? <CheckCircle size={12} /> : <Coins size={12} />}
                +{task.coins}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion banner */}
      {allDone && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <Star size={20} className="text-white" fill="white" />
          <div>
            <p className="font-black text-white">Desafio Concluído! 🏆</p>
            <p className="text-xs text-green-100">+{earnedCoins} POO Coins · +{xp} XP conquistados</p>
          </div>
        </div>
      )}
    </div>
  )
}
