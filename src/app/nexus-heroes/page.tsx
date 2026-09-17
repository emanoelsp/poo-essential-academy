'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type CellType = '_' | 'W' | 'C' | 'M' | 'H' | 'T' | 'E' | 'P' | 'S'
type HeroClass = 'guerreiro' | 'mago'
type LogType = 'instanciacao' | 'invariante' | 'excecao' | 'override' | 'info'
type GamePhase = 'select' | 'name' | 'playing' | 'victory' | 'defeat'

interface HeroState {
  name: string
  class: HeroClass
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  atk: number
  level: number
  xp: number
  row: number
  col: number
}

interface LogEntry {
  id: number
  type: LogType
  message: string
}

interface Cell {
  type: CellType
  collected: boolean
}

// ─── Map definition ─────────────────────────────────────────────────────────

const BASE_MAP: CellType[][] = [
  ['_', '_', '_', 'W', '_', '_', '_', 'P'],
  ['E', 'W', '_', 'W', '_', 'W', 'M', '_'],
  ['_', 'W', 'C', '_', '_', 'W', '_', 'H'],
  ['_', '_', '_', '_', 'W', '_', '_', '_'],
  ['W', '_', 'T', 'W', 'W', '_', 'W', '_'],
  ['_', 'M', '_', '_', '_', 'E', '_', '_'],
  ['_', '_', '_', '_', 'H', '_', '_', 'C'],
  ['S', '_', '_', 'W', '_', 'M', '_', '_'],
]

