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
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-slate-500">All courses across the institution</p>
        </div>
        <Button variant="ghost" onClick={loadCourses} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-16 animate-pulse bg-slate-100" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No courses found.</Card>
      ) : (
        <>
          <Card className="p-0">
            <Table>
              <Thead>
                <Tr><Th>Code</Th><Th>Title</Th><Th>Lecturer</Th><Th>Faculty</Th><Th>Units</Th><Th>Location</Th></Tr>
              </Thead>
              <Tbody>
                {courses.map(c => (
                  <Tr key={c.id}>
                    <Td className="font-mono font-medium">{c.code}</Td>
                    <Td>{c.title}</Td>
                    <Td>{c.lecturer?.name || '—'}</Td>
                    <Td className="text-sm">{c.faculty_name || '—'}</Td>
                    <Td>{c.course_unit || '—'}</Td>
                    <Td>{c.location_name || '—'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Total: {meta.total} courses</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={meta.current_page <= 1} onClick={() => loadCourses(meta.current_page - 1)}>Previous</Button>
              <span className="py-2">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="ghost" disabled={meta.current_page >= meta.last_page} onClick={() => loadCourses(meta.current_page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
