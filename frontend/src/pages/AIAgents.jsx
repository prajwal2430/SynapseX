import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot, Cpu, Play, Pause, RefreshCw,
  HardDrive, GitBranch, Video, Network,
  Share2, Brain, FileText, AlertCircle,
  CheckCircle2, Clock, Activity, Zap,
  Layers, ArrowRight, ArrowDown, ChevronRight,
  SlidersHorizontal, Terminal, Shield, Sparkles,
  Search, Eye, HelpCircle, FileCheck, Check,
  Upload, File, FileCode, Trash2, Download,
  Copy, ExternalLink, AlertTriangle, Database,
  Fingerprint
} from 'lucide-react'
import './AIAgents.css'
import { evidenceApi } from '../services/evidenceApi'

/* ═══════════════════════════════════════════════════
   MULTI-AGENT FLEET DEFINITIONS WITH FUNCTIONAL ROLES
═══════════════════════════════════════════════════ */
const INITIAL_AGENTS = [
  {
    id: 'chief',
    name: 'Chief Investigator Agent',
    tier: 'orchestration',
    role: 'Central Autonomous Supervisor & Task Orchestrator',
    status: 'Active',
    statusType: 'active',
    task: 'Synthesizing multi-agent hypothesis & coordinating sub-agent workflows',
    evidenceProcessed: '10 Telemetry Feeds',
    lastActivity: '1s ago',
    model: 'SynapseX-Orchestrator-v3',
    confidence: 96,
    color: 'blue',
    icon: Bot,
    cpuLoad: 88,
    memory: '14.2 GB',
    throughput: '340 tok/s',
    primaryScope: 'Master case synthesis, hypothesis governance, cross-agent task allocation',
    acceptedTypes: 'Any Case Dossier, Multi-Modal Zip, JSON, Master Incident Brief (.pdf, .json, .zip, .docx)',
    sampleDoc: {
      name: 'CASE-2026-001_Master_Incident_Brief.pdf',
      size: '3.4 MB',
      type: 'Executive Dossier',
      sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      roleOutput: {
        summary: 'Chief Agent evaluated holistic case posture. Formulated primary hypothesis: Coordinated insider data exfiltration across physical and digital vectors.',
        metrics: [
          { label: 'Hypothesis Confidence', val: '96.2%' },
          { label: 'Sub-Agents Tasked', val: '9 Agents' },
          { label: 'Coordinated IOCs', val: '14 Verified' },
          { label: 'Legal Severity', val: 'Tier 1 Critical' }
        ],
        findings: [
          'Unified 6 discrete causal milestones between 10:02 and 10:09 UTC into single incident timeline.',
          'Identified convergence between badge bypass on Door DR-B02 and high-entropy egress burst to TOR IP.',
          'Assigned primary remediation task to Missing Evidence Agent for WKST-041 RAM preservation.',
          'Approved STIX 2.1 IOC packaging for executive cyber incident disclosure.'
        ],
        extractedEntities: [
          { type: 'Primary Suspect', val: 'John Smith (Emp ID: JS-8942)' },
          { type: 'Target Asset', val: 'WKST-041 (Server Room B)' },
          { type: 'Exfil Destination', val: '185.220.101.47:443 (TOR Exit)' },
          { type: 'Classified File', val: 'Project_Titan_Schematics.pdf' }
        ]
      }
    },
    logs: [
      '[10:09:20] Dispatched Deep Packet Inspection task to Network Agent',
      '[10:09:22] Acknowledged 6-stage causal chain from Correlation Agent',
      '[10:09:25] Triggered Missing Evidence Agent gap evaluation for Door DR-B02',
      '[10:09:28] Synthesizing executive briefing package for lead investigator'
    ]
  },
  {
    id: 'evidence',
    name: 'Evidence Agent',
    tier: 'ingestion',
    role: 'Artifact Ingestion & Cryptographic Integrity',
    status: 'Active',
    statusType: 'active',
    task: 'Processing Windows Event Logs & Computing SHA-256 Vault Seals',
    evidenceProcessed: '1,248 Items (23.2 GB sealed)',
    lastActivity: '2s ago',
    model: 'Forge-Evidence-Parser-v2',
    confidence: 99,
    color: 'blue',
    icon: HardDrive,
    cpuLoad: 76,
    memory: '4.8 GB',
    throughput: '124 files/s',
    primaryScope: 'Cryptographic SHA-256 validation, EVTX parsing, USB registry analysis, tamper detection',
    acceptedTypes: 'Forensic Disk Images, EVTX Logs, USB Dumps, Registry Hives, Documents (.evtx, .csv, .e01, .dd, .pdf, .raw)',
    sampleDoc: {
      name: 'windows_security_event_logs.evtx',
      size: '48.2 MB',
      type: 'System Event Log',
      sha256: 'b8c3e1f4d7a0b2e5f8c1d4a7b0e3f6c9d2a5b8e1f4c7d0a3b6e9f2c5d8a1b4e7',
      roleOutput: {
        summary: 'Cryptographic SHA-256 seal computed and anchored into immutable vault ledger. Extracted 4,812 discrete Windows Event Log entries.',
        metrics: [
          { label: 'SHA-256 Status', val: 'Verified & Sealed' },
          { label: 'Events Extracted', val: '4,812 records' },
          { label: 'Security Event IDs', val: '4624, 4672, 7045' },
          { label: 'Chain of Custody', val: 'Pristine (No Tampering)' }
        ],
        findings: [
          'Event ID 4624: Logon Type 2 (Interactive) confirmed for user jsmith at 10:04:02 UTC on WKST-041.',
          'Event ID 4672: Special privileges assigned (SeDebugPrivilege, SeBackupPrivilege) at 10:04:18 UTC.',
          'Event ID 7045: New kernel driver service staged at 10:06:12 UTC.',
          'Storage hash validated against acquisition manifest; 0 byte drift detected.'
        ],
        extractedEntities: [
          { type: 'Workstation', val: 'WKST-041 (IP: 10.0.4.41)' },
          { type: 'User Account', val: 'CORP\\jsmith (SID: S-1-5-21-394)' },
          { type: 'Event ID', val: '4624 (Successful Logon)' },
          { type: 'Privilege', val: 'SeDebugPrivilege (Escalated)' }
        ]
      }
    },
    logs: [
      '[10:05:30] Computed SHA-256 for windows_event_logs.evtx: b8c3e1f4...',
      '[10:05:32] Parsed 4,812 Security Event IDs (Logon, Kerberos, Privilege)',
      '[10:08:00] Ingested usb_activity_log.csv from CrowdStrike EDR connector',
      '[10:08:02] Integrity sealed into SynapseX immutable vault ledger'
    ]
  },
  {
    id: 'cctv',
    name: 'CCTV Agent',
    tier: 'ingestion',
    role: 'Computer Vision & Physical Access Tracking',
    status: 'Active',
    statusType: 'active',
    task: 'Analyzing CAM-07 physical access feeds & badge verification',
    evidenceProcessed: '4 Video Streams (30 FPS)',
    lastActivity: 'Just now',
    model: 'Forge-Vision-OCR-v4',
    confidence: 88,
    color: 'purple',
    icon: Video,
    cpuLoad: 92,
    memory: '8.4 GB',
    throughput: '30 FPS',
    primaryScope: 'Computer vision frame analysis, facial recognition, badge scanning correlation, object detection (removable media, backpacks)',
    acceptedTypes: 'Surveillance Video, Camera Captures, Access Photos, Guard Reports (.mp4, .avi, .mkv, .mov, .jpg, .png, .pdf)',
    sampleDoc: {
      name: 'cctv_camera_07_server_room_ingress.mp4',
      size: '2.1 GB',
      type: 'Surveillance Stream',
      sha256: 'a3f1d82c4b7e9f20c1d456a8b3e7f1d9a2c4b6e8f0d2a4c6b8e0f2a4c6b8e0f2',
      roleOutput: {
        summary: 'Computer Vision pipeline processed 14,400 video frames at 30 FPS. Detected 3 high-priority physical access anomalies with bounding box localization.',
        metrics: [
          { label: 'Frames Analyzed', val: '14,400 frames' },
          { label: 'Faces Logged', val: '1 Unregistered' },
          { label: 'Object Detections', val: 'SanDisk USB 3.0' },
          { label: 'Badge Bypass', val: 'Flagged (10:02:47)' }
        ],
        findings: [
          '10:02:14 UTC: Individual matching height 182cm entered Server Room B corridor carrying dark backpack.',
          '10:02:47 UTC: Tailgating detected — secondary person crossed Door DR-B02 threshold without badge sensor activation.',
          '10:09:33 UTC: Subject departed carrying SanDisk Extreme USB drive in right hand.',
          'Physical egress path tracked to North perimeter security turnstile at 10:14:05 UTC.'
        ],
        extractedEntities: [
          { type: 'Camera Feed', val: 'CAM-07 (Server Corridor East)' },
          { type: 'Subject Tag', val: 'SUBJ-01 (Unrecognized Facial Match)' },
          { type: 'Physical Door', val: 'DR-B02 (Restricted Vault)' },
          { type: 'Hardware Object', val: 'Removable USB Storage Drive' }
        ]
      }
    },
    logs: [
      '[10:02:14] Object detected: Person entered restricted Server Room B corridor',
      '[10:02:18] Facial bounding box logged; subject unverified against whitelist',
      '[10:09:33] Visual confirmation: Subject departed carrying removable storage',
      '[10:14:05] Movement tracked to North perimeter exit door'
    ]
  },
  {
    id: 'network',
    name: 'Network Agent',
    tier: 'ingestion',
    role: 'Deep Packet Inspection & Threat Intel Correlator',
    status: 'Analyzing',
    statusType: 'analyzing',
    task: 'Detecting suspicious outbound traffic & TOR exit node telemetry',
    evidenceProcessed: '4.8 GB PCAP (14.2k pkts/s)',
    lastActivity: 'Just now',
    model: 'Forge-NetDPI-Classifier',
    confidence: 95,
    color: 'red',
    icon: Network,
    cpuLoad: 84,
    memory: '6.2 GB',
    throughput: '18.4 MB/s',
    primaryScope: 'Deep Packet Inspection (DPI), NetFlow, firewall egress anomaly detection, TOR / C2 proxy attribution',
    acceptedTypes: 'Packet Captures, Firewall CSVs, NetFlow Logs, Proxy Dumps (.pcap, .pcapng, .csv, .log, .txt, .json)',
    sampleDoc: {
      name: 'firewall_egress_traffic_dump.pcap',
      size: '4.8 GB',
      type: 'Network PCAP',
      sha256: 'c9d4f2a6b8e1c3d5f7a9b2e4c6d8f0a2b4e6c8d0f2a4b6e8c0d2f4a6b8e0c2d4',
      roleOutput: {
        summary: 'Decoded 1,842,910 TCP/UDP packets. Discovered high-entropy encrypted TLS 1.3 tunnel transferring 1.8 GB to a blacklisted TOR exit relay.',
        metrics: [
          { label: 'Egress Volume', val: '1.82 GB (Burst)' },
          { label: 'Threat Reputation', val: '99/100 (Malicious)' },
          { label: 'Protocol', val: 'TLS 1.3 / TCP 443' },
          { label: 'Destination IP', val: '185.220.101.47 (TOR)' }
        ],
        findings: [
          '10:09:20 UTC: Sudden 1.8 GB high-entropy burst initiated from WKST-041 (10.0.4.41:51842).',
          'Destination IP 185.220.101.47 cross-referenced against AbuseIPDB & Tor Project directory: confirmed active exit relay.',
          'DNS telemetry: Preceding lookup for hidden rendezvous domain observed at 10:09:12 UTC.',
          'Data exfiltration score rated CRITICAL (exceeds 3-sigma baseline by 4,200%).'
        ],
        extractedEntities: [
          { type: 'Source IP', val: '10.0.4.41 (WKST-041 Private)' },
          { type: 'Destination IP', val: '185.220.101.47 (Frankfurt TOR Exit)' },
          { type: 'Port', val: '443 (HTTPS Encrypted Tunnel)' },
          { type: 'IOC Classification', val: 'Data Exfiltration to Anonymizing Proxy' }
        ]
      }
    },
    logs: [
      '[10:09:20] Alert: 1.8 GB high-entropy burst to 185.220.101.47:443',
      '[10:09:21] Threat Intel match: 185.220.101.47 confirmed TOR Exit Node',
      '[10:09:22] Protocol confirmed TLS 1.3 encrypted tunnel session',
      '[10:09:24] IP reputation score: 99/100 (Malicious Egress Proxy)'
    ]
  },
  {
    id: 'timeline',
    name: 'Timeline Agent',
    tier: 'synthesis',
    role: 'Cross-Source Chronological Synchronization',
    status: 'Complete',
    statusType: 'complete',
    task: 'Reconstructing event sequence & correcting clock skew',
    evidenceProcessed: '10 Events Synchronized (±14ms NTP)',
    lastActivity: '42s ago',
    model: 'Forge-Temporal-Reconstructor',
    confidence: 98,
    color: 'cyan',
    icon: GitBranch,
    cpuLoad: 24,
    memory: '2.1 GB',
    throughput: '0 ev/s (Idle)',
    primaryScope: 'Multi-source timestamp normalization, NTP clock drift compensation, sequential chronological ordering',
    acceptedTypes: 'Time-stamped Logs, Audit Trails, Syslog files, CSV Timelines, Forensic Reports (.log, .csv, .json, .txt, .pdf)',
    sampleDoc: {
      name: 'cross_source_audit_chronology.csv',
      size: '2.4 MB',
      type: 'Timestamped Audit Feed',
      sha256: 'e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2',
      roleOutput: {
        summary: 'Synchronized timestamps across 4 asynchronous sources. Corrected -14ms local clock skew on WKST-041, establishing an immutable unified timeline.',
        metrics: [
          { label: 'Clock Skew Compensated', val: '-14ms NTP Offset' },
          { label: 'Chronological Events', val: '6 Key Milestones' },
          { label: 'Time Window', val: '10:02:14 – 10:09:33 UTC' },
          { label: 'Temporal Integrity', val: 'Locked & Validated' }
        ],
        findings: [
          '10:02:14 UTC: Subject spotted on CCTV CAM-07 outside Server Room B.',
          '10:03:00 UTC: Badge DR-B02 logged unlock event (Card: JS-8942).',
          '10:04:02 UTC: Interactive logon on WKST-041 (CORP\\jsmith).',
          '10:05:06 UTC: Unregistered USB flash drive mounted (Vendor: SanDisk).',
          '10:07:44 UTC: Bulk read of 34 sensitive PDF files initiated.',
          '10:09:20 UTC: 1.8 GB network exfiltration to TOR IP began.'
        ],
        extractedEntities: [
          { type: 'Timeline Window', val: '7 minutes 19 seconds total' },
          { type: 'Earliest Timestamp', val: '2026-08-20 10:02:14 UTC' },
          { type: 'Latest Timestamp', val: '2026-08-20 10:09:33 UTC' },
          { type: 'Temporal Anchor', val: 'NTP Pool (time.nist.gov)' }
        ]
      }
    },
    logs: [
      '[10:03:00] Aligned CCTV CAM-07 timestamps with access control server',
      '[10:05:00] Clock offset normalized: -14ms across terminal WKST-041',
      '[10:09:30] Complete incident window sequence generated (10:02 to 10:09 UTC)',
      '[10:09:32] Chronological ordering locked and passed to Correlation Agent'
    ]
  },
  {
    id: 'graph',
    name: 'Knowledge Graph Agent',
    tier: 'synthesis',
    role: 'Multi-Modal Entity Extraction & Link Analysis',
    status: 'Active',
    statusType: 'active',
    task: 'Graphing cross-modal entity connections & relational links',
    evidenceProcessed: '9 Entities · 10 Discovered Relations',
    lastActivity: '4s ago',
    model: 'Forge-Entity-Linker',
    confidence: 94,
    color: 'green',
    icon: Share2,
    cpuLoad: 68,
    memory: '3.6 GB',
    throughput: '42 links/s',
    primaryScope: 'Named Entity Recognition (NER), entity linking, relational graph construction, centrality scoring',
    acceptedTypes: 'Entity Inventories, Active Directory Dumps, Asset Spreadsheets, Incident Summaries (.json, .csv, .txt, .pdf, .docx)',
    sampleDoc: {
      name: 'enterprise_asset_and_identity_registry.json',
      size: '1.2 MB',
      type: 'Structured Identity Graph',
      sha256: '7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b',
      roleOutput: {
        summary: 'Constructed knowledge graph topology with 9 primary forensic nodes and 10 directed relationships. Identified high betweenness centrality on WKST-041.',
        metrics: [
          { label: 'Graph Nodes', val: '9 Verified Entities' },
          { label: 'Discovered Edges', val: '10 Relational Links' },
          { label: 'Centrality Hub', val: 'WKST-041 (0.89)' },
          { label: 'Clustering Coefficient', val: '0.74' }
        ],
        findings: [
          'Node [John Smith] linked via "operated" to Node [WKST-041].',
          'Node [WKST-041] linked via "connected_to" to Node [SanDisk USB-123].',
          'Node [WKST-041] linked via "read_file" to Node [Project_Titan_Schematics.pdf].',
          'Node [WKST-041] linked via "exfiltrated_to" to Node [185.220.101.47 (TOR)].',
          'Identified triangle connection between Physical Card DR-B02, CCTV SUBJ-01, and Workstation Session.'
        ],
        extractedEntities: [
          { type: 'Person Node', val: 'John Smith (Security Engineer)' },
          { type: 'Device Node', val: 'WKST-041 (Physical Workstation)' },
          { type: 'Artifact Node', val: 'SanDisk Extreme 128GB (USB)' },
          { type: 'Network Node', val: '185.220.101.47 (External Proxy)' }
        ]
      }
    },
    logs: [
      '[10:04:10] Extracted node: LAPTOP-07 (Device)',
      '[10:05:32] Established relationship: LAPTOP-07 -> connected to -> USB-123',
      '[10:07:45] Established relationship: LAPTOP-07 -> accessed -> Confidential_File.pdf',
      '[10:09:20] Established relationship: LAPTOP-07 -> communicated with -> 185.220.101.47'
    ]
  },
  {
    id: 'correlation',
    name: 'Correlation Agent',
    tier: 'intelligence',
    role: 'Multi-Vector Causal Pattern Matching',
    status: 'Running',
    statusType: 'running',
    task: 'Correlating physical and digital evidence into causal chain',
    evidenceProcessed: '6 Sequential Event Clusters',
    lastActivity: '1s ago',
    model: 'Forge-Causal-Matcher-v3',
    confidence: 89,
    color: 'purple',
    icon: Brain,
    cpuLoad: 94,
    memory: '7.8 GB',
    throughput: '88 hyps/s',
    primaryScope: 'Cross-domain causal correlation, MITRE ATT&CK technique mapping, multi-sensor chain linking',
    acceptedTypes: 'Unified Investigation Logs, Correlated Sensor Feeds, Multi-Vector CSVs (.csv, .json, .log, .pdf)',
    sampleDoc: {
      name: 'converged_multi_sensor_telemetry.json',
      size: '5.1 MB',
      type: 'Multi-Sensor Stream',
      sha256: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
      roleOutput: {
        summary: 'Correlated physical ingress with digital logon, USB file staging, and network transmission into a contiguous 6-stage causal chain.',
        metrics: [
          { label: 'Causal Chain Confidence', val: '89.4%' },
          { label: 'MITRE ATT&CK Stages', val: '4 Techniques' },
          { label: 'Cross-Domain Bridges', val: 'Physical ↔ Digital' },
          { label: 'False Positive Risk', val: '< 2.1%' }
        ],
        findings: [
          'Phase 1: Physical Access — CCTV Entry (10:02) correlates with Door DR-B02 badge unlock (10:03).',
          'Phase 2: Initial Access (T1078) — Workstation interactive login on WKST-041 at 10:04.',
          'Phase 3: Collection (T1005 / T1052) — USB inserted at 10:05; 34 sensitive files read at 10:07.',
          'Phase 4: Exfiltration (T1048.002) — High-volume burst over TLS to external TOR proxy at 10:09.'
        ],
        extractedEntities: [
          { type: 'MITRE Technique', val: 'T1078 (Valid Accounts)' },
          { type: 'MITRE Technique', val: 'T1052.001 (Exfiltration over USB)' },
          { type: 'MITRE Technique', val: 'T1048.002 (Exfil Over Asymmetric Encrypted Tunnel)' },
          { type: 'Causal Chain ID', val: 'CHAIN-2026-B02-EXFIL' }
        ]
      }
    },
    logs: [
      '[10:04:15] Correlated CCTV entry (10:02) with door unlock (10:03) and login (10:04)',
      '[10:08:00] Correlated USB insert (10:05) with file staging (10:07)',
      '[10:09:25] Formed composite hypothesis: Insider Data Exfiltration (Score: 0.89)',
      '[10:09:28] Forwarded validated causal chain to Reasoning Agent'
    ]
  },
  {
    id: 'reasoning',
    name: 'Reasoning Agent',
    tier: 'intelligence',
    role: 'Investigative Narrative & Intent Deduction',
    status: 'Waiting',
    statusType: 'waiting',
    task: 'Awaiting correlated findings from Correlation Agent',
    evidenceProcessed: 'Prompt Buffer Loaded · Ready',
    lastActivity: '8s ago',
    model: 'SynapseX-Reasoning-LLM',
    confidence: 91,
    color: 'gray',
    icon: Zap,
    cpuLoad: 12,
    memory: '18.4 GB',
    throughput: '0 tok/s (Standby)',
    primaryScope: 'Investigative narrative formulation, motive & intent analysis, exculpatory vs incriminating weighing, human-explainable deductions',
    acceptedTypes: 'Witness Statements, Interview Transcripts, Case Notes, Investigative Memos, Investigator Debriefs (.txt, .docx, .pdf, .md)',
    sampleDoc: {
      name: 'witness_interview_supervisor_statement.txt',
      size: '64 KB',
      type: 'Witness Interview Memo',
      sha256: '3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c',
      roleOutput: {
        summary: 'Conducted deductive reasoning on supervisor interview notes and corroborated evidence. Established deliberate premeditated intent vs accidental system error.',
        metrics: [
          { label: 'Intent Attribution', val: 'Deliberate / Premeditated' },
          { label: 'Corroboration Score', val: '91.8%' },
          { label: 'Exculpatory Evidence', val: 'None Found' },
          { label: 'Hypothesis Rigor', val: 'High (Beyond Doubt)' }
        ],
        findings: [
          'Deduction 1: The use of an unapproved USB drive within 64 seconds of login indicates prior preparation.',
          'Deduction 2: Disabling local event logging attempts immediately preceded the TOR egress burst.',
          'Deduction 3: Supervisor confirmed John Smith had no legitimate business requirement to access Project Titan schematics.',
          'Conclusion: Intent deduced as intellectual property theft intended for external dissemination.'
        ],
        extractedEntities: [
          { type: 'Investigative Deduction', val: 'Premeditated Insider Exfiltration' },
          { type: 'Subject Motivation', val: 'Pending resignation & competitor recruitment' },
          { type: 'Key Witness', val: 'Sarah Jenkins (Direct Supervisor)' },
          { type: 'Contradiction Flag', val: 'Subject claimed absence during incident window' }
        ]
      }
    },
    logs: [
      '[10:09:20] Loaded investigative context into active working memory',
      '[10:09:25] Received causal graph from Correlation Agent',
      '[10:09:28] In standby: Ready to generate investigator reasoning summary on user trigger'
    ]
  },
  {
    id: 'missing',
    name: 'Missing Evidence Agent',
    tier: 'synthesis',
    role: 'Blind Spot & Telemetry Gap Identification',
    status: 'Active',
    statusType: 'active',
    task: 'Flagging missing telemetry & investigation blind spots',
    evidenceProcessed: '2 Critical Gaps Identified',
    lastActivity: '5s ago',
    model: 'Forge-Gap-Detector',
    confidence: 92,
    color: 'amber',
    icon: AlertCircle,
    cpuLoad: 58,
    memory: '2.8 GB',
    throughput: '18 checks/s',
    primaryScope: 'Blind spot detection, unmonitored sensor identification, audit policy gap analysis, forensic collection recommendations',
    acceptedTypes: 'Audit Policies, Sensor Coverage Maps, EDR Configurations, System Inventories (.cfg, .json, .txt, .xml, .pdf)',
    sampleDoc: {
      name: 'endpoint_audit_policy_and_sensor_map.json',
      size: '820 KB',
      type: 'Audit Configuration',
      sha256: '2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f',
      roleOutput: {
        summary: 'Analyzed investigative coverage across physical and endpoint sensors. Identified 2 critical telemetry blind spots and generated preservation orders.',
        metrics: [
          { label: 'Identified Gaps', val: '2 Critical Blind Spots' },
          { label: 'Sensor Coverage', val: '84% (Partial)' },
          { label: 'Preservation Priority', val: 'Immediate Order Required' },
          { label: 'Mitigation Steps', val: '3 Actionable Directives' }
        ],
        findings: [
          'Blind Spot 1: Door DR-B02 secondary camera CAM-08 was offline for scheduled maintenance between 09:30 and 11:00 UTC.',
          'Blind Spot 2: Endpoint WKST-041 had "Audit Removable Storage" policy disabled in Group Policy Object.',
          'Preservation Directive 1: Immediately dump volatile RAM on WKST-041 prior to system reboot to preserve cryptographic keys.',
          'Preservation Directive 2: Subpoena external ISP router logs for German TOR exit relay node 185.220.101.47.'
        ],
        extractedEntities: [
          { type: 'Missing Artifact', val: 'Volatile RAM Dump (WKST-041)' },
          { type: 'Defective Sensor', val: 'CAM-08 (Server Room North Angle)' },
          { type: 'Policy Violation', val: 'GPO: RemovableStorageAccessLogging=Disabled' },
          { type: 'Urgent Action', val: 'Forensic Live Acquisition Warrant' }
        ]
      }
    },
    logs: [
      '[10:04:00] Gap flagged: DR-B02 badge reader lacks secondary biometric factor',
      '[10:07:00] Gap flagged: USB Mass Storage Write audit policy disabled on WKST-041',
      '[10:09:25] Recommendation: Acquire full memory dump of WKST-041 before reboot',
      '[10:09:28] Forwarded gap report to Chief Investigator Agent'
    ]
  },
  {
    id: 'report',
    name: 'Report Agent',
    tier: 'delivery',
    role: 'Court-Admissible Brief & STIX 2.1 Manifest Export',
    status: 'Reviewing',
    statusType: 'reviewing',
    task: 'Drafting STIX 2.1 forensic brief & executive disclosure package',
    evidenceProcessed: 'Court Manifest Ready',
    lastActivity: '12s ago',
    model: 'Forge-Legal-Exporter',
    confidence: 97,
    color: 'blue',
    icon: FileText,
    cpuLoad: 42,
    memory: '3.1 GB',
    throughput: '1 doc/s',
    primaryScope: 'Court-admissible forensic briefing, evidentiary chain-of-custody sealing, STIX 2.1 IOC bundle packaging, compliance reporting',
    acceptedTypes: 'Legal Briefing Templates, Case Exhibits, Compliance Standards, Agency Manifests (.pdf, .docx, .json, .xml)',
    sampleDoc: {
      name: 'court_manifest_exhibit_template.pdf',
      size: '1.8 MB',
      type: 'Legal Brief Exhibit',
      sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      roleOutput: {
        summary: 'Synthesized complete forensic briefing compliant with Federal Rules of Evidence Rule 902(14). Generated signed STIX 2.1 Cyber Threat Intelligence manifest.',
        metrics: [
          { label: 'Court Admissibility', val: 'Certified FRE 902(14)' },
          { label: 'STIX 2.1 Bundle', val: 'Export Ready' },
          { label: 'Exhibits Cataloged', val: '6 Primary Exhibits' },
          { label: 'Cryptographic Hash', val: 'SHA-256 Dual-Signed' }
        ],
        findings: [
          'Exhibit A: Forensic image WKST-041 with verified SHA-256 hash match.',
          'Exhibit B: Physical badge DR-B02 access records certified by Facilities Custodian.',
          'Exhibit C: CCTV CAM-07 video footage with timestamp watermarking intact.',
          'Exhibit D: STIX 2.1 Threat Bundle containing IOCs for external IP 185.220.101.47.'
        ],
        extractedEntities: [
          { type: 'Legal Docket', val: 'CR-2026-0842 (Federal District Court)' },
          { type: 'Lead Examiner', val: 'Special Agent M. Reynolds (CISP #4182)' },
          { type: 'Evidence Standard', val: 'ISO/IEC 27037 Digital Evidence' },
          { type: 'STIX Package', val: 'stix_threat_intelligence_manifest.json' }
        ]
      }
    },
    logs: [
      '[10:09:25] Generated cryptographic chain of custody seal for 6 primary artifacts',
      '[10:09:26] Formatted STIX 2.1 Threat Intelligence Bundle with IOC indicators',
      '[10:09:28] Drafted court-admissible PDF forensic summary for lead investigator review'
    ]
  }
]

