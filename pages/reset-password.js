import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Card from '../components/shadcn/Card'
import Button from '../components/shadcn/Button'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) { setError('Reset token is missing from the URL.'); return }
    if (!email || !password) { setError('Email and password are required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== passwordConfirmation) { setError('Passwords do not match.'); return }
    setBusy(true); setError(''); setSuccess('')
    try {
      const res = await resetPassword({ email, password, password_confirmation: passwordConfirmation, token })
      setSuccess(res?.message || 'Password reset successfully! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to reset password.')
    } finally { setBusy(false) }
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
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-heading2 text-surface-800">Reset Password</h1>
          <p className="text-surface-500 mt-1.5 text-sm font-medium">Choose a new password for your account</p>
        </div>

        {error ? (
          <div className="alert-box bg-red-50 border-red-200 text-red-700 mb-5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="alert-box bg-emerald-50 border-emerald-200 text-emerald-700 mb-5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{success}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">New Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8}
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Repeat password" required
                className="w-full h-[52px] rounded-xl border-2 bg-surface-50/80 pl-12 pr-4 text-sm font-medium text-surface-800 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-[52px] text-base" disabled={busy}>
            {busy ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-surface-500 font-medium">
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold">Back to sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
