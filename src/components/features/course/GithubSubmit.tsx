'use client'

import React from 'react'
import { usePersistedState, blockHash } from '@/hooks/usePersistedState'
import { CheckCircle2, AlertTriangle, ExternalLink, Pencil } from 'lucide-react'

interface GithubSubmitProps {
  label: string
  placeholder: string
  blockKey: string
}

export function GithubSubmit({ label, placeholder, blockKey }: GithubSubmitProps) {
  const key = blockHash(blockKey)
  const [submitted, setSubmitted] = usePersistedState<string | null>(`github:${key}:url`, null)
  const [draft, setDraft] = usePersistedState<string>(`github:${key}:draft`, '')
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed.startsWith('https://github.com/')) {
      setError('A URL deve começar com https://github.com/')
      return
    }
    setError(null)
    setSubmitted(trimmed)
  }

  const handleEdit = () => {
    setDraft(submitted ?? '')
    setSubmitted(null)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="my-4 rounded-xl border border-violet-400/30 bg-violet-950/20 p-4 flex items-start gap-3">
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-violet-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-violet-200 mb-1">{label}</p>
          <a
            href={submitted}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-100 underline underline-offset-2 break-all transition-colors"
          >
            {submitted}
            <ExternalLink size={11} className="shrink-0" />
          </a>
        </div>
        <button
          onClick={handleEdit}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-900/40 px-2.5 py-1.5 text-xs text-violet-300 hover:bg-violet-800/50 transition"
        >
          <Pencil size={11} />
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="my-4 rounded-xl border border-violet-500/30 bg-violet-950/10 p-4">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-lg border border-violet-500/30 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <button
          onClick={handleSubmit}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
        >
          Enviar
        </button>
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
          <AlertTriangle size={12} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

export function parseGithubSubmit(source: string): React.ReactNode {
  const lines = source.split('\n')
  let label = 'Envie seu repositório GitHub'
  let placeholder = 'https://github.com/usuario/repositorio'

  for (const line of lines) {
    const labelMatch = line.match(/^LABEL:\s*(.+)/)
    if (labelMatch) label = labelMatch[1].trim()
    const placeholderMatch = line.match(/^PLACEHOLDER:\s*(.+)/)
    if (placeholderMatch) placeholder = placeholderMatch[1].trim()
  }

  return <GithubSubmit label={label} placeholder={placeholder} blockKey={source} />
}
