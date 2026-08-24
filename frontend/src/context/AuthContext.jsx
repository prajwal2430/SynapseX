import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, authStorage, ApiError } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser())
  const [token, setToken] = useState(() => authStorage.getToken())
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authStorage.getToken()))
  const [loading, setLoading] = useState(true)
  const [backendOffline, setBackendOffline] = useState(false)
  const [backendHealth, setBackendHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)

  const checkBackendHealth = useCallback(async () => {
    try {
      setHealthLoading(true)
      const health = await api.health.check()
      setBackendHealth(health)
      setBackendOffline(false)
      return { online: true, health }
    } catch (err) {
      setBackendOffline(true)
      setBackendHealth(null)
      return { online: false, error: err.message }
    } finally {
      setHealthLoading(false)
    }
  }, [])

  const verifySession = useCallback(async () => {
    const storedToken = authStorage.getToken()
    if (!storedToken) {
      // Rule 1: If no access token exists, do NOT call /api/auth/me
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const currentUser = await api.auth.getMe()
      setUser(currentUser)
      setToken(storedToken)
      setIsAuthenticated(true)
      setBackendOffline(false)
      authStorage.setUser(currentUser)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token invalid or expired: clear and redirect
        authStorage.clear()
        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
      } else if (err.isNetworkError) {
        // Rule 3: Network failure / backend offline: do NOT log out or delete token
        setBackendOffline(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifySession()
  }, [verifySession])

  const login = async (email, password) => {
    const res = await api.auth.login(email, password)
    if (res && res.access_token) {
      setToken(res.access_token)
      setUser(res.user)
      setIsAuthenticated(true)
      setBackendOffline(false)
    }
    return res
  }

  const register = async (userData) => {
    return api.auth.register(userData)
  }

  const logout = () => {
    api.auth.logout()
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newObj = prev ? { ...prev, ...updatedData } : { ...updatedData }
      authStorage.setUser(newObj)
      return newObj
    })
  }

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    backendOffline,
    backendHealth,
    healthLoading,
    login,
    register,
    logout,
    updateUser,
    verifySession,
    checkBackendHealth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
