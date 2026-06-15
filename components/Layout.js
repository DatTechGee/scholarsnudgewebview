import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f3f6fb]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-extrabold text-xl shadow-glow-lg animate-pulse-soft">SN</div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isPublicPage = ['/login', '/register'].includes(router.pathname)

  if (isPublicPage) {
    return <div className="min-h-screen bg-[#f3f6fb]">{children}</div>
  }

  return (
    <div className="flex h-screen bg-[#f3f6fb]">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
