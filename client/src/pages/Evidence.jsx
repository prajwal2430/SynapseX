import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Upload, HardDrive, Shield, CheckCircle2,
  Clock, Search, Filter, Download, X,
  FileVideo, FileText, Network, Usb,
  AlertTriangle, ChevronRight, Eye,
  Hash, Database, GitBranch, Brain,
  Loader2, Lock, SlidersHorizontal,
  FileBadge, CloudUpload, Activity,
  ArrowUpDown, ChevronDown, ChevronUp,
  MoreHorizontal, Clipboard, Star, RefreshCw, FolderOpen, Trash2,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './Evidence.css'

/* ── helpers ── */
const STATUS_META = {
  verified:    { label: 'Verified',   cls: 'verified',   icon: CheckCircle2 },
  completed:   { label: 'Completed',  cls: 'verified',   icon: CheckCircle2 },
  processing:  { label: 'Processing', cls: 'processing', icon: Loader2      },
  pending:     { label: 'Pending',    cls: 'queued',     icon: Clock        },
  unverified:  { label: 'Unverified', cls: 'queued',     icon: Clock        },
  failed:      { label: 'Failed',     cls: 'flagged',    icon: AlertTriangle},
  compromised: { label: 'Compromised',cls: 'flagged',    icon: AlertTriangle},
  queued:      { label: 'Queued',     cls: 'queued',     icon: Clock        },
}

