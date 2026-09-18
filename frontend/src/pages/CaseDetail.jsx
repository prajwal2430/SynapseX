import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FolderOpen, HardDrive, Brain,
  Shield, Users, Clock, AlertTriangle,
  Activity, Video, Lock, Monitor, Usb,
  FileSearch, Network, CheckCircle2,
  ExternalLink, Download, Share2,
  ChevronRight, Eye, MessageSquare,
} from 'lucide-react'
import { getCaseById } from '../data/cases'
import './CaseDetail.css'

const SOURCE_ICONS = {
  'CCTV':           Video,
  'Access Control': Lock,
  'System':         Monitor,
  'USB':            Usb,
  'File Activity':  FileSearch,
  'Network':        Network,
  'Email':          MessageSquare,
  'Finance System': HardDrive,
  'Auth':           Shield,
  'HR DB':          HardDrive,
  'Update Server':  HardDrive,
  'Endpoint':       Monitor,
  'Email Gateway':  MessageSquare,
  'Proxy':          Network,
}

function TimelineDot({ type }) {
  return <div className={`cd-tl-dot cd-tl-dot--${type}`} />
}

export default function CaseDetail() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [toastMsg, setToastMsg] = useState(null)
  const c = getCaseById(caseId)

  if (!c) {
    return (
      <div className="cd-not-found">
        <FolderOpen size={40} className="cd-nf-icon" />
        <h2>Case not found</h2>
        <p>No case matches ID <code>{caseId}</code></p>
        <button className="cd-btn cd-btn--primary" onClick={() => navigate('/investigations')}>
          <ArrowLeft size={14} /> Back to Investigations
        </button>
      </div>
    )
  }

  const handleShareCase = () => {
    navigator.clipboard.writeText(window.location.href)
    setToastMsg(`Case link for ${c.id} copied to clipboard`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleExportCase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `synapsex_case_${c.id}_dossier.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setToastMsg(`Case dossier for ${c.id} exported successfully`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const tlpColor = c.tlp?.includes('RED') ? 'red' : c.tlp?.includes('AMBER') ? 'amber' : 'green'
  const riskColor = c.riskScore >= 80 ? 'critical' : c.riskScore >= 60 ? 'high' : c.riskScore >= 40 ? 'medium' : 'low'

  return (
    <div className="cd-root">

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

      {/* ── Breadcrumb ── */}
      <div className="cd-breadcrumb">
        <button className="cd-back-btn" onClick={() => navigate('/investigations')}>
          <ArrowLeft size={14} />
          Investigations
        </button>
        <ChevronRight size={13} className="cd-bc-sep" />
        <span className="cd-bc-current">{c.id}</span>
      </div>

      {/* ── Case Header ── */}
      <div className="cd-header">
        <div className="cd-header-main">
          <div className="cd-header-id-row">
            <span className="cd-case-id">{c.id}</span>
            <span className={`cd-tlp cd-tlp--${tlpColor}`}>{c.tlp}</span>
            <span className="cd-class-badge">{c.classification}</span>
            <span className={`cd-status cd-status--${c.status}`}>
              {c.status === 'active' && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
              {c.status === 'active' ? 'Active' : c.status === 'review' ? 'Under Review' : 'Closed'}
            </span>
          </div>
          <h1 className="cd-case-title">{c.name}</h1>
          <p className="cd-case-desc">{c.description}</p>

          <div className="cd-meta-row">
            <div className="cd-meta-item">
              <Shield size={12} />
              <span>Type: <strong>{c.type}</strong></span>
            </div>
            <div className="cd-meta-sep" />
            <div className="cd-meta-item">
              <Users size={12} />
              <span>Lead: <strong>{c.lead}</strong></span>
            </div>
            <div className="cd-meta-sep" />
            <div className="cd-meta-item">
              <Clock size={12} />
              <span>Opened: <strong>{c.openedDate}</strong></span>
            </div>
            <div className="cd-meta-sep" />
            <div className="cd-meta-item">
              <Clock size={12} />
              <span>Updated: <strong>{c.lastUpdatedFull}</strong></span>
            </div>
          </div>
        </div>

        <div className="cd-header-actions">
          <div className={`cd-priority-pill cd-priority-pill--${c.priority}`}>
            <span className="cd-priority-dot" />
            {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)} Priority
          </div>
          <button 
            className="cd-btn cd-btn--ghost" 
            id="share-case-btn"
            onClick={handleShareCase}
            title="Copy case URL to clipboard"
          >
            <Share2 size={13} /> Share
          </button>
          <button 
            className="cd-btn cd-btn--ghost" 
            id="export-case-btn"
            onClick={handleExportCase}
            title="Download full case dossier JSON"
          >
            <Download size={13} /> Export
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
          { icon: HardDrive, label: 'Evidence Items',  value: c.evidenceCount.toLocaleString(), color: 'blue'  },
          { icon: Brain,     label: 'AI Findings',     value: c.aiFindings,                     color: 'cyan'  },
          { icon: AlertTriangle, label: 'Risk Score',  value: `${c.riskScore} / 100`,            color: riskColor },
          { icon: Users,     label: 'Analysts Assigned', value: c.team.length,                  color: 'blue'  },
          { icon: Activity,  label: 'Events in Window',  value: c.timeline.length,              color: 'gray'  },
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

          {/* Case Tags */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Shield size={14} /> Case Tags & Classification</span>
            </div>
            <div className="cd-panel-body">
              <div className="cd-tags-wrap">
                {c.tags.map(t => (
                  <span key={t} className="cd-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="cd-panel cd-panel--timeline">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Activity size={14} /> Investigation Timeline</span>
              <span className="cd-panel-badge">{c.timeline.length} events</span>
            </div>
            <div className="cd-tl-legend">
              <span className="cd-tl-leg cd-tl-leg--normal">● Normal</span>
              <span className="cd-tl-leg cd-tl-leg--suspicious">● Flagged</span>
              <span className="cd-tl-leg cd-tl-leg--critical">● Suspicious</span>
            </div>
            <div className="cd-tl-list">
              {c.timeline.map((evt, i) => {
                const Icon = SOURCE_ICONS[evt.source] || Activity
                return (
                  <div key={i} className={`cd-tl-event cd-tl-event--${evt.type}`}>
                    <div className="cd-tl-time-col">
                      <span className="cd-tl-time">{evt.time}</span>
                      <TimelineDot type={evt.type} />
                    </div>
                    <div className="cd-tl-connector">
                      {i < c.timeline.length - 1 && <div className="cd-tl-line" />}
                    </div>
                    <div className="cd-tl-body">
                      <div className="cd-tl-row">
                        <span className={`cd-tl-source cd-tl-source--${evt.type}`}>
                          <Icon size={10} strokeWidth={2} />
                          {evt.source}
                        </span>
                        {evt.type === 'critical' && (
                          <span className="cd-tl-flag cd-tl-flag--critical"><AlertTriangle size={9} />SUSPICIOUS</span>
                        )}
                        {evt.type === 'suspicious' && (
                          <span className="cd-tl-flag cd-tl-flag--suspicious"><AlertTriangle size={9} />FLAGGED</span>
                        )}
                      </div>
                      <p className="cd-tl-label">{evt.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ── Right column ── */}
        <div className="cd-right-col">

          {/* AI Summary */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Brain size={14} /> AI Analysis</span>
              <span className="badge badge--info" style={{ fontSize: 10 }}>NEXUS-7</span>
            </div>
            <div className="cd-panel-body cd-ai-body">
              <div className="cd-ai-conf">
                <div className="cd-ai-conf-row">
                  <span className="cd-ai-conf-label">Confidence</span>
                  <span className={`cd-ai-conf-val cd-ai-conf-val--${riskColor}`}>
                    {c.riskScore >= 80 ? 'High' : c.riskScore >= 55 ? 'Medium' : 'Low'} — {c.riskScore}%
                  </span>
                </div>
                <div className="cd-conf-bar-wrap">
                  <div className={`cd-conf-bar cd-conf-bar--${riskColor}`} style={{ width: `${c.riskScore}%` }} />
                </div>
              </div>
              <div className="cd-ai-stats">
                {[
                  { label: 'Supporting Evidence',             value: Math.floor(c.evidenceCount * 0.004), color: 'green' },
                  { label: 'AI Findings',                     value: c.aiFindings,                         color: 'cyan' },
                  { label: 'Alt. Explanations',               value: 2,                                    color: 'gray' },
                  { label: 'Missing Evidence Gaps',           value: 3,                                    color: 'amber' },
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
                  id="review-findings-btn"
                  onClick={() => navigate('/ai-findings')}
                  title="Open AI findings and hypothesis reasoning"
                >
                  <Brain size={13} /> Review Findings
                </button>
                <button 
                  className="cd-btn cd-btn--ghost" 
                  id="chat-ai-btn"
                  onClick={() => navigate('/intelligence-chat')}
                  title="Ask questions about this case in Intelligence Chat"
                >
                  <MessageSquare size={13} /> Chat with AI
                </button>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><Users size={14} /> Investigation Team</span>
              <span className="cd-panel-badge">{c.team.length} members</span>
            </div>
            <div className="cd-panel-body">
              {c.team.map((member, i) => (
                <div key={i} className="cd-team-member">
                  <div className="cd-team-avatar">
                    {member.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="cd-team-info">
                    <span className="cd-team-name">{member}</span>
                    <span className="cd-team-role">{i === 0 ? 'Lead Analyst' : 'Supporting Analyst'}</span>
                  </div>
                  {i === 0 && <span className="cd-team-badge">Lead</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick nav */}
          <div className="cd-panel">
            <div className="cd-panel-header">
              <span className="cd-panel-title"><ExternalLink size={14} /> Case Modules</span>
            </div>
            <div className="cd-panel-body cd-modules-body">
              {[
                { label: 'Evidence Vault',     icon: HardDrive,    count: c.evidenceCount.toLocaleString(), path: '/evidence' },
                { label: 'Knowledge Graph',    icon: Share2,       count: 'View',                          path: '/knowledge-graph' },
                { label: 'Timeline Analysis',  icon: Activity,     count: `${c.timeline.length} events`,  path: '/timeline' },
                { label: 'Chain of Custody',   icon: CheckCircle2, count: 'Verified',                      path: '/chain-of-custody' },
                { label: 'Generate Report',    icon: Download,     count: 'Export',                        path: '/reports' },
              ].map(m => {
                const Icon = m.icon
                return (
                  <button 
                    key={m.label} 
                    className="cd-module-btn"
                    onClick={() => navigate(m.path)}
                    title={`Go to ${m.label}`}
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
