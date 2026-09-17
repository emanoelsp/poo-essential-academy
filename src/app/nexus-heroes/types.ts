// Shared types for Nexus Heroes 3D game

export type CellType = '_' | 'W' | 'C' | 'M' | 'H' | 'T' | 'E' | 'P' | 'S'
export type HeroClass = 'guerreiro' | 'mago'
export type LogType = 'instanciacao' | 'invariante' | 'excecao' | 'override' | 'info'
export type GamePhase = 'select' | 'playing' | 'victory' | 'defeat'

export interface HeroState {
  name: string
  class: HeroClass
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  atk: number
  matk: number
  level: number
  xp: number
  coins: number
  passos: number
  row: number
  col: number
}

export interface EnemyState {
  id: number
  row: number
  col: number
  hp: number
  maxHp: number
  atk: number
  alive: boolean
  tier: 1 | 2
}

export interface LogEntry {
  id: number
  type: LogType
  message: string
}

export type Grid = CellType[][]

export interface Vec2 {
  row: number
  col: number
}

export interface DmgEvent {
  id: number
  amount: number
  positive: boolean
  row: number
  col: number
}
