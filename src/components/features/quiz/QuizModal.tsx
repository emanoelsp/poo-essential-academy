'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getQuizQuestions } from '@/content/data/quizQuestions'
import {
  findSessionByCode,
  joinSession,
  watchSession,
  watchPlayers,
  submitAnswer,
  calculatePoints,
  comboLabel,
  type QuizSession,
  type QuizPlayer,
} from '@/lib/quiz'
import { X, Zap, Trophy, Clock, CheckCircle, XCircle, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TIME = 20 // seconds
const OPTION_COLORS = [
  { bg: 'bg-red-500 hover:bg-red-400',   border: 'border-red-600',   text: 'text-white', label: '▲', selected: 'ring-4 ring-red-200' },
  { bg: 'bg-blue-500 hover:bg-blue-400', border: 'border-blue-600',  text: 'text-white', label: '◆', selected: 'ring-4 ring-blue-200' },
  { bg: 'bg-amber-500 hover:bg-amber-400', border: 'border-amber-600', text: 'text-white', label: '●', selected: 'ring-4 ring-amber-200' },
  { bg: 'bg-green-500 hover:bg-green-400', border: 'border-green-600', text: 'text-white', label: '■', selected: 'ring-4 ring-green-200' },
]

type Phase = 'join' | 'waiting' | 'question' | 'reveal' | 'finished'

// ─── Helper: persist player identity ─────────────────────────────────────────

function getStoredPlayer(sessionId: string) {
  try {
    const raw = sessionStorage.getItem(`quiz_${sessionId}`)
    if (!raw) return null
    return JSON.parse(raw) as { playerId: string; nickname: string }
  } catch { return null }
}

function storePlayer(sessionId: string, playerId: string, nickname: string) {
  try { sessionStorage.setItem(`quiz_${sessionId}`, JSON.stringify({ playerId, nickname })) } catch { /* noop */ }
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer(startedAt: number | null, duration: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(duration)
  const [countdown, setCountdown] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (startedAt == null) { setRemaining(duration); setCountdown(null); return }
    expiredRef.current = false

    const tick = () => {
      const now = Date.now()
      // Enquanto ainda estamos no buffer de propagação, mostra contagem regressiva
      if (now < startedAt) {
        const secsLeft = Math.ceil((startedAt - now) / 1000)
        setCountdown(secsLeft)
        setRemaining(duration)
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setCountdown(null)
      const elapsed = (now - startedAt) / 1000
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire()
        return
      }
      if (left > 0) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [startedAt, duration, onExpire])

  return { remaining, countdown }
}

// ─── Join screen ──────────────────────────────────────────────────────────────

function JoinScreen({
  slug,
  onJoined,
}: {
  slug: string
  onJoined: (sessionId: string, player: QuizPlayer) => void
}) {
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim() || !nickname.trim()) { setError('Preencha o código e o apelido.'); return }
    setLoading(true); setError('')
    try {
      const session = await findSessionByCode(code.trim())
      if (!session) { setError('Sala não encontrada ou já encerrada.'); return }
      if (session.slug !== slug) { setError('Este código é de outra aula.'); return }

      const stored = getStoredPlayer(session.id)
      const playerId = stored?.playerId ?? `${nickname.trim()}_${Date.now()}`
      const playerNick = stored?.nickname ?? nickname.trim()

      const player: QuizPlayer = {
        id: playerId, nickname: playerNick, score: 0,
        combo: 0, maxCombo: 0, lastCorrect: false, joinedAt: Date.now(),
      }
      await joinSession(session.id, playerId, playerNick)
      storePlayer(session.id, playerId, playerNick)
      onJoined(session.id, player)
    } catch { setError('Erro ao entrar. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 px-6 max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎮</div>
        <h2 className="text-2xl font-bold text-white">Entrar na Sala</h2>
        <p className="text-white/70 text-sm">Digite o código que o professor mostrou</p>
      </div>

      <div className="w-full space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={4}
          placeholder="CÓDIGO (ex: JAVA)"
          className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] bg-white/10 text-white placeholder:text-white/30 border-2 border-white/20 rounded-xl px-4 py-4 outline-none focus:border-white/60 uppercase"
        />
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={20}
          placeholder="Seu apelido"
          className="w-full text-center text-lg bg-white/10 text-white placeholder:text-white/30 border-2 border-white/20 rounded-xl px-4 py-3 outline-none focus:border-white/60"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-violet-900 font-bold text-lg hover:bg-white/90 transition disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </div>
    </div>
  )
}

// ─── Waiting lobby ────────────────────────────────────────────────────────────

function WaitingScreen({ nickname, sessionId }: { nickname: string; sessionId: string }) {
  const [players, setPlayers] = useState<QuizPlayer[]>([])

  useEffect(() => watchPlayers(sessionId, setPlayers), [sessionId])

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/70 text-sm">Aguardando o professor iniciar…</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Você entrou! 🎉</h2>
        <p className="text-white/60">Jogando como <span className="text-white font-bold">{nickname}</span></p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <p className="text-white/50 text-xs text-center uppercase tracking-wider">
          {players.length} jogador{players.length !== 1 ? 'es' : ''} na sala
        </p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {players.map((p) => (
            <div
              key={p.id}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium',
                p.nickname === nickname
                  ? 'bg-white text-violet-900'
                  : 'bg-white/10 text-white'
              )}
            >
              {p.nickname === nickname ? '⭐ ' : ''}{p.nickname}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Question screen ──────────────────────────────────────────────────────────

function QuestionScreen({
  session,
  player,
  onAnswer,
}: {
  session: QuizSession
  player: QuizPlayer
  onAnswer: (answerIndex: number, timeMs: number) => void
}) {
  const questions = getQuizQuestions(session.slug)
  const q = questions[session.currentQuestion]
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleExpire = useCallback(() => {
    if (!answered) {
      setAnswered(true)
      onAnswer(-1, QUESTION_TIME * 1000)
    }
  }, [answered, onAnswer])

  const { remaining, countdown } = useTimer(session.questionStartedAt, QUESTION_TIME, handleExpire)

  const handleSelect = (idx: number) => {
    if (answered || countdown !== null) return
    const timeMs = Math.round((QUESTION_TIME - remaining) * 1000)
    setSelected(idx)
    setAnswered(true)
    onAnswer(idx, timeMs)
  }

  const progress = remaining / QUESTION_TIME
  const timerColor = remaining > 10 ? 'bg-green-400' : remaining > 5 ? 'bg-amber-400' : 'bg-red-400'

  // Tela de countdown antes do timer oficial começar
  if (countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 w-full max-w-2xl mx-auto min-h-[400px]">
        <span className="text-white/50 text-sm">{session.currentQuestion + 1} / {session.totalQuestions}</span>
        <div className="bg-white/10 rounded-2xl p-6 w-full">
          <p className="text-white text-xl font-bold text-center leading-snug">{q.question}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-8xl font-black text-white tabular-nums animate-pulse">{countdown}</div>
          <p className="text-white/60 text-sm">Prepare-se…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-white/50 text-sm">
          {session.currentQuestion + 1} / {session.totalQuestions}
        </span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', timerColor)}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={cn('flex items-center gap-1 font-bold tabular-nums', remaining <= 5 ? 'text-red-400' : 'text-white')}>
          <Clock size={14} />
          {Math.ceil(remaining)}s
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/10 rounded-2xl p-6">
        <p className="text-white text-xl font-bold text-center leading-snug">{q.question}</p>
      </div>

      {/* Combo indicator */}
      {player.combo >= 2 && (
        <div className="text-center text-amber-300 font-bold text-sm animate-bounce">
          {comboLabel(player.combo)}
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, idx) => {
          const color = OPTION_COLORS[idx]
          const isSelected = selected === idx
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                'rounded-2xl p-4 text-left transition-all font-semibold text-white flex items-start gap-3',
                answered ? 'opacity-60 cursor-not-allowed' : color.bg,
                isSelected && color.selected,
                !answered && 'active:scale-95'
              )}
            >
              <span className="text-white/70 text-lg leading-none mt-0.5">{color.label}</span>
              <span className="text-sm leading-snug">{opt}</span>
            </button>
          )
        })}
      </div>

      {answered && (
        <p className="text-center text-white/60 text-sm animate-pulse">
          {selected === -1 ? '⏰ Tempo esgotado! Aguardando o professor…' : '✅ Resposta enviada! Aguardando os outros…'}
        </p>
      )}
    </div>
  )
}

