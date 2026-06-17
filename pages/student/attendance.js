import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Select from '../../components/shadcn/Select'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getStudentAttendanceHistory, getStudentAttendanceReport } from '../../services/api'

export default function StudentAttendance() {
  const router = useRouter()
  const { course: courseParam } = router.query
  const [token, setToken] = useState('')
  const [records, setRecords] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [courseFilter, setCourseFilter] = useState(courseParam || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') || '' : ''
    setToken(t)
    return t
  }, [])

  const loadData = useCallback(async (t, page = 1) => {
    if (!t) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const params = { page, per_page: meta.per_page }
      if (courseFilter) params.course_id = courseFilter
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const [historyData, reportData] = await Promise.all([
        getStudentAttendanceHistory(t, params).catch(() => null),
        courseParam || courseFilter ? null : getStudentAttendanceReport(t).catch(() => null),
      ])

      if (historyData) {
        let rows = Array.isArray(historyData.data) ? historyData.data : []
        if (!rows.length && historyData?.courses) {
          rows = historyData.courses.flatMap(c => c.timeline || [])
        }
        if (!rows.length && Array.isArray(historyData)) {
          rows = historyData
        }
        setRecords(rows)
        setMeta({
          current_page: historyData.current_page || 1,
          last_page: historyData.last_page || 1,
          total: historyData.total || rows.length,
          per_page: historyData.per_page || meta.per_page,
        })
      } else {
        setRecords([])
      }

      if (reportData) {
        setReport(reportData?.data || reportData || null)
      }
    } catch (err) {
      setError('Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }, [courseFilter, statusFilter, dateFrom, dateTo, courseParam, meta.per_page])

  useEffect(() => {
    const t = getToken()
    if (t) loadData(t)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (courseParam) {
      setCourseFilter(String(courseParam))
    }
  }, [courseParam])

  useEffect(() => {
    if (token) loadData(token)
  }, [courseFilter, statusFilter, dateFrom, dateTo])

  const loadPage = (page) => {
    const t = token || getToken()
    if (t) loadData(t, page)
  }

  const courses = useMemo(() => {
    const list = report?.report || report?.courses || report?.course_breakdown || []
    return list.map((c) => ({
      value: String(c.id || c.course_id || ''),
      label: `${c.code || c.course_code || 'Unknown'} — ${c.title || c.course_name || ''}`,
    })).filter((c) => c.value)
  }, [report])

  const stats = useMemo(() => {
    if (!records.length) return { total: 0, present: 0, late: 0, absent: 0, presentPct: 0, latePct: 0, absentPct: 0 }
    const total = records.length
    const present = records.filter((r) => r.status === 'present').length
    const late = records.filter((r) => r.status === 'late' || r.late === true).length
    const absent = records.filter((r) => r.status === 'absent').length
    return {
      total,
      present,
      late,
      absent,
      presentPct: total > 0 ? Math.round((present / total) * 100) : 0,
      latePct: total > 0 ? Math.round((late / total) * 100) : 0,
      absentPct: total > 0 ? Math.round((absent / total) * 100) : 0,
    }
  }, [records])

  const exportCsv = () => {
    const headers = ['Date', 'Course Code', 'Session ID', 'Status', 'Checked In At', 'Distance (m)', 'Late']
    const rows = records.map(r => [
      r.session?.start_time || r.created_at || r.checked_in_at
        ? new Date(r.session?.start_time || r.created_at || r.checked_in_at).toLocaleDateString() : '',
      r.course?.code || r.course_code || '',
      r.session_id || r.attendance_session_id || '',
      r.status || '',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : '',
      r.distance_at_checkin != null ? Math.round(r.distance_at_checkin) : r.distance != null ? Number(r.distance).toFixed(1) : '',
      r.is_late != null ? (r.is_late ? 'Yes' : 'No') : r.late != null ? (r.late ? 'Yes' : 'No') : '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance History</h1>
          <p className="text-slate-500 text-sm">View your complete attendance records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!records.length || loading}>
            Export CSV
          </Button>
          <Button variant="ghost" onClick={() => loadPage(meta.current_page)} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Records</div>
        </Card>
        <Card className="text-center border-l-4 border-l-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.presentPct}%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Present</div>
          <div className="text-[10px] text-slate-400">{stats.present} sessions</div>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.latePct}%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Late</div>
          <div className="text-[10px] text-slate-400">{stats.late} sessions</div>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-600">{stats.absentPct}%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Absent</div>
          <div className="text-[10px] text-slate-400">{stats.absent} sessions</div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1 font-medium">Course</label>
            <Select
              options={courses}
              value={courseFilter}
              onChange={setCourseFilter}
              placeholder="All Courses"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-slate-500 mb-1 font-medium">Status</label>
            <Select
              options={[
                { value: 'present', label: 'Present' },
                { value: 'late', label: 'Late' },
                { value: 'absent', label: 'Absent' },
                { value: 'invalid', label: 'Invalid' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs text-slate-500 mb-1 font-medium">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-44">
            <label className="block text-xs text-slate-500 mb-1 font-medium">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button variant="ghost" onClick={() => { setCourseFilter(courseParam || ''); setStatusFilter(''); setDateFrom(''); setDateTo('') }}>
            Clear
          </Button>
        </div>
      </Card>

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Please log in to view attendance records.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Card key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
      ) : records.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No attendance records found.</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Course Code</Th>
                <Th>Session</Th>
                <Th>Status</Th>
                <Th>Checked In At</Th>
                <Th>Distance</Th>
                <Th>Late</Th>
              </Tr>
            </Thead>
            <Tbody>
              {records.map((record) => (
                <Tr key={record.id}>
                  <Td className="text-sm whitespace-nowrap">
                    {record.session?.start_time || record.created_at || record.checked_in_at
                      ? new Date(record.session?.start_time || record.created_at || record.checked_in_at).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td className="text-sm font-medium">{record.course?.code || record.course_code || '—'}</Td>
                  <Td className="text-sm font-mono text-slate-500">#{record.session_id || record.attendance_session_id || '—'}</Td>
                  <Td>
                    <Badge
                      variant={
                        record.status === 'present' || record.status === 'verified' ? 'success' :
                        record.status === 'late' ? 'warning' :
                        record.status === 'absent' ? 'danger' :
                        record.status === 'invalid' ? 'danger' : 'default'
                      }
                    >
                      {record.status || '—'}
                    </Badge>
                  </Td>
                  <Td className="text-sm whitespace-nowrap">
                    {record.checked_in_at ? new Date(record.checked_in_at).toLocaleString() : '—'}
                  </Td>
                  <Td className="text-sm">
                    {record.distance_at_checkin != null
                      ? `${Math.round(record.distance_at_checkin)}m`
                      : record.distance != null
                        ? `${Number(record.distance).toFixed(1)}m`
                        : '—'}
                  </Td>
                  <Td className="text-sm">
                    {record.is_late != null ? (
                      <Badge variant={record.is_late ? 'warning' : 'success'}>
                        {record.is_late ? 'Yes' : 'No'}
                      </Badge>
                    ) : record.late != null ? (
                      <Badge variant={record.late ? 'warning' : 'success'}>
                        {record.late ? 'Yes' : 'No'}
                      </Badge>
                    ) : '—'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {(meta.last_page > 1) ? (
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
          ) : null}
        </Card>
      )}
    </Layout>
  )
}
