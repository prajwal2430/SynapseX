import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingView, ErrorView } from '../common/StateViews'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, backendOffline, checkBackendHealth, verifySession } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary, #090d16)' }}>
        <LoadingView message="Verifying investigator credentials..." />
      </div>
    )
  }

  if (backendOffline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary, #090d16)', padding: 24 }}>
        <ErrorView
          message="ADEIP Backend Server Offline"
          error="Unable to connect to the ADEIP server at https://synapsex-qdhb.onrender.com. Please ensure the backend FastAPI service is running."
          onRetry={async () => {
            await checkBackendHealth()
            await verifySession()
          }}
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? children : <Outlet />
}
