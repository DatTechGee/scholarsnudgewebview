import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getUsers, getAdminSessions, getAdminCourses } from '../services/api'

const eventColors = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  login: 'default',
  logout: 'default',
  registered: 'success',
  verified: 'success',
  stopped: 'warning',
  cancelled: 'danger',
  started: 'success',
  imported: 'info',
  shared: 'info',
}

export default function Audit() {
  const [token, setToken] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async (t) => {
    if (!t) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [users, sessions, courses] = await Promise.all([
        getUsers(t, { per_page: 10 }).catch(() => null),
        getAdminSessions(t, { per_page: 10 }).catch(() => null),
        getAdminCourses(t, { per_page: 10 }).catch(() => null),
      ])

      const userEvents = (users?.data?.data || users?.data || [])
        .filter(u => u.updated_at)
        .slice(0, 10)
        .map(u => ({
          id: `user-${u.id}-${Date.now()}`,
          type: u.created_at === u.updated_at ? 'registered' : 'updated',
          entity: 'User',
          description: `${u.name || 'Unknown'} (${u.role || '—'})`,
          detail: u.email || '',
          timestamp: u.updated_at || u.created_at,
          actor: 'system',
        }))

      const sessionEvents = (sessions?.data?.data || sessions?.data || [])
        .slice(0, 10)
        .map(s => ({
          id: `session-${s.id}-${Date.now()}`,
          type: s.status === 'active' ? 'started' : s.status === 'cancelled' ? 'cancelled' : s.status === 'stopped' ? 'stopped' : 'updated',
          entity: 'Session',
          description: `Session #${s.id}`,
          detail: `${s.course?.code || '—'} (${s.attendance_count || 0} attendances)`,
          timestamp: s.starts_at || s.created_at,
          actor: s.course?.lecturer?.name || 'lecturer',
        }))

      const courseEvents = (courses?.data?.data || courses?.data || [])
        .slice(0, 10)
        .map(c => ({
          id: `course-${c.id}-${Date.now()}`,
          type: c.created_at === c.updated_at ? 'created' : 'updated',
          entity: 'Course',
          description: `${c.code || '—'} — ${c.title || 'Untitled'}`,
          detail: `Lecturer: ${c.lecturer?.name || '—'}`,
          timestamp: c.updated_at || c.created_at,
          actor: c.lecturer?.name || 'admin',
        }))

      const merged = [...userEvents, ...sessionEvents, ...courseEvents]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50)

      setEvents(merged)
    } catch (_) {
      setError('Failed to load audit data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) loadData(t)
    else setLoading(false)
  }, [loadData])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">Recent activity across users, sessions, and courses</p>
        </div>
        <Button variant="ghost" onClick={() => loadData(token)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      {!token ? (
        <Card className="p-12 text-center text-slate-400">
          <p className="mb-4">Please sign in as admin to view audit logs.</p>
          <Button onClick={() => window.location.href = '/login'}>Sign In</Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <p className="text-lg font-medium mb-2">No recent activity found</p>
          <p className="text-sm">Activity will appear here as users register, sessions are created, and courses are managed.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Event</Th>
                <Th>Entity</Th>
                <Th>Description</Th>
                <Th>Details</Th>
                <Th>Actor</Th>
                <Th>Timestamp</Th>
              </Tr>
            </Thead>
            <Tbody>
              {events.map((ev) => (
                <Tr key={ev.id}>
                  <Td>
                    <Badge variant={eventColors[ev.type] || 'default'} className="capitalize">{ev.type}</Badge>
                  </Td>
                  <Td className="font-medium text-slate-700">{ev.entity}</Td>
                  <Td className="text-slate-600">{ev.description}</Td>
                  <Td className="text-slate-500 text-xs">{ev.detail}</Td>
                  <Td className="text-slate-600">{ev.actor || 'system'}</Td>
                  <Td className="text-slate-500 text-xs whitespace-nowrap">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Layout>
  )
}
