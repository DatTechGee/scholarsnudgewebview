import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import Button from '../components/shadcn/Button'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Input from '../components/shadcn/Input'
import Select from '../components/shadcn/Select'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getUsers, createUser, updateUser, deleteUser, getFaculties, getDepartments } from '../services/api'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  staff_id: '',
  faculty_id: '',
  department_id: '',
}

export default function Lecturers() {
  const [tokenInput, setTokenInput] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [faculties, setFaculties] = useState([])
  const [departments, setDepartments] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = useMemo(() => {
    if (tokenInput.trim()) return tokenInput.trim()
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('admin_token') || ''
    }
    return ''
  }, [tokenInput])

  useEffect(() => {
    if (!tokenInput.trim()) return
    window.localStorage.setItem('admin_token', tokenInput.trim())
  }, [tokenInput])

  useEffect(() => {
    if (!token) return
    getFaculties(token).then(d => setFaculties(Array.isArray(d) ? d : d?.data || [])).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token || !form.faculty_id) { setDepartments([]); return }
    getDepartments(token, form.faculty_id).then(d => setDepartments(Array.isArray(d) ? d : d?.data || [])).catch(() => setDepartments([]))
  }, [token, form.faculty_id])

  const loadLecturers = async (page = 1) => {
    setLoading(true); setError('')
    try {
      const data = await getUsers(token, { page, q: query || undefined, role: 'lecturer' })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setUsers(rows)
      setMeta({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || rows.length })
    } catch (_err) { setError('Failed to load lecturers.'); setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) loadLecturers(1) }, [query, token])

  const resetForm = () => { setForm(emptyForm); setEditingUser(null) }

  const openCreateForm = () => { resetForm(); setShowForm(true) }

  const openEditForm = (user) => {
    setEditingUser(user)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      staff_id: user.staff_id || '',
      faculty_id: user.faculty_id ? String(user.faculty_id) : '',
      department_id: user.department_id ? String(user.department_id) : '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.staff_id) {
      setError('Name, email, and staff ID are required.')
      return
    }
    if (!form.faculty_id) {
      setError('Faculty is required.')
      return
    }
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = {
        role: 'lecturer',
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        staff_id: form.staff_id,
        faculty_id: Number(form.faculty_id),
        department_id: form.department_id ? Number(form.department_id) : null,
      }
      if (editingUser) {
        await updateUser(editingUser.id, payload, token)
        setMessage('Lecturer updated successfully.')
      } else {
        const response = await createUser(payload, token)
        setMessage(response?.generated_password ? `Lecturer created. Generated password: ${response.generated_password}` : 'Lecturer created successfully.')
      }
      setShowForm(false); resetForm()
      await loadLecturers(meta.current_page)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save lecturer.')
    } finally { setBusy(false) }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete lecturer ${user.name}?`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteUser(user.id, token)
      setMessage('Lecturer deleted successfully.')
      await loadLecturers(meta.current_page)
    } catch (err) { setError(err?.response?.data?.message || 'Could not delete lecturer.') }
    finally { setBusy(false) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">Lecturers</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage all lecturer accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100 text-surface-600 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-accent-500" />{meta.total} total
          </span>
          <Button variant="default" size="sm" onClick={openCreateForm}>Add Lecturer</Button>
          <Button variant="outline" size="sm" onClick={() => loadLecturers(meta.current_page)} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
        </div>
      </div>

      <Card className="mb-4 p-4 bg-gradient-to-r from-surface-50 to-white">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or staff ID..." className="border-0 bg-transparent pl-0 focus:ring-0" />
        </div>
      </Card>

      {message ? <Card className="mb-4 p-4 bg-accent-50 border-accent-200 text-accent-800 text-sm flex items-center gap-2"><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{message}</Card> : null}
      {error ? <Card className="mb-4 p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2"><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</Card> : null}

      {showForm ? (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-sm">👤</div>
            <h2 className="text-lg font-bold text-surface-800">{editingUser ? 'Edit Lecturer' : 'Create Lecturer'}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <Input value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email <span className="text-red-400">*</span></label>
              <Input value={form.email} onChange={(event) => handleFormChange('email', event.target.value)} placeholder="Email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">{editingUser ? 'New Password (optional)' : 'Password'}</label>
              <Input type="password" value={form.password} onChange={(event) => handleFormChange('password', event.target.value)} placeholder={editingUser ? 'Leave blank to keep current' : 'Password'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Staff ID <span className="text-red-400">*</span></label>
              <Input value={form.staff_id} onChange={(event) => handleFormChange('staff_id', event.target.value)} placeholder="Staff ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Faculty <span className="text-red-400">*</span></label>
              <Select options={faculties.map(f => ({ value: String(f.id), label: f.name }))} value={form.faculty_id} onChange={(v) => { handleFormChange('faculty_id', v); handleFormChange('department_id', '') }} placeholder="Select faculty" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Department</label>
              <Select options={departments.map(d => ({ value: String(d.id), label: d.name }))} value={form.department_id} onChange={(v) => handleFormChange('department_id', v)} placeholder={form.faculty_id ? 'Select department' : 'Select faculty first'} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="default" onClick={handleSubmit} disabled={busy}>{editingUser ? 'Save Changes' : 'Create Lecturer'}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-12 text-center text-surface-400 text-sm">Loading lecturers...</div>
        : users.length === 0 ? <div className="p-12 text-center text-surface-400 text-sm">No lecturers found.</div>
        : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Staff ID</Th><Th>Faculty</Th><Th>Department</Th><Th>Status</Th><Th className="text-right">Actions</Th></Tr></Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id}>
                      <Td className="font-medium text-surface-800">{user.name}</Td>
                      <Td className="text-surface-500">{user.email}</Td>
                      <Td className="font-mono text-sm">{user.staff_id || <span className="text-surface-300">—</span>}</Td>
                      <Td className="text-sm text-surface-500">{user.faculty?.name || (typeof user.faculty === 'string' ? user.faculty : '—')}</Td>
                      <Td className="text-sm text-surface-500">{user.department?.name || (typeof user.department === 'string' ? user.department : '—')}</Td>
                      <Td><Badge variant={user.is_verified ? 'success' : 'warning'}>{user.is_verified ? 'Verified' : 'Pending'}</Badge></Td>
                      <Td className="text-right"><div className="flex justify-end gap-1.5"><Link href={`/lecturers/${user.id}`}><Button variant="ghost" size="sm">View</Button></Link><Button variant="ghost" size="sm" onClick={() => openEditForm(user)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>Delete</Button></div></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
              <span className="text-sm text-surface-500">Total: {meta.total} lecturers</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={meta.current_page <= 1 || loading} onClick={() => loadLecturers(meta.current_page - 1)}>Previous</Button>
                <span className="text-sm text-surface-500 px-2">Page {meta.current_page} of {meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadLecturers(meta.current_page + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </Layout>
  )
}
