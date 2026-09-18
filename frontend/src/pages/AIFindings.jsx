import { useState } from 'react'
import {
  Brain, Shield, AlertTriangle, CheckCircle2,
  Clock, HardDrive, Usb, FileSearch, Network,
  Info, HelpCircle, FileText, Check, X,
  RefreshCw, MessageSquare, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Layers, SlidersHorizontal,
  ThumbsUp, ThumbsDown, Plus, ExternalLink,
  ShieldCheck, Eye, Terminal, Lock, Cloud, UserCheck
} from 'lucide-react'
import './AIFindings.css'

/* ═══════════════════════════════════════════════════
   MOCK FINDINGS DATASET
═══════════════════════════════════════════════════ */
const PRIMARY_FINDING = {
  id: 'HYP-2026-001',
  title: 'Potential Data Exfiltration Sequence',
  assessment: 'Requires Investigator Review',
  assessmentType: 'review_required',
  confidenceScore: 67,
  confidenceLevel: 'Medium',
  targetEntity: 'LAPTOP-07 / jsmith@corp.int',
  created: '2026-08-20 10:12:00 UTC',
  model: 'SynapseX-Reasoning-Engine (Forge-v3)',
  leadSummary:
    'SynapseX multi-agent correlation identified a temporal and functional sequence linking physical access anomaly, unauthorized USB mass storage, sensitive financial archive creation, and high-volume encrypted transmission to a TOR exit node within a 7-minute window.',
  supportingEvidence: [
    {
      id: 'ev-1',
      title: 'USB Connected',
      icon: Usb,
      source: 'CrowdStrike EDR (E-004)',
      timestamp: '10:05:32 UTC',
      detail: 'Unregistered SanDisk Cruzer Glide 128GB (Serial: SDCZ48-128G) connected to LAPTOP-07.',
      significance: 'Hardware insertion created staging volume E:\\ exactly 82 seconds post-login.',
      verified: true
    },
    {
      id: 'ev-2',
      title: 'Sensitive Files Accessed',
      icon: FileSearch,
      source: 'Windows Event Logs (E-002)',
      timestamp: '10:07:45 UTC',
      detail: '34 confidential finance documents read from restricted CIFS share \\\\fs-core\\Finance\\Q2-Projections.',
      significance: 'Access history shows zero prior access requests from user identity in preceding 90 days.',
      verified: true
    },
    {
      id: 'ev-3',
      title: 'Files Compressed & Staged',
      icon: HardDrive,
      source: 'File Audit & System Logs (E-002)',
      timestamp: '10:08:12 UTC',
      detail: 'Targeted documents consolidated into archive file E:\\tmp\\archive.tar.gz (2.1 GB payload).',
      significance: 'Local staging on removable drive directly preceding network egress burst.',
      verified: true
    },
    {
      id: 'ev-4',
      title: 'Large Outbound Network Transfer',
      icon: Network,
      source: 'Firewall & PCAP Logs (E-003, E-006)',
      timestamp: '10:09:20 UTC',
      detail: '1.8 GB encrypted stream transmitted to remote destination 185.220.101.47 (Verified TOR Exit Node).',
      significance: 'High entropy payload (7.98 bits/byte) transmitted over TLS 1.3 socket.',
      verified: true
    }
  ],
  timelineSequence: [
    { step: 1, time: '10:02:14', source: 'CCTV (CAM-07)', label: 'Person entered restricted corridor', risk: 'high' },
    { step: 2, time: '10:03:02', source: 'Access Control', label: 'Door opened using Card #27', risk: 'high' },
    { step: 3, time: '10:04:10', source: 'System Logs', label: 'User login on LAPTOP-07', risk: 'medium' },
    { step: 4, time: '10:05:32', source: 'USB Logs', label: 'USB-123 connected to LAPTOP-07', risk: 'critical' },
    { step: 5, time: '10:07:45', source: 'File Activity', label: 'Confidential documents accessed & staged', risk: 'critical' },
    { step: 6, time: '10:09:20', source: 'Network Logs', label: '1.8 GB outbound transfer to TOR node', risk: 'critical' }
  ],
  correlationReasons: [
    {
      title: 'Timestamp Proximity',
      icon: Clock,
      text: 'All six sequence steps unfolded across a tight 7-minute 06-second window (10:02:14 to 10:09:20 UTC), reflecting continuous, unbroken physical and digital execution.'
    },
    {
      title: 'Same Terminal & Identity',
      icon: HardDrive,
      text: 'All interactive operations (Kerberos logon, USB driver mount, file archiving, and socket connection) executed under identity jsmith@corp.int on terminal LAPTOP-07 (WKST-041).'
    },
    {
      title: 'Targeted File Selection',
      icon: FileSearch,
      text: 'Directory traversal directly bypassed standard personal directories and focused exclusively on restricted Q2 revenue projections.'
    },
    {
      title: 'Synchronized Network Burst',
      icon: Network,
      text: 'Encrypted network transmission to external routing infrastructure commenced exactly 95 seconds following completion of local file archive creation.'
    }
  ],
  alternativeExplanations: [
    {
      id: 'alt-1',
      title: 'Authorized IT Scheduled Backup Activity',
      likelihood: 'Low-to-Medium',
      description: 'An authorized systems administrator or IT engineer was performing an off-cycle disaster recovery backup prior to scheduled Server Room B maintenance.',
      supportingFacts: ['User credentials held elevated administrative permissions on WKST-041.'],
      contradictingFacts: [
        'No change ticket or backup window scheduled in ServiceNow for 2026-08-20.',
        'Corporate DR policy strictly mandates AWS S3 Glacier as backup destination, not external TOR IP address 185.220.101.47.'
      ]
    },
    {
      id: 'alt-2',
      title: 'Authorized External Third-Party Audit Transfer',
      likelihood: 'Low',
      description: 'Authorized finance personnel transmitting quarterly compliance dataset to external accounting firm.',
      supportingFacts: ['Files targeted strictly match Q2 corporate accounting scope.'],
      contradictingFacts: [
        'Transfer occurred during off-hours (10:00 UTC) with unregistered USB hardware.',
        'Approved accounting audit portals use enterprise SFTP, not darknet / TOR routing.'
      ]
    }
  ],
  missingEvidence: [
    {
      id: 'gap-1',
      title: 'Cloud Audit Logs (AWS / Azure Tenant)',
      category: 'Cloud Telemetry',
      urgency: 'High',
      reason: 'Verify whether secondary cloud credentials associated with jsmith@corp.int were concurrently active or accessed during the exfiltration window.'
    },
    {
      id: 'gap-2',
      title: 'User Authorization & Approval Records',
      category: 'Identity & HR',
      urgency: 'High',
      reason: 'Check corporate ticketing system for any formal emergency data export exemptions requested by employee.'
    },
    {
      id: 'gap-3',
      title: 'Backup & Maintenance Schedules',
      category: 'IT Operations',
      urgency: 'Medium',
      reason: 'Confirm whether any unannounced hardware migration or volume snapshot routines were sanctioned for Server Room B.'
    },
    {
      id: 'gap-4',
      title: 'USB Hardware Ownership Records',
      category: 'Physical Asset',
      urgency: 'High',
      reason: 'Cross-reference USB Serial SDCZ48-128G with corporate purchase requisitions and personal property entry registry.'
    }
  ]
}

