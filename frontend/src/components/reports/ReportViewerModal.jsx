import { useState, useEffect } from 'react'
import {
  X,
  Printer,
  Download,
  FileText,
  Shield,
  Layers,
  Code,
  HardDrive,
  Brain,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { api } from '../../services/api'
import '../../pages/Investigations.css'

export default function ReportViewerModal({
  isOpen,
  report,
  onClose,
  onPrint,
  onDownload,
}) {
  const [activeTab, setActiveTab] = useState('document')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !report) {
      setDetail(null)
      return
    }

    // If report already has report_data, use it; otherwise fetch full detail
    if (report.report_data) {
      setDetail(report)
      return
    }

    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const id = report.report_id || report.id
        const res = await api.reports.get(id)
        setDetail(res)
      } catch (err) {
        setError(err.message || 'Failed to load report detail.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [isOpen, report])

  if (!isOpen || !report) return null

  const displayReport = detail || report
  const reportData = displayReport.report_data || {}
  const caseSummary = reportData.case_summary || {}
  const evidenceInv = reportData.evidence_inventory || []
  const integrityStatus = reportData.evidence_integrity_status || []
  const timeline = reportData.investigation_timeline || []
  const findings = reportData.ai_assisted_findings || []
  const alternatives = reportData.alternative_explanations || []
  const verifications = reportData.recommended_verification || []
  const limitations = reportData.limitations || []

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadClick = (format) => {
    if (onDownload) {
      onDownload(displayReport, format)
    }
  }

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint(displayReport)
    } else {
      window.print()
    }
  }

  return (
    <div className="inv-modal-overlay rpt-viewer-overlay" onClick={onClose}>
      <div
        className="inv-modal rpt-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="rpt-viewer-header">
          <div className="rpt-viewer-header-left">
            <div className="rpt-viewer-badge-row">
              <span className="rpt-classification-pill">OFFICIAL FORENSIC DOSSIER</span>
              <span className="badge badge--info">{displayReport.report_format?.toUpperCase() || 'HTML'}</span>
              <span className="rpt-status-pill rpt-status-completed">
                <CheckCircle2 size={12} /> {displayReport.status || 'Completed'}
              </span>
            </div>
            <h2 className="rpt-viewer-title">{displayReport.title}</h2>
            <div className="rpt-viewer-submeta">
              <span>Report ID: <strong>{displayReport.report_id || `#${displayReport.id}`}</strong></span>
              <span>Case Reference: <strong>CASE #{displayReport.case_id}</strong></span>
              <span>Author: <strong>{displayReport.author_name || 'System / AI Synthesizer'}</strong></span>
              <span>Created: <strong>{displayReport.created_at ? new Date(displayReport.created_at).toLocaleString() : '—'}</strong></span>
            </div>
          </div>

          <div className="rpt-viewer-header-right">
            {/* Quick Actions */}
            <button
              type="button"
              className="rpt-btn rpt-btn--primary"
              onClick={() => handleDownloadClick('pdf')}
              title="Download compiled official PDF dossier"
            >
              <FileText size={14} /> Export PDF
            </button>

            <button
              type="button"
              className="rpt-btn rpt-btn--ghost"
              onClick={handlePrintClick}
              title="Print formatted report"
            >
              <Printer size={14} /> Print
            </button>

            <div className="rpt-download-group">
              <button
                type="button"
                className="rpt-btn rpt-btn--ghost"
                onClick={() => handleDownloadClick(displayReport.report_format || 'html')}
                title="Download report file"
              >
                <Download size={14} /> Download ({displayReport.report_format?.toUpperCase() || 'HTML'})
              </button>
            </div>

            <button type="button" className="inv-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="rpt-viewer-tabs-bar">
          <button
            type="button"
            className={`rpt-viewer-tab ${activeTab === 'document' ? 'rpt-viewer-tab--active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            <FileText size={14} /> Formatted Document
          </button>
          <button
            type="button"
            className={`rpt-viewer-tab ${activeTab === 'sections' ? 'rpt-viewer-tab--active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            <Layers size={14} /> Structured Sections ({findings.length} Findings)
          </button>
          <button
            type="button"
            className={`rpt-viewer-tab ${activeTab === 'json' ? 'rpt-viewer-tab--active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            <Code size={14} /> Raw JSON Payload
          </button>
        </div>

        {/* Content Body */}
        <div className="rpt-viewer-body">
          {loading ? (
            <div className="rpt-items-loading" style={{ padding: '60px 0' }}>
              <Loader2 size={24} className="state-spinner" />
              <span>Retrieving forensic report from database...</span>
            </div>
          ) : error ? (
            <div className="rpt-modal-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          ) : activeTab === 'document' ? (
            <div className="rpt-iframe-wrap">
              {displayReport.html_content ? (
                <iframe
                  title="Report Document"
                  srcDoc={displayReport.html_content}
                  className="rpt-rendered-iframe"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="rpt-no-html-fallback">
                  <p>Standalone HTML preview is not available for this report format ({displayReport.report_format}).</p>
                  <button
                    type="button"
                    className="rpt-btn rpt-btn--primary"
                    onClick={() => setActiveTab('sections')}
                  >
                    View Structured Sections
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'sections' ? (
            <div className="rpt-sections-container">
              {/* Mandatory Disclaimer Alert */}
              <div className="rpt-disclaimer-banner-lg">
                <AlertTriangle size={18} />
                <span>{displayReport.disclaimer || 'AI-Assisted Draft — Requires Human Investigator Review'}</span>
              </div>

              {/* 1. Case Summary */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">1. Case Summary</h3>
                <div className="rpt-sec-card">
                  <div className="rpt-meta-grid">
                    <div><b>Case Number:</b> {caseSummary.case_number || `CASE-${displayReport.case_id}`}</div>
                    <div><b>Title:</b> {caseSummary.title || '—'}</div>
                    <div><b>Priority:</b> <span className="badge">{caseSummary.priority || 'standard'}</span></div>
                    <div><b>Status:</b> <span className="badge">{caseSummary.status || 'active'}</span></div>
                  </div>
                  <p className="rpt-summary-desc">{caseSummary.description || 'No description recorded.'}</p>
                </div>
              </section>

              {/* 2. Evidence Inventory */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">
                  <HardDrive size={16} /> 2. Evidence Inventory ({evidenceInv.length} Artifacts)
                </h3>
                <div className="rpt-table-responsive">
                  <table className="rpt-data-table">
                    <thead>
                      <tr>
                        <th>Evidence ID</th>
                        <th>Evidence #</th>
                        <th>Filename</th>
                        <th>Format</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceInv.length > 0 ? (
                        evidenceInv.map((ev, i) => (
                          <tr key={i}>
                            <td>{ev.id}</td>
                            <td><strong>{ev.evidence_number}</strong></td>
                            <td>{ev.original_filename}</td>
                            <td>{ev.mime_type}</td>
                            <td><span className="rpt-status-pill rpt-status-completed">{ev.processing_status}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5}>No evidence items recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. Evidence Integrity Status */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">
                  <Shield size={16} /> 3. Evidence Cryptographic Integrity
                </h3>
                <div className="rpt-table-responsive">
                  <table className="rpt-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Original Filename</th>
                        <th>SHA-256 Hash</th>
                        <th>Integrity</th>
                        <th>Last Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrityStatus.length > 0 ? (
                        integrityStatus.map((it, i) => (
                          <tr key={i}>
                            <td>{it.evidence_id}</td>
                            <td>{it.original_filename}</td>
                            <td><code className="rpt-hash-code">{it.sha256_hash}</code></td>
                            <td><span className={`rpt-status-pill rpt-status-${it.integrity_status}`}>{it.integrity_status}</span></td>
                            <td>{it.last_verified_at ? new Date(it.last_verified_at).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5}>No cryptographic verification records.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Investigation Timeline */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">
                  <Clock size={16} /> 4. Investigation Timeline ({timeline.length} Events)
                </h3>
                <div className="rpt-table-responsive">
                  <table className="rpt-data-table">
                    <thead>
                      <tr>
                        <th>Timestamp (UTC)</th>
                        <th>Event Type</th>
                        <th>Source</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.length > 0 ? (
                        timeline.slice(0, 20).map((t, i) => (
                          <tr key={i}>
                            <td><code className="rpt-time-code">{t.timestamp || t.timestamp_utc || '—'}</code></td>
                            <td><strong>{t.event_type}</strong></td>
                            <td>{t.source}</td>
                            <td>{t.details}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4}>No timeline events logged.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 7. AI-Assisted Findings */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">
                  <Brain size={16} /> 7. AI-Assisted Findings ({findings.length})
                </h3>
                <div className="rpt-findings-grid">
                  {findings.length > 0 ? (
                    findings.map((f, i) => (
                      <div key={i} className="rpt-finding-card">
                        <div className="rpt-finding-top">
                          <span className="rpt-finding-id">{f.finding_id}</span>
                          <span className="badge badge--info">{f.category || 'correlation'}</span>
                          <span className="rpt-finding-confidence">
                            {Math.round((f.confidence || 0.85) * 100)}% Confidence
                          </span>
                        </div>
                        <h4 className="rpt-finding-title">{f.title}</h4>
                        <p className="rpt-finding-desc">{f.description}</p>
                        <div className="rpt-finding-footer">
                          <span>Referenced Evidence: <strong>{Array.isArray(f.referenced_evidence_ids) ? f.referenced_evidence_ids.join(', ') : 'None'}</strong></span>
                          <span>Review: <strong className="rpt-status-verified">{f.review_status || 'Pending'}</strong></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No findings recorded.</p>
                  )}
                </div>
              </section>

              {/* 9 & 10. Alternative Explanations & Verification */}
              <div className="rpt-two-col-grid">
                <section className="rpt-sec-block">
                  <h3 className="rpt-sec-title">9. Alternative Explanations</h3>
                  <ul className="rpt-list-disc">
                    {alternatives.length > 0 ? (
                      alternatives.map((alt, i) => <li key={i}>{alt}</li>)
                    ) : (
                      <li>No alternative hypotheses generated.</li>
                    )}
                  </ul>
                </section>

                <section className="rpt-sec-block">
                  <h3 className="rpt-sec-title">10. Recommended Verification Steps</h3>
                  <ul className="rpt-list-disc">
                    {verifications.length > 0 ? (
                      verifications.map((v, i) => <li key={i}>{v}</li>)
                    ) : (
                      <li>No manual verification items recommended.</li>
                    )}
                  </ul>
                </section>
              </div>

              {/* 12. Limitations */}
              <section className="rpt-sec-block">
                <h3 className="rpt-sec-title">12. Limitations &amp; Uncertainty Declarations</h3>
                <ul className="rpt-list-disc">
                  {limitations.length > 0 ? (
                    limitations.map((lim, i) => <li key={i}>{lim}</li>)
                  ) : (
                    <li>AI findings represent probabilistic decision support and require human verification.</li>
                  )}
                </ul>
              </section>
            </div>
          ) : (
            <div className="rpt-json-container">
              <div className="rpt-json-toolbar">
                <span>Structured 12-section JSON artifact</span>
                <button type="button" className="rpt-btn rpt-btn--ghost" onClick={handleCopyJson}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="rpt-json-code">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
