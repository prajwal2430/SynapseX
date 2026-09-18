import { useState, useRef, useMemo, useEffect } from 'react'
import {
  Share2, User, Monitor, Key, Usb, Globe,
  FileText, Cloud, MapPin, Search, Filter,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Shield, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, X, Sparkles, Layers, HardDrive,
  Eye, RefreshCw, SlidersHorizontal, Info,
  Network, Lock, ChevronRight, Zap, Download
} from 'lucide-react'
import './KnowledgeGraph.css'

/* ═══════════════════════════════════════════════════
   GRAPH ENTITIES & EDGES DATASET
═══════════════════════════════════════════════════ */
const INITIAL_NODES = [
  {
    id: 'n-person-1',
    label: 'Person X (J. Smith)',
    type: 'Person',
    typeKey: 'person',
    icon: User,
    x: 180,
    y: 220,
    risk: 'critical',
    riskScore: 92,
    details: 'Subject Alpha observed in CCTV CAM-07 outside Server Room B. Matched to employee identity badge Card #27.',
    evidence: ['E-001 (cctv_camera_01.mp4)', 'EVD-ACS-0041 (server_room_b_access.csv)'],
    timeline: [
      { time: '10:02:14', event: 'Entered Server Room B restricted corridor' },
      { time: '10:03:02', event: 'Scanned Card #27 at DR-B02 reader' },
      { time: '10:14:05', event: 'Exited via North Perimeter Stairwell' }
    ]
  },
  {
    id: 'n-location-1',
    label: 'Server Room B',
    type: 'Location',
    typeKey: 'location',
    icon: MapPin,
    x: 180,
    y: 430,
    risk: 'high',
    riskScore: 78,
    details: 'Physical restricted data facility housing corporate financial compute clusters and terminal WKST-041.',
    evidence: ['EVD-ACS-0041 (access_log.csv)', 'E-001 (cctv_camera_01.mp4)'],
    timeline: [
      { time: '10:02:14', event: 'Motion sensor anomaly outside DR-B02' },
      { time: '10:03:02', event: 'Door DR-B02 opened via Card #27' }
    ]
  },
  {
    id: 'n-card-1',
    label: 'Card #27',
    type: 'User Account',
    typeKey: 'account',
    icon: Key,
    x: 360,
    y: 340,
    risk: 'high',
    riskScore: 82,
    details: 'RFID physical access credential assigned to employee EMP-4421. Badge used at door DR-B02.',
    evidence: ['EVD-ACS-0041 (server_room_b_access.csv)'],
    timeline: [
      { time: '10:03:02', event: 'Access granted at Door DR-B02' }
    ]
  },
  {
    id: 'n-laptop-1',
    label: 'LAPTOP-07',
    type: 'Device',
    typeKey: 'device',
    icon: Monitor,
    x: 480,
    y: 220,
    risk: 'critical',
    riskScore: 94,
    details: 'Workstation terminal WKST-041 located in Server Room B. Physical staging point for USB copy and network exfiltration.',
    evidence: ['E-002 (windows_event_logs.evtx)', 'E-004 (usb_activity_log.csv)', 'E-005 (memory_dump_wkst041.raw)'],
    timeline: [
      { time: '10:04:10', event: 'Interactive logon under jsmith@corp.int' },
      { time: '10:05:32', event: 'Mass storage USB-123 mounted on E:\\' },
      { time: '10:07:45', event: '34 confidential finance files read and compressed' },
      { time: '10:09:20', event: '1.8 GB outbound TLS socket transmission' }
    ]
  },
  {
    id: 'n-user-1',
    label: 'jsmith@corp.int',
    type: 'User Account',
    typeKey: 'account',
    icon: Key,
    x: 480,
    y: 70,
    risk: 'critical',
    riskScore: 88,
    details: 'Active Directory domain account used to authenticate Kerberos session on LAPTOP-07.',
    evidence: ['E-002 (windows_event_logs.evtx)'],
    timeline: [
      { time: '10:04:10', event: 'Kerberos TGT ticket requested (Event 4624)' }
    ]
  },
  {
    id: 'n-usb-1',
    label: 'USB-123',
    type: 'USB Device',
    typeKey: 'usb',
    icon: Usb,
    x: 720,
    y: 130,
    risk: 'critical',
    riskScore: 96,
    details: 'Unregistered SanDisk Cruzer Glide 128GB (Serial: SDCZ48-128G-84912) used as local staging volume.',
    evidence: ['E-004 (usb_activity_log.csv)', 'E-002 (windows_event_logs.evtx)'],
    timeline: [
      { time: '10:05:32', event: 'USB insertion registered by Windows Plug and Play' },
      { time: '10:08:54', event: 'Device safely unmounted before physical exit' }
    ]
  },
  {
    id: 'n-file-1',
    label: 'Confidential_File.pdf',
    type: 'File',
    typeKey: 'file',
    icon: FileText,
    x: 740,
    y: 280,
    risk: 'critical',
    riskScore: 98,
    details: 'Part of /Finance/Q2-Projections/ package (2.1 GB archive) containing sensitive revenue forecasts and M&A briefs.',
    evidence: ['E-002 (windows_event_logs.evtx)', 'EVD-CIFS-0091 (file_audit.log)'],
    timeline: [
      { time: '10:07:45', event: 'Read and copied into archive.tar.gz on E:\\tmp' }
    ]
  },
  {
    id: 'n-ip-1',
    label: '185.220.101.47',
    type: 'IP Address',
    typeKey: 'ip',
    icon: Globe,
    x: 740,
    y: 440,
    risk: 'critical',
    riskScore: 99,
    details: 'Remote destination IP verified on Tor Project directory as an active exit node. Destination for 1.8 GB encrypted egress.',
    evidence: ['E-003 (firewall_egress_logs.csv)', 'E-006 (network_capture.pcap)'],
    timeline: [
      { time: '10:09:20', event: 'TLS 1.3 encrypted tunnel session established on port 443' }
    ]
  },
  {
    id: 'n-cloud-1',
    label: 'MegaDrop C2 Cloud',
    type: 'Cloud Service',
    typeKey: 'cloud',
    icon: Cloud,
    x: 960,
    y: 440,
    risk: 'critical',
    riskScore: 95,
    details: 'Encrypted cloud storage relay infrastructure utilized by threat actor for dead-drop exfiltration hosting.',
    evidence: ['E-006 (network_capture.pcap)', 'THREAT-INTEL-FEED-841'],
    timeline: [
      { time: '10:09:25', event: 'Payload delivered through TOR circuit into mega-drop bucket' }
    ]
  }
]

