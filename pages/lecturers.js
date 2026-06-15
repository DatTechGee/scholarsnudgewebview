import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import Button from '../components/shadcn/Button'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Input from '../components/shadcn/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getUsers, createUser, updateUser, deleteUser, getFaculties } from '../services/api'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  faculty_id: '',
  staff_id: '',
}

export default function Lecturers() {
  const [tokenInput, setTokenInput] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [faculties, setFaculties] = useState([])
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
    const loadReferences = async () => {
      try {
        const facultiesData = await getFaculties(token)
        setFaculties(Array.isArray(facultiesData) ? facultiesData : [])
      } catch (_err) {
        setError('Failed to load faculties. Verify your admin token and API base URL.')
      }
    }
    if (token) loadReferences()
  }, [token])

  const loadLecturers = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers(token, {
        page,
        q: query || undefined,
        role: 'lecturer',
      })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setUsers(rows)
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (_err) {
      setError('Failed to load lecturers.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadLecturers(1)
  }, [query, token])

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
      name: user.name || '',
      email: user.email || '',
      password: '',
      faculty_id: user.faculty_id ? String(user.faculty_id) : '',
      staff_id: user.staff_id || '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.faculty_id || !form.staff_id) {
      setError('Name, email, faculty, and staff ID are required.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        role: 'lecturer',
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        faculty_id: Number(form.faculty_id),
        staff_id: form.staff_id,
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload, token)
        setMessage('Lecturer updated successfully.')
      } else {
        const response = await createUser(payload, token)
        setMessage(
          response?.generated_password
            ? `Lecturer created. Generated password: ${response.generated_password}`
            : 'Lecturer created successfully.'
        )
      }

      setShowForm(false)
      resetForm()
      await loadLecturers(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not save lecturer.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete lecturer ${user.name}?`)
    if (!confirmed) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      await deleteUser(user.id, token)
      setMessage('Lecturer deleted successfully.')
      await loadLecturers(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not delete lecturer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lecturers</h1>
          <p className="text-slate-500">Manage all lecturer accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={openCreateForm}>Add Lecturer</Button>
          <Button variant="ghost" onClick={() => loadLecturers(meta.current_page)} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <label className="mb-2 block text-sm font-medium">Admin bearer token</label>
        <Input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="Paste admin token to call protected endpoints"
        />
      </Card>

      <Card className="mb-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or staff ID..."
        />
      </Card>

      {message ? <Card className="mb-4 border-green-200 bg-green-50 text-green-700">{message}</Card> : null}
      {error ? <Card className="mb-4 border-red-200 bg-red-50 text-red-700">{error}</Card> : null}

      {showForm ? (
        <Card className="mb-4">
          <h2 className="text-lg font-semibold mb-3">{editingUser ? 'Edit Lecturer' : 'Create Lecturer'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={form.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              placeholder="Full name"
            />
            <Input
              value={form.email}
              onChange={(event) => handleFormChange('email', event.target.value)}
              placeholder="Email"
            />
            <Input
              type="password"
              value={form.password}
              onChange={(event) => handleFormChange('password', event.target.value)}
              placeholder={editingUser ? 'New password (optional)' : 'Password (optional)'}
            />
            <select
              value={form.faculty_id}
              onChange={(event) => handleFormChange('faculty_id', event.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="">Select faculty</option>
              {faculties.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <Input
              value={form.staff_id}
              onChange={(event) => handleFormChange('staff_id', event.target.value)}
              placeholder="Staff ID"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="default" onClick={handleSubmit} disabled={busy}>
              {editingUser ? 'Save Changes' : 'Create Lecturer'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading lecturers...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No lecturers found.</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Staff ID</Th>
                <Th>Faculty</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium">{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td className="font-mono">{user.staff_id || '-'}</Td>
                  <Td>{user.faculty_name || '-'}</Td>
                  <Td>
                    <Badge variant={user.is_verified ? 'success' : 'warning'}>
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/lecturers/${user.id}`}>
                        <Button variant="ghost">View</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => openEditForm(user)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDelete(user)}>Delete</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>Total: {meta.total} lecturers</span>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => loadLecturers(meta.current_page - 1)}>
            Previous
          </Button>
          <span className="py-2">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadLecturers(meta.current_page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </Layout>
  )
}
