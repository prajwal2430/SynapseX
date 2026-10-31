import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Shield,
  Brain,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  UserPlus,
  LogIn,
  Server,
  Activity,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../services/api'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated, backendOffline, checkBackendHealth, backendHealth, healthLoading } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Check health on mount
  useEffect(() => {
    checkBackendHealth()
  }, [checkBackendHealth])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name for investigator registration.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    try {
      setLoading(true)
      if (mode === 'register') {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          role: 'investigator',
        })
        setSuccessMessage('Investigator account created successfully! Signing in...')
        // Auto-sign in after registration
        await login(email.trim(), password)
        navigate(from, { replace: true })
      } else {
        await login(email.trim(), password)
        navigate(from, { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isNetworkError) {
          setErrorMessage('Unable to connect to the ADEIP server. Please ensure the backend is running on http://127.0.0.1:8000.')
        } else if (err.status === 401) {
          setErrorMessage('Incorrect email or password. Please verify your credentials.')
        } else if (err.status === 403) {
          setErrorMessage('Access denied. This account does not have permission to access the platform.')
        } else if (err.status === 404) {
          setErrorMessage('Authentication endpoint not found. Please verify the backend API configuration.')
        } else if (err.status === 422) {
          setErrorMessage(typeof err.message === 'string' ? err.message : 'Invalid email format or field values.')
        } else if (err.status >= 500) {
          setErrorMessage('An internal server error occurred. Please verify backend logs.')
        } else {
          setErrorMessage(typeof err.message === 'string' ? err.message : 'Authentication failed.')
        }
      } else {
        setErrorMessage(typeof err?.message === 'string' ? err.message : 'Unable to connect to the ADEIP server.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Health Status Banner details
  const isDbDegraded = backendHealth && backendHealth.database && backendHealth.database.status !== 'connected'
  const isServerHealthy = backendHealth && backendHealth.status === 'healthy' && !isDbDegraded

  return (
    <div className="login-root">
      <div className="login-backdrop-glow" />

      <div className="login-container">
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <Shield size={28} className="shield-glow" />
              <Brain size={16} className="brain-overlay" />
            </div>
          </div>
          <h1 className="login-title">ADEIP</h1>
          <p className="login-subtitle">Autonomous Digital Evidence Intelligence Platform</p>
          <span className="login-badge">AUTHORIZED ACCESS ONLY · NIST 800-86 COMPLIANT</span>
        </div>

        {/* Backend Connection Status Pill */}
        <div className="login-health-pill">
          {healthLoading ? (
            <div className="health-status health-status--checking">
              <RefreshCw size={12} className="spin-icon" />
              <span>Verifying server connectivity...</span>
            </div>
          ) : backendOffline ? (
            <div className="health-status health-status--offline">
              <AlertTriangle size={12} />
              <span>ADEIP Backend is currently unavailable (https://synapsex-qdhb.onrender.com)</span>
              <button
                type="button"
                className="health-retry-btn"
                onClick={checkBackendHealth}
                title="Retry server ping"
              >
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          ) : isDbDegraded ? (
            <div className="health-status health-status--warning">
              <AlertTriangle size={12} />
              <span>ADEIP server is running, but database connection is unavailable</span>
              <button
                type="button"
                className="health-retry-btn"
                onClick={checkBackendHealth}
              >
                <RefreshCw size={11} /> Check
              </button>
            </div>
          ) : (
            <div className="health-status health-status--online">
              <span className="pulse-dot-green" />
              <span>Connected to ADEIP Server (v{backendHealth?.version || '1.0.0'})</span>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="login-card">
          {/* Mode Switcher */}
          <div className="login-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === 'login' ? 'mode-tab--active' : ''}`}
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage('') }}
            >
              <LogIn size={14} /> Investigator Login
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'register' ? 'mode-tab--active' : ''}`}
              onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage('') }}
            >
              <UserPlus size={14} /> Register Analyst
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="login-alert login-alert--error" role="alert">
              <AlertTriangle size={16} />
              <div>
                <p className="alert-text">{errorMessage}</p>
                {backendOffline && (
                  <button type="button" className="alert-retry-action" onClick={checkBackendHealth}>
                    <RefreshCw size={12} /> Retry Connection
                  </button>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="login-alert login-alert--success">
              <CheckCircle2 size={16} />
              <p className="alert-text">{successMessage}</p>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label" htmlFor="fullName">Full Name</label>
                <div className="input-wrap">
                  <span className="input-icon"><Shield size={16} /></span>
                  <input
                    id="fullName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Special Agent J. Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email">Investigator Email</label>
              <div className="input-wrap">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="analyst@adeip.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading || backendOffline}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>{mode === 'register' ? 'Registering Account...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Investigator Account' : 'Sign In to Investigation Suite'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="login-card-footer">
            <Lock size={12} />
            <span>End-to-end encrypted session · JWT SHA-256 tokens · Zero trust architecture</span>
          </div>
        </div>
      </div>
    </div>
  )
}
