'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  watchModuleSettings,
  watchContentSettings,
  type ModuleSettings,
  type ContentSettings,
} from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'

interface SettingsContextType {
  moduleSettings: ModuleSettings
  contentSettings: ContentSettings
  isModuleLocked: (slug: string) => boolean
  isGabaritoVisible: (encounterSlug?: string) => boolean
}

const DEFAULT_MODULE:  ModuleSettings  = { lockedModules: [] }
const DEFAULT_CONTENT: ContentSettings = { gabaritoHidden: false, hiddenEncounters: [] }

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [moduleSettings,  setModuleSettings]  = useState<ModuleSettings>(DEFAULT_MODULE)
  const [contentSettings, setContentSettings] = useState<ContentSettings>(DEFAULT_CONTENT)

  useEffect(() => {
    // Only subscribe when authenticated — avoids permission-denied errors
    if (!user) {
      setModuleSettings(DEFAULT_MODULE)
      setContentSettings(DEFAULT_CONTENT)
      return
    }

    const unsubModules  = watchModuleSettings(setModuleSettings)
    const unsubContent  = watchContentSettings(setContentSettings)
    return () => { unsubModules(); unsubContent() }
  }, [user])

  const isModuleLocked = (slug: string) =>
    moduleSettings.lockedModules.includes(slug)

  const isGabaritoVisible = (encounterSlug?: string) => {
    if (contentSettings.gabaritoHidden) return false
    if (encounterSlug && contentSettings.hiddenEncounters.includes(encounterSlug)) return false
    return true
  }

  return (
    <SettingsContext.Provider value={{ moduleSettings, contentSettings, isModuleLocked, isGabaritoVisible }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
