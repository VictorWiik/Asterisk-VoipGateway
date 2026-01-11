import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  Phone,
  Smartphone,
  Globe
} from 'lucide-react'
import { providers } from '../services/api'

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

function ProviderForm({ provider, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: provider?.name || '',
    description: provider?.description || '',
    type: provider?.type || 'fixo',
    cost_per_minute: provider?.cost_per_minute || 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      cost_per_minute: parseFloat(form.cost_per_minute) || 0,
      ip_address: provider?.ip_address || '0.0.0.0',
      port: provider?.port || 5060,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome do Provedor</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder="Ex: Vivo, Claro, Embratel"
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
          placeholder="Operadora de telefonia"
        />
      </div>

      <div>
        <label className="label">Tipo de Trafego</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="select"
        >
          <option value="fixo">Fixo</option>
          <option value="movel">Movel</option>
          <option value="ldi">Internacional (LDI)</option>
          <option value="misto">Misto</option>
        </select>
      </div>

      <div>
        <label className="label">Custo por Minuto (R$)</label>
        <input
          type="number"
          step="0.0001"
          value={form.cost_per_minute}
          onChange={(e) => setForm({ ...form, cost_per_minute: e.target.value })}
          className="input"
          placeholder="0.0500"
        />
        <p className="text-xs text-gray-500 mt-1">Custo medio que o provedor cobra</p>
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

export default function Providers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: providersList, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providers.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: providers.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['providers'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => providers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['providers'])
      setIsModalOpen(false)
      setEditingProvider(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: providers.delete,
    onSuccess: () => queryClient.invalidateQueries(['providers']),
  })

  const handleSubmit = (data) => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (provider) => {
    setEditingProvider(provider)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este provedor?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredProviders = (providersList || []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const typeConfig = {
    fixo: { label: 'Fixo', icon: Phone, class: 'bg-blue-500/20 text-blue-400' },
    movel: { label: 'Movel', icon: Smartphone, class: 'bg-green-500/20 text-green-400' },
    ldi: { label: 'Internacional', icon: Globe, class: 'bg-purple-500/20 text-purple-400' },
    misto: { label: 'Misto', icon: Phone, class: 'bg-amber-500/20 text-amber-400' },
  }

  const statusLabels = {
    active: { label: 'Ativo', class: 'badge-success' },
    inactive: { label: 'Inativo', class: 'badge-warning' },
    suspended: { label: 'Suspenso', class: 'badge-danger' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Provedores</h1>
          <p className="text-gray-400 mt-1">Empresas fornecedoras de telefonia</p>
        </div>
        <button
          onClick={() => {
            setEditingProvider(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Provedor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar provedor..."
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
                <th>Provedor</th>
                <th>Tipo Trafego</th>
                <th>Custo/Min</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((provider) => {
                const typeInfo = typeConfig[provider.type] || typeConfig.fixo
                const TypeIcon = typeInfo.icon
                return (
                  <tr key={provider.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{provider.name}</p>
                          <p className="text-xs text-gray-500">{provider.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${typeInfo.class}`}>
                        <TypeIcon className="w-4 h-4" />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="font-mono">R$ {Number(provider.cost_per_minute || 0).toFixed(4)}</td>
                    <td>
                      <span className={`badge ${statusLabels[provider.status]?.class || 'badge-info'}`}>
                        {statusLabels[provider.status]?.label || provider.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(provider)}
                          className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
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

          {filteredProviders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum provedor encontrado
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProvider(null)
        }}
        title={editingProvider ? 'Editar Provedor' : 'Novo Provedor'}
      >
        <ProviderForm
          provider={editingProvider}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingProvider(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
