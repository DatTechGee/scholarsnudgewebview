import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'
import Modal from '../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getAdminCourses, createCourse, updateCourse, deleteCourse, getLevels, getUsers } from '../services/api'

const emptyForm = { code: '', title: '', faculty_name: '', department_name: '', academic_level_id: '', course_unit: '', location_name: '', location_latitude: '', location_longitude: '', lecturer_id: '' }

export default function Courses() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [levels, setLevels] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) {
      getLevels(t).then(d => setLevels(Array.isArray(d) ? d : d?.data || [])).catch(() => {})
      getUsers(t, { role: 'lecturer', per_page: 500 }).then(d => setLecturers(Array.isArray(d?.data) ? d.data : [])).catch(() => {})
    }
  }, [])

  const loadCourses = async (page = 1) => {
    setLoading(true); setError('')
    try {
      const data = await getAdminCourses(token, { page })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setCourses(rows)
      setMeta({ current_page: data?.current_page || page, last_page: data?.last_page || 1, total: data?.total || rows.length })
    } catch (err) { setError('Failed to load courses.'); setCourses([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) loadCourses() }, [token])

  const openCreateForm = () => { setEditingCourse(null); setForm(emptyForm); setShowForm(true) }

  const openEditForm = (c) => {
    setEditingCourse(c)
    setForm({
      code: c.code || '',
      title: c.title || '',
      faculty_name: c.faculty_name || '',
      department_name: c.department_name || '',
      academic_level_id: c.academic_level_id ? String(c.academic_level_id) : '',
      course_unit: c.course_unit ? String(c.course_unit) : '',
      location_name: c.location_name || '',
      location_latitude: c.location_latitude || '',
      location_longitude: c.location_longitude || '',
      lecturer_id: c.lecturer_id ? String(c.lecturer_id) : '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.code || !form.title || !form.faculty_name || !form.department_name || !form.lecturer_id) { setError('Code, title, faculty, department and lecturer are required.'); return }
    setBusy(true); setError('')
    const payload = {
      code: form.code.toUpperCase().trim(),
      title: form.title.trim(),
      faculty_name: form.faculty_name.trim(),
      department_name: form.department_name.trim(),
      academic_level_id: form.academic_level_id ? Number(form.academic_level_id) : null,
      course_unit: form.course_unit ? Number(form.course_unit) : null,
      location_name: form.location_name.trim() || null,
      location_latitude: form.location_latitude ? Number(form.location_latitude) : null,
      location_longitude: form.location_longitude ? Number(form.location_longitude) : null,
      lecturer_id: form.lecturer_id ? Number(form.lecturer_id) : null,
    }
    try {
      if (editingCourse) await updateCourse(editingCourse.id, payload, token)
      else await createCourse(payload, token)
      setShowForm(false)
      await loadCourses(meta.current_page)
    } catch (err) { setError(err?.response?.data?.message || 'Failed to save course.') }
    finally { setBusy(false) }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete course ${c.code} - ${c.title}? This cannot be undone.`)) return
    setBusy(true); setError('')
    try { await deleteCourse(c.id, token); await loadCourses(meta.current_page) }
    catch (err) { setError(err?.response?.data?.message || 'Failed to delete course.') }
    finally { setBusy(false) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">Courses</h1>
          <p className="text-sm text-surface-500 mt-0.5">All courses across the institution</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100 text-surface-600 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-primary-500" />{meta.total} total
          </span>
          <Button variant="default" size="sm" onClick={openCreateForm}>Create Course</Button>
          <Button variant="outline" size="sm" onClick={loadCourses} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
        </div>
      </div>

      {error ? (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </Card>
      ) : null}

      {/* Create/Edit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6 w-full max-w-lg">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code <span className="text-red-400">*</span></label>
              <Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder="e.g. CSC101" disabled={!!editingCourse} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-400">*</span></label>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Course title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Faculty <span className="text-red-400">*</span></label>
              <Input value={form.faculty_name} onChange={(e) => setForm({...form, faculty_name: e.target.value})} placeholder="e.g. Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department <span className="text-red-400">*</span></label>
              <Input value={form.department_name} onChange={(e) => setForm({...form, department_name: e.target.value})} placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lecturer <span className="text-red-400">*</span></label>
              <select value={form.lecturer_id} onChange={(e) => setForm({...form, lecturer_id: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">Select lecturer</option>
                {lecturers.map(l => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
              <select value={form.academic_level_id} onChange={(e) => setForm({...form, academic_level_id: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">Select level</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Unit</label>
              <Input type="number" min={1} max={10} value={form.course_unit} onChange={(e) => setForm({...form, course_unit: e.target.value})} placeholder="e.g. 3" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Name</label>
              <Input value={form.location_name} onChange={(e) => setForm({...form, location_name: e.target.value})} placeholder="e.g. Room 201, Science Building" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSubmit} disabled={busy}>{editingCourse ? 'Save Changes' : 'Create Course'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {!token ? (
        <Card className="p-12 text-center text-surface-400 text-sm">Enter your admin token in the Users page first.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card-base h-16 animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-surface-400 text-sm">No courses found.</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Faculty</Th><Th>Units</Th><Th>Location</Th><Th></Th></Tr>
              </Thead>
              <Tbody>
                {courses.map(c => (
                  <Tr key={c.id}>
                    <Td className="font-mono font-medium text-primary-600">{c.code}</Td>
                    <Td className="text-surface-800 font-medium">{c.title}</Td>
                    <Td className="text-surface-600">{c.lecturer?.name || <span className="text-surface-300">—</span>}</Td>
                    <Td className="text-surface-500">{c.faculty_name || <span className="text-surface-300">—</span>}</Td>
                    <Td><Badge variant="outline">{c.course_unit || '—'}</Badge></Td>
                    <Td className="text-surface-500 max-w-[120px] truncate">{c.location_name || <span className="text-surface-300">—</span>}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${c.id}`)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => openEditForm(c)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(c)} disabled={busy}>Delete</Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <span className="text-sm text-surface-500">Total: {meta.total} courses</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => loadCourses(meta.current_page - 1)}>Previous</Button>
              <span className="text-sm text-surface-500 px-2">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => loadCourses(meta.current_page + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  )
}
