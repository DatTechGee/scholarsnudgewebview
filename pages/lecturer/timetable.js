import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getTimetableSlots, createTimetableSlot, deleteTimetableSlot } from '../../services/api'

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function LecturerTimetable() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ day_of_week: 'Monday', start_time: '08:00', end_time: '09:00', room: '' })
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

  const loadSlots = useCallback(async () => {
    if (!selectedCourse || !token) return
    setLoading(true)
    try {
      const data = await getTimetableSlots(selectedCourse, token)
      setSlots(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setSlots([]) }
    finally { setLoading(false) }
  }, [selectedCourse, token])

  useEffect(() => { loadSlots() }, [loadSlots])

  const handleCreate = async () => {
    if (!form.start_time || !form.end_time) { setError('Start and end time required.'); return }
    setBusy(true)
    setError('')
    try {
      await createTimetableSlot(selectedCourse, {
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room || null,
      }, token)
      setShowForm(false)
      setForm({ day_of_week: 'Monday', start_time: '08:00', end_time: '09:00', room: '' })
      await loadSlots()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create slot.')
    } finally { setBusy(false) }
  }

  const handleDelete = async (slotId) => {
    if (!window.confirm('Delete this timetable slot?')) return
    try {
      await deleteTimetableSlot(slotId, token)
      await loadSlots()
    } catch (_) { setError('Failed to delete slot.') }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  const groupedSlots = {}
  dayNames.forEach(day => { groupedSlots[day] = [] })
  slots.forEach(s => {
    if (groupedSlots[s.day_of_week]) groupedSlots[s.day_of_week].push(s)
  })

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Timetable</h1>
        <p className="text-slate-500 text-sm">Manage your course schedules</p>
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
        <Card className="p-12 text-center text-slate-400">Select a course to view its timetable.</Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">
              {courses.find(c => c.id === selectedCourse)?.code || 'Course'} Schedule
            </h3>
            <Button onClick={() => setShowForm(true)}>Add Slot</Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-14 animate-pulse bg-slate-100" />)}</div>
          ) : slots.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No timetable slots. Add one to get started.</Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dayNames.map(day => {
                const daySlots = groupedSlots[day]
                if (!daySlots || daySlots.length === 0) return null
                return (
                  <Card key={day} className="p-4 border-l-4 border-l-blue-400">
                    <h4 className="font-semibold text-slate-700 mb-3 text-sm">{day}</h4>
                    <div className="space-y-2">
                      {daySlots.sort((a, b) => a.start_time?.localeCompare(b.start_time)).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</div>
                            {s.room ? <div className="text-xs text-slate-400">📍 {s.room}</div> : null}
                          </div>
                          <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Timetable Slot">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Day of Week</label>
            <select value={form.day_of_week} onChange={(e) => setForm({...form, day_of_week: e.target.value})} className="px-3 py-2 border rounded-md w-full bg-white">
              {dayNames.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({...form, end_time: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room / Venue (optional)</label>
            <Input value={form.room} onChange={(e) => setForm({...form, room: e.target.value})} placeholder="e.g. LT1" />
          </div>
          <Button onClick={handleCreate} disabled={busy}>{busy ? 'Adding...' : 'Add Slot'}</Button>
        </div>
      </Modal>
    </Layout>
  )
}
