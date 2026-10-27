/**
 * Case API Service for ADEIP / SynapseX.
 * Connects frontend views to real backend investigation endpoints.
 */

const API_BASE = '/api'

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const headers = { ...extra }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const caseApi = {
  // Case Management
  async listCases(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.priority) query.set('priority', params.priority)
    if (params.page) query.set('page', params.page)
    if (params.pageSize) query.set('page_size', params.pageSize)

    const url = `${API_BASE}/cases${query.toString() ? '?' + query.toString() : ''}`
    const res = await fetch(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error(`Failed to list cases: ${res.statusText}`)
    return res.json()
  },

  async getCase(id) {
    const res = await fetch(`${API_BASE}/cases/${id}`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch case #${id}`)
    return res.json()
  },

  async createCase(payload) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create case')
    }
    return res.json()
  },

  async updateCase(id, payload) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Failed to update case #${id}`)
    return res.json()
  },

  async deleteCase(id) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete case #${id}`)
    return true
  },

  // Dashboard Summary & Live Metrics
  async getCaseSummary(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/summary`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch summary for case #${caseId}`)
    return res.json()
  },

  // AI Assistant Chat
  async sendChatMessage(caseId, query) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/chat`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Chat query failed')
    }
    return res.json()
  },

  // Reasoning & Findings
  async runReasoning(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/reasoning/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to run reasoning')
    return res.json()
  },

  async getFindings(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/findings`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch findings')
    return res.json()
  },

  async reviewFinding(findingId, action, notes = '') {
    const res = await fetch(`${API_BASE}/findings/${findingId}/review`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action, notes }),
    })
    if (!res.ok) throw new Error('Failed to review finding')
    return res.json()
  },

  // Timeline
  async getTimeline(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/timeline?page_size=300`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch timeline')
    return res.json()
  },

  // Entities
  async getEntities(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/entities?page_size=200`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch entities')
    return res.json()
  },

  // Correlations
  async getCorrelations(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/correlations`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch correlations')
    return res.json()
  },

  async runCorrelations(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/correlations/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to run correlations')
    return res.json()
  },

  // Reports
  async getReports(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/reports`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch reports')
    return res.json()
  },

  async generateReport(caseId, payload = {}) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title: payload.title || 'Official Digital Forensics Investigation Report',
        format: payload.format || 'html',
        include_audit_trail: true,
      }),
    })
    if (!res.ok) throw new Error('Failed to generate report')
    return res.json()
  },

  // Evidence Reprocessing
  async reprocessEvidence(evidenceId) {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}/reprocess`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to reprocess evidence')
    return res.json()
  },
}
