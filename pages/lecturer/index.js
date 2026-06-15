import { useEffect, useState } from 'react'
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
    <Card className="p-5 border-l-4 shadow-sm" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">{value ?? '—'}</div>
          <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: color + '20' }}>
          <span>{icon}</span>
        </div>
      </div>
    </Card>
  )
}

export default function LecturerDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    if (!t) { setLoading(false); return }
    loadData(t)
  }, [])

  const loadData = async (t) => {
    setLoading(true); setError('')
    try {
      const [c, s] = await Promise.all([
        getLecturerCourses(t).catch(() => null),
        getSharedCourses(t).catch(() => null),
      ])
      setCourses(Array.isArray(c?.data) ? c.data : Array.isArray(c) ? c : [])
      setShared(Array.isArray(s?.data) ? s.data : Array.isArray(s) ? s : [])
    } catch (_) { setError('Failed to load data.') }
    finally { setLoading(false) }
  }

  const activeSessions = courses.filter(c => c.active_session)
  const totalStudents = courses.reduce((sum, c) => sum + (c.roster_count || 0), 0)

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Lecturer Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back, {user?.name || 'Lecturer'}</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <StatCard label="Your Courses" value={courses.length} icon="📚" color="#3b82f6" />
            <StatCard label="Active Sessions" value={activeSessions.length} icon={activeSessions.length > 0 ? '🟢' : '⚪'} color="#10b981" />
            <StatCard label="Total Students" value={totalStudents} icon="👥" color="#8b5cf6" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {activeSessions.length > 0 && (
              <Card className="p-5 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">🟢 Active Sessions</h3>
                  <Button variant="ghost" onClick={() => router.push('/lecturer/sessions')}>View All</Button>
                </div>
                <div className="space-y-3">
                  {activeSessions.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div>
                        <span className="font-medium text-sm">{c.code}</span>
                        <span className="text-xs text-slate-500 ml-2">{c.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success">Live</Badge>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/lecturer/sessions?course_id=${c.id}`)}>Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {shared.length > 0 && (
              <Card className="p-5 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">🔄 Shared With Me</h3>
                  <Button variant="ghost" onClick={() => router.push('/lecturer/shares')}>Details</Button>
                </div>
                <div className="space-y-2">
                  {shared.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{s.course?.code || '—'}</span>
                        <span className="text-xs text-slate-500 ml-2">by {s.shared_by?.name || '—'}</span>
                      </div>
                      <Badge variant="info">Shared</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Your Courses</h3>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => router.push('/lecturer/courses')}>Manage Courses</Button>
                <Button onClick={() => router.push('/lecturer/courses')}>New Course</Button>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="mb-4">No courses yet.</p>
                <Button onClick={() => router.push('/lecturer/courses')}>Create Your First Course</Button>
              </div>
            ) : (
              <Table>
                <Thead><Tr><Th>Code</Th><Th>Title</Th><Th>Faculty</Th><Th>Students</Th><Th>Status</Th><Th></Th></Tr></Thead>
                <Tbody>
                  {courses.map(c => (
                    <Tr key={c.id}>
                      <Td className="font-mono font-medium">{c.code}</Td>
                      <Td>{c.title}</Td>
                      <Td className="text-sm text-slate-500">{c.faculty_name || '—'}</Td>
                      <Td>{c.roster_count || 0}</Td>
                      <Td>{c.active_session ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button variant="ghost" onClick={() => router.push(`/lecturer/sessions?course_id=${c.id}`)}>Sessions</Button>
                          <Button variant="ghost" onClick={() => router.push(`/lecturer/attendance?course_id=${c.id}`)}>Attendance</Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card className="p-4 border-l-4 border-l-amber-400 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/lecturer/timetable')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">📅</div>
                <div>
                  <div className="font-semibold text-sm">Timetable</div>
                  <div className="text-xs text-slate-400">Manage schedules</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-400 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/lecturer/venues')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-lg">📍</div>
                <div>
                  <div className="font-semibold text-sm">Venues</div>
                  <div className="text-xs text-slate-400">Manage locations</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-purple-400 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/lecturer/shares')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🔄</div>
                <div>
                  <div className="font-semibold text-sm">Course Sharing</div>
                  <div className="text-xs text-slate-400">Collaborate with peers</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  )
}
