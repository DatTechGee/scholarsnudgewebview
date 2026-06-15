import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Card from '../components/shadcn/Card'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'
import { login } from '../services/api'

export default function Login() {
  const router = useRouter()
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isMatric = credential.includes('/')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!credential || !password) { setError('Email/Matric number and password required.'); return }
    setBusy(true)
    setError('')
    try {
      const res = await login(credential, password)
      const token = res?.token || res?.data?.token
      if (!token) throw new Error('No token in response')
      window.localStorage.setItem('admin_token', token)

      const me = res?.user || res?.data?.user || {}
      const role = me.role || 'admin'
      window.localStorage.setItem('user_role', role)
      window.localStorage.setItem('user_name', me.name || 'User')
      window.localStorage.setItem('user_data', JSON.stringify(me))

      if (role === 'admin' || role === 'super_admin') router.push('/')
      else if (role === 'lecturer') router.push('/lecturer')
      else router.push('/student')
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Login failed'
      setError(typeof msg === 'string' ? msg : 'Invalid credentials')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-500/5 blur-3xl" />
      </div>

      <Card glass className="w-full max-w-md p-8 animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
            <span className="text-white font-extrabold text-xl">SN</span>
          </div>
          <h1 className="text-heading2 text-surface-800">Welcome Back</h1>
          <p className="text-surface-500 mt-1.5 text-sm font-medium">Sign in to your account</p>
        </div>

        {error ? (
          <div className="alert-box bg-red-50 border-red-200 text-red-700 mb-5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">{isMatric ? 'Matric Number' : 'Email'}</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMatric ? 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' : 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'} />
                </svg>
              </div>
              <input
                type={isMatric ? 'text' : 'email'}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder={isMatric ? 'e.g. CSC/2020/001' : 'you@example.com'}
                required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full h-[52px] text-base" disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</span>
            ) : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-surface-500 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-bold">Create one</Link>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-surface-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary-500/5 border border-primary-200/30 font-medium">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary-500/5 border border-primary-200/30 font-medium">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Face ID
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary-500/5 border border-primary-200/30 font-medium">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            GPS
          </span>
        </div>
      </Card>
    </div>
  )
}
