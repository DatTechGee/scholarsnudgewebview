import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getCourseSessions, createSession, stopSession, cancelSession, getSessionReport, getLiveSessionFeed, markStudentPresentByMatric, getCourseRoster, addStudentToRoster, removeStudentFromRoster, importRosterCsv, updateAttendanceStatus, deleteAttendance } from '../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

function AttendanceView({ sessionId, token, onRefresh }) {
  const [report, setReport] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const load = () => {
    if (!sessionId) return
    getSessionReport(sessionId, token).then(r => setReport(r?.data || r || {})).catch(() => setReport({}))
  }
  useEffect(() => { load() }, [sessionId])

  const doAction = async (attendanceId, status) => {
    setActionBusy(true)
    try {
      if (status === 'delete') await deleteAttendance(attendanceId, token)
      else await updateAttendanceStatus(attendanceId, status, token)
      load()
    } catch (_) {}
    finally { setActionBusy(false) }
  }

  if (!report) return <p className="text-slate-400 text-sm py-4 text-center">Loading attendance...</p>
  const summary = report.summary || {}
  const attendances = report.attendances || []

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
          <div className="text-xl font-bold text-emerald-700">{summary.present || 0}</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Present</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
          <div className="text-xl font-bold text-amber-700">{summary.late || 0}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Late</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
          <div className="text-xl font-bold text-red-700">{summary.absent || 0}</div>
          <div className="text-xs text-red-600 font-medium mt-0.5">Absent</div>
        </div>
      </div>
      {attendances.length > 0 ? (
        <div className="max-h-72 overflow-auto">
          <Table>
            <Thead><Tr><Th>Student</Th><Th>Status</Th><Th>Time</Th><Th>Distance</Th><Th>Device</Th><Th>Late</Th><Th></Th></Tr></Thead>
            <Tbody>
              {attendances.map(a => (
                <Tr key={a.id}>
                  <Td className="font-medium">{a.student?.name || a.student_name || `#${a.student_id}`}</Td>
                  <Td><Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}>{a.status}</Badge></Td>
                  <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString() : '—'}</Td>
                  <Td className="text-sm text-slate-500">{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                  <Td className="text-xs font-mono max-w-[100px] truncate text-slate-500" title={a.device_id || ''}>{a.device_id || '—'}</Td>
                  <Td>{a.is_late ? <Badge variant="warning">Yes</Badge> : '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => doAction(a.id, 'verified')} disabled={actionBusy}
                        className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-30" title="Verify">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button onClick={() => doAction(a.id, 'invalid')} disabled={actionBusy}
                        className="p-1 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-30" title="Mark Invalid">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this attendance record?')) doAction(a.id, 'delete') }} disabled={actionBusy}
                        className="p-1 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-30" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ) : <p className="text-sm text-slate-400 text-center py-6">No attendance records yet.</p>}
    </div>
  )
}


function LiveFeedView({ sessionId, token }) {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    if (!sessionId) return
    try {
      const d = await getLiveSessionFeed(sessionId, token)
      setFeed(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [sessionId, token])

  useEffect(() => { loadFeed(); const iv = setInterval(loadFeed, 10000); return () => clearInterval(iv) }, [loadFeed])

  if (loading) return <p className="text-slate-400 text-sm py-4 text-center">Loading live feed...</p>
  if (feed.length === 0) return <p className="text-sm text-slate-400 text-center py-6">No live check-ins yet. Waiting for students...</p>

  return (
    <div className="space-y-2 max-h-72 overflow-auto">
      {feed.map((f, i) => (
        <div key={f.id || i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
              {f.student?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="text-sm font-medium">{f.student?.name || f.student_name || '—'}</div>
              <div className="text-xs text-slate-400">{f.checked_in_at ? new Date(f.checked_in_at).toLocaleTimeString() : '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={f.distance_at_checkin && f.distance_at_checkin < 50 ? 'success' : 'warning'}>
              {f.distance_at_checkin ? `${Math.round(f.distance_at_checkin)}m` : '—'}
            </Badge>
            {f.device_id ? <span className="text-[10px] font-mono text-slate-300 max-w-[60px] truncate" title={f.device_id}>📱</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LecturerSessions() {
  const router = useRouter()
  const { course_id } = router.query
  const [token, setToken] = useState('')
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [viewTab, setViewTab] = useState('report')
  const [showCreate, setShowCreate] = useState(false)
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [roster, setRoster] = useState([])
  const [showRoster, setShowRoster] = useState(false)
  const [addMatric, setAddMatric] = useState('')
  const [addName, setAddName] = useState('')
  const [markMatric, setMarkMatric] = useState('')
  const [rosterFile, setRosterFile] = useState(null)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadCourse = useCallback(async () => {
    if (!course_id || !token) return
    setLoading(true); setError('')
    try {
      const data = await getCourseSessions(course_id, token)
      const d = data?.data || data || {}
      setCourse(d.course || d)
      setSessions(Array.isArray(d.sessions) ? d.sessions : Array.isArray(d) ? d : [])
    } catch (_) { setError('Failed to load course.') }
    finally { setLoading(false) }
  }, [course_id, token])

  useEffect(() => { loadCourse() }, [loadCourse])

  const loadRoster = async () => {
    try {
      const data = await getCourseRoster(course_id, token)
      setRoster(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setRoster([]) }
  }

  const handleCreateSession = async () => {
    setBusy(true); setError('')
    try {
      const payload = { duration_minutes: duration }
      if (notes.trim()) payload.notes = notes.trim()
      await createSession(course_id, payload, token)
      setShowCreate(false); setDuration(60); setNotes('')
      await loadCourse()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create session.')
    } finally { setBusy(false) }
  }

  const handleStop = async (id) => {
    if (!window.confirm('Stop this session?')) return
    setBusy(true)
    try { await stopSession(id, token); await loadCourse() }
    catch (_) { setError('Failed to stop session.') }
    finally { setBusy(false) }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session? This will delete all attendance records.')) return
    setBusy(true)
    try { await cancelSession(id, token); await loadCourse() }
    catch (_) { setError('Failed to cancel session.') }
    finally { setBusy(false) }
  }

  const handleMarkPresent = async () => {
    if (!markMatric.trim()) return
    setBusy(true)
    try {
      await markStudentPresentByMatric(selectedSession, markMatric.trim(), token)
      setMarkMatric('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to mark present.')
    } finally { setBusy(false) }
  }

  const handleRosterImport = async () => {
    if (!rosterFile) { setError('Select a CSV file.'); return }
    setBusy(true)
    try {
      await importRosterCsv(course_id, rosterFile, token)
      setRosterFile(null)
      await loadRoster()
    } catch (err) {
      setError(err?.response?.data?.message || 'Import failed.')
    } finally { setBusy(false) }
  }

  const handleAddRoster = async () => {
    if (!addMatric.trim()) return
    setBusy(true)
    try {
      await addStudentToRoster(course_id, addMatric.trim(), addName.trim() || 'Unknown', token)
      setAddMatric(''); setAddName('')
      await loadRoster()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add student.')
    } finally { setBusy(false) }
  }

  const handleRemoveRoster = async (matric) => {
    if (!window.confirm(`Remove ${matric}?`)) return
    try { await removeStudentFromRoster(course_id, matric, token); await loadRoster() }
    catch (_) { setError('Failed to remove.') }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  if (!course_id) {
    return (
      <Layout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Sessions</h1>
          <p className="text-slate-500 text-sm">Select a course from the dashboard to view sessions.</p>
        </div>
        <Card className="p-12 text-center text-slate-400">
          <p className="mb-4">Please select a course first.</p>
          <Button onClick={() => router.push('/lecturer')}>Go to Dashboard</Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/lecturer/courses')} className="text-slate-500">← Courses</Button>
            <h1 className="text-2xl font-bold text-slate-800">{course?.code || 'Course'}</h1>
            {course?.active_session ? <Badge variant="success">🟢 Live</Badge> : null}
          </div>
          <p className="text-slate-500 text-sm mt-1">{course?.title || 'Manage sessions and attendance'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { loadRoster(); setShowRoster(true) }}>Roster</Button>
          <Button onClick={() => setShowCreate(true)} disabled={!!course?.active_session}>
            {course?.active_session ? 'Session Active' : 'Start Session'}
          </Button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-20 animate-pulse bg-slate-100" />)}</div>
      ) : (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <p className="mb-4">No sessions yet.</p>
              <Button onClick={() => setShowCreate(true)} disabled={!!course?.active_session}>Start First Session</Button>
            </Card>
          ) : sessions.map(s => (
            <Card key={s.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{s.id}</span>
                    <Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge>
                    {s.late_count > 0 ? <Badge variant="warning">{s.late_count} late</Badge> : null}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span>📅 {s.starts_at ? new Date(s.starts_at).toLocaleString() : '—'}</span>
                    {s.ends_at ? <span>→ {new Date(s.ends_at).toLocaleString()}</span> : null}
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="text-slate-600 font-medium">{s.attendance_count ?? 0} attended</span>
                    <span className="text-slate-400">/ {s.expected_count ?? '—'} expected</span>
                    {s.attendance_count > 0 && s.expected_count ? (
                      <span className="text-xs font-medium text-emerald-600">
                        {Math.round((s.attendance_count / s.expected_count) * 100)}% rate
                      </span>
                    ) : null}
                  </div>
                  {s.notes ? <div className="text-xs text-slate-400 mt-1 italic">📝 {s.notes}</div> : null}
                </div>
                <div className="flex gap-1 ml-4">
                  <Button variant="ghost" onClick={() => setSelectedSession(s.id)}>View</Button>
                  {s.status === 'active' ? (
                    <>
                      <Button onClick={() => handleStop(s.id)} disabled={busy}>Stop</Button>
                      <Button variant="destructive" onClick={() => handleCancel(s.id)} disabled={busy}>Cancel</Button>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Start New Session">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="60" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Topic: Introduction to Programming" className="px-3 py-2 border rounded-md w-full min-h-[80px]" />
          </div>
          <Button onClick={handleCreateSession} disabled={busy}>{busy ? 'Starting...' : 'Start Session'}</Button>
        </div>
      </Modal>

      <Modal open={!!selectedSession} onClose={() => { setSelectedSession(null); setViewTab('report') }} title={`Session #${selectedSession}`}>
        <div className="flex gap-2 mb-4">
          {['report', 'live', 'mark'].map(t => (
            <button key={t} onClick={() => setViewTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewTab === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >{t === 'live' ? '🟢 Live Feed' : t === 'mark' ? '✏️ Mark Present' : '📊 Attendance'}</button>
          ))}
        </div>
        {viewTab === 'report' ? <AttendanceView sessionId={selectedSession} token={token} /> : 
         viewTab === 'live' ? <LiveFeedView sessionId={selectedSession} token={token} /> : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Manually mark a student as present by matric number.</p>
            <Input value={markMatric} onChange={(e) => setMarkMatric(e.target.value)} placeholder="Enter matric number" />
            <Button onClick={handleMarkPresent} disabled={busy}>Mark Present</Button>
          </div>
        )}
      </Modal>

      <Modal open={showRoster} onClose={() => setShowRoster(false)} title="Course Roster">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={addMatric} onChange={(e) => setAddMatric(e.target.value)} placeholder="Matric number" className="flex-1" />
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Student name" className="flex-1" />
            <Button onClick={handleAddRoster} disabled={busy}>Add</Button>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept=".csv" onChange={(e) => setRosterFile(e.target.files?.[0] || null)} className="text-sm flex-1" />
            <Button variant="ghost" onClick={handleRosterImport} disabled={busy || !rosterFile}>Import CSV</Button>
          </div>
          {roster.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No students in roster. Add manually or import CSV.</p> : (
            <div className="max-h-72 overflow-auto">
              <Table>
                <Thead><Tr><Th>Name</Th><Th>Matric</Th><Th></Th></Tr></Thead>
                <Tbody>
                  {roster.map(r => (
                    <Tr key={r.id || r.matric_number}>
                      <Td className="font-medium">{r.student_name || '—'}</Td>
                      <Td className="font-mono text-sm">{r.matric_number}</Td>
                      <Td><Button variant="destructive" onClick={() => handleRemoveRoster(r.matric_number)}>Remove</Button></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  )
}
