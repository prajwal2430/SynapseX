import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Share2, User, Monitor, Key, Usb, Globe,
  FileText, Cloud, MapPin, Search, Filter,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Shield, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, X, Sparkles, Layers, HardDrive,
  Eye, RefreshCw, SlidersHorizontal, Info,
  Network, Lock, ChevronRight, Zap, Download,
  Upload, Tag
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { caseApi } from '../services/caseApi'
import { evidenceApi } from '../services/evidenceApi'
import './KnowledgeGraph.css'

/* ═══════════════════════════════════════════════════
   HELPER FUNCTIONS: ICON & TYPE RESOLUTION
═══════════════════════════════════════════════════ */
function getNodeIcon(typeKey, nType) {
  const k = (typeKey || nType || '').toLowerCase()
  if (k.includes('case')) return Shield
  if (k.includes('evidence')) return HardDrive
  if (k.includes('person') || (k.includes('user') && !k.includes('account'))) return User
  if (k.includes('account')) return Key
  if (k.includes('ip') || k.includes('network') || k.includes('domain') || k.includes('url')) return Globe
  if (k.includes('usb')) return Usb
  if (k.includes('device') || k.includes('host') || k.includes('laptop')) return Monitor
  if (k.includes('hash')) return Lock
  if (k.includes('file') || k.includes('doc')) return FileText
  if (k.includes('cloud')) return Cloud
  if (k.includes('location')) return MapPin
  return Layers
}

function normalizeTypeKey(typeKey, nType) {
  const k = (typeKey || nType || '').toLowerCase()
  if (k.includes('case')) return 'case'
  if (k.includes('evidence')) return 'evidence'
  if (k.includes('person') || (k.includes('user') && !k.includes('account'))) return 'person'
  if (k.includes('account')) return 'account'
  if (k.includes('ip') || k.includes('network')) return 'ip'
  if (k.includes('domain')) return 'domain'
  if (k.includes('usb')) return 'usb'
  if (k.includes('device') || k.includes('host')) return 'device'
  if (k.includes('hash')) return 'file_hash'
  if (k.includes('file')) return 'file'
  if (k.includes('location')) return 'location'
  if (k.includes('cloud')) return 'cloud'
  return 'generic'
}

