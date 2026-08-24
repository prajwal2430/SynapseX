import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  LogOut,
} from 'lucide-react'
import './Header.css'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'System overview & active intelligence' },
  '/investigations': { title: 'Investigations', subtitle: 'Active & archived case management' },
  '/evidence': { title: 'Evidence', subtitle: 'Digital evidence repository & chain of custody' },
  '/live-investigation': { title: 'Live Investigation', subtitle: 'Real-time monitoring & active session', live: true },
  '/timeline': { title: 'Timeline', subtitle: 'Chronological event reconstruction' },
  '/knowledge-graph': { title: 'Knowledge Graph', subtitle: 'Entity relationship visualization' },
  '/ai-agents': { title: 'AI Agents', subtitle: 'Autonomous analysis agent fleet' },
  '/ai-findings': { title: 'AI Findings & Reasoning', subtitle: 'Explainable evidence-backed hypothesis synthesis' },
  '/intelligence-chat': { title: 'Intelligence Chat', subtitle: 'AI-assisted investigation dialogue' },
  '/reports': { title: 'Reports', subtitle: 'Forensic reports & export management' },
  '/chain-of-custody': { title: 'Chain of Custody', subtitle: 'Evidence integrity & custody log' },
  '/settings': { title: 'Settings', subtitle: 'Platform configuration & preferences' },
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
  if (val == null) return fallback                    // null | undefined
  const s = typeof val === 'string' ? val : String(val)
  return s.trim() || fallback                         // empty-after-trim → fallback
}

export default function Header({ collapsed, onToggleSidebar, onMobileMenu, onOpenSearch }) {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] || { title: 'SynapseX', subtitle: 'Autonomous Digital Evidence Intelligence Platform' }
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [identityModalOpen, setIdentityModalOpen] = useState(false)
  const [identityInitialTab, setIdentityInitialTab] = useState('profile')
  const { user: currentUser, logout } = useAuth()

  const handleOpenIdentityTab = (tab) => {
    setUserMenuOpen(false)
    setIdentityInitialTab(tab)
    setIdentityModalOpen(true)
  }

  // ── Robust derived string properties ──
  // Every property is type-checked, trimmed, and given a safe fallback.
  const userFullName = safeStr(currentUser?.full_name, 'Manali Patil')
  const userEmail = safeStr(currentUser?.email, 'patilmanali@gmail.com')
  const userRole = safeStr(currentUser?.role, 'investigator').toUpperCase()
  const initials = userFullName.slice(0, 2).toUpperCase()

  return (
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
        <div className="header-notif-wrap">
          <button
            className="header-btn header-notif-btn"
            onClick={() => setNotifOpen(o => !o)}
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
                { level: 'high', msg: 'New entity correlation found — suspect network node', time: '14m ago' },
                { level: 'medium', msg: 'Evidence hash mismatch on artifact EVD-0821', time: '1h ago' },
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

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-user-btn"
            id="user-menu-btn"
            aria-label="User menu"
            onClick={() => setUserMenuOpen(o => !o)}
          >
            <div className="header-avatar">{initials}</div>
            <div className="header-user-info desktop-only">
              <span className="header-user-name">{userFullName}</span>
              <span className="header-user-role">{userRole}</span>
            </div>
            <ChevronDown size={12} className="desktop-only" style={{ color: 'var(--gray-500)' }} />
          </button>

          {userMenuOpen && (
            <div className="notif-dropdown identity-dropdown" style={{ width: 280, right: 0 }}>
              <div className="notif-header">
                <span className="notif-title">Authenticated Identity</span>
                <span className="badge badge--info">{userRole}</span>
              </div>

              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="header-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                  {initials}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{userFullName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>{userEmail}</p>
                </div>
              </div>

              <div className="identity-menu-list">
                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('profile')}
                >
                  <User size={15} className="menu-icon" />
                  <span>View Profile</span>
                </button>

                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('edit')}
                >
                  <Edit3 size={15} className="menu-icon" />
                  <span>Edit Profile</span>
                </button>

                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('activity')}
                >
                  <Activity size={15} className="menu-icon" />
                  <span>View Recent Activity</span>
                </button>

                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('security')}
                >
                  <Lock size={15} className="menu-icon" />
                  <span>Security & Active Sessions</span>
                </button>

                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('permissions')}
                >
                  <ShieldAlert size={15} className="menu-icon" />
                  <span>View Role & Permissions</span>
                </button>

                <button
                  className="identity-menu-item"
                  onClick={() => handleOpenIdentityTab('preferences')}
                >
                  <Sliders size={15} className="menu-icon" />
                  <span>Account Preferences</span>
                </button>

                <div className="identity-menu-divider" />

                <button
                  className="identity-menu-item identity-menu-item--danger"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                >
                  <LogOut size={15} className="menu-icon" />
                  <span> Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <IdentityModal
        isOpen={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        initialTab={identityInitialTab}
      />
    </header>
  )
}

