import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'

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
  updatedAt: null,
})

export async function getUserProgress(uid: string): Promise<UserProgress> {
  const db   = getFirebaseDb()
  const snap = await getDoc(doc(db, 'progress', uid))
  return snap.exists() ? (snap.data() as UserProgress) : defaultProgress()
}

export async function saveUserProgress(uid: string, progress: Partial<UserProgress>) {
  const db = getFirebaseDb()
  await setDoc(
    doc(db, 'progress', uid),
    { ...progress, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export function watchUserProgress(uid: string, cb: (p: UserProgress) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'progress', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProgress) : defaultProgress())
  })
}

export async function getAllProgress(): Promise<(UserProgress & { uid: string })[]> {
  const db   = getFirebaseDb()
  const snap = await getDocs(collection(db, 'progress'))
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as UserProgress) }))
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
