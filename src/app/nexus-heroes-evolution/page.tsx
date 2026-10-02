'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Phase = 'select' | 'playing' | 'victory' | 'defeat'
type HeroKind = 'guerreiro' | 'mago' | 'sentinela'
type EnemyKind = 'goblin' | 'golem' | 'sombra'
type CellKind = 'empty' | 'wall' | 'chest' | 'crystal' | 'trap' | 'interface' | 'portal' | 'start'
type LogKind = 'instanciacao' | 'encapsulamento' | 'polimorfismo' | 'interface' | 'excecao' | 'info'

interface Hero {
  name: string
  kind: HeroKind
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  xp: number
  coins: number
  steps: number
  row: number
  col: number
}

interface Enemy {
  id: number
  kind: EnemyKind
  name: string
  hp: number
  maxHp: number
  damage: number
  row: number
  col: number
  alive: boolean
}

interface LogEntry {
  id: number
  kind: LogKind
  message: string
}

interface Evidence {
  id: string
  short: string
  title: string
  detail: string
  java: string
}

const MAP: string[] = [
  '###############',
  '#S....#....P..#',
  '#.##..#..##..##',
  '#....#...E...##',
  '###.###.###...#',
  '#C..#...#..M..#',
  '#.##.#.#.##..##',
  '#...#...#..E..#',
  '#.#.###.#.##..#',
  '#...T...#..C..#',
  '#.###.###.##..#',
  '#..I....E.....#',
  '###############',
]

const HERO_PRESETS: Record<HeroKind, Omit<Hero, 'name' | 'kind' | 'xp' | 'coins' | 'steps' | 'row' | 'col'>> = {
  guerreiro: { hp: 130, maxHp: 130, mana: 45, maxMana: 45 },
  mago: { hp: 90, maxHp: 90, mana: 125, maxMana: 125 },
  sentinela: { hp: 105, maxHp: 105, mana: 80, maxMana: 80 },
}

const HERO_META: Record<HeroKind, { icon: string; label: string; attack: string; ability: string; color: string }> = {
  guerreiro: { icon: '⚔️', label: 'Guerreiro', attack: 'golpe de espada', ability: 'Postura Guardiã', color: 'amber' },
  mago: { icon: '🔮', label: 'Mago', attack: 'pulso arcano', ability: 'Explosão Arcana', color: 'violet' },
  sentinela: { icon: '🏹', label: 'Sentinela', attack: 'flecha precisa', ability: 'Olho do Nexus', color: 'emerald' },
}

const EVIDENCES: Evidence[] = [
  {
    id: 'base', short: 'Módulo', title: 'Programação modular',
    detail: 'O jogo separa seleção, movimento, combate e registro de evidências em responsabilidades menores.',
    java: 'iniciarJogo() · mover() · atacar() · registrarEvidencia()',
  },
  {
    id: 'objetos', short: 'Objeto', title: 'Classes, objetos e construtores',
    detail: 'O herói, cada inimigo e cada item são objetos criados a partir de uma classe.',
    java: 'new Guerreiro(nome) · new Golem() · new Reliquia()',
  },
  {
    id: 'encapsulamento', short: 'Estado', title: 'Encapsulamento e acesso',
    detail: 'HP e Mana não devem ser alterados diretamente. A operação recebeDano() preserva as regras do objeto.',
    java: 'private int hp; · public void receberDano(int valor)',
  },
  {
    id: 'invariante', short: 'Regra', title: 'Invariante de classe',
    detail: 'O jogo nunca deixa HP ou Mana abaixo de zero nem acima do máximo definido no construtor.',
    java: 'hp = Math.max(0, Math.min(novoHp, maxHp));',
  },
  {
    id: 'heranca', short: 'É-UM', title: 'Herança e classe abstrata',
    detail: 'Guerreiro, Mago e Sentinela são Personagem, mas Personagem é uma ideia abstrata e não é criado diretamente.',
    java: 'abstract class Personagem → Guerreiro | Mago | Sentinela',
  },
  {
    id: 'polimorfismo', short: 'Resposta', title: 'Polimorfismo',
    detail: 'O jogo faz a mesma chamada calcularDano() para qualquer Personagem; o objeto real decide qual versão executar.',
    java: 'Personagem p; p.calcularDano(); → versão do objeto real',
  },
  {
    id: 'interface', short: 'Contrato', title: 'Interface',
    detail: 'O botão de habilidade conhece apenas o contrato Habilidade. Cada herói cumpre esse contrato de uma forma.',
    java: 'interface Habilidade { void usar(Personagem alvo); }',
  },
]

