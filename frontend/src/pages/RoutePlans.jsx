import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Route, Check } from 'lucide-react'
import api from '../services/api'

export default function RoutePlans() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_channels: 0,
    status: 'active',
    route_ids: []
  })

  const queryClient = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['route-plans'],
    queryFn: () => api.get('/route-plans/').then(res => res.data)
  })

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.get('/routes/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/route-plans/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['route-plans'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/route-plans/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['route-plans'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete('/route-plans/' + id),
    onSuccess: () => queryClient.invalidateQueries(['route-plans'])
  })

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        description: plan.description || '',
        max_channels: plan.max_channels || 0,
        status: plan.status,
        route_ids: plan.routes?.map(r => r.id) || []
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        description: '',
        max_channels: 0,
        status: 'active',
        route_ids: []
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este plano de rotas?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleRoute = (routeId) => {
    setFormData(prev => ({
      ...prev,
      route_ids: prev.route_ids.includes(routeId)
        ? prev.route_ids.filter(id => id !== routeId)
        : [...prev.route_ids, routeId]
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Planos de Rotas</h1>
          <p className="text-gray-400 mt-1">Gerencie os planos de rotas para seus clientes</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <div key={plan.id} className="card hover:border-primary-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Route className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.routes?.length || 0} rotas</p>
                </div>
              </div>
              <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {plan.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {plan.description && (
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Rotas incluídas:</p>
              <div className="flex flex-wrap gap-2">
                {plan.routes?.slice(0, 5).map((route) => (
                  <span key={route.id} className="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded">
                    {route.name}
                  </span>
                ))}
                {plan.routes?.length > 5 && (
                  <span className="text-xs bg-dark-300 text-gray-400 px-2 py-1 rounded">
                    +{plan.routes.length - 5} mais
                  </span>
                )}
                {(!plan.routes || plan.routes.length === 0) && (
                  <span className="text-xs text-gray-500">Nenhuma rota</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-dark-100">
              <button
                onClick={() => openModal(plan)}
                className="flex-1 btn-secondary py-2 text-sm"
              >
                <Pencil className="w-4 h-4 inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {plans?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum plano de rotas cadastrado
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingPlan ? 'Editar Plano' : 'Novo Plano de Rotas'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome do Plano</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: Plano Brasil"
                  required
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Descrição do plano"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Canais</label>
                  <input
                    type="number"
                    value={formData.max_channels}
                    onChange={(e) => setFormData({ ...formData, max_channels: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Rotas do Plano</label>
                <div className="bg-dark-300 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {routes?.map((route) => (
                    <label
                      key={route.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-200 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          formData.route_ids.includes(route.id)
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-gray-500'
                        }`}
                        onClick={() => toggleRoute(route.id)}
                      >
                        {formData.route_ids.includes(route.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-white">{route.name}</span>
                        <span className="text-gray-500 text-sm ml-2">{route.pattern}</span>
                      </div>
                    </label>
                  ))}
                  {(!routes || routes.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhuma rota cadastrada</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingPlan ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
