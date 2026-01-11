import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Phone,
  PhoneCall,
  Server,
  TrendingUp,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react'
import { dashboard } from '../services/api'

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

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboard.stats().then(res => res.data),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Visao geral do sistema TrunkFlow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Clientes Ativos" value={safeStats.active_customers} icon={Users} color="primary" />
        <StatCard title="DIDs Alocados" value={safeStats.allocated_dids} icon={Phone} color="emerald" />
        <StatCard title="Chamadas Hoje" value={safeStats.total_calls_today} icon={PhoneCall} color="amber" />
        <StatCard title="Minutos Hoje" value={safeStats.total_minutes_today} icon={Clock} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Chamadas por Hora
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhuma chamada registrada
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Top Clientes (30 dias)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum cliente com consumo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <span className="text-gray-400">Disponiveis</span>
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
  )
}
