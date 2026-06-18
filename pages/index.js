import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getDashboardSummary, getWeeklyAttendanceStats, getUsers, getAdminSessions, getAdminCourses, downloadAllAttendanceCsv } from '../services/api'
import { useRouter } from 'next/router'
import { useAuth } from '../components/AuthContext'

function DonutChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let cumulative = 0
  const segments = data.map(d => {
    const start = (cumulative / total) * 360
    cumulative += d.value
    const end = (cumulative / total) * 360
    return { ...d, start, end }
  })
  const conic = segments.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-full shrink-0"
        style={{
          width: size, height: size,
          background: `conic-gradient(${conic})`,
          boxShadow: 'inset 0 0 0 12px white',
        }}
      />
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-surface-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBar({ data, color }) {
  if (!data || data.length === 0) return <p className="text-sm text-surface-400 py-12 text-center font-medium">No attendance data yet</p>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="text-[11px] font-bold text-surface-500">{d.value}</div>
          <div className="w-full rounded-lg transition-all duration-300 hover:opacity-80" style={{ height: `${(d.value / max) * 100}%`, background: `linear-gradient(180deg, ${color}, ${color}cc)`, minHeight: 4 }} title={d.label} />
          <div className="text-[9px] font-bold text-surface-400 truncate w-full text-center uppercase tracking-wider">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-extrabold text-surface-800">{value ?? '—'}</div>
          <div className="text-sm font-semibold text-surface-500 mt-0.5">{label}</div>
          {sub ? <div className="text-xs font-medium text-surface-400 mt-1">{sub}</div> : null}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
          <span>{icon}</span>
        </div>
      </div>
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

  const getToken = useCallback(() => window.localStorage.getItem('admin_token') || '', [])

  useEffect(() => {
    const t = getToken()
    if (t) loadData(t)
    else setLoading(false)
    async function loadData(t) {
      try {
        const [sumRes, weeklyRes, usersRes, sessRes, coursesRes] = await Promise.all([
          getDashboardSummary(t).catch(() => null),
          getWeeklyAttendanceStats(t).catch(() => null),
          getUsers(t, { per_page: 5 }).catch(() => null),
          getAdminSessions(t, { status: 'active' }).catch(() => null),
          getAdminCourses(t, { per_page: 5 }).catch(() => null),
        ])
        const s = sumRes?.data || sumRes || {}
        setSummary(s.totals || s)
        const w = weeklyRes?.data || weeklyRes || {}
        const rawSeries = w.series || w.weekly_data || []
        setWeekly(rawSeries.map(d => ({ value: d.total_attendance ?? d.value ?? 0, label: d.date || d.label || '' })))
        const uData = usersRes?.data?.data || usersRes?.data || []
        setRecentUsers(Array.isArray(uData) ? uData.slice(0, 5) : [])
        const sData = sessRes?.data?.data || sessRes?.data || []
        setActiveSessions(Array.isArray(sData) ? sData : [])
        const cData = coursesRes?.data?.data || coursesRes?.data || []
        setRecentCourses(Array.isArray(cData) ? cData.slice(0, 5) : [])
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
  }, [getToken])

  const donutData = [
    { label: 'Students', value: summary?.students ?? 0, color: '#6366f1' },
    { label: 'Lecturers', value: summary?.lecturers ?? 0, color: '#10b981' },
    { label: 'Courses', value: summary?.courses ?? 0, color: '#2f6df6' },
  ]

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Layout>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="card-base h-[120px]" />)}
          </div>
          <div className="card-base h-56" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-base h-72" />
            <div className="card-base h-72" />
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-800">{getGreeting()}, {user?.name || 'Admin'}</h1>
              <p className="text-surface-500 text-sm mt-1">Here's what's happening in your institution</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadAllAttendanceCsv(getToken()).catch(() => setError('Failed to export.'))} className="shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All Attendance
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Students" value={summary?.students ?? 0} sub="Enrolled" icon="🎓" color="#6366f1" />
            <StatCard label="Lecturers" value={summary?.lecturers ?? 0} sub="Active faculty" icon="👨‍🏫" color="#10b981" />
            <StatCard label="Courses" value={summary?.courses ?? 0} sub="Across all levels" icon="📚" color="#2f6df6" />
            <StatCard label="Sessions" value={summary?.sessions ?? activeSessions.length} sub={`${activeSessions.length} active now`} icon="📋" color="#f59e0b" />
          </div>

          {/* Charts */}
          <div className="grid gap-6 mb-6 grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-2 p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-surface-800">System Overview</h3>
                <p className="text-sm font-medium text-surface-400 mt-0.5">User distribution</p>
              </div>
              <DonutChart data={donutData} />
            </Card>

            <Card className="lg:col-span-3 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-surface-800">Weekly Attendance Trend</h3>
                  <p className="text-sm font-medium text-surface-400 mt-0.5">Attendance across the week</p>
                </div>
                {weekly.length > 0 && (
                  <Badge variant="info" className="text-xs">{weekly.reduce((a, b) => a + b.value, 0)} total</Badge>
                )}
              </div>
              <MiniBar data={weekly} color="#2f6df6" />
            </Card>
          </div>

          {/* Sessions & Users */}
          <div className="grid gap-6 mb-6 grid-cols-1 lg:grid-cols-2">
            {activeSessions.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-soft shadow-lg shadow-emerald-300" />
                      <div>
                        <h3 className="font-bold text-surface-800">Active Sessions Now</h3>
                        <p className="text-xs font-medium text-surface-500 mt-0.5">{activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} running</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/sessions?status=active')}>View All</Button>
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-72 overflow-auto">
                  {activeSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                        <div>
                          <div className="font-bold text-sm text-surface-800">{s.course?.code || 'Unknown'} <span className="text-surface-400 font-medium text-xs">#{s.id}</span></div>
                          <div className="text-xs font-medium text-surface-500">{s.course?.lecturer?.name || '—'} • {s.starts_at ? new Date(s.starts_at).toLocaleTimeString() : '—'}</div>
                        </div>
                      </div>
                      <Badge variant="success">{s.attendance_count ?? 0}/{s.expected_count ?? '?'}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {recentUsers.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-box w-10 h-10">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-surface-800">Recent Users</h3>
                        <p className="text-xs font-medium text-surface-500 mt-0.5">Latest registered users</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/users')}>Manage</Button>
                  </div>
                </div>
                <div className="p-4 space-y-1 max-h-72 overflow-auto">
                  {recentUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white ${u.role === 'lecturer' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-primary-500 to-secondary-500'}`}>
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-surface-800">{u.name}</div>
                          <div className="text-xs font-medium text-surface-400">{u.email}</div>
                        </div>
                      </div>
                      <Badge variant={u.role === 'lecturer' ? 'success' : 'info'}>{u.role}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Courses & Institution */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {recentCourses.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-surface-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-box w-10 h-10">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-surface-800">Recent Courses</h3>
                        <p className="text-xs font-medium text-surface-400 mt-0.5">Latest created courses</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/courses')}>All Courses</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <Thead><Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Students</Th></Tr></Thead>
                    <Tbody>
                      {recentCourses.map(c => (
                        <Tr key={c.id}>
                          <Td className="font-mono text-sm font-bold text-primary-600">{c.code}</Td>
                          <Td className="text-sm font-semibold text-surface-800">{c.title}</Td>
                          <Td className="text-sm font-medium text-surface-500">{c.lecturer?.name || <span className="text-surface-300">—</span>}</Td>
                          <Td><Badge variant="info">{c.roster_count || 0}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="icon-box w-10 h-10">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-surface-800">Institution Overview</h3>
                  <p className="text-xs font-medium text-surface-400 mt-0.5">Key metrics at a glance</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50">
                  <div className="text-2xl font-extrabold text-primary-600">{summary?.faculties ?? 0}</div>
                  <div className="text-sm font-bold text-primary-700 mt-1">Faculties</div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                  <div className="text-2xl font-extrabold text-emerald-600">{summary?.departments ?? 0}</div>
                  <div className="text-sm font-bold text-emerald-700 mt-1">Departments</div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                  <div className="text-2xl font-extrabold text-purple-600">{summary?.academic_levels ?? 0}</div>
                  <div className="text-sm font-bold text-purple-700 mt-1">Levels</div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                  <div className="text-2xl font-extrabold text-amber-600">{summary?.students ?? 0}</div>
                  <div className="text-sm font-bold text-amber-700 mt-1">Students</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  )
}
