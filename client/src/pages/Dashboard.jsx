import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardDrive, Brain, ShieldAlert, Bot,
  Clock, Wifi, AlertTriangle, ChevronRight,
  Usb, Monitor, Lock, Video, FileSearch,
  Network, CheckCircle2, CircleDot, Zap,
  TrendingUp, Eye, Search, Activity,
  FlaskConical, Link2, ListChecks, RefreshCw, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './Dashboard.css'

const SOURCE_ICONS = {
  'cctv':           Video,
  'access':         Lock,
  'system':         Monitor,
  'usb':            Usb,
  'file':           FileSearch,
  'network':        Network,
  'log_entry':      FileSearch,
  'auth_event':     ShieldAlert,
  'file_operation': FileSearch,
  'network_connection': Network,
}

/* ─────────────────────────────────────────
   LIVE CLOCK
───────────────────────────────────────── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const istStr = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const istTimeStr = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <span className="case-clock" title="Indian Standard Time (IST / UTC+5:30)">
      <Clock size={11} />
      {istStr} {istTimeStr} IST
    </span>
  )
}

/* ─────────────────────────────────────────
   SUMMARY CARD
───────────────────────────────────────── */
function SummaryCard({ card }) {
  const Icon = card.icon
  return (
    <div className={`dash-summary-card dash-summary-card--${card.color}`} id={`card-${card.id}`}>
      <div className="dsc-top">
        <div className="dsc-label-row">
          <span className="dsc-label">{card.label}</span>
        </div>
        <div className={`dsc-icon dsc-icon--${card.color}`}>
          <Icon size={18} strokeWidth={1.6} />
        </div>
      </div>
      <div className="dsc-value">
        {card.value}
        {card.unit && <span className="dsc-unit"> {card.unit}</span>}
      </div>
      <div className="dsc-footer">
        <span className={`dsc-delta dsc-delta--${card.color === 'medium' ? 'warn' : card.trend === 'up' ? 'up' : 'flat'}`}>
          {card.trend === 'up' ? '↑' : '—'} {card.delta}
        </span>
      </div>
      <div className="dsc-glow-bar" />
    </div>
  )
}

