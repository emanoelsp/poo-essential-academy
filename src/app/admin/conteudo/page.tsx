'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { saveContentSettings } from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ConteudoAdminPage() {
  const { contentSettings } = useSettings()
  const [globalHidden, setGlobalHidden] = useState(contentSettings.gabaritoHidden)
  const [hiddenEncounters, setHiddenEncounters] = useState<string[]>(
    contentSettings.hiddenEncounters
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGlobalHidden(contentSettings.gabaritoHidden)
    setHiddenEncounters(contentSettings.hiddenEncounters)
  }, [contentSettings])

  const toggleEncounter = (slug: string) => {
    setHiddenEncounters((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await saveContentSettings({
        gabaritoHidden: globalHidden,
        hiddenEncounters,
      })
      toast.success('Configurações de gabarito salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    globalHidden !== contentSettings.gabaritoHidden ||
    JSON.stringify([...hiddenEncounters].sort()) !==
      JSON.stringify([...contentSettings.hiddenEncounters].sort())

  const allEncounters = CURRICULUM.flatMap((m) =>
    m.encounters.map((e) => ({ ...e, moduleTitle: m.title, moduleNum: m.number }))
  )

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visibilidade do Gabarito</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Controle se os alunos podem ver as respostas/gabaritos dos exercícios.
        </p>
      </div>

      {/* Global toggle */}
      <Card className={cn(globalHidden ? 'border-red-300 dark:border-red-800' : 'border-green-300 dark:border-green-800')}>
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <p className="font-semibold">Gabarito Global</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {globalHidden
                ? 'Nenhum aluno pode ver gabaritos no momento'
                : 'Todos os alunos podem ver os gabaritos'}
            </p>
          </div>
          <Button
            variant={globalHidden ? 'destructive' : 'outline'}
            onClick={() => setGlobalHidden((v) => !v)}
            className="gap-2"
          >
            {globalHidden ? <EyeOff size={15} /> : <Eye size={15} />}
            {globalHidden ? 'Gabarito Oculto' : 'Gabarito Visível'}
          </Button>
        </CardContent>
      </Card>

      {/* Per-encounter overrides */}
      <div>
        <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          Controle por Encontro
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Mesmo com gabarito global visível, você pode ocultar encontros específicos.
        </p>
        <div className="space-y-1.5">
          {allEncounters.map((e) => {
            const isHidden = hiddenEncounters.includes(e.slug)
            return (
              <div
                key={e.slug}
                onClick={() => toggleEncounter(e.slug)}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all select-none',
                  isHidden
                    ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10'
                    : 'hover:bg-muted/30'
                )}
              >
                <div>
                  <p className="text-sm font-medium">
                    E{e.number} — {e.title}
                  </p>
                  <p className="text-xs text-muted-foreground">M{e.moduleNum} · {e.moduleTitle}</p>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-0.5 rounded-full',
                  isHidden
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {isHidden ? 'Oculto' : 'Visível'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">Alterações não salvas.</p>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      )}
      {!hasChanges && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle size={15} />
          Configurações sincronizadas
        </div>
      )}
    </div>
  )
}
