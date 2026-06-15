import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/shadcn/Table'
import { getAdminCourses } from '../services/api'

export default function Courses() {
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadCourses = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminCourses(token, { page })
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setCourses(rows)
      setMeta({
        current_page: data?.current_page || page,
        last_page: data?.last_page || 1,
        total: data?.total || rows.length,
      })
    } catch (err) {
      setError('Failed to load courses.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) loadCourses() }, [token])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">Courses</h1>
          <p className="text-sm text-surface-500 mt-0.5">All courses across the institution</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100 text-surface-600 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            {meta.total} total
          </span>
          <Button variant="outline" size="sm" onClick={loadCourses} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
        </div>
      </div>

      {error ? (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </Card>
      ) : null}

      {!token ? (
        <Card className="p-12 text-center text-surface-400 text-sm">Enter your admin token in the Users page first.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card-base h-16 animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-surface-400 text-sm">No courses found.</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Faculty</Th><Th>Units</Th><Th>Location</Th></Tr>
              </Thead>
              <Tbody>
                {courses.map(c => (
                  <Tr key={c.id}>
                    <Td className="font-mono font-medium text-primary-600">{c.code}</Td>
                    <Td className="text-surface-800 font-medium">{c.title}</Td>
                    <Td className="text-surface-600">{c.lecturer?.name || <span className="text-surface-300">—</span>}</Td>
                    <Td className="text-surface-500">{c.faculty_name || <span className="text-surface-300">—</span>}</Td>
                    <Td><Badge variant="outline">{c.course_unit || '—'}</Badge></Td>
                    <Td className="text-surface-500">{c.location_name || <span className="text-surface-300">—</span>}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <span className="text-sm text-surface-500">Total: {meta.total} courses</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => loadCourses(meta.current_page - 1)}>Previous</Button>
              <span className="text-sm text-surface-500 px-2">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => loadCourses(meta.current_page + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  )
}
