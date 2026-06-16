import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { getStudentTimetable } from '../../services/api'

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function StudentTimetable() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) {
      getStudentTimetable(t).then(d => {
        const data = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
        setTimetable(data)
      }).catch(e => {
        setError(e?.response?.data?.message || 'Failed to load timetable.')
      }).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const dayIndex = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 }
  const grouped = {}
  dayNames.forEach(day => { grouped[day] = [] })
  timetable.forEach(s => {
    const d = s.day_of_week != null ? s.day_of_week : s.day
    const name = typeof d === 'number' ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d] || '' : d
    if (grouped[name] != null) grouped[name].push(s)
  })
  dayNames.forEach(day => {
    grouped[day].sort((a, b) => (a.start_time || a.time)?.localeCompare(b.start_time || b.time))
  })

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Timetable</h1>
        <p className="text-slate-500 text-sm">Your weekly class schedule</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {dayNames.map(d => (
            <Card key={d} className="p-4">
              <div className="h-5 w-20 bg-slate-200 rounded animate-pulse mb-4" />
              {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded animate-pulse mb-2" />)}
            </Card>
          ))}
        </div>
      ) : timetable.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">No timetable data available.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dayNames.map(day => {
            const slots = grouped[day]
            return (
              <Card key={day} className="p-4 border-t-4 border-t-blue-400">
                <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">{day}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-300 italic">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-sm font-bold text-slate-800">{s.course_code || s.course?.code || '—'}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {s.start_time?.slice(0, 5) || s.time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}
                        </div>
                        {s.room || s.location ? (
                          <Badge variant="outline" className="mt-1.5 text-xs">{s.room || s.location}</Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
