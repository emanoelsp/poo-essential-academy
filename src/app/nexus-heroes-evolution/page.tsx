'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

const EvolutionCanvas = dynamic(() => import('./EvolutionCanvas'), { ssr: false })

type Phase = 'select' | 'playing' | 'victory' | 'defeat'
type HeroKind = 'guerreiro' | 'mago' | 'sentinela'
type EnemyKind = 'goblin' | 'golem' | 'sombra'
type CellKind = 'empty' | 'wall' | 'chest' | 'crystal' | 'trap' | 'interface' | 'portal' | 'start' | 'gate' | 'npc' | 'hidden'
type LogKind = 'instanciacao' | 'encapsulamento' | 'polimorfismo' | 'interface' | 'excecao' | 'info'
type QuestId = 'classes' | 'encapsulamento' | 'heranca' | 'polimorfismo'

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

const ZONE_ROWS = {
  northWest: [
    'S....#....C..',
    '.#..#...#....',
    '.#..#...#..M.',
    '....N.......#',
    '..I#..#..T...',
    '#..##....#...',
    '....#..C.....',
    '.#..#....#...',
    '...#......#..',
  ],
  northEast: [
    '..#....#.....',
    '...#..M....#.',
    '#...##.....#.',
    '...#......#..',
    '...#...E.....',
    '..T..#...#...',
    '...#....#....',
    '..C...#...E..',
    '.#....#......',
  ],
  southWest: [
    '..I....#..C..',
    '.#...##....#.',
    '...#....#...E',
    '#..##...#....',
    '...T....#..##',
    '....#..C....#',
    '.#..#....#...',
    '...#...##....',
    '..#......#...',
  ],
  southEast: [
    '..#...E...#P.',
    '...#....#....',
    '..M...#...C..',
    '#....##....#.',
    '...#..G...I..',
    '..#....#...T.',
    '....H...#....',
    '.#....#...E..',
    '...#....#....',
  ],
} as const

const MAP: string[] = [
  '#'.repeat(29),
  ...ZONE_ROWS.northWest.map((left, index) => `#${left}${index === 5 ? 'G' : '#'}${ZONE_ROWS.northEast[index]}#`),
  '#######G#############G#######',
  ...ZONE_ROWS.southWest.map((left, index) => `#${left}${index === 4 ? 'G' : '#'}${ZONE_ROWS.southEast[index]}#`),
  '#'.repeat(29),
]

