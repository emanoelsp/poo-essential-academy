'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { blockHash, usePersistedState } from '@/hooks/usePersistedState'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClassItem {
  text: string
  blank: boolean
  answer: string
}

interface UMLClass {
  name: string
  nameBlank: boolean
  nameAnswer: string
  attrs: ClassItem[]
  methods: ClassItem[]
}

// ── FillInput ─────────────────────────────────────────────────────────────────

function FillInput({ answer, wide, cellKey }: { answer: string; wide?: boolean; cellKey: string }) {
  const [value, setValue] = usePersistedState<string>(`${cellKey}:v`, '')
  const [state, setState] = usePersistedState<'idle' | 'correct' | 'wrong'>(`${cellKey}:s`, 'idle')

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

  const handleBlur = () => {
    if (!value.trim()) return
    setState(normalize(value) === normalize(answer) ? 'correct' : 'wrong')
  }

  const handleChange = (v: string) => {
    setValue(v)
    if (state !== 'correct') setState('idle')
  }

  if (state === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-mono text-xs font-medium">
        {value}
        <CheckCircle2 size={11} className="shrink-0" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="___"
        className={`rounded border px-2 py-0.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary/50 transition-colors ${
          wide ? 'w-40' : 'w-28'
        } ${
          state === 'wrong'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-300'
            : 'border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
        }`}
      />
      {state === 'wrong' && <XCircle size={11} className="text-red-500 shrink-0" />}
    </span>
  )
}

// ── UML Class Box ─────────────────────────────────────────────────────────────

function UMLClassBox({ cls, keyPrefix }: { cls: UMLClass; keyPrefix: string }) {
  return (
    <div className="rounded-lg border-2 border-foreground/25 min-w-[230px] overflow-hidden text-xs font-mono shadow-sm bg-background">
      {/* Name */}
      <div className="border-b-2 border-foreground/25 bg-muted/70 px-3 py-2 text-center font-bold text-sm">
        {cls.nameBlank ? <FillInput answer={cls.nameAnswer} cellKey={`${keyPrefix}:name`} /> : cls.name}
      </div>
      {/* Attributes */}
      <div className="border-b border-foreground/15 px-3 py-1.5 space-y-1 min-h-[2rem]">
        {cls.attrs.map((a, i) => (
          <div key={i} className="leading-5 flex items-center gap-1">
            <span className="text-muted-foreground select-none">+</span>
            {a.blank
              ? <FillInput answer={a.answer} wide cellKey={`${keyPrefix}:a${i}`} />
              : <span>{a.text}</span>
            }
          </div>
        ))}
      </div>
      {/* Methods */}
      <div className="px-3 py-1.5 space-y-1 min-h-[2rem]">
        {cls.methods.map((m, i) => (
          <div key={i} className="leading-5 flex items-center gap-1">
            <span className="text-muted-foreground select-none">+</span>
            {m.blank
              ? <FillInput answer={m.answer} wide cellKey={`${keyPrefix}:m${i}`} />
              : <span>{m.text}</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FillInUML ─────────────────────────────────────────────────────────────────

export function FillInUML({ classes, blockKey }: { classes: UMLClass[]; blockKey: string }) {
  return (
    <div className="my-6 space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
        <span className="shrink-0 text-base">📐</span>
        <span>
          Preencha os campos em branco (borda tracejada laranja) do diagrama UML.
          Clique fora do campo para verificar — você pode tentar quantas vezes quiser até acertar.
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-wrap gap-4 min-w-max">
          {classes.map((cls, i) => (
            <UMLClassBox key={i} cls={cls} keyPrefix={`${blockKey}:c${i}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Format:
//   CLASS:ClassName            → class name visible
//   CLASS:___:CorrectName      → class name blank (student fills)
//   ATTR:text                  → attribute visible
//   ATTR:___:correctText       → attribute blank
//   METHOD:text                → method visible
//   METHOD:___:correctText     → method blank
//   (blank line separates classes)
export function parseFillUML(source: string): React.ReactNode {
  const lines = source.split('\n')
  const classes: UMLClass[] = []
  let current: UMLClass | null = null

  const pushCurrent = () => {
    if (current) classes.push(current)
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('CLASS:')) {
      pushCurrent()
      const rest = line.slice(6)
      if (rest.startsWith('___:')) {
        current = { name: '', nameBlank: true, nameAnswer: rest.slice(4), attrs: [], methods: [] }
      } else {
        current = { name: rest, nameBlank: false, nameAnswer: rest, attrs: [], methods: [] }
      }
      continue
    }

    if (!current) continue

    if (line.startsWith('ATTR:')) {
      const rest = line.slice(5)
      if (rest.startsWith('___:')) {
        current.attrs.push({ text: '', blank: true, answer: rest.slice(4) })
      } else {
        current.attrs.push({ text: rest, blank: false, answer: rest })
      }
      continue
    }

    if (line.startsWith('METHOD:')) {
      const rest = line.slice(7)
      if (rest.startsWith('___:')) {
        current.methods.push({ text: '', blank: true, answer: rest.slice(4) })
      } else {
        current.methods.push({ text: rest, blank: false, answer: rest })
      }
    }
  }

  pushCurrent()

  return <FillInUML classes={classes} blockKey={blockHash(source)} />
}
