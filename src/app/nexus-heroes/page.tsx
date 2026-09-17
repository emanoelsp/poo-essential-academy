'use client'

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import dynamic from 'next/dynamic'
import type {
  CellType,
  HeroClass,
  HeroState,
  EnemyState,
  LogEntry,
  LogType,
  GamePhase,
  Grid,
} from './types'

const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false })

// ─── Base maze (15x15) ─────────────────────────────────────────────────────────

const BASE_MAZE: string[] = [
  'WWWWWWWWWWWWWWW',
  'W___W___W__M_PW',
  'W_W_W_W_W_WWW_W',
  'W_W___W___W___W',
  'W_WWW_WWWWW_WWW',
  'W___W_____W_W_W',
  'WWW_WWWW_WW_W_W',
  'W_____W_____W_W',
  'W_WWWWWWW_WWW_W',
  'W_W_____W_W___W',
  'W_W_WWW_W_W_WWW',
  'W___W_____W_W_W',
  'WWW_W_WWWWW_W_W',
  'WC___W_E_____TW',
  'WWWWWWWWWWWWWWW',
]

// Extra scattered elements (row, col, type). Only placed on '_' cells.
const EXTRAS: Array<{ row: number; col: number; type: CellType }> = [
  { row: 3, col: 3, type: 'M' },
  { row: 9, col: 12, type: 'M' },
  { row: 11, col: 5, type: 'M' },
  { row: 5, col: 1, type: 'H' },
  { row: 7, col: 10, type: 'H' },
  { row: 1, col: 5, type: 'T' },
  { row: 9, col: 3, type: 'T' },
  { row: 3, col: 11, type: 'E' },
  { row: 11, col: 9, type: 'E' },
]

const HERO_START = { row: 13, col: 1 }

// ─── Stat presets ──────────────────────────────────────────────────────────────

interface HeroPreset {
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  atk: number
  matk: number
}

const PRESETS: Record<HeroClass, HeroPreset> = {
  guerreiro: { hp: 120, maxHp: 120, mana: 40, maxMana: 40, atk: 25, matk: 10 },
  mago: { hp: 80, maxHp: 80, mana: 120, maxMana: 120, atk: 15, matk: 40 },
}

const ENEMY_HP = 30
const ENEMY_ATK = 12
const MAGIC_COST = 20

// ─── Grid builder ────────────────────────────────────────────────────────────

function buildGrid(): { grid: Grid; enemies: EnemyState[] } {
  const grid: Grid = BASE_MAZE.map((row) => row.split('') as CellType[])
  for (const ex of EXTRAS) {
    if (grid[ex.row] && grid[ex.row][ex.col] === '_') {
      grid[ex.row][ex.col] = ex.type
    }
  }
  // The hero spawns on the start cell; make sure nothing (e.g. a chest)
  // sits underneath it so the spawn tile is plain floor.
  grid[HERO_START.row][HERO_START.col] = '_'
  const enemies: EnemyState[] = []
  let id = 0
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 'E') {
        enemies.push({
          id: id++,
          row: r,
          col: c,
          hp: ENEMY_HP,
          atk: ENEMY_ATK,
          alive: true,
        })
        grid[r][c] = '_'
      }
    }
  }
  return { grid, enemies }
}

// ─── Level thresholds ────────────────────────────────────────────────────────

function levelForXp(xp: number): number {
  if (xp >= 100) return 3
  if (xp >= 50) return 2
  return 1
}

// ─── Log badge styles ──────────────────────────────────────────────────────────

