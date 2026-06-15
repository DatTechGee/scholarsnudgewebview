import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getCourseVenues, createCourseVenue, updateVenue, deleteVenue } from '../../services/api'

const emptyForm = { name: '', latitude: '', longitude: '', radius_meters: 100 }

export default function LecturerVenues() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) {
      getLecturerCourses(t).then(d => {
        setCourses(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])
      }).catch(() => {}).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const loadVenues = useCallback(async () => {
    if (!selectedCourse || !token) return
    setLoading(true)
    try {
      const data = await getCourseVenues(selectedCourse, token)
      setVenues(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setVenues([]) }
    finally { setLoading(false) }
  }, [selectedCourse, token])

  useEffect(() => { loadVenues() }, [loadVenues])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (v) => {
    setEditing(v)
    setForm({ name: v.name || '', latitude: v.latitude || '', longitude: v.longitude || '', radius_meters: v.radius_meters || 100 })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name) { setError('Venue name required.'); return }
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        radius_meters: Number(form.radius_meters),
      }
      if (editing) {
        await updateVenue(editing.id, payload, token)
      } else {
        await createCourseVenue(selectedCourse, payload, token)
      }
      setShowForm(false)
      await loadVenues()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save venue.')
    } finally { setBusy(false) }
  }

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete venue "${v.name}"?`)) return
    try {
      await deleteVenue(v.id, token)
      await loadVenues()
    } catch (_) { setError('Failed to delete venue.') }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Venues</h1>
        <p className="text-slate-500 text-sm">Manage classroom/venue locations for your courses</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => setSelectedCourse(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCourse === c.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
          >{c.code}</button>
        ))}
      </div>

      {!selectedCourse ? (
        <Card className="p-12 text-center text-slate-400">Select a course to view its venues.</Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">
              {courses.find(c => c.id === selectedCourse)?.code || 'Course'} Venues
            </h3>
            <Button onClick={openCreate}>Add Venue</Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
          ) : venues.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No venues added for this course.</Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {venues.map(v => (
                <Card key={v.id} className="p-5 border-l-4 border-l-emerald-400">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{v.name}</h4>
                      <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                        {v.latitude && v.longitude ? (
                          <div>📍 {Number(v.latitude).toFixed(6)}, {Number(v.longitude).toFixed(6)}</div>
                        ) : <div className="text-amber-500">No coordinates set</div>}
                        <div>📏 {v.radius_meters || 100}m radius</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => openEdit(v)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDelete(v)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Venue' : 'Add Venue'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Venue Name *</label>
            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Lecture Theatre 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({...form, latitude: e.target.value})} placeholder="6.5244" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({...form, longitude: e.target.value})} placeholder="3.3792" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Radius (meters)</label>
            <Input type="number" value={form.radius_meters} onChange={(e) => setForm({...form, radius_meters: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={busy}>{editing ? 'Save Changes' : 'Add Venue'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
