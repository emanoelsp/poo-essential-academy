'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { blockHash, usePersistedState } from '@/hooks/usePersistedState'

// ── Types ─────────────────────────────────────────────────────────────────────

type RelationType = 'association' | 'aggregation' | 'composition'

interface Relationship {
  from: string
  to: string
  type: RelationType
  label?: string
}

interface RelationshipUMLProps {
  classes: string[]
  relationships: Relationship[]
  blockKey: string
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const REL_META: Record<RelationType, { name: string; hint: string }> = {
  association: {
    name: 'Associação',
    hint: 'Uma classe usa ou referencia a outra; os objetos existem de forma independente.',
  },
  aggregation: {
    name: 'Agregação',
    hint: 'Relação todo-parte fraca: as partes podem existir sem o todo (◇).',
  },
  composition: {
    name: 'Composição',
    hint: 'Relação todo-parte forte: as partes não existem sem o todo (◆).',
  },
}

// ── UML Symbol SVG ────────────────────────────────────────────────────────────

function RelSymbol({ type }: { type: RelationType }) {
  const W = 88, H = 22, y = 11
  const dw = 11, dh = 5
  const dEnd = 4 + dw * 2

  const arrowHead = (
    <polyline
      points={`${W - 14},${y - 5} ${W - 5},${y} ${W - 14},${y + 5}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  )

  if (type === 'association') {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="inline-block align-middle">
        <line x1="2" y1={y} x2={W - 5} y2={y} stroke="currentColor" strokeWidth="1.5" />
        {arrowHead}
      </svg>
    )
  }

  const diamond = (filled: boolean) => (
    <polygon
      points={`4,${y} ${4 + dw},${y - dh} ${dEnd},${y} ${4 + dw},${y + dh}`}
      fill={filled ? 'currentColor' : 'white'}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  )

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="inline-block align-middle">
      {diamond(type === 'composition')}
      <line x1={dEnd} y1={y} x2={W - 5} y2={y} stroke="currentColor" strokeWidth="1.5" />
      {arrowHead}
    </svg>
  )
}

// ── Single Relationship Challenge ─────────────────────────────────────────────

function RelChallenge({ rel, index, relKey }: { rel: Relationship; index: number; relKey: string }) {
  const [selected, setSelected] = usePersistedState<RelationType | null>(`${relKey}:sel`, null)
  const [typeLocked, setTypeLocked] = usePersistedState<boolean>(`${relKey}:locked`, false)
  const [labelValue, setLabelValue] = usePersistedState<string>(`${relKey}:lv`, '')
  const [labelStatus, setLabelStatus] = usePersistedState<'idle' | 'correct' | 'wrong'>(`${relKey}:ls`, 'idle')

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const needsLabel = !!rel.label
  const labelDone = !needsLabel || labelStatus === 'correct'
  const done = typeLocked && labelDone

  const handleType = (t: RelationType) => {
    if (typeLocked) return
    setSelected(t)
    if (t === rel.type) setTypeLocked(true)
  }

  const handleLabelChange = (v: string) => {
    setLabelValue(v)
    if (labelStatus !== 'correct') setLabelStatus('idle')
  }

  const handleLabelBlur = () => {
    if (!labelValue.trim() || labelStatus === 'correct') return
    setLabelStatus(normalize(labelValue) === normalize(rel.label ?? '') ? 'correct' : 'wrong')
  }

  const btnVariant = (t: RelationType) => {
    if (typeLocked && t === rel.type) return 'correct'
    if (!typeLocked && selected === t) return 'wrong'
    return 'idle'
  }

  const btnClass = (t: RelationType) => {
    const base =
      'flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer select-none min-w-[108px]'
    const v = btnVariant(t)
    if (v === 'correct') return `${base} border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300`
    if (v === 'wrong') return `${base} border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300`
    return `${base} border-muted bg-background hover:border-primary/40 hover:bg-muted/30 dark:bg-muted/5`
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-colors ${
        done
          ? 'border-green-300 dark:border-green-800 bg-green-50/40 dark:bg-green-950/10'
          : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Relação {index + 1}
        </span>
        {done && <CheckCircle2 size={13} className="text-green-500" />}
      </div>

      {/* Question */}
      <p className="text-sm mb-3 leading-6">
        Qual é a relação entre{' '}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-foreground">
          {rel.from}
        </code>{' '}
        e{' '}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-foreground">
          {rel.to}
        </code>
        ?
      </p>

      {/* Type buttons — always visible so student can see the answer after locking */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(['association', 'aggregation', 'composition'] as RelationType[]).map((t) => (
          <button key={t} onClick={() => handleType(t)} className={btnClass(t)}>
            <RelSymbol type={t} />
            <span className="flex items-center gap-1">
              {REL_META[t].name}
              {btnVariant(t) === 'correct' && <CheckCircle2 size={10} />}
              {btnVariant(t) === 'wrong' && <XCircle size={10} />}
            </span>
          </button>
        ))}
      </div>

      {/* Wrong type feedback */}
      {!typeLocked && selected && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
          <XCircle size={11} />
          Não é {REL_META[selected].name}. Tente outro tipo!
        </p>
      )}

      {/* Label step */}
      {typeLocked && needsLabel && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground shrink-0">Nome da relação:</span>
          {labelStatus === 'correct' ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-mono font-medium">
              {labelValue}
              <CheckCircle2 size={11} />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <input
                type="text"
                value={labelValue}
                onChange={(e) => handleLabelChange(e.target.value)}
                onBlur={handleLabelBlur}
                placeholder="ex: gerencia"
                className={`rounded border px-2 py-0.5 text-xs font-mono w-36 outline-none focus:ring-1 transition-colors ${
                  labelStatus === 'wrong'
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-300'
                    : 'border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 focus:ring-primary/50'
                }`}
              />
              {labelStatus === 'wrong' && <XCircle size={11} className="text-red-500 shrink-0" />}
            </span>
          )}
        </div>
      )}

      {/* Completion hint */}
      {done && (
        <p className="text-xs text-green-700 dark:text-green-400 mt-2 italic">
          {REL_META[rel.type].hint}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RelationshipUML({ classes, relationships, blockKey }: RelationshipUMLProps) {
  return (
    <div className="my-6 space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 text-xs text-violet-800 dark:text-violet-300">
        <span className="shrink-0 text-base">🔗</span>
        <span>
          As classes abaixo estão <strong>desconectadas</strong>. Para cada par, escolha o tipo de relação
          correto e escreva seu nome. Você pode tentar quantas vezes quiser até acertar.
        </span>
      </div>

      {/* Class boxes — name only, no attributes/methods */}
      <div className="flex flex-wrap gap-3 p-4 rounded-lg border-2 border-dashed border-muted bg-muted/10">
        {classes.map((cls) => (
          <div
            key={cls}
            className="rounded-lg border-2 border-foreground/25 min-w-[110px] bg-background shadow-sm"
          >
            <div className="px-4 py-2.5 text-center font-bold text-sm font-mono">{cls}</div>
          </div>
        ))}
      </div>

      {/* Challenges */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identifique as Relações
        </p>
        {relationships.map((rel, i) => (
          <RelChallenge
            key={i}
            rel={rel}
            index={i}
            relKey={`${blockKey}:${rel.from}-${rel.to}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Format:
//   CLASS:ClassName
//   REL:From->To:type:label     (label optional)
//   type = association | aggregation | composition
export function parseRelationshipUML(source: string): React.ReactNode {
  const classes: string[] = []
  const relationships: Relationship[] = []

  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('CLASS:')) {
      classes.push(line.slice(6).trim())
      continue
    }

    if (line.startsWith('REL:')) {
      const rest = line.slice(4)
      const colonIdx = rest.indexOf(':')
      if (colonIdx === -1) continue
      const arrow = rest.slice(0, colonIdx)
      const remainder = rest.slice(colonIdx + 1)
      const secondColon = remainder.indexOf(':')
      const type = (secondColon === -1 ? remainder : remainder.slice(0, secondColon)).trim()
      const label = secondColon === -1 ? undefined : remainder.slice(secondColon + 1).trim() || undefined
      const [from, to] = arrow.split('->').map((s) => s.trim())
      if (from && to && type) {
        relationships.push({ from, to, type: type as RelationType, label })
      }
    }
  }

  return (
    <RelationshipUML
      classes={classes}
      relationships={relationships}
      blockKey={blockHash(source)}
    />
  )
}
