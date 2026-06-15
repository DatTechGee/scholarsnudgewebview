import React, { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext({ user: null, loading: true, logout: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null
    if (token) {
      let cancelled = false
      const timer = setTimeout(() => { if (!cancelled) { setLoading(false) } }, 3000)
      getMe(token).then(res => {
        if (cancelled) return
        const me = res?.data || res || {}
        setUser({
          name: me.name || 'User',
          role: me.role || 'lecturer',
          email: me.email,
          id: me.id,
          staff_id: me.staff_id,
          matric_number: me.matric_number,
          faculty: me.faculty,
          faculty_name: me.faculty_name,
          department_name: me.department_name,
          profile_image_url: me.profile_image_url,
        })
      }).catch(() => {
        if (cancelled) return
        window.localStorage.removeItem('admin_token')
      }).finally(() => {
        clearTimeout(timer)
        if (!cancelled) setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    window.localStorage.removeItem('admin_token')
    window.localStorage.removeItem('user_role')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
