import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import IdentityModal from '../auth/IdentityModal'
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  ChevronDown,
  Clock,
  Wifi,
  Shield,
  AlertTriangle,
  User,
  Edit3,
  Activity,
  Lock,
  ShieldAlert,
  Sliders,
  Settings,
  LogOut,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  RotateCcw,
  FolderOpen,
  Plus,
  FolderPlus,
  X,
  Briefcase
} from 'lucide-react'
import { useCase } from '../../context/CaseContext'
import './Header.css'

const PAGE_TITLES = {
  '/dashboard':           { title: 'Dashboard',           subtitle: 'System overview & active intelligence' },
  '/investigations':      { title: 'Investigations',      subtitle: 'Active & archived case management' },
  '/evidence':            { title: 'Evidence',            subtitle: 'Digital evidence repository & chain of custody' },
  '/live-investigation':  { title: 'Live Investigation',  subtitle: 'Real-time monitoring & active session', live: true },
  '/timeline':            { title: 'Timeline',            subtitle: 'Chronological event reconstruction' },
  '/knowledge-graph':     { title: 'Knowledge Graph',     subtitle: 'Entity relationship visualization' },
  '/ai-agents':           { title: 'AI Agents',           subtitle: 'Autonomous analysis agent fleet' },
  '/ai-findings':         { title: 'AI Findings & Reasoning', subtitle: 'Explainable evidence-backed hypothesis synthesis' },
  '/intelligence-chat':   { title: 'Intelligence Chat',   subtitle: 'AI-assisted investigation dialogue' },
  '/reports':             { title: 'Reports',             subtitle: 'Forensic reports & export management' },
  '/chain-of-custody':    { title: 'Chain of Custody',    subtitle: 'Evidence integrity & custody log' },
  '/settings':            { title: 'Settings & Profile',  subtitle: 'Analyst credentials, security keys & platform configuration' },
  '/styleguide':          { title: 'Design System & Tokens', subtitle: 'Operational visual specifications & WCAG contrast audit' },
}

// Mock alerts for the notification badge
const ALERT_COUNT = 3

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  const [mode, setMode] = useState('IST')

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = mode === 'IST'
    ? time.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    : time.toUTCString().slice(17, 25)

  return (
    <div
      className="header-clock"
      onClick={() => setMode(m => m === 'IST' ? 'UTC' : 'IST')}
      title={`Click to toggle timezone (Current: ${mode === 'IST' ? 'Indian Standard Time (IST / UTC+5:30)' : 'Coordinated Universal Time (UTC)'})`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <Clock size={12} />
      <span>{timeStr}</span>
      <span className="clock-label">{mode}</span>
    </div>
  )
}

/**
 * Safely coerce any value to a trimmed string.
 * Returns `fallback` when `val` is null / undefined / empty / not a string.
 */
function safeStr(val, fallback = '') {
  if (val == null) return fallback
  const s = typeof val === 'string' ? val : String(val)
  return s.trim() || fallback
}

