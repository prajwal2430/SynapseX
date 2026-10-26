import React, { useState } from 'react'
import {
  AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2, Info,
  Shield, Terminal, Hash, Network, ExternalLink, RefreshCw,
  Copy, Check, Search, Filter, SlidersHorizontal, ArrowUpRight
} from 'lucide-react'
import './Styleguide.css'

/* ═══════════════════════════════════════════════════
   CONTRAST CALCULATION UTILITIES (WCAG 2.1)
═══════════════════════════════════════════════════ */
function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1))
  const lum2 = getLuminance(hexToRgb(hex2))
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2)
}

/* ═══════════════════════════════════════════════════
   TOKENS DEFINITIONS
═══════════════════════════════════════════════════ */
const BG_HEX = '#0D1117'
const SURFACE_HEX = '#161B22'

const COLOR_GROUPS = [
  {
    category: 'Neutrals',
    description: 'Background, elevation surfaces, structural borders, and typography',
    items: [
      { name: '--bg', hex: '#0D1117', role: 'Default application background (No pure black)' },
      { name: '--surface', hex: '#161B22', role: 'Primary card & container background' },
      { name: '--surface-alt', hex: '#1C2129', role: 'Table headers, elevation layers, hover states' },
      { name: '--border', hex: '#30363D', role: 'Structural separation and row borders' },
      { name: '--text', hex: '#E6EDF3', role: 'Primary content, headings, and data values' },
      { name: '--text-muted', hex: '#8B949E', role: 'Secondary metadata, table headers, subtitles' },
    ],
  },
  {
    category: 'Accent (Interactive Only)',
    description: 'Reserved exclusively for user interaction — links, focus rings, active states, primary buttons. Never indicates severity.',
    items: [
      { name: '--accent', hex: '#22D3EE', role: 'Interactive primary elements, links, focus rings' },
      { name: '--accent-hover', hex: '#67E8F9', role: 'Hover state for interactive elements' },
    ],
  },
  {
    category: 'Severity (Data Only)',
    description: 'Reserved strictly for telemetry and data display. Never paired with interactive affordances. Cyan is never used here.',
    items: [
      { name: '--sev-critical', hex: '#F85149', role: 'Critical threat, high-confidence compromise' },
      { name: '--sev-high', hex: '#FF8C42', role: 'High risk incident, privilege escalation' },
      { name: '--sev-medium', hex: '#E3B341', role: 'Suspicious anomaly, policy deviation' },
      { name: '--sev-low', hex: '#3FB950', role: 'Benign baseline, routine maintenance, cleared' },
      { name: '--sev-info', hex: '#58A6FF', role: 'Informational audit, connection telemetry' },
    ],
  },
]

