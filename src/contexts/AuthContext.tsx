'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getOrCreateUserProfile, isAdminEmail, type UserProfile } from '@/lib/firestore'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Mark session for middleware — blocks crawlers from SSG pages
        document.cookie = '__poo_session=1; path=/; SameSite=Strict; max-age=43200'
        try {
          const p = await getOrCreateUserProfile(
            firebaseUser.uid,
            firebaseUser.email ?? '',
            firebaseUser.displayName ?? '',
            firebaseUser.photoURL
          )
          setProfile(p)
        } catch {
          setProfile(null)
        }
      } else {
        // Clear session cookie on sign-out
        document.cookie = '__poo_session=; path=/; max-age=0'
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    const p = await getOrCreateUserProfile(
      cred.user.uid,
      cred.user.email ?? '',
      cred.user.displayName ?? '',
      cred.user.photoURL
    )
    setProfile(p)
  }

  const registerWithEmail = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
    await updateProfile(cred.user, { displayName: name })
    const p = await getOrCreateUserProfile(cred.user.uid, email, name, null)
    setProfile(p)
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(getFirebaseAuth(), googleProvider)
    const p = await getOrCreateUserProfile(
      cred.user.uid,
      cred.user.email ?? '',
      cred.user.displayName ?? '',
      cred.user.photoURL
    )
    setProfile(p)
  }

  const logout = async () => {
    await signOut(getFirebaseAuth())
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: !!user && isAdminEmail(user.email ?? ''),
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
