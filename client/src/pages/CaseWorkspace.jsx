import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Cpu, FileText,
  ChevronRight, ChevronDown, Clock,
  HardDrive, Brain, AlertTriangle, Activity,
  Shield, Users, Network, Usb, Video,
  Lock, Monitor, FileSearch, MessageSquare,
  CheckCircle2, Circle, Loader2, BarChart3,
  Eye, Zap, Database, GitBranch, Share2,
  TrendingUp, RefreshCw, MoreHorizontal,
  Flag, Star, Bookmark, Download, Play, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './CaseWorkspace.css'

export default function CaseWorkspace() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [evidenceList, setEvidenceList] = useState([])
  const [timelineEvents, setTimelineEvents] = useState([])
  const [findingsList, setFindingsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [c, dash, ev, tl, f] = await Promise.all([
        api.cases.get(caseId),
        api.cases.getDashboard(caseId).catch(() => null),
        api.evidence.listForCase(caseId).catch(() => ({ items: [] })),
        api.timeline.getForCase(caseId, { pageSize: 10 }).catch(() => ({ items: [] })),
        api.findings.listForCase(caseId).catch(() => ({ items: [] })),
      ])

      setCaseData(c)
      setDashboardData(dash)
      setEvidenceList(ev?.items || [])
      setTimelineEvents(tl?.items || tl?.events || [])
      setFindingsList(f?.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load workspace data.')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchWorkspace()
  }, [fetchWorkspace])

  if (loading) {
    return (
      <div className="cw-root" style={{ padding: 40 }}>
        <LoadingView message={`Loading Case #${caseId} Workspace...`} />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="cw-root" style={{ padding: 40 }}>
        <ErrorView error={error} onRetry={fetchWorkspace} message="Workspace Error" />
      </div>
    )
  }

  const c = caseData
  const riskScore = dashboardData?.risk_score ?? 0
  const riskColor = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low'

  const progressStages = [
    {
      id: 'collection',
      label: 'Evidence Ingestion',
      icon: Database,
      status: evidenceList.length > 0 ? 'done' : 'pending',
      detail: `${evidenceList.length} artifacts ingested`,
      pct: evidenceList.length > 0 ? 100 : 0,
    },
    {
      id: 'correlation',
      label: 'Signal Correlation',
      icon: Share2,
      status: (dashboardData?.total_correlations ?? 0) > 0 ? 'done' : 'pending',
      detail: `${dashboardData?.total_correlations ?? 0} signal clusters`,
      pct: (dashboardData?.total_correlations ?? 0) > 0 ? 100 : 0,
    },
    {
      id: 'reasoning',
      label: 'Reasoning Engine',
      icon: Brain,
      status: findingsList.length > 0 ? 'active' : 'pending',
      detail: `${findingsList.length} findings synthesized`,
      pct: findingsList.length > 0 ? 100 : 0,
    },
    {
      id: 'review',
      label: 'Human Review',
      icon: Eye,
      status: (dashboardData?.pending_findings ?? 0) === 0 && findingsList.length > 0 ? 'done' : 'pending',
      detail: `${dashboardData?.pending_findings ?? 0} pending sign-off`,
      pct: (dashboardData?.pending_findings ?? 0) === 0 && findingsList.length > 0 ? 100 : 50,
    },
  ]

  const evidenceStats = [
    { label: 'Total Items', value: evidenceList.length, color: 'blue', icon: HardDrive },
    { label: 'Verified', value: evidenceList.filter(e => e.integrity_status === 'verified' || e.processing_status === 'completed').length, color: 'green', icon: CheckCircle2 },
    { label: 'Processing', value: evidenceList.filter(e => e.processing_status === 'processing').length, color: 'cyan', icon: Loader2 },
    { label: 'Flagged', value: evidenceList.filter(e => e.processing_status === 'failed').length, color: 'red', icon: Flag },
  ]

  return (
    <div className="cw-root">

      {/* ── Case Header ── */}
      <div className="cw-header">
        <div className="cw-header-left">
          <button className="cw-back-btn" onClick={() => navigate(`/investigations/${caseId}`)}>
            <ArrowLeft size={14} /> Case Overview
          </button>
          <div className="cw-title-row">
            <span className="cw-case-id">{c.case_number || `CASE-${c.id}`}</span>
            <h1 className="cw-title">{c.title}</h1>
            <span className={`cw-status cw-status--${c.status}`}>{c.status}</span>
          </div>
          <p className="cw-desc">{c.description || 'Live investigation workspace for multi-signal digital forensics.'}</p>
        </div>

        <div className="cw-header-right">
          <button className="cw-btn cw-btn--ghost" onClick={fetchWorkspace} title="Refresh Data">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="cw-btn cw-btn--primary" onClick={() => navigate(`/evidence?caseId=${caseId}`)}>
            <Upload size={14} /> Ingest Evidence
          </button>
        </div>
      </div>

      {/* ── Lifecycle Progress Strip ── */}
      <div className="cw-stages-strip">
        {progressStages.map((stage) => {
          const Icon = stage.icon
          return (
            <div key={stage.id} className={`cw-stage-card cw-stage-card--${stage.status}`}>
              <div className="cw-stage-top">
                <div className="cw-stage-icon"><Icon size={16} /></div>
                <span className="cw-stage-label">{stage.label}</span>
              </div>
              <span className="cw-stage-detail">{stage.detail}</span>
              <div className="cw-stage-bar-wrap">
                <div className="cw-stage-bar" style={{ width: `${stage.pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Workspace Grid ── */}
      <div className="cw-main-grid">

        {/* Evidence Breakdown */}
        <div className="cw-panel">
          <div className="cw-panel-header">
            <div className="cw-panel-title"><HardDrive size={15} /> Evidence Repository</div>
            <span className="badge badge--info">{evidenceList.length} items</span>
          </div>
          <div className="cw-stats-grid">
            {evidenceStats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className={`cw-stat-box cw-stat-box--${s.color}`}>
                  <Icon size={16} />
                  <span className="cw-stat-val">{s.value}</span>
                  <span className="cw-stat-lbl">{s.label}</span>
                </div>
              )
            })}
          </div>
          {evidenceList.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              No evidence uploaded. Click &quot;Ingest Evidence&quot; to begin.
            </p>
          ) : (
            <div className="cw-items-list">
              {evidenceList.slice(0, 5).map((ev) => (
                <div key={ev.id} className="cw-item-row">
                  <span className="cw-item-name">{ev.original_filename || `Evidence #${ev.id}`}</span>
                  <span className="badge badge--success">{ev.integrity_status || 'Verified'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Findings Summary */}
        <div className="cw-panel">
          <div className="cw-panel-header">
            <div className="cw-panel-title"><Brain size={15} /> Synthesized AI Findings</div>
            <span className="badge badge--info">{findingsList.length} leads</span>
          </div>
          {findingsList.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              No AI findings generated yet. Run the multi-agent fleet from the AI Agents page.
            </p>
          ) : (
            <div className="cw-findings-list">
              {findingsList.slice(0, 3).map((f) => (
                <div key={f.id || f.finding_id} className="cw-finding-card">
                  <h4>{f.title}</h4>
                  <p>{f.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
