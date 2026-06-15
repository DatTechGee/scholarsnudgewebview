import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getAdminSessionDetail, getAdminSessionAttendances } from '../../services/api'

const statusColors = { active: 'success', stopped: 'default', completed: 'info', cancelled: 'danger' }

export default function SessionDetail() {
  const router = useRouter()
  const { id } = router.query
  const [token, setToken] = useState('')
  const [session, setSession] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadData = async (page = 1) => {
    if (!id || !token) return
    setLoading(true)
    setError('')
    try {
      const [s, a] = await Promise.all([
        getAdminSessionDetail(id, token),
        getAdminSessionAttendances(id, token, { page }),
      ])
      setSession(s)
      const rows = Array.isArray(a?.data) ? a.data : Array.isArray(a) ? a : []
      setAttendances(rows)
      setMeta({
        current_page: a?.current_page || page,
        last_page: a?.last_page || 1,
        total: a?.total || rows.length,
      })
    } catch {
      setError('Failed to load session.')
      setSession(null)
      setAttendances([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && token) loadData()
  }, [id, token])

  const handlePageChange = async (page) => {
    setLoading(true)
    try {
      const a = await getAdminSessionAttendances(id, token, { page })
      const rows = Array.isArray(a?.data) ? a.data : Array.isArray(a) ? a : []
      setAttendances(rows)
      setMeta({
        current_page: a?.current_page || page,
        last_page: a?.last_page || 1,
        total: a?.total || rows.length,
      })
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const breakdown = {
    present: attendances.filter(a => (a.status === 'present' || a.status === 'verified') && !a.is_late).length,
    late: attendances.filter(a => (a.status === 'present' || a.status === 'verified') && a.is_late).length,
    absent: attendances.filter(a => a.status === 'absent' || a.status === 'invalid').length,
  }

  if (!id) return null

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => router.push('/sessions')} className="mb-2">&larr; Back to Sessions</Button>
          <h1 className="text-2xl font-bold">Session #{session?.id || ''}</h1>
        </div>
        <Button variant="ghost" onClick={() => loadData(meta.current_page)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <Card className="p-8 text-center text-red-500">{error}</Card>
      ) : loading && !session ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
      ) : session ? (
        <>
          <Card className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">ID</p>
                <p className="font-mono text-sm">#{session.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={statusColors[session.status] || 'default'}>{session.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Course</p>
                <p className="font-medium">{session.course?.code || session.course_id}{session.course?.title ? ` — ${session.course.title}` : ''}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Started</p>
                <p className="font-medium">{session.starts_at ? new Date(session.starts_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ended</p>
                <p className="font-medium">{session.ends_at ? new Date(session.ends_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium">{session.location_name || '—'}</p>
              </div>
            </div>

            {session.notes ? (
              <div className="mt-4">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-sm mt-1">{session.notes}</p>
              </div>
            ) : null}

            <div className="mt-6 flex gap-4">
              <div className="rounded-md bg-green-50 px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold text-green-700">{breakdown.present}</p>
                <p className="text-xs text-green-600">Present</p>
              </div>
              <div className="rounded-md bg-yellow-50 px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold text-yellow-700">{breakdown.late}</p>
                <p className="text-xs text-yellow-600">Late</p>
              </div>
              <div className="rounded-md bg-red-50 px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold text-red-700">{breakdown.absent}</p>
                <p className="text-xs text-red-600">Absent</p>
              </div>
              <div className="rounded-md bg-slate-50 px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold text-slate-700">{meta.total}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Student Name</Th>
                  <Th>Matric</Th>
                  <Th>Status</Th>
                  <Th>Distance</Th>
                  <Th>Checked In At</Th>
                  <Th>Late</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attendances.length === 0 ? (
                  <Tr><Td colSpan={6} className="text-center text-slate-400 py-8">No attendance records found.</Td></Tr>
                ) : attendances.map(a => (
                  <Tr key={a.id}>
                    <Td className="font-medium">{a.student?.name || a.student_name || `#${a.student_id}`}</Td>
                    <Td className="font-mono text-sm">{a.student?.matric_number || a.matric_number || '—'}</Td>
                    <Td><Badge variant={a.status === 'present' || a.status === 'verified' ? 'success' : a.status === 'invalid' ? 'danger' : 'warning'}>{a.status}</Badge></Td>
                    <Td>{a.distance_at_checkin ? `${Math.round(a.distance_at_checkin)}m` : '—'}</Td>
                    <Td className="text-sm">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '—'}</Td>
                    <Td>{a.is_late ? <Badge variant="warning">Yes</Badge> : '—'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Total: {meta.total} records</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => handlePageChange(meta.current_page - 1)}>Previous</Button>
              <span className="py-2">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => handlePageChange(meta.current_page + 1)}>Next</Button>
            </div>
          </div>
        </>
      ) : null}
    </Layout>
  )
}
