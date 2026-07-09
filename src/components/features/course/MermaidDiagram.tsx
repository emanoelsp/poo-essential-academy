'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
  title?: string
}

export function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          fontFamily: 'monospace',
        })
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
          setStatus('done')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e))
          setStatus('error')
        }
      }
    }
    render()
    return () => { cancelled = true }
  }, [chart])

  if (status === 'error') {
    return (
      <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        Erro no diagrama: {errorMsg}
      </div>
    )
  }

  return (
    <figure className="my-4 overflow-x-auto rounded-xl border bg-white p-4 dark:bg-slate-900">
      {title && (
        <figcaption className="mb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </figcaption>
      )}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-2 py-8 animate-pulse">
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      )}
      <div
        ref={ref}
        className={`flex justify-center [&_svg]:max-w-full transition-opacity ${status === 'done' ? 'opacity-100' : 'opacity-0 h-0'}`}
      />
    </figure>
  )
}
