'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CURRICULUM } from '@/content/data/curriculum'
import { EncounterCard } from '@/components/features/course/EncounterCard'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useGamificationStore } from '@/stores/gamificationStore'
import { cn } from '@/lib/utils'
import { Lock, Gift, ArrowRight, BookOpen, CheckCircle2, Map, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'

export default function CoursePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isModuleLocked } = useSettings()
  const completedEncounters = useGamificationStore((s) => s.completedEncounters)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const mainModules  = CURRICULUM.filter((m) => m.number <= 6)
  const bonusModules = CURRICULUM.filter((m) => m.number > 6)

  const totalEncounters = mainModules.reduce((s, m) => s + m.encounters.length, 0)
  const totalXP = mainModules.reduce(
    (s, m) => s + m.encounters.reduce((es, e) => es + e.xp, 0), 0
  )
  const completedMain = completedEncounters.filter((slug) => mainModules.some((m) => m.encounters.some((e) => e.slug === slug))).length
  const coursePercent = Math.round((completedMain / totalEncounters) * 100)
  const nextEncounter = mainModules
    .flatMap((m) => m.encounters.map((e) => ({ encounter: e, locked: isModuleLocked(m.slug) })))
    .find(({ encounter, locked }) => !locked && !completedEncounters.includes(encounter.slug))?.encounter

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:py-10 space-y-10">
      {/* Visual course cover */}
      <section className="mission-glow relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-11">
        <div className="academy-grid absolute inset-0 -z-10 opacity-70" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              <Sparkles size={14} /> Academia de desenvolvimento
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Domine POO. Construa sistemas que pensam em objetos.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Uma jornada prática em Java, UML e arquitetura. Cada encontro é uma missão: aprenda um conceito,
              enfrente um desafio e deixe uma marca no seu projeto.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Java', 'UML', 'Laboratório', 'Gamificação'].map((label) => (
                <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-semibold"><Map size={15} /> Mapa da jornada</span>
              <span className="font-bold text-cyan-300">{coursePercent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 transition-all duration-700" style={{ width: `${Math.max(coursePercent, 3)}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { value: totalEncounters, label: 'encontros' },
                { value: 6, label: 'módulos' },
                { value: totalXP, label: 'XP total' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-black/20 px-2 py-3">
                  <p className="text-xl font-black">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {nextEncounter && (
          <Link
            href={`/cursos/poo-java/encontros/${nextEncounter.slug}`}
            className="group mt-8 flex max-w-xl items-center gap-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 transition hover:border-cyan-200/60 hover:bg-cyan-300/15"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
              <Target size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Próxima missão</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{nextEncounter.title}</p>
            </div>
            <ArrowRight className="shrink-0 text-cyan-300 transition group-hover:translate-x-1" size={19} />
          </Link>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <BookOpen size={14} /> Sua jornada
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Mapa de evolução</h2>
          <p className="mt-1 text-sm text-muted-foreground">Avance pelas fases e transforme teoria em código executável.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <CheckCircle2 size={17} className="text-emerald-500" /> {completedMain}/{totalEncounters} concluídos
        </div>
      </div>

      {/* Main modules 1–6 */}
      <div className="space-y-8">
        {mainModules.map((module) => {
          const locked = isModuleLocked(module.slug)
          return (
            <section key={module.slug} className="space-y-3">
              <div className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-r p-5 text-white shadow-lg shadow-slate-900/10',
                module.color,
                locked && 'opacity-60'
              )}>
                <div className="absolute -right-4 -top-8 text-[7rem] font-black leading-none text-white/10">{String(module.number).padStart(2, '0')}</div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">
                      Módulo {module.number}
                    </p>
                    <h2 className="flex items-center gap-2 text-lg font-black leading-tight">
                      {module.title}
                      {locked && <Lock size={14} className="opacity-80" />}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-80">{module.description}</p>
                  </div>
                </div>
                <div className="relative mt-4 flex items-center gap-3 text-xs text-white/75">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/15">
                    <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.max(8, Math.round((module.encounters.filter((e) => completedEncounters.includes(e.slug)).length / module.encounters.length) * 100))}%` }} />
                  </div>
                  <span>{module.encounters.filter((e) => completedEncounters.includes(e.slug)).length}/{module.encounters.length} missões</span>
                </div>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                    <span className="text-xs font-semibold bg-black/40 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Lock size={11} /> Módulo bloqueado pelo professor
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2 border-l-2 border-dashed border-muted pl-4 sm:pl-6">
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
