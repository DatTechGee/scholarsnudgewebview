import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import { getLecturerCourses, getCourseAttendance, getCourseAnalytics, downloadCourseAttendanceCsv, downloadAllAttendanceCsv, downloadCourseRosterCsv } from '../../services/api'

function genCsv(rows, headers, filename) {
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click(); URL.revokeObjectURL(url)
}

function ExportCard({ icon, title, description, busy, onExport, badge }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-lg">{icon}</div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        {badge && <Badge variant="info" className="text-[10px]">{badge}</Badge>}
      </div>
      <button onClick={onExport} disabled={busy}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
      ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> {busy ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  )
}

export default function LecturerExports() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [courseData, setCourseData] = useState(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    getLecturerCourses(t).then(d => {
      const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
      setCourses(list)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadCourseData = async (courseId) => {
    if (!courseId || !token) return
    setCourseData(null)
    try {
      const [att, an] = await Promise.all([
        getCourseAttendance(courseId, token).catch(() => null),
        getCourseAnalytics(courseId, token).catch(() => null),
      ])
      setCourseData({ attendance: Array.isArray(att?.data) ? att.data : Array.isArray(att) ? att : [], analytics: an?.data || an || null })
    } catch (_) {}
  }

  useEffect(() => { if (selectedCourse) loadCourseData(selectedCourse) }, [selectedCourse])

  const handleExportCourseAsCsv = async () => {
    if (!selectedCourse) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const data = courseData?.attendance || []
      if (data.length === 0) { setError('No attendance data to export.'); setBusy(false); return }
      const headers = ['Student Name', 'Matric Number', 'Email', 'Status', 'Checked In At', 'Distance', 'Device ID', 'Is Late', 'Session ID']
      const rows = data.map(a => [
        `"${a.student?.name || a.student_name || ''}"`, a.student?.matric_number || '', a.student?.email || '',
        a.status || '', a.checked_in_at || '', a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '',
        a.device_id || '', a.is_late ? 'Yes' : 'No', a.attendance_session_id || '',
      ])
      genCsv(rows, headers, `attendance-${selectedCourse}-${new Date().toISOString().slice(0,10)}.csv`)
      setSuccess('CSV exported successfully!')
    } catch (_) { setError('Export failed.') }
    finally { setBusy(false) }
  }

  const handleExportSessionReport = async () => {
    if (!selectedCourse) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const data = courseData?.attendance || []
      if (data.length === 0) { setError('No data to export.'); setBusy(false); return }
      const sessionIds = [...new Set(data.map(a => a.attendance_session_id))]
      const headers = ['Session ID', 'Session Date', 'Student Name', 'Matric', 'Status', 'Time']
      const rows = []
      for (const sid of sessionIds) {
        const sessionData = data.filter(a => a.attendance_session_id === sid)
        sessionData.forEach(a => {
          rows.push([sid, a.checked_in_at ? new Date(a.checked_in_at).toLocaleDateString() : '', `"${a.student?.name || ''}"`, a.student?.matric_number || '', a.status || '', a.checked_in_at || ''])
        })
      }
      genCsv(rows, headers, `session-report-${selectedCourse}-${new Date().toISOString().slice(0,10)}.csv`)
      setSuccess('Session report exported!')
    } catch (_) { setError('Export failed.') }
    finally { setBusy(false) }
  }

  const handleExportAll = async () => {
    setBusy(true); setError(''); setSuccess('')
    try {
      await downloadAllAttendanceCsv(token)
      setSuccess('All attendance exported!')
    } catch (_) {
      // Fallback: export course by course
      let allRows = []
      for (const c of courses) {
        try {
          const data = await getCourseAttendance(c.id, token)
          const att = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
          att.forEach(a => allRows.push([c.code || c.id, a.student?.name || '', a.status || '', a.checked_in_at || '']))
        } catch (_) {}
      }
      if (allRows.length > 0) {
        genCsv(allRows, ['Course', 'Student', 'Status', 'Time'], `all-attendance-${new Date().toISOString().slice(0,10)}.csv`)
        setSuccess('All attendance exported!')
      } else { setError('No data available.') }
    }
    finally { setBusy(false) }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><button onClick={() => router.push('/login')} className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white">Sign In</button></Card></Layout>
  }

  const code = courses.find(c => c.id === selectedCourse)?.code || 'Course'
  const attCount = courseData?.attendance?.length || 0

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Attendance Exports</h1>
        <p className="text-slate-500 text-sm">Download attendance data as CSV reports for your courses</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-red-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600 font-bold">&times;</button>
        </div>
      )}

      {/* Gradient course selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {courses.map((c, i) => {
          const grads = ['from-blue-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-amber-500 to-orange-600']
          return (
            <button key={c.id} onClick={() => setSelectedCourse(c.id)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${selectedCourse === c.id ? `bg-gradient-to-r ${grads[i % grads.length]} text-white shadow-lg scale-105` : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >{c.code}</button>
          )
        })}
      </div>

      {/* Quick exports */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <ExportCard icon="📊" title="Course Attendance" description={`Full attendance for ${selectedCourse ? code : 'selected course'}`} busy={busy} onExport={handleExportCourseAsCsv} badge={selectedCourse && attCount > 0 ? `${attCount} records` : null} />
        <ExportCard icon="📋" title="Session Report" description="Per-session attendance breakdown" busy={busy} onExport={handleExportSessionReport} badge={selectedCourse ? 'Per session' : null} />
        <ExportCard icon="📚" title="All Courses" description="Export attendance across all courses" busy={busy} onExport={handleExportAll} badge={courses.length > 0 ? `${courses.length} courses` : null} />
        <ExportCard icon="👥" title="Course Roster" description={`Download roster for ${selectedCourse ? code : 'selected course'}`} busy={busy} onExport={async () => { if (!selectedCourse) { setError('Select a course first.'); return }; setBusy(true); try { await downloadCourseRosterCsv(selectedCourse, token); setSuccess('Roster exported!') } catch (_) { setError('Export failed.') } finally { setBusy(false) } }} badge={selectedCourse ? 'CSV' : null} />
      </div>

      {/* Per-week report */}
      {selectedCourse && courseData?.attendance?.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">📅</span>
            Weekly Attendance Summary — {code}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Week</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Total</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Present</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Late</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Absent</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Rate</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const data = courseData.attendance
                  const weekMap = {}
                  data.forEach(a => {
                    const d = a.checked_in_at ? new Date(a.checked_in_at) : new Date()
                    const weekStart = new Date(d)
                    weekStart.setDate(d.getDate() - d.getDay())
                    const key = weekStart.toISOString().slice(0, 10)
                    if (!weekMap[key]) weekMap[key] = { total: 0, present: 0, late: 0, absent: 0 }
                    weekMap[key].total++
                    if (a.status === 'present' || a.status === 'verified') weekMap[key].present++
                    if (a.is_late || a.status === 'late') weekMap[key].late++
                    if (a.status === 'absent') weekMap[key].absent++
                  })
                  return Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).map(([week, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
                    return (
                      <tr key={week} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-700">{week}</td>
                        <td className="py-2.5 px-3 text-slate-600">{stats.total}</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-medium">{stats.present}</td>
                        <td className="py-2.5 px-3 text-amber-600 font-medium">{stats.late}</td>
                        <td className="py-2.5 px-3 text-red-600 font-medium">{stats.absent}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${rate >= 75 ? 'bg-emerald-400' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-10 text-right">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCourse && courseData?.attendance?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-400 font-medium">No attendance data for this course yet.</p>
          <p className="text-xs text-slate-400 mt-2">Start a session and check-ins will appear here.</p>
        </Card>
      )}

      {!selectedCourse && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">👆</div>
          <p className="text-slate-400 font-medium">Select a course to view and export attendance data.</p>
        </Card>
      )}
    </Layout>
  )
}
