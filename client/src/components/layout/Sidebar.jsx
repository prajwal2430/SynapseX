import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderSearch,
  HardDrive,
  Radio,
  GitBranch,
  Share2,
  Bot,
  Brain,
  MessageSquare,
  FileText,
  ShieldCheck,
  Settings,
  ChevronLeft,
  X,
  Zap,
} from 'lucide-react'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    group: 'CORE',
    items: [
      { label: 'Dashboard',         path: '/dashboard',          icon: LayoutDashboard },
      { label: 'Investigations',    path: '/investigations',     icon: FolderSearch },
      { label: 'Evidence',          path: '/evidence',           icon: HardDrive },
    ],
  },
  {
    group: 'ANALYSIS',
    items: [
      { label: 'Live Investigation', path: '/live-investigation', icon: Radio,      alert: true },
      { label: 'Timeline',           path: '/timeline',           icon: GitBranch },
      { label: 'Knowledge Graph',    path: '/knowledge-graph',    icon: Share2 },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { label: 'AI Agents',         path: '/ai-agents',          icon: Bot },
      { label: 'AI Findings',       path: '/ai-findings',        icon: Brain },
      { label: 'Intelligence Chat', path: '/intelligence-chat',  icon: MessageSquare },
    ],
  },
  {
    group: 'RECORDS',
    items: [
      { label: 'Reports',           path: '/reports',            icon: FileText },
      { label: 'Chain of Custody',  path: '/chain-of-custody',   icon: ShieldCheck },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Settings',          path: '/settings',           icon: Settings },
    ],
  },
]

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const location = useLocation()

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Zap size={20} strokeWidth={2.5} className="brand-icon" />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-name">SynapseX</span>
            <span className="brand-sub">Intel Platform</span>
          </div>
        )}

        {/* Mobile close button */}
        <button
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── System Status ── */}
      {!collapsed && (
        <div className="sidebar-status">
          <div className="status-row">
            <span className="pulse-dot" />
            <span className="status-label">System Operational</span>
          </div>
          <div className="status-meta">
            <span className="status-chip">TLP:RED</span>
            <span className="status-chip status-chip--blue">CLASSIFIED</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="sidebar-status-dot">
          <span className="pulse-dot" title="System Operational" />
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(({ group, items }) => (
          <div key={group} className="nav-group">
            {!collapsed && (
              <span className="nav-group-label">{group}</span>
            )}
            {items.map(({ label, path, icon: Icon, alert }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item--active' : ''} ${alert ? 'nav-item--alert' : ''}`
                }
                title={collapsed ? label : undefined}
                onClick={() => { if (window.innerWidth <= 768) onClose() }}
              >
                <span className="nav-item-icon">
                  <Icon size={17} strokeWidth={1.8} />
                  {alert && <span className="nav-alert-dot" />}
                </span>
                {!collapsed && (
                  <span className="nav-item-label">{label}</span>
                )}
                {!collapsed && path === location.pathname && (
                  <span className="nav-item-indicator" />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-user">
            <div className="user-avatar">
              <span>SA</span>
            </div>
            <div className="user-info">
              <span className="user-name">Sr. Analyst</span>
              <span className="user-clearance">TS/SCI Clearance</span>
            </div>
          </div>
        ) : (
          <div className="sidebar-user-collapsed">
            <div className="user-avatar user-avatar--sm">
              <span>SA</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
