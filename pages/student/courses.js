import { useEffect, useMemo, useState, useCallback } from 'react'
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
  const [courses, setCourses] = useState([])
  const [summary, setSummary] = useState({ total_courses: 0, overall_average: 0 })
  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setHasToken(!!t)
    if (!t) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getStudentAttendanceReport(t)
        const rows = Array.isArray(data?.report) ? data.report : Array.isArray(data?.courses) ? data.courses : Array.isArray(data) ? data : []
        setCourses(rows)
        setSummary({
          total_courses: data?.summary?.total_courses ?? data?.total_courses ?? rows.length,
          overall_average: data?.summary?.overall_attendance_percentage ?? data?.overall_average ?? 0,
        })
      } catch (err) {
        setError('Failed to load attendance report.')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-800">My Courses</h1>
          <p className="text-surface-500 text-sm">Attendance report for your enrolled courses</p>
        </div>
        <Button variant="ghost" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
        <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-800">{summary.total_courses}</div>
              <div className="text-sm text-surface-500 font-medium">Total Courses</div>
            </div>
          </div>
        </Card>
        <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${overallAverage >= 50 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <svg className={`w-6 h-6 ${overallAverage >= 50 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-800">{overallAverage}%</div>
              <div className="text-sm text-surface-500 font-medium">Overall Average</div>
            </div>
          </div>
        </Card>
      </div>

      {!hasToken ? (
        <Card className="p-12 text-center">
          <svg className="w-12 h-12 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-surface-400 text-sm">Please log in to view your courses.</p>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Card key={i} className="h-16 animate-pulse bg-surface-100" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-12 h-12 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-surface-400 text-sm">No courses found.</p>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course code or title..."
              icon={
                <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-surface-400 text-sm">No courses match your search.</p>
            </Card>
          ) : (
            <Card className="p-0">
              <div className="p-5 border-b border-surface-100">
                <div className="section-header mb-0">
                  <div className="section-header-icon">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-surface-800">All Courses</h2>
                    <p className="text-xs text-surface-400">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="table-row-hover">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Title</Th>
                      <Th className="text-center">Present</Th>
                      <Th className="text-center">Late</Th>
                      <Th className="text-center">Absent</Th>
                      <Th className="text-center">Sessions</Th>
                      <Th className="text-center">Rate</Th>
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
                          className="cursor-pointer"
                          onClick={() => router.push(`/student/attendance?course=${c.id}`)}
                        >
                          <Td className="font-mono font-bold text-primary-600">{c.code}</Td>
                          <Td className="font-medium text-surface-800">{c.title}</Td>
                          <Td className="text-center"><span className="font-semibold text-emerald-600">{c.present ?? 0}</span></Td>
                          <Td className="text-center"><span className="font-semibold text-amber-600">{c.late ?? 0}</span></Td>
                          <Td className="text-center"><span className="font-semibold text-red-600">{c.absent ?? 0}</span></Td>
                          <Td className="text-center">{c.total_sessions ?? 0}</Td>
                          <Td className="text-center">
                            <Badge variant={avg >= 75 ? 'success' : avg >= 50 ? 'warning' : 'danger'}>
                              {avg}%
                            </Badge>
                          </Td>
                          <Td className="text-center">
                            <Badge variant={pass ? 'success' : 'danger'}>{pass ? 'Pass' : 'Fail'}</Badge>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}
    </Layout>
  )
}
