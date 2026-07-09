'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Code2, Menu, X, BookOpen, LayoutDashboard, LogIn } from 'lucide-react'
import { LevelDisplay } from '@/components/features/gamification/LevelDisplay'
import { XPBar } from '@/components/features/gamification/XPBar'
import { UserMenu } from '@/components/shared/UserMenu'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/cursos/poo-java', label: 'Curso',     Icon: BookOpen       },
  { href: '/dashboard',       label: 'Dashboard', Icon: LayoutDashboard },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 size={18} />
          </div>
          <span>POO Academy</span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:block w-40">
              <XPBar />
            </div>
          )}
          {user && <LevelDisplay />}

          {!loading && (
            user ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <LogIn size={14} />
                Entrar
              </Link>
            )
          )}

          {/* Hamburger — mobile only */}
          {user && (
            <button
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {user && (
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-200 border-t bg-background',
            mobileOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="px-3 pt-2 pb-1 sm:hidden">
              <XPBar />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
