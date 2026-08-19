'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type mermaidType from 'mermaid'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

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

const MIN_SCALE = 0.5
const MAX_SCALE = 4
const ZOOM_STEP = 0.25

export function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const translateRef = useRef({ x: 0, y: 0 })

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

  // Keep translateRef in sync so mouse handlers always read latest value
  useEffect(() => {
    translateRef.current = translate
  }, [translate])

  const resetView = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  const zoom = useCallback((delta: number) => {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    dragStart.current = {
      x: e.clientX - translateRef.current.x,
      y: e.clientY - translateRef.current.y,
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    setTranslate({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }, [])

  const stopDrag = useCallback(() => {
    dragging.current = false
  }, [])

  if (status === 'error') {
    return (
      <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        Erro no diagrama: {errorMsg}
      </div>
    )
  }

  const isTransformed = scale !== 1 || translate.x !== 0 || translate.y !== 0

  return (
    <figure className="my-4 rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
      {title && (
        <figcaption className="px-4 pt-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </figcaption>
      )}

      {/* Toolbar */}
      {status === 'done' && (
        <div className="flex items-center justify-end gap-1 px-3 pt-2 pb-1">
          <span className="mr-auto text-xs text-muted-foreground select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => zoom(-ZOOM_STEP)}
            disabled={scale <= MIN_SCALE}
            title="Diminuir zoom"
            className="rounded p-1 hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => zoom(ZOOM_STEP)}
            disabled={scale >= MAX_SCALE}
            title="Aumentar zoom"
            className="rounded p-1 hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={resetView}
            disabled={!isTransformed}
            title="Restaurar visualização"
            className="rounded p-1 hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      )}

      {/* Diagram viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden p-4"
        style={{ cursor: dragging.current ? 'grabbing' : status === 'done' ? 'grab' : 'default', userSelect: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 py-8 animate-pulse">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-3 w-40 rounded bg-muted" />
          </div>
        )}
        <div
          ref={ref}
          className={`flex justify-center [&_svg]:max-w-full transition-opacity origin-center ${status === 'done' ? 'opacity-100' : 'opacity-0 h-0'}`}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: dragging.current ? 'none' : 'transform 0.15s ease',
          }}
        />
      </div>

      {status === 'done' && (
        <p className="pb-2 text-center text-[10px] text-muted-foreground/50 select-none">
          scroll para zoom · arraste para mover
        </p>
      )}
    </figure>
  )
}