const QUESTS: Record<QuestId, {
  number: number
  region: string
  title: string
  icon: string
  gate: string
  prompt: string
  clue: string
  sources: string
  options: Array<{ id: string; label: string; detail: string }>
  correct: string
  reward: number
}> = {
  classes: {
    number: 1,
    region: 'Ala do Molde',
    title: 'O molde e a instância',
    icon: '📜',
    gate: 'Portão de Ferro',
    prompt: 'O NPC entregou três palavras. Associe a explicação correta ao par Classe × Objeto.',
    clue: 'Uma classe descreve características e comportamentos; o objeto é uma instância concreta criada a partir dela.',
    sources: 'Converse com o NPC da Ala do Molde ou abra o baú âmbar.',
    options: [
      { id: 'right', label: 'Classe = molde · Objeto = instância criada do molde', detail: 'A classe define; o objeto existe na memória.' },
      { id: 'wrong-1', label: 'Classe = valor guardado · Objeto = método estático', detail: 'Mistura estado com comportamento.' },
      { id: 'wrong-2', label: 'Classe = interface · Objeto = herança', detail: 'São relações diferentes.' },
    ],
    correct: 'right',
    reward: 25,
  },
  encapsulamento: {
    number: 2,
    region: 'Câmara do Estado',
    title: 'A muralha da invariante',
    icon: '🛡️',
    gate: 'Portão de Bronze',
    prompt: 'O cristal mostrou a regra do estado. Associe a proteção correta para HP e Mana.',
    clue: 'O atributo fica protegido e só muda por operações que validam limites: 0 ≤ valor ≤ máximo.',
    sources: 'Colete o cristal azul e observe a armadilha da Câmara do Estado.',
    options: [
      { id: 'wrong-1', label: 'public hp; qualquer parte pode escrever qualquer valor', detail: 'Isso quebra o encapsulamento.' },
      { id: 'right', label: 'private hp + receberDano()/curar() mantendo a invariante', detail: 'O objeto controla a própria regra.' },
      { id: 'wrong-2', label: 'Remover o máximo para nunca ocorrer exceção', detail: 'Sem regra, o estado fica inválido.' },
    ],
    correct: 'right',
    reward: 35,
  },
  heranca: {
    number: 3,
    region: 'Forja da Linhagem',
    title: 'A linhagem abstrata',
    icon: '⚒️',
    gate: 'Portão de Pedra',
    prompt: 'O guardião derrotado deixou uma placa. Associe a relação correta entre Personagem e seus tipos concretos.',
    clue: 'Personagem reúne o que é comum e é abstrata; Guerreiro, Mago e Sentinela são especializações concretas.',
    sources: 'Derrote o Golem do Acoplamento ou leia a placa da Forja da Linhagem.',
    options: [
      { id: 'wrong-1', label: 'Personagem cria objetos diretamente e os filhos não herdam nada', detail: 'Uma classe abstrata organiza o comum.' },
      { id: 'right', label: 'abstract Personagem → Guerreiro | Mago | Sentinela', detail: 'É-UM: cada classe concreta é uma Personagem.' },
      { id: 'wrong-2', label: 'Guerreiro contém Personagem como um campo obrigatório', detail: 'Isso seria composição, não herança.' },
    ],
    correct: 'right',
    reward: 45,
  },
  polimorfismo: {
    number: 4,
    region: 'Observatório dos Contratos',
    title: 'A resposta do contrato',
    icon: '🌀',
    gate: 'Portão do Nexus',
    prompt: 'O fragmento escondido completou o contrato. Associe a chamada que permite polimorfismo e interface.',
    clue: 'A referência geral recebe implementações diferentes: a mesma mensagem chama a resposta do objeto real.',
    sources: 'Encontre o fragmento escondido e converse com a Interface flutuante.',
    options: [
      { id: 'wrong-1', label: 'if (classe == Guerreiro) use espada; se não, reescreva tudo', detail: 'Isso acopla o chamador às classes.' },
      { id: 'wrong-2', label: 'new Personagem() e acesso direto a todos os atributos', detail: 'Ignora abstração e encapsulamento.' },
      { id: 'right', label: 'Personagem p; p.calcularDano(); · Habilidade h; h.usar()', detail: 'A referência conhece o contrato; o objeto decide a implementação.' },
    ],
    correct: 'right',
    reward: 60,
  },
}

const GATES: Array<{ id: QuestId; row: number; col: number; style: 'iron' | 'bronze' | 'stone' | 'nexus' }> = [
  { id: 'classes', row: 6, col: 14, style: 'iron' },
  { id: 'encapsulamento', row: 10, col: 7, style: 'bronze' },
  { id: 'heranca', row: 10, col: 21, style: 'stone' },
  { id: 'polimorfismo', row: 15, col: 14, style: 'nexus' },
]

