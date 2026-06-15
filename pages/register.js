import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Card from '../components/shadcn/Card'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://scholarsnudge.com/api'

export default function Register() {
  const router = useRouter()
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [lecturerId, setLecturerId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !password) {
      setError('Name, email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (role === 'student' && !matricNumber) {
      setError('Students must provide their matric number.')
      return
    }
    if (role === 'lecturer' && !lecturerId) {
      setError('Lecturers must provide a lecturer ID.')
      return
    }

    setBusy(true)
    try {
      const payload = {
        name,
        email,
        password,
        role,
      }
      if (role === 'student') payload.matric_number = matricNumber.trim().toUpperCase()
      if (role === 'lecturer') payload.lecturer_id = lecturerId.trim()

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Registration failed')

      const token = data?.token
      if (token) {
        window.localStorage.setItem('admin_token', token)
        window.localStorage.setItem('user_role', data?.user?.role || role)
        window.localStorage.setItem('user_name', data?.user?.name || name)
      }

      setSuccess(data?.message || 'Account created! Redirecting...')
      setTimeout(() => {
        const userRole = data?.user?.role || role
        router.push(userRole === 'admin' ? '/' : '/lecturer')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 p-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-lg rounded-2xl border-0">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Join Scholars Nudge</p>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2"><svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>{error}</div> : null}
        {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">{success}</div> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {['student', 'lecturer'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${role === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >{r === 'student' ? '🎓 Student' : '👨‍🏫 Lecturer'}</button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} />
          </div>

          {role === 'student' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Matric Number *</label>
              <Input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="e.g. CSC/2020/001" required />
              <p className="text-xs text-amber-600 mt-1">Your lecturer must add you to a course roster first before you can register.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lecturer / Staff ID *</label>
              <Input value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} placeholder="e.g. LEC/001" required />
            </div>
          )}

          <Button type="submit" className="w-full justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-200" disabled={busy}>
            {busy ? 'Creating Account...' : `Create ${role === 'student' ? 'Student' : 'Lecturer'} Account`}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
