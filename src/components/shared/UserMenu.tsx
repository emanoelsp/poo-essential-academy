'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User, Coins } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamificationStore } from '@/stores/gamificationStore'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const router = useRouter()
  const { user, profile, logout, isAdmin } = useAuth()
  const coins = useGamificationStore((s) => s.coins)
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
      >
        Entrar
      </Link>
    )
  }

  const initial = (profile?.displayName || user.email || '?')[0].toUpperCase()

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    router.push('/login')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/50 transition"
        aria-label="Menu do usuário"
      >
        {profile?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border bg-popover shadow-xl overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="font-medium text-sm truncate">{profile?.displayName || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 text-amber-600 dark:text-amber-400">
                <Coins size={13} />
                <span className="text-xs font-semibold">{coins} POO Coins</span>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <MenuItem href="/dashboard" icon={<User size={14} />} onClick={() => setOpen(false)}>
                Meu Progresso
              </MenuItem>
              {isAdmin && (
                <MenuItem href="/admin" icon={<Settings size={14} />} onClick={() => setOpen(false)}>
                  Painel Admin
                </MenuItem>
              )}
              <button
                onClick={handleLogout}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors'
                )}
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  )
}
