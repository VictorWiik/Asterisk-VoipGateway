import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Headphones, Route, DollarSign, Phone, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import api from '../services/api'

export default function CustomersPabx() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editingExtension, setEditingExtension] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'extension',
    route_plan_id: '',
    tariff_plan_id: '',
    status: 'active'
  })
  const [extensionForm, setExtensionForm] = useState({
    extension: '',
    name: '',
    password: '',
    context: 'from-internal',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers-pabx'],
    queryFn: () => api.get('/customers/').then(res => res.data)
  })

  const { data: extensions } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => api.get('/extensions/').then(res => res.data)
  })

  const { data: routePlans } = useQuery({
    queryKey: ['route-plans'],
    queryFn: () => api.get('/route-plans/').then(res => res.data)
  })

  const { data: tariffPlans } = useQuery({
    queryKey: ['tariff-plans'],
    queryFn: () => api.get('/tariff-plans/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers-pabx'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/customers/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers-pabx'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete('/customers/' + id),
    onSuccess: () => queryClient.invalidateQueries(['customers-pabx'])
  })

  const createExtensionMutation = useMutation({
    mutationFn: (data) => api.post('/extensions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      closeExtensionModal()
    }
  })

  const updateExtensionMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/extensions/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      closeExtensionModal()
    }
  })

  const deleteExtensionMutation = useMutation({
    mutationFn: (id) => api.delete('/extensions/' + id),
    onSuccess: () => queryClient.invalidateQueries(['extensions'])
  })

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        code: customer.code,
        name: customer.name,
        type: 'extension',
        route_plan_id: customer.route_plan_id || '',
        tariff_plan_id: customer.tariff_plan_id || '',
        status: customer.status
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        code: '',
        name: '',
        type: 'extension',
        route_plan_id: '',
        tariff_plan_id: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const openExtensionModal = (customer, extension = null) => {
    setSelectedCustomer(customer)
    if (extension) {
      setEditingExtension(extension)
      setExtensionForm({
        extension: extension.extension,
        name: extension.name,
        password: '',
        context: extension.context || 'from-internal',
        status: extension.status
      })
    } else {
      setEditingExtension(null)
      setExtensionForm({
        extension: '',
        name: '',
        password: '',
        context: 'from-internal',
        status: 'active'
      })
    }
    setIsExtensionModalOpen(true)
  }

  const closeExtensionModal = () => {
    setIsExtensionModalOpen(false)
    setEditingExtension(null)
    setSelectedCustomer(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      route_plan_id: formData.route_plan_id || null,
      tariff_plan_id: formData.tariff_plan_id || null
    }
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleExtensionSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...extensionForm,
      customer_id: selectedCustomer.id
    }
    if (editingExtension) {
      // Se senha vazia, não enviar
      if (!data.password) delete data.password
      updateExtensionMutation.mutate({ id: editingExtension.id, data })
    } else {
      createExtensionMutation.mutate(data)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleDeleteExtension = (id) => {
    if (confirm('Tem certeza que deseja excluir este ramal?')) {
      deleteExtensionMutation.mutate(id)
    }
  }

  const toggleExpanded = (customerId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }))
  }

  const getCustomerExtensions = (customerId) => {
    return extensions?.filter(ext => ext.customer_id === customerId) || []
  }

  // Filtrar apenas clientes extension (PABX)
  const pabxCustomers = customers?.filter(c => c.type === 'extension') || []

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
          <h1 className="text-2xl font-bold text-white">Clientes PABX</h1>
          <p className="text-gray-400 mt-1">Gerencie os clientes com ramais</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {pabxCustomers.map((customer) => {
          const customerExtensions = getCustomerExtensions(customer.id)
          const isExpanded = expandedCustomers[customer.id]

          return (
            <div key={customer.id} className="card">
              {/* Header do Cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleExpanded(customer.id)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{customer.name}</h3>
                      <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-1 rounded">
                        {customer.code}
                      </span>
                      <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {customerExtensions.length} ramal(is)
                      </span>
                      {customer.route_plan && (
                        <span className="flex items-center gap-1">
                          <Route className="w-4 h-4 text-primary-400" />
                          {customer.route_plan.name}
                        </span>
                      )}
                      {customer.tariff_plan && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          {customer.tariff_plan.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openExtensionModal(customer)}
                    className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Novo Ramal
                  </button>
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
              </div>

              {/* Lista de Ramais */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-dark-100">
                  {customerExtensions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 uppercase">
                            <th className="pb-3 pl-4">Ramal</th>
                            <th className="pb-3">Nome</th>
                            <th className="pb-3">Contexto</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 pr-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100">
                          {customerExtensions.map((ext) => (
                            <tr key={ext.id} className="hover:bg-dark-300/50">
                              <td className="py-3 pl-4">
                                <span className="font-mono text-primary-400">{ext.extension}</span>
                              </td>
                              <td className="py-3 text-white">{ext.name}</td>
                              <td className="py-3 text-gray-400">{ext.context}</td>
                              <td className="py-3">
                                <span className={`badge text-xs ${ext.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                  {ext.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openExtensionModal(customer, ext)}
                                    className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-dark-200 rounded transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExtension(ext.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-200 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum ramal cadastrado</p>
                      <button
                        onClick={() => openExtensionModal(customer)}
                        className="mt-2 text-primary-400 hover:text-primary-300 text-sm"
                      >
                        Adicionar primeiro ramal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {pabxCustomers.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            Nenhum cliente PABX cadastrado
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente PABX'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input" placeholder="PBX001" required />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="Nome do cliente" required />
              </div>
              <div className="border-t border-dark-100 pt-4 mt-4">
                <h3 className="text-white font-medium mb-4">Planos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2"><Route className="w-4 h-4 text-primary-400" />Plano de Rotas</label>
                    <select value={formData.route_plan_id} onChange={(e) => setFormData({ ...formData, route_plan_id: e.target.value })} className="input">
                      <option value="">Selecione um plano</option>
                      {routePlans?.filter(p => p.status === 'active').map((plan) => (<option key={plan.id} value={plan.id}>{plan.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" />Plano de Tarifas</label>
                    <select value={formData.tariff_plan_id} onChange={(e) => setFormData({ ...formData, tariff_plan_id: e.target.value })} className="input">
                      <option value="">Selecione um plano</option>
                      {tariffPlans?.filter(p => p.status === 'active').map((plan) => (<option key={plan.id} value={plan.id}>{plan.name}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editingCustomer ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ramal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{editingExtension ? 'Editar Ramal' : 'Novo Ramal'}</h2>
                <p className="text-sm text-gray-400 mt-1">Cliente: {selectedCustomer?.name}</p>
              </div>
              <button onClick={closeExtensionModal} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleExtensionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Número do Ramal</label>
                  <input 
                    type="text" 
                    value={extensionForm.extension} 
                    onChange={(e) => setExtensionForm({ ...extensionForm, extension: e.target.value })} 
                    className="input" 
                    placeholder="1001" 
                    required 
                    disabled={!!editingExtension}
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={extensionForm.status} onChange={(e) => setExtensionForm({ ...extensionForm, status: e.target.value })} className="input">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome</label>
                <input type="text" value={extensionForm.name} onChange={(e) => setExtensionForm({ ...extensionForm, name: e.target.value })} className="input" placeholder="Nome do usuário" required />
              </div>
              <div>
                <label className="label">{editingExtension ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}</label>
                <input type="password" value={extensionForm.password} onChange={(e) => setExtensionForm({ ...extensionForm, password: e.target.value })} className="input" placeholder="••••••••" required={!editingExtension} />
              </div>
              <div>
                <label className="label">Contexto</label>
                <input type="text" value={extensionForm.context} onChange={(e) => setExtensionForm({ ...extensionForm, context: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeExtensionModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editingExtension ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
