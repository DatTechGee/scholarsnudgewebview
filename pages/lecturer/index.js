import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getSharedCourses } from '../../services/api'
import { useAuth } from '../../components/AuthContext'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-surface-800">{value ?? '—'}</div>
          <div className="text-sm text-surface-500 mt-0.5">{label}</div>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: color + '18' }}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function LecturerDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async (t) => {
    if (!t) return
    setError('')
    try {
      const [c, s] = await Promise.all([
        getLecturerCourses(t).catch(() => null),
        getSharedCourses(t).catch(() => null),
      ])
      setCourses(Array.isArray(c?.data) ? c.data : Array.isArray(c) ? c : [])
      setShared(Array.isArray(s?.data) ? s.data : Array.isArray(s) ? s : [])
    } catch (_) { setError('Failed to load data.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    if (!t) { setLoading(false); return }
    loadData(t)
    const iv = setInterval(() => loadData(t), 30000)
    return () => clearInterval(iv)
  }, [loadData])

  const activeSessions = courses.filter(c => c.active_session)
  const totalStudents = courses.reduce((sum, c) => sum + (c.roster_count || 0), 0)

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-800">Lecturer Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">Welcome back, {user?.name || 'Lecturer'}</p>
      </div>

      {error ? (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="card-base h-28" />)}
          </div>
          <div className="card-base h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <StatCard label="Your Courses" value={courses.length} icon="📚" color="#6366f1" />
            <StatCard label="Active Sessions" value={activeSessions.length} icon={activeSessions.length > 0 ? '🟢' : '⚪'} color="#10b981" />
            <StatCard label="Total Students" value={totalStudents} icon="👥" color="#8b5cf6" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {activeSessions.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-accent-50 to-accent-100/50 border-b border-accent-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent-500 animate-pulse-soft" />
                      <div>
                        <h3 className="font-semibold text-surface-800">Active Sessions</h3>
                        <p className="text-xs text-surface-500 mt-0.5">{activeSessions.length} session{activeSessions.length > 1 ? 's' : ''} running now</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/lecturer/sessions')}>View All</Button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {activeSessions.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-accent-50/50 hover:bg-accent-100/50 transition-colors">
                      <div>
                        <span className="font-semibold text-sm text-surface-800">{c.code}</span>
                        <span className="text-xs text-surface-500 ml-2">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Live</Badge>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/lecturer/sessions?course_id=${c.id}`)}>Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {shared.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-surface-800">Shared With Me</h3>
                      <p className="text-xs text-surface-500 mt-0.5">Courses shared by colleagues</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/lecturer/shares')}>Details</Button>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  {shared.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🔄</div>
                        <div>
                          <span className="text-sm font-medium text-surface-800">{s.course?.code || '—'}</span>
                          <span className="text-xs text-surface-500 ml-2">by {s.shared_by?.name || '—'}</span>
                        </div>
                      </div>
                      <Badge variant="info">Shared</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-surface-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-surface-800">Your Courses</h3>
                  <p className="text-xs text-surface-400 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} assigned</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push('/lecturer/courses')}>Manage Courses</Button>
                  <Button variant="default" size="sm" onClick={() => router.push('/lecturer/courses')}>New Course</Button>
                </div>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12 text-surface-400">
                <p className="mb-4 text-sm">No courses yet.</p>
                <Button variant="default" onClick={() => router.push('/lecturer/courses')}>Create Your First Course</Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <Thead><Tr><Th>Code</Th><Th>Title</Th><Th>Faculty</Th><Th>Students</Th><Th>Status</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {courses.map(c => (
                        <Tr key={c.id}>
                          <Td className="font-mono font-medium text-primary-600">{c.code}</Td>
                          <Td className="text-surface-800 font-medium">{c.title}</Td>
                          <Td className="text-surface-500">{c.faculty_name || <span className="text-surface-300">—</span>}</Td>
                          <Td><Badge variant="info">{c.roster_count || 0}</Badge></Td>
                          <Td>{c.active_session ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}</Td>
                          <Td>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/lecturer/sessions?course_id=${c.id}`)}>Sessions</Button>
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/lecturer/attendance?course_id=${c.id}`)}>Attendance</Button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <div className="stat-card cursor-pointer" onClick={() => router.push('/lecturer/timetable')}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">📅</div>
                <div>
                  <div className="font-semibold text-sm text-surface-800">Timetable</div>
                  <div className="text-xs text-surface-400">Manage schedules</div>
                </div>
              </div>
            </div>
            <div className="stat-card cursor-pointer" onClick={() => router.push('/lecturer/venues')}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent-100 flex items-center justify-center text-lg shrink-0">📍</div>
                <div>
                  <div className="font-semibold text-sm text-surface-800">Venues</div>
                  <div className="text-xs text-surface-400">Manage locations</div>
                </div>
              </div>
            </div>
            <div className="stat-card cursor-pointer" onClick={() => router.push('/lecturer/shares')}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-lg shrink-0">🔄</div>
                <div>
                  <div className="font-semibold text-sm text-surface-800">Course Sharing</div>
                  <div className="text-xs text-surface-400">Collaborate with peers</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
