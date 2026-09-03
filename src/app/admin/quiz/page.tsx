'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { CURRICULUM } from '@/content/data/curriculum'
import { getQuizQuestions } from '@/content/data/quizQuestions'
import {
  createQuizSession,
  startQuiz,
  revealQuestion,
  nextQuestion,
  finishQuiz,
  watchSession,
  watchPlayers,
  watchAnswersForQuestionDirect,
  type QuizSession,
  type QuizPlayer,
  type QuizAnswer,
} from '@/lib/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Play, SkipForward, Eye, Trophy, Users, Zap,
  Copy, CheckCheck, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TIME = 20
const OPTION_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500']
const OPTION_LABELS = ['▲', '◆', '●', '■']
const MEDALS = ['🥇', '🥈', '🥉']

// ─── Timer ────────────────────────────────────────────────────────────────────

function useTimer(startedAt: number | null, duration: number) {
  const [remaining, setRemaining] = useState(duration)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (startedAt == null) { setRemaining(duration); return }
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left > 0) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [startedAt, duration])

  return remaining
}

// ─── Encounter selector ───────────────────────────────────────────────────────

function EncounterPicker({ onPick }: { onPick: (slug: string, title: string) => void }) {
  const eligible = CURRICULUM.flatMap((m) =>
    m.encounters
      .filter((e) => getQuizQuestions(e.slug).length > 0)
      .map((e) => ({ ...e, moduleTitle: m.title, moduleColor: m.color }))
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Criar Quiz Interativo</h2>
        <p className="text-sm text-muted-foreground">Selecione uma aula com banco de questões</p>
      </div>
      {eligible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma aula com quiz disponível.</p>
      ) : (
        <div className="space-y-2">
          {eligible.map((e) => (
            <Card key={e.slug} className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition" onClick={() => onPick(e.slug, e.title)}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br', e.moduleColor)}>
                  {getQuizQuestions(e.slug).length}Q
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.moduleTitle}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Play size={13} className="mr-1" /> Iniciar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lobby view ───────────────────────────────────────────────────────────────

function LobbyView({ session, players, onStart }: { session: QuizSession; players: QuizPlayer[]; onStart: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(session.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white text-center space-y-2">
        <p className="text-white/70 text-sm uppercase tracking-widest">Código da Sala</p>
        <div className="text-7xl font-black tracking-[0.15em] font-mono">{session.code}</div>
        <button onClick={copyCode} className="flex items-center gap-1.5 mx-auto text-white/70 hover:text-white text-sm transition">
          {copied ? <><CheckCheck size={14} /> Copiado!</> : <><Copy size={14} /> Copiar código</>}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Users size={15} />
          <span><strong className="text-foreground">{players.length}</strong> jogador{players.length !== 1 ? 'es' : ''} na sala</span>
        </div>
        <Button
          onClick={onStart}
          disabled={players.length === 0}
          className="gap-2"
        >
          <Play size={15} /> Iniciar Quiz
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {players.map((p, i) => (
          <div key={p.id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium truncate">
            {i < 3 ? MEDALS[i] : `${i + 1}.`} {p.nickname}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Question view (admin) ────────────────────────────────────────────────────

function QuestionView({
  session, players, answers, onReveal,
}: {
  session: QuizSession
  players: QuizPlayer[]
  answers: QuizAnswer[]
  onReveal: () => void
}) {
  const questions = getQuizQuestions(session.slug)
  const q = questions[session.currentQuestion]
  const remaining = useTimer(session.questionStartedAt, QUESTION_TIME)

  const progress = remaining / QUESTION_TIME
  const timerColor = remaining > 10 ? 'text-green-600' : remaining > 5 ? 'text-amber-600' : 'text-red-600'
  const answered = answers.length
  const total = players.length

  const distribution = [0, 1, 2, 3].map((idx) => answers.filter((a) => a.answerIndex === idx).length)
  const maxAnswers = Math.max(...distribution, 1)

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{session.currentQuestion + 1}/{session.totalQuestions}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={cn('font-bold tabular-nums text-sm', timerColor)}>{Math.ceil(remaining)}s</span>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="font-bold text-base leading-snug">{q.question}</p>
        </CardContent>
      </Card>

      {/* Live answer count */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users size={14} />
          <span><strong className="text-foreground">{answered}</strong>/{total} responderam</span>
        </div>
        <Button size="sm" onClick={onReveal} variant="outline" className="gap-1.5">
          <Eye size={14} /> Revelar agora
        </Button>
      </div>

      {/* Answer distribution bars */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden">
            <div className={cn('px-3 py-2 text-white text-xs font-bold flex items-center gap-2', OPTION_COLORS[idx])}>
              <span>{OPTION_LABELS[idx]}</span>
              <span className="truncate flex-1">{opt}</span>
              <span>{distribution[idx]}</span>
            </div>
            <div className="bg-muted h-1.5">
              <div
                className={cn('h-full', OPTION_COLORS[idx])}
                style={{ width: `${(distribution[idx] / maxAnswers) * 100}%`, opacity: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Reveal view (admin) ──────────────────────────────────────────────────────

function RevealView({
  session, players, answers, onNext,
}: {
  session: QuizSession
  players: QuizPlayer[]
  answers: QuizAnswer[]
  onNext: () => void
}) {
  const questions = getQuizQuestions(session.slug)
  const q = questions[session.currentQuestion]
  const isLast = session.currentQuestion === session.totalQuestions - 1

  const distribution = [0, 1, 2, 3].map((idx) => ({
    count: answers.filter((a) => a.answerIndex === idx).length,
    correct: idx === q.correct,
  }))
  const maxAnswers = Math.max(...distribution.map((d) => d.count), 1)
  const correctCount = answers.filter((a) => a.correct).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">{q.question}</p>
          <p className="text-sm text-muted-foreground">
            {correctCount}/{players.length} acertaram
          </p>
        </div>
        <Button onClick={onNext} className="gap-1.5 shrink-0">
          {isLast ? <><Trophy size={14} /> Encerrar</> : <><SkipForward size={14} /> Próxima</>}
        </Button>
      </div>

      {/* Answer bars with correct highlight */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, idx) => {
          const d = distribution[idx]
          return (
            <div key={idx} className={cn('rounded-xl overflow-hidden', d.correct ? 'ring-2 ring-green-500' : '')}>
              <div className={cn('px-3 py-2 text-white text-xs font-bold flex items-center gap-2', OPTION_COLORS[idx], !d.correct && 'opacity-60')}>
                <span>{OPTION_LABELS[idx]}</span>
                <span className="truncate flex-1">{opt}</span>
                <span>{d.count}</span>
                {d.correct && <span>✓</span>}
              </div>
              <div className="bg-muted h-2">
                <div
                  className={cn('h-full', d.correct ? 'bg-green-500' : OPTION_COLORS[idx])}
                  style={{ width: `${(d.count / maxAnswers) * 100}%`, opacity: d.correct ? 1 : 0.4 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Live ranking */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ranking</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {players.slice(0, 8).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="w-6 text-center">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="flex-1 font-medium truncate">{p.nickname}</span>
              {p.combo >= 2 && <Flame size={13} className="text-orange-400" />}
              <span className="font-bold tabular-nums">{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Finished view ────────────────────────────────────────────────────────────

function FinishedView({ players, onReset }: { players: QuizPlayer[]; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <Trophy size={40} className="mx-auto text-amber-500" />
        <h2 className="text-xl font-bold">Quiz Encerrado!</h2>
      </div>
      <div className="space-y-2">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3',
              i === 0 ? 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300' :
              i === 1 ? 'bg-slate-100 dark:bg-slate-800/50' :
              i === 2 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-muted/30'
            )}
          >
            <span className="text-xl w-8 text-center">{MEDALS[i] ?? `${i + 1}.`}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.nickname}</p>
              {p.maxCombo >= 3 && (
                <p className="text-xs text-orange-500 flex items-center gap-1">
                  <Flame size={11} /> Combo máximo: x{p.maxCombo}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 font-bold">
              <Zap size={13} className="text-amber-500" />
              {p.score}
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={onReset} className="w-full">Novo Quiz</Button>
    </div>
  )
}

// ─── Main admin quiz page ─────────────────────────────────────────────────────

export default function AdminQuizPage() {
  const { profile } = useAuth()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [players, setPlayers] = useState<QuizPlayer[]>([])
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [creating, setCreating] = useState(false)

  // Watch session + players
  useEffect(() => {
    if (!session) return
    const unsub1 = watchSession(session.id, (s) => s && setSession(s))
    const unsub2 = watchPlayers(session.id, setPlayers)
    return () => { unsub1(); unsub2() }
  }, [session?.id])

  // Watch answers for current question
  useEffect(() => {
    if (!session || session.status !== 'question') { setAnswers([]); return }
    return watchAnswersForQuestionDirect(session.id, session.currentQuestion, setAnswers)
  }, [session?.id, session?.status, session?.currentQuestion])

  const handleCreate = async (slug: string) => {
    if (!profile) return
    setCreating(true)
    try {
      const s = await createQuizSession(slug, profile.uid)
      setSession(s)
      toast.success('Sala criada!')
    } catch (err) {
      console.error('[Quiz] Erro ao criar sala:', err)
      toast.error('Erro ao criar sala.')
    } finally { setCreating(false) }
  }

  const handleStart = async () => {
    if (!session) return
    try { await startQuiz(session.id) } catch (err) { console.error('[Quiz] Erro ao iniciar:', err); toast.error('Erro ao iniciar.') }
  }

  const handleReveal = async () => {
    if (!session) return
    try { await revealQuestion(session.id) } catch (err) { console.error('[Quiz] Erro ao revelar:', err); toast.error('Erro ao revelar.') }
  }

  const handleNext = async () => {
    if (!session) return
    const next = session.currentQuestion + 1
    try { await nextQuestion(session.id, next, session.totalQuestions) } catch (err) { console.error('[Quiz] Erro ao avançar:', err); toast.error('Erro ao avançar questão.') }
  }

  const handleReset = () => setSession(null)

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quiz Interativo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie uma sala e os alunos entram com o código em tempo real.
        </p>
      </div>

      {!session && !creating && (
        <EncounterPicker onPick={handleCreate} />
      )}

      {creating && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {session && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {session.status === 'waiting' && 'Aguardando jogadores…'}
              {session.status === 'question' && `Questão ${session.currentQuestion + 1} — Respondendo`}
              {session.status === 'reveal' && `Questão ${session.currentQuestion + 1} — Resultado`}
              {session.status === 'finished' && 'Ranking Final'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.status === 'waiting' && (
              <LobbyView session={session} players={players} onStart={handleStart} />
            )}
            {session.status === 'question' && (
              <QuestionView session={session} players={players} answers={answers} onReveal={handleReveal} />
            )}
            {session.status === 'reveal' && (
              <RevealView session={session} players={players} answers={answers} onNext={handleNext} />
            )}
            {session.status === 'finished' && (
              <FinishedView players={players} onReset={handleReset} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
