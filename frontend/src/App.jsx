import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Providers from './pages/Providers'
import Customers from './pages/Customers'
import DIDs from './pages/DIDs'
import Conference from './pages/Conference'
import Settings from './pages/Settings'
import Gateways from './pages/Gateways'
import RoutesPage from './pages/Routes'
import Extensions from './pages/Extensions'
import Reports from './pages/Reports'
import Tariffs from './pages/Tariffs'

function Layout({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-dark-500">
      <Sidebar onLogout={onLogout} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/dids" element={<DIDs />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/gateways" element={<Gateways />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/extensions" element={<Extensions />} />
        <Route path="/conference" element={<Conference />} />
        <Route path="/tariffs" element={<Tariffs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