const CLUE_SOURCES: Record<string, { quest: QuestId; message: string }> = {
  '4,5': { quest: 'classes', message: 'NPC: uma classe é o molde; o objeto é a instância criada desse molde.' },
  '1,11': { quest: 'classes', message: 'Baú: new Reliquia("Fragmento") revelou a diferença entre classe e objeto.' },
  '3,12': { quest: 'encapsulamento', message: 'Cristal: o estado só muda por métodos que respeitam a invariante.' },
  '5,10': { quest: 'encapsulamento', message: 'Armadilha: receberDano() impediu HP de sair dos limites válidos.' },
  '11,11': { quest: 'heranca', message: 'Placa da forja: Personagem é abstrata; os heróis concretos herdam sua estrutura comum.' },
  '15,25': { quest: 'polimorfismo', message: 'Interface: o contrato Habilidade permite chamar usar() sem conhecer a classe concreta.' },
  '17,19': { quest: 'polimorfismo', message: 'Fragmento escondido: a mesma chamada encontra respostas diferentes nos objetos reais.' },
}

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
    { id: 1, kind: 'goblin', name: 'Goblin de Tipos', hp: 38, maxHp: 38, damage: 8, row: 4, col: 9, alive: true },
    { id: 2, kind: 'golem', name: 'Golem do Acoplamento', hp: 76, maxHp: 76, damage: 16, row: 7, col: 20, alive: true },
    { id: 3, kind: 'golem', name: 'Guardião da Linhagem', hp: 84, maxHp: 84, damage: 17, row: 13, col: 13, alive: true },
    { id: 4, kind: 'sombra', name: 'Sombra do Cast', hp: 54, maxHp: 54, damage: 12, row: 17, col: 25, alive: true },
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
                  : symbol === 'G' ? 'gate'
                    : symbol === 'N' ? 'npc'
                      : symbol === 'H' ? 'hidden'
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
  const [nameError, setNameError] = useState('')
  const [hero, setHero] = useState<Hero | null>(null)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [cells, setCells] = useState<Record<string, CellKind>>(() => initialCells())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [evidence, setEvidence] = useState<string[]>([])
  const [clues, setClues] = useState<QuestId[]>([])
  const [completedQuests, setCompletedQuests] = useState<QuestId[]>([])
  const [questOpen, setQuestOpen] = useState<QuestId | null>(null)
  const [questAnswer, setQuestAnswer] = useState('')
  const [questResult, setQuestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [showCodex, setShowCodex] = useState(false)
  const [nextLogId, setNextLogId] = useState(1)

  const addLog = useCallback((kind: LogKind, message: string) => {
    setLogs((previous) => [...previous, { id: Date.now() + nextLogId, kind, message }].slice(-45))
    setNextLogId((id) => id + 1)
  }, [nextLogId])

  const discover = useCallback((id: string) => {
    setEvidence((previous) => previous.includes(id) ? previous : [...previous, id])
  }, [])

  const discoverClue = useCallback((quest: QuestId, message: string) => {
    setClues((previous) => {
      if (previous.includes(quest)) return previous
      addLog('info', `Pista da Quest ${QUESTS[quest].number}: ${message}`)
      return [...previous, quest]
    })
  }, [addLog])

  const startGame = useCallback(() => {
    const name = nameInput.trim()
    if (name.length < 2) {
      setNameError('Digite o nome do herói para iniciar a missão.')
      return
    }
    setNameError('')
    const preset = HERO_PRESETS[heroKind]
    setHero({ name, kind: heroKind, ...preset, xp: 0, coins: 0, steps: 0, row: 1, col: 1 })
    setEnemies(createEnemies())
    setCells(initialCells())
    setEvidence(['base', 'objetos', 'heranca'])
    setClues([])
    setCompletedQuests([])
    setQuestOpen(null)
    setQuestAnswer('')
    setQuestResult('idle')
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
    setNameInput('')
    setNameError('')
    setClues([])
    setCompletedQuests([])
    setQuestOpen(null)
    setQuestAnswer('')
    setQuestResult('idle')
    setShowCodex(false)
  }, [])

  const adjacentEnemies = useMemo(() => {
    if (!hero) return []
    return enemies.filter((enemy) => enemy.alive && Math.abs(enemy.row - hero.row) + Math.abs(enemy.col - hero.col) === 1)
  }, [enemies, hero])

  const openQuest = useCallback((questId: QuestId) => {
    if (completedQuests.includes(questId)) return
    setQuestOpen(questId)
    setQuestAnswer('')
    setQuestResult('idle')
    addLog('info', `Portão ${QUESTS[questId].gate} exige a Quest ${QUESTS[questId].number}: ${QUESTS[questId].title}.`)
  }, [addLog, completedQuests])

  const submitQuest = useCallback(() => {
    if (!questOpen) return
    const quest = QUESTS[questOpen]
    if (!clues.includes(questOpen)) {
      setQuestResult('error')
      addLog('info', `Quest ${quest.number} ainda sem pista. Explore a região e interaja com o elemento indicado no pergaminho.`)
      return
    }
    if (questAnswer !== quest.correct) {
      setQuestResult('error')
      addLog('excecao', `Resposta rejeitada pelo portão. O contrato da Quest ${quest.number} não foi satisfeito.`)
      return
    }
    setCompletedQuests((previous) => previous.includes(questOpen) ? previous : [...previous, questOpen])
    setQuestResult('success')
    setHero((previous) => previous ? { ...previous, xp: previous.xp + quest.reward } : previous)
    if (questOpen === 'classes') discover('objetos')
    if (questOpen === 'encapsulamento') { discover('encapsulamento'); discover('invariante') }
    if (questOpen === 'heranca') discover('heranca')
    if (questOpen === 'polimorfismo') { discover('polimorfismo'); discover('interface') }
    addLog('info', `Quest ${quest.number} concluída. ${quest.gate} abriu e liberou a próxima região. +${quest.reward} XP.`)
  }, [addLog, clues, discover, questAnswer, questOpen])

  const collectCell = useCallback((nextHero: Hero, row: number, col: number): Hero => {
    const cellKey = key(row, col)
    const cell = cells[cellKey]
    let updated = { ...nextHero, row, col }
    const clueSource = CLUE_SOURCES[cellKey]

    if (clueSource) discoverClue(clueSource.quest, clueSource.message)

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
    if (cell === 'npc') {
      addLog('info', 'NPC: a explicação foi registrada no diário. Agora use a pista para responder ao pergaminho do portão.')
    }
    if (cell === 'hidden') {
      updated = { ...updated, xp: updated.xp + 30, coins: updated.coins + 8 }
      addLog('instanciacao', 'Item escondido encontrado: new FragmentoOculto() foi adicionado ao inventário.')
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
  }, [addLog, cells, discover, discoverClue, evidence])

  const move = useCallback((rowDelta: number, colDelta: number) => {
    if (phase !== 'playing' || !hero) return
    const row = hero.row + rowDelta
    const col = hero.col + colDelta
    if (row < 0 || col < 0 || row >= MAP.length || col >= MAP[0].length) return
    if (cells[key(row, col)] === 'wall') {
      addLog('info', 'Parede: o movimento foi bloqueado. O objeto permanece encapsulado no espaço permitido.')
      return
    }
    const gate = GATES.find((candidate) => candidate.row === row && candidate.col === col)
    if (cells[key(row, col)] === 'gate' && gate && !completedQuests.includes(gate.id)) {
      openQuest(gate.id)
      return
    }
    if (enemies.some((enemy) => enemy.alive && enemy.row === row && enemy.col === col)) {
      addLog('info', 'Inimigo bloqueando a célula. Use a ação polimórfica para enfrentá-lo.')
      return
    }
    const next = collectCell({ ...hero, steps: hero.steps + 1 }, row, col)
    setHero(next)
  }, [addLog, cells, collectCell, completedQuests, enemies, hero, openQuest, phase])

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
      if (target.kind === 'goblin') discoverClue('classes', 'Inimigo derrotado: o objeto Goblin foi criado a partir de uma classe concreta.')
      if (target.kind === 'golem') discoverClue('heranca', 'Guardião derrotado: a classe concreta compartilha a estrutura da Personagem abstrata.')
      if (target.kind === 'sombra') discoverClue('polimorfismo', 'Sombra derrotada: a mesma chamada de combate produziu uma resposta específica do objeto real.')
      addLog('instanciacao', `${target.name} derrotado. new Recompensa(15) criada e entregue ao inventário.`)
    } else {
      const hp = Math.max(0, hero.hp - target.damage)
      setHero({ ...hero, hp })
      addLog('excecao', `${target.name}.contraAtacar() reduziu HP. receberDano(${target.damage}) preservou a invariante: ${hp}/${hero.maxHp}.`)
      if (hp <= 0) setPhase('defeat')
    }
  }, [addLog, adjacentEnemies, discover, discoverClue, hero, phase])

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
      if (remaining <= 0) {
        if (target.kind === 'goblin') discoverClue('classes', 'Habilidade executada: um objeto concreto reagiu ao contrato sem o botão conhecer sua classe.')
        if (target.kind === 'golem') discoverClue('heranca', 'Habilidade executada: a classe concreta do guardião continua sendo uma Personagem.')
        if (target.kind === 'sombra') discoverClue('polimorfismo', 'Habilidade executada: a implementação usada veio do objeto real, não do botão.')
        addLog('info', `A habilidade derrotou ${target.name} sem o botão conhecer a classe do alvo.`)
      }
    } else {
      addLog('info', 'A habilidade foi executada, mas não havia inimigo adjacente.')
    }
  }, [addLog, adjacentEnemies, discover, discoverClue, hero, phase])

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
          <section className="mb-7 max-w-2xl rounded-3xl border-2 border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/15 via-slate-900 to-slate-950 p-5 shadow-xl shadow-fuchsia-950/30 ring-1 ring-fuchsia-300/20">
            <label htmlFor="hero-name" className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-200">🔑 Nome do herói <span className="rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[10px] tracking-normal text-fuchsia-100">obrigatório</span></label>
            <p className="mt-2 text-sm text-slate-300">O nome será passado ao construtor e aparecerá nas mensagens do System Console.</p>
            <input id="hero-name" autoFocus value={nameInput} onChange={(event) => { setNameInput(event.target.value); if (nameError) setNameError('') }} onKeyDown={(event) => { if (event.key === 'Enter') startGame() }} maxLength={16} placeholder="Digite o nome do seu personagem" className={`mt-4 w-full rounded-2xl border bg-slate-950 px-4 py-3 text-lg font-bold text-white outline-none transition placeholder:text-slate-600 focus:ring-4 ${nameError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20' : 'border-fuchsia-400/70 focus:border-fuchsia-300 focus:ring-fuchsia-400/20'}`} />
            {nameError ? <p role="alert" className="mt-2 text-sm font-bold text-rose-300">⚠️ {nameError}</p> : <p className="mt-2 text-xs text-slate-500">Mínimo de 2 caracteres · exemplo: Ayla, Nilo ou Iara</p>}
          </section>
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Escolha um objeto concreto</p><p className="mt-1 text-slate-300">Todos são Personagem, mas cada um responde de um jeito.</p></div>
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
  const gateStates = Object.fromEntries(GATES.map((gate) => [gate.id, completedQuests.includes(gate.id)]))
  const activeQuest = questOpen ? { id: questOpen, ...QUESTS[questOpen] } : null

  return <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#050813] text-slate-100 lg:flex-row">
    <section className="relative h-[68dvh] min-h-0 w-full overflow-hidden bg-slate-950 lg:h-full lg:w-[72%]">
      <EvolutionCanvas map={MAP} cells={cells} hero={hero} enemies={enemies} gates={gateStates} />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3">
        <div className="pointer-events-auto max-w-sm rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 shadow-2xl backdrop-blur-md"><div className="flex items-center gap-2"><span className="text-xl">{heroMeta.icon}</span><div><h1 className="font-black leading-none">{hero.name}</h1><p className="mt-1 text-[10px] text-slate-400">{heroMeta.label} · referência: Personagem</p></div><span className="ml-3 text-[10px] text-slate-400">👣 {hero.steps} · 🪙 <b className="text-amber-300">{hero.coins}</b></span></div><div className="mt-3 grid grid-cols-2 gap-3"><Bar label="HP" value={hero.hp} max={hero.maxHp} color="bg-rose-500" /><Bar label="Mana" value={hero.mana} max={hero.maxMana} color="bg-cyan-500" /></div></div>
        <div className="pointer-events-auto rounded-2xl border border-fuchsia-400/30 bg-slate-950/80 px-4 py-3 text-right shadow-2xl backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">O Contrato Final</p><p className="mt-1 text-xs text-slate-300">Regiões liberadas <b className="text-white">{completedQuests.length}/4</b></p><div className="mt-2 flex justify-end gap-1">{GATES.map((gate) => <span key={gate.id} className={`h-2.5 w-7 rounded-full ${completedQuests.includes(gate.id) ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`} />)}</div></div>
      </div>
      <div className="pointer-events-none absolute inset-x-5 bottom-10 z-10 flex items-end justify-between gap-4"><div className="pointer-events-auto grid grid-cols-3 gap-1 rounded-2xl border border-slate-700/70 bg-slate-950/75 p-1.5 shadow-2xl backdrop-blur-sm"><span /><MoveButton onClick={() => move(-1, 0)}>↑</MoveButton><span /><MoveButton onClick={() => move(0, -1)}>←</MoveButton><MoveButton onClick={() => move(1, 0)}>↓</MoveButton><MoveButton onClick={() => move(0, 1)}>→</MoveButton></div><div className="pointer-events-auto flex flex-wrap justify-end gap-2"><button type="button" disabled={!currentEnemy} onClick={attack} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-xl disabled:cursor-not-allowed disabled:opacity-30">⚔️ Calcular dano <kbd className="ml-1 rounded bg-black/15 px-1">Espaço</kbd></button><button type="button" onClick={activateAbility} disabled={hero.mana < 20} className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-30">✨ Usar contrato <kbd className="ml-1 rounded bg-black/15 px-1">E</kbd></button></div></div>
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] text-white/70 drop-shadow">Setas ou D-pad para mover · atravesse os portões resolvendo as quests · Espaço calcula dano · E usa Habilidade</p>
    </section>
    <aside className="flex h-[32dvh] min-h-0 w-full flex-col border-t border-slate-800 bg-slate-900 lg:h-full lg:w-[28%] lg:border-l lg:border-t-0">
      <section className="shrink-0 border-b border-slate-800 bg-slate-900/95 p-3"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300">Mapa 3D · quatro portões</p><h2 className="mt-1 font-black text-white">Diário de Quests</h2></div><div className="flex gap-2"><span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-1 text-[10px] font-bold text-fuchsia-200">Codex {discoveredCount}/{EVIDENCES.length}</span><button type="button" onClick={() => setShowCodex((value) => !value)} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold hover:bg-slate-700">{showCodex ? 'Fechar' : 'Codex'}</button></div></div><div className="mt-3 grid grid-cols-2 gap-2">{(Object.keys(QUESTS) as QuestId[]).map((id) => { const quest = QUESTS[id]; const done = completedQuests.includes(id); const hasClue = clues.includes(id); return <div key={id} className={`rounded-xl border p-2 ${done ? 'border-emerald-400/40 bg-emerald-400/10' : hasClue ? 'border-amber-400/30 bg-amber-400/10' : 'border-slate-700 bg-slate-950/40'}`}><div className="flex items-center gap-1.5"><span>{done ? '✓' : hasClue ? '◈' : '○'}</span><p className="truncate text-[10px] font-black">{quest.number}. {quest.region}</p></div><p className="mt-1 truncate text-[10px] text-slate-400">{done ? 'Portão aberto' : hasClue ? 'Pista encontrada' : 'Explore para achar a pista'}</p></div>})}</div></section>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950"><div className="flex shrink-0 items-center gap-2 border-b border-slate-800 px-3 py-2"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-2 text-xs font-bold text-zinc-400">System Console · pistas do ambiente</span></div><div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 font-mono text-[11px] leading-5">{logs.map((log) => { const meta = LOG_META[log.kind]; return <div key={log.id}><span className={`rounded border px-1.5 py-0.5 text-[9px] font-black ${meta.className}`}>{meta.label}</span><p className="mt-0.5 break-words text-slate-300">&gt; {log.message}</p></div>})}</div></section>
    </aside>
    {showCodex && <div className="fixed inset-0 z-30 bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setShowCodex(false)}><div className="mx-auto mt-10 max-h-[80vh] max-w-2xl overflow-y-auto rounded-3xl border border-fuchsia-400/30 bg-slate-900 p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-2xl font-black text-fuchsia-200">Codex para o diagrama</h2><button type="button" onClick={() => setShowCodex(false)} className="text-slate-400 hover:text-white">✕</button></div><p className="mt-2 text-sm leading-6 text-slate-400">Copie as evidências encontradas para a folha de modelagem da atividade. O jogo mostra pistas; o diagrama é a sua produção.</p><div className="mt-5 space-y-3">{EVIDENCES.filter((item) => evidence.includes(item.id)).map((item) => <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-300">{item.detail}</p><code className="mt-2 block text-xs text-cyan-300">{item.java}</code></div>)}</div><p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">Pergunta de modelagem: quais classes compartilham estado por herança? Quais objetos apenas cumprem o contrato Habilidade? Onde o código chama o tipo geral?</p></div></div>}
    {activeQuest && <div className="fixed inset-0 z-40 grid place-items-center bg-[#120c08]/75 p-4 backdrop-blur-sm" onClick={() => questResult !== 'success' && setQuestOpen(null)}><section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-4 border-[#b88b4b]/70 bg-[#f0d49a] text-[#4d2d1b] shadow-[0_25px_80px_rgba(0,0,0,0.65)]" onClick={(event) => event.stopPropagation()}><div className="absolute inset-x-8 top-0 h-2 rounded-b-full bg-[#8e5d31]/60" /><div className="border-b border-[#9f713b]/40 bg-[#d5ad6b]/45 px-6 py-5 text-center"><div className="text-4xl">{activeQuest.icon}</div><p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#82512a]">Quest {activeQuest.number} · {activeQuest.region}</p><h2 className="mt-1 font-serif text-3xl font-black">{activeQuest.title}</h2><p className="mt-2 text-sm font-semibold text-[#704423]">{activeQuest.gate}</p></div><div className="space-y-4 px-6 py-5 sm:px-9"><p className="font-serif text-lg leading-7">{activeQuest.prompt}</p><div className="rounded-xl border border-[#a6753c]/50 bg-[#f8e7bd]/75 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-[#86542b]">Pista no diário</p><p className="mt-1 text-sm leading-6">{clues.includes(activeQuest.id) ? activeQuest.clue : `Pista bloqueada. ${activeQuest.sources}`}</p></div><div className="grid gap-2">{activeQuest.options.map((option) => <button key={option.id} type="button" disabled={!clues.includes(activeQuest.id) || questResult === 'success'} onClick={() => { setQuestAnswer(option.id); setQuestResult('idle') }} className={`rounded-xl border-2 p-3 text-left transition ${questAnswer === option.id ? 'border-[#704423] bg-[#d4a45f]/55' : 'border-[#b88b4b]/45 bg-[#f7e3b3]/70 hover:border-[#86542b]'} disabled:cursor-not-allowed disabled:opacity-50`}><span className="block font-bold">{option.label}</span><span className="mt-1 block text-xs text-[#704423]/80">{option.detail}</span></button>)}</div>{questResult === 'error' && <p role="alert" className="rounded-xl border border-rose-800/30 bg-rose-100/60 p-3 text-sm font-bold text-rose-900">A resposta ainda não abre o portão. Use a pista da região e associe o conceito ao comportamento correto.</p>}{questResult === 'success' && <p className="rounded-xl border border-emerald-800/30 bg-emerald-100/65 p-3 text-sm font-bold text-emerald-900">Quest concluída! O portão foi aberto. Recompensa: +{activeQuest.reward} XP.</p>}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setQuestOpen(null)} className="rounded-xl border border-[#8e5d31]/50 px-4 py-2 text-sm font-bold text-[#704423] hover:bg-[#e4bd7d]/50">{questResult === 'success' ? 'Atravessar portão' : 'Fechar pergaminho'}</button>{questResult !== 'success' && <button type="button" disabled={!questAnswer || !clues.includes(activeQuest.id)} onClick={submitQuest} className="rounded-xl bg-[#704423] px-5 py-2 text-sm font-black text-[#f8e7bd] shadow-lg disabled:cursor-not-allowed disabled:opacity-40">Validar resposta ✦</button>}</div></div><div className="h-3 bg-[#b98a4a]/45" /></section></div>}
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
