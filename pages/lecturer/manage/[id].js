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
  updateCourse,
  updateCourseLocation,
  getCourseShares,
  shareCourse,
  removeCourseShare,
  getTimetableSlots,
  createTimetableSlot,
  deleteTimetableSlot,
  updateSessionNotes,
  getUsers,
} from '../../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'roster', label: 'Roster' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'templates', label: 'Templates' },
  { key: 'sharing', label: 'Sharing' },
  { key: 'timetable', label: 'Timetable' },
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
  const [rosterPreview, setRosterPreview] = useState(null)
  const [rosterParseError, setRosterParseError] = useState('')

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

  // ── Edit Course ──
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [editCode, setEditCode] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editUnit, setEditUnit] = useState('')

  // ── Update Location ──
  const [showUpdateLoc, setShowUpdateLoc] = useState(false)
  const [locName, setLocName] = useState('')
  const [locLat, setLocLat] = useState('')
  const [locLng, setLocLng] = useState('')
  const [locRadius, setLocRadius] = useState('')

  // ── Course Sharing ──
  const [courseShares, setCourseShares] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLecturerId, setShareLecturerId] = useState('')
  const [lecturers, setLecturers] = useState([])

  // ── Session Notes Editing ──
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editNotesText, setEditNotesText] = useState('')

  // ── Timetable ──
  const [timetableSlots, setTimetableSlots] = useState([])
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [slotDay, setSlotDay] = useState('Monday')
  const [slotStart, setSlotStart] = useState('08:00')
  const [slotEnd, setSlotEnd] = useState('10:00')
  const [slotRoom, setSlotRoom] = useState('')

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

  const loadSharing = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getCourseShares(id, token)
      setCourseShares(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
      const usersData = await getUsers(token, { role: 'lecturer' })
      setLecturers(Array.isArray(usersData?.data) ? usersData.data : Array.isArray(usersData) ? usersData : [])
    } catch (_) {
      setCourseShares([])
      setLecturers([])
    }
  }, [token, id])

  const loadTimetable = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getTimetableSlots(id, token)
      setTimetableSlots(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) {
      setTimetableSlots([])
    }
  }, [token, id])

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
    if (activeTab === 'sharing') loadSharing()
    if (activeTab === 'timetable') loadTimetable()
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

  const handlePreviewRosterCsv = () => {
    if (!rosterFile) {
      setError('Select a CSV file first.')
      return
    }
    setRosterPreview(null)
    setRosterParseError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) {
          setRosterParseError('CSV must have a header row and at least one data row.')
          return
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const row = {}
          headers.forEach((h, i) => { row[h] = vals[i] || '' })
          return row
        })
        setRosterPreview(data)
      } catch (_) {
        setRosterParseError('Failed to parse CSV file.')
      }
    }
    reader.onerror = () => { setRosterParseError('Failed to read file.') }
    reader.readAsText(rosterFile)
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
      setRosterPreview(null)
      setRosterParseError('')
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

  // ── Edit Course Handlers ──
  const handleEditCourse = async () => {
    if (!editCode.trim() && !editTitle.trim() && !editUnit.trim()) {
      setError('Fill in at least one field.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = {}
      if (editCode.trim()) payload.code = editCode.trim()
      if (editTitle.trim()) payload.title = editTitle.trim()
      if (editUnit.trim()) payload.course_unit = editUnit.trim()
      await updateCourse(id, payload, token)
      setShowEditCourse(false)
      setEditCode('')
      setEditTitle('')
      setEditUnit('')
      await loadCourse()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update course.')
    } finally {
      setBusy(false)
    }
  }

  // ── Update Location Handlers ──
  const handleUpdateLocation = async () => {
    if (!locName.trim()) {
      setError('Location name is required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = { location_name: locName.trim() }
      if (locLat.trim()) payload.latitude = parseFloat(locLat.trim())
      if (locLng.trim()) payload.longitude = parseFloat(locLng.trim())
      if (locRadius.trim()) payload.location_radius_meters = parseInt(locRadius.trim(), 10)
      await updateCourseLocation(id, payload, token)
      setShowUpdateLoc(false)
      setLocName('')
      setLocLat('')
      setLocLng('')
      setLocRadius('')
      await loadCourse()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update location.')
    } finally {
      setBusy(false)
    }
  }

  // ── Sharing Handlers ──
  const handleShareCourse = async () => {
    if (!shareLecturerId) {
      setError('Select a lecturer.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await shareCourse(id, shareLecturerId, token)
      setShowShareModal(false)
      setShareLecturerId('')
      await loadSharing()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to share course.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveShare = async (shareId) => {
    if (!window.confirm('Remove this share?')) return
    setBusy(true)
    try {
      await removeCourseShare(id, shareId, token)
      await loadSharing()
    } catch (_) {
      setError('Failed to remove share.')
    } finally {
      setBusy(false)
    }
  }

  // ── Session Notes Handlers ──
  const handleEditSessionNotes = async () => {
    if (editingSessionId == null) return
    setBusy(true)
    setError('')
    try {
      await updateSessionNotes(editingSessionId, editNotesText, token)
      setEditingSessionId(null)
      setEditNotesText('')
      await loadCourse()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update notes.')
    } finally {
      setBusy(false)
    }
  }

  // ── Timetable Handlers ──
  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }

  const handleAddSlot = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = { day_of_week: dayMap[slotDay] ?? 1, start_time: slotStart, end_time: slotEnd }
      if (slotRoom.trim()) payload.venue = slotRoom.trim()
      await createTimetableSlot(id, payload, token)
      setShowAddSlot(false)
      setSlotDay('Monday')
      setSlotStart('08:00')
      setSlotEnd('10:00')
      setSlotRoom('')
      await loadTimetable()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add timetable slot.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this timetable slot?')) return
    setBusy(true)
    try {
      await deleteTimetableSlot(slotId, token)
      await loadTimetable()
    } catch (_) {
      setError('Failed to delete slot.')
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

              {/* Edit Course */}
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Course Settings</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setEditCode(course.code || ''); setEditTitle(course.title || ''); setEditUnit(course.course_unit || ''); setShowEditCourse(true) }}>Edit Course</Button>
                    <Button variant="ghost" onClick={() => { setLocName(course.location_name || ''); setLocLat(course.latitude || ''); setLocLng(course.longitude || ''); setLocRadius(course.location_radius_meters || ''); setShowUpdateLoc(true) }}>Update Location</Button>
                  </div>
                </div>
              </Card>
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
                            {s.notes ? <p className="text-xs text-slate-400 mt-1 italic">{s.notes}</p> : null}
                          </div>
                          <div className="flex gap-1 ml-4 shrink-0">
                            <Button variant="ghost" onClick={() => { setEditingSessionId(s.id); setEditNotesText(s.notes || ''); }}>Edit Notes</Button>
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
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Bulk Upload from CSV</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => { setRosterFile(e.target.files?.[0] || null); setRosterPreview(null); setRosterParseError('') }}
                    className="text-sm flex-1"
                  />
                  <Button variant="ghost" onClick={handlePreviewRosterCsv} disabled={!rosterFile}>Preview</Button>
                </div>
                {rosterParseError ? (
                  <p className="text-xs text-red-500 mt-2">{rosterParseError}</p>
                ) : null}
                {rosterPreview ? (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">{rosterPreview.length} student(s) found:</p>
                    <div className="max-h-40 overflow-auto mb-3">
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Matric</Th>
                            <Th>Name</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {rosterPreview.map((r, i) => (
                            <Tr key={i}>
                              <Td className="font-mono text-sm">{r.matric_number || r.matric || r.matricnumber || '—'}</Td>
                              <Td>{r.name || r.student_name || r.fullname || r.studentname || '—'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleImportRosterCsv} disabled={busy}>{busy ? 'Importing...' : 'Confirm Import'}</Button>
                      <Button variant="ghost" onClick={() => { setRosterFile(null); setRosterPreview(null); setRosterParseError('') }}>Cancel</Button>
                    </div>
                  </div>
                ) : rosterFile && !rosterParseError ? (
                  <div className="mt-2">
                    <Button variant="ghost" onClick={handleImportRosterCsv} disabled={busy}>{busy ? 'Importing...' : 'Import Directly'}</Button>
                  </div>
                ) : null}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <a
                    href="data:text/csv;charset=utf-8,matric_number,name%0A"
                    download="roster_template.csv"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Download CSV Template
                  </a>
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

          {/* ═══ TAB: Sharing ═══ */}
          {activeTab === 'sharing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course Sharing ({Array.isArray(courseShares) ? courseShares.length : 0})</h2>
                <Button onClick={() => { loadSharing(); setShowShareModal(true) }} disabled={busy}>Share with Lecturer</Button>
              </div>

              {!Array.isArray(courseShares) || courseShares.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p className="mb-4">No shares yet.</p>
                  <Button onClick={() => setShowShareModal(true)}>Share This Course</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {courseShares.map(sh => (
                    <Card key={sh.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{sh.lecturer?.name || sh.lecturer_name || `Lecturer #${sh.lecturer_id}`}</p>
                          <p className="text-xs text-slate-400">{sh.lecturer?.email || sh.lecturer_email || ''}</p>
                        </div>
                        <Button variant="destructive" onClick={() => handleRemoveShare(sh.id)} disabled={busy}>Remove</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: Timetable ═══ */}
          {activeTab === 'timetable' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Timetable Slots ({Array.isArray(timetableSlots) ? timetableSlots.length : 0})</h2>
                <Button onClick={() => setShowAddSlot(true)}>Add Slot</Button>
              </div>

              {!Array.isArray(timetableSlots) || timetableSlots.length === 0 ? (
                <Card className="p-12 text-center text-slate-400">
                  <p>No timetable slots. Add a slot to schedule this course.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {timetableSlots.map(slot => (
                    <Card key={slot.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day_of_week] || slot.day_of_week}</p>
                          <p className="text-sm text-slate-500">
                            {slot.start_time} — {slot.end_time}
                            {slot.venue || slot.room ? <> &middot; {slot.venue || slot.room}</> : null}
                          </p>
                        </div>
                        <Button variant="destructive" onClick={() => handleDeleteSlot(slot.id)} disabled={busy}>Delete</Button>
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

      {/* ═══ MODAL: Edit Course ═══ */}
      <Modal open={showEditCourse} onClose={() => setShowEditCourse(false)} title="Edit Course">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Code</label>
            <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} placeholder={course?.code} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Title</label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={course?.title} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Unit</label>
            <Input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder={course?.course_unit} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEditCourse} disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</Button>
            <Button variant="ghost" onClick={() => setShowEditCourse(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: Update Location ═══ */}
      <Modal open={showUpdateLoc} onClose={() => setShowUpdateLoc(false)} title="Update Course Location">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location Name *</label>
            <Input value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="e.g. Main Lecture Hall" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <Input value={locLat} onChange={(e) => setLocLat(e.target.value)} placeholder="6.5244" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <Input value={locLng} onChange={(e) => setLocLng(e.target.value)} placeholder="3.3792" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Radius (meters)</label>
            <Input type="number" value={locRadius} onChange={(e) => setLocRadius(e.target.value)} placeholder="50" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpdateLocation} disabled={busy}>{busy ? 'Saving...' : 'Update Location'}</Button>
            <Button variant="ghost" onClick={() => setShowUpdateLoc(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: Share Course ═══ */}
      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="Share Course with Lecturer">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Lecturer *</label>
            <Select
              options={lecturers.map(l => ({ value: String(l.id), label: `${l.name || l.first_name || ''} ${l.last_name || ''} — ${l.email || ''}` }))}
              value={shareLecturerId}
              onChange={setShareLecturerId}
              placeholder="Choose a lecturer..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleShareCourse} disabled={busy || !shareLecturerId}>{busy ? 'Sharing...' : 'Share Course'}</Button>
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: Edit Session Notes ═══ */}
      <Modal open={editingSessionId != null} onClose={() => setEditingSessionId(null)} title={`Edit Notes - Session #${editingSessionId}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Session Notes</label>
            <textarea
              value={editNotesText}
              onChange={(e) => setEditNotesText(e.target.value)}
              placeholder="Enter session notes..."
              className="px-3 py-2 border rounded-md w-full min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEditSessionNotes} disabled={busy}>{busy ? 'Saving...' : 'Save Notes'}</Button>
            <Button variant="ghost" onClick={() => setEditingSessionId(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ═══ MODAL: Add Timetable Slot ═══ */}
      <Modal open={showAddSlot} onClose={() => setShowAddSlot(false)} title="Add Timetable Slot">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Day *</label>
            <Select
              options={['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => ({ value: d, label: d }))}
              value={slotDay}
              onChange={setSlotDay}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time *</label>
              <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time *</label>
              <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room (optional)</label>
            <Input value={slotRoom} onChange={(e) => setSlotRoom(e.target.value)} placeholder="e.g. LT1" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSlot} disabled={busy}>{busy ? 'Adding...' : 'Add Slot'}</Button>
            <Button variant="ghost" onClick={() => setShowAddSlot(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
