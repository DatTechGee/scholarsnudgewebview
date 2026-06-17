import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Badge from '../../components/shadcn/Badge'
import Button from '../../components/shadcn/Button'
import Input from '../../components/shadcn/Input'
import Modal from '../../components/shadcn/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/shadcn/Table'
import { getLecturerCourses, getCourseShares, shareCourse, removeCourseShare, getSharedCourses, getLecturerSwapRequestsReceived, respondLecturerSwapRequest } from '../../services/api'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-800">{value ?? '0'}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">{label}</div>
        </div>
        <div className="text-xl">{icon}</div>
      </div>
    </div>
  )
}

export default function LecturerShares() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [shares, setShares] = useState([])
  const [sharedCourses, setSharedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShareForm, setShowShareForm] = useState(false)
  const [lecturerEmail, setLecturerEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('my')
  const [swapRequests, setSwapRequests] = useState([])
  const [swapLoading, setSwapLoading] = useState(false)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) {
      Promise.all([
        getLecturerCourses(t).then(d => setCourses(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {}),
        getSharedCourses(t).then(d => setSharedCourses(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {}),
      ]).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const loadShares = useCallback(async () => {
    if (!selectedCourse || !token) return
    try {
      const data = await getCourseShares(selectedCourse, token)
      setShares(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setShares([]) }
  }, [selectedCourse, token])

  useEffect(() => { loadShares() }, [loadShares])

  const handleShare = async () => {
    if (!lecturerEmail.trim()) { setError('Lecturer email or ID required.'); return }
    setBusy(true); setError('')
    try {
      await shareCourse(selectedCourse, lecturerEmail.trim(), token)
      setShowShareForm(false); setLecturerEmail('')
      await loadShares()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to share course.')
    } finally { setBusy(false) }
  }

  const loadSwapRequests = useCallback(async () => {
    if (!token) return
    setSwapLoading(true)
    try {
      const data = await getLecturerSwapRequestsReceived(token)
      setSwapRequests(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (_) { setSwapRequests([]) }
    finally { setSwapLoading(false) }
  }, [token])

  useEffect(() => { if (tab === 'swaps') loadSwapRequests() }, [tab, loadSwapRequests])

  const handleRespondSwap = async (swapId, status) => {
    try {
      await respondLecturerSwapRequest(swapId, { status }, token)
      await loadSwapRequests()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to respond.')
    }
  }

  const handleRemoveShare = async (shareId) => {
    if (!window.confirm('Remove this shared access?')) return
    try {
      await removeCourseShare(selectedCourse, shareId, token)
      await loadShares()
    } catch (_) { setError('Failed to remove share.') }
  }

  if (!token) {
    return <Layout><Card className="p-8 text-center"><p className="text-slate-500 mb-4">Please sign in first.</p><Button onClick={() => router.push('/login')}>Sign In</Button></Card></Layout>
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Course Sharing</h1>
        <p className="text-slate-500 text-sm">Share your courses with other lecturers, view shared courses, and manage swap requests</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-red-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        <StatCard icon="📚" label="My Courses" value={courses.length} />
        <StatCard icon="🤝" label="Shared With Me" value={sharedCourses.length} />
        <StatCard icon="🔄" label="Swap Requests" value={swapRequests.length} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: 'my', label: 'My Shares', icon: '📤' },
          { key: 'shared', label: 'Shared With Me', icon: '📥', count: sharedCourses.length },
          { key: 'swaps', label: 'Swap Requests', icon: '🔄', count: swapRequests.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          ><span>{t.icon}</span> {t.label}{t.count > 0 ? <Badge variant="info" className="ml-1 text-[10px]">{t.count}</Badge> : null}</button>
        ))}
      </div>

      {tab === 'swaps' ? (
        <div>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs">🔄</span>
            Swap Requests Received
          </h3>
          {swapLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Card key={i} className="h-24 animate-pulse bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl" />)}</div>
          ) : swapRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-slate-400 font-medium">No swap requests received.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {swapRequests.map(sr => (
                <Card key={sr.id} className="p-5 border-l-4 border-l-amber-400 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 text-sm">🔄</div>
                        <div>
                          <div className="font-bold text-slate-800">{sr.course?.code || sr.course_name || '—'}</div>
                          <div className="text-xs text-slate-400">Requested swap</div>
                        </div>
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        <div>
                          <div className="font-bold text-slate-800">{sr.requested_course?.code || sr.requested_course_name || '—'}</div>
                          <div className="text-xs text-slate-400">Requested course</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>From: <span className="font-medium text-slate-700">{sr.requester?.name || '—'}</span></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{sr.requester?.email || '—'}</span>
                      </div>
                      {sr.notes && <div className="mt-2 text-sm text-slate-500 italic bg-slate-50 rounded-lg p-2.5 border">"{sr.notes}"</div>}
                      <div className="text-xs text-slate-400 mt-2">{sr.created_at ? new Date(sr.created_at).toLocaleDateString() : '—'}</div>
                    </div>
                    <div className="flex gap-2 shrink-0 pt-1">
                      {sr.status === 'pending' ? (
                        <>
                          <button onClick={() => handleRespondSwap(sr.id, 'approved')}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                          ><svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Accept</button>
                          <button onClick={() => handleRespondSwap(sr.id, 'rejected')}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all"
                          ><svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> Reject</button>
                        </>
                      ) : (
                        <Badge variant={sr.status === 'approved' ? 'success' : sr.status === 'rejected' ? 'danger' : 'warning'} className="uppercase text-[10px] font-bold">{sr.status}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'shared' ? (
        <div>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs">📥</span>
            Courses Shared With You
          </h3>
          {sharedCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-slate-400 font-medium">No courses have been shared with you yet.</p>
              <p className="text-xs text-slate-400 mt-2">When another lecturer shares a course with you, it will appear here.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sharedCourses.map(s => (
                <Card key={s.id} className="p-5 border-l-4 border-l-purple-400 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-purple-600 font-bold text-sm">{s.course?.code?.charAt(0) || '?'}</div>
                      <div>
                        <div className="font-bold text-slate-800">{s.course?.code || '—'} — {s.course?.title || '—'}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Shared by: <span className="font-medium text-slate-600">{s.shared_by?.name || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="info" className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Shared
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Gradient course selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
            {courses.map((c, i) => {
              const gradients = ['from-blue-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600']
              const g = gradients[i % gradients.length]
              return (
                <button key={c.id} onClick={() => setSelectedCourse(c.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${selectedCourse === c.id ? `bg-gradient-to-r ${g} text-white shadow-lg scale-105` : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'}`}
                >{c.title ? `${c.code} - ${c.title}` : c.code}</button>
              )
            })}
          </div>

          {!selectedCourse ? (
            <Card className="p-16 text-center">
              <div className="text-4xl mb-4">👆</div>
              <p className="text-slate-400 font-medium">Select a course to manage sharing.</p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs">📚</span>
                  {courses.find(c => c.id === selectedCourse)?.code || 'Course'}
                  <span className="text-sm font-normal text-slate-400">— Shared Lecturers</span>
                  {shares.length > 0 && <Badge variant="info" className="ml-1">{shares.length}</Badge>}
                </h3>
                <button onClick={() => setShowShareForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all"
                ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Share Course</button>
              </div>

              {shares.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-4xl mb-4">🔗</div>
                  <p className="text-slate-400 font-medium">This course hasn't been shared with anyone.</p>
                  <button onClick={() => setShowShareForm(true)}
                    className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 mx-auto"
                  ><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Share with a colleague</button>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden rounded-2xl border">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th><span className="flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Lecturer</span></Th>
                        <Th>Email</Th>
                        <Th>Shared At</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {shares.map(s => (
                        <Tr key={s.id}>
                          <Td className="font-medium"><span className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{s.shared_with?.name?.charAt(0) || '?'}</div> {s.shared_with?.name || '—'}</span></Td>
                          <Td className="text-sm text-slate-500">{s.shared_with?.email || '—'}</Td>
                          <Td className="text-sm text-slate-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                          </Td>
                          <Td>
                            <button onClick={() => handleRemoveShare(s.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-1"
                            ><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Revoke</button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Card>
              )}
            </>
          )}

          <Modal open={showShareForm} onClose={() => setShowShareForm(false)} title="Share Course">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">🔗</div>
                <div>
                  <div className="font-bold text-sm text-slate-800">
                    {courses.find(c => c.id === selectedCourse)?.code || 'Course'}
                  </div>
                  <div className="text-xs text-slate-500">Sharing with a colleague</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700">Lecturer Email or ID</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <Input value={lecturerEmail} onChange={(e) => setLecturerEmail(e.target.value)} placeholder="Enter lecturer email or ID" className="pl-10" />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  The lecturer will gain full access to this course including attendance, sessions, and roster.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleShare} disabled={busy} className="flex-1 h-10">{busy ? 'Sharing...' : 'Share Course'}</Button>
                <Button variant="ghost" onClick={() => setShowShareForm(false)} className="h-10">Cancel</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </Layout>
  )
}
