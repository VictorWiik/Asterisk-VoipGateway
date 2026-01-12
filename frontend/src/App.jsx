import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import DIDs from './pages/DIDs'
import Providers from './pages/Providers'
import Gateways from './pages/Gateways'
import Routes_ from './pages/Routes'
import Extensions from './pages/Extensions'
import Tariffs from './pages/Tariffs'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Conference from './pages/Conference'
import Integrations from './pages/Integrations'
import Plans from './pages/Plans'

const queryClient = new QueryClient()

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-dark-500">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={() => setIsAuthenticated(true)} />
          } />
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout><Dashboard /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/customers" element={
            <PrivateRoute>
              <AppLayout><Customers /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/plans" element={
            <PrivateRoute>
              <AppLayout><Plans /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/dids" element={
            <PrivateRoute>
              <AppLayout><DIDs /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/providers" element={
            <PrivateRoute>
              <AppLayout><Providers /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/gateways" element={
            <PrivateRoute>
              <AppLayout><Gateways /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/routes" element={
            <PrivateRoute>
              <AppLayout><Routes_ /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/extensions" element={
            <PrivateRoute>
              <AppLayout><Extensions /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/tariffs" element={
            <PrivateRoute>
              <AppLayout><Tariffs /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <AppLayout><Reports /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/conference" element={
            <PrivateRoute>
              <AppLayout><Conference /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/integrations" element={
            <PrivateRoute>
              <AppLayout><Integrations /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <AppLayout><Settings /></AppLayout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
