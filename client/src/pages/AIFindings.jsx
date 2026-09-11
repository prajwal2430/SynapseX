import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Shield, AlertTriangle, CheckCircle2,
  Clock, HardDrive, Usb, FileSearch, Network,
  Info, HelpCircle, FileText, Check, X,
  RefreshCw, MessageSquare, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Layers, SlidersHorizontal,
  ThumbsUp, ThumbsDown, Plus, ExternalLink,
  ShieldCheck, Eye, Terminal, Lock, Cloud, UserCheck, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './AIFindings.css'

export default function AIFindings() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [findings, setFindings] = useState([])
  const [activeFinding, setActiveFinding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningReasoning, setRunningReasoning] = useState(false)
  const [error, setError] = useState(null)

  const [reviewStatus, setReviewStatus] = useState('pending_review')
  const [investigatorNote, setInvestigatorNote] = useState('')
  const [savingReview, setSavingReview] = useState(false)

  const fetchFindings = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setFindings([])
        setActiveFinding(null)
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const res = await api.findings.listForCase(activeId)
      const items = res?.items || []
      setFindings(items)
      setActiveFinding(items[0] || null)
      if (items[0]) {
        setReviewStatus(items[0].review_status || 'pending_review')
        setInvestigatorNote(items[0].investigator_notes || '')
      }
    } catch (err) {
      setError(err.message || 'Failed to load AI findings from backend.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchFindings()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchFindings(newId)
  }

  const handleRunReasoning = async () => {
    if (!selectedCaseId) return
    try {
      setRunningReasoning(true)
      const res = await api.findings.runReasoning(selectedCaseId)
      alert(`Reasoning Agent completed! ${res?.findings_generated || 0} findings generated from structured evidence.`)
      await fetchFindings(selectedCaseId)
    } catch (err) {
      alert(`Reasoning Agent error: ${err.message}`)
    } finally {
      setRunningReasoning(false)
    }
  }

  const handleSaveReview = async (statusToSet) => {
    if (!activeFinding) return
    try {
      setSavingReview(true)
      await api.findings.review(activeFinding.finding_id || activeFinding.id, {
        review_status: statusToSet || reviewStatus,
        notes: investigatorNote,
      })
      alert(`Human-in-the-loop governance decision recorded: ${statusToSet || reviewStatus}`)
      await fetchFindings(selectedCaseId)
    } catch (err) {
      alert(`Review submission error: ${err.message}`)
    } finally {
      setSavingReview(false)
    }
  }

  return (
    <div className="af-root">

      {/* ── Page Header ── */}
      <div className="af-page-header">
        <div className="af-header-left">
          <div className="af-eyebrow">
            <Brain size={12} />
            Forensic Hypothesis Synthesis
          </div>
          <h1 className="af-page-title">AI Findings &amp; Reasoning</h1>
          <p className="af-page-sub">
            Deterministic observations · Grounded evidence references · Human investigator governance
          </p>
        </div>

        <div className="af-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="af-select"
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
            className="af-btn af-btn--ghost"
            onClick={() => fetchFindings(selectedCaseId)}
            title="Refresh Findings"
          >
            <RefreshCw size={14} />
          </button>

          <button
            className="af-btn af-btn--primary"
            onClick={handleRunReasoning}
            disabled={runningReasoning || !selectedCaseId}
          >
            <Sparkles size={14} />
            {runningReasoning ? 'Synthesizing Hypotheses...' : 'Run Reasoning Agent'}
          </button>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Loading multi-agent forensic findings from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchFindings(selectedCaseId)} message="Findings Query Error" />
      ) : findings.length === 0 ? (
        <EmptyStateView
          title="No AI findings generated for this case."
          message="Run the multi-agent reasoning engine on structured evidence and correlations to formulate evidence-grounded hypotheses."
          icon={Brain}
          actionText="Run Reasoning Engine"
          onAction={handleRunReasoning}
        />
      ) : (
        <div className="af-main-layout">

          {/* ── Left Sidebar: Findings List ── */}
          <div className="af-sidebar">
            <div className="af-sidebar-header">
              <span className="af-sb-title">Generated Leads ({findings.length})</span>
            </div>
            <div className="af-findings-nav">
              {findings.map((f) => {
                const isActive = activeFinding?.id === f.id || activeFinding?.finding_id === f.finding_id
                return (
                  <div
                    key={f.id || f.finding_id}
                    className={`af-nav-card ${isActive ? 'af-nav-card--active' : ''}`}
                    onClick={() => {
                      setActiveFinding(f)
                      setReviewStatus(f.review_status || 'pending_review')
                      setInvestigatorNote(f.investigator_notes || '')
                    }}
                  >
                    <div className="af-nav-top">
                      <span className="af-nav-id">{f.finding_id || `FIND-${f.id}`}</span>
                      <span className={`af-nav-badge af-nav-badge--${f.confidence_tier || 'medium'}`}>
                        {f.confidence_tier || 'Medium'} ({intPct(f.confidence_score)}%)
                      </span>
                    </div>
                    <p className="af-nav-title">{f.title}</p>
                    <span className="af-nav-status">{f.review_status?.replace('_', ' ') || 'Pending Review'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right: Finding Details ── */}
          {activeFinding && (
            <div className="af-content-area">

              {/* Lead Card */}
              <div className="af-lead-card">
                <div className="af-lead-header">
                  <div>
                    <span className="af-lead-id">{activeFinding.finding_id || `FIND-${activeFinding.id}`}</span>
                    <h2 className="af-lead-title">{activeFinding.title}</h2>
                  </div>
                  <div className="af-lead-badges">
                    <span className="badge badge--info">{activeFinding.category || 'Forensic Sequence'}</span>
                    <span className="badge badge--warning">
                      {activeFinding.confidence_tier ? activeFinding.confidence_tier.toUpperCase() : 'MEDIUM'} CONFIDENCE
                    </span>
                  </div>
                </div>

                <p className="af-lead-summary">{activeFinding.summary}</p>
              </div>

              {/* Grounded Observations */}
              {activeFinding.grounded_observations && (
                <div className="af-section-card">
                  <div className="af-card-header">
                    <CheckCircle2 size={16} /> Grounded Forensic Observations
                  </div>
                  <div className="af-card-body">
                    {Array.isArray(activeFinding.grounded_observations) ? (
                      <ul>
                        {activeFinding.grounded_observations.map((obs, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>{obs}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{activeFinding.grounded_observations}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hypotheses */}
              {activeFinding.hypotheses && (
                <div className="af-section-card">
                  <div className="af-card-header">
                    <Brain size={16} /> Investigated Hypotheses &amp; Potential Sequences
                  </div>
                  <div className="af-card-body">
                    {Array.isArray(activeFinding.hypotheses) ? (
                      activeFinding.hypotheses.map((h, i) => (
                        <div key={i} className="af-hyp-box">
                          <strong>Hypothesis {i + 1}:</strong> {typeof h === 'string' ? h : h.description || JSON.stringify(h)}
                        </div>
                      ))
                    ) : (
                      <p>{activeFinding.hypotheses}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Alternative Explanations */}
              {activeFinding.alternative_explanations && (
                <div className="af-section-card">
                  <div className="af-card-header">
                    <HelpCircle size={16} /> Alternative Non-Malicious Explanations
                  </div>
                  <div className="af-card-body">
                    {Array.isArray(activeFinding.alternative_explanations) ? (
                      activeFinding.alternative_explanations.map((alt, i) => (
                        <div key={i} className="af-alt-box">
                          <p>{typeof alt === 'string' ? alt : alt.description || JSON.stringify(alt)}</p>
                        </div>
                      ))
                    ) : (
                      <p>{activeFinding.alternative_explanations}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended Verification Steps */}
              {activeFinding.recommended_verification && (
                <div className="af-section-card">
                  <div className="af-card-header">
                    <ShieldCheck size={16} /> Recommended Investigator Verification Actions
                  </div>
                  <div className="af-card-body">
                    {Array.isArray(activeFinding.recommended_verification) ? (
                      <ul>
                        {activeFinding.recommended_verification.map((v, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{activeFinding.recommended_verification}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Limitations & Uncertainty */}
              <div className="af-section-card af-section-card--notice">
                <div className="af-card-header">
                  <Info size={16} /> Limitations &amp; Evidence Grounding Notice
                </div>
                <div className="af-card-body">
                  <p>
                    {activeFinding.limitations ||
                      'AI findings are assistive reasoning observations derived deterministically from uploaded digital evidence. They do not constitute legal proof or automated declarations of culpability.'}
                  </p>
                </div>
              </div>

              {/* Human-in-the-Loop Review Box */}
              <div className="af-review-box">
                <h3>Investigator Governance Decision</h3>
                <p>Record your official assessment on this AI-assisted finding:</p>

                <div className="af-review-actions">
                  <button
                    className={`af-rev-btn ${reviewStatus === 'accepted_as_lead' ? 'af-rev-btn--accepted' : ''}`}
                    onClick={() => handleSaveReview('accepted_as_lead')}
                    disabled={savingReview}
                  >
                    <ThumbsUp size={14} /> Accept as Valid Lead
                  </button>
                  <button
                    className={`af-rev-btn ${reviewStatus === 'needs_more_analysis' ? 'af-rev-btn--more' : ''}`}
                    onClick={() => handleSaveReview('needs_more_analysis')}
                    disabled={savingReview}
                  >
                    <RefreshCw size={14} /> Request More Analysis
                  </button>
                  <button
                    className={`af-rev-btn ${reviewStatus === 'rejected' ? 'af-rev-btn--rejected' : ''}`}
                    onClick={() => handleSaveReview('rejected')}
                    disabled={savingReview}
                  >
                    <ThumbsDown size={14} /> Reject Finding
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Investigator Notes</label>
                  <textarea
                    rows={2}
                    className="af-notes-input"
                    placeholder="Enter formal investigator rationale or validation remarks..."
                    value={investigatorNote}
                    onChange={e => setInvestigatorNote(e.target.value)}
                  />
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}

function intPct(val) {
  if (!val) return 0
  return Math.min(100, Math.max(0, Math.round(val <= 1 ? val * 100 : val)))
}
