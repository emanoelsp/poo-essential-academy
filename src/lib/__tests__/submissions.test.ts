import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Firebase SDK — we assert on what createSubmission writes, without a
// real Firestore. `doc` returns a lightweight ref so we can inspect the id.
vi.mock('firebase/firestore', () => ({
  doc:             vi.fn((_db: unknown, col: string, id: string) => ({ col, id })),
  setDoc:          vi.fn(),
  updateDoc:       vi.fn(),
  serverTimestamp: vi.fn(() => '__server_ts__'),
  collection:      vi.fn(),
  query:           vi.fn(),
  where:           vi.fn(),
  onSnapshot:      vi.fn(),
  getDoc:          vi.fn(),
  getDocs:         vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  getFirebaseDb: () => ({}),
}))

import { setDoc } from 'firebase/firestore'
import { createSubmission } from '@/lib/firestore'

describe('Cenário 1 — aluno finaliza o desafio do módulo 1 e posta o link do Git', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria uma submissão PENDENTE com o link do Git, sem creditar XP', async () => {
    await createSubmission({
      uid:             'aluno-123',
      studentName:     'Ana Aluna',
      studentEmail:    'ana@edu.sc.senai.br',
      slug:            'desafio-m01',
      encounterNumber: 0,
      encounterTitle:  '⚔️ Desafio do Módulo 1 — JOptionPane + Fundamentos',
      module:          1,
      xp:              120,
      proofUrl:        'https://github.com/ana/poo-desafio-m01',
    })

    expect(setDoc).toHaveBeenCalledTimes(1)
    const [ref, data] = vi.mocked(setDoc).mock.calls[0] as unknown as [
      { id: string },
      Record<string, unknown>,
    ]

    // ID determinístico impede duplicatas por aluno/desafio
    expect(ref.id).toBe('aluno-123_desafio-m01')

    // Fica PENDENTE — o XP só será atribuído após a validação do professor
    expect(data.status).toBe('pending')
    expect(data.proofUrl).toBe('https://github.com/ana/poo-desafio-m01')
    expect(data.xp).toBe(120)
    expect(data.module).toBe(1)
    expect(data.uid).toBe('aluno-123')
    expect(data.reviewedAt).toBeNull()
    expect(data.reviewedBy).toBeNull()

    // Campos opcionais vazios não são gravados (Firestore rejeita undefined)
    expect(data).not.toHaveProperty('badgeId')
    expect(data).not.toHaveProperty('note')
  })

  it('inclui observação e badge quando informados', async () => {
    await createSubmission({
      uid:             'aluno-123',
      studentName:     'Ana Aluna',
      studentEmail:    'ana@edu.sc.senai.br',
      slug:            'encontro-01',
      encounterNumber: 1,
      encounterTitle:  'Introdução',
      module:          1,
      xp:              50,
      badgeId:         'hello_world',
      proofUrl:        'https://github.com/ana/e01',
      note:            'Fiz os 5 exercícios extras.',
    })

    const [, data] = vi.mocked(setDoc).mock.calls[0] as unknown as [
      unknown,
      Record<string, unknown>,
    ]
    expect(data.badgeId).toBe('hello_world')
    expect(data.note).toBe('Fiz os 5 exercícios extras.')
  })
})