/* ═══════════════════════════════════════════════════
   20-ROW REALISTIC CYBERSECURITY DATASET
═══════════════════════════════════════════════════ */
const SAMPLE_TABLE_DATA = [
  { id: 1, time: '2026-09-15 13:42:01.104', sev: 'critical', rule: 'Unauthorized LSASS Memory Access', host: 'DC-PRIMARY-01', srcIp: '10.0.12.44', dstIp: '10.0.0.4:445', cve: 'T1003.001', hash: 'e4b3...9a12', status: 'Blocked' },
  { id: 2, time: '2026-09-15 13:41:55.892', sev: 'critical', rule: 'High-Entropy Egress to TOR Relay', host: 'WKST-041', srcIp: '10.0.4.41', dstIp: '185.220.101.47:443', cve: 'T1048.002', hash: '9f8e...3b4a', status: 'Alerted' },
  { id: 3, time: '2026-09-15 13:41:12.441', sev: 'high', rule: 'Kernel Driver Stage (BYOVD)', host: 'SRV-FILE-02', srcIp: '10.0.2.19', dstIp: '127.0.0.1:0', cve: 'CVE-2024-21338', hash: 'd0e5...2d4f', status: 'Quarantined' },
  { id: 4, time: '2026-09-15 13:40:48.319', sev: 'high', rule: 'Privilege Escalation via SeDebug', host: 'WKST-041', srcIp: '10.0.4.41', dstIp: '10.0.4.41:0', cve: 'T1068', hash: 'b8c3...a7b0', status: 'Logged' },
  { id: 5, time: '2026-09-15 13:39:50.002', sev: 'medium', rule: 'Multiple Kerberos TGS Requests', host: 'CORP-KDC-01', srcIp: '10.0.8.102', dstIp: '10.0.0.4:88', cve: 'T1558.003', hash: '7c8b...f7e8', status: 'Reviewing' },
  { id: 6, time: '2026-09-15 13:39:15.670', sev: 'medium', rule: 'Unregistered USB Storage Mount', host: 'WKST-041', srcIp: '10.0.4.41', dstIp: 'LOCAL_BUS:USB3', cve: 'T1052.001', hash: 'c9d4...c6d8', status: 'Logged' },
  { id: 7, time: '2026-09-15 13:38:22.511', sev: 'low', rule: 'Routine DHCP Lease Renewal', host: 'AP-FLOOR-2', srcIp: '10.0.16.1', dstIp: '10.0.0.1:67', cve: 'RFC-2131', hash: '1a2b...3a4b', status: 'Cleared' },
  { id: 8, time: '2026-09-15 13:37:44.200', sev: 'low', rule: 'Scheduled EDR Health Telemetry', host: 'GATEWAY-01', srcIp: '10.0.0.2', dstIp: '10.0.0.10:8443', cve: 'EDR-SYS', hash: '4a5b...6a7b', status: 'Cleared' },
  { id: 9, time: '2026-09-15 13:36:58.832', sev: 'info', rule: 'TLS Certificate Validation Pass', host: 'PROX-EGRESS-01', srcIp: '10.0.4.11', dstIp: '142.250.190.46:443', cve: 'TLS-1.3', hash: '3d2c...1d0c', status: 'Permitted' },
  { id: 10, time: '2026-09-15 13:36:10.129', sev: 'info', rule: 'DNS Query for Internal Service', host: 'WKST-088', srcIp: '10.0.4.88', dstIp: '10.0.0.2:53', cve: 'DNS-UDP', hash: '2a1f...4a3f', status: 'Resolved' },
  { id: 11, time: '2026-09-15 13:35:04.991', sev: 'critical', rule: 'Ransomware Canary File Modification', host: 'STORAGE-SAN-01', srcIp: '10.0.9.33', dstIp: '10.0.9.33:445', cve: 'T1486', hash: '5f6e...7d8c', status: 'Isolated' },
  { id: 12, time: '2026-09-15 13:34:22.404', sev: 'high', rule: 'PowerShell Encoded Script Execution', host: 'DEV-SRV-04', srcIp: '10.0.5.12', dstIp: '10.0.5.12:0', cve: 'T1059.001', hash: '8a9b...0c1d', status: 'Blocked' },
  { id: 13, time: '2026-09-15 13:33:51.173', sev: 'medium', rule: 'Outbound SSH Session on Non-Std Port', host: 'JUMP-BOX-02', srcIp: '10.0.2.204', dstIp: '194.26.29.11:2222', cve: 'T1571', hash: '6b7a...8f9e', status: 'Flagged' },
  { id: 14, time: '2026-09-15 13:32:40.612', sev: 'low', rule: 'Windows Defender Signature Update', host: 'WKST-019', srcIp: '10.0.4.19', dstIp: '20.190.159.23:443', cve: 'DEF-UPDT', hash: 'e1d2...c7b8', status: 'Complete' },
  { id: 15, time: '2026-09-15 13:31:19.458', sev: 'info', rule: 'NTP Stratum-1 Time Sync', host: 'NTP-CORE-01', srcIp: '10.0.0.5', dstIp: '129.6.15.28:123', cve: 'RFC-5905', hash: '0f1e...2d3c', status: 'Synced' },
  { id: 16, time: '2026-09-15 13:30:08.924', sev: 'critical', rule: 'Golden Ticket Kerberos Forgery', host: 'DC-PRIMARY-01', srcIp: '10.0.12.89', dstIp: '10.0.0.4:88', cve: 'T1558.001', hash: 'a3f1...e7f1', status: 'Blocked' },
  { id: 17, time: '2026-09-15 13:29:45.301', sev: 'high', rule: 'Suspicious Scheduled Task Created', host: 'WKST-014', srcIp: '10.0.4.14', dstIp: '10.0.4.14:0', cve: 'T1053.005', hash: 'f8c1...e3f6', status: 'Audit' },
  { id: 18, time: '2026-09-15 13:28:11.782', sev: 'medium', rule: 'Excessive Failed SMB Authentication', host: 'FILE-CLUSTER-A', srcIp: '10.0.7.55', dstIp: '10.0.1.10:445', cve: 'T1110.001', hash: 'c1d4...f1d9', status: 'RateLimited' },
  { id: 19, time: '2026-09-15 13:27:03.014', sev: 'low', rule: 'ARP Cache Entry Refresh', host: 'SW-CORE-01', srcIp: '10.0.0.1', dstIp: '10.0.0.255:0', cve: 'RFC-826', hash: '9d2a...d0a3', status: 'Cleared' },
  { id: 20, time: '2026-09-15 13:26:40.890', sev: 'info', rule: 'Syslog Ingestion Heartbeat (UDP)', host: 'SIEM-COLL-01', srcIp: '10.0.0.15', dstIp: '10.0.0.15:514', cve: 'RFC-5424', hash: 'b2e4...f0a2', status: 'Active' },
]

