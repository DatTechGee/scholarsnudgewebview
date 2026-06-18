import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/shadcn/Card'
import Button from '../../components/shadcn/Button'

export default function StudentFaceRegister() {
  const router = useRouter()

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Face Registration</h1>
        <p className="text-slate-500 text-sm mt-1">Register your face for biometric attendance</p>
      </div>

      <Card className="max-w-md mx-auto p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Use the Mobile App</h2>
        <p className="text-slate-500 text-sm mb-6">
          Face registration is only available on the mobile app for security reasons.
          Please open the ScholarsNudge app and register your face there.
        </p>
        <Button variant="outline" onClick={() => router.push('/student/profile')}>
          Back to Profile
        </Button>
      </Card>
    </Layout>
  )
}
