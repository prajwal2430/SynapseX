import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Sparkles, HardDrive,
  Clock, Tag, Shield, AlertTriangle, CheckCircle2,
  Info, ArrowRight, User, Bot, RefreshCw,
  ExternalLink, X, FileText, Globe, Usb,
  Monitor, Brain, Layers, Download, Copy, Check
} from 'lucide-react'
import './IntelligenceChat.css'

/* ═══════════════════════════════════════════════════
   PRE-BUILT INTELLIGENCE DIALOGUES & EVIDENCE DB
═══════════════════════════════════════════════════ */
const SUGGESTED_PROMPTS = [
  'What happened between 10:00 and 11:00 UTC?',
  'Show evidence related to LAPTOP-07',
  'Which entities are connected to USB-123?',
  'What supports the data exfiltration hypothesis?',
  'What evidence is still missing?'
]

const INITIAL_MESSAGES = [
  {
    id: 'msg-0',
    sender: 'ai',
    time: '10:15:00 UTC',
    content: {
      answer:
        'Hello Investigator. I am the **ADEIP / SynapseX Intelligence Assistant** attached to active case **CASE-2026-001 (Suspected Data Exfiltration)**.\n\nI can assist you by correlating digital forensics, reconstructing chronological event sequences, and analyzing multi-modal evidence across CCTV, access controls, Windows logs, USB hardware, and network packet streams. All assessments are probabilistic decision-support findings based strictly on collected artifacts.',
      supportingEvidence: [
        { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Video Evidence', source: 'CAM-07' },
        { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'LAPTOP-07' },
        { id: 'E-003', name: 'firewall_egress_logs.csv', type: 'Network Logs', source: 'FW-CORE-01' },
        { id: 'E-004', name: 'usb_activity_log.csv', type: 'Device Logs', source: 'CrowdStrike EDR' }
      ],
      timelineEvents: [
        { time: '10:02:14', event: 'Restricted corridor entry detected (CCTV)' },
        { time: '10:05:32', event: 'Unregistered USB-123 mass storage connected' },
        { time: '10:09:20', event: '1.8 GB encrypted egress to TOR exit IP' }
      ],
      entities: [
        { name: 'Person X (J. Smith)', type: 'Person' },
        { name: 'LAPTOP-07', type: 'Device' },
        { name: 'USB-123', type: 'USB Device' },
        { name: '185.220.101.47', type: 'IP Address' }
      ],
      confidence: 'Medium (67%) · Probabilistic Assessment (Requires Human Review)',
      confidenceScore: 67,
      suggestedQuestions: [
        'What happened between 10:00 and 11:00 UTC?',
        'Show evidence related to LAPTOP-07',
        'What supports the data exfiltration hypothesis?'
      ]
    }
  }
]

const INTEL_KNOWLEDGE_BASE = {
  'what happened between 10': {
    answer:
      'During the 10:00 to 11:00 UTC window on 2026-08-20, an unbroken 7-minute chronological sequence occurred across physical and digital security boundaries in Server Room B:\n\n1. **10:02:14 UTC**: An individual entered the restricted corridor outside Server Room B without badge scan (CCTV CAM-07).\n2. **10:03:02 UTC**: Door DR-B02 was unlocked using badge Card #27.\n3. **10:04:10 UTC**: User session authenticated on LAPTOP-07 under jsmith@corp.int.\n4. **10:05:32 UTC**: Unregistered USB device (USB-123 / SanDisk 128GB) was inserted.\n5. **10:07:45 UTC**: 34 sensitive Q2 financial documents were accessed and archived into E:\\tmp\\archive.tar.gz.\n6. **10:09:20 UTC**: 1.8 GB outbound encrypted stream was transmitted to TOR exit IP 185.220.101.47.',
    supportingEvidence: [
      { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Video Evidence', source: 'CAM-07 DVR' },
      { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'LAPTOP-07' },
      { id: 'E-003', name: 'firewall_egress_logs.csv', type: 'Network Logs', source: 'Palo Alto FW' },
      { id: 'E-004', name: 'usb_activity_log.csv', type: 'Hardware Log', source: 'CrowdStrike EDR' },
      { id: 'E-006', name: 'network_capture.pcap', type: 'PCAP Capture', source: 'Network TAP' }
    ],
    timelineEvents: [
      { time: '10:02:14', event: 'CCTV: Person entered restricted corridor' },
      { time: '10:03:02', event: 'Access: Door DR-B02 unlocked via Card #27' },
      { time: '10:04:10', event: 'System: Kerberos logon on LAPTOP-07' },
      { time: '10:05:32', event: 'USB: Removable drive USB-123 mounted' },
      { time: '10:07:45', event: 'File: 34 confidential files read & compressed' },
      { time: '10:09:20', event: 'Network: 1.8 GB outbound TLS transmission' }
    ],
    entities: [
      { name: 'Person X (J. Smith)', type: 'Person' },
      { name: 'Card #27', type: 'Credential' },
      { name: 'LAPTOP-07', type: 'Device' },
      { name: 'USB-123', type: 'USB Device' },
      { name: '/Finance/Q2-Projections/', type: 'File Repository' },
      { name: '185.220.101.47', type: 'IP Address (TOR)' }
    ],
    confidence: 'High Temporal Consistency (89% sequence alignment)',
    confidenceScore: 89,
    suggestedQuestions: [
      'What supports the data exfiltration hypothesis?',
      'Which entities are connected to USB-123?',
      'What evidence is still missing?'
    ]
  },
  'laptop-07': {
    answer:
      'Forensic telemetry for terminal **LAPTOP-07 (Workstation WKST-041)** indicates it was the primary execution and staging point for the incident:\n\n• **Hardware Profile**: Dell Latitude 7420 located on Bench 4 inside Server Room B.\n• **Active Session**: Interactive logon initiated at 10:04:10 UTC (Event ID 4624) under domain credential `jsmith@corp.int`.\n• **Removable Storage**: Unregistered SanDisk Cruzer Glide 128GB (USB-123) mounted as Volume E:\\ at 10:05:32 UTC.\n• **File Operations**: 34 sensitive files read from network share `\\\\fs-core\\Finance\\Q2-Projections` and archived to `E:\\tmp\\archive.tar.gz`.\n• **Socket Activity**: Established TLS 1.3 encrypted connection to remote IP `185.220.101.47:443` at 10:09:20 UTC.',
    supportingEvidence: [
      { id: 'E-002', name: 'windows_event_logs.evtx', type: 'Security Events', source: 'LAPTOP-07' },
      { id: 'E-004', name: 'usb_activity_log.csv', type: 'EDR Artifact', source: 'CrowdStrike' },
      { id: 'E-005', name: 'memory_dump_wkst041.raw', type: 'RAM Dump (16 GB)', source: 'Rekall Live' }
    ],
    timelineEvents: [
      { time: '10:04:10', event: 'Interactive Kerberos logon (jsmith@corp.int)' },
      { time: '10:05:32', event: 'USB-123 mass storage volume mounted (Drive E:)' },
      { time: '10:07:45', event: 'Bulk file read on confidential finance volume' },
      { time: '10:09:20', event: 'Outbound socket connection to 185.220.101.47' }
    ],
    entities: [
      { name: 'LAPTOP-07', type: 'Device' },
      { name: 'jsmith@corp.int', type: 'User Account' },
      { name: 'USB-123', type: 'USB Device' },
      { name: 'Confidential_File.pdf', type: 'File' }
    ],
    confidence: 'Verified Forensic Telemetry (94% artifact reliability)',
    confidenceScore: 94,
    suggestedQuestions: [
      'Which entities are connected to USB-123?',
      'What happened between 10:00 and 11:00 UTC?',
      'What evidence is still missing?'
    ]
  },
  'usb-123': {
    answer:
      '**USB-123** is an unregistered removable storage device (SanDisk Cruzer Glide 128GB, Serial: `SDCZ48-128G-84912`) identified in the investigation:\n\n• **Direct Connection**: Connected to `LAPTOP-07` at 10:05:32 UTC and safely removed at 10:08:54 UTC.\n• **Associated Identity**: Connected during the active session of `jsmith@corp.int`.\n• **Associated Files**: Staged a local archive `E:\\tmp\\archive.tar.gz` (2.1 GB) consolidating 34 financial models.\n• **Associated Physical Operator**: CCTV CAM-07 observed the subject departing Server Room B carrying a thumb drive matching the form factor of USB-123.',
    supportingEvidence: [
      { id: 'E-004', name: 'usb_activity_log.csv', type: 'Device Audit', source: 'CrowdStrike EDR' },
      { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'LAPTOP-07' },
      { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Physical Video', source: 'CAM-07' }
    ],
    timelineEvents: [
      { time: '10:05:32', event: 'Plug and Play hardware ID SDCZ48-128G registered' },
      { time: '10:07:45', event: 'Archive file created on drive E:\\tmp' },
      { time: '10:08:54', event: 'Device safely unmounted and removed' }
    ],
    entities: [
      { name: 'USB-123', type: 'USB Device' },
      { name: 'LAPTOP-07', type: 'Device' },
      { name: 'Person X (J. Smith)', type: 'Person' },
      { name: 'Confidential_File.pdf', type: 'File' }
    ],
    confidence: 'High Forensic Confidence (96% hardware correlation)',
    confidenceScore: 96,
    suggestedQuestions: [
      'Show evidence related to LAPTOP-07',
      'What supports the data exfiltration hypothesis?',
      'What evidence is still missing?'
    ]
  },
  'supports the data exfiltration': {
    answer:
      'The **Data Exfiltration Hypothesis (HYP-2026-001)** is supported by four converging forensic pillars, though competing hypotheses must also be evaluated:\n\n1. **Unregistered Removable Storage**: USB-123 was attached shortly after login and initialized with staging folders.\n2. **Confidential Target Access**: Immediate targeting of restricted Q2 financial models with zero prior user access history.\n3. **Payload Compression**: 34 sensitive files packaged into a 2.1 GB `.tar.gz` archive.\n4. **High-Entropy Network Burst**: 1.8 GB transmitted over encrypted TLS 1.3 to a verified TOR exit node (185.220.101.47).\n\n*Investigator Caution*: This assessment reflects algorithmic correlation and requires corroboration against user authorization logs and backup calendars.',
    supportingEvidence: [
      { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Video', source: 'CAM-07' },
      { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'LAPTOP-07' },
      { id: 'E-003', name: 'firewall_egress_logs.csv', type: 'Network Logs', source: 'Palo Alto FW' },
      { id: 'E-004', name: 'usb_activity_log.csv', type: 'Device Logs', source: 'EDR' },
      { id: 'E-006', name: 'network_capture.pcap', type: 'PCAP Traffic', source: 'Switch TAP' }
    ],
    timelineEvents: [
      { time: '10:05:32', event: 'USB-123 connected' },
      { time: '10:07:45', event: 'Sensitive finance files accessed' },
      { time: '10:08:12', event: 'Archive.tar.gz created on E:\\tmp' },
      { time: '10:09:20', event: '1.8 GB outbound to 185.220.101.47' }
    ],
    entities: [
      { name: 'LAPTOP-07', type: 'Device' },
      { name: 'USB-123', type: 'USB Device' },
      { name: '/Finance/Q2-Projections/', type: 'File Repository' },
      { name: '185.220.101.47 (TOR)', type: 'IP Address' }
    ],
    confidence: 'Medium (67%) · Plausible Lead (Requires Formal Corroboration)',
    confidenceScore: 67,
    suggestedQuestions: [
      'What evidence is still missing?',
      'Show evidence related to LAPTOP-07',
      'What happened between 10:00 and 11:00 UTC?'
    ]
  },
  'missing': {
    answer:
      'The **Missing Evidence Agent** has identified 4 critical investigative gaps required to definitively prove or disprove the exfiltration hypothesis:\n\n1. **Cloud Tenant Audit Logs**: AWS / Azure identity logs for `jsmith@corp.int` to determine if cloud repositories were concurrently accessed.\n2. **User Authorization & Exemption Records**: HR / IT ticketing search to check if formal data export approval was granted.\n3. **IT Disaster Recovery Schedule**: Confirmation whether an off-cycle database backup was sanctioned during this window.\n4. **USB Hardware Ownership Registry**: Physical property logs to determine registered owner of SanDisk Serial `SDCZ48-128G`.',
    supportingEvidence: [
      { id: 'GAP-001', name: 'aws_cloudtrail_audit.json', type: 'Pending Collection', source: 'Cloud Tenant' },
      { id: 'GAP-002', name: 'servicenow_change_tickets.csv', type: 'Pending Collection', source: 'ITSM' },
      { id: 'GAP-003', name: 'usb_asset_inventory.xlsx', type: 'Pending Collection', source: 'Asset Registry' }
    ],
    timelineEvents: [
      { time: 'Pending', event: 'Awaiting AWS CloudTrail export ingest' },
      { time: 'Pending', event: 'Awaiting ServiceNow change management audit' }
    ],
    entities: [
      { name: 'AWS Cloud Tenant', type: 'Cloud Service' },
      { name: 'ServiceNow ITSM', type: 'IT System' },
      { name: 'USB Serial SDCZ48-128G', type: 'Hardware' }
    ],
    confidence: 'High Gap Significance (4 Recommended Collection Directives)',
    confidenceScore: 92,
    suggestedQuestions: [
      'What supports the data exfiltration hypothesis?',
      'What happened between 10:00 and 11:00 UTC?',
      'Show evidence related to LAPTOP-07'
    ]
  }
}

export default function IntelligenceChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputPrompt, setInputPrompt] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (textToSend) => {
    const query = (textToSend || inputPrompt).trim()
    if (!query) return

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      time: new Date().toTimeString().split(' ')[0] + ' UTC',
      text: query
    }

    setMessages(prev => [...prev, userMsg])
    setInputPrompt('')
    setIsTyping(true)

    // Simulate AI reasoning and retrieval delay
    setTimeout(() => {
      const qLower = query.toLowerCase()
      let matchedData = null

      if (qLower.includes('10') || qLower.includes('happened') || qLower.includes('timeline')) {
        matchedData = INTEL_KNOWLEDGE_BASE['what happened between 10']
      } else if (qLower.includes('laptop') || qLower.includes('wkst') || qLower.includes('terminal')) {
        matchedData = INTEL_KNOWLEDGE_BASE['laptop-07']
      } else if (qLower.includes('usb') || qLower.includes('sandisk') || qLower.includes('device')) {
        matchedData = INTEL_KNOWLEDGE_BASE['usb-123']
      } else if (qLower.includes('exfiltration') || qLower.includes('support') || qLower.includes('hypothesis')) {
        matchedData = INTEL_KNOWLEDGE_BASE['supports the data exfiltration']
      } else if (qLower.includes('missing') || qLower.includes('gap') || qLower.includes('recommend')) {
        matchedData = INTEL_KNOWLEDGE_BASE['missing']
      } else {
        matchedData = {
          answer: `Based on active investigation case **CASE-2026-001**, query "${query}" has been evaluated against the multi-modal evidence store.\n\nSynapseX correlation engine currently links physical access anomalies at Server Room B (10:02 UTC) with interactive session activity on LAPTOP-07 (10:04 UTC), USB staging (10:05 UTC), and network transfer to TOR exit node 185.220.101.47 (10:09 UTC).`,
          supportingEvidence: [
            { id: 'E-001', name: 'cctv_camera_01.mp4', type: 'Video', source: 'CAM-07' },
            { id: 'E-002', name: 'windows_event_logs.evtx', type: 'System Logs', source: 'LAPTOP-07' },
            { id: 'E-003', name: 'firewall_egress_logs.csv', type: 'Network Logs', source: 'FW-CORE-01' }
          ],
          timelineEvents: [
            { time: '10:02:14', event: 'Restricted area physical entry' },
            { time: '10:07:45', event: '34 confidential finance files accessed' },
            { time: '10:09:20', event: '1.8 GB encrypted outbound transfer' }
          ],
          entities: [
            { name: 'LAPTOP-07', type: 'Device' },
            { name: 'USB-123', type: 'USB Device' },
            { name: '185.220.101.47', type: 'IP Address' }
          ],
          confidence: 'Medium (67%) · Preliminary Correlation',
          confidenceScore: 67,
          suggestedQuestions: [
            'What happened between 10:00 and 11:00 UTC?',
            'What supports the data exfiltration hypothesis?',
            'What evidence is still missing?'
          ]
        }
      }

      const aiMsg = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        time: new Date().toTimeString().split(' ')[0] + ' UTC',
        content: matchedData
      }

      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1100)
  }

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="chat-page-root">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <header className="chat-page-header">
        <div className="chat-header-left">
          <div className="chat-eyebrow">
            <Sparkles size={13} className="chat-eyebrow-icon" />
            <span>Autonomous Intelligence Dialogue Interface</span>
          </div>
          <h1 className="chat-page-title">ADEIP Intelligence Assistant</h1>
          <p className="chat-page-sub">
            CASE-2026-001 · Interactive conversational intelligence assistant providing evidence-grounded queries, timeline synthesis, and hypothesis evaluation.
          </p>
        </div>

        <div className="chat-header-actions">
          <div className="chat-context-pill">
            <span className="context-dot" />
            <span>Scope: CASE-2026-001 Vault</span>
          </div>
          <button 
            className="chat-hdr-btn" 
            onClick={() => setMessages(INITIAL_MESSAGES)}
            title="Reset conversation stream"
          >
            <RefreshCw size={13} />
            <span>Reset Chat</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          SUGGESTED PROMPTS BAR
      ══════════════════════════════════════════ */}
      <div className="suggested-prompts-bar">
        <span className="sp-label"><Sparkles size={11} /> Suggested Investigative Inquiries:</span>
        <div className="sp-chips">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="sp-chip"
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MESSAGES STREAM CONTAINER
      ══════════════════════════════════════════ */}
      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-row chat-message-row--${msg.sender}`}>
            
            {/* Avatar */}
            <div className={`chat-avatar chat-avatar--${msg.sender}`}>
              {msg.sender === 'ai' ? <Brain size={16} /> : <User size={16} />}
            </div>

            {/* Message Bubble */}
            <div className="chat-bubble-container">
              <div className="chat-meta-row">
                <span className="chat-author-name">
                  {msg.sender === 'ai' ? 'ADEIP / SynapseX Intelligence Assistant' : 'Investigator (Lead Analyst)'}
                </span>
                <span className="chat-timestamp">{msg.time}</span>
              </div>

              {msg.sender === 'user' ? (
                /* User Plaintext Message */
                <div className="user-message-card">
                  <p>{msg.text}</p>
                </div>
              ) : (
                /* Structured AI Response Card */
                <div className="ai-structured-response-card">
                  
                  {/* 1. Answer Narrative */}
                  <div className="ai-section ai-section--answer">
                    <div className="ai-sec-hdr">
                      <MessageSquare size={12} className="ai-sec-icon" />
                      <h4>Investigative Assessment & Answer</h4>
                      <button 
                        className="ai-copy-btn" 
                        onClick={() => handleCopyText(msg.id, msg.content.answer)}
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                    <div className="ai-answer-text">
                      {msg.content.answer.split('\n\n').map((para, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ 
                          __html: para
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/`(.*?)`/g, '<code>$1</code>')
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* 2. Supporting Evidence (Clickable Artifact References) */}
                  {msg.content.supportingEvidence && msg.content.supportingEvidence.length > 0 && (
                    <div className="ai-section">
                      <div className="ai-sec-hdr">
                        <HardDrive size={12} className="ai-sec-icon" />
                        <h4>Supporting Evidence Artifacts ({msg.content.supportingEvidence.length})</h4>
                        <span className="sec-hint-text">Click artifact to inspect forensic manifest</span>
                      </div>
                      <div className="ai-evidence-chips">
                        {msg.content.supportingEvidence.map((ev, idx) => (
                          <div 
                            key={idx}
                            className="ai-ev-badge"
                            onClick={() => setSelectedEvidenceModal(ev)}
                          >
                            <span className="ev-badge-id">{ev.id}</span>
                            <span className="ev-badge-name">{ev.name}</span>
                            <span className="ev-badge-src">{ev.source}</span>
                            <ExternalLink size={10} className="ev-link-icon" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Related Timeline Events */}
                  {msg.content.timelineEvents && msg.content.timelineEvents.length > 0 && (
                    <div className="ai-section">
                      <div className="ai-sec-hdr">
                        <Clock size={12} className="ai-sec-icon" />
                        <h4>Related Chronological Sequence</h4>
                      </div>
                      <div className="ai-timeline-mini-feed">
                        {msg.content.timelineEvents.map((evt, idx) => (
                          <div key={idx} className="ai-tl-item">
                            <span className="ai-tl-time">{evt.time}</span>
                            <span className="ai-tl-dot" />
                            <p className="ai-tl-text">{evt.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Related Entities */}
                  {msg.content.entities && msg.content.entities.length > 0 && (
                    <div className="ai-section">
                      <div className="ai-sec-hdr">
                        <Tag size={12} className="ai-sec-icon" />
                        <h4>Correlated Entities Involved</h4>
                      </div>
                      <div className="ai-entity-tags-list">
                        {msg.content.entities.map((en, idx) => (
                          <span key={idx} className="ai-entity-pill">
                            <span className="entity-pill-type">{en.type}:</span>
                            <strong className="entity-pill-name">{en.name}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Confidence / Assessment & Responsible AI Notice */}
                  {msg.content.confidence && (
                    <div className="ai-section ai-section--confidence">
                      <div className="ai-conf-row">
                        <div className="conf-left">
                          <Shield size={13} className="conf-shield-icon" />
                          <span className="conf-title">Confidence Assessment:</span>
                          <strong className="conf-val">{msg.content.confidence}</strong>
                        </div>
                        <span className="conf-model-tag">Model: SynapseX-Forge-v3</span>
                      </div>
                      <div className="ai-responsible-notice">
                        <Info size={11} className="notice-icon" />
                        <span>This assessment represents evidence correlation for investigator guidance and does not make criminal guilt determinations.</span>
                      </div>
                    </div>
                  )}

                  {/* 6. Suggested Next Questions */}
                  {msg.content.suggestedQuestions && msg.content.suggestedQuestions.length > 0 && (
                    <div className="ai-section ai-section--next-questions">
                      <div className="ai-sec-hdr">
                        <Sparkles size={11} className="ai-sec-icon" />
                        <h4>Suggested Follow-up Inquiries:</h4>
                      </div>
                      <div className="ai-next-q-pills">
                        {msg.content.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            className="ai-next-q-btn"
                            onClick={() => handleSend(q)}
                          >
                            <span>{q}</span>
                            <ArrowRight size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-message-row chat-message-row--ai">
            <div className="chat-avatar chat-avatar--ai">
              <Brain size={16} />
            </div>
            <div className="typing-indicator-box">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
              <span className="typing-text">Synthesizing multi-modal evidence store...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ══════════════════════════════════════════
          CHAT INPUT COMPOSER
      ══════════════════════════════════════════ */}
      <footer className="chat-composer-card">
        <form 
          className="composer-form" 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <div className="composer-input-wrap">
            <textarea
              className="composer-textarea"
              placeholder="Ask ADEIP Assistant about evidence, entities, timestamps, or investigative hypotheses..."
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              id="chat-input-textarea"
            />
          </div>

          <div className="composer-actions">
            <span className="composer-hint">Press <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for newline</span>
            <button 
              type="submit" 
              className="composer-send-btn" 
              disabled={!inputPrompt.trim() || isTyping}
              id="chat-send-btn"
            >
              <span>Query Intelligence</span>
              <Send size={13} />
            </button>
          </div>
        </form>
      </footer>

      {/* ══════════════════════════════════════════
          EVIDENCE DETAILS MODAL / DRAWER
      ══════════════════════════════════════════ */}
      {selectedEvidenceModal && (
        <div className="evidence-modal-backdrop" onClick={() => setSelectedEvidenceModal(null)}>
          <div className="evidence-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-hdr-left">
                <HardDrive size={16} className="modal-icon" />
                <div>
                  <span className="modal-id">{selectedEvidenceModal.id}</span>
                  <h3 className="modal-title">{selectedEvidenceModal.name}</h3>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedEvidenceModal(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-meta-grid">
                <div className="modal-cell">
                  <span className="modal-k">Artifact Type</span>
                  <span className="modal-v">{selectedEvidenceModal.type}</span>
                </div>
                <div className="modal-cell">
                  <span className="modal-k">Origin Source</span>
                  <span className="modal-v">{selectedEvidenceModal.source}</span>
                </div>
                <div className="modal-cell">
                  <span className="modal-k">Cryptographic Integrity</span>
                  <span className="modal-v modal-v--ok"><CheckCircle2 size={11} /> SHA-256 Verified & Sealed</span>
                </div>
                <div className="modal-cell">
                  <span className="modal-k">Vault Status</span>
                  <span className="modal-v">Immutable Evidence Storage</span>
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Forensic Ingestion Summary</h4>
                <p className="modal-text">
                  This artifact was extracted during active incident triage for CASE-2026-001. It has been hashed, cataloged in the SynapseX immutable ledger, and correlated across chronological timeline agents.
                </p>
              </div>

              <div className="modal-actions">
                <button className="modal-btn modal-btn--primary" onClick={() => setSelectedEvidenceModal(null)}>
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
