import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getStudentAttendanceReport } from '../../services/api'

export default function StudentCourses() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [summary, setSummary] = useState({ total_courses: 0, overall_average: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getStudentAttendanceReport(token)
        const rows = Array.isArray(data?.courses) ? data.courses : Array.isArray(data) ? data : []
        setCourses(rows)
        setSummary({
          total_courses: data?.total_courses ?? rows.length,
          overall_average: data?.overall_average ?? 0,
        })
      } catch (err) {
        setError('Failed to load attendance report.')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const filtered = useMemo(() => {
    if (!query.trim()) return courses
    const q = query.toLowerCase()
    return courses.filter(
      (c) =>
        (c.code || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q)
    )
  }, [courses, query])

  const overallAverage = summary.overall_average

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-slate-500">Attendance report for your enrolled courses</p>
        </div>
        <Button variant="ghost" onClick={() => setToken(window.localStorage.getItem('admin_token') || '')} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-lg font-bold">{summary.total_courses}</div>
          <div>
            <div className="text-sm text-slate-500">Total Courses</div>
            <div className="text-xl font-bold">{summary.total_courses}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${overallAverage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {overallAverage}%
          </div>
          <div>
            <div className="text-sm text-slate-500">Overall Average</div>
            <div className="text-xl font-bold">{overallAverage}%</div>
          </div>
        </Card>
      </div>

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Please log in to view your courses.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No courses found.</Card>
      ) : (
        <>
          <div className="mb-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course code or title..."
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No courses match your search.</Card>
          ) : (
            <Card className="p-0">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Code</Th>
                    <Th>Title</Th>
                    <Th className="text-center">Present</Th>
                    <Th className="text-center">Late</Th>
                    <Th className="text-center">Absent</Th>
                    <Th className="text-center">Total Sessions</Th>
                    <Th className="text-center">Avg %</Th>
                    <Th className="text-center">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((c) => {
                    const avg = c.average_percentage ?? 0
                    const pass = avg >= 50
                    return (
                      <Tr
                        key={c.id}
                        className="border-t hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push(`/student/attendance?course=${c.id}`)}
                      >
                        <Td className="font-mono font-medium">{c.code}</Td>
                        <Td>{c.title}</Td>
                        <Td className="text-center">{c.present ?? 0}</Td>
                        <Td className="text-center">{c.late ?? 0}</Td>
                        <Td className="text-center">{c.absent ?? 0}</Td>
                        <Td className="text-center">{c.total_sessions ?? 0}</Td>
                        <Td className="text-center font-medium">{avg}%</Td>
                        <Td className="text-center">
                          <Badge variant={pass ? 'success' : 'danger'}>{pass ? 'Pass' : 'Fail'}</Badge>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </Layout>
  )
}
