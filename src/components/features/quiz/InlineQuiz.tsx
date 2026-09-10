'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getQuizQuestions } from '@/content/data/quizQuestions'

const OPTION_STYLES = [
  { base: 'bg-red-500   hover:bg-red-400   border-red-600',   selected: 'ring-4 ring-red-200   dark:ring-red-900',   label: '▲' },
  { base: 'bg-blue-500  hover:bg-blue-400  border-blue-600',  selected: 'ring-4 ring-blue-200  dark:ring-blue-900',  label: '◆' },
  { base: 'bg-amber-500 hover:bg-amber-400 border-amber-600', selected: 'ring-4 ring-amber-200 dark:ring-amber-900', label: '●' },
  { base: 'bg-green-500 hover:bg-green-400 border-green-600', selected: 'ring-4 ring-green-200 dark:ring-green-900', label: '■' },
]

interface InlineQuizProps {
  slug: string
  xp: number
  onComplete: () => void
  onFinish?: (score: number, total: number) => void
  alreadyCompleted?: boolean
}

export function InlineQuiz({ slug, xp, onComplete, onFinish, alreadyCompleted = false }: InlineQuizProps) {
  const questions = getQuizQuestions(slug)
  const [current, setCurrent]     = useState(0)
  const [selected, setSelected]   = useState<number | null>(null)
  const [revealed, setRevealed]   = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished]   = useState(alreadyCompleted)
  const [score, setScore]         = useState(0)

  if (questions.length === 0) return null

  const q = questions[current]
  const isLast = current === questions.length - 1

  const handleSelect = (idx: number) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (idx === q.correct) setCorrectCount((c) => c + 1)
  }

  const handleNext = () => {
    if (isLast) {
      // correctCount já foi incrementado por handleSelect antes deste clique
      setScore(correctCount)
      setFinished(true)
      onFinish?.(correctCount, questions.length)
      if (!alreadyCompleted && correctCount === questions.length) onComplete()
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setCorrectCount(0)
    setFinished(false)
    setScore(0)
  }

  // ── Tela de resultado ────────────────────────────────────────────────────────
  if (finished) {
    const pct    = Math.round((score / questions.length) * 100)
    const perfect = score === questions.length

    return (
      <div className="rounded-2xl border bg-card p-8 flex flex-col items-center gap-6 text-center">
        <Trophy size={48} className={cn(perfect ? 'text-amber-400' : 'text-muted-foreground')} />
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {perfect ? 'Perfeito! 10/10 🎉' : 'Questionário encerrado'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {score} de {questions.length} questões corretas ({pct}%)
          </p>
        </div>

        {/* Score bar */}
        <div className="w-full max-w-xs">
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', perfect ? 'bg-green-500' : 'bg-amber-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {perfect && !alreadyCompleted && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
            <CheckCircle size={18} />
            +{xp} XP conquistados
          </div>
        )}

        {alreadyCompleted && perfect && (
          <p className="text-xs text-muted-foreground">Você já havia concluído este questionário.</p>
        )}

        {!perfect && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            É necessário 10/10 para concluir. Revise o conteúdo e tente novamente!
          </div>
        )}

        <Button variant="outline" onClick={handleRestart} className="gap-2">
          <RotateCcw size={15} />
          {perfect ? 'Refazer questionário' : 'Tentar novamente'}
        </Button>
      </div>
    )
  }

  // ── Tela de pergunta ─────────────────────────────────────────────────────────
  const progress = ((current) / questions.length) * 100

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Questão {current + 1} de {questions.length}</span>
          <span>{correctCount} corretas</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pergunta */}
      <div className="rounded-2xl border bg-muted/30 p-6">
        <p className="text-lg font-semibold leading-snug">{q.question}</p>
      </div>

      {/* Opções */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.options.map((opt, idx) => {
          const style   = OPTION_STYLES[idx]
          const correct = idx === q.correct
          const wrong   = revealed && selected === idx && !correct

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={cn(
                'rounded-2xl border-2 p-4 text-left font-semibold text-white flex items-start gap-3 transition-all',
                revealed
                  ? correct
                    ? 'bg-green-500 border-green-600 opacity-100'
                    : wrong
                      ? 'bg-red-500 border-red-600 opacity-100'
                      : 'opacity-40 cursor-not-allowed ' + style.base
                  : style.base + ' active:scale-95',
                !revealed && selected === idx && style.selected,
              )}
            >
              <span className="text-white/70 text-lg leading-none mt-0.5 shrink-0">{style.label}</span>
              <span className="text-sm leading-snug flex-1">{opt}</span>
              {revealed && correct && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
              {wrong && <XCircle size={16} className="shrink-0 mt-0.5" />}
            </button>
          )
        })}
      </div>

      {/* Feedback + próxima */}
      {revealed && (
        <div className={cn(
          'rounded-xl p-4 flex items-center justify-between gap-4',
          selected === q.correct
            ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
        )}>
          <div className="flex items-center gap-2">
            {selected === q.correct
              ? <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0" />
              : <XCircle    size={18} className="text-red-600    dark:text-red-400    shrink-0" />
            }
            <span className={cn(
              'text-sm font-medium',
              selected === q.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            )}>
              {selected === q.correct ? 'Correto!' : `Incorreto. Resposta: ${q.options[q.correct]}`}
            </span>
          </div>
          <Button size="sm" onClick={handleNext} className="gap-1 shrink-0">
            {isLast ? 'Ver resultado' : 'Próxima'}
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