// ─── Reveal screen ────────────────────────────────────────────────────────────

function RevealScreen({
  session,
  player,
  myAnswer,
}: {
  session: QuizSession
  player: QuizPlayer
  myAnswer: { answerIndex: number; correct: boolean; pointsEarned: number; combo: number } | null
}) {
  const questions = getQuizQuestions(session.slug)
  const q = questions[session.currentQuestion]

  const correct = myAnswer?.correct ?? false
  const points = myAnswer?.pointsEarned ?? 0
  const combo = myAnswer?.combo ?? 0

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-2xl mx-auto">
      {/* Result */}
      <div className={cn(
        'w-full rounded-2xl p-6 text-center space-y-2',
        correct ? 'bg-green-500/20 border border-green-400/30' : myAnswer?.answerIndex === -1 ? 'bg-gray-500/20 border border-gray-400/30' : 'bg-red-500/20 border border-red-400/30'
      )}>
        {correct ? (
          <>
            <CheckCircle size={40} className="mx-auto text-green-400" />
            <p className="text-2xl font-bold text-white">Correto! 🎉</p>
          </>
        ) : myAnswer?.answerIndex === -1 ? (
          <>
            <Clock size={40} className="mx-auto text-gray-400" />
            <p className="text-2xl font-bold text-white">Tempo esgotado</p>
          </>
        ) : (
          <>
            <XCircle size={40} className="mx-auto text-red-400" />
            <p className="text-2xl font-bold text-white">Errou!</p>
          </>
        )}
      </div>

      {/* Correct answer */}
      <div className="w-full space-y-2">
        <p className="text-white/50 text-xs text-center uppercase tracking-wider">Resposta correta</p>
        <div className={cn('rounded-2xl p-4 text-center font-bold text-white', OPTION_COLORS[q.correct].bg)}>
          {q.options[q.correct]}
        </div>
      </div>

      {/* Points earned */}
      {points > 0 && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-2xl">
            <Zap size={24} />
            +{points} pts
          </div>
          {combo >= 2 && (
            <div className="flex items-center gap-1 text-orange-300 font-semibold text-sm">
              <Flame size={14} />
              {comboLabel(combo)}
            </div>
          )}
        </div>
      )}

      {/* Score */}
      <div className="text-center">
        <p className="text-white/50 text-xs uppercase tracking-wider">Pontuação total</p>
        <p className="text-white font-bold text-3xl">{player.score}</p>
      </div>

      <p className="text-white/40 text-sm animate-pulse">Aguardando o professor…</p>
    </div>
  )
}

