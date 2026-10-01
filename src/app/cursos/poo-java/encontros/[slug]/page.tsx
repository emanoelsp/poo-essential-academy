import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getEncounterBySlug, CURRICULUM } from '@/content/data/curriculum'
import { EncounterContentWrapper } from './EncounterContentWrapper'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Code2, Crosshair, Sparkles, Trophy } from 'lucide-react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  teoria: 'Briefing + laboratório',
  lab: 'Laboratório de prática',
  questionario: 'Checkpoint de domínio',
  apresentacao: 'Defesa arquitetural',
  desafio: 'Missão de desafio',
  bonus: 'Missão bônus',
  complementar: 'Expedição complementar',
}

const MODULE_KICKERS: Record<number, string> = {
  1: 'A fundação do seu pensamento computacional',
  2: 'O momento em que o código ganha identidade',
  3: 'Proteja o estado. Preserve as regras.',
  4: 'Reuso, hierarquia e especialização',
  5: 'Comportamentos que mudam em tempo de execução',
  6: 'A arquitetura que prova que você aprendeu',
}

function loadContent(slug: string): string | null {
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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link href="/cursos/poo-java" className="transition-colors hover:text-foreground">Mapa da jornada</Link>
        <span>/</span>
        <span className="truncate">Módulo {module.number}</span>
      </nav>

      <section className={`mission-glow relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br ${module.color} px-6 py-7 text-white sm:px-10 sm:py-9`}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,transparent,rgba(15,23,42,0.35))]" />
        <div className="absolute -right-12 -top-20 -z-10 text-[15rem] font-black leading-none text-white/[0.07]">{encounter.number > 0 ? String(encounter.number).padStart(2, '0') : '✦'}</div>

        <div className="relative grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
              <span className="flex items-center gap-1.5"><Sparkles size={13} /> {TYPE_LABELS[encounter.type] ?? 'Missão de aprendizagem'}</span>
              <span className="text-white/40">•</span>
              <span>Módulo {module.number}</span>
              {encounter.number > 0 && <><span className="text-white/40">•</span><span>Encontro {encounter.number}</span></>}
            </div>
            <p className="mb-2 text-sm font-semibold text-white/70">{MODULE_KICKERS[module.number] ?? module.title}</p>
            <h1 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl">{encounter.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">{module.description}</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-md">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"><Crosshair size={14} /> Objetivo da missão</p>
            <p className="mt-2 text-sm font-bold leading-5 text-white">Aprender, praticar e provar domínio neste encontro.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 p-3">
                <Trophy size={15} className="text-amber-200" />
                <p className="mt-2 text-lg font-black">{encounter.xp}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">XP</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <BookOpen size={15} className="text-cyan-200" />
                <p className="mt-2 text-lg font-black">{encounter.exercises || '∞'}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">exercícios</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center gap-2">
          {encounter.type === 'desafio' && <Badge className="border-amber-200/30 bg-amber-300/20 text-amber-50">⚔️ Desafio</Badge>}
          {encounter.type === 'bonus' && <Badge className="border-teal-200/30 bg-teal-300/20 text-teal-50">🎁 Bônus</Badge>}
          {encounter.type === 'questionario' && <Badge className="border-amber-200/30 bg-amber-300/20 text-amber-50">📋 Checkpoint</Badge>}
          <Badge className="border-white/15 bg-white/10 text-white/85"><Clock3 size={12} /> 4 aulas</Badge>
          {encounter.type === 'desafio' && encounter.challengeTasks && <Badge className="border-white/15 bg-white/10 text-white/85"><Code2 size={12} /> {encounter.challengeTasks.length} tasks</Badge>}
        </div>
      </section>

      {/* Content */}
      {content ? (
        <div className="content-surface mx-auto mt-6 max-w-4xl rounded-2xl border bg-card/90 p-4 sm:mt-8 sm:p-8">
          <EncounterContentWrapper content={content} encounter={encounter} />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🚧</p>
          <p className="font-medium">Conteúdo em preparação</p>
          <p className="text-sm mt-1">Este encontro estará disponível em breve.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 border-t pt-6">
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
