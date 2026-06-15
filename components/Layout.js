import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const { user, ready, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login')
    }
  }, [ready, user])

  if (!ready) return null
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
