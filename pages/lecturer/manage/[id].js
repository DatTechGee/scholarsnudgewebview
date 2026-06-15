import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import Card from '../../../components/shadcn/Card'
import Badge from '../../../components/shadcn/Badge'
import Button from '../../../components/shadcn/Button'
import Input from '../../../components/shadcn/Input'
import Modal from '../../../components/shadcn/Modal'
import Select from '../../../components/shadcn/Select'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../../components/shadcn/Table'
import {
  getLecturerCourses,
  getCourseSessions,
  createSession,
  stopSession,
  cancelSession,
  getCourseRoster,
  addStudentToRoster,
  removeStudentFromRoster,
  importRosterCsv,
  markStudentPresentByMatric,
  getCourseAnalytics,
  getSessionReport,
  getLecturerSessionTemplates,
  createLecturerSessionTemplate,
  deleteLecturerSessionTemplate,
  getLecturerSwapRequestsSent,
  createLecturerSwapRequest,
} from '../../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'roster', label: 'Roster' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'templates', label: 'Templates' },
  { key: 'swaps', label: 'Swap Requests' },
  { key: 'actions', label: 'Actions' },
]

export default function ManageCourse() {
  const router = useRouter()
  const { id } = router.query
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [roster, setRoster] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [templates, setTemplates] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [allCourses, setAllCourses] = useState([])

  const [sessionPage, setSessionPage] = useState(1)
  const sessionPageSize = 10

  // ── Create Session Modal ──
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')

  // ── Roster ──
  const [addMatric, setAddMatric] = useState('')
  const [addName, setAddName] = useState('')
  const [rosterFile, setRosterFile] = useState(null)

  // ── Mark by Matric ──
  const [markMatric, setMarkMatric] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')

  // ── Template ──
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDuration, setTemplateDuration] = useState(60)
  const [templateLocation, setTemplateLocation] = useState('')

  // ── Swap Request ──
  const [showCreateSwap, setShowCreateSwap] = useState(false)
  const [swapTargetCourse, setSwapTargetCourse] = useState('')
  const [swapNotes, setSwapNotes] = useState('')

  // ── Session Report ──
  const [viewSessionId, setViewSessionId] = useState(null)
  const [sessionReport, setSessionReport] = useState(null)
  const [sessionReportLoading, setSessionReportLoading] = useState(false)

  // ── Init ──
  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadCourse = useCallback(async () => {
    if (!token || !id) return
    setLoading(true)
    setError('')
    try {
      const data = await getCourseSessions(id, token)
      const d = data?.data || data || {}
      setCourse(d.course || d)
      setSessions(Array.isArray(d.sessions) ? d.sessions : [])
    } catch (_) {
      setError('Failed to load course.')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  const loadRoster = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getCourseRoster(id, token)
      setRoster(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) {
      setRoster([])
    }
  }, [token, id])

  const loadAnalytics = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getCourseAnalytics(id, token)
      setAnalytics(data?.data || data || null)
    } catch (_) {
      setAnalytics(null)
    }
  }, [token, id])

  const loadTemplates = useCallback(async () => {
    if (!token) return
    try {
      const data = await getLecturerSessionTemplates(token)
      setTemplates(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) {
      setTemplates([])
    }
  }, [token])

  const loadSwapRequests = useCallback(async () => {
    if (!token) return
    try {
      const data = await getLecturerSwapRequestsSent(token)
      setSwapRequests(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) {
      setSwapRequests([])
    }
  }, [token])

  const loadAllCourses = useCallback(async () => {
    if (!token) return
    try {
      const data = await getLecturerCourses(token)
      setAllCourses(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) {
      setAllCourses([])
    }
  }, [token])

  useEffect(() => {
    if (token && id) {
      loadCourse()
    }
  }, [loadCourse])

  useEffect(() => {
    if (!token || !id) return
    if (activeTab === 'roster') loadRoster()
    if (activeTab === 'attendance') loadAnalytics()
    if (activeTab === 'templates') loadTemplates()
    if (activeTab === 'swaps') { loadSwapRequests(); loadAllCourses() }
  }, [activeTab, token, id])

  const loadSessionReport = async (sessionId) => {
    setSessionReportLoading(true)
    setSessionReport(null)
    try {
      const data = await getSessionReport(sessionId, token)
      setSessionReport(data?.data || data || {})
    } catch (_) {
      setSessionReport(null)
    } finally {
      setSessionReportLoading(false)
    }
  }

  // ── Session Handlers ──
  const handleCreateSession = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = { duration_minutes: sessionDuration }
      if (sessionTitle.trim()) payload.title = sessionTitle.trim()
      if (sessionNotes.trim()) payload.notes = sessionNotes.trim()
      await createSession(id, payload, token)
      setShowCreateSession(false)
      setSessionDuration(60)
      setSessionNotes('')
      setSessionTitle('')
      await loadCourse()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create session.')
    } finally {
      setBusy(false)
    }
  }

  const handleStopSession = async (sessionId) => {
    if (!window.confirm('Stop this session? Students will no longer be able to check in.')) return
    setBusy(true)
    try {
      await stopSession(sessionId, token)
      await loadCourse()
    } catch (_) {
      setError('Failed to stop session.')
    } finally {
      setBusy(false)
    }
  }

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Cancel this session? This will delete all attendance records for this session.')) return
    setBusy(true)
    try {
      await cancelSession(sessionId, token)
      await loadCourse()
    } catch (_) {
      setError('Failed to cancel session.')
    } finally {
      setBusy(false)
    }
  }

  const handleViewReport = async (sessionId) => {
    setViewSessionId(sessionId)
    await loadSessionReport(sessionId)
  }

  // ── Roster Handlers ──
  const handleAddToRoster = async () => {
    if (!addMatric.trim()) return
    setBusy(true)
    try {
      await addStudentToRoster(id, addMatric.trim(), addName.trim() || 'Unknown', token)
      setAddMatric('')
      setAddName('')
      await loadRoster()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add student.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveFromRoster = async (matric) => {
    if (!window.confirm(`Remove student ${matric} from roster?`)) return
    setBusy(true)
    try {
      await removeStudentFromRoster(id, matric, token)
      await loadRoster()
    } catch (_) {
      setError('Failed to remove student.')
    } finally {
      setBusy(false)
    }
  }

  const handleImportRosterCsv = async () => {
    if (!rosterFile) {
      setError('Select a CSV file first.')
      return
    }
    setBusy(true)
    try {
      await importRosterCsv(id, rosterFile, token)
      setRosterFile(null)
      await loadRoster()
    } catch (err) {
      setError(err?.response?.data?.message || 'CSV import failed.')
    } finally {
      setBusy(false)
    }
  }

  // ── Mark Present ──
  const handleMarkPresent = async () => {
    if (!markMatric.trim()) return
    if (!selectedSessionId) {
      setError('Select a session first.')
      return
    }
    setBusy(true)
    try {
      await markStudentPresentByMatric(selectedSessionId, markMatric.trim(), token)
      setMarkMatric('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to mark present.')
    } finally {
      setBusy(false)
    }
  }

  // ── Template Handlers ──
  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: templateName.trim(),
        duration_minutes: templateDuration,
      }
      if (templateLocation.trim()) payload.location_name = templateLocation.trim()
      await createLecturerSessionTemplate(payload, token)
      setShowCreateTemplate(false)
      setTemplateName('')
      setTemplateDuration(60)
      setTemplateLocation('')
      await loadTemplates()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create template.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return
    setBusy(true)
    try {
      await deleteLecturerSessionTemplate(templateId, token)
      await loadTemplates()
    } catch (_) {
      setError('Failed to delete template.')
    } finally {
      setBusy(false)
    }
  }

  // ── Swap Request Handlers ──
  const handleCreateSwap = async () => {
    if (!swapTargetCourse) {
      setError('Select a target course.')
      return
    }
    setBusy(true)
    try {
      await createLecturerSwapRequest({
        requested_course_id: Number(swapTargetCourse),
        notes: swapNotes.trim() || null,
      }, token)
      setShowCreateSwap(false)
      setSwapTargetCourse('')
      setSwapNotes('')
      await loadSwapRequests()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create swap request.')
    } finally {
      setBusy(false)
    }
  }

  // ── Utility ──
  const activeSession = Array.isArray(sessions) ? sessions.find(s => s.status === 'active') : null

  const paginatedSessions = Array.isArray(sessions)
    ? sessions.slice(0, sessionPage * sessionPageSize)
    : []

  const totalPages = Math.ceil((Array.isArray(sessions) ? sessions.length : 0) / sessionPageSize)

  // ── Auth guard ──
  if (!token) {
    return (
      <Layout>
        <Card className="p-8 text-center">
          <p className="text-slate-500 mb-4">Please sign in first.</p>
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        </Card>
      </Layout>
    )
  }

  // ── Render ──
  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/lecturer/courses')} className="text-slate-500">← Courses</Button>
            <h1 className="text-2xl font-bold text-slate-800">{course?.code || 'Loading...'}</h1>
            {activeSession ? <Badge variant="success">Live Session</Badge> : null}
          </div>
          <p className="text-slate-500 text-sm mt-1">{course?.title || 'Course Management Hub'}</p>
        </div>
        <div className="flex gap-2">
          {activeSession ? (
            <>
              <Button variant="destructive" onClick={() => handleCancelSession(activeSession.id)} disabled={busy}>Cancel Session</Button>
              <Button onClick={() => handleStopSession(activeSession.id)} disabled={busy}>Stop Session</Button>
            </>
          ) : (
            <Button onClick={() => setShowCreateSession(true)}>Start Session</Button>
          )}
          <Button variant="ghost" onClick={loadCourse} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b pb-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
      ) : !course ? (
        <Card className="p-12 text-center text-slate-400">
          <p>Course not found.</p>
          <Button variant="ghost" onClick={() => router.push('/lecturer/courses')} className="mt-4">Back to Courses</Button>
        </Card>
      ) : (
        <>
          {/* ═══ TAB: Overview ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Course Info Card */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">Course Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Code</span>
                    <p className="font-mono font-medium text-slate-800">{course.code || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Title</span>
                    <p className="font-medium text-slate-800">{course.title || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Faculty</span>
                    <p className="text-slate-700">{course.faculty_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Department</span>
                    <p className="text-slate-700">{course.department_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Level</span>
                    <p className="text-slate-700">{typeof course.academic_level === 'object' ? course.academic_level?.name : course.academic_level || course.academic_level_id || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Course Unit</span>
                    <p className="text-slate-700">{course.course_unit || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Location</span>
                    <p className="text-slate-700">{course.location_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Radius</span>
                    <p className="text-slate-700">{course.location_radius_meters ? `${course.location_radius_meters}m` : '—'}</p>
                  </div>
                </div>
              </Card>

              {/* Stats Grid */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">At a Glance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">{Array.isArray(sessions) ? sessions.length : 0}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">Total Sessions</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{course.roster_count ?? (Array.isArray(roster) ? roster.length : 0)}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">Total Students</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <div className="text-2xl font-bold text-purple-700">
                      {analytics?.attendance_rate != null
                        ? `${Math.round(analytics.attendance_rate)}%`
                        : analytics?.average_attendance != null
                          ? `${Math.round(analytics.average_attendance)}%`
                          : '—'}
                    </div>
                    <div className="text-xs text-purple-600 font-medium mt-1">Avg Attendance</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{activeSession ? 'Active' : 'Inactive'}</div>
                    <div className="text-xs text-amber-600 font-medium mt-1">Current Session</div>
                  </div>
                </div>
              </Card>

              {/* Active Session Quick Actions */}
              {activeSession && (
                <Card className="border-2 border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="success">Active</Badge>
                      <div>
                        <p className="font-semibold text-slate-800">Session #{activeSession.id} is live</p>
                        <p className="text-sm text-slate-500">
                          Started at {activeSession.starts_at ? new Date(activeSession.starts_at).toLocaleTimeString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => { setActiveTab('sessions'); handleViewReport(activeSession.id) }}>View Report</Button>
                      <Button onClick={() => handleStopSession(activeSession.id)} disabled={busy}>Stop</Button>
                      <Button variant="destructive" onClick={() => handleCancelSession(activeSession.id)} disabled={busy}>Cancel</Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ═══ TAB: Sessions ═══ */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sessions ({Array.isArray(sessions) ? sessions.length : 0})</h2>
                <Button onClick={() => setShowCreateSession(true)} disabled={!!activeSession}>
                  {activeSession ? 'Session Active' : 'Start Session'}
                </Button>
              </div>

              {!Array.isArray(sessions) || sessions.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p className="mb-4">No sessions yet.</p>
                  <Button onClick={() => setShowCreateSession(true)}>Start First Session</Button>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedSessions.map(s => (
                      <Card key={s.id} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{s.id}</span>
                              <Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge>
                              {s.attendance_count > 0 && s.expected_count > 0 && (
                                <span className="text-xs font-medium text-emerald-600">
                                  {Math.round((s.attendance_count / s.expected_count) * 100)}% rate
                                </span>
                              )}
                            </div>
                            {s.title ? <p className="text-sm font-medium text-slate-700 mb-1">{s.title}</p> : null}
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span>Started: {s.starts_at ? new Date(s.starts_at).toLocaleString() : '—'}</span>
                              {s.ends_at ? <span>Ended: {new Date(s.ends_at).toLocaleString()}</span> : null}
                            </div>
                            <div className="flex items-center gap-4 text-sm mt-1">
                              <span className="text-slate-600 font-medium">{s.attendance_count ?? 0} attended</span>
                              <span className="text-slate-400">/ {s.expected_count ?? '—'} expected</span>
                            </div>
                            {s.notes ? <p className="text-xs text-slate-400 mt-1 italic">📝 {s.notes}</p> : null}
                          </div>
                          <div className="flex gap-1 ml-4 shrink-0">
                            <Button variant="ghost" onClick={() => handleViewReport(s.id)}>View Report</Button>
                            {s.status === 'active' ? (
                              <>
                                <Button onClick={() => handleStopSession(s.id)} disabled={busy}>Stop</Button>
                                <Button variant="destructive" onClick={() => handleCancelSession(s.id)} disabled={busy}>Cancel</Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        variant="ghost"
                        disabled={sessionPage <= 1}
                        onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-500">Page {sessionPage} of {totalPages}</span>
                      <Button
                        variant="ghost"
                        disabled={sessionPage >= totalPages}
                        onClick={() => setSessionPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ TAB: Roster ═══ */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Course Roster ({Array.isArray(roster) ? roster.length : 0})</h2>

              {/* Add Student */}
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Student Manually</h3>
                <div className="flex gap-2">
                  <Input
                    value={addMatric}
                    onChange={(e) => setAddMatric(e.target.value)}
                    placeholder="Matric number"
                    className="flex-1"
                  />
                  <Input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Student name"
                    className="flex-1"
                  />
                  <Button onClick={handleAddToRoster} disabled={busy}>Add</Button>
                </div>
              </Card>

              {/* CSV Import */}
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Import from CSV</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setRosterFile(e.target.files?.[0] || null)}
                    className="text-sm flex-1"
                  />
                  <Button variant="ghost" onClick={handleImportRosterCsv} disabled={busy || !rosterFile}>Import CSV</Button>
                </div>
              </Card>

              {/* Student Table */}
              {!Array.isArray(roster) || roster.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p>No students in roster. Add manually or import a CSV file.</p>
                </Card>
              ) : (
                <Card className="p-0">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Matric Number</Th>
                        <Th className="text-right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {roster.map(r => (
                        <Tr key={r.id || r.matric_number}>
                          <Td className="font-medium">{r.student_name || '—'}</Td>
                          <Td className="font-mono text-sm">{r.matric_number}</Td>
                          <Td className="text-right">
                            <Button variant="destructive" onClick={() => handleRemoveFromRoster(r.matric_number)} disabled={busy}>
                              Remove
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {/* ═══ TAB: Attendance ═══ */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Attendance Analytics</h2>

              {/* Stats */}
              {analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{analytics.total_present ?? analytics.present ?? 0}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">Present</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{analytics.total_late ?? analytics.late ?? 0}</div>
                    <div className="text-xs text-amber-600 font-medium mt-1">Late</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-5 text-center border border-red-100">
                    <div className="text-2xl font-bold text-red-700">{analytics.total_absent ?? analytics.absent ?? 0}</div>
                    <div className="text-xs text-red-600 font-medium mt-1">Absent</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
                    <div className="text-2xl font-bold text-purple-700">
                      {analytics.attendance_rate != null
                        ? `${Math.round(analytics.attendance_rate)}%`
                        : analytics.average_attendance != null
                          ? `${Math.round(analytics.average_attendance)}%`
                          : '—'}
                    </div>
                    <div className="text-xs text-purple-600 font-medium mt-1">Avg Attendance</div>
                  </div>
                </div>
              ) : (
                <Card className="p-8 text-center text-slate-400">
                  <p>No attendance data available yet.</p>
                </Card>
              )}

              {/* Mark by Matric */}
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Mark Student Present by Matric Number</h3>
                <p className="text-xs text-slate-500 mb-3">Select a session and enter a matric number to manually mark a student as present.</p>
                <div className="flex gap-2">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white flex-1"
                  >
                    <option value="">Select a session...</option>
                    {Array.isArray(sessions) && sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        #{s.id} — {s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'} ({s.status})
                      </option>
                    ))}
                  </select>
                  <Input
                    value={markMatric}
                    onChange={(e) => setMarkMatric(e.target.value)}
                    placeholder="Matric number"
                    className="flex-1"
                  />
                  <Button onClick={handleMarkPresent} disabled={busy || !selectedSessionId}>Mark Present</Button>
                </div>
              </Card>
            </div>
          )}

          {/* ═══ TAB: Templates ═══ */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Session Templates ({Array.isArray(templates) ? templates.length : 0})</h2>
                <Button onClick={() => setShowCreateTemplate(true)}>New Template</Button>
              </div>

              {!Array.isArray(templates) || templates.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p className="mb-4">No templates yet.</p>
                  <Button onClick={() => setShowCreateTemplate(true)}>Create Your First Template</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {templates.map(t => (
                    <Card key={t.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{t.name}</p>
                          <div className="flex gap-3 text-sm text-slate-500 mt-1">
                            <span>{t.duration_minutes || '—'} min</span>
                            {t.location_name ? <span>📍 {t.location_name}</span> : null}
                          </div>
                        </div>
                        <Button variant="destructive" onClick={() => handleDeleteTemplate(t.id)} disabled={busy}>Delete</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: Swap Requests ═══ */}
          {activeTab === 'swaps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Swap Requests Sent ({Array.isArray(swapRequests) ? swapRequests.length : 0})</h2>
                <Button onClick={() => { loadAllCourses(); setShowCreateSwap(true) }}>New Swap Request</Button>
              </div>

              {!Array.isArray(swapRequests) || swapRequests.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p>No swap requests sent yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {swapRequests.map(sr => (
                    <Card key={sr.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{sr.id}</span>
                            <Badge variant={statusColors[sr.status] || 'default'}>{sr.status || 'pending'}</Badge>
                          </div>
                          <p className="text-sm text-slate-700">
                            Target Course: <span className="font-medium">{sr.requested_course?.code || sr.requested_course_id || '—'}</span>
                          </p>
                          {sr.notes ? <p className="text-xs text-slate-400 mt-1">📝 {sr.notes}</p> : null}
                          <p className="text-xs text-slate-400 mt-1">
                            Created: {sr.created_at ? new Date(sr.created_at).toLocaleString() : '—'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: Actions ═══ */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowCreateSession(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">▶</div>
                    <div>
                      <p className="font-semibold text-slate-800">Start Session</p>
                      <p className="text-xs text-slate-500">Begin a new attendance session</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/sessions?course_id=${id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">📋</div>
                    <div>
                      <p className="font-semibold text-slate-800">View All Sessions</p>
                      <p className="text-xs text-slate-500">Full session management page</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/attendance?course_id=${id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">📊</div>
                    <div>
                      <p className="font-semibold text-slate-800">Attendance Reports</p>
                      <p className="text-xs text-slate-500">View detailed attendance reports</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/timetable?course_id=${id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg">📅</div>
                    <div>
                      <p className="font-semibold text-slate-800">View Timetable</p>
                      <p className="text-xs text-slate-500">Course timetable and scheduling</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/venues?course_id=${id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">📍</div>
                    <div>
                      <p className="font-semibold text-slate-800">View Venues</p>
                      <p className="text-xs text-slate-500">Manage course venues</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/shares?course_id=${id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">🔄</div>
                    <div>
                      <p className="font-semibold text-slate-800">Course Sharing</p>
                      <p className="text-xs text-slate-500">Share course with other lecturers</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { loadRoster(); setActiveTab('roster') }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-lg">⬇</div>
                    <div>
                      <p className="font-semibold text-slate-800">Export Roster CSV</p>
                      <p className="text-xs text-slate-500">Download student roster as CSV</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setActiveTab('sessions') }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-lg">⬇</div>
                    <div>
                      <p className="font-semibold text-slate-800">Export Sessions CSV</p>
                      <p className="text-xs text-slate-500">Download session list as CSV</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lecturer/courses`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-lg">✎</div>
                    <div>
                      <p className="font-semibold text-slate-800">Edit Course</p>
                      <p className="text-xs text-slate-500">Go to courses page to edit</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL: Create Session ═══ */}
      <Modal open={showCreateSession} onClose={() => setShowCreateSession(false)} title="Start New Session">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input type="number" min={1} value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))} placeholder="60" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session Title (optional)</label>
            <Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="e.g. Week 3 Lecture" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Topic: Introduction to Programming"
              className="px-3 py-2 border rounded-md w-full min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateSession} disabled={busy}>{busy ? 'Starting...' : 'Start Session'}</Button>
            <Button variant="ghost" onClick={() => setShowCreateSession(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: View Session Report ═══ */}
      <Modal open={!!viewSessionId} onClose={() => { setViewSessionId(null); setSessionReport(null) }} title={`Session #${viewSessionId} Report`}>
        {sessionReportLoading ? (
          <div className="py-8 text-center text-slate-400">Loading report...</div>
        ) : sessionReport ? (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                <div className="text-xl font-bold text-emerald-700">{sessionReport.summary?.present || sessionReport.present_count || 0}</div>
                <div className="text-xs text-emerald-600 font-medium mt-0.5">Present</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                <div className="text-xl font-bold text-amber-700">{sessionReport.summary?.late || sessionReport.late_count || 0}</div>
                <div className="text-xs text-amber-600 font-medium mt-0.5">Late</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                <div className="text-xl font-bold text-red-700">{sessionReport.summary?.absent || sessionReport.absent_count || 0}</div>
                <div className="text-xs text-red-600 font-medium mt-0.5">Absent</div>
              </div>
            </div>
            {(sessionReport.attendances && sessionReport.attendances.length > 0) ? (
              <div className="max-h-72 overflow-auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Student</Th>
                      <Th>Status</Th>
                      <Th>Time</Th>
                      <Th>Distance</Th>
                      <Th>Late</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sessionReport.attendances.map(a => (
                      <Tr key={a.id}>
                        <Td className="font-medium">{a.student?.name || a.student_name || `#${a.student_id}`}</Td>
                        <Td>
                          <Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}>
                            {a.status}
                          </Badge>
                        </Td>
                        <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString() : '—'}</Td>
                        <Td className="text-sm text-slate-500">{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                        <Td>{a.is_late ? <Badge variant="warning">Yes</Badge> : '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No attendance records for this session.</p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">Failed to load report.</div>
        )}
      </Modal>

      {/* ═══ MODAL: Create Template ═══ */}
      <Modal open={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} title="New Session Template">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name *</label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Standard Lecture" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Duration (minutes)</label>
            <Input type="number" min={1} value={templateDuration} onChange={(e) => setTemplateDuration(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Location (optional)</label>
            <Input value={templateLocation} onChange={(e) => setTemplateLocation(e.target.value)} placeholder="e.g. LT1" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateTemplate} disabled={busy}>{busy ? 'Creating...' : 'Create Template'}</Button>
            <Button variant="ghost" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: Create Swap Request ═══ */}
      <Modal open={showCreateSwap} onClose={() => setShowCreateSwap(false)} title="New Swap Request">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Course *</label>
            <Select
              options={allCourses
                .filter(c => String(c.id) !== String(id))
                .map(c => ({ value: String(c.id), label: `${c.code} — ${c.title}` }))
              }
              value={swapTargetCourse}
              onChange={setSwapTargetCourse}
              placeholder="Select a course..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={swapNotes}
              onChange={(e) => setSwapNotes(e.target.value)}
              placeholder="Reason for swap..."
              className="px-3 py-2 border rounded-md w-full min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateSwap} disabled={busy}>{busy ? 'Sending...' : 'Send Request'}</Button>
            <Button variant="ghost" onClick={() => setShowCreateSwap(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
