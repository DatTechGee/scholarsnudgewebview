import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { getLecturerCourses, createCourse, updateCourse, deleteCourse, getAcademicLevels } from '../../services/api'

const emptyForm = { code: '', title: '', course_unit: 2, faculty_name: '', department_name: '', academic_level_id: '', location_name: '', location_latitude: '', location_longitude: '', location_radius_meters: 250, seating_capacity: '' }

export default function LecturerCourses() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [levels, setLevels] = useState([])

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    load(t)
  }, [])

  const load = async (t) => {
    setLoading(true); setError('')
    try {
      const [c, l] = await Promise.all([
        getLecturerCourses(t),
        getAcademicLevels().catch(() => []),
      ])
      setCourses(Array.isArray(c?.data) ? c.data : Array.isArray(c) ? c : [])
      setLevels(Array.isArray(l) ? l : [])
    } catch (_) { setError('Failed to load courses.') }
    finally { setLoading(false) }
  }

  const resetForm = () => { setForm(emptyForm); setEditing(null) }

  const openCreate = () => { resetForm(); setShowForm(true) }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      code: c.code || '', title: c.title || '', course_unit: c.course_unit || 2,
      faculty_name: c.faculty_name || '',
      department_name: c.department_name || '',
      academic_level_id: c.academic_level_id ? String(c.academic_level_id) : '',
      location_name: c.location_name || '', location_latitude: c.location_latitude || '',
      location_longitude: c.location_longitude || '', location_radius_meters: c.location_radius_meters || 250,
      seating_capacity: c.seating_capacity || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.code || !form.title) { setError('Code and title required.'); return }
    if (!editing && !form.faculty_name) { setError('Faculty name is required.'); return }
    if (!editing && !form.department_name) { setError('Department name is required.'); return }
    setBusy(true); setError('')
    try {
      if (editing) {
        await updateCourse(editing.id, {
          code: form.code,
          title: form.title,
          course_unit: Number(form.course_unit),
          location_radius_meters: Number(form.location_radius_meters),
        }, token)
      } else {
        await createCourse({
          code: form.code,
          title: form.title,
          course_unit: Number(form.course_unit),
          faculty_name: form.faculty_name.trim(),
          department_name: form.department_name.trim(),
          academic_level_id: form.academic_level_id ? Number(form.academic_level_id) : null,
          location_name: form.location_name || null,
          location_latitude: form.location_latitude ? Number(form.location_latitude) : null,
          location_longitude: form.location_longitude ? Number(form.location_longitude) : null,
          location_radius_meters: Number(form.location_radius_meters),
          seating_capacity: form.seating_capacity ? Number(form.seating_capacity) : null,
        }, token)
      }
      setShowForm(false); resetForm(); await load(token)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save course.')
    } finally { setBusy(false) }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete course "${c.code}"?`)) return
    setBusy(true)
    try { await deleteCourse(c.id, token); await load(token) }
    catch (_) { setError('Failed to delete course.') }
    finally { setBusy(false) }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Courses</h1>
        <p className="text-slate-500 text-sm">Create and manage your courses</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      <div className="flex gap-2 mb-6">
        <Button onClick={openCreate}>New Course</Button>
        <Button variant="ghost" onClick={() => load(token)} disabled={loading}>Refresh</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-400 mb-4">No courses yet.</p>
          <Button onClick={openCreate}>Create Your First Course</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map(c => (
            <Card key={c.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-slate-800">{c.code}</span>
                    <span className="text-slate-600">{c.title}</span>
                    {c.active_session ? <Badge variant="success">🟢 Live</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                    <span>🏛️ {c.faculty_name || '—'}</span>
                    {c.department_name ? <span>📂 {c.department_name}</span> : null}
                    <span>📖 {c.course_unit || '—'} units</span>
                    <span>👥 {c.roster_count || 0} students</span>
                    {c.seating_capacity ? <span>💺 {c.seating_capacity} seats</span> : null}
                  </div>
                  {c.location_name ? (
                    <div className="text-sm text-slate-400 mt-1">
                      📍 {c.location_name}{c.location_radius_meters ? ` (${c.location_radius_meters}m radius)` : ''}
                    </div>
                  ) : null}
                  {c.total_sessions != null ? (
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="text-emerald-600 font-medium">{c.total_attendance || 0} total check-ins</span>
                      <span className="text-blue-600 font-medium">{c.total_sessions} sessions</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 ml-4">
                  <Button onClick={() => router.push(`/lecturer/manage/${c.id}`)} className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-4 py-2 rounded-lg mb-2">
                    🎯 Manage
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => { openEdit(c) }}>Edit</Button>
                    <Button variant="destructive" onClick={() => handleDelete(c)} disabled={busy}>Delete</Button>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => router.push(`/lecturer/sessions?course_id=${c.id}`)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">📋 Sessions</button>
                    <button onClick={() => router.push(`/lecturer/attendance?course_id=${c.id}`)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">📊 Reports</button>
                    <button onClick={() => router.push(`/lecturer/timetable?course_id=${c.id}`)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">📅 Timetable</button>
                    <button onClick={() => router.push(`/lecturer/venues?course_id=${c.id}`)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">📍 Venues</button>
                    <button onClick={() => router.push(`/lecturer/shares?course_id=${c.id}`)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">🔄 Share</button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Course' : 'New Course'}>
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Code *</label>
              <Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder="e.g. CSC101" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Course Title *</label>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Intro to CS" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Unit</label>
              <Input type="number" min={1} max={10} value={form.course_unit} onChange={(e) => setForm({...form, course_unit: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Academic Level</label>
              <select value={form.academic_level_id} onChange={(e) => setForm({...form, academic_level_id: e.target.value})} className="px-3 py-2 border rounded-md w-full bg-white">
                <option value="">Select level</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Faculty Name *</label>
              <Input value={form.faculty_name} onChange={(e) => setForm({...form, faculty_name: e.target.value})} placeholder="e.g. Faculty of Science" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department Name *</label>
              <Input value={form.department_name} onChange={(e) => setForm({...form, department_name: e.target.value})} placeholder="e.g. Computer Science" />
            </div>
          </div>
          <details className="border-t pt-4">
            <summary className="text-sm font-semibold text-slate-600 cursor-pointer select-none">Location (Optional)</summary>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Location Name</label>
                <Input value={form.location_name} onChange={(e) => setForm({...form, location_name: e.target.value})} placeholder="e.g. LT1" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Radius (m)</label>
                <Input type="number" min={1} value={form.location_radius_meters} onChange={(e) => setForm({...form, location_radius_meters: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Latitude</label>
                <Input type="number" step="any" value={form.location_latitude} onChange={(e) => setForm({...form, location_latitude: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Longitude</label>
                <Input type="number" step="any" value={form.location_longitude} onChange={(e) => setForm({...form, location_longitude: e.target.value})} />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm text-slate-600 mb-1">Seating Capacity</label>
              <Input type="number" min={1} value={form.seating_capacity} onChange={(e) => setForm({...form, seating_capacity: e.target.value})} />
            </div>
          </details>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={busy}>{editing ? 'Save Changes' : 'Create Course'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
