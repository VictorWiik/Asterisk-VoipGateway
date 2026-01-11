import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  Server
} from 'lucide-react'
import api from '../services/api'

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-400 border border-dark-100 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
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

function GatewayForm({ gateway, providers, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: gateway?.name || '',
    description: gateway?.description || '',
    provider_id: gateway?.provider_id || '',
    ip_address: gateway?.ip_address || '',
    port: gateway?.port || 5060,
    tech_prefix: gateway?.tech_prefix || '',
    context: gateway?.context || 'from-trunk',
    codecs: gateway?.codecs || 'alaw,ulaw',
    dtmf_mode: gateway?.dtmf_mode || 'rfc2833',
    qualify: gateway?.qualify || 'yes',
    max_channels: gateway?.max_channels || 0,
    auth_type: gateway?.auth_type || 'ip',
    username: gateway?.username || '',
    password: gateway?.password || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      provider_id: form.provider_id || null,
      port: parseInt(form.port) || 5060,
      max_channels: parseInt(form.max_channels) || 0
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nome do Gateway</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="GW_Vivo_SP"
            required
          />
        </div>

        <div>
          <label className="label">Provedor</label>
          <select
            value={form.provider_id}
            onChange={(e) => setForm({ ...form, provider_id: e.target.value })}
            className="select"
          >
            <option value="">Selecione...</option>
            {providers?.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descricao</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
          placeholder="Gateway principal Vivo Sao Paulo"
        />
      </div>

      <div className="p-4 bg-dark-300 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-gray-400">CONFIGURACAO SIP</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">IP Address</label>
            <input
              type="text"
              value={form.ip_address}
              onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
              className="input font-mono"
              placeholder="200.200.200.200"
              required
            />
          </div>

          <div>
            <label className="label">Porta</label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Tech Prefix</label>
            <input
              type="text"
              value={form.tech_prefix}
              onChange={(e) => setForm({ ...form, tech_prefix: e.target.value })}
              className="input font-mono"
              placeholder="0XX"
            />
            <p className="text-xs text-gray-500 mt-1">Prefixo adicionado antes do numero</p>
          </div>

          <div>
            <label className="label">Max Canais</label>
            <input
              type="number"
              value={form.max_channels}
              onChange={(e) => setForm({ ...form, max_channels: e.target.value })}
              className="input"
              placeholder="0 = ilimitado"
            />
          </div>

          <div>
            <label className="label">Context</label>
            <input
              type="text"
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              className="input font-mono"
            />
          </div>

          <div>
            <label className="label">Codecs</label>
            <input
              type="text"
              value={form.codecs}
              onChange={(e) => setForm({ ...form, codecs: e.target.value })}
              className="input font-mono"
            />
          </div>

          <div>
            <label className="label">DTMF Mode</label>
            <select
              value={form.dtmf_mode}
              onChange={(e) => setForm({ ...form, dtmf_mode: e.target.value })}
              className="select"
            >
              <option value="rfc2833">RFC2833</option>
              <option value="inband">Inband</option>
              <option value="info">SIP INFO</option>
            </select>
          </div>

          <div>
            <label className="label">Autenticacao</label>
            <select
              value={form.auth_type}
              onChange={(e) => setForm({ ...form, auth_type: e.target.value })}
              className="select"
            >
              <option value="ip">Por IP</option>
              <option value="credentials">Usuario/Senha</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        {form.auth_type !== 'ip' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Usuario</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
              />
            </div>
          </div>
        )}
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

export default function Gateways() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: gateways, isLoading } = useQuery({
    queryKey: ['gateways'],
    queryFn: () => api.get('/gateways/').then(res => res.data),
  })

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers/').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/gateways/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateways'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/gateways/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateways'])
      setIsModalOpen(false)
      setEditingGateway(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/gateways/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['gateways']),
  })

  const handleSubmit = (data) => {
    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (gateway) => {
    setEditingGateway(gateway)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este gateway?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredGateways = (gateways || []).filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const getProviderName = (providerId) => {
    const provider = providers?.find(p => p.id === providerId)
    return provider?.name || '-'
  }

  const statusLabels = {
    active: { label: 'Ativo', class: 'badge-success' },
    inactive: { label: 'Inativo', class: 'badge-warning' },
    maintenance: { label: 'Manutencao', class: 'badge-danger' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gateways</h1>
          <p className="text-gray-400 mt-1">Configuracoes tecnicas SIP dos provedores</p>
        </div>
        <button
          onClick={() => {
            setEditingGateway(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Gateway
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar gateway..."
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
                <th>Gateway</th>
                <th>Provedor</th>
                <th>IP:Porta</th>
                <th>Tech Prefix</th>
                <th>Max Canais</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredGateways.map((gateway) => (
                <tr key={gateway.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{gateway.name}</p>
                        <p className="text-xs text-gray-500">{gateway.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>{getProviderName(gateway.provider_id)}</td>
                  <td className="font-mono text-sm">
                    {gateway.ip_address}:{gateway.port || 5060}
                  </td>
                  <td className="font-mono text-sm">{gateway.tech_prefix || '-'}</td>
                  <td>{gateway.max_channels || 'Ilimitado'}</td>
                  <td>
                    <span className={`badge ${statusLabels[gateway.status]?.class || 'badge-info'}`}>
                      {statusLabels[gateway.status]?.label || gateway.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(gateway)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(gateway.id)}
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

          {filteredGateways.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum gateway encontrado
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGateway(null)
        }}
        title={editingGateway ? 'Editar Gateway' : 'Novo Gateway'}
      >
        <GatewayForm
          gateway={editingGateway}
          providers={providers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingGateway(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
