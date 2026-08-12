'use client'

import React from 'react'
import { MermaidDiagram } from './MermaidDiagram'
import { CodeBlock } from './CodeBlock'
import { parseFillTable } from './FillInTable'
import { parseFillUML } from './FillInUML'
import { Lock } from 'lucide-react'

interface ContentRendererProps {
  content: string
  showGabarito?: boolean
}

function parseMermaidAndCode(content: string, showGabarito: boolean): React.ReactNode[] {
  const blocks = content.split(/(```[\s\S]*?```)/g)
  return blocks.map((block, i) => {
    if (block.startsWith('```mermaid')) {
      const chart = block.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '')
      return <MermaidDiagram key={i} chart={chart} />
    }
    if (block.startsWith('```fill-table')) {
      const src = block.replace(/^```fill-table\n?/, '').replace(/\n?```$/, '')
      return <React.Fragment key={i}>{parseFillTable(src)}</React.Fragment>
    }
    if (block.startsWith('```fill-uml')) {
      const src = block.replace(/^```fill-uml\n?/, '').replace(/\n?```$/, '')
      return <React.Fragment key={i}>{parseFillUML(src)}</React.Fragment>
    }
    if (block.startsWith('```')) {
      const firstLine = block.split('\n')[0]
      const lang = firstLine.replace('```', '').trim() || 'java'
      const code = block.replace(/^```[^\n]*\n/, '').replace(/\n?```$/, '')
      return <CodeBlock key={i} code={code} language={lang} />
    }
    return <MarkdownText key={i} text={block} showGabarito={showGabarito} />
  })
}

// Detect callout type from first word of blockquote text
function detectCallout(text: string): {
  type: 'note' | 'warning' | 'tip' | 'gabarito' | 'quote' | null
  cleaned: string
} {
  const patterns: Array<[RegExp, 'warning' | 'note' | 'tip' | 'gabarito']> = [
    [/^\*\*(Atenção|Cuidado|Importante|Aviso):?\*\*\s*/i, 'warning'],
    [/^\*\*(Nota|Observação|Lembre):?\*\*\s*/i, 'note'],
    [/^\*\*(Dica|Tip|Pro tip|Dicas):?\*\*\s*/i, 'tip'],
    // Answer keys — match the label even when it carries extra text before the
    // closing `**`, e.g. `**Gabarito esperado — X:**`, `**Resposta modelo para "Y":**`.
    [/^\*\*(Gabarito|Resposta|Respostas|Solução|Resolução)[^*]*\*\*\s*/i, 'gabarito'],
  ]
  for (const [re, type] of patterns) {
    if (re.test(text)) return { type, cleaned: text.replace(re, '') }
  }
  return { type: null, cleaned: text }
}

const CALLOUT_STYLES = {
  warning:  'border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
  note:     'border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
  tip:      'border-l-4 border-green-400 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200',
  gabarito: 'border-l-4 border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200',
  quote:    'border-l-4 border-muted bg-muted/30 text-muted-foreground',
}

const CALLOUT_LABEL: Record<string, string> = {
  warning:  '⚠️ Atenção',
  note:     '📝 Nota',
  tip:      '💡 Dica',
  gabarito: '✅ Gabarito',
}

function GabaritoLocked() {
  return (
    <div className="my-4 flex items-center gap-2 rounded-lg border border-dashed border-muted px-4 py-3 text-sm text-muted-foreground">
      <Lock size={14} className="shrink-0" />
      <span>Gabarito oculto pelo professor.</span>
    </div>
  )
}

