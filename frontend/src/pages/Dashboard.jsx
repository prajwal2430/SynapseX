import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardDrive, Brain, ShieldAlert, Bot,
  Clock, Wifi, AlertTriangle, ChevronRight,
  Usb, Monitor, Lock, Video, FileSearch,
  Network, CheckCircle2, CircleDot, Zap,
  TrendingUp, Eye, Search, Activity,
  FlaskConical, Link2, ListChecks,
  BarChart3, Layers, CheckCheck, Sparkles
} from 'lucide-react'
import './Dashboard.css'

/* ─────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────── */
const CASE = {
  id: 'CASE-2026-001',
  name: 'Suspected Data Exfiltration',
  classification: 'CONFIDENTIAL',
  tlp: 'TLP:RED',
  opened: '2026-08-20T08:00:00Z',
  lead: 'Sr. Analyst',
  status: 'active',
}

const SUMMARY_CARDS = [
  {
    id: 'active-evidence',
    label: 'Active Evidence',
    value: '1,248',
    unit: 'Items',
    icon: HardDrive,
    color: 'blue',
    delta: '+14 today',
    trend: 'up',
  },
  {
    id: 'ai-findings',
    label: 'AI Findings',
    value: '12',
    unit: 'Findings',
    icon: Brain,
    color: 'cyan',
    delta: '+3 new',
    trend: 'up',
  },
  {
    id: 'risk-level',
    label: 'Investigation Risk',
    value: 'Medium',
    unit: '',
    icon: ShieldAlert,
    color: 'medium',
    delta: 'Escalating',
    trend: 'up',
  },
  {
    id: 'agent-status',
    label: 'Agent Status',
    value: '8 / 10',
    unit: 'Active',
    icon: Bot,
    color: 'green',
    delta: '2 idle',
    trend: 'flat',
  },
]

const TIMELINE_EVENTS = [
  {
    id: 'e1',
    time: '10:02',
    source: 'CCTV',
    label: 'Person entered restricted area',
    icon: Video,
    type: 'suspicious',
    detail: 'CAM-07 · Server Room B · Badge ID not matched',
  },
  {
    id: 'e2',
    time: '10:03',
    source: 'Access Control',
    label: 'Door opened — Server Room B',
    icon: Lock,
    type: 'suspicious',
    detail: 'Credential: EMP-4421 · Tailgating alert triggered',
  },
  {
    id: 'e3',
    time: '10:04',
    source: 'System',
    label: 'User login on WKST-041',
    icon: Monitor,
    type: 'normal',
    detail: 'User: jsmith@corp.int · IP: 10.4.12.41',
  },
  {
    id: 'e4',
    time: '10:05',
    source: 'USB',
    label: 'External device connected',
    icon: Usb,
    type: 'critical',
    detail: 'Device: SanDisk Ultra 128GB · S/N: SDCZ48-128G · Unregistered',
  },
  {
    id: 'e5',
    time: '10:07',
    source: 'File Activity',
    label: 'Sensitive files accessed',
    icon: FileSearch,
    type: 'critical',
    detail: '34 files · /Finance/Q2-Projections/ · 2.1 GB read',
  },
  {
    id: 'e6',
    time: '10:09',
    source: 'Network',
    label: 'Large outbound data transfer',
    icon: Network,
    type: 'critical',
    detail: '1.8 GB → 185.220.101.47 (TOR Exit Node) · Protocol: HTTPS',
  },
]

const AI_FINDINGS = [
  { label: 'Correlated sequence detected',      icon: Link2,      color: 'blue',   value: 'Physical → Digital → Exfil' },
  { label: 'Confidence Level',                  icon: FlaskConical, color: 'medium', value: 'Medium (67%)' },
  { label: 'Supporting Evidence',               icon: CheckCircle2, color: 'green',  value: '5 artifacts correlated' },
  { label: 'Alternative Explanations',          icon: CircleDot,  color: 'gray',   value: '2 hypotheses flagged' },
  { label: 'Missing Evidence Recommendations',  icon: ListChecks, color: 'cyan',   value: '3 gaps identified' },
]

