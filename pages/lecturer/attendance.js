import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getCourseAttendance, getCourseAnalytics } from '../../services/api'

function AnalyticsCard({ label, value, sub, color, icon }) {
  return (
    <Card className="p-4 border-l-4 text-center" style={{ borderLeftColor: color }}>
      <div className="text-xl font-bold" style={{ color }}>{value ?? '—'}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub ? <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div> : null}
    </Card>
  )
}

export default function LecturerAttendance() {
  const router = useRouter()
  const { course_id } = router.query
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    getLecturerCourses(t).then(d => {
      const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
      setCourses(list)
      if (course_id) {
        setSelectedCourse(Number(course_id))
        loadAttendance(Number(course_id), t)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [course_id])

  const loadAttendance = async (courseId, t) => {
    const tk = t || token
    if (!courseId || !tk) return
    setSelectedCourse(courseId)
    setLoading(true)
    try {
      const [a, an] = await Promise.all([
        getCourseAttendance(courseId, tk).catch(() => null),
        getCourseAnalytics(courseId, tk).catch(() => null),
      ])
      setAttendance(Array.isArray(a?.data) ? a.data : Array.isArray(a) ? a : [])
      setAnalytics(an?.data || an || null)
    } catch (_) { setAttendance([]) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    if (!filter) return attendance
    return attendance.filter(a =>
      a.status === filter ||
      a.student?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      a.student_name?.toLowerCase().includes(filter.toLowerCase())
    )
  }, [attendance, filter])

  const downloadCSV = useCallback(() => {
    if (!filtered.length) return
    const headers = ['Student', 'Matric', 'Session', 'Status', 'Date', 'Time', 'Distance', 'Late']
    const rows = filtered.map(a => [
      a.student?.name || a.student_name || '',
      a.student?.matric_number || '',
      `#${a.attendance_session_id}`,
      a.status || '',
      a.checked_in_at ? new Date(a.checked_in_at).toLocaleDateString() : '',
      a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString() : '',
      a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '',
      a.is_late ? 'Yes' : 'No',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `attendance-${selectedCourse}.csv`
    a.click(); URL.revokeObjectURL(url)
  }, [filtered, selectedCourse])

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500 text-sm">View attendance records and analytics by course</p>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => loadAttendance(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCourse === c.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
          >{c.code}</button>
        ))}
      </div>

      {!selectedCourse ? (
        <Card className="p-12 text-center text-slate-400">Select a course to view attendance.</Card>
      ) : (
        <>
          {analytics && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <AnalyticsCard label="Total Sessions" value={analytics.total_sessions || 0} color="#3b82f6" icon="📊" />
              <AnalyticsCard label="Average Attendance" value={analytics.average_attendance != null ? `${analytics.average_attendance}%` : '—'} sub={analytics.total_attendance ? `${analytics.total_attendance} total check-ins` : ''} color="#10b981" icon="✅" />
              <AnalyticsCard label="Late Arrivals" value={analytics.late_count || 0} sub={`${analytics.late_percentage || 0}% of attendance`} color="#f59e0b" icon="⏰" />
              <AnalyticsCard label="At Risk Students" value={analytics.risk_count || 0} sub={analytics.risk_percentage ? `${analytics.risk_percentage}% of roster` : ''} color="#ef4444" icon="⚠️" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name or status..." className="px-3 py-2 border rounded-lg text-sm flex-1 max-w-xs" />
            <div className="flex gap-1">
              {['', 'present', 'absent', 'late', 'invalid'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${filter === s ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >{s || 'All'}</button>
              ))}
            </div>
            <span className="text-xs text-slate-400">{filtered.length} records</span>
            {filtered.length ? <Button variant="outline" onClick={downloadCSV} className="text-xs h-8 px-3">Export CSV</Button> : null}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              {attendance.length === 0 ? 'No attendance records for this course.' : 'No records match your filter.'}
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Matric</Th>
                    <Th>Session</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Distance</Th>
                    <Th>Late</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.slice(0, 200).map(a => (
                    <Tr key={a.id}>
                      <Td className="font-medium">{a.student?.name || a.student_name || `#${a.student_id}`}</Td>
                      <Td className="font-mono text-sm text-slate-500">{a.student?.matric_number || '—'}</Td>
                      <Td className="text-sm text-slate-500">#{a.attendance_session_id}</Td>
                      <Td>
                        <Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}>
                          {a.status}
                        </Badge>
                      </Td>
                      <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleDateString() : '—'}</Td>
                      <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                      <Td className="text-sm text-slate-500">{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                      <Td>{a.is_late ? <Badge variant="warning">Late</Badge> : '—'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {filtered.length > 200 ? <div className="p-3 text-center text-xs text-slate-400">Showing first 200 of {filtered.length} records</div> : null}
            </Card>
          )}
        </>
      )}
    </Layout>
  )
}
