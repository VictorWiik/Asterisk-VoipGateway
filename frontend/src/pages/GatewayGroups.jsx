import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Server, Layers, Router } from 'lucide-react'
import api from '../services/api'

export default function GatewayGroups() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider_id: '',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: groups, isLoading } = useQuery({
    queryKey: ['gateway-groups'],
    queryFn: () => api.get('/gateway-groups/').then(res => res.data)
  })

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/gateway-groups/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateway-groups'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/gateway-groups/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateway-groups'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete('/gateway-groups/' + id),
    onSuccess: () => queryClient.invalidateQueries(['gateway-groups'])
  })

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        description: group.description || '',
        provider_id: group.provider_id || '',
        status: group.status
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: '',
        description: '',
        provider_id: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      provider_id: formData.provider_id || null
    }
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      deleteMutation.mutate(id)
    }
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
          <h1 className="text-2xl font-bold text-white">Grupos de Gateways</h1>
          <p className="text-gray-400 mt-1">Agrupe gateways para gerenciar múltiplos IPs de um provedor</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Grupo
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group) => (
          <div key={group.id} className="card hover:border-primary-500/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  <p className="text-sm text-gray-400">
                    {group.gateways?.length || 0} gateway(s)
                  </p>
                </div>
              </div>
              <span className={`badge ${group.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {group.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {group.description && (
              <p className="text-gray-400 text-sm mb-4">{group.description}</p>
            )}

            {group.provider && (
              <div className="mb-4 p-2 bg-dark-300 rounded-lg">
                <p className="text-xs text-gray-500">Provedor</p>
                <p className="text-sm text-white">{group.provider.name}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Gateways no grupo:</p>
              <div className="flex flex-wrap gap-2">
                {group.gateways?.length > 0 ? (
                  group.gateways.map((gw) => (
                    <span key={gw.id} className="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                      <Router className="w-3 h-3 text-orange-400" />
                      {gw.name} ({gw.ip_address})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Nenhum gateway associado</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-dark-100">
              <button
                onClick={() => openModal(group)}
                className="flex-1 btn-secondary py-2 text-sm"
              >
                <Pencil className="w-4 h-4 inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(group.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {groups?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum grupo de gateways cadastrado
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo de Gateways'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome do Grupo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: FSM Telecom"
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
                  placeholder="Descrição do grupo"
                />
              </div>

              <div>
                <label className="label">Provedor</label>
                <select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  className="input"
                >
                  <option value="">Selecione um provedor (opcional)</option>
                  {providers?.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
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

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingGroup ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
