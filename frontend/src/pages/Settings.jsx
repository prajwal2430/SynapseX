import React, { useState } from 'react'
import {
  User, Shield, KeyRound, Bell, Sliders,
  Save, Check, Lock, Fingerprint, Clock,
  Smartphone, HardDrive, RefreshCw, AlertCircle,
  Eye, CheckCircle2, ShieldCheck, Laptop
} from 'lucide-react'
import './Settings.css'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: 'Special Agent M. Reynolds',
    callSign: 'VANGUARD-7',
    badgeNumber: 'FED-CY-94821',
    agency: 'National Cyber Forensics Division',
    email: 'm.reynolds@cyber.intel.gov',
    phone: '+1 (555) 019-2834',
    clearance: 'TS/SCI · Polygraph Verified · CIP-005',
    station: 'Fort Meade Cyber Operations Center',
    timezone: 'UTC',
    autoLockTimer: '15',
    notificationsEnabled: true,
    hardwareKeyBound: true,
  })

  const handleSave = (e) => {
    e?.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="settings-page-root">
      {/* Header */}
      <header className="settings-header">
        <div className="settings-eyebrow">
          <User size={13} />
          <span>Analyst Profile & System Configuration</span>
        </div>
        <h1 className="settings-title">Profile & Platform Settings</h1>
        <p className="settings-sub">
          Manage your investigator credentials, cryptographic security tokens, hardware authentication factors, and forensic interface preferences.
        </p>
      </header>

      {/* Main Settings Container */}
      <div className="settings-container">
        {/* Navigation Tabs */}
        <aside className="settings-sidebar-nav">
          <button 
            className={`settings-nav-btn ${activeTab === 'profile' ? 'settings-nav-btn--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} />
            <div className="nav-btn-text">
              <strong>Investigator Profile</strong>
              <span>Credentials & badge details</span>
            </div>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'security' ? 'settings-nav-btn--active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={15} />
            <div className="nav-btn-text">
              <strong>Security & Tokens</strong>
              <span>Hardware keys & MFA access</span>
            </div>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'preferences' ? 'settings-nav-btn--active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Sliders size={15} />
            <div className="nav-btn-text">
              <strong>Forensic Preferences</strong>
              <span>Timezone, density & auto-lock</span>
            </div>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'sessions' ? 'settings-nav-btn--active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Laptop size={15} />
            <div className="nav-btn-text">
              <strong>Active Sessions</strong>
              <span>Audit terminals & devices</span>
            </div>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="settings-content-panel">
          
          {/* TAB 1: INVESTIGATOR PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="settings-form-section">
              <div className="section-card-hdr">
                <div>
                  <h2 className="section-card-title">Authorized Examiner Profile</h2>
                  <span className="section-card-sub">Investigator identification stamped onto all chain-of-custody logs and court exhibits</span>
                </div>
                <div className="profile-seal-badge">
                  <ShieldCheck size={13} />
                  <span>FRE 902(14) Certified</span>
                </div>
              </div>

              {/* Avatar & Badge Row */}
              <div className="profile-avatar-row">
                <div className="profile-large-avatar">SA</div>
                <div className="profile-avatar-info">
                  <div className="profile-name-row">
                    <h3>{formData.fullName}</h3>
                    <span className="profile-clearance-tag">{formData.clearance}</span>
                  </div>
                  <p className="profile-meta-line font-mono">
                    Badge: {formData.badgeNumber} · Call Sign: {formData.callSign}
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="settings-form-grid">
                <div className="form-field">
                  <label className="field-label">Full Legal Name</label>
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Investigative Call Sign</label>
                  <input 
                    type="text" 
                    className="field-input font-mono"
                    value={formData.callSign}
                    onChange={e => setFormData({ ...formData, callSign: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Federal Badge / Warrant Number</label>
                  <input 
                    type="text" 
                    className="field-input font-mono"
                    value={formData.badgeNumber}
                    onChange={e => setFormData({ ...formData, badgeNumber: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Department / Agency</label>
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.agency}
                    onChange={e => setFormData({ ...formData, agency: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Official Secure Email</label>
                  <input 
                    type="email" 
                    className="field-input font-mono"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Duty Phone / Extension</label>
                  <input 
                    type="text" 
                    className="field-input font-mono"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-field form-field--full">
                  <label className="field-label">Assigned Duty Station / Field Command</label>
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.station}
                    onChange={e => setFormData({ ...formData, station: e.target.value })}
                  />
                </div>
              </div>

              {/* Cryptographic Key Details */}
              <div className="crypto-seal-card">
                <div className="crypto-seal-hdr">
                  <KeyRound size={14} className="crypto-icon" />
                  <strong>Investigator Cryptographic PGP/GPG Signature Key</strong>
                </div>
                <div className="crypto-key-body">
                  <div className="crypto-row">
                    <span className="crypto-k">Key Fingerprint:</span>
                    <span className="crypto-v font-mono">9B8A 7F6E 5D4C 3B2A 1F0E 9D8C 7B6A 5F4E 3D2C 1B0A</span>
                  </div>
                  <div className="crypto-row">
                    <span className="crypto-k">Algorithm:</span>
                    <span className="crypto-v font-mono">RSA 4096-bit (Hardware Token Sealed)</span>
                  </div>
                  <div className="crypto-row">
                    <span className="crypto-k">Expiration:</span>
                    <span className="crypto-v font-mono text-green">Valid through 2028-12-31 UTC</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="settings-actions-bar">
                <button type="submit" className="btn-primary">
                  {saved ? <><Check size={13} /> Profile Saved</> : <><Save size={13} /> Save Profile Changes</>}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & HARDWARE TOKENS */}
          {activeTab === 'security' && (
            <div className="settings-form-section">
              <div className="section-card-hdr">
                <div>
                  <h2 className="section-card-title">Security & Cryptographic Credentials</h2>
                  <span className="section-card-sub">Multi-Factor Authentication (MFA), FIPS 140-3 tokens, and passkeys</span>
                </div>
                <div className="profile-seal-badge">
                  <Fingerprint size={13} />
                  <span>FIPS 140-3 Validated</span>
                </div>
              </div>

              {/* Hardware Token Card */}
              <div className="security-factor-card">
                <div className="factor-icon-wrap factor-icon-wrap--green">
                  <HardDrive size={18} />
                </div>
                <div className="factor-details">
                  <div className="factor-title-row">
                    <strong>Primary Hardware Token: YubiKey 5 FIPS</strong>
                    <span className="factor-active-pill">CONNECTED & VERIFIED</span>
                  </div>
                  <p className="factor-desc">
                    Hardware key bound to serial number <code className="font-mono">YK-9842104-FIPS</code>. Required for decrypting classified evidence bundles.
                  </p>
                  <span className="factor-meta font-mono">Last hardware challenge verified 12m ago</span>
                </div>
              </div>

              {/* MFA App Card */}
              <div className="security-factor-card">
                <div className="factor-icon-wrap factor-icon-wrap--blue">
                  <Smartphone size={18} />
                </div>
                <div className="factor-details">
                  <div className="factor-title-row">
                    <strong>Time-based OTP (TOTP) Authenticator</strong>
                    <span className="factor-active-pill">ACTIVE</span>
                  </div>
                  <p className="factor-desc">
                    Backup verification code configured on government-issued secure endpoint.
                  </p>
                  <span className="factor-meta font-mono">App: Aegis Authenticator (Encrypted)</span>
                </div>
              </div>

              {/* Password Change Sub-section */}
              <div className="password-change-box">
                <h3 className="password-box-title">Change Operational Passphrase</h3>
                <div className="settings-form-grid">
                  <div className="form-field form-field--full">
                    <label className="field-label">Current Passphrase</label>
                    <input type="password" placeholder="••••••••••••••••" className="field-input font-mono" />
                  </div>
                  <div className="form-field">
                    <label className="field-label">New Passphrase (Min 16 chars)</label>
                    <input type="password" placeholder="Enter new passphrase" className="field-input font-mono" />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Confirm New Passphrase</label>
                    <input type="password" placeholder="Repeat new passphrase" className="field-input font-mono" />
                  </div>
                </div>
                <button type="button" className="btn-secondary" style={{ marginTop: '12px', alignSelf: 'flex-start' }}>
                  <KeyRound size={13} /> Update Passphrase
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FORENSIC PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="settings-form-section">
              <div className="section-card-hdr">
                <div>
                  <h2 className="section-card-title">Forensic Workspace Preferences</h2>
                  <span className="section-card-sub">Display density, default temporal reference clocks, and automated compliance locks</span>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-field">
                  <label className="field-label">Default Timestamp Display Format</label>
                  <select 
                    className="field-input font-mono"
                    value={formData.timezone}
                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="UTC">ISO-8601 UTC (Recommended for court admissibility)</option>
                    <option value="LOCAL">Local System Clock (PST / EST)</option>
                    <option value="UNIX">Unix Epoch Milliseconds</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Automated Terminal Lock Inactivity Timer</label>
                  <select 
                    className="field-input font-mono"
                    value={formData.autoLockTimer}
                    onChange={e => setFormData({ ...formData, autoLockTimer: e.target.value })}
                  >
                    <option value="5">5 minutes of inactivity</option>
                    <option value="15">15 minutes of inactivity (CJIS Standard)</option>
                    <option value="30">30 minutes of inactivity</option>
                    <option value="60">60 minutes of inactivity</option>
                  </select>
                </div>

                <div className="form-field form-field--full">
                  <label className="field-label">Operational Visual Density</label>
                  <div className="density-toggle-box">
                    <div className="density-opt density-opt--selected">
                      <strong>Compact Operational (36px Rows)</strong>
                      <span>Optimized for large 200+ event evidence tables</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-actions-bar">
                <button type="button" className="btn-primary" onClick={handleSave}>
                  {saved ? <><Check size={13} /> Preferences Saved</> : <><Save size={13} /> Save Preferences</>}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="settings-form-section">
              <div className="section-card-hdr">
                <div>
                  <h2 className="section-card-title">Authorized Analyst Sessions</h2>
                  <span className="section-card-sub">Active terminal sessions authenticated under your cryptographic identity</span>
                </div>
              </div>

              <div className="sessions-list">
                <div className="session-card session-card--current">
                  <div className="session-icon-box">
                    <Laptop size={16} />
                  </div>
                  <div className="session-details">
                    <div className="session-title-line">
                      <strong>Current Terminal · WKST-041 (Server Room B)</strong>
                      <span className="current-session-tag">THIS DEVICE</span>
                    </div>
                    <span className="session-ip-line font-mono">
                      IP: 10.0.4.41 · Windows 11 Enterprise (Build 22631) · TLS 1.3
                    </span>
                    <span className="session-started font-mono">
                      Authenticated: Today at 08:30 UTC · Session expires in 58m
                    </span>
                  </div>
                </div>

                <div className="session-card">
                  <div className="session-icon-box">
                    <Laptop size={16} />
                  </div>
                  <div className="session-details">
                    <div className="session-title-line">
                      <strong>Forensic Lab Console · LAB-CONSOLE-02</strong>
                    </div>
                    <span className="session-ip-line font-mono">
                      IP: 10.0.12.8 · RedHat Enterprise Linux 9.2 · SSH Session
                    </span>
                    <span className="session-started font-mono">
                      Authenticated: Yesterday at 14:10 UTC · Status: Idle
                    </span>
                  </div>
                  <button className="btn-secondary session-kill-btn">
                    Terminate Session
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
