'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CodeBlock({ code, language = 'java', title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group relative rounded-xl border bg-slate-950 text-sm', className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          {title && <span className="text-xs text-slate-400 font-mono">{title}</span>}
          {!title && language && (
            <span className="text-xs text-slate-500 uppercase tracking-wide">{language}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label="Copiar código"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-slate-100 leading-relaxed">
        <code className="font-mono text-[13px]">{code}</code>
      </pre>
    </div>
  )
}
