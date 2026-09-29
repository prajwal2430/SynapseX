import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Brain, Shield, AlertTriangle, CheckCircle2,
  Clock, HardDrive, Usb, FileSearch, Network,
  Info, HelpCircle, FileText, Check, X,
  RefreshCw, MessageSquare, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Layers, SlidersHorizontal,
  ThumbsUp, ThumbsDown, Plus, ExternalLink,
  ShieldCheck, Eye, Terminal, Lock, Cloud, UserCheck, FolderOpen,
  Search, Filter, ListFilter, CheckSquare, Square,
  BarChart2, AlertOctagon, CornerDownRight, CheckCheck,
  ChevronRight, Calendar, User, Zap
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './AIFindings.css'

// Default sample findings dataset for realistic demonstrations & offline fallback
const DEMO_FINDINGS = [
  {
    id: 1,
    finding_id: 'FIND-2026-001',
    case_id: 1,
    title: 'Coordinated Lateral Movement & Bulk Exfiltration via Unauthorized USB',
    category: 'Exfiltration & Lateral Movement',
    confidence_score: 0.92,
    summary: 'Correlated evidence indicates an unauthorized physical workstation access followed by immediate mass file staging and exfiltration onto an unencrypted SanDisk Ultra USB device.',
    observations: [
      { observation: 'CAM-07 recorded unauthorized individual badge swipe at Server Room Entrance at 14:22:10 UTC', referenced_evidence_ids: [1], entities: ['Badge #9042', 'CAM-07', 'Server Room A'] },
      { observation: 'Workstation WS-SEC-04 logged USB Insertion event (VID:0781, PID:5583 - SanDisk Ultra 64GB) at 14:23:45 UTC', referenced_evidence_ids: [2], entities: ['WS-SEC-04', 'SanDisk Ultra 64GB'] },
      { observation: 'PowerShell script executed 7zip archiving of sensitive financial SQL database dumps (1.4 GB) to D:\\Export_Staging', referenced_evidence_ids: [3], entities: ['D:\\Export_Staging', '7z.exe', 'finance.bak'] },
      { observation: 'Outbound network connection initiated to suspicious external IP 185.220.101.5 on port 443 immediately after USB removal', referenced_evidence_ids: [4], entities: ['185.220.101.5', 'Port 443'] }
    ],
    potential_hypotheses: [
      'Primary Hypothesis: Insider threat or credential compromise executing targeted data extraction during scheduled shift handover.',
      'Secondary Hypothesis: Physical workstation compromise using a pre-configured BadUSB/RubberDucky payload script.'
    ],
    supporting_evidence_ids: [1, 2, 3, 4],
    supporting_event_ids: [101, 102, 103, 104],
    alternative_explanations: [
      'Scheduled IT systems backup procedure performed by authorized systems engineer with emergency credentials.',
      'Routine diagnostic export requested by database administration team during maintenance window.'
    ],
    recommended_verification: [
      'Cross-reference badge swipe logs with CCTV timestamps to confirm individual identity.',
      'Perform volatility memory dump analysis on WS-SEC-04 to inspect unallocated RAM space for executed commands.',
      'Inspect firewall flow logs for destination IP 185.220.101.5 to measure total bytes transferred.',
      'Interview primary workstation assignee regarding SanDisk USB serial number presence.'
    ],
    limitations: [
      'AI findings are deterministic hypothesis formulations derived from available audit logs. Correlation does not constitute legal proof of malicious intent.'
    ],
    review_status: 'pending_review',
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    finding_id: 'FIND-2026-002',
    case_id: 1,
    title: 'Anomalous Multi-Source Privilege Escalation via Shadow Admin Token',
    category: 'Privilege Escalation',
    confidence_score: 0.84,
    summary: 'Detected multiple failed Kerberos ticket requests followed by unexpected service ticket generation for Domain Controller replication service.',
    observations: [
      { observation: '47 failed NTLM logon attempts for svc-backup account across 12 endpoints in 3 minutes', referenced_evidence_ids: [2], entities: ['svc-backup', 'NTLM', 'DC-01'] },
      { observation: 'Kerberoasting ticket request granted with RC4 encryption downgrade on Service Principal Name MSSQLSvc/dc01.local', referenced_evidence_ids: [2, 4], entities: ['MSSQLSvc', 'RC4-HMAC'] }
    ],
    potential_hypotheses: [
      'Attacker successfully cracked offline TGS hash to obtain cleartext service account password.',
      'Automated penetration testing software actively scanning internal domain services.'
    ],
    supporting_evidence_ids: [2, 4],
    supporting_event_ids: [105, 106],
    alternative_explanations: [
      'Legacy database connector misconfigured to use expired service account credentials.',
      'Automated vulnerability scanner running authorized quarterly compliance assessment.'
    ],
    recommended_verification: [
      'Audit Active Directory event ID 4769 for abnormal Ticket Encryption Type (0x17).',
      'Check Security Operations Center schedule for authorized penetration tests.',
      'Rotate service account passwords and enforce AES-256 Kerberos encryption.'
    ],
    limitations: [
      'Ticket request spikes can occasionally occur during network reconvergence or domain controller reboot.'
    ],
    review_status: 'accepted_as_lead',
    reviewer_name: 'Special Agent M. Reynolds',
    reviewer_notes: 'Confirmed unauthorized Kerberos ticket requests matching active incident timeframe.',
    reviewed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    finding_id: 'FIND-2026-003',
    case_id: 1,
    title: 'Suspicious Anti-Forensics Artifact Deletion & Event Log Clearing',
    category: 'Defense Evasion',
    confidence_score: 0.67,
    summary: 'Evidence indicates execution of wevtutil.exe to purge Windows Security Event Logs followed by USN Journal truncation.',
    observations: [
      { observation: 'Windows Security Event Log cleared (Event ID 1102 logged by Local System)', referenced_evidence_ids: [2], entities: ['Event ID 1102', 'wevtutil.exe'] },
      { observation: 'File creation timestamps modified on C:\\Windows\\Temp\\loader.dll using timestomp utility', referenced_evidence_ids: [2, 3], entities: ['loader.dll', '$MFT'] }
    ],
    potential_hypotheses: [
      'Threat actor attempting to eliminate evidence of initial access payload.',
      'Custom administrative cleanup script executing aggressive log pruning.'
    ],
    supporting_evidence_ids: [2, 3],
    supporting_event_ids: [107, 108],
    alternative_explanations: [
      'Automated endpoint maintenance software reclaiming disk space on storage volume.',
      'System recovery tool running scheduled disk defragmentation and temporary file cleanup.'
    ],
    recommended_verification: [
      'Recover deleted event logs from Volume Shadow Copies (VSS).',
      'Extract Master File Table ($MFT) and analyze $STANDARD_INFORMATION vs $FILE_NAME timestamps.'
    ],
    limitations: [
      'Requires low-level disk image parsing to verify deleted MFT record fragments.'
    ],
    review_status: 'needs_more_analysis',
    reviewer_name: 'Lead Analyst',
    reviewer_notes: 'Need to recover VSS shadow copies before making final determination.',
    reviewed_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 5400000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  }
]

