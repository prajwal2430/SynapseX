import { useState } from 'react'
import {
  ShieldCheck, Shield, CheckCircle2, Lock,
  HardDrive, Clock, User, Building, Cpu,
  FileText, Download, Copy, Check, FileCheck,
  AlertTriangle, ArrowDown, ChevronRight, Hash,
  Database, RefreshCw, Key, ExternalLink, Printer,
  FileCode, Layers, Info
} from 'lucide-react'
import './ChainOfCustody.css'

/* ═══════════════════════════════════════════════════
   CUSTODY EVIDENCE DATASET
═══════════════════════════════════════════════════ */
const CUSTODY_ITEMS = [
  {
    id: 'E-001',
    fileName: 'cctv_camera_01.mp4',
    fileType: 'Video Evidence (MP4 / H.264)',
    size: '2.1 GB',
    sha256: 'a3f1d82c4b7e9f20c1d456a8b3e7f1d9a2c4b6e8f0d2a4c6b8e0f2a4c6b8e0f2',
    sha1: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
    md5: 'e2fc714c4727ee9395f324cd2e7f331f',
    collectionSource: 'CAM-07 Server Room B Physical DVR',
    collectedBy: 'Demo Investigator (Lead Analyst SA)',
    integrityStatus: 'Verified',
    custodyChain: [
      {
        step: 1,
        action: 'Collected',
        actor: 'Demo Investigator (Lead Analyst SA)',
        actorRole: 'Authorized Forensic Collector',
        timestamp: '2026-08-20 09:55:12 UTC',
        locationSystem: 'Server Room B Physical DVR (CAM-07 Terminal)',
        integrityStatus: 'Physical Write-Blocker Attached',
        notes: 'Extracted via Tableau T8u forensic bridge. Bit-stream disk image verified against physical drive serial number.'
      },
      {
        step: 2,
        action: 'Uploaded',
        actor: 'Demo Investigator',
        actorRole: 'Authorized Forensic Collector',
        timestamp: '2026-08-20 10:00:14 UTC',
        locationSystem: 'SynapseX Vault Ingestion Gateway (HTTPS/TLS 1.3)',
        integrityStatus: 'TLS 1.3 In-Flight Encryption Verified',
        notes: 'Transferred directly into encrypted evidence staging bucket with multi-factor authentication token.'
      },
      {
        step: 3,
        action: 'Integrity Verified',
        actor: 'SynapseX Integrity Daemon',
        actorRole: 'Cryptographic Verification Service',
        timestamp: '2026-08-20 10:01:00 UTC',
        locationSystem: 'SynapseX HSM Cryptographic Enclave',
        integrityStatus: 'SHA-256 Verified & Immutable Seal Applied',
        notes: 'SHA-256 hash computed and sealed in tamper-evident ledger block #441092.'
      },
      {
        step: 4,
        action: 'Accessed by Authorized Investigator',
        actor: 'Sr. Analyst (Badge: SA-841)',
        actorRole: 'Lead Investigator (TS/SCI)',
        timestamp: '2026-08-20 10:08:30 UTC',
        locationSystem: 'Forensic Workstation WKST-012 (Isolated Subnet)',
        integrityStatus: 'Read-Only Mounting Verified (Zero-Mutation)',
        notes: 'Read-only loop device mount established for physical corridor movement tracking.'
      },
      {
        step: 5,
        action: 'Processed by Analysis Pipeline',
        actor: 'NEXUS-7 & CCTV AI Agent',
        actorRole: 'Autonomous Computer Vision Agent',
        timestamp: '2026-08-20 10:14:00 UTC',
        locationSystem: 'SynapseX GPU Neural Analysis Cluster #03',
        integrityStatus: 'Deterministic Inference Logged',
        notes: 'Frame-by-frame object tracking and optical character recognition on subject clothing and physical access trajectory.'
      },
      {
        step: 6,
        action: 'Included in Investigation Report',
        actor: 'Report Agent & Lead Investigator',
        actorRole: 'Court Report Compiler',
        timestamp: '2026-08-20 10:30:00 UTC',
        locationSystem: 'Case Report Exporter (STIX 2.1 / NIST 800-86)',
        integrityStatus: 'Cryptographically Certified for Legal Admissibility',
        notes: 'Artifact manifest linked as Exhibit A-01 in formal investigative disclosure dossier.'
      }
    ]
  },
  {
    id: 'E-002',
    fileName: 'windows_event_logs.evtx',
    fileType: 'System Logs (Windows EVTX)',
    size: '48 MB',
    sha256: 'b8c3e1f4d7a0b2e5f8c1d4a7b0e3f6c9d2a5b8e1f4c7d0a3b6e9f2c5d8a1b4e7',
    sha1: '8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9f',
    md5: 'd1eb603b3616dd8284e213bc1d6e220e',
    collectionSource: 'Workstation LAPTOP-07 (WKST-041)',
    collectedBy: 'J. Ramirez (Forensic Specialist)',
    integrityStatus: 'Verified',
    custodyChain: [
      {
        step: 1,
        action: 'Collected',
        actor: 'J. Ramirez (Forensic Specialist)',
        actorRole: 'Remote Incident Responder',
        timestamp: '2026-08-20 10:02:40 UTC',
        locationSystem: 'Endpoint LAPTOP-07 / WKST-041 (C:\\Windows\\System32\\winevt\\Logs)',
        integrityStatus: 'Live Memory Snapshot & Volume Shadow Copy Lock',
        notes: 'Exported Security, System, and PowerShell operational log channels.'
      },
      {
        step: 2,
        action: 'Uploaded',
        actor: 'J. Ramirez',
        actorRole: 'Remote Incident Responder',
        timestamp: '2026-08-20 10:05:30 UTC',
        locationSystem: 'SynapseX Vault Ingestion Gateway',
        integrityStatus: 'Secure TLS 1.3 Ingestion Stream',
        notes: 'Direct streaming upload into active case vault.'
      },
      {
        step: 3,
        action: 'Integrity Verified',
        actor: 'SynapseX Integrity Daemon',
        actorRole: 'Cryptographic Verification Service',
        timestamp: '2026-08-20 10:05:35 UTC',
        locationSystem: 'SynapseX HSM Enclave',
        integrityStatus: 'SHA-256 Verified & Sealed',
        notes: 'SHA-256 hash verified against endpoint generation hash.'
      },
      {
        step: 4,
        action: 'Accessed by Authorized Investigator',
        actor: 'Sr. Analyst (SA)',
        actorRole: 'Lead Investigator',
        timestamp: '2026-08-20 10:15:00 UTC',
        locationSystem: 'Forensic Workstation WKST-012',
        integrityStatus: 'Read-Only Memory Mapping',
        notes: 'Analyzed Event IDs 4624 (Logon), 4672 (Privilege), 4688 (Process Execution).'
      },
      {
        step: 5,
        action: 'Processed by Analysis Pipeline',
        actor: 'Evidence Agent & Timeline Agent',
        actorRole: 'Autonomous Temporal Synthesizer',
        timestamp: '2026-08-20 10:20:00 UTC',
        locationSystem: 'SynapseX Timeline Engine',
        integrityStatus: 'NTP Skew Correction (Zero-Mutation)',
        notes: 'Extracted 4,812 event records; normalized timestamps to UTC standard.'
      },
      {
        step: 6,
        action: 'Included in Investigation Report',
        actor: 'Report Agent',
        actorRole: 'Court Report Compiler',
        timestamp: '2026-08-20 10:30:00 UTC',
        locationSystem: 'Case Report Exporter',
        integrityStatus: 'Exhibit Linked',
        notes: 'Artifact manifest linked as Exhibit B-02.'
      }
    ]
  },
  {
    id: 'E-003',
    fileName: 'firewall_egress_logs.csv',
    fileType: 'Network Logs (CSV / SIEM Export)',
    size: '8.3 MB',
    sha256: 'c9d4f2a6b8e1c3d5f7a9b2e4c6d8f0a2b4e6c8d0f2a4b6e8c0d2f4a6b8e0c2d4',
    sha1: '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9f8e',
    md5: 'c0da5f2a2505cc7173d102ab0c5d119d',
    collectionSource: 'Palo Alto Perimeter FW-CORE-01',
    collectedBy: 'Automated SIEM Connector',
    integrityStatus: 'Verified',
    custodyChain: [
      {
        step: 1,
        action: 'Collected',
        actor: 'Splunk SIEM Collector',
        actorRole: 'Automated Log Streamer',
        timestamp: '2026-08-20 10:10:00 UTC',
        locationSystem: 'Palo Alto FW-CORE-01 Egress Tap',
        integrityStatus: 'Syslog TLS Forwarder Verified',
        notes: 'Filtered egress flows originating from Server Room B subnet.'
      },
      {
        step: 2,
        action: 'Uploaded',
        actor: 'SynapseX Automated Connector',
        actorRole: 'SIEM API Ingest Agent',
        timestamp: '2026-08-20 10:12:00 UTC',
        locationSystem: 'SynapseX Vault Ingestion Gateway',
        integrityStatus: 'API Payload Authentication Validated',
        notes: 'CSV export ingestion.'
      },
      {
        step: 3,
        action: 'Integrity Verified',
        actor: 'SynapseX Integrity Daemon',
        actorRole: 'Cryptographic Service',
        timestamp: '2026-08-20 10:12:05 UTC',
        locationSystem: 'SynapseX HSM Enclave',
        integrityStatus: 'SHA-256 Sealed',
        notes: 'SHA-256 sealed in vault ledger.'
      },
      {
        step: 4,
        action: 'Accessed by Authorized Investigator',
        actor: 'Sr. Analyst (SA)',
        actorRole: 'Lead Investigator',
        timestamp: '2026-08-20 10:18:00 UTC',
        locationSystem: 'Forensic Workstation WKST-012',
        integrityStatus: 'Read-Only Parser Verified',
        notes: 'Identified 1.8 GB encrypted stream to 185.220.101.47.'
      },
      {
        step: 5,
        action: 'Processed by Analysis Pipeline',
        actor: 'Network Agent',
        actorRole: 'Threat Intelligence Matcher',
        timestamp: '2026-08-20 10:22:00 UTC',
        locationSystem: 'SynapseX Threat Intel Feeds',
        integrityStatus: 'Threat Intel Correlation Confirmed',
        notes: 'Matched destination IP 185.220.101.47 to active TOR exit consensus.'
      },
      {
        step: 6,
        action: 'Included in Investigation Report',
        actor: 'Report Agent',
        actorRole: 'Court Report Compiler',
        timestamp: '2026-08-20 10:30:00 UTC',
        locationSystem: 'Case Report Exporter',
        integrityStatus: 'Exhibit Linked',
        notes: 'Artifact manifest linked as Exhibit C-03.'
      }
    ]
  },
  {
    id: 'E-004',
    fileName: 'usb_activity_log.csv',
    fileType: 'Device Activity (CSV / EDR Dump)',
    size: '124 KB',
    sha256: 'd0e5a3c7b9f2d4e6a8c0b2d4f6a8c0b2d4f6a8c0b2d4f6a8c0b2d4f6a8c0b2d4',
    sha1: '6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9f8e7d',
    md5: 'b9c94e1914f4bb6062c0f19a9b4c008c',
    collectionSource: 'Endpoint LAPTOP-07 (CrowdStrike Falcon Sensor)',
    collectedBy: 'Demo Investigator',
    integrityStatus: 'Verified',
    custodyChain: [
      {
        step: 1,
        action: 'Collected',
        actor: 'Demo Investigator',
        actorRole: 'Lead Forensic Investigator',
        timestamp: '2026-08-20 10:06:15 UTC',
        locationSystem: 'Endpoint LAPTOP-07 via CrowdStrike Real-Time Response',
        integrityStatus: 'EDR Forensic Channel Sealed',
        notes: 'Exported USB device insertion history and device serial SDCZ48-128G.'
      },
      {
        step: 2,
        action: 'Uploaded',
        actor: 'Demo Investigator',
        actorRole: 'Lead Forensic Investigator',
        timestamp: '2026-08-20 10:08:00 UTC',
        locationSystem: 'SynapseX Vault Ingestion Gateway',
        integrityStatus: 'TLS 1.3 Ingestion Stream',
        notes: 'Uploaded to SynapseX immutable evidence repository.'
      },
      {
        step: 3,
        action: 'Integrity Verified',
        actor: 'SynapseX Integrity Daemon',
        actorRole: 'Cryptographic Service',
        timestamp: '2026-08-20 10:08:05 UTC',
        locationSystem: 'SynapseX HSM Enclave',
        integrityStatus: 'SHA-256 Sealed',
        notes: 'SHA-256 hash verified and stored.'
      },
      {
        step: 4,
        action: 'Accessed by Authorized Investigator',
        actor: 'Sr. Analyst (SA)',
        actorRole: 'Lead Investigator',
        timestamp: '2026-08-20 10:12:00 UTC',
        locationSystem: 'Forensic Workstation WKST-012',
        integrityStatus: 'Read-Only Inspection Logged',
        notes: 'Confirmed unregistered SanDisk Cruzer Glide serial number.'
      },
      {
        step: 5,
        action: 'Processed by Analysis Pipeline',
        actor: 'Evidence Agent & CIPHER-3',
        actorRole: 'Hardware Fingerprinting Agent',
        timestamp: '2026-08-20 10:22:00 UTC',
        locationSystem: 'SynapseX Hardware Profiler',
        integrityStatus: 'Signature Fingerprint Verified',
        notes: 'USB drive hardware ID mapped to unapproved asset classification.'
      },
      {
        step: 6,
        action: 'Included in Investigation Report',
        actor: 'Report Agent',
        actorRole: 'Court Report Compiler',
        timestamp: '2026-08-20 10:30:00 UTC',
        locationSystem: 'Case Report Exporter',
        integrityStatus: 'Exhibit Linked',
        notes: 'Artifact manifest linked as Exhibit D-04.'
      }
    ]
  }
]

