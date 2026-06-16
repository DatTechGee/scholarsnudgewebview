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
import {
  createUser,
  deleteUser,
  getLevels,
  getUsers,
  updateUser,
} from '../services/api'

const emptyForm = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  academic_level_id: '',
  matric_number: '',
}

export default function Students() {
  const router = useRouter()
  const [tokenInput, setTokenInput] = useState('')
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
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

  const loadStudents = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers(token, {
        page,
        q: query || undefined,
        role: 'student',
      })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setStudents(rows)
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (_err) {
      setError('Failed to load students. Configure NEXT_PUBLIC_API_BASE and provide a valid admin token.')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents(1)
  }, [query])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingStudent(null)
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (student) => {
    setEditingStudent(student)
    setForm({
      role: 'student',
      name: student.name || '',
      email: student.email || '',
      password: '',
      academic_level_id: student.academic_level_id ? String(student.academic_level_id) : '',
      matric_number: student.matric_number || '',
    })
    setShowForm(true)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!form.name || !form.email) {
      return 'Name and email are required.'
    }
    if (!form.academic_level_id || !form.matric_number) {
      return 'Level and matric number are required.'
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
        role: 'student',
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        academic_level_id: Number(form.academic_level_id),
        matric_number: form.matric_number,
      }
      if (editingStudent) {
        await updateUser(editingStudent.id, payload, token)
        setMessage('Student updated successfully.')
      } else {
        const response = await createUser(payload, token)
        setMessage(
          response?.generated_password
            ? `Student created. Generated password: ${response.generated_password}`
            : 'Student created successfully.'
        )
      }
      setShowForm(false)
      resetForm()
      await loadStudents(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not save student.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete student ${student.name}?`)
    if (!confirmed) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await deleteUser(student.id, token)
      setMessage('Student deleted successfully.')
      await loadStudents(meta.current_page)
    } catch (err) {
      const backendMessage = err?.response?.data?.message
      setError(backendMessage || 'Could not delete student.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold">Students</h1>
      <p className="mt-2 text-slate-600">Manage students with create, update, and delete.</p>

      <Card className="mt-4">
        <label className="mb-2 block text-sm font-medium">Admin bearer token</label>
        <Input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="Paste admin token to call protected endpoints"
        />
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, matric number"
          className="md:col-span-2"
        />
        <Button variant="default" className="w-full" onClick={openCreateForm}>Add Student</Button>
        <Button variant="ghost" className="w-full" onClick={() => loadStudents(meta.current_page)}>Refresh</Button>
      </div>

      {message ? <Card className="mt-4 border-green-200 bg-green-50 text-green-700">{message}</Card> : null}
      {error ? <Card className="mt-4 border-red-200 bg-red-50 text-red-700">{error}</Card> : null}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingStudent ? 'Edit Student' : 'Create Student'}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={form.name} onChange={(event) => handleFormChange('name', event.target.value)} placeholder="Full name" />
          <Input value={form.email} onChange={(event) => handleFormChange('email', event.target.value)} placeholder="Email" />
          <Input
            value={form.password}
            onChange={(event) => handleFormChange('password', event.target.value)}
            placeholder={editingStudent ? 'New password (optional)' : 'Password (optional)'}
          />
          <Select
            options={levels.map((l) => ({ value: String(l.id), label: l.name }))}
            value={form.academic_level_id}
            onChange={(value) => handleFormChange('academic_level_id', value)}
            placeholder="Select level"
          />
          <Input value={form.matric_number} onChange={(event) => handleFormChange('matric_number', event.target.value)} placeholder="Matric number" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="default" onClick={handleSubmit} disabled={busy}>{editingStudent ? 'Save Changes' : 'Create Student'}</Button>
          <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
        </div>
      </Modal>

      <Card className="mt-6">
        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
          <div>Total students: {meta.total}</div>
          <div>Page {meta.current_page} of {meta.last_page}</div>
        </div>

        {loading ? <div className="p-4">Loading students...</div> : null}
        {!loading && students.length === 0 ? <div className="p-4">No students found.</div> : null}

        {!loading && students.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Matric Number</Th>
                <Th>Level</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {students.map((student) => (
                <Tr key={student.id}>
                  <Td className="font-medium">{student.name}</Td>
                  <Td className="text-surface-500">{student.email}</Td>
                  <Td>{student.matric_number || '-'}</Td>
                  <Td>{student.academic_level?.name || '-'}</Td>
                  <Td>
                    <Badge variant={student.is_verified ? 'success' : 'warning'}>
                      {student.is_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(student)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(student)}>Delete</Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/students/${student.id}`)}>View</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => loadStudents(meta.current_page - 1)}>
            Previous
          </Button>
          <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadStudents(meta.current_page + 1)}>
            Next
          </Button>
        </div>
      </Card>
    </Layout>
  )
}