const LOG_META: Record<LogKind, { label: string; className: string }> = {
  instanciacao: { label: 'INSTANCIAÇÃO', className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' },
  encapsulamento: { label: 'ENCAPSULAMENTO', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' },
  polimorfismo: { label: 'POLIMORFISMO', className: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100' },
  interface: { label: 'INTERFACE', className: 'border-violet-400/30 bg-violet-400/10 text-violet-100' },
  excecao: { label: 'EXCEÇÃO', className: 'border-rose-400/30 bg-rose-400/10 text-rose-100' },
  info: { label: 'MISSÃO', className: 'border-slate-600 bg-slate-800/60 text-slate-200' },
}

function createEnemies(): Enemy[] {
  return [
    { id: 1, kind: 'goblin', name: 'Goblin de Tipos', hp: 38, maxHp: 38, damage: 8, row: 3, col: 9, alive: true },
    { id: 2, kind: 'golem', name: 'Golem do Acoplamento', hp: 76, maxHp: 76, damage: 16, row: 7, col: 11, alive: true },
    { id: 3, kind: 'sombra', name: 'Sombra do Cast', hp: 54, maxHp: 54, damage: 12, row: 11, col: 8, alive: true },
  ]
}

function initialCells(): Record<string, CellKind> {
  const cells: Record<string, CellKind> = {}
  MAP.forEach((line, row) => {
    line.split('').forEach((symbol, col) => {
      const kind: CellKind = symbol === '#' ? 'wall'
        : symbol === 'C' ? 'chest'
          : symbol === 'M' ? 'crystal'
            : symbol === 'T' ? 'trap'
              : symbol === 'I' ? 'interface'
                : symbol === 'P' ? 'portal'
                  : symbol === 'S' ? 'start' : 'empty'
      cells[`${row},${col}`] = kind
    })
  })
  return cells
}

function key(row: number, col: number) {
  return `${row},${col}`
}

function barPercent(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / max) * 100))
}

