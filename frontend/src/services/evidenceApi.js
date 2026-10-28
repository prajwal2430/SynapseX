/**
 * Evidence API Service for SynapseX / ADEIP.
 *
 * Centralizes all communication with backend evidence endpoints:
 * - Persistent file uploads (multipart/form-data)
 * - Fetching persistent evidence ledger from database
 * - Secure physical file streaming / downloading
 * - Permanent deletion of evidence + physical files
 * - Cryptographic hash verification
 */

const BASE_URL = '/api'

/**
 * Returns authorization headers if token is present in localStorage.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const evidenceApi = {
  /**
   * Fetches all evidence items from database.
   * Supports filtering by caseId, agentType, or search term.
   */
  async fetchEvidence({ caseId, agentType, search } = {}) {
    const params = new URLSearchParams()
    if (caseId) params.append('case_id', caseId)
    if (agentType) params.append('agent_type', agentType)
    if (search) params.append('search', search)

    const queryStr = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`${BASE_URL}/evidence${queryStr}`, {
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `Failed to fetch evidence (${res.status})`)
    }

    const data = await res.json()
    return data.items || []
  },

  /**
   * Fetches evidence specific to a single case.
   */
  async fetchCaseEvidence(caseId, { agentType } = {}) {
    const params = new URLSearchParams()
    if (agentType) params.append('agent_type', agentType)

    const queryStr = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`${BASE_URL}/cases/${caseId}/evidence${queryStr}`, {
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `Failed to fetch case evidence (${res.status})`)
    }

    const data = await res.json()
    return data.items || []
  },

  /**
   * Uploads a physical file to persistent backend storage and creates database record.
   *
   * @param {File} file - Browser File object from input or drop event
   * @param {Object} options - { caseId, agentType, fileType }
   * @returns {Promise<Object>} Created evidence record
   */
  uploadEvidence(file, { caseId = 1, agentType = null, fileType = null, onProgress = null } = {}) {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      if (caseId) formData.append('case_id', String(caseId))
      if (agentType) formData.append('agent_type', agentType)
      if (fileType) formData.append('file_type', fileType)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BASE_URL}/evidence/upload`)

      const headers = getAuthHeaders()
      Object.keys(headers).forEach(k => {
        xhr.setRequestHeader(k, headers[k])
      })

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const percent = Math.min(95, Math.round((evt.loaded / evt.total) * 100))
            onProgress(percent)
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (onProgress) onProgress(100)
            resolve(data.evidence)
          } catch (e) {
            reject(new Error('Invalid response format from server'))
          }
        } else {
          let detailMsg = `Upload failed with status ${xhr.status}`
          try {
            const errData = JSON.parse(xhr.responseText)
            if (xhr.status === 401) {
              detailMsg = 'Session expired or unauthenticated. Please log in again.'
            } else if (typeof errData.detail === 'string') {
              detailMsg = errData.detail
            } else if (Array.isArray(errData.detail)) {
              detailMsg = errData.detail.map(d => d.msg || d.detail || JSON.stringify(d)).join('; ')
            } else if (errData.message) {
              detailMsg = errData.message
            }
          } catch (_) {}
          reject(new Error(detailMsg))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error during file upload. Check server connectivity.'))
      }

      xhr.send(formData)
    })
  },

  /**
   * Permanently deletes an evidence artifact from database and storage disk.
   */
  async deleteEvidence(evidenceId) {
    const res = await fetch(`${BASE_URL}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `Failed to delete evidence (${res.status})`)
    }

    return await res.json()
  },

  /**
   * Recalculates and verifies SHA-256 hash against stored file on disk.
   */
  async verifyIntegrity(evidenceId) {
    const res = await fetch(`${BASE_URL}/evidence/${evidenceId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `Integrity verification failed (${res.status})`)
    }

    return await res.json()
  },

  /**
   * Returns direct streaming URL for physical file preview/download.
   */
  getFileUrl(evidenceId) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      return `${BASE_URL}/evidence/${evidenceId}/file?token=${encodeURIComponent(token)}`
    }
    return `${BASE_URL}/evidence/${evidenceId}/file`
  },
}
