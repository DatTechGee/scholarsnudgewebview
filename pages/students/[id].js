import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getAdminUser, getStudentAttendance } from '../../services/api'

export default function StudentDetail() {
  const router = useRouter()
  const { id } = router.query
  const [token, setToken] = useState('')
  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') || '' : ''
    setToken(t)
    return t
  }, [])

  const loadData = useCallback(async (t, page = 1) => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [userData, attendanceData] = await Promise.all([
        getAdminUser(id, t),
        getStudentAttendance(id, t, { page }),
      ])
      setStudent(userData?.data || userData)
      const records = attendanceData?.records || attendanceData
      const rows = Array.isArray(records?.data) ? records.data : Array.isArray(records) ? records : []
      setAttendance(rows)
      setMeta({
        current_page: records?.current_page || 1,
        last_page: records?.last_page || 1,
        total: records?.total || rows.length,
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load student data.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const t = getToken()
    if (t && id) loadData(t)
    else if (!t) setLoading(false)
  }, [id])

  const loadPage = (page) => {
    const t = token || getToken()
    if (t) loadData(t, page)
  }

  const stats = (() => {
    if (!attendance.length) return { total: 0, present: 0, late: 0, absent: 0, avg: 0 }
    const total = attendance.length
    const present = attendance.filter((r) => r.status === 'present').length
    const late = attendance.filter((r) => r.late === true || r.status === 'late').length
    const absent = attendance.filter((r) => r.status === 'absent').length
    const avg = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { total, present, late, absent, avg }
  })()

  if (!token) {
    return (
      <Layout>
        <Card className="p-8 text-center text-slate-400">
          Enter your admin token in the Users page first.
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => router.push('/students')}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-800">Student Detail</h1>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : null}

      {loading && !student ? (
        <div className="space-y-4">
          <Card className="h-32 animate-pulse bg-slate-100" />
          <Card className="h-48 animate-pulse bg-slate-100" />
        </div>
      ) : student ? (
        <>
          <Card className="mb-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Name</label>
                <p className="font-medium text-slate-800">{student.name || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Email</label>
                <p className="font-medium text-slate-800">{student.email || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Matric Number</label>
                <p className="font-medium text-slate-800">{student.matric_number || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Faculty</label>
                <p className="font-medium text-slate-800">{student.faculty?.name || student.faculty_name || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Department</label>
                <p className="font-medium text-slate-800">{student.department?.name || student.department_name || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Level</label>
                <p className="font-medium text-slate-800">{student.academic_level?.name || student.level_name || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Status</label>
                <Badge variant={student.is_verified ? 'success' : 'warning'}>
                  {student.is_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card className="text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total</div>
            </Card>
            <Card className="text-center border-l-4 border-l-green-500">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Present</div>
            </Card>
            <Card className="text-center border-l-4 border-l-yellow-500">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Late</div>
            </Card>
            <Card className="text-center border-l-4 border-l-red-500">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Absent</div>
            </Card>
            <Card className="text-center border-l-4 border-l-blue-500">
              <div className="text-2xl font-bold text-blue-600">{stats.avg}%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Average</div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Attendance Records</h2>
              <Button variant="ghost" onClick={() => loadPage(meta.current_page)} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">Loading attendance records...</div>
            ) : attendance.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No attendance records found.</div>
            ) : (
              <>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Session ID</Th>
                      <Th>Course</Th>
                      <Th>Status</Th>
                      <Th>Checked In At</Th>
                      <Th>Distance</Th>
                      <Th>Late</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {attendance.map((record) => (
                      <Tr key={record.id}>
                        <Td className="font-mono text-sm">#{record.session_id}</Td>
                        <Td className="text-sm">{record.course?.code || record.course_code || '—'}</Td>
                        <Td>
                          <Badge
                            variant={
                              record.status === 'present' ? 'success' :
                              record.status === 'late' ? 'warning' :
                              record.status === 'absent' ? 'danger' : 'default'
                            }
                          >
                            {record.status || '—'}
                          </Badge>
                        </Td>
                        <Td className="text-sm">
                          {record.checked_in_at ? new Date(record.checked_in_at).toLocaleString() : '—'}
                        </Td>
                        <Td className="text-sm">{record.distance != null ? `${Number(record.distance).toFixed(1)}m` : '—'}</Td>
                        <Td className="text-sm">
                          {record.late != null ? (
                            <Badge variant={record.late ? 'warning' : 'success'}>
                              {record.late ? 'Yes' : 'No'}
                            </Badge>
                          ) : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-500">
                  <div>Total: {meta.total}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" disabled={meta.current_page <= 1 || loading} onClick={() => loadPage(meta.current_page - 1)}>
                      Previous
                    </Button>
                    <span>Page {meta.current_page} of {meta.last_page}</span>
                    <Button variant="ghost" disabled={meta.current_page >= meta.last_page || loading} onClick={() => loadPage(meta.current_page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      ) : null}
    </Layout>
  )
}
