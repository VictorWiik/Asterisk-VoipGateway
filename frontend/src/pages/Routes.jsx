import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Route,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  ArrowRight
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

function RouteForm({ route, gateways, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: route?.name || '',
    description: route?.description || '',
    pattern: route?.pattern || '_X.',
    gateway_id: route?.gateway_id || '',
    priority: route?.priority || 1,
    cost_per_minute: route?.cost_per_minute || 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      gateway_id: form.gateway_id || null,
      priority: parseInt(form.priority) || 1,
      cost_per_minute: parseFloat(form.cost_per_minute) || 0
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder="Rota Brasil Fixo"
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
          placeholder="Rota para telefones fixos"
        />
      </div>

      <div>
        <label className="label">Pattern (Dialplan)</label>
        <input
          type="text"
          value={form.pattern}
          onChange={(e) => setForm({ ...form, pattern: e.target.value })}
          className="input font-mono"
          placeholder="_55XXXXXXXX"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Ex: _55XXXXXXXX (fixo BR), _559XXXXXXXXX (movel BR), _00X. (internacional)
        </p>
      </div>

      <div>
        <label className="label">Gateway</label>
        <select
          value={form.gateway_id}
          onChange={(e) => setForm({ ...form, gateway_id: e.target.value })}
          className="select"
        >
          <option value="">Selecione...</option>
          {gateways?.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Prioridade</label>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="input"
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">Menor = mais prioritario</p>
        </div>

        <div>
          <label className="label">Custo/Minuto (R$)</label>
          <input
            type="number"
            step="0.0001"
            value={form.cost_per_minute}
            onChange={(e) => setForm({ ...form, cost_per_minute: e.target.value })}
            className="input"
          />
        </div>
      </div>

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

export default function Routes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.get('/routes/').then(res => res.data),
  })

  const { data: gateways } = useQuery({
    queryKey: ['gateways'],
    queryFn: () => api.get('/gateways/').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/routes/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/routes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
      setIsModalOpen(false)
      setEditingRoute(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/routes/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['routes']),
  })

  const handleSubmit = (data) => {
    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (route) => {
    setEditingRoute(route)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir esta rota?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredRoutes = (routes || []).filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.pattern.toLowerCase().includes(search.toLowerCase())
  )

  const getGatewayName = (gatewayId) => {
    const gateway = gateways?.find(g => g.id === gatewayId)
    return gateway?.name || '-'
  }

  const statusLabels = {
    active: { label: 'Ativa', class: 'badge-success' },
    inactive: { label: 'Inativa', class: 'badge-warning' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rotas</h1>
          <p className="text-gray-400 mt-1">Gerencie as rotas de saida</p>
        </div>
        <button
          onClick={() => {
            setEditingRoute(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Rota
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar rota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rota</th>
                <th>Pattern</th>
                <th>Gateway</th>
                <th>Prioridade</th>
                <th>Custo/Min</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.sort((a, b) => a.priority - b.priority).map((route) => (
                <tr key={route.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Route className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{route.name}</p>
                        <p className="text-xs text-gray-500">{route.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="px-2 py-1 bg-dark-300 rounded text-primary-400">
                      {route.pattern}
                    </code>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <span>{getGatewayName(route.gateway_id)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 bg-dark-300 rounded text-white">
                      {route.priority}
                    </span>
                  </td>
                  <td>R$ {Number(route.cost_per_minute || 0).toFixed(4)}</td>
                  <td>
                    <span className={`badge ${statusLabels[route.status]?.class || 'badge-info'}`}>
                      {statusLabels[route.status]?.label || route.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(route)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma rota encontrada
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRoute(null)
        }}
        title={editingRoute ? 'Editar Rota' : 'Nova Rota'}
      >
        <RouteForm
          route={editingRoute}
          gateways={gateways}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingRoute(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
