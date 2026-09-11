import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

// Pages
import Login            from './pages/Login'
import Dashboard        from './pages/Dashboard'
import Investigations   from './pages/Investigations'
import CaseDetail       from './pages/CaseDetail'
import CaseWorkspace    from './pages/CaseWorkspace'
import Evidence         from './pages/Evidence'
import LiveInvestigation from './pages/LiveInvestigation'
import Timeline         from './pages/Timeline'
import KnowledgeGraph   from './pages/KnowledgeGraph'
import AIAgents         from './pages/AIAgents'
import AIFindings       from './pages/AIFindings'
import IntelligenceChat from './pages/IntelligenceChat'
import Reports          from './pages/Reports'
import ChainOfCustody   from './pages/ChainOfCustody'
import Settings         from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                    element={<Dashboard />} />
            <Route path="investigations"               element={<Investigations />} />
            <Route path="investigations/:caseId"            element={<CaseDetail />} />
            <Route path="investigations/:caseId/workspace" element={<CaseWorkspace />} />
            <Route path="evidence"                     element={<Evidence />} />
            <Route path="live-investigation"           element={<LiveInvestigation />} />
            <Route path="timeline"                     element={<Timeline />} />
            <Route path="knowledge-graph"              element={<KnowledgeGraph />} />
            <Route path="ai-agents"                    element={<AIAgents />} />
            <Route path="ai-findings"                  element={<AIFindings />} />
            <Route path="intelligence-chat"            element={<IntelligenceChat />} />
            <Route path="reports"                      element={<Reports />} />
            <Route path="chain-of-custody"             element={<ChainOfCustody />} />
            <Route path="settings"                     element={<Settings />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
