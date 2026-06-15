import React from 'react'

export default function Header({ user }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">
          {user?.role === 'admin' ? 'Admin Portal' : 'Lecturer Portal'}
        </span>
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-400 capitalize">{user.role}{user.staff_id ? ` • ${user.staff_id}` : ''}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      ) : null}
    </header>
  )
}
