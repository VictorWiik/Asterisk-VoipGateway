import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, PhoneCall, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function Extensions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExtension, setEditingExtension] = useState(null)
  const [formData, setFormData] = useState({
    extension: '',
    name: '',
    secret: '',
    customer_id: '',
    context: 'from-internal',
    codecs: 'alaw,ulaw',
    callerid: '',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: extensions, isLoading, refetch } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => api.get('/extensions/').then(res => res.data),
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/extensions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/extensions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/extensions/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['extensions'])
  })

  const openModal = (extension = null) => {
    if (extension) {
      setEditingExtension(extension)
      setFormData({
        extension: extension.extension,
        name: extension.name || '',
        secret: extension.secret,
        customer_id: extension.customer_id,
        context: extension.context || 'from-internal',
        codecs: extension.codecs || 'alaw,ulaw',
        callerid: extension.callerid || '',
        status: extension.status
      })
    } else {
      setEditingExtension(null)
      setFormData({
        extension: '',
        name: '',
        secret: '',
        customer_id: '',
        context: 'from-internal',
        codecs: 'alaw,ulaw',
        callerid: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingExtension(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingExtension) {
      updateMutation.mutate({ id: editingExtension.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este ramal?')) {
      deleteMutation.mutate(id)
    }
  }

  const getCustomerName = (customerId) => {
    const customer = customers?.find(c => c.id === customerId)
    return customer?.name || '-'
  }

  const onlineCount = extensions?.filter(e => e.is_online).length || 0
  const offlineCount = extensions?.filter(e => !e.is_online).length || 0

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
          <h1 className="text-2xl font-bold text-white">Ramais</h1>
          <p className="text-gray-400 mt-1">Gerencie os ramais dos clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()} 
            className="btn-secondary flex items-center gap-2"
            title="Atualizar status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Ramal
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <PhoneCall className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{extensions?.length || 0}</p>
            <p className="text-sm text-gray-400">Total de Ramais</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Wifi className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{onlineCount}</p>
            <p className="text-sm text-gray-400">Online</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{offlineCount}</p>
            <p className="text-sm text-gray-400">Offline</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Ramal</th>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Contexto</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {extensions?.map((extension) => (
                <tr key={extension.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {extension.is_online ? (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                          <span className="text-emerald-400 text-sm">Online</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                          <span className="text-gray-500 text-sm">Offline</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        extension.is_online 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-primary-400 font-medium">{extension.extension}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-white">{extension.name || '-'}</span>
                  </td>
                  <td>
                    <span className="text-gray-300">{getCustomerName(extension.customer_id)}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm text-gray-400">{extension.context}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      extension.status === 'active' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {extension.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal(extension)}
                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(extension.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {extensions?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum ramal cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingExtension ? 'Editar Ramal' : 'Novo Ramal'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ramal</label>
                  <input
                    type="text"
                    value={formData.extension}
                    onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                    className="input"
                    placeholder="1001"
                    required
                    disabled={!!editingExtension}
                  />
                </div>
                <div>
                  <label className="label">Senha SIP</label>
                  <input
                    type="text"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    className="input"
                    placeholder="senha123"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Nome do ramal"
                />
              </div>

              <div>
                <label className="label">Cliente</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contexto</label>
                  <input
                    type="text"
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Caller ID</label>
                  <input
                    type="text"
                    value={formData.callerid}
                    onChange={(e) => setFormData({ ...formData, callerid: e.target.value })}
                    className="input"
                    placeholder="1001"
                  />
                </div>
              </div>

              <div>
                <label className="label">Codecs</label>
                <input
                  type="text"
                  value={formData.codecs}
                  onChange={(e) => setFormData({ ...formData, codecs: e.target.value })}
                  className="input"
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

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingExtension ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
