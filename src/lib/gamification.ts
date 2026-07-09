import type { Badge, Level } from '@/types'

export const XP_VALUES = {
  COMPLETE_ENCOUNTER: 50,
  COMPLETE_EXERCISE: 25,
  SUBMIT_TP: 150,
  COMPLETE_MODULE: 100,
  DAILY_LOGIN: 10,
  FIRST_LOGIN: 30,
} as const

export const LEVELS: Level[] = [
  { level: 1, name: 'Iniciante',    xpRequired: 0,    color: 'text-slate-500' },
  { level: 2, name: 'Aprendiz',     xpRequired: 200,  color: 'text-green-500' },
  { level: 3, name: 'Desenvolvedor',xpRequired: 500,  color: 'text-blue-500'  },
  { level: 4, name: 'Arquiteto',    xpRequired: 1000, color: 'text-purple-500'},
  { level: 5, name: 'Expert POO',   xpRequired: 2000, color: 'text-amber-500' },
]

export const BADGES: Badge[] = [
  {
    id: 'hello_world',
    name: 'Olá, Mundo!',
    description: 'Completou o primeiro encontro do curso.',
    icon: '🌍',
    xpBonus: 50,
    condition: 'complete_encounter_01',
  },
  {
    id: 'method_master',
    name: 'Mestre dos Métodos',
    description: 'Dominou sobrecarga, escopo e passagem por valor.',
    icon: '⚙️',
    xpBonus: 50,
    condition: 'complete_encounter_02',
  },
  {
    id: 'oo_mind',
    name: 'Mente Orientada',
    description: 'Fez a transição do paradigma procedural para POO.',
    icon: '🧠',
    xpBonus: 75,
    condition: 'complete_encounter_03',
  },
  {
    id: 'class_architect',
    name: 'Arquiteto de Classes',
    description: 'Concluiu o Módulo 2 — domínio de Classes e Objetos.',
    icon: '🏗️',
    xpBonus: 100,
    condition: 'complete_module_02',
  },
  {
    id: 'state_guardian',
    name: 'Guardião do Estado',
    description: 'Implementou encapsulamento e invariantes de classe.',
    icon: '🔒',
    xpBonus: 75,
    condition: 'complete_encounter_08',
  },
  {
    id: 'exam_survivor',
    name: 'Avaliação Superada',
    description: 'Passou pela Prova Objetiva com êxito.',
    icon: '📝',
    xpBonus: 100,
    condition: 'complete_encounter_10',
  },
  {
    id: 'inheritance_approved',
    name: 'Herança Aprovada',
    description: 'Concluiu o Módulo 4 — domínio de Herança e Classes Abstratas.',
    icon: '🧬',
    xpBonus: 100,
    condition: 'complete_module_04',
  },
  {
    id: 'polymorphist',
    name: 'Polimorfista',
    description: 'Dominou Polimorfismo, Interfaces e LSP.',
    icon: '🎭',
    xpBonus: 100,
    condition: 'complete_module_05',
  },
  {
    id: 'architectural_defender',
    name: 'Defensor Arquitetural',
    description: 'Apresentou e defendeu seu projeto final com sucesso.',
    icon: '🎤',
    xpBonus: 150,
    condition: 'complete_encounter_20',
  },
  {
    id: 'poo_expert',
    name: 'Expert POO',
    description: 'Completou todos os 20 encontros do curso.',
    icon: '🏆',
    xpBonus: 300,
    condition: 'complete_all',
  },
]

export function getLevelFromXP(xp: number): Level {
  return [...LEVELS].reverse().find((l) => xp >= l.xpRequired) ?? LEVELS[0]
}

export function getNextLevel(currentLevel: number): Level | null {
  return LEVELS.find((l) => l.level === currentLevel + 1) ?? null
}

export function getXPProgressPercent(xp: number): number {
  const current = getLevelFromXP(xp)
  const next = getNextLevel(current.level)
  if (!next) return 100
  const range = next.xpRequired - current.xpRequired
  const earned = xp - current.xpRequired
  return Math.min(Math.round((earned / range) * 100), 100)
}
