import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Download, Edit3, Eye, Printer,
  Shield, CheckCircle2, AlertTriangle, Clock,
  HardDrive, Lock, User, Building, Share2,
  Brain, Info, Check, X, FileCheck, Layers,
  ChevronRight, Calendar, Tag, ShieldCheck,
  Save, RefreshCw, FolderOpen, Plus,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './Reports.css'

export default function Reports() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [reportsList, setReportsList] = useState([])
  const [activeReport, setActiveReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const fetchReports = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setReportsList([])
        setActiveReport(null)
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const res = await api.reports.listForCase(activeId)
      const items = res?.items || res || []
      setReportsList(items)
      setActiveReport(items[0] || null)
    } catch (err) {
      setError(err.message || 'Failed to load forensic reports from backend.')
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

  const handleGenerateReport = async () => {
    if (!selectedCaseId) return
    try {
      setGenerating(true)
      const res = await api.reports.create(selectedCaseId, {
        title: `Forensic Disclosure Dossier — Case #${selectedCaseId}`,
        report_format: 'json',
      })
      alert(`Report generated successfully! Report ID #${res?.id || ''}`)
      await fetchReports(selectedCaseId)
    } catch (err) {
      alert(`Report generation error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="reports-page-root">

      {/* ── Header ── */}
      <header className="report-page-header">
        <div className="report-header-left">
          <div className="report-eyebrow">
            <Shield size={12} />
            Forensic Intelligence Briefing
          </div>
          <h1 className="report-page-title">Investigation Reports</h1>
          <p className="report-page-sub">
            Grounded forensic dossiers · Chain of custody documentation · Export &amp; legal disclosure
          </p>
        </div>

        <div className="report-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="report-select"
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
            className="rpt-btn rpt-btn--ghost"
            onClick={() => fetchReports(selectedCaseId)}
            title="Refresh Reports"
          >
            <RefreshCw size={14} />
          </button>

          <button
            className="rpt-btn rpt-btn--ghost"
            onClick={handlePrint}
            disabled={!activeReport}
          >
            <Printer size={14} /> Print Report
          </button>

          <button
            className="rpt-btn rpt-btn--primary"
            onClick={handleGenerateReport}
            disabled={generating || !selectedCaseId}
          >
            <Plus size={14} />
            {generating ? 'Compiling Dossier...' : 'Generate New Report'}
          </button>
        </div>
      </header>

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Loading forensic report archive from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchReports(selectedCaseId)} message="Report Retrieval Error" />
      ) : reportsList.length === 0 ? (
        <EmptyStateView
          title="No reports generated for this case."
          message="Compile an official forensic disclosure dossier synthesized from verified digital evidence artifacts and findings."
          icon={FileText}
          actionText="Generate Report Dossier"
          onAction={handleGenerateReport}
        />
      ) : (
        <div className="report-main-grid">

          {/* Sidebar with report versions */}
          <div className="report-sidebar">
            <span className="rpt-sb-title">Report Versions ({reportsList.length})</span>
            <div className="rpt-list">
              {reportsList.map((r) => (
                <div
                  key={r.id}
                  className={`rpt-item-card ${activeReport?.id === r.id ? 'rpt-item-card--active' : ''}`}
                  onClick={() => setActiveReport(r)}
                >
                  <div className="rpt-item-top">
                    <span className="rpt-item-id">Report #{r.id}</span>
                    <span className="badge badge--info">{r.format || 'JSON/PDF'}</span>
                  </div>
                  <p className="rpt-item-title">{r.title}</p>
                  <span className="rpt-item-date">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Report Viewer */}
          {activeReport && (
            <div className="report-document-sheet">

              {/* Title Section */}
              <div className="rpt-doc-header">
                <div className="rpt-classification-banner">
                  OFFICIAL INVESTIGATION REPORT // CONFIDENTIAL // TLP:AMBER
                </div>
                <h1 className="rpt-doc-title">{activeReport.title}</h1>
                <div className="rpt-doc-meta">
                  <span>Case Reference: <strong>CASE #{activeReport.case_id}</strong></span>
                  <span>Compiled: <strong>{activeReport.created_at ? new Date(activeReport.created_at).toUTCString() : '—'}</strong></span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="rpt-doc-section">
                <h2 className="rpt-section-title">
                  <FileCheck size={16} /> 1. Executive Incident Overview
                </h2>
                <div className="rpt-section-content">
                  <p>
                    {activeReport.summary_text ||
                      `Official digital forensics investigation report for Case #${activeReport.case_id}. All referenced findings and timeline sequences are cryptographically grounded against SHA-256 evidence vaults.`}
                  </p>
                </div>
              </div>

              {/* Report Payload JSON Viewer */}
              {activeReport.content_json && (
                <div className="rpt-doc-section">
                  <h2 className="rpt-section-title">
                    <Brain size={16} /> 2. Structured Forensic Dossier Payload
                  </h2>
                  <pre className="rpt-json-payload">
                    {typeof activeReport.content_json === 'string'
                      ? activeReport.content_json
                      : JSON.stringify(activeReport.content_json, null, 2)}
                  </pre>
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="rpt-disclaimer-box">
                <ShieldCheck size={16} />
                <p>
                  <strong>Chain of Custody &amp; Admissibility Certification:</strong> This document was compiled deterministically from immutable audit records and SHA-256 sealed digital artifacts. Findings represent assistive AI observations and do not automatically declare legal culpability.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
