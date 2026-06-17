import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getCourseAttendance, getCourseAnalytics, updateAttendanceStatus, deleteAttendance } from '../../services/api'

function AnalyticsCard({ label, value, sub, color, icon, trend }) {
  return (
    <Card className="relative overflow-hidden p-5 border-l-4 transition-all duration-300 hover:shadow-md group" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value ?? '—'}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
          {sub ? <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{sub}</div> : null}
        </div>
        <div className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>
      </div>
      {trend ? (
        <div className={`mt-3 text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-slate-400'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs last week
        </div>
      ) : null}
    </Card>
  )
}

function BulkActionBar({ selectedCount, onMarkPresent, onMarkInvalid, onClear }) {
  if (selectedCount === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl border border-slate-200 px-5 py-3.5 backdrop-blur-xl bg-white/95">
        <span className="text-sm font-bold text-slate-700 min-w-[100px]">
          {selectedCount} selected
        </span>
        <div className="w-px h-6 bg-slate-200" />
        <button
          onClick={onMarkPresent}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-200"
        >
          <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Mark Present
        </button>
        <button
          onClick={onMarkInvalid}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200"
        >
          <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          Mark Invalid
        </button>
        <div className="w-px h-6 bg-slate-200" />
        <button
          onClick={onClear}
          className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
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
  const [busyId, setBusyId] = useState(null)
  const [bulkIds, setBulkIds] = useState([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

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
    setBulkIds([])
    try {
      const [a, an] = await Promise.all([
        getCourseAttendance(courseId, tk).catch(() => null),
        getCourseAnalytics(courseId, tk).catch(() => null),
      ])
      setAttendance(Array.isArray(a?.records) ? a.records : Array.isArray(a?.data) ? a.data : Array.isArray(a) ? a : [])
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

  const handleStatusChange = async (attendanceId, newStatus) => {
    setBusyId(attendanceId)
    try {
      await updateAttendanceStatus(attendanceId, newStatus, token)
      if (selectedCourse) loadAttendance(selectedCourse)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status.')
    } finally { setBusyId(null) }
  }

  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm('Delete this attendance record?')) return
    setBusyId(attendanceId)
    try {
      await deleteAttendance(attendanceId, token)
      if (selectedCourse) loadAttendance(selectedCourse)
    } catch (_) {
      setError('Failed to delete record.')
    } finally { setBusyId(null) }
  }

  const handleBulkAction = async (newStatus) => {
    if (bulkIds.length === 0) return
    setBusyId('bulk')
    try {
      await Promise.all(bulkIds.map(id => updateAttendanceStatus(id, newStatus, token).catch(() => {})))
      setBulkIds([])
      if (selectedCourse) loadAttendance(selectedCourse)
    } catch (_) {
      setError('Bulk action failed.')
    } finally { setBusyId(null) }
  }

  const toggleBulk = (id) => {
    setBulkIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (bulkIds.length === filtered.length) {
      setBulkIds([])
    } else {
      setBulkIds(filtered.map(a => a.id))
    }
  }

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
        <p className="text-slate-500 text-sm">View attendance records, bulk override, and analytics by course</p>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => loadAttendance(c.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${selectedCourse === c.id ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm'}`}
          >{c.code}</button>
        ))}
      </div>

      {!selectedCourse ? (
        <Card className="p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-400 font-medium">Select a course to view attendance records.</p>
        </Card>
      ) : (
        <>
          {analytics && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <AnalyticsCard label="Total Sessions" value={analytics.total_sessions ?? analytics.weekly_summary?.length ?? 0} color="#3b82f6" icon="📊" />
              <AnalyticsCard label="Late Arrivals" value={analytics.late_count || 0} color="#f59e0b" icon="⏰" />
              <AnalyticsCard label="At Risk Students" value={analytics.risk_count || 0} color="#ef4444" icon="⚠️" />
              <AnalyticsCard label="Attendance Records" value={attendance.length || 0} color="#10b981" icon="✅" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name or status..." className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {[{key:'',label:'All'},{key:'present',label:'Present'},{key:'absent',label:'Absent'},{key:'late',label:'Late'},{key:'invalid',label:'Invalid'}].map(s => (
                <button key={s.key} onClick={() => setFilter(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === s.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >{s.label}</button>
              ))}
            </div>
            <span className="text-xs font-medium text-slate-400 min-w-[80px] text-right">{filtered.length} records</span>
            <Button variant="outline" onClick={downloadCSV} className="text-xs h-9 px-3 rounded-xl" disabled={!filtered.length}>
              <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </Button>
          </div>

          {error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-14 animate-pulse bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl mb-3">{attendance.length === 0 ? '📭' : '🔍'}</div>
              <p className="text-slate-400 font-medium">
                {attendance.length === 0 ? 'No attendance records for this course yet.' : 'No records match your filter.'}
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-0 overflow-hidden border border-slate-200 rounded-2xl">
                <div className="overflow-x-auto">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th className="w-10">
                          <input type="checkbox" checked={bulkIds.length === filtered.length && filtered.length > 0} onChange={toggleAll}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </Th>
                        <Th>Student</Th>
                        <Th>Matric</Th>
                        <Th>Session</Th>
                        <Th>Status</Th>
                        <Th>Date</Th>
                        <Th>Time</Th>
                        <Th>Distance</Th>
                        <Th>Device</Th>
                        <Th>Late</Th>
                        <Th className="w-28">Quick Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filtered.slice(0, 200).map(a => (
                        <Tr key={a.id} className={`${bulkIds.includes(a.id) ? 'bg-blue-50/50' : ''} transition-colors duration-150`}>
                          <Td>
                            <input type="checkbox" checked={bulkIds.includes(a.id)} onChange={() => toggleBulk(a.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                          </Td>
                          <Td className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {(a.student?.name || a.student_name || '?').charAt(0)}
                              </div>
                              <span>{a.student?.name || a.student_name || `#${a.student_id}`}</span>
                            </div>
                          </Td>
                          <Td className="font-mono text-sm text-slate-500">{a.student?.matric_number || '—'}</Td>
                          <Td className="text-sm text-slate-500 font-mono">#{a.attendance_session_id}</Td>
                          <Td>
                            <Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}
                              className="capitalize">
                              {a.status}
                            </Badge>
                          </Td>
                          <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleDateString() : '—'}</Td>
                          <Td className="text-sm text-slate-500">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                          <Td className="text-sm text-slate-500">{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                          <Td className="text-xs font-mono max-w-[80px] truncate text-slate-400" title={a.device_id || ''}>{a.device_id ? a.device_id.slice(0, 16)+'…' : '—'}</Td>
                          <Td>{a.is_late ? <Badge variant="warning">Late</Badge> : <span className="text-slate-300">—</span>}</Td>
                          <Td>
                            <div className="flex gap-1">
                              {a.status !== 'present' && a.status !== 'verified' ? (
                                <button onClick={() => handleStatusChange(a.id, 'present')} disabled={busyId === a.id}
                                  className="p-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90 disabled:opacity-40"
                                title="Mark Present">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </button>
                              ) : (
                                <button onClick={() => handleStatusChange(a.id, 'verified')} disabled={busyId === a.id}
                                  className="p-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90 disabled:opacity-40"
                                title="Verify">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </button>
                              )}
                              {a.status !== 'invalid' ? (
                                <button onClick={() => handleStatusChange(a.id, 'invalid')} disabled={busyId === a.id}
                                  className="p-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90 disabled:opacity-40"
                                title="Mark Invalid">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              ) : null}
                              <button onClick={() => handleDeleteAttendance(a.id)} disabled={busyId === a.id}
                                className="p-2 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg transition-all active:scale-90 disabled:opacity-40"
                              title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
                {filtered.length > 200 ? <div className="p-4 text-center text-xs font-medium text-slate-400 border-t border-slate-100">Showing first 200 of {filtered.length} records</div> : null}
              </Card>

              <BulkActionBar
                selectedCount={bulkIds.length}
                onMarkPresent={() => handleBulkAction('present')}
                onMarkInvalid={() => handleBulkAction('invalid')}
                onClear={() => setBulkIds([])}
              />
            </>
          )}
        </>
      )}
    </Layout>
  )
}
