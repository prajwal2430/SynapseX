import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FolderOpen, HardDrive, Brain,
  Shield, Users, Clock, AlertTriangle,
  Activity, Video, Lock, Monitor, Usb,
  FileSearch, Network, CheckCircle2,
  ExternalLink, Download, Share2,
  ChevronRight, Eye, MessageSquare, RefreshCw,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './CaseDetail.css'

const SOURCE_ICONS = {
  'cctv':           Video,
  'access':         Lock,
  'system':         Monitor,
  'usb':            Usb,
  'file':           FileSearch,
  'network':        Network,
  'log_entry':      FileSearch,
  'auth_event':     Shield,
  'file_operation': FileSearch,
  'network_connection': Network,
}

function TimelineDot({ type }) {
  return <div className={`cd-tl-dot cd-tl-dot--${type || 'normal'}`} />
}

export default function CaseDetail() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [timelineEvents, setTimelineEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCaseDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [c, dash, tl] = await Promise.all([
        api.cases.get(caseId),
        api.cases.getDashboard(caseId).catch(() => null),
        api.timeline.getForCase(caseId, { pageSize: 20 }).catch(() => ({ items: [] })),
      ])

      setCaseData(c)
      setDashboardData(dash)
      setTimelineEvents(tl?.items || tl?.events || [])
    } catch (err) {
      setError(err.message || `Failed to retrieve details for Case #${caseId}`)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCaseDetails()
  }, [fetchCaseDetails])

  if (loading) {
    return (
      <div className="cd-root" style={{ padding: 40 }}>
        <LoadingView message={`Loading forensic profile for Case #${caseId}...`} />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="cd-root" style={{ padding: 40 }}>
        <div className="cd-not-found">
          <FolderOpen size={40} className="cd-nf-icon" />
          <h2>Case not found or inaccessible</h2>
          <p>{error || `No authorized case matches ID ${caseId}`}</p>
          <button className="cd-btn cd-btn--primary" onClick={() => navigate('/investigations')}>
            <ArrowLeft size={14} /> Back to Investigations
          </button>
        </div>
      </div>
    )
  }

  const c = caseData
  const riskScore = dashboardData?.risk_score ?? 0
  const riskColor = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low'
  const priorityLower = (c.priority || 'medium').toLowerCase()

  return (
    <div className="cd-root">

      {/* ── Breadcrumb ── */}
      <div className="cd-breadcrumb">
        <button className="cd-back-btn" onClick={() => navigate('/investigations')}>
          <ArrowLeft size={14} />
          Investigations
        </button>
        <ChevronRight size={13} className="cd-bc-sep" />
        <span className="cd-bc-current">{c.case_number || `CASE-${c.id}`}</span>
      </div>

      {/* ── Case Header ── */}
      <div className="cd-header">
        <div className="cd-header-main">
          <div className="cd-header-id-row">
            <span className="cd-case-id">{c.case_number || `CASE-${c.id}`}</span>
            <span className="cd-tlp cd-tlp--red">TLP:AMBER</span>
            <span className="cd-class-badge">OFFICIAL USE ONLY</span>
            <span className={`cd-status cd-status--${c.status}`}>
              {c.status === 'active' && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
              {c.status === 'active' ? 'Active' : c.status === 'under_review' ? 'Under Review' : 'Closed'}
            </span>
          </div>
          <h1 className="cd-case-title">{c.title}</h1>
          <p className="cd-case-desc">{c.description || 'No detailed case summary provided.'}</p>

          <div className="cd-meta-row">
            <div className="cd-meta-item">
              <Shield size={12} />
              <span>Priority: <strong>{c.priority}</strong></span>
            </div>
            <div className="cd-meta-sep" />
            <div className="cd-meta-item">
              <Users size={12} />
              <span>Lead: <strong>{c.creator_name || 'Assigned Lead'}</strong></span>
            </div>
            <div className="cd-meta-sep" />
            <div className="cd-meta-item">
              <Clock size={12} />
              <span>Opened: <strong>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</strong></span>
            </div>
          </div>
        </div>

        <div className="cd-header-actions">
          <div className={`cd-priority-pill cd-priority-pill--${priorityLower}`}>
            <span className="cd-priority-dot" />
            {c.priority ? c.priority.toUpperCase() : 'MEDIUM'} Priority
          </div>
          <button className="cd-btn cd-btn--ghost" onClick={fetchCaseDetails} title="Refresh Case">
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="cd-btn cd-btn--primary" id="open-workspace-btn"
            onClick={() => navigate(`/investigations/${c.id}/workspace`)}>
            <Eye size={13} /> Open Workspace
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="cd-kpi-row">
        {[
          { icon: HardDrive, label: 'Evidence Items', value: (dashboardData?.total_evidence ?? 0).toLocaleString(), color: 'blue' },
          { icon: Brain, label: 'AI Findings', value: dashboardData?.total_findings ?? 0, color: 'cyan' },
          { icon: AlertTriangle, label: 'Risk Score', value: `${riskScore} / 100`, color: riskColor },
          { icon: Users, label: 'Entities Extracted', value: dashboardData?.total_entities ?? 0, color: 'blue' },
          { icon: Activity, label: 'Timeline Events', value: dashboardData?.total_events ?? timelineEvents.length, color: 'gray' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={`cd-kpi cd-kpi--${kpi.color}`}>
              <div className={`cd-kpi-icon cd-kpi-icon--${kpi.color}`}><Icon size={16} strokeWidth={1.7} /></div>
              <div className="cd-kpi-body">
                <span className="cd-kpi-value">{kpi.value}</span>
                <span className="cd-kpi-label">{kpi.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Main content grid ── */}
      <div className="cd-main-grid">

        {/* ── Left column ── */}
        <div className="cd-left-col">

          {/* Timeline */}
          <div className="cd-panel cd-panel--timeline">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Activity size={14} /> Reconstructed Events Timeline</span>
              <span className="cd-panel-badge">{timelineEvents.length} events</span>
            </div>
            {timelineEvents.length === 0 ? (
              <div style={{ padding: '24px 16px' }}>
                <EmptyStateView
                  title="No events extracted"
                  message="Upload and process digital evidence to populate the chronological timeline."
                  icon={Activity}
                  actionText="Go to Evidence"
                  onAction={() => navigate('/evidence')}
                />
              </div>
            ) : (
              <div className="cd-tl-list">
                {timelineEvents.map((evt, i) => {
                  const Icon = SOURCE_ICONS[evt.event_type] || Activity
                  const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'
                  return (
                    <div key={evt.id || i} className="cd-tl-event cd-tl-event--normal">
                      <div className="cd-tl-time-col">
                        <span className="cd-tl-time">{timeStr}</span>
                        <TimelineDot type="normal" />
                      </div>
                      <div className="cd-tl-connector">
                        {i < timelineEvents.length - 1 && <div className="cd-tl-line" />}
                      </div>
                      <div className="cd-tl-body">
                        <div className="cd-tl-row">
                          <span className="cd-tl-source">
                            <Icon size={10} strokeWidth={2} />
                            {evt.source || evt.event_type}
                          </span>
                          {evt.entity_value && (
                            <span className="cd-tag" style={{ fontSize: 10, padding: '1px 6px' }}>
                              {evt.entity_value}
                            </span>
                          )}
                        </div>
                        <p className="cd-tl-label">{evt.entity_type ? `${evt.entity_type}: ${evt.entity_value}` : evt.source || evt.event_type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Right column ── */}
        <div className="cd-right-col">

          {/* AI Summary */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Brain size={14} /> Multi-Agent Intelligence Status</span>
              <span className="badge badge--info" style={{ fontSize: 10 }}>ADEIP</span>
            </div>
            <div className="cd-panel-body cd-ai-body">
              <div className="cd-ai-conf">
                <div className="cd-ai-conf-row">
                  <span className="cd-ai-conf-label">Case Risk Assessment</span>
                  <span className={`cd-ai-conf-val cd-ai-conf-val--${riskColor}`}>
                    {dashboardData?.risk_level || 'Pending Analysis'} ({riskScore}%)
                  </span>
                </div>
                <div className="cd-conf-bar-wrap">
                  <div className={`cd-conf-bar cd-conf-bar--${riskColor}`} style={{ width: `${riskScore}%` }} />
                </div>
              </div>
              <div className="cd-ai-stats">
                {[
                  { label: 'Correlations Discovered', value: dashboardData?.total_correlations ?? 0, color: 'green' },
                  { label: 'AI Findings', value: dashboardData?.total_findings ?? 0, color: 'cyan' },
                  { label: 'Pending Review', value: dashboardData?.pending_findings ?? 0, color: 'amber' },
                  { label: 'Evidence Processed', value: dashboardData?.processed_evidence ?? 0, color: 'blue' },
                ].map(s => (
                  <div key={s.label} className={`cd-ai-stat cd-ai-stat--${s.color}`}>
                    <span className="cd-ai-stat-val">{s.value}</span>
                    <span className="cd-ai-stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="cd-ai-actions">
                <button
                  className="cd-btn cd-btn--primary"
                  onClick={() => navigate('/ai-findings')}
                >
                  <Brain size={13} /> View Findings
                </button>
                <button
                  className="cd-btn cd-btn--ghost"
                  onClick={() => navigate('/intelligence-chat')}
                >
                  <MessageSquare size={13} /> Intelligence Chat
                </button>
              </div>
            </div>
          </div>

          {/* Quick nav */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><ExternalLink size={14} /> Investigation Modules</span>
            </div>
            <div className="cd-panel-body cd-modules-body">
              {[
                { label: 'Evidence Vault', icon: HardDrive, count: `${dashboardData?.total_evidence ?? 0} files`, path: '/evidence' },
                { label: 'Knowledge Graph', icon: Share2, count: `${dashboardData?.total_entities ?? 0} entities`, path: '/knowledge-graph' },
                { label: 'Timeline Analysis', icon: Activity, count: `${dashboardData?.total_events ?? 0} events`, path: '/timeline' },
                { label: 'AI Agent Fleet', icon: Brain, count: 'Multi-Agent', path: '/ai-agents' },
                { label: 'Forensic Reports', icon: Download, count: 'Export', path: '/reports' },
              ].map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.label}
                    className="cd-module-btn"
                    onClick={() => navigate(m.path)}
                  >
                    <div className="cd-module-icon"><Icon size={14} strokeWidth={1.7} /></div>
                    <span className="cd-module-label">{m.label}</span>
                    <span className="cd-module-count">{m.count}</span>
                    <ChevronRight size={12} className="cd-module-arrow" />
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