const LOG_META: Record<LogType, { label: string; badge: string; text: string }> = {
  instanciacao: {
    label: 'INSTANCIAÇÃO',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    text: 'text-cyan-100',
  },
  invariante: {
    label: 'INVARIANTE',
    badge: 'bg-green-500/20 text-green-300 border-green-500/40',
    text: 'text-green-100',
  },
  excecao: {
    label: 'EXCEÇÃO',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    text: 'text-red-100',
  },
  override: {
    label: 'OVERRIDE',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    text: 'text-purple-100',
  },
  info: {
    label: 'INFO',
    badge: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    text: 'text-zinc-100',
  },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NexusHeroesPage() {
  const [phase, setPhase] = useState<GamePhase>('select')
  const [selectedClass, setSelectedClass] = useState<HeroClass>('guerreiro')
  const [nameInput, setNameInput] = useState('')

  const initial = useMemo(() => buildGrid(), [])
  const [grid, setGrid] = useState<Grid>(initial.grid)
  const [enemies, setEnemies] = useState<EnemyState[]>(initial.enemies)
  const [hero, setHero] = useState<HeroState | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)

  // ─── Logging ─────────────────────────────────────────────────────────────

  const addLog = useCallback((type: LogType, message: string) => {
    setLogs((prev) => {
      const next = [...prev, { id: logIdRef.current++, type, message }]
      return next.slice(-80)
    })
  }, [])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  // ─── Adjacency helpers ─────────────────────────────────────────────────────

  const adjacentEnemies = useCallback(
    (h: HeroState): EnemyState[] =>
      enemies.filter(
        (e) => e.alive && Math.abs(e.row - h.row) + Math.abs(e.col - h.col) === 1
      ),
    [enemies]
  )

  const hasAdjacentEnemy = useMemo(
    () => (hero ? adjacentEnemies(hero).length > 0 : false),
    [hero, adjacentEnemies]
  )

  // ─── Start / reset ──────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const fresh = buildGrid()
    const preset = PRESETS[selectedClass]
    const name =
      nameInput.trim() || (selectedClass === 'guerreiro' ? 'Guerreiro' : 'Mago')
    const newHero: HeroState = {
      name,
      class: selectedClass,
      ...preset,
      level: 1,
      xp: 0,
      coins: 0,
      passos: 0,
      row: HERO_START.row,
      col: HERO_START.col,
    }
    setGrid(fresh.grid)
    setEnemies(fresh.enemies)
    setHero(newHero)
    logIdRef.current = 0
    setLogs([
      {
        id: logIdRef.current++,
        type: 'instanciacao',
        message: `new ${
          selectedClass === 'guerreiro' ? 'Guerreiro' : 'Mago'
        }("${name}") instanciado. Objeto Personagem criado na memória.`,
      },
      {
        id: logIdRef.current++,
        type: 'info',
        message:
          'Nexus Heroes iniciado. Alcance o portal ciano coletando Hero Coins.',
      },
    ])
    setPhase('playing')
  }, [selectedClass, nameInput])

  const resetToSelect = useCallback(() => {
    setPhase('select')
    setHero(null)
    setNameInput('')
  }, [])

  // ─── XP + level up ─────────────────────────────────────────────────────────

  const applyXp = useCallback(
    (h: HeroState, gained: number): HeroState => {
      const newXp = h.xp + gained
      const newLevel = levelForXp(newXp)
      let next: HeroState = { ...h, xp: newXp }
      if (newLevel > h.level) {
        const levelsGained = newLevel - h.level
        const maxHp = h.maxHp + 15 * levelsGained
        const maxMana = h.maxMana + 10 * levelsGained
        const atk = h.atk + 5 * levelsGained
        const matk = h.matk + 8 * levelsGained
        next = {
          ...next,
          level: newLevel,
          maxHp,
          maxMana,
          atk,
          matk,
          hp: maxHp,
          mana: maxMana,
        }
        addLog(
          'invariante',
          `subirNivel() chamado. HP e Mana restaurados ao novo máximo. ATK aumentado. Nível ${newLevel}.`
        )
      }
      return next
    },
    [addLog]
  )

  const clearCell = useCallback((row: number, col: number) => {
    setGrid((g) => {
      const ng = g.map((r) => [...r])
      ng[row][col] = '_'
      return ng
    })
  }, [])

  // ─── Collect on landing ─────────────────────────────────────────────────────

  const collectCell = useCallback(
    (h: HeroState, row: number, col: number): HeroState => {
      const cell = grid[row][col]
      let next: HeroState = { ...h, row, col }

      switch (cell) {
        case 'C': {
          next = applyXp(next, 20)
          next = { ...next, coins: next.coins + 5 }
          addLog(
            'instanciacao',
            `new Item("HeroCoin", 5) instanciado. Adicionado ao inventário de ${h.name}.`
          )
          clearCell(row, col)
          break
        }
        case 'M': {
          const capped = Math.min(next.mana + 25, next.maxMana)
          addLog(
            'invariante',
            `setMana(${next.mana + 25}) chamado. Math.min(mana+25, ${next.maxMana}).`
          )
          next = { ...next, mana: capped }
          clearCell(row, col)
          break
        }
        case 'H': {
          const capped = Math.min(next.hp + 20, next.maxHp)
          addLog(
            'invariante',
            `setVida(${next.hp + 20}) chamado. Math.min(hp+20, ${next.maxHp}).`
          )
          next = { ...next, hp: capped }
          clearCell(row, col)
          break
        }
        case 'T': {
          const newHp = Math.max(next.hp - 20, 0)
          addLog(
            'excecao',
            `TrapDamageException lançada! setVida(${next.hp - 20}) → Math.max(hp-20, 0). HP: ${newHp}.`
          )
          next = { ...next, hp: newHp }
          clearCell(row, col)
          if (newHp <= 0) setTimeout(() => setPhase('defeat'), 0)
          break
        }
        case 'P': {
          addLog(
            'info',
            `Portal alcançado! Nexus Heroes completo. Passos: ${next.passos}. Coins: ${next.coins}. Nível: ${next.level}.`
          )
          setTimeout(() => setPhase('victory'), 0)
          break
        }
        default:
          break
      }
      return next
    },
    [grid, applyXp, addLog, clearCell]
  )

  // ─── Movement ──────────────────────────────────────────────────────────────

  const move = useCallback(
    (dRow: number, dCol: number) => {
      if (phase !== 'playing') return
      setHero((h) => {
        if (!h) return h
        const nRow = h.row + dRow
        const nCol = h.col + dCol
        if (
          nRow < 0 ||
          nRow >= grid.length ||
          nCol < 0 ||
          nCol >= grid[0].length
        ) {
          return h
        }
        if (grid[nRow][nCol] === 'W') return h
        if (enemies.some((e) => e.alive && e.row === nRow && e.col === nCol)) {
          addLog(
            'info',
            'Caminho bloqueado por um inimigo. Ataque-o antes de avançar.'
          )
          return h
        }
        const moved = { ...h, passos: h.passos + 1 }
        return collectCell(moved, nRow, nCol)
      })
    },
    [phase, grid, enemies, collectCell, addLog]
  )

  // ─── Combat: sword ─────────────────────────────────────────────────────────

  const attackWithSword = useCallback(() => {
    if (phase !== 'playing') return
    setHero((h) => {
      if (!h) return h
      const targets = adjacentEnemies(h)
      if (targets.length === 0) return h
      const target = targets[0]
      const dmg = h.atk
      const remaining = target.hp - dmg
      addLog(
        'override',
        `@Override ${h.name}.atacarComEspada(inimigo) → dano ${dmg}. Inimigo HP: ${remaining}.`
      )

      let next: HeroState = { ...h }

      if (remaining <= 0) {
        setEnemies((es) =>
          es.map((e) =>
            e.id === target.id ? { ...e, hp: 0, alive: false } : e
          )
        )
        next = applyXp(next, 15)
        next = { ...next, coins: next.coins + 10 }
        addLog(
          'instanciacao',
          `new Item("HeroCoin", 10) instanciado. Inimigo derrotado por ${h.name}.`
        )
      } else {
        setEnemies((es) =>
          es.map((e) => (e.id === target.id ? { ...e, hp: remaining } : e))
        )
        const newHp = Math.max(next.hp - ENEMY_ATK, 0)
        addLog(
          'excecao',
          `AtaqueRecebidoException! HP reduzido em ${ENEMY_ATK}. setVida() validou: hp >= 0.`
        )
        next = { ...next, hp: newHp }
        if (newHp <= 0) setTimeout(() => setPhase('defeat'), 0)
      }
      return next
    })
  }, [phase, adjacentEnemies, applyXp, addLog])

  // ─── Combat: magic ─────────────────────────────────────────────────────────

  const useMagic = useCallback(() => {
    if (phase !== 'playing') return
    setHero((h) => {
      if (!h) return h
      if (h.mana < MAGIC_COST) {
        addLog(
          'excecao',
          `ManaInsuficienteException lançada! usarMagia() requer ${MAGIC_COST} de Mana. Atual: ${h.mana}.`
        )
        return h
      }
      const targets = adjacentEnemies(h)
      addLog(
        'override',
        `@Override ${h.name}.usarMagia() sobrescreve Personagem.usarMagia(). Dano mágico: ${h.matk}.`
      )
      addLog(
        'invariante',
        `setMana(${h.mana - MAGIC_COST}) chamado. Validação: mana >= 0.`
      )

      let next: HeroState = { ...h, mana: h.mana - MAGIC_COST }

      if (targets.length > 0) {
        const targetIds = new Set(targets.map((t) => t.id))
        let defeated = 0
        setEnemies((es) =>
          es.map((e) => {
            if (!targetIds.has(e.id)) return e
            const remaining = e.hp - next.matk
            if (remaining <= 0) {
              defeated++
              return { ...e, hp: 0, alive: false }
            }
            return { ...e, hp: remaining }
          })
        )
        if (defeated > 0) {
          next = applyXp(next, 15 * defeated)
          next = { ...next, coins: next.coins + 10 * defeated }
          addLog(
            'instanciacao',
            `${defeated} inimigo(s) derrotado(s). new Item("HeroCoin", ${10 * defeated}) instanciado.`
          )
        }
      } else {
        addLog(
          'info',
          'Magia conjurada, mas nenhum inimigo adjacente foi atingido.'
        )
      }
      return next
    })
  }, [phase, adjacentEnemies, applyXp, addLog])

  // ─── Keyboard controls ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          move(-1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          move(1, 0)
          break
        case 'ArrowLeft':
          e.preventDefault()
          move(0, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          move(0, 1)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, move])

  // ─── Selection screen ──────────────────────────────────────────────────────

  if (phase === 'select') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <h1 className="mb-2 text-4xl font-black tracking-tight text-cyan-300">
          🗡️ Nexus Heroes
        </h1>
        <p className="mb-8 text-slate-400">
          Labirinto 3D isométrico · conceitos de POO no console
        </p>

        <div className="mb-6 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {(['guerreiro', 'mago'] as HeroClass[]).map((cls) => {
            const p = PRESETS[cls]
            const active = selectedClass === cls
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`rounded-2xl border p-5 text-left transition ${
                  active
                    ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/50'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
              >
                <div className="mb-2 text-2xl font-bold capitalize">
                  {cls === 'guerreiro' ? '⚔️ Guerreiro' : '🔮 Mago'}
                </div>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>HP: {p.maxHp}</li>
                  <li>Mana: {p.maxMana}</li>
                  <li>ATK (espada): {p.atk}</li>
                  <li>MATK (magia): {p.matk}</li>
                </ul>
              </button>
            )
          })}
        </div>

        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Nome do herói"
          maxLength={16}
          className="mb-4 w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center outline-none focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={startGame}
          className="rounded-xl bg-cyan-500 px-8 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          Iniciar Aventura
        </button>
      </div>
    )
  }

  // ─── Victory ──────────────────────────────────────────────────────────────

  if (phase === 'victory' && hero) {
    const efficiency =
      hero.passos > 0 ? (hero.coins / hero.passos).toFixed(2) : '∞'
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <h1 className="mb-4 text-5xl font-black text-cyan-300">🏆 Vitória!</h1>
        <p className="mb-6 text-slate-400">{hero.name} alcançou o Nexus.</p>
        <div className="mb-8 grid grid-cols-2 gap-4 text-center">
          <Stat label="🪙 Coins" value={hero.coins} />
          <Stat label="👣 Passos" value={hero.passos} />
          <Stat label="⭐ Nível" value={hero.level} />
          <Stat label="⚡ Eficiência" value={efficiency} />
        </div>
        <button
          type="button"
          onClick={resetToSelect}
          className="rounded-xl bg-cyan-500 px-8 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          Jogar Novamente
        </button>
      </div>
    )
  }

  // ─── Defeat ──────────────────────────────────────────────────────────────

  if (phase === 'defeat' && hero) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <h1 className="mb-4 text-5xl font-black text-red-500">💀 Derrota</h1>
        <p className="mb-2 max-w-md text-center text-slate-400">
          A escuridão do labirinto consumiu {hero.name}. O Nexus permanece
          inalcançado... por enquanto.
        </p>
        <p className="mb-8 text-sm text-slate-500">
          Passos: {hero.passos} · Coins: {hero.coins} · Nível: {hero.level}
        </p>
        <button
          type="button"
          onClick={resetToSelect}
          className="rounded-xl bg-red-500 px-8 py-3 font-bold text-slate-950 transition hover:bg-red-400"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  // ─── Playing ──────────────────────────────────────────────────────────────

  if (!hero) return null

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 lg:flex-row">
      {/* 3D canvas ~65% */}
      <div className="relative h-[55vh] w-full lg:h-full lg:w-[65%]">
        <GameCanvas
          grid={grid}
          heroClass={hero.class}
          heroRow={hero.row}
          heroCol={hero.col}
          enemies={enemies}
        />

        {/* Combat buttons overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-3 px-4">
          <button
            type="button"
            onClick={attackWithSword}
            disabled={!hasAdjacentEnemy}
            className={`pointer-events-auto rounded-xl px-5 py-3 font-bold shadow-lg transition ${
              hasAdjacentEnemy
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'cursor-not-allowed bg-amber-500/50 text-slate-950/60 opacity-50'
            }`}
          >
            🗡️ Atacar com Espada
          </button>
          <button
            type="button"
            onClick={useMagic}
            disabled={hero.mana < MAGIC_COST}
            className={`pointer-events-auto rounded-xl px-5 py-3 font-bold shadow-lg transition ${
              hero.mana >= MAGIC_COST
                ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                : 'cursor-not-allowed bg-indigo-500/50 text-white/60 opacity-50'
            }`}
          >
            ✨ Usar Magia ({MAGIC_COST} MP)
          </button>
        </div>
      </div>

      {/* Side panel ~35% */}
      <aside className="flex h-[45vh] w-full flex-col border-l border-slate-800 bg-slate-900 lg:h-full lg:w-[35%]">
        {/* HUD */}
        <div className="border-b border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span>{hero.class === 'guerreiro' ? '⚔️' : '🔮'}</span>
            <span className="truncate">{hero.name}</span>
            <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              Nível {hero.level}
            </span>
          </div>

          <Bar label="HP" value={hero.hp} max={hero.maxHp} color="bg-red-500" />
          <Bar label="MP" value={hero.mana} max={hero.maxMana} color="bg-blue-500" />
          <Bar
            label="XP"
            value={hero.xp % 50}
            max={50}
            color="bg-purple-500"
            display={`${hero.xp}`}
          />

          <div className="mt-3 flex justify-between text-sm">
            <span>
              🪙 Coins: <b className="text-amber-300">{hero.coins}</b>
            </span>
            <span>
              👣 Passos: <b className="text-slate-200">{hero.passos}</b>
            </span>
          </div>

          {/* D-pad */}
          <div className="mt-4 grid grid-cols-3 place-items-center gap-1.5">
            <span />
            <DpadBtn onClick={() => move(-1, 0)}>↑</DpadBtn>
            <span />
            <DpadBtn onClick={() => move(0, -1)}>←</DpadBtn>
            <DpadBtn onClick={() => move(1, 0)}>↓</DpadBtn>
            <DpadBtn onClick={() => move(0, 1)}>→</DpadBtn>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Use as setas do teclado ou o D-pad
          </p>
        </div>

        {/* System Console */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 bg-zinc-950 px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs font-semibold text-zinc-400">
              System Console — POO
            </span>
          </div>
          <div
            ref={consoleRef}
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-zinc-950 p-3 font-mono text-[11px] leading-snug"
          >
            {logs.map((log) => {
              const meta = LOG_META[log.type]
              return (
                <div key={log.id} className="flex flex-col gap-0.5">
                  <span
                    className={`inline-block w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                  <span className={`${meta.text} break-words`}>
                    &gt; {log.message}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-cyan-300">{value}</div>
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  color,
  display,
}: {
  label: string
  value: number
  max: number
  color: string
  display?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span className="font-semibold">{label}</span>
        <span>{display ?? `${Math.round(value)} / ${max}`}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DpadBtn({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-lg font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
    >
      {children}
    </button>
  )
}
