import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const { user, ready, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (ready && !user) { router.replace('/login') }
  }, [ready, user])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [router.pathname])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f6fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-400 font-medium">Loading...</p>
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
    <div className="flex h-screen bg-[#f3f6fb] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar user={user} onLogout={logout} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
