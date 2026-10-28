import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, Plus, FolderOpen,
  ChevronRight, ChevronUp, ChevronDown,
  SlidersHorizontal, AlertTriangle, Clock,
  HardDrive, Brain, Users, Shield,
  ArrowUpDown, X, LayoutGrid, List,
  Trash2, Loader2,
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
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
  const { cases, selectCase, createCase, deleteCase, deleteAllCases } = useCase()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
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

  async function confirmDeleteCase() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.rawId || deleteTarget.id) {
        await deleteCase(deleteTarget.rawId || deleteTarget.id)
      }
      setToastMsg(`Investigation case ${deleteTarget.id} removed.`)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete case:', err)
      setToastMsg('Failed to delete investigation case.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function confirmDeleteAllCases() {
    setIsDeleting(true)
    try {
      await deleteAllCases()
      setToastMsg('All investigation cases have been removed.')
      setShowDeleteAllModal(false)
    } catch (err) {
      console.error('Failed to delete all cases:', err)
      setToastMsg('Failed to remove all cases.')
    } finally {
      setIsDeleting(false)
    }
  }

  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatus]   = useState('all')
  const [priorityFilter, setPriority] = useState('all')
  const [sortField,  setSortField]  = useState('lastUpdated')
  const [sortDir,    setSortDir]    = useState('asc')
  const [viewMode,   setViewMode]   = useState('table')   // 'table' | 'card'
  const [filtersOpen, setFiltersOpen] = useState(false)

  const casesList = useMemo(() => {
    return (cases || []).map(c => ({
      id: c.case_number || c.case_id || `CASE-2026-${String(c.id).padStart(3, '0')}`,
      rawId: c.id,
      caseNumber: c.case_number,
      name: c.title || 'Untitled Case',
      type: c.case_type || 'Data Exfiltration',
      status: c.status?.toLowerCase() || 'active',
      priority: c.priority?.toLowerCase() || 'medium',
      tlp: 'TLP:AMBER',
      classification: 'CONFIDENTIAL',
      lead: 'Lead Forensic Investigator',
      openedDate: c.opened_date ? new Date(c.opened_date).toISOString().slice(0, 10) : new Date(c.created_at).toISOString().slice(0, 10),
      lastUpdated: 'Recently',
      lastUpdatedFull: c.updated_at ? new Date(c.updated_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '',
      evidenceCount: c.evidence_count || 0,
      aiFindings: c.finding_count || 0,
      riskScore: c.priority === 'critical' ? 92 : c.priority === 'high' ? 76 : c.priority === 'medium' ? 52 : 25,
      riskLabel: c.priority === 'critical' ? 'Critical' : c.priority === 'high' ? 'High' : c.priority === 'medium' ? 'Medium' : 'Low',
      tags: ['Forensic', c.case_type || 'General'],
      team: ['Lead Forensic Investigator'],
      description: c.description || 'Active investigation case.',
      timeline: [],
      raw: c
    }))
  }, [cases])

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

  async function handleCreateCase(e) {
    e.preventDefault()
    if (!newCaseData.name.trim()) return
    try {
      const created = await createCase({
        title: newCaseData.name.trim(),
        description: newCaseData.description.trim() || 'Active forensic investigation.',
        case_type: newCaseData.type,
        priority: newCaseData.priority,
        status: 'active'
      })
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
      setToastMsg(`Investigation ${created?.case_id || 'case'} created successfully`)
      setTimeout(() => setToastMsg(null), 3500)
    } catch (err) {
      console.error('Failed to create case:', err)
      setToastMsg('Failed to create case.')
      setTimeout(() => setToastMsg(null), 3500)
    }
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
          {casesList.length > 0 && (
            <button
              className="inv-btn inv-btn--ghost"
              style={{ color: 'var(--alert-critical)', borderColor: 'rgba(255, 59, 59, 0.3)' }}
              onClick={() => setShowDeleteAllModal(true)}
              title="Remove all investigation cases from database"
            >
              <Trash2 size={14} /> Remove All Cases
            </button>
          )}
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
                  <td colSpan={11} className="inv-empty-row" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <FolderOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                      {search || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'No cases match your filters'
                        : 'No Active Investigation Cases'}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                      {search || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your search criteria or resetting filters.'
                        : 'All investigation cases have been cleared. Open a new case to begin evidence intelligence tracking.'}
                    </p>
                    <button className="inv-btn inv-btn--primary" style={{ margin: '0 auto' }} onClick={() => setIsCreateOpen(true)}>
                      <Plus size={14} /> Create New Case
                    </button>
                  </td>
                </tr>
              )}
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`inv-row inv-row--${c.priority} ${c.status === 'closed' ? 'inv-row--closed' : ''}`}
                  onClick={() => {
                    selectCase(c.raw)
                    navigate(`/investigations/${c.id}`)
                  }}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="inv-btn inv-btn--ghost"
                        style={{ padding: '4px 6px', color: 'var(--alert-critical)', border: '1px solid rgba(255,59,59,0.2)' }}
                        title="Delete investigation case"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(c)
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={14} className="inv-row-arrow" />
                    </div>
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
            <div className="inv-empty-card" style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
              <FolderOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                {search || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No cases match your filters'
                  : 'No Active Investigation Cases'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                {search || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search criteria or resetting filters.'
                  : 'All investigation cases have been cleared. Open a new case to begin evidence intelligence tracking.'}
              </p>
              <button className="inv-btn inv-btn--primary" style={{ margin: '0 auto' }} onClick={() => setIsCreateOpen(true)}>
                <Plus size={14} /> Create New Case
              </button>
            </div>
          )}
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              className={`inv-card inv-card--${c.priority}`}
              onClick={() => {
                selectCase(c.raw)
                navigate(`/investigations/${c.id}`)
              }}
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
                  <button
                    className="inv-btn inv-btn--ghost"
                    style={{ padding: '2px 5px', color: 'var(--alert-critical)', border: '1px solid rgba(255,59,59,0.2)', marginLeft: '4px' }}
                    title="Delete case"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(c)
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
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

      {/* ── Delete Single Case Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(255, 59, 59, 0.4)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--alert-critical)', marginBottom: '12px' }}>
              <AlertTriangle size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Confirm Case Deletion</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 16px' }}>
              Are you sure you want to delete investigation case <strong style={{ color: 'var(--text)' }}>{deleteTarget.id} — {deleteTarget.name}</strong>?
              This will permanently remove the case and all associated evidence, findings, and intelligence records.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="inv-btn inv-btn--ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inv-btn inv-btn--primary"
                style={{ background: 'var(--alert-critical)', color: '#fff', border: 'none' }}
                onClick={confirmDeleteCase}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={13} className="ev-spin" /> : <Trash2 size={13} />}
                {isDeleting ? 'Deleting...' : 'Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Purge All Cases Confirmation Modal ── */}
      {showDeleteAllModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(255, 59, 59, 0.4)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--alert-critical)', marginBottom: '12px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Purge All Investigation Cases</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 16px' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--text)' }}>all {casesList.length} investigation cases</strong>?
              This action cannot be undone and will purge all evidence files, chain of custody logs, and reasoning graphs.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="inv-btn inv-btn--ghost"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inv-btn inv-btn--primary"
                style={{ background: 'var(--alert-critical)', color: '#fff', border: 'none' }}
                onClick={confirmDeleteAllCases}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={13} className="ev-spin" /> : <Trash2 size={13} />}
                {isDeleting ? 'Purging All Cases...' : 'Yes, Delete All Cases'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
