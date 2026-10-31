/**
 * Centralized API Service for ADEIP (Autonomous Digital Evidence Intelligence Platform)
 * 
 * Provides unified HTTP client with JWT auto-injection, structured error classification
 * (distinguishing 401/403/404/500 vs. Network/ECONNREFUSED errors), and typed API methods.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'adeip_auth_token'
const USER_KEY = 'adeip_auth_user'

export class ApiError extends Error {
  constructor(message, status = 0, data = null, isNetworkError = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.isNetworkError = isNetworkError
  }
}

/**
 * Token and user session storage helpers
 */
export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY)
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

function extractErrorMessage(data, status) {
  if (!data) return `HTTP error ${status}`
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && item.msg) {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : ''
          return field ? `${field}: ${item.msg}` : item.msg
        }
        return JSON.stringify(item)
      })
      .join('; ')
  }
  if (data.detail && typeof data.detail === 'object') {
    return data.detail.msg || data.detail.message || JSON.stringify(data.detail)
  }
  if (typeof data.message === 'string') return data.message
  return `HTTP error ${status}`
}

/**
 * Low-level HTTP requester with JWT auto-injection and robust error classification
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = new Headers(options.headers || {})

  const token = authStorage.getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const res = await fetch(url, config)

    if (res.status === 204) {
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = await res.text()
    }

    if (!res.ok) {
      let errorMsg = ''
      if (res.status === 401) {
        errorMsg = (data && typeof data.detail === 'string' && data.detail) || 'Incorrect email or password. Please verify your credentials.'
      } else if (res.status === 403) {
        errorMsg = (data && typeof data.detail === 'string' && data.detail) || 'You do not have permission to access this resource.'
      } else if (res.status === 404) {
        errorMsg = (data && typeof data.detail === 'string' && data.detail) || 'Requested resource not found.'
      } else if (res.status >= 500) {
        errorMsg = 'An internal server error occurred. Please try again later.'
      } else {
        errorMsg = extractErrorMessage(data, res.status)
      }
      throw new ApiError(errorMsg, res.status, data, false)
    }

    return data
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    // Network errors (Failed to fetch, proxy connection refused, CORS, offline)
    throw new ApiError(
      'Unable to connect to the ADEIP server. Please ensure the backend service is running.',
      0,
      null,
      true
    )
  }
}

/* ─────────────────────────────────────────────────────────────
   API ENDPOINTS
───────────────────────────────────────────────────────────── */

