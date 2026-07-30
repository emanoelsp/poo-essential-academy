import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import { deriveTotals } from './gamification'
import type { Submission, SubmissionStatus } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: 'admin' | 'student'
  createdAt: unknown
}

export interface UserProgress {
  xp: number
  level: number
  levelName: string
  badges: string[]
  streak: number
  lastLoginDate: string | null
  completedEncounters: string[]
  coins: number
  challengeProgress?: Record<string, { completedTaskIds: string[]; totalCoins: number }>
  weeklyPresence?: string[]
  updatedAt: unknown
}

export interface ModuleSettings {
  lockedModules: string[]
}

export interface ContentSettings {
  gabaritoHidden: boolean
  hiddenEncounters: string[]
}

// ─── User profiles ────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['emanoel.spanhol@edu.sc.senai.br']

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null
): Promise<UserProfile> {
  const db   = getFirebaseDb()
  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  const role: 'admin' | 'student' = isAdminEmail(email) ? 'admin' : 'student'

  if (snap.exists()) {
    const existing = snap.data() as UserProfile
    // Sync role if it changed (e.g. email added to ADMIN_EMAILS)
    if (existing.role !== role) {
      await updateDoc(ref, { role })
      return { ...existing, role }
    }
    return existing
  }

  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    photoURL,
    role,
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, profile)
  return profile
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db   = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function getAllStudents(): Promise<UserProfile[]> {
  const db   = getFirebaseDb()
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => d.data() as UserProfile)
}

export async function setUserRole(uid: string, role: 'admin' | 'student') {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'users', uid), { role })
}

// ─── User progress ────────────────────────────────────────────────────────────

const defaultProgress = (): UserProgress => ({
  xp: 0,
  level: 1,
  levelName: 'Iniciante',
  badges: [],
  streak: 0,
  lastLoginDate: null,
  completedEncounters: [],
  coins: 0,
  challengeProgress: {},
  weeklyPresence: [],
  updatedAt: null,
})

// xp / level / levelName / coins are NEVER trusted from storage — they are
// recomputed from the stored source facts so a tampered document is inert.
function normalizeProgress(raw: Partial<UserProgress>): UserProgress {
  const base = { ...defaultProgress(), ...raw }
  return {
    ...base,
    ...deriveTotals({
      completedEncounters: base.completedEncounters ?? [],
      badges:              base.badges ?? [],
      challengeProgress:   base.challengeProgress ?? {},
    }),
  }
}

// Fields that are derived on read and must never be written by clients.
const DERIVED_FIELDS = ['xp', 'level', 'levelName', 'coins'] as const

export async function getUserProgress(uid: string): Promise<UserProgress> {
  const db   = getFirebaseDb()
  const snap = await getDoc(doc(db, 'progress', uid))
  return normalizeProgress(snap.exists() ? (snap.data() as UserProgress) : defaultProgress())
}

export async function saveUserProgress(uid: string, progress: Partial<UserProgress>) {
  const db = getFirebaseDb()
  // Strip derived fields — they are computed on read, never persisted.
  const safe: Record<string, unknown> = { ...progress }
  for (const f of DERIVED_FIELDS) delete safe[f]
  await setDoc(
    doc(db, 'progress', uid),
    { ...safe, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export function watchUserProgress(uid: string, cb: (p: UserProgress) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'progress', uid), (snap) => {
    cb(normalizeProgress(snap.exists() ? (snap.data() as UserProgress) : defaultProgress()))
  })
}

export async function getAllProgress(): Promise<(UserProgress & { uid: string })[]> {
  const db   = getFirebaseDb()
  const snap = await getDocs(collection(db, 'progress'))
  return snap.docs.map((d) => ({ uid: d.id, ...normalizeProgress(d.data() as UserProgress) }))
}

// ─── Admin settings ───────────────────────────────────────────────────────────

export async function getModuleSettings(): Promise<ModuleSettings> {
  const db   = getFirebaseDb()
  const snap = await getDoc(doc(db, 'settings', 'modules'))
  return snap.exists() ? (snap.data() as ModuleSettings) : { lockedModules: [] }
}

export async function saveModuleSettings(settings: ModuleSettings) {
  const db = getFirebaseDb()
  await setDoc(doc(db, 'settings', 'modules'), settings)
}

export function watchModuleSettings(cb: (s: ModuleSettings) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'settings', 'modules'), (snap) => {
    cb(snap.exists() ? (snap.data() as ModuleSettings) : { lockedModules: [] })
  })
}

