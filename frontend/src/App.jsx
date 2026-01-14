import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomersTrunk from './pages/CustomersTrunk'
import CustomersPabx from './pages/CustomersPabx'
import Providers from './pages/Providers'
import GatewayGroups from './pages/GatewayGroups'
import Gateways from './pages/Gateways'
import DIDs from './pages/DIDs'
import Routes_ from './pages/Routes'
import Extensions from './pages/Extensions'
import Tariffs from './pages/Tariffs'
import Reports from './pages/Reports'
import Conference from './pages/Conference'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import RoutePlans from './pages/RoutePlans'
import TariffPlans from './pages/TariffPlans'
import Debug from './pages/Debug'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers/trunk" element={<CustomersTrunk />} />
        <Route path="customers/pabx" element={<CustomersPabx />} />
        <Route path="providers" element={<Providers />} />
        <Route path="gateway-groups" element={<GatewayGroups />} />
        <Route path="gateways" element={<Gateways />} />
        <Route path="dids" element={<DIDs />} />
        <Route path="routes" element={<Routes_ />} />
        <Route path="extensions" element={<Extensions />} />
        <Route path="tariffs" element={<Tariffs />} />
        <Route path="route-plans" element={<RoutePlans />} />
        <Route path="tariff-plans" element={<TariffPlans />} />
        <Route path="reports" element={<Reports />} />
        <Route path="conference" element={<Conference />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="debug" element={<Debug />} />
      </Route>
    </Routes>
  )
}