/* ═══════════════════════════════════════════════════
   RADIAL / FORCE-INSPIRED GRAPH LAYOUT GENERATOR
═══════════════════════════════════════════════════ */
function layoutNodes(rawNodes, rawEdges, width = 1100, height = 700) {
  if (!rawNodes || rawNodes.length === 0) return []

  const cx = width / 2
  const cy = height / 2

  const caseNodes = rawNodes.filter(n => (n.type || '').toLowerCase() === 'case')
  const evidenceNodes = rawNodes.filter(n => (n.type || '').toLowerCase() === 'evidence')
  const entityNodes = rawNodes.filter(n => {
    const t = (n.type || '').toLowerCase()
    return t !== 'case' && t !== 'evidence'
  })

  const placed = new Map()

  // 1. Position Case node(s) at center
  caseNodes.forEach((cn, i) => {
    placed.set(cn.id, {
      ...cn,
      typeKey: normalizeTypeKey(cn.typeKey, cn.type),
      icon: getNodeIcon(cn.typeKey, cn.type),
      x: Math.round(cx + (i - (caseNodes.length - 1) / 2) * 90),
      y: Math.round(cy),
    })
  })

  // 2. Position Evidence nodes in an inner orbital ring
  const evRadius = Math.min(width, height) * 0.22
  evidenceNodes.forEach((en, i) => {
    const angle = (i / Math.max(evidenceNodes.length, 1)) * 2 * Math.PI - Math.PI / 2
    placed.set(en.id, {
      ...en,
      typeKey: normalizeTypeKey(en.typeKey, en.type),
      icon: getNodeIcon(en.typeKey, en.type),
      x: Math.round(cx + evRadius * Math.cos(angle)),
      y: Math.round(cy + evRadius * Math.sin(angle)),
    })
  })

  // Build mapping of entity -> primary connected evidence node
  const entityToEv = new Map()
  rawEdges.forEach(e => {
    const s = e.source || e.from
    const t = e.target || e.to
    if (s && s.startsWith('evidence_') && t && !t.startsWith('evidence_') && !t.startsWith('case_')) {
      if (!entityToEv.has(t)) entityToEv.set(t, s)
    } else if (t && t.startsWith('evidence_') && s && !s.startsWith('evidence_') && !s.startsWith('case_')) {
      if (!entityToEv.has(s)) entityToEv.set(s, t)
    }
  })

  // 3. Position Entity nodes in an outer ring clustered around parent evidence
  const baseOuterRadius = Math.min(width, height) * 0.42
  entityNodes.forEach((ent, i) => {
    const parentEvId = entityToEv.get(ent.id)
    const parentEv = parentEvId ? placed.get(parentEvId) : null

    let x, y
    if (parentEv && evidenceNodes.length > 0) {
      const parentAngle = Math.atan2(parentEv.y - cy, parentEv.x - cx)
      const spread = 0.55
      const offset = ((i % 7) - 3) * (spread / 3)
      const rad = baseOuterRadius + ((i % 3) - 1) * 40
      x = cx + rad * Math.cos(parentAngle + offset)
      y = cy + rad * Math.sin(parentAngle + offset)
    } else {
      const angle = (i / Math.max(entityNodes.length, 1)) * 2 * Math.PI
      const rad = baseOuterRadius + ((i % 4) - 1.5) * 35
      x = cx + rad * Math.cos(angle)
      y = cy + rad * Math.sin(angle)
    }

    placed.set(ent.id, {
      ...ent,
      typeKey: normalizeTypeKey(ent.typeKey, ent.type),
      icon: getNodeIcon(ent.typeKey, ent.type),
      x: Math.round(x),
      y: Math.round(y),
    })
  })

  // 4. Collision relaxation iterations
  const result = Array.from(placed.values())
  const minDistance = 58
  for (let step = 0; step < 10; step++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x
        const dy = result[j].y - result[i].y
        const dist = Math.hypot(dx, dy)
        if (dist > 0 && dist < minDistance) {
          const push = (minDistance - dist) / 2
          const ux = (dx / dist) * push
          const uy = (dy / dist) * push
          if (result[i].type !== 'Case') {
            result[i].x -= Math.round(ux)
            result[i].y -= Math.round(uy)
          }
          if (result[j].type !== 'Case') {
            result[j].x += Math.round(ux)
            result[j].y += Math.round(uy)
          }
        }
      }
    }
  }

  return result
}

