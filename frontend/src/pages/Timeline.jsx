import { useState, useMemo } from 'react'
import {
  GitBranch, Video, Lock, Monitor, Usb,
  FileSearch, Network, Brain, Calendar,
  Filter, Search, ZoomIn, ZoomOut, Maximize2,
  Minimize2, Shield, AlertTriangle, CheckCircle2,
  Clock, X, ChevronRight, ArrowRight, Share2,
  Sparkles, Layers, FileCode, Tag, Eye,
  SlidersHorizontal, Download, Play, RefreshCw
} from 'lucide-react'
import './Timeline.css'

/* ═══════════════════════════════════════════════════
   TIMELINE FORENSIC EVENTS DATASET
═══════════════════════════════════════════════════ */
const TIMELINE_EVENTS = [
  {
    id: 'TL-001',
    time: '09:45:10',
    timeFormatted: '09:45:10 UTC',
    date: '2026-08-20',
    source: 'System Logs',
    sourceCategory: 'system',
    icon: Monitor,
    event: 'Routine automated system backup completed on NAS-01',
    detail: 'Volume Shadow Copy shadow_id_44091 archived without error. Snapshot size: 142 GB.',
    entity: 'NAS-01 Server',
    entityType: 'Host',
    risk: 'low',
    riskScore: 5,
    evidenceId: 'EVD-SYS-0089',
    evidenceName: 'nas_backup_syslog.evtx',
    correlated: false,
    aiExplanation: 'Routine background maintenance. Timestamp precedes investigation scope with zero anomalous parameters.',
    relatedEventIds: []
  },
  {
    id: 'TL-002',
    time: '10:00:22',
    timeFormatted: '10:00:22 UTC',
    date: '2026-08-20',
    source: 'Access Control',
    sourceCategory: 'access',
    icon: Lock,
    event: 'Main Lobby badge scan — Guard Shift Handover',
    detail: 'Badge EMP-0012 verified at Lobby Turnstile A. Normal shift turnover log recorded.',
    entity: 'Turnstile A',
    entityType: 'Access Point',
    risk: 'low',
    riskScore: 8,
    evidenceId: 'EVD-ACS-0012',
    evidenceName: 'lobby_access_log.csv',
    correlated: false,
    aiExplanation: 'Normal baseline activity. Standard security personnel turnover logged in compliance with building policies.',
    relatedEventIds: []
  },
  {
    id: 'TL-003',
    time: '10:02:14',
    timeFormatted: '10:02:14 UTC',
    date: '2026-08-20',
    source: 'CCTV',
    sourceCategory: 'cctv',
    icon: Video,
    event: 'Person entered restricted area',
    detail: 'Camera CAM-07 captured unrecognized individual in dark attire entering restricted corridor outside Server Room B without badge presentation.',
    entity: 'Person / Subject Alpha',
    entityType: 'Person',
    risk: 'high',
    riskScore: 78,
    evidenceId: 'E-001',
    evidenceName: 'cctv_camera_01.mp4',
    correlated: true,
    correlationStep: 1,
    aiExplanation: 'NEXUS-7 flagged anomalous physical presence at Server Room B corridor. Computer vision confidence 84% on unauthorized entry trajectory 48 seconds prior to door opening.',
    relatedEventIds: ['TL-004', 'TL-005', 'TL-006', 'TL-007', 'TL-008']
  },
  {
    id: 'TL-004',
    time: '10:03:02',
    timeFormatted: '10:03:02 UTC',
    date: '2026-08-20',
    source: 'Access Control',
    sourceCategory: 'access',
    icon: Lock,
    event: 'Door opened using Card #27',
    detail: 'Physical Access Door DR-B02 (Server Room B) unlocked via badge Card #27 (Registered to EMP-4421 / J. Smith). Door held open for 14 seconds.',
    entity: 'Card #27',
    entityType: 'Credential',
    risk: 'high',
    riskScore: 82,
    evidenceId: 'EVD-ACS-0041',
    evidenceName: 'server_room_b_access.csv',
    correlated: true,
    correlationStep: 2,
    aiExplanation: 'Temporal & spatial alignment with TL-003 (CCTV CAM-07). Badge Card #27 used to breach Server Room B perimeter immediately following visual detection of unidentified subject.',
    relatedEventIds: ['TL-003', 'TL-005', 'TL-006', 'TL-007', 'TL-008']
  },
  {
    id: 'TL-005',
    time: '10:04:10',
    timeFormatted: '10:04:10 UTC',
    date: '2026-08-20',
    source: 'System Logs',
    sourceCategory: 'system',
    icon: Monitor,
    event: 'User login on LAPTOP-07',
    detail: 'Interactive Kerberos logon (Event ID 4624, Logon Type 2) recorded on LAPTOP-07 / WKST-041 under identity jsmith@corp.int.',
    entity: 'LAPTOP-07',
    entityType: 'Host / Device',
    risk: 'medium',
    riskScore: 64,
    evidenceId: 'E-002',
    evidenceName: 'windows_event_logs.evtx',
    correlated: true,
    correlationStep: 3,
    aiExplanation: 'Logon on physical terminal LAPTOP-07 located inside Server Room B occurred 68 seconds after door access via Card #27, confirming continuity of operator presence.',
    relatedEventIds: ['TL-003', 'TL-004', 'TL-006', 'TL-007', 'TL-008']
  },
  {
    id: 'TL-006',
    time: '10:05:32',
    timeFormatted: '10:05:32 UTC',
    date: '2026-08-20',
    source: 'USB Logs',
    sourceCategory: 'usb',
    icon: Usb,
    event: 'USB-123 connected',
    detail: 'Removable Mass Storage USB-123 (SanDisk Cruzer Glide 128GB, Serial: SDCZ48-128G-84912) mounted as Drive E:\\. Device not registered in authorized asset database.',
    entity: 'USB-123',
    entityType: 'Hardware Artifact',
    risk: 'critical',
    riskScore: 94,
    evidenceId: 'E-004',
    evidenceName: 'usb_activity_log.csv',
    correlated: true,
    correlationStep: 4,
    aiExplanation: 'Unregistered high-capacity USB hardware inserted on LAPTOP-07 exactly 82 seconds post-login. CIPHER-3 identified staging folder E:\\tmp initialized immediately upon mounting.',
    relatedEventIds: ['TL-003', 'TL-004', 'TL-005', 'TL-007', 'TL-008']
  },
  {
    id: 'TL-007',
    time: '10:07:45',
    timeFormatted: '10:07:45 UTC',
    date: '2026-08-20',
    source: 'File Activity',
    sourceCategory: 'file',
    icon: FileSearch,
    event: 'Confidential documents accessed',
    detail: '34 sensitive financial models copied from secure CIFS volume \\\\fs-core\\Finance\\Q2-Projections\\ to staging directory E:\\tmp\\archive.tar.gz (2.1 GB payload).',
    entity: '/Finance/Q2-Projections/',
    entityType: 'File Repository',
    risk: 'critical',
    riskScore: 96,
    evidenceId: 'E-002',
    evidenceName: 'windows_event_logs.evtx',
    correlated: true,
    correlationStep: 5,
    aiExplanation: 'Direct batch extraction targeting confidential Q2 financial projections. High directory traversal velocity and tar-compression indicates deliberate exfiltration staging.',
    relatedEventIds: ['TL-003', 'TL-004', 'TL-005', 'TL-006', 'TL-008']
  },
  {
    id: 'TL-008',
    time: '10:09:20',
    timeFormatted: '10:09:20 UTC',
    date: '2026-08-20',
    source: 'Network Logs',
    sourceCategory: 'network',
    icon: Network,
    event: 'Large outbound transfer detected',
    detail: '1.8 GB encrypted TLS 1.3 payload transmitted in burst egress to remote IP 185.220.101.47:443 (TOR Exit Consensus). High entropy (7.98 bits/byte).',
    entity: '185.220.101.47 (TOR)',
    entityType: 'Network IP',
    risk: 'critical',
    riskScore: 98,
    evidenceId: 'E-003',
    evidenceName: 'firewall_egress_logs.csv',
    correlated: true,
    correlationStep: 6,
    aiExplanation: 'Causal climax of exfiltration sequence. High-volume encrypted stream to verified TOR routing node matches file staging completion timeline within 95-second delta.',
    relatedEventIds: ['TL-003', 'TL-004', 'TL-005', 'TL-006', 'TL-007']
  },
  {
    id: 'TL-009',
    time: '10:14:05',
    timeFormatted: '10:14:05 UTC',
    date: '2026-08-20',
    source: 'CCTV',
    sourceCategory: 'cctv',
    icon: Video,
    event: 'Subject exit observed via North Perimeter Stairwell',
    detail: 'Camera CAM-03 recorded subject departing facility through ground-level exit door into external parking quadrant.',
    entity: 'Person / Subject Alpha',
    entityType: 'Person',
    risk: 'high',
    riskScore: 75,
    evidenceId: 'E-001',
    evidenceName: 'cctv_camera_01.mp4',
    correlated: false,
    aiExplanation: 'Post-incident movement tracking. Subject exited building perimeter approximately 4 minutes after network egress termination.',
    relatedEventIds: ['TL-003', 'TL-008']
  },
  {
    id: 'TL-010',
    time: '10:18:30',
    timeFormatted: '10:18:30 UTC',
    date: '2026-08-20',
    source: 'System Logs',
    sourceCategory: 'system',
    icon: Monitor,
    event: 'LAPTOP-07 session locked via inactivity timer',
    detail: 'Workstation lock screen activated (Event ID 4800). No further mouse/keyboard inputs received.',
    entity: 'LAPTOP-07',
    entityType: 'Host / Device',
    risk: 'low',
    riskScore: 10,
    evidenceId: 'E-002',
    evidenceName: 'windows_event_logs.evtx',
    correlated: false,
    aiExplanation: 'Automated 10-minute workstation screen lock policy triggered after operator vacated terminal.',
    relatedEventIds: ['TL-005']
  }
]