export const api = {
  // ── Health & Diagnostics ──
  health: {
    check: () => request('/health'),
    database: () => request('/health/database'),
  },

  // ── Authentication ──
  auth: {
    login: async (email, password) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res && res.access_token) {
        authStorage.setToken(res.access_token)
        if (res.user) authStorage.setUser(res.user)
      }
      return res
    },
    register: async (userData) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    },
    getMe: () => request('/auth/me'),
    logout: () => {
      authStorage.clear()
    },
  },

  // ── Cases & Investigations ──
  cases: {
    list: (params = {}) => {
      const q = new URLSearchParams()
      if (params.page) q.set('page', params.page)
      if (params.pageSize) q.set('page_size', params.pageSize)
      if (params.status) q.set('status', params.status)
      if (params.priority) q.set('priority', params.priority)
      if (params.search) q.set('search', params.search)
      const qs = q.toString()
      return request(`/cases${qs ? `?${qs}` : ''}`)
    },
    get: (caseId) => request(`/cases/${caseId}`),
    create: (caseData) => request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    }),
    update: (caseId, updates) => request(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    getDashboard: (caseId) => request(`/cases/${caseId}/dashboard`),
    getGlobalDashboard: () => request('/cases/dashboard/global'),
  },

  // ── Evidence Vault ──
  evidence: {
    listForCase: (caseId, params = {}) => {
      const q = new URLSearchParams()
      if (params.page) q.set('page', params.page)
      if (params.pageSize) q.set('page_size', params.pageSize)
      const qs = q.toString()
      return request(`/cases/${caseId}/evidence${qs ? `?${qs}` : ''}`)
    },
    get: (evidenceId) => request(`/evidence/${evidenceId}`),
    upload: (caseId, fileOrFormData) => {
      let body = fileOrFormData
      if (typeof File !== 'undefined' && (fileOrFormData instanceof File || fileOrFormData instanceof Blob)) {
        body = new FormData()
        body.append('file', fileOrFormData)
      }
      return request(`/cases/${caseId}/evidence`, {
        method: 'POST',
        body,
      })
    },
    verifyIntegrity: (evidenceId) => request(`/evidence/${evidenceId}/verify`, {
      method: 'POST',
    }),
    getCustodyChain: (evidenceId) => request(`/evidence/${evidenceId}/chain-of-custody`),
    delete: (evidenceId) => request(`/evidence/${evidenceId}`, {
      method: 'DELETE',
    }),
  },

  // ── Data Sources ──
  sources: {
    listForCase: (caseId) => request(`/cases/${caseId}/sources`),
    create: (caseId, sourceData) => request(`/cases/${caseId}/sources`, {
      method: 'POST',
      body: JSON.stringify(sourceData),
    }),
    get: (sourceId) => request(`/sources/${sourceId}`),
    update: (sourceId, updates) => request(`/sources/${sourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    delete: (sourceId) => request(`/sources/${sourceId}`, {
      method: 'DELETE',
    }),
    registerCctv: (caseId, cctvData) => request(`/cases/${caseId}/sources/cctv`, {
      method: 'POST',
      body: JSON.stringify(cctvData),
    }),
  },

  // ── Timeline & Normalized Events ──
  timeline: {
    getForCase: (caseId, params = {}) => {
      const q = new URLSearchParams()
      if (params.page) q.set('page', params.page)
      if (params.pageSize) q.set('page_size', params.pageSize)
      if (params.source) q.set('source', params.source)
      if (params.severity) q.set('severity', params.severity)
      const qs = q.toString()
      return request(`/cases/${caseId}/timeline${qs ? `?${qs}` : ''}`)
    },
    reconstruct: (caseId) => request(`/cases/${caseId}/timeline/reconstruct`, {
      method: 'POST',
    }),
  },

  // ── Correlations ──
  correlations: {
    listForCase: (caseId) => request(`/cases/${caseId}/correlations`),
    run: (caseId) => request(`/cases/${caseId}/correlations/run`, {
      method: 'POST',
    }),
  },

  // ── Knowledge Graph ──
  graph: {
    getForCase: (caseId) => request(`/cases/${caseId}/graph`),
    syncToNeo4j: (caseId) => request(`/cases/${caseId}/graph/sync`, {
      method: 'POST',
    }),
  },

  // ── AI Findings & Reasoning ──
  findings: {
    listForCase: (caseId) => request(`/cases/${caseId}/findings`),
    get: (findingId) => request(`/findings/${findingId}`),
    runReasoning: (caseId) => request(`/cases/${caseId}/reasoning/run`, {
      method: 'POST',
    }),
    review: (findingId, reviewData) => request(`/findings/${findingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    }),
  },

  // ── AI Multi-Agent Fleet ──
  analysis: {
    listForCase: (caseId) => request(`/cases/${caseId}/analysis`),
    start: (caseId, params = {}) => request(`/cases/${caseId}/analysis/start`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getStatus: (caseId) => request(`/cases/${caseId}/analysis/status`),
  },

  // ── Reports ──
  reports: {
    listForCase: (caseId) => request(`/cases/${caseId}/reports`),
    listAll: (params = {}) => {
      const q = new URLSearchParams()
      if (params.caseId) q.set('case_id', params.caseId)
      if (params.page) q.set('page', params.page)
      if (params.pageSize) q.set('page_size', params.pageSize)
      const qs = q.toString()
      return request(`/reports${qs ? `?${qs}` : ''}`)
    },
    create: (caseId, reportData) => request(`/cases/${caseId}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),
    get: (reportId) => request(`/reports/${reportId}`),
    getHtml: (reportId) => request(`/reports/${reportId}/html`),
    getPdfUrl: (reportId) => `${API_BASE}/reports/${reportId}/pdf`,
    download: async (reportId, format = 'pdf') => {
      const token = authStorage.getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/reports/${reportId}/download?export_format=${format}`, {
        headers,
      })
      if (!res.ok) {
        throw new Error(`Failed to download report: ${res.statusText}`)
      }
      return await res.blob()
    },
    delete: (reportId) => request(`/reports/${reportId}`, {
      method: 'DELETE',
    }),
  },

  // ── Real-Time Simulation / Demo Stream ──
  simulation: {
    start: (caseId, config = {}) => request(`/cases/${caseId}/simulation/start`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    stop: (caseId) => request(`/cases/${caseId}/simulation/stop`, {
      method: 'POST',
    }),
    status: (caseId) => request(`/cases/${caseId}/simulation/status`),
  },

  // ── WebSocket URL Resolver ──
  getWebSocketUrl: (caseId) => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL || (API_BASE.startsWith('http') ? API_BASE.replace(/^http/, 'ws').replace(/\/api\/?$/, '') : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`)
    const token = authStorage.getToken()
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''
    return `${wsBase}/ws/cases/${caseId}${tokenParam}`
  },
}
