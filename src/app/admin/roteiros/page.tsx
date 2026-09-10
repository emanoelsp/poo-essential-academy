import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { ScrollText, ChevronRight } from 'lucide-react'

interface RoteiroMeta {
  slug: string
  title: string
  module: string
}

function findAllRoteiros(): RoteiroMeta[] {
  const contentDir = join(process.cwd(), 'src/content')
  const results: RoteiroMeta[] = []

  let dirs: string[] = []
  try { dirs = readdirSync(contentDir) } catch { return results }

  for (const dir of dirs.sort()) {
    if (!dir.startsWith('modulo-')) continue
    const moduleDir = join(contentDir, dir)
    let files: string[] = []
    try { files = readdirSync(moduleDir) } catch { continue }

    for (const file of files.sort()) {
      if (!file.startsWith('roteiro-') || !file.endsWith('.md')) continue
      const slug = file.replace('.md', '')
      let title = slug
      try {
        const text = readFileSync(join(moduleDir, file), 'utf-8')
        const match = text.match(/^#\s+(.+)$/m)
        if (match) title = match[1].trim()
      } catch {}
      results.push({ slug, title, module: dir })
    }
  }

  return results
}

export default function RoteirosPage() {
  const roteiros = findAllRoteiros()

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roteiros de Aula</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Guias do professor — gabarito sempre visível.
        </p>
      </div>

      {roteiros.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum roteiro encontrado.</p>
      ) : (
        <div className="space-y-2">
          {roteiros.map((r) => (
            <Link
              key={r.slug}
              href={`/admin/roteiros/${r.slug}`}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/30 transition-colors group"
            >
              <ScrollText size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.module} · {r.slug}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
