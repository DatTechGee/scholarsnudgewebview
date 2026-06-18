import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { getStudentTimetable } from '../../services/api'

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const dayColors = {
  Monday: { border: 'border-l-primary-500', bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  Tuesday: { border: 'border-l-secondary-500', bg: 'bg-secondary-50', text: 'text-secondary-700', dot: 'bg-secondary-500' },
  Wednesday: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Thursday: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Friday: { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
}

export default function StudentTimetable() {
  const router = useRouter()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
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

  if (!loading && timetable.length === 0 && error) {
    return (
      <Layout>
        <Card className="p-12 text-center">
          <svg className="w-12 h-12 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-surface-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-surface-800">My Timetable</h1>
        <p className="text-surface-500 text-sm">Your weekly class schedule</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dayNames.map(d => (
            <Card key={d} className="p-4">
              <div className="h-5 w-20 bg-surface-200 rounded animate-pulse mb-4" />
              {[1, 2].map(i => <div key={i} className="h-16 bg-surface-100 rounded animate-pulse mb-2" />)}
            </Card>
          ))}
        </div>
      ) : timetable.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-12 h-12 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-surface-400 text-sm">No timetable data available.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dayNames.map(day => {
            const slots = grouped[day]
            const colors = dayColors[day]
            return (
              <Card key={day} className={`p-4 border-l-4 ${colors.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <h3 className={`font-bold text-sm uppercase tracking-wide ${colors.text}`}>{day}</h3>
                </div>
                {slots.length === 0 ? (
                  <p className="text-xs text-surface-300 italic py-4 text-center">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map(s => (
                      <div key={s.id} className={`p-3 rounded-xl ${colors.bg} border border-surface-200/60`}>
                        <div className="text-sm font-bold text-surface-800">{s.course_code || s.course?.code || '—'}</div>
                        <div className="text-xs text-surface-500 mt-1 font-medium">
                          {s.start_time?.slice(0, 5) || s.time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}
                        </div>
                        {s.room || s.location ? (
                          <div className="mt-1.5">
                            <span className="text-[10px] font-bold text-surface-500 bg-white/80 px-2 py-0.5 rounded-md">
                              {s.room || s.location}
                            </span>
                          </div>
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