const SOURCES = ['All Sources', 'CCTV', 'Access Control', 'System Logs', 'USB Logs', 'File Activity', 'Network Logs']
const ENTITIES = ['All Entities', 'Person / Subject Alpha', 'Card #27', 'LAPTOP-07', 'USB-123', '/Finance/Q2-Projections/', '185.220.101.47 (TOR)']
const DATE_RANGES = [
  { label: 'Incident Window (Aug 20, 10:00–10:20)', value: 'incident' },
  { label: 'Full Day (Aug 20, 2026)', value: 'day' },
  { label: 'All History', value: 'all' }
]

export default function Timeline() {
  const [selectedEvent, setSelectedEvent] = useState(TIMELINE_EVENTS[2]) // Default selected: CCTV event
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [entityFilter, setEntityFilter] = useState('All Entities')
  const [dateRange, setDateRange] = useState('incident')
  const [searchQuery, setSearchQuery] = useState('')
  const [zoomLevel, setZoomLevel] = useState('standard') // compact | standard | detailed
  const [onlyCorrelated, setOnlyCorrelated] = useState(false)
  const [highlightChain, setHighlightChain] = useState(true)

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    return TIMELINE_EVENTS.filter(e => {
      // Source filter
      if (sourceFilter !== 'All Sources' && e.source !== sourceFilter) return false
      // Entity filter
      if (entityFilter !== 'All Entities' && e.entity !== entityFilter) return false
      // Only Correlated
      if (onlyCorrelated && !e.correlated) return false
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        return (
          e.event.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q) ||
          e.entity.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [sourceFilter, entityFilter, onlyCorrelated, searchQuery])

  // Count stats
  const correlatedCount = TIMELINE_EVENTS.filter(e => e.correlated).length
  const criticalCount = TIMELINE_EVENTS.filter(e => e.risk === 'critical').length

  const [toastMsg, setToastMsg] = useState(null)

  const handleExportTimeline = () => {
    const csvRows = [
      ['Event ID', 'Timestamp (UTC)', 'Source', 'Entity', 'Risk', 'Correlated', 'Event Description', 'Detail', 'Evidence Reference'],
      ...filteredEvents.map(e => [
        e.id,
        e.timeFormatted,
        `"${e.source}"`,
        `"${e.entity}"`,
        e.risk,
        e.correlated ? 'Yes' : 'No',
        `"${e.event.replace(/"/g, '""')}"`,
        `"${e.detail.replace(/"/g, '""')}"`,
        `"${e.evidenceName || ''}"`
      ])
    ]
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(r => r.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `synapsex_timeline_CASE-2026-001_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setToastMsg(`Exported ${filteredEvents.length} timeline events to CSV`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleSelectRelated = (relId) => {
    const target = TIMELINE_EVENTS.find(e => e.id === relId)
    if (target) {
      setSelectedEvent(target)
      const el = document.getElementById(`tl-node-${relId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className={`tl-root ${selectedEvent ? 'tl-root--panel-open' : ''}`}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--accent)',
          borderRadius: '6px',
          padding: '10px 16px',
          color: 'var(--text)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <header className="tl-page-header">
        <div className="tl-header-left">
          <div className="tl-eyebrow">
            <GitBranch size={13} className="tl-eyebrow-icon" />
            <span>Digital Event Reconstruction & Multi-Source Synthesis</span>
          </div>
          <h1 className="tl-page-title">Investigation Timeline</h1>
          <p className="tl-page-sub">
            CASE-2026-001 · Cross-correlated timeline from CCTV, Physical Access, Windows Event Logs, USB Hardware, CIFS Audits & PCAP Streams
          </p>
        </div>

        <div className="tl-header-actions">
          <button 
            className={`tl-btn-toggle ${highlightChain ? 'tl-btn-toggle--active' : ''}`}
            onClick={() => setHighlightChain(!highlightChain)}
            id="highlight-chain-btn"
          >
            <Sparkles size={13} />
            <span>{highlightChain ? 'Causal Chain Illuminated' : 'Highlight Causal Chain'}</span>
          </button>
          
          <button 
            className="tl-btn-primary" 
            id="export-timeline-btn"
            onClick={handleExportTimeline}
            title="Download chronological event log CSV"
          >
            <Download size={13} />
            <span>Export Timeline (CSV / STIX 2.1)</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          CONTROLS TOOLBAR
      ══════════════════════════════════════════ */}
      <section className="tl-toolbar-card">
        <div className="tl-toolbar-row">

          {/* Date Range Selector */}
          <div className="tl-ctrl-group">
            <label className="tl-ctrl-label"><Calendar size={11} /> Date Window</label>
            <select 
              className="tl-select"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              id="date-range-select"
            >
              {DATE_RANGES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Filter by Evidence Source */}
          <div className="tl-ctrl-group">
            <label className="tl-ctrl-label"><Layers size={11} /> Evidence Source</label>
            <select 
              className="tl-select"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              id="source-filter-select"
            >
              {SOURCES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filter by Entity */}
          <div className="tl-ctrl-group">
            <label className="tl-ctrl-label"><Tag size={11} /> Target Entity</label>
            <select 
              className="tl-select"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              id="entity-filter-select"
            >
              {ENTITIES.map(en => (
                <option key={en} value={en}>{en}</option>
              ))}
            </select>
          </div>

          {/* Search Events */}
          <div className="tl-ctrl-group tl-ctrl-group--search">
            <label className="tl-ctrl-label"><Search size={11} /> Search Events</label>
            <div className="tl-search-box">
              <input 
                type="text"
                placeholder="Search timestamps, labels, entities, payloads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="tl-search-input"
                id="timeline-search-input"
              />
              {searchQuery && (
                <button className="tl-clear-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          {/* Zoom Level & View Mode */}
          <div className="tl-ctrl-group tl-ctrl-group--zoom">
            <label className="tl-ctrl-label"><ZoomIn size={11} /> Zoom Scale</label>
            <div className="tl-zoom-chips">
              {['compact', 'standard', 'detailed'].map(z => (
                <button
                  key={z}
                  className={`tl-zoom-chip ${zoomLevel === z ? 'tl-zoom-chip--active' : ''}`}
                  onClick={() => setZoomLevel(z)}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Filter Bar */}
        <div className="tl-subbar">
          <div className="tl-subbar-left">
            <span className="tl-stat-pill"><strong>{filteredEvents.length}</strong> events displayed</span>
            <span className="tl-stat-pill tl-stat-pill--corr"><strong>{correlatedCount}</strong> correlated steps</span>
            <span className="tl-stat-pill tl-stat-pill--crit"><strong>{criticalCount}</strong> high risk</span>
          </div>

          <div className="tl-subbar-right">
            <label className="tl-checkbox-label">
              <input 
                type="checkbox"
                checked={onlyCorrelated}
                onChange={e => setOnlyCorrelated(e.target.checked)}
              />
              <span>Show Correlated Exfiltration Sequence Only</span>
            </label>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAIN TIMELINE DISPLAY
      ══════════════════════════════════════════ */}
      <div className="tl-main-container">

        {/* Vertical Interactive Timeline Canvas */}
        <main className="tl-canvas-card">
          
          {/* Timeline Spine / Center Rail */}
          <div className="tl-spine-line" />

          {filteredEvents.length === 0 ? (
            <div className="tl-empty-state">
              <Search size={32} className="tl-empty-icon" />
              <h3>No Events Match Filters</h3>
              <p>Try resetting the source or entity filters to broaden your search criteria.</p>
              <button 
                className="tl-btn-ghost" 
                onClick={() => { setSourceFilter('All Sources'); setEntityFilter('All Entities'); setSearchQuery(''); setOnlyCorrelated(false) }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={`tl-events-stream tl-events-stream--${zoomLevel}`}>
              {filteredEvents.map((evt, idx) => {
                const Icon = evt.icon
                const isSelected = selectedEvent?.id === evt.id
                const isChainActive = highlightChain && evt.correlated

                return (
                  <article
                    key={evt.id}
                    id={`tl-node-${evt.id}`}
                    className={`tl-event-node tl-event-node--${evt.risk} ${isSelected ? 'tl-event-node--selected' : ''} ${isChainActive ? 'tl-event-node--chain-glow' : ''}`}
                    onClick={() => setSelectedEvent(evt)}
                  >
                    {/* Timestamp Column */}
                    <div className="tl-node-time-col">
                      <span className="tl-node-timestamp">{evt.time}</span>
                      <span className="tl-node-date">{evt.date}</span>
                    </div>

                    {/* Node Glyphs / Anchor on Rail */}
                    <div className={`tl-node-glyph tl-node-glyph--${evt.risk} ${evt.correlated ? 'tl-node-glyph--corr' : ''}`}>
                      {evt.correlated ? (
                        <span className="tl-corr-num">#{evt.correlationStep}</span>
                      ) : (
                        <Icon size={12} strokeWidth={2} />
                      )}
                      <div className="tl-node-ping" />
                    </div>

                    {/* Event Content Card */}
                    <div className="tl-card-container">
                      <div className="tl-card-header">
                        <div className="tl-card-source-wrap">
                          <span className={`tl-source-badge tl-source-badge--${evt.sourceCategory}`}>
                            <Icon size={11} strokeWidth={2} />
                            {evt.source}
                          </span>
                          
                          {evt.correlated && (
                            <span className="tl-seq-badge">
                              <Sparkles size={9} /> Sequence Step {evt.correlationStep} of 6
                            </span>
                          )}
                        </div>

                        <div className="tl-card-risk-wrap">
                          <span className={`tl-risk-pill tl-risk-pill--${evt.risk}`}>
                            Risk Score: {evt.riskScore}/100 ({evt.risk.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="tl-event-title">{evt.event}</h3>

                      {/* Detailed Description */}
                      {zoomLevel !== 'compact' && (
                        <p className="tl-event-description">{evt.detail}</p>
                      )}

                      {/* Footer: Entity Tag & Evidence ID */}
                      <div className="tl-card-footer">
                        <div className="tl-entity-chip">
                          <Tag size={10} />
                          <span className="entity-type">{evt.entityType}:</span>
                          <strong className="entity-name">{evt.entity}</strong>
                        </div>

                        <div className="tl-evidence-ref">
                          <FileCode size={10} />
                          <span>{evt.evidenceId}</span>
                        </div>

                        <ChevronRight size={13} className="tl-card-arrow" />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>

        {/* ══════════════════════════════════════════
            RIGHT DETAILS PANEL
        ══════════════════════════════════════════ */}
        {selectedEvent && (
          <aside className="tl-side-panel" id="timeline-details-panel">
            
            {/* Panel Header */}
            <div className="tl-panel-header">
              <div className="tl-panel-title-group">
                <span className="tl-panel-event-id">{selectedEvent.id}</span>
                <h3 className="tl-panel-title">{selectedEvent.event}</h3>
              </div>
              <button 
                className="tl-panel-close-btn" 
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event inspection panel"
              >
                <X size={15} />
              </button>
            </div>

            {/* Panel Scrollable Body */}
            <div className="tl-panel-body">

              {/* Status & Risk Metric Banner */}
              <div className={`tl-panel-risk-banner tl-panel-risk-banner--${selectedEvent.risk}`}>
                <div className="risk-banner-left">
                  <AlertTriangle size={16} />
                  <div>
                    <span className="risk-banner-label">Assessed Event Severity</span>
                    <strong className="risk-banner-val">{selectedEvent.risk.toUpperCase()} SEVERITY (SCORE {selectedEvent.riskScore}/100)</strong>
                  </div>
                </div>
                {selectedEvent.correlated && (
                  <span className="risk-corr-tag">Seq #{selectedEvent.correlationStep} in Chain</span>
                )}
              </div>

              {/* AI Correlation Explanation */}
              <div className="tl-panel-section">
                <div className="tl-section-hdr">
                  <Brain size={13} className="sec-icon sec-icon--ai" />
                  <h4>AI Correlation Explanation</h4>
                </div>
                <div className="tl-ai-box">
                  <p className="tl-ai-text">{selectedEvent.aiExplanation}</p>
                  <div className="tl-ai-model-tag">
                    <Sparkles size={10} /> Generated by SynapseX-Forge-v3 (NEXUS-7 Synthesis)
                  </div>
                </div>
              </div>

              {/* Timestamp & Precision Data */}
              <div className="tl-panel-section">
                <div className="tl-section-hdr">
                  <Clock size={13} className="sec-icon" />
                  <h4>Chronological Telemetry</h4>
                </div>
                <div className="tl-meta-grid">
                  <div className="meta-cell">
                    <span className="meta-k">Normalized UTC Time</span>
                    <span className="meta-v">{selectedEvent.timeFormatted}</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-k">Calendar Date</span>
                    <span className="meta-v">{selectedEvent.date}</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-k">NTP Reference Offset</span>
                    <span className="meta-v">&plusmn;14ms (Synchronized)</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-k">Correlation Sequence</span>
                    <span className="meta-v">{selectedEvent.correlated ? `Step #${selectedEvent.correlationStep} of 6` : 'Uncorrelated'}</span>
                  </div>
                </div>
              </div>

              {/* Entities Involved */}
              <div className="tl-panel-section">
                <div className="tl-section-hdr">
                  <Tag size={13} className="sec-icon" />
                  <h4>Entities Involved</h4>
                </div>
                <div className="tl-entity-card">
                  <div className="entity-avatar">{selectedEvent.entityType.charAt(0)}</div>
                  <div className="entity-info">
                    <span className="entity-tag-type">{selectedEvent.entityType}</span>
                    <strong className="entity-tag-name">{selectedEvent.entity}</strong>
                  </div>
                </div>
              </div>

              {/* Source Evidence Details */}
              <div className="tl-panel-section">
                <div className="tl-section-hdr">
                  <FileCode size={13} className="sec-icon" />
                  <h4>Source Evidence Artifact</h4>
                </div>
                <div className="tl-evidence-box">
                  <div className="ev-row-item">
                    <span className="ev-k">Artifact ID:</span>
                    <code className="ev-v-id">{selectedEvent.evidenceId}</code>
                  </div>
                  <div className="ev-row-item">
                    <span className="ev-k">File Name:</span>
                    <span className="ev-v">{selectedEvent.evidenceName}</span>
                  </div>
                  <div className="ev-row-item">
                    <span className="ev-k">Origin Channel:</span>
                    <span className="ev-v">{selectedEvent.source}</span>
                  </div>
                  <div className="ev-row-item">
                    <span className="ev-k">Raw Observation:</span>
                    <p className="ev-v-raw">{selectedEvent.detail}</p>
                  </div>
                </div>
              </div>

              {/* Related Events Links */}
              {selectedEvent.relatedEventIds.length > 0 && (
                <div className="tl-panel-section">
                  <div className="tl-section-hdr">
                    <Share2 size={13} className="sec-icon" />
                    <h4>Related Chronological Events</h4>
                  </div>
                  <div className="tl-related-list">
                    {selectedEvent.relatedEventIds.map(relId => {
                      const relEvt = TIMELINE_EVENTS.find(e => e.id === relId)
                      if (!relEvt) return null
                      return (
                        <div 
                          key={relId}
                          className="tl-related-item"
                          onClick={() => handleSelectRelated(relId)}
                        >
                          <div className="rel-time-col">
                            <span className="rel-time">{relEvt.time}</span>
                            <span className="rel-source">{relEvt.source}</span>
                          </div>
                          <span className="rel-label">{relEvt.event}</span>
                          <ArrowRight size={12} className="rel-arrow" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="tl-panel-actions">
                <button className="tl-panel-btn tl-panel-btn--primary">
                  <Eye size={13} /> View in Evidence Vault
                </button>
                <button className="tl-panel-btn tl-panel-btn--ghost">
                  <Share2 size={13} /> Graph Correlation
                </button>
              </div>

            </div>
          </aside>
        )}

      </div>

    </div>
  )
}
