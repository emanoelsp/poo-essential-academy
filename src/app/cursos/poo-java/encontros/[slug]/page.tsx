import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getEncounterBySlug, CURRICULUM } from '@/content/data/curriculum'
import { EncounterContentWrapper } from './EncounterContentWrapper'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function loadContent(slug: string): string | null {
  const moduleNumber = parseInt(slug.replace('encontro-', ''), 10)
  const moduleIndex = CURRICULUM.findIndex((m) =>
    m.encounters.some((e) => e.slug === slug)
  )
  if (moduleIndex === -1) return null

  const moduleNum = String(moduleIndex + 1).padStart(2, '0')
  const filePath = join(
    process.cwd(),
    'src/content',
    `modulo-${moduleNum}`,
    `${slug}.md`
  )
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function generateStaticParams() {
  return CURRICULUM.flatMap((m) =>
    m.encounters.map((e) => ({ slug: e.slug }))
  )
}

export default async function EncounterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = getEncounterBySlug(slug)
  if (!result) notFound()

  const { encounter, module } = result
  const content = loadContent(slug)

  // Find prev/next
  const allEncounters = CURRICULUM.flatMap((m) => m.encounters)
  const currentIndex = allEncounters.findIndex((e) => e.slug === slug)
  const prev = currentIndex > 0 ? allEncounters[currentIndex - 1] : null
  const next = currentIndex < allEncounters.length - 1 ? allEncounters[currentIndex + 1] : null

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/cursos/poo-java" className="hover:text-foreground transition-colors">
          Currículo
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{encounter.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Módulo {module.number}</Badge>
          {encounter.type === 'desafio' && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">⚔️ Desafio</Badge>
          )}
          {encounter.type === 'bonus' && (
            <Badge className="bg-teal-100 text-teal-800 border-teal-200">🎁 Bônus</Badge>
          )}
          {encounter.number > 0 && (
            <Badge variant="outline">Encontro {encounter.number}</Badge>
          )}
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            ⚡ {encounter.xp} XP
          </Badge>
          {encounter.exercises > 0 && (
            <Badge variant="secondary">📝 {encounter.exercises} exercícios</Badge>
          )}
          {encounter.type === 'desafio' && encounter.challengeTasks && (
            <Badge variant="secondary">🏆 {encounter.challengeTasks.length} tasks</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{encounter.title}</h1>
        <p className="text-sm text-muted-foreground">{module.title}</p>
      </div>

      {/* Content */}
      {content ? (
        <EncounterContentWrapper content={content} encounter={encounter} />
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🚧</p>
          <p className="font-medium">Conteúdo em preparação</p>
          <p className="text-sm mt-1">Este encontro estará disponível em breve.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t gap-4">
        {prev ? (
          <Link
            href={`/cursos/poo-java/encontros/${prev.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <div className="text-left">
              <p className="text-xs">Anterior</p>
              <p className="font-medium text-foreground truncate max-w-[200px]">{prev.title}</p>
            </div>
          </Link>
        ) : <div />}

        {next ? (
          <Link
            href={`/cursos/poo-java/encontros/${next.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
          >
            <div>
              <p className="text-xs">Próximo</p>
              <p className="font-medium text-foreground truncate max-w-[200px]">{next.title}</p>
            </div>
            <ArrowRight size={16} />
          </Link>
        ) : <div />}
      </div>
    </main>
  )
}
