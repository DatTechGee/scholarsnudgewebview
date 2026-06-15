import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { getMe, changePassword } from '../../services/api'
import { useAuth } from '../../components/AuthContext'

export default function LecturerProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    const token = window.localStorage.getItem('admin_token') || ''
    if (!token) { setLoading(false); return }
    loadData(token)
  }, [])

  const loadData = async (token) => {
    setLoading(true); setError('')
    try {
      const res = await getMe(token)
      setProfile(res?.data || res || null)
    } catch (_) {
      setError('Failed to load profile.')
    } finally { setLoading(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwForm.current_password || !pwForm.password || !pwForm.password_confirmation) {
      setPwError('All password fields are required.'); return
    }
    if (pwForm.password.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwForm.password !== pwForm.password_confirmation) { setPwError('New passwords do not match.'); return }
    setPwBusy(true); setPwError(''); setPwSuccess('')
    const token = window.localStorage.getItem('admin_token') || ''
    try {
      const res = await changePassword(pwForm, token)
      setPwSuccess(res?.message || 'Password changed successfully.')
      setPwForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      setPwError(err?.response?.data?.message || err.message || 'Failed to change password.')
    } finally { setPwBusy(false) }
  }

  const p = profile || user || {}

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800">Lecturer Profile</h1>
      <p className="text-slate-500 text-sm mt-1">View your profile and account details</p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-4">
          <Card className="h-32 animate-pulse bg-slate-100" />
          <Card className="h-48 animate-pulse bg-slate-100" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-2xl font-bold text-white">
                {(p.name || 'L').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-800">{p.name || 'Lecturer'}</h2>
                <p className="text-sm text-slate-500">{p.email || '—'}</p>
                {p.staff_id ? <p className="text-sm text-slate-500 mt-0.5"><span className="font-medium">Staff ID:</span> {p.staff_id}</p> : null}
              </div>
              <Badge variant="info">Lecturer</Badge>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Account Info</h3>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div><span className="text-slate-500">Name</span><p className="text-slate-800 font-medium">{p.name || '—'}</p></div>
              <div><span className="text-slate-500">Email</span><p className="text-slate-800 font-medium">{p.email || '—'}</p></div>
              <div><span className="text-slate-500">Role</span><p className="text-slate-800 font-medium">Lecturer</p></div>
              <div><span className="text-slate-500">Faculty</span><p className="text-slate-800 font-medium">{p.faculty_name || '—'}</p></div>
              <div><span className="text-slate-500">Department</span><p className="text-slate-800 font-medium">{p.department_name || '—'}</p></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Change Password</h3>
            {pwError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{pwError}</div> : null}
            {pwSuccess ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">{pwSuccess}</div> : null}
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required
                  className="w-full px-3 py-2 border-2 rounded-xl text-sm bg-surface-50/80 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} required minLength={8}
                  className="w-full px-3 py-2 border-2 rounded-xl text-sm bg-surface-50/80 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" value={pwForm.password_confirmation} onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })} required
                  className="w-full px-3 py-2 border-2 rounded-xl text-sm bg-surface-50/80 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
              <Button type="submit" disabled={pwBusy}>{pwBusy ? 'Updating...' : 'Change Password'}</Button>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  )
}