function buildInitialGrid(): Cell[][] {
  return BASE_MAP.map(row =>
    row.map(type => ({ type, collected: false }))
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CELL_ICONS: Record<CellType, string> = {
  '_': '',
  W: '🧱',
  C: '📦',
  M: '💎',
  H: '🍀',
  T: '⚠️',
  E: '👾',
  P: '🌀',
  S: '',
}

const HERO_ICONS: Record<HeroClass, string> = {
  guerreiro: '🗡️',
  mago: '🔮',
}

const HERO_STATS: Record<HeroClass, { hp: number; mana: number; atk: number }> = {
  guerreiro: { hp: 120, mana: 40, atk: 25 },
  mago: { hp: 80, mana: 120, atk: 35 },
}

const LOG_BADGE_STYLE: Record<LogType, string> = {
  instanciacao: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700',
  invariante:   'bg-green-900/60 text-green-300 border border-green-700',
  excecao:      'bg-red-900/60 text-red-300 border border-red-700',
  override:     'bg-purple-900/60 text-purple-300 border border-purple-700',
  info:         'bg-slate-700/60 text-slate-300 border border-slate-600',
}

const LOG_TEXT_STYLE: Record<LogType, string> = {
  instanciacao: 'text-cyan-200',
  invariante:   'text-green-200',
  excecao:      'text-red-200',
  override:     'text-purple-200',
  info:         'text-slate-300',
}

const LOG_BADGE_LABEL: Record<LogType, string> = {
  instanciacao: 'INSTANCIAÇÃO',
  invariante:   'INVARIANTE',
  excecao:      'EXCEÇÃO',
  override:     'OVERRIDE',
  info:         'INFO',
}

// ─── Bar component ───────────────────────────────────────────────────────────

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono text-slate-300">{value}/{max}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Directional pad ─────────────────────────────────────────────────────────

function DPad({ onMove }: { onMove: (dr: number, dc: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 w-28">
      <div />
      <button
        onPointerDown={() => onMove(-1, 0)}
        className="aspect-square rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-slate-200 text-lg border border-slate-600 transition select-none"
        aria-label="Up"
      >▲</button>
      <div />
      <button
        onPointerDown={() => onMove(0, -1)}
        className="aspect-square rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-slate-200 text-lg border border-slate-600 transition select-none"
        aria-label="Left"
      >◀</button>
      <div className="aspect-square rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs">✦</div>
      <button
        onPointerDown={() => onMove(0, 1)}
        className="aspect-square rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-slate-200 text-lg border border-slate-600 transition select-none"
        aria-label="Right"
      >▶</button>
      <div />
      <button
        onPointerDown={() => onMove(1, 0)}
        className="aspect-square rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-slate-200 text-lg border border-slate-600 transition select-none"
        aria-label="Down"
      >▼</button>
      <div />
    </div>
  )
}

// ─── Main Game Component ─────────────────────────────────────────────────────

export default function NexusHeroesPage() {
  const [phase, setPhase] = useState<GamePhase>('select')
  const [pendingClass, setPendingClass] = useState<HeroClass | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [hero, setHero] = useState<HeroState | null>(null)
  const [grid, setGrid] = useState<Cell[][]>(buildInitialGrid())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((type: LogType, message: string) => {
    const id = ++logIdRef.current
    setLogs(prev => [...prev.slice(-49), { id, type, message }])
  }, [])

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  const startHero = useCallback((heroClass: HeroClass, name: string) => {
    const stats = HERO_STATS[heroClass]
    const resolvedName = name.trim() || (heroClass === 'guerreiro' ? 'Guerreiro' : 'Mago')
    const newHero: HeroState = {
      name: resolvedName,
      class: heroClass,
      hp: stats.hp,
      maxHp: stats.hp,
      mana: stats.mana,
      maxMana: stats.mana,
      atk: stats.atk,
      level: 1,
      xp: 0,
      row: 7,
      col: 0,
    }
    setHero(newHero)
    setGrid(buildInitialGrid())
    setLogs([])
    logIdRef.current = 0
    setPhase('playing')

    if (heroClass === 'guerreiro') {
      addLog('instanciacao', `new Guerreiro("${resolvedName}", 120, 40) executado. super("${resolvedName}", 120, 40) chamou Personagem(String, int, int).`)
    } else {
      addLog('instanciacao', `new Mago("${resolvedName}", 80, 120) executado. super("${resolvedName}", 80, 120) chamou Personagem(String, int, int).`)
    }
  }, [addLog])

  const handleNameSubmit = useCallback(() => {
    if (!pendingClass) return
    startHero(pendingClass, nameInput)
    setNameInput('')
    setPendingClass(null)
  }, [pendingClass, nameInput, startHero])

  const moveHero = useCallback((dr: number, dc: number) => {
    if (phase !== 'playing' || !hero) return

    const newRow = hero.row + dr
    const newCol = hero.col + dc

    if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) return

    const cell = grid[newRow][newCol]
    if (cell.type === 'W') return

    const updatedGrid = grid.map(row => row.map(c => ({ ...c })))
    let updatedHero = { ...hero, row: newRow, col: newCol }

    if (!cell.collected) {
      switch (cell.type) {
        case 'C':
          updatedGrid[newRow][newCol].collected = true
          updatedHero.xp += 20
          if (updatedHero.xp >= updatedHero.level * 50) {
            updatedHero.level += 1
            updatedHero.xp = 0
          }
          addLog('instanciacao', `new Item("EspadaRuna", 10) instanciado e adicionado ao inventário de ${updatedHero.name}. Objeto criado via new na heap.`)
          break

        case 'M': {
          updatedGrid[newRow][newCol].collected = true
          const prevMana = updatedHero.mana
          updatedHero.mana = Math.min(updatedHero.mana + 15, updatedHero.maxMana)
          addLog('invariante', `setMana(${prevMana + 15}) chamado. Validação: mana <= ${updatedHero.maxMana}. Valor ajustado para Math.min(mana+15, maxMana).`)
          break
        }

        case 'H': {
          updatedGrid[newRow][newCol].collected = true
          const prevHp = updatedHero.hp
          updatedHero.hp = Math.min(updatedHero.hp + 20, updatedHero.maxHp)
          addLog('invariante', `setVida(${prevHp + 20}) chamado. Validação: hp <= ${updatedHero.maxHp}. HP não pode exceder o máximo definido no construtor.`)
          break
        }

        case 'T': {
          updatedGrid[newRow][newCol].collected = true
          const prevHpTrap = updatedHero.hp
          updatedHero.hp = Math.max(updatedHero.hp - 15, 0)
          addLog('excecao', `TrapDamageException lançada! setVida(${prevHpTrap - 15}) → Math.max(hp-15, 0). HP atual: ${updatedHero.hp}.`)
          break
        }

        case 'E': {
          updatedGrid[newRow][newCol].collected = true
          updatedHero.xp += 30
          if (updatedHero.xp >= updatedHero.level * 50) {
            updatedHero.level += 1
            updatedHero.xp = 0
          }
          addLog('override', `${updatedHero.name}.calcularDano() sobrescreve Personagem.calcularDano(). Dano base: ${updatedHero.atk}.`)
          updatedHero.hp = Math.max(updatedHero.hp - 10, 0)
          addLog('excecao', `DanoRecebidoException! HP reduzido em 10. setVida() validou: hp >= 0.`)
          break
        }

        case 'P':
          addLog('info', `Fase 1 completa! Estado final — ${updatedHero.name}: HP ${updatedHero.hp}/${updatedHero.maxHp}, Mana ${updatedHero.mana}/${updatedHero.maxMana}, Nível ${updatedHero.level}.`)
          setHero(updatedHero)
          setGrid(updatedGrid)
          setPhase('victory')
          return

        default:
          break
      }
    }

    setGrid(updatedGrid)

    if (updatedHero.hp <= 0) {
      setHero(updatedHero)
      setPhase('defeat')
      return
    }

    setHero(updatedHero)
  }, [phase, hero, grid, addLog])

  // Keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'playing') return
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); moveHero(-1, 0); break
        case 'ArrowDown':  e.preventDefault(); moveHero(1, 0);  break
        case 'ArrowLeft':  e.preventDefault(); moveHero(0, -1); break
        case 'ArrowRight': e.preventDefault(); moveHero(0, 1);  break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, moveHero])

  const restartGame = () => {
    setPhase('select')
    setHero(null)
    setGrid(buildInitialGrid())
    setLogs([])
    setPendingClass(null)
    setNameInput('')
  }

  // ── Render: Hero selection ──────────────────────────────────────────────────

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/50 text-violet-300 text-xs font-semibold tracking-widest mb-4">
            NEXUS HEROES
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Escolha seu Herói</h1>
          <p className="text-slate-400 text-sm">Cada herói ensina conceitos POO de forma diferente</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Guerreiro card */}
          <button
            onClick={() => { setPendingClass('guerreiro'); setPhase('name') }}
            className="group relative rounded-2xl border border-slate-700 bg-slate-900 hover:border-amber-500/60 hover:bg-slate-800 transition-all duration-200 p-6 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-5xl mb-4">🗡️</div>
            <h2 className="text-xl font-bold text-white mb-1">Guerreiro</h2>
            <p className="text-slate-400 text-xs mb-4">Especialista em combate corpo-a-corpo</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">HP</span>
                <span className="text-green-400 font-mono">120</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mana</span>
                <span className="text-blue-400 font-mono">40</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ATK</span>
                <span className="text-amber-400 font-mono">25</span>
              </div>
            </div>
          </button>

          {/* Mago card */}
          <button
            onClick={() => { setPendingClass('mago'); setPhase('name') }}
            className="group relative rounded-2xl border border-slate-700 bg-slate-900 hover:border-violet-500/60 hover:bg-slate-800 transition-all duration-200 p-6 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-5xl mb-4">🔮</div>
            <h2 className="text-xl font-bold text-white mb-1">Mago</h2>
            <p className="text-slate-400 text-xs mb-4">Mestre das artes arcanas e magia</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">HP</span>
                <span className="text-green-400 font-mono">80</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mana</span>
                <span className="text-blue-400 font-mono">120</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ATK</span>
                <span className="text-amber-400 font-mono">35</span>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-slate-600 text-xs">Use as setas do teclado ou o D-Pad para mover seu herói</p>
      </div>
    )
  }

  // ── Render: Name input ──────────────────────────────────────────────────────

  if (phase === 'name' && pendingClass) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-6xl text-center mb-6">{HERO_ICONS[pendingClass]}</div>
          <h2 className="text-2xl font-black text-white text-center mb-1">
            {pendingClass === 'guerreiro' ? 'Guerreiro' : 'Mago'}
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">Como seu herói será chamado?</p>
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              placeholder={pendingClass === 'guerreiro' ? 'Guerreiro' : 'Mago'}
              maxLength={20}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setPhase('select'); setPendingClass(null); setNameInput('') }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleNameSubmit}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-500 transition"
              >
                Iniciar Jogo
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Victory ─────────────────────────────────────────────────────────

  if (phase === 'victory' && hero) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">🌀</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/40 border border-green-700/50 text-green-300 text-xs font-semibold tracking-widest mb-4">
          VITÓRIA
        </div>
        <h1 className="text-3xl font-black text-white mb-2">{hero.name} chegou ao Portal!</h1>
        <p className="text-slate-400 text-sm mb-6">Fase 1 completa. Todos os conceitos POO foram dominados.</p>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6 text-left w-full max-w-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Estado Final</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">HP</span><span className="text-green-400 font-mono">{hero.hp}/{hero.maxHp}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Mana</span><span className="text-blue-400 font-mono">{hero.mana}/{hero.maxMana}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Nível</span><span className="text-violet-400 font-mono">{hero.level}</span></div>
          </div>
        </div>
        <button
          onClick={restartGame}
          className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-bold text-white hover:bg-violet-500 transition"
        >
          Jogar Novamente
        </button>
      </div>
    )
  }

  // ── Render: Defeat ──────────────────────────────────────────────────────────

  if (phase === 'defeat' && hero) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">💀</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/40 border border-red-700/50 text-red-300 text-xs font-semibold tracking-widest mb-4">
          DERROTA
        </div>
        <h1 className="text-3xl font-black text-white mb-2">{hero.name} foi derrotado!</h1>
        <p className="text-slate-400 text-sm mb-8">HP chegou a zero. Uma nova exceção não tratada encerrou a execução.</p>
        <button
          onClick={restartGame}
          className="rounded-xl bg-red-700 px-8 py-3 text-sm font-bold text-white hover:bg-red-600 transition"
        >
          Jogar Novamente
        </button>
      </div>
    )
  }

  // ── Render: Main game ───────────────────────────────────────────────────────

  if (phase !== 'playing' || !hero) return null

  const xpPct = Math.min(100, (hero.xp / (hero.level * 50)) * 100)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Title bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{HERO_ICONS[hero.class]}</span>
          <span className="font-bold text-sm text-white">{hero.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-900/60 border border-violet-700 text-violet-300 text-xs font-bold">
            Nv {hero.level}
          </span>
          <span className="text-xs text-slate-500">Nexus Heroes</span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">

        {/* Arena + Console column */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Arena */}
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-8 gap-0.5 aspect-square max-w-lg mx-auto w-full">
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isHero = hero.row === r && hero.col === c
                  const isPortal = cell.type === 'P'
                  const isWall = cell.type === 'W'
                  const isEmpty = cell.type === '_' || cell.type === 'S' || cell.collected

                  let cellBg = 'bg-slate-900'
                  if (isWall) cellBg = 'bg-slate-800'
                  if (isPortal) cellBg = 'bg-slate-900'

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        relative aspect-square flex items-center justify-center rounded
                        border border-slate-800/60 text-base select-none
                        ${cellBg}
                        ${isHero ? 'ring-2 ring-violet-400 ring-offset-0 z-10' : ''}
                        ${!isWall && !isEmpty ? 'cursor-default' : ''}
                      `}
                    >
                      {isHero ? (
                        <span className="text-sm leading-none">{HERO_ICONS[hero.class]}</span>
                      ) : cell.collected ? (
                        <span className="text-slate-800 text-xs">·</span>
                      ) : (
                        <span className="text-sm leading-none">{CELL_ICONS[cell.type] || ''}</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* System Console */}
          <div className="flex-1 mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-xl border border-slate-700 bg-zinc-900 flex flex-col min-h-32 max-h-64 lg:max-h-none lg:flex-1">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-slate-500">system.console — POO Nexus v1.0</span>
            </div>
            <div
              ref={consoleRef}
              className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs"
            >
              {logs.length === 0 && (
                <div className="text-slate-600 italic">Aguardando eventos...</div>
              )}
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${LOG_BADGE_STYLE[log.type]}`}>
                    {LOG_BADGE_LABEL[log.type]}
                  </span>
                  <span className={`leading-relaxed ${LOG_TEXT_STYLE[log.type]}`}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HUD panel */}
        <aside className="w-full lg:w-56 xl:w-64 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-slate-700 p-4 flex flex-col gap-4">

          {/* Stats */}
          <div className="space-y-3">
            <StatBar
              label="HP"
              value={hero.hp}
              max={hero.maxHp}
              color={hero.hp / hero.maxHp > 0.5 ? 'bg-green-500' : hero.hp / hero.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'}
            />
            <StatBar
              label="Mana"
              value={hero.mana}
              max={hero.maxMana}
              color="bg-blue-500"
            />
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">XP</span>
                <span className="text-xs font-mono text-slate-300">{hero.xp}/{hero.level * 50}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-slate-700 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Legenda</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {([
                ['🧱', 'Parede'],
                ['📦', 'Baú'],
                ['💎', 'Mana'],
                ['🍀', 'Vida'],
                ['⚠️', 'Armadilha'],
                ['👾', 'Inimigo'],
                ['🌀', 'Portal'],
              ] as [string, string][]).map(([icon, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* D-Pad */}
          <div className="border-t border-slate-700 pt-3 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide self-start">Controles</p>
            <DPad onMove={moveHero} />
            <p className="text-[10px] text-slate-600 text-center">ou use as setas do teclado</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
