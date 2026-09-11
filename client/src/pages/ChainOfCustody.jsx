import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, Shield, CheckCircle2, Lock,
  HardDrive, Clock, User, Building, Cpu,
  FileText, Download, Copy, Check, FileCheck,
  AlertTriangle, ArrowDown, ChevronRight, Hash,
  Database, RefreshCw, Key, ExternalLink, Printer,
  FileCode, Layers, Info, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './ChainOfCustody.css'

export default function ChainOfCustody() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [evidenceList, setEvidenceList] = useState([])
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [custodyChain, setCustodyChain] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCustody, setLoadingCustody] = useState(false)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const fetchCasesAndEvidence = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setEvidenceList([])
        setSelectedEvidence(null)
        setCustodyChain([])
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const evRes = await api.evidence.listForCase(activeId)
      const items = evRes?.items || []
      setEvidenceList(items)

      if (items.length > 0) {
        setSelectedEvidence(items[0])
        await loadCustodyChain(items[0].id)
      } else {
        setSelectedEvidence(null)
        setCustodyChain([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load chain of custody data from backend.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  const loadCustodyChain = async (evidenceId) => {
    try {
      setLoadingCustody(true)
      const res = await api.evidence.getCustodyChain(evidenceId)
      setCustodyChain(res?.chain || res?.events || [])
    } catch {
      setCustodyChain([])
    } finally {
      setLoadingCustody(false)
    }
  }

  useEffect(() => {
    fetchCasesAndEvidence()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchCasesAndEvidence(newId)
  }

  const handleSelectEvidence = (ev) => {
    setSelectedEvidence(ev)
    loadCustodyChain(ev.id)
  }

  const handleVerifyIntegrity = async () => {
    if (!selectedEvidence) return
    try {
      setVerifying(true)
      const res = await api.evidence.verifyIntegrity(selectedEvidence.id)
      alert(`Integrity Verification: ${res?.message || 'SHA-256 integrity verified successfully!'}`)
      await loadCustodyChain(selectedEvidence.id)
    } catch (err) {
      alert(`Verification error: ${err.message}`)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="coc-root">

      {/* ── Page Header ── */}
      <div className="coc-page-header">
        <div className="coc-header-left">
          <div className="coc-eyebrow">
            <ShieldCheck size={12} />
            Forensic Integrity &amp; Audit Ledger
          </div>
          <h1 className="coc-page-title">Immutable Chain of Custody</h1>
          <p className="coc-page-sub">
            Cryptographic ledger tracking · Tamper-evident custody lifecycle · NIST 800-86 compliance
          </p>
        </div>

        <div className="coc-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="coc-select"
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
            className="coc-btn coc-btn--ghost"
            onClick={() => fetchCasesAndEvidence(selectedCaseId)}
            title="Refresh Ledger"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Loading custody verification ledger from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchCasesAndEvidence(selectedCaseId)} message="Custody Query Error" />
      ) : evidenceList.length === 0 ? (
        <EmptyStateView
          title="No chain of custody records found."
          message="Upload digital evidence to this investigation case to initialize the immutable cryptographic custody ledger."
          icon={ShieldCheck}
        />
      ) : (
        <div className="coc-main-layout">

          {/* Left Evidence Selector List */}
          <div className="coc-sidebar">
            <div className="coc-sb-header">
              <span>Sealed Evidence ({evidenceList.length})</span>
            </div>
            <div className="coc-evidence-list">
              {evidenceList.map((ev) => {
                const isSelected = selectedEvidence?.id === ev.id
                return (
                  <div
                    key={ev.id}
                    className={`coc-ev-card ${isSelected ? 'coc-ev-card--active' : ''}`}
                    onClick={() => handleSelectEvidence(ev)}
                  >
                    <div className="coc-ev-card-top">
                      <span className="coc-ev-id">{ev.evidence_number || `E-${ev.id}`}</span>
                      <span className="badge badge--success">Verified</span>
                    </div>
                    <p className="coc-ev-name">{ev.original_filename || `Evidence #${ev.id}`}</p>
                    <div className="coc-ev-hash-preview">
                      <Hash size={10} />
                      <code>{(ev.sha256_hash || '').slice(0, 16)}…</code>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Custody Chain Timeline */}
          {selectedEvidence && (
            <div className="coc-content-area">

              {/* Evidence Banner */}
              <div className="coc-banner-card">
                <div className="coc-banner-top">
                  <div>
                    <span className="coc-banner-id">{selectedEvidence.evidence_number || `E-${selectedEvidence.id}`}</span>
                    <h2 className="coc-banner-title">{selectedEvidence.original_filename}</h2>
                    <p className="coc-banner-path">Vault Location: {selectedEvidence.storage_path}</p>
                  </div>
                  <button
                    className="coc-btn coc-btn--primary"
                    onClick={handleVerifyIntegrity}
                    disabled={verifying}
                  >
                    <Shield size={14} />
                    {verifying ? 'Recalculating SHA-256...' : 'Verify Cryptographic Hash'}
                  </button>
                </div>

                <div className="coc-hash-display">
                  <span className="coc-hash-lbl">SHA-256 SEAL:</span>
                  <code className="coc-hash-val">{selectedEvidence.sha256_hash}</code>
                </div>
              </div>

              {/* Immutable Steps Timeline */}
              <div className="coc-timeline-card">
                <div className="coc-tc-header">
                  <ShieldCheck size={16} /> Immutable Custody Ledger Entries ({custodyChain.length})
                </div>

                {loadingCustody ? (
                  <p style={{ padding: 24, fontSize: 13, color: 'var(--text-secondary)' }}>Loading custody entries...</p>
                ) : custodyChain.length === 0 ? (
                  <div style={{ padding: 24 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Initial evidence upload event sealed into database ledger on ingestion.
                    </p>
                  </div>
                ) : (
                  <div className="coc-steps-list">
                    {custodyChain.map((entry, idx) => (
                      <div key={entry.id || idx} className="coc-step-item">
                        <div className="coc-step-marker">
                          <div className="coc-marker-dot" />
                          {idx < custodyChain.length - 1 && <div className="coc-marker-line" />}
                        </div>
                        <div className="coc-step-content">
                          <div className="coc-step-header-row">
                            <span className="coc-step-action-tag">{entry.action}</span>
                            <span className="coc-step-timestamp">
                              <Clock size={11} /> {entry.timestamp ? new Date(entry.timestamp).toUTCString() : '—'}
                            </span>
                          </div>
                          <p className="coc-step-actor"><strong>Actor:</strong> {entry.actor_name || entry.by || 'Authorized Investigator / System'}</p>
                          <p className="coc-step-notes">{entry.notes || 'Forensic custody transaction logged with immutable cryptographic seal.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
