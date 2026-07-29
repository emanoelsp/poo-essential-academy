'use client'

import { useEffect, useMemo, useState } from 'react'
import { watchAllSubmissions, reviewSubmission } from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { Submission, SubmissionStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, ExternalLink, Clock, Sword, Inbox, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const FILTERS: { key: SubmissionStatus; label: string }[] = [
  { key: 'pending',  label: 'Pendentes' },
  { key: 'approved', label: 'Validados' },
  { key: 'rejected', label: 'Recusados' },
]

function seconds(ts: unknown): number {
  return (ts as { seconds?: number } | null)?.seconds ?? 0
}

function formatDate(ts: unknown): string {
  const s = seconds(ts)
  if (!s) return ''
  return new Date(s * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ValidacoesAdminPage() {
  const { profile } = useAuth()
  const [subs, setSubs]     = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState<string | null>(null)
  const [filter, setFilter] = useState<SubmissionStatus>('pending')

  useEffect(() => {
    const unsub = watchAllSubmissions((s) => {
      setSubs(s)
      setLoading(false)
    })
    return unsub
  }, [])

  const counts = useMemo(() => ({
    pending:  subs.filter((s) => s.status === 'pending').length,
    approved: subs.filter((s) => s.status === 'approved').length,
    rejected: subs.filter((s) => s.status === 'rejected').length,
  }), [subs])

  const filtered = useMemo(
    () => subs.filter((s) => s.status === filter).sort((a, b) => seconds(b.createdAt) - seconds(a.createdAt)),
    [subs, filter]
  )

  const review = async (s: Submission, decision: 'approved' | 'rejected') => {
    let reviewNote: string | undefined
    if (decision === 'rejected') {
      reviewNote = window.prompt('Motivo da recusa (opcional):') ?? undefined
    }
    setBusy(s.id)
    try {
      await reviewSubmission(s.id, decision, profile?.email ?? 'admin', reviewNote)
      toast.success(decision === 'approved' ? 'Desafio validado! XP liberado ao aluno.' : 'Entrega recusada.')
    } catch {
      toast.error('Erro ao processar. Tente novamente.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sword size={22} className="text-amber-600" /> Validações de Desafios
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprove as entregas dos alunos para liberar o XP dos desafios.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {label}
            <span className={cn(
              'text-xs font-bold rounded-full px-1.5 min-w-[20px] text-center',
              filter === key ? 'bg-primary-foreground/20' : 'bg-muted'
            )}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Inbox size={32} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma entrega {filter === 'pending' ? 'pendente' : filter === 'approved' ? 'validada' : 'recusada'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        M{s.module}
                      </span>
                      <p className="font-semibold text-sm truncate">{s.encounterTitle.replace('⚔️ ', '')}</p>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+{s.xp} XP</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.studentName} · {s.studentEmail}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {/* Proof */}
                <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
                  <a
                    href={s.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all font-medium"
                  >
                    <ExternalLink size={14} className="shrink-0" /> {s.proofUrl}
                  </a>
                  {s.note && <p className="text-xs text-muted-foreground italic">“{s.note}”</p>}
                </div>

                {/* Meta + actions */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock size={11} /> Enviado {formatDate(s.createdAt)}
                    {s.status !== 'pending' && s.reviewedBy && (
                      <span> · revisado por {s.reviewedBy}</span>
                    )}
                  </p>

                  {s.status === 'pending' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                        disabled={busy === s.id}
                        onClick={() => review(s, 'rejected')}
                      >
                        <X size={14} /> Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        disabled={busy === s.id}
                        onClick={() => review(s, 'approved')}
                      >
                        <Check size={14} /> Validar
                      </Button>
                    </div>
                  ) : s.status === 'rejected' && s.reviewNote ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400 italic max-w-[50%] text-right">
                      {s.reviewNote}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === 'approved')
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">
        <CheckCircle2 size={11} /> Validado
      </span>
    )
  if (status === 'rejected')
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full shrink-0">
        <XCircle size={11} /> Recusado
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
      <Clock size={11} /> Pendente
    </span>
  )
}
