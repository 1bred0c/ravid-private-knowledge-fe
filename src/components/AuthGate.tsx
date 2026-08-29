import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login, register, fetchMe } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { BookMarked } from 'lucide-react'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <>{children}</>
  return <AuthForm />
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const setTokens = useAuthStore((s) => s.setTokens)

  const loginMutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: async (tokens) => {
      setTokens(tokens.access, tokens.refresh, username)
    },
  })

  const registerMutation = useMutation({
    mutationFn: () =>
      register({
        username,
        email,
        firstName,
        lastName,
        password,
      }),
    onSuccess: () => loginMutation.mutate(),
  })

  const error = loginMutation.error || registerMutation.error
  const pending = loginMutation.isPending || registerMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError('')
    if (mode === 'login') {
      loginMutation.mutate()
      return
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }
    registerMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <BookMarked className="text-verdigris" size={28} strokeWidth={1.5} />
          <span className="font-display text-2xl text-ink-text tracking-wide">RAVID</span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-ink-panel border border-ink-line rounded-card p-6 space-y-4"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted mb-1">
            {mode === 'login' ? 'Sign in to the archive' : 'Register a new reader'}
          </p>

          <Field label="Username">
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>

          {mode === 'register' && (
            <>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <input
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Field>
              </div>
            </>
          )}

          <Field label="Password">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </Field>

          {mode === 'register' && (
            <Field label="Confirm password">
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setValidationError('')
                }}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
          )}

          {(validationError || error) && (
            <p className="text-danger text-sm">
              {validationError ||
                ((error as any)?.response?.data?.detail ??
                  (error as any)?.response?.data?.error ??
                  'Something went wrong. Check the details and try again.')}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-verdigris hover:bg-verdigris-bright transition-colors text-ink-bg font-medium rounded-card py-2.5 disabled:opacity-50"
          >
            {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full text-center text-sm text-ink-muted hover:text-ink-text transition-colors"
          >
            {mode === 'login' ? "No account yet? Register" : 'Already registered? Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  )
}
