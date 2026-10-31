import { useState, useEffect } from 'react'
import {
  X,
  FileText,
  CheckSquare,
  Square,
  Shield,
  Loader2,
  AlertTriangle,
  HardDrive,
  Brain,
} from 'lucide-react'
import { api } from '../../services/api'
import '../../pages/Investigations.css'

export default function GenerateReportModal({
  isOpen,
  onClose,
  casesList = [],
  initialCaseId = '',
  onReportGenerated,
}) {
  const [caseId, setCaseId] = useState(initialCaseId)
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState('html')

  const [evidenceList, setEvidenceList] = useState([])
  const [findingsList, setFindingsList] = useState([])
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([])
  const [selectedFindingIds, setSelectedFindingIds] = useState([])

  const [loadingItems, setLoadingItems] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Sync initial case ID and default title
  useEffect(() => {
    if (isOpen) {
      const activeId = initialCaseId || casesList[0]?.id || ''
      setCaseId(activeId)
      setError(null)

      const activeCase = casesList.find((c) => String(c.id) === String(activeId))
      const caseName = activeCase ? `${activeCase.case_number || `CASE-${activeCase.id}`} — ${activeCase.title}` : 'Investigation'
      setTitle(`Forensic Dossier: ${caseName}`)
    }
  }, [isOpen, initialCaseId, casesList])

  // Load evidence and findings whenever selected case changes
  useEffect(() => {
    if (!isOpen || !caseId) return

    let isMounted = true
    const loadCaseItems = async () => {
      try {
        setLoadingItems(true)
        const [evRes, fndRes] = await Promise.allSettled([
          api.evidence.listForCase(caseId),
          api.findings.listForCase(caseId),
        ])

        if (!isMounted) return

        const evItems = evRes.status === 'fulfilled' ? evRes.value?.items || evRes.value || [] : []
        const fndItems = fndRes.status === 'fulfilled' ? fndRes.value?.items || fndRes.value || [] : []

        setEvidenceList(evItems)
        setFindingsList(fndItems)

        // Select all by default
        setSelectedEvidenceIds(evItems.map((e) => e.id))
        setSelectedFindingIds(fndItems.map((f) => f.finding_id || f.id))
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load case artifacts')
      } finally {
        if (isMounted) setLoadingItems(false)
      }
    }

    loadCaseItems()
    return () => {
      isMounted = false
    }
  }, [isOpen, caseId])

  if (!isOpen) return null

  const handleCaseChange = (newId) => {
    setCaseId(newId)
    const activeCase = casesList.find((c) => String(c.id) === String(newId))
    const caseName = activeCase ? `${activeCase.case_number || `CASE-${activeCase.id}`} — ${activeCase.title}` : 'Investigation'
    setTitle(`Forensic Dossier: ${caseName}`)
  }

  const toggleEvidence = (id) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleFinding = (id) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleAllEvidence = () => {
    if (selectedEvidenceIds.length === evidenceList.length) {
      setSelectedEvidenceIds([])
    } else {
      setSelectedEvidenceIds(evidenceList.map((e) => e.id))
    }
  }

  const toggleAllFindings = () => {
    if (selectedFindingIds.length === findingsList.length) {
      setSelectedFindingIds([])
    } else {
      setSelectedFindingIds(findingsList.map((f) => f.finding_id || f.id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!caseId) {
      setError('Please select an active investigation case.')
      return
    }

    try {
      setGenerating(true)
      setError(null)

      const payload = {
        title: title.trim() || `Investigation Report — Case #${caseId}`,
        report_format: format,
        evidence_ids: selectedEvidenceIds.length > 0 ? selectedEvidenceIds : undefined,
        finding_ids: selectedFindingIds.length > 0 ? selectedFindingIds : undefined,
      }

      const report = await api.reports.create(caseId, payload)
      if (onReportGenerated) {
        onReportGenerated(report)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Report compilation failed.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal rpt-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="inv-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="rpt-modal-icon-badge">
              <FileText size={18} />
            </div>
            <div>
              <h2>Generate Investigation Report</h2>
              <p className="rpt-modal-sub">
                Synthesize formal 12-section forensic dossier with cryptographic proof
              </p>
            </div>
          </div>
          <button className="inv-modal-close" onClick={onClose} disabled={generating}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="inv-modal-form rpt-modal-scroll-body">
          {error && (
            <div className="rpt-modal-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Case Selector */}
          <div className="inv-form-group">
            <label>Investigation Case *</label>
            <select
              value={caseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              disabled={generating}
              required
            >
              {casesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number || `CASE-${c.id}`} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Report Title */}
          <div className="inv-form-group">
            <label>Report Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operation Vanguard — Formal Digital Forensic Dossier"
              disabled={generating}
              required
            />
          </div>

          {/* 3. Output Format Selector */}
          <div className="inv-form-group">
            <label>Report Format</label>
            <div className="rpt-format-grid">
              <label
                className={`rpt-format-card ${format === 'html' ? 'rpt-format-card--active' : ''}`}
                onClick={() => setFormat('html')}
              >
                <input
                  type="radio"
                  name="report_format"
                  value="html"
                  checked={format === 'html'}
                  onChange={() => setFormat('html')}
                />
                <span className="rpt-format-name">HTML Document</span>
                <span className="rpt-format-desc">Standalone, print-ready with 12 sections</span>
              </label>

              <label
                className={`rpt-format-card ${format === 'pdf' ? 'rpt-format-card--active' : ''}`}
                onClick={() => setFormat('pdf')}
              >
                <input
                  type="radio"
                  name="report_format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
                <span className="rpt-format-name">Official PDF</span>
                <span className="rpt-format-desc">Forensic dossier with sign-off & legal header</span>
              </label>

              <label
                className={`rpt-format-card ${format === 'json' ? 'rpt-format-card--active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <input
                  type="radio"
                  name="report_format"
                  value="json"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                />
                <span className="rpt-format-name">JSON Data</span>
                <span className="rpt-format-desc">Machine-readable structured evidence payload</span>
              </label>

              <label
                className={`rpt-format-card ${format === 'markdown' ? 'rpt-format-card--active' : ''}`}
                onClick={() => setFormat('markdown')}
              >
                <input
                  type="radio"
                  name="report_format"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={() => setFormat('markdown')}
                />
                <span className="rpt-format-name">Markdown</span>
                <span className="rpt-format-desc">Portable briefing note for documentation</span>
              </label>
            </div>
          </div>

          {/* 4. Select Evidence Items */}
          <div className="inv-form-group">
            <div className="rpt-section-header-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={14} /> Include Evidence Artifacts ({selectedEvidenceIds.length}/{evidenceList.length})
              </label>
              {evidenceList.length > 0 && (
                <button
                  type="button"
                  className="rpt-btn-link"
                  onClick={toggleAllEvidence}
                  disabled={generating}
                >
                  {selectedEvidenceIds.length === evidenceList.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {loadingItems ? (
              <div className="rpt-items-loading">
                <Loader2 size={16} className="state-spinner" />
                <span>Loading case evidence artifacts...</span>
              </div>
            ) : evidenceList.length === 0 ? (
              <p className="rpt-no-items">No evidence artifacts uploaded for this case yet.</p>
            ) : (
              <div className="rpt-items-checklist">
                {evidenceList.map((ev) => {
                  const isChecked = selectedEvidenceIds.includes(ev.id)
                  return (
                    <div
                      key={ev.id}
                      className={`rpt-check-item ${isChecked ? 'rpt-check-item--selected' : ''}`}
                      onClick={() => !generating && toggleEvidence(ev.id)}
                    >
                      <button type="button" className="rpt-check-box">
                        {isChecked ? <CheckSquare size={16} className="rpt-check-icon--active" /> : <Square size={16} />}
                      </button>
                      <div className="rpt-check-info">
                        <span className="rpt-check-label">
                          <strong>{ev.evidence_number || `EVD-${ev.id}`}</strong> — {ev.original_filename}
                        </span>
                        <span className="rpt-check-meta">
                          {ev.mime_type || 'binary'} • {ev.file_size ? `${Math.round(ev.file_size / 1024)} KB` : '0 B'}
                        </span>
                      </div>
                      <span className={`rpt-status-pill rpt-status-${ev.integrity_status || 'unverified'}`}>
                        {ev.integrity_status || 'unverified'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 5. Select Findings */}
          <div className="inv-form-group">
            <div className="rpt-section-header-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} /> Include AI Reasoning Findings ({selectedFindingIds.length}/{findingsList.length})
              </label>
              {findingsList.length > 0 && (
                <button
                  type="button"
                  className="rpt-btn-link"
                  onClick={toggleAllFindings}
                  disabled={generating}
                >
                  {selectedFindingIds.length === findingsList.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {loadingItems ? (
              <div className="rpt-items-loading">
                <Loader2 size={16} className="state-spinner" />
                <span>Loading case intelligence findings...</span>
              </div>
            ) : findingsList.length === 0 ? (
              <p className="rpt-no-items">No AI findings recorded for this case yet.</p>
            ) : (
              <div className="rpt-items-checklist">
                {findingsList.map((fnd) => {
                  const fndId = fnd.finding_id || fnd.id
                  const isChecked = selectedFindingIds.includes(fndId)
                  return (
                    <div
                      key={fndId}
                      className={`rpt-check-item ${isChecked ? 'rpt-check-item--selected' : ''}`}
                      onClick={() => !generating && toggleFinding(fndId)}
                    >
                      <button type="button" className="rpt-check-box">
                        {isChecked ? <CheckSquare size={16} className="rpt-check-icon--active" /> : <Square size={16} />}
                      </button>
                      <div className="rpt-check-info">
                        <span className="rpt-check-label">
                          <strong>{fnd.finding_id || `FND-${fnd.id}`}</strong> — {fnd.title}
                        </span>
                        <span className="rpt-check-meta">
                          {fnd.category || 'correlation'} • Confidence: {Math.round((fnd.confidence_score ?? fnd.confidence ?? 0.85) * 100)}%
                        </span>
                      </div>
                      <span className={`rpt-status-pill rpt-status-${fnd.review_status || 'pending'}`}>
                        {fnd.review_status || 'pending'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="rpt-disclaimer-notice">
            <Shield size={16} className="rpt-disclaimer-icon" />
            <p>
              Generated report will include the mandatory disclosure:
              <strong> "AI-Assisted Draft — Requires Human Investigator Review"</strong>.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="inv-modal-actions">
            <button
              type="button"
              className="inv-btn inv-btn--ghost"
              onClick={onClose}
              disabled={generating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || !title.trim() || !caseId}
              className="inv-btn inv-btn--primary"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="state-spinner" />
                  Compiling Dossier...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
