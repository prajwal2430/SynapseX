import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Cpu, FileText,
  ChevronRight, ChevronDown, Clock,
  HardDrive, Brain, AlertTriangle, Activity,
  Shield, Users, Network, Usb, Video,
  Lock, Monitor, FileSearch, MessageSquare,
  CheckCircle2, Circle, Loader2, BarChart3,
  Eye, Zap, Database, GitBranch, Share2,
  TrendingUp, RefreshCw, MoreHorizontal,
  Flag, Star, Bookmark, Download, Play,
} from 'lucide-react'
import './CaseWorkspace.css'

/* ═══════════════════════════════════════════════════
   STATIC MOCK DATA
═══════════════════════════════════════════════════ */
const CASE = {
  id: 'CASE-2026-001',
  name: 'Suspected Data Exfiltration',
  status: 'active',
  priority: 'critical',
  type: 'Data Exfiltration',
  investigator: 'Demo Investigator',
  lead: 'Sr. Analyst',
  team: ['Demo Investigator', 'J. Ramirez'],
  created: '2026-08-20',
  createdFull: '2026-08-20 08:00 UTC',
  lastUpdated: '12m ago',
  tlp: 'TLP:RED',
  classification: 'CONFIDENTIAL',
  description:
    'Insider threat investigation involving suspected exfiltration of Q2 financial projections via an unregistered USB device and TOR network egress. Physical access anomalies recorded at Server Room B. AI correlation confidence at 67%.',
}

const PROGRESS_STAGES = [
  {
    id: 'collection',
    label: 'Evidence Processing',
    icon: Database,
    status: 'done',
    detail: '1,248 artifacts ingested',
    pct: 100,
  },
  {
    id: 'correlation',
    label: 'Correlation',
    icon: Share2,
    status: 'done',
    detail: '6 event clusters formed',
    pct: 100,
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    icon: Brain,
    status: 'active',
    detail: 'AI confidence: 67%',
    pct: 67,
  },
  {
    id: 'review',
    label: 'Human Review',
    icon: Eye,
    status: 'pending',
    detail: 'Awaiting analyst sign-off',
    pct: 0,
  },
]

const EVIDENCE_STATS = [
  { label: 'Total Items',         value: 1248, color: 'blue',  icon: HardDrive },
  { label: 'Processed',           value: 1201, color: 'green', icon: CheckCircle2 },
  { label: 'Flagged',             value: 47,   color: 'red',   icon: Flag },
  { label: 'Under Analysis',      value: 23,   color: 'cyan',  icon: Loader2 },
]

const EVIDENCE_TYPES = [
  { type: 'Disk Image',        count: 3,   pct: 2  },
  { type: 'Network PCAP',      count: 18,  pct: 14 },
  { type: 'File System Logs',  count: 412, pct: 33 },
  { type: 'Access Logs',       count: 289, pct: 23 },
  { type: 'Memory Dump',       count: 2,   pct: 2  },
  { type: 'Email Archives',    count: 156, pct: 12 },
  { type: 'USB Artifacts',     count: 87,  pct: 7  },
  { type: 'CCTV Footage',      count: 12,  pct: 9  },
  { type: 'Other',             count: 269, pct: 21 },
]

const RECENT_EVENTS = [
  {
    id: 'ev1', time: '10:02', source: 'CCTV',
    label: 'Person entered restricted area — Server Room B',
    icon: Video, type: 'suspicious', ioc: false,
  },
  {
    id: 'ev2', time: '10:03', source: 'Access Control',
    label: 'Door opened via tailgating — Badge mismatch',
    icon: Lock, type: 'suspicious', ioc: false,
  },
  {
    id: 'ev3', time: '10:04', source: 'System',
    label: 'User jsmith@corp.int logged in on WKST-041',
    icon: Monitor, type: 'normal', ioc: false,
  },
  {
    id: 'ev4', time: '10:05', source: 'USB',
    label: 'Unregistered SanDisk 128GB connected — SDCZ48-128G',
    icon: Usb, type: 'critical', ioc: true,
  },
  {
    id: 'ev5', time: '10:07', source: 'File Activity',
    label: '34 files read from /Finance/Q2-Projections/ — 2.1 GB',
    icon: FileSearch, type: 'critical', ioc: true,
  },
  {
    id: 'ev6', time: '10:09', source: 'Network',
    label: '1.8 GB transferred → 185.220.101.47 (TOR Exit Node)',
    icon: Network, type: 'critical', ioc: true,
  },
]