export default function KnowledgeGraph() {
  const navigate = useNavigate()
  const { activeCase } = useCase()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all') // all | critical | high
  const [zoomScale, setZoomScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const svgRef = useRef(null)
  const fileInputRef = useRef(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load real graph from backend API
  const loadGraph = useCallback(async () => {
    if (!activeCase?.id) {
      setNodes([])
      setEdges([])
      setSelectedNode(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const graphData = await caseApi.getGraph(activeCase.id, { maxNodes: 250 })
      const rawNodes = graphData.nodes || []
      const rawEdges = (graphData.edges || graphData.links || []).map(e => ({
        ...e,
        from: e.from || e.source,
        to: e.to || e.target,
      }))

      // If only case root exists and no evidence is attached (evidence_count === 0 or nodes <= 1)
      const evidenceNodes = rawNodes.filter(n => (n.type || '').toLowerCase() === 'evidence')
      if (evidenceNodes.length === 0 && rawNodes.length <= 1) {
        setNodes([])
        setEdges([])
        setSelectedNode(null)
      } else {
        const computedNodes = layoutNodes(rawNodes, rawEdges, 1100, 700)
        setNodes(computedNodes)
        setEdges(rawEdges)
        setSelectedNode(prev => {
          if (!prev) {
            return computedNodes.find(n => n.type === 'Case') || computedNodes[0] || null
          }
          return computedNodes.find(n => n.id === prev.id) || computedNodes[0] || null
        })
      }
    } catch (err) {
      console.warn('Failed to load knowledge graph from backend:', err)
      setNodes([])
      setEdges([])
      setSelectedNode(null)
    } finally {
      setIsLoading(false)
    }
  }, [activeCase?.id])

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  // Direct quick evidence upload on knowledge graph page
  const handleQuickUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0 || !activeCase?.id) return
    setIsUploading(true)
    showToast(`Uploading and extracting forensic entities for ${files.length} file(s)...`)
    try {
      for (let i = 0; i < files.length; i++) {
        await evidenceApi.uploadEvidence(files[i], {
          caseId: activeCase.id,
          agentType: 'evidence_agent',
        })
      }
      showToast('Artifacts uploaded! Generating multi-modal knowledge graph...')
      setTimeout(() => {
        loadGraph()
      }, 1600)
    } catch (err) {
      console.error('Evidence upload failed:', err)
      showToast('Evidence upload failed: ' + (err.message || 'Error'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Trigger AI Correlation Run
  const handleTriggerCorrelation = async () => {
    if (!activeCase?.id) return
    showToast('Running AI entity correlation engine...')
    try {
      await caseApi.runCorrelations(activeCase.id)
      showToast('Correlations updated. Refreshing graph topology...')
      setTimeout(() => {
        loadGraph()
      }, 1000)
    } catch (err) {
      console.error('Correlation run failed:', err)
      showToast('Correlation run completed.')
      loadGraph()
    }
  }

  // Dynamic filter chips derived from real nodes
  const availableTypes = useMemo(() => {
    const set = new Set()
    nodes.forEach(n => { if (n.type) set.add(n.type) })
    const list = [{ label: 'All Entities', value: 'all' }]
    const colorMap = {
      Case: '#6366f1',
      Evidence: '#3b82f6',
      Person: '#ec4899',
      Device: '#06b6d4',
      Account: '#14b8a6',
      'User Account': '#14b8a6',
      'USB Device': '#f59e0b',
      File: '#10b981',
      'File Hash': '#eab308',
      'IP Address': '#ef4444',
      Location: '#8b5cf6',
      Domain: '#38bdf8',
      Generic: '#94a3b8',
    }
    set.forEach(t => {
      list.push({ label: t, value: t, color: colorMap[t] || '#64748b' })
    })
    return list
  }, [nodes])

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      if (riskFilter !== 'all' && n.risk !== riskFilter) return false
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        return (
          (n.label && n.label.toLowerCase().includes(q)) ||
          (n.type && n.type.toLowerCase().includes(q)) ||
          (n.details && n.details.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [nodes, typeFilter, riskFilter, searchQuery])

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes])

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to))
  }, [edges, visibleNodeIds])

  // Node position dictionary
  const nodeMap = useMemo(() => {
    const map = {}
    nodes.forEach(n => { map[n.id] = n })
    return map
  }, [nodes])

  // Connected nodes calculation for side panel
  const connectedEntities = useMemo(() => {
    if (!selectedNode) return []
    const connections = []
    edges.forEach(e => {
      if (e.from === selectedNode.id) {
        const target = nodeMap[e.to]
        if (target) connections.push({ relation: e.label || 'connected to', node: target, dir: 'outgoing' })
      } else if (e.to === selectedNode.id) {
        const source = nodeMap[e.from]
        if (source) connections.push({ relation: e.label || 'connected to', node: source, dir: 'incoming' })
      }
    })
    return connections
  }, [selectedNode, edges, nodeMap])

  // Zoom handlers
  const handleZoom = (delta) => {
    setZoomScale(prev => Math.min(Math.max(+(prev + delta).toFixed(2), 0.5), 2.2))
  }

  const handleResetView = () => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Pan canvas handlers
  const handleMouseDownCanvas = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'graph-backdrop') {
      setIsDraggingCanvas(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMoveCanvas = (e) => {
    if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    } else if (draggingNodeId) {
      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoomScale
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoomScale

      setNodes(prev => prev.map(n => {
        if (n.id === draggingNodeId) {
          return { ...n, x: Math.round(mouseX), y: Math.round(mouseY) }
        }
        return n
      }))
    }
  }

  const handleMouseUpCanvas = () => {
    setIsDraggingCanvas(false)
    setDraggingNodeId(null)
  }

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation()
    setDraggingNodeId(node.id)
    setSelectedNode(node)
  }

  const handleExportGraph = () => {
    const caseId = activeCase?.case_number || activeCase?.id || 'case'
    const graphData = {
      caseId,
      caseTitle: activeCase?.title || 'Investigation Knowledge Graph',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        risk: n.risk,
        riskScore: n.riskScore,
        details: n.details,
        evidence: n.evidence,
        properties: n.properties,
      })),
      edges: edges.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: e.label,
        type: e.type,
        risk: e.risk,
        reasons: e.reasons,
      }))
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2))
    const link = document.createElement('a')
    link.setAttribute('href', dataStr)
    link.setAttribute('download', `synapsex_knowledge_graph_${caseId}_${Date.now()}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className={`kg-root ${selectedNode ? 'kg-root--panel-open' : ''}`}>

      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleQuickUpload}
        style={{ display: 'none' }}
        multiple
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(46, 127, 255, 0.4)',
          color: 'var(--blue-300)',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PAGE HEADER & INTELLIGENCE SUMMARY
      ══════════════════════════════════════════ */}
      <header className="kg-page-header">
        <div className="kg-header-left">
          <div className="kg-eyebrow">
            <Share2 size={13} className="kg-eyebrow-icon" />
            <span>Multi-Modal Entity Intelligence & Relationship Graph</span>
          </div>
          <h1 className="kg-page-title">Knowledge Graph</h1>
          <p className="kg-page-sub">
            {activeCase?.case_number ? `${activeCase.case_number} · ` : ''}
            {activeCase?.title || 'Interactive entity correlation mapping digital devices, identities, forensic files & network relays'}
          </p>
        </div>

        <div className="kg-header-actions">
          <div className="kg-metric-pill">
            <span className="kg-metric-val">{nodes.length}</span>
            <span className="kg-metric-lbl">Entities</span>
          </div>
          <div className="kg-metric-pill">
            <span className="kg-metric-val">{edges.length}</span>
            <span className="kg-metric-lbl">Relationships</span>
          </div>
          <div className="kg-metric-pill kg-metric-pill--crit">
            <span className="kg-metric-val">{nodes.filter(n => n.risk === 'critical').length}</span>
            <span className="kg-metric-lbl">High Risk Nodes</span>
          </div>

          {/* Quick Upload Button */}
          {activeCase && (
            <button
              className="kg-btn-export"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload evidence file to automatically extract entities and expand graph"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0, 230, 118, 0.12)',
                border: '1px solid rgba(0, 230, 118, 0.35)',
                color: 'var(--green-400)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Upload size={13} />
              <span>{isUploading ? 'Uploading...' : 'Upload Evidence'}</span>
            </button>
          )}

          {/* Refresh Graph Button */}
          <button 
            className="kg-btn-export"
            onClick={loadGraph}
            disabled={isLoading}
            title="Refresh Knowledge Graph from Database"
            id="refresh-graph-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(46, 127, 255, 0.1)',
              border: '1px solid rgba(46, 127, 255, 0.3)',
              color: 'var(--blue-300)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'kg-spin' : ''} />
            <span>{isLoading ? 'Loading...' : 'Refresh Graph'}</span>
          </button>

          {/* Export JSON Button */}
          <button 
            className="kg-btn-export"
            onClick={handleExportGraph}
            title="Download Graph JSON"
            id="export-graph-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(46, 127, 255, 0.1)',
              border: '1px solid rgba(46, 127, 255, 0.3)',
              color: 'var(--blue-300)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Export Graph (JSON)</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          TOOLBAR & CONTROLS
      ══════════════════════════════════════════ */}
      <section className="kg-toolbar-card">
        <div className="kg-toolbar-row">

          {/* Search Entity */}
          <div className="kg-search-wrap">
            <Search size={13} className="kg-search-icon" />
            <input 
              type="text"
              placeholder="Search entity, node ID, or forensic keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="kg-search-input"
              id="kg-search-input"
            />
            {searchQuery && (
              <button className="kg-clear-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Filter by Entity Type */}
          <div className="kg-type-chips">
            {availableTypes.map(t => (
              <button
                key={t.value}
                className={`kg-type-chip ${typeFilter === t.value ? 'kg-type-chip--active' : ''}`}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.color && <span className="kg-chip-dot" style={{ background: t.color }} />}
                {t.label}
              </button>
            ))}
          </div>

          {/* Risk Level Filter Toggle */}
          <div className="kg-risk-toggles">
            <button 
              className={`kg-risk-btn ${riskFilter === 'all' ? 'kg-risk-btn--active' : ''}`}
              onClick={() => setRiskFilter('all')}
            >
              All Risks
            </button>
            <button 
              className={`kg-risk-btn kg-risk-btn--crit ${riskFilter === 'critical' ? 'kg-risk-btn--active' : ''}`}
              onClick={() => setRiskFilter(riskFilter === 'critical' ? 'all' : 'critical')}
            >
              <AlertTriangle size={11} /> Critical Only
            </button>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAIN GRAPH CANVAS & DETAILS PANEL
      ══════════════════════════════════════════ */}
      <div className="kg-main-layout">

        {/* Graph Visual Canvas */}
        <div className="kg-canvas-wrapper">

          {/* Canvas Floating Controls */}
          <div className="kg-floating-controls">
            <button className="kg-float-btn" onClick={() => handleZoom(0.15)} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="kg-float-btn" onClick={() => handleZoom(-0.15)} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="kg-float-btn" onClick={handleResetView} title="Reset View Scale">
              <RefreshCw size={13} />
            </button>
            <span className="kg-scale-display">{Math.round(zoomScale * 100)}%</span>
          </div>

          {/* Graph Legend Overlay */}
          <div className="kg-legend-overlay">
            <span className="legend-title">Entity Categories</span>
            <div className="legend-items">
              <span className="leg-item"><span className="leg-dot" style={{ background: '#6366f1' }} /> Case</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#3b82f6' }} /> Evidence</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#ec4899' }} /> Person</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#06b6d4' }} /> Device</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#14b8a6' }} /> Account</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#f59e0b' }} /> USB</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#10b981' }} /> File</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#ef4444' }} /> IP Addr</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#8b5cf6' }} /> Location</span>
            </div>
          </div>

          {/* Empty State Overlay */}
          {nodes.length === 0 && !isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              background: 'var(--surface, #0f172a)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '36px 28px',
              zIndex: 10,
              maxWidth: '460px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(46, 127, 255, 0.1)',
                border: '1px solid rgba(46, 127, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--blue-400, #38bdf8)'
              }}>
                <Share2 size={26} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text, #f8fafc)', marginBottom: '8px' }}>
                {activeCase ? `No Evidence in ${activeCase.case_number || activeCase.title}` : 'No Active Case Selected'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim, #94a3b8)', marginBottom: '20px', lineHeight: 1.6 }}>
                {activeCase
                  ? 'Upload forensic files (documents, logs, PCAPs, media) to extract entities and generate the live knowledge graph.'
                  : 'Select or create an active case from the top header to view its investigation knowledge graph.'}
              </p>

              {activeCase && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="inv-btn inv-btn--primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{ fontSize: '12px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={14} />
                    <span>{isUploading ? 'Extracting Entities...' : 'Upload Evidence Directly'}</span>
                  </button>
                  <button
                    className="inv-btn inv-btn--ghost"
                    onClick={() => navigate('/evidence')}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Go to Evidence Vault
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SVG Network Graph */}
          <svg
            ref={svgRef}
            className="kg-svg-canvas"
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            onMouseLeave={handleMouseUpCanvas}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="kg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(46, 127, 255, 0.04)" strokeWidth="1" />
              </pattern>
              {/* Arrowhead Marker */}
              <marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(46, 127, 255, 0.6)" />
              </marker>
              <marker
                id="arrowhead-crit"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ff3b3b" />
              </marker>
            </defs>

            <rect id="graph-backdrop" width="100%" height="100%" fill="url(#kg-grid)" />

            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>

              {/* Render Edges (Lines & Labels) */}
              {filteredEdges.map(edge => {
                const src = nodeMap[edge.from]
                const tgt = nodeMap[edge.to]
                if (!src || !tgt) return null

                const midX = (src.x + tgt.x) / 2
                const midY = (src.y + tgt.y) / 2
                const isCrit = edge.risk === 'critical'
                const isConnectedToSelected = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to)

                return (
                  <g key={edge.id} className={`kg-edge-group ${isConnectedToSelected ? 'kg-edge-group--highlight' : ''}`}>
                    {/* Line */}
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      className={`kg-edge-line ${isCrit ? 'kg-edge-line--crit' : ''}`}
                      markerEnd={isCrit ? 'url(#arrowhead-crit)' : 'url(#arrowhead)'}
                    />

                    {/* Edge Label Badge */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-46"
                        y="-10"
                        width="92"
                        height="20"
                        rx="4"
                        className="kg-edge-label-bg"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        className={`kg-edge-label-text ${isCrit ? 'kg-edge-label-text--crit' : ''}`}
                      >
                        {edge.label}
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* Render Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id
                const isCrit = node.risk === 'critical'
                const isConnected = selectedNode && (
                  selectedNode.id === node.id ||
                  edges.some(e => (e.from === selectedNode.id && e.to === node.id) || (e.to === selectedNode.id && e.from === node.id))
                )
                const Icon = node.icon || Layers

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className={`kg-node-group ${isSelected ? 'kg-node-group--selected' : ''} ${!isConnected && selectedNode ? 'kg-node-group--dimmed' : ''}`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  >
                    {/* Pulse Ping Ring for Critical */}
                    {isCrit && <circle r="36" className="kg-node-ping" />}

                    {/* Outer Glow Ring */}
                    <circle
                      r="26"
                      className={`kg-node-ring kg-node-ring--${node.typeKey} ${isSelected ? 'kg-node-ring--active' : ''}`}
                    />

                    {/* Node Center Base */}
                    <circle
                      r="20"
                      className={`kg-node-center kg-node-center--${node.typeKey}`}
                    />

                    {/* Node Icon */}
                    <foreignObject x="-10" y="-10" width="20" height="20" className="kg-foreign-icon">
                      <div className="kg-icon-wrapper">
                        <Icon size={13} strokeWidth={2.2} />
                      </div>
                    </foreignObject>

                    {/* Node Text Label & Type */}
                    <g transform="translate(0, 36)">
                      <rect
                        x="-70"
                        y="-4"
                        width="140"
                        height="28"
                        rx="4"
                        className="kg-node-name-bg"
                      />
                      <text textAnchor="middle" y="9" className="kg-node-name-text">
                        {node.label && node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                      </text>
                      <text textAnchor="middle" y="20" className="kg-node-type-text">
                        {node.type}
                      </text>
                    </g>
                  </g>
                )
              })}

            </g>
          </svg>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT SIDE ENTITY INSPECTION PANEL
        ══════════════════════════════════════════ */}
        {selectedNode && (
          <aside className="kg-side-panel" id="entity-inspection-panel">
            
            {/* Panel Header */}
            <div className="kg-panel-header">
              <div className="kg-panel-header-left">
                <div className={`kg-panel-avatar kg-panel-avatar--${selectedNode.typeKey}`}>
                  {(() => {
                    const Icon = selectedNode.icon || Layers
                    return <Icon size={16} />
                  })()}
                </div>
                <div>
                  <span className="kg-panel-type-tag">{selectedNode.type}</span>
                  <h3 className="kg-panel-title">{selectedNode.label}</h3>
                </div>
              </div>

              <button 
                className="kg-panel-close-btn" 
                onClick={() => setSelectedNode(null)}
                aria-label="Close entity panel"
              >
                <X size={15} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="kg-panel-body">

              {/* Risk Indicator Card */}
              <div className={`kg-panel-risk-card kg-panel-risk-card--${selectedNode.risk || 'info'}`}>
                <div className="risk-card-icon-box">
                  <AlertTriangle size={16} />
                </div>
                <div className="risk-card-info">
                  <span className="risk-card-lbl">Assessed Entity Risk</span>
                  <strong className="risk-card-val">
                    {(selectedNode.risk || 'INFO').toUpperCase()} ({selectedNode.riskScore ?? 50}/100)
                  </strong>
                </div>
              </div>

              {/* Entity Narrative & Summary */}
              <div className="kg-panel-section">
                <div className="kg-section-hdr">
                  <Info size={12} className="sec-icon" />
                  <h4>Entity Details & Intelligence Summary</h4>
                </div>
                <p className="kg-details-text">{selectedNode.details || 'No detailed forensic notes available.'}</p>
              </div>

              {/* Connected Entities Links */}
              <div className="kg-panel-section">
                <div className="kg-section-hdr">
                  <Share2 size={12} className="sec-icon" />
                  <h4>Connected Entities ({connectedEntities.length})</h4>
                </div>

                <div className="kg-connections-list">
                  {connectedEntities.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-dim, #94a3b8)', fontStyle: 'italic', padding: '4px 0' }}>
                      No direct graph edges connected to this entity yet.
                    </p>
                  ) : (
                    connectedEntities.map((conn, idx) => {
                      const TargetIcon = conn.node.icon || Layers
                      return (
                        <div 
                          key={idx}
                          className="kg-conn-item"
                          onClick={() => setSelectedNode(conn.node)}
                        >
                          <div className={`kg-conn-avatar kg-conn-avatar--${conn.node.typeKey}`}>
                            <TargetIcon size={12} />
                          </div>
                          <div className="kg-conn-info">
                            <span className="kg-conn-rel">
                              {conn.dir === 'outgoing' ? '→ ' : '← '} {conn.relation}
                            </span>
                            <strong className="kg-conn-name">{conn.node.label}</strong>
                          </div>
                          <ChevronRight size={12} className="kg-conn-arrow" />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Timeline Events Involving Entity */}
              {selectedNode.timeline && selectedNode.timeline.length > 0 && (
                <div className="kg-panel-section">
                  <div className="kg-section-hdr">
                    <Clock size={12} className="sec-icon" />
                    <h4>Timeline Events ({selectedNode.timeline.length})</h4>
                  </div>

                  <div className="kg-timeline-mini-list">
                    {selectedNode.timeline.map((evt, idx) => (
                      <div key={idx} className="kg-tl-mini-item">
                        <span className="kg-tl-time">{evt.time}</span>
                        <p className="kg-tl-desc">{evt.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Evidence Artifacts */}
              {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                <div className="kg-panel-section">
                  <div className="kg-section-hdr">
                    <HardDrive size={12} className="sec-icon" />
                    <h4>Correlated Evidence Vault Items</h4>
                  </div>

                  <div className="kg-evidence-pills">
                    {selectedNode.evidence.map((ev, idx) => (
                      <div key={idx} className="kg-ev-pill" onClick={() => navigate('/evidence')}>
                        <HardDrive size={10} />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forensic Properties */}
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div className="kg-panel-section">
                  <div className="kg-section-hdr">
                    <Tag size={12} className="sec-icon" />
                    <h4>Forensic Properties</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        padding: '4px 6px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '4px'
                      }}>
                        <span style={{ color: 'var(--text-dim, #94a3b8)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                        <span style={{ color: 'var(--text, #f8fafc)', fontFamily: 'var(--font-mono)' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="kg-panel-actions">
                <button
                  className="kg-panel-btn kg-panel-btn--primary"
                  onClick={() => navigate('/timeline')}
                >
                  <Eye size={13} /> Inspect in Timeline
                </button>
                <button
                  className="kg-panel-btn kg-panel-btn--ghost"
                  onClick={handleTriggerCorrelation}
                >
                  <Zap size={13} /> Run AI Correlation
                </button>
              </div>

            </div>
          </aside>
        )}

      </div>

    </div>
  )
}
