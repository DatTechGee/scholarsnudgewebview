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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-800">Attendance Certificate</h1>
          <p className="text-surface-500 text-sm">Generate a certificate of attendance for any enrolled course</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Course Selector */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Select Course</label>
            <Select
              options={courses}
              value={selectedCourse}
              onChange={setSelectedCourse}
              placeholder={loading ? 'Loading...' : 'Choose a course'}
            />
          </div>
          <Button onClick={generate} disabled={busy || !selectedCourse}>
            {busy ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Generating...
              </span>
            ) : 'Generate Certificate'}
          </Button>
        </div>
      </Card>

      {/* Certificate */}
      {cert && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-box-green w-10 h-10">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-surface-800">Certificate Preview</h3>
                <p className="text-xs text-surface-400">{cert.course_code} — {cert.course_title}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={printCert}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </Button>
          </div>
          <div className="p-8 bg-surface-50/50">
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="border-2 border-double border-primary-800 p-8 m-4" style={{ fontFamily: 'Georgia, serif' }}>
                <div className="text-center">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <span className="text-white font-extrabold text-xl">SN</span>
                    </div>
                    <h1 className="text-3xl font-bold text-primary-800" style={{ fontFamily: 'Georgia, serif' }}>
                      Certificate of Attendance
                    </h1>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto mt-3" />
                  </div>

                  {/* Body */}
                  <p className="text-surface-500 mb-4">This certifies that</p>
                  <p className="text-2xl font-bold text-surface-800 mb-2">{cert.student_name}</p>
                  <p className="text-sm text-surface-400 mb-6">Matric Number: {cert.matric_number}</p>
                  <p className="text-surface-500 mb-4">has successfully attended</p>
                  <p className="text-lg font-bold text-primary-700 mb-1">{cert.course_code}</p>
                  <p className="text-surface-600 mb-6">{cert.course_title}</p>

                  {/* Stats */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-6">
                    <div className="px-6 py-3 rounded-xl border border-primary-200 bg-primary-50/50 text-center">
                      <div className="text-xs text-surface-500 uppercase tracking-wider font-medium">Sessions</div>
                      <div className="text-2xl font-bold text-primary-700 mt-1">{cert.total_sessions}</div>
                    </div>
                    <div className="px-6 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
                      <div className="text-xs text-surface-500 uppercase tracking-wider font-medium">Attended</div>
                      <div className="text-2xl font-bold text-emerald-700 mt-1">{cert.attended}</div>
                    </div>
                    <div className="px-6 py-3 rounded-xl border border-secondary-200 bg-secondary-50/50 text-center">
                      <div className="text-xs text-surface-500 uppercase tracking-wider font-medium">Rate</div>
                      <div className="text-2xl font-bold text-secondary-700 mt-1">{cert.percentage}%</div>
                    </div>
                  </div>

                  {/* Eligibility */}
                  {cert.eligible ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-sm font-bold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Eligible — meets 75% threshold
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-5 py-2 rounded-full text-sm font-bold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Below 75% threshold
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-surface-200">
                    <p className="text-xs text-surface-400">
                      Generated on {new Date(cert.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!cert && !busy && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-surface-800 mb-1">Generate Your Certificate</h3>
          <p className="text-surface-400 text-sm">Select a course above to generate your attendance certificate</p>
        </Card>
      )}
    </Layout>
  )
}
