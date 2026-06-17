import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Button from '../../components/shadcn/Button'
import Badge from '../../components/shadcn/Badge'
import { getFaceStatus, registerFace } from '../../services/api'

export default function StudentFaceRegister() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [faceImage, setFaceImage] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [videoReady, setVideoReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingStatus, setExistingStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = window.localStorage.getItem('admin_token') || ''
    setToken(t)
    if (t) {
      getFaceStatus(t).then(d => {
        const st = d?.data || d || null
        setExistingStatus(st)
        if (st?.registered || st?.is_registered) {
          setSuccess('Your face is already registered. You can re-register below.')
        }
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

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
      setError('Camera access denied.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null) }
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

  const handleSubmit = async () => {
    if (!faceImage) { setError('Please capture your face first.'); return }
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const res = await registerFace(faceImage, token)
      setSuccess(res?.message || 'Face registered successfully!')
      setFaceImage(null)
      setFacePreview(null)
      const st = res?.data || {}
      setExistingStatus({ registered: true, ...st })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to register face.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Face Registration</h1>
        <p className="text-slate-500 text-sm mt-1">Register or update your face for biometric attendance</p>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div> : null}
      {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">{success}</div> : null}

      {loading ? (
        <Card className="p-12 text-center"><div className="animate-pulse h-8 w-48 bg-slate-200 rounded mx-auto" /></Card>
      ) : !token ? (
        <Card className="p-12 text-center text-slate-400">
          <p className="mb-4">Please sign in first.</p>
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        </Card>
      ) : (
        <div className="max-w-md mx-auto space-y-6">
          {existingStatus?.registered || existingStatus?.is_registered ? (
            <Card className="p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
              <div>
                <p className="font-semibold text-emerald-800">Face Registered</p>
                <p className="text-sm text-emerald-600">You can re-register to update your face data.</p>
              </div>
            </Card>
          ) : null}

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Capture Your Face</h2>

            {facePreview ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300">
                  <img src={facePreview} alt="Captured" className="w-full h-56 object-cover" />
                  <button type="button" onClick={removeFace}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-xl w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button onClick={startCamera} variant="outline" className="flex-1">Retake</Button>
                  <Button onClick={handleSubmit} disabled={busy} className="flex-1">
                    {busy ? 'Registering...' : 'Submit Face'}
                  </Button>
                </div>
              </div>
            ) : showCamera ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary-300 bg-black">
                <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setVideoReady(true)} className="w-full h-56 object-cover" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button type="button" onClick={captureFrame} disabled={!videoReady}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${videoReady ? 'bg-white text-slate-800 hover:bg-slate-100 active:scale-95' : 'bg-slate-500/50 text-slate-300 cursor-not-allowed'}`}
                  >{videoReady ? 'Capture' : 'Loading...'}</button>
                  <button type="button" onClick={stopCamera}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white hover:bg-slate-800 active:scale-95"
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={startCamera}
                className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl py-12 text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all active:scale-[0.98]"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span className="text-base font-bold">Open Camera to Capture Face</span>
                <span className="text-xs text-slate-400">Ensure your face is well-lit and clearly visible</span>
              </button>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Requirements</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Good lighting on your face
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Face clearly visible, no obstructions
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Look directly at the camera
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Remove glasses or mask if possible
              </li>
            </ul>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </Layout>
  )
}