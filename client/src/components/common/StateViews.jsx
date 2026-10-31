import React from 'react'
import {
  Loader2,
  AlertTriangle,
  FolderOpen,
  HardDrive,
  GitBranch,
  Brain,
  Share2,
  FileText,
  ShieldAlert,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { api } from '../../services/api'
import './StateViews.css'

export function LoadingView({ message = 'Loading investigation data...' }) {
  return (
    <div className="state-view state-view--loading">
      <Loader2 size={32} className="state-spinner" />
      <p className="state-message">{message}</p>
    </div>
  )
}

export function ErrorView({ error, onRetry, message = 'Unable to load investigation data' }) {
  const isAuthError = (typeof error === 'string' ? error : error?.message || '').toLowerCase().includes('authenticat') || (typeof error === 'string' ? error : error?.message || '').toLowerCase().includes('credential')

  const handleQuickAuth = async () => {
    try {
      await api.auth.login('analyst@adeip.local', 'Investigator123!')
      if (onRetry) onRetry()
      else window.location.reload()
    } catch {
      try {
        await api.auth.register({
          full_name: 'Lead Investigator',
          email: 'analyst@adeip.local',
          password: 'Investigator123!',
          role: 'investigator',
        })
        await api.auth.login('analyst@adeip.local', 'Investigator123!')
        if (onRetry) onRetry()
        else window.location.reload()
      } catch (err) {
        alert(`Authentication error: ${err.message}`)
      }
    }
  }


  return (
    <div className="state-view state-view--error">
      <div className="state-icon-wrap state-icon-wrap--error">
        <AlertTriangle size={32} />
      </div>
      <h3 className="state-title">{message}</h3>
      <p className="state-detail">{typeof error === 'string' ? error : error?.message || 'Connection or authorization error.'}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {isAuthError && (
          <button className="state-action-btn" onClick={handleQuickAuth}>
            <ShieldAlert size={14} /> Authenticate as Lead Analyst
          </button>
        )}
        {onRetry && (
          <button className="state-action-btn" onClick={onRetry} style={{ background: 'var(--gray-700, #334155)' }}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        )}
      </div>
    </div>
  )
}


export function EmptyStateView({
  title = 'No Data Available',
  message = 'No data has been recorded for this section yet.',
  icon: Icon = FolderOpen,
  actionText,
  onAction,
}) {
  return (
    <div className="state-view state-view--empty">
      <div className="state-icon-wrap state-icon-wrap--empty">
        <Icon size={32} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-detail">{message}</p>
      {actionText && onAction && (
        <button className="state-action-btn" onClick={onAction}>
          <Plus size={14} /> {actionText}
        </button>
      )}
    </div>
  )
}
