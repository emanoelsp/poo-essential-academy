'use client'

import { useEffect, useState, useMemo } from 'react'
import { getAllGithubSubmissions, type GithubSubmission } from '@/lib/firestore'
import { CURRICULUM } from '@/content/data/curriculum'
import { ExternalLink, RefreshCw, GitBranch, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Flat map of slug → title from CURRICULUM
const ENCOUNTER_MAP = Object.fromEntries(
  CURRICULUM.flatMap((m) => m.encounters.map((e) => [e.slug, e.title]))
)

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  return '—'
}

type SortKey = 'displayName' | 'encounterSlug' | 'submittedAt'

export default function SubmissoesPage() {
  const [submissions, setSubmissions] = useState<GithubSubmission[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterSlug, setFilterSlug]   = useState<string>('all')
  const [sortKey, setSortKey]         = useState<SortKey>('submittedAt')
  const [sortAsc, setSortAsc]         = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await getAllGithubSubmissions()
    setSubmissions(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const encounterOptions = useMemo(() => {
    const slugs = [...new Set(submissions.map((s) => s.encounterSlug))].sort()
    return slugs
  }, [submissions])

  const filtered = useMemo(() => {
    let rows = [...submissions]
    if (filterSlug !== 'all') rows = rows.filter((s) => s.encounterSlug === filterSlug)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.repoUrl.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortKey === 'displayName') {
        va = a.displayName.toLowerCase()
        vb = b.displayName.toLowerCase()
      } else if (sortKey === 'encounterSlug') {
        va = a.encounterSlug
        vb = b.encounterSlug
      } else {
        // submittedAt — compare timestamps
        const toMs = (ts: unknown) => {
          if (ts && typeof ts === 'object' && 'toDate' in ts)
            return (ts as { toDate: () => Date }).toDate().getTime()
          return 0
        }
        va = toMs(a.submittedAt)
        vb = toMs(b.submittedAt)
      }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })
    return rows
  }, [submissions, filterSlug, search, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp size={13} className="ml-1 inline" /> : <ChevronDown size={13} className="ml-1 inline" />
    ) : (
      <span className="ml-1 inline opacity-30"><ChevronUp size={13} className="inline" /></span>
    )

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch size={22} className="text-violet-500" />
            Submissões GitHub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Links de repositório enviados pelos alunos nas atividades
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de entregas</p>
          <p className="text-3xl font-bold mt-1">{submissions.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Alunos únicos</p>
          <p className="text-3xl font-bold mt-1">
            {new Set(submissions.map((s) => s.uid)).size}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Atividades com entrega</p>
          <p className="text-3xl font-bold mt-1">{encounterOptions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por aluno, email ou repositório…"
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <select
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <option value="all">Todas as atividades</option>
          {encounterOptions.map((slug) => (
            <option key={slug} value={slug}>
              {ENCOUNTER_MAP[slug] ?? slug}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw size={18} className="animate-spin mr-2" /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground text-sm">
          Nenhuma submissão encontrada.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('displayName')}
                >
                  Aluno <SortIcon k="displayName" />
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('encounterSlug')}
                >
                  Atividade <SortIcon k="encounterSlug" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Repositório
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => toggleSort('submittedAt')}
                >
                  Enviado em <SortIcon k="submittedAt" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.displayName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400 ring-1 ring-violet-500/20">
                      {ENCOUNTER_MAP[s.encounterSlug] ?? s.encounterSlug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={s.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 underline underline-offset-2 break-all transition-colors"
                    >
                      <GitBranch size={13} className="shrink-0" />
                      {s.repoUrl.replace('https://github.com/', '')}
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(s.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} de {submissions.length} entregas
          </div>
        </div>
      )}
    </div>
  )
}
