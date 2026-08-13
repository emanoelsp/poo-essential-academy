'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { blockHash, usePersistedState } from '@/hooks/usePersistedState'
import { usePathname } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TraceVar {
  name: string
  type: string
  answer: string
}

interface TraceStep {
  code: string
  vars: TraceVar[]
}

interface CodeTraceProps {
  scenario: string
  steps: TraceStep[]
  blockKey: string
  presets: Record<string, string>[]
}

// ── Trace Input Cell ──────────────────────────────────────────────────────────

function TraceInput({ answer, cellKey }: { answer: string; cellKey: string }) {
  const [value, setValue] = usePersistedState<string>(`${cellKey}:v`, '')
  const [status, setStatus] = usePersistedState<'idle' | 'correct' | 'wrong'>(`${cellKey}:s`, 'idle')

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

  const handleBlur = () => {
    if (!value.trim()) return
    setStatus(normalize(value) === normalize(answer) ? 'correct' : 'wrong')
  }

  if (status === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-mono text-xs font-medium">
        {value} <CheckCircle2 size={11} />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setStatus('idle') }}
        onBlur={handleBlur}
        placeholder="___"
        className={`rounded border px-2 py-0.5 text-xs font-mono w-28 outline-none focus:ring-1 transition-colors ${
          status === 'wrong'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-300'
            : 'border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 focus:ring-primary/50'
        }`}
      />
      {status === 'wrong' && <XCircle size={11} className="text-red-500 shrink-0" />}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CodeTrace({ scenario, steps, blockKey, presets }: CodeTraceProps) {
  const pathname = usePathname()
  const presetStorageKey = `poo:${pathname}:${blockKey}:preset`
  const [presetIdx, setPresetIdx] = useState(-1)
  const initialized = useRef(false)

  // Pick a random preset once and persist it — each student keeps the same
  // values across page reloads but may differ from classmates.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (presets.length === 0) { setPresetIdx(0); return }
    try {
      const saved = localStorage.getItem(presetStorageKey)
      if (saved !== null) {
        setPresetIdx(parseInt(saved, 10))
      } else {
        const idx = Math.floor(Math.random() * presets.length)
        localStorage.setItem(presetStorageKey, String(idx))
        setPresetIdx(idx)
      }
    } catch {
      setPresetIdx(0)
    }
  }, [presetStorageKey, presets.length])

  const vars = presets[presetIdx] ?? {}
  const sub = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)

  return (
    <div className="my-6 space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-xs text-orange-800 dark:text-orange-300">
        <span className="shrink-0 text-base">🔍</span>
        <span>
          <strong>Rastreamento de Execução:</strong> {scenario} Use o código da Etapa 3 como
          referência. Clique fora do campo para verificar — você pode tentar quantas vezes quiser.
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, si) => (
          <div key={si} className="rounded-xl border border-border overflow-hidden">
            {/* Code instruction */}
            <div className="bg-zinc-900 dark:bg-zinc-950 px-4 py-2.5">
              <span className="text-xs text-zinc-500 select-none mr-2">{si + 1}.</span>
              <code className="text-sm text-green-400 font-mono">{sub(step.code)}</code>
            </div>
            {/* State table */}
            {step.vars.length > 0 && (
              <table className="w-full text-xs border-t border-border/50">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground w-1/3">
                      Variável
                    </th>
                    <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground w-1/6">
                      Tipo
                    </th>
                    <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">
                      Valor após a instrução
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step.vars.map((v, vi) => (
                    <tr key={vi} className="border-t border-border/30 hover:bg-muted/10">
                      <td className="px-3 py-2 font-mono text-foreground">{v.name}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{v.type}</td>
                      <td className="px-3 py-2">
                        <TraceInput answer={sub(v.answer)} cellKey={`${blockKey}:s${si}v${vi}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Format:
//   KEY:stable-id               (optional; overrides content-hash key)
//   PRESET:k=v,k=v,...          (one line per scenario variant; picked randomly)
//   SCENARIO:description text
//   STEP:Java code line          (supports {varName} substitution)
//   VAR:varName:type:expected    (expected supports {varName} substitution)
//   (blank lines ignored)
export function parseCodeTrace(source: string): React.ReactNode {
  let scenario = 'Rastreie os valores das variáveis passo a passo.'
  let blockKey = blockHash(source)
  const steps: TraceStep[] = []
  const presets: Record<string, string>[] = []
  let current: TraceStep | null = null

  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('KEY:')) { blockKey = line.slice(4).trim(); continue }
    if (line.startsWith('SCENARIO:')) { scenario = line.slice(9).trim(); continue }

    if (line.startsWith('PRESET:')) {
      const kv: Record<string, string> = {}
      for (const pair of line.slice(7).split(',')) {
        const eq = pair.indexOf('=')
        if (eq !== -1) kv[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
      }
      presets.push(kv)
      continue
    }

    if (line.startsWith('STEP:')) {
      if (current) steps.push(current)
      current = { code: line.slice(5).trim(), vars: [] }
      continue
    }

    if (line.startsWith('VAR:') && current) {
      const rest = line.slice(4)
      const firstColon = rest.indexOf(':')
      const secondColon = rest.indexOf(':', firstColon + 1)
      if (firstColon !== -1 && secondColon !== -1) {
        current.vars.push({
          name: rest.slice(0, firstColon).trim(),
          type: rest.slice(firstColon + 1, secondColon).trim(),
          answer: rest.slice(secondColon + 1).trim(),
        })
      }
    }
  }

  if (current) steps.push(current)

  return <CodeTrace scenario={scenario} steps={steps} blockKey={blockKey} presets={presets} />
}
