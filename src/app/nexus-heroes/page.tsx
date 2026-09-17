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
  DmgEvent,
} from './types'

const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false })

// ─── Base maze (19x19) ─────────────────────────────────────────────────────────

const BASE_MAZE: string[] = [
  'WWWWWWWWWWWWWWWWWWW', // 0
  'W_____W_____W___MPW', // 1  M@16  P@17
  'W_WWW_W_WWW_W_WWW_W', // 2
  'W_W___W_W___W_W___W', // 3
  'W_W_WWW_W_WWW_W_WWW', // 4
  'W___W___W_W___W___W', // 5
  'WWW_W_WWW_W_WWWWW_W', // 6
  'W___W___W___W_____W', // 7
  'W_WWWWW_WWWWW_WWW_W', // 8
  'W_W_____W_____W___W', // 9
  'W_W_WWW_W_W_W_W_W_W', // 10
  'W___W___W_W___W_W_W', // 11
  'WWWWW_WWW_W_WWWWW_W', // 12
  'W_____W___W___W___W', // 13
  'W_WWWWW_WWWWW_W_WWW', // 14
  'W_W_____W_____W___W', // 15
  'W_W_WWW_W_WWWWWWW_W', // 16
  'W______W_________TW', // 17  T@17
  'WWWWWWWWWWWWWWWWWWW', // 18
]

// Fixed items (no enemies — enemies placed randomly per run)
const ITEMS: Array<{ row: number; col: number; type: CellType }> = [
  { row: 3,  col: 3,  type: 'M' },
  { row: 9,  col: 11, type: 'M' },
  { row: 11, col: 11, type: 'M' },
  { row: 5,  col: 15, type: 'M' },
  { row: 5,  col: 1,  type: 'H' },
  { row: 7,  col: 10, type: 'H' },
  { row: 15, col: 13, type: 'H' },
  { row: 13, col: 8,  type: 'C' },
  { row: 7,  col: 16, type: 'C' },
  { row: 1,  col: 5,  type: 'T' },
  { row: 9,  col: 3,  type: 'T' },
  { row: 15, col: 5,  type: 'T' },
]

// Candidate pools for random enemy placement — verified on '_' cells
const GOBLIN_POOL: Array<[number, number]> = [
  [3,3],[5,11],[7,13],[9,5],[11,3],[13,9],[7,3],[11,11],
  [3,15],[5,7],[9,15],[13,3],[15,3],[15,15],[7,1],[11,15],
]
const GOLEM_POOL: Array<[number, number]> = [
  [3,11],[5,15],[9,15],[11,17],[13,15],[7,16],[1,11],[3,15],
]

const HERO_START = { row: 17, col: 1 }

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

const GOBLIN_HP  = 45
const GOBLIN_ATK = 8
const GOLEM_HP   = 95
const GOLEM_ATK  = 18
const MAGIC_COST = 20

