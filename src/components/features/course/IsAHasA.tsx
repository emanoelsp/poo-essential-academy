'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { blockHash, usePersistedState } from '@/hooks/usePersistedState'

// ── Types ─────────────────────────────────────────────────────────────────────

type Answer = 'heranca' | 'composicao'

interface Pair {
  a: string
  b: string
  answer: Answer
  explanation: string
}

// ── Single Item ───────────────────────────────────────────────────────────────

function IsAHasAItem({ pair, index, itemKey }: { pair: Pair; index: number; itemKey: string }) {
  const [chosen, setChosen]   = usePersistedState<Answer | null>(`${itemKey}:chosen`, null)
  const [locked, setLocked]   = usePersistedState<boolean>(`${itemKey}:locked`, false)

  const handle = (ans: Answer) => {
    if (locked) return
    setChosen(ans)
    if (ans === pair.answer) setLocked(true)
  }

  const correct = locked && chosen === pair.answer
  const wrong   = !locked && chosen !== null

  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${
      correct ? 'border-green-300 dark:border-green-800 bg-green-50/40 dark:bg-green-950/10' : 'border-border'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Item {index + 1}
        </span>
        {correct && <CheckCircle2 size={13} className="text-green-500" />}
      </div>

      {/* Classes */}
      <p className="text-sm mb-3 leading-6">
        Qual é a relação entre{' '}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">{pair.a}</code>
        {' '}e{' '}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">{pair.b}</code>
        ?
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handle('heranca')}
          disabled={locked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
            locked && pair.answer === 'heranca'
              ? 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
              : !locked && chosen === 'heranca'
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300'
              : 'border-muted bg-background hover:border-primary/40 hover:bg-muted/30 cursor-pointer'
          } ${locked ? 'cursor-default' : ''}`}
        >
          <span className="text-base">🧬</span>
          É-UM (Herança)
          {locked && pair.answer === 'heranca' && <CheckCircle2 size={13} />}
          {!locked && chosen === 'heranca' && <XCircle size={13} />}
        </button>

        <button
          onClick={() => handle('composicao')}
          disabled={locked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
            locked && pair.answer === 'composicao'
              ? 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
              : !locked && chosen === 'composicao'
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300'
              : 'border-muted bg-background hover:border-primary/40 hover:bg-muted/30 cursor-pointer'
          } ${locked ? 'cursor-default' : ''}`}
        >
          <span className="text-base">🔗</span>
          TEM-UM (Composição)
          {locked && pair.answer === 'composicao' && <CheckCircle2 size={13} />}
          {!locked && chosen === 'composicao' && <XCircle size={13} />}
        </button>
      </div>

      {/* Wrong feedback */}
      {wrong && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <XCircle size={11} />
          Não é essa. Pense: &quot;A <em>É-UM</em> tipo de B?&quot; — se sim, herança. Caso contrário, composição.
        </p>
      )}

      {/* Correct explanation */}
      {correct && (
        <p className="mt-2 text-xs text-green-700 dark:text-green-400 italic">
          {pair.explanation}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function IsAHasA({ pairs, blockKey }: { pairs: Pair[]; blockKey: string }) {
  const done = pairs.length

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 text-xs text-violet-800 dark:text-violet-300">
        <span className="shrink-0 text-base">🎯</span>
        <span>
          Para cada par de classes, decida: a primeira <strong>É-UM tipo</strong> da segunda (herança)
          ou <strong>TEM-UM</strong> relacionamento com ela (composição)? O feedback aparece na hora.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {pairs.map((pair, i) => (
          <IsAHasAItem
            key={i}
            pair={pair}
            index={i}
            itemKey={`${blockKey}:${pair.a}-${pair.b}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Format (one per line):
//   PAIR:ClasseA|ClasseB:heranca|composicao:Explicação após acerto
export function parseIsAHasA(source: string): React.ReactNode {
  const pairs: Pair[] = []

  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line || !line.startsWith('PAIR:')) continue

    const rest   = line.slice(5)
    const parts  = rest.split(':')
    if (parts.length < 3) continue

    const [ab, answer, ...expParts] = parts
    const [a, b] = ab.split('|').map(s => s.trim())
    const explanation = expParts.join(':').trim()

    if (a && b && (answer === 'heranca' || answer === 'composicao')) {
      pairs.push({ a, b, answer, explanation })
    }
  }

  return <IsAHasA pairs={pairs} blockKey={blockHash(source)} />
}
