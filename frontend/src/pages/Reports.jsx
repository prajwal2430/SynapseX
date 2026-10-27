import { useState, useEffect } from 'react'
import {
  FileText, Download, Edit3, Eye, Printer,
  Shield, CheckCircle2, AlertTriangle, Clock,
  HardDrive, Lock, User, Building, Share2,
  Brain, Info, Check, X, FileCheck, Layers,
  ChevronRight, Calendar, Tag, ShieldCheck,
  Save, RefreshCw
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { caseApi } from '../services/caseApi'
import './Reports.css'

/* ═══════════════════════════════════════════════════
   REPORT MASTER DATASET (CASE-2026-001)
═══════════════════════════════════════════════════ */
const INITIAL_REPORT = {
  caseId: 'CASE-2026-001',
  title: 'Suspected Data Exfiltration',
  classification: 'CONFIDENTIAL // LAW ENFORCEMENT ADVISORY // TLP:RED',
  dateGenerated: '2026-08-20 10:30:00 UTC',
  author: 'SynapseX Report Agent & Lead Investigator (SA)',
  targetEntity: 'LAPTOP-07 (WKST-041) / jsmith@corp.int',
  disposition: 'Referred for Human Authorization Verification',
  
  // Section 1: Summary
  summary: {
    incidentOverview: 'Between 10:02:14 and 10:09:20 UTC on August 20, 2026, an unauthorized physical and digital sequence occurred inside restricted facility Server Room B. Forensic telemetry demonstrates unauthorized physical entry, interactive workstation logon, unregistered mass storage insertion, sensitive financial file archiving (2.1 GB), and an outbound encrypted network burst (1.8 GB) to a verified TOR exit node (185.220.101.47).',
    investigativeScope: 'Digital forensics reconstruction across physical access controls, CCTV streams, endpoint security event logs, removable hardware registries, file server audit logs, and network firewall flow captures.',
    leadInvestigator: 'Demo Investigator (Lead Analyst SA, Badge #SA-841)',
    clearanceLevel: 'TS/SCI'
  },

  // Section 2: Evidence Inventory
  evidenceInventory: [
    { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Video Evidence', source: 'CAM-07 Server Room B', size: '2.1 GB', sha256: 'a3f1d82c4b7e9f20c1d456a8b3e7f1d9a2c4b6e8f0d2a4c6b8e0f2a4c6b8e0f2', status: 'Verified' },
    { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'Workstation LAPTOP-07', size: '48 MB', sha256: 'b8c3e1f4d7a0b2e5f8c1d4a7b0e3f6c9d2a5b8e1f4c7d0a3b6e9f2c5d8a1b4e7', status: 'Verified' },
    { id: 'E-003', name: 'firewall_egress_logs.csv', type: 'Network Logs', source: 'Palo Alto FW-CORE-01', size: '8.3 MB', sha256: 'c9d4f2a6b8e1c3d5f7a9b2e4c6d8f0a2b4e6c8d0f2a4b6e8c0d2f4a6b8e0c2d4', status: 'Verified' },
    { id: 'E-004', name: 'usb_activity_log.csv', type: 'Device Activity', source: 'CrowdStrike Falcon Sensor', size: '124 KB', sha256: 'd0e5a3c7b9f2d4e6a8c0b2d4f6a8c0b2d4f6a8c0b2d4f6a8c0b2d4f6a8c0b2d4', status: 'Verified' },
    { id: 'E-006', name: 'network_capture.pcap', type: 'PCAP Traffic', source: 'Network TAP Switch-Core', size: '4.7 GB', sha256: 'f2a7c5e9d3b6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8', status: 'Verified' }
  ],

  // Section 3: Timeline of Events
  timelineEvents: [
    { time: '10:02:14 UTC', source: 'CCTV (CAM-07)', event: 'Person entered restricted corridor without badge scan', risk: 'High' },
    { time: '10:03:02 UTC', source: 'Access Control', event: 'Door DR-B02 unlocked using Card #27 (EMP-4421)', risk: 'High' },
    { time: '10:04:10 UTC', source: 'System Logs', event: 'Interactive Kerberos logon on LAPTOP-07 (jsmith@corp.int)', risk: 'Medium' },
    { time: '10:05:32 UTC', source: 'USB Logs', event: 'Unregistered USB-123 (SanDisk 128GB) connected to LAPTOP-07', risk: 'Critical' },
    { time: '10:07:45 UTC', source: 'File Activity', event: '34 confidential files read from /Finance/Q2-Projections/ and compressed to E:\\tmp\\archive.tar.gz', risk: 'Critical' },
    { time: '10:09:20 UTC', source: 'Network Logs', event: '1.8 GB encrypted TLS 1.3 outbound transfer to 185.220.101.47 (TOR Exit Node)', risk: 'Critical' },
    { time: '10:14:05 UTC', source: 'CCTV (CAM-03)', event: 'Subject exited facility through North Perimeter stairwell', risk: 'High' }
  ],

  // Section 4: Entity Relationships
  entities: [
    { entity: 'Person X (J. Smith)', type: 'Person', relation: 'Used LAPTOP-07; Possessed Card #27' },
    { entity: 'Card #27', type: 'Credential', relation: 'Unlocked Door DR-B02 (Server Room B)' },
    { entity: 'LAPTOP-07', type: 'Device', relation: 'Mounted USB-123; Accessed Confidential Files; Outbound to TOR IP' },
    { entity: 'USB-123', type: 'USB Device', relation: 'Mounted on LAPTOP-07; Staged 2.1 GB payload' },
    { entity: '/Finance/Q2-Projections/', type: 'File Repository', relation: 'Targeted CIFS volume containing 34 confidential models' },
    { entity: '185.220.101.47', type: 'IP Address', relation: 'Destination TOR exit relay on port 443' },
    { entity: 'MegaDrop C2 Cloud', type: 'Cloud Service', relation: 'Downstream dead-drop repository' }
  ],

  // Section 5: AI-Assisted Findings
  aiFindings: {
    hypothesisId: 'HYP-2026-001',
    findingTitle: 'Potential Data Exfiltration Sequence',
    assessment: 'Requires Investigator Review',
    confidenceScore: 67,
    confidenceTier: 'Medium',
    model: 'SynapseX-Reasoning-Engine (Forge-v3)',
    summary: 'Algorithmic correlation identified an unbroken multi-vector progression from physical breach to external encrypted network egress within 426 seconds. The temporal and entity alignment presents a plausible exfiltration pattern.'
  },

  // Section 6: Supporting Evidence
  supportingPillars: [
    { title: 'Removable Hardware Connection', detail: 'Unregistered USB hardware inserted on workstation 82 seconds post-login.' },
    { title: 'Confidential File Access', detail: '34 restricted quarterly financial projections accessed with no prior 90-day history.' },
    { title: 'Local Compression & Staging', detail: 'Consolidated into encrypted archive file on removable volume E:\\tmp.' },
    { title: 'High-Entropy Network Burst', detail: '1.8 GB outbound encrypted stream to verified TOR consensus node.' }
  ],

  // Section 7: Alternative Explanations
  alternatives: [
    { title: 'Authorized IT Scheduled Backup Activity', detail: 'Possibility of an administrator conducting off-cycle backup. Contradicted by absence of ServiceNow change ticket and policy prohibiting TOR routing.' },
    { title: 'Authorized Third-Party Accounting Audit', detail: 'Possibility of legitimate financial compliance export. Contradicted by off-hours execution and unapproved transmission infrastructure.' }
  ],

  // Section 8: Missing Evidence
  missingEvidence: [
    { item: 'AWS / Azure Cloud Tenant Audit Logs', purpose: 'Check for concurrent cloud logins under employee identity.' },
    { item: 'HR & IT Data Export Authorizations', purpose: 'Verify if formal emergency data export permission was logged.' },
    { item: 'IT Disaster Recovery Backup Calendar', purpose: 'Confirm whether off-cycle system backup was sanctioned.' },
    { item: 'USB Hardware Ownership Records', purpose: 'Cross-reference serial SDCZ48-128G with corporate purchasing records.' }
  ],

  // Section 9: Investigator Notes
  investigatorNotes: 'Lead Investigator Notes:\nThe correlated sequence demonstrates severe deviation from standard operating procedures. The physical access via Card #27 and subsequent Kerberos logon on LAPTOP-07 warrant formal inquiry. Recommended immediate steps include securing endpoint forensic images and issuing document hold notices to cloud infrastructure providers.',

  // Section 10: Final Review
  review: {
    status: 'Pending Final Sign-Off',
    reviewerName: 'Demo Investigator (Lead Analyst)',
    reviewerClearance: 'TS/SCI',
    reviewerBadge: 'SA-841',
    reviewDate: '2026-08-20',
    dispositionOption: 'Accept as Official Lead & Issue Document Hold'
  }
}

export default function Reports() {
  const { activeCase } = useCase()
  const [report, setReport] = useState(INITIAL_REPORT)
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'edit'
  const [isSaved, setIsSaved] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [disposition, setDisposition] = useState(INITIAL_REPORT.review.dispositionOption)
  const [analystNotes, setAnalystNotes] = useState(INITIAL_REPORT.investigatorNotes)

  useEffect(() => {
    if (!activeCase?.id) return
    let isMounted = true
    caseApi.getReports(activeCase.id).then(res => {
      if (!isMounted) return
      const reportsList = res?.items || (Array.isArray(res) ? res : [])
      if (reportsList.length > 0) {
        const rep = reportsList[0]
        if (rep.structured_data) {
          const sd = rep.structured_data
          const cs = sd.case_summary || {}
          setReport(prev => ({
            ...prev,
            id: rep.id,
            caseId: activeCase.case_id || prev.caseId,
            title: rep.title || prev.title,
            dateGenerated: rep.generated_at || new Date().toISOString(),
            summary: {
              incidentOverview: cs.description || prev.summary.incidentOverview,
              investigativeScope: `Forensic case reconstruction across evidence artifacts in case ${activeCase.case_id}`,
              leadInvestigator: 'Lead Forensic Examiner',
              clearanceLevel: 'TS/SCI'
            },
            evidenceInventory: (sd.evidence_inventory || []).map(e => ({
              id: `E-${e.id}`,
              name: e.original_filename,
              type: e.mime_type || 'Evidence File',
              source: 'Vault Store',
              size: `${Math.round((e.file_size || 0) / 1024)} KB`,
              sha256: e.sha256_hash || 'SHA-256 Verified',
              status: e.processing_status || 'Verified'
            })),
            timelineEvents: (sd.investigation_timeline || []).map(t => ({
              time: t.timestamp ? new Date(t.timestamp).toISOString().slice(11, 19) + ' UTC' : 'UTC',
              source: t.source || 'Evidence',
              event: t.details || t.event_type,
              risk: 'High'
            })),
            entities: (sd.entity_relationships?.nodes || []).map(n => ({
              entity: n.label || n.id,
              type: n.type || 'Entity',
              relation: 'Case Entity Anchor'
            })),
            aiFindings: (sd.ai_assisted_findings && sd.ai_assisted_findings[0]) ? {
              hypothesisId: `HYP-${sd.ai_assisted_findings[0].finding_id}`,
              findingTitle: sd.ai_assisted_findings[0].title,
              assessment: sd.ai_assisted_findings[0].review_status || 'Requires Investigator Review',
              confidenceScore: Math.round((sd.ai_assisted_findings[0].confidence || 0.85) * 100),
              confidenceTier: 'High',
              model: 'SynapseX-Reasoning-Engine',
              summary: sd.ai_assisted_findings[0].description
            } : prev.aiFindings
          }))
        }
      } else {
        setReport(prev => ({
          ...prev,
          caseId: activeCase.case_id || prev.caseId,
          title: `Investigation Dossier — ${activeCase.title || 'Active Case'}`
        }))
      }
    }).catch(err => console.warn('Failed to load case reports:', err))

    return () => { isMounted = false }
  }, [activeCase?.id])

  const handleGenerateReport = async () => {
    if (!activeCase?.id) return
    setIsGenerating(true)
    try {
      const generated = await caseApi.generateReport(activeCase.id, {
        title: `Comprehensive Forensic Dossier - ${activeCase.case_id || activeCase.id}`,
        format: 'html'
      })
      if (generated && generated.structured_data) {
        const sd = generated.structured_data
        const cs = sd.case_summary || {}
        setReport(prev => ({
          ...prev,
          id: generated.id,
          caseId: activeCase.case_id || prev.caseId,
          title: generated.title || prev.title,
          dateGenerated: generated.generated_at || new Date().toISOString(),
          summary: {
            incidentOverview: cs.description || prev.summary.incidentOverview,
            investigativeScope: `Forensic case reconstruction across evidence artifacts in case ${activeCase.case_id}`,
            leadInvestigator: 'Lead Forensic Examiner',
            clearanceLevel: 'TS/SCI'
          },
          evidenceInventory: (sd.evidence_inventory || []).map(e => ({
            id: `E-${e.id}`,
            name: e.original_filename,
            type: e.mime_type || 'Evidence File',
            source: 'Vault Store',
            size: `${Math.round((e.file_size || 0) / 1024)} KB`,
            sha256: e.sha256_hash || 'SHA-256 Verified',
            status: e.processing_status || 'Verified'
          })),
          timelineEvents: (sd.investigation_timeline || []).map(t => ({
            time: t.timestamp ? new Date(t.timestamp).toISOString().slice(11, 19) + ' UTC' : 'UTC',
            source: t.source || 'Evidence',
            event: t.details || t.event_type,
            risk: 'High'
          })),
          entities: (sd.entity_relationships?.nodes || []).map(n => ({
            entity: n.label || n.id,
            type: n.type || 'Entity',
            relation: 'Case Entity Anchor'
          })),
          aiFindings: (sd.ai_assisted_findings && sd.ai_assisted_findings[0]) ? {
            hypothesisId: `HYP-${sd.ai_assisted_findings[0].finding_id}`,
            findingTitle: sd.ai_assisted_findings[0].title,
            assessment: sd.ai_assisted_findings[0].review_status || 'Requires Investigator Review',
            confidenceScore: Math.round((sd.ai_assisted_findings[0].confidence || 0.85) * 100),
            confidenceTier: 'High',
            model: 'SynapseX-Reasoning-Engine',
            summary: sd.ai_assisted_findings[0].description
          } : prev.aiFindings
        }))
      }
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3500)
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    setReport(prev => ({
      ...prev,
      investigatorNotes: analystNotes,
      review: { ...prev.review, dispositionOption: disposition }
    }))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="reports-page-root">

      {/* ══════════════════════════════════════════
          TOP CONTROLS & REPORT HEADER
      ══════════════════════════════════════════ */}
      <header className="report-page-header">
        <div className="report-header-left">
          <div className="report-eyebrow">
            <FileText size={13} className="report-eyebrow-icon" />
            <span>Forensic Intelligence Case Report Dossier</span>
          </div>
          <h1 className="report-page-title">Investigation Report</h1>
          <p className="report-page-sub">
            {report.caseId} · {report.title} · Formal digital evidence synthesis & investigative findings documentation.
          </p>
        </div>

        <div className="report-header-actions">
          <button 
            className="report-btn-print" 
            style={{ background: 'var(--accent)', color: '#0b1120', fontWeight: 700 }}
            onClick={handleGenerateReport}
            disabled={isGenerating}
            id="btn-generate-report"
          >
            <RefreshCw size={13} className={isGenerating ? "ev-spin" : ""} />
            <span>{isGenerating ? "Synthesizing Dossier..." : "Generate Forensic Report"}</span>
          </button>

          <div className="view-mode-tabs">
            <button 
              className={`vm-tab ${viewMode === 'preview' ? 'vm-tab--active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              <Eye size={13} />
              <span>Preview Report</span>
            </button>
            <button 
              className={`vm-tab ${viewMode === 'edit' ? 'vm-tab--active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              <Edit3 size={13} />
              <span>Edit Draft</span>
            </button>
          </div>

          <button className="report-btn-print" onClick={handlePrint} id="btn-export-pdf">
            <Printer size={13} />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </header>

      {/* Draft Save Banner */}
      {isSaved && (
        <div className="save-alert-banner">
          <CheckCircle2 size={16} />
          <span>Report draft and investigator commentary saved to case vault.</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FORMAL ADVISORY WATERMARK BANNER
      ══════════════════════════════════════════ */}
      <div className="draft-advisory-banner">
        <div className="dab-left">
          <AlertTriangle size={18} className="dab-icon" />
          <div>
            <strong className="dab-title">AI-Generated Draft — Requires Investigator Review</strong>
            <p className="dab-desc">
              This dossier has been synthesized by the SynapseX multi-agent correlation engine. All findings, causal alignments, and timelines are probabilistic decision-support outputs for authorized human investigators and <em>do not constitute self-executing legal determinations or autonomous court validation</em>.
            </p>
          </div>
        </div>
        <span className="dab-tag">HUMAN REVIEW MANDATORY</span>
      </div>

      {/* ══════════════════════════════════════════
          MAIN REPORT DOCUMENT CONTAINER
      ══════════════════════════════════════════ */}
      <div className="report-document" id="report-printable-area">
        
        {/* Document Classification & Letterhead Header */}
        <div className="doc-letterhead">
          <div className="doc-class-stamp">{report.classification}</div>
          <div className="doc-header-meta-row">
            <div className="doc-brand">
              <span className="doc-brand-title">SYNAPSEX FORENSIC INTELLIGENCE PLATFORM</span>
              <span className="doc-brand-sub">Autonomous Digital Evidence Intelligence & Incident Dossier</span>
            </div>
            <div className="doc-case-meta">
              <div className="dcm-item"><span className="dcm-k">Case ID:</span> <strong>{report.caseId}</strong></div>
              <div className="dcm-item"><span className="dcm-k">Date:</span> <span>{report.dateGenerated}</span></div>
            </div>
          </div>
          <h2 className="doc-main-title">{report.title}</h2>
        </div>

        {/* ───────────────────────────────────────
            SECTION 1: CASE SUMMARY
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">01</span>
            <h3 className="doc-sec-title">Case Summary</h3>
          </div>
          <div className="doc-sec-body">
            <p className="doc-para">{report.summary.incidentOverview}</p>
            <div className="doc-summary-grid">
              <div className="dsg-cell">
                <span className="dsg-k">Investigative Scope:</span>
                <span className="dsg-v">{report.summary.investigativeScope}</span>
              </div>
              <div className="dsg-cell">
                <span className="dsg-k">Lead Investigator:</span>
                <span className="dsg-v">{report.summary.leadInvestigator}</span>
              </div>
              <div className="dsg-cell">
                <span className="dsg-k">Target Workstation / Subject:</span>
                <span className="dsg-v">{report.targetEntity}</span>
              </div>
              <div className="dsg-cell">
                <span className="dsg-k">Clearance Classification:</span>
                <span className="dsg-v">{report.summary.clearanceLevel}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 2: EVIDENCE INVENTORY
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">02</span>
            <h3 className="doc-sec-title">Evidence Inventory</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Artifact Name</th>
                    <th>Type</th>
                    <th>Source Device</th>
                    <th>Size</th>
                    <th>SHA-256 Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.evidenceInventory.map((ev) => (
                    <tr key={ev.id}>
                      <td><code className="doc-code">{ev.id}</code></td>
                      <td><strong>{ev.name}</strong></td>
                      <td>{ev.type}</td>
                      <td>{ev.source}</td>
                      <td>{ev.size}</td>
                      <td><code className="doc-hash">{ev.sha256.slice(0, 16)}...</code></td>
                      <td><span className="doc-verified-pill"><Check size={9} /> {ev.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 3: TIMELINE OF EVENTS
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">03</span>
            <h3 className="doc-sec-title">Timeline of Events</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-timeline-list">
              {report.timelineEvents.map((evt, i) => (
                <div key={i} className="doc-tl-item">
                  <span className="doc-tl-time">{evt.time}</span>
                  <span className={`doc-tl-src doc-tl-src--${evt.risk.toLowerCase()}`}>{evt.source}</span>
                  <span className="doc-tl-event">{evt.event}</span>
                  <span className={`doc-tl-risk doc-tl-risk--${evt.risk.toLowerCase()}`}>{evt.risk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 4: ENTITY RELATIONSHIPS
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">04</span>
            <h3 className="doc-sec-title">Entity Relationships</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Entity Identifier</th>
                    <th>Category</th>
                    <th>Established Relationship & Role</th>
                  </tr>
                </thead>
                <tbody>
                  {report.entities.map((en, i) => (
                    <tr key={i}>
                      <td><strong>{en.entity}</strong></td>
                      <td><span className="doc-entity-tag">{en.type}</span></td>
                      <td>{en.relation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 5: AI-ASSISTED FINDINGS
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">05</span>
            <h3 className="doc-sec-title">AI-Assisted Findings</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-findings-card">
              <div className="dfc-top">
                <div>
                  <span className="dfc-id">{report.aiFindings.hypothesisId}</span>
                  <h4 className="dfc-title">{report.aiFindings.findingTitle}</h4>
                </div>
                <div className="dfc-badges">
                  <span className="dfc-assessment">{report.aiFindings.assessment}</span>
                  <span className="dfc-confidence">Confidence: {report.aiFindings.confidenceTier} ({report.aiFindings.confidenceScore}%)</span>
                </div>
              </div>
              <p className="dfc-summary">{report.aiFindings.summary}</p>
              <span className="dfc-model-ref">Synthesized via {report.aiFindings.model}</span>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 6: SUPPORTING EVIDENCE
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">06</span>
            <h3 className="doc-sec-title">Supporting Evidence Pillars</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-pillars-grid">
              {report.supportingPillars.map((p, i) => (
                <div key={i} className="doc-pillar-item">
                  <div className="dpi-hdr">
                    <span className="dpi-num">0{i + 1}</span>
                    <strong className="dpi-title">{p.title}</strong>
                  </div>
                  <p className="dpi-text">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 7: ALTERNATIVE EXPLANATIONS
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">07</span>
            <h3 className="doc-sec-title">Alternative Explanations & Competing Hypotheses</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-alternatives-list">
              {report.alternatives.map((alt, i) => (
                <div key={i} className="doc-alt-box">
                  <h4 className="dab-sub-title">Alternative Theory 0{i + 1}: {alt.title}</h4>
                  <p className="dab-sub-text">{alt.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 8: MISSING / RECOMMENDED EVIDENCE
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">08</span>
            <h3 className="doc-sec-title">Missing / Recommended Evidence</h3>
          </div>
          <div className="doc-sec-body">
            <div className="doc-missing-list">
              {report.missingEvidence.map((m, i) => (
                <div key={i} className="doc-missing-row">
                  <strong className="dmr-title">• {m.item}:</strong>
                  <span className="dmr-purpose">{m.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 9: INVESTIGATOR NOTES
        ─────────────────────────────────────── */}
        <section className="doc-section">
          <div className="doc-sec-hdr">
            <span className="sec-num">09</span>
            <h3 className="doc-sec-title">Investigator Notes & Disposition Commentary</h3>
          </div>
          <div className="doc-sec-body">
            {viewMode === 'edit' ? (
              <div className="edit-notes-box">
                <textarea
                  className="edit-notes-textarea"
                  rows={4}
                  value={analystNotes}
                  onChange={e => setAnalystNotes(e.target.value)}
                />
                <button className="doc-save-btn" onClick={handleSaveDraft}>
                  <Save size={12} /> Save Investigator Notes
                </button>
              </div>
            ) : (
              <p className="doc-notes-text">{report.investigatorNotes}</p>
            )}
          </div>
        </section>

        {/* ───────────────────────────────────────
            SECTION 10: FINAL HUMAN REVIEW & SIGN-OFF
        ─────────────────────────────────────── */}
        <section className="doc-section doc-section--review">
          <div className="doc-sec-hdr">
            <span className="sec-num">10</span>
            <h3 className="doc-sec-title">Final Human Review & Sign-Off Authorization</h3>
          </div>
          <div className="doc-sec-body">
            
            <div className="doc-signoff-card">
              <div className="signoff-row">
                <div className="signoff-cell">
                  <span className="so-k">Reviewer Name:</span>
                  <strong className="so-v">{report.review.reviewerName}</strong>
                </div>
                <div className="signoff-cell">
                  <span className="so-k">Badge / ID:</span>
                  <span className="so-v">{report.review.reviewerBadge}</span>
                </div>
                <div className="signoff-cell">
                  <span className="so-k">Security Clearance:</span>
                  <span className="so-v">{report.review.reviewerClearance}</span>
                </div>
                <div className="signoff-cell">
                  <span className="so-k">Date Signed:</span>
                  <span className="so-v">{report.review.reviewDate}</span>
                </div>
              </div>

              <div className="disposition-selector-row">
                <label className="disposition-label">Case Finding Disposition:</label>
                {viewMode === 'edit' ? (
                  <select 
                    className="disposition-select"
                    value={disposition}
                    onChange={e => setDisposition(e.target.value)}
                  >
                    <option value="Accept as Official Lead & Issue Document Hold">Accept as Official Lead & Issue Document Hold</option>
                    <option value="Refer for Deeper Field & Cloud Subpoena">Refer for Deeper Field & Cloud Subpoena</option>
                    <option value="Closed — Inconclusive Telemetry">Closed — Inconclusive Telemetry</option>
                  </select>
                ) : (
                  <strong className="disposition-display-value">{report.review.dispositionOption}</strong>
                )}
              </div>

              <div className="signoff-seal-block">
                <ShieldCheck size={28} className="signoff-seal-icon" />
                <div>
                  <span className="ssb-title">Cryptographically Signed Case Dossier</span>
                  <p className="ssb-desc">Certified by authorized lead investigator. Tamper-evident ledger record #441092 sealed in SynapseX evidence vault.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

    </div>
  )
}
