import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react'
import api from '../services/api'

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-400 border border-dark-100 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function TariffForm({ tariff, customers, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: tariff?.name || '',
    description: tariff?.description || '',
    direction: tariff?.direction || 'outbound',
    pattern: tariff?.pattern || '_X.',
    customer_id: tariff?.customer_id || '',
    cost_per_minute: tariff?.cost_per_minute || 0,
    price_per_minute: tariff?.price_per_minute || 0,
    connection_fee: tariff?.connection_fee || 0,
    billing_increment: tariff?.billing_increment || 6,
    min_duration: tariff?.min_duration || 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      customer_id: form.customer_id || null,
      cost_per_minute: parseFloat(form.cost_per_minute) || 0,
      price_per_minute: parseFloat(form.price_per_minute) || 0,
      connection_fee: parseFloat(form.connection_fee) || 0,
      billing_increment: parseInt(form.billing_increment) || 6,
      min_duration: parseInt(form.min_duration) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome da Tarifa</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder="Brasil Fixo"
          required
        />
      </div>

      <div>
        <label className="label">Descricao</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
          placeholder="Chamadas para telefones fixos"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Direcao</label>
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            className="select"
          >
            <option value="outbound">Saida (Originadas)</option>
            <option value="inbound">Entrada (Recebidas)</option>
          </select>
        </div>

        <div>
          <label className="label">Pattern</label>
          <input
            type="text"
            value={form.pattern}
            onChange={(e) => setForm({ ...form, pattern: e.target.value })}
            className="input font-mono"
            placeholder="_55XXXXXXXX"
          />
        </div>
      </div>

      <div>
        <label className="label">Cliente (opcional - deixe vazio para tarifa geral)</label>
        <select
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          className="select"
        >
          <option value="">Todos os clientes</option>
          {customers?.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Custo/Minuto (R$)</label>
          <input
            type="number"
            step="0.0001"
            value={form.cost_per_minute}
            onChange={(e) => setForm({ ...form, cost_per_minute: e.target.value })}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">Seu custo com o provedor</p>
        </div>

        <div>
          <label className="label">Preco/Minuto (R$)</label>
          <input
            type="number"
            step="0.0001"
            value={form.price_per_minute}
            onChange={(e) => setForm({ ...form, price_per_minute: e.target.value })}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">Preco cobrado do cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Taxa Conexao (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.connection_fee}
            onChange={(e) => setForm({ ...form, connection_fee: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Incremento (seg)</label>
          <select
            value={form.billing_increment}
            onChange={(e) => setForm({ ...form, billing_increment: e.target.value })}
            className="select"
          >
            <option value="1">1 segundo</option>
            <option value="6">6 segundos</option>
            <option value="30">30 segundos</option>
            <option value="60">60 segundos</option>
          </select>
        </div>

        <div>
          <label className="label">Duracao Min (seg)</label>
          <input
            type="number"
            value={form.min_duration}
            onChange={(e) => setForm({ ...form, min_duration: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Margin Preview */}
      {form.cost_per_minute > 0 && form.price_per_minute > 0 && (
        <div className="p-4 bg-dark-300 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Previsao de Margem</p>
          <div className="flex justify-between">
            <span className="text-white">Margem por minuto:</span>
            <span className={Number(form.price_per_minute) - Number(form.cost_per_minute) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              R$ {(Number(form.price_per_minute) - Number(form.cost_per_minute)).toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white">Margem (%):</span>
            <span className={Number(form.price_per_minute) - Number(form.cost_per_minute) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {(((Number(form.price_per_minute) - Number(form.cost_per_minute)) / Number(form.cost_per_minute)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  )
}

export default function Tariffs() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTariff, setEditingTariff] = useState(null)
  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/tariffs/').then(res => res.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/tariffs/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tariffs'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tariffs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tariffs'])
      setIsModalOpen(false)
      setEditingTariff(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tariffs/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['tariffs']),
  })

  const handleSubmit = (data) => {
    if (editingTariff) {
      updateMutation.mutate({ id: editingTariff.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (tariff) => {
    setEditingTariff(tariff)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir esta tarifa?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredTariffs = (tariffs || []).filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.pattern.toLowerCase().includes(search.toLowerCase())
    const matchesDirection = !directionFilter || t.direction === directionFilter
    return matchesSearch && matchesDirection
  })

  const getCustomerName = (customerId) => {
    if (!customerId) return 'Todos'
    const customer = customers?.find(c => c.id === customerId)
    return customer ? customer.code : '-'
  }

  const statusLabels = {
    active: { label: 'Ativa', class: 'badge-success' },
    inactive: { label: 'Inativa', class: 'badge-warning' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarifas</h1>
          <p className="text-gray-400 mt-1">Gerencie a precificacao de chamadas</p>
        </div>
        <button
          onClick={() => {
            setEditingTariff(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Tarifa
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-r from-primary-500/10 to-primary-500/5 border-primary-500/20">
          <div className="flex items-center gap-3">
            <PhoneOutgoing className="w-10 h-10 text-primary-400" />
            <div>
              <h3 className="text-white font-semibold">Tarifas de Saida</h3>
              <p className="text-sm text-gray-400">Chamadas originadas pelos clientes</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3">
            <PhoneIncoming className="w-10 h-10 text-emerald-400" />
            <div>
              <h3 className="text-white font-semibold">Tarifas de Entrada</h3>
              <p className="text-sm text-gray-400">Chamadas recebidas nos DIDs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar tarifa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="select w-48"
        >
          <option value="">Todas direcoes</option>
          <option value="outbound">Saida</option>
          <option value="inbound">Entrada</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tarifa</th>
                <th>Direcao</th>
                <th>Pattern</th>
                <th>Cliente</th>
                <th>Custo/Min</th>
                <th>Preco/Min</th>
                <th>Margem</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTariffs.map((tariff) => {
                const margin = Number(tariff.price_per_minute) - Number(tariff.cost_per_minute)
                return (
                  <tr key={tariff.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tariff.direction === 'outbound' ? 'bg-primary-500/20' : 'bg-emerald-500/20'
                        }`}>
                          {tariff.direction === 'outbound' ? (
                            <PhoneOutgoing className="w-5 h-5 text-primary-400" />
                          ) : (
                            <PhoneIncoming className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{tariff.name}</p>
                          <p className="text-xs text-gray-500">{tariff.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${tariff.direction === 'outbound' ? 'badge-info' : 'badge-success'}`}>
                        {tariff.direction === 'outbound' ? 'Saida' : 'Entrada'}
                      </span>
                    </td>
                    <td>
                      <code className="px-2 py-1 bg-dark-300 rounded text-primary-400 text-sm">
                        {tariff.pattern}
                      </code>
                    </td>
                    <td>{getCustomerName(tariff.customer_id)}</td>
                    <td className="text-amber-400">R$ {Number(tariff.cost_per_minute || 0).toFixed(4)}</td>
                    <td className="text-emerald-400">R$ {Number(tariff.price_per_minute || 0).toFixed(4)}</td>
                    <td className={margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      R$ {margin.toFixed(4)}
                    </td>
                    <td>
                      <span className={`badge ${statusLabels[tariff.status]?.class || 'badge-info'}`}>
                        {statusLabels[tariff.status]?.label || tariff.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(tariff)}
                          className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(tariff.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredTariffs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma tarifa encontrada
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTariff(null)
        }}
        title={editingTariff ? 'Editar Tarifa' : 'Nova Tarifa'}
      >
        <TariffForm
          tariff={editingTariff}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingTariff(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
