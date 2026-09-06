import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  GitBranch, Video, Lock, Monitor, Usb,
  FileSearch, Network, Brain, Calendar,
  Filter, Search, ZoomIn, ZoomOut, Maximize2,
  Minimize2, Shield, AlertTriangle, CheckCircle2,
  Clock, X, ChevronRight, ArrowRight, Share2,
  Sparkles, Layers, FileCode, Tag, Eye,
  SlidersHorizontal, Download, Play, RefreshCw, FolderOpen,
  Activity,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './Timeline.css'

const SOURCE_ICONS = {
  cctv:               Video,
  access:             Lock,
  system:             Monitor,
  usb:                Usb,
  file:               FileSearch,
  network:            Network,
  log_entry:          FileSearch,
  auth_event:         Shield,
  file_operation:     FileSearch,
  network_connection: Network,
  system_metric:      Monitor,
  alert:              AlertTriangle,
}

/* ─────────────────────────────────────────
   EVENT DETAIL PANEL
───────────────────────────────────────── */
function EventDetailPanel({ event, onClose }) {
  if (!event) return null
  const Icon = SOURCE_ICONS[event.event_type] || SOURCE_ICONS[event.source] || GitBranch
  const eventId = event.event_id || event.id
  const eventTs = event.timestamp_utc || event.timestamp
  const eventTitle = event.description || event.entity_value || event.event_type

  return (
    <div className="tl-panel-backdrop" onClick={onClose}>
      <div className="tl-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="tl-dp-header">
          <div className="tl-dp-header-left">
            <span className="tl-dp-id">Event #{eventId}</span>
            <span className="tl-dp-source-tag">
              <Icon size={11} /> {event.source || event.event_type}
            </span>
          </div>
          <button className="tl-dp-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="tl-dp-body">
          <div className="tl-dp-title-row">
            <div className="tl-dp-icon-wrap">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="tl-dp-title">{eventTitle}</h2>
              <span className="tl-dp-time">
                <Clock size={11} /> {eventTs ? new Date(eventTs).toUTCString() : (event.original_timestamp || 'Timestamp unavailable')}
              </span>
            </div>
          </div>

          <div className="tl-dp-section">
            <span className="tl-dp-sec-lbl">Normalized Entities</span>
            <p className="tl-dp-entity">
              {Array.isArray(event.entities) && event.entities.length > 0
                ? event.entities.join(', ')
                : event.entity_type
                  ? `${event.entity_type}: ${event.entity_value}`
                  : 'Unmapped entity'}
            </p>
          </div>

          <div className="tl-dp-section">
            <span className="tl-dp-sec-lbl">Source Metadata</span>
            <div className="tl-dp-evidence-box">
              <FileCode size={13} />
              <span>Evidence Artifact ID: #{event.evidence_id || 'N/A'}</span>
            </div>
          </div>

          {(event.metadata || event.event_metadata) && (
            <div className="tl-dp-section">
              <span className="tl-dp-sec-lbl">Raw Event Payload</span>
              <pre className="tl-dp-ai-box" style={{ overflowX: 'auto', fontSize: 11 }}>
                {typeof (event.metadata || event.event_metadata) === 'string'
                  ? (event.metadata || event.event_metadata)
                  : JSON.stringify(event.metadata || event.event_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   MAIN TIMELINE PAGE
═════════════════════════════════════════ */
export default function Timeline() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')

  const fetchTimeline = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const res = await api.timeline.getForCase(activeId, { pageSize: 200 })
      const eventList = res?.observed_events || res?.events || res?.items || []
      setEvents(eventList)
    } catch (err) {
      setError(err.message || 'Failed to reconstruct investigation timeline.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchTimeline()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchTimeline(newId)
  }

  const filtered = useMemo(() => {
    return events.filter(e => {
      const q = search.toLowerCase()
      const src = (e.source || '').toLowerCase()
      const type = (e.event_type || '').toLowerCase()
      const val = (e.entity_value || e.description || '').toLowerCase()

      const matchesSearch = !search || src.includes(q) || type.includes(q) || val.includes(q)
      const matchesSource = sourceFilter === 'all' || src.includes(sourceFilter) || type.includes(sourceFilter)
      return matchesSearch && matchesSource
    })
  }, [events, search, sourceFilter])

  return (
    <div className="tl-root">

      {/* ── Header ── */}
      <div className="tl-page-header">
        <div className="tl-header-left">
          <div className="tl-eyebrow">
            <GitBranch size={12} />
            Chronological Forensic Synthesis
          </div>
          <h1 className="tl-page-title">Investigation Timeline</h1>
          <p className="tl-page-sub">
            Deterministic sequence reconstruction · Multi-evidence synchronization · Non-causal observation
          </p>
        </div>

        <div className="tl-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="tl-select"
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
            className="tl-btn tl-btn--ghost"
            onClick={() => fetchTimeline(selectedCaseId)}
            title="Refresh Timeline"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="tl-toolbar">
        <div className="tl-search-wrap">
          <Search size={13} className="tl-search-icon" />
          <input
            id="timeline-search"
            type="text"
            placeholder="Search timeline events, entities, sources…"
            className="tl-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="tl-search-clear" onClick={() => setSearch('')}>
              <X size={11} />
            </button>
          )}
        </div>

        <div className="tl-filter-group">
          {['all', 'log_entry', 'auth_event', 'file_operation', 'network_connection', 'alert'].map(s => (
            <button
              key={s}
              className={`tl-filter-tab ${sourceFilter === s ? 'tl-filter-tab--active' : ''}`}
              onClick={() => setSourceFilter(s)}
            >
              {s === 'all' ? 'All Events' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="tl-event-count">{filtered.length} observed events</span>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <LoadingView message="Reconstructing chronological events from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchTimeline(selectedCaseId)} message="Timeline Query Error" />
      ) : events.length === 0 ? (
        <EmptyStateView
          title="No events have been extracted from the available evidence."
          message="Upload digital evidence artifacts to this case to trigger automated normalization and timeline synthesis."
          icon={Activity}
        />
      ) : (
        <div className="tl-main-feed">
          <div className="tl-vertical-track">
            {filtered.map((evt, idx) => {
              const Icon = SOURCE_ICONS[evt.event_type] || SOURCE_ICONS[evt.source] || GitBranch
              const ts = evt.timestamp_utc || evt.timestamp
              const timeStr = ts ? new Date(ts).toUTCString().slice(17, 25) : (evt.original_timestamp ? evt.original_timestamp.slice(11, 19) : 'N/A')
              const dateStr = ts ? new Date(ts).toISOString().slice(0, 10) : '—'
              const titleStr = evt.description || evt.entity_value || evt.event_type

              return (
                <div
                  key={evt.event_id || evt.id || idx}
                  className="tl-card-item tl-card-item--normal"
                  onClick={() => setSelectedEvent(evt)}
                >
                  <div className="tl-time-badge">
                    <Clock size={11} />
                    <span>{timeStr} UTC</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{dateStr}</span>
                  </div>

                  <div className="tl-card-content">
                    <div className="tl-card-header-row">
                      <span className="tl-source-chip">
                        <Icon size={11} /> {evt.source || evt.event_type}
                      </span>
                      {evt.entity_type && (
                        <span className="tl-entity-badge">
                          {evt.entity_type}: {evt.entity_value}
                        </span>
                      )}
                    </div>
                    <p className="tl-event-title">{titleStr}</p>
                    <p className="tl-event-detail">Artifact ID #{evt.evidence_id} · {evt.source}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {selectedEvent && (
        <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

    </div>
  )
}
