import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Radio, Play, Pause, RotateCcw, Zap,
  Activity, Shield, Video, Lock, Monitor,
  Usb, FileSearch, Network, Brain, Cpu,
  CheckCircle2, Clock, AlertTriangle, Eye,
  Filter, Search, Terminal, ArrowRight,
  Sparkles, Layers, Info, RefreshCw,
  ChevronRight, ChevronDown, Check,
  Volume2, VolumeX, ShieldAlert, Bot, FolderOpen,
  X, Loader2, Trash2,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './LiveInvestigation.css'

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

export default function LiveInvestigation() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [events, setEvents] = useState([])
  const [wsStatus, setWsStatus] = useState('disconnected') // 'connecting' | 'connected' | 'disconnected'
  const [agentStatus, setAgentStatus] = useState({ agent: 'chief_agent', status: 'idle', message: 'Waiting for stream' })
  const [simRunning, setSimRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const wsRef = useRef(null)

  // Initialize cases
  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true)
        const res = await api.cases.list({ pageSize: 50 })
        const list = res?.items || []
        setCasesList(list)
        if (list.length > 0) {
          setSelectedCaseId(list[0].id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCases()
  }, [])

  // Connect WebSocket
  useEffect(() => {
    if (!selectedCaseId) return

    setWsStatus('connecting')
    const wsUrl = api.getWebSocketUrl(selectedCaseId)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setWsStatus('connected')
      }

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          if (msg.event_type === 'new_investigation_event') {
            const data = msg.data || {}
            setEvents(prev => [
              {
                id: data.id || `evt-${Date.now()}`,
                time: data.time_str || new Date().toLocaleTimeString(),
                source: data.source || 'Live Source',
                event_type: data.event_type || 'log_entry',
                label: data.event_label || data.entity_value || 'Live Stream Record',
                detail: data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : '',
                severity: data.is_simulated ? 'suspicious' : 'normal',
                is_simulated: Boolean(data.is_simulated),
                payload: data.metadata,
              },
              ...prev,
            ])
          } else if (msg.event_type === 'agent_status_updated') {
            setAgentStatus(msg.data || {})
          } else if (msg.event_type === 'simulation_started') {
            setSimRunning(true)
          } else if (msg.event_type === 'simulation_completed' || msg.event_type === 'simulation_stopped') {
            setSimRunning(false)
          }
        } catch {
          // non-json websocket packet
        }
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
      }

      ws.onclose = () => {
        setWsStatus('disconnected')
      }

      return () => {
        ws.close()
      }
    } catch {
      setWsStatus('disconnected')
    }
  }, [selectedCaseId])

  const handleStartSim = async () => {
    if (!selectedCaseId) return
    try {
      setSimRunning(true)
      await api.simulation.start(selectedCaseId, { step_delay_seconds: 1.5, auto_correlate: true, auto_reason: true })
    } catch (err) {
      alert(`Simulation launcher error: ${err.message}`)
      setSimRunning(false)
    }
  }

  const handleStopSim = async () => {
    if (!selectedCaseId) return
    try {
      await api.simulation.stop(selectedCaseId)
      setSimRunning(false)
    } catch (err) {
      alert(`Stop error: ${err.message}`)
    }
  }

  return (
    <div className="li-root">

      {/* ── Page Header ── */}
      <div className="li-page-header">
        <div className="li-header-left">
          <div className="li-eyebrow">
            <Radio size={13} className="li-live-pulse" />
            <span>Real-Time Telemetry Stream</span>
          </div>
          <h1 className="li-page-title">Live Investigation Room</h1>
          <p className="li-page-sub">
            Continuous forensic event ingestion · Live WebSocket pipeline · Autonomous multi-agent correlation
          </p>
        </div>

        <div className="li-header-right">
          {casesList.length > 0 && (
            <select
              className="li-select"
              value={selectedCaseId}
              onChange={e => { setSelectedCaseId(e.target.value); setEvents([]) }}
            >
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number || `CASE-${c.id}`} — {c.title}
                </option>
              ))}
            </select>
          )}

          <div className={`li-ws-badge li-ws-badge--${wsStatus}`}>
            <span className="li-ws-dot" />
            <span>{wsStatus === 'connected' ? 'WebSocket Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
          </div>

          {simRunning ? (
            <button className="li-btn li-btn--danger" onClick={handleStopSim}>
              <Pause size={14} />
              <span>Stop Demo Stream</span>
            </button>
          ) : (
            <button
              className="li-btn li-btn--primary"
              onClick={handleStartSim}
              disabled={!selectedCaseId}
            >
              <Play size={14} />
              <span>Launch Controlled Demo Stream</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Agent Status & Telemetry Bar ── */}
      <div className="li-agent-bar">
        <div className="li-ab-left">
          <div className="li-agent-icon-box">
            <Bot size={18} />
          </div>
          <div className="li-agent-info">
            <span className="li-agent-lbl">Active Agent</span>
            <span className="li-agent-name">{agentStatus.agent || 'Chief Investigator Agent'}</span>
          </div>
        </div>

        <div className="li-ab-center">
          <div className="li-telemetry-pill">
            <span className="li-telem-dot" />
            <span>Telemetry Status: <strong>{agentStatus.status || 'Listening'}</strong></span>
            <span className="li-telem-sep">·</span>
            <span className="li-telem-msg">{agentStatus.message || 'Stream open & ready'}</span>
          </div>
        </div>

        <div className="li-ab-right">
          <span className="li-count-badge">
            <Activity size={12} />
            <span>{events.length} Events Captured</span>
          </span>
          {events.length > 0 && (
            <button className="li-clear-btn" onClick={() => setEvents([])} title="Clear event stream">
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Events Stream Grid ── */}
      {loading ? (
        <LoadingView message="Initializing real-time WebSocket connection..." />
      ) : error ? (
        <ErrorView error={error} message="Live Room Error" />
      ) : casesList.length === 0 ? (
        <EmptyStateView
          title="No investigation cases found"
          message="Initialize an authorized investigation case to view live forensic event streams."
          icon={Radio}
        />
      ) : events.length === 0 ? (
        <EmptyStateView
          title="Awaiting real-time forensic events"
          message="WebSocket connected. Ingest real digital evidence artifacts or launch a controlled demo sequence to view live incoming telemetry."
          icon={Activity}
          actionText="Launch Controlled Demo Stream"
          onAction={handleStartSim}
        />
      ) : (
        <div className="li-feed-container">
          <div className="li-events-list">
            {events.map((evt, idx) => {
              const Icon = SOURCE_ICONS[evt.event_type] || Activity
              return (
                <div
                  key={evt.id || idx}
                  className={`li-event-card li-event-card--${evt.severity || 'normal'}`}
                  onClick={() => setSelectedEvent(evt)}
                >
                  <div className="li-ev-top">
                    <div className="li-ev-source">
                      <Icon size={13} />
                      <span>{evt.source}</span>
                    </div>
                    <span className="li-ev-time">
                      <Clock size={11} />
                      {evt.time}
                    </span>
                  </div>

                  <h4 className="li-ev-title">{evt.label}</h4>
                  {evt.detail && <p className="li-ev-detail">{evt.detail}</p>}

                  <div className="li-ev-footer">
                    {evt.is_simulated ? (
                      <span className="li-badge li-badge--sim">
                        DEMONSTRATION STREAM
                      </span>
                    ) : (
                      <span className="li-badge li-badge--live">
                        LIVE TELEMETRY
                      </span>
                    )}
                    <button className="li-ev-inspect-btn">
                      <Eye size={12} /> Inspect Payload
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Selected Event Payload Modal ── */}
      {selectedEvent && (
        <div className="li-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="li-modal-card" onClick={e => e.stopPropagation()}>
            <div className="li-modal-header">
              <div className="li-modal-title-row">
                <Terminal size={16} style={{ color: 'var(--blue-400)' }} />
                <h3>Live Stream Event Payload</h3>
              </div>
              <button className="li-modal-close" onClick={() => setSelectedEvent(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="li-modal-body">
              <div className="li-modal-meta">
                <div><strong>Source:</strong> <code>{selectedEvent.source}</code></div>
                <div><strong>Event Type:</strong> <code>{selectedEvent.event_type || 'generic'}</code></div>
                <div><strong>Timestamp:</strong> <code>{selectedEvent.time}</code></div>
              </div>
              <pre className="li-modal-json">
                {JSON.stringify(selectedEvent.payload || selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