export default function NexusHeroesEvolutionPage() {
  const [phase, setPhase] = useState<Phase>('select')
  const [heroKind, setHeroKind] = useState<HeroKind>('guerreiro')
  const [nameInput, setNameInput] = useState('')
  const [hero, setHero] = useState<Hero | null>(null)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [cells, setCells] = useState<Record<string, CellKind>>(() => initialCells())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [evidence, setEvidence] = useState<string[]>([])
  const [showCodex, setShowCodex] = useState(false)
  const [nextLogId, setNextLogId] = useState(1)

  const addLog = useCallback((kind: LogKind, message: string) => {
    setLogs((previous) => [...previous, { id: Date.now() + nextLogId, kind, message }].slice(-45))
    setNextLogId((id) => id + 1)
  }, [nextLogId])

  const discover = useCallback((id: string) => {
    setEvidence((previous) => previous.includes(id) ? previous : [...previous, id])
  }, [])

  const startGame = useCallback(() => {
    const name = nameInput.trim() || HERO_META[heroKind].label
    const preset = HERO_PRESETS[heroKind]
    setHero({ name, kind: heroKind, ...preset, xp: 0, coins: 0, steps: 0, row: 1, col: 1 })
    setEnemies(createEnemies())
    setCells(initialCells())
    setEvidence(['base', 'objetos', 'heranca'])
    setLogs([])
    setNextLogId(1)
    setPhase('playing')
    addLog('instanciacao', `new ${HERO_META[heroKind].label}("${name}") criado. O construtor chama super(nome, hp, mana).`)
    addLog('info', 'Missão: recupere os quatro fragmentos do Contrato Primordial e alcance o portal.')
    addLog('info', 'O Codex de Evidências registra as pistas que você vai usar no diagrama de classes.')
  }, [addLog, heroKind, nameInput])

  const reset = useCallback(() => {
    setPhase('select')
    setHero(null)
    setShowCodex(false)
  }, [])

  const adjacentEnemies = useMemo(() => {
    if (!hero) return []
    return enemies.filter((enemy) => enemy.alive && Math.abs(enemy.row - hero.row) + Math.abs(enemy.col - hero.col) === 1)
  }, [enemies, hero])

  const collectCell = useCallback((nextHero: Hero, row: number, col: number): Hero => {
    const cellKey = key(row, col)
    const cell = cells[cellKey]
    let updated = { ...nextHero, row, col }

    if (cell === 'chest') {
      updated = { ...updated, coins: updated.coins + 10, xp: updated.xp + 20 }
      discover('objetos')
      addLog('instanciacao', `new Reliquia("Fragmento") criado. addInventario() adicionou o objeto ao herói.`)
      setCells((previous) => ({ ...previous, [cellKey]: 'empty' }))
    }
    if (cell === 'crystal') {
      const requested = updated.mana + 35
      const mana = Math.min(requested, updated.maxMana)
      updated = { ...updated, mana }
      discover('encapsulamento')
      discover('invariante')
      addLog('encapsulamento', `private mana protegido: restaurarMana(35) aplicou Math.min(${requested}, ${updated.maxMana}). Valor final: ${mana}.`)
      setCells((previous) => ({ ...previous, [cellKey]: 'empty' }))
    }
    if (cell === 'trap') {
      const hp = Math.max(0, updated.hp - 22)
      updated = { ...updated, hp }
      discover('encapsulamento')
      discover('invariante')
      addLog('excecao', `Armadilha acionou DanoDeTerrenoException. receberDano(22) manteve 0 <= hp <= maxHp: ${hp}/${updated.maxHp}.`)
      setCells((previous) => ({ ...previous, [cellKey]: 'empty' }))
    }
    if (cell === 'interface') {
      updated = { ...updated, xp: updated.xp + 25 }
      discover('interface')
      addLog('interface', `Contrato Habilidade encontrado. O botão chama usar() sem conhecer a classe concreta ${HERO_META[updated.kind].label}.`)
      setCells((previous) => ({ ...previous, [cellKey]: 'empty' }))
    }
    if (cell === 'portal') {
      const required = ['encapsulamento', 'invariante', 'polimorfismo', 'interface']
      const missing = required.filter((item) => !evidence.includes(item))
      if (missing.length === 0) {
        addLog('info', 'Contrato completo. O portal reconheceu todas as evidências do modelo OO.')
        setPhase('victory')
      } else {
        addLog('info', `Portal bloqueado. Ainda faltam evidências no Codex: ${missing.join(', ')}.`)
      }
    }
    if (updated.hp <= 0) setPhase('defeat')
    return updated
  }, [addLog, cells, discover, evidence])

  const move = useCallback((rowDelta: number, colDelta: number) => {
    if (phase !== 'playing' || !hero) return
    const row = hero.row + rowDelta
    const col = hero.col + colDelta
    if (row < 0 || col < 0 || row >= MAP.length || col >= MAP[0].length) return
    if (cells[key(row, col)] === 'wall') {
      addLog('info', 'Parede: o movimento foi bloqueado. O objeto permanece encapsulado no espaço permitido.')
      return
    }
    if (enemies.some((enemy) => enemy.alive && enemy.row === row && enemy.col === col)) {
      addLog('info', 'Inimigo bloqueando a célula. Use a ação polimórfica para enfrentá-lo.')
      return
    }
    const next = collectCell({ ...hero, steps: hero.steps + 1 }, row, col)
    setHero(next)
  }, [addLog, cells, collectCell, enemies, hero, phase])

  const attack = useCallback(() => {
    if (phase !== 'playing' || !hero || adjacentEnemies.length === 0) return
    const target = adjacentEnemies[0]
    const damage = hero.kind === 'guerreiro' ? 26 : hero.kind === 'mago' ? 34 : 20
    const remaining = Math.max(0, target.hp - damage)
    discover('polimorfismo')
    discover('heranca')
    addLog('polimorfismo', `List<Personagem> grupo → personagem.calcularDano(). A referência é geral; ${HERO_META[hero.kind].label}.calcularDano() respondeu ${damage}.`)
    addLog('polimorfismo', `@Override: a mesma chamada executou a implementação específica de ${HERO_META[hero.kind].label}.`)
    setEnemies((previous) => previous.map((enemy) => enemy.id === target.id ? { ...enemy, hp: remaining, alive: remaining > 0 } : enemy))
    if (remaining <= 0) {
      setHero({ ...hero, xp: hero.xp + 35, coins: hero.coins + 15 })
      addLog('instanciacao', `${target.name} derrotado. new Recompensa(15) criada e entregue ao inventário.`)
    } else {
      const hp = Math.max(0, hero.hp - target.damage)
      setHero({ ...hero, hp })
      addLog('excecao', `${target.name}.contraAtacar() reduziu HP. receberDano(${target.damage}) preservou a invariante: ${hp}/${hero.maxHp}.`)
      if (hp <= 0) setPhase('defeat')
    }
  }, [addLog, adjacentEnemies, discover, hero, phase])

  const activateAbility = useCallback(() => {
    if (phase !== 'playing' || !hero) return
    const cost = 20
    discover('interface')
    addLog('interface', `Habilidade habilidade = personagem; habilidade.usar(alvo). O chamador conhece só o contrato.`)
    if (hero.mana < cost) {
      addLog('excecao', `ManaInsuficienteException: usar() exige ${cost}, mas o objeto possui ${hero.mana}.`)
      return
    }
    const damage = hero.kind === 'mago' ? 48 : hero.kind === 'guerreiro' ? 32 : 28
    setHero({ ...hero, mana: Math.max(0, hero.mana - cost), xp: hero.xp + 10 })
    addLog('interface', `${HERO_META[hero.kind].ability} executou sua própria implementação de usar(). Dano: ${damage}.`)
    if (adjacentEnemies.length > 0) {
      const target = adjacentEnemies[0]
      const remaining = Math.max(0, target.hp - damage)
      setEnemies((previous) => previous.map((enemy) => enemy.id === target.id ? { ...enemy, hp: remaining, alive: remaining > 0 } : enemy))
      if (remaining <= 0) addLog('info', `A habilidade derrotou ${target.name} sem o botão conhecer a classe do alvo.`)
    } else {
      addLog('info', 'A habilidade foi executada, mas não havia inimigo adjacente.')
    }
  }, [addLog, adjacentEnemies, discover, hero, phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') { event.preventDefault(); move(-1, 0) }
      if (event.key === 'ArrowDown') { event.preventDefault(); move(1, 0) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(0, -1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(0, 1) }
      if (event.key === ' ') { event.preventDefault(); attack() }
      if (event.key.toLowerCase() === 'e') activateAbility()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activateAbility, attack, move, phase])

  if (phase === 'select') {
    return (
      <main className="min-h-screen bg-[#080b17] px-4 py-10 text-slate-100 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">Nexus dos Heróis · evolução pós-aula 17</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">O Contrato Final</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">O Nexus se partiu em quatro fragmentos. Para reconstruí-lo, você terá de provar que sabe separar responsabilidades, proteger o estado, substituir tipos e programar para contratos.</p>
          </div>
          <div className="mb-8 grid gap-4 md:grid-cols-[1.1fr_1fr]">
            <section className="rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-950/70 to-slate-900 p-6">
              <p className="text-sm font-bold text-fuchsia-200">A história</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">A entidade Acoplamento roubou o Contrato Primordial e espalhou seus fragmentos pelo labirinto. Cada fragmento revela uma pista do modelo. Os guardiões não aceitam qualquer aventureiro: eles testam se uma chamada geral pode produzir comportamentos específicos.</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">Explore, leia o console e abra o Codex. O objetivo não é apenas vencer: é sair com evidências suficientes para desenhar o diagrama de classes.</p>
            </section>
            <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
              <p className="text-sm font-bold text-cyan-200">Como a atividade evoluiu</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                {['Mapa com objetivos e pistas', 'Codex de evidências OO', 'Classes concretas diferentes', 'Chamada polimórfica', 'Contrato de interface', 'Rascunho para o UML'].map((item) => <div key={item} className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">✓ {item}</div>)}
              </div>
            </section>
          </div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Escolha um objeto concreto</p><p className="mt-1 text-slate-300">Todos são Personagem, mas cada um responde de um jeito.</p></div>
            <input value={nameInput} onChange={(event) => setNameInput(event.target.value)} maxLength={16} placeholder="Nome do herói" className="w-44 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-400" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(HERO_META) as HeroKind[]).map((kind) => {
              const meta = HERO_META[kind]
              const preset = HERO_PRESETS[kind]
              const selected = kind === heroKind
              return <button key={kind} type="button" onClick={() => setHeroKind(kind)} className={`rounded-2xl border p-5 text-left transition ${selected ? 'border-fuchsia-400 bg-fuchsia-500/10 ring-2 ring-fuchsia-400/30' : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}`}><div className="text-3xl">{meta.icon}</div><h2 className="mt-3 text-xl font-black">{meta.label}</h2><p className="mt-1 text-sm text-slate-400">calcularDano(): {meta.attack}</p><p className="mt-3 text-xs text-slate-500">HP {preset.maxHp} · Mana {preset.maxMana} · habilidade: {meta.ability}</p></button>
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4"><button type="button" onClick={startGame} className="rounded-xl bg-fuchsia-500 px-7 py-3 font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:bg-fuchsia-400">🎮 Iniciar missão</button><a href="/nexus-heroes" className="text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline">Voltar ao Nexus original</a></div>
        </div>
      </main>
    )
  }

  if ((phase === 'victory' || phase === 'defeat') && hero) {
    const won = phase === 'victory'
    return <main className="flex min-h-screen items-center justify-center bg-[#080b17] px-4 py-10 text-slate-100"><section className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center"><div className="text-6xl">{won ? '🏆' : '💀'}</div><h1 className={`mt-4 text-4xl font-black ${won ? 'text-fuchsia-300' : 'text-rose-300'}`}>{won ? 'Contrato restaurado!' : 'O Nexus aguarda uma nova tentativa'}</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">{won ? 'Você alcançou o portal com as evidências de encapsulamento, invariantes, herança, polimorfismo e interface. Agora use o Codex para construir o diagrama.' : 'O estado do personagem chegou a zero. Observe no console como a invariante protegeu o objeto e tente novamente.'}</p><div className="my-7 grid grid-cols-3 gap-3"><Stat label="Evidências" value={`${evidence.length}/${EVIDENCES.length}`} /><Stat label="Passos" value={hero.steps} /><Stat label="XP" value={hero.xp} /></div>{won && <div className="mb-6 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4 text-left text-sm text-slate-300"><p className="font-bold text-fuchsia-200">Próxima produção: diagrama de classes</p><p className="mt-2">Use Personagem, Guerreiro, Mago, Sentinela, Habilidade e as relações descobertas no Codex. Marque onde existe herança e onde existe realização de interface.</p></div>}<button type="button" onClick={reset} className="rounded-xl bg-fuchsia-500 px-6 py-3 font-black text-white hover:bg-fuchsia-400">Jogar novamente</button></section></main>
  }

  if (!hero) return null
  const heroMeta = HERO_META[hero.kind]
  const currentEnemy = adjacentEnemies[0]
  const discoveredCount = evidence.length

  return <main className="min-h-screen bg-[#080b17] text-slate-100">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">O Contrato Final</p><p className="text-sm text-slate-400">Explore · confronte · modele</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-bold text-fuchsia-200">Codex {discoveredCount}/{EVIDENCES.length}</span><button type="button" onClick={() => setShowCodex((value) => !value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold hover:bg-slate-700">{showCodex ? 'Fechar Codex' : 'Abrir Codex'}</button></div></header>
    <div className="mx-auto grid max-w-[1500px] gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(500px,1.1fr)_minmax(300px,0.75fr)]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-black sm:text-2xl">{heroMeta.icon} {hero.name}</h1><p className="text-xs text-slate-500">objeto real: {heroMeta.label} · referência usada pelo jogo: Personagem</p></div><div className="text-right text-xs text-slate-400">Passos <b className="text-white">{hero.steps}</b> · 🪙 <b className="text-amber-300">{hero.coins}</b></div></div>
        <div className="mb-4 grid grid-cols-2 gap-3"><Bar label="HP · estado protegido" value={hero.hp} max={hero.maxHp} color="bg-rose-500" /><Bar label="Mana · contrato de uso" value={hero.mana} max={hero.maxMana} color="bg-cyan-500" /></div>
        <div className="mx-auto grid aspect-square w-full max-w-[650px] grid-cols-15 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" style={{ gridTemplateColumns: `repeat(${MAP[0].length}, minmax(0, 1fr))` }}>
          {MAP.flatMap((line, row) => line.split('').map((symbol, col) => {
            const cell = cells[key(row, col)]
            const enemy = enemies.find((item) => item.alive && item.row === row && item.col === col)
            const occupiedByHero = hero.row === row && hero.col === col
            let visual = symbol === '#' ? 'bg-slate-950' : 'bg-slate-800/70'
            if (symbol === '#') visual = 'bg-slate-950'
            if (cell === 'chest') visual = 'bg-amber-950/80'
            if (cell === 'crystal') visual = 'bg-cyan-950/80'
            if (cell === 'trap') visual = 'bg-rose-950/80'
            if (cell === 'interface') visual = 'bg-violet-950/80'
            if (cell === 'portal') visual = 'bg-fuchsia-950/80'
            return <div key={key(row, col)} className={`relative flex aspect-square items-center justify-center border-[0.5px] border-slate-800/70 text-[clamp(0.65rem,2.2vw,1.15rem)] ${visual}`}>{symbol === '#' && <span className="text-slate-700">▪</span>}{cell === 'chest' && '📦'}{cell === 'crystal' && '💎'}{cell === 'trap' && '⚠️'}{cell === 'interface' && '🔗'}{cell === 'portal' && '🌀'}{enemy && <span title={enemy.name}>{enemy.kind === 'goblin' ? '👾' : enemy.kind === 'golem' ? '🗿' : '🌑'}</span>}{occupiedByHero && <span className="absolute z-10 drop-shadow-[0_0_7px_rgba(232,121,249,0.95)]">{heroMeta.icon}</span>}</div>
          }))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div className="grid grid-cols-3 gap-1"><span /><MoveButton onClick={() => move(-1, 0)}>↑</MoveButton><span /><MoveButton onClick={() => move(0, -1)}>←</MoveButton><MoveButton onClick={() => move(1, 0)}>↓</MoveButton><MoveButton onClick={() => move(0, 1)}>→</MoveButton></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!currentEnemy} onClick={attack} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">⚔️ Calcular dano <kbd className="ml-1 rounded bg-black/15 px-1">Espaço</kbd></button><button type="button" onClick={activateAbility} disabled={hero.mana < 20} className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-30">✨ Usar contrato <kbd className="ml-1 rounded bg-black/15 px-1">E</kbd></button></div></div>
        <p className="mt-3 text-center text-[11px] text-slate-500">Setas ou D-pad para mover · Espaço chama calcularDano() · E chama o contrato Habilidade.usar()</p>
      </section>
      <aside className="flex min-h-[620px] flex-col gap-4">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-black text-fuchsia-200">📓 Codex de Evidências</h2><span className="text-xs text-slate-500">{discoveredCount} descobertas</span></div><div className="space-y-2">{EVIDENCES.map((item) => { const found = evidence.includes(item.id); return <div key={item.id} className={`rounded-xl border p-3 transition ${found ? 'border-fuchsia-400/30 bg-fuchsia-400/10' : 'border-slate-800 bg-slate-950/40 opacity-55'}`}><div className="flex items-start gap-2"><span className="text-xs font-black text-fuchsia-200">{found ? '✓' : '○'}</span><div><p className="text-xs font-black">{item.short} · {item.title}</p>{found && <><p className="mt-1 text-[11px] leading-4 text-slate-300">{item.detail}</p><code className="mt-1 block text-[10px] text-cyan-300">{item.java}</code></>}</div></div></div>})}</div></section>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-zinc-950"><div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-2 text-xs font-bold text-slate-500">System Console · comportamento OO</span></div><div className="min-h-[250px] flex-1 space-y-2 overflow-y-auto p-4 font-mono text-[11px] leading-5">{logs.map((log) => { const meta = LOG_META[log.kind]; return <div key={log.id}><span className={`rounded border px-1.5 py-0.5 text-[9px] font-black ${meta.className}`}>{meta.label}</span><p className="mt-0.5 break-words text-slate-300">&gt; {log.message}</p></div>})}</div></section>
      </aside>
    </div>
    {showCodex && <div className="fixed inset-0 z-20 bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setShowCodex(false)}><div className="mx-auto mt-10 max-h-[80vh] max-w-2xl overflow-y-auto rounded-3xl border border-fuchsia-400/30 bg-slate-900 p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-2xl font-black text-fuchsia-200">Codex para o diagrama</h2><button type="button" onClick={() => setShowCodex(false)} className="text-slate-400 hover:text-white">✕</button></div><p className="mt-2 text-sm leading-6 text-slate-400">Copie as evidências encontradas para a folha de modelagem da atividade. O jogo mostra pistas; o diagrama é a sua produção.</p><div className="mt-5 space-y-3">{EVIDENCES.filter((item) => evidence.includes(item.id)).map((item) => <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-300">{item.detail}</p><code className="mt-2 block text-xs text-cyan-300">{item.java}</code></div>)}</div><p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">Pergunta de modelagem: quais classes compartilham estado por herança? Quais objetos apenas cumprem o contrato Habilidade? Onde o código chama o tipo geral?</p></div></div>}
  </main>
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <div><div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>{label}</span><span>{value}/{max}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${barPercent(value, max)}%` }} /></div></div>
}

function MoveButton({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-black text-slate-200 hover:bg-slate-700 active:scale-95">{children}</button>
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-fuchsia-200">{value}</p></div>
}
