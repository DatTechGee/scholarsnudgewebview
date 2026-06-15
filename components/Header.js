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
  const basePath = '/' + router.pathname.split('/').filter(Boolean)[0]
  const entry = breadcrumbMap[router.pathname]
  const label = entry?.label || (router.pathname.includes('/manage/') ? 'Manage Course' : router.pathname.includes('/sessions/') ? 'Session Detail' : 'Page')

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-surface-200 shrink-0 shadow-soft">
      <div>
        <h1 className="text-lg font-semibold text-surface-800">{label}</h1>
        <div className="flex items-center gap-1.5 text-xs text-surface-400 mt-0.5">
          <span className="capitalize">{basePath === '/' ? 'home' : basePath.replace('/', '')}</span>
          <span>/</span>
          <span className="text-surface-600 font-medium">{label.toLowerCase()}</span>
        </div>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            {user.role === 'super_admin' ? 'Super Admin' : user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-surface-800">{user.name}</div>
              <div className="text-xs text-surface-400">{user.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-200">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
