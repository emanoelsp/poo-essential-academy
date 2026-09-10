'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { usePersistedState, blockHash } from '@/hooks/usePersistedState'

interface BugQuestionDef {
  text: string
  options: string[]
  correct: number
}

interface BugEntry {
  num: number
  snippet: string
  context: string
  questions: BugQuestionDef[]
}

// ── Single Question ────────────────────────────────────────────────────────────

function BugQuestionRow({ q, qKey }: { q: BugQuestionDef; qKey: string }) {
  const [chosen, setChosen] = usePersistedState<number | null>(`${qKey}:a`, null)
  const [locked, setLocked] = usePersistedState<boolean>(`${qKey}:l`, false)

  const pick = (i: number) => {
    if (locked) return
    setChosen(i)
    if (i === q.correct) setLocked(true)
  }

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold text-muted-foreground mb-2">{q.text}</p>
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct
          const isChosen  = chosen === i
          let cls = 'border-muted bg-background hover:border-primary/40 hover:bg-muted/30 cursor-pointer'
          if (locked && isCorrect) {
            cls = 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
          } else if (!locked && isChosen) {
            cls = 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300'
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={locked}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs text-left transition-all ${cls} ${locked ? 'cursor-default' : ''}`}
            >
              <span className="shrink-0 w-4 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt}</span>
              {locked && isCorrect && <CheckCircle2 size={12} className="shrink-0 text-green-500" />}
              {!locked && isChosen  && <XCircle     size={12} className="shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>
      {!locked && chosen !== null && (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
          Não é essa — analise o código com atenção e tente novamente.
        </p>
      )}
    </div>
  )
}

// ── Bug Card ───────────────────────────────────────────────────────────────────

function BugCard({ bug, cardKey }: { bug: BugEntry; cardKey: string }) {
  return (
    <div className="rounded-xl border-2 border-orange-200 dark:border-orange-900 p-4">
      <div className="mb-2">
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
          Bug {bug.num}
        </span>
      </div>
      <code className="block rounded bg-muted px-2 py-1.5 text-xs font-mono mb-1 break-all">
        {bug.snippet}
      </code>
      <p className="text-[11px] text-muted-foreground italic">{bug.context}</p>
      {bug.questions.map((q, qi) => (
        <BugQuestionRow key={qi} q={q} qKey={`${cardKey}:q${qi}`} />
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function BugHunter({ bugs, blockKey }: { bugs: BugEntry[]; blockKey: string }) {
  return (
    <div className="my-6 space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-xs text-orange-800 dark:text-orange-300">
        <span className="shrink-0 text-base">🔍</span>
        <span>
          O código abaixo tem <strong>3 erros de herança</strong>. Para cada bug, identifique{' '}
          <strong>o que está errado</strong> e <strong>qual conceito OO foi violado</strong>.
          O feedback aparece na hora.
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {bugs.map((bug, i) => (
          <BugCard key={i} bug={bug} cardKey={`${blockKey}:b${bug.num}`} />
        ))}
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Format:
//   BUG:N:code snippet:context description
//   Q:Question text?:OptionA|OptionB|OptionC|OptionD:correct_index(0-based)
export function parseBugHunter(source: string): React.ReactNode {
  const bugs: BugEntry[] = []
  let current: BugEntry | null = null

  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('BUG:')) {
      if (current) bugs.push(current)
      const rest    = line.slice(4)
      const colon1  = rest.indexOf(':')
      const num     = parseInt(rest.slice(0, colon1))
      const rest2   = rest.slice(colon1 + 1)
      const colon2  = rest2.indexOf(':')
      const snippet = rest2.slice(0, colon2)
      const context = rest2.slice(colon2 + 1)
      current = { num, snippet, context, questions: [] }
    } else if (line.startsWith('Q:') && current) {
      // Q:question text:OptionA|OptionB|...:correct_index
      // Parse from the right so colons in question text are safe
      const rest          = line.slice(2)
      const lastColon     = rest.lastIndexOf(':')
      const correct       = parseInt(rest.slice(lastColon + 1))
      const beforeLast    = rest.slice(0, lastColon)
      const secondLast    = beforeLast.lastIndexOf(':')
      const options       = beforeLast.slice(secondLast + 1).split('|')
      const text          = beforeLast.slice(0, secondLast)
      current.questions.push({ text, options, correct })
    }
  }
  if (current) bugs.push(current)

  return <BugHunter bugs={bugs} blockKey={blockHash(source)} />
}