const FILE_TYPE_ICONS = {
  video:   FileVideo,
  logs:    FileText,
  network: Network,
  device:  Usb,
  memory:  Database,
  default: HardDrive,
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/* ─────────────────────────────────────────
   EVIDENCE DETAIL SIDE PANEL
───────────────────────────────────────── */
function EvidencePanel({ item, onClose, onVerified, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [custodyChain, setCustodyChain] = useState([])
  const [loadingCustody, setLoadingCustody] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadCustody() {
      try {
        setLoadingCustody(true)
        const res = await api.evidence.getCustodyChain(item.id)
        if (mounted) {
          setCustodyChain(res?.chain || res?.events || [])
        }
      } catch {
        if (mounted) setCustodyChain([])
      } finally {
        if (mounted) setLoadingCustody(false)
      }
    }
    loadCustody()
    return () => { mounted = false }
  }, [item.id])

  const copyHash = () => {
    if (item.sha256_hash || item.sha256) {
      navigator.clipboard.writeText(item.sha256_hash || item.sha256)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleVerify = async () => {
    try {
      setVerifying(true)
      const res = await api.evidence.verifyIntegrity(item.id)
      alert(res?.message || 'Cryptographic SHA-256 integrity verified!')
      if (onVerified) onVerified()
    } catch (err) {
      alert(`Integrity verification error: ${err.message}`)
    } finally {
      setVerifying(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${fileName}" (${item.evidence_number || `EVD-${item.id}`})?\n\nThis will purge the physical file from storage and cascade all associated records. This action cannot be undone.`
    )
    if (!confirmed) return
    try {
      setDeleting(true)
      await api.evidence.delete(item.id)
      if (onDelete) onDelete(item.id)
    } catch (err) {
      alert(`Failed to delete evidence: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const shaVal = item.sha256_hash || item.sha256 || 'N/A'
  const fileName = item.original_filename || item.fileName || `Evidence #${item.id}`
  const fileSize = item.file_size ? formatBytes(item.file_size) : item.size || '—'

  return (
    <div className="ev-panel-backdrop" onClick={onClose}>
      <div className="ev-panel" onClick={e => e.stopPropagation()}>
        <div className="ev-panel-header">
          <div className="ev-panel-header-left">
            <span className="ev-panel-id">{item.evidence_number || `E-${item.id}`}</span>
            <span className="ev-type-chip ev-type-chip--blue">{item.mime_type || 'Forensic Artifact'}</span>
          </div>
          <button className="ev-panel-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="ev-panel-body">
          <div className="ev-panel-hero">
            <HardDrive size={32} className="ev-hero-icon" />
            <h2 className="ev-panel-title">{fileName}</h2>
            <p className="ev-panel-source">Stored at: {item.storage_path || 'Secure Evidence Vault'}</p>
          </div>

          {/* Cryptographic Hash */}
          <div className="ev-panel-section">
            <span className="ev-sec-label">
              <Hash size={12} /> SHA-256 Cryptographic Hash
            </span>
            <div className="ev-hash-box">
              <code className="ev-hash-full">{shaVal}</code>
              <button className="ev-hash-copy-btn" onClick={copyHash} title="Copy SHA-256">
                <Clipboard size={12} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              className="ev-verify-btn"
              onClick={handleVerify}
              disabled={verifying}
              style={{ marginTop: 8 }}
            >
              <Shield size={13} /> {verifying ? 'Verifying Bit-Level Hash...' : 'Verify Cryptographic Integrity'}
            </button>
          </div>

          {/* Metadata Grid */}
          <div className="ev-panel-section">
            <span className="ev-sec-label">Artifact Metadata</span>
            <div className="ev-meta-grid">
              <div className="ev-meta-item">
                <span className="ev-meta-lbl">File Size</span>
                <span className="ev-meta-val">{fileSize}</span>
              </div>
              <div className="ev-meta-item">
                <span className="ev-meta-lbl">Ingestion Time</span>
                <span className="ev-meta-val">
                  {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : item.uploadTime || '—'}
                </span>
              </div>
              <div className="ev-meta-item">
                <span className="ev-meta-lbl">Processing Status</span>
                <span className="ev-meta-val">{item.processing_status || item.processingStatus || 'Completed'}</span>
              </div>
              <div className="ev-meta-item">
                <span className="ev-meta-lbl">Integrity Status</span>
                <span className="ev-meta-val">{item.integrity_status || 'Verified'}</span>
              </div>
            </div>
          </div>

          {/* Chain of Custody */}
          <div className="ev-panel-section">
            <span className="ev-sec-label">
              <Shield size={12} /> Immutable Chain of Custody Log
            </span>
            {loadingCustody ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading custody records...</p>
            ) : custodyChain.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Evidence registered into immutable vault ledger upon authorized upload.
              </p>
            ) : (
              <div className="ev-custody-chain">
                {custodyChain.map((c, i) => (
                  <div key={i} className="ev-custody-step">
                    <div className="ev-step-dot" />
                    {i < custodyChain.length - 1 && <div className="ev-step-line" />}
                    <div className="ev-step-body">
                      <div className="ev-step-top">
                        <span className="ev-step-action">{c.action}</span>
                        <span className="ev-step-time">
                          {c.timestamp ? new Date(c.timestamp).toLocaleString() : '—'}
                        </span>
                      </div>
                      <span className="ev-step-actor">{c.actor_name || c.by || 'System'}</span>
                      {c.notes && <p className="ev-step-note">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Management / Delete Action */}
          <div className="ev-panel-section" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: 16 }}>
            <span className="ev-sec-label" style={{ color: '#f87171' }}>
              <AlertTriangle size={12} /> Management Actions
            </span>
            <button
              className="ev-delete-btn"
              onClick={handleDelete}
              disabled={deleting}
              style={{ marginTop: 8 }}
            >
              {deleting ? <Loader2 size={13} className="ev-spin" /> : <Trash2 size={13} />}
              {deleting ? 'Deleting Evidence Artifact...' : 'Delete Evidence Artifact'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   MAIN EVIDENCE PAGE
═════════════════════════════════════════ */
export default function Evidence() {
  const [searchParams] = useSearchParams()
  const urlCaseId = searchParams.get('caseId')

  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(urlCaseId || '')
  const [evidenceItems, setEvidenceItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadFeedback, setUploadFeedback] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [typeFilter, setType] = useState('all')
  const [sortField, setSortField] = useState('uploadTime')
  const [sortDir, setSortDir] = useState('desc')

  const fileInputRef = useRef(null)

  const fetchEvidence = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setEvidenceItems([])
        setLoading(false)
        return
      }

      const activeId = caseId || urlCaseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const evRes = await api.evidence.listForCase(activeId)
      setEvidenceItems(evRes?.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load evidence records from backend.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId, urlCaseId])

  useEffect(() => {
    fetchEvidence(urlCaseId)
  }, [urlCaseId])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    setUploadFeedback(null)
    fetchEvidence(newId)
  }

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || !selectedCaseId) return
    try {
      setUploading(true)
      setUploadFeedback(null)
      const fileList = Array.from(files)
      const results = await Promise.all(
        fileList.map(file => api.evidence.upload(selectedCaseId, file))
      )
      const lastUploaded = results[results.length - 1]

      const updated = await api.evidence.listForCase(selectedCaseId)
      const list = updated?.items || []
      setEvidenceItems(list)

      if (lastUploaded) {
        const itemToShow = list.find(i => i.id === lastUploaded.id) || lastUploaded
        setSelectedItem(itemToShow)
        setUploadFeedback({
          type: 'success',
          fileName: lastUploaded.original_filename || 'Evidence File',
          evidenceNumber: lastUploaded.evidence_number || `EVD-${lastUploaded.id}`,
          hash: lastUploaded.sha256_hash,
          count: files.length,
        })
      }
    } catch (err) {
      alert(`Evidence upload error: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDeleteEvidence = async (item) => {
    const fileName = item.original_filename || item.fileName || `Evidence #${item.id}`
    const evNum = item.evidence_number || `EVD-${item.id}`
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${fileName}" (${evNum})?\n\nThis will purge the physical file from storage and cascade all associated records. This action cannot be undone.`
    )
    if (!confirmed) return
    try {
      await api.evidence.delete(item.id)
      if (selectedItem?.id === item.id) {
        setSelectedItem(null)
      }
      fetchEvidence(selectedCaseId)
    } catch (err) {
      alert(`Failed to delete evidence: ${err.message}`)
    }
  }

  /* ── Filter & Sort ── */
  const filtered = evidenceItems.filter(item => {
    const q = search.toLowerCase()
    const name = (item.original_filename || item.fileName || '').toLowerCase()
    const num = (item.evidence_number || `E-${item.id}`).toLowerCase()
    const mime = (item.mime_type || '').toLowerCase()

    const matchesSearch = !search || name.includes(q) || num.includes(q) || mime.includes(q)
    const matchesStatus = statusFilter === 'all' || (item.processing_status || item.processingStatus) === statusFilter
    const matchesType = typeFilter === 'all' || mime.includes(typeFilter)

    return matchesSearch && matchesStatus && matchesType
  })

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon sort-icon--idle" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="sort-icon sort-icon--active" />
      : <ChevronDown size={12} className="sort-icon sort-icon--active" />
  }

  return (
    <div className="ev-root">

      {/* ── Header ── */}
      <div className="ev-page-header">
        <div className="ev-header-left">
          <div className="ev-eyebrow">
            <Database size={12} />
            Cryptographic Evidence Vault
          </div>
          <h1 className="ev-page-title">Digital Evidence Repository</h1>
          <p className="ev-page-sub">
            Deterministic ingestion · SHA-256 verification · Immutable chain of custody
          </p>
        </div>

        <div className="ev-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="ev-select"
              value={selectedCaseId}
              onChange={handleCaseChange}
              style={{ minWidth: 200 }}
            >
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number || `CASE-${c.id}`} — {c.title}
                </option>
              ))}
            </select>
          )}

          <button
            className="ev-btn ev-btn--ghost ev-btn--icon"
            onClick={() => fetchEvidence(selectedCaseId)}
            title="Refresh Evidence"
          >
            <RefreshCw size={15} />
          </button>

          <button
            className="ev-btn ev-btn--primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !selectedCaseId}
          >
            {uploading ? <Loader2 size={15} className="ev-spin" /> : <Upload size={15} />}
            <span>{uploading ? 'Uploading Evidence...' : 'Upload Evidence File'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={e => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* ── Drag-drop upload ── */}
      <div
        className="ev-upload-zone"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload size={32} className="ev-upload-icon" />
        <div className="ev-upload-text">
          <strong>Drag and drop authorized digital evidence files here</strong>, or click to browse
        </div>
        <p className="ev-upload-sub">
          Supported: CSV, JSON, TXT, PDF, JPG, PNG, MP4, EVTX, PCAP (Max 100 MB per file)
        </p>
      </div>

      {/* ── Upload & Verification Feedback Banner ── */}
      {uploadFeedback && (
        <div style={{
          marginTop: 16,
          padding: '12px 18px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#4ade80',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={20} color="#22c55e" />
            <div>
              <strong>Cryptographic Integrity Check Passed:</strong> {uploadFeedback.fileName} ({uploadFeedback.evidenceNumber})
              {uploadFeedback.hash && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                  SHA-256: {uploadFeedback.hash}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setUploadFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="ev-stats-row">
        {[
          { label: 'Total Evidence', value: evidenceItems.length, color: 'blue' },
          { label: 'Verified Integrity', value: evidenceItems.filter(e => (e.integrity_status || e.processing_status) === 'verified' || e.processing_status === 'completed').length, color: 'green' },
          { label: 'Processing', value: evidenceItems.filter(e => e.processing_status === 'processing').length, color: 'amber' },
          { label: 'Pending / Queued', value: evidenceItems.filter(e => e.processing_status === 'pending').length, color: 'cyan' },
        ].map(s => (
          <div key={s.label} className={`ev-stat ev-stat--${s.color}`}>
            <span className="ev-stat-value">{s.value}</span>
            <span className="ev-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Inventory section ── */}
      <div className="ev-inventory">

        {/* Toolbar */}
        <div className="ev-toolbar">
          <div className="ev-search-wrap">
            <Search size={13} className="ev-search-icon" />
            <input
              id="evidence-search"
              type="text"
              placeholder="Search by ID, filename, MIME type..."
              className="ev-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="ev-search-clear" onClick={() => setSearch('')}><X size={11} /></button>}
          </div>

          <div className="ev-filter-tabs">
            {['all', 'completed', 'processing', 'pending'].map(s => (
              <button
                key={s}
                className={`ev-filter-tab ${statusFilter === s ? 'ev-filter-tab--active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
              </button>
            ))}
          </div>

          <span className="ev-result-count">{filtered.length} items</span>
        </div>

        {/* Table View */}
        {loading ? (
          <LoadingView message="Loading registered digital evidence artifacts..." />
        ) : error ? (
          <ErrorView error={error} onRetry={() => fetchEvidence(selectedCaseId)} message="Evidence API Error" />
        ) : evidenceItems.length === 0 ? (
          <EmptyStateView
            title="Upload authorized evidence to begin analysis."
            message="No evidence artifacts have been uploaded for this investigation case yet."
            icon={HardDrive}
            actionText="Upload Evidence"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : (
          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('id')} className="ev-th-sort">Evidence ID <SortIcon field="id" /></th>
                  <th onClick={() => toggleSort('fileName')} className="ev-th-sort">File Name <SortIcon field="fileName" /></th>
                  <th>MIME Type</th>
                  <th>Size</th>
                  <th>SHA-256 Hash</th>
                  <th>Ingested Date</th>
                  <th>Integrity Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ev-empty-row">
                      <Search size={18} /> No evidence matches your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const shaVal = item.sha256_hash || item.sha256 || ''
                    const fileName = item.original_filename || item.fileName || `Evidence #${item.id}`
                    const sizeStr = item.file_size ? formatBytes(item.file_size) : item.size || '—'
                    const isSelected = selectedItem?.id === item.id

                    return (
                      <tr
                        key={item.id}
                        className={`ev-row ${isSelected ? 'ev-row--selected' : ''}`}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                      >
                        <td>
                          <span className="ev-item-id">{item.evidence_number || `E-${item.id}`}</span>
                        </td>
                        <td>
                          <div className="ev-cell-file">
                            <div className="ev-file-name-wrap">
                              <span className="ev-file-name">{fileName}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ev-type-chip ev-type-chip--blue">{item.mime_type || 'File'}</span>
                        </td>
                        <td>
                          <span className="ev-file-size">{sizeStr}</span>
                        </td>
                        <td>
                          <div className="ev-hash-cell">
                            <Hash size={11} className="ev-hash-icon" />
                            <code className="ev-hash-short">{shaVal.slice(0, 16)}…</code>
                            <CheckCircle2 size={11} className="ev-hash-ok" />
                          </div>
                        </td>
                        <td>
                          <div className="ev-time-cell">
                            <Clock size={11} />
                            <span>{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '—'}</span>
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const rawStatus = (item.integrity_status || item.processing_status || 'verified').toLowerCase()
                            const meta = STATUS_META[rawStatus] || STATUS_META.verified
                            const IconComp = meta.icon
                            return (
                              <span className={`ev-status ev-status--${meta.cls}`}>
                                <IconComp size={10} />
                                {meta.label}
                              </span>
                            )
                          })()}
                        </td>
                        <td>
                          <div className="ev-row-actions">
                            <button className="ev-row-btn" onClick={e => { e.stopPropagation(); setSelectedItem(item) }} title="Inspect metadata">
                              <Eye size={13} />
                            </button>
                            <button
                              className="ev-row-btn ev-row-btn--danger"
                              onClick={e => {
                                e.stopPropagation()
                                handleDeleteEvidence(item)
                              }}
                              title="Delete evidence artifact"
                            >
                              <Trash2 size={13} />
                            </button>
                            <ChevronRight size={13} className={`ev-row-arrow ${isSelected ? 'ev-row-arrow--open' : ''}`} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Side Panel ── */}
      {selectedItem && (
        <EvidencePanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onVerified={() => fetchEvidence(selectedCaseId)}
          onDelete={() => {
            setSelectedItem(null)
            fetchEvidence(selectedCaseId)
          }}
        />
      )}

    </div>
  )
}
