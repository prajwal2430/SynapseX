import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, Plus, FolderOpen,
  ChevronRight, ChevronUp, ChevronDown,
  SlidersHorizontal, AlertTriangle, Clock,
  HardDrive, Brain, Users, Shield,
  ArrowUpDown, X, LayoutGrid, List, RefreshCw,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
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
  active:       { label: 'Active',       cls: 'active'  },
  under_review: { label: 'Under Review', cls: 'review'  },
  closed:       { label: 'Closed',       cls: 'closed'  },
  archived:     { label: 'Archived',     cls: 'closed'  },
}

function PriorityBadge({ level }) {
  const m = PRIORITY_META[level?.toLowerCase()] || PRIORITY_META.medium
  return (
    <div className={`inv-priority inv-priority--${m.cls}`}>
      <span className="inv-priority-dot" />
      {m.label}
    </div>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status?.toLowerCase()] || STATUS_META.active
  return (
    <span className={`inv-status inv-status--${m.cls}`}>
      {status === 'active' && <span className="pulse-dot" style={{ width: 5, height: 5 }} />}
      {m.label}
    </span>
  )
}

/* ── Stat strip ── */
function StatsStrip({ cases = [] }) {
  const active   = cases.filter(c => c.status === 'active').length
  const review   = cases.filter(c => c.status === 'under_review' || c.status === 'review').length
  const closed   = cases.filter(c => c.status === 'closed' || c.status === 'archived').length
  const critical = cases.filter(c => c.priority === 'critical').length

  return (
    <div className="inv-stats-strip">
      {[
        { label: 'Total Cases',   value: cases.length, color: 'blue'  },
        { label: 'Active',        value: active,       color: 'green' },
        { label: 'Under Review',  value: review,       color: 'amber' },
        { label: 'Closed',        value: closed,       color: 'gray'  },
        { label: 'Critical',      value: critical,     color: 'red'   },
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

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [priorityFilter, setPriority] = useState('all')
  const [sortField, setSortField] = useState('lastUpdated')
  const [sortDir, setSortDir] = useState('desc')
  const [viewMode, setViewMode] = useState('table')   // 'table' | 'card'
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Create Case Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCaseNumber, setNewCaseNumber] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.cases.list({ pageSize: 100 })
      setCases(res?.items || [])
    } catch (err) {
      setError(err.message || 'Failed to connect to backend investigation database.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const handleCreateCase = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      setSubmitting(true)
      const created = await api.cases.create({
        title: newTitle.trim(),
        case_number: newCaseNumber.trim() || undefined,
        description: newDescription.trim() || undefined,
        priority: newPriority,
      })
      setCreateModalOpen(false)
      setNewTitle('')
      setNewCaseNumber('')
      setNewDescription('')
      await fetchCases()
      if (created?.id) {
        navigate(`/investigations/${created.id}`)
      }
    } catch (err) {
      alert(`Case creation error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── derived list ── */
  const filtered = useMemo(() => {
    let list = [...cases]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        (c.case_number && c.case_number.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(c => c.priority === priorityFilter)

    list.sort((a, b) => {
      let va, vb
      if (sortField === 'priority') {
        va = PRIORITY_ORDER[a.priority] ?? 99
        vb = PRIORITY_ORDER[b.priority] ?? 99
      } else if (sortField === 'id') {
        va = a.case_number || a.id
        vb = b.case_number || b.id
      } else {
        va = a.created_at || a.id
        vb = b.created_at || b.id
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [cases, search, statusFilter, priorityFilter, sortField, sortDir])

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon sort-icon--idle" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="sort-icon sort-icon--active" />
      : <ChevronDown size={12} className="sort-icon sort-icon--active" />
  }

  return (
    <div className="inv-root">

      {/* ── Page header ── */}
      <div className="inv-page-header">
        <div className="inv-header-left">
          <div className="inv-eyebrow">
            <FolderOpen size={12} />
            Case Management
          </div>
          <h1 className="inv-page-title">Investigations</h1>
          <p className="inv-page-sub">
            {cases.length} total case{cases.length !== 1 ? 's' : ''} · {cases.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <div className="inv-header-right">
          <button
            className="inv-btn inv-btn--ghost"
            onClick={fetchCases}
            title="Refresh from database"
          >
            <RefreshCw size={14} />
          </button>
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
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={15} />
            Create New Case
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <StatsStrip cases={cases} />

      {/* ── Toolbar ── */}
      <div className="inv-toolbar">
        {/* Search */}
        <div className="inv-search-wrap">
          <Search size={13} className="inv-search-icon" />
          <input
            id="case-search"
            type="text"
            placeholder="Search by case number, title, description…"
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
          {['all', 'active', 'under_review', 'closed'].map(s => (
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
            { field: 'id',       label: 'Case Number' },
            { field: 'priority', label: 'Priority'    },
            { field: 'created',  label: 'Created Date' },
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
            onClick={() => { setStatus('all'); setPriority('all'); setSearch(''); setSortField('created'); setSortDir('desc') }}
          >
            Reset
          </button>
        </div>
      )}

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Loading authorized investigation cases from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={fetchCases} message="Database Connection Error" />
      ) : cases.length === 0 ? (
        <EmptyStateView
          title="No investigation cases have been created."
          message="Initialize an authorized investigation case or ingest evidence to begin analysis."
          icon={FolderOpen}
          actionText="Create Case"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')} className="inv-th-sortable">
                  Case ID <SortIcon field="id" />
                </th>
                <th>Case Title</th>
                <th onClick={() => toggleSort('priority')} className="inv-th-sortable">
                  Priority <SortIcon field="priority" />
                </th>
                <th>Status</th>
                <th>Lead Investigator</th>
                <th>Created Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="inv-empty-row">
                    <Search size={20} />
                    <span>No cases match your filters</span>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`inv-row inv-row--${c.priority?.toLowerCase() || 'medium'}`}
                    onClick={() => navigate(`/investigations/${c.id}`)}
                  >
                    <td>
                      <span className="inv-row-id">{c.case_number || `CASE-${c.id}`}</span>
                    </td>
                    <td>
                      <div className="inv-row-name-col">
                        <span className="inv-row-name">{c.title}</span>
                        {c.description && <span className="inv-row-desc">{c.description}</span>}
                      </div>
                    </td>
                    <td><PriorityBadge level={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <span className="inv-row-lead">{c.creator_name || 'Assigned Analyst'}</span>
                    </td>
                    <td>
                      <span className="inv-row-time">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="inv-row-arrow"
                        onClick={() => navigate(`/investigations/${c.id}`)}
                        title="Open Case"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inv-card-grid">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="inv-card"
              onClick={() => navigate(`/investigations/${c.id}`)}
            >
              <div className="inv-card-header">
                <span className="inv-card-id">{c.case_number || `CASE-${c.id}`}</span>
                <PriorityBadge level={c.priority} />
              </div>
              <h3 className="inv-card-title">{c.title}</h3>
              <p className="inv-card-desc">{c.description || 'No case description provided.'}</p>
              <div className="inv-card-footer">
                <StatusBadge status={c.status} />
                <span className="inv-card-date">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Case Modal ── */}
      {createModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h2>Create New Investigation Case</h2>
              <button className="inv-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="inv-modal-form">
              <div className="inv-form-group">
                <label>Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthorized Cloud Infiltration"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <div className="inv-form-group">
                <label>Case Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank (e.g. CASE-2026-0042)"
                  value={newCaseNumber}
                  onChange={e => setNewCaseNumber(e.target.value)}
                />
              </div>
              <div className="inv-form-group">
                <label>Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="inv-form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Background notes, incident scope, objectives..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                />
              </div>
              <div className="inv-modal-actions">
                <button
                  type="button"
                  className="inv-btn inv-btn--ghost"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim()}
                  className="inv-btn inv-btn--primary"
                >
                  {submitting ? 'Creating Case...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
