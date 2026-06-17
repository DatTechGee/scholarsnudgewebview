import { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import {
  getStudentAttendanceReport,
  getStudentAttendanceHistory,
  getStudentTimetable,
  getStudentFaceStatus,
  getStudentActiveSessions,
  checkInAttendance,
  checkOutAttendance,
} from '../../services/api'

function StatCard({ label, value, sub, color }) {
  return (
    <Card className="border-l-4 shadow-sm text-center" style={{ borderLeftColor: color }}>
      <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
      {sub ? <div className="text-xs text-slate-400">{sub}</div> : null}
      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{label}</div>
    </Card>
  )
}

export default function StudentDashboard() {
  const [token, setToken] = useState('')
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [timetable, setTimetable] = useState([])
  const [faceStatus, setFaceStatus] = useState(null)
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkInSession, setCheckInSession] = useState(null)
  const [checkInBusy, setCheckInBusy] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [checkInSuccess, setCheckInSuccess] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [videoReady, setVideoReady] = useState(false)
  const [faceImage, setFaceImage] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [monitoringSession, setMonitoringSession] = useState(null)
  const [monitorTimer, setMonitorTimer] = useState(null)
  const [insights, setInsights] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') || '' : ''
    setToken(t)
    return t
  }, [])

  const loadData = useCallback(async (t) => {
    if (!t) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [reportData, historyData, timetableData, faceData, sessionsData] = await Promise.all([
        getStudentAttendanceReport(t).catch(() => null),
        getStudentAttendanceHistory(t, { per_page: 5 }).catch(() => null),
        getStudentTimetable(t).catch(() => null),
        getStudentFaceStatus(t).catch(() => null),
        getStudentActiveSessions(t).catch(() => null),
      ])
      setReport(reportData?.data || reportData || null)
      const historyRows = Array.isArray(historyData?.data) ? historyData.data : Array.isArray(historyData?.courses) ? historyData.courses : []
      setHistory(historyRows)
      const timetableCourses = Array.isArray(timetableData?.data) ? timetableData.data : Array.isArray(timetableData?.courses) ? timetableData.courses : Array.isArray(timetableData) ? timetableData : []
      setTimetable(timetableCourses)
      setFaceStatus(faceData?.data || faceData || null)
      const sessionsList = Array.isArray(sessionsData?.data) ? sessionsData.data : Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : Array.isArray(sessionsData) ? sessionsData : []
      setActiveSessions(sessionsList)
    } catch (err) {
      setError('Failed to load student dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
    setCheckInError('')
    setVideoReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      setCameraStream(stream)
      setShowCamera(true)
    } catch {
      setCheckInError('Camera access denied.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null) }
    setShowCamera(false)
    setVideoReady(false)
  }, [cameraStream])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !videoReady) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'face.jpg', { type: 'image/jpeg' })
        setFaceImage(file)
        setFacePreview(URL.createObjectURL(blob))
      }
    }, 'image/jpeg', 0.9)
    stopCamera()
  }, [stopCamera, videoReady])

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not available.'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLocationError('')
      },
      () => { setLocationError('Could not get location. Check-in may still work.'); setLocation(null) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const openCheckIn = (session) => {
    const checkedIn = session.checked_in_count ?? 0
    const capacity = session.seating_capacity
    if (capacity != null && checkedIn >= capacity) {
      setCheckInError('This session has reached its full capacity.')
      return
    }
    setCheckInSession(session)
    setFaceImage(null); setFacePreview(null); setShowCamera(false)
    setCheckInError(''); setCheckInSuccess('')
    setLocation(null); setLocationError('')
    getLocation()
    setShowCheckIn(true)
  }

  const handleCheckIn = async () => {
    if (!checkInSession) return
    setCheckInBusy(true); setCheckInError(''); setCheckInSuccess('')
    try {
      const payload = {}
      if (faceImage) payload.faceImage = faceImage
      if (location != null) {
        payload.latitude = location.latitude
        payload.longitude = location.longitude
        if (location.accuracy != null) payload.accuracy = location.accuracy
        const hashStr = `${checkInSession.id}|${location.latitude}|${location.longitude}|${location.accuracy ?? ''}`
        const enc = new TextEncoder()
        const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(hashStr))
        const hashArr = Array.from(new Uint8Array(hashBuf))
        payload.integrity_hash = hashArr.map(b => b.toString(16).padStart(2, '0')).join('')
      }
      await checkInAttendance(checkInSession.id, payload, token)
      setCheckInSuccess('Checked in successfully!')
      setMonitoringSession(checkInSession)
      setTimeout(() => { setShowCheckIn(false) }, 800)
    } catch (err) {
      setCheckInError(err?.response?.data?.message || 'Check-in failed.')
    } finally { setCheckInBusy(false) }
  }

  const handleCheckOut = async (session) => {
    if (!window.confirm('Check out of this session?')) return
    setCheckInBusy(true)
    try {
      await checkOutAttendance(session.id, token)
      setMonitoringSession(null)
      await loadData(token)
    } catch (err) {
      setError(err?.response?.data?.message || 'Check-out failed.')
    } finally { setCheckInBusy(false) }
  }

  useEffect(() => {
    const t = getToken()
    if (t) loadData(t)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (!monitoringSession?.ends_at) return
    const update = () => {
      const remaining = new Date(monitoringSession.ends_at).getTime() - Date.now()
      if (remaining <= 0) { setMonitorTimer('Ended'); setMonitoringSession(null); return }
      const m = Math.floor(remaining / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setMonitorTimer(`${m}m ${s}s`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [monitoringSession])

  const student = report?.student || report?.user || {}
  const summary = report?.summary || report || { total: 0, attended: 0, present: 0, late: 0, absent: 0, average_percentage: 0 }
  const totalAttended = summary.total_attended ?? summary.attended ?? summary.present ?? 0
  const totalSessions = summary.total_sessions ?? summary.total ?? 0
  const avgPct = summary.average_percentage ?? summary.avg ?? (totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0)
  const courses = report?.courses || report?.course_breakdown || report?.report || []

  useEffect(() => {
    if (!courses.length) { setInsights([]); return }
    const result = []
    courses.forEach(c => {
      const pct = c.average_percentage ?? c.avg ?? 0
      if (pct < 50) result.push({ type: 'danger', text: `${c.code || c.course_code}: attendance at ${pct}% — at risk.` })
      else if (pct < 75) result.push({ type: 'warning', text: `${c.code || c.course_code}: attendance at ${pct}% — needs improvement.` })
      else if (pct >= 90) result.push({ type: 'success', text: `${c.code || c.course_code}: excellent attendance at ${pct}%!` })
    })
    const lateCount = summary.late_count ?? summary.late ?? 0
    if (lateCount > 3) result.push({ type: 'warning', text: `Frequent lateness (${lateCount} times). Try arriving earlier.` })
    setInsights(result)
  }, [courses])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {student.name || 'Student'}
          </h1>
          <p className="text-slate-500 text-sm">Your attendance overview and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">Student</Badge>
          {faceStatus ? (
            <Badge variant={faceStatus.registered || faceStatus.status === 'registered' ? 'success' : 'warning'}>
              {faceStatus.registered || faceStatus.status === 'registered' ? 'Face Registered' : 'Face Pending'}
            </Badge>
          ) : null}
          <Button variant="ghost" onClick={() => loadData(token)} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="h-28 animate-pulse bg-slate-100" />
            ))}
          </div>
          <Card className="h-48 animate-pulse bg-slate-100" />
          <Card className="h-32 animate-pulse bg-slate-100" />
        </div>
      ) : (
        <>
          {activeSessions.length > 0 && (
            <Card className="mb-6 border-l-4 border-l-emerald-500 bg-emerald-50/50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-emerald-800">
                    <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse mr-2" />
                    Active Sessions ({activeSessions.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => loadData(token)}>Refresh</Button>
                </div>
                <div className="space-y-2">
                  {activeSessions.map(s => {
                    const checkedIn = s.checked_in_count ?? 0
                    const capacity = s.seating_capacity
                    const isFull = capacity != null && checkedIn >= capacity
                    return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                      <div>
                        <span className="font-bold text-slate-800">{s.course_code || s.course?.code || '—'}</span>
                        <span className="text-sm text-slate-500 ml-2">{s.course_title || s.course?.title || ''}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {s.starts_at ? `Started ${new Date(s.starts_at).toLocaleTimeString()}` : ''}
                          {capacity != null ? ` • ${checkedIn}/${capacity} checked in` : ` • ${checkedIn} checked in`}
                          {isFull ? ' • FULL' : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => openCheckIn(s)}
                          className={`bg-emerald-600 hover:bg-emerald-700 ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isFull}
                        >{isFull ? 'Full' : 'Check In'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCheckOut(s)}>Check Out</Button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {monitoringSession ? (
            <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-blue-800">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500 animate-pulse mr-2" />
                      Monitoring Session
                    </h2>
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {monitoringSession.course_code || monitoringSession.course?.code || '—'} — {monitoringSession.course_title || monitoringSession.course?.title || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-700 font-mono">{monitorTimer || '—'}</div>
                    <div className="text-xs text-blue-500">remaining</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="success">Checked In ✓</Badge>
                  <Button size="sm" variant="ghost" onClick={() => { handleCheckOut(monitoringSession); setMonitoringSession(null) }}>Check Out</Button>
                </div>
              </div>
            </Card>
          ) : null}

          {insights.length > 0 ? (
            <Card className="mb-6 border-l-4 border-l-purple-400">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Insights</h2>
                <div className="space-y-2">
                  {insights.map((item, i) => (
                    <div key={i} className={`p-2.5 rounded-lg text-sm ${
                      item.type === 'danger' ? 'bg-red-50 text-red-700' :
                      item.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>{item.text}</div>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <StatCard
              label="Total Attendance"
              value={`${totalAttended}/${totalSessions}`}
              sub="sessions attended"
              color="#3b82f6"
            />
            <StatCard
              label="Average"
              value={`${avgPct}%`}
              sub="overall"
              color="#8b5cf6"
            />
            <StatCard
              label="Present"
              value={summary.present_count ?? summary.present ?? 0}
              sub="on time"
              color="#10b981"
            />
            <StatCard
              label="Late"
              value={summary.late_count ?? summary.late ?? 0}
              sub="arrivals"
              color="#f59e0b"
            />
            <StatCard
              label="Absent"
              value={summary.absent_count ?? summary.absent ?? 0}
              sub="missed"
              color="#ef4444"
            />
          </div>

          {courses.length > 0 ? (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Course Breakdown</h2>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Course Code</Th>
                    <Th>Title</Th>
                    <Th>Present</Th>
                    <Th>Late</Th>
                    <Th>Absent</Th>
                    <Th>Total Sessions</Th>
                    <Th>Average %</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {courses.map((course, i) => (
                    <Tr key={course.course_id || course.code || i}>
                      <Td className="font-mono text-sm font-medium">{course.code || course.course_code || '—'}</Td>
                      <Td className="text-sm">{course.title || course.course_name || '—'}</Td>
                      <Td className="text-sm text-green-600 font-medium">{course.present ?? course.present_count ?? 0}</Td>
                      <Td className="text-sm text-yellow-600 font-medium">{course.late ?? course.late_count ?? 0}</Td>
                      <Td className="text-sm text-red-600 font-medium">{course.absent ?? course.absent_count ?? 0}</Td>
                      <Td className="text-sm">{course.total_sessions ?? course.total ?? 0}</Td>
                      <Td className="text-sm font-medium">
                        {course.average_percentage != null ? `${course.average_percentage}%` : course.avg != null ? `${course.avg}%` : '—'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          ) : null}

          <div className="grid gap-6 mb-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
              {history.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {record.course?.code || record.course_code || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {record.checked_in_at ? new Date(record.checked_in_at).toLocaleString() : '—'}
                        </div>
                      </div>
                      <Badge
                        variant={
                          record.status === 'present' ? 'success' :
                          record.status === 'late' ? 'warning' :
                          record.status === 'absent' ? 'danger' : 'default'
                        }
                      >
                        {record.status || '—'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Timetable</h2>
              {timetable.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-sm">No timetable available.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {timetable.map((slot, i) => (
                    <div key={slot.id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {slot.course?.code || slot.course_code || slot.course || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {(slot.day != null ? slot.day : (slot.day_of_week != null ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day_of_week] || slot.day_of_week : '—'))} {slot.start_time || slot.time ? `at ${slot.start_time || slot.time}` : ''}
                        </div>
                      </div>
                      {slot.venue ? (
                        <span className="text-xs text-slate-500 font-mono">{slot.venue}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <Modal open={showCheckIn} onClose={() => { setShowCheckIn(false); stopCamera() }} title={checkInSession ? `Check In — ${checkInSession.course_code || checkInSession.course?.code || 'Session'}` : 'Check In'}>
        <div className="space-y-4">
          {checkInError ? <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{checkInError}</div> : null}
          {checkInSuccess ? <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">{checkInSuccess}</div> : null}

          {facePreview ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600">Face captured ✓</p>
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300">
                <img src={facePreview} alt="Captured face" className="w-full h-48 object-cover" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setFaceImage(null); setFacePreview(null); startCamera() }}>Retake</Button>
              </div>
            </div>
          ) : showCamera ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-blue-300 bg-black">
              <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setVideoReady(true)} className="w-full h-48 object-cover" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <button onClick={captureFrame} disabled={!videoReady}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50 shadow-lg"
                >{videoReady ? '📸 Capture' : 'Loading camera...'}</button>
                <button onClick={stopCamera}
                  className="px-4 py-2 rounded-lg text-sm bg-slate-800/60 text-white hover:bg-slate-800"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={startCamera}
              className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-8 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-base font-bold">Capture Face for Check-In</span>
              <span className="text-xs text-slate-400">Camera is required for biometric verification</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">📍 Location:</span>
            {location ? (
              <span className="text-emerald-600 font-medium">Acquired ✓</span>
            ) : locationError ? (
              <span className="text-amber-600 text-xs">{locationError}</span>
            ) : (
              <span className="text-slate-400">Acquiring...</span>
            )}
            {!location ? (
              <Button variant="ghost" size="sm" onClick={getLocation} className="text-xs">Retry</Button>
            ) : null}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCheckIn} disabled={checkInBusy || !faceImage} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {checkInBusy ? 'Checking in...' : '✅ Confirm Check-In'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowCheckIn(false); stopCamera() }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <canvas ref={canvasRef} className="hidden" />
    </Layout>
  )
}
