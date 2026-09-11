import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import {
  Share2, User, Monitor, Key, Usb, Globe,
  FileText, Cloud, MapPin, Search, Filter,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Shield, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, X, Sparkles, Layers, HardDrive,
  Eye, RefreshCw, SlidersHorizontal, Info,
  Network, Lock, ChevronRight, Zap, FolderOpen,
} from 'lucide-react'
import { api } from '../services/api'
import { LoadingView, ErrorView, EmptyStateView } from '../components/common/StateViews'
import './KnowledgeGraph.css'

const TYPE_ICONS = {
  person:       User,
  device:       Monitor,
  user_account: Key,
  usb_device:   Usb,
  ip_address:   Globe,
  file:         FileText,
  location:     MapPin,
  file_hash:    Shield,
  domain:       Globe,
  evidence:     HardDrive,
  event:        Clock,
  default:      Share2,
}

/* ─────────────────────────────────────────
   NODE DETAIL PANEL
───────────────────────────────────────── */
function NodeDetailPanel({ node, onClose }) {
  if (!node) return null
  const Icon = TYPE_ICONS[node.typeKey] || TYPE_ICONS.default

  return (
    <div className="kg-panel-backdrop" onClick={onClose}>
      <div className="kg-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="kg-dp-header">
          <div className="kg-dp-header-left">
            <span className="kg-dp-id">{node.id}</span>
            <span className={`kg-dp-type-chip kg-dp-type-chip--${node.typeKey}`}>
              <Icon size={11} /> {node.type}
            </span>
          </div>
          <button className="kg-dp-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="kg-dp-body">
          <div className="kg-dp-title-row">
            <div className={`kg-dp-icon-wrap kg-dp-icon-wrap--${node.typeKey}`}>
              <Icon size={22} />
            </div>
            <div>
              <h2 className="kg-dp-title">{node.label}</h2>
              <span className="kg-dp-risk-tag kg-dp-risk-tag--medium">
                Normalized Entity ({node.type})
              </span>
            </div>
          </div>

          <div className="kg-dp-section">
            <span className="kg-dp-sec-lbl">Grounded Details</span>
            <p className="kg-dp-details">{node.details || `Entity ${node.label} extracted deterministically from digital evidence artifact #${node.evidence_id || 'N/A'}.`}</p>
          </div>

          {node.evidence && node.evidence.length > 0 && (
            <div className="kg-dp-section">
              <span className="kg-dp-sec-lbl">Source Grounding</span>
              <div className="kg-dp-evidence-list">
                {node.evidence.map((ev, i) => (
                  <div key={i} className="kg-dp-evidence-item">
                    <FileText size={12} />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   MAIN KNOWLEDGE GRAPH PAGE
═════════════════════════════════════════ */
export default function KnowledgeGraph() {
  const [casesList, setCasesList] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [graphNodes, setGraphNodes] = useState([])
  const [graphEdges, setGraphEdges] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchGraph = useCallback(async (caseId) => {
    try {
      setLoading(true)
      setError(null)

      const casesRes = await api.cases.list({ pageSize: 50 })
      const cases = casesRes?.items || []
      setCasesList(cases)

      if (cases.length === 0) {
        setGraphNodes([])
        setGraphEdges([])
        setLoading(false)
        return
      }

      const activeId = caseId || selectedCaseId || cases[0].id
      setSelectedCaseId(activeId)

      const res = await api.graph.getForCase(activeId)
      const rawNodes = res?.nodes || []
      const rawEdges = res?.edges || []

      // Lay out nodes deterministically across visual grid
      const count = rawNodes.length
      const nodesWithPositions = rawNodes.map((n, i) => {
        const angle = (i / Math.max(1, count)) * 2 * Math.PI
        const radius = Math.min(300, 80 + count * 15)
        const cx = 450 + radius * Math.cos(angle)
        const cy = 280 + radius * Math.sin(angle)
        const tKey = (n.type || 'entity').toLowerCase()

        return {
          id: n.id || `node-${i}`,
          label: n.label || n.name || `Node ${i}`,
          type: n.type || 'Entity',
          typeKey: tKey,
          x: cx,
          y: cy,
          details: n.details || n.context || '',
          evidence: n.evidence_ids ? n.evidence_ids.map(id => `Evidence #${id}`) : [],
          raw: n,
        }
      })

      setGraphNodes(nodesWithPositions)
      setGraphEdges(rawEdges)
    } catch (err) {
      setError(err.message || 'Failed to retrieve case knowledge graph.')
    } finally {
      setLoading(false)
    }
  }, [selectedCaseId])

  useEffect(() => {
    fetchGraph()
  }, [])

  const handleCaseChange = (e) => {
    const newId = e.target.value
    setSelectedCaseId(newId)
    fetchGraph(newId)
  }

  const handleSyncNeo4j = async () => {
    if (!selectedCaseId) return
    try {
      setSyncing(true)
      const res = await api.graph.syncToNeo4j(selectedCaseId)
      alert(`Neo4j Synchronization: ${res?.message || 'Graph synchronized successfully!'}`)
    } catch (err) {
      alert(`Neo4j Sync Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const filteredNodes = useMemo(() => {
    return graphNodes.filter(n => {
      const q = search.toLowerCase()
      const matchesSearch = !search || n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || n.typeKey === typeFilter
      return matchesSearch && matchesType
    })
  }, [graphNodes, search, typeFilter])

  return (
    <div className="kg-root">

      {/* ── Header ── */}
      <div className="kg-page-header">
        <div className="kg-header-left">
          <div className="kg-eyebrow">
            <Share2 size={12} />
            Entity Relationship Topology
          </div>
          <h1 className="kg-page-title">Investigation Knowledge Graph</h1>
          <p className="kg-page-sub">
            Deterministic entity extraction · Multi-signal relationship mapping · Neo4j synchronization
          </p>
        </div>

        <div className="kg-header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {casesList.length > 0 && (
            <select
              className="kg-select"
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
            className="kg-btn kg-btn--ghost"
            onClick={() => fetchGraph(selectedCaseId)}
            title="Refresh Knowledge Graph"
          >
            <RefreshCw size={14} />
          </button>

          <button
            className="kg-btn kg-btn--secondary"
            onClick={handleSyncNeo4j}
            disabled={syncing || graphNodes.length === 0}
            title="Sync graph nodes to Neo4j"
          >
            <Database size={14} />
            {syncing ? 'Syncing Neo4j...' : 'Sync to Neo4j'}
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="kg-toolbar">
        <div className="kg-search-wrap">
          <Search size={13} className="kg-search-icon" />
          <input
            id="graph-search"
            type="text"
            placeholder="Search entities, accounts, hosts, files..."
            className="kg-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="kg-search-clear" onClick={() => setSearch('')}>
              <X size={11} />
            </button>
          )}
        </div>

        <div className="kg-filter-group">
          {['all', 'person', 'device', 'user_account', 'usb_device', 'ip_address', 'file'].map(t => (
            <button
              key={t}
              className={`kg-filter-tab ${typeFilter === t ? 'kg-filter-tab--active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All Entities' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="kg-node-count">{filteredNodes.length} mapped entities · {graphEdges.length} relationships</span>
      </div>

      {/* ── Canvas View ── */}
      {loading ? (
        <LoadingView message="Synthesizing knowledge graph relationships from database..." />
      ) : error ? (
        <ErrorView error={error} onRetry={() => fetchGraph(selectedCaseId)} message="Knowledge Graph Query Error" />
      ) : graphNodes.length === 0 ? (
        <EmptyStateView
          title="No entity relationships found."
          message="Upload and process digital evidence to extract deterministic entities and synthesize relationship graphs."
          icon={Share2}
        />
      ) : (
        <div className="kg-canvas-container">
          <svg className="kg-canvas" width="100%" height="600" viewBox="0 0 900 600">
            {/* Draw Relationship Lines */}
            {graphEdges.map((edge, i) => {
              const src = graphNodes.find(n => n.id === edge.source || n.id === edge.from)
              const tgt = graphNodes.find(n => n.id === edge.target || n.id === edge.to)
              if (!src || !tgt) return null

              return (
                <g key={i}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {edge.label && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 4}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Draw Nodes */}
            {filteredNodes.map((node) => {
              const Icon = TYPE_ICONS[node.typeKey] || TYPE_ICONS.default
              const isSelected = selectedNode?.id === node.id

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={isSelected ? 26 : 22}
                    fill={isSelected ? '#0284c7' : '#0f172a'}
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <foreignObject x="-10" y="-10" width="20" height="20" style={{ pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#38bdf8' }}>
                      <Icon size={14} />
                    </div>
                  </foreignObject>
                  <text
                    y="36"
                    fill="#f1f5f9"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                  >
                    {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

    </div>
  )
}
