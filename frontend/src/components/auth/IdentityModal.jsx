import React, { useState } from 'react'
import {
  User,
  Edit3,
  Activity,
  Lock,
  Shield,
  Sliders,
  LogOut,
  X,
  Check,
  CheckCircle2,
  Clock,
  Key,
  Smartphone,
  Laptop,
  Globe,
  AlertTriangle,
  FileText,
  Database,
  Cpu,
  RefreshCw,
  Search,
  ShieldAlert,
  Award,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './IdentityModal.css'

export default function IdentityModal({ isOpen, onClose, initialTab = 'profile' }) {
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  // Profile Edit State
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || 'Manali Patil',
    email: user?.email || 'patilmanali@gmail.com',
    title: user?.title || 'Senior Forensic Investigator',
    department: user?.department || 'Digital Forensics & Cyber Intelligence',
    organization: user?.organization || 'SynapseX Security Operations',
    phone: user?.phone || '+91 98765 43210',
    bio: user?.bio || 'Specializing in memory forensics, malware reverse engineering, and AI-assisted cyber incident timeline reconstruction.',
  })
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Security Form State
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passMsg, setPassMsg] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  // Sessions list state
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows 11 PC · Chrome 128', ip: '192.168.1.104 (Delhi, IN)', current: true, time: 'Active now' },
    { id: 2, device: 'iPhone 15 Pro · Mobile Safari', ip: '49.37.112.5 (Mumbai, IN)', current: false, time: '3 hours ago' },
    { id: 3, device: 'Workstation Linux · Firefox 126', ip: '10.0.4.12 (Lab Ops)', current: false, time: 'Yesterday at 18:42' },
  ])

  // Preferences State
  const [prefs, setPrefs] = useState({
    timezone: 'IST',
    themeAccent: 'cyan',
    notifications: { critical: true, AICompletion: true, auditLogs: false },
    defaultLanding: '/dashboard',
    autoRefreshSec: 30,
  })
  const [prefMsg, setPrefMsg] = useState('')

  // Activity search state
  const [actSearch, setActSearch] = useState('')

  if (!isOpen) return null

  const handleSaveProfile = (e) => {
    e.preventDefault()
    updateUser({
      full_name: editForm.full_name,
      email: editForm.email,
      title: editForm.title,
      department: editForm.department,
      organization: editForm.organization,
      phone: editForm.phone,
      bio: editForm.bio,
    })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (!passForm.current || !passForm.newPass || !passForm.confirm) {
      setPassMsg('Please complete all password fields.')
      return
    }
    if (passForm.newPass !== passForm.confirm) {
      setPassMsg('New passwords do not match.')
      return
    }
    if (passForm.newPass.length < 8) {
      setPassMsg('Password must be at least 8 characters.')
      return
    }
    setPassMsg('Password successfully updated!')
    setPassForm({ current: '', newPass: '', confirm: '' })
    setTimeout(() => setPassMsg(''), 3000)
  }

  const terminateSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSavePrefs = (e) => {
    e.preventDefault()
    setPrefMsg('Preferences updated successfully!')
    setTimeout(() => setPrefMsg(''), 3000)
  }

  const mockActivities = [
    { id: 'ACT-9021', type: 'LOGIN', title: 'Authenticated System Session', detail: 'JWT SHA-256 session issued from IP 192.168.1.104', time: '10 mins ago', status: 'Success', icon: Key },
    { id: 'ACT-9020', type: 'EVIDENCE', title: 'Cryptographic Hash Verification', detail: 'Calculated SHA-256 hash match on EVD-2024-8841.raw', time: '42 mins ago', status: 'Verified', icon: Database },
    { id: 'ACT-9019', type: 'AI_AGENT', title: 'Invoked Multi-Agent Fleet', detail: 'Dispatched Memory, Malware, and Graph Synthesis agents', time: '1 hour ago', status: 'Completed', icon: Cpu },
    { id: 'ACT-9018', type: 'EXPORT', title: 'Exported Forensic Audit Report', detail: 'Generated court-admissible PDF for Case #CASE-2024-0047', time: '3 hours ago', status: 'Exported', icon: FileText },
    { id: 'ACT-9017', type: 'SECURITY', title: 'Role Permissions Inspection', detail: 'Verified Investigator TLP:RED security clearance level', time: '5 hours ago', status: 'Audited', icon: Shield },
    { id: 'ACT-9016', type: 'CASE', title: 'Updated Case Priority', detail: 'Escalated CASE-2024-0092 to CRITICAL severity', time: '1 day ago', status: 'Updated', icon: Zap },
  ].filter(a => a.title.toLowerCase().includes(actSearch.toLowerCase()) || a.detail.toLowerCase().includes(actSearch.toLowerCase()))

  const permissionsList = [
    { code: 'cases:read', category: 'Case Management', desc: 'Inspect active & archived evidence cases', granted: true },
    { code: 'cases:write', category: 'Case Management', desc: 'Create, modify, and assign investigation leads', granted: true },
    { code: 'cases:delete', category: 'Case Management', desc: 'Permanently purge case records', granted: false },
    { code: 'evidence:upload', category: 'Digital Vault', desc: 'Upload raw forensic disk/memory artifacts', granted: true },
    { code: 'evidence:hash_verify', category: 'Digital Vault', desc: 'Perform SHA-256 & MD5 chain-of-custody verification', granted: true },
    { code: 'evidence:purge', category: 'Digital Vault', desc: 'Destroy digital evidence artifacts', granted: false },
    { code: 'ai_agents:execute', category: 'Autonomous AI', desc: 'Run multi-agent fleet analysis & reasoning', granted: true },
    { code: 'ai_agents:override', category: 'Autonomous AI', desc: 'Override automated agent findings & confidence thresholds', granted: true },
    { code: 'reports:export', category: 'Court Reporting', desc: 'Generate signed NIST-800-86 forensic reports', granted: true },
    { code: 'security:audit_view', category: 'Security Logs', desc: 'Access platform access logs & IP tracking', granted: true },
    { code: 'admin:user_manage', category: 'System Admin', desc: 'Provision or revoke analyst accounts', granted: false },
  ]

  return (
    <div className="identity-modal-overlay" onClick={onClose}>
      <div className="identity-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="identity-modal-header">
          <div className="identity-header-left">
            <div className="identity-avatar-large">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'MA'}
            </div>
            <div>
              <div className="identity-title-row">
                <h2>{user?.full_name || 'Manali Patil'}</h2>
                <span className="identity-role-badge">
                  <Shield size={12} />
                  {user?.role?.toUpperCase() || 'INVESTIGATOR'}
                </span>
              </div>
              <p className="identity-subtitle">{user?.email || 'patilmanali@gmail.com'}</p>
            </div>
          </div>

          <button className="identity-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="identity-modal-body">
          {/* Nav Tabs */}
          <nav className="identity-tabs-nav">
            <button
              className={`identity-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>View Profile</span>
            </button>

            <button
              className={`identity-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>

            <button
              className={`identity-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={16} />
              <span>View Recent Activity</span>
            </button>

            <button
              className={`identity-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={16} />
              <span>Security & Active Sessions</span>
            </button>

            <button
              className={`identity-tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <ShieldAlert size={16} />
              <span>View Role & Permissions</span>
            </button>

            <button
              className={`identity-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Sliders size={16} />
              <span>Account Preferences</span>
            </button>

            <div className="identity-nav-divider" />

            <button
              className="identity-tab-btn identity-tab-btn--danger"
              onClick={() => {
                onClose()
                logout()
              }}
            >
              <LogOut size={16} />
              <span>Secure Sign Out</span>
            </button>
          </nav>

          {/* Tab Content Panel */}
          <div className="identity-content-panel">
            {/* 1. VIEW PROFILE */}
            {activeTab === 'profile' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Investigator Profile</h3>
                  <span className="badge badge--success">AUTHENTICATED & ACTIVE</span>
                </div>

                <div className="profile-grid">
                  <div className="profile-card">
                    <span className="profile-label">Full Name</span>
                    <span className="profile-value">{user?.full_name || editForm.full_name}</span>
                  </div>

                  <div className="profile-card">
                    <span className="profile-label">Email Address</span>
                    <span className="profile-value">{user?.email || editForm.email}</span>
                  </div>

                  <div className="profile-card">
                    <span className="profile-label">Role Title</span>
                    <span className="profile-value">{user?.title || editForm.title}</span>
                  </div>

                  <div className="profile-card">
                    <span className="profile-label">Department</span>
                    <span className="profile-value">{user?.department || editForm.department}</span>
                  </div>

                  <div className="profile-card">
                    <span className="profile-label">Organization</span>
                    <span className="profile-value">{user?.organization || editForm.organization}</span>
                  </div>

                  <div className="profile-card">
                    <span className="profile-label">Clearance Level</span>
                    <span className="profile-value highlight-cyan">TLP:RED / LEVEL 4 CLASSIFIED</span>
                  </div>
                </div>

                <div className="profile-bio-box">
                  <span className="profile-label">Investigator Bio / Focus</span>
                  <p className="profile-bio-text">{user?.bio || editForm.bio}</p>
                </div>

                <div className="profile-stats-grid">
                  <div className="stat-box">
                    <span className="stat-num">14</span>
                    <span className="stat-title">Cases Investigated</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">89</span>
                    <span className="stat-title">Evidence Verified</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">240+</span>
                    <span className="stat-title">AI Fleet Queries</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">100%</span>
                    <span className="stat-title">Chain Integrity</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. EDIT PROFILE */}
            {activeTab === 'edit' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Edit Profile Details</h3>
                  <p className="section-desc">Update your display information across the SynapseX platform.</p>
                </div>

                {saveSuccess && (
                  <div className="identity-alert alert--success">
                    <CheckCircle2 size={16} />
                    <span>Profile details updated successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="identity-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Designation / Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Organization</label>
                      <input
                        type="text"
                        value={editForm.organization}
                        onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Contact</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Investigator Bio / Notes</label>
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      <Check size={16} />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. VIEW RECENT ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Recent Account Activity</h3>
                  <div className="activity-search-wrap">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search activity log..."
                      value={actSearch}
                      onChange={(e) => setActSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="activity-list">
                  {mockActivities.map((act) => {
                    const IconComp = act.icon
                    return (
                      <div key={act.id} className="activity-item">
                        <div className="activity-icon-wrap">
                          <IconComp size={16} />
                        </div>
                        <div className="activity-info">
                          <div className="activity-top">
                            <span className="activity-title">{act.title}</span>
                            <span className="activity-time">{act.time}</span>
                          </div>
                          <p className="activity-detail">{act.detail}</p>
                        </div>
                        <span className="activity-status-badge">{act.status}</span>
                      </div>
                    )
                  })}

                  {mockActivities.length === 0 && (
                    <div className="empty-state">No matching activities found.</div>
                  )}
                </div>
              </div>
            )}

            {/* 4. SECURITY & ACTIVE SESSIONS */}
            {activeTab === 'security' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Security & Active Sessions</h3>
                  <span className="badge badge--info">2FA ACTIVE</span>
                </div>

                {/* Sessions list */}
                <div className="security-section">
                  <h4 className="subhead">Active Logged-In Sessions</h4>
                  <div className="sessions-list">
                    {sessions.map((s) => (
                      <div key={s.id} className="session-card">
                        <div className="session-icon">
                          {s.device.includes('iPhone') ? <Smartphone size={18} /> : <Laptop size={18} />}
                        </div>
                        <div className="session-details">
                          <div className="session-title">
                            <span>{s.device}</span>
                            {s.current && <span className="current-pill">Current Session</span>}
                          </div>
                          <div className="session-sub">
                            <span>{s.ip}</span>
                            <span>·</span>
                            <span>{s.time}</span>
                          </div>
                        </div>
                        {!s.current && (
                          <button className="btn-sm-danger" onClick={() => terminateSession(s.id)}>
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Change */}
                <div className="security-section">
                  <h4 className="subhead">Update Password</h4>
                  {passMsg && (
                    <div className={`identity-alert ${passMsg.includes('updated') ? 'alert--success' : 'alert--error'}`}>
                      {passMsg.includes('updated') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{passMsg}</span>
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="identity-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={passForm.current}
                        onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          placeholder="Min 8 characters"
                          value={passForm.newPass}
                          onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Repeat new password"
                          value={passForm.confirm}
                          onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-secondary">
                      Update Security Credentials
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 5. VIEW ROLE & PERMISSIONS */}
            {activeTab === 'permissions' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Role & Security Permissions</h3>
                  <div className="role-summary-tag">
                    <Award size={14} />
                    <span>Role: Senior Investigator (Level 4)</span>
                  </div>
                </div>

                <p className="section-desc">
                  Below is the enforced Access Control Matrix for your authenticated identity under NIST 800-53 standards.
                </p>

                <div className="permissions-table-wrap">
                  <table className="permissions-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Permission Key</th>
                        <th>Category</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsList.map((p) => (
                        <tr key={p.code}>
                          <td>
                            {p.granted ? (
                              <span className="perm-grant perm-grant--yes"><Check size={14} /> Allowed</span>
                            ) : (
                              <span className="perm-grant perm-grant--no"><X size={14} /> Restricted</span>
                            )}
                          </td>
                          <td className="perm-code">{p.code}</td>
                          <td><span className="perm-cat">{p.category}</span></td>
                          <td className="perm-desc">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. ACCOUNT PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="identity-tab-content">
                <div className="content-section-header">
                  <h3>Account Preferences</h3>
                  <p className="section-desc">Customize interface defaults and alert preferences.</p>
                </div>

                {prefMsg && (
                  <div className="identity-alert alert--success">
                    <CheckCircle2 size={16} />
                    <span>{prefMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSavePrefs} className="identity-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Preferred Timezone Display</label>
                      <select
                        value={prefs.timezone}
                        onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                      >
                        <option value="IST">Indian Standard Time (IST / UTC+5:30)</option>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="LOCAL">Local System Clock</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Default Landing Screen</label>
                      <select
                        value={prefs.defaultLanding}
                        onChange={(e) => setPrefs({ ...prefs, defaultLanding: e.target.value })}
                      >
                        <option value="/dashboard">Dashboard</option>
                        <option value="/investigations">Investigations Workspace</option>
                        <option value="/live-investigation">Live Investigation</option>
                        <option value="/ai-agents">AI Agent Fleet</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notification Toggles</label>
                    <div className="checkbox-stack">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prefs.notifications.critical}
                          onChange={(e) =>
                            setPrefs({
                              ...prefs,
                              notifications: { ...prefs.notifications, critical: e.target.checked },
                            })
                          }
                        />
                        <span>Critical Threat & Chain Mismatch Alerts</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prefs.notifications.AICompletion}
                          onChange={(e) =>
                            setPrefs({
                              ...prefs,
                              notifications: { ...prefs.notifications, AICompletion: e.target.checked },
                            })
                          }
                        />
                        <span>AI Agent Fleet Execution Completion</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      <Sliders size={16} />
                      <span>Save Platform Preferences</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