const AI_FINDINGS = [
  {
    id: 'af1',
    title: 'Correlated Exfiltration Sequence',
    confidence: 'high',
    confidencePct: 82,
    summary: 'Physical access anomaly (CAM-07) → credential use (WKST-041) → USB staging → TOR egress. All events within 7-minute window, strongly indicating coordinated insider action.',
    iocs: 3,
    evidence: 5,
    severity: 'critical',
    status: 'active',
  },
  {
    id: 'af2',
    title: 'Financial Data Targeted Specifically',
    confidence: 'medium',
    confidencePct: 67,
    summary: 'File path analysis shows deliberate navigation to /Finance/Q2-Projections/ with no prior access history for the identified user. Selection pattern suggests prior intelligence of file location.',
    iocs: 1,
    evidence: 3,
    severity: 'high',
    status: 'active',
  },
  {
    id: 'af3',
    title: 'TOR Exit Node — Known Bad Infrastructure',
    confidence: 'high',
    confidencePct: 95,
    summary: '185.220.101.47 confirmed TOR exit node (Tor Project consensus). IP previously observed in threat intel feeds associated with corporate espionage campaigns.',
    iocs: 1,
    evidence: 2,
    severity: 'critical',
    status: 'verified',
  },
  {
    id: 'af4',
    title: 'Possible Accomplice — Badge Access Pattern',
    confidence: 'low',
    confidencePct: 34,
    summary: 'Access control logs show Badge EMP-4421 used to enter Server Room B while jsmith@corp.int simultaneously logs in remotely. Two-person coordination cannot be ruled out.',
    iocs: 0,
    evidence: 2,
    severity: 'medium',
    status: 'unverified',
  },
]

const AGENT_ACTIVITY = [
  { agent: 'NEXUS-7',   role: 'Correlation Engine',    status: 'active',  action: 'Cross-referencing USB serial against asset registry',       time: '1m ago',  pct: 78 },
  { agent: 'CIPHER-3',  role: 'Crypto Analyst',         status: 'active',  action: 'Analyzing TLS session keys from PCAP EVD-0047',             time: '3m ago',  pct: 45 },
  { agent: 'SPECTER-1', role: 'Network Graph Mapper',   status: 'idle',    action: 'Network topology mapping completed (34 nodes)',              time: '12m ago', pct: 100 },
  { agent: 'ARGUS-5',   role: 'Timeline Reconstructor', status: 'active',  action: 'Aligning filesystem timestamps with NTP reference',          time: '7m ago',  pct: 61 },
  { agent: 'PHANTOM-2', role: 'OSINT Intelligence',     status: 'queued',  action: 'Awaiting IOC enrichment queue — 185.220.101.47',             time: '—',       pct: 0  },
]

const IOCS = [
  { type: 'IP',     value: '185.220.101.47',  label: 'TOR Exit Node',       severity: 'critical', verified: true  },
  { type: 'USER',   value: 'jsmith@corp.int', label: 'Primary Suspect',     severity: 'critical', verified: true  },
  { type: 'DEVICE', value: 'SDCZ48-128G',     label: 'Unregistered USB',    severity: 'high',     verified: true  },
  { type: 'FILE',   value: '/Finance/Q2-Projections/', label: 'Target Path',severity: 'high',     verified: false },
  { type: 'HASH',   value: 'a3f1d82c…b4e9',   label: 'Suspicious Binary',   severity: 'medium',   verified: false },
]

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════ */

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return <span className="ws-clock"><Clock size={11}/>{t.toUTCString().slice(5,25)} UTC</span>
}