export default function ChainOfCustody() {
  const [selectedItem, setSelectedItem] = useState(CUSTODY_ITEMS[0])
  const [copiedHash, setCopiedHash] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifySuccessMsg, setVerifySuccessMsg] = useState(null)

  const handleCopyHash = () => {
    navigator.clipboard.writeText(selectedItem.sha256)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleReverify = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setVerifySuccessMsg(`SHA-256 hash match confirmed: ${selectedItem.sha256.slice(0, 16)}... (Zero-Mutation Certified)`)
      setTimeout(() => setVerifySuccessMsg(null), 4000)
    }, 900)
  }

  return (
    <div className="custody-page-root">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <header className="custody-page-header">
        <div className="custody-header-left">
          <div className="custody-eyebrow">
            <ShieldCheck size={13} className="custody-eyebrow-icon" />
            <span>Forensic Evidence Handling & Immutable Custody Audit</span>
          </div>
          <h1 className="custody-page-title">Chain of Custody</h1>
          <p className="custody-page-sub">
            CASE-2026-001 · Cryptographically sealed handling logs, cryptographic integrity hashes, and courtroom-admissible chain of custody records adhering to ISO/IEC 27037 and NIST SP 800-86 standards.
          </p>
        </div>

        <div className="custody-header-actions">
          <button className="custody-btn custody-btn--ghost" onClick={handleReverify} disabled={isVerifying}>
            <RefreshCw size={13} className={isVerifying ? 'spin-fast' : ''} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Cryptographic Seal'}</span>
          </button>

          <button 
            className="custody-btn custody-btn--primary"
            onClick={() => window.print()}
            title="Print or save formal Chain of Custody Certificate as PDF"
            id="export-custody-pdf-btn"
          >
            <Printer size={13} />
            <span>Export Custody Certificate (PDF)</span>
          </button>
        </div>
      </header>

      {/* Re-verify Success Banner */}
      {verifySuccessMsg && (
        <div className="custody-alert-banner">
          <CheckCircle2 size={16} />
          <span>{verifySuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EVIDENCE SELECTOR TOOLBAR
      ══════════════════════════════════════════ */}
      <section className="evidence-selector-card">
        <div className="selector-title-row">
          <div className="sel-hdr-left">
            <HardDrive size={14} className="sel-icon" />
            <span className="sel-label">Select Forensic Evidence Artifact:</span>
          </div>
          <span className="sel-count">{CUSTODY_ITEMS.length} Artifacts Sealed in Vault</span>
        </div>

        <div className="evidence-tabs-grid">
          {CUSTODY_ITEMS.map((item) => {
            const isSelected = selectedItem.id === item.id
            return (
              <button
                key={item.id}
                className={`ev-selector-chip ${isSelected ? 'ev-selector-chip--selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="chip-left">
                  <span className="chip-id">{item.id}</span>
                  <strong className="chip-filename">{item.fileName}</strong>
                </div>
                <div className="chip-right">
                  <span className="chip-type">{item.fileType.split(' ')[0]}</span>
                  <span className="chip-status-ok"><Check size={10} /> Verified</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROMINENT INTEGRITY STATUS BANNER
      ══════════════════════════════════════════ */}
      <section className="integrity-seal-banner">
        <div className="seal-left">
          <div className="seal-shield-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="seal-title-row">
              <h2 className="seal-title">✓ Evidence Integrity Verified</h2>
              <span className="seal-status-tag">IMMUTABLE VAULT SEAL</span>
            </div>
            <p className="seal-desc">
              Artifact <strong>{selectedItem.fileName} ({selectedItem.id})</strong> is cryptographically signed and sealed in hardware security enclaves. Zero alterations, deletions, or unauthorized mutations recorded.
            </p>
          </div>
        </div>

        <div className="seal-metrics">
          <div className="seal-metric-cell">
            <span className="sm-k">Ledger Status</span>
            <strong className="sm-v sm-v--green">Sealed Block #441092</strong>
          </div>
          <div className="seal-metric-cell">
            <span className="sm-k">Admissibility Standard</span>
            <strong className="sm-v">ISO/IEC 27037 Compliant</strong>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SELECTED ARTIFACT FORENSIC PROFILE CARD
      ══════════════════════════════════════════ */}
      <section className="artifact-profile-card">
        <div className="apc-header">
          <div className="apc-title-group">
            <div className="apc-icon-box">
              <HardDrive size={18} />
            </div>
            <div>
              <div className="apc-id-row">
                <span className="apc-id">{selectedItem.id}</span>
                <span className="apc-format-tag">{selectedItem.fileType}</span>
                <span className="apc-size-tag">{selectedItem.size}</span>
              </div>
              <h3 className="apc-filename">{selectedItem.fileName}</h3>
            </div>
          </div>

          <div className="apc-status-group">
            <span className="apc-verified-badge">
              <CheckCircle2 size={13} />
              <span>SHA-256 Integrity: Verified</span>
            </span>
          </div>
        </div>

        {/* Cryptographic Hash Blocks */}
        <div className="apc-hashes-grid">
          
          {/* SHA-256 */}
          <div className="hash-block hash-block--primary">
            <div className="hash-label-row">
              <div className="hash-lbl-left">
                <Hash size={11} />
                <span className="hash-algo">SHA-256 Hash (Primary Forensic Seal)</span>
              </div>
              <span className="hash-verified-pill"><Check size={10} /> Verified</span>
            </div>

            <div className="hash-val-row">
              <code className="hash-hex">{selectedItem.sha256}</code>
              <button className="hash-copy-btn" onClick={handleCopyHash} title="Copy SHA-256 hash">
                {copiedHash ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Secondary Hashes (SHA-1 & MD5) */}
          <div className="hash-secondary-row">
            <div className="hash-sub-cell">
              <span className="sub-hash-k">SHA-1:</span>
              <code className="sub-hash-v">{selectedItem.sha1}</code>
            </div>
            <div className="hash-sub-cell">
              <span className="sub-hash-k">MD5:</span>
              <code className="sub-hash-v">{selectedItem.md5}</code>
            </div>
          </div>

        </div>

        {/* Metadata Grid */}
        <div className="apc-meta-grid">
          <div className="apc-meta-item">
            <span className="apc-meta-k">Collection Origin Source:</span>
            <strong className="apc-meta-v">{selectedItem.collectionSource}</strong>
          </div>
          <div className="apc-meta-item">
            <span className="apc-meta-k">Authorized Collector:</span>
            <strong className="apc-meta-v">{selectedItem.collectedBy}</strong>
          </div>
          <div className="apc-meta-item">
            <span className="apc-meta-k">Custody Chain Steps:</span>
            <strong className="apc-meta-v">{selectedItem.custodyChain.length} Documented Handoffs</strong>
          </div>
          <div className="apc-meta-item">
            <span className="apc-meta-k">Storage Repository:</span>
            <strong className="apc-meta-v">SynapseX Vault (WORM Immutable Store)</strong>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CHRONOLOGICAL CUSTODY TIMELINE
      ══════════════════════════════════════════ */}
      <section className="custody-timeline-card">
        <div className="ct-header">
          <div className="ct-title-wrap">
            <div className="ct-icon-box"><ShieldCheck size={14} /></div>
            <div>
              <h3 className="ct-title">Chronological Custody Handling Timeline</h3>
              <span className="ct-sub">Complete audit record from initial physical extraction to court disclosure</span>
            </div>
          </div>
          <span className="ct-tag">AUDIT LOG RECORD</span>
        </div>

        <div className="custody-timeline-stream">
          <div className="ct-vertical-rail" />

          {selectedItem.custodyChain.map((event, idx) => (
            <div key={event.step} className="ct-step-node">
              
              {/* Step Number Circle */}
              <div className="ct-step-marker">
                <span className="marker-num">0{event.step}</span>
                <div className="marker-ping" />
              </div>

              {/* Step Card */}
              <div className="ct-step-card">
                
                {/* Top Row: Action & Timestamp */}
                <div className="ct-card-top">
                  <div className="ct-action-wrap">
                    <span className="ct-action-badge">{event.action}</span>
                    <h4 className="ct-action-title">{event.action}</h4>
                  </div>
                  <span className="ct-timestamp"><Clock size={11} /> {event.timestamp}</span>
                </div>

                {/* Actor & Role */}
                <div className="ct-card-actor-row">
                  <div className="actor-box">
                    <User size={12} className="actor-icon" />
                    <span className="actor-label">Actor / Handler:</span>
                    <strong className="actor-name">{event.actor}</strong>
                    <span className="actor-role">({event.actorRole})</span>
                  </div>
                </div>

                {/* Location & System */}
                <div className="ct-card-location-row">
                  <Building size={12} className="loc-icon" />
                  <span className="loc-label">Location / System:</span>
                  <span className="loc-text">{event.locationSystem}</span>
                </div>

                {/* Integrity Status Pill */}
                <div className="ct-card-integrity-row">
                  <div className="integrity-status-pill">
                    <CheckCircle2 size={12} className="isp-icon" />
                    <span className="isp-label">Integrity Status:</span>
                    <strong className="isp-val">{event.integrityStatus}</strong>
                  </div>
                </div>

                {/* Audit Notes */}
                <p className="ct-card-notes">{event.notes}</p>

              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