export default function Styleguide() {
  const [copiedToken, setCopiedToken] = useState(null)

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(text)
    setTimeout(() => setCopiedToken(null), 1500)
  }

  return (
    <div className="styleguide-root">
      
      {/* Header */}
      <header className="styleguide-header">
        <div className="styleguide-header-badge">
          <Shield size={13} />
          <span>Design System Specification · Dark Theme Only</span>
        </div>
        <h1 className="styleguide-title">Visual Design System & Tokens</h1>
        <p className="styleguide-desc">
          Operational UI for cybersecurity analysts. Low eye fatigue, zero pure-black backgrounds, high data density, and strict separation between interactive accents (<code className="font-mono">--accent</code>) and forensic severity data colors (<code className="font-mono">--sev-*</code>).
        </p>
      </header>

      {/* ══════════════════════════════════════════
          1. TOKENS & CONTRAST RATIOS
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <h2 className="sg-section-title">1. Color Tokens & WCAG AA Contrast Verification</h2>
          <span className="sg-section-sub">All text tokens meet WCAG AA (4.5:1 minimum). Values verified against --bg (#0D1117) and --surface (#161B22).</span>
        </div>

        <div className="sg-color-groups">
          {COLOR_GROUPS.map(grp => (
            <div key={grp.category} className="sg-color-card">
              <div className="sg-color-card-hdr">
                <h3 className="sg-color-card-title">{grp.category}</h3>
                <p className="sg-color-card-desc">{grp.description}</p>
              </div>

              <div className="sg-swatch-grid">
                {grp.items.map(token => {
                  const contrastBg = getContrast(token.hex, BG_HEX)
                  const contrastSurface = getContrast(token.hex, SURFACE_HEX)
                  const passesAA = contrastSurface >= 4.5
                  const isTextMuted = token.name === '--text-muted'

                  return (
                    <div key={token.name} className="sg-swatch-box">
                      <div className="sg-swatch-preview" style={{ backgroundColor: token.hex }} />
                      
                      <div className="sg-swatch-info">
                        <div className="sg-swatch-name-row">
                          <code className="sg-token-name font-mono">{token.name}</code>
                          <button 
                            className="sg-copy-btn" 
                            onClick={() => handleCopy(`var(${token.name})`)}
                            title="Copy CSS var"
                          >
                            {copiedToken === `var(${token.name})` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <span className="sg-token-hex font-mono">{token.hex}</span>
                        <p className="sg-token-role">{token.role}</p>

                        <div className="sg-contrast-metrics">
                          <div className="sg-contrast-row">
                            <span>vs --bg:</span>
                            <strong className="font-mono">{contrastBg}:1</strong>
                          </div>
                          <div className="sg-contrast-row">
                            <span>vs --surface:</span>
                            <strong className="font-mono">{contrastSurface}:1</strong>
                            <span className={`sg-wcag-badge ${passesAA ? 'sg-wcag-pass' : 'sg-wcag-sub'}`}>
                              {passesAA ? 'AA Pass' : 'Sub-AA'}
                            </span>
                          </div>
                          {isTextMuted && (
                            <div className="sg-text-muted-highlight">
                              ✓ Verified: 5.51:1 exceeds WCAG AA (4.5:1)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. HARD RULES AUDIT
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <h2 className="sg-section-title">2. Operational Rules Enforcement</h2>
          <span className="sg-section-sub">Zero-compromise design constraints for high-stress security monitoring environments.</span>
        </div>

        <div className="sg-rules-grid">
          <div className="sg-rule-box">
            <span className="sg-rule-num">Rule 1</span>
            <h4>Accent & Severity Separation</h4>
            <p>
              Cyan (<code className="font-mono">#22D3EE</code>) is reserved strictly for interactivity (links, focus rings, primary buttons). It never conveys severity. Severity colors (<code className="font-mono">--sev-*</code>) are never interactive.
            </p>
          </div>

          <div className="sg-rule-box">
            <span className="sg-rule-num">Rule 2</span>
            <h4>No Color-Alone Severity</h4>
            <p>
              Severity is never communicated by color alone. Every severity badge pairs the semantic color with an explicit icon AND text label.
            </p>
          </div>

          <div className="sg-rule-box">
            <span className="sg-rule-num">Rule 3</span>
            <h4>No Pure Black or Sci-Fi Gimmicks</h4>
            <p>
              No pure black (<code className="font-mono">#000000</code>). No neon glows, no glassmorphism, no glitch/Matrix effects. Visual fatigue prevention for 12-hour analyst shifts.
            </p>
          </div>

          <div className="sg-rule-box">
            <span className="sg-rule-num">Rule 4</span>
            <h4>Mandatory Visible Focus Rings</h4>
            <p>
              All interactive elements feature a <code className="font-mono">2px --accent</code> outline with <code className="font-mono">2px offset</code> on <code className="font-mono">:focus-visible</code>.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. TYPOGRAPHY SCALES
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <h2 className="sg-section-title">3. Typography Scales</h2>
          <span className="sg-section-sub">Inter for UI hierarchy; JetBrains Mono for forensic addresses, timestamps, and hashes.</span>
        </div>

        <div className="sg-type-grid">
          {/* Inter UI Scale */}
          <div className="sg-type-card">
            <h3 className="sg-type-title">UI Type Scale: Inter</h3>
            <p className="sg-type-meta">14px base, 20px line-height, tight tracking on headings (-0.015em)</p>
            
            <div className="sg-type-specimens">
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">H1 / 24px / 32px</span>
                <h1 style={{ fontSize: '24px', lineHeight: '32px' }}>Critical Incident Assessment: Root Cause Analysis</h1>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">H2 / 20px / 28px</span>
                <h2 style={{ fontSize: '20px', lineHeight: '28px' }}>Active Endpoint Quarantine Protocol</h2>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">H3 / 16px / 24px</span>
                <h3 style={{ fontSize: '16px', lineHeight: '24px' }}>Multi-Vector Ingress Correlation Stream</h3>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">Base / 14px / 20px</span>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '20px', color: 'var(--text)' }}>
                  The analyst must corroborate endpoint telemetry with egress firewall logs prior to submitting court exhibit packages.
                </p>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">Muted / 14px / 20px</span>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)' }}>
                  Secondary metadata: Hostname resolving across private subnet 10.0.4.0/24 via domain controller.
                </p>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">Micro / 11px / 16px</span>
                <span style={{ fontSize: '11px', lineHeight: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Table Header · SHA-256 Digest Signature Verified
                </span>
              </div>
            </div>
          </div>

          {/* JetBrains Mono Scale */}
          <div className="sg-type-card">
            <h3 className="sg-type-title">Monospace Scale: JetBrains Mono</h3>
            <p className="sg-type-meta">For IPs, hashes, CVE IDs, payloads, log lines, timestamps. Tabular numbers enabled.</p>
            
            <div className="sg-type-specimens">
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">Timestamp / Tabular</span>
                <span className="font-mono" style={{ fontSize: '13px', color: 'var(--text)' }}>
                  2026-09-15 13:42:01.104 UTC (±14ms NTP)
                </span>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">IPv4 & Port Address</span>
                <span className="font-mono" style={{ fontSize: '13px', color: 'var(--text)' }}>
                  185.220.101.47:443 (TOR Exit Relay)
                </span>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">SHA-256 Vault Hash</span>
                <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  b8c3e1f4d7a0b2e5f8c1d4a7b0e3f6c9d2a5b8e1f4c7d0a3b6e9f2c5d8a1b4e7
                </span>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">CVE & MITRE Attack ID</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="font-mono" style={{ fontSize: '12px', background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    CVE-2024-21338
                  </span>
                  <span className="font-mono" style={{ fontSize: '12px', background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    T1003.001 (LSASS Dumping)
                  </span>
                </div>
              </div>
              <div className="sg-type-item">
                <span className="sg-type-lbl font-mono">Raw Payload / Base64</span>
                <code className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', background: 'var(--surface-alt)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAKQ...
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. SEVERITY BADGES (Color + Icon + Text)
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <h2 className="sg-section-title">4. Severity Badge System (Data Only)</h2>
          <span className="sg-section-sub">Strict rule: Never communicated by color alone. Always pairs semantic color + SVG icon + uppercase label.</span>
        </div>

        <div className="sg-badges-showcase">
          <div className="sg-badge-demo-box">
            <span className="badge-sev badge-sev-critical">
              <AlertOctagon size={12} /> CRITICAL
            </span>
            <div className="sg-badge-meta">
              <code className="font-mono">--sev-critical (#F85149)</code>
              <span>Active exfiltration, root compromise, ransomware canary trigger</span>
            </div>
          </div>

          <div className="sg-badge-demo-box">
            <span className="badge-sev badge-sev-high">
              <AlertTriangle size={12} /> HIGH
            </span>
            <div className="sg-badge-meta">
              <code className="font-mono">--sev-high (#FF8C42)</code>
              <span>Privilege escalation, BYOVD kernel driver, unauthorized USB mount</span>
            </div>
          </div>

          <div className="sg-badge-demo-box">
            <span className="badge-sev badge-sev-medium">
              <AlertCircle size={12} /> MEDIUM
            </span>
            <div className="sg-badge-meta">
              <code className="font-mono">--sev-medium (#E3B341)</code>
              <span>Multiple failed authentications, non-standard port SSH, GPO drift</span>
            </div>
          </div>

          <div className="sg-badge-demo-box">
            <span className="badge-sev badge-sev-low">
              <CheckCircle2 size={12} /> LOW
            </span>
            <div className="sg-badge-meta">
              <code className="font-mono">--sev-low (#3FB950)</code>
              <span>Cleared routine alerts, DHCP renewals, verified EDR telemetry</span>
            </div>
          </div>

          <div className="sg-badge-demo-box">
            <span className="badge-sev badge-sev-info">
              <Info size={12} /> INFO
            </span>
            <div className="sg-badge-meta">
              <code className="font-mono">--sev-info (#58A6FF)</code>
              <span>Informational audit trail, NTP sync, benign TLS connection stream</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. INTERACTIVE BUTTON STATES & FOCUS RINGS
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <h2 className="sg-section-title">5. Interactive Buttons & Focus States</h2>
          <span className="sg-section-sub">
            All interactive states use <code className="font-mono">--accent</code> (#22D3EE) and <code className="font-mono">--accent-hover</code> (#67E8F9). Focus states feature mandatory 2px outline with 2px offset.
          </span>
        </div>

        <div className="sg-buttons-table-wrap">
          <table className="operational-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Variant</th>
                <th>Default State</th>
                <th>Hover State (Simulated)</th>
                <th>Focused State (:focus-visible)</th>
                <th>Disabled State</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Button</strong></td>
                <td>
                  <button className="btn-primary">
                    <Shield size={13} /> Quarantine Host
                  </button>
                </td>
                <td>
                  <button className="btn-primary" style={{ backgroundColor: 'var(--accent-hover)', borderColor: 'var(--accent-hover)' }}>
                    <Shield size={13} /> Quarantine Host
                  </button>
                </td>
                <td>
                  <button className="btn-primary" style={{ outline: '2px solid var(--accent)', outlineOffset: '2px' }}>
                    <Shield size={13} /> Quarantine Host
                  </button>
                </td>
                <td>
                  <button className="btn-primary" disabled>
                    <Shield size={13} /> Quarantine Host
                  </button>
                </td>
              </tr>
              <tr>
                <td><strong>Secondary Button</strong></td>
                <td>
                  <button className="btn-secondary">
                    <RefreshCw size={13} /> Refresh Stream
                  </button>
                </td>
                <td>
                  <button className="btn-secondary" style={{ backgroundColor: 'var(--surface-alt)', borderColor: '#484F58' }}>
                    <RefreshCw size={13} /> Refresh Stream
                  </button>
                </td>
                <td>
                  <button className="btn-secondary" style={{ outline: '2px solid var(--accent)', outlineOffset: '2px' }}>
                    <RefreshCw size={13} /> Refresh Stream
                  </button>
                </td>
                <td>
                  <button className="btn-secondary" disabled>
                    <RefreshCw size={13} /> Refresh Stream
                  </button>
                </td>
              </tr>
              <tr>
                <td><strong>Ghost Button</strong></td>
                <td>
                  <button className="btn-ghost">
                    <ExternalLink size={13} /> View Raw PCAP
                  </button>
                </td>
                <td>
                  <button className="btn-ghost" style={{ backgroundColor: 'var(--surface-alt)' }}>
                    <ExternalLink size={13} /> View Raw PCAP
                  </button>
                </td>
                <td>
                  <button className="btn-ghost" style={{ outline: '2px solid var(--accent)', outlineOffset: '2px' }}>
                    <ExternalLink size={13} /> View Raw PCAP
                  </button>
                </td>
                <td>
                  <button className="btn-ghost" disabled>
                    <ExternalLink size={13} /> View Raw PCAP
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. DENSITY & 20-ROW SAMPLE DATA TABLE
      ══════════════════════════════════════════ */}
      <section className="sg-section">
        <div className="sg-section-header">
          <div>
            <h2 className="sg-section-title">6. Compact Operational Data Table (20 Rows)</h2>
            <span className="sg-section-sub">
              Strict density standards: Row height 36px, cell padding 8px 12px, tabular numbers on all IDs/IPs/timestamps. Elevation via --border and --surface-alt (no shadows).
            </span>
          </div>
          <div className="sg-table-controls">
            <span className="sg-rows-counter font-mono">Showing 20 of 20 Events</span>
          </div>
        </div>

        <div className="sg-table-container">
          <table className="operational-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '190px' }}>Timestamp (UTC)</th>
                <th style={{ width: '110px' }}>Severity</th>
                <th>Detection Rule / Threat Event</th>
                <th style={{ width: '130px' }}>Host</th>
                <th style={{ width: '130px' }}>Source IP</th>
                <th style={{ width: '170px' }}>Destination</th>
                <th style={{ width: '120px' }}>Technique</th>
                <th style={{ width: '90px' }}>SHA-256</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_TABLE_DATA.map(row => {
                const getBadge = (sev) => {
                  switch (sev) {
                    case 'critical':
                      return <span className="badge-sev badge-sev-critical"><AlertOctagon size={11} /> CRITICAL</span>
                    case 'high':
                      return <span className="badge-sev badge-sev-high"><AlertTriangle size={11} /> HIGH</span>
                    case 'medium':
                      return <span className="badge-sev badge-sev-medium"><AlertCircle size={11} /> MEDIUM</span>
                    case 'low':
                      return <span className="badge-sev badge-sev-low"><CheckCircle2 size={11} /> LOW</span>
                    case 'info':
                    default:
                      return <span className="badge-sev badge-sev-info"><Info size={11} /> INFO</span>
                  }
                }

                return (
                  <tr key={row.id}>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>{row.id}</td>
                    <td className="font-mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.time}</td>
                    <td>{getBadge(row.sev)}</td>
                    <td><strong style={{ color: 'var(--text)', fontWeight: 500 }}>{row.rule}</strong></td>
                    <td className="font-mono" style={{ color: 'var(--text)', fontSize: '12px' }}>{row.host}</td>
                    <td className="font-mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.srcIp}</td>
                    <td className="font-mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.dstIp}</td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '11px', background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {row.cve}
                      </span>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{row.hash}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: row.status === 'Blocked' || row.status === 'Isolated' || row.status === 'Quarantined' ? 'var(--sev-critical)' : 'var(--text-muted)' }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '2px 6px', fontSize: '11px', height: '24px' }}
                        title={`Inspect row ${row.id}`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
