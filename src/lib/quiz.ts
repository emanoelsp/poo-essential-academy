import {
  doc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import { getQuizQuestions } from '@/content/data/quizQuestions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizStatus = 'waiting' | 'question' | 'reveal' | 'finished'

export interface QuizSession {
  id: string
  code: string
  slug: string
  status: QuizStatus
  currentQuestion: number
  questionStartedAt: number | null
  totalQuestions: number
  createdAt: number
  createdBy: string
}

export interface QuizPlayer {
  id: string
  nickname: string
  score: number
  combo: number
  maxCombo: number
  lastCorrect: boolean
  joinedAt: number
}

export interface QuizAnswer {
  playerId: string
  nickname: string
  answerIndex: number
  correct: boolean
  timeMs: number
  pointsEarned: number
  combo: number
  answeredAt: number
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function comboMultiplier(combo: number): number {
  if (combo >= 4) return 1.3
  if (combo === 3) return 1.2
  if (combo === 2) return 1.1
  return 1.0
}

export function calculatePoints(correct: boolean, timeMs: number, combo: number): number {
  if (!correct) return 0
  const base = 1000
  const speed = Math.round(Math.max(0, 1 - timeMs / 20000) * 500)
  return Math.round((base + speed) * comboMultiplier(combo))
}

export function comboLabel(combo: number): string | null {
  if (combo >= 4) return `🔥🔥🔥 x${combo} EM CHAMAS!`
  if (combo === 3) return '🔥🔥 Três seguidas!'
  if (combo === 2) return '🔥 Combo x2!'
  return null
}

// ─── Code generation ──────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Session management ───────────────────────────────────────────────────────

export async function createQuizSession(slug: string, adminUid: string): Promise<QuizSession> {
  const db = getFirebaseDb()
  const id = `${slug}-${Date.now()}`
  const code = generateCode()
  const questions = getQuizQuestions(slug)

  const session: QuizSession = {
    id,
    code,
    slug,
    status: 'waiting',
    currentQuestion: 0,
    questionStartedAt: null,
    totalQuestions: questions.length,
    createdAt: Date.now(),
    createdBy: adminUid,
  }
  await setDoc(doc(db, 'quizSessions', id), session)
  return session
}

export async function findSessionByCode(code: string): Promise<QuizSession | null> {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'quizSessions'),
    where('code', '==', code.toUpperCase()),
    where('status', 'in', ['waiting', 'question', 'reveal'])
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as QuizSession
}

export async function joinSession(sessionId: string, playerId: string, nickname: string): Promise<void> {
  const db = getFirebaseDb()
  const player: QuizPlayer = {
    id: playerId,
    nickname,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lastCorrect: false,
    joinedAt: Date.now(),
  }
  await setDoc(doc(db, 'quizSessions', sessionId, 'players', playerId), player)
}

export async function startQuiz(sessionId: string): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'quizSessions', sessionId), {
    status: 'question',
    currentQuestion: 0,
    questionStartedAt: Date.now(),
  })
}

export async function revealQuestion(sessionId: string): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'quizSessions', sessionId), { status: 'reveal' })
}

export async function nextQuestion(sessionId: string, nextIndex: number, total: number): Promise<void> {
  const db = getFirebaseDb()
  if (nextIndex >= total) {
    await updateDoc(doc(db, 'quizSessions', sessionId), { status: 'finished' })
  } else {
    await updateDoc(doc(db, 'quizSessions', sessionId), {
      status: 'question',
      currentQuestion: nextIndex,
      questionStartedAt: Date.now(),
    })
  }
}

export async function finishQuiz(sessionId: string): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'quizSessions', sessionId), { status: 'finished' })
}

// ─── Answer submission ────────────────────────────────────────────────────────

export async function submitAnswer(
  sessionId: string,
  player: QuizPlayer,
  qIndex: number,
  answerIndex: number,
  correct: boolean,
  timeMs: number
): Promise<void> {
  const db = getFirebaseDb()
  const newCombo = correct ? player.combo + 1 : 0
  const points = calculatePoints(correct, timeMs, player.combo + (correct ? 1 : 0))
  const newScore = player.score + points
  const newMaxCombo = Math.max(player.maxCombo, newCombo)

  const answerId = `${qIndex}_${player.id}`
  const answer: QuizAnswer = {
    playerId: player.id,
    nickname: player.nickname,
    answerIndex,
    correct,
    timeMs,
    pointsEarned: points,
    combo: newCombo,
    answeredAt: Date.now(),
  }

  await Promise.all([
    setDoc(doc(db, 'quizSessions', sessionId, 'answers', answerId), answer),
    updateDoc(doc(db, 'quizSessions', sessionId, 'players', player.id), {
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      lastCorrect: correct,
    }),
  ])
}

// ─── Watchers ────────────────────────────────────────────────────────────────

export function watchSession(sessionId: string, cb: (s: QuizSession | null) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(
    doc(db, 'quizSessions', sessionId),
    (snap) => cb(snap.exists() ? (snap.data() as QuizSession) : null),
    () => cb(null)
  )
}

export function watchPlayers(sessionId: string, cb: (players: QuizPlayer[]) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(
    collection(db, 'quizSessions', sessionId, 'players'),
    (snap) => cb(snap.docs.map((d) => d.data() as QuizPlayer).sort((a, b) => b.score - a.score)),
    () => cb([])
  )
}

export function watchAnswersForQuestion(
  sessionId: string,
  qIndex: number,
  cb: (answers: QuizAnswer[]) => void
): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(
    query(
      collection(db, 'quizSessions', sessionId, 'answers'),
      where('answeredAt', '>', 0)
    ),
    (snap) => {
      const all = snap.docs.map((d) => d.data() as QuizAnswer)
      cb(all.filter((a) => {
        const parts = snap.docs.find((d) => d.data().playerId === a.playerId && d.id.startsWith(`${qIndex}_`))
        return !!parts
      }))
    },
    () => cb([])
  )
}

export function watchAnswersForQuestionDirect(
  sessionId: string,
  qIndex: number,
  cb: (answers: QuizAnswer[]) => void
): Unsubscribe {
  const db = getFirebaseDb()
  const colRef = collection(db, 'quizSessions', sessionId, 'answers')
  return onSnapshot(
    colRef,
    (snap) => {
      const answers = snap.docs
        .filter((d) => d.id.startsWith(`${qIndex}_`))
        .map((d) => d.data() as QuizAnswer)
      cb(answers)
    },
    () => cb([])
  )
}
