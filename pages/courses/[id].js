import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getAdminCourseDetail, getAdminCourseSessions, createSession, getCourseRoster, addStudentToRoster, removeStudentFromRoster, importRosterCsv, downloadCourseAttendanceCsv, downloadCourseRosterCsv } from '../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

export default function CourseDetail() {
  const router = useRouter()
  const { id } = router.query

  const [token, setToken] = useState('')
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('sessions')

  // Session creation state
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({ duration_minutes: 60, notes: '', seating_capacity: '' })
  const [sessionBusy, setSessionBusy] = useState(false)

  // Roster state
  const [roster, setRoster] = useState([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [showRosterForm, setShowRosterForm] = useState(false)
  const [rosterMatric, setRosterMatric] = useState('')
  const [rosterName, setRosterName] = useState('')
  const [rosterFile, setRosterFile] = useState(null)
  const [rosterBusy, setRosterBusy] = useState(false)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const load = async () => {
    if (!token || !id) return
    setLoading(true); setError('')
    try {
      const [detail, sessionsData] = await Promise.all([
        getAdminCourseDetail(id, token),
        getAdminCourseSessions(id, token).catch(() => null),
      ])
      setCourse(detail || {})
      const rows = Array.isArray(sessionsData?.data) ? sessionsData.data : Array.isArray(sessionsData) ? sessionsData : []
      setSessions(rows)
    } catch (err) { setError('Failed to load course details.'); setCourse(null); setSessions([]) }
    finally { setLoading(false) }
  }

  const loadRoster = async () => {
    if (!token || !id) return
    setRosterLoading(true)
    try {
      const data = await getCourseRoster(id, token)
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setRoster(rows)
    } catch (_) { setRoster([]) }
    finally { setRosterLoading(false) }
  }

  useEffect(() => { load() }, [token, id])

  const handleCreateSession = async () => {
    if (!sessionForm.duration_minutes) { setError('Duration is required.'); return }
    setSessionBusy(true); setError('')
    try {
      await createSession(id, sessionForm, token)
      setShowCreateSession(false)
      await load()
    } catch (err) { setError(err?.response?.data?.message || 'Failed to create session.') }
    finally { setSessionBusy(false) }
  }

  const handleAddStudent = async () => {
    if (!rosterMatric.trim()) return
    setRosterBusy(true); setError('')
    try {
      await addStudentToRoster(id, rosterMatric.trim().toUpperCase(), rosterName.trim(), token)
      setRosterMatric(''); setRosterName(''); setShowRosterForm(false)
      await loadRoster()
    } catch (err) { setError(err?.response?.data?.message || 'Failed to add student.') }
    finally { setRosterBusy(false) }
  }

  const handleRemoveStudent = async (matric) => {
    if (!window.confirm(`Remove student ${matric} from roster?`)) return
    setRosterBusy(true); setError('')
    try { await removeStudentFromRoster(id, matric, token); await loadRoster() }
    catch (err) { setError(err?.response?.data?.message || 'Failed to remove student.') }
    finally { setRosterBusy(false) }
  }

  const handleImportRoster = async () => {
    if (!rosterFile) { setError('Select a CSV file first.'); return }
    setRosterBusy(true); setError('')
    try { await importRosterCsv(id, rosterFile, token); setRosterFile(null); await loadRoster() }
    catch (err) { setError(err?.response?.data?.message || 'CSV import failed.') }
    finally { setRosterBusy(false) }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/courses')} className="mb-3">&larr; Back to Courses</Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
      ) : !course ? (
        <Card className="p-8 text-center text-slate-400">Course not found.</Card>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{course.title || 'Untitled Course'}</h1>
                <p className="text-sm text-slate-500 font-mono">{course.code || '—'}</p>
              </div>
              <Badge variant="info">{typeof course.academic_level === 'object' ? course.academic_level?.name : course.academic_level || '—'}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-sm text-slate-500">Lecturer</span><div className="font-medium">{course.lecturer?.name || course.lecturer_name || '—'}</div></div>
              <div><span className="text-sm text-slate-500">Academic Level</span><div className="font-medium">{typeof course.academic_level === 'object' ? course.academic_level?.name : course.academic_level || '—'}</div></div>
              <div><span className="text-sm text-slate-500">Roster Count</span><div className="font-medium">{course.roster_count ?? '—'}</div></div>
              <div><span className="text-sm text-slate-500">Session Count</span><div className="font-medium">{course.session_count ?? '—'}</div></div>
            </div>
            {course.location_name && (
              <div className="mt-4 pt-4 border-t text-sm text-slate-500">
                <span className="font-medium text-slate-700">Location:</span> {course.location_name}
                {course.latitude && course.longitude && (
                  <span className="ml-4 text-slate-400">({course.latitude}, {course.longitude}){course.radius ? <span> &middot; {course.radius}m radius</span> : null}</span>
                )}
              </div>
            )}
            {course.faculty_name && (
              <div className="mt-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">Faculty:</span> {course.faculty_name}
                {course.department_name ? <span className="ml-4"><span className="font-medium text-slate-700">Department:</span> {course.department_name}</span> : null}
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('sessions')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'sessions' ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>Sessions</button>
            <button onClick={() => { setTab('roster'); loadRoster() }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'roster' ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>Roster</button>
          </div>

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sessions ({sessions.length})</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => downloadCourseAttendanceCsv(id, token).catch(() => setError('Failed to export attendance CSV'))}>Export Attendance</Button>
                  <Button variant="default" size="sm" onClick={() => setShowCreateSession(true)}>Start Session</Button>
                  <Button variant="ghost" size="sm" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
                </div>
              </div>

              {sessions.length === 0 ? (
                <Card className="p-8 text-center text-slate-400">No sessions found for this course.</Card>
              ) : (
                <Card className="p-0">
                  <Table>
                    <Thead><Tr><Th>ID</Th><Th>Status</Th><Th>Started</Th><Th>Attendance</Th><Th>Actions</Th></Tr></Thead>
                    <Tbody>
                      {sessions.map(s => (
                        <Tr key={s.id}>
                          <Td className="font-mono text-sm">#{s.id}</Td>
                          <Td><Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge></Td>
                          <Td className="text-sm">{s.starts_at ? new Date(s.starts_at).toLocaleString() : '—'}</Td>
                          <Td>{s.attendance_count ?? '—'}</Td>
                          <Td><Button variant="ghost" onClick={() => router.push(`/sessions/${s.id}`)}>View</Button></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Card>
              )}
            </>
          )}

          {/* Roster Tab */}
          {tab === 'roster' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Roster ({roster.length})</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => downloadCourseRosterCsv(id, token).catch(() => setError('Failed to export roster CSV'))}>Export Roster</Button>
                  <Button variant="default" size="sm" onClick={() => setShowRosterForm(true)}>Add Student</Button>
                  <Button variant="ghost" size="sm" onClick={loadRoster} disabled={rosterLoading}>{rosterLoading ? 'Loading...' : 'Refresh'}</Button>
                </div>
              </div>

              {/* CSV Import */}
              <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" accept=".csv" onChange={(e) => setRosterFile(e.target.files?.[0] || null)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <Button variant="ghost" onClick={handleImportRoster} disabled={rosterBusy || !rosterFile}>Import CSV</Button>
                </div>
              </Card>

              {/* Add Student Modal */}
              <Modal open={showRosterForm} onClose={() => setShowRosterForm(false)}>
                <div className="p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Add Student to Roster</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Matric Number <span className="text-red-400">*</span></label>
                      <Input value={rosterMatric} onChange={(e) => setRosterMatric(e.target.value)} placeholder="e.g. CSC/2020/001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                      <Input value={rosterName} onChange={(e) => setRosterName(e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleAddStudent} disabled={!rosterMatric.trim() || rosterBusy}>Add</Button>
                      <Button variant="ghost" onClick={() => setShowRosterForm(false)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              </Modal>

              {/* Roster table */}
              {rosterLoading ? (
                <Card className="p-8 text-center text-slate-400">Loading roster...</Card>
              ) : roster.length === 0 ? (
                <Card className="p-8 text-center text-slate-400">
                  <p className="mb-2">No students in roster.</p>
                  <p className="text-xs text-slate-400">Add students manually or import a CSV file.</p>
                </Card>
              ) : (
                <Card className="p-0">
                  <Table>
                    <Thead><Tr><Th>#</Th><Th>Matric Number</Th><Th>Student Name</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {roster.map((r, i) => (
                        <Tr key={r.id || i}>
                          <Td className="text-sm text-slate-400">{i + 1}</Td>
                          <Td className="font-mono font-medium">{r.matric_number}</Td>
                          <Td>{r.student?.name || r.student_name || '—'}</Td>
                          <Td><Button variant="destructive" size="sm" onClick={() => handleRemoveStudent(r.matric_number)} disabled={rosterBusy}>Remove</Button></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Create Session Modal */}
      <Modal open={showCreateSession} onClose={() => setShowCreateSession(false)}>
        <div className="p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Start Session</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes) <span className="text-red-400">*</span></label>
              <input type="number" min={5} max={300} value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({...sessionForm, duration_minutes: Number(e.target.value)})}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seating Capacity</label>
              <input type="number" min={1} value={sessionForm.seating_capacity} onChange={(e) => setSessionForm({...sessionForm, seating_capacity: e.target.value})}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={sessionForm.notes} onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                placeholder="Optional notes"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateSession} disabled={!sessionForm.duration_minutes || sessionBusy}>{sessionBusy ? 'Creating...' : 'Start Session'}</Button>
              <Button variant="ghost" onClick={() => setShowCreateSession(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