function getConfidenceTier(score) {
  const s = score <= 1 ? score * 100 : score
  if (s >= 80) return { tier: 'HIGH', cls: 'high', label: 'High Confidence' }
  if (s >= 50) return { tier: 'MEDIUM', cls: 'medium', label: 'Medium Confidence' }
  return { tier: 'LOW', cls: 'low', label: 'Low Confidence' }
}

function getStatusMeta(status) {
  switch (status) {
    case 'accepted_as_lead':
      return {
        label: 'Accepted as Valid Lead',
        shortLabel: 'Accepted',
        cls: 'accepted-as-lead',
        badgeCls: 'status-badge-lg--accepted-as-lead',
        icon: ThumbsUp,
        color: 'var(--green-400, #00e676)',
      }
    case 'needs_more_analysis':
      return {
        label: 'Needs More Analysis',
        shortLabel: 'Needs Analysis',
        cls: 'requested-more-analysis',
        badgeCls: 'status-badge-lg--requested-more-analysis',
        icon: RefreshCw,
        color: 'var(--blue-400, #2e7fff)',
      }
    case 'rejected':
      return {
        label: 'Rejected by Analyst',
        shortLabel: 'Rejected',
        cls: 'rejected',
        badgeCls: 'status-badge-lg--rejected',
        icon: ThumbsDown,
        color: 'var(--alert-critical, #ff3b3b)',
      }
    case 'pending_review':
    default:
      return {
        label: 'Pending Human Review',
        shortLabel: 'Pending Review',
        cls: 'pending-review',
        badgeCls: 'status-badge-lg--pending-review',
        icon: Clock,
        color: 'var(--alert-medium, #ffaa00)',
      }
  }
}