export default function AIFindings() {
  const [finding, setFinding] = useState(PRIMARY_FINDING)
  const [investigatorStatus, setInvestigatorStatus] = useState('Pending Review') // 'Accepted as Lead' | 'Requested More Analysis' | 'Rejected'
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState([
    {
      author: 'Lead Investigator (SA)',
      time: '2026-08-20 10:15 UTC',
      text: 'Correlated exfiltration hypothesis has strong temporal indicators. Recommend subpoenaing cloud audit logs and requesting employee statement regarding Card #27 badge possession.'
    }
  ])
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null)

  const handleAction = (statusName, feedback) => {
    setInvestigatorStatus(statusName)
    setActionSuccessMsg(feedback)
    setTimeout(() => setActionSuccessMsg(null), 4000)
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!notes.trim()) return
    const newNote = {
      author: 'Investigator (Demo)',
      time: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      text: notes.trim()
    }
    setSavedNotes([newNote, ...savedNotes])
    setNotes('')
    setActionSuccessMsg('Investigator note added to finding record.')
    setTimeout(() => setActionSuccessMsg(null), 3000)
  }

  return (
    <div className="findings-page-root">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <header className="findings-page-header">
        <div className="findings-header-left">
          <div className="findings-eyebrow">
            <Brain size={13} className="findings-eyebrow-icon" />
            <span>AI Reasoning & Hypothesis Synthesis</span>
          </div>
          <h1 className="findings-page-title">AI Findings & Reasoning</h1>
          <p className="findings-page-sub">
            CASE-2026-001 · Evidence-backed investigative hypotheses formulated by SynapseX multi-modal correlation engine. Designed for transparent explainability, competing hypothesis evaluation, and human decision-making.
          </p>
        </div>

        <div className="findings-header-actions">
          <div className={`status-badge-lg status-badge-lg--${investigatorStatus.replace(/\s+/g, '-').toLowerCase()}`}>
            <span className="status-dot-pulse" />
            <span>{investigatorStatus}</span>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="action-notification">
          <CheckCircle2 size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PRIMARY FINDING HERO CARD
      ══════════════════════════════════════════ */}
      <section className="primary-finding-card">
        
        {/* Top Header */}
        <div className="pfc-header">
          <div className="pfc-title-group">
            <div className="pfc-icon-wrap">
              <Shield size={20} />
            </div>
            <div>
              <div className="pfc-id-row">
                <span className="pfc-id">{finding.id}</span>
                <span className="pfc-assessment-chip">
                  <AlertTriangle size={11} /> {finding.assessment}
                </span>
              </div>
              <h2 className="pfc-title">{finding.title}</h2>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="pfc-confidence-box">
            <div className="conf-label-row">
              <span className="conf-label">Confidence Assessment</span>
              <span className="conf-score-text">{finding.confidenceLevel} ({finding.confidenceScore}%)</span>
            </div>
            <div className="conf-bar-track">
              <div className="conf-bar-fill" style={{ width: `${finding.confidenceScore}%` }} />
            </div>
            <span className="conf-caption">Probabilistic algorithmic correlation · Requires human validation</span>
          </div>
        </div>

        {/* Narrative Lead Summary */}
        <p className="pfc-summary-text">{finding.leadSummary}</p>

        {/* Responsible AI Notice */}
        <div className="pfc-advisory-banner">
          <Info size={14} className="advisory-icon" />
          <span>
            <strong>Human-in-the-Loop Standard:</strong> Algorithmic confidence reflects mathematical pattern coherence across collected artifacts and <em>does not constitute legal proof of culpability or intentional wrongdoing</em>. Authorized investigators must corroborate all leads against independent facts.
          </span>
        </div>

      </section>

      {/* ══════════════════════════════════════════
          SECTION 1: SUPPORTING EVIDENCE
      ══════════════════════════════════════════ */}
      <section className="findings-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><HardDrive size={14} /></div>
            <div>
              <h3 className="section-title">1. Supporting Evidence Pillars</h3>
              <span className="section-sub">Verified forensic artifacts anchoring the exfiltration hypothesis</span>
            </div>
          </div>
          <span className="sec-count-badge">4 Verified Anchors</span>
        </div>

        <div className="evidence-pillars-grid">
          {finding.supportingEvidence.map((ev, idx) => {
            const Icon = ev.icon
            return (
              <div key={ev.id} className="pillar-card">
                <div className="pillar-top">
                  <div className="pillar-icon"><Icon size={14} /></div>
                  <span className="pillar-time">{ev.timestamp}</span>
                </div>
                <h4 className="pillar-title">{ev.title}</h4>
                <p className="pillar-detail">{ev.detail}</p>
                <div className="pillar-significance">
                  <strong>Investigative Significance:</strong> {ev.significance}
                </div>
                <div className="pillar-footer">
                  <span className="pillar-source">{ev.source}</span>
                  <span className="pillar-verified-badge"><Check size={10} /> Verified</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2: EVIDENCE TIMELINE SEQUENCE
      ══════════════════════════════════════════ */}
      <section className="findings-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><Clock size={14} /></div>
            <div>
              <h3 className="section-title">2. Evidence Timeline Sequence</h3>
              <span className="section-sub">Reconstructed sequence of chronologically aligned events</span>
            </div>
          </div>
          <span className="sec-count-badge">6 Steps (07m 06s Window)</span>
        </div>

        <div className="timeline-seq-track">
          {finding.timelineSequence.map((step, idx, arr) => (
            <div key={step.step} className="timeline-seq-step">
              <div className={`seq-step-card seq-step-card--${step.risk}`}>
                <div className="seq-step-num">Step 0{step.step}</div>
                <span className="seq-step-time">{step.time}</span>
                <span className="seq-step-source">{step.source}</span>
                <p className="seq-step-label">{step.label}</p>
              </div>
              {idx < arr.length - 1 && (
                <div className="seq-arrow-box">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3: WHY THESE EVENTS ARE RELATED
          (Explainable Causal Reasoning)
      ══════════════════════════════════════════ */}
      <section className="findings-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><Brain size={14} /></div>
            <div>
              <h3 className="section-title">3. Why These Events Are Related (AI Causal Explainability)</h3>
              <span className="section-sub">Algorithmic rationale and multi-modal correlation factors</span>
            </div>
          </div>
          <span className="sec-tag">EXPLAINABLE AI REASONING</span>
        </div>

        <div className="reasons-grid">
          {finding.correlationReasons.map((reason, idx) => {
            const Icon = reason.icon
            return (
              <div key={idx} className="reason-card">
                <div className="reason-header">
                  <div className="reason-icon-wrap"><Icon size={14} /></div>
                  <h4 className="reason-title">{reason.title}</h4>
                </div>
                <p className="reason-text">{reason.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4: ALTERNATIVE EXPLANATIONS
      ══════════════════════════════════════════ */}
      <section className="findings-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><Layers size={14} /></div>
            <div>
              <h3 className="section-title">4. Alternative Hypotheses & Competing Explanations</h3>
              <span className="section-sub">Evaluating non-malicious and routine administrative scenarios</span>
            </div>
          </div>
          <span className="sec-count-badge">2 Competing Theories</span>
        </div>

        <div className="alternatives-list">
          {finding.alternativeExplanations.map((alt) => (
            <div key={alt.id} className="alternative-card">
              <div className="alt-header">
                <div className="alt-title-row">
                  <span className="alt-id">{alt.id}</span>
                  <h4 className="alt-title">{alt.title}</h4>
                </div>
                <span className="alt-likelihood-chip">Likelihood: {alt.likelihood}</span>
              </div>

              <p className="alt-desc">{alt.description}</p>

              <div className="alt-facts-grid">
                <div className="alt-facts-col alt-facts-col--supporting">
                  <span className="facts-col-title"><Check size={11} /> Supporting Indicators:</span>
                  <ul>
                    {alt.supportingFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>

                <div className="alt-facts-col alt-facts-col--contradicting">
                  <span className="facts-col-title"><X size={11} /> Contradicting Facts:</span>
                  <ul>
                    {alt.contradictingFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5: MISSING EVIDENCE & BLIND SPOTS
      ══════════════════════════════════════════ */}
      <section className="findings-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><HelpCircle size={14} /></div>
            <div>
              <h3 className="section-title">5. Missing Evidence & Recommended Collection</h3>
              <span className="section-sub">Targeted digital records needed to prove or disprove hypotheses</span>
            </div>
          </div>
          <span className="sec-count-badge">4 Collection Tasks</span>
        </div>

        <div className="missing-evidence-grid">
          {finding.missingEvidence.map((item) => (
            <div key={item.id} className="missing-card">
              <div className="missing-header">
                <span className="missing-cat">{item.category}</span>
                <span className={`urgency-tag urgency-tag--${item.urgency.toLowerCase()}`}>{item.urgency} Urgency</span>
              </div>
              <h4 className="missing-title">{item.title}</h4>
              <p className="missing-reason">{item.reason}</p>
              <button 
                className="missing-action-btn"
                onClick={() => {
                  setActionSuccessMsg(`Collection task for "${item.title}" dispatched to forensic acquisition queue.`)
                  setTimeout(() => setActionSuccessMsg(null), 4000)
                }}
                title="Dispatch acquisition task for this missing evidence"
              >
                <Plus size={12} /> Request Collection Task
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6: INVESTIGATOR ACTIONS & NOTES
          (Human Decision-Making)
      ══════════════════════════════════════════ */}
      <section className="findings-section findings-section--actions">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="sec-icon-box"><UserCheck size={14} /></div>
            <div>
              <h3 className="section-title">6. Investigator Decisions & Case Disposition</h3>
              <span className="section-sub">Human authority actions to accept, request depth, or reject finding</span>
            </div>
          </div>
          <span className="sec-tag">HUMAN-IN-THE-LOOP CONTROL</span>
        </div>

        <div className="actions-control-card">
          <div className="actions-buttons-row">
            <button 
              className={`act-btn act-btn--accept ${investigatorStatus === 'Accepted as Lead' ? 'act-btn--selected' : ''}`}
              onClick={() => handleAction('Accepted as Lead', 'Hypothesis HYP-2026-001 accepted as primary lead. Added to official case theory.')}
              id="btn-accept-lead"
            >
              <CheckCircle2 size={15} />
              <span>Accept as Lead</span>
            </button>

            <button 
              className={`act-btn act-btn--more ${investigatorStatus === 'Requested More Analysis' ? 'act-btn--selected' : ''}`}
              onClick={() => handleAction('Requested More Analysis', 'Dispatched sub-agents to perform deeper PCAP payload extraction and memory dump parsing.')}
              id="btn-request-more"
            >
              <RefreshCw size={15} />
              <span>Request More Analysis</span>
            </button>

            <button 
              className={`act-btn act-btn--reject ${investigatorStatus === 'Rejected' ? 'act-btn--selected' : ''}`}
              onClick={() => handleAction('Rejected', 'Finding HYP-2026-001 marked as rejected by human investigator.')}
              id="btn-reject-finding"
            >
              <X size={15} />
              <span>Reject Finding</span>
            </button>
          </div>

          {/* Investigator Notes Form */}
          <form className="notes-form" onSubmit={handleAddNote}>
            <label className="notes-label">
              <MessageSquare size={12} />
              <span>Add Formal Investigator Commentary & Case Disposition Notes</span>
            </label>
            <textarea
              className="notes-textarea"
              placeholder="Record investigative rationale, interview cross-references, or legal directives regarding this hypothesis..."
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              id="investigator-notes-input"
            />
            <div className="notes-form-footer">
              <span className="notes-audit-text">All investigator decisions and notes are cryptographically signed into the chain of custody audit trail.</span>
              <button type="submit" className="notes-submit-btn" disabled={!notes.trim()}>
                Add Investigator Notes
              </button>
            </div>
          </form>

          {/* Historical Notes Ledger */}
          <div className="notes-history">
            <span className="history-title">Investigator Commentary History</span>
            <div className="history-list">
              {savedNotes.map((n, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-meta">
                    <span className="history-author">{n.author}</span>
                    <span className="history-time">{n.time}</span>
                  </div>
                  <p className="history-text">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