/* ── Progress Pipeline ── */
function ProgressPipeline() {
  return (
    <div className="ws-pipeline-wrap">
      <div className="ws-pipeline-track">
        {PROGRESS_STAGES.map((stage, i) => {
          const Icon = stage.icon
          const isLast = i === PROGRESS_STAGES.length - 1
          return (
            <div key={stage.id} className="ws-pipeline-item">
              <div className={`ws-stage ws-stage--${stage.status}`}>
                <div className={`ws-stage-icon ws-stage-icon--${stage.status}`}>
                  {stage.status === 'active'
                    ? <Loader2 size={16} className="ws-spin" />
                    : stage.status === 'done'
                    ? <CheckCircle2 size={16} />
                    : <Circle size={16} />}
                </div>
                <div className="ws-stage-body">
                  <div className="ws-stage-label-row">
                    <span className="ws-stage-label">{stage.label}</span>
                    {stage.status === 'active' && (
                      <span className="ws-stage-pct">{stage.pct}%</span>
                    )}
                  </div>
                  <span className="ws-stage-detail">{stage.detail}</span>
                  {stage.status !== 'pending' && (
                    <div className="ws-stage-bar-wrap">
                      <div
                        className={`ws-stage-bar ws-stage-bar--${stage.status}`}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className={`ws-pipeline-arrow ws-pipeline-arrow--${PROGRESS_STAGES[i+1].status}`}>
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Evidence Statistics ── */
function EvidenceStats() {
  return (
    <div className="ws-ev-stats">
      <div className="ws-ev-cards">
        {EVIDENCE_STATS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`ws-ev-card ws-ev-card--${s.color}`}>
              <div className={`ws-ev-card-icon ws-ev-card-icon--${s.color}`}>
                <Icon size={15} strokeWidth={1.7} />
              </div>
              <span className="ws-ev-card-value">{s.value.toLocaleString()}</span>
              <span className="ws-ev-card-label">{s.label}</span>
            </div>
          )
        })}
      </div>

      <div className="ws-ev-breakdown">
        <p className="ws-breakdown-title">Evidence Type Breakdown</p>
        {EVIDENCE_TYPES.slice(0, 6).map(e => (
          <div key={e.type} className="ws-breakdown-row">
            <span className="ws-br-type">{e.type}</span>
            <div className="ws-br-bar-wrap">
              <div className="ws-br-bar" style={{ width: `${e.pct}%` }} />
            </div>
            <span className="ws-br-count">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Recent Events ── */
function RecentEvents() {
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="ws-events-list">
      {RECENT_EVENTS.map((ev) => {
        const Icon = ev.icon
        const isOpen = expanded === ev.id
        return (
          <div
            key={ev.id}
            className={`ws-event ws-event--${ev.type}`}
            onClick={() => setExpanded(isOpen ? null : ev.id)}
            id={`ws-event-${ev.id}`}
          >
            <div className="ws-event-left">
              <span className="ws-event-time">{ev.time}</span>
              <div className={`ws-event-dot ws-event-dot--${ev.type}`} />
            </div>
            <div className={`ws-event-source-icon ws-event-source-icon--${ev.type}`}>
              <Icon size={12} strokeWidth={2} />
            </div>
            <div className="ws-event-body">
              <div className="ws-event-header">
                <span className={`ws-event-src ws-event-src--${ev.type}`}>{ev.source}</span>
                {ev.type === 'critical'  && <span className="ws-flag ws-flag--critical"><AlertTriangle size={9}/>SUSPICIOUS</span>}
                {ev.type === 'suspicious'&& <span className="ws-flag ws-flag--suspicious"><AlertTriangle size={9}/>FLAGGED</span>}
                {ev.ioc && <span className="ws-ioc-badge">IOC</span>}
              </div>
              <p className="ws-event-label">{ev.label}</p>
              {isOpen && (
                <div className="ws-event-expanded">
                  <div className="ws-event-meta">
                    <span>Event captured at {ev.time}</span>
                    <span className="ws-event-meta-sep">·</span>
                    <span>Source: {ev.source}</span>
                    <span className="ws-event-meta-sep">·</span>
                    <span>Case: {CASE.id}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="ws-event-expand-icon">
              {isOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── AI Findings Cards ── */
function AIFindingCard({ finding, onReview }) {
  const confColor = finding.confidencePct >= 80 ? 'high' : finding.confidencePct >= 55 ? 'medium' : 'low'
  return (
    <div className={`ws-finding ws-finding--${finding.severity}`} id={`finding-${finding.id}`}>
      <div className="ws-finding-header">
        <div className="ws-finding-title-row">
          <div className={`ws-finding-sev ws-finding-sev--${finding.severity}`} />
          <span className="ws-finding-title">{finding.title}</span>
        </div>
        <div className="ws-finding-badges">
          <span className={`ws-finding-status ws-finding-status--${finding.status}`}>
            {finding.status === 'verified' ? <CheckCircle2 size={10}/> : finding.status === 'active' ? <Activity size={10}/> : <Circle size={10}/>}
            {finding.status}
          </span>
        </div>
      </div>

      <div className="ws-finding-conf">
        <div className="ws-finding-conf-row">
          <span className="ws-finding-conf-label">Confidence</span>
          <span className={`ws-finding-conf-val ws-finding-conf-val--${confColor}`}>
            {finding.confidence.charAt(0).toUpperCase() + finding.confidence.slice(1)} — {finding.confidencePct}%
          </span>
        </div>
        <div className="ws-finding-bar-wrap">
          <div
            className={`ws-finding-bar ws-finding-bar--${confColor}`}
            style={{ width: `${finding.confidencePct}%` }}
          />
        </div>
      </div>

      <p className="ws-finding-summary">{finding.summary}</p>

      <div className="ws-finding-footer">
        <span className="ws-finding-meta"><HardDrive size={11}/>{finding.evidence} evidence</span>
        <span className="ws-finding-meta ws-finding-meta--ioc"><Flag size={11}/>{finding.iocs} IOCs</span>
        <button className="ws-finding-action" onClick={onReview} title="Review this finding in AI Reasoning">Review <ChevronRight size={11}/></button>
      </div>
    </div>
  )
}

/* ── Agent Activity ── */
function AgentActivity() {
  return (
    <div className="ws-agents-list">
      {AGENT_ACTIVITY.map((ag) => (
        <div key={ag.agent} className={`ws-agent ws-agent--${ag.status}`} id={`agent-${ag.agent}`}>
          <div className="ws-agent-left">
            <div className={`ws-agent-indicator ws-agent-indicator--${ag.status}`}>
              {ag.status === 'active' && <Loader2 size={12} className="ws-spin"/>}
              {ag.status === 'idle'   && <CheckCircle2 size={12}/>}
              {ag.status === 'queued' && <Circle size={12}/>}
            </div>
            <div className="ws-agent-info">
              <div className="ws-agent-name-row">
                <span className="ws-agent-name">{ag.agent}</span>
                <span className="ws-agent-role">{ag.role}</span>
              </div>
              <p className="ws-agent-action">{ag.action}</p>
              {ag.status === 'active' && (
                <div className="ws-agent-bar-wrap">
                  <div className="ws-agent-bar" style={{ width: `${ag.pct}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="ws-agent-right">
            {ag.status === 'active' && <span className="ws-agent-pct">{ag.pct}%</span>}
            <span className="ws-agent-time">{ag.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── IOC Table ── */
function IOCTable() {
  return (
    <div className="ws-ioc-table-wrap">
      <table className="ws-ioc-table">
        <thead>
          <tr>
            <th>Type</th><th>Indicator</th><th>Description</th><th>Severity</th><th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {IOCS.map((ioc, i) => (
            <tr key={i}>
              <td><span className="ws-ioc-type">{ioc.type}</span></td>
              <td><code className="ws-ioc-val">{ioc.value}</code></td>
              <td><span className="ws-ioc-desc">{ioc.label}</span></td>
              <td>
                <span className={`badge badge--${ioc.severity === 'critical' ? 'critical' : ioc.severity === 'high' ? 'high' : 'medium'}`} style={{fontSize:10}}>
                  {ioc.severity}
                </span>
              </td>
              <td>
                {ioc.verified
                  ? <span className="ws-ioc-verified"><CheckCircle2 size={13}/> Yes</span>
                  : <span className="ws-ioc-pending"><Circle size={13}/> Pending</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Placeholder Tab ── */
function TabPlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="ws-tab-placeholder">
      <div className="ws-tp-icon-wrap">
        <Icon size={32} strokeWidth={1.2} className="ws-tp-icon" />
        <div className="ws-tp-ring" />
      </div>
      <h3 className="ws-tp-title">{title}</h3>
      <p className="ws-tp-desc">{description}</p>
      <button className="ws-tp-btn"><Play size={13}/> Open Module</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview',   label: 'Overview',        icon: BarChart3  },
  { id: 'evidence',   label: 'Evidence',         icon: HardDrive  },
  { id: 'timeline',   label: 'Timeline',         icon: GitBranch  },
  { id: 'graph',      label: 'Knowledge Graph',  icon: Share2     },
  { id: 'findings',   label: 'AI Findings',      icon: Brain      },
  { id: 'reports',    label: 'Reports',          icon: FileText   },
]

export default function CaseWorkspace() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [liveEvents, setLiveEvents] = useState(0)
  const [toastMsg, setToastMsg] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  /* Simulate live event counter ticking */
  useEffect(() => {
    const t = setInterval(() => setLiveEvents(n => n + Math.floor(Math.random() * 3)), 5000)
    return () => clearInterval(t)
  }, [])

  function handleRefresh() {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setToastMsg('Case workspace telemetry re-synchronized: 1,248 artifacts verified')
      setTimeout(() => setToastMsg(null), 3000)
    }, 700)
  }

  return (
    <div className="ws-root">

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

      {/* ══════════════════════════
          WORKSPACE HEADER
      ══════════════════════════ */}
      <div className="ws-header">
        {/* Breadcrumb */}
        <div className="ws-breadcrumb">
          <button className="ws-back-btn" onClick={() => navigate('/investigations')}>
            <ArrowLeft size={13} /> Investigations
          </button>
          <ChevronRight size={12} className="ws-bc-sep" />
          <span className="ws-bc-current">{CASE.id}</span>
          <ChevronRight size={12} className="ws-bc-sep" />
          <span className="ws-bc-leaf">Workspace</span>
        </div>

        {/* Case identity */}
        <div className="ws-header-main">
          <div className="ws-header-left">
            <div className="ws-case-id-row">
              <span className="ws-case-id">{CASE.id}</span>
              <span className="ws-tlp ws-tlp--red">{CASE.tlp}</span>
              <span className="ws-class">{CASE.classification}</span>
              <span className="ws-status-badge">
                <span className="pulse-dot" style={{width:6,height:6}}/>
                ACTIVE
              </span>
              <span className="ws-priority-badge ws-priority-badge--critical">
                <span className="ws-priority-dot"/>
                CRITICAL
              </span>
            </div>
            <h1 className="ws-case-title">{CASE.name}</h1>
            <div className="ws-header-meta">
              <span className="ws-meta-item"><Users size={11}/> {CASE.investigator}</span>
              <span className="ws-meta-sep"/>
              <span className="ws-meta-item"><Shield size={11}/> {CASE.type}</span>
              <span className="ws-meta-sep"/>
              <span className="ws-meta-item"><Clock size={11}/> Created {CASE.created}</span>
              <span className="ws-meta-sep"/>
              <LiveClock />
            </div>
          </div>

          <div className="ws-header-actions">
            {/* Live events pill */}
            <div className="ws-live-events">
              <span className="pulse-dot pulse-dot--alert" style={{width:6,height:6}}/>
              <span>+{liveEvents} live events</span>
            </div>
            <button 
              className="ws-action-btn ws-action-btn--ghost" 
              id="upload-evidence-btn"
              onClick={() => navigate('/evidence')}
              title="Open Evidence Vault to upload and seal artifacts"
            >
              <Upload size={14}/> Upload Evidence
            </button>
            <button 
              className="ws-action-btn ws-action-btn--cyan" 
              id="start-ai-btn"
              onClick={() => navigate('/ai-agents')}
              title="Launch autonomous multi-agent forensic analysis"
            >
              <Cpu size={14}/> Start AI Investigation
            </button>
            <button 
              className="ws-action-btn ws-action-btn--primary" 
              id="generate-report-btn"
              onClick={() => navigate('/reports')}
              title="Generate court-admissible forensic dossier"
            >
              <FileText size={14}/> Generate Report
            </button>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="ws-quick-stats">
          {[
            { label: 'Evidence',    value: '1,248', icon: HardDrive,     color: 'blue'  },
            { label: 'AI Findings', value: '12',    icon: Brain,         color: 'cyan'  },
            { label: 'Active IOCs', value: '5',     icon: Flag,          color: 'red'   },
            { label: 'Agents',      value: '3 / 5', icon: Cpu,           color: 'green' },
            { label: 'Risk Score',  value: '82',    icon: TrendingUp,    color: 'red'   },
            { label: 'Progress',    value: '67%',   icon: Activity,      color: 'amber' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className={`ws-qs-item ws-qs-item--${s.color}`}>
                <Icon size={12} strokeWidth={1.8}/>
                <span className="ws-qs-value">{s.value}</span>
                <span className="ws-qs-label">{s.label}</span>
              </div>
            )
          })}
          <div className="ws-qs-divider"/>
          <button 
            className="ws-qs-refresh" 
            title="Refresh workspace telemetry" 
            id="refresh-data-btn"
            onClick={handleRefresh}
          >
            <RefreshCw size={13} className={isRefreshing ? 'ws-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════
          TAB BAR
      ══════════════════════════ */}
      <div className="ws-tab-bar" role="tablist">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ws-tab ${activeTab === tab.id ? 'ws-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} strokeWidth={1.8}/>
              {tab.label}
              {tab.id === 'findings' && (
                <span className="ws-tab-badge">12</span>
              )}
              {tab.id === 'evidence' && (
                <span className="ws-tab-badge ws-tab-badge--red">47</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════
          TAB CONTENT
      ══════════════════════════ */}
      <div className="ws-tab-content" role="tabpanel">

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="ws-overview">

            {/* Row 1: Progress + Case Summary */}
            <div className="ws-overview-row ws-overview-row--top">

              {/* Case Summary */}
              <div className="ws-section ws-section--summary">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Shield size={14}/> Case Summary</span>
                </div>
                <div className="ws-summary-body">
                  <p className="ws-summary-desc">{CASE.description}</p>
                  <div className="ws-summary-grid">
                    {[
                      { label: 'Case Type',      value: CASE.type },
                      { label: 'Lead Analyst',   value: CASE.lead },
                      { label: 'Opened',         value: CASE.createdFull },
                      { label: 'Last Update',    value: CASE.lastUpdated },
                      { label: 'Classification', value: CASE.classification },
                      { label: 'TLP Marking',    value: CASE.tlp },
                    ].map(m => (
                      <div key={m.label} className="ws-summary-meta">
                        <span className="ws-summary-meta-label">{m.label}</span>
                        <span className="ws-summary-meta-value">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Investigation Progress */}
              <div className="ws-section ws-section--progress">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Activity size={14}/> Investigation Progress</span>
                  <span className="ws-section-badge ws-section-badge--active">
                    <span className="pulse-dot" style={{width:5,height:5}}/>
                    In Progress
                  </span>
                </div>
                <ProgressPipeline />
                <div className="ws-progress-footer">
                  <div className="ws-overall-progress">
                    <div className="ws-op-header">
                      <span className="ws-op-label">Overall Completion</span>
                      <span className="ws-op-pct">67%</span>
                    </div>
                    <div className="ws-op-bar-wrap">
                      <div className="ws-op-bar" style={{width:'67%'}}/>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Row 2: Evidence Stats + IOCs */}
            <div className="ws-overview-row ws-overview-row--two">

              {/* Evidence Statistics */}
              <div className="ws-section">
                <div className="ws-section-header">
                  <span className="ws-section-title"><HardDrive size={14}/> Evidence Statistics</span>
                  <button className="ws-section-link" onClick={() => setActiveTab('evidence')}>View all →</button>
                </div>
                <EvidenceStats />
              </div>

              {/* IOC Summary */}
              <div className="ws-section">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Flag size={14}/> Active IOCs</span>
                  <span className="ws-section-badge ws-section-badge--red">{IOCS.length} identified</span>
                </div>
                <IOCTable />
              </div>

            </div>

            {/* Row 3: Timeline Events + AI Findings */}
            <div className="ws-overview-row ws-overview-row--two">

              {/* Recent Events */}
              <div className="ws-section">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Activity size={14}/> Recent Investigation Events</span>
                  <button className="ws-section-link" onClick={() => setActiveTab('timeline')}>View timeline →</button>
                </div>
                <RecentEvents />
              </div>

              {/* AI Findings preview */}
              <div className="ws-section">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Brain size={14}/> AI Findings</span>
                  <button className="ws-section-link" onClick={() => setActiveTab('findings')}>View all →</button>
                </div>
                <div className="ws-findings-list">
                  {AI_FINDINGS.slice(0, 2).map(f => <AIFindingCard key={f.id} finding={f} />)}
                </div>
              </div>

            </div>

            {/* Row 4: Agent Activity */}
            <div className="ws-overview-row ws-overview-row--full">
              <div className="ws-section">
                <div className="ws-section-header">
                  <span className="ws-section-title"><Cpu size={14}/> Agent Activity</span>
                  <div className="ws-section-header-right">
                    <span className="ws-section-badge ws-section-badge--active">
                      <span className="pulse-dot" style={{width:5,height:5}}/>
                      3 Active
                    </span>
                    <span className="ws-section-badge">2 Queued</span>
                  </div>
                </div>
                <AgentActivity />
              </div>
            </div>

          </div>
        )}

        {/* ─── EVIDENCE (placeholder) ─── */}
        {activeTab === 'evidence' && (
          <TabPlaceholder
            icon={HardDrive}
            title="Evidence Vault"
            description="Browse, filter, and analyze all 1,248 evidence artifacts for CASE-2026-001. Hash verification, chain of custody, and forensic metadata included."
          />
        )}

        {/* ─── TIMELINE (placeholder) ─── */}
        {activeTab === 'timeline' && (
          <TabPlaceholder
            icon={GitBranch}
            title="Interactive Timeline"
            description="Reconstruct the full chronological sequence of events. Drag to zoom, filter by source, and correlate events across all ingested artifacts."
          />
        )}

        {/* ─── KNOWLEDGE GRAPH (placeholder) ─── */}
        {activeTab === 'graph' && (
          <TabPlaceholder
            icon={Share2}
            title="Knowledge Graph"
            description="Visualize entity relationships — suspects, devices, IPs, files — extracted from evidence. Navigate 34 mapped nodes and their connections."
          />
        )}

        {/* ─── AI FINDINGS (full) ─── */}
        {activeTab === 'findings' && (
          <div className="ws-findings-full">
            <div className="ws-findings-header">
              <div>
                <h2 className="ws-findings-title">AI Findings</h2>
                <p className="ws-findings-sub">Generated by NEXUS-7 · SynapseX-Forge-v3 · Last run: {new Date().toLocaleTimeString()}</p>
              </div>
              <button className="ws-action-btn ws-action-btn--ghost"><RefreshCw size={13}/> Re-run Analysis</button>
            </div>
            <div className="ws-findings-grid">
              {AI_FINDINGS.map(f => <AIFindingCard key={f.id} finding={f}/>)}
            </div>
          </div>
        )}

        {/* ─── REPORTS (placeholder) ─── */}
        {activeTab === 'reports' && (
          <TabPlaceholder
            icon={FileText}
            title="Reports"
            description="Generate court-admissible forensic reports, executive summaries, or full technical analyses. Export as PDF, STIX 2.1, or case package."
          />
        )}

      </div>
    </div>
  )
}
