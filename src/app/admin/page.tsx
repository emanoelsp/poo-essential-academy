'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import {
  getAllStudents,
  getAllProgress,
  saveModuleSettings,
  type UserProfile,
  type UserProgress,
} from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Lock, Unlock, BookOpen, Coins, Zap, ExternalLink, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TOTAL_ENCOUNTERS = CURRICULUM.reduce((s, m) => s + m.encounters.length, 0)

type StudentRow = UserProfile & { progress: UserProgress }

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { moduleSettings, contentSettings } = useSettings()

  const [students, setStudents]     = useState<StudentRow[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [locked, setLocked]         = useState<string[]>([])
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    setLocked(moduleSettings.lockedModules)
  }, [moduleSettings.lockedModules])

  useEffect(() => {
    Promise.all([getAllStudents(), getAllProgress()]).then(([allStudents, allProgress]) => {
      const progressMap = Object.fromEntries(allProgress.map((p) => [p.uid, p]))
      const rows: StudentRow[] = allStudents
        .filter((s) => s.role === 'student')
        .map((s) => ({
          ...s,
          progress: progressMap[s.uid] ?? {
            xp: 0, level: 1, levelName: 'Iniciante',
            badges: [], streak: 0, lastLoginDate: null,
            completedEncounters: [], coins: 0, challengeProgress: {},
            updatedAt: null,
          },
        }))
        .sort((a, b) => (b.progress.xp ?? 0) - (a.progress.xp ?? 0))
      setStudents(rows)
      setLoadingData(false)
    })
  }, [])

  const toggle = (slug: string) =>
    setLocked((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])

  const hasChanges =
    JSON.stringify([...locked].sort()) !== JSON.stringify([...moduleSettings.lockedModules].sort())

  const save = async () => {
    setSaving(true)
    try {
      await saveModuleSettings({ lockedModules: locked })
      toast.success('Módulos atualizados!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const totalCoins  = students.reduce((s, r) => s + (r.progress.coins ?? 0), 0)
  const lockedCount = locked.length

  const stats = [
    {
      label: 'Alunos no sistema',
      value: students.length,
      icon: Users,
      color: 'text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Módulos bloqueados',
      value: `${lockedCount} / ${CURRICULUM.length}`,
      icon: Lock,
      color: lockedCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400',
    },
    {
      label: 'Gabarito global',
      value: contentSettings.gabaritoHidden ? 'Oculto' : 'Visível',
      icon: BookOpen,
      color: contentSettings.gabaritoHidden
        ? 'text-red-700 dark:text-red-400'
        : 'text-green-700 dark:text-green-400',
    },
    {
      label: 'Coins distribuídos',
      value: totalCoins,
      icon: Coins,
      color: 'text-amber-700 dark:text-amber-400',
    },
  ]

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Olá, {profile?.displayName}. Gerencie o curso de POO.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <s.icon size={22} className={s.color} />
              <div>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* ── Module management ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Módulos</CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setLocked([])}
                >
                  <Unlock size={12} /> Liberar todos
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setLocked(CURRICULUM.map((m) => m.slug))}
                >
                  <Lock size={12} /> Bloquear todos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {CURRICULUM.map((m) => {
              const isLocked = locked.includes(m.slug)
              return (
                <button
                  key={m.slug}
                  onClick={() => toggle(m.slug)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
                    isLocked
                      ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30'
                      : 'bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                  )}
                >
                  {isLocked
                    ? <Lock size={14} className="text-red-600 dark:text-red-400 shrink-0" />
                    : <Unlock size={14} className="text-green-700 dark:text-green-400 shrink-0" />}
                  <span className="font-medium flex-1">
                    M{m.number} · {m.title}
                  </span>
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                    isLocked
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )}>
                    {isLocked ? 'Bloqueado' : 'Liberado'}
                  </span>
                </button>
              )
            })}

            {hasChanges && (
              <div className="pt-2">
                <Button onClick={save} disabled={saving} size="sm" className="w-full gap-2">
                  <Save size={14} />
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Student progress ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progresso dos Alunos</CardTitle>
              <Link href="/admin/alunos">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <ExternalLink size={12} /> Detalhes
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Nenhum aluno cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {students.map((s) => {
                  const completed = s.progress.completedEncounters?.length ?? 0
                  const pct = Math.round((completed / TOTAL_ENCOUNTERS) * 100)
                  return (
                    <div key={s.uid} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {s.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photoURL} alt="" className="h-7 w-7 rounded-full shrink-0 object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[11px] font-bold">
                            {s.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{s.displayName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap size={11} className="text-blue-700 dark:text-blue-400" />
                            {s.progress.xp} XP
                          </span>
                          <span className="text-xs font-semibold w-10 text-right text-muted-foreground">
                            {completed}/{TOTAL_ENCOUNTERS}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden ml-9">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            pct === 100 ? 'bg-green-500' : 'bg-primary'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
