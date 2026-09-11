import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Download,
  Eye,
  Printer,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import GenerateReportModal from '../components/reports/GenerateReportModal'
import ReportViewerModal from '../components/reports/ReportViewerModal'
import './Reports.css'

export default function Reports() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [reportsList, setReportsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [viewerReport, setViewerReport] = useState(null)
  const [deletingReport, setDeletingReport] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Feedback notifications
  const [feedback, setFeedback] = useState(null)

  // Fetch cases and reports
  const fetchReports = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setReportsList([])
        setLoading(false)
        return
      }

      const activeId = caseId !== undefined ? caseId : (selectedCaseId || cases[0].id)
      setSelectedCaseId(activeId)

      let items = []
      if (activeId) {
        const res = await api.reports.listForCase(activeId)
        items = res?.items || res || []
      } else {
        const res = await api.reports.listAll()
        items = res?.items || res || []
      }
      setReportsList(items)
    } catch (err) {
      setError(err.message || 'Failed to load forensic reports from database.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchReports()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchReports(newId)
  }

  const showNotification = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => {
      setFeedback(null)
    }, 4000)
  }

  // Handle report generation callback
  const handleReportGenerated = (newReport) => {
    showNotification(`Report #${newReport.report_id || newReport.id} generated successfully!`)
    fetchReports(selectedCaseId)
    setViewerReport(newReport)
  }

  // Handle Download (uses real backend download API)
  const handleDownload = async (report, requestedFormat) => {
    const format = requestedFormat || report.report_format || 'html'
    try {
      showNotification(`Downloading report ${report.report_id || report.id}...`, 'info')
      const blob = await api.reports.download(report.report_id || report.id, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'markdown' ? 'md' : format
      a.download = `report-${report.report_id || report.id}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showNotification(`Report downloaded (${format.toUpperCase()}).`, 'success')
    } catch (err) {
      showNotification(`Download failed: ${err.message}`, 'error')
    }
  }

  // Handle Print (triggers browser print)
  const handlePrint = (report) => {
    setViewerReport(report)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingReport) return
    try {
      setDeleteLoading(true)
      await api.reports.delete(deletingReport.report_id || deletingReport.id)
      showNotification(`Report ${deletingReport.report_id || deletingReport.id} deleted successfully.`, 'success')
      setDeletingReport(null)
      fetchReports(selectedCaseId)
    } catch (err) {
      showNotification(`Delete failed: ${err.message}`, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reportsList.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.report_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.id).includes(searchQuery)
      const matchesFormat =
        formatFilter === 'all' || r.report_format?.toLowerCase() === formatFilter.toLowerCase()
      return matchesSearch && matchesFormat
    })
  }, [reportsList, searchQuery, formatFilter])

  // Helper for status badge
  const renderStatusBadge = (status) => {
    const s = (status || 'completed').toLowerCase()
    if (s === 'completed') {
      return (
        <span className="rpt-status-pill rpt-status-completed">
          <CheckCircle2 size={12} /> Completed
        </span>
      )
    }
    if (s === 'generating') {
      return (
        <span className="rpt-status-pill rpt-status-generating">
          <Loader2 size={12} className="state-spinner" /> Generating
        </span>
      )
    }
    if (s === 'draft') {
      return (
        <span className="rpt-status-pill rpt-status-draft">
          <Clock size={12} /> Draft
        </span>
      )
    }
    return (
      <span className="rpt-status-pill rpt-status-failed">
        <AlertTriangle size={12} /> Failed
      </span>
    )
  }

  return (
    <div className="reports-page-root">
      {/* ── Notification Banner ── */}
      {feedback && (
        <div className={`rpt-alert-toast rpt-alert-toast--${feedback.type}`}>
          {feedback.type === 'success' ? (
            <Check size={16} />
          ) : feedback.type === 'error' ? (
            <AlertTriangle size={16} />
          ) : (
            <Loader2 size={16} className="state-spinner" />
          )}
          <span>{feedback.message}</span>
          <button className="rpt-toast-close" onClick={() => setFeedback(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="report-page-header">
        <div className="report-header-left">
          <div className="report-eyebrow">
            <Shield size={12} />
            Forensic Intelligence Briefing
          </div>
          <h1 className="report-page-title">Investigation Reports</h1>
          <p className="report-page-sub">
            Grounded forensic dossiers · Multi-evidence synthesis · Legal disclosure &amp; audit export
          </p>
        </div>

        <div className="report-header-actions">
          {casesList.length > 0 && (
            <div className="rpt-case-selector-wrap">
              <select
                className="report-select"
                value={selectedCaseId}
                onChange={handleCaseChange}
              >
                {casesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number || `CASE-${c.id}`} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="rpt-btn rpt-btn--ghost"
            onClick={() => fetchReports(selectedCaseId)}
            title="Refresh Reports Archive"
          >
            <RefreshCw size={14} />
          </button>

          {/* Prominent High-Visibility Generate Button */}
          <button
            id="btn-generate-new-report"
            className="rpt-btn rpt-btn--primary rpt-btn--glow"
            onClick={() => setGenerateModalOpen(true)}
            disabled={loading || casesList.length === 0}
          >
            <Plus size={16} />
            <span>Generate New Report</span>
          </button>
        </div>
      </header>

      {/* ── Filter & Search Toolbar ── */}
      <div className="rpt-toolbar-card">
        <div className="rpt-search-box">
          <Search size={15} className="rpt-search-icon" />
          <input
            type="text"
            placeholder="Search reports by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rpt-search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="rpt-filter-controls">
          <div className="rpt-format-filter-tabs">
            {['all', 'pdf', 'html', 'json', 'markdown'].map((fmt) => (
              <button
                key={fmt}
                className={`rpt-tab-item ${formatFilter === fmt ? 'rpt-tab-item--active' : ''}`}
                onClick={() => setFormatFilter(fmt)}
              >
                {fmt === 'all' ? 'All Formats' : fmt.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="rpt-view-switch">
            <button
              className={`rpt-switch-btn ${viewMode === 'table' ? 'rpt-switch-btn--active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <LayoutList size={15} />
            </button>
            <button
              className={`rpt-switch-btn ${viewMode === 'grid' ? 'rpt-switch-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Cards Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main View Content ── */}
      {loading ? (
        <LoadingView message="Loading forensic report archive from database..." />
      ) : error ? (
        <ErrorView
          error={error}
          onRetry={() => fetchReports(selectedCaseId)}
          message="Report Retrieval Error"
        />
      ) : reportsList.length === 0 ? (
        <EmptyStateView
          title="No forensic reports generated yet."
          message="Compile an official forensic disclosure dossier synthesized from digital evidence artifacts, timeline events, and verified AI findings."
          icon={FileText}
          actionText="Generate First Report"
          onAction={() => setGenerateModalOpen(true)}
        />
      ) : filteredReports.length === 0 ? (
        <div className="rpt-no-results">
          <p>No reports match your current search and filter criteria.</p>
          <button
            className="rpt-btn rpt-btn--ghost"
            onClick={() => {
              setSearchQuery('')
              setFormatFilter('all')
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── Structured Table View ── */
        <div className="rpt-table-container">
          <table className="rpt-main-table">
            <thead>
              <tr>
                <th>Report Title &amp; Identifier</th>
                <th>Case Reference</th>
                <th>Format</th>
                <th>Status</th>
                <th>Generated By</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id || report.report_id} className="rpt-table-row">
                  {/* Title & ID */}
                  <td className="rpt-cell-primary">
                    <div className="rpt-title-flex">
                      <div className="rpt-file-icon-wrap">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="rpt-table-title" onClick={() => setViewerReport(report)}>
                          {report.title}
                        </span>
                        <span className="rpt-table-uid">{report.report_id || `ID #${report.id}`}</span>
                      </div>
                    </div>
                  </td>

                  {/* Case */}
                  <td>
                    <span className="rpt-case-tag">
                      CASE #{report.case_id}
                    </span>
                  </td>

                  {/* Format */}
                  <td>
                    <span className="badge badge--info">
                      {report.report_format?.toUpperCase() || 'HTML'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td>
                    {renderStatusBadge(report.status)}
                  </td>

                  {/* Author */}
                  <td className="rpt-cell-sub">
                    {report.author_name || 'System / AI Agent'}
                  </td>

                  {/* Date */}
                  <td className="rpt-cell-sub">
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Actions (View, Download, Print, Delete) */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="rpt-action-buttons">
                      <button
                        className="rpt-action-btn rpt-action-btn--view"
                        onClick={() => setViewerReport(report)}
                        title="View Report Details"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        className="rpt-action-btn rpt-action-btn--pdf"
                        onClick={() => handleDownload(report, 'pdf')}
                        title="Direct PDF Export"
                      >
                        <FileText size={15} />
                      </button>

                      <button
                        className="rpt-action-btn rpt-action-btn--download"
                        onClick={() => handleDownload(report)}
                        title="Download Report File"
                      >
                        <Download size={15} />
                      </button>

                      <button
                        className="rpt-action-btn rpt-action-btn--print"
                        onClick={() => handlePrint(report)}
                        title="Print Report"
                      >
                        <Printer size={15} />
                      </button>

                      <button
                        className="rpt-action-btn rpt-action-btn--delete"
                        onClick={() => setDeletingReport(report)}
                        title="Delete Report"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Cards Grid View ── */
        <div className="rpt-cards-grid">
          {filteredReports.map((report) => (
            <div key={report.id || report.report_id} className="rpt-card-item">
              <div className="rpt-card-top">
                <span className="rpt-card-id">{report.report_id || `Report #${report.id}`}</span>
                <span className="badge badge--info">{report.report_format?.toUpperCase() || 'HTML'}</span>
              </div>

              <h3 className="rpt-card-title" onClick={() => setViewerReport(report)}>
                {report.title}
              </h3>

              <div className="rpt-card-meta">
                <div>Case Reference: <strong>CASE #{report.case_id}</strong></div>
                <div>Created: <strong>{report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}</strong></div>
                <div>Status: {renderStatusBadge(report.status)}</div>
              </div>

              <div className="rpt-card-actions">
                <button
                  className="rpt-btn rpt-btn--ghost rpt-btn--sm"
                  onClick={() => setViewerReport(report)}
                >
                  <Eye size={13} /> View
                </button>
                <button
                  className="rpt-btn rpt-btn--primary rpt-btn--sm rpt-btn--pdf"
                  onClick={() => handleDownload(report, 'pdf')}
                  title="Direct PDF Export"
                >
                  <FileText size={13} /> PDF
                </button>
                <button
                  className="rpt-btn rpt-btn--ghost rpt-btn--sm"
                  onClick={() => handleDownload(report)}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  className="rpt-btn rpt-btn--ghost rpt-btn--sm"
                  onClick={() => handlePrint(report)}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  className="rpt-btn rpt-btn--danger rpt-btn--sm"
                  onClick={() => setDeletingReport(report)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deletingReport && (
        <div className="inv-modal-overlay" onClick={() => setDeletingReport(null)}>
          <div className="inv-modal rpt-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="rpt-modal-icon-badge rpt-badge--danger">
                  <Trash2 size={18} />
                </div>
                <h2>Delete Investigation Report</h2>
              </div>
              <button className="inv-modal-close" onClick={() => setDeletingReport(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="rpt-confirm-body">
              <p>
                Are you sure you want to permanently delete report{' '}
                <strong>{deletingReport.report_id || `#${deletingReport.id}`}</strong>?
              </p>
              <p className="rpt-confirm-sub">
                "{deletingReport.title}"
              </p>
              <p className="rpt-confirm-warning">
                ⚠️ This action cannot be undone. An audit record will be logged.
              </p>
            </div>

            <div className="inv-modal-actions">
              <button
                type="button"
                className="inv-btn inv-btn--ghost"
                onClick={() => setDeletingReport(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inv-btn inv-btn--danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={15} className="state-spinner" /> Deleting...
                  </>
                ) : (
                  'Delete Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Report Modal ── */}
      <GenerateReportModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        casesList={casesList}
        initialCaseId={selectedCaseId}
        onReportGenerated={handleReportGenerated}
      />

      {/* ── Report Viewer Modal ── */}
      <ReportViewerModal
        isOpen={Boolean(viewerReport)}
        report={viewerReport}
        onClose={() => setViewerReport(null)}
        onPrint={handlePrint}
        onDownload={handleDownload}
      />
    </div>
  )
}
