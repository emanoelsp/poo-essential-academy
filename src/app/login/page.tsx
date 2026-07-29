'use client'

import { useState, forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Code2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
import { useAuth } from '@/contexts/AuthContext'
import { isAdminEmail } from '@/lib/firestore'
import { getFirebaseAuth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const loginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
})

type LoginForm    = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function LoginPage() {
  const router = useRouter()
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const handleLogin = async (data: LoginForm) => {
    setError(null); setLoading(true)
    try {
      await loginWithEmail(data.email, data.password)
      router.push(isAdminEmail(data.email) ? '/admin' : '/dashboard')
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'auth/invalid-credential') setError('E-mail ou senha incorretos.')
      else if (code === 'auth/too-many-requests') setError('Muitas tentativas. Tente mais tarde.')
      else setError('Erro ao fazer login.')
    } finally { setLoading(false) }
  }

  const handleRegister = async (data: RegisterForm) => {
    setError(null); setLoading(true)
    try {
      await registerWithEmail(data.email, data.password, data.name)
      router.push(isAdminEmail(data.email) ? '/admin' : '/dashboard')
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'auth/email-already-in-use') setError('E-mail já cadastrado.')
      else setError('Erro ao criar conta.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(null); setLoading(true)
    try {
      await loginWithGoogle()
      const cu = getFirebaseAuth().currentUser
      router.push(cu && isAdminEmail(cu.email ?? '') ? '/admin' : '/dashboard')
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      else if (code === 'auth/popup-blocked') setError('Popup bloqueado pelo navegador. Libere popups para este site.')
      else if (code === 'auth/unauthorized-domain') setError('Este domínio não está autorizado no Firebase Auth.')
      else if (code === 'auth/operation-not-allowed') setError('Login com Google não está habilitado no projeto Firebase.')
      else if (code === 'permission-denied') setError('Login OK, mas o acesso ao banco foi negado (regras do Firestore).')
      else { console.error('Google login error:', e); setError('Erro ao entrar com Google.') }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Code2 size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-xl">POO Academy</p>
              <p className="text-xs text-slate-400">Programação Orientada a Objetos</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-7">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                  mode === m
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Google */}
          <Button
            type="button" variant="outline" onClick={handleGoogle} disabled={loading}
            className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 mb-5"
          >
            <GoogleIcon />
            Continuar com Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-transparent px-3">ou com e-mail</span>
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <InputField label="E-mail" type="email" icon={<Mail size={15} />}
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email')} />
              <InputField
                label="Senha" type={showPass ? 'text' : 'password'} icon={<Lock size={15} />}
                suffix={
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="text-slate-400 hover:text-white">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register('password')} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <InputField label="Nome" type="text" icon={<User size={15} />}
                error={registerForm.formState.errors.name?.message}
                {...registerForm.register('name')} />
              <InputField label="E-mail" type="email" icon={<Mail size={15} />}
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')} />
              <InputField
                label="Senha" type={showPass ? 'text' : 'password'} icon={<Lock size={15} />}
                suffix={
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="text-slate-400 hover:text-white">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={registerForm.formState.errors.password?.message}
                {...registerForm.register('password')} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Criando conta…' : 'Criar conta'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Ao entrar, você concorda com os termos de uso da POO Academy.
        </p>
      </div>
    </div>
  )
}

// ─── Input component ──────────────────────────────────────────────────────────

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string; icon?: ReactNode; suffix?: ReactNode; error?: string
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon, suffix, error, ...props }, ref) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-slate-400">{icon}</span>}
        <input ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition',
            'focus:border-primary focus:ring-1 focus:ring-primary',
            icon ? 'pl-9' : '', suffix ? 'pr-9' : '',
            error ? 'border-red-500' : 'border-white/10',
          )}
          {...props} />
        {suffix && <span className="absolute right-3">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
InputField.displayName = 'InputField'