const INITIAL_EDGES = [
  { id: 'e1', from: 'n-person-1', to: 'n-laptop-1', label: 'used', type: 'causal', risk: 'critical' },
  { id: 'e2', from: 'n-person-1', to: 'n-card-1', label: 'possessed', type: 'access', risk: 'high' },
  { id: 'e3', from: 'n-card-1', to: 'n-location-1', label: 'unlocked', type: 'access', risk: 'high' },
  { id: 'e4', from: 'n-person-1', to: 'n-location-1', label: 'entered', type: 'physical', risk: 'high' },
  { id: 'e5', from: 'n-laptop-1', to: 'n-user-1', label: 'authenticated as', type: 'auth', risk: 'medium' },
  { id: 'e6', from: 'n-laptop-1', to: 'n-usb-1', label: 'connected to', type: 'hardware', risk: 'critical' },
  { id: 'e7', from: 'n-laptop-1', to: 'n-file-1', label: 'accessed', type: 'data', risk: 'critical' },
  { id: 'e8', from: 'n-laptop-1', to: 'n-ip-1', label: 'communicated with', type: 'network', risk: 'critical' },
  { id: 'e9', from: 'n-ip-1', to: 'n-cloud-1', label: 'connected to', type: 'network', risk: 'critical' },
  { id: 'e10', from: 'n-usb-1', to: 'n-file-1', label: 'staged payload', type: 'data', risk: 'critical' }
]

