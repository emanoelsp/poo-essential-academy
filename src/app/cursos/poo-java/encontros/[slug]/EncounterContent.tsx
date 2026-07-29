'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentRenderer } from '@/components/features/course/ContentRenderer'
import { ChallengeTracker } from '@/components/features/course/ChallengeTracker'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Send, XCircle, ExternalLink } from 'lucide-react'
import type { Encounter, Submission } from '@/types'
import { createSubmission, watchSubmission } from '@/lib/firestore'
import toast from 'react-hot-toast'

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
  const { user, profile, loading: authLoading } = useAuth()
  const { isGabaritoVisible } = useSettings()
  const { addXP, earnBadge, checkDailyLogin, completeEncounter, isEncounterCompleted } = useGamificationStore()
  const [localCompleted, setLocalCompleted] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const articleRef = useRef<HTMLDivElement>(null)

  // Challenge validation state
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    checkDailyLogin()
    setLocalCompleted(isEncounterCompleted(encounter.slug))
  }, [user, checkDailyLogin, isEncounterCompleted, encounter.slug])

  // Watch this student's submission for challenge encounters
  const isChallengeType = encounter.type === 'desafio'
  useEffect(() => {
    if (!user || !isChallengeType) return
    const unsub = watchSubmission(user.uid, encounter.slug, setSubmission)
    return unsub
  }, [user, isChallengeType, encounter.slug])

  // Prefill the proof form with any previous submission (e.g. after a rejection)
  useEffect(() => {
    if (!submission) return
    setProofUrl((prev) => prev || submission.proofUrl || '')
    setNote((prev) => prev || submission.note || '')
  }, [submission])

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

  // Regular encounters (Duolingo-style): system credits XP immediately
  const handleComplete = () => {
    if (isEncounterCompleted(encounter.slug)) return
    setLocalCompleted(true)
    completeEncounter(encounter.slug)
    addXP({
      type: 'complete_encounter',
      xp: encounter.xp,
      label: `Encontro ${encounter.number}: ${encounter.title}`,
    })
    const badgeId = ENCOUNTER_BADGE_MAP[encounter.slug]
    if (badgeId) earnBadge(badgeId)
  }

  // Challenges: submit proof (git link) for teacher validation — XP is only
  // credited once the teacher approves (applied by SubmissionSync).
  const handleSubmitChallenge = async () => {
    if (!user || submitting || !proofUrl.trim()) return
    setSubmitting(true)
    try {
      await createSubmission({
        uid:             user.uid,
        studentName:     profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Aluno',
        studentEmail:    user.email ?? '',
        slug:            encounter.slug,
        encounterNumber: encounter.number,
        encounterTitle:  encounter.title,
        module:          encounter.module,
        xp:              encounter.xp,
        badgeId:         ENCOUNTER_BADGE_MAP[encounter.slug],
        proofUrl:        proofUrl.trim(),
        note:            note.trim() || undefined,
      })
      toast.success('Enviado para validação do professor!')
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
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

  // Challenges only count as completed once the teacher approves (reflected in
  // the store by SubmissionSync); regular encounters use immediate local state.
  const completed = isChallenge ? isEncounterCompleted(encounter.slug) : localCompleted
  const isPending  = isChallenge && !completed && submission?.status === 'pending'
  const isRejected = isChallenge && !completed && submission?.status === 'rejected'

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
              {isChallenge ? 'Desafio validado!' : isBonus ? 'Módulo bônus concluído!' : 'Encontro concluído!'}
              {' '}+{encounter.xp} XP conquistados
            </span>
          </div>
        ) : isChallenge ? (
          isPending ? (
            /* Awaiting teacher validation */
            <div className="w-full max-w-lg rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-5 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <Clock size={18} />
                <span>Aguardando validação do professor</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu desafio foi enviado. O XP de <span className="font-semibold">+{encounter.xp}</span> será
                liberado assim que o professor validar sua entrega.
              </p>
              {submission?.proofUrl && (
                <a
                  href={submission.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
                >
                  <ExternalLink size={12} /> {submission.proofUrl}
                </a>
              )}
            </div>
          ) : (
            /* Proof submission form (initial or after a rejection) */
            <div className="w-full max-w-lg space-y-3">
              {isRejected && (
                <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-sm">
                    <XCircle size={16} /> Entrega recusada — reenvie
                  </div>
                  {submission?.reviewNote && (
                    <p className="text-xs text-red-700/80 dark:text-red-400/80">
                      Professor: {submission.reviewNote}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {allTasksDone
                  ? 'Todas as tasks concluídas! Envie o link do seu código no Git para o professor validar e liberar o XP.'
                  : `Complete todas as ${encounter.challengeTasks?.length} tasks acima para enviar o desafio.`}
              </p>

              <div className="space-y-2">
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  disabled={!allTasksDone || submitting}
                  placeholder="https://github.com/seu-usuario/repositorio (link do commit ou repositório)"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!allTasksDone || submitting}
                  placeholder="Observação para o professor (opcional)"
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 resize-none"
                />
              </div>

              <Button
                size="lg"
                onClick={handleSubmitChallenge}
                disabled={!allTasksDone || !proofUrl.trim() || submitting}
                className="gap-2 w-full"
              >
                <Send size={16} />
                {submitting ? 'Enviando…' : `Enviar para validação · +${encounter.xp} XP`}
              </Button>

              {!allTasksDone && encounter.challengeTasks && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium text-center">
                  {encounter.challengeTasks.filter((t) => isChallengeTaskDone(encounter.slug, t.id)).length}
                  /{encounter.challengeTasks.length} tasks concluídas
                </p>
              )}
            </div>
          )
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Leu o conteúdo e fez os exercícios? Marque como concluído para ganhar XP.
            </p>
            <Button
              size="lg"
              onClick={handleComplete}
              className="gap-2 min-w-[240px]"
            >
              Marcar como concluído · +{encounter.xp} XP
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
