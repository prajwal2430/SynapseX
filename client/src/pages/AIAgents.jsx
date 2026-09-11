import { useState, useEffect, useCallback } from 'react'
import {
  Bot, Cpu, Play, Pause, RefreshCw,
  HardDrive, GitBranch, Video, Network,
  Share2, Brain, FileText, AlertCircle,
  CheckCircle2, Clock, Activity, Zap,
  Layers, ArrowRight, ArrowDown, ChevronRight,
  SlidersHorizontal, Terminal, Shield, Sparkles,
  Search, Eye, HelpCircle, FileCheck, Check, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './AIAgents.css'

const AGENT_FLEET_DEFINITIONS = [
  {
    id: 'chief_agent',
    name: 'Chief Investigator Agent',
    tier: 'orchestration',
    role: 'Central Autonomous Supervisor & Task Orchestrator',
    color: 'blue',
    icon: Bot,
    description: 'Coordinates multi-agent workflow, tracks evidence scopes, and manages hypothesis synthesis.',
  },
  {
    id: 'evidence_agent',
    name: 'Evidence Ingestion Agent',
    tier: 'ingestion',
    role: 'Artifact Ingestion & Cryptographic Integrity',
    color: 'blue',
    icon: HardDrive,
    description: 'Extracts deterministic entities (IPs, accounts, hashes) from raw evidence files.',
  },
  {
    id: 'timeline_agent',
    name: 'Timeline Reconstruction Agent',
    tier: 'synthesis',
    role: 'Cross-Source Chronological Synchronization',
    color: 'cyan',
    icon: GitBranch,
    description: 'Sequentially sorts and clusters normalized events across heterogeneous evidence sources.',
  },
  {
    id: 'correlation_agent',
    name: 'Correlation Engine Agent',
    tier: 'synthesis',
    role: 'Multi-Source Signal Discovery & Clustering',
    color: 'green',
    icon: Network,
    description: 'Discovers common entities, IP overlaps, device matches, and temporal proximities.',
  },
  {
    id: 'graph_agent',
    name: 'Knowledge Graph Agent',
    tier: 'synthesis',
    role: 'Entity Relationship Topology & Neo4j Bridge',
    color: 'purple',
    icon: Share2,
    description: 'Builds grounded node/edge graph topologies with evidence grounding.',
  },
  {
    id: 'reasoning_agent',
    name: 'Reasoning Engine Agent',
    tier: 'reasoning',
    role: 'Evidence-Backed Hypothesis & Lead Formulator',
    color: 'amber',
    icon: Brain,
    description: 'Generates observations, hypotheses, alternative non-malicious explanations, and verification steps.',
  },
  {
    id: 'missing_evidence_agent',
    name: 'Missing Evidence Gap Agent',
    tier: 'governance',
    role: 'Investigation Completeness & Blindspot Identifier',
    color: 'red',
    icon: AlertCircle,
    description: 'Evaluates logical gaps in evidence trails and suggests specific logs or artifacts to acquire.',
  },
  {
    id: 'report_agent',
    name: 'Executive Report Agent',
    tier: 'governance',
    role: 'Forensic Briefing & Compliance Synthesis',
    color: 'cyan',
    icon: FileText,
    description: 'Assembles immutable forensic reports with full chain of custody and evidence inventories.',
  },
]

export default function AIAgents() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [activeJob, setActiveJob] = useState(null)
  const [fleetStatus, setFleetStatus] = useState('idle')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(AGENT_FLEET_DEFINITIONS[0])

  const fetchAnalysisData = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setAnalysisHistory([])
        setActiveJob(null)
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const [historyRes, statusRes] = await Promise.all([
        api.analysis.listForCase(activeId),
        api.analysis.getStatus(activeId),
      ])

      const items = historyRes?.items || []
      setAnalysisHistory(items)
      setActiveJob(items[0] || null)
      setFleetStatus(statusRes?.status || (items[0] ? items[0].status : 'idle'))
    } catch (err) {
      setError(err.message || 'Failed to connect to AI Multi-Agent fleet backend.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchAnalysisData()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchAnalysisData(newId)
  }

  const handleStartAnalysis = async () => {
    if (!selectedCaseId) return
    try {
      setRunning(true)
      const res = await api.analysis.start(selectedCaseId, { notes: 'Investigator triggered fleet run' })
      alert(`Multi-Agent Fleet launched! Analysis Job #${res?.id || ''} completed successfully.`)
      await fetchAnalysisData(selectedCaseId)
    } catch (err) {
      alert(`Agent execution error: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="ag-root">

      {/* ── Page Header ── */}
      <div className="ag-page-header">
        <div className="ag-header-left">
          <div className="ag-eyebrow">
            <Cpu size={12} />
            Autonomous Analysis Fleet
          </div>
          <h1 className="ag-page-title">AI Multi-Agent Intelligence</h1>
          <p className="ag-page-sub">
            LangGraph multi-agent orchestration · Deterministic grounding · Strict non-guilt policy
          </p>
        </div>

        <div className="ag-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="ag-select"
              value={selectedCaseId}
              onChange={handleCaseChange}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
              }}
            >
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number || `CASE-${c.id}`} — {c.title}
                </option>
              ))}
            </select>
          )}

          <button
            className="ag-btn ag-btn--ghost"
            onClick={() => fetchAnalysisData(selectedCaseId)}
            title="Refresh Fleet Status"
          >
            <RefreshCw size={14} />
          </button>

          <button
            className="ag-btn ag-btn--primary"
            onClick={handleStartAnalysis}
            disabled={running || !selectedCaseId}
          >
            <Play size={14} />
            {running ? 'Executing Agent Pipeline...' : 'Run Multi-Agent Fleet'}
          </button>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Connecting to AI Multi-Agent fleet controller..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchAnalysisData(selectedCaseId)} message="Agent Controller Error" />
      ) : (
        <div className="ag-main-layout">

          {/* Fleet Cards Grid */}
          <div className="ag-fleet-grid">
            {AGENT_FLEET_DEFINITIONS.map((agent) => {
              const Icon = agent.icon
              const isSelected = selectedAgent.id === agent.id
              return (
                <div
                  key={agent.id}
                  className={`ag-card ag-card--${agent.color} ${isSelected ? 'ag-card--selected' : ''}`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="ag-card-top">
                    <div className={`ag-card-icon-wrap ag-card-icon-wrap--${agent.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="ag-tier-badge">{agent.tier}</span>
                  </div>
                  <h3 className="ag-card-name">{agent.name}</h3>
                  <p className="ag-card-role">{agent.role}</p>
                  <p className="ag-card-desc">{agent.description}</p>
                  <div className="ag-card-footer">
                    <span className="badge badge--active" style={{ fontSize: 9 }}>
                      <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                      Operational
                    </span>
                    <span className="ag-model-tag">Deterministic</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Agent & Run History */}
          <div className="ag-bottom-panel">
            <div className="ag-job-history-box">
              <h3>Agent Run History ({analysisHistory.length} runs)</h3>
              {analysisHistory.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                  No multi-agent runs executed yet. Click &quot;Run Multi-Agent Fleet&quot; to execute all 8 agents sequentially.
                </p>
              ) : (
                <div className="ag-jobs-list">
                  {analysisHistory.map((job) => (
                    <div
                      key={job.id}
                      className={`ag-job-item ${activeJob?.id === job.id ? 'ag-job-item--active' : ''}`}
                      onClick={() => setActiveJob(job)}
                    >
                      <div>
                        <strong>Analysis Job #{job.id}</strong>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                          {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                      <span className={`badge badge--${job.status === 'completed' ? 'success' : 'warning'}`}>
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeJob && (
              <div className="ag-job-detail-box">
                <h3>Analysis Job #{activeJob.id} Output Snapshot</h3>
                <div className="ag-job-stats-row">
                  <div>Findings Generated: <strong>{activeJob.findings?.length || 0}</strong></div>
                  <div>Recommendations: <strong>{activeJob.recommendations?.length || 0}</strong></div>
                  <div>Entities Analyzed: <strong>{activeJob.extracted_entities?.length || 0}</strong></div>
                </div>
                {activeJob.report_summary && (
                  <p className="ag-job-summary">{activeJob.report_summary}</p>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
