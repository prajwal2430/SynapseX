import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { caseApi } from '../services/caseApi'

const CaseContext = createContext(null)

export function CaseProvider({ children }) {
  const [cases, setCases] = useState([])
  const [activeCase, setActiveCase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCases = useCallback(async (preferredCaseId = null) => {
    try {
      setLoading(true)
      const data = await caseApi.listCases({ pageSize: 100 })
      const caseList = data.items || []
      setCases(caseList)

      if (caseList.length > 0) {
        // Find saved or preferred case
        const savedId = preferredCaseId || localStorage.getItem('synapsex_active_case_id')
        const found = caseList.find(c => String(c.id) === String(savedId)) || caseList[0]
        setActiveCase(found)
        localStorage.setItem('synapsex_active_case_id', String(found.id))
      } else {
        // Clean zero-cases state
        setActiveCase(null)
        localStorage.removeItem('synapsex_active_case_id')
      }
    } catch (err) {
      console.error('CaseContext failed to fetch cases:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const selectCase = (caseObjOrId) => {
    if (!caseObjOrId) return
    let target = caseObjOrId
    if (typeof caseObjOrId === 'number' || typeof caseObjOrId === 'string') {
      target = cases.find(c =>
        String(c.id) === String(caseObjOrId) ||
        c.case_number === String(caseObjOrId) ||
        c.case_id === String(caseObjOrId)
      ) || null
    }
    if (target) {
      setActiveCase(target)
      localStorage.setItem('synapsex_active_case_id', String(target.id))
    }
  }

  const createCase = async (payload) => {
    const newCase = await caseApi.createCase(payload)
    await fetchCases(newCase.id)
    return newCase
  }

  const deleteCase = async (caseId) => {
    await caseApi.deleteCase(caseId)
    const savedId = localStorage.getItem('synapsex_active_case_id')
    if (String(caseId) === String(savedId) || activeCase?.case_number === String(caseId) || String(activeCase?.id) === String(caseId)) {
      localStorage.removeItem('synapsex_active_case_id')
      setActiveCase(null)
    }
    await fetchCases()
  }

  const deleteAllCases = async () => {
    for (const c of cases) {
      try {
        await caseApi.deleteCase(c.id)
      } catch (err) {
        console.error('Failed to delete case:', c.id, err)
      }
    }
    localStorage.removeItem('synapsex_active_case_id')
    setActiveCase(null)
    await fetchCases()
  }

  const refreshCases = async () => {
    await fetchCases(activeCase ? activeCase.id : null)
  }

  return (
    <CaseContext.Provider
      value={{
        cases,
        activeCase,
        selectCase,
        createCase,
        deleteCase,
        deleteAllCases,
        refreshCases,
        loading,
        error,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}

export function useCase() {
  const ctx = useContext(CaseContext)
  if (!ctx) {
    throw new Error('useCase must be used within a CaseProvider')
  }
  return ctx
}
