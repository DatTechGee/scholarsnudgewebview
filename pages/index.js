import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getDashboardSummary, getWeeklyAttendanceStats, getUsers, getAdminSessions, getAdminCourses } from '../services/api'
import { useRouter } from 'next/router'
import { useAuth } from '../components/AuthContext'

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-surface-800">{value ?? '—'}</div>
          <div className="text-sm text-surface-500 mt-0.5">{label}</div>
          {sub ? <div className="text-xs text-surface-400 mt-1">{sub}</div> : null}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: color + '18' }}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function MiniBar({ data, color }) {
  if (!data || data.length === 0) return <p className="text-sm text-surface-400 py-10 text-center">No attendance data yet</p>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-36">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="text-[10px] text-surface-500 font-semibold">{d.value}</div>
          <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80" style={{ height: `${(d.value / max) * 100}%`, background: color, minHeight: 4 }} title={d.label} />
          <div className="text-[9px] text-surface-400 truncate w-full text-center font-medium">{d.label}</div>
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

  return (
    <Layout>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="card-base h-28" />)}
          </div>
          <div className="card-base h-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-base h-64" />
            <div className="card-base h-64" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Students" value={summary?.students ?? 0} sub="enrolled" icon="🎓" color="#6366f1" />
            <StatCard label="Lecturers" value={summary?.lecturers ?? 0} sub="active faculty" icon="👨‍🏫" color="#10b981" />
            <StatCard label="Courses" value={summary?.courses ?? 0} sub="across all departments" icon="📚" color="#8b5cf6" />
            <StatCard label="Faculties" value={summary?.faculties ?? 0} sub={`${summary?.departments ?? 0} departments`} icon="🏛️" color="#f59e0b" />
          </div>

          <div className="grid gap-6 mb-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-surface-800">Weekly Attendance Trend</h3>
                  <p className="text-xs text-surface-400 mt-0.5">Attendance distribution across the week</p>
                </div>
                {weekly.length > 0 && (
                  <Badge variant="info">{weekly.reduce((a, b) => a + b.value, 0)} total</Badge>
                )}
              </div>
              <MiniBar data={weekly} color="#6366f1" />
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-surface-800 mb-5">Institution Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Faculties', value: summary?.faculties ?? 0, color: 'bg-primary-500' },
                  { label: 'Departments', value: summary?.departments ?? 0, color: 'bg-accent-500' },
                  { label: 'Academic Levels', value: summary?.academic_levels ?? 0, color: 'bg-purple-500' },
                  { label: 'Students', value: summary?.students ?? 0, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-surface-50">
                    <span className="text-sm text-surface-600">{item.label}</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-lg font-bold text-surface-800">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 mb-6 lg:grid-cols-2">
            {activeSessions.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-accent-50 to-accent-100/50 border-b border-accent-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-surface-800">Active Sessions Now</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} currently running</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/sessions?status=active')}>View All</Button>
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-72 overflow-auto">
                  {activeSessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-soft" />
                        <div>
                          <div className="font-medium text-sm text-surface-800">{s.course?.code || 'Unknown'} <span className="text-surface-400 text-xs">#{s.id}</span></div>
                          <div className="text-xs text-surface-500">{s.course?.lecturer?.name || '—'} • {s.starts_at ? new Date(s.starts_at).toLocaleTimeString() : '—'}</div>
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
                    <div>
                      <h3 className="font-semibold text-surface-800">Recent Users</h3>
                      <p className="text-xs text-surface-500 mt-0.5">Latest registered users</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/users')}>Manage</Button>
                  </div>
                </div>
                <div className="p-4 space-y-1 max-h-72 overflow-auto">
                  {recentUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${u.role === 'lecturer' ? 'bg-accent-500' : 'bg-primary-500'}`}>
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-surface-800">{u.name}</div>
                          <div className="text-xs text-surface-400">{u.email}</div>
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
              <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-surface-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-surface-800">Recent Courses</h3>
                      <p className="text-xs text-surface-400 mt-0.5">Latest created courses</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/courses')}>All Courses</Button>
                  </div>
                </div>
                <div className="p-0">
                  <Table>
                    <Thead><Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Students</Th></Tr></Thead>
                    <Tbody>
                      {recentCourses.map(c => (
                        <Tr key={c.id}>
                          <Td className="font-mono text-sm font-medium text-primary-600">{c.code}</Td>
                          <Td className="text-sm text-surface-800">{c.title}</Td>
                          <Td className="text-sm text-surface-600">{c.lecturer?.name || '—'}</Td>
                          <Td><Badge variant="info">{c.roster_count || 0}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-semibold text-surface-800 mb-5">Academic Structure</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50">
                  <div className="text-2xl font-bold text-primary-600">{summary?.faculties ?? 0}</div>
                  <div className="text-sm text-primary-700 mt-1">Faculties</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100/50 border border-accent-200/50">
                  <div className="text-2xl font-bold text-accent-600">{summary?.departments ?? 0}</div>
                  <div className="text-sm text-accent-700 mt-1">Departments</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                  <div className="text-2xl font-bold text-purple-600">{summary?.academic_levels ?? 0}</div>
                  <div className="text-sm text-purple-700 mt-1">Levels</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                  <div className="text-2xl font-bold text-amber-600">{summary?.students ?? 0}</div>
                  <div className="text-sm text-amber-700 mt-1">Students</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  )
}
