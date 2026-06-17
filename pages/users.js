import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/shadcn/Button'
import Card from '../components/shadcn/Card'
import Input from '../components/shadcn/Input'
import Select from '../components/shadcn/Select'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { createUser, deleteUser, getLevels, getUsers, importUsersCsv, updateUser, getFaculties, getDepartments } from '../services/api'

const emptyForm = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  faculty_id: '',
  department_id: '',
  academic_level_id: '',
  matric_number: '',
  staff_id: '',
}

export default function Users() {
  const [tokenInput, setTokenInput] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [faculties, setFaculties] = useState([])
  const [departments, setDepartments] = useState([])
  const [levels, setLevels] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importFile, setImportFile] = useState(null)

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

  const loadUsers = async (page = 1) => {
    setLoading(true); setError('')
    try {
      const data = await getUsers(token, { page, q: query || undefined, role: roleFilter || undefined })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setUsers(rows)
      setMeta({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || rows.length })
    } catch (_err) { setError('Failed to load users.'); setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers(1) }, [query, roleFilter])

  const resetForm = () => { setForm(emptyForm); setEditingUser(null) }

  const openCreateForm = () => { resetForm(); setShowForm(true) }

  const openEditForm = (user) => {
    setEditingUser(user)
    setForm({
      role: user.role || 'student',
      name: user.name || '',
      email: user.email || '',
      password: '',
      faculty_id: user.faculty_id ? String(user.faculty_id) : '',
      department_id: user.department_id ? String(user.department_id) : '',
      academic_level_id: user.academic_level_id ? String(user.academic_level_id) : '',
      matric_number: user.matric_number || '',
      staff_id: user.staff_id || '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev, [field]: value,
      ...(field === 'role' && value === 'lecturer' ? { academic_level_id: '', matric_number: '' } : {}),
      ...(field === 'role' && value === 'student' ? { staff_id: '' } : {}),
    }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return }
    if (!form.faculty_id) { setError('Faculty is required.'); return }
    if (form.role === 'student') {
      if (!form.department_id) { setError('Department is required for students.'); return }
      if (!form.academic_level_id) { setError('Level is required for students.'); return }
      if (!form.matric_number) { setError('Matric number is required for students.'); return }
    }
    if (form.role === 'lecturer' && !form.staff_id) { setError('Staff ID is required for lecturers.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const payload = {
        role: form.role,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        faculty_id: Number(form.faculty_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        academic_level_id: form.role === 'student' ? Number(form.academic_level_id) : null,
        matric_number: form.role === 'student' ? form.matric_number : null,
        staff_id: form.role === 'lecturer' ? form.staff_id : null,
      }
      if (editingUser) { await updateUser(editingUser.id, payload, token); setMessage('User updated successfully.') }
      else { const response = await createUser(payload, token); setMessage(response?.generated_password ? `User created. Generated password: ${response.generated_password}` : 'User created successfully.') }
      setShowForm(false); resetForm(); await loadUsers(meta.current_page)
    } catch (err) { setError(err?.response?.data?.message || 'Could not save user.') }
    finally { setBusy(false) }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.name}?`)) return
    setBusy(true); setError(''); setMessage('')
    try { await deleteUser(user.id, token); setMessage('User deleted successfully.'); await loadUsers(meta.current_page) }
    catch (err) { setError(err?.response?.data?.message || 'Could not delete user.') }
    finally { setBusy(false) }
  }

  const handleImport = async () => {
    if (!importFile) { setError('Select a CSV file first.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await importUsersCsv(importFile, token)
      setMessage(`Import complete. Imported: ${response?.rows_imported || 0}, Failed: ${response?.rows_failed || 0}`)
      setImportFile(null); await loadUsers(1)
    } catch (err) { setError(err?.response?.data?.message || 'Could not import users CSV.') }
    finally { setBusy(false) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm">Manage lecturers and students with create, update, delete, and CSV import.</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"><div className="w-2 h-2 rounded-full bg-blue-500" />{meta.total} total</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5 mb-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, matric, staff id" className="md:col-span-2" />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All roles</option><option value="student">Student</option><option value="lecturer">Lecturer</option></select>
        <Button variant="default" onClick={openCreateForm}>Add User</Button>
        <Button variant="ghost" onClick={() => loadUsers(meta.current_page)}>Refresh</Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" accept=".csv,text/csv" onChange={(event) => setImportFile(event.target.files?.[0] || null)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <Button variant="ghost" onClick={handleImport} disabled={busy}>Import CSV</Button>
        </div>
      </Card>

      {message ? <Card className="mb-4 border-green-200 bg-green-50 text-green-700 p-4 text-sm">{message}</Card> : null}
      {error ? <Card className="mb-4 border-red-200 bg-red-50 text-red-700 p-4 text-sm">{error}</Card> : null}

      {showForm ? (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editingUser ? 'Edit User' : 'Create User'}</h2>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Role <span className="text-red-400">*</span></label>
              <select value={form.role} onChange={(event) => handleFormChange('role', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{editingUser ? 'New Password (optional)' : 'Password'}</label>
              <Input value={form.password} onChange={(event) => handleFormChange('password', event.target.value)} placeholder={editingUser ? 'Leave blank to keep current' : 'Password (optional)'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Faculty <span className="text-red-400">*</span></label>
              <select value={form.faculty_id} onChange={(e) => { handleFormChange('faculty_id', e.target.value); handleFormChange('department_id', '') }} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">Select faculty</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department {form.role === 'student' ? <span className="text-red-400">*</span> : null}</label>
              <select value={form.department_id} onChange={(e) => handleFormChange('department_id', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="">{form.faculty_id ? 'Select department' : 'Select faculty first'}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {form.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level <span className="text-red-400">*</span></label>
                  <select value={form.academic_level_id} onChange={(event) => handleFormChange('academic_level_id', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                    <option value="">Select level</option>
                    {levels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Matric Number <span className="text-red-400">*</span></label>
                  <Input value={form.matric_number} onChange={(event) => handleFormChange('matric_number', event.target.value)} placeholder="Matric number" />
                </div>
              </>
            )}
            {form.role === 'lecturer' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID <span className="text-red-400">*</span></label>
                <Input value={form.staff_id} onChange={(event) => handleFormChange('staff_id', event.target.value)} placeholder="Staff ID" />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="default" onClick={handleSubmit} disabled={busy}>{editingUser ? 'Save Changes' : 'Create User'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Loading users...</div>
        : users.length === 0 ? <div className="p-8 text-center text-slate-400">No users found.</div>
        : (
          <>
            <Table>
              <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>ID</Th><Th>Faculty</Th><Th>Department</Th><Th>Status</Th><Th></Th></Tr></Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td className="font-medium">{user.name}</Td>
                    <Td className="text-sm text-slate-500">{user.email}</Td>
                    <Td className="capitalize">{user.role}</Td>
                    <Td className="text-sm text-slate-500">{user.matric_number || user.staff_id || '-'}</Td>
                    <Td className="text-sm text-slate-500">{user.faculty?.name || (typeof user.faculty === 'string' ? user.faculty : '—')}</Td>
                    <Td className="text-sm text-slate-500">{user.department?.name || (typeof user.department === 'string' ? user.department : '—')}</Td>
                    <Td><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_verified ? 'text-emerald-600' : 'text-amber-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${user.is_verified ? 'bg-emerald-500' : 'bg-amber-400'}`} />{user.is_verified ? 'Verified' : 'Pending'}</span></Td>
                    <Td className="text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEditForm(user)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>Delete</Button></div></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <Button variant="outline" size="sm" disabled={meta.current_page <= 1 || loading} onClick={() => loadUsers(meta.current_page - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadUsers(meta.current_page + 1)}>Next</Button>
            </div>
          </>
        )}
      </Card>
    </Layout>
  )
}
