import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getAdminCourseDetail, getAdminCourseSessions } from '../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

export default function CourseDetail() {
  const router = useRouter()
  const { id } = router.query

  const [token, setToken] = useState('')
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const load = async () => {
    if (!token || !id) return
    setLoading(true)
    setError('')
    try {
      const [detail, sessionsData] = await Promise.all([
        getAdminCourseDetail(id, token),
        getAdminCourseSessions(id, token).catch(() => null),
      ])
      setCourse(detail || {})
      const rows = Array.isArray(sessionsData?.data) ? sessionsData.data : Array.isArray(sessionsData) ? sessionsData : []
      setSessions(rows)
    } catch (err) {
      setError('Failed to load course details.')
      setCourse(null)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token, id])

  if (!token) {
    return (
      <Layout>
        <Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/courses')} className="mb-3">&larr; Back to Courses</Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>
      ) : !course ? (
        <Card className="p-8 text-center text-slate-400">Course not found.</Card>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{course.title || 'Untitled Course'}</h1>
                <p className="text-sm text-slate-500 font-mono">{course.code || '—'}</p>
              </div>
              <Badge variant="info">{course.academic_level || '—'}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-slate-500">Lecturer</span>
                <div className="font-medium">{course.lecturer?.name || course.lecturer_name || '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Academic Level</span>
                <div className="font-medium">{course.academic_level || '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Roster Count</span>
                <div className="font-medium">{course.roster_count ?? '—'}</div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Session Count</span>
                <div className="font-medium">{course.session_count ?? '—'}</div>
              </div>
            </div>
            {course.location_name && (
              <div className="mt-4 pt-4 border-t text-sm text-slate-500">
                <span className="font-medium text-slate-700">Location:</span> {course.location_name}
                {course.latitude && course.longitude && (
                  <span className="ml-4 text-slate-400">
                    ({course.latitude}, {course.longitude})
                    {course.radius ? <span> &middot; {course.radius}m radius</span> : null}
                  </span>
                )}
              </div>
            )}
            {course.faculty_name && (
              <div className="mt-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">Faculty:</span> {course.faculty_name}
                {course.department_name ? <span className="ml-4"><span className="font-medium text-slate-700">Department:</span> {course.department_name}</span> : null}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sessions ({sessions.length})</h2>
            <Button variant="ghost" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No sessions found for this course.</Card>
          ) : (
            <Card className="p-0">
              <Table>
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Status</Th>
                    <Th>Started</Th>
                    <Th>Attendance</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sessions.map(s => (
                    <Tr key={s.id}>
                      <Td className="font-mono text-sm">#{s.id}</Td>
                      <Td><Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge></Td>
                      <Td className="text-sm">{s.starts_at ? new Date(s.starts_at).toLocaleString() : '—'}</Td>
                      <Td>{s.attendance_count ?? '—'}</Td>
                      <Td>
                        <Button variant="ghost" onClick={() => router.push(`/sessions/${s.id}`)}>View</Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </Layout>
  )
}
