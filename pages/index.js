import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getDashboardSummary, getWeeklyAttendanceStats, getUsers, getAdminSessions, getAdminCourses } from '../services/api'
import { useRouter } from 'next/router'
import { useAuth } from '../components/AuthContext'

function StatCard({ label, value, sub, icon, color, trend }) {
  return (
    <Card className="p-5 border-l-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
          <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          {sub ? <div className="text-xs text-slate-400 mt-1">{sub}</div> : null}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: color + '20' }}>
          <span>{icon}</span>
        </div>
      </div>
      {trend !== undefined ? (
        <div className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      ) : null}
    </Card>
  )
}

function MiniBar({ data, color }) {
  if (!data || data.length === 0) return <p className="text-sm text-slate-400 py-8 text-center">No attendance data yet</p>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[10px] text-slate-500 font-medium">{d.value}</div>
          <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80" style={{ height: `${(d.value / max) * 100}%`, background: color, minHeight: 4 }} title={d.label} />
          <div className="text-[9px] text-slate-400 truncate w-full text-center font-medium">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [recentCourses, setRecentCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  const getToken = useCallback(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    return t
  }, [])

  useEffect(() => {
    const t = getToken()
    if (t) loadData(t)
    else setLoading(false)
  }, [])

  const loadData = async (t) => {
    setLoading(true)
    setError('')
    try {
      const [s, w, u, sess, courses] = await Promise.all([
        getDashboardSummary(t).catch(() => null),
        getWeeklyAttendanceStats(t).catch(() => null),
        getUsers(t, { per_page: 6 }).catch(() => null),
        getAdminSessions(t, { status: 'active', per_page: 10 }).catch(() => null),
        getAdminCourses(t, { per_page: 5 }).catch(() => null),
      ])
      setSummary(s?.data || s || {})
      setWeekly(Array.isArray(w) ? w : w?.data || [])
      setRecentUsers(Array.isArray(u?.data) ? u.data : Array.isArray(u) ? u : [])
      setActiveSessions(Array.isArray(sess?.data) ? sess.data : Array.isArray(sess) ? sess : [])
      setRecentCourses(Array.isArray(courses?.data) ? courses.data : Array.isArray(courses) ? courses : [])
    } catch (err) {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Welcome to Scholars Nudge Admin</h1>
          <p className="text-slate-500 mb-6">Admin dashboard for overview of all students, lecturers, and courses.</p>
          <Button onClick={() => router.push('/login')}>Sign In as Admin</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">System-wide overview of students, lecturers, and academic activities</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info" className="text-xs">{summary?.active_sessions || activeSessions.length || 0} active sessions</Badge>
          <Button variant="ghost" onClick={() => loadData(token)} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Card key={i} className="h-28 animate-pulse bg-slate-100" />)}
          </div>
          <Card className="h-48 animate-pulse bg-slate-100" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Students" value={summary?.students_count ?? summary?.students ?? 0} sub="enrolled" icon="🎓" color="#3b82f6" />
            <StatCard label="Lecturers" value={summary?.lecturers_count ?? summary?.lecturers ?? 0} sub="active faculty" icon="👨‍🏫" color="#10b981" />
            <StatCard label="Courses" value={summary?.courses_count ?? summary?.courses ?? 0} sub="across all departments" icon="📚" color="#8b5cf6" />
            <StatCard label="Attendance Sessions" value={summary?.sessions_count ?? summary?.total_sessions ?? 0} sub={`${summary?.active_sessions ?? 0} active now`} icon="📋" color="#f59e0b" />
          </div>

          <div className="grid gap-6 mb-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Weekly Attendance Trend</h3>
                <span className="text-xs text-slate-400">This week</span>
              </div>
              <MiniBar data={weekly} color="#3b82f6" />
            </Card>

            <Card className="p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Institution Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'Faculties', value: summary?.faculties_count ?? summary?.faculties ?? 0, color: 'bg-blue-500' },
                  { label: 'Departments', value: summary?.departments_count ?? 0, color: 'bg-emerald-500' },
                  { label: 'Academic Levels', value: summary?.levels_count ?? 0, color: 'bg-purple-500' },
                  { label: 'Total Enrollments', value: summary?.enrollments_count ?? summary?.total_enrollments ?? 0, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-lg font-bold text-slate-800">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 mb-6 lg:grid-cols-2">
            {activeSessions.length > 0 && (
              <Card className="p-6 shadow-sm border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">🟢 Active Sessions Now</h3>
                  <Button variant="ghost" onClick={() => router.push('/sessions?status=active')}>View All</Button>
                </div>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {activeSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">{s.course?.code || 'Unknown'} <span className="text-slate-400 text-xs">#{s.id}</span></div>
                        <div className="text-xs text-slate-500">{s.course?.lecturer?.name || '—'} • {s.starts_at ? new Date(s.starts_at).toLocaleTimeString() : '—'}</div>
                      </div>
                      <Badge variant="success">{s.attendance_count ?? 0}/{s.expected_count ?? '?'}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {recentUsers.length > 0 && (
              <Card className="p-6 shadow-sm border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Recent Users</h3>
                  <Button variant="ghost" onClick={() => router.push('/users')}>Manage</Button>
                </div>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {recentUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${u.role === 'lecturer' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                      <Badge variant={u.role === 'lecturer' ? 'info' : 'default'}>{u.role}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {recentCourses.length > 0 && (
              <Card className="p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">📚 Recent Courses</h3>
                  <Button variant="ghost" onClick={() => router.push('/courses')}>All Courses</Button>
                </div>
                <Table>
                  <Thead><Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Students</Th></Tr></Thead>
                  <Tbody>
                    {recentCourses.map(c => (
                      <Tr key={c.id}>
                        <Td className="font-mono text-sm font-medium">{c.code}</Td>
                        <Td className="text-sm">{c.title}</Td>
                        <Td className="text-sm">{c.lecturer?.name || '—'}</Td>
                        <Td className="text-sm">{c.roster_count || 0}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Card>
            )}

            <Card className="p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">🏛️ Academic Structure</h3>
              <div className="space-y-3">
                {summary?.faculties_count > 0 && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Faculties</span>
                    <span className="font-bold text-lg">{summary.faculties_count}</span>
                  </div>
                )}
                {summary?.departments_count > 0 && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Departments</span>
                    <span className="font-bold text-lg">{summary.departments_count}</span>
                  </div>
                )}
                {summary?.levels_count > 0 && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Academic Levels</span>
                    <span className="font-bold text-lg">{summary.levels_count}</span>
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
