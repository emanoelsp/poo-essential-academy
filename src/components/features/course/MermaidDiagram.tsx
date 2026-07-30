'use client'

import { useEffect, useRef, useState } from 'react'
import type mermaidType from 'mermaid'

interface MermaidDiagramProps {
  chart: string
  title?: string
}

// Initialize mermaid exactly once for the whole app.
let mermaidPromise: Promise<typeof mermaidType> | null = null
function getMermaid(): Promise<typeof mermaidType> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'monospace',
      })
      return m.default
    })
  }
  return mermaidPromise
}

// mermaid's render() drives a shared singleton and mutates the document — calling
// it concurrently (a page with several diagrams mounts them all at once) makes
// the later renders collide and come back empty. Serialize every render so each
// diagram is drawn on its own.
let renderChain: Promise<unknown> = Promise.resolve()
function queueRender(id: string, chart: string): Promise<string> {
  const run = renderChain.then(async () => {
    const mermaid = await getMermaid()
    const { svg } = await mermaid.render(id, chart)
    return svg
  })
  renderChain = run.catch(() => undefined)
  return run
}

export function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const svg = await queueRender(id, chart)
        if (cancelled) return
        if (!svg || !ref.current) throw new Error('Diagrama vazio')
        ref.current.innerHTML = svg
        setStatus('done')
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