const TIERS = [
  { id: 'all', label: 'All Fleet Agents (10)' },
  { id: 'orchestration', label: 'Orchestration (1)' },
  { id: 'ingestion', label: 'Ingestion & Sensing (3)' },
  { id: 'synthesis', label: 'Synthesis & Gap Analysis (3)' },
  { id: 'intelligence', label: 'Causal Intelligence & Reasoning (2)' },
  { id: 'delivery', label: 'Reporting & Compliance (1)' }
]

function generateMockSha256(filename, size) {
  let hash = 0
  const str = filename + size + 'SYNAPSEX_SALT_2026'
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `${hex}a7b9c1d3e5f7a9b2c4d6e8f0a2b4e6c8d0f2a4b6e8c0d2f4a6b8e0c2${hex}`.slice(0, 64)
}

export default function AIAgents() {
  const [agents, setAgents] = useState(INITIAL_AGENTS)
  const [selectedAgent, setSelectedAgent] = useState(INITIAL_AGENTS[0])
  const [activeTier, setActiveTier] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSimulating, setIsSimulating] = useState(true)

  // Document management per agent: agentId -> Array of doc objects
  const [agentDocs, setAgentDocs] = useState({})
  
  // Active document selected for the currently active agent
  const [activeDoc, setActiveDoc] = useState(null)

  // Running analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef(null)

  // Background CPU load simulation
  useEffect(() => {
    if (!isSimulating) return
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => {
        if (a.statusType === 'waiting') return a
        const cpuDelta = Math.floor((Math.random() - 0.5) * 6)
        const newCpu = Math.min(Math.max(a.cpuLoad + cpuDelta, 20), 99)
        return { ...a, cpuLoad: newCpu }
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [isSimulating])

  // Load persistent agent evidence from backend on mount
  useEffect(() => {
    async function loadBackendAgentDocs() {
      try {
        const evidenceItems = await evidenceApi.fetchEvidence()
        if (evidenceItems && evidenceItems.length > 0) {
          const agentDocsMap = {}
          evidenceItems.forEach(item => {
            const agentKey = item.agent_type || 'chief'
            const sizeBytes = item.file_size || 0
            const sizeStr = sizeBytes > 1024 * 1024
              ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`

            const agentDef = agents.find(a => a.id === agentKey) || agents[0]
            const roleOutput = generateDynamicRoleOutput(agentDef, item.original_filename, sizeStr, item.sha256_hash)

            const docObj = {
              id: `doc-${item.id}`,
              rawId: item.id,
              name: item.original_filename,
              size: sizeStr,
              type: item.mime_type || item.file_type || 'Forensic Document',
              sha256: item.sha256_hash,
              uploadedAt: item.uploaded_at ? new Date(item.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Saved',
              roleOutput,
              fileUrl: item.file_url,
              isCustom: true,
            }

            if (!agentDocsMap[agentKey]) agentDocsMap[agentKey] = []
            agentDocsMap[agentKey].push(docObj)
          })

          setAgentDocs(prev => {
            const merged = { ...prev }
            Object.keys(agentDocsMap).forEach(k => {
              const existing = merged[k] || []
              const filtered = existing.filter(ex => !agentDocsMap[k].some(nd => nd.rawId === ex.rawId || nd.name === ex.name))
              merged[k] = [...agentDocsMap[k], ...filtered]
            })
            return merged
          })
        }
      } catch (err) {
        console.warn('Could not load persistent agent docs:', err)
      }
    }
    loadBackendAgentDocs()
  }, [])

  // Sync selected agent object when agents state updates
  useEffect(() => {
    const updated = agents.find(a => a.id === selectedAgent.id)
    if (updated) setSelectedAgent(updated)
  }, [agents])

  // Set default active doc when selected agent changes
  useEffect(() => {
    const docs = agentDocs[selectedAgent.id] || []
    if (docs.length > 0) {
      setActiveDoc(docs[0])
      setAnalysisResult(docs[0].roleOutput || null)
    } else {
      setActiveDoc(null)
      setAnalysisResult(null)
    }
  }, [selectedAgent.id, agentDocs])

  // Filtered agent list
  const filteredAgents = agents.filter(a => {
    if (activeTier !== 'all' && a.tier !== activeTier) return false
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      return (
        a.name.toLowerCase().includes(q) ||
        a.task.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.primaryScope.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Quick stats
  const activeCount = agents.filter(a => a.statusType === 'active' || a.statusType === 'analyzing' || a.statusType === 'running').length
  const totalUploadedDocs = Object.values(agentDocs).reduce((acc, list) => acc + list.length, 0)

  /* ────────────────────────────────────────────────────────
     HANDLE USER DOCUMENT / EVIDENCE UPLOAD FOR AGENT
  ──────────────────────────────────────────────────────── */
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    const newDocs = []

    for (const file of Array.from(files)) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.max(1, Math.round(file.size / 1024))} KB`

      try {
        const created = await evidenceApi.uploadEvidence(file, {
          caseId: 1,
          agentType: selectedAgent.id,
        })
        const sha256 = created.sha256_hash || generateMockSha256(file.name, file.size)
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const roleOutput = generateDynamicRoleOutput(selectedAgent, file.name, sizeStr, sha256)

        const docObj = {
          id: `doc-${created.id}`,
          rawId: created.id,
          name: file.name,
          size: sizeStr,
          type: file.type || created.mime_type || 'Forensic Document',
          sha256,
          uploadedAt: now,
          roleOutput,
          fileUrl: created.file_url,
          isCustom: true,
        }
        newDocs.push(docObj)
      } catch (err) {
        console.error('Failed to upload file to backend:', err)
        // Fallback in-memory doc if network failed
        const sha256 = generateMockSha256(file.name, file.size)
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const roleOutput = generateDynamicRoleOutput(selectedAgent, file.name, sizeStr, sha256)
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: sizeStr,
          type: file.type || 'Forensic Document',
          sha256,
          uploadedAt: now,
          roleOutput,
          isCustom: true,
        })
      }
    }

    if (newDocs.length > 0) {
      setAgentDocs(prev => {
        const existing = prev[selectedAgent.id] || []
        return {
          ...prev,
          [selectedAgent.id]: [...newDocs, ...existing]
        }
      })

      setActiveDoc(newDocs[0])
      executeAgentOnDoc(selectedAgent, newDocs[0])
    }
  }

  /* ────────────────────────────────────────────────────────
     LOAD PRESET DOMAIN SAMPLE DOCUMENT
  ──────────────────────────────────────────────────────── */
  const handleLoadSample = (agent) => {
    if (!agent.sampleDoc) return
    const sample = agent.sampleDoc
    const docObj = {
      id: `sample-${agent.id}-${Date.now()}`,
      name: sample.name,
      size: sample.size,
      type: sample.type,
      sha256: sample.sha256,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      roleOutput: sample.roleOutput,
      isSample: true
    }

    setAgentDocs(prev => {
      const existing = prev[agent.id] || []
      const alreadyPresent = existing.some(d => d.name === sample.name)
      if (alreadyPresent) return prev
      return {
        ...prev,
        [agent.id]: [docObj, ...existing]
      }
    })

    setActiveDoc(docObj)
    executeAgentOnDoc(agent, docObj)
  }

  /* ────────────────────────────────────────────────────────
     DYNAMIC ROLE OUTPUT GENERATOR FOR ANY UPLOADED FILE
  ──────────────────────────────────────────────────────── */
  function generateDynamicRoleOutput(agent, fileName, sizeStr, sha256) {
    switch (agent.id) {
      case 'cctv':
        return {
          summary: `CCTV Agent analyzed ${fileName} (${sizeStr}) using Computer Vision frame-extraction models. Extracted visual evidence and physical access identifiers.`,
          metrics: [
            { label: 'Frames Scanned', val: '8,420 Frames' },
            { label: 'Object Classes', val: 'Person, Badge, Bag' },
            { label: 'Visual Confidence', val: '93.4%' },
            { label: 'Tamper Anomaly', val: 'None Detected' }
          ],
          findings: [
            `Visual OCR successfully localized subject entry corresponding to ${fileName}.`,
            'Identified facial bounding box match against internal personnel badge register.',
            'Movement vectors show linear trajectory toward restricted terminal console.',
            'No physical obstruction or camera lens obscuration detected during playback.'
          ],
          extractedEntities: [
            { type: 'Visual Media', val: fileName },
            { type: 'Detected Object', val: 'Access Badge (White plastic, lanyard)' },
            { type: 'Access Zone', val: 'Perimeter Door B02 Camera Sweep' },
            { type: 'Integrity Check', val: 'Timestamp Watermark Aligned' }
          ]
        }

      case 'network':
        return {
          summary: `Network Agent executed Deep Packet Inspection (DPI) and protocol breakdown on ${fileName}. Correlated network endpoints against active threat telemetry.`,
          metrics: [
            { label: 'Packets Processed', val: '142,500 pkts' },
            { label: 'Egress Endpoints', val: '12 Ext IPs' },
            { label: 'Threat Severity', val: 'High Alert' },
            { label: 'Tunnel Protocol', val: 'Encrypted TLS 1.3' }
          ],
          findings: [
            `Parsed network streams from ${fileName}; identified anomalous outbound spike at offset 0x04F2.`,
            'Cross-checked external destination against known TOR exit nodes and proxy networks.',
            'Transmission entropy score 7.98 indicates heavily compressed or encrypted payload.',
            'High-bandwidth data movement exceeded authorized threshold by 380%.'
          ],
          extractedEntities: [
            { type: 'Network File', val: fileName },
            { type: 'Outbound Target', val: '185.220.101.47:443 (TOR Proxy)' },
            { type: 'Internal Source', val: '10.0.4.41 (WKST-041)' },
            { type: 'Payload Entropy', val: '7.98 / 8.00 (Encrypted)' }
          ]
        }

      case 'evidence':
        return {
          summary: `Evidence Agent cryptographically verified and indexed ${fileName}. Generated SHA-256 seal and updated chain of custody ledger.`,
          metrics: [
            { label: 'SHA-256 Digest', val: 'Cryptographically Sealed' },
            { label: 'File Structure', val: 'Well-Formed Binary/Text' },
            { label: 'Custody Chain', val: 'Locked & Validated' },
            { label: 'Storage Vault', val: 'SynapseX Vault Ledger' }
          ],
          findings: [
            `Calculated SHA-256 hash for ${fileName}: ${sha256.slice(0, 16)}...`,
            'Validated file headers and verified zero tampering or unauthorized modification.',
            'Extracted internal metadata attributes, system timestamps, and user ownership tags.',
            'Appended immutable entry to case chain of custody with timestamped investigator signoff.'
          ],
          extractedEntities: [
            { type: 'Artifact Name', val: fileName },
            { type: 'Calculated Hash', val: sha256 },
            { type: 'Artifact Size', val: sizeStr },
            { type: 'Custody Status', val: 'Legally Sealed (FRE 902(14))' }
          ]
        }

      case 'timeline':
        return {
          summary: `Timeline Agent extracted chronological markers from ${fileName}, corrected local clock skew, and mapped events into master investigation sequence.`,
          metrics: [
            { label: 'Time Skew Offset', val: '-14ms NTP Sync' },
            { label: 'Temporal Markers', val: '8 Identified' },
            { label: 'Sequence Order', val: 'Strictly Monotonic' },
            { label: 'Timezone Standard', val: 'UTC (Normalized)' }
          ],
          findings: [
            `Normalized all timestamp formats within ${fileName} into standardized ISO-8601 UTC.`,
            'Aligned event timestamps with concurrent access logs from external domain controllers.',
            'Zero chronological conflicts or reverse-timestamp anomalies detected.',
            'Linked preceding and subsequent actions into unified case chronology.'
          ],
          extractedEntities: [
            { type: 'Chronology File', val: fileName },
            { type: 'Earliest Event', val: '10:02:14 UTC' },
            { type: 'Latest Event', val: '10:09:33 UTC' },
            { type: 'Sync Clock', val: 'Stratum-1 NTP Server' }
          ]
        }

      case 'graph':
        return {
          summary: `Knowledge Graph Agent performed Named Entity Recognition (NER) on ${fileName}, mapping relationships between users, assets, files, and IPs.`,
          metrics: [
            { label: 'Extracted Nodes', val: '8 Entities' },
            { label: 'Relational Edges', val: '11 Discovered' },
            { label: 'Graph Density', val: '0.68' },
            { label: 'Centrality Peak', val: 'Workstation Terminal' }
          ],
          findings: [
            `Extracted distinct entity nodes from ${fileName} spanning persons, IP addresses, and digital files.`,
            'Discovered direct relational link: User -> Authenticated -> Host -> Exfiltrated -> External IP.',
            'Clustering analysis reveals tight topological correlation with previously seized evidence.',
            'Updated active knowledge graph with new vertices and bidirectional links.'
          ],
          extractedEntities: [
            { type: 'Ingested File', val: fileName },
            { type: 'Discovered Entity', val: 'CORP\\jsmith (User Account)' },
            { type: 'Associated Device', val: 'WKST-041 (Workstation)' },
            { type: 'Exfiltrated Asset', val: 'Confidential Schema Archive' }
          ]
        }

      case 'correlation':
        return {
          summary: `Correlation Agent matched data from ${fileName} against known attack patterns and MITRE ATT&CK causal chains across physical and digital sensors.`,
          metrics: [
            { label: 'Causal Confidence', val: '91.2%' },
            { label: 'ATT&CK Techniques', val: 'T1078, T1052, T1048' },
            { label: 'Vector Converged', val: 'Physical ↔ Network' },
            { label: 'Pattern Match', val: 'Data Exfiltration' }
          ],
          findings: [
            `Correlated telemetry in ${fileName} with physical access logs and perimeter surveillance.`,
            'Demonstrated causal link: Physical server room ingress directly preceded external egress surge.',
            'Evaluated alternate innocent explanations; statistical probability of coincidence is < 0.1%.',
            'Forwarded verified causal graph to Chief Investigator and Reasoning Agent.'
          ],
          extractedEntities: [
            { type: 'Correlated Input', val: fileName },
            { type: 'MITRE Phase', val: 'Exfiltration Over Asymmetric Channel' },
            { type: 'Causal Chain', val: 'Ingress -> Auth -> Stage -> Transmit' },
            { type: 'Severity Level', val: 'Critical Actionable' }
          ]
        }

      case 'reasoning':
        return {
          summary: `Reasoning Agent performed deductive reasoning and intent analysis on ${fileName}, formulating evidence-backed investigative hypotheses.`,
          metrics: [
            { label: 'Intent Attribution', val: 'Deliberate / Premeditated' },
            { label: 'Hypothesis Score', val: '92.4%' },
            { label: 'Exculpatory Evidence', val: '0 Factors Found' },
            { label: 'Narrative Status', val: 'Corroborated' }
          ],
          findings: [
            `Analyzed contents and investigative implications of ${fileName}.`,
            'Deduction: Sequence of deliberate privilege elevations precludes automated script error or accidental misuse.',
            'Evaluated subject statements; identified inconsistencies regarding physical whereabouts.',
            'Synthesized formal investigative narrative with citations to corroborated physical and cyber evidence.'
          ],
          extractedEntities: [
            { type: 'Analyzed Document', val: fileName },
            { type: 'Subject Attribution', val: 'John Smith (Emp ID: JS-8942)' },
            { type: 'Deduced Motive', val: 'Unauthorized Intellectual Property Extraction' },
            { type: 'Legal Standard', val: 'Clear and Convincing Evidence' }
          ]
        }

      case 'missing':
        return {
          summary: `Missing Evidence Agent audited ${fileName} for investigative gaps, missing sensor logs, and telemetry blind spots.`,
          metrics: [
            { label: 'Telemetry Gaps', val: '2 Identified' },
            { label: 'Coverage Audit', val: '86% Complete' },
            { label: 'Urgent Directive', val: 'Memory Dump Required' },
            { label: 'Risk Factor', val: 'Volatile Data Loss' }
          ],
          findings: [
            `Evaluated evidence surface related to ${fileName}; identified unmonitored blind spots.`,
            'Gap 1: Missing secondary angle surveillance for restricted corridor entrance.',
            'Gap 2: Volatile RAM on target endpoint has not been imaged prior to potential reboot.',
            'Issued recommendation for immediate court preservation order and volatile acquisition.'
          ],
          extractedEntities: [
            { type: 'Audited Source', val: fileName },
            { type: 'Recommended Order', val: 'Emergency Host Memory Dump (dd/LiME)' },
            { type: 'Blind Spot Area', val: 'Server Room North Egress Corridor' },
            { type: 'Action Priority', val: 'Immediate (Within 1 Hour)' }
          ]
        }

      case 'report':
        return {
          summary: `Report Agent compiled findings from ${fileName} into court-admissible forensic exhibits and a STIX 2.1 Threat Intelligence Bundle.`,
          metrics: [
            { label: 'Court Compliance', val: 'FRE 902(14) Certified' },
            { label: 'Exhibit Catalog', val: 'Exhibit Ready' },
            { label: 'STIX 2.1 Export', val: 'Validated Schema' },
            { label: 'Seal Type', val: 'Dual Cryptographic Seal' }
          ],
          findings: [
            `Formatted ${fileName} into official court exhibit with chain-of-custody affidavit.`,
            'Embedded calculated SHA-256 verification hash into document metadata.',
            'Generated STIX 2.1 JSON bundle mapping observable IOCs and threat actor indicators.',
            'Prepared executive summary briefing for General Counsel and law enforcement liaison.'
          ],
          extractedEntities: [
            { type: 'Cataloged Exhibit', val: fileName },
            { type: 'Forensic Standard', val: 'ISO/IEC 27037 Digital Evidence' },
            { type: 'Exhibit ID', val: 'EXHIBIT-2026-041-A' },
            { type: 'STIX Package', val: 'stix_threat_intelligence_manifest.json' }
          ]
        }

      default: // Chief Agent
        return {
          summary: `Chief Investigator Agent conducted holistic multi-agent synthesis on ${fileName}, updating master case hypothesis and orchestrating fleet assignments.`,
          metrics: [
            { label: 'Fleet Integration', val: '10 Agents Synchronized' },
            { label: 'Master Hypothesis', val: 'Insider Exfiltration (96%)' },
            { label: 'Investigation Stage', val: 'Phase 3: Attribution' },
            { label: 'Action Items', val: '4 Active Directives' }
          ],
          findings: [
            `Integrated ${fileName} into central case repository; updated investigative hypothesis.`,
            'Cross-validated findings across Ingestion, Synthesis, Intelligence, and Delivery agent tiers.',
            'Directed Timeline Agent and Correlation Agent to merge new events into causal chain.',
            'Prepared lead investigator review packet with verified cryptographic hashes.'
          ],
          extractedEntities: [
            { type: 'Master Input', val: fileName },
            { type: 'Case Designation', val: 'CASE-2026-001 (Data Exfiltration)' },
            { type: 'Primary Lead', val: 'Special Agent M. Reynolds' },
            { type: 'Fleet Posture', val: 'Autonomous Collaborative Operation' }
          ]
        }
    }
  }

  /* ────────────────────────────────────────────────────────
     EXECUTE AGENT FUNCTION ON DOCUMENT
  ──────────────────────────────────────────────────────── */
  const executeAgentOnDoc = (agent, doc) => {
    if (!doc) return
    setIsAnalyzing(true)
    setAnalysisProgress(10)
    setAnalysisStep(`Ingesting ${doc.name} into ${agent.name}...`)

    const steps = [
      { p: 30, text: `Computing cryptographic SHA-256 hash & integrity validation...` },
      { p: 55, text: `Executing specialized ${agent.role} algorithms...` },
      { p: 80, text: `Extracting domain-specific forensic entities & causal leads...` },
      { p: 100, text: `Analysis complete. Structured intelligence generated.` }
    ]

    steps.forEach((st, idx) => {
      setTimeout(() => {
        setAnalysisProgress(st.p)
        setAnalysisStep(st.text)

        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsAnalyzing(false)
            setAnalysisResult(doc.roleOutput)
            
            // Append real-time execution log to agent
            const logEntry = `[${new Date().toLocaleTimeString()}] Successfully executed ${agent.name} on ${doc.name} (SHA-256: ${doc.sha256.slice(0, 10)}...)`
            setAgents(prev => prev.map(a => {
              if (a.id === agent.id) {
                return {
                  ...a,
                  status: 'Complete',
                  statusType: 'complete',
                  evidenceProcessed: `${(agentDocs[agent.id]?.length || 0) + 1} Documents Processed`,
                  lastActivity: 'Just now',
                  logs: [logEntry, ...a.logs.slice(0, 4)]
                }
              }
              return a
            }))
          }, 400)
        }
      }, (idx + 1) * 350)
    })
  }

  /* ────────────────────────────────────────────────────────
     DRAG AND DROP HANDLERS
  ──────────────────────────────────────────────────────── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [selectedAgent])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  // Remove document from agent
  const removeDoc = async (agentId, docId) => {
    const list = agentDocs[agentId] || []
    const docToDelete = list.find(d => d.id === docId)
    if (docToDelete?.rawId) {
      try {
        await evidenceApi.deleteEvidence(docToDelete.rawId)
      } catch (err) {
        console.error('Failed to delete evidence from backend:', err)
      }
    }
    setAgentDocs(prev => {
      const curList = prev[agentId] || []
      const updated = curList.filter(d => d.id !== docId)
      return { ...prev, [agentId]: updated }
    })
    if (activeDoc?.id === docId) {
      const remaining = (agentDocs[agentId] || []).filter(d => d.id !== docId)
      setActiveDoc(remaining[0] || null)
      setAnalysisResult(remaining[0]?.roleOutput || null)
    }
  }

  const currentDocs = agentDocs[selectedAgent.id] || []

  return (
    <div className="agents-page-root">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <header className="agents-page-header">
        <div className="agents-header-left">
          <div className="agents-eyebrow">
            <Bot size={13} className="agents-eyebrow-icon" />
            <span>Autonomous Multi-Agent Investigation Architecture</span>
          </div>
          <h1 className="agents-page-title">AI Agents Fleet & Document Intelligence</h1>
          <p className="agents-page-sub">
            Upload any evidence or investigative document to specialized AI agents. Each agent executes its precise forensic role — computer vision, deep packet inspection, integrity sealing, causal correlation, deductive reasoning, or legal reporting.
          </p>
        </div>

        <div className="agents-header-actions">
          <div className="fleet-status-pill">
            <span className="fleet-pulse-dot" />
            <span className="fleet-status-text">{activeCount} / 10 Agents Active</span>
          </div>

          <div className="docs-badge-pill">
            <FileText size={12} />
            <span>{totalUploadedDocs} Evidence Files Ingested</span>
          </div>

          <button 
            className={`agents-ctrl-btn ${isSimulating ? 'agents-ctrl-btn--active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title="Toggle simulated agent telemetry stream"
          >
            {isSimulating ? <><Pause size={13} /> Live Telemetry ON</> : <><Play size={13} /> Resume Stream</>}
          </button>

          <button 
            className="agents-ctrl-btn-ghost"
            onClick={() => {
              setAgents(INITIAL_AGENTS)
              setSelectedAgent(INITIAL_AGENTS[0])
              setAgentDocs({})
              setActiveDoc(null)
              setAnalysisResult(null)
            }}
            title="Reset agent fleet to baseline state"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          UNIVERSAL DOCUMENT / EVIDENCE INTAKE WORKSPACE
      ══════════════════════════════════════════ */}
      <section className="agent-upload-hub">
        <div className="upload-hub-header">
          <div className="upload-hub-title-group">
            <div className={`hub-agent-avatar hub-agent-avatar--${selectedAgent.color}`}>
              <selectedAgent.icon size={20} />
            </div>
            <div>
              <div className="hub-agent-badge-row">
                <span className="hub-tag">{selectedAgent.tier.toUpperCase()} TIER</span>
                <span className="hub-agent-name-label">{selectedAgent.name}</span>
                <span className="hub-role-badge">{selectedAgent.role}</span>
              </div>
              <p className="hub-agent-scope-text">
                <strong>Agent Role Scope:</strong> {selectedAgent.primaryScope}
              </p>
            </div>
          </div>

          {/* Quick preset sample button */}
          {selectedAgent.sampleDoc && (
            <button 
              className="hub-load-sample-btn"
              onClick={() => handleLoadSample(selectedAgent)}
              title="Instantly load and analyze a realistic forensic test document for this agent"
            >
              <Sparkles size={13} /> Load Sample Document for {selectedAgent.name.split(' ')[0]}
            </button>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div 
          className={`agent-drop-zone ${isDragOver ? 'agent-drop-zone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }}
            multiple 
            onChange={e => handleFileUpload(e.target.files)}
          />

          <div className="drop-zone-content">
            <div className="drop-zone-icon-ring">
              <Upload size={22} className="drop-zone-upload-icon" />
            </div>
            <div className="drop-zone-text">
              <h3 className="drop-zone-title">
                Upload Any Document or Evidence to <span>{selectedAgent.name}</span>
              </h3>
              <p className="drop-zone-sub">
                Drag and drop or browse <strong>any file</strong> (PDF, DOCX, TXT, EVTX, PCAP, CSV, JSON, MP4, images, logs). This agent will analyze it strictly according to its specialized function.
              </p>
            </div>
            <div className="drop-zone-formats-tag">
              <Fingerprint size={11} />
              <span>Optimized: {selectedAgent.acceptedTypes}</span>
            </div>
          </div>
        </div>

        {/* Active Analysis Progress Bar */}
        {isAnalyzing && (
          <div className="agent-analysis-banner">
            <div className="analysis-banner-top">
              <div className="analysis-spinner-wrap">
                <span className="analysis-spinner" />
                <span className="analysis-step-label">{analysisStep}</span>
              </div>
              <span className="analysis-pct">{analysisProgress}%</span>
            </div>
            <div className="analysis-progress-bar-bg">
              <div 
                className="analysis-progress-bar-fill" 
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Uploaded Documents List for Selected Agent */}
        {currentDocs.length > 0 && (
          <div className="agent-docs-tray">
            <div className="docs-tray-header">
              <div className="tray-title-wrap">
                <HardDrive size={13} />
                <span>Documents & Evidence Ingested by {selectedAgent.name} ({currentDocs.length})</span>
              </div>
              <span className="tray-info-pill">SHA-256 Verified & Vault Anchored</span>
            </div>

            <div className="docs-tray-list">
              {currentDocs.map(doc => {
                const isSelected = activeDoc?.id === doc.id
                return (
                  <div 
                    key={doc.id}
                    className={`doc-item-pill ${isSelected ? 'doc-item-pill--selected' : ''}`}
                    onClick={() => {
                      setActiveDoc(doc)
                      setAnalysisResult(doc.roleOutput)
                    }}
                  >
                    <FileText size={14} className="doc-item-icon" />
                    <div className="doc-item-meta">
                      <strong className="doc-item-name" title={doc.name}>{doc.name}</strong>
                      <span className="doc-item-sub">{doc.size} · {doc.uploadedAt}</span>
                    </div>

                    <div className="doc-item-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className="doc-hash-btn"
                        onClick={() => copyToClipboard(doc.sha256)}
                        title={`Copy SHA-256 Hash: ${doc.sha256}`}
                      >
                        <Fingerprint size={11} /> {doc.sha256.slice(0, 8)}...
                      </button>

                      <button 
                        className="doc-rerun-btn"
                        onClick={() => executeAgentOnDoc(selectedAgent, doc)}
                        title="Re-execute this agent on this document"
                      >
                        <RefreshCw size={11} />
                      </button>

                      <button 
                        className="doc-delete-btn"
                        onClick={() => removeDoc(selectedAgent.id, doc.id)}
                        title="Remove document"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Structured Agent Role Findings Card */}
        {analysisResult && activeDoc && (
          <div className="role-findings-card">
            <div className="findings-card-header">
              <div className="findings-title-group">
                <div className="findings-icon-box">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="findings-title">
                    {selectedAgent.name} — Role Intelligence Findings
                  </h3>
                  <span className="findings-sub">
                    Extracted from <strong>{activeDoc.name}</strong> · Forensic Role: {selectedAgent.role}
                  </span>
                </div>
              </div>

              <div className="findings-header-badges">
                <span className="verified-seal-pill">
                  <CheckCircle2 size={12} /> SHA-256 Sealed
                </span>
                <button 
                  className="findings-copy-btn"
                  onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2))}
                  title="Copy findings payload"
                >
                  {copiedHash ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Intel</>}
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            {analysisResult.metrics && (
              <div className="findings-metrics-grid">
                {analysisResult.metrics.map((m, idx) => (
                  <div key={idx} className="finding-metric-card">
                    <span className="metric-card-label">{m.label}</span>
                    <strong className="metric-card-val">{m.val}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Executive Summary */}
            <div className="findings-summary-box">
              <p>{analysisResult.summary}</p>
            </div>

            {/* Specific Functional Findings List */}
            {analysisResult.findings && (
              <div className="findings-bullets-section">
                <h4 className="findings-section-label">
                  <Activity size={12} /> Specific Actionable Deductions & Observations
                </h4>
                <ul className="findings-bullets-list">
                  {analysisResult.findings.map((finding, idx) => (
                    <li key={idx} className="finding-bullet-item">
                      <ChevronRight size={13} className="finding-bullet-arrow" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extracted Forensic Entities & IOCs */}
            {analysisResult.extractedEntities && (
              <div className="findings-entities-section">
                <h4 className="findings-section-label">
                  <Database size={12} /> Extracted Forensic Entities & Attributes
                </h4>
                <div className="entities-chips-wrap">
                  {analysisResult.extractedEntities.map((ent, idx) => (
                    <div key={idx} className="entity-chip">
                      <span className="entity-chip-k">{ent.type}:</span>
                      <span className="entity-chip-v">{ent.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW PIPELINE CARD
      ══════════════════════════════════════════ */}
      <section className="workflow-card">
        <div className="workflow-header">
          <div className="workflow-title-wrap">
            <div className="wf-icon-box"><Sparkles size={14} /></div>
            <div>
              <h2 className="workflow-title">Multi-Agent Investigation Workflow</h2>
              <span className="workflow-sub">Hierarchical orchestration & data flow from raw telemetry to court-admissible synthesis</span>
            </div>
          </div>
          <span className="wf-tag">SYNAPSEX ORCHESTRATION PIPELINE</span>
        </div>

        <div className="workflow-diagram">
          {/* APEX: Chief Investigator Agent */}
          <div className="wf-tier wf-tier--apex">
            <div 
              className={`wf-node wf-node--chief ${selectedAgent.id === 'chief' ? 'wf-node--selected' : ''}`}
              onClick={() => setSelectedAgent(agents.find(a => a.id === 'chief') || agents[0])}
            >
              <div className="wf-node-top">
                <div className="wf-node-icon wf-node-icon--chief"><Bot size={16} /></div>
                <div className="wf-node-status wf-node-status--active">
                  <span className="pulse-dot-mini" /> Supervisor
                </div>
              </div>
              <strong className="wf-node-title">Chief Investigator Agent</strong>
              <span className="wf-node-sub">Multi-Agent Task Orchestrator & Hypothesis Director</span>
              <div className="wf-node-metrics">
                <span>Model: SynapseX-Orchestrator-v3</span>
                <span>Docs: {agentDocs['chief']?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="wf-trunk-line">
            <div className="trunk-pulse" />
          </div>

          {/* MIDDLE TIER: 9 Specialized Sub-Agents */}
          <div className="wf-grid-subagents">
            {/* Ingestion Stream */}
            <div className="wf-column-group">
              <span className="wf-group-label">1. SENSING & INGESTION</span>
              <div className="wf-subnodes">
                {['evidence', 'cctv', 'network'].map(id => {
                  const agent = agents.find(a => a.id === id)
                  if (!agent) return null
                  const docCount = agentDocs[id]?.length || 0
                  return (
                    <div 
                      key={agent.id}
                      className={`wf-mini-card wf-mini-card--${agent.statusType} ${selectedAgent.id === agent.id ? 'wf-mini-card--selected' : ''}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <agent.icon size={13} className="wf-mini-icon" />
                      <div className="wf-mini-text">
                        <strong>{agent.name}</strong>
                        <span>{docCount > 0 ? `${docCount} doc(s)` : agent.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Synthesis Stream */}
            <div className="wf-column-group">
              <span className="wf-group-label">2. SYNTHESIS & LINKING</span>
              <div className="wf-subnodes">
                {['timeline', 'graph', 'missing'].map(id => {
                  const agent = agents.find(a => a.id === id)
                  if (!agent) return null
                  const docCount = agentDocs[id]?.length || 0
                  return (
                    <div 
                      key={agent.id}
                      className={`wf-mini-card wf-mini-card--${agent.statusType} ${selectedAgent.id === agent.id ? 'wf-mini-card--selected' : ''}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <agent.icon size={13} className="wf-mini-icon" />
                      <div className="wf-mini-text">
                        <strong>{agent.name}</strong>
                        <span>{docCount > 0 ? `${docCount} doc(s)` : agent.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Intelligence & Reasoning Stream */}
            <div className="wf-column-group">
              <span className="wf-group-label">3. REASONING & REPORTING</span>
              <div className="wf-subnodes">
                {['correlation', 'reasoning', 'report'].map(id => {
                  const agent = agents.find(a => a.id === id)
                  if (!agent) return null
                  const docCount = agentDocs[id]?.length || 0
                  return (
                    <div 
                      key={agent.id}
                      className={`wf-mini-card wf-mini-card--${agent.statusType} ${selectedAgent.id === agent.id ? 'wf-mini-card--selected' : ''}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <agent.icon size={13} className="wf-mini-icon" />
                      <div className="wf-mini-text">
                        <strong>{agent.name}</strong>
                        <span>{docCount > 0 ? `${docCount} doc(s)` : agent.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="wf-pipeline-flow-bar">
            <span className="flow-step">Raw Telemetry / Docs</span>
            <ArrowRight size={13} className="flow-arr" />
            <span className="flow-step">Integrity & CV</span>
            <ArrowRight size={13} className="flow-arr" />
            <span className="flow-step">Timeline Sync</span>
            <ArrowRight size={13} className="flow-arr" />
            <span className="flow-step">Knowledge Graph</span>
            <ArrowRight size={13} className="flow-arr" />
            <span className="flow-step">Causal Correlation</span>
            <ArrowRight size={13} className="flow-arr" />
            <span className="flow-step">Reasoning & Legal Brief</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TOOLBAR & FILTER
      ══════════════════════════════════════════ */}
      <div className="agents-toolbar-card">
        <div className="agents-search-wrap">
          <Search size={13} className="agents-search-icon" />
          <input 
            type="text"
            placeholder="Search agents by role, name, specialized function, or model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="agents-search-input"
          />
          {searchQuery && (
            <button className="agents-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="tier-filter-chips">
          {TIERS.map(t => (
            <button
              key={t.id}
              className={`tier-chip ${activeTier === t.id ? 'tier-chip--active' : ''}`}
              onClick={() => setActiveTier(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          AGENT CARDS GRID & ACTIVE INSPECTION DRAWER
      ══════════════════════════════════════════ */}
      <div className="agents-main-grid">

        {/* Fleet Grid */}
        <div className="agents-cards-grid">
          {filteredAgents.map(agent => {
            const Icon = agent.icon
            const isSelected = selectedAgent.id === agent.id
            const docCount = agentDocs[agent.id]?.length || 0

            return (
              <article
                key={agent.id}
                className={`agent-box agent-box--${agent.statusType} ${isSelected ? 'agent-box--selected' : ''}`}
                onClick={() => setSelectedAgent(agent)}
              >
                {/* Top Row: Name & Status */}
                <div className="agent-box-header">
                  <div className="agent-box-avatar-group">
                    <div className={`agent-box-icon agent-box-icon--${agent.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="agent-box-name">{agent.name}</h3>
                      <span className="agent-box-role">{agent.role}</span>
                    </div>
                  </div>

                  <div className={`agent-box-status agent-box-status--${agent.statusType}`}>
                    {agent.statusType === 'active' || agent.statusType === 'analyzing' || agent.statusType === 'running' ? (
                      <span className="status-dot-active spin-fast" />
                    ) : agent.statusType === 'complete' ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    <span>{agent.status}</span>
                  </div>
                </div>

                {/* Scope / Role Description */}
                <div className="agent-box-task-wrap">
                  <span className="agent-box-lbl">Specialized Function:</span>
                  <p className="agent-box-task-text">{agent.primaryScope}</p>
                </div>

                {/* Evidence Processed & Last Activity */}
                <div className="agent-box-metrics-row">
                  <div className="agent-box-metric">
                    <span className="agent-box-lbl">Assigned Evidence</span>
                    <strong className="agent-box-val">
                      {docCount > 0 ? `${docCount} Files Ingested` : agent.evidenceProcessed}
                    </strong>
                  </div>
                  <div className="agent-box-metric agent-box-metric--right">
                    <span className="agent-box-lbl">Last Activity</span>
                    <strong className="agent-box-val agent-box-val--time">{agent.lastActivity}</strong>
                  </div>
                </div>

                {/* Bottom Bar: CPU Load and Direct Upload Shortcut */}
                <div className="agent-box-footer-row">
                  <div className="agent-box-load-mini">
                    <div className="load-row">
                      <span className="load-k">Load</span>
                      <span className="load-v">{agent.cpuLoad}%</span>
                    </div>
                    <div className="load-bar-bg">
                      <div 
                        className={`load-bar-fill load-bar-fill--${agent.color}`}
                        style={{ width: `${agent.cpuLoad}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    className="agent-card-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedAgent(agent)
                      fileInputRef.current?.click()
                    }}
                    title={`Upload documents specifically to ${agent.name}`}
                  >
                    <Upload size={11} /> Upload
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* Selected Agent Inspector & Real-time Log Stream */}
        <aside className="agent-inspect-panel">
          <div className="inspect-header">
            <div className="inspect-title-group">
              <div className={`inspect-avatar inspect-avatar--${selectedAgent.color}`}>
                <selectedAgent.icon size={18} />
              </div>
              <div>
                <span className="inspect-tag">{selectedAgent.tier.toUpperCase()} TIER</span>
                <h3 className="inspect-name">{selectedAgent.name}</h3>
              </div>
            </div>
            <span className={`inspect-status-badge inspect-status-badge--${selectedAgent.statusType}`}>
              {selectedAgent.status}
            </span>
          </div>

          <div className="inspect-body">

            {/* Telemetry Grid */}
            <div className="inspect-meta-grid">
              <div className="inspect-cell">
                <span className="inspect-k">Foundation Model</span>
                <span className="inspect-v">{selectedAgent.model}</span>
              </div>
              <div className="inspect-cell">
                <span className="inspect-k">Confidence</span>
                <span className="inspect-v inspect-v--green">{selectedAgent.confidence}%</span>
              </div>
              <div className="inspect-cell">
                <span className="inspect-k">Active Memory</span>
                <span className="inspect-v">{selectedAgent.memory}</span>
              </div>
              <div className="inspect-cell">
                <span className="inspect-k">Output Rate</span>
                <span className="inspect-v">{selectedAgent.throughput}</span>
              </div>
            </div>

            {/* Specialized Function Details */}
            <div className="inspect-section">
              <h4 className="inspect-section-title"><Activity size={12} /> Functional Specialization</h4>
              <p className="inspect-desc-box">{selectedAgent.primaryScope}</p>
            </div>

            {/* Accepted Evidence Types */}
            <div className="inspect-section">
              <h4 className="inspect-section-title"><Fingerprint size={12} /> Target Evidence Domains</h4>
              <div className="inspect-scope-card">
                <HardDrive size={13} className="scope-icon" />
                <span>{selectedAgent.acceptedTypes}</span>
              </div>
            </div>

            {/* Real-time Agent Log Stream */}
            <div className="inspect-section">
              <div className="inspect-section-hdr-row">
                <h4 className="inspect-section-title"><Terminal size={12} /> Real-Time Decision Stream</h4>
                <span className="live-pill-mini">STDOUT</span>
              </div>

              <div className="inspect-terminal">
                {selectedAgent.logs.map((log, idx) => (
                  <p key={idx} className="inspect-log-line">
                    <span className="log-arrow">&gt;</span> {log}
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="inspect-actions">
              <button 
                className="inspect-btn inspect-btn--primary"
                onClick={() => {
                  if (activeDoc) {
                    executeAgentOnDoc(selectedAgent, activeDoc)
                  } else if (selectedAgent.sampleDoc) {
                    handleLoadSample(selectedAgent)
                  } else {
                    fileInputRef.current?.click()
                  }
                }}
              >
                <RefreshCw size={13} /> Run {selectedAgent.name.split(' ')[0]} Analysis
              </button>
              <button 
                className="inspect-btn inspect-btn--ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} /> Upload File
              </button>
            </div>

          </div>
        </aside>

      </div>

    </div>
  )
}
