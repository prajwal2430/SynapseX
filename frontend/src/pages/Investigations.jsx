import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, Plus, FolderOpen,
  ChevronRight, ChevronUp, ChevronDown,
  SlidersHorizontal, AlertTriangle, Clock,
  HardDrive, Brain, Users, Shield,
  ArrowUpDown, X, LayoutGrid, List,
} from 'lucide-react'
import { CASES } from '../data/cases'
import './Investigations.css'

/* ── helpers ── */
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

const PRIORITY_META = {
  critical: { label: 'Critical', cls: 'critical' },
  high:     { label: 'High',     cls: 'high'     },
  medium:   { label: 'Medium',   cls: 'medium'   },
  low:      { label: 'Low',      cls: 'low'       },
}

const STATUS_META = {
  active:  { label: 'Active',       cls: 'active'  },
  review:  { label: 'Under Review', cls: 'review'  },
  closed:  { label: 'closed',       cls: 'closed'  },
}

const TYPE_COLORS = {
  'Data Exfiltration':   'blue',
  'Financial Fraud':     'amber',
  'Unauthorized Access': 'cyan',
  'Ransomware':          'red',
  'Supply Chain Attack': 'purple',
  'Phishing':            'gray',
}

function PriorityBadge({ level }) {
  const m = PRIORITY_META[level] || PRIORITY_META.low
  return (
    <div className={`inv-priority inv-priority--${m.cls}`}>
      <span className="inv-priority-dot" />
      {m.label}
    </div>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.closed
  return (
    <span className={`inv-status inv-status--${m.cls}`}>
      {status === 'active' && <span className="pulse-dot" style={{ width: 5, height: 5 }} />}
      {m.label}
    </span>
  )
}

function TypeChip({ type }) {
  const color = TYPE_COLORS[type] || 'gray'
  return <span className={`inv-type inv-type--${color}`}>{type}</span>
}

function RiskBar({ score }) {
  const color = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'
  return (
    <div className="inv-risk-wrap" title={`Risk score: ${score}`}>
      <div className={`inv-risk-bar inv-risk-bar--${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

/* ── Stat strip ── */
function StatsStrip({ cases = [] }) {
  const active   = cases.filter(c => c.status === 'active').length
  const review   = cases.filter(c => c.status === 'review').length
  const closed   = cases.filter(c => c.status === 'closed').length
  const critical = cases.filter(c => c.priority === 'critical').length
  return (
    <div className="inv-stats-strip">
      {[
        { label: 'Total Cases',   value: cases.length,       color: 'blue'  },
        { label: 'Active',        value: active,             color: 'green' },
        { label: 'Under Review',  value: review,             color: 'amber' },
        { label: 'Closed',        value: closed,             color: 'gray'  },
        { label: 'Critical',      value: critical,           color: 'red'   },
        { label: 'Total Evidence',value: cases.reduce((a,c) => a + (c.evidenceCount || 0), 0).toLocaleString(), color: 'cyan' },
      ].map(s => (
        <div key={s.label} className={`inv-stat inv-stat--${s.color}`}>
          <span className="inv-stat-value">{s.value}</span>
          <span className="inv-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Investigations() {
  const navigate = useNavigate()

  const [casesList, setCasesList] = useState(CASES)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [newCaseData, setNewCaseData] = useState({
    name: '',
    type: 'Data Exfiltration',
    priority: 'high',
    tlp: 'TLP:AMBER',
    classification: 'CONFIDENTIAL',
    lead: 'Special Agent M. Reynolds',
    description: '',
    tags: 'Data, Insider, Network'
  })

  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatus]   = useState('all')
  const [priorityFilter, setPriority] = useState('all')
  const [sortField,  setSortField]  = useState('lastUpdated')
  const [sortDir,    setSortDir]    = useState('asc')
  const [viewMode,   setViewMode]   = useState('table')   // 'table' | 'card'
  const [filtersOpen, setFiltersOpen] = useState(false)

  /* ── derived list ── */
  const filtered = useMemo(() => {
    let list = [...casesList]
    if (search)         list = list.filter(c =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    if (statusFilter !== 'all')   list = list.filter(c => c.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(c => c.priority === priorityFilter)

    list.sort((a, b) => {
      let va, vb
      if (sortField === 'priority')      { va = PRIORITY_ORDER[a.priority]; vb = PRIORITY_ORDER[b.priority] }
      else if (sortField === 'evidence') { va = a.evidenceCount; vb = b.evidenceCount }
      else if (sortField === 'findings') { va = a.aiFindings; vb = b.aiFindings }
      else if (sortField === 'risk')     { va = a.riskScore; vb = b.riskScore }
      else                               { va = a.id; vb = b.id }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [casesList, search, statusFilter, priorityFilter, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function handleCreateCase(e) {
    e.preventDefault()
    if (!newCaseData.name.trim()) return
    const nextIdNum = casesList.length + 1
    const id = `CASE-2026-${String(nextIdNum).padStart(3, '0')}`
    const createdCase = {
      id,
      name: newCaseData.name.trim(),
      type: newCaseData.type,
      status: 'active',
      priority: newCaseData.priority,
      tlp: newCaseData.tlp,
      classification: newCaseData.classification,
      lead: newCaseData.lead,
      openedDate: new Date().toISOString().slice(0, 10),
      lastUpdated: 'Just now',
      lastUpdatedFull: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      evidenceCount: 0,
      aiFindings: 0,
      riskScore: newCaseData.priority === 'critical' ? 88 : newCaseData.priority === 'high' ? 68 : 45,
      riskLabel: newCaseData.priority === 'critical' ? 'Critical' : newCaseData.priority === 'high' ? 'High' : 'Medium',
      tags: newCaseData.tags.split(',').map(t => t.trim()).filter(Boolean),
      team: [newCaseData.lead],
      description: newCaseData.description.trim() || 'Active forensic investigation.',
      timeline: []
    }
    setCasesList(prev => [createdCase, ...prev])
    setIsCreateOpen(false)
    setNewCaseData({
      name: '',
      type: 'Data Exfiltration',
      priority: 'high',
      tlp: 'TLP:AMBER',
      classification: 'CONFIDENTIAL',
      lead: 'Special Agent M. Reynolds',
      description: '',
      tags: 'Data, Insider, Network'
    })
    setToastMsg(`Investigation ${id} created successfully`)
    setTimeout(() => setToastMsg(null), 3500)
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon sort-icon--idle" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="sort-icon sort-icon--active" />
      : <ChevronDown size={12} className="sort-icon sort-icon--active" />
  }

  return (
    <div className="inv-root">

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--accent)',
          borderRadius: '6px',
          padding: '10px 16px',
          color: 'var(--text)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 9999,
        }}>
          {toastMsg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="inv-page-header">
        <div className="inv-header-left">
          <div className="inv-eyebrow">
            <FolderOpen size={12} />
            Case Management
          </div>
          <h1 className="inv-page-title">Investigations</h1>
          <p className="inv-page-sub">
            {casesList.length} cases · {casesList.filter(c=>c.status==='active').length} active
          </p>
        </div>
        <div className="inv-header-right">
          <button
            className="inv-btn inv-btn--ghost"
            id="toggle-view-btn"
            onClick={() => setViewMode(v => v === 'table' ? 'card' : 'table')}
            title={viewMode === 'table' ? 'Switch to card view' : 'Switch to table view'}
          >
            {viewMode === 'table' ? <LayoutGrid size={15} /> : <List size={15} />}
          </button>
          <button 
            className="inv-btn inv-btn--primary" 
            id="create-case-btn"
            onClick={() => setIsCreateOpen(true)}
            title="Open new case creation form"
          >
            <Plus size={15} />
            Create New Case
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <StatsStrip cases={casesList} />

      {/* ── Toolbar ── */}
      <div className="inv-toolbar">
        {/* Search */}
        <div className="inv-search-wrap">
          <Search size={13} className="inv-search-icon" />
          <input
            id="case-search"
            type="text"
            placeholder="Search by case ID, name, type, or tag…"
            className="inv-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="inv-search-clear" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="inv-filter-group">
          {['all', 'active', 'review', 'closed'].map(s => (
            <button
              key={s}
              id={`status-filter-${s}`}
              className={`inv-filter-tab ${statusFilter === s ? 'inv-filter-tab--active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {s === 'all' ? 'All Status' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select
          id="priority-filter"
          className="inv-select"
          value={priorityFilter}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Advanced filters toggle */}
        <button
          className={`inv-btn inv-btn--ghost ${filtersOpen ? 'inv-btn--ghost-active' : ''}`}
          id="advanced-filters-btn"
          onClick={() => setFiltersOpen(o => !o)}
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>

        <span className="inv-result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Advanced filters panel ── */}
      {filtersOpen && (
        <div className="inv-advanced-filters">
          <span className="inv-af-label">Sort by:</span>
          {[
            { field: 'id',       label: 'Case ID'   },
            { field: 'priority', label: 'Priority'  },
            { field: 'evidence', label: 'Evidence'  },
            { field: 'findings', label: 'AI Findings'},
            { field: 'risk',     label: 'Risk Score' },
          ].map(s => (
            <button
              key={s.field}
              className={`inv-sort-chip ${sortField === s.field ? 'inv-sort-chip--active' : ''}`}
              onClick={() => toggleSort(s.field)}
            >
              {s.label}
              {sortField === s.field && (
                sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
              )}
            </button>
          ))}
          <button
            className="inv-btn inv-btn--ghost"
            style={{ marginLeft: 'auto' }}
            onClick={() => { setStatus('all'); setPriority('all'); setSearch(''); setSortField('id'); setSortDir('asc') }}
          >
            Reset
          </button>
        </div>
      )}

      {/* ═══════ TABLE VIEW ═══════ */}
      {viewMode === 'table' && (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')} className="inv-th-sortable">
                  Case ID <SortIcon field="id" />
                </th>
                <th>Case Name</th>
                <th>Type</th>
                <th onClick={() => toggleSort('priority')} className="inv-th-sortable">
                  Priority <SortIcon field="priority" />
                </th>
                <th>Status</th>
                <th onClick={() => toggleSort('risk')} className="inv-th-sortable">
                  Risk <SortIcon field="risk" />
                </th>
                <th onClick={() => toggleSort('evidence')} className="inv-th-sortable">
                  Evidence <SortIcon field="evidence" />
                </th>
                <th onClick={() => toggleSort('findings')} className="inv-th-sortable">
                  AI Findings <SortIcon field="findings" />
                </th>
                <th>Lead</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="inv-empty-row">
                    <Search size={20} />
                    <span>No cases match your filters</span>
                  </td>
                </tr>
              )}
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`inv-row inv-row--${c.priority} ${c.status === 'closed' ? 'inv-row--closed' : ''}`}
                  onClick={() => navigate(`/investigations/${c.id}`)}
                  id={`case-row-${c.id}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <td>
                    <div className="inv-cell-id">
                      <span className="inv-case-id">{c.id}</span>
                      {c.tlp && <span className={`inv-tlp inv-tlp--${c.tlp.includes('RED') ? 'red' : c.tlp.includes('AMBER') ? 'amber' : 'green'}`}>{c.tlp}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="inv-cell-name">
                      <span className="inv-case-name">{c.name}</span>
                      <div className="inv-case-tags">
                        {c.tags.slice(0, 2).map(t => (
                          <span key={t} className="inv-tag">{t}</span>
                        ))}
                        {c.tags.length > 2 && <span className="inv-tag inv-tag--more">+{c.tags.length - 2}</span>}
                      </div>
                    </div>
                  </td>
                  <td><TypeChip type={c.type} /></td>
                  <td><PriorityBadge level={c.priority} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="inv-risk-cell">
                      <span className={`inv-risk-score inv-risk-score--${c.riskLabel.toLowerCase()}`}>{c.riskScore}</span>
                      <RiskBar score={c.riskScore} />
                    </div>
                  </td>
                  <td>
                    <div className="inv-cell-count">
                      <HardDrive size={12} />
                      {c.evidenceCount.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="inv-cell-count inv-cell-count--cyan">
                      <Brain size={12} />
                      {c.aiFindings}
                    </div>
                  </td>
                  <td>
                    <div className="inv-cell-lead">
                      <div className="inv-lead-avatar">{c.lead.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                      <span>{c.lead}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inv-cell-time">
                      <Clock size={11} />
                      {c.lastUpdated}
                    </div>
                  </td>
                  <td>
                    <ChevronRight size={14} className="inv-row-arrow" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ CARD VIEW ═══════ */}
      {viewMode === 'card' && (
        <div className="inv-card-grid">
          {filtered.length === 0 && (
            <div className="inv-empty-card">
              <Search size={20} />
              <span>No cases match your filters</span>
            </div>
          )}
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              className={`inv-card inv-card--${c.priority}`}
              onClick={() => navigate(`/investigations/${c.id}`)}
              id={`case-card-${c.id}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Card header */}
              <div className="inv-card-header">
                <div className="inv-card-id-row">
                  <span className="inv-case-id">{c.id}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="inv-card-badges">
                  <PriorityBadge level={c.priority} />
                  {c.tlp && <span className={`inv-tlp inv-tlp--${c.tlp.includes('RED') ? 'red' : c.tlp.includes('AMBER') ? 'amber' : 'green'}`}>{c.tlp}</span>}
                </div>
              </div>

              <h3 className="inv-card-name">{c.name}</h3>
              <p className="inv-card-desc">{c.description.slice(0, 100)}…</p>

              {/* Type */}
              <TypeChip type={c.type} />

              {/* Risk bar */}
              <div className="inv-card-risk">
                <span className="inv-card-risk-label">Risk Score</span>
                <span className={`inv-risk-score inv-risk-score--${c.riskLabel.toLowerCase()}`}>{c.riskScore}</span>
              </div>
              <RiskBar score={c.riskScore} />

              {/* Stats row */}
              <div className="inv-card-stats">
                <div className="inv-card-stat">
                  <HardDrive size={12} />
                  <span>{c.evidenceCount.toLocaleString()}</span>
                  <span className="inv-card-stat-lbl">Evidence</span>
                </div>
                <div className="inv-card-stat inv-card-stat--cyan">
                  <Brain size={12} />
                  <span>{c.aiFindings}</span>
                  <span className="inv-card-stat-lbl">Findings</span>
                </div>
                <div className="inv-card-stat">
                  <Users size={12} />
                  <span>{c.team.length}</span>
                  <span className="inv-card-stat-lbl">Analysts</span>
                </div>
              </div>

              {/* Footer */}
              <div className="inv-card-footer">
                <div className="inv-cell-lead">
                  <div className="inv-lead-avatar">{c.lead.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <span className="inv-cell-lead-name">{c.lead}</span>
                </div>
                <div className="inv-cell-time">
                  <Clock size={11} />
                  {c.lastUpdated}
                </div>
              </div>

              <div className="inv-card-arrow"><ChevronRight size={14} /></div>
            </div>
          ))}
        </div>
      )}

      {/* ── New Case Creation Modal ── */}
      {isCreateOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 9, 17, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={16} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text)', fontWeight: 600 }}>Create New Investigation</h3>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Investigation Title *
                </label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Operation Nightfall: Unauthorized USB Egress"
                  value={newCaseData.name}
                  onChange={e => setNewCaseData({ ...newCaseData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Incident Type
                  </label>
                  <select
                    value={newCaseData.type}
                    onChange={e => setNewCaseData({ ...newCaseData, type: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Data Exfiltration">Data Exfiltration</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Financial Fraud">Financial Fraud</option>
                    <option value="Ransomware">Ransomware</option>
                    <option value="Supply Chain Attack">Supply Chain Attack</option>
                    <option value="Phishing">Phishing</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Priority Level
                  </label>
                  <select
                    value={newCaseData.priority}
                    onChange={e => setNewCaseData({ ...newCaseData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    TLP Protocol
                  </label>
                  <select
                    value={newCaseData.tlp}
                    onChange={e => setNewCaseData({ ...newCaseData, tlp: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="TLP:RED">TLP:RED (Restricted)</option>
                    <option value="TLP:AMBER">TLP:AMBER (Limited)</option>
                    <option value="TLP:GREEN">TLP:GREEN (Community)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Lead Investigator
                  </label>
                  <input 
                    type="text"
                    value={newCaseData.lead}
                    onChange={e => setNewCaseData({ ...newCaseData, lead: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Scope & Synopsis
                </label>
                <textarea 
                  rows={3}
                  placeholder="Describe initial indicators of compromise, physical location or affected assets..."
                  value={newCaseData.description}
                  onChange={e => setNewCaseData({ ...newCaseData, description: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text)',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '10px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    color: '#0b1120',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} /> Open Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