/* ─────────────────────────────────────────
   TIMELINE EVENT
───────────────────────────────────────── */
function TimelineEvent({ event, index }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = SOURCE_ICONS[event.source] || SOURCE_ICONS[event.type] || Activity

  return (
    <div
      className={`tl-event tl-event--${event.type || 'normal'} ${expanded ? 'tl-event--expanded' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => setExpanded(e => !e)}
      id={`event-${event.id}`}
    >
      <div className="tl-time-col">
        <span className="tl-time">{event.time}</span>
        <div className={`tl-dot tl-dot--${event.type || 'normal'}`} />
      </div>

      <div className="tl-line-connector">
        <div className="tl-line" />
      </div>

      <div className="tl-card">
        <div className="tl-card-header">
          <span className={`tl-source-badge tl-source-badge--${event.type || 'normal'}`}>
            <Icon size={10} strokeWidth={2} />
            {event.source}
          </span>
          {event.type === 'critical' && (
            <span className="tl-flag tl-flag--critical">
              <AlertTriangle size={9} /> SUSPICIOUS
            </span>
          )}
          {event.type === 'suspicious' && (
            <span className="tl-flag tl-flag--suspicious">
              <AlertTriangle size={9} /> FLAGGED
            </span>
          )}
        </div>

        <p className="tl-card-label">{event.label}</p>

        {event.detail && (
          <p className="tl-card-detail">{event.detail}</p>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   MAIN DASHBOARD
═════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate()

  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch case list first
      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setDashboardData(null)
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const dash = await api.cases.getDashboard(activeId)
      setDashboardData(dash)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard telemetry from backend.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchDashboard(newId)
  }

  if (loading) {
    return (
      <div className="dash-root" style={{ padding: 40 }}>
        <LoadingView message="Loading investigation telemetry and case metrics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dash-root" style={{ padding: 40 }}>
        <ErrorView error={error} onRetry={() => fetchDashboard(selectedCaseId)} message="Dashboard API Error" />
      </div>
    )
  }

  if (casesList.length === 0) {
    return (
      <div className="dash-root" style={{ padding: 40 }}>
        <EmptyStateView
          title="No investigation cases have been created."
          message="Initialize an authorized investigation case to view live forensic telemetry, evidence processing, and AI reasoning."
          icon={FolderOpen}
          actionText="Create Investigation Case"
          onAction={() => navigate('/investigations')}
        />
      </div>
    )
  }

  const riskScore = dashboardData?.risk_score ?? 0
  const riskColor = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low'

  const summaryCards = [
    {
      id: 'active-evidence',
      label: 'Evidence Artifacts',
      value: (dashboardData?.total_evidence ?? 0).toLocaleString(),
      unit: 'Items',
      icon: HardDrive,
      color: 'blue',
      delta: `${dashboardData?.processed_evidence ?? 0} verified`,
      trend: 'up',
    },
    {
      id: 'ai-findings',
      label: 'AI Findings',
      value: (dashboardData?.total_findings ?? 0).toString(),
      unit: 'Findings',
      icon: Brain,
      color: 'cyan',
      delta: `${dashboardData?.pending_findings ?? 0} pending review`,
      trend: 'up',
    },
    {
      id: 'risk-level',
      label: 'Investigation Risk',
      value: dashboardData?.risk_level || 'Low',
      unit: `(${riskScore}%)`,
      icon: ShieldAlert,
      color: riskColor,
      delta: riskScore >= 60 ? 'Elevated' : 'Stable',
      trend: riskScore >= 60 ? 'up' : 'flat',
    },
    {
      id: 'agent-status',
      label: 'Correlations Discovered',
      value: (dashboardData?.total_correlations ?? 0).toString(),
      unit: 'Signals',
      icon: Bot,
      color: 'green',
      delta: `${dashboardData?.total_entities ?? 0} entities`,
      trend: 'flat',
    },
  ]

  const timelineEvents = dashboardData?.latest_events || []
  const findingsList = dashboardData?.recent_findings || []

  return (
    <div className="dash-root">

      {/* ═══════════════════════════════
          CASE SELECTOR & BANNER
      ═══════════════════════════════ */}
      <div className="case-banner" id="case-banner">
        <div className="case-banner-left">
          <div className="case-badge-row">
            <span className="case-badge case-badge--primary">{dashboardData?.case_number || `CASE-${selectedCaseId}`}</span>
            <span className="case-badge case-badge--confidential">AUTHORIZED ACCESS</span>
            <span className="case-badge case-badge--tlp">TLP:AMBER</span>
            <LiveClock />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <h1 className="case-title">{dashboardData?.case_title || 'Investigation Case'}</h1>
            {casesList.length > 1 && (
              <select
                value={selectedCaseId}
                onChange={handleCaseChange}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              >
                {casesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_number || `CASE-${c.id}`} — {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="case-meta-row">
            <span className="case-meta-item">
              <Activity size={11} /> Status: <strong>{dashboardData?.total_evidence ? 'Active Investigation' : 'Awaiting Evidence'}</strong>
            </span>
          </div>
        </div>

        <div className="case-banner-right">
          <div className="case-status-wrap">
            <span className="badge badge--active">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              LIVE TELEMETRY
            </span>
          </div>
          <button
            className="ai-btn ai-btn--secondary"
            onClick={() => fetchDashboard(selectedCaseId)}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <RefreshCw size={12} /> Refresh Data
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════
          SUMMARY CARDS
      ═══════════════════════════════ */}
      <div className="dash-cards-grid">
        {summaryCards.map(card => (
          <SummaryCard key={card.id} card={card} />
        ))}
      </div>

      {/* ═══════════════════════════════
          MAIN CONTENT — TIMELINE + AI
      ═══════════════════════════════ */}
      <div className="dash-main-grid">

        {/* ─── LEFT: TIMELINE ─── */}
        <div className="dash-panel dash-panel--timeline">
          <div className="panel-header">
            <div className="panel-title">
              <Activity size={15} />
              Reconstructed Events Timeline
            </div>
            <div className="panel-header-right">
              <span className="badge badge--active" style={{ fontSize: 9 }}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                Live
              </span>
              <span className="panel-event-count">{timelineEvents.length} events</span>
            </div>
          </div>

          <div className="tl-legend">
            <span className="tl-legend-item tl-legend-item--normal">● Standard</span>
            <span className="tl-legend-item tl-legend-item--critical">● Alert / Suspicious</span>
          </div>

          <div className="tl-scroll-area">
            {timelineEvents.length === 0 ? (
              <div style={{ padding: '32px 16px' }}>
                <EmptyStateView
                  title="No events extracted"
                  message="Upload and process digital evidence files (CSV, JSON, EVTX, PCAP, MP4) to extract normalized timeline events."
                  icon={Activity}
                  actionText="Upload Evidence"
                  onAction={() => navigate('/evidence')}
                />
              </div>
            ) : (
              <div className="tl-track">
                {timelineEvents.map((evt, i) => (
                  <TimelineEvent key={evt.id || i} event={evt} index={i} />
                ))}
              </div>
            )}
          </div>

          <div className="tl-footer">
            <TrendingUp size={11} />
            <span>
              {timelineEvents.length > 0
                ? `Showing ${timelineEvents.length} latest events from verified digital evidence artifacts`
                : 'No evidence events registered yet'}
            </span>
          </div>
        </div>

        {/* ─── RIGHT: AI PANEL ─── */}
        <div className="dash-panel dash-panel--ai">
          <div className="panel-header">
            <div className="panel-title">
              <Brain size={15} />
              Multi-Agent AI Findings
            </div>
            <span className="badge badge--info">ADEIP Intelligence</span>
          </div>

          {/* Confidence meter */}
          <div className="ai-confidence-block">
            <div className="ai-conf-header">
              <span className="ai-conf-label">Case Risk Assessment</span>
              <span className={`ai-conf-value ai-conf-value--${riskColor}`}>
                {dashboardData?.risk_level || 'Low'} — {riskScore}%
              </span>
            </div>
            <div className="ai-conf-bar-wrap">
              <div className={`ai-conf-bar ai-conf-bar--${riskColor}`} style={{ width: `${riskScore}%` }} />
            </div>
            <p className="ai-conf-desc">
              {dashboardData?.total_correlations
                ? `Multi-agent correlation engine detected ${dashboardData.total_correlations} cross-source signal clusters across ${dashboardData.total_entities} extracted entities.`
                : 'Upload digital evidence artifacts to trigger deterministic entity extraction, correlation discovery, and hypothesis reasoning.'}
            </p>
          </div>

          {/* Findings list */}
          <div className="ai-findings-list">
            {findingsList.length === 0 ? (
              <div style={{ padding: '16px 8px' }}>
                <EmptyStateView
                  title="No AI findings generated"
                  message="Run the multi-agent reasoning engine on this case to produce grounded observations and hypotheses."
                  icon={Brain}
                  actionText="Run AI Reasoning"
                  onAction={() => navigate('/ai-findings')}
                />
              </div>
            ) : (
              findingsList.map((f, i) => (
                <div key={f.id || i} className="ai-finding ai-finding--cyan">
                  <div className="ai-finding-icon ai-finding-icon--cyan">
                    <Brain size={13} strokeWidth={1.8} />
                  </div>
                  <div className="ai-finding-body">
                    <span className="ai-finding-label">{f.label}</span>
                    <span className="ai-finding-value">{f.value}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="ai-actions">
            <button
              className="ai-btn ai-btn--primary"
              id="view-investigation-btn"
              onClick={() => navigate(`/investigations/${selectedCaseId}/workspace`)}
            >
              <Eye size={14} />
              Open Case Workspace
            </button>
            <button
              className="ai-btn ai-btn--secondary"
              id="review-findings-btn"
              onClick={() => navigate('/ai-findings')}
            >
              <Search size={14} />
              Review AI Findings
            </button>
          </div>

          <div className="ai-disclaimer">
            <Brain size={10} />
            Deterministic multi-agent pipeline · Grounded in verified evidence hashes · Strict non-guilt policy
          </div>
        </div>

      </div>
    </div>
  )
}
