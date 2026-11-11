import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { tokens } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(tokens.get() ? 'loading' : 'out')

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me/')
      setUser(data)
      setStatus('in')
    } catch {
      tokens.clear()
      setUser(null)
      setStatus('out')
    }
  }, [])

  useEffect(() => {
    if (tokens.get()) loadMe()
    const onLogout = () => {
      setUser(null)
      setStatus('out')
    }
    window.addEventListener('hirelens:logout', onLogout)
    return () => window.removeEventListener('hirelens:logout', onLogout)
  }, [loadMe])

  const login = useCallback(
    async (username, password) => {
      const { data } = await api.post('/auth/login/', { username, password })
      tokens.set(data)
      await loadMe()
    },
    [loadMe],
  )

  const register = useCallback(
    async ({ username, email, password }) => {
      await api.post('/auth/register/', { username, email, password })
      await login(username, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    // Blacklist the refresh token on the server, then forget it here.
    const t = tokens.get()
    if (t?.refresh) api.post('/auth/logout/', { refresh: t.refresh }).catch(() => {})
    tokens.clear()
    setUser(null)
    setStatus('out')
  }, [])

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
