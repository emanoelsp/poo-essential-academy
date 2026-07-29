'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGamificationStore } from '@/stores/gamificationStore'
import { useAuth } from '@/contexts/AuthContext'
import { XPBar } from '@/components/features/gamification/XPBar'
import { BadgeGrid } from '@/components/features/gamification/BadgeCard'
import { LevelDisplay } from '@/components/features/gamification/LevelDisplay'
import { CURRICULUM } from '@/content/data/curriculum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getLevelFromXP, LEVELS } from '@/lib/gamification'
import { computeGrade, effectiveXP } from '@/lib/grade'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Coins, Zap, Flame, Trophy, BookOpen, GraduationCap, CalendarCheck, Award, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isAdmin, loading: authLoading } = useAuth()
  const { xp, level, streak, badges, coins, completedEncounters, weeklyPresence } = useGamificationStore()
  const currentLevel = getLevelFromXP(xp)

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace('/login')
    else if (isAdmin) router.replace('/admin')
  }, [user, isAdmin, authLoading, router])

  const totalEncounters = CURRICULUM.reduce((s, m) => s + m.encounters.length, 0)
  const totalXPAvailable = CURRICULUM.reduce(
    (s, m) => s + m.encounters.reduce((es, e) => es + e.xp, 0), 0
  )

  const grade = computeGrade({
    createdAt:           profile?.createdAt,
    weeklyPresence,
    completedEncounters: completedEncounters.length,
    totalEncounters,
  })
  const netXP = effectiveXP(xp, grade.xpPenalty)

  if (authLoading || !user || isAdmin) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe sua evolução no curso de POO.</p>
      </div>

      {/* POO Essential Coins — destaque */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 p-6 text-amber-950 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">POO Essential Coins</p>
            <p className="text-5xl font-black mt-1">{coins}</p>
            <p className="text-sm opacity-80 mt-1">moedas acumuladas no curso</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-300/50">
            <Coins size={44} className="opacity-90" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs opacity-75">
          <span>+10 por encontro concluído</span>
          <span>·</span>
          <span>+15 por badge conquistado</span>
          <span>·</span>
          <span>+50 por módulo completo</span>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'XP Total',    value: xp,                       unit: 'pontos',              Icon: Zap,      color: 'text-blue-700   dark:text-blue-400'   },
          { label: 'Nível',       value: level,                     unit: currentLevel.name,     Icon: Trophy,   color: 'text-amber-700  dark:text-amber-400'  },
          { label: 'Streak',      value: streak,                    unit: 'dias consecutivos',   Icon: Flame,    color: 'text-orange-700 dark:text-orange-400' },
          { label: 'Concluídos',  value: completedEncounters.length, unit: `de ${totalEncounters} encontros`, Icon: BookOpen, color: 'text-green-700  dark:text-green-400'  },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-5 pb-4">
              <s.Icon size={20} className={cn('mx-auto mb-2', s.color)} />
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.unit}</p>
              <p className="text-sm font-medium mt-1.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota da UC + presença semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            Nota da UC de POO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-muted/30 py-4 text-center">
              <p className="text-3xl font-black text-primary">{grade.grade.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">de 10 (parcial)</p>
            </div>
            <div className="rounded-xl border bg-muted/30 py-4 text-center">
              <p className="text-3xl font-black">{Math.round(grade.activitiesRatio * 100)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">atividades (70%)</p>
            </div>
            <div className="rounded-xl border bg-muted/30 py-4 text-center">
              <p className="text-3xl font-black">{grade.weeksPresent}/{grade.weeksElapsed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">presença (30%)</p>
            </div>
            <div className="rounded-xl border bg-muted/30 py-4 text-center">
              <p className="text-3xl font-black">{netXP}</p>
              <p className="text-xs text-muted-foreground mt-0.5">XP após penalidade</p>
            </div>
          </div>

          {grade.weeksMissed > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Você faltou <strong>{grade.weeksMissed} semana(s)</strong> — penalidade de{' '}
                <strong>−{grade.xpPenalty} XP</strong>. Entre toda semana para não perder pontos.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <CalendarCheck size={14} className="text-green-600 dark:text-green-400" />
            <span>Presença registrada automaticamente ao acessar o curso a cada semana.</span>
          </div>

          {grade.complete ? (
            <Link href="/certificado" className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}>
              <Award size={15} /> Ver meu certificado
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">
              Conclua os {totalEncounters} encontros para liberar o certificado ({completedEncounters.length}/{totalEncounters}).
            </p>
          )}
        </CardContent>
      </Card>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Progresso de Nível</span>
            <LevelDisplay />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <XPBar />
          <div className="grid grid-cols-5 gap-1">
            {LEVELS.map((l) => (
              <div
                key={l.level}
                className={cn(
                  'rounded-md p-2 text-center text-xs border',
                  l.level <= level
                    ? 'border-amber-400/40 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-dashed border-muted opacity-40'
                )}
              >
                <p className="font-bold">{l.level}</p>
                <p className="text-muted-foreground leading-tight">{l.name}</p>
                <p className="text-[10px] mt-0.5">{l.xpRequired} XP</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Badges */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Badges Conquistados</h2>
        <p className="text-sm text-muted-foreground">{badges.length} de 10 badges desbloqueados</p>
        <BadgeGrid />
      </div>

      <Separator />

      {/* XP disponível por módulo */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">XP Disponível por Módulo</h2>
        <div className="space-y-2">
          {CURRICULUM.map((module) => {
            const moduleXP = module.encounters.reduce((s, e) => s + e.xp, 0)
            return (
              <div key={module.slug} className="flex items-center gap-3">
                <div className={cn('h-3 w-3 rounded-full bg-gradient-to-br', module.color)} />
                <span className="text-sm flex-1 truncate">M{module.number} · {module.title}</span>
                <span className="text-sm font-semibold text-muted-foreground">⚡ {moduleXP} XP</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Total disponível no curso: {totalXPAvailable} XP (+ bônus de badges)
        </p>
      </div>
    </main>
  )
}
