'use client'

import { useEffect, useState } from 'react'
import { getAllStudents, getAllProgress, setUserRole, type UserProfile, type UserProgress } from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { computeGrade } from '@/lib/grade'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, User, Coins, Trophy, BookOpen, RefreshCw, Sword, ChevronDown, ChevronUp, GraduationCap, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type StudentRow = UserProfile & {
  progress?: UserProgress & { uid: string }
}

const totalEncounters = CURRICULUM.reduce((s, m) => s + m.encounters.length, 0)

const CHALLENGE_ENCOUNTERS = CURRICULUM.flatMap((m) =>
  m.encounters
    .filter((e) => e.type === 'desafio')
    .map((e) => ({ slug: e.slug, title: e.title, module: m.number, tasks: e.challengeTasks ?? [] }))
)

export default function AlunosAdminPage() {
  const [students, setStudents]     = useState<StudentRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const [profiles, progress] = await Promise.all([getAllStudents(), getAllProgress()])
    const rows: StudentRow[] = profiles.map((p) => ({
      ...p,
      progress: progress.find((pr) => pr.uid === p.uid),
    }))
    rows.sort((a, b) => (b.progress?.xp ?? 0) - (a.progress?.xp ?? 0))
    setStudents(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggleRole = async (uid: string, currentRole: 'admin' | 'student') => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    try {
      await setUserRole(uid, newRole)
      toast.success(`Papel alterado para ${newRole}`)
      load()
    } catch {
      toast.error('Erro ao alterar papel.')
    }
  }

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alunos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {students.length} usuário(s) registrado(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <User size={32} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum aluno registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s, idx) => {
            const completed  = s.progress?.completedEncounters?.length ?? 0
            const pct        = Math.round((completed / totalEncounters) * 100)
            const coins      = s.progress?.coins ?? 0
            const xp         = s.progress?.xp ?? 0
            const levelName  = s.progress?.levelName ?? 'Iniciante'
            const cp         = s.progress?.challengeProgress ?? {}
            const totalChallengeCoins = Object.values(cp).reduce((s, v) => s + v.totalCoins, 0)
            const challengesDone = CHALLENGE_ENCOUNTERS.filter((ch) => {
              const prog = cp[ch.slug]
              return prog && prog.completedTaskIds.length === ch.tasks.length && ch.tasks.length > 0
            }).length
            const grade = computeGrade({
              createdAt:           s.createdAt,
              weeklyPresence:      s.progress?.weeklyPresence,
              completedEncounters: completed,
              totalEncounters,
            })
            const isOpen = expanded === s.uid

            return (
              <Card key={s.uid} className="overflow-hidden">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar + rank */}
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold shrink-0">
                        {(s.displayName || s.email || '?')[0].toUpperCase()}
                      </div>
                      {idx < 3 && (
                        <span className="absolute -top-1 -right-1 text-xs">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{s.displayName || '—'}</p>
                        {s.role === 'admin' && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck size={10} /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>

                      {/* Course progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {completed}/{totalEncounters} encontros
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <GraduationCap size={13} className="text-primary" />
                        <span className={cn(grade.grade >= 6 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                          {grade.grade.toFixed(1)}
                        </span>
                      </div>
                      <Stat icon={<CalendarCheck size={13} className="text-green-700 dark:text-green-400" />} label={`${grade.weeksPresent}/${grade.weeksElapsed} sem.`} />
                      <Stat icon={<Trophy size={13} className="text-amber-700 dark:text-amber-400" />} label={`${xp} XP`} />
                      <Stat icon={<Coins size={13} className="text-yellow-600 dark:text-yellow-400" />} label={`${coins} coins`} />
                      <Stat icon={<Sword size={13} className="text-amber-700 dark:text-amber-400" />} label={`${challengesDone}/${CHALLENGE_ENCOUNTERS.length} desafios`} />
                      <Stat icon={<BookOpen size={13} className="text-blue-700 dark:text-blue-400" />} label={levelName} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => setExpanded(isOpen ? null : s.uid)}
                      >
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Desafios
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleToggleRole(s.uid, s.role)}
                      >
                        {s.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                      </Button>
                    </div>
                  </div>

                  {/* Challenge breakdown — expandable */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Progresso nos Desafios
                        </p>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {totalChallengeCoins} coins de desafios
                        </span>
                      </div>
                      {CHALLENGE_ENCOUNTERS.map((ch) => {
                        const prog = cp[ch.slug]
                        const done = prog?.completedTaskIds.length ?? 0
                        const total = ch.tasks.length
                        const chCoins = prog?.totalCoins ?? 0
                        const maxCoins = ch.tasks.reduce((s, t) => s + t.coins, 0)
                        const allDone = total > 0 && done === total
                        return (
                          <div key={ch.slug} className="flex items-center gap-3">
                            <span className={cn(
                              'text-[10px] font-bold w-6 text-center shrink-0',
                              allDone ? 'text-green-700' : done > 0 ? 'text-amber-700' : 'text-muted-foreground/40'
                            )}>
                              M{ch.module}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className={cn('text-[11px] truncate', allDone ? 'text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground')}>
                                  {allDone ? '✓ ' : ''}{ch.title.replace('⚔️ ', '')}
                                </p>
                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                  {chCoins}/{maxCoins}c · {done}/{total}t
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all', allDone ? 'bg-green-500' : 'bg-amber-400')}
                                  style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  )
}
