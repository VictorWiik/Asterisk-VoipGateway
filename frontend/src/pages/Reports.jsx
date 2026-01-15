import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  DollarSign,
  Download,
  Search,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react'
import api from '../services/api'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('cdr')
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    call_type: '',
    search: ''
  })

  const { data: cdrData, isLoading: loadingCDR, refetch: refetchCDR } = useQuery({
    queryKey: ['cdr-report', filters],
    queryFn: () => api.get('/reports/cdr', { params: filters }).then(res => res.data),
    enabled: activeTab === 'cdr'
  })

  const { data: didReport, isLoading: loadingDID } = useQuery({
    queryKey: ['did-report'],
    queryFn: () => api.get('/reports/dids').then(res => res.data),
    enabled: activeTab === 'dids'
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data),
  })

  const exportCSV = async () => {
    try {
      const response = await api.get('/reports/cdr/export', {
        params: { start_date: filters.start_date, end_date: filters.end_date },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cdr_${filters.start_date}_${filters.end_date}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR')
  }

  const callTypeLabels = {
    inbound: { label: 'Entrada', icon: PhoneIncoming, class: 'text-emerald-400' },
    outbound: { label: 'Saída', icon: PhoneOutgoing, class: 'text-primary-400' },
    internal: { label: 'Interno', icon: Phone, class: 'text-amber-400' },
  }

  const dispositionLabels = {
    ANSWERED: { label: 'Atendida', class: 'badge-success' },
    'NO ANSWER': { label: 'Não Atendida', class: 'badge-warning' },
    BUSY: { label: 'Ocupado', class: 'badge-warning' },
    FAILED: { label: 'Falha', class: 'badge-danger' },
    CONGESTION: { label: 'Congestionado', class: 'badge-danger' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-gray-400 mt-1">Análise de chamadas e DIDs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-100">
        <button
          onClick={() => setActiveTab('cdr')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'cdr'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          CDR
        </button>
        <button
          onClick={() => setActiveTab('dids')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'dids'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          DIDs
        </button>
      </div>

      {/* CDR Report */}
      {activeTab === 'cdr' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="label">Data Início</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Data Fim</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Cliente</label>
                <select
                  value={filters.customer_id}
                  onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                  className="select"
                >
                  <option value="">Todos</option>
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select
                  value={filters.call_type}
                  onChange={(e) => setFilters({ ...filters, call_type: e.target.value })}
                  className="select"
                >
                  <option value="">Todos</option>
                  <option value="inbound">Entrada</option>
                  <option value="outbound">Saída</option>
                  <option value="internal">Interno</option>
                </select>
              </div>
              <div>
                <label className="label">Buscar</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="input"
                  placeholder="Origem ou destino"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {cdrData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card py-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-8 h-8 text-primary-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{cdrData.summary.total_calls || 0}</p>
                    <p className="text-sm text-gray-400">Total Chamadas</p>
                  </div>
                </div>
              </div>
              <div className="card py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{formatDuration(cdrData.summary.total_duration || 0)}</p>
                    <p className="text-sm text-gray-400">Duração Total</p>
                  </div>
                </div>
              </div>
              <div className="card py-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">R$ {Number(cdrData.summary.total_cost || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-400">Custo Total</p>
                  </div>
                </div>
              </div>
              <div className="card py-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-violet-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">R$ {Number(cdrData.summary.total_price || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-400">Receita Total</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button onClick={() => refetchCDR()} className="btn-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          {/* Table */}
          {loadingCDR ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Tipo</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Duração</th>
                    <th>Status</th>
                    <th>Custo</th>
                    <th>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {(cdrData?.records || []).map((cdr) => {
                    const TypeIcon = callTypeLabels[cdr.call_type]?.icon || Phone
                    return (
                      <tr key={cdr.id}>
                        <td className="text-sm">{formatDate(cdr.start_time)}</td>
                        <td>
                          <div className={`flex items-center gap-1 ${callTypeLabels[cdr.call_type]?.class || ''}`}>
                            <TypeIcon className="w-4 h-4" />
                            <span className="text-sm">{callTypeLabels[cdr.call_type]?.label || cdr.call_type}</span>
                          </div>
                        </td>
                        <td className="font-mono text-sm">{cdr.src}</td>
                        <td className="font-mono text-sm">{cdr.dst}</td>
                        <td className="font-mono text-sm">{formatDuration(cdr.billsec)}</td>
                        <td>
                          <span className={`badge ${dispositionLabels[cdr.disposition]?.class || 'badge-info'}`}>
                            {dispositionLabels[cdr.disposition]?.label || cdr.disposition}
                          </span>
                        </td>
                        <td className="text-sm">R$ {Number(cdr.cost || 0).toFixed(4)}</td>
                        <td className="text-sm">R$ {Number(cdr.price || 0).toFixed(4)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {(!cdrData?.records || cdrData.records.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  Nenhum registro encontrado
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DID Report */}
      {activeTab === 'dids' && (
        <div className="space-y-4">
          {loadingDID ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card py-4">
                  <p className="text-2xl font-bold text-white">{didReport?.total || 0}</p>
                  <p className="text-sm text-gray-400">Total DIDs</p>
                </div>
                <div className="card py-4">
                  <p className="text-2xl font-bold text-emerald-400">{didReport?.available || 0}</p>
                  <p className="text-sm text-gray-400">Disponíveis</p>
                </div>
                <div className="card py-4">
                  <p className="text-2xl font-bold text-primary-400">{didReport?.allocated || 0}</p>
                  <p className="text-sm text-gray-400">Alocados</p>
                </div>
                <div className="card py-4">
                  <p className="text-2xl font-bold text-amber-400">R$ {Number(didReport?.monthly_cost || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-400">Custo Mensal</p>
                </div>
              </div>

              {/* By Provider */}
              {didReport?.by_provider && didReport.by_provider.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">DIDs por Provedor</h3>
                  <div className="space-y-3">
                    {didReport.by_provider.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-dark-100 last:border-0">
                        <span className="text-white">{item.provider || 'Sem provedor'}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">{item.count} DIDs</span>
                          <span className="text-amber-400">R$ {Number(item.cost || 0).toFixed(2)}/mês</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Status */}
              {didReport?.by_status && didReport.by_status.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">DIDs por Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {didReport.by_status.map((item, idx) => (
                      <div key={idx} className="text-center p-4 bg-dark-300 rounded-lg">
                        <p className="text-2xl font-bold text-white">{item.count}</p>
                        <p className="text-sm text-gray-400 capitalize">{item.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
