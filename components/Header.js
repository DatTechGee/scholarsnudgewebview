import React from 'react'
import { useRouter } from 'next/router'

const breadcrumbMap = {
  '/': { label: 'Dashboard' },
  '/users': { label: 'All Users' },
  '/lecturers': { label: 'Lecturers' },
  '/students': { label: 'Students' },
  '/courses': { label: 'Courses' },
  '/sessions': { label: 'Sessions' },
  '/location': { label: 'Locations' },
  '/audit': { label: 'Audit Log' },
  '/register': { label: 'Register' },
  '/login': { label: 'Login' },
  '/student': { label: 'Dashboard' },
  '/student/courses': { label: 'My Courses' },
  '/student/attendance': { label: 'Attendance' },
  '/student/timetable': { label: 'Timetable' },
  '/student/profile': { label: 'Profile' },
  '/lecturer': { label: 'Dashboard' },
  '/lecturer/courses': { label: 'My Courses' },
  '/lecturer/sessions': { label: 'Sessions' },
  '/lecturer/attendance': { label: 'Attendance' },
  '/lecturer/timetable': { label: 'Timetable' },
  '/lecturer/venues': { label: 'Venues' },
  '/lecturer/shares': { label: 'Course Sharing' },
}

export default function Header({ user }) {
  const router = useRouter()
  const entry = breadcrumbMap[router.pathname]
  const label = entry?.label || (router.pathname.includes('/manage/') ? 'Manage Course' : 'Page')

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 bg-white border-b border-surface-200/60 shrink-0 shadow-soft">
      <div>
        <h1 className="text-lg font-bold text-surface-800">{label}</h1>
        <div className="flex items-center gap-1.5 text-xs text-surface-400 mt-0.5 font-medium">
          <span className="capitalize">{router.pathname.split('/').filter(Boolean)[0] || 'home'}</span>
          <span>/</span>
          <span className="text-surface-600 font-semibold">{label.toLowerCase()}</span>
        </div>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            {user.role === 'super_admin' ? 'Super Admin' : user.role}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-surface-800">{user.name}</div>
              <div className="text-xs font-medium text-surface-400">{user.email}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-extrabold text-sm shadow-glow">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
