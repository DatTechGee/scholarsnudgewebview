import { useState, useRef, useCallback, useEffect } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [matricNumber, setMatricNumber] = useState('')
  const [lecturerId, setLecturerId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')

  const [faceImage, setFaceImage] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  const startCamera = useCallback(async () => {
    setError('')
    setVideoReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      setCameraStream(stream)
      setShowCamera(true)
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
    setVideoReady(false)
  }, [cameraStream])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !videoReady) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setFacePreview(canvas.toDataURL('image/jpeg', 0.9))
    canvas.toBlob((blob) => {
      if (blob) {
        setFaceImage(new File([blob], 'face.jpg', { type: 'image/jpeg' }))
      }
    }, 'image/jpeg', 0.9)
    stopCamera()
  }, [stopCamera, videoReady])

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
    if (role === 'student' && !faceImage) {
      setError('Face capture is required for student registration. Please capture or upload your photo.')
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
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-500/5 blur-3xl" />
      </div>

      <Card glass className="w-full max-w-lg p-8 animate-slide-up relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-secondary-500 flex items-center justify-center mx-auto mb-3 shadow-glow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-heading2 text-surface-800">Create Account</h1>
          <p className="text-surface-500 mt-1 text-sm font-medium">Join Scholars Nudge</p>
        </div>

        {error ? (
          <div className="alert-box bg-red-50 border-red-200 text-red-700 mb-4">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="alert-box bg-emerald-50 border-emerald-200 text-emerald-700 mb-4">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{success}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1.5 bg-surface-100 rounded-2xl">
            {['student', 'lecturer'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${role === r ? 'bg-white text-surface-800 shadow-soft' : 'text-surface-500 hover:text-surface-700'}`}
              >{r === 'student' ? 'Student' : 'Lecturer'}</button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">Password</label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-all"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {role === 'student' ? (
            <div>
              <label className="block text-sm font-bold text-surface-700 mb-1.5">Matric Number</label>
              <Input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="e.g. CSC/2020/001" required />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-surface-700 mb-1.5">Lecturer / Staff ID</label>
              <Input value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} placeholder="e.g. LEC/001" required />
            </div>
          )}

          {role === 'student' && (
            <div className="border-t border-surface-200 pt-4">
              <label className="block text-sm font-bold text-surface-700 mb-3">Face Registration <span className="text-xs font-bold text-red-500">(required)</span></label>

              {facePreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-surface-200">
                  <img src={facePreview} alt="Captured face" className="w-full h-48 object-cover" />
                  <button type="button" onClick={removeFace}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 shadow-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : showCamera ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary-300 bg-black">
                  <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setVideoReady(true)} className="w-full h-48 object-cover" />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    <button type="button" onClick={captureFrame} disabled={!videoReady}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${videoReady ? 'bg-white text-surface-800 hover:bg-surface-100 active:scale-95' : 'bg-surface-500/50 text-surface-300 cursor-not-allowed'}`}
                    >{videoReady ? 'Capture' : 'Loading...'}</button>
                    <button type="button" onClick={stopCamera}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold bg-surface-800/60 text-white hover:bg-surface-800 active:scale-95"
                    >Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={startCamera}
                  className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-surface-300 rounded-2xl py-8 text-surface-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all active:scale-[0.98]"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-bold">Open Camera to Capture Face</span>
                </button>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <Button type="submit" className="w-full h-[52px] text-base" disabled={busy}>
            {busy ? 'Creating Account...' : `Create ${role === 'student' ? 'Student' : 'Lecturer'} Account`}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-surface-500 font-medium">
            <a href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-bold">Forgot Password?</a>
          </p>
          <p className="text-sm text-surface-500 font-medium">
            Already have an account? <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold">Sign in</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
