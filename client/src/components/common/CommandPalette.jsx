import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, FolderSearch, HardDrive,
  Radio, GitBranch, Share2, Bot, Brain, MessageSquare,
  FileText, ShieldCheck, Settings, ArrowRight, CornerDownLeft,
  X, Tag, Clock, Shield
} from 'lucide-react'
import './CommandPalette.css'

const COMMAND_ITEMS = [
  // Navigation Modules
  { id: 'nav-dash', category: 'Navigation', title: 'Dashboard', subtitle: 'System overview & active intelligence metrics', path: '/dashboard', icon: LayoutDashboard },
  { id: 'nav-inv', category: 'Navigation', title: 'Investigations', subtitle: 'Active cases, priorities & evidence counts', path: '/investigations', icon: FolderSearch },
  { id: 'nav-evd', category: 'Navigation', title: 'Evidence Vault', subtitle: 'Artifact repository, integrity verification & SHA-256', path: '/evidence', icon: HardDrive },
  { id: 'nav-live', category: 'Navigation', title: 'Live Investigation', subtitle: 'Real-time telemetry stream & AI monitoring', path: '/live-investigation', icon: Radio },
  { id: 'nav-tl', category: 'Navigation', title: 'Investigation Timeline', subtitle: 'Chronological multi-source event reconstruction', path: '/timeline', icon: GitBranch },
  { id: 'nav-kg', category: 'Navigation', title: 'Knowledge Graph', subtitle: 'Multi-modal entity relationship network', path: '/knowledge-graph', icon: Share2 },
  { id: 'nav-agents', category: 'Navigation', title: 'AI Agents Fleet', subtitle: 'Decentralized autonomous intelligence agents', path: '/ai-agents', icon: Bot },
  { id: 'nav-findings', category: 'Navigation', title: 'AI Findings & Reasoning', subtitle: 'Explainable hypotheses, pillars & competing theories', path: '/ai-findings', icon: Brain },
  { id: 'nav-chat', category: 'Navigation', title: 'Intelligence Assistant Chat', subtitle: 'Conversational investigative dialogue', path: '/intelligence-chat', icon: MessageSquare },
  { id: 'nav-rep', category: 'Navigation', title: 'Investigation Report', subtitle: '10-section case dossier & PDF export', path: '/reports', icon: FileText },
  { id: 'nav-coc', category: 'Navigation', title: 'Chain of Custody', subtitle: 'Immutable handling logs & cryptographic seals', path: '/chain-of-custody', icon: ShieldCheck },

  // Active Cases
  { id: 'case-001', category: 'Active Cases', title: 'CASE-2026-001 · Suspected Data Exfiltration', subtitle: 'Priority: High · 1,248 items · Status: Active', path: '/investigations/CASE-2026-001/workspace', icon: FolderSearch },
  { id: 'case-002', category: 'Active Cases', title: 'CASE-2026-002 · Financial Fraud Investigation', subtitle: 'Priority: Critical · 892 items · Status: Under Review', path: '/investigations', icon: FolderSearch },
  { id: 'case-003', category: 'Active Cases', title: 'CASE-2026-003 · Unauthorized System Access', subtitle: 'Priority: High · 430 items · Status: Active', path: '/investigations', icon: FolderSearch },
  { id: 'case-004', category: 'Active Cases', title: 'CASE-2026-004 · Ransomware Incident', subtitle: 'Priority: Critical · 2,150 items · Status: Active', path: '/investigations', icon: FolderSearch },

  // Evidence Artifacts
  { id: 'evd-001', category: 'Evidence Artifacts', title: 'E-001 · cctv_camera_01.mp4 (2.1 GB)', subtitle: 'SHA-256 Verified · Source: CAM-07 Server Room B', path: '/evidence', icon: HardDrive },
  { id: 'evd-002', category: 'Evidence Artifacts', title: 'E-002 · windows_event_logs.evtx (48 MB)', subtitle: 'SHA-256 Verified · Source: LAPTOP-07 (WKST-041)', path: '/evidence', icon: HardDrive },
  { id: 'evd-003', category: 'Evidence Artifacts', title: 'E-003 · firewall_egress_logs.csv (8.3 MB)', subtitle: 'SHA-256 Verified · Source: Palo Alto FW-CORE-01', path: '/evidence', icon: HardDrive },
  { id: 'evd-004', category: 'Evidence Artifacts', title: 'E-004 · usb_activity_log.csv (124 KB)', subtitle: 'SHA-256 Verified · Source: CrowdStrike EDR', path: '/evidence', icon: HardDrive },

  // Entities
  { id: 'ent-laptop', category: 'Entities & Targets', title: 'LAPTOP-07 (Workstation WKST-041)', subtitle: 'Device · Bench 4 Server Room B · Active kerberos session', path: '/knowledge-graph', icon: Tag },
  { id: 'ent-usb', category: 'Entities & Targets', title: 'USB-123 (SanDisk Cruzer Glide 128GB)', subtitle: 'Hardware · Serial SDCZ48-128G-84912 · Staging volume E:\\', path: '/knowledge-graph', icon: Tag },
  { id: 'ent-ip', category: 'Entities & Targets', title: '185.220.101.47 (TOR Exit Node)', subtitle: 'Network Node · Destination for 1.8 GB encrypted stream', path: '/knowledge-graph', icon: Tag },
  { id: 'ent-person', category: 'Entities & Targets', title: 'Person X (J. Smith / EMP-4421)', subtitle: 'Subject · Badge Card #27 · Physical entry at 10:02 UTC', path: '/knowledge-graph', icon: Tag },
]

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  // Filter items
  const filtered = COMMAND_ITEMS.filter(item => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open handled by parent or custom trigger
        }
      }
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].path)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, navigate, onClose])

  if (!isOpen) return null

  const handleSelect = (item) => {
    navigate(item.path)
    onClose()
  }

  // Group by category
  const categories = [...new Set(filtered.map(f => f.category))]

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        
        {/* Search input bar */}
        <div className="cmd-search-header">
          <Search size={16} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, case ID, evidence artifact, or entity..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="cmd-input"
          />
          {query && (
            <button className="cmd-clear" onClick={() => setQuery('')}>×</button>
          )}
          <span className="cmd-esc-tag">ESC</span>
        </div>

        {/* Results List */}
        <div className="cmd-results-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">
              <Search size={24} className="cmd-empty-icon" />
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <span>Try searching for a Case ID, Evidence Hash, or Module name.</span>
            </div>
          ) : (
            categories.map(category => {
              const catItems = filtered.filter(f => f.category === category)
              return (
                <div key={category} className="cmd-category-group">
                  <span className="cmd-category-title">{category}</span>
                  <div className="cmd-category-items">
                    {catItems.map(item => {
                      const globalIdx = filtered.indexOf(item)
                      const isSelected = globalIdx === selectedIndex
                      const Icon = item.icon

                      return (
                        <div
                          key={item.id}
                          className={`cmd-item ${isSelected ? 'cmd-item--selected' : ''}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                        >
                          <div className="cmd-item-icon">
                            <Icon size={15} />
                          </div>
                          <div className="cmd-item-info">
                            <strong className="cmd-item-title">{item.title}</strong>
                            <span className="cmd-item-subtitle">{item.subtitle}</span>
                          </div>
                          <CornerDownLeft size={12} className="cmd-item-enter" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="cmd-footer">
          <div className="cmd-shortcuts">
            <span className="cmd-sc"><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
            <span className="cmd-sc"><kbd>↵</kbd> to select</span>
            <span className="cmd-sc"><kbd>esc</kbd> to close</span>
          </div>
          <span className="cmd-brand">SynapseX Intelligence Engine</span>
        </div>

      </div>
    </div>
  )
}