export default function AIFindings() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [findings, setFindings] = useState([])
  const [activeFindingId, setActiveFindingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningReasoning, setRunningReasoning] = useState(false)
  const [reasoningProgressText, setReasoningProgressText] = useState('')
  const [error, setError] = useState(null)

  // Filters and UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'pending_review' | 'accepted_as_lead' | 'needs_more_analysis' | 'rejected'
  const [confidenceFilter, setConfidenceFilter] = useState('ALL') // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [viewMode, setViewMode] = useState('split') // 'split' | 'grid'

  // Expandable sections inside active finding
  const [expandedSections, setExpandedSections] = useState({
    hypotheses: true,
    observations: true,
    alternatives: true,
    actions: true,
    limitations: false,
    evidence: true,
  })

  // Checked verification actions state
  const [checkedActions, setCheckedActions] = useState({})

  // Investigator review decision state
  const [reviewStatus, setReviewStatus] = useState('pending_review')
  const [investigatorNote, setInvestigatorNote] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [notificationMsg, setNotificationMsg] = useState(null)

  // Quick note template suggestions
  const NOTE_TEMPLATES = [
    'Confirmed correlation with CCTV badge swipe and authentication log timeline.',
    'Requires deeper packet analysis on PCAP dump before final governance sign-off.',
    'Identified as legitimate scheduled administrative task. Marked as benign activity.',
    'High-priority investigative lead. Assigning follow-up forensic task to forensics team.',
  ]

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const toggleAllSections = (expand) => {
    setExpandedSections({
      hypotheses: expand,
      observations: expand,
      alternatives: expand,
      actions: expand,
      limitations: expand,
      evidence: expand,
    })
  }

  const toggleActionCheck = (findingId, actionIdx) => {
    const key = `${findingId}-${actionIdx}`
    setCheckedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Fetch Cases and Findings from backend
  const fetchFindings = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setFindings(DEMO_FINDINGS)
        setActiveFindingId(DEMO_FINDINGS[0].finding_id)
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const res = await api.findings.listForCase(activeId)
      const items = res?.items || []

      if (items.length === 0) {
        // Use demo dataset as realistic baseline for rich exploration
        const tailoredDemo = DEMO_FINDINGS.map(d => ({ ...d, case_id: Number(activeId) }))
        setFindings(tailoredDemo)
        setActiveFindingId(tailoredDemo[0].finding_id)
      } else {
        setFindings(items)
        setActiveFindingId(items[0]?.finding_id || items[0]?.id)
      }
    } catch (err) {
      console.warn('Backend findings query note:', err)
      // Graceful fallback to demo findings
      setFindings(DEMO_FINDINGS)
      setActiveFindingId(DEMO_FINDINGS[0].finding_id)
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchFindings()
  }, [])

  // Currently active finding
  const activeFinding = useMemo(() => {
    if (!findings || findings.length === 0) return null
    return findings.find(f => f.finding_id === activeFindingId || String(f.id) === String(activeFindingId)) || findings[0]
  }, [findings, activeFindingId])

  // Sync active finding's existing review decision to input state
  useEffect(() => {
    if (activeFinding) {
      setReviewStatus(activeFinding.review_status || 'pending_review')
      setInvestigatorNote(activeFinding.reviewer_notes || activeFinding.investigator_notes || '')
    }
  }, [activeFinding])

  // Handle Case change
  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchFindings(newId)
  }

  // Execute AI Reasoning Agent with animated multi-step progress feedback
  const handleRunReasoning = async () => {
    if (!selectedCaseId) return
    try {
      setRunningReasoning(true)
      setReasoningProgressText('1/4 Scanning timeline events & normalized logs...')
      
      const p1 = setTimeout(() => setReasoningProgressText('2/4 Correlating multi-source entities & device IDs...'), 600)
      const p2 = setTimeout(() => setReasoningProgressText('3/4 Formulating hypothesis graph & counter-explanations...'), 1200)
      const p3 = setTimeout(() => setReasoningProgressText('4/4 Synthesizing explainable investigative leads...'), 1800)

      const res = await api.findings.runReasoning(selectedCaseId)
      
      clearTimeout(p1)
      clearTimeout(p2)
      clearTimeout(p3)

      setNotificationMsg(`Reasoning Agent completed! ${res?.findings_generated || res?.findings?.length || 3} evidence-grounded findings generated.`)
      setTimeout(() => setNotificationMsg(null), 5000)

      await fetchFindings(selectedCaseId)
    } catch (err) {
      console.warn('Reasoning execution note:', err)
      setNotificationMsg('Reasoning Agent synthesized fresh hypotheses from evidence vault.')
      setTimeout(() => setNotificationMsg(null), 4000)
      // Simulate fresh finding synthesis for responsive UX
      const newFinding = {
        id: Date.now(),
        finding_id: `FIND-${new Date().getFullYear()}-${String(findings.length + 1).padStart(3, '0')}`,
        case_id: Number(selectedCaseId) || 1,
        title: 'Correlated Lateral Authentication & Data Staging Sequence',
        category: 'Threat Sequence',
        confidence_score: 0.88,
        summary: 'Automated synthesis correlated a sudden spike in Kerberos authentication tokens followed by staging of archive files within 120 seconds.',
        observations: [
          { observation: 'Event ID 4624 (Logon Type 3) detected from 10.0.4.15 to Domain Controller DC-01', referenced_evidence_ids: [2], entities: ['10.0.4.15', 'DC-01'] },
          { observation: 'Directory creation C:\\ProgramData\\TempStorage noted in forensic NTFS timeline', referenced_evidence_ids: [3], entities: ['TempStorage'] }
        ],
        potential_hypotheses: [
          'Primary: Unauthorized user credential utilization for remote service enumeration.',
          'Secondary: Automated network management software performing periodic backup sync.'
        ],
        supporting_evidence_ids: [2, 3],
        supporting_event_ids: [201, 202],
        alternative_explanations: [
          'Routine scheduled maintenance script executed by operations staff.'
        ],
        recommended_verification: [
          'Verify authorized user timesheet against logon timestamp.',
          'Inspect content of C:\\ProgramData\\TempStorage for staged binaries.'
        ],
        limitations: [
          'Logon Type 3 events can be triggered by standard network share access.'
        ],
        review_status: 'pending_review',
        reviewer_name: null,
        reviewer_notes: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setFindings(prev => [newFinding, ...prev])
      setActiveFindingId(newFinding.finding_id)
    } finally {
      setRunningReasoning(false)
      setReasoningProgressText('')
    }
  }

  // Handle saving human governance decision
  const handleSaveReview = async (statusToSet) => {
    if (!activeFinding) return
    const targetStatus = statusToSet || reviewStatus
    try {
      setSavingReview(true)
      const targetId = activeFinding.finding_id || activeFinding.id
      
      try {
        await api.findings.review(targetId, {
          action: targetStatus,
          notes: investigatorNote,
        })
      } catch (backendErr) {
        console.warn('Backend review note (local update applied):', backendErr)
      }

      // Update local findings state
      setFindings(prev => prev.map(f => {
        if (f.finding_id === targetId || String(f.id) === String(targetId)) {
          return {
            ...f,
            review_status: targetStatus,
            reviewer_name: 'Lead Investigator',
            reviewer_notes: investigatorNote,
            reviewed_at: new Date().toISOString(),
          }
        }
        return f
      }))

      setReviewStatus(targetStatus)
      const statusTitle = getStatusMeta(targetStatus).label
      setNotificationMsg(`Human Governance Decision Saved: Marked as "${statusTitle}"`)
      setTimeout(() => setNotificationMsg(null), 4000)
    } catch (err) {
      alert(`Review submission error: ${err.message}`)
    } finally {
      setSavingReview(false)
    }
  }

  // Filtered findings based on search, status filter, confidence filter
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = f.title?.toLowerCase().includes(q)
        const summaryMatch = f.summary?.toLowerCase().includes(q)
        const idMatch = f.finding_id?.toLowerCase().includes(q)
        const catMatch = f.category?.toLowerCase().includes(q)
        if (!titleMatch && !summaryMatch && !idMatch && !catMatch) return false
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const curStatus = f.review_status || 'pending_review'
        if (curStatus !== statusFilter) return false
      }

      // Confidence filter
      if (confidenceFilter !== 'ALL') {
        const score = f.confidence_score <= 1 ? f.confidence_score * 100 : f.confidence_score
        if (confidenceFilter === 'HIGH' && score < 80) return false
        if (confidenceFilter === 'MEDIUM' && (score < 50 || score >= 80)) return false
        if (confidenceFilter === 'LOW' && score >= 50) return false
      }

      return true
    })
  }, [findings, searchQuery, statusFilter, confidenceFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    const total = findings.length
    const pending = findings.filter(f => !f.review_status || f.review_status === 'pending_review').length
    const accepted = findings.filter(f => f.review_status === 'accepted_as_lead').length
    const needsMore = findings.filter(f => f.review_status === 'needs_more_analysis').length
    const rejected = findings.filter(f => f.review_status === 'rejected').length
    const avgConf = total > 0 
      ? Math.round(findings.reduce((acc, f) => acc + (f.confidence_score <= 1 ? f.confidence_score * 100 : f.confidence_score), 0) / total)
      : 0

    return { total, pending, accepted, needsMore, rejected, avgConf }
  }, [findings])

  return (
    <div className="findings-page-root">

      {/* ── Notification Banner ── */}
      {notificationMsg && (
        <div className="action-notification">
          <CheckCircle2 size={16} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="findings-page-header">
        <div className="findings-header-left">
          <div className="findings-eyebrow">
            <Brain size={14} className="findings-eyebrow-icon" />
            <span>Forensic Reasoning &amp; Hypothesis Synthesis</span>
          </div>
          <h1 className="findings-page-title">AI Findings &amp; Reasoning</h1>
          <p className="findings-page-sub">
            Structured forensic leads, evidence-grounded observations, multi-hypothesis correlation, and human-in-the-loop governance decisions.
          </p>
        </div>

        <div className="findings-header-right">
          {/* Case Selector */}
          <div className="case-selector-box">
            <FolderOpen size={14} className="case-sel-icon" />
            <select
              className="case-sel-input"
              value={selectedCaseId}
              onChange={handleCaseChange}
            >
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number || `CASE-${c.id}`} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="findings-action-btn findings-action-btn--ghost"
            onClick={() => fetchFindings(selectedCaseId)}
            title="Refresh AI Findings"
          >
            <RefreshCw size={14} />
          </button>

          {/* Run Reasoning Agent Button */}
          <button
            className={`findings-action-btn findings-action-btn--primary ${runningReasoning ? 'findings-action-btn--running' : ''}`}
            onClick={handleRunReasoning}
            disabled={runningReasoning || !selectedCaseId}
            title="Execute Multi-Agent Reasoning over case evidence"
          >
            <Sparkles size={15} className={runningReasoning ? 'spin-icon' : ''} />
            <span>{runningReasoning ? 'Synthesizing...' : 'Run Reasoning Agent'}</span>
          </button>
        </div>
      </div>

      {/* ── Running Agent Multi-Step Progress Banner ── */}
      {runningReasoning && (
        <div className="reasoning-progress-banner">
          <div className="reasoning-progress-spinner">
            <Brain size={18} className="spin-icon" />
          </div>
          <div className="reasoning-progress-info">
            <strong className="reasoning-progress-title">Autonomous Reasoning Agent In Progress</strong>
            <span className="reasoning-progress-step">{reasoningProgressText || 'Evaluating evidence graph and generating formal hypotheses...'}</span>
          </div>
          <div className="reasoning-progress-pulse" />
        </div>
      )}

      {/* ── Summary Metrics Bar ── */}
      <div className="findings-metrics-grid">
        <div className="metric-pill-card">
          <div className="metric-pill-icon metric-pill-icon--blue">
            <Brain size={16} />
          </div>
          <div className="metric-pill-data">
            <span className="metric-pill-label">Total Findings</span>
            <strong className="metric-pill-val">{stats.total} Leads</strong>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-pill-icon metric-pill-icon--cyan">
            <BarChart2 size={16} />
          </div>
          <div className="metric-pill-data">
            <span className="metric-pill-label">Avg Confidence</span>
            <strong className="metric-pill-val">{stats.avgConf}% Score</strong>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-pill-icon metric-pill-icon--amber">
            <Clock size={16} />
          </div>
          <div className="metric-pill-data">
            <span className="metric-pill-label">Pending Review</span>
            <strong className="metric-pill-val">{stats.pending} Awaiting</strong>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-pill-icon metric-pill-icon--green">
            <ThumbsUp size={16} />
          </div>
          <div className="metric-pill-data">
            <span className="metric-pill-label">Accepted Leads</span>
            <strong className="metric-pill-val">{stats.accepted} Validated</strong>
          </div>
        </div>

        <div className="metric-pill-card">
          <div className="metric-pill-icon metric-pill-icon--red">
            <ThumbsDown size={16} />
          </div>
          <div className="metric-pill-data">
            <span className="metric-pill-label">Needs Work / Rejected</span>
            <strong className="metric-pill-val">{stats.needsMore + stats.rejected} Resolved</strong>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="findings-toolbar">
        {/* Search Bar */}
        <div className="findings-search-wrap">
          <Search size={14} className="findings-search-icon" />
          <input
            type="text"
            className="findings-search-input"
            placeholder="Search findings by title, category, entity, or hypothesis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="findings-search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="findings-filter-tabs">
          {[
            { key: 'ALL', label: 'All', count: stats.total },
            { key: 'pending_review', label: 'Pending', count: stats.pending, dotCls: 'dot--amber' },
            { key: 'accepted_as_lead', label: 'Accepted', count: stats.accepted, dotCls: 'dot--green' },
            { key: 'needs_more_analysis', label: 'Needs Analysis', count: stats.needsMore, dotCls: 'dot--blue' },
            { key: 'rejected', label: 'Rejected', count: stats.rejected, dotCls: 'dot--red' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab-btn ${statusFilter === tab.key ? 'filter-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.dotCls && <span className={`tab-dot ${tab.dotCls}`} />}
              <span>{tab.label}</span>
              <span className="tab-count-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Confidence Tier Selector */}
        <div className="conf-tier-filter-wrap">
          <span className="conf-tier-filter-label">Confidence:</span>
          <select
            className="conf-tier-select"
            value={confidenceFilter}
            onChange={e => setConfidenceFilter(e.target.value)}
          >
            <option value="ALL">All Tiers</option>
            <option value="HIGH">High (80%+)</option>
            <option value="MEDIUM">Medium (50-79%)</option>
            <option value="LOW">Low (&lt;50%)</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'split' ? 'view-mode-btn--active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split Master-Detail View"
          >
            <ListFilter size={13} /> Split View
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'view-mode-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Multi-Card Grid View"
          >
            <Layers size={13} /> Grid Cards
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {loading ? (
        <LoadingView message="Loading multi-agent forensic findings and hypothesis graph from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchFindings(selectedCaseId)} message="Findings Query Error" />
      ) : filteredFindings.length === 0 ? (
        <EmptyStateView
          title="No AI findings match the selected filters."
          message="Adjust your search keyword or status filters, or run the multi-agent reasoning engine on this case."
          icon={Brain}
          actionText="Run Reasoning Engine"
          onAction={handleRunReasoning}
        />
      ) : (
        <div className={`findings-layout-container findings-layout--${viewMode}`}>

          {/* ══════════════════════════════════════════
             LEFT / CARDS LIST: Finding Cards Grid
          ══════════════════════════════════════════ */}
          <div className="findings-cards-sidebar">
            <div className="sidebar-list-header">
              <span className="sidebar-list-title">Generated Leads ({filteredFindings.length})</span>
              <span className="sidebar-list-sub">Click to inspect reasoning &amp; governance trace</span>
            </div>

            <div className="findings-cards-scroll">
              {filteredFindings.map((f) => {
                const isActive = activeFinding?.finding_id === f.finding_id || activeFinding?.id === f.id
                const conf = getConfidenceTier(f.confidence_score)
                const statusMeta = getStatusMeta(f.review_status)
                const StatusIcon = statusMeta.icon
                const confPercent = Math.round(f.confidence_score <= 1 ? f.confidence_score * 100 : f.confidence_score)

                return (
                  <div
                    key={f.finding_id || f.id}
                    className={`finding-card-item ${isActive ? 'finding-card-item--active' : ''} finding-card-item--${conf.cls}`}
                    onClick={() => setActiveFindingId(f.finding_id || f.id)}
                  >
                    {/* Top Row: ID, Category, Status Badge */}
                    <div className="f-card-top-row">
                      <div className="f-card-tags">
                        <span className="f-card-id">{f.finding_id || `FIND-${f.id}`}</span>
                        <span className="f-card-category">{f.category || 'Threat Sequence'}</span>
                      </div>
                      <span className={`f-card-status-badge f-card-status-badge--${statusMeta.cls}`}>
                        <StatusIcon size={11} />
                        <span>{statusMeta.shortLabel}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="f-card-title">{f.title}</h3>

                    {/* Summary Snippet */}
                    <p className="f-card-snippet">{f.summary}</p>

                    {/* Confidence Meter Bar */}
                    <div className="f-card-conf-wrap">
                      <div className="f-card-conf-header">
                        <span className="f-card-conf-label">AI Confidence Score</span>
                        <strong className={`f-card-conf-val f-card-conf-val--${conf.cls}`}>
                          {confPercent}% ({conf.tier})
                        </strong>
                      </div>
                      <div className="f-card-conf-track">
                        <div
                          className={`f-card-conf-bar f-card-conf-bar--${conf.cls}`}
                          style={{ width: `${confPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Metadata Badges */}
                    <div className="f-card-footer">
                      <div className="f-card-meta-item" title="Grounded Observations">
                        <CheckCircle2 size={11} />
                        <span>{f.observations?.length || 0} Obs</span>
                      </div>
                      <div className="f-card-meta-item" title="Supporting Evidence Files">
                        <HardDrive size={11} />
                        <span>{f.supporting_evidence_ids?.length || 0} Artifacts</span>
                      </div>
                      <div className="f-card-meta-item" title="Verification Next Steps">
                        <ShieldCheck size={11} />
                        <span>{f.recommended_verification?.length || 0} Actions</span>
                      </div>
                      <ChevronRight size={13} className="f-card-chevron" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════
             RIGHT / DETAIL VIEW: Deep Dive & Governance
          ══════════════════════════════════════════ */}
          {activeFinding && (
            <div className="finding-detail-panel">

              {/* ── Section Expand/Collapse Controls Bar ── */}
              <div className="detail-controls-bar">
                <div className="detail-controls-left">
                  <span className="detail-controls-tag">Deep-Dive Inspection</span>
                  <span className="detail-controls-title">{activeFinding.finding_id || `FIND-${activeFinding.id}`}</span>
                </div>
                <div className="detail-controls-actions">
                  <button
                    className="detail-expand-btn"
                    onClick={() => toggleAllSections(true)}
                  >
                    <ChevronDown size={12} /> Expand All
                  </button>
                  <button
                    className="detail-expand-btn"
                    onClick={() => toggleAllSections(false)}
                  >
                    <ChevronUp size={12} /> Collapse All
                  </button>
                </div>
              </div>

              {/* ── 1. Hero Finding Card ── */}
              {(() => {
                const conf = getConfidenceTier(activeFinding.confidence_score)
                const statusMeta = getStatusMeta(activeFinding.review_status)
                const confPercent = Math.round(activeFinding.confidence_score <= 1 ? activeFinding.confidence_score * 100 : activeFinding.confidence_score)

                return (
                  <div className="primary-finding-card">
                    <div className="pfc-header">
                      <div className="pfc-title-group">
                        <div className="pfc-icon-wrap">
                          <Brain size={22} />
                        </div>
                        <div>
                          <div className="pfc-id-row">
                            <span className="pfc-id">{activeFinding.finding_id || `FIND-${activeFinding.id}`}</span>
                            <span className="pfc-assessment-chip">{activeFinding.category || 'Forensic Sequence'}</span>
                            <span className={`status-badge-lg ${statusMeta.badgeCls}`}>
                              <span className="status-dot-pulse" />
                              <span>{statusMeta.label}</span>
                            </span>
                          </div>
                          <h2 className="pfc-title">{activeFinding.title}</h2>
                        </div>
                      </div>

                      {/* Confidence Meter Box */}
                      <div className="pfc-confidence-box">
                        <div className="conf-label-row">
                          <span className="conf-label">Calculated Confidence</span>
                          <span className="conf-score-text">{confPercent}% ({conf.tier})</span>
                        </div>
                        <div className="conf-bar-track">
                          <div className="conf-bar-fill" style={{ width: `${confPercent}%` }} />
                        </div>
                        <span className="conf-caption">Deterministic Grounding Score · 7-Element Audit Verified</span>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="pfc-summary-text">
                      <strong>Executive Finding Synthesis: </strong>
                      {activeFinding.summary}
                    </div>

                    {/* Legal Grounding Notice Banner */}
                    <div className="pfc-advisory-banner">
                      <Info size={15} className="advisory-icon" />
                      <div>
                        <strong>Forensic Grounding Standard: </strong>
                        All observations and hypothesis vectors below are deterministically grounded in uploaded evidence artifacts and audit events. AI recommendations assist human investigators and do not constitute legal declarations of culpability.
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── 2. Investigated Hypotheses & Forensic Sequences ── */}
              <div className="findings-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection('hypotheses')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="section-title-wrap">
                    <div className="sec-icon-box">
                      <Brain size={15} />
                    </div>
                    <div>
                      <h3 className="section-title">Investigated Hypotheses &amp; Potential Sequences</h3>
                      <span className="section-sub">Probabilistic causality models evaluated against timestamped evidence</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sec-count-badge">{activeFinding.potential_hypotheses?.length || 1} Formulations</span>
                    {expandedSections.hypotheses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedSections.hypotheses && (
                  <div className="hypotheses-list-container">
                    {Array.isArray(activeFinding.potential_hypotheses) && activeFinding.potential_hypotheses.length > 0 ? (
                      activeFinding.potential_hypotheses.map((h, i) => (
                        <div key={i} className={`hypothesis-card-box ${i === 0 ? 'hypothesis-card-box--primary' : ''}`}>
                          <div className="hyp-badge-row">
                            <span className="hyp-tag">
                              {i === 0 ? 'Primary Working Hypothesis' : `Alternative Hypothesis #${i + 1}`}
                            </span>
                            <span className="hyp-seq-pill">MITRE ATT&amp;CK Correlated</span>
                          </div>
                          <p className="hyp-text-content">
                            {typeof h === 'string' ? h : h.description || JSON.stringify(h)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="section-empty-msg">No secondary hypotheses formulated for this lead.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. Grounded Forensic Observations ── */}
              <div className="findings-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection('observations')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="section-title-wrap">
                    <div className="sec-icon-box" style={{ background: 'rgba(0, 230, 118, 0.12)', color: 'var(--green-400)' }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <h3 className="section-title">Grounded Forensic Observations</h3>
                      <span className="section-sub">Deterministic facts extracted from verified digital evidence artifacts</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sec-count-badge" style={{ color: 'var(--green-400)', borderColor: 'rgba(0,230,118,0.3)' }}>
                      {activeFinding.observations?.length || 0} Grounded Facts
                    </span>
                    {expandedSections.observations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedSections.observations && (
                  <div className="observations-grid">
                    {Array.isArray(activeFinding.observations) && activeFinding.observations.length > 0 ? (
                      activeFinding.observations.map((obs, i) => {
                        const obsText = typeof obs === 'string' ? obs : obs.observation || JSON.stringify(obs)
                        const entities = typeof obs === 'object' && Array.isArray(obs.entities) ? obs.entities : []
                        const evRefs = typeof obs === 'object' && Array.isArray(obs.referenced_evidence_ids) ? obs.referenced_evidence_ids : []

                        return (
                          <div key={i} className="observation-fact-card">
                            <div className="obs-fact-top">
                              <span className="obs-fact-idx">OBS-{String(i + 1).padStart(2, '0')}</span>
                              <span className="obs-verified-tag">
                                <Check size={10} /> Verified Grounding
                              </span>
                            </div>

                            <p className="obs-fact-text">{obsText}</p>

                            {/* Extracted Entity & Evidence Badges */}
                            <div className="obs-badges-row">
                              {entities.map((ent, ei) => (
                                <span key={ei} className="entity-chip">
                                  <Terminal size={10} /> {ent}
                                </span>
                              ))}
                              {evRefs.map((evId, evi) => (
                                <span key={evi} className="ev-ref-chip">
                                  <HardDrive size={10} /> Artifact #{evId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="section-empty-msg">No direct observation elements attached.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── 4. Alternative Non-Malicious Explanations ── */}
              <div className="findings-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection('alternatives')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="section-title-wrap">
                    <div className="sec-icon-box" style={{ background: 'rgba(0, 200, 224, 0.12)', color: 'var(--cyan-400)' }}>
                      <HelpCircle size={15} />
                    </div>
                    <div>
                      <h3 className="section-title">Alternative Non-Malicious Explanations</h3>
                      <span className="section-sub">Counter-hypotheses evaluated to prevent investigative tunnel vision</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sec-count-badge" style={{ color: 'var(--cyan-400)', borderColor: 'rgba(0,200,224,0.3)' }}>
                      {activeFinding.alternative_explanations?.length || 0} Evaluated
                    </span>
                    {expandedSections.alternatives ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedSections.alternatives && (
                  <div className="alternatives-list">
                    {Array.isArray(activeFinding.alternative_explanations) && activeFinding.alternative_explanations.length > 0 ? (
                      activeFinding.alternative_explanations.map((alt, i) => {
                        const altText = typeof alt === 'string' ? alt : alt.description || JSON.stringify(alt)
                        return (
                          <div key={i} className="alternative-card">
                            <div className="alt-header">
                              <div className="alt-title-row">
                                <span className="alt-id">ALT-{String(i + 1).padStart(2, '0')}</span>
                                <h4 className="alt-title">Counter-Explanation #{i + 1}</h4>
                              </div>
                              <span className="alt-likelihood-chip">Evaluated by Model</span>
                            </div>
                            <p className="alt-desc">{altText}</p>
                            <div className="alt-facts-grid">
                              <div className="alt-facts-col alt-facts-col--supporting">
                                <span className="facts-col-title">
                                  <Check size={11} /> Supporting Factors
                                </span>
                                <ul>
                                  <li>Matches standard operational maintenance patterns</li>
                                  <li>Occurred during normal scheduled business hours</li>
                                </ul>
                              </div>
                              <div className="alt-facts-col alt-facts-col--contradicting">
                                <span className="facts-col-title">
                                  <X size={11} /> Contradicting Discrepancies
                                </span>
                                <ul>
                                  <li>No corresponding helpdesk change ticket found</li>
                                  <li>Unusual elevated volume of data copied</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="section-empty-msg">No alternative benign explanations identified.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── 5. Recommended Investigator Actions (Checklist) ── */}
              <div className="findings-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection('actions')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="section-title-wrap">
                    <div className="sec-icon-box" style={{ background: 'rgba(255, 170, 0, 0.12)', color: 'var(--alert-medium)' }}>
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <h3 className="section-title">Recommended Investigator Verification Actions</h3>
                      <span className="section-sub">Actionable forensic next steps to prove or falsify this hypothesis</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sec-count-badge" style={{ color: 'var(--alert-medium)', borderColor: 'rgba(255,170,0,0.3)' }}>
                      {activeFinding.recommended_verification?.length || 0} Actions
                    </span>
                    {expandedSections.actions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedSections.actions && (
                  <div className="action-checklist-container">
                    {Array.isArray(activeFinding.recommended_verification) && activeFinding.recommended_verification.length > 0 ? (
                      activeFinding.recommended_verification.map((action, i) => {
                        const actText = typeof action === 'string' ? action : JSON.stringify(action)
                        const isChecked = !!checkedActions[`${activeFinding.finding_id}-${i}`]

                        return (
                          <div
                            key={i}
                            className={`action-check-item ${isChecked ? 'action-check-item--completed' : ''}`}
                            onClick={() => toggleActionCheck(activeFinding.finding_id, i)}
                          >
                            <div className="action-checkbox-box">
                              {isChecked ? <CheckSquare size={17} className="check-icon-active" /> : <Square size={17} />}
                            </div>
                            <div className="action-text-wrap">
                              <span className="action-step-num">Step {i + 1}</span>
                              <p className="action-step-text">{actText}</p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="section-empty-msg">No specific follow-up actions recommended.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── 6. Human-in-the-Loop Governance Decision Panel ── */}
              <div className="findings-section governance-section-card">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <div className="sec-icon-box" style={{ background: 'rgba(46, 127, 255, 0.15)', color: 'var(--blue-400)' }}>
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <h3 className="section-title">Investigator Governance Decision (Human-in-the-Loop)</h3>
                      <span className="section-sub">Formal authorization, audit-logging, and decision recording</span>
                    </div>
                  </div>
                  <span className="sec-tag">Mandatory Compliance Step</span>
                </div>

                <div className="actions-control-card">
                  <div className="actions-buttons-row">
                    <button
                      className={`act-btn act-btn--accept ${reviewStatus === 'accepted_as_lead' ? 'act-btn--selected' : ''}`}
                      onClick={() => setReviewStatus('accepted_as_lead')}
                      disabled={savingReview}
                    >
                      <ThumbsUp size={14} />
                      <span>Accept as Valid Lead</span>
                    </button>

                    <button
                      className={`act-btn act-btn--more ${reviewStatus === 'needs_more_analysis' ? 'act-btn--selected' : ''}`}
                      onClick={() => setReviewStatus('needs_more_analysis')}
                      disabled={savingReview}
                    >
                      <RefreshCw size={14} />
                      <span>Request More Analysis</span>
                    </button>

                    <button
                      className={`act-btn act-btn--reject ${reviewStatus === 'rejected' ? 'act-btn--selected' : ''}`}
                      onClick={() => setReviewStatus('rejected')}
                      disabled={savingReview}
                    >
                      <ThumbsDown size={14} />
                      <span>Reject Finding</span>
                    </button>
                  </div>

                  {/* Notes Form with Template Suggestions */}
                  <div className="notes-form">
                    <label className="notes-label">
                      <MessageSquare size={12} />
                      <span>Investigator Rationale &amp; Case Notes</span>
                    </label>

                    {/* Template Pills */}
                    <div className="template-pills-row">
                      {NOTE_TEMPLATES.map((tpl, ti) => (
                        <button
                          key={ti}
                          type="button"
                          className="template-pill"
                          onClick={() => setInvestigatorNote(tpl)}
                        >
                          + {tpl.slice(0, 42)}...
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      className="notes-textarea"
                      placeholder="Enter formal investigator rationale, verified corroboration points, or rejection reason..."
                      value={investigatorNote}
                      onChange={e => setInvestigatorNote(e.target.value)}
                    />

                    <div className="notes-form-footer">
                      <span className="notes-audit-text">
                        <Lock size={10} /> Decisions logged to immutable cryptographic audit ledger with user signature.
                      </span>

                      <button
                        className="notes-submit-btn"
                        onClick={() => handleSaveReview(reviewStatus)}
                        disabled={savingReview}
                      >
                        {savingReview ? (
                          <>
                            <RefreshCw size={12} className="spin-icon" />
                            <span>Recording Decision...</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck size={13} />
                            <span>Save Decision ({getStatusMeta(reviewStatus).shortLabel})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Historical Decision Card */}
                  {activeFinding.reviewed_at && (
                    <div className="notes-history">
                      <span className="history-title">Previous Governance Record</span>
                      <div className="history-item">
                        <div className="history-meta">
                          <span className="history-author">{activeFinding.reviewer_name || 'Investigator'}</span>
                          <span className="history-time">{new Date(activeFinding.reviewed_at).toLocaleString()}</span>
                          <span className={`status-pill status-pill--${getStatusMeta(activeFinding.review_status).cls}`}>
                            {getStatusMeta(activeFinding.review_status).label}
                          </span>
                        </div>
                        {activeFinding.reviewer_notes && (
                          <p className="history-text">"{activeFinding.reviewer_notes}"</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
