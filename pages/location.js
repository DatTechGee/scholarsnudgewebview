import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/shadcn/Card'
import Badge from '../components/shadcn/Badge'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'
import Modal from '../components/shadcn/Modal'
import { getAdminCourses, getAdminCourseDetail } from '../services/api'

export default function LocationEditor() {
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editCourse, setEditCourse] = useState(null)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const loadCourses = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminCourses(token, { page })
      setCourses(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load courses.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) loadCourses() }, [token])

  const hasLocation = (c) => c.location_latitude && c.location_longitude

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Location Editor</h1>
          <p className="text-slate-500">Inspect and edit course classroom locations</p>
        </div>
        <Button variant="ghost" onClick={() => loadCourses()} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {!token ? (
        <Card className="p-8 text-center text-slate-400">Enter your admin token in the Users page first.</Card>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-20 animate-pulse bg-slate-100" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No courses found.</Card>
      ) : (
        <div className="space-y-3">
          {courses.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.code} — {c.title}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {c.lecturer?.name || 'Unknown lecturer'} • {c.faculty_name || '—'} • {c.course_unit || '—'} units
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.location_name ? <Badge variant="outline">{c.location_name}</Badge> : null}
                    {c.location_latitude ? <Badge variant="outline">{Number(c.location_latitude).toFixed(4)}, {Number(c.location_longitude).toFixed(4)}</Badge> : null}
                    {c.location_radius_meters ? <Badge variant="outline">{c.location_radius_meters}m radius</Badge> : null}
                    {c.seating_capacity ? <Badge variant="outline">{c.seating_capacity} seats</Badge> : null}
                  </div>
                </div>
                <Badge variant={hasLocation(c) ? 'success' : 'warning'}>{hasLocation(c) ? 'Located' : 'No location'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  )
}
