'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useGamificationStore } from '@/stores/gamificationStore'
import { CURRICULUM } from '@/content/data/curriculum'
import { computeGrade } from '@/lib/grade'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Award, Lock, Code2, ArrowLeft } from 'lucide-react'

const totalEncounters = CURRICULUM.reduce((s, m) => s + m.encounters.length, 0)

export default function CertificadoPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { completedEncounters, weeklyPresence } = useGamificationStore()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const result = computeGrade({
    createdAt:           profile.createdAt,
    weeklyPresence,
    completedEncounters: completedEncounters.length,
    totalEncounters,
  })

  const studentName = profile.displayName || profile.email
  const issueDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Voltar ao progresso
      </Link>

      {!result.complete ? (
        // ── Estado: curso ainda não concluído ──────────────────────────────
        <Card>
          <CardContent className="py-14 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Lock size={26} className="text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Certificado bloqueado</h1>
              <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                Conclua <strong>todos os {totalEncounters} encontros</strong> do curso para liberar seu
                certificado. Você concluiu {completedEncounters.length} até agora.
              </p>
            </div>
            <div className="mx-auto max-w-xs">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round((completedEncounters.length / totalEncounters) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {completedEncounters.length}/{totalEncounters} encontros concluídos
              </p>
            </div>
            <Link href="/cursos/poo-java" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Continuar o curso
            </Link>
          </CardContent>
        </Card>
      ) : (
        // ── Estado: certificado emitido ────────────────────────────────────
        <div className="rounded-2xl border-4 border-double border-primary/30 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-10 text-center shadow-xl">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Code2 size={22} />
            <span className="font-black tracking-tight">POO Academy</span>
          </div>

          <div className="mx-auto my-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <Award size={34} className="text-amber-600 dark:text-amber-400" />
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Certificado de Conclusão</p>
          <h1 className="mt-4 text-3xl font-black">{studentName}</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            concluiu com êxito a Unidade Curricular de <strong>Programação Orientada a Objetos (Java)</strong>,
            cumprindo os {totalEncounters} encontros do curso.
          </p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4">
            <Stat label="Nota final" value={result.grade.toFixed(1)} highlight />
            <Stat label="Atividades" value={`${Math.round(result.activitiesRatio * 100)}%`} />
            <Stat label="Presença" value={`${Math.round(result.presenceRatio * 100)}%`} />
          </div>

          <p className="mt-8 text-xs text-muted-foreground">Emitido em {issueDate}</p>
        </div>
      )}
    </main>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border bg-background/60 py-4">
      <p className={highlight ? 'text-3xl font-black text-primary' : 'text-3xl font-black'}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
