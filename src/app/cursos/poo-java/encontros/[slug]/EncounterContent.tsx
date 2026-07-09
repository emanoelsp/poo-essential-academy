'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentRenderer } from '@/components/features/course/ContentRenderer'
import { ChallengeTracker } from '@/components/features/course/ChallengeTracker'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import type { Encounter } from '@/types'
import { BADGES } from '@/lib/gamification'

interface EncounterContentProps {
  content: string
  encounter: Encounter
}

const ENCOUNTER_BADGE_MAP: Record<string, string> = {
  'encontro-01': 'hello_world',
  'encontro-02': 'method_master',
  'encontro-03': 'oo_mind',
  'encontro-08': 'state_guardian',
  'encontro-10': 'exam_survivor',
  'encontro-20': 'architectural_defender',
}

export function EncounterContent({ content, encounter }: EncounterContentProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isGabaritoVisible } = useSettings()
  const { addXP, earnBadge, checkDailyLogin, completeEncounter, isEncounterCompleted } = useGamificationStore()
  const [completed, setCompleted] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const articleRef = useRef<HTMLDivElement>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    checkDailyLogin()
    setCompleted(isEncounterCompleted(encounter.slug))
  }, [user, checkDailyLogin, isEncounterCompleted, encounter.slug])

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const totalHeight = el.offsetHeight
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(100, Math.round((scrolled / totalHeight) * 100))
      setReadProgress(progress)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleComplete = () => {
    if (completed) return
    setCompleted(true)
    completeEncounter(encounter.slug)
    addXP({
      type: 'complete_encounter',
      xp: encounter.xp,
      label: `Encontro ${encounter.number}: ${encounter.title}`,
    })
    const badgeId = ENCOUNTER_BADGE_MAP[encounter.slug]
    if (badgeId) earnBadge(badgeId)
  }

  // While checking auth, show progress bar only
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const showGabarito = isGabaritoVisible(encounter.slug)
  const isChallenge  = encounter.type === 'desafio'
  const isBonus      = encounter.type === 'bonus'

  const { isChallengeTaskDone } = useGamificationStore()
  const allTasksDone = isChallenge && encounter.challengeTasks
    ? encounter.challengeTasks.every((t) => isChallengeTaskDone(encounter.slug, t.id))
    : true

  return (
    <div className="space-y-8">
      {/* Reading progress bar */}
      <div className="fixed top-[57px] left-0 right-0 z-40 h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Challenge tracker sits above content for desafio encounters */}
      {isChallenge && encounter.challengeTasks && encounter.challengeTasks.length > 0 && (
        <ChallengeTracker
          slug={encounter.slug}
          tasks={encounter.challengeTasks}
          xp={encounter.xp}
        />
      )}

      <div ref={articleRef}>
        <ContentRenderer content={content} showGabarito={showGabarito} />
      </div>

      {/* Bottom challenge tracker repeat for bonus/long content */}
      {isBonus && encounter.challengeTasks && encounter.challengeTasks.length > 0 && (
        <ChallengeTracker
          slug={encounter.slug}
          tasks={encounter.challengeTasks}
          xp={encounter.xp}
        />
      )}

      <div className="flex flex-col items-center gap-3 pt-6 border-t">
        {completed ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
            <CheckCircle size={20} />
            <span>
              {isChallenge ? 'Desafio concluído!' : isBonus ? 'Módulo bônus concluído!' : 'Encontro concluído!'}
              {' '}+{encounter.xp} XP conquistados
            </span>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {isChallenge && !allTasksDone
                ? `Complete todas as ${encounter.challengeTasks?.length} tasks acima para liberar o XP do desafio.`
                : isChallenge
                  ? 'Todas as tasks concluídas! Marque o desafio como concluído para garantir o XP.'
                  : 'Leu o conteúdo e fez os exercícios? Marque como concluído para ganhar XP.'}
            </p>
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={isChallenge && !allTasksDone}
              className="gap-2 min-w-[240px]"
            >
              {isChallenge ? 'Concluir Desafio' : 'Marcar como concluído'} · +{encounter.xp} XP
            </Button>
            {isChallenge && !allTasksDone && encounter.challengeTasks && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                {encounter.challengeTasks.filter((t) => isChallengeTaskDone(encounter.slug, t.id)).length}
                /{encounter.challengeTasks.length} tasks concluídas
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
