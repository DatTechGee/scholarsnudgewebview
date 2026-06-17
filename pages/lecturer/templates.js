import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { getLecturerSessionTemplates, createLecturerSessionTemplate, deleteLecturerSessionTemplate, getLecturerCourses } from '../../services/api'

function TemplateCard({ template, onDelete, onApply }) {
  const policy = template.policy_json
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-lg">📋</div>
          <div>
            <h3 className="font-bold text-slate-800">{template.name}</h3>
            <div className="text-xs text-slate-400 font-mono">#{template.id}</div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onApply?.(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Start session with this template"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button onClick={() => onDelete(template.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
            title="Delete template"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-slate-700">{template.duration_minutes || 60}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Minutes</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-slate-700">{template.radius_meters || 250}m</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Radius</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-slate-700">{template.seating_capacity || '∞'}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Capacity</div>
        </div>
      </div>
      {template.location_name && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {template.location_name}
        </div>
      )}
      {policy && Object.keys(policy).length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {policy.allow_self_checkout && <Badge variant="info" className="text-[10px]">Self Checkout</Badge>}
          {policy.require_face_scan && <Badge variant="warning" className="text-[10px]">Face Required</Badge>}
          {policy.require_location && <Badge variant="info" className="text-[10px]">Location Required</Badge>}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-3">{template.created_at ? `Created ${new Date(template.created_at).toLocaleDateString()}` : ''}</p>
    </div>
  )
}

export default function LecturerTemplates() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [templates, setTemplates] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', duration_minutes: 60, radius_meters: 250, seating_capacity: '', location_name: '' })

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    Promise.all([
      getLecturerSessionTemplates(t).then(d => setTemplates(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {}),
      getLecturerCourses(t).then(d => setCourses(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Template name required.'); return }
    setBusy(true); setError('')
    try {
      const payload = { name: form.name.trim(), duration_minutes: Number(form.duration_minutes) || 60, radius_meters: Number(form.radius_meters) || 250 }
      if (form.seating_capacity) payload.seating_capacity = Number(form.seating_capacity)
      if (form.location_name.trim()) payload.location_name = form.location_name.trim()
      await createLecturerSessionTemplate(payload, token)
      setShowCreate(false)
      setForm({ name: '', duration_minutes: 60, radius_meters: 250, seating_capacity: '', location_name: '' })
      const d = await getLecturerSessionTemplates(token)
      setTemplates(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create template.')
    } finally { setBusy(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await deleteLecturerSessionTemplate(id, token)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (_) { setError('Failed to delete template.') }
  }

  const handleApply = (template) => {
    router.push(`/lecturer/sessions?template_id=${template.id}`)
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Scheduled Sessions</h1>
          <p className="text-slate-500 text-sm">Create and manage reusable session templates for quick session setup</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all"
        ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> New Template</button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-red-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-2xl font-bold tracking-tight text-slate-800">{templates.length}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Total Templates</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-2xl font-bold tracking-tight text-slate-800">{templates.reduce((s, t) => s + (t.duration_minutes || 60), 0)}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Total Minutes</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-2xl font-bold tracking-tight text-slate-800">{courses.length}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Courses to Apply</div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Card key={i} className="h-48 animate-pulse bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-400 font-medium">No templates yet.</p>
          <p className="text-xs text-slate-400 mt-2 mb-4">Create reusable session templates to start sessions quickly with predefined settings.</p>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-1.5"
          ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Create First Template</button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => <TemplateCard key={t.id} template={t} onDelete={handleDelete} onApply={handleApply} />)}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Session Template">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">📋</div>
            <div>
              <div className="font-bold text-sm text-slate-800">New Session Template</div>
              <div className="text-xs text-slate-500">Pre-configure session settings for quick starting</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">Template Name *</label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 1-Hour Lecture" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-slate-700">Duration (min)</label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="60" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-slate-700">Radius (meters)</label>
              <Input type="number" value={form.radius_meters} onChange={(e) => setForm(f => ({ ...f, radius_meters: e.target.value }))} placeholder="250" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-slate-700">Seating Capacity</label>
              <Input type="number" value={form.seating_capacity} onChange={(e) => setForm(f => ({ ...f, seating_capacity: e.target.value }))} placeholder="Leave empty for unlimited" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-slate-700">Location Name</label>
              <Input value={form.location_name} onChange={(e) => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="e.g. Room 101" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={busy} className="flex-1 h-10">{busy ? 'Creating...' : 'Create Template'}</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-10">Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
