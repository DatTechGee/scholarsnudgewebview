import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/shadcn/Button'
import Card from '../components/shadcn/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import {
  createUser,
  deleteUser,
  getLevels,
  getUsers,
  importUsersCsv,
  updateUser,
} from '../services/api'

const emptyForm = {
  role: 'student',
  name: '',
  email: '',
  password: '',
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
    const loadReferences = async () => {
      try {
        const levelsData = await getLevels(token)
        setLevels(Array.isArray(levelsData) ? levelsData : [])
      } catch (_err) {
        setError('Failed to load levels. Verify your admin token and API base URL.')
      }
    }

    loadReferences()
  }, [token])

  const loadUsers = async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const data = await getUsers(token, {
        page,
        q: query || undefined,
        role: roleFilter || undefined,
      })

      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setUsers(rows)
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (_err) {
      setError('Failed to load users. Configure NEXT_PUBLIC_API_BASE and provide a valid admin token.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1)
  }, [query, roleFilter])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingUser(null)
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (user) => {
    setEditingUser(user)
    setForm({
      role: user.role || 'student',
      name: user.name || '',
      email: user.email || '',
      password: '',
      academic_level_id: user.academic_level_id ? String(user.academic_level_id) : '',
      matric_number: user.matric_number || '',
      staff_id: user.staff_id || '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'role' && value === 'lecturer'
        ? { academic_level_id: '', matric_number: '' }
        : {}),
      ...(field === 'role' && value === 'student' ? { staff_id: '' } : {}),
    }))
  }

  const validateForm = () => {
    if (!form.name || !form.email) {
      return 'Name and email are required.'
    }

    if (form.role === 'student') {
      if (!form.academic_level_id || !form.matric_number) {
        return 'For students, level and matric number are required.'
      }
    }

    if (form.role === 'lecturer' && !form.staff_id) {
      return 'For lecturers, staff ID is required.'
    }

    return ''
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        role: form.role,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        academic_level_id: form.role === 'student' ? Number(form.academic_level_id) : null,
        matric_number: form.role === 'student' ? form.matric_number : null,
        staff_id: form.role === 'lecturer' ? form.staff_id : null,
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload, token)
        setMessage('User updated successfully.')
      } else {
        const response = await createUser(payload, token)
        setMessage(
          response?.generated_password
            ? `User created. Generated password: ${response.generated_password}`
            : 'User created successfully.'
        )
      }

      setShowForm(false)
      resetForm()
      await loadUsers(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not save user.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.name}?`)
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      await deleteUser(user.id, token)
      setMessage('User deleted successfully.')
      await loadUsers(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not delete user.')
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError('Select a CSV file first.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await importUsersCsv(importFile, token)
      setMessage(`Import complete. Imported: ${response?.rows_imported || 0}, Failed: ${response?.rows_failed || 0}`)
      setImportFile(null)
      await loadUsers(1)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not import users CSV.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-2 text-slate-600">Manage lecturers and students with create, update, delete, and CSV import.</p>

      <div className="mt-4 rounded border bg-white p-4">
        <label className="mb-2 block text-sm font-medium">Admin bearer token</label>
        <input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="Paste admin token to call protected endpoints"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, matric, staff id"
          className="rounded border px-3 py-2 md:col-span-2"
        />

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>

        <div className="flex gap-2">
          <Button variant="default" className="w-full" onClick={openCreateForm}>Add User</Button>
          <Button variant="ghost" className="w-full" onClick={() => loadUsers(meta.current_page)}>Refresh</Button>
        </div>
      </div>

      <div className="mt-4 rounded border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setImportFile(event.target.files?.[0] || null)}
            className="max-w-sm rounded border px-3 py-2"
          />
          <Button variant="ghost" onClick={handleImport} disabled={busy}>Import CSV</Button>
        </div>
      </div>

      {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">{message}</div> : null}
      {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div> : null}

      {showForm ? (
        <div className="mt-4 rounded border bg-white p-4">
          <h2 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Create User'}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} placeholder="Full name" className="rounded border px-3 py-2" />
            <input value={form.email} onChange={(event) => handleFormChange('email', event.target.value)} placeholder="Email" className="rounded border px-3 py-2" />

            <select value={form.role} onChange={(event) => handleFormChange('role', event.target.value)} className="rounded border px-3 py-2">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>

            <input
              value={form.password}
              onChange={(event) => handleFormChange('password', event.target.value)}
              placeholder={editingUser ? 'New password (optional)' : 'Password (optional)'}
              className="rounded border px-3 py-2"
            />

            {form.role === 'student' ? (
              <>
                <select value={form.academic_level_id} onChange={(event) => handleFormChange('academic_level_id', event.target.value)} className="rounded border px-3 py-2">
                  <option value="">Select level</option>
                  {levels.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>

                <input value={form.matric_number} onChange={(event) => handleFormChange('matric_number', event.target.value)} placeholder="Matric number" className="rounded border px-3 py-2" />
              </>
            ) : (
              <input value={form.staff_id} onChange={(event) => handleFormChange('staff_id', event.target.value)} placeholder="Staff ID" className="rounded border px-3 py-2" />
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="default" onClick={handleSubmit} disabled={busy}>{editingUser ? 'Save Changes' : 'Create User'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <Card className="p-0 mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          <div>Total users: {meta.total}</div>
          <div>Page {meta.current_page} of {meta.last_page}</div>
        </div>

        {loading ? <div className="p-8 text-center text-slate-400">Loading users...</div> : null}
        {!loading && users.length === 0 ? <div className="p-8 text-center text-slate-400">No users found.</div> : null}

        {!loading && users.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>ID</Th>
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium">{user.name}</Td>
                  <Td className="text-sm text-slate-500">{user.email}</Td>
                  <Td className="capitalize">{user.role}</Td>
                  <Td className="text-sm text-slate-500">{user.matric_number || user.staff_id || '-'}</Td>
                  <Td><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_verified ? 'text-emerald-600' : 'text-amber-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${user.is_verified ? 'bg-emerald-500' : 'bg-amber-400'}`} />{user.is_verified ? 'Verified' : 'Pending'}</span></Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(user)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>Delete</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1 || loading} onClick={() => loadUsers(meta.current_page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadUsers(meta.current_page + 1)}>
            Next
          </Button>
        </div>
      </Card>
    </Layout>
  )
}
