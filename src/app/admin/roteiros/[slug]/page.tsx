import { notFound } from 'next/navigation'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoteiroContentWrapper } from '../RoteiroContentWrapper'

function loadRoteiro(slug: string): { content: string; moduleDir: string } | null {
  const contentDir = join(process.cwd(), 'src/content')
  let dirs: string[] = []
  try { dirs = readdirSync(contentDir) } catch { return null }

  for (const dir of dirs) {
    if (!dir.startsWith('modulo-')) continue
    const filePath = join(contentDir, dir, `${slug}.md`)
    try {
      const content = readFileSync(filePath, 'utf-8')
      return { content, moduleDir: dir }
    } catch {}
  }
  return null
}

function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

export function generateStaticParams() {
  const contentDir = join(process.cwd(), 'src/content')
  const slugs: { slug: string }[] = []
  let dirs: string[] = []
  try { dirs = readdirSync(contentDir) } catch { return slugs }

  for (const dir of dirs) {
    if (!dir.startsWith('modulo-')) continue
    let files: string[] = []
    try { files = readdirSync(join(contentDir, dir)) } catch { continue }
    for (const file of files) {
      if (file.startsWith('roteiro-') && file.endsWith('.md')) {
        slugs.push({ slug: file.replace('.md', '') })
      }
    }
  }
  return slugs
}

export default async function RoteiroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = loadRoteiro(slug)
  if (!result) notFound()

  const { content, moduleDir } = result
  const title = extractTitle(content, slug)

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/roteiros" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Roteiros
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground truncate">{title}</span>
      </nav>

      {/* Teacher badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
          👨‍🏫 Visão do Professor · Gabarito visível
        </span>
        <span className="text-xs text-muted-foreground">{moduleDir} · {slug}</span>
      </div>

      {/* Content */}
      <RoteiroContentWrapper content={content} />
    </div>
  )
}
