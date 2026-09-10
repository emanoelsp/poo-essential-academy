'use client'

import { useEffect, useState } from 'react'
import { getAllQuizResults, getAllStudents, type QuizResult, type UserProfile } from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { RefreshCw, ClipboardList, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const QUIZ_ENCOUNTERS = CURRICULUM.flatMap((m) =>
  m.encounters
    .filter((e) => e.type === 'questionario')
    .map((e) => ({ slug: e.slug, title: e.title, module: m.number, xp: e.xp }))
)

export default function QuestionariosAdminPage() {
  const [results, setResults]   = useState<QuizResult[]>([])
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string>(QUIZ_ENCOUNTERS[0]?.slug ?? '')

  const load = async () => {
    setLoading(true)
    const [res, sts] = await Promise.all([getAllQuizResults(), getAllStudents()])
    setResults(res)
    setStudents(sts.filter((s) => s.role !== 'admin'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const encounter = QUIZ_ENCOUNTERS.find((e) => e.slug === selected)
  const resultsForSlug = results.filter((r) => r.slug === selected)

  // Montar tabela: todos alunos + resultado se existir
  const rows = students.map((s) => ({
    student: s,
    result: resultsForSlug.find((r) => r.uid === s.uid) ?? null,
  }))
  rows.sort((a, b) => (b.result?.pct ?? -1) - (a.result?.pct ?? -1))

  const submitted  = rows.filter((r) => r.result).length
  const avgPct     = submitted > 0
    ? Math.round(resultsForSlug.reduce((s, r) => s + r.pct, 0) / submitted)
    : null

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Questionários de Fechamento</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Notas dos alunos por questionário
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* Seletor de questionário */}
      <div className="flex gap-2 flex-wrap">
        {QUIZ_ENCOUNTERS.map((e) => (
          <button
            key={e.slug}
            onClick={() => setSelected(e.slug)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              selected === e.slug
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <ClipboardList size={14} />
            M{e.module} — {e.title.replace('Questionário de Fechamento — ', '')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl border bg-muted animate-pulse" />)}
        </div>
      ) : !encounter ? (
        <p className="text-muted-foreground text-sm">Nenhum questionário configurado.</p>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Alunos responderam" value={`${submitted} / ${students.length}`} />
            <StatCard label="Média da turma" value={avgPct !== null ? `${avgPct}%` : '—'} highlight={avgPct !== null} />
            <StatCard label="Aprovados (≥ 60%)" value={`${resultsForSlug.filter((r) => r.pct >= 60).length}`} />
          </div>

          {/* Tabela */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Aluno</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Acertos</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Nota</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Situação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, result }, idx) => {
                  const passed = result ? result.pct >= 60 : null
                  return (
                    <tr key={student.uid} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.displayName || '—'}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result ? (
                          <span className="font-semibold">{result.score}/{result.total}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn('font-bold text-base', passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                              {result.pct}%
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', passed ? 'bg-green-500' : 'bg-red-500')}
                                style={{ width: `${result.pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result === null ? (
                          <span className="text-xs text-muted-foreground/50">Não respondeu</span>
                        ) : passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Abaixo de 60%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold', highlight && 'text-primary')}>{value}</p>
    </div>
  )
}