const ENTITY_TYPES = [
  { label: 'All Entities', value: 'all' },
  { label: 'Person', value: 'Person', color: '#ec4899' },
  { label: 'Device', value: 'Device', color: '#3b82f6' },
  { label: 'User Account', value: 'User Account', color: '#06b6d4' },
  { label: 'USB Device', value: 'USB Device', color: '#f59e0b' },
  { label: 'File', value: 'File', color: '#10b981' },
  { label: 'IP Address', value: 'IP Address', color: '#ef4444' },
  { label: 'Cloud Service', value: 'Cloud Service', color: '#8b5cf6' },
  { label: 'Location', value: 'Location', color: '#6366f1' },
]

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [edges, setEdges] = useState(INITIAL_EDGES)
  const [selectedNode, setSelectedNode] = useState(INITIAL_NODES[3]) // Default: LAPTOP-07
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all') // all | critical | high
  const [zoomScale, setZoomScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState(null)

  const svgRef = useRef(null)

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      if (riskFilter !== 'all' && n.risk !== riskFilter) return false
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        return (
          n.label.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q) ||
          n.details.toLowerCase().includes(q)
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
        if (target) connections.push({ relation: e.label, node: target, dir: 'outgoing' })
      } else if (e.to === selectedNode.id) {
        const source = nodeMap[e.from]
        if (source) connections.push({ relation: e.label, node: source, dir: 'incoming' })
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
    const graphData = {
      caseId: 'CASE-2026-001',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type, risk: n.risk, riskScore: n.riskScore, details: n.details })),
      edges: edges.map(e => ({ id: e.id, from: e.from, to: e.to, label: e.label, type: e.type, risk: e.risk }))
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2))
    const link = document.createElement('a')
    link.setAttribute('href', dataStr)
    link.setAttribute('download', `synapsex_knowledge_graph_CASE-2026-001_${Date.now()}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className={`kg-root ${selectedNode ? 'kg-root--panel-open' : ''}`}>

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
            CASE-2026-001 · Interactive entity correlation mapping digital devices, identities, forensic files, physical locations & C2 network relays
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
            {ENTITY_TYPES.map(t => (
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
              <span className="leg-item"><span className="leg-dot" style={{ background: '#ec4899' }} /> Person</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#3b82f6' }} /> Device</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#06b6d4' }} /> Account</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#f59e0b' }} /> USB</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#10b981' }} /> File</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#ef4444' }} /> IP Addr</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#8b5cf6' }} /> Cloud</span>
              <span className="leg-item"><span className="leg-dot" style={{ background: '#6366f1' }} /> Location</span>
            </div>
          </div>

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
                        x="-42"
                        y="-10"
                        width="84"
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
                const Icon = node.icon

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
                        {node.label}
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
                  <selectedNode.icon size={16} />
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
              <div className={`kg-panel-risk-card kg-panel-risk-card--${selectedNode.risk}`}>
                <div className="risk-card-icon-box">
                  <AlertTriangle size={16} />
                </div>
                <div className="risk-card-info">
                  <span className="risk-card-lbl">Assessed Entity Risk</span>
                  <strong className="risk-card-val">
                    {selectedNode.risk.toUpperCase()} ({selectedNode.riskScore}/100)
                  </strong>
                </div>
              </div>

              {/* Entity Narrative & Summary */}
              <div className="kg-panel-section">
                <div className="kg-section-hdr">
                  <Info size={12} className="sec-icon" />
                  <h4>Entity Details & Intelligence Summary</h4>
                </div>
                <p className="kg-details-text">{selectedNode.details}</p>
              </div>

              {/* Connected Entities Links */}
              <div className="kg-panel-section">
                <div className="kg-section-hdr">
                  <Share2 size={12} className="sec-icon" />
                  <h4>Connected Entities ({connectedEntities.length})</h4>
                </div>

                <div className="kg-connections-list">
                  {connectedEntities.map((conn, idx) => {
                    const TargetIcon = conn.node.icon
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
                  })}
                </div>
              </div>

              {/* Timeline Events Involving Entity */}
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

              {/* Related Evidence Artifacts */}
              <div className="kg-panel-section">
                <div className="kg-section-hdr">
                  <HardDrive size={12} className="sec-icon" />
                  <h4>Correlated Evidence Vault Items</h4>
                </div>

                <div className="kg-evidence-pills">
                  {selectedNode.evidence.map((ev, idx) => (
                    <div key={idx} className="kg-ev-pill">
                      <HardDrive size={10} />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="kg-panel-actions">
                <button className="kg-panel-btn kg-panel-btn--primary">
                  <Eye size={13} /> Inspect in Timeline
                </button>
                <button className="kg-panel-btn kg-panel-btn--ghost">
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
