import { useState } from 'react'
import Link from 'next/link'
import Card from '../components/shadcn/Card'
import Button from '../components/shadcn/Button'
import { login } from '../services/api'

export default function Login() {
  const [loginMode, setLoginMode] = useState('email')

  const loginModeLabel = loginMode === 'matric' ? 'Matric Number' : loginMode === 'staff_id' ? 'Staff ID' : 'Email'
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!credential || !password) { setError(`${loginModeLabel} and password required.`); return }
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

      const base = window.location.pathname.startsWith('/school') ? '/school' : ''
      const dest = role === 'admin' || role === 'super_admin' ? base : role === 'lecturer' ? `${base}/lecturer` : `${base}/student`
      window.location.href = dest
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Login failed'
      setError(typeof msg === 'string' ? msg : 'Invalid credentials')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-500/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-500/[0.04] blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/[0.03] blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-secondary-500/[0.03] blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 bg-dots opacity-40" />
      </div>

      <Card glass className="w-full max-w-md p-6 sm:p-8 md:p-10 animate-slide-up relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
            <span className="text-white font-extrabold text-xl">SN</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-800">Welcome Back</h1>
          <p className="text-surface-500 mt-1.5 text-sm font-medium">Sign in to your ScholarsNudge account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-box bg-red-50 border-red-200 text-red-700 mb-5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login Mode Toggle */}
          <div className="flex bg-surface-100 rounded-xl p-1 mb-2">
            {[
              { key: 'email', label: 'Email', icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' },
              { key: 'matric', label: 'Matric', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
              { key: 'staff_id', label: 'Staff ID', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => { setLoginMode(mode.key); setCredential(''); setError('') }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${loginMode === mode.key ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >
                <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mode.icon} /></svg>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Credential Input */}
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">{loginModeLabel}</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={loginMode === 'matric' ? 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' : loginMode === 'staff_id' ? 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' : 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'} />
                </svg>
              </div>
              <input
                type={loginMode === 'email' ? 'email' : 'text'}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder={loginMode === 'matric' ? 'e.g. CSC/2020/001' : loginMode === 'staff_id' ? 'e.g. LEC001' : 'you@example.com'}
                required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-12 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-all"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-[52px] text-base" disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</span>
            ) : 'Sign In'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <a href="/forgot-password" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">Forgot Password?</a>
          <p className="text-sm text-surface-500 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-bold">Create one</Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-surface-400 mt-1">
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
        </div>
      </Card>
    </div>
  )
}
