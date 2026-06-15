import { useEffect, useState, useCallback } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? (window.localStorage.getItem('student_token') || window.localStorage.getItem('admin_token') || '') : ''
    setToken(t)
    return t
  }, [])

  const loadData = useCallback(async (t) => {
    if (!t) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [reportData, historyData, timetableData, faceData] = await Promise.all([
        getStudentAttendanceReport(t).catch(() => null),
        getStudentAttendanceHistory(t, { per_page: 5 }).catch(() => null),
        getStudentTimetable(t).catch(() => null),
        getStudentFaceStatus(t).catch(() => null),
      ])
      setReport(reportData?.data || reportData || null)
      const rows = Array.isArray(historyData?.data) ? historyData.data : Array.isArray(historyData) ? historyData : []
      setHistory(rows)
      setTimetable(Array.isArray(timetableData?.data) ? timetableData.data : Array.isArray(timetableData) ? timetableData : [])
      setFaceStatus(faceData?.data || faceData || null)
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
  const courses = report?.courses || report?.course_breakdown || []

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
                          {slot.day || slot.day_of_week || '—'} {slot.start_time || slot.time ? `at ${slot.start_time || slot.time}` : ''}
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
    </Layout>
  )
}
