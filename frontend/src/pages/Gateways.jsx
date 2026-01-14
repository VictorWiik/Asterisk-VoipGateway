import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Router, Layers } from 'lucide-react'
import api from '../services/api'

export default function Gateways() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ip_address: '',
    port: 5060,
    protocol: 'udp',
    username: '',
    password: '',
    context: 'from-trunk',
    codecs: 'alaw,ulaw',
    provider_id: '',
    gateway_group_id: '',
    direction: 'both',
    status: 'active'
  })

  const queryClient = useQueryClient()

  const { data: gateways, isLoading } = useQuery({
    queryKey: ['gateways'],
    queryFn: () => api.get('/gateways/').then(res => res.data)
  })

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers/').then(res => res.data)
  })

  const { data: gatewayGroups } = useQuery({
    queryKey: ['gateway-groups'],
    queryFn: () => api.get('/gateway-groups/').then(res => res.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/gateways/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateways'])
      queryClient.invalidateQueries(['gateway-groups'])
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put('/gateways/' + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateways'])
      queryClient.invalidateQueries(['gateway-groups'])
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete('/gateways/' + id),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateways'])
      queryClient.invalidateQueries(['gateway-groups'])
    }
  })

  const openModal = (gateway = null) => {
    if (gateway) {
      setEditingGateway(gateway)
      setFormData({
        name: gateway.name,
        description: gateway.description || '',
        ip_address: gateway.ip_address,
        port: gateway.port || 5060,
        protocol: gateway.protocol || 'udp',
        username: gateway.username || '',
        password: gateway.password || '',
        context: gateway.context || 'from-trunk',
        codecs: gateway.codecs || 'alaw,ulaw',
        provider_id: gateway.provider_id || '',
        gateway_group_id: gateway.gateway_group_id || '',
        direction: gateway.direction || 'both',
        status: gateway.status
      })
    } else {
      setEditingGateway(null)
      setFormData({
        name: '',
        description: '',
        ip_address: '',
        port: 5060,
        protocol: 'udp',
        username: '',
        password: '',
        context: 'from-trunk',
        codecs: 'alaw,ulaw',
        provider_id: '',
        gateway_group_id: '',
        direction: 'both',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGateway(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      provider_id: formData.provider_id || null,
      gateway_group_id: formData.gateway_group_id || null
    }
    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este gateway?')) {
      deleteMutation.mutate(id)
    }
  }

  const getGroupName = (groupId) => {
    const group = gatewayGroups?.find(g => g.id === groupId)
    return group ? group.name : '-'
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
          <h1 className="text-2xl font-bold text-white">Gateways</h1>
          <p className="text-gray-400 mt-1">Gerencie os gateways SIP</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Gateway
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Host</th>
                <th>Porta</th>
                <th>Grupo</th>
                <th>Direção</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gateways?.map((gateway) => (
                <tr key={gateway.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Router className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-white">{gateway.name}</span>
                    </div>
                  </td>
                  <td><span className="font-mono text-gray-300">{gateway.ip_address}</span></td>
                  <td><span className="text-gray-300">{gateway.port}</span></td>
                  <td>
                    {gateway.gateway_group_id ? (
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300">{getGroupName(gateway.gateway_group_id)}</span>
                      </div>
                    ) : (<span className="text-gray-500">-</span>)}
                  </td>
                  <td>
                    <span className={`badge ${gateway.direction === 'inbound' ? 'badge-info' : gateway.direction === 'outbound' ? 'badge-warning' : 'badge-secondary'}`}>
                      {gateway.direction === 'inbound' ? 'Entrada' : gateway.direction === 'outbound' ? 'Saída' : 'Ambos'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${gateway.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {gateway.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openModal(gateway)} className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-300 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(gateway.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-300 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {gateways?.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum gateway cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-400 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingGateway ? 'Editar Gateway' : 'Novo Gateway'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="GW_Provedor_01" required />
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
                <label className="label">Descrição</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" placeholder="Descrição do gateway" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label">Host / IP</label>
                  <input type="text" value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} className="input" placeholder="192.168.1.1" required />
                </div>
                <div>
                  <label className="label">Porta</label>
                  <input type="number" value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Protocolo</label>
                  <select value={formData.protocol} onChange={(e) => setFormData({ ...formData, protocol: e.target.value })} className="input">
                    <option value="udp">UDP</option>
                    <option value="tcp">TCP</option>
                    <option value="tls">TLS</option>
                  </select>
                </div>
                <div>
                  <label className="label">Direção</label>
                  <select value={formData.direction} onChange={(e) => setFormData({ ...formData, direction: e.target.value })} className="input">
                    <option value="both">Entrada e Saída</option>
                    <option value="inbound">Apenas Entrada</option>
                    <option value="outbound">Apenas Saída</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Usuário (opcional)</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="input" placeholder="usuario" />
                </div>
                <div>
                  <label className="label">Senha (opcional)</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input" placeholder="••••••••" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contexto</label>
                  <input type="text" value={formData.context} onChange={(e) => setFormData({ ...formData, context: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Codecs</label>
                  <input type="text" value={formData.codecs} onChange={(e) => setFormData({ ...formData, codecs: e.target.value })} className="input" />
                </div>
              </div>
              <div className="border-t border-dark-100 pt-4 mt-4">
                <h3 className="text-white font-medium mb-4">Associações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2"><Layers className="w-4 h-4 text-orange-400" />Grupo de Gateways</label>
                    <select value={formData.gateway_group_id} onChange={(e) => setFormData({ ...formData, gateway_group_id: e.target.value })} className="input">
                      <option value="">Nenhum grupo</option>
                      {gatewayGroups?.filter(g => g.status === 'active').map((group) => (<option key={group.id} value={group.id}>{group.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Provedor</label>
                    <select value={formData.provider_id} onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })} className="input">
                      <option value="">Selecione um provedor</option>
                      {providers?.map((provider) => (<option key={provider.id} value={provider.id}>{provider.name}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editingGateway ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
