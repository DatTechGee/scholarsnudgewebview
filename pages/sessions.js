import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'
import Modal from '../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getAdminSessions, getAdminSessionDetail, getAdminSessionAttendances } from '../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

function SessionDetailModal({ sessionId, token, onClose }) {
  const [session, setSession] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    Promise.all([
      getAdminSessionDetail(sessionId, token).catch(() => null),
      getAdminSessionAttendances(sessionId, token).catch(() => null),
    ]).then(([s, a]) => {
      setSession(s || {})
      setAttendances(a?.data || a || [])
    }).finally(() => setLoading(false))
  }, [sessionId])

  return (
    <Modal open={!!sessionId} onClose={onClose} title={session ? `Session #${session.id}` : 'Session Detail'}>
      {loading ? <p className="text-slate-400">Loading...</p> : !session ? <p className="text-red-500">Failed to load</p> : (
        <>
          <div className="flex gap-2 mb-4">
            {['overview', 'attendances'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
              >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          {tab === 'overview' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-sm text-slate-500">Status</span><div><Badge variant={statusColors[session.status] || 'default'}>{session.status}</Badge></div></div>
                <div><span className="text-sm text-slate-500">Course</span><div className="font-medium">{session.course?.code || session.course_id}</div></div>
                <div><span className="text-sm text-slate-500">Starts</span><div className="font-medium">{session.starts_at ? new Date(session.starts_at).toLocaleString() : '—'}</div></div>
                <div><span className="text-sm text-slate-500">Ends</span><div className="font-medium">{session.ends_at ? new Date(session.ends_at).toLocaleString() : '—'}</div></div>
                <div><span className="text-sm text-slate-500">Attendance</span><div className="font-medium">{session.attendance_count ?? '—'}</div></div>
                <div><span className="text-sm text-slate-500">Expected</span><div className="font-medium">{session.expected_count ?? '—'}</div></div>
              </div>
              {session.location_name ? <div><span className="text-sm text-slate-500">Location</span><div className="font-medium">{session.location_name}</div></div> : null}
              {session.notes ? <div><span className="text-sm text-slate-500">Notes</span><div className="text-sm mt-1">{session.notes}</div></div> : null}
            </div>
          ) : tab === 'attendances' ? (
            <div className="max-h-80 overflow-auto">
              {attendances.length === 0 ? <p className="text-slate-400 text-sm">No attendance records.</p> : (
                <Table>
                  <Thead><Tr><Th>Student</Th><Th>Status</Th><Th>Distance</Th><Th>Late</Th></Tr></Thead>
                  <Tbody>
                    {attendances.map(a => (
                      <Tr key={a.id}>
                        <Td>{a.student?.name || a.student_name || `#${a.student_id}`}</Td>
                        <Td><Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}>{a.status}</Badge></Td>
                        <Td>{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                        <Td>{a.is_late ? <Badge variant="warning">Yes</Badge> : '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </div>
          ) : null}
        </>
      )}
    </Modal>
  )
}

export default function Sessions() {
  const [token, setToken] = useState('')
  const [sessions, setSessions] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadSessions = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page }
      if (statusFilter) params.status = statusFilter
      const data = await getAdminSessions(token, params)
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setSessions(rows)
      setMeta({
        current_page: data?.current_page || page,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (err) {
      setError('Failed to load sessions.')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) loadSessions(1) }, [token, statusFilter])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-slate-500">View and manage attendance sessions</p>
        </div>
        <Button variant="ghost" onClick={() => loadSessions(meta.current_page)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card>
      ) : (
        <>
          <div className="mb-4 flex gap-3">
            {['', 'active', 'stopped', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === s ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
              >{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}</button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
          ) : sessions.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No sessions found.</Card>
          ) : (
            <>
              <Card className="p-0">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Course</Th>
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
                        <Td className="font-medium">{s.course?.code || '—'}</Td>
                        <Td><Badge variant={statusColors[s.status] || 'default'}>{s.status}</Badge></Td>
                        <Td className="text-sm">{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'}</Td>
                        <Td>{s.attendance_count ?? '—'}/{s.expected_count ?? '—'}</Td>
                        <Td>
                          <Button variant="ghost" onClick={() => setSelectedSessionId(s.id)}>View</Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Card>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>Total: {meta.total} sessions</span>
                <div className="flex gap-2">
                  <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => loadSessions(meta.current_page - 1)}>Previous</Button>
                  <span className="py-2">Page {meta.current_page} of {meta.last_page}</span>
                  <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadSessions(meta.current_page + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <SessionDetailModal sessionId={selectedSessionId} token={token} onClose={() => setSelectedSessionId(null)} />
    </Layout>
  )
}
