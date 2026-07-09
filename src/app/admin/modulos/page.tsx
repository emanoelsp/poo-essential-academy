'use client'

import { useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { saveModuleSettings } from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ModulosAdminPage() {
  const { moduleSettings } = useSettings()
  const [locked, setLocked] = useState<string[]>(moduleSettings.lockedModules)
  const [saving, setSaving] = useState(false)

  const toggle = (slug: string) => {
    setLocked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const lockAll = () => setLocked(CURRICULUM.map((m) => m.slug))
  const unlockAll = () => setLocked([])

  const save = async () => {
    setSaving(true)
    try {
      await saveModuleSettings({ lockedModules: locked })
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(locked.sort()) !== JSON.stringify([...moduleSettings.lockedModules].sort())

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Módulos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Módulos bloqueados ficam visíveis mas não podem ser acessados pelos alunos.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={lockAll}>
          <Lock size={14} className="mr-1.5" /> Bloquear todos
        </Button>
        <Button variant="outline" size="sm" onClick={unlockAll}>
          <Unlock size={14} className="mr-1.5" /> Liberar todos
        </Button>
      </div>

      <div className="space-y-3">
        {CURRICULUM.map((module) => {
          const isLocked = locked.includes(module.slug)
          return (
            <Card
              key={module.slug}
              className={cn(
                'transition-all cursor-pointer select-none',
                isLocked ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10' : ''
              )}
              onClick={() => toggle(module.slug)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  isLocked ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                )}>
                  {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Módulo {module.number} — {module.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {module.encounters.length} encontros · {module.description.slice(0, 60)}…
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full',
                  isLocked
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                )}>
                  {isLocked ? 'Bloqueado' : 'Liberado'}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
            Você tem alterações não salvas. Clique em "Salvar" para aplicar.
          </p>
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