// ─── Finished screen ──────────────────────────────────────────────────────────

function FinishedScreen({
  sessionId,
  myNickname,
}: {
  sessionId: string
  myNickname: string
}) {
  const [players, setPlayers] = useState<QuizPlayer[]>([])

  useEffect(() => watchPlayers(sessionId, setPlayers), [sessionId])

  const rank = players.findIndex((p) => p.nickname === myNickname) + 1
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-sm mx-auto">
      <div className="text-center space-y-1">
        <Trophy size={48} className="mx-auto text-amber-400" />
        <h2 className="text-2xl font-bold text-white">Quiz Encerrado!</h2>
        {rank > 0 && rank <= 3 && (
          <p className="text-amber-300 font-bold text-lg">{medals[rank - 1]} {rank}º lugar!</p>
        )}
        {rank > 3 && <p className="text-white/60">{rank}º lugar</p>}
      </div>

      <div className="w-full space-y-2">
        {players.slice(0, 10).map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3',
              p.nickname === myNickname ? 'bg-white text-violet-900' : 'bg-white/10 text-white'
            )}
          >
            <span className="text-lg w-8 text-center">{medals[i] ?? `${i + 1}.`}</span>
            <span className="flex-1 font-semibold text-sm">{p.nickname}</span>
            <span className="font-bold tabular-nums">{p.score}</span>
            {p.maxCombo >= 3 && <Flame size={14} className="text-orange-400" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Quiz Modal ──────────────────────────────────────────────────────────

interface QuizModalProps {
  slug: string
  onClose: () => void
}

export function QuizModal({ slug, onClose }: QuizModalProps) {
  const [phase, setPhase] = useState<Phase>('join')
  const [sessionId, setSessionId] = useState('')
  const [player, setPlayer] = useState<QuizPlayer | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [myAnswer, setMyAnswer] = useState<{
    answerIndex: number; correct: boolean; pointsEarned: number; combo: number
  } | null>(null)

  // Watch session changes once joined
  useEffect(() => {
    if (!sessionId) return
    return watchSession(sessionId, (s) => {
      if (!s) return
      setSession(s)
      if (s.status === 'waiting' && phase !== 'waiting') setPhase('waiting')
      if (s.status === 'question') { setPhase('question'); setMyAnswer(null) }
      if (s.status === 'reveal') setPhase('reveal')
      if (s.status === 'finished') setPhase('finished')
    })
  }, [sessionId, phase])

  const handleJoined = (sid: string, p: QuizPlayer) => {
    setSessionId(sid)
    setPlayer(p)
    setPhase('waiting')
  }

  const handleAnswer = async (answerIndex: number, timeMs: number) => {
    if (!player || !session) return
    const questions = getQuizQuestions(session.slug)
    const q = questions[session.currentQuestion]
    const correct = answerIndex === q.correct
    const points = calculatePoints(correct, timeMs, player.combo + (correct ? 1 : 0))
    const newCombo = correct ? player.combo + 1 : 0

    setMyAnswer({ answerIndex, correct, pointsEarned: points, combo: newCombo })

    if (answerIndex !== -1) {
      await submitAnswer(sessionId, player, session.currentQuestion, answerIndex, correct, timeMs)
      setPlayer((prev) => prev ? { ...prev, score: prev.score + points, combo: newCombo, maxCombo: Math.max(prev.maxCombo, newCombo), lastCorrect: correct } : prev)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-950/95 backdrop-blur">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {phase === 'join' && (
          <JoinScreen slug={slug} onJoined={handleJoined} />
        )}
        {phase === 'waiting' && player && (
          <WaitingScreen nickname={player.nickname} sessionId={sessionId} />
        )}
        {phase === 'question' && session && player && (
          <QuestionScreen
            session={session}
            player={player}
            onAnswer={handleAnswer}
          />
        )}
        {phase === 'reveal' && session && player && (
          <RevealScreen
            session={session}
            player={player}
            myAnswer={myAnswer}
          />
        )}
        {phase === 'finished' && player && (
          <FinishedScreen sessionId={sessionId} myNickname={player.nickname} />
        )}
      </div>
    </div>
  )
}