export async function getContentSettings(): Promise<ContentSettings> {
  const db   = getFirebaseDb()
  const snap = await getDoc(doc(db, 'settings', 'content'))
  return snap.exists()
    ? (snap.data() as ContentSettings)
    : { gabaritoHidden: false, hiddenEncounters: [] }
}

export async function saveContentSettings(settings: ContentSettings) {
  const db = getFirebaseDb()
  await setDoc(doc(db, 'settings', 'content'), settings)
}

export function watchContentSettings(cb: (s: ContentSettings) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'settings', 'content'), (snap) => {
    cb(
      snap.exists()
        ? (snap.data() as ContentSettings)
        : { gabaritoHidden: false, hiddenEncounters: [] }
    )
  })
}

// ─── Challenge submissions (teacher validation queue) ──────────────────────────

const submissionId = (uid: string, slug: string) => `${uid}_${slug}`

export interface CreateSubmissionInput {
  uid: string
  studentName: string
  studentEmail: string
  slug: string
  encounterNumber: number
  encounterTitle: string
  module: number
  xp: number
  badgeId?: string
  proofUrl: string
  note?: string
}

// Student submits (or re-submits) a challenge for teacher validation.
export async function createSubmission(input: CreateSubmissionInput) {
  const db = getFirebaseDb()
  const id = submissionId(input.uid, input.slug)
  // Firestore rejects `undefined` values — only include optional fields when set.
  const data: Record<string, unknown> = {
    id,
    uid:             input.uid,
    studentName:     input.studentName,
    studentEmail:    input.studentEmail,
    slug:            input.slug,
    encounterNumber: input.encounterNumber,
    encounterTitle:  input.encounterTitle,
    module:          input.module,
    xp:              input.xp,
    proofUrl:        input.proofUrl,
    status:          'pending' as SubmissionStatus,
    createdAt:       serverTimestamp(),
    reviewedAt:      null,
    reviewedBy:      null,
    reviewNote:      null,
  }
  if (input.badgeId) data.badgeId = input.badgeId
  if (input.note)    data.note    = input.note
  await setDoc(doc(db, 'submissions', id), data)
}

// Watch a single student's submission for one challenge.
export function watchSubmission(
  uid: string,
  slug: string,
  cb: (s: Submission | null) => void
): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(
    doc(db, 'submissions', submissionId(uid, slug)),
    (snap) => cb(snap.exists() ? (snap.data() as Submission) : null),
    () => cb(null)
  )
}

// Watch all submissions for one student (used to apply XP once approved).
export function watchUserSubmissions(uid: string, cb: (s: Submission[]) => void): Unsubscribe {
  const db = getFirebaseDb()
  const q  = query(collection(db, 'submissions'), where('uid', '==', uid))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Submission)), () => cb([]))
}

// Watch the whole validation queue (admin only).
export function watchAllSubmissions(cb: (s: Submission[]) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(
    collection(db, 'submissions'),
    (snap) => cb(snap.docs.map((d) => d.data() as Submission)),
    () => cb([])
  )
}

// Teacher approves or rejects a submission.
export async function reviewSubmission(
  id: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string,
  reviewNote?: string
) {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'submissions', id), {
    status:     decision,
    reviewedAt: serverTimestamp(),
    reviewedBy,
    reviewNote: reviewNote ?? null,
  })
}