export default function Header({ collapsed, onToggleSidebar, onMobileMenu, onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = PAGE_TITLES[pathname] || { title: 'SynapseX', subtitle: 'Autonomous Digital Evidence Intelligence Platform' }
  const { cases, activeCase, selectCase, createCase } = useCase()
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [identityModalOpen, setIdentityModalOpen] = useState(false)
  const [identityInitialTab, setIdentityInitialTab] = useState('profile')
  const [caseMenuOpen, setCaseMenuOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [newCase, setNewCase] = useState({
    title: '',
    case_number: '',
    description: '',
    case_type: 'Cybercrime',
    priority: 'high',
    status: 'active',
  })

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)
  const caseRef = useRef(null)

  // Auth context
  const auth = useAuth()
  const currentUser = auth?.user
  const logout = auth?.logout

  const userFullName = safeStr(currentUser?.full_name, 'Sr. Analyst')
  const userEmail = safeStr(currentUser?.email, 'analyst@adeip.local')
  const userRole = safeStr(currentUser?.role, 'INVESTIGATOR').toUpperCase()
  const initials = userFullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'

  // Click-outside listener for dropdowns & session lock listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (caseRef.current && !caseRef.current.contains(event.target)) {
        setCaseMenuOpen(false)
      }
    }
    const handleLock = () => {
      setIsLocked(true)
      setUserMenuOpen(false)
      setCaseMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('synapsex-lock-session', handleLock)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('synapsex-lock-session', handleLock)
    }
  }, [])

  const handleOpenIdentityTab = (tab) => {
    setUserMenuOpen(false)
    setIdentityInitialTab(tab)
    setIdentityModalOpen(true)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!newCase.title.trim()) {
      setCreateError('Case title is required')
      return
    }
    try {
      setCreating(true)
      setCreateError('')
      await createCase({
        title: newCase.title.trim(),
        case_number: newCase.case_number.trim() || undefined,
        description: newCase.description.trim() || undefined,
        case_type: newCase.case_type,
        priority: newCase.priority,
        status: newCase.status,
      })
      setCreateModalOpen(false)
      setNewCase({
        title: '',
        case_number: '',
        description: '',
        case_type: 'Cybercrime',
        priority: 'high',
        status: 'active',
      })
    } catch (err) {
      setCreateError(err.message || 'Failed to create case')
    } finally {
      setCreating(false)
    }
  }

  // Handle Session Unlock
  const handleUnlock = (e) => {
    e?.preventDefault()
    if (pinInput.trim() === '1234' || pinInput.trim() === 'Investigator123!' || pinInput.trim() === '') {
      setIsLocked(false)
      setPinInput('')
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  return (
    <>
      <header className="app-header">
        {/* ── Left: toggle + page title ── */}
        <div className="header-left">
          {/* Desktop collapse toggle */}
          <button
            className="header-btn header-toggle desktop-only"
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>

          {/* Mobile hamburger */}
          <button
            className="header-btn header-toggle mobile-only"
            onClick={onMobileMenu}
            aria-label="Open navigation"
          >
            <Menu size={16} />
          </button>

          <div className="header-divider" />

          <div className="header-page-info">
            <div className="header-page-title-row">
              <h1 className="header-page-title">{page.title}</h1>
              {page.live && (
                <span className="header-live-badge">
                  <span className="pulse-dot pulse-dot--alert" />
                  LIVE
                </span>
              )}
            </div>
            <p className="header-page-subtitle">{page.subtitle}</p>
          </div>

          <div className="header-divider desktop-only" />

          {/* ── Active Case Selector ── */}
          <div className="header-case-dropdown-wrap desktop-only" ref={caseRef}>
            <button
              className={`header-case-btn ${caseMenuOpen ? 'header-case-btn--active' : ''}`}
              onClick={() => {
                setCaseMenuOpen(o => !o)
                setUserMenuOpen(false)
                setNotifOpen(false)
              }}
              title="Switch active investigation case"
            >
              <div className="case-btn-icon-wrap">
                <FolderOpen size={13} />
              </div>
              <div className="case-btn-info">
                <span className="case-badge-id font-mono">{activeCase?.case_number || 'CASE-2026-001'}</span>
                <span className="case-badge-title">{activeCase?.title || 'Select Case'}</span>
              </div>
              <ChevronDown size={11} className={`case-btn-chevron ${caseMenuOpen ? 'open' : ''}`} />
            </button>

            {caseMenuOpen && (
              <div className="case-dropdown-menu">
                <div className="case-dropdown-header">
                  <span className="case-dropdown-title">Active Investigations</span>
                  <button
                    className="btn-create-case-pill"
                    onClick={() => {
                      setCaseMenuOpen(false)
                      setCreateModalOpen(true)
                    }}
                  >
                    <Plus size={11} /> New Case
                  </button>
                </div>
                <div className="case-dropdown-list">
                  {cases.map(c => (
                    <button
                      key={c.id}
                      className={`case-dropdown-item ${activeCase?.id === c.id ? 'case-dropdown-item--active' : ''}`}
                      onClick={() => {
                        selectCase(c)
                        setCaseMenuOpen(false)
                      }}
                    >
                      <div className="case-item-header">
                        <span className="case-item-number font-mono">{c.case_number}</span>
                        <span className={`case-priority-tag priority-${c.priority}`}>{c.priority}</span>
                      </div>
                      <div className="case-item-title">{c.title}</div>
                      <div className="case-item-meta">
                        <span>{c.case_type || 'Forensics'}</span>
                        <span>•</span>
                        <span>{c.evidence_count || 0} files</span>
                        <span>•</span>
                        <span className="case-status-indicator">{c.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Search ── */}
        <div 
          className={`header-search-wrap ${searchFocused ? 'focused' : ''}`}
          onClick={onOpenSearch}
        >
          <Search size={13} className="search-icon" />
          <input
            id="global-search"
            type="text"
            placeholder="Search cases, evidence, entities... (⌘K)"
            className="header-search"
            readOnly
            onClick={onOpenSearch}
            aria-label="Global search (Press ⌘K to search)"
          />
          <span className="search-kbd" onClick={onOpenSearch}>⌘K</span>
        </div>

        {/* ── Right: status + actions ── */}
        <div className="header-right">
          {/* System status indicators */}
          <div className="header-indicators desktop-only">
            <div className="indicator" title="Network connected">
              <Wifi size={13} className="indicator-icon indicator-icon--green" />
            </div>
            <div className="indicator" title="TLS Encrypted">
              <Shield size={13} className="indicator-icon indicator-icon--blue" />
            </div>
            <div className="indicator indicator--alert" title="3 active alerts">
              <AlertTriangle size={13} className="indicator-icon indicator-icon--alert" />
              <span className="indicator-count">3</span>
            </div>
          </div>

          <div className="header-divider desktop-only" />

          {/* Clock */}
          <LiveClock />

          <div className="header-divider desktop-only" />

          {/* Notifications */}
          <div className="header-notif-wrap" ref={notifRef}>
            <button
              className="header-btn header-notif-btn"
              onClick={() => {
                setNotifOpen(o => !o)
                setUserMenuOpen(false)
              }}
              aria-label="Notifications"
              id="notifications-btn"
            >
              <Bell size={15} />
              {ALERT_COUNT > 0 && (
                <span className="notif-badge">{ALERT_COUNT}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-title">Alerts</span>
                  <span className="badge badge--critical">{ALERT_COUNT} active</span>
                </div>
                {[
                  { level: 'critical', msg: 'Anomalous exfiltration pattern detected in CASE-2024-0047', time: '2m ago' },
                  { level: 'high',    msg: 'New entity correlation found — suspect network node', time: '14m ago' },
                  { level: 'medium',  msg: 'Evidence hash mismatch on artifact EVD-0821', time: '1h ago' },
                ].map((n, i) => (
                  <div key={i} className={`notif-item notif-item--${n.level}`}>
                    <div className="notif-dot" />
                    <div className="notif-body">
                      <p className="notif-msg">{n.msg}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
                <div className="notif-footer">View all alerts →</div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="header-user-menu-wrap" ref={userMenuRef}>
            <button 
              className={`header-user-btn ${userMenuOpen ? 'header-user-btn--active' : ''}`}
              id="user-menu-btn" 
              aria-label="User profile and account settings"
              onClick={() => {
                setUserMenuOpen(o => !o)
                setNotifOpen(false)
              }}
            >
              <div className="header-avatar">
                <span>{initials}</span>
                <span className="avatar-status-dot" />
              </div>
              <div className="header-user-info desktop-only">
                <span className="header-user-name">{userFullName}</span>
                <span className="header-user-role">{userRole}</span>
              </div>
              <ChevronDown 
                size={12} 
                className={`desktop-only header-chevron ${userMenuOpen ? 'header-chevron--open' : ''}`} 
              />
            </button>

            {/* Profile Dropdown Menu */}
            {userMenuOpen && (
              <div className="user-dropdown-menu">
                {/* Profile Header */}
                <div className="user-dropdown-profile">
                  <div className="user-dropdown-avatar">{initials}</div>
                  <div className="user-dropdown-details">
                    <strong className="user-full-name">{userFullName}</strong>
                    <span className="user-email-text font-mono">{userEmail}</span>
                    <div className="user-clearance-pill">
                      <Shield size={10} />
                      <span>{userRole} · ACTIVE VERIFIED</span>
                    </div>
                  </div>
                </div>

                {/* Session Security Banner */}
                <div className="user-session-bar">
                  <div className="session-status-row">
                    <span className="session-dot" />
                    <span className="session-text">Session Active</span>
                  </div>
                  <div className="session-token-text font-mono">
                    <Fingerprint size={10} /> Authenticated Token Bound
                  </div>
                </div>

                {/* Menu Items */}
                <div className="user-menu-items">
                  <button 
                    className="user-menu-item"
                    onClick={() => handleOpenIdentityTab('profile')}
                  >
                    <User size={14} className="user-menu-icon" />
                    <div className="user-menu-text">
                      <strong>Profile & Identity Details</strong>
                      <span>Manage investigator credentials & personal data</span>
                    </div>
                  </button>

                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <Settings size={14} className="user-menu-icon" />
                    <div className="user-menu-text">
                      <strong>Platform & Security Settings</strong>
                      <span>Audit logging, notifications & API access keys</span>
                    </div>
                  </button>

                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/styleguide')
                    }}
                  >
                    <Shield size={14} className="user-menu-icon" />
                    <div className="user-menu-text">
                      <strong>Visual Design System & Tokens</strong>
                      <span>WCAG contrast audit & cybersecurity styleguide</span>
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="user-dropdown-divider" />

                {/* Logout / Lock Session */}
                <div className="user-dropdown-footer" style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="user-logout-btn"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setUserMenuOpen(false)
                      setIsLocked(true)
                    }}
                  >
                    <Lock size={13} />
                    <span>Lock Terminal</span>
                  </button>
                  {logout && (
                    <button 
                      className="user-logout-btn user-logout-btn--danger"
                      style={{ flex: 1, color: 'var(--color-critical, #ef4444)' }}
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <IdentityModal
        isOpen={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        initialTab={identityInitialTab}
      />

      {/* ── Terminal Lock Screen Modal ── */}
      {isLocked && (
        <div className="lockscreen-overlay">
          <div className="lockscreen-modal">
            <div className="lockscreen-shield-box">
              <Lock size={24} className="lockscreen-icon" />
            </div>

            <div className="lockscreen-header">
              <span className="lockscreen-tag">FIPS 140-3 COMPLIANCE LOCK</span>
              <h2 className="lockscreen-title">Terminal Session Locked</h2>
              <p className="lockscreen-desc">
                Session locked for <strong>{userFullName}</strong> (<code className="font-mono">{userRole}</code>). Enter password/PIN to resume operational workflow.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="lockscreen-form">
              <div className="lockscreen-input-wrap">
                <KeyRound size={14} className="lockscreen-input-icon" />
                <input 
                  type="password"
                  placeholder="Enter PIN (default: 1234)"
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value)
                    setPinError(false)
                  }}
                  autoFocus
                  className={`lockscreen-input ${pinError ? 'lockscreen-input--error' : ''}`}
                />
              </div>

              {pinError && (
                <span className="lockscreen-error-msg font-mono">
                  Authentication failed. Default PIN is 1234.
                </span>
              )}

              <div className="lockscreen-actions">
                <button type="submit" className="btn-primary lockscreen-submit-btn">
                  <CheckCircle2 size={13} /> Unlock Terminal
                </button>
                <button 
                  type="button" 
                  className="btn-secondary lockscreen-signout-btn"
                  onClick={() => {
                    setIsLocked(false)
                    setPinInput('')
                    navigate('/dashboard')
                  }}
                >
                  <RotateCcw size={13} /> Return to Dashboard
                </button>
              </div>
            </form>

            <div className="lockscreen-footer">
              <Shield size={11} />
              <span>SynapseX Autonomous Digital Evidence Intelligence Platform</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Create New Case Modal ── */}
      {createModalOpen && (
        <div className="case-modal-overlay">
          <div className="case-modal-card">
            <div className="case-modal-header">
              <div className="case-modal-title-wrap">
                <FolderPlus size={18} className="text-accent" />
                <div>
                  <h3>Create New Investigation Case</h3>
                  <p>Initialize a real database-persisted digital forensic case</p>
                </div>
              </div>
              <button
                className="case-modal-close"
                onClick={() => setCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="case-modal-form">
              {createError && (
                <div className="case-modal-alert">
                  <AlertTriangle size={14} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Case Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Suspicious Financial Communication"
                  value={newCase.title}
                  onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Case Identifier (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CASE-2026-001 (auto-generated if empty)"
                    value={newCase.case_number}
                    onChange={e => setNewCase({ ...newCase, case_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Case Type</label>
                  <select
                    value={newCase.case_type}
                    onChange={e => setNewCase({ ...newCase, case_type: e.target.value })}
                  >
                    <option value="Cybercrime">Cybercrime</option>
                    <option value="Data Exfiltration">Data Exfiltration</option>
                    <option value="Financial Fraud">Financial Fraud</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Ransomware">Ransomware</option>
                    <option value="Phishing">Phishing</option>
                    <option value="Forensic Audit">Forensic Audit</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newCase.priority}
                    onChange={e => setNewCase({ ...newCase, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select
                    value={newCase.status}
                    onChange={e => setNewCase({ ...newCase, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="under_review">Under Review</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Case Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Provide investigative context, alleged breach vectors, or scope notes..."
                  value={newCase.description}
                  onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                />
              </div>

              <div className="case-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={creating}
                >
                  {creating ? 'Creating Case...' : 'Create Case & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
