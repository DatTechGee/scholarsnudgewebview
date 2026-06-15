import React, { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext({ user: null, ready: false, logout: () => {} })

function parseUser(raw) {
  if (!raw) return null
  return {
    name: raw.name || 'User',
    role: raw.role || 'lecturer',
    email: raw.email,
    id: raw.id,
    staff_id: raw.staff_id,
    matric_number: raw.matric_number,
    faculty: raw.faculty,
    faculty_name: raw.faculty_name,
    department_name: raw.department_name,
    profile_image_url: raw.profile_image_url,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = window.localStorage.getItem('admin_token')

    if (token) {
      try {
        const cached = JSON.parse(window.localStorage.getItem('user_data') || 'null')
        if (cached) setUser(parseUser(cached))
      } catch (_) {}

      getMe(token).then(res => {
        const me = res?.data || res || {}
        const parsed = parseUser(me)
        if (parsed) {
          setUser(parsed)
          window.localStorage.setItem('user_data', JSON.stringify(parsed))
        }
      }).catch(() => {
        window.localStorage.removeItem('admin_token')
        window.localStorage.removeItem('user_data')
        window.localStorage.removeItem('user_role')
        setUser(null)
      })
    }

    setReady(true)
  }, [])

  const logout = () => {
    window.localStorage.removeItem('admin_token')
    window.localStorage.removeItem('user_role')
    window.localStorage.removeItem('user_data')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

// Helper to redirect unauthenticated users (use in page components)
export function useRequireAuth() {
  const { user, ready } = useAuth()
  const router = require('next/router').useRouter()

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login')
    }
  }, [ready, user])

  return { user, ready }
}
