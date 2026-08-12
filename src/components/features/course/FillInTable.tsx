'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface FillRow {
  visible: string
  answers: string[]
}

interface FillInTableProps {
  col1Header: string
  col2Header: string
  rows: FillRow[]
  legend?: string
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function FillCell({ answers }: { answers: string[] }) {
  const [value, setValue] = useState('')
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const handleBlur = () => {
    if (!value.trim()) return
    const ok = answers.some((a) => normalize(a) === normalize(value))
    setState(ok ? 'correct' : 'wrong')
  }

  const handleChange = (v: string) => {
    setValue(v)
    if (state !== 'correct') setState('idle')
  }

  if (state === 'correct') {
    return (
      <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-mono text-sm font-medium">
        {value}
        <CheckCircle2 size={15} className="shrink-0" />
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Sua resposta…"
        className={`w-full max-w-xs rounded-md border px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
          state === 'wrong'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-300'
            : 'border-input bg-background'
        }`}
      />
      {state === 'wrong' && <XCircle size={15} className="text-red-500 shrink-0" />}
    </span>
  )
}

export function FillInTable({ col1Header, col2Header, rows, legend }: FillInTableProps) {
  return (
    <div className="my-6 space-y-3">
      {legend && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
          <span className="shrink-0 text-base">💡</span>
          <span>{legend}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold w-1/2">{col1Header}</th>
              <th className="px-4 py-2.5 text-left font-semibold w-1/2">
                {col2Header}
                <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">(preencha)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 align-middle font-medium">{row.visible}</td>
                <td className="px-4 py-2.5 align-middle">
                  <FillCell answers={row.answers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Parses the fill-table fenced block format:
//   COL1: Header1
//   COL2: Header2
//   LEGEND: ...optional legend text...
//   visible text | correct answer 1 / correct answer 2
export function parseFillTable(source: string): React.ReactNode {
  const lines = source.split('\n').filter((l) => l.trim())
  let col1Header = 'Coluna 1'
  let col2Header = 'Coluna 2'
  let legend: string | undefined
  const rows: FillRow[] = []

  for (const line of lines) {
    if (line.startsWith('COL1:')) { col1Header = line.slice(5).trim(); continue }
    if (line.startsWith('COL2:')) { col2Header = line.slice(5).trim(); continue }
    if (line.startsWith('LEGEND:')) { legend = line.slice(7).trim(); continue }
    const sep = line.indexOf('|')
    if (sep === -1) continue
    const visible = line.slice(0, sep).trim()
    const answerRaw = line.slice(sep + 1).trim()
    const answers = answerRaw.split('/').map((a) => a.trim()).filter(Boolean)
    rows.push({ visible, answers })
  }

  return <FillInTable col1Header={col1Header} col2Header={col2Header} rows={rows} legend={legend} />
}
