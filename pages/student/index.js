import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import {
  getStudentAttendanceReport,
  getStudentAttendanceHistory,
  getStudentTimetable,
  getStudentFaceStatus,
  getStudentActiveSessions,
} from '../../services/api'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-surface-800">{value ?? '—'}</div>
          <div className="text-xs text-surface-500 font-medium">{label}</div>
          {sub && <div className="text-[11px] text-surface-400 mt-0.5">{sub}</div>}
        </div>
      </div>
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
  const [insights, setInsights] = useState([])

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
    const t = getToken()
    if (t) loadData(t)
    else setLoading(false)
  }, [])

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
      if (pct < 50) result.push({ type: 'danger', text: `${c.code || c.course_code}: attendance at ${pct}% — at risk.`, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
      else if (pct < 75) result.push({ type: 'warning', text: `${c.code || c.course_code}: attendance at ${pct}% — needs improvement.`, icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
      else if (pct >= 90) result.push({ type: 'success', text: `${c.code || c.course_code}: excellent attendance at ${pct}%!`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
    })
    const lateCount = summary.late_count ?? summary.late ?? 0
    if (lateCount > 3) result.push({ type: 'warning', text: `Frequent lateness (${lateCount} times). Try arriving earlier.`, icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    setInsights(result)
  }, [courses])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Layout>
      {/* Hero Welcome */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-surface-800">
              {getGreeting()}, {student.name || 'Student'}
            </h1>
            <p className="text-surface-500 text-sm mt-1">Here's your attendance overview for this semester</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {faceStatus && (
              <Badge variant={faceStatus.registered || faceStatus.status === 'registered' ? 'success' : 'warning'}>
                {faceStatus.registered || faceStatus.status === 'registered' ? 'Face Registered' : 'Face Pending'}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => loadData(token)} disabled={loading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-24 animate-pulse bg-surface-100" />
            ))}
          </div>
          <Card className="h-48 animate-pulse bg-surface-100" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-64 animate-pulse bg-surface-100" />
            <Card className="h-64 animate-pulse bg-surface-100" />
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-8">
            <Link href="/student/certificate">
              <Card className="p-4 cursor-pointer group hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 border-l-4 border-l-primary-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-800">Certificate</div>
                    <div className="text-[11px] text-surface-400">View & download</div>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/student/attendance">
              <Card className="p-4 cursor-pointer group hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-800">Attendance</div>
                    <div className="text-[11px] text-surface-400">Full history</div>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/student/courses">
              <Card className="p-4 cursor-pointer group hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 border-l-4 border-l-secondary-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center group-hover:bg-secondary-100 transition-colors">
                    <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-800">Courses</div>
                    <div className="text-[11px] text-surface-400">My courses</div>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/student/timetable">
              <Card className="p-4 cursor-pointer group hover:-translate-y-0.5 hover:shadow-card transition-all duration-200 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-800">Timetable</div>
                    <div className="text-[11px] text-surface-400">Weekly schedule</div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <Card className="mb-6 border-l-4 border-l-emerald-500">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="section-header mb-0">
                    <div className="section-header-icon bg-emerald-500/10">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-surface-800">Active Sessions</h2>
                      <p className="text-xs text-surface-400">{activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} in progress</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => loadData(token)}>Refresh</Button>
                </div>
                <div className="space-y-2">
                  {activeSessions.map(s => {
                    const checkedIn = s.checked_in_count ?? 0
                    const capacity = s.seating_capacity
                    const isFull = capacity != null && checkedIn >= capacity
                    return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-surface-200/60 shadow-soft">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                        <div>
                          <span className="font-bold text-surface-800">{s.course_code || s.course?.code || '—'}</span>
                          <span className="text-sm text-surface-500 ml-2">{s.course_title || s.course?.title || ''}</span>
                          <div className="text-xs text-surface-400 mt-0.5">
                            {s.starts_at ? `Started ${new Date(s.starts_at).toLocaleTimeString()}` : ''}
                            {capacity != null ? ` • ${checkedIn}/${capacity} checked in` : ` • ${checkedIn} checked in`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isFull ? 'danger' : 'success'}>
                        {isFull ? 'Full' : 'In Progress'}
                      </Badge>
                    </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            <StatCard
              label="Attendance Rate"
              value={`${avgPct}%`}
              color="#2f6df6"
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
            <StatCard
              label="Sessions Attended"
              value={`${totalAttended}/${totalSessions}`}
              sub="of total sessions"
              color="#10b981"
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <StatCard
              label="Present"
              value={summary.present_count ?? summary.present ?? 0}
              sub="on time arrivals"
              color="#06b6d4"
              icon="M5 13l4 4L19 7"
            />
            <StatCard
              label="Late Arrivals"
              value={summary.late_count ?? summary.late ?? 0}
              sub="tardy sessions"
              color="#f59e0b"
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <Card className="mb-6">
              <div className="p-5">
                <div className="section-header">
                  <div className="section-header-icon">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-surface-800">Insights</h2>
                </div>
                <div className="mt-3 space-y-2">
                  {insights.map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      item.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-100' :
                      item.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Course Breakdown */}
          {courses.length > 0 ? (
            <Card className="mb-6">
              <div className="p-5">
                <div className="section-header">
                  <div className="section-header-icon">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-surface-800">Course Breakdown</h2>
                </div>
                <div className="mt-4 table-row-hover">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Course</Th>
                        <Th>Title</Th>
                        <Th className="text-center">Present</Th>
                        <Th className="text-center">Late</Th>
                        <Th className="text-center">Absent</Th>
                        <Th className="text-center">Sessions</Th>
                        <Th className="text-center">Rate</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courses.map((course, i) => {
                        const pct = course.average_percentage ?? course.avg ?? 0
                        return (
                        <Tr key={course.course_id || course.code || i}>
                          <Td className="font-mono text-sm font-bold text-primary-600">{course.code || course.course_code || '—'}</Td>
                          <Td className="text-sm font-medium">{course.title || course.course_name || '—'}</Td>
                          <Td className="text-center">
                            <span className="text-sm font-semibold text-emerald-600">{course.present ?? course.present_count ?? 0}</span>
                          </Td>
                          <Td className="text-center">
                            <span className="text-sm font-semibold text-amber-600">{course.late ?? course.late_count ?? 0}</span>
                          </Td>
                          <Td className="text-center">
                            <span className="text-sm font-semibold text-red-600">{course.absent ?? course.absent_count ?? 0}</span>
                          </Td>
                          <Td className="text-center text-sm">{course.total_sessions ?? course.total ?? 0}</Td>
                          <Td className="text-center">
                            <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
                              {pct}%
                            </Badge>
                          </Td>
                        </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Recent Activity & Timetable */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <div className="p-5">
                <div className="section-header">
                  <div className="section-header-icon">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-surface-800">Recent Activity</h2>
                </div>
                {history.length === 0 ? (
                  <div className="empty-state py-8">
                    <svg className="w-12 h-12 text-surface-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-surface-400 text-sm">No recent activity.</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {history.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.status === 'present' ? 'P' : record.status === 'late' ? 'L' : 'A'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-surface-800">
                              {record.course?.code || record.course_code || 'Unknown'}
                            </div>
                            <div className="text-xs text-surface-400">
                              {record.checked_in_at ? new Date(record.checked_in_at).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          record.status === 'present' ? 'success' :
                          record.status === 'late' ? 'warning' : 'danger'
                        }>
                          {record.status || '—'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-5">
                <div className="section-header">
                  <div className="section-header-icon bg-secondary-500/10">
                    <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-surface-800">Timetable</h2>
                </div>
                {timetable.length === 0 ? (
                  <div className="empty-state py-8">
                    <svg className="w-12 h-12 text-surface-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-surface-400 text-sm">No timetable available.</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 max-h-72 overflow-auto">
                    {timetable.map((slot, i) => (
                      <div key={slot.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center text-xs font-bold text-secondary-700">
                            {(slot.day || '').charAt(0) || (slot.day_of_week != null ? ['S','M','T','W','T','F','S'][slot.day_of_week] : '—')}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-surface-800">
                              {slot.course?.code || slot.course_code || slot.course || 'Unknown'}
                            </div>
                            <div className="text-xs text-surface-400">
                              {(slot.day != null ? slot.day : (slot.day_of_week != null ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day_of_week] || slot.day_of_week : '—'))} {slot.start_time || slot.time ? `at ${slot.start_time || slot.time}` : ''}
                            </div>
                          </div>
                        </div>
                        {slot.venue ? (
                          <span className="text-xs text-surface-500 font-mono bg-surface-100 px-2 py-1 rounded-lg">{slot.venue}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  )
}
