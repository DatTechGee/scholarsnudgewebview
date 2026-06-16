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
    setBusy(true)
    setError('')
    try {
      await shareCourse(selectedCourse, lecturerEmail.trim(), token)
      setShowShareForm(false)
      setLecturerEmail('')
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

  useEffect(() => {
    if (tab === 'swaps') loadSwapRequests()
  }, [tab, loadSwapRequests])

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
        <p className="text-slate-500 text-sm">Share your courses with other lecturers and view courses shared with you</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}

      <div className="flex gap-2 mb-6 flex-wrap">
        {['my', 'shared', 'swaps'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
          >{t === 'my' ? 'My Shares' : t === 'shared' ? 'Shared With Me' : 'Swap Requests'}{t === 'shared' && sharedCourses.length > 0 ? ` (${sharedCourses.length})` : ''}{t === 'swaps' && swapRequests.length > 0 ? ` (${swapRequests.length})` : ''}</button>
        ))}
      </div>

      {tab === 'swaps' ? (
        <div>
          <h3 className="font-semibold text-slate-700 mb-4">Swap Requests Received</h3>
          {swapLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : swapRequests.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No swap requests received.</Card>
          ) : (
            <div className="grid gap-4">
              {swapRequests.map(sr => (
                <Card key={sr.id} className="p-4 border-l-4 border-l-amber-400">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">{sr.course?.code || sr.course_name || '—'} &rarr; {sr.requested_course?.code || sr.requested_course_name || '—'}</div>
                      <div className="text-sm text-slate-500 mt-1">From: {sr.requester?.name || '—'} ({sr.requester?.email || '—'})</div>
                      {sr.notes && <div className="text-sm text-slate-500 mt-1 italic">"{sr.notes}"</div>}
                      <div className="text-xs text-slate-400 mt-1">{sr.created_at ? new Date(sr.created_at).toLocaleDateString() : '—'}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {sr.status === 'pending' ? (
                        <>
                          <Button onClick={() => handleRespondSwap(sr.id, 'approved')} size="sm">
                            Accept
                          </Button>
                          <Button onClick={() => handleRespondSwap(sr.id, 'rejected')} variant="destructive" size="sm">
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Badge variant={sr.status === 'approved' ? 'success' : sr.status === 'rejected' ? 'danger' : 'warning'}>
                          {sr.status}
                        </Badge>
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
          <h3 className="font-semibold text-slate-700 mb-4">Courses Shared With You</h3>
          {sharedCourses.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">No courses have been shared with you yet.</Card>
          ) : (
            <div className="grid gap-4">
              {sharedCourses.map(s => (
                <Card key={s.id} className="p-4 border-l-4 border-l-purple-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.course?.code || '—'} — {s.course?.title || '—'}</div>
                      <div className="text-sm text-slate-500">Shared by: {s.shared_by?.name || '—'} ({s.shared_by?.email || '—'})</div>
                    </div>
                    <Badge variant="info">Shared</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {courses.map(c => (
              <button key={c.id} onClick={() => setSelectedCourse(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCourse === c.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
              >{c.code}</button>
            ))}
          </div>

          {!selectedCourse ? (
            <Card className="p-12 text-center text-slate-400">Select a course to manage sharing.</Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">
                  {courses.find(c => c.id === selectedCourse)?.code || 'Course'} — Shared Lecturers
                </h3>
                <Button onClick={() => setShowShareForm(true)}>Share Course</Button>
              </div>

              {shares.length === 0 ? (
                <Card className="p-8 text-center text-slate-400">This course hasn't been shared with anyone.</Card>
              ) : (
                <Card className="p-0">
                  <Table>
                    <Thead><Tr><Th>Lecturer</Th><Th>Email</Th><Th>Shared At</Th><Th></Th></Tr></Thead>
                    <Tbody>
                      {shares.map(s => (
                        <Tr key={s.id}>
                          <Td className="font-medium">{s.shared_with?.name || '—'}</Td>
                          <Td className="text-sm text-slate-500">{s.shared_with?.email || '—'}</Td>
                          <Td className="text-sm text-slate-500">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</Td>
                          <Td><Button variant="destructive" onClick={() => handleRemoveShare(s.id)}>Revoke</Button></Td>
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
              <div>
                <label className="block text-sm font-medium mb-1">Lecturer Email or ID</label>
                <Input value={lecturerEmail} onChange={(e) => setLecturerEmail(e.target.value)} placeholder="Enter lecturer email or ID" />
                <p className="text-xs text-slate-400 mt-1">The lecturer will gain full access to this course including attendance.</p>
              </div>
              <Button onClick={handleShare} disabled={busy}>{busy ? 'Sharing...' : 'Share Course'}</Button>
            </div>
          </Modal>
        </>
      )}
    </Layout>
  )
}
