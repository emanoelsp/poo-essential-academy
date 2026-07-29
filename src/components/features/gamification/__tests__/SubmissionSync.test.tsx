import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import type { Submission } from '@/types'

// Capture the callback SubmissionSync registers, so the test can simulate the
// teacher's approval landing in real time via Firestore.
const hooks = vi.hoisted(() => ({
  cb: null as null | ((subs: Submission[]) => void),
}))

vi.mock('@/lib/firestore', () => ({
  watchUserSubmissions: (_uid: string, cb: (subs: Submission[]) => void) => {
    hooks.cb = cb
    return () => {}
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'aluno-123' } }),
}))

import { SubmissionSync } from '@/components/features/gamification/SubmissionSync'
import { useGamificationStore } from '@/stores/gamificationStore'

const makeSub = (over: Partial<Submission>): Submission => ({
  id:              'aluno-123_desafio-m01',
  uid:             'aluno-123',
  studentName:     'Ana Aluna',
  studentEmail:    'ana@edu.sc.senai.br',
  slug:            'desafio-m01',
  encounterNumber: 0,
  encounterTitle:  'Desafio do Módulo 1',
  module:          1,
  xp:              120,
  proofUrl:        'https://github.com/ana/poo-desafio-m01',
  status:          'pending',
  createdAt:       null,
  ...over,
})

describe('Cenário 2 — professor aprova o envio e o XP é atribuído', () => {
  beforeEach(() => {
    localStorage.clear()
    useGamificationStore.setState({
      xp: 0, level: 1, levelName: 'Iniciante', badges: [], streak: 0,
      lastLoginDate: null, pendingEvents: [], completedEncounters: [],
      coins: 0, challengeProgress: {}, weeklyPresence: [],
    })
    hooks.cb = null
  })

  it('não credita XP enquanto a submissão está PENDENTE', () => {
    render(<SubmissionSync />)
    act(() => hooks.cb!([makeSub({ status: 'pending' })]))

    const s = useGamificationStore.getState()
    expect(s.xp).toBe(0)
    expect(s.completedEncounters).not.toContain('desafio-m01')
  })

  it('credita os 120 XP e marca o desafio concluído quando APROVADO', () => {
    render(<SubmissionSync />)
    act(() => hooks.cb!([makeSub({ status: 'approved' })]))

    const s = useGamificationStore.getState()
    expect(s.xp).toBe(120)
    expect(s.completedEncounters).toContain('desafio-m01')
    expect(s.coins).toBe(10) // COIN_VALUES.complete_encounter
  })

  it('é idempotente — reprocessar a aprovação não dobra o XP', () => {
    render(<SubmissionSync />)
    const approved = [makeSub({ status: 'approved' })]
    act(() => hooks.cb!(approved))
    act(() => hooks.cb!(approved))

    expect(useGamificationStore.getState().xp).toBe(120)
  })

  it('concede o badge quando a submissão aprovada tem badgeId', () => {
    render(<SubmissionSync />)
    act(() => hooks.cb!([makeSub({ status: 'approved', slug: 'encontro-01', badgeId: 'hello_world' })]))

    expect(useGamificationStore.getState().badges).toContain('hello_world')
  })
})
