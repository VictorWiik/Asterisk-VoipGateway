import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Phone,
  PhoneCall,
  Server,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCw,
  Zap
} from 'lucide-react'
import api from '../services/api'

function StatCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  const colors = {
    primary: 'from-primary-500 to-primary-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    violet: 'from-violet-500 to-violet-700',
  }

  return (
    <div className="card relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-r ${colors[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    </div>
  )
}

function LiveCallCard({ call }) {
  const [duration, setDuration] = useState(0)
  
  useEffect(() => {
    const startTime = new Date(call.start_time).getTime()
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [call.start_time])
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const isInbound = call.direction === 'inbound'
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg border border-dark-100 hover:border-primary-500/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isInbound ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
          {isInbound ? (
            <PhoneIncoming className="w-5 h-5 text-emerald-400" />
          ) : (
            <PhoneOutgoing className="w-5 h-5 text-blue-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{call.src}</span>
            <span className="text-gray-500">→</span>
            <span className="text-white font-medium">{call.dst}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            {call.customer_name && (
              <span className="text-primary-400">{call.customer_name}</span>
            )}
            {call.gateway_name && (
              <span>via {call.gateway_name}</span>
            )}
            {call.did && (
              <span className="text-emerald-400">DID: {call.did}</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-lg font-mono text-white">{formatDuration(duration)}</span>
        </div>
        <span className={`text-xs ${isInbound ? 'text-emerald-400' : 'text-blue-400'}`}>
          {isInbound ? 'Entrada' : 'Saída'}
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: callsByHour } = useQuery({
    queryKey: ['calls-by-hour'],
    queryFn: () => api.get('/dashboard/calls/by-hour?days=1').then(res => res.data),
    refetchInterval: 60000,
  })

  const { data: topCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: () => api.get('/dashboard/customers/top-consumption?days=30&limit=5').then(res => res.data),
    refetchInterval: 60000,
  })

  const { data: liveCalls, refetch: refetchLiveCalls } = useQuery({
    queryKey: ['live-calls'],
    queryFn: () => api.get('/dashboard/calls/live').then(res => res.data),
    refetchInterval: 5000,
  })

  const { data: recentCalls } = useQuery({
    queryKey: ['recent-calls'],
    queryFn: () => api.get('/dashboard/calls/recent?limit=10').then(res => res.data),
    refetchInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  const safeNumber = (val) => {
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }

  const safeStats = {
    active_customers: safeNumber(stats?.active_customers),
    allocated_dids: safeNumber(stats?.allocated_dids),
    total_calls_today: safeNumber(stats?.total_calls_today),
    total_minutes_today: safeNumber(stats?.total_minutes_today),
    total_dids: safeNumber(stats?.total_dids),
    available_dids: safeNumber(stats?.available_dids),
    total_providers: safeNumber(stats?.total_providers),
    total_customers: safeNumber(stats?.total_customers),
    revenue_today: safeNumber(stats?.revenue_today),
  }

  const maxCalls = Math.max(...(callsByHour?.map(h => h.total_calls) || [1]), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Visão geral do sistema TrunkFlow</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Clientes Ativos" value={safeStats.active_customers} icon={Users} color="primary" />
        <StatCard title="DIDs Alocados" value={safeStats.allocated_dids} icon={Phone} color="emerald" />
        <StatCard title="Chamadas Hoje" value={safeStats.total_calls_today} icon={PhoneCall} color="amber" />
        <StatCard title={safeStats.total_minutes_today >= 60 ? "Minutos Hoje" : "Segundos Hoje"} value={safeStats.total_minutes_today} icon={Clock} color="violet" />
      </div>

      {/* Live Calls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Chamadas ao Vivo
            {liveCalls?.length > 0 && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                {liveCalls.length} ativa(s)
              </span>
            )}
          </h3>
          <button 
            onClick={() => refetchLiveCalls()}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {liveCalls?.length > 0 ? (
          <div className="space-y-2">
            {liveCalls.map((call, idx) => (
              <LiveCallCard key={idx} call={call} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma chamada em andamento</p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls by Hour */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Chamadas por Hora (Hoje)
          </h3>
          {callsByHour?.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {callsByHour.slice(-24).map((hour, idx) => {
                const height = (hour.total_calls / maxCalls) * 100
                const hourLabel = new Date(hour.hour).getHours()
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t hover:from-primary-500 hover:to-primary-300 transition-all cursor-pointer group relative"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-300 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {hour.total_calls} chamadas
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{hourLabel}h</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhuma chamada registrada hoje
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Top Clientes (30 dias)
          </h3>
          {topCustomers?.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{customer.total_minutes} min</p>
                    <p className="text-xs text-gray-400">{customer.total_calls} chamadas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhum cliente com consumo
            </div>
          )}
        </div>
      </div>

      {/* Recent Calls & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-500" />
            Chamadas Recentes
          </h3>
          {recentCalls?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-3">Horário</th>
                    <th className="pb-3">Origem</th>
                    <th className="pb-3">Destino</th>
                    <th className="pb-3">Duração</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {recentCalls.map((call, idx) => (
                    <tr key={idx} className="hover:bg-dark-300/50">
                      <td className="py-2 text-gray-400 text-sm">
                        {new Date(call.calldate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 text-white">{call.src}</td>
                      <td className="py-2 text-white">{call.dst}</td>
                      <td className="py-2 text-gray-300">
                        {Math.floor(call.billsec / 60)}:{(call.billsec % 60).toString().padStart(2, '0')}
                      </td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          call.disposition === 'ANSWERED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : call.disposition === 'NO ANSWER'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {call.disposition === 'ANSWERED' ? 'Atendida' : 
                           call.disposition === 'NO ANSWER' ? 'Não Atendida' : 
                           call.disposition === 'BUSY' ? 'Ocupado' : call.disposition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma chamada recente
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total DIDs</p>
                <p className="text-xl font-bold text-white">{safeStats.total_dids}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Disponíveis</span>
              <span className="text-emerald-400">{safeStats.available_dids}</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Provedores</p>
                <p className="text-xl font-bold text-white">{safeStats.total_providers}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ativos</span>
              <span className="text-emerald-400">{safeStats.total_providers}</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Receita Hoje</p>
                <p className="text-xl font-bold text-white">R$ {safeStats.revenue_today.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Clientes</span>
              <span className="text-primary-400">{safeStats.total_customers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
