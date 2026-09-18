import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  Settings,
  LogOut,
  Lock,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  RotateCcw
} from 'lucide-react'
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

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="header-clock">
      <Clock size={12} />
      <span>{time.toUTCString().slice(17, 25)}</span>
      <span className="clock-label">UTC</span>
    </div>
  )
}

export default function Header({ collapsed, onToggleSidebar, onMobileMenu, onOpenSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = PAGE_TITLES[pathname] || { title: 'SynapseX', subtitle: 'Autonomous Digital Evidence Intelligence Platform' }
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  // Click-outside listener for both dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    const handleLock = () => {
      setIsLocked(true)
      setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('synapsex-lock-session', handleLock)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('synapsex-lock-session', handleLock)
    }
  }, [])

  // Handle Session Unlock
  const handleUnlock = (e) => {
    e?.preventDefault()
    if (pinInput.trim() === '1234' || pinInput.trim() === '') {
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
                <span>SA</span>
                <span className="avatar-status-dot" />
              </div>
              <div className="header-user-info desktop-only">
                <span className="header-user-name">Sr. Analyst</span>
                <span className="header-user-role">TS/SCI</span>
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
                  <div className="user-dropdown-avatar">SA</div>
                  <div className="user-dropdown-details">
                    <strong className="user-full-name">Special Agent M. Reynolds</strong>
                    <span className="user-email-text font-mono">m.reynolds@cyber.intel.gov</span>
                    <div className="user-clearance-pill">
                      <Shield size={10} />
                      <span>TS/SCI · CIP-005 · POLYGRAPH VERIFIED</span>
                    </div>
                  </div>
                </div>

                {/* Session Security Banner */}
                <div className="user-session-bar">
                  <div className="session-status-row">
                    <span className="session-dot" />
                    <span className="session-text">Session Active (58m remaining)</span>
                  </div>
                  <div className="session-token-text font-mono">
                    <Fingerprint size={10} /> YubiKey 5 FIPS Token Bound
                  </div>
                </div>

                {/* Menu Items */}
                <div className="user-menu-items">
                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <User size={14} className="user-menu-icon" />
                    <div className="user-menu-text">
                      <strong>Profile & Investigator Details</strong>
                      <span>Manage badge ID, credentials & contact data</span>
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
                <div className="user-dropdown-footer">
                  <button 
                    className="user-logout-btn"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setIsLocked(true)
                    }}
                  >
                    <LogOut size={13} />
                    <span>Lock Terminal & Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

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
                Session locked for <strong>Special Agent M. Reynolds</strong> (<code className="font-mono">TS/SCI</code>). Enter PIN or tap hardware security key to resume operational workflow.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="lockscreen-form">
              <div className="lockscreen-input-wrap">
                <KeyRound size={14} className="lockscreen-input-icon" />
                <input 
                  type="password"
                  placeholder="Enter analyst PIN (default: 1234)"
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
    </>
  )
}
