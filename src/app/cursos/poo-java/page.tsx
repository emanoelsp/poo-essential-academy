'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CURRICULUM } from '@/content/data/curriculum'
import { EncounterCard } from '@/components/features/course/EncounterCard'
import { Badge } from '@/components/ui/badge'
import { CourseProgressBar } from '@/components/features/course/CourseProgressBar'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { cn } from '@/lib/utils'
import { Lock, Gift } from 'lucide-react'

export default function CoursePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isModuleLocked } = useSettings()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const mainModules  = CURRICULUM.filter((m) => m.number <= 6)
  const bonusModules = CURRICULUM.filter((m) => m.number > 6)

  const totalEncounters = mainModules.reduce((s, m) => s + m.encounters.length, 0)
  const totalXP = mainModules.reduce(
    (s, m) => s + m.encounters.reduce((es, e) => es + e.xp, 0), 0
  )

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">Java · POO</Badge>
          <Badge variant="secondary">{totalEncounters} encontros</Badge>
          <Badge variant="secondary">{totalXP} XP disponíveis</Badge>
        </div>
        <h1 className="text-3xl font-black">Programação Orientada a Objetos em Java</h1>
        <p className="text-muted-foreground max-w-2xl">
          20 encontros em 6 módulos. Teoria, UML, código comentado e exercícios práticos com gamificação.
        </p>
        <CourseProgressBar totalEncounters={totalEncounters} />
      </div>

      {/* Main modules 1–6 */}
      <div className="space-y-8">
        {mainModules.map((module) => {
          const locked = isModuleLocked(module.slug)
          return (
            <section key={module.slug} className="space-y-3">
              <div className={cn(
                'rounded-xl bg-gradient-to-r p-4 text-white relative overflow-hidden',
                module.color,
                locked && 'opacity-60'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium opacity-75 uppercase tracking-wide mb-0.5">
                      Módulo {module.number}
                    </p>
                    <h2 className="font-bold text-lg leading-tight flex items-center gap-2">
                      {module.title}
                      {locked && <Lock size={14} className="opacity-80" />}
                    </h2>
                    <p className="text-sm opacity-80 mt-1 leading-relaxed">{module.description}</p>
                  </div>
                  <span className="text-3xl opacity-30 font-black select-none shrink-0">
                    {String(module.number).padStart(2, '0')}
                  </span>
                </div>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                    <span className="text-xs font-semibold bg-black/40 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Lock size={11} /> Módulo bloqueado pelo professor
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2 pl-2">
                {module.encounters.map((encounter) => (
                  <EncounterCard key={encounter.slug} encounter={encounter} locked={locked} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Bonus modules */}
      {bonusModules.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Gift size={15} className="text-teal-500" />
              Conteúdo Extra
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          {bonusModules.map((module) => (
            <section key={module.slug} className="space-y-3">
              <div className={cn(
                'rounded-xl bg-gradient-to-r p-4 text-white relative overflow-hidden',
                module.color
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Bônus
                      </span>
                    </div>
                    <h2 className="font-bold text-lg leading-tight">{module.title}</h2>
                    <p className="text-sm opacity-80 mt-1 leading-relaxed">{module.description}</p>
                  </div>
                  <Gift size={28} className="opacity-30 shrink-0 mt-1" />
                </div>
              </div>
              <div className="space-y-2 pl-2">
                {module.encounters.map((encounter) => (
                  <EncounterCard key={encounter.slug} encounter={encounter} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
