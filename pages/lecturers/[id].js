import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getAdminUser, getAdminLecturerCourses, getAdminLecturerSessions, getAdminLecturerAttendanceSummary, getCourseRoster, addStudentToRoster, removeStudentFromRoster, importRosterCsv, downloadCourseRosterCsv } from '../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

function StatCard({ label, value, icon, color }) {
  return (
    <Card className="p-5 border-l-4 shadow-sm" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
          <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: color + '20' }}>
          <span>{icon}</span>
        </div>
      </div>
    </Card>
  )
}

export default function LecturerDetail() {
  const router = useRouter()
  const { id } = router.query

  const [token, setToken] = useState('')
  const [lecturer, setLecturer] = useState(null)
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sessions pagination
  const [sessionsMeta, setSessionsMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Roster modal state
  const [rosterCourse, setRosterCourse] = useState(null)
  const [rosterData, setRosterData] = useState([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [rosterMatric, setRosterMatric] = useState('')
  const [rosterName, setRosterName] = useState('')
  const [rosterFile, setRosterFile] = useState(null)
  const [rosterBusy, setRosterBusy] = useState(false)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadData = async (t) => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [userData, coursesData, summaryData] = await Promise.all([
        getAdminUser(id, t).catch(() => null),
        getAdminLecturerCourses(id, t).catch(() => null),
        getAdminLecturerAttendanceSummary(id, t).catch(() => null),
      ])
      setLecturer(userData?.data || userData || null)
      setCourses(Array.isArray(coursesData?.data) ? coursesData.data : Array.isArray(coursesData) ? coursesData : [])
      setSummary(summaryData?.data || summaryData || null)
    } catch (_) {
      setError('Failed to load lecturer data.')
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (page = 1) => {
    if (!id) return
    setSessionsLoading(true)
    try {
      const data = await getAdminLecturerSessions(id, token, { page })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setSessions(rows)
      setSessionsMeta({
        current_page: data?.current_page || page,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (_) {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => { if (token && id) loadData(token) }, [token, id])
  useEffect(() => { if (token && id) loadSessions(sessionsPage) }, [token, id, sessionsPage])

  // Roster modal handlers
  const openRosterModal = async (course) => {
    setRosterCourse(course)
    setShowRosterModal(true)
    setRosterLoading(true); setError('')
    try {
      const data = await getCourseRoster(course.id, token)
      setRosterData(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setRosterData([]); setError('Failed to load roster.') }
    finally { setRosterLoading(false) }
  }

  const handleAddStudent = async () => {
    if (!rosterMatric.trim() || !rosterCourse) return
    setRosterBusy(true); setError('')
    try {
      await addStudentToRoster(rosterCourse.id, rosterMatric.trim().toUpperCase(), rosterName.trim(), token)
      setRosterMatric(''); setRosterName(''); setShowAddForm(false)
      const data = await getCourseRoster(rosterCourse.id, token)
      setRosterData(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) { setError(err?.response?.data?.message || 'Failed to add student.') }
    finally { setRosterBusy(false) }
  }

  const handleRemoveStudent = async (matric) => {
    if (!window.confirm(`Remove student ${matric} from roster?`) || !rosterCourse) return
    setRosterBusy(true); setError('')
    try {
      await removeStudentFromRoster(rosterCourse.id, matric, token)
      const data = await getCourseRoster(rosterCourse.id, token)
      setRosterData(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) { setError(err?.response?.data?.message || 'Failed to remove student.') }
    finally { setRosterBusy(false) }
  }

  const handleImportRoster = async () => {
    if (!rosterFile || !rosterCourse) { setError('Select a CSV file first.'); return }
    setRosterBusy(true); setError('')
    try {
      await importRosterCsv(rosterCourse.id, rosterFile, token)
      setRosterFile(null)
      const data = await getCourseRoster(rosterCourse.id, token)
      setRosterData(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) { setError(err?.response?.data?.message || 'CSV import failed.') }
    finally { setRosterBusy(false) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/lecturers')}>← Back</Button>
          <div>
            <h1 className="text-2xl font-bold">{lecturer?.name || 'Lecturer Detail'}</h1>
            <p className="text-slate-500 text-sm">{lecturer?.email || 'Loading...'}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => { loadData(token); loadSessions(sessionsPage) }} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-6">
          <Card className="h-24 animate-pulse bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
        </div>
      ) : !lecturer ? (
        <Card className="p-8 text-center text-slate-400">Lecturer not found.</Card>
      ) : (
        <>
          {/* Lecturer Info */}
          <Card className="p-5 mb-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-sm text-slate-500">Staff ID</span>
                <div className="font-medium">{lecturer.staff_id || '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Email</span>
                <div className="font-medium">{lecturer.email || '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Faculty</span>
                <div className="font-medium">{lecturer.faculty_name || lecturer.faculty?.name || '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Status</span>
                <div><Badge variant={lecturer.is_verified ? 'success' : 'default'}>{lecturer.is_verified ? 'Verified' : 'Pending'}</Badge></div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Total Courses" value={courses.length} icon="📚" color="#3b82f6" />
            <StatCard label="Total Sessions" value={sessionsMeta.total} icon="📋" color="#8b5cf6" />
            <StatCard label="Avg Attendance %" value={summary?.average_percentage != null ? `${Math.round(summary.average_percentage)}%` : '—'} icon="📊" color="#10b981" />
            <StatCard label="Present / Late / Absent" value={summary ? `${summary.present_count ?? 0} / ${summary.late_count ?? 0} / ${summary.absent_count ?? 0}` : '—'} icon="👥" color="#f59e0b" />
          </div>

          {/* Courses Section */}
          <h2 className="text-lg font-semibold mb-3">Courses</h2>
          {courses.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 mb-6">No courses assigned.</Card>
          ) : (
            <Card className="p-0 mb-6">
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr><Th>Code</Th><Th>Title</Th><Th>Sessions</Th><Th>Students</Th><Th>Status</Th><Th></Th></Tr>
                  </Thead>
                  <Tbody>
                    {courses.map(c => (
                      <Tr key={c.id}>
                        <Td className="font-mono font-medium cursor-pointer hover:text-primary-600" onClick={() => router.push(`/courses/${c.id}`)}>{c.code}</Td>
                        <Td>{c.title}</Td>
                        <Td>{c.sessions_count ?? c.session_count ?? '—'}</Td>
                        <Td>{c.roster_count || 0}</Td>
                        <Td>{c.active_session ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}</Td>
                        <Td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/courses/${c.id}`)}>View</Button>
                            <Button variant="outline" size="sm" onClick={() => openRosterModal(c)}>Roster</Button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* Roster Modal */}
          <Modal open={showRosterModal} onClose={() => { setShowRosterModal(false); setShowAddForm(false) }}>
            <div className="p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Roster: {rosterCourse?.code}</h3>
                  <p className="text-sm text-slate-500">{rosterCourse?.title} — {rosterData.length} student{rosterData.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => downloadCourseRosterCsv(rosterCourse?.id, token).catch(() => setError('Export failed'))}>Export CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>Add</Button>
                </div>
              </div>

              {/* CSV Import */}
              <Card className="mb-4 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" accept=".csv" onChange={(e) => setRosterFile(e.target.files?.[0] || null)} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <Button size="sm" onClick={handleImportRoster} disabled={rosterBusy || !rosterFile}>Import CSV</Button>
                </div>
              </Card>

              {/* Add Student Form */}
              {showAddForm && (
                <Card className="mb-4 p-3">
                  <div className="space-y-2">
                    <Input value={rosterMatric} onChange={(e) => setRosterMatric(e.target.value)} placeholder="Matric Number *" />
                    <Input value={rosterName} onChange={(e) => setRosterName(e.target.value)} placeholder="Student Name (optional)" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddStudent} disabled={!rosterMatric.trim() || rosterBusy}>Add</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    </div>
                  </div>
                </Card>
              )}

              {rosterLoading ? (
                <div className="py-8 text-center text-slate-400">Loading roster...</div>
              ) : rosterData.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="mb-1">No students in roster.</p>
                  <p className="text-xs">Add manually or import CSV.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <Thead><Tr><Th>#</Th><Th>Matric</Th><Th>Name</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {rosterData.map((r, i) => (
                        <Tr key={r.id || i}>
                          <Td className="text-sm text-slate-400">{i + 1}</Td>
                          <Td className="font-mono text-sm">{r.matric_number}</Td>
                          <Td className="text-sm">{r.student?.name || r.student_name || '—'}</Td>
                          <Td><Button variant="destructive" size="sm" onClick={() => handleRemoveStudent(r.matric_number)} disabled={rosterBusy}>Remove</Button></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              )}
            </div>
          </Modal>

          {/* Sessions Section */}
          <h2 className="text-lg font-semibold mb-3">Sessions</h2>
          {sessionsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
          ) : sessions.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 mb-6">No sessions found.</Card>
          ) : (
            <Card className="p-0 mb-6">
              <div className="overflow-x-auto">
                <Table>
                  <Thead>
                    <Tr><Th>ID</Th><Th>Course</Th><Th>Status</Th><Th>Started</Th><Th>Attendance</Th></Tr>
                  </Thead>
                  <Tbody>
                    {sessions.map(s => (
                      <Tr key={s.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/sessions/${s.id}`)}>
                        <Td className="font-mono text-sm">#{s.id}</Td>
                        <Td className="font-medium">{s.course?.code || '—'}</Td>
                        <Td><Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge></Td>
                        <Td className="text-sm">{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'}</Td>
                        <Td>{s.attendance_count ?? '—'}/{s.expected_count ?? '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            </Card>
          )}
          {sessionsMeta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total: {sessionsMeta.total} sessions</span>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={sessionsMeta.current_page <= 1 || sessionsLoading} onClick={() => setSessionsPage(sessionsMeta.current_page - 1)}>Previous</Button>
                <span className="py-2">Page {sessionsMeta.current_page} of {sessionsMeta.last_page}</span>
                <Button variant="ghost" disabled={sessionsMeta.current_page >= sessionsMeta.last_page || sessionsLoading} onClick={() => setSessionsPage(sessionsMeta.current_page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
