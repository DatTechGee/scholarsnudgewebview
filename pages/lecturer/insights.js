import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import { getLecturerCourses, getCourseAttendance, getCourseAnalytics, getCourseRoster } from '../../services/api'

function PatternCard({ icon, title, description, students, color, action }) {
  return (
    <Card className="p-5 border-l-4 transition-all duration-300 hover:shadow-lg group" style={{ borderLeftColor: color }}>
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
          {students && students.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {students.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                    {(s.name || '?').charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700 truncate">{s.name || s.student_name}</span>
                  {s.count != null && (
                    <Badge variant="warning" className="ml-auto text-[10px]">{s.count}x</Badge>
                  )}
                </div>
              ))}
              {students.length > 5 && (
                <p className="text-[10px] text-slate-400 font-medium mt-1">+{students.length - 5} more</p>
              )}
            </div>
          )}
          {action && (
            <button onClick={action} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              {action.label}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function SuggestionCard({ icon, title, description, priority, action }) {
  const colors = { high: 'red', medium: 'amber', low: 'blue' }
  const c = colors[priority] || 'blue'
  return (
    <div className={`p-4 rounded-2xl border bg-${c}-50/50 border-${c}-200/50 transition-all hover:shadow-md group`}>
      <div className="flex items-start gap-3">
        <div className="text-xl shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
            <Badge variant={priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'info'} className="text-[10px] uppercase">{priority}</Badge>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          {action && (
            <button onClick={action} className="mt-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              {action.label}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-800">{value ?? '—'}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">{label}</div>
          {sub ? <div className="text-[10px] font-medium text-slate-400 mt-0.5">{sub}</div> : null}
        </div>
        <div className="text-xl">{icon}</div>
      </div>
    </div>
  )
}

function detectPatterns(attendance, roster) {
  const patterns = []

  // Student attendance counts
  const studentMap = {}
  attendance.forEach(a => {
    const sid = a.student_id
    if (!studentMap[sid]) {
      studentMap[sid] = { id: sid, name: a.student?.name || a.student_name, matric: a.student?.matric_number, total: 0, late: 0, present: 0, absent: 0, invalid: 0, records: [] }
    }
    studentMap[sid].total++
    studentMap[sid].records.push(a)
    if (a.is_late || a.status === 'late') studentMap[sid].late++
    if (a.status === 'present' || a.status === 'verified') studentMap[sid].present++
    if (a.status === 'absent') studentMap[sid].absent++
    if (a.status === 'invalid') studentMap[sid].invalid++
  })

  const students = Object.values(studentMap)

  // Always late
  const alwaysLate = students.filter(s => s.total >= 3 && s.late / s.total >= 0.6).sort((a, b) => b.late - a.late)
  if (alwaysLate.length > 0) {
    patterns.push({ icon: '⏰', title: 'Always Late', description: `${alwaysLate.length} student${alwaysLate.length > 1 ? 's' : ''} arrive${alwaysLate.length === 1 ? 's' : ''} late 60%+ of the time`, students: alwaysLate.map(s => ({ name: s.name, count: s.late })), color: '#f59e0b' })
  }

  // Never attended / never checked in
  const neverAttended = roster.filter(r => !studentMap[r.user_id || r.student_id] && (r.name || r.student_name)).slice(0, 10)
  if (neverAttended.length > 0) {
    patterns.push({ icon: '🚫', title: 'Never Checked In', description: `${neverAttended.length} student${neverAttended.length > 1 ? 's' : ''} on roster but have never checked in`, students: neverAttended.map(s => ({ name: s.name || s.student_name })), color: '#ef4444' })
  }

  // Attendance drop (last 2 sessions compared to before)
  if (attendance.length >= 6) {
    const recentIds = [...new Set(attendance.slice(-6).map(a => a.attendance_session_id))]
    const dropCount = students.filter(s => {
      const recs = s.records.sort((a, b) => new Date(b.checked_in_at || 0) - new Date(a.checked_in_at || 0))
      const recent = recs.filter(r => recentIds.includes(r.attendance_session_id))
      const earlier = recs.filter(r => !recentIds.includes(r.attendance_session_id))
      if (earlier.length < 2 || recent.length < 2) return false
      const earlierRate = earlier.filter(r => r.status === 'present' || r.status === 'verified').length / earlier.length
      const recentRate = recent.filter(r => r.status === 'present' || r.status === 'verified').length / recent.length
      return earlierRate - recentRate > 0.3
    })
    if (dropCount.length > 0) {
      patterns.push({ icon: '📉', title: 'Attendance Dropping', description: `${dropCount.length} student${dropCount.length > 1 ? 's' : ''} attendance dropped 30%+ recently`, students: dropCount.map(s => ({ name: s.name })), color: '#8b5cf6' })
    }
  }

  // Invalid check-ins (suspicious)
  const invalidCount = students.filter(s => s.invalid > 0)
  if (invalidCount.length > 0) {
    patterns.push({ icon: '⚠️', title: 'Suspicious Check-ins', description: `${invalidCount.length} student${invalidCount.length > 1 ? 's' : ''} had invalid check-ins flagged`, students: invalidCount.sort((a, b) => b.invalid - a.invalid).map(s => ({ name: s.name, count: s.invalid })), color: '#ef4444' })
  }

  return patterns
}

function generateSuggestions(patterns, analytics) {
  const suggestions = []

  if (patterns.some(p => p.icon === '⏰')) {
    suggestions.push({ icon: '💡', title: 'Late Arrival Alert', description: 'Send a broadcast reminder to always-late students about session start times.', priority: 'medium', action: { label: 'Send Reminder' } })
  }

  if (patterns.some(p => p.icon === '🚫')) {
    suggestions.push({ icon: '📢', title: 'Engage Missing Students', description: 'Contact students on the roster who have never checked in. They may have dropped the course or be unaware of sessions.', priority: 'high', action: { label: 'View List' } })
  }

  if (patterns.some(p => p.icon === '📉')) {
    suggestions.push({ icon: '📊', title: 'Attendance Decline Detected', description: 'Several students show declining attendance. Consider reviewing session timing or reaching out individually.', priority: 'high' })
  }

  if (analytics?.average_attendance != null && analytics.average_attendance < 60) {
    suggestions.push({ icon: '🔴', title: 'Critically Low Attendance', description: `Course average is ${analytics.average_attendance}%. Consider scheduling a make-up session or adjusting the schedule.`, priority: 'high' })
  }

  if (analytics?.average_attendance != null && analytics.average_attendance >= 85) {
    suggestions.push({ icon: '🌟', title: 'Excellent Attendance', description: `Course average is ${analytics.average_attendance}%. Great engagement from your students!`, priority: 'low' })
  }

  if (patterns.some(p => p.icon === '⚠️')) {
    suggestions.push({ icon: '🔍', title: 'Review Suspicious Check-ins', description: 'Students with invalid status may have used mock locations or device workarounds. Review and take action.', priority: 'high', action: { label: 'Review Now' } })
  }

  return suggestions
}

export default function LecturerInsights() {
  const router = useRouter()
  const { course_id } = router.query
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [roster, setRoster] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('patterns')

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (!t) { setLoading(false); return }
    getLecturerCourses(t).then(d => {
      const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []
      setCourses(list)
      if (course_id) loadData(Number(course_id), t)
      else setLoading(false)
    }).catch(() => setLoading(false))
  }, [course_id])

  const loadData = async (courseId, t) => {
    const tk = t || token
    if (!courseId || !tk) return
    setSelectedCourse(courseId)
    setLoading(true)
    try {
      const [att, an, ros] = await Promise.all([
        getCourseAttendance(courseId, tk).catch(() => null),
        getCourseAnalytics(courseId, tk).catch(() => null),
        getCourseRoster(courseId, tk).catch(() => null),
      ])
      setAttendance(Array.isArray(att?.data) ? att.data : Array.isArray(att) ? att : [])
      setAnalytics(an?.data || an || null)
      setRoster(Array.isArray(ros?.data) ? ros.data : Array.isArray(ros) ? ros : [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  const patterns = useMemo(() => detectPatterns(attendance, roster), [attendance, roster])
  const suggestions = useMemo(() => generateSuggestions(patterns, analytics), [patterns, analytics])
  const totalStudents = roster.length || new Set(attendance.map(a => a.student_id)).size
  const totalSessions = new Set(attendance.map(a => a.attendance_session_id)).size
  const avgAttendance = analytics?.average_attendance != null ? analytics.average_attendance : attendance.length > 0 && totalSessions > 0 ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'verified').length / (totalSessions * totalStudents)) * 100) : null

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Class Insights</h1>
        <p className="text-slate-500 text-sm">AI-powered attendance patterns, trends, and recommendations</p>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => loadData(c.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${selectedCourse === c.id ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm'}`}
          >{c.code} {c.title ? `- ${c.title}` : ''}</button>
        ))}
      </div>

      {!selectedCourse ? (
        <Card className="p-16 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-400 font-medium">Select a course to view insights.</p>
        </Card>
      ) : loading ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <Card key={i} className="h-24 animate-pulse bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl" />)}</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            <StatCard label="Total Students" value={totalStudents} icon="👥" color="#3b82f6" sub={roster.length ? `${roster.length} on roster` : ''} />
            <StatCard label="Total Sessions" value={totalSessions} icon="📋" color="#10b981" />
            <StatCard label="Avg Attendance" value={avgAttendance != null ? `${avgAttendance}%` : '—'} icon="📊" color={avgAttendance != null && avgAttendance >= 75 ? '#10b981' : avgAttendance != null && avgAttendance >= 50 ? '#f59e0b' : '#ef4444'} />
            <StatCard label="Patterns Found" value={patterns.length} icon="🔍" color="#8b5cf6" />
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
            <button onClick={() => setView('patterns')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'patterns' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Patterns
            </button>
            <button onClick={() => setView('suggestions')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'suggestions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI Suggestions ({suggestions.length})
            </button>
          </div>

          {view === 'patterns' ? (
            patterns.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {patterns.map((p, i) => <PatternCard key={i} {...p} />)}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-slate-500 font-medium">No significant patterns detected.</p>
                <p className="text-xs text-slate-400 mt-2">As more attendance data is collected, patterns will appear here.</p>
              </Card>
            )
          ) : (
            suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((s, i) => <SuggestionCard key={i} {...s} />)}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">🧠</div>
                <p className="text-slate-500 font-medium">No suggestions yet.</p>
                <p className="text-xs text-slate-400 mt-2">AI suggestions will appear based on attendance patterns and trends.</p>
              </Card>
            )
          )}
        </>
      )}
    </Layout>
  )
}