// ─── Grid builder ────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildGrid(): { grid: Grid; enemies: EnemyState[] } {
  const grid: Grid = BASE_MAZE.map((row) => row.split('') as CellType[])

  // Place fixed items
  for (const it of ITEMS) {
    if (grid[it.row]?.[it.col] === '_') grid[it.row][it.col] = it.type
  }

  grid[HERO_START.row][HERO_START.col] = '_'

  // Place enemies randomly — pick 5 goblins and 2 golems each run
  const enemies: EnemyState[] = []
  let id = 0

  const occupied = new Set<string>()
  const place = (pool: Array<[number, number]>, count: number, tier: 1 | 2) => {
    let placed = 0
    for (const [r, c] of shuffle(pool)) {
      if (placed >= count) break
      const key = `${r},${c}`
      if (occupied.has(key)) continue
      if (grid[r]?.[c] !== '_') continue
      // Keep enemies away from hero start
      if (Math.abs(r - HERO_START.row) + Math.abs(c - HERO_START.col) < 4) continue
      occupied.add(key)
      enemies.push({
        id: id++,
        row: r, col: c,
        hp: tier === 1 ? GOBLIN_HP : GOLEM_HP,
        maxHp: tier === 1 ? GOBLIN_HP : GOLEM_HP,
        atk: tier === 1 ? GOBLIN_ATK : GOLEM_ATK,
        alive: true,
        tier,
      })
      placed++
    }
  }

  place(GOBLIN_POOL, 5, 1)
  place(GOLEM_POOL, 2, 2)

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

  const [heroHitAt, setHeroHitAt] = useState(0)
  const [dmgEvents, setDmgEvents] = useState<DmgEvent[]>([])
  const dmgIdRef = useRef(0)

  const addDmg = useCallback((amount: number, positive: boolean, row: number, col: number) => {
    setDmgEvents((prev) => [
      ...prev,
      { id: dmgIdRef.current++, amount, positive, row, col },
    ])
  }, [])

  const removeDmg = useCallback((id: number) => {
    setDmgEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

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
          const gained = Math.min(next.mana + 25, next.maxMana) - next.mana
          const capped = next.mana + gained
          addLog('invariante', `setMana(${next.mana + 25}) chamado. Math.min(mana+25, ${next.maxMana}).`)
          setTimeout(() => addDmg(gained, true, row, col), 0)
          next = { ...next, mana: capped }
          clearCell(row, col)
          break
        }
        case 'H': {
          const healed = Math.min(next.hp + 20, next.maxHp) - next.hp
          const capped = next.hp + healed
          addLog('invariante', `setVida(${next.hp + 20}) chamado. Math.min(hp+20, ${next.maxHp}).`)
          setTimeout(() => addDmg(healed, true, row, col), 0)
          next = { ...next, hp: capped }
          clearCell(row, col)
          break
        }
        case 'T': {
          const newHp = Math.max(next.hp - 20, 0)
          addLog('excecao', `TrapDamageException lançada! setVida(${next.hp - 20}) → Math.max(hp-20, 0). HP: ${newHp}.`)
          setTimeout(() => { setHeroHitAt(Date.now()); addDmg(20, false, row, col) }, 0)
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
    [grid, applyXp, addLog, clearCell, addDmg]
  )

  // ─── Movement ──────────────────────────────────────────────────────────────

  const move = useCallback(
    (dRow: number, dCol: number) => {
      if (phase !== 'playing') return
      setHero((h) => {
        if (!h) return h
        const nRow = h.row + dRow
        const nCol = h.col + dCol
        if (nRow < 0 || nRow >= grid.length || nCol < 0 || nCol >= grid[0].length) return h
        if (grid[nRow][nCol] === 'W') return h
        if (enemies.some((e) => e.alive && e.row === nRow && e.col === nCol)) {
          addLog('info', 'Caminho bloqueado por um inimigo. Ataque-o antes de avançar.')
          return h
        }
        const moved = { ...h, passos: h.passos + 1 }
        let next = collectCell(moved, nRow, nCol)

        // Passive threat — adjacent enemies deal chip damage each step
        const adj = enemies.filter(
          (e) => e.alive && Math.abs(e.row - next.row) + Math.abs(e.col - next.col) === 1
        )
        for (const e of adj) {
          const chip = Math.max(1, Math.floor(e.atk * 0.35))
          next = { ...next, hp: Math.max(next.hp - chip, 0) }
          const name = e.tier === 2 ? 'Golem' : 'Goblin'
          addLog('excecao', `AmeaçaPassiva! ${name} adjacente causou ${chip} de dano. setVida() validou: hp >= 0.`)
          setTimeout(() => { setHeroHitAt(Date.now()); addDmg(chip, false, next.row, next.col) }, 0)
        }
        if (next.hp <= 0) setTimeout(() => setPhase('defeat'), 0)
        return next
      })
    },
    [phase, grid, enemies, collectCell, addLog, addDmg]
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

      const enemyName  = target.tier === 2 ? 'Golem' : 'Goblin'
      const xpReward   = target.tier === 2 ? 30 : 15
      const coinReward = target.tier === 2 ? 20 : 10
      let next: HeroState = { ...h }

      setTimeout(() => addDmg(dmg, false, target.row, target.col), 0)

      if (remaining <= 0) {
        setEnemies((es) =>
          es.map((e) => e.id === target.id ? { ...e, hp: 0, alive: false } : e)
        )
        next = applyXp(next, xpReward)
        next = { ...next, coins: next.coins + coinReward }
        addLog('instanciacao', `${enemyName} derrotado! new Item("HeroCoin", ${coinReward}) instanciado.`)
      } else {
        setEnemies((es) =>
          es.map((e) => e.id === target.id ? { ...e, hp: remaining } : e)
        )
        const counterDmg = target.atk
        const newHp = Math.max(next.hp - counterDmg, 0)
        addLog('excecao', `AtaqueRecebidoException! ${enemyName} contra-atacou. −${counterDmg} HP. setVida() validou: hp >= 0.`)
        setTimeout(() => { setHeroHitAt(Date.now()); addDmg(counterDmg, false, h.row, h.col) }, 0)
        next = { ...next, hp: newHp }
        if (newHp <= 0) setTimeout(() => setPhase('defeat'), 0)
      }
      return next
    })
  }, [phase, adjacentEnemies, applyXp, addLog, addDmg])

  // ─── Combat: magic ─────────────────────────────────────────────────────────

  const castMagic = useCallback(() => {
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
        targets.forEach((t) => setTimeout(() => addDmg(next.matk, false, t.row, t.col), 0))
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
          const totalXp    = targets.filter(t => t.hp - next.matk <= 0).reduce((s,t) => s + (t.tier===2?30:15), 0)
          const totalCoins = targets.filter(t => t.hp - next.matk <= 0).reduce((s,t) => s + (t.tier===2?20:10), 0)
          next = applyXp(next, totalXp || 15 * defeated)
          next = { ...next, coins: next.coins + (totalCoins || 10 * defeated) }
          addLog('instanciacao', `${defeated} inimigo(s) derrotado(s). new Item("HeroCoin") instanciado.`)
        }
      } else {
        addLog('info', 'Magia conjurada, mas nenhum inimigo adjacente foi atingido.')
      }
      return next
    })
  }, [phase, adjacentEnemies, applyXp, addLog, addDmg])

  // ─── Attack dispatcher (class-specific) ────────────────────────────────────

  const handleAttack = useCallback(() => {
    if (!hero) return
    if (hero.class === 'guerreiro') attackWithSword()
    else castMagic()
  }, [hero, attackWithSword, castMagic])

  // ─── Keyboard controls (throttled for smooth feel) ─────────────────────────

  const moveThrottleRef = useRef(0)

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      const isArrow = e.key.startsWith('Arrow')
      if (isArrow) {
        const now = performance.now()
        if (now - moveThrottleRef.current < 140) return
        moveThrottleRef.current = now
      }
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); move(-1, 0); break
        case 'ArrowDown':  e.preventDefault(); move(1, 0);  break
        case 'ArrowLeft':  e.preventDefault(); move(0, -1); break
        case 'ArrowRight': e.preventDefault(); move(0, 1);  break
        case ' ':          e.preventDefault(); handleAttack(); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, move, handleAttack])

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
                  <li>HP: {p.maxHp} <span className="text-xs text-slate-500">(max)</span></li>
                  <li>Mana: {p.maxMana} <span className="text-xs text-slate-500">(max)</span></li>
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
          className="mb-6 w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center outline-none focus:border-cyan-400"
        />

        {/* Legend table */}
        <div className="mb-6 w-full max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70">
          <p className="border-b border-slate-700 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Legenda do mapa
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-1.5 text-left">Símbolo</th>
                <th className="py-1.5 text-left">Elemento</th>
                <th className="py-1.5 pr-4 text-left">Efeito</th>
                <th className="py-1.5 pr-4 text-left">Conceito POO</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['💎', 'Cristal de Mana', '+25 Mana', 'setMana() · invariante'],
                ['🍀', 'Orbe de Vida',    '+20 HP',   'setVida() · invariante'],
                ['👾', 'Inimigo',          'Combate',  '@Override calcularDano()'],
                ['⚠️', 'Armadilha',        '−20 HP',   'TrapDamageException'],
                ['📦', 'Baú',              '+XP +Coins','new Item("HeroCoin")'],
                ['🌀', 'Portal',           '🏆 Vitória','Objetivo final'],
              ] as [string, string, string, string][]).map(([icon, name, effect, concept]) => (
                <tr key={name} className="border-t border-slate-800 text-slate-300">
                  <td className="px-4 py-2 text-lg">{icon}</td>
                  <td className="py-2 font-medium">{name}</td>
                  <td className="py-2 pr-4 text-slate-400">{effect}</td>
                  <td className="py-2 pr-4 font-mono text-[11px] text-slate-500">{concept}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-700 px-4 py-2 text-[11px] text-slate-500">
            {selectedClass === 'guerreiro'
              ? '⚔️ Guerreiro ataca com espada · pressione Espaço em combate'
              : '🔮 Mago ataca com magia · pressione Espaço em combate'}
          </p>
        </div>

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
      {/* 3D canvas ~72% */}
      <div className="relative h-[60vh] w-full lg:h-full lg:w-[72%]">
        <GameCanvas
          grid={grid}
          heroClass={hero.class}
          heroRow={hero.row}
          heroCol={hero.col}
          enemies={enemies}
          heroHitAt={heroHitAt}
          dmgEvents={dmgEvents}
          onDmgEventDone={removeDmg}
        />

        {/* Combat button overlay — single button, class-specific */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          {hero.class === 'guerreiro' ? (
            <button
              type="button"
              onClick={attackWithSword}
              disabled={!hasAdjacentEnemy}
              className={`pointer-events-auto rounded-xl px-6 py-3 font-bold shadow-lg transition ${
                hasAdjacentEnemy
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'cursor-not-allowed bg-amber-500/40 text-slate-950/50 opacity-50'
              }`}
            >
              🗡️ Atacar com Espada
              <span className="ml-2 rounded bg-slate-950/20 px-1.5 py-0.5 text-xs font-normal opacity-70">
                Espaço
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={castMagic}
              disabled={hero.mana < MAGIC_COST}
              className={`pointer-events-auto rounded-xl px-6 py-3 font-bold shadow-lg transition ${
                hero.mana >= MAGIC_COST
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'cursor-not-allowed bg-indigo-500/40 text-white/50 opacity-50'
              }`}
            >
              ✨ Usar Magia
              <span className="ml-1 text-xs font-normal opacity-70">({MAGIC_COST} MP)</span>
              <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs font-normal opacity-70">
                Espaço
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Side panel ~28% */}
      <aside className="flex h-[40vh] w-full flex-col border-l border-slate-800 bg-slate-900 lg:h-full lg:w-[28%]">
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
            Setas / D-pad para mover · Espaço para atacar
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
