import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Button from '../components/shadcn/Button'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Input from '../components/shadcn/Input'
import Select from '../components/shadcn/Select'
import Modal from '../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { createUser, deleteUser, getLevels, getUsers, updateUser, getFaculties, getDepartments } from '../services/api'

const emptyForm = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  faculty_id: '',
  department_id: '',
  academic_level_id: '',
  matric_number: '',
}

export default function Students() {
  const router = useRouter()
  const [tokenInput, setTokenInput] = useState('')
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [faculties, setFaculties] = useState([])
  const [departments, setDepartments] = useState([])
  const [levels, setLevels] = useState([])
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = useMemo(() => {
    if (tokenInput.trim()) return tokenInput.trim()
    if (typeof window !== 'undefined') return window.localStorage.getItem('admin_token') || ''
    return ''
  }, [tokenInput])

  useEffect(() => { if (tokenInput.trim()) window.localStorage.setItem('admin_token', tokenInput.trim()) }, [tokenInput])

  useEffect(() => {
    if (!token) return
    Promise.all([
      getFaculties(token).then(d => setFaculties(Array.isArray(d) ? d : d?.data || [])).catch(() => {}),
      getLevels(token).then(d => setLevels(Array.isArray(d) ? d : d?.data || [])).catch(() => {}),
    ])
  }, [token])

  useEffect(() => {
    if (!token || !form.faculty_id) { setDepartments([]); return }
    getDepartments(token, form.faculty_id).then(d => setDepartments(Array.isArray(d) ? d : d?.data || [])).catch(() => setDepartments([]))
  }, [token, form.faculty_id])

  const loadStudents = async (page = 1) => {
    setLoading(true); setError('')
    try {
      const data = await getUsers(token, { page, q: query || undefined, role: 'student' })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setStudents(rows)
      setMeta({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || rows.length })
    } catch (_err) { setError('Failed to load students.'); setStudents([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStudents(1) }, [query])

  const resetForm = () => { setForm(emptyForm); setEditingStudent(null) }

  const openCreateForm = () => { resetForm(); setShowForm(true) }

  const openEditForm = (student) => {
    setEditingStudent(student)
    setForm({
      role: 'student',
      name: student.name || '',
      email: student.email || '',
      password: '',
      faculty_id: student.faculty_id ? String(student.faculty_id) : '',
      department_id: student.department_id ? String(student.department_id) : '',
      academic_level_id: student.academic_level_id ? String(student.academic_level_id) : '',
      matric_number: student.matric_number || '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    if (!form.faculty_id) { setError('Faculty is required.'); return }
    if (!form.department_id) { setError('Department is required.'); return }
    if (!form.academic_level_id) { setError('Level is required.'); return }
    if (!form.matric_number) { setError('Matric number is required.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = {
        role: 'student',
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        faculty_id: Number(form.faculty_id),
        department_id: Number(form.department_id),
        academic_level_id: Number(form.academic_level_id),
        matric_number: form.matric_number,
      }
      if (editingStudent) {
        await updateUser(editingStudent.id, payload, token)
        setMessage('Student updated successfully.')
      } else {
        const response = await createUser(payload, token)
        setMessage(response?.generated_password ? `Student created. Generated password: ${response.generated_password}` : 'Student created successfully.')
      }
      setShowForm(false); resetForm()
      await loadStudents(meta.current_page)
    } catch (err) { setError(err?.response?.data?.message || 'Could not save student.') }
    finally { setBusy(false) }
  }

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student ${student.name}?`)) return
    setBusy(true); setError(''); setMessage('')
    try { await deleteUser(student.id, token); setMessage('Student deleted successfully.'); await loadStudents(meta.current_page) }
    catch (err) { setError(err?.response?.data?.message || 'Could not delete student.') }
    finally { setBusy(false) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 text-sm">Manage students with create, update, and delete.</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />{meta.total} total
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4 mb-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, matric number" className="md:col-span-2" />
        <Button variant="default" className="w-full" onClick={openCreateForm}>Add Student</Button>
        <Button variant="ghost" className="w-full" onClick={() => loadStudents(meta.current_page)}>Refresh</Button>
      </div>

      {message ? <Card className="mb-4 border-green-200 bg-green-50 text-green-700 p-4 text-sm">{message}</Card> : null}
      {error ? <Card className="mb-4 border-red-200 bg-red-50 text-red-700 p-4 text-sm">{error}</Card> : null}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingStudent ? 'Edit Student' : 'Create Student'}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-400">*</span></label>
            <Input value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-400">*</span></label>
            <Input value={form.email} onChange={(event) => handleFormChange('email', event.target.value)} placeholder="Email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{editingStudent ? 'New Password (optional)' : 'Password'}</label>
            <Input value={form.password} onChange={(event) => handleFormChange('password', event.target.value)} placeholder={editingStudent ? 'Leave blank to keep current' : 'Password (optional)'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Faculty <span className="text-red-400">*</span></label>
            <Select options={faculties.map(f => ({ value: String(f.id), label: f.name }))} value={form.faculty_id} onChange={(v) => { handleFormChange('faculty_id', v); handleFormChange('department_id', '') }} placeholder="Select faculty" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department <span className="text-red-400">*</span></label>
            <Select options={departments.map(d => ({ value: String(d.id), label: d.name }))} value={form.department_id} onChange={(v) => handleFormChange('department_id', v)} placeholder={form.faculty_id ? 'Select department' : 'Select faculty first'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level <span className="text-red-400">*</span></label>
            <Select options={levels.map((l) => ({ value: String(l.id), label: l.name }))} value={form.academic_level_id} onChange={(value) => handleFormChange('academic_level_id', value)} placeholder="Select level" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matric Number <span className="text-red-400">*</span></label>
            <Input value={form.matric_number} onChange={(event) => handleFormChange('matric_number', event.target.value)} placeholder="Matric number" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="default" onClick={handleSubmit} disabled={busy}>{editingStudent ? 'Save Changes' : 'Create Student'}</Button>
          <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
        </div>
      </Modal>

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-400">Loading students...</div>
        : students.length === 0 ? <div className="p-12 text-center text-slate-400">No students found.</div>
        : (
          <>
            <Table>
              <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Matric Number</Th><Th>Level</Th><Th>Faculty</Th><Th>Department</Th><Th>Status</Th><Th className="text-right">Actions</Th></Tr></Thead>
              <Tbody>
                {students.map((student) => (
                  <Tr key={student.id}>
                    <Td className="font-medium">{student.name}</Td>
                    <Td className="text-surface-500">{student.email}</Td>
                    <Td>{student.matric_number || <span className="text-slate-300">—</span>}</Td>
                    <Td>{student.academic_level?.name || <span className="text-slate-300">—</span>}</Td>
                    <Td className="text-sm text-slate-500">{student.faculty?.name || (typeof student.faculty === 'string' ? student.faculty : '—')}</Td>
                    <Td className="text-sm text-slate-500">{student.department?.name || (typeof student.department === 'string' ? student.department : '—')}</Td>
                    <Td><Badge variant={student.is_verified ? 'success' : 'warning'}>{student.is_verified ? 'Verified' : 'Pending'}</Badge></Td>
                    <Td className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => openEditForm(student)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(student)}>Delete</Button><Button variant="outline" size="sm" onClick={() => router.push(`/students/${student.id}`)}>View</Button></div></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
              <span className="text-sm text-slate-500">Total: {meta.total} students</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => loadStudents(meta.current_page - 1)}>Previous</Button>
                <span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
                <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadStudents(meta.current_page + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </Layout>
  )
}
