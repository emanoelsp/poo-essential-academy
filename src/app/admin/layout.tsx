'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { watchAllSubmissions } from '@/lib/firestore'
import {
  LayoutDashboard,
  Lock,
  BookOpen,
  Users,
  Sword,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/modulos',   label: 'Módulos',     icon: Lock            },
  { href: '/admin/conteudo',  label: 'Gabarito',    icon: BookOpen        },
  { href: '/admin/validacoes',label: 'Validações',  icon: Sword           },
  { href: '/admin/alunos',    label: 'Alunos',      icon: Users           },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.replace('/cursos/poo-java')
    }
  }, [loading, profile, router])

  // Live count of pending challenge validations for the sidebar badge
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return
    const unsub = watchAllSubmissions((subs) =>
      setPendingCount(subs.filter((s) => s.status === 'pending').length)
    )
    return unsub
  }, [profile])

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando permissões…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-muted/20 flex flex-col">
        <div className="px-4 py-5 border-b flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" />
          <div>
            <p className="font-bold text-sm">Admin</p>
            <p className="text-xs text-muted-foreground">POO Academy</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon size={16} />
              {label}
              {href === '/admin/validacoes' && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
              {pathname === href && !(href === '/admin/validacoes' && pendingCount > 0) && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link
            href="/cursos/poo-java"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            ← Voltar ao curso
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
