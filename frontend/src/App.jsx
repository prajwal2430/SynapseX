import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

// Pages
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
import Styleguide       from './pages/Styleguide'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
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
          <Route path="styleguide"                   element={<Styleguide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
