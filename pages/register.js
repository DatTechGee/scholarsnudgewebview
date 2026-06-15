import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Card from '../components/shadcn/Card'
import Button from '../components/shadcn/Button'
import Input from '../components/shadcn/Input'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://scholarsnudge.com/api'

export default function Register() {
  const router = useRouter()
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [lecturerId, setLecturerId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')

  const [faceImage, setFaceImage] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      setCameraStream(stream)
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setError('Camera access denied. You can upload a photo instead.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }, [cameraStream])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'face.jpg', { type: 'image/jpeg' })
        setFaceImage(file)
        setFacePreview(URL.createObjectURL(blob))
      }
    }, 'image/jpeg', 0.9)
    stopCamera()
  }, [stopCamera])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFaceImage(file)
      setFacePreview(URL.createObjectURL(file))
    }
  }

  const removeFace = () => {
    if (facePreview) URL.revokeObjectURL(facePreview)
    setFaceImage(null)
    setFacePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    stopCamera()

    if (!name || !email || !password) {
      setError('Name, email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (role === 'student' && !matricNumber) {
      setError('Students must provide their matric number.')
      return
    }
    if (role === 'lecturer' && !lecturerId) {
      setError('Lecturers must provide a lecturer ID.')
      return
    }

    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('role', role)
      if (role === 'student') fd.append('matric_number', matricNumber.trim().toUpperCase())
      if (role === 'lecturer') fd.append('lecturer_id', lecturerId.trim())
      if (faceImage) fd.append('face', faceImage)

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Registration failed')

      const token = data?.token
      if (token) {
        window.localStorage.setItem('admin_token', token)
        window.localStorage.setItem('user_role', data?.user?.role || role)
        window.localStorage.setItem('user_name', data?.user?.name || name)
      }

      setSuccess((data?.message || 'Account created!') + (data?.user?.role === 'student' ? ' Face registered. Await admin verification.' : ''))
      setTimeout(() => {
        const userRole = data?.user?.role || role
        if (userRole === 'admin' || userRole === 'super_admin') router.push('/')
        else if (userRole === 'student') router.push('/student')
        else router.push('/lecturer')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 p-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-lg rounded-2xl border-0">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Join Scholars Nudge</p>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2"><svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>{error}</div> : null}
        {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">{success}</div> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {['student', 'lecturer'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${role === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >{r === 'student' ? 'Student' : 'Lecturer'}</button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} />
          </div>

          {role === 'student' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Matric Number *</label>
              <Input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="e.g. CSC/2020/001" required />
              <p className="text-xs text-amber-600 mt-1">Your lecturer must add you to a course roster first before you can register.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lecturer / Staff ID *</label>
              <Input value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} placeholder="e.g. LEC/001" required />
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Face Registration <span className="text-xs text-slate-400">(optional but recommended)</span></label>

            {facePreview ? (
              <div className="relative">
                <img src={facePreview} alt="Captured face" className="w-full h-48 object-cover rounded-xl border" />
                <button type="button" onClick={removeFace}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600"
                >✕</button>
              </div>
            ) : showCamera ? (
              <div className="relative rounded-xl overflow-hidden border bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button type="button" onClick={captureFrame}
                    className="bg-white text-slate-800 px-5 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-slate-100"
                  >Capture</button>
                  <button type="button" onClick={stopCamera}
                    className="bg-slate-700/80 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-700"
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={startCamera}
                  className="flex-1 border-2 border-dashed border-slate-300 rounded-xl py-8 text-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-medium">Open Camera</span>
                </button>
                <label className="flex-1 border-2 border-dashed border-slate-300 rounded-xl py-8 text-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium">Upload Photo</span>
                  <input type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <Button type="submit" className="w-full justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-200" disabled={busy}>
            {busy ? 'Creating Account...' : `Create ${role === 'student' ? 'Student' : 'Lecturer'} Account`}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
