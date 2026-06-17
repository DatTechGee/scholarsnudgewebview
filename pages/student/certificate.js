import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Button from '../../components/shadcn/Button'
import Select from '../../components/shadcn/Select'
import { getStudentAttendanceReport, getAttendanceCertificate } from '../../services/api'

export default function StudentCertificate() {
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const getToken = useCallback(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') || '' : ''
    setToken(t)
    return t
  }, [])

  const loadCourses = useCallback(async (t) => {
    if (!t) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await getStudentAttendanceReport(t)
      const report = data?.data || data || {}
      const list = report?.report || report?.courses || report?.course_breakdown || []
      setCourses(list.map(c => ({
        value: String(c.id || c.course_id || ''),
        label: `${c.code || c.course_code || 'Unknown'} — ${c.title || c.course_name || ''}`,
      })).filter(c => c.value))
    } catch {
      setError('Failed to load courses.')
    } finally { setLoading(false) }
  }, [])

  const generate = async () => {
    if (!selectedCourse) return
    setBusy(true); setError(''); setCert(null)
    try {
      const res = await getAttendanceCertificate(selectedCourse, token)
      setCert(res)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate certificate.')
    } finally { setBusy(false) }
  }

  const printCert = () => {
    if (!cert?.html) return
    const win = window.open('', '_blank')
    win.document.write(cert.html)
    win.document.close()
    win.print()
  }

  useEffect(() => {
    const t = getToken()
    if (t) loadCourses(t)
    else setLoading(false)
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Certificate</h1>
          <p className="text-slate-500 text-sm">Generate a certificate of attendance for any enrolled course</p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : null}

      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Course</label>
            <Select
              options={courses}
              value={selectedCourse}
              onChange={setSelectedCourse}
              placeholder={loading ? 'Loading...' : 'Choose a course'}
            />
          </div>
          <Button onClick={generate} disabled={busy || !selectedCourse}>
            {busy ? 'Generating...' : 'Generate Certificate'}
          </Button>
        </div>
      </Card>

      {cert ? (
        <Card>
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={printCert}>Print / PDF</Button>
          </div>
          <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-white" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="text-center border-2 border-double border-blue-800 p-8">
              <h1 className="text-2xl text-blue-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Certificate of Attendance</h1>
              <p className="text-sm text-slate-500 mb-6">This certifies that</p>
              <p className="text-xl font-bold mb-2">{cert.student_name}</p>
              <p className="text-xs text-slate-500 mb-4">Matric Number: {cert.matric_number}</p>
              <p className="text-sm text-slate-600 mb-2">has attended</p>
              <p className="text-base font-semibold mb-1">{cert.course_code} &mdash; {cert.course_title}</p>
              <p className="text-xs text-slate-500 mb-4">{cert.attended} of {cert.total_sessions} sessions ({cert.percentage}%)</p>
              <div className="flex justify-center gap-4 mb-4">
                <div className="border border-slate-300 rounded-lg px-4 py-2 text-center">
                  <div className="text-xs text-slate-500 uppercase">Sessions</div>
                  <div className="text-lg font-bold text-blue-800">{cert.total_sessions}</div>
                </div>
                <div className="border border-slate-300 rounded-lg px-4 py-2 text-center">
                  <div className="text-xs text-slate-500 uppercase">Attended</div>
                  <div className="text-lg font-bold text-blue-800">{cert.attended}</div>
                </div>
                <div className="border border-slate-300 rounded-lg px-4 py-2 text-center">
                  <div className="text-xs text-slate-500 uppercase">Rate</div>
                  <div className="text-lg font-bold text-blue-800">{cert.percentage}%</div>
                </div>
              </div>
              <p className="text-xs text-slate-400">Generated on {new Date(cert.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {cert.eligible ? (
                <div className="mt-4 inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold">Eligible &mdash; meets 75% threshold</div>
              ) : (
                <div className="mt-4 inline-block bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold">Below 75% threshold</div>
              )}
            </div>
          </div>
        </Card>
      ) : null}
    </Layout>
  )
}