const RECENT_ALERTS = [
  { severity: 'critical', msg: 'TOR exit node detected in outbound traffic', time: '10:09' },
  { severity: 'high',     msg: 'Unregistered USB device write operation',    time: '10:05' },
  { severity: 'medium',   msg: 'Tailgating detected at access control point',time: '10:03' },
]

/* ─────────────────────────────────────────
   LIVE CLOCK
───────────────────────────────────────── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="case-clock">
      <Clock size={11} />
      {now.toUTCString().slice(5, 25)} UTC
    </span>
  )
}

/* ─────────────────────────────────────────
   SUMMARY CARD
───────────────────────────────────────── */
function SummaryCard({ card, onClick }) {
  const Icon = card.icon
  return (
    <div 
      className={`dash-summary-card dash-summary-card--${card.color}`} 
      id={`card-${card.id}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      title={`Open ${card.label} module`}
    >
      <div className="dsc-top">
        <div className="dsc-label-row">
          <span className="dsc-label">{card.label}</span>
        </div>
        <div className={`dsc-icon dsc-icon--${card.color}`}>
          <Icon size={18} strokeWidth={1.6} />
        </div>
      </div>
      <div className="dsc-value">
        {card.value}
        {card.unit && <span className="dsc-unit"> {card.unit}</span>}
      </div>
      <div className="dsc-footer">
        <span className={`dsc-delta dsc-delta--${card.color === 'medium' ? 'warn' : card.trend === 'up' ? 'up' : 'flat'}`}>
          {card.trend === 'up' ? '↑' : '—'} {card.delta}
        </span>
      </div>
      <div className="dsc-glow-bar" />
    </div>
  )
}

/* ─────────────────────────────────────────
   TIMELINE EVENT
───────────────────────────────────────── */
function TimelineEvent({ event, index }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = event.icon

  return (
    <div
      className={`tl-event tl-event--${event.type} ${expanded ? 'tl-event--expanded' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => setExpanded(e => !e)}
      id={`event-${event.id}`}
    >
      <div className="tl-time-col">
        <span className="tl-time">{event.time}</span>
        <div className={`tl-dot tl-dot--${event.type}`} />
      </div>

      <div className="tl-connector">
        <div className="tl-line" />
      </div>

      <div className="tl-body">
        <div className="tl-row">
          <div className={`tl-source-badge tl-source-badge--${event.type}`}>
            <Icon size={11} strokeWidth={2} />
            {event.source}
          </div>
          {event.type === 'critical' && (
            <span className="tl-flag tl-flag--critical">
              <AlertTriangle size={9} /> SUSPICIOUS
            </span>
          )}
          {event.type === 'suspicious' && (
            <span className="tl-flag tl-flag--suspicious">
              <AlertTriangle size={9} /> FLAGGED
            </span>
          )}
        </div>
        <p className="tl-label">{event.label}</p>
        {expanded && (
          <div className="tl-detail">
            <span className="tl-detail-text">{event.detail}</span>
          </div>
        )}
        {!expanded && (
          <span className="tl-expand-hint">Click to expand ›</span>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MONTHLY CASE SOLVE & REGISTER DATASET
───────────────────────────────────────── */
const MONTHLY_CASE_STATS = [
  { month: 'Oct', year: '2025', registered: 26, solved: 23, critical: 5, avgDays: 5.1 },
  { month: 'Nov', year: '2025', registered: 32, solved: 30, critical: 7, avgDays: 4.8 },
  { month: 'Dec', year: '2025', registered: 21, solved: 24, critical: 4, avgDays: 4.5 },
  { month: 'Jan', year: '2026', registered: 39, solved: 36, critical: 9, avgDays: 4.1 },
  { month: 'Feb', year: '2026', registered: 35, solved: 33, critical: 8, avgDays: 3.9 },
  { month: 'Mar', year: '2026', registered: 44, solved: 41, critical: 12, avgDays: 3.8 },
  { month: 'Apr', year: '2026', registered: 38, solved: 37, critical: 7, avgDays: 3.6 },
  { month: 'May', year: '2026', registered: 47, solved: 45, critical: 11, avgDays: 3.4 },
  { month: 'Jun', year: '2026', registered: 51, solved: 48, critical: 14, avgDays: 3.3 },
  { month: 'Jul', year: '2026', registered: 45, solved: 44, critical: 10, avgDays: 3.2 },
  { month: 'Aug', year: '2026', registered: 56, solved: 52, critical: 16, avgDays: 3.1 },
  { month: 'Sep', year: '2026', registered: 38, solved: 36, critical: 8, avgDays: 2.9 },
]

function generateSmoothPath(points) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function MonthlyCaseSolveRegisterGraph() {
  const [timeRange, setTimeRange] = useState('12m') // '6m' | '12m'
  const [chartType, setChartType] = useState('spline') // 'spline' | 'bars'
  const [hoverIndex, setHoverIndex] = useState(null)
  const [visibleSeries, setVisibleSeries] = useState({ registered: true, solved: true })

  const dataset = useMemo(() => {
    return timeRange === '6m' ? MONTHLY_CASE_STATS.slice(6) : MONTHLY_CASE_STATS
  }, [timeRange])

  const totals = useMemo(() => {
    const reg = dataset.reduce((acc, d) => acc + d.registered, 0)
    const sol = dataset.reduce((acc, d) => acc + d.solved, 0)
    const crit = dataset.reduce((acc, d) => acc + d.critical, 0)
    const clearance = reg > 0 ? ((sol / reg) * 100).toFixed(1) : '0'
    const avgVelocity = (dataset.reduce((acc, d) => acc + d.avgDays, 0) / dataset.length).toFixed(1)
    return { reg, sol, crit, clearance, avgVelocity }
  }, [dataset])

  // SVG Coordinates
  const svgWidth = 680
  const svgHeight = 250
  const padLeft = 40
  const padRight = 24
  const padTop = 24
  const padBottom = 32
  const plotW = svgWidth - padLeft - padRight
  const plotH = svgHeight - padTop - padBottom
  const maxY = 65
  const yTicks = [0, 15, 30, 45, 60]

  const pointsRegistered = useMemo(() => {
    return dataset.map((d, i) => ({
      x: padLeft + (i / (dataset.length - 1)) * plotW,
      y: padTop + plotH - (d.registered / maxY) * plotH,
      val: d.registered,
      data: d,
    }))
  }, [dataset, plotW, plotH, padLeft, padTop])

  const pointsSolved = useMemo(() => {
    return dataset.map((d, i) => ({
      x: padLeft + (i / (dataset.length - 1)) * plotW,
      y: padTop + plotH - (d.solved / maxY) * plotH,
      val: d.solved,
      data: d,
    }))
  }, [dataset, plotW, plotH, padLeft, padTop])

  const pathRegistered = useMemo(() => generateSmoothPath(pointsRegistered), [pointsRegistered])
  const pathSolved = useMemo(() => generateSmoothPath(pointsSolved), [pointsSolved])

  const areaRegistered = useMemo(() => {
    if (pointsRegistered.length === 0) return ''
    const base = padTop + plotH
    return `${pathRegistered} L ${pointsRegistered[pointsRegistered.length - 1].x} ${base} L ${pointsRegistered[0].x} ${base} Z`
  }, [pathRegistered, pointsRegistered, padTop, plotH])

  const areaSolved = useMemo(() => {
    if (pointsSolved.length === 0) return ''
    const base = padTop + plotH
    return `${pathSolved} L ${pointsSolved[pointsSolved.length - 1].x} ${base} L ${pointsSolved[0].x} ${base} Z`
  }, [pathSolved, pointsSolved, padTop, plotH])

  const activeHoverItem = hoverIndex !== null ? dataset[hoverIndex] : null
  const activeHoverPos = hoverIndex !== null && pointsRegistered[hoverIndex] ? pointsRegistered[hoverIndex] : null

  return (
    <div className="mc-graph-wrapper">
      {/* Top KPI Metrics Bar */}
      <div className="mc-kpi-row">
        <div className="mc-kpi-card mc-kpi-card--registered">
          <span className="mc-kpi-label">
            Cases Registered
            <TrendingUp size={11} className="mc-kpi-sub--blue" />
          </span>
          <span className="mc-kpi-val">{totals.reg}</span>
          <span className="mc-kpi-sub mc-kpi-sub--blue">+14% intake volume</span>
        </div>

        <div className="mc-kpi-card mc-kpi-card--solved">
          <span className="mc-kpi-label">
            Cases Solved
            <CheckCheck size={12} className="mc-kpi-sub--up" />
          </span>
          <span className="mc-kpi-val">{totals.sol}</span>
          <span className="mc-kpi-sub mc-kpi-sub--up">+18% resolution rate</span>
        </div>

        <div className="mc-kpi-card mc-kpi-card--clearance">
          <span className="mc-kpi-label">Clearance Rate</span>
          <span className="mc-kpi-val">{totals.clearance}%</span>
          <span className="mc-kpi-sub">Target: &gt;85%</span>
        </div>

        <div className="mc-kpi-card mc-kpi-card--velocity">
          <span className="mc-kpi-label">Avg Resolution</span>
          <span className="mc-kpi-val">{totals.avgVelocity} <span style={{ fontSize: 11, fontWeight: 500 }}>Days</span></span>
          <span className="mc-kpi-sub mc-kpi-sub--up">↓ 1.4d vs 2025</span>
        </div>
      </div>

      {/* Chart Controls & Legend */}
      <div className="mc-toolbar">
        <div className="mc-legend-group">
          <div
            className={`mc-legend-pill ${!visibleSeries.registered ? 'mc-legend-pill--dimmed' : ''}`}
            onClick={() => setVisibleSeries(s => ({ ...s, registered: !s.registered }))}
            title="Click to toggle Cases Registered"
          >
            <span className="mc-legend-indicator mc-legend-indicator--registered" />
            <span>Cases Registered ({totals.reg})</span>
          </div>

          <div
            className={`mc-legend-pill ${!visibleSeries.solved ? 'mc-legend-pill--dimmed' : ''}`}
            onClick={() => setVisibleSeries(s => ({ ...s, solved: !s.solved }))}
            title="Click to toggle Cases Solved"
          >
            <span className="mc-legend-indicator mc-legend-indicator--solved" />
            <span>Cases Solved ({totals.sol})</span>
          </div>
        </div>

        <div className="mc-controls-group">
          {/* Chart Type Toggle */}
          <div className="mc-btn-group">
            <button
              className={`mc-control-btn ${chartType === 'spline' ? 'mc-control-btn--active' : ''}`}
              onClick={() => setChartType('spline')}
            >
              Curves
            </button>
            <button
              className={`mc-control-btn ${chartType === 'bars' ? 'mc-control-btn--active' : ''}`}
              onClick={() => setChartType('bars')}
            >
              Bars
            </button>
          </div>

          {/* Time Range Toggle */}
          <div className="mc-btn-group">
            <button
              className={`mc-control-btn ${timeRange === '6m' ? 'mc-control-btn--active' : ''}`}
              onClick={() => setTimeRange('6m')}
            >
              6M
            </button>
            <button
              className={`mc-control-btn ${timeRange === '12m' ? 'mc-control-btn--active' : ''}`}
              onClick={() => setTimeRange('12m')}
            >
              12M
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Graph */}
      <div className="mc-chart-box" onMouseLeave={() => setHoverIndex(null)}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="mc-svg-canvas"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="regAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e7fff" stopOpacity="0.28" />
              <stop offset="90%" stopColor="#2e7fff" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="solAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.26" />
              <stop offset="90%" stopColor="#00e676" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="regBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b9fff" />
              <stop offset="100%" stopColor="#1a5fd4" />
            </linearGradient>
            <linearGradient id="solBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1aff8c" />
              <stop offset="100%" stopColor="#00c862" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y Axis labels */}
          {yTicks.map(val => {
            const y = padTop + plotH - (val / maxY) * plotH
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="rgba(46, 127, 255, 0.09)"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(107, 130, 168, 0.7)"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Month X Labels */}
          {dataset.map((d, i) => {
            const x = padLeft + (i / (dataset.length - 1)) * plotW
            const isHovered = hoverIndex === i
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                fill={isHovered ? '#ffffff' : 'rgba(107, 130, 168, 0.85)'}
                fontWeight={isHovered ? '700' : '500'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {d.month}
              </text>
            )
          })}

          {/* Spline Mode Rendering */}
          {chartType === 'spline' && (
            <>
              {visibleSeries.registered && (
                <>
                  <path d={areaRegistered} fill="url(#regAreaGrad)" />
                  <path
                    d={pathRegistered}
                    fill="none"
                    stroke="#2e7fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {visibleSeries.solved && (
                <>
                  <path d={areaSolved} fill="url(#solAreaGrad)" />
                  <path
                    d={pathSolved}
                    fill="none"
                    stroke="#00e676"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Data Node Markers */}
              {dataset.map((_, i) => {
                const ptReg = pointsRegistered[i]
                const ptSol = pointsSolved[i]
                const isHovered = hoverIndex === i

                return (
                  <g key={i}>
                    {visibleSeries.registered && (
                      <circle
                        cx={ptReg.x}
                        cy={ptReg.y}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#0b1120"
                        stroke="#2e7fff"
                        strokeWidth={isHovered ? 3 : 2}
                        style={{ transition: 'all 150ms ease' }}
                      />
                    )}
                    {visibleSeries.solved && (
                      <circle
                        cx={ptSol.x}
                        cy={ptSol.y}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#0b1120"
                        stroke="#00e676"
                        strokeWidth={isHovered ? 3 : 2}
                        style={{ transition: 'all 150ms ease' }}
                      />
                    )}
                  </g>
                )
              })}
            </>
          )}

          {/* Grouped Bars Mode */}
          {chartType === 'bars' && (
            <g>
              {dataset.map((d, i) => {
                const colW = plotW / dataset.length
                const xCenter = padLeft + i * colW + colW / 2
                const barW = Math.min(14, colW * 0.35)
                const isHovered = hoverIndex === i

                const regHeight = (d.registered / maxY) * plotH
                const regY = padTop + plotH - regHeight
                const solHeight = (d.solved / maxY) * plotH
                const solY = padTop + plotH - solHeight

                return (
                  <g key={i} opacity={hoverIndex === null || isHovered ? 1 : 0.45}>
                    {visibleSeries.registered && (
                      <rect
                        x={xCenter - barW - 1.5}
                        y={regY}
                        width={barW}
                        height={regHeight}
                        rx="3"
                        fill="url(#regBarGrad)"
                      />
                    )}
                    {visibleSeries.solved && (
                      <rect
                        x={xCenter + 1.5}
                        y={solY}
                        width={barW}
                        height={solHeight}
                        rx="3"
                        fill="url(#solBarGrad)"
                      />
                    )}
                  </g>
                )
              })}
            </g>
          )}

          {/* Vertical Crosshair Guideline */}
          {hoverIndex !== null && pointsRegistered[hoverIndex] && (
            <line
              x1={pointsRegistered[hoverIndex].x}
              y1={padTop}
              x2={pointsRegistered[hoverIndex].x}
              y2={padTop + plotH}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
          )}

          {/* Interactive Hitbox Strips */}
          {dataset.map((_, i) => {
            const colW = plotW / dataset.length
            const x = padLeft + i * colW
            return (
              <rect
                key={i}
                x={x}
                y={padTop}
                width={colW}
                height={plotH}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(i)}
              />
            )
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {activeHoverItem && activeHoverPos && (
          <div
            className="mc-tooltip-popup"
            style={{
              left: `${(activeHoverPos.x / svgWidth) * 100}%`,
              top: `${Math.max(28, (activeHoverPos.y / svgHeight) * 100 - 15)}%`,
            }}
          >
            <div className="mc-tt-month">
              <span>{activeHoverItem.month} {activeHoverItem.year}</span>
              <span style={{ color: 'var(--alert-medium)', fontSize: 10 }}>
                {activeHoverItem.critical} critical
              </span>
            </div>

            <div className="mc-tt-row">
              <span className="mc-tt-label">
                <span className="mc-tt-dot mc-tt-dot--reg" />
                Registered:
              </span>
              <span className="mc-tt-val">{activeHoverItem.registered} cases</span>
            </div>

            <div className="mc-tt-row">
              <span className="mc-tt-label">
                <span className="mc-tt-dot mc-tt-dot--sol" />
                Solved:
              </span>
              <span className="mc-tt-val" style={{ color: 'var(--green-400)' }}>
                {activeHoverItem.solved} cases
              </span>
            </div>

            <div className="mc-tt-row">
              <span className="mc-tt-label">Net Delta:</span>
              <span
                className="mc-tt-val"
                style={{
                  color: activeHoverItem.solved >= activeHoverItem.registered ? 'var(--green-400)' : 'var(--alert-high)',
                }}
              >
                {activeHoverItem.solved >= activeHoverItem.registered ? '+' : ''}
                {activeHoverItem.solved - activeHoverItem.registered} net
              </span>
            </div>

            <div className="mc-tt-rate">
              <span>Clearance Rate:</span>
              <strong>{((activeHoverItem.solved / activeHoverItem.registered) * 100).toFixed(0)}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mc-footer-info">
        <div className="mc-footer-stat">
          <Sparkles size={12} color="var(--cyan-400)" />
          <span>Case Inflow vs Resolution: <strong>+{totals.clearance}% clearance efficiency</strong></span>
        </div>
        <span>Forensic AI Multi-Agent correlation enabled</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const [pulse, setPulse] = useState(0)
  const [activePanelTab, setActivePanelTab] = useState('graph') // 'graph' | 'timeline' | 'both'

  // Simulate live pulse counter
  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="dash-root">

      {/* ═══════════════════════════════
          PAGE HEADER
      ═══════════════════════════════ */}
      <div className="dash-page-header">
        <div className="dash-header-left">
          <div className="dash-header-eyebrow">
            <Zap size={12} className="eyebrow-icon" />
            <span>Intelligence Dashboard</span>
            <span className="eyebrow-sep" />
            <Activity size={11} />
            <span className="eyebrow-live">Live Monitoring Active</span>
          </div>
          <h1 className="dash-page-title">
            Investigation Intelligence Dashboard
          </h1>
          <p className="dash-page-sub">
            Real-time analysis and AI-assisted correlation for active digital investigation
          </p>
        </div>
        <div className="dash-header-right">
          <LiveClock />
          <div className="dash-live-indicator">
            <span className="pulse-dot" />
            <span>Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
          CASE BANNER
      ═══════════════════════════════ */}
      <div className="case-banner">
        <div className="case-banner-left">
          <div className="case-id-row">
            <span className="case-id-badge">{CASE.id}</span>
            <span className="case-tlp">{CASE.tlp}</span>
            <span className="case-class">{CASE.classification}</span>
          </div>
          <div className="case-name">{CASE.name}</div>
          <div className="case-meta-row">
            <span className="case-meta-item">
              <Eye size={11} /> Lead: {CASE.lead}
            </span>
            <span className="case-meta-sep" />
            <span className="case-meta-item">
              <Clock size={11} /> Opened: 2026-08-20 08:00 UTC
            </span>
          </div>
        </div>
        <div className="case-banner-right">
          <div className="case-status-wrap">
            <span className="badge badge--active">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              ACTIVE
            </span>
          </div>
          <div className="case-alerts-mini">
            {RECENT_ALERTS.map((a, i) => (
              <div key={i} className={`case-alert-mini case-alert-mini--${a.severity}`}>
                <AlertTriangle size={10} />
                <span>{a.msg}</span>
                <span className="cam-time">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
          SUMMARY CARDS
      ═══════════════════════════════ */}
      <div className="dash-cards-grid">
        {SUMMARY_CARDS.map(card => {
          const cardRoutes = {
            'active-evidence': '/evidence',
            'ai-findings': '/ai-findings',
            'risk-level': '/investigations',
            'agent-status': '/ai-agents',
          }
          return (
            <SummaryCard 
              key={card.id} 
              card={card} 
              onClick={() => navigate(cardRoutes[card.id] || '/investigations')} 
            />
          )
        })}
      </div>

      {/* ═══════════════════════════════
          MAIN CONTENT — TIMELINE + AI
      ═══════════════════════════════ */}
      <div className="dash-main-grid">

        {/* ─── LEFT: TIMELINE & MONTHLY RESOLUTION GRAPH ─── */}
        <div className="dash-panel dash-panel--timeline">
          <div className="panel-header">
            {/* View Switcher Tabs */}
            <div className="panel-tabs-wrap">
              <button
                className={`panel-tab-btn ${activePanelTab === 'graph' ? 'panel-tab-btn--active' : ''}`}
                onClick={() => setActivePanelTab('graph')}
                title="View Monthly Cases Registered vs Solved Trend Graph"
              >
                <BarChart3 size={13} />
                <span>Monthly Solve & Register</span>
                <span className="panel-tab-badge">12M</span>
              </button>

              <button
                className={`panel-tab-btn ${activePanelTab === 'timeline' ? 'panel-tab-btn--active' : ''}`}
                onClick={() => setActivePanelTab('timeline')}
                title="View Active Case Live Investigation Timeline"
              >
                <Activity size={13} />
                <span>Investigation Timeline</span>
                <span className="panel-tab-badge">{TIMELINE_EVENTS.length}</span>
              </button>

              <button
                className={`panel-tab-btn ${activePanelTab === 'both' ? 'panel-tab-btn--active' : ''}`}
                onClick={() => setActivePanelTab('both')}
                title="View Both Graph & Timeline Stacked"
              >
                <Layers size={13} />
                <span>Split View</span>
              </button>
            </div>

            <div className="panel-header-right">
              <span className="badge badge--active" style={{ fontSize: 9 }}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                Live
              </span>
            </div>
          </div>

          {/* Render Monthly Graph */}
          {(activePanelTab === 'graph' || activePanelTab === 'both') && (
            <MonthlyCaseSolveRegisterGraph />
          )}

          {/* Render Timeline */}
          {(activePanelTab === 'timeline' || activePanelTab === 'both') && (
            <>
              {activePanelTab === 'both' && (
                <div className="panel-divider-label">
                  <Activity size={12} />
                  <span>Active Investigation Sequence · CASE-2026-001 (Server Room B)</span>
                </div>
              )}

              <div className="tl-legend">
                <span className="tl-legend-item tl-legend-item--normal">● Normal</span>
                <span className="tl-legend-item tl-legend-item--suspicious">● Flagged</span>
                <span className="tl-legend-item tl-legend-item--critical">● Suspicious</span>
              </div>

              <div className="tl-scroll-area">
                <div className="tl-track">
                  {TIMELINE_EVENTS.map((evt, i) => (
                    <TimelineEvent key={evt.id} event={evt} index={i} />
                  ))}
                </div>
              </div>

              <div className="tl-footer">
                <TrendingUp size={11} />
                <span>Showing events 10:02 – 10:09 · Case window: 7 minutes</span>
              </div>
            </>
          )}
        </div>

        {/* ─── RIGHT: AI PANEL ─── */}
        <div className="dash-panel dash-panel--ai">
          <div className="panel-header">
            <div className="panel-title">
              <Brain size={15} />
              AI Investigation Summary
            </div>
            <span className="badge badge--info">NEXUS-7</span>
          </div>

          {/* Confidence meter */}
          <div className="ai-confidence-block">
            <div className="ai-conf-header">
              <span className="ai-conf-label">Overall Confidence</span>
              <span className="ai-conf-value ai-conf-value--medium">Medium — 67%</span>
            </div>
            <div className="ai-conf-bar-wrap">
              <div className="ai-conf-bar ai-conf-bar--medium" style={{ width: '67%' }} />
            </div>
            <p className="ai-conf-desc">
              NEXUS-7 has identified a high-probability correlated event sequence
              consistent with an <strong>insider data exfiltration attempt</strong>.
              Correlation anchored on physical access → system access → data transfer.
            </p>
          </div>

          {/* Findings list */}
          <div className="ai-findings-list">
            {AI_FINDINGS.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className={`ai-finding ai-finding--${f.color}`}>
                  <div className={`ai-finding-icon ai-finding-icon--${f.color}`}>
                    <Icon size={13} strokeWidth={1.8} />
                  </div>
                  <div className="ai-finding-body">
                    <span className="ai-finding-label">{f.label}</span>
                    <span className="ai-finding-value">{f.value}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sequence visual */}
          <div className="ai-sequence">
            <span className="ai-seq-label">Detected Sequence</span>
            <div className="ai-seq-chain">
              {['Physical Access', 'System Login', 'USB Device', 'File Access', 'Exfiltration'].map((s, i) => (
                <div key={i} className="ai-seq-chain-item">
                  <div className={`ai-seq-node ${i >= 2 ? 'ai-seq-node--alert' : ''}`}>{i + 1}</div>
                  <span className="ai-seq-step">{s}</span>
                  {i < 4 && <ChevronRight size={12} className="ai-seq-arrow" />}
                </div>
              ))}
            </div>
          </div>

          {/* IOC summary */}
          <div className="ai-ioc-block">
            <span className="ai-ioc-title">Key IOCs Identified</span>
            <div className="ai-ioc-list">
              <div className="ai-ioc-item">
                <span className="ai-ioc-type">IP</span>
                <span className="ai-ioc-val">185.220.101.47</span>
                <span className="badge badge--critical" style={{ fontSize: 9 }}>TOR</span>
              </div>
              <div className="ai-ioc-item">
                <span className="ai-ioc-type">USER</span>
                <span className="ai-ioc-val">jsmith@corp.int</span>
                <span className="badge badge--high" style={{ fontSize: 9 }}>HIGH RISK</span>
              </div>
              <div className="ai-ioc-item">
                <span className="ai-ioc-type">DEVICE</span>
                <span className="ai-ioc-val">SDCZ48-128G</span>
                <span className="badge badge--medium" style={{ fontSize: 9 }}>UNREGISTERED</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ai-actions">
            <button className="ai-btn ai-btn--primary" id="view-investigation-btn"
              onClick={() => navigate('/investigations/CASE-2026-001/workspace')}>
              <Eye size={14} />
              View Investigation
            </button>
            <button className="ai-btn ai-btn--secondary" id="review-findings-btn"
              onClick={() => navigate('/investigations/CASE-2026-001')}>
              <Search size={14} />
              Review Findings
            </button>
          </div>

          <div className="ai-disclaimer">
            <Brain size={10} />
            Analysis generated by NEXUS-7 · Last run: {new Date().toLocaleTimeString()} · Model: SynapseX-Forge-v3
          </div>
        </div>

      </div>
    </div>
  )
}