function MarkdownText({ text, showGabarito }: { text: string; showGabarito: boolean }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  let tableBuffer: string[] = []
  let blockquoteBuffer: string[] = []
  let listBuffer: Array<{ type: 'ul' | 'ol'; content: React.ReactNode; checked?: boolean | null }> = []

  const flushTable = () => {
    if (tableBuffer.length < 2) { tableBuffer = []; return }
    const headers = tableBuffer[0].split('|').filter(Boolean).map((h) => h.trim())
    const rows = tableBuffer.slice(2).map((r) => r.split('|').filter(Boolean).map((c) => c.trim()))
    nodes.push(
      <div key={`tbl${nodes.length}`} className="my-6 overflow-x-auto rounded-lg border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-semibold">{inlineFormat(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t hover:bg-muted/20 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 align-top">{inlineFormat(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableBuffer = []
  }

  const flushBlockquote = () => {
    if (blockquoteBuffer.length === 0) return
    const full = blockquoteBuffer.join(' ')
    const { type, cleaned } = detectCallout(full)
    const calloutType = type ?? 'quote'
    const style = CALLOUT_STYLES[calloutType]

    if (calloutType === 'gabarito' && !showGabarito) {
      nodes.push(<GabaritoLocked key={`bq${nodes.length}`} />)
    } else {
      nodes.push(
        <div key={`bq${nodes.length}`} className={`my-4 rounded-r-lg p-4 text-sm leading-relaxed ${style}`}>
          {CALLOUT_LABEL[calloutType] && (
            <p className="font-bold mb-1 text-xs uppercase tracking-wide opacity-80">{CALLOUT_LABEL[calloutType]}</p>
          )}
          <span className="italic">{inlineFormat(cleaned)}</span>
        </div>
      )
    }
    blockquoteBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length === 0) return
    const isOrdered = listBuffer[0].type === 'ol'
    const hasCheckboxes = listBuffer.some((item) => item.checked !== null && item.checked !== undefined)

    if (hasCheckboxes) {
      nodes.push(
        <ul key={`chklist${nodes.length}`} className="my-3 space-y-1.5 pl-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-6">
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.checked
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground/40 bg-background'
              }`}>
                {item.checked && (
                  <svg viewBox="0 0 12 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 5l3.5 3.5L11 1" />
                  </svg>
                )}
              </span>
              <span className={item.checked ? 'text-muted-foreground line-through' : ''}>{item.content}</span>
            </li>
          ))}
        </ul>
      )
    } else if (isOrdered) {
      nodes.push(
        <ol key={`ol${nodes.length}`} className="my-3 space-y-1 pl-6 list-decimal marker:text-muted-foreground">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-sm leading-7 pl-1">{item.content}</li>
          ))}
        </ol>
      )
    } else {
      nodes.push(
        <ul key={`ul${nodes.length}`} className="my-3 space-y-1 pl-6 list-disc marker:text-primary/60">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-sm leading-7 pl-1">{item.content}</li>
          ))}
        </ul>
      )
    }
    listBuffer = []
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Table
    if (trimmed.startsWith('|')) {
      flushBlockquote(); flushList()
      tableBuffer.push(line)
      i++; continue
    } else if (tableBuffer.length > 0) {
      flushTable()
    }

    // Blockquote (multi-line)
    const bqMatch = line.match(/^> (.*)/)
    if (bqMatch) {
      flushList()
      blockquoteBuffer.push(bqMatch[1])
      i++; continue
    } else if (blockquoteBuffer.length > 0) {
      flushBlockquote()
    }

    // Empty line
    if (!trimmed) {
      flushList()
      nodes.push(<div key={`sp${i}`} className="h-2" />)
      i++; continue
    }

    // Separator
    if (/^---+$/.test(trimmed)) {
      flushList()
      nodes.push(<hr key={i} className="my-8 border-muted" />)
      i++; continue
    }

    // Image (block-level): ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      flushList()
      const [, alt, src] = imgMatch
      nodes.push(
        <figure key={i} className="my-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" className="mx-auto max-w-full rounded-lg border bg-white" />
          {alt && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{alt}</figcaption>}
        </figure>
      )
      i++; continue
    }

    // Headings
    const h1 = line.match(/^# (.+)/)
    if (h1) { flushList(); nodes.push(<h1 key={i} className="mt-10 mb-4 text-3xl font-bold tracking-tight">{inlineFormat(h1[1])}</h1>); i++; continue }
    const h2 = line.match(/^## (.+)/)
    if (h2) { flushList(); nodes.push(<h2 key={i} className="mt-10 mb-3 text-xl font-bold border-b pb-2">{inlineFormat(h2[1])}</h2>); i++; continue }
    const h3 = line.match(/^### (.+)/)
    if (h3) { flushList(); nodes.push(<h3 key={i} className="mt-7 mb-2 text-lg font-semibold text-foreground">{inlineFormat(h3[1])}</h3>); i++; continue }
    const h4 = line.match(/^#### (.+)/)
    if (h4) { flushList(); nodes.push(<h4 key={i} className="mt-5 mb-1 font-semibold text-sm uppercase tracking-wide text-muted-foreground">{inlineFormat(h4[1])}</h4>); i++; continue }

    // Checkbox list items
    const checkOn  = line.match(/^[-*] \[x\] (.+)/i)
    const checkOff = line.match(/^[-*] \[ \] (.+)/)
    if (checkOn)  { blockquoteBuffer.length > 0 && flushBlockquote(); listBuffer.push({ type: 'ul', content: inlineFormat(checkOn[1]),  checked: true  }); i++; continue }
    if (checkOff) { blockquoteBuffer.length > 0 && flushBlockquote(); listBuffer.push({ type: 'ul', content: inlineFormat(checkOff[1]), checked: false }); i++; continue }

    // Unordered list
    const ul = line.match(/^[-*] (.+)/)
    if (ul) {
      blockquoteBuffer.length > 0 && flushBlockquote()
      if (listBuffer.length > 0 && listBuffer[0].type === 'ol') flushList()
      listBuffer.push({ type: 'ul', content: inlineFormat(ul[1]), checked: null })
      i++; continue
    }

    // Ordered list
    const ol = line.match(/^\d+\. (.+)/)
    if (ol) {
      blockquoteBuffer.length > 0 && flushBlockquote()
      if (listBuffer.length > 0 && listBuffer[0].type === 'ul') flushList()
      listBuffer.push({ type: 'ol', content: inlineFormat(ol[1]), checked: null })
      i++; continue
    }

    // Default paragraph
    flushList()
    nodes.push(
      <p key={i} className="text-sm leading-7 text-foreground/90">{inlineFormat(line)}</p>
    )
    i++
  }

  flushTable(); flushBlockquote(); flushList()
  return <>{nodes}</>
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} className="rounded bg-muted px-1.5 py-0.5 text-[0.8em] font-mono text-orange-600 dark:text-orange-400 border border-orange-200/40">
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

// A gabarito blockquote starts with an answer-key label. We must strip the
// WHOLE blockquote (all contiguous `>` lines) — not just the label line —
// because answers often embed fenced code (`> ```java ... > ```). Those fences
// would otherwise be extracted by the top-level code splitter and rendered as
// visible CodeBlocks that ignore `showGabarito`.
const GABARITO_BLOCKQUOTE = /^\s*>\s*\*\*(Gabarito|Resposta|Respostas|Solução|Resolução)/i

function stripHiddenGabaritos(content: string): string {
  const lines = content.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (GABARITO_BLOCKQUOTE.test(lines[i])) {
      // Consume the entire blockquote (including any embedded code fences).
      while (i < lines.length && /^\s*>/.test(lines[i])) i++
      // Leave a marker the parser renders as the "locked" placeholder.
      out.push('> **Gabarito:** oculto')
      continue
    }
    out.push(lines[i])
    i++
  }
  return out.join('\n')
}

export function ContentRenderer({ content, showGabarito = true }: ContentRendererProps) {
  // When hidden, remove gabarito blocks at the source so neither their text nor
  // any embedded code can leak through the renderer.
  const source = showGabarito ? content : stripHiddenGabaritos(content)
  return (
    <article className="max-w-none space-y-0">
      {parseMermaidAndCode(source, showGabarito)}
    </article>
  )
}
