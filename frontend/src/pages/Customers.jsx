import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Users, Phone, Server, Package } from 'lucide-react'
import api from '../services/api'

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'trunk',
    trunk_ip: '',
    trunk_port: 5060,
    trunk_context: 'from-trunk',
    trunk_codecs: 'alaw,ulaw',
    tech_prefix: '',
    plan_id: '',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data)
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['customers'])
  })

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        code: customer.code,
        name: customer.name,
        type: customer.type,
        trunk_ip: customer.trunk_ip || '',
        trunk_port: customer.trunk_port || 5060,
        trunk_context: customer.trunk_context || 'from-trunk',
        trunk_codecs: customer.trunk_codecs || 'alaw,ulaw',
        tech_prefix: customer.tech_prefix || '',
        plan_id: customer.plan_id || '',
        status: customer.status
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        code: '',
        name: '',
        type: 'trunk',
        trunk_ip: '',
        trunk_port: 5060,
        trunk_context: 'from-trunk',
        trunk_codecs: 'alaw,ulaw',
        tech_prefix: '',
        plan_id: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataToSend = {
      ...formData,
      plan_id: formData.plan_id || null
    }
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: dataToSend })
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  const getPlanName = (planId) => {
    const plan = plans?.find(p => p.id === planId)
    return plan?.name || '-'
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
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">Gerencie seus clientes trunk e ramal</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>IP/Conexão</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers?.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <span className="font-mono text-primary-400">{customer.code}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        customer.type === 'trunk' 
                          ? 'bg-violet-500/20 text-violet-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {customer.type === 'trunk' ? <Server className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                      <span className="text-white">{customer.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      customer.type === 'trunk' ? 'badge-purple' : 'badge-info'
                    }`}>
                      {customer.type === 'trunk' ? 'Trunk' : 'Ramal'}
                    </span>
                  </td>
                  <td>
                    {customer.type === 'trunk' ? (
                      <span className="font-mono text-sm">{customer.trunk_ip}:{customer.trunk_port}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td>
                    {customer.plan_id ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Package className="w-3 h-3 text-primary-400" />
                        <span className="text-gray-300">{getPlanName(customer.plan_id)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">Sem plano</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      customer.status === 'active' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal(customer)}
                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum cliente cadastrado
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
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="CLI001"
                    required
                    disabled={!!editingCustomer}
                  />
                </div>
                <div>
                  <label className="label">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="trunk">Trunk</option>
                    <option value="extension">Ramal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Plano</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Selecione um plano</option>
                    {plans?.filter(p => p.status === 'active').map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === 'trunk' && (
                <>
                  <div className="border-t border-dark-100 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">CONFIGURAÇÃO SIP</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">IP Address</label>
                      <input
                        type="text"
                        value={formData.trunk_ip}
                        onChange={(e) => setFormData({ ...formData, trunk_ip: e.target.value })}
                        className="input"
                        placeholder="200.200.200.200"
                      />
                    </div>
                    <div>
                      <label className="label">Porta</label>
                      <input
                        type="number"
                        value={formData.trunk_port}
                        onChange={(e) => setFormData({ ...formData, trunk_port: parseInt(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tech Prefix</label>
                      <input
                        type="text"
                        value={formData.tech_prefix}
                        onChange={(e) => setFormData({ ...formData, tech_prefix: e.target.value })}
                        className="input"
                        placeholder="0XX"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prefixo adicionado antes do número</p>
                    </div>
                    <div>
                      <label className="label">Context</label>
                      <input
                        type="text"
                        value={formData.trunk_context}
                        onChange={(e) => setFormData({ ...formData, trunk_context: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Codecs</label>
                    <input
                      type="text"
                      value={formData.trunk_codecs}
                      onChange={(e) => setFormData({ ...formData, trunk_codecs: e.target.value })}
                      className="input"
                    />
                  </div>
                </>
              )}

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
                  {editingCustomer ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
