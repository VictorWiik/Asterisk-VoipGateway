import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PhoneCall,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  Copy,
  Eye,
  EyeOff
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

function ExtensionForm({ extension, customers, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    customer_id: extension?.customer_id || '',
    extension: extension?.extension || '',
    name: extension?.name || '',
    secret: extension?.secret || generatePassword(),
    auth_type: extension?.auth_type || 'credentials',
    allowed_ips: extension?.allowed_ips || '',
    callerid: extension?.callerid || '',
    context: extension?.context || 'from-internal',
    max_contacts: extension?.max_contacts || 1,
    codecs: extension?.codecs || 'alaw,ulaw',
  })

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      max_contacts: parseInt(form.max_contacts) || 1
    })
  }

  // Filtra apenas clientes tipo ramal
  const ramalCustomers = customers?.filter(c => c.type !== 'trunk') || []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Cliente</label>
        <select
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          className="select"
          required
        >
          <option value="">Selecione...</option>
          {ramalCustomers.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Ramal</label>
          <input
            type="text"
            value={form.extension}
            onChange={(e) => setForm({ ...form, extension: e.target.value })}
            className="input font-mono"
            placeholder="1001"
            required
          />
        </div>

        <div>
          <label className="label">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="Recepcao"
          />
        </div>
      </div>

      <div>
        <label className="label">Senha SIP</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.secret}
            onChange={(e) => setForm({ ...form, secret: e.target.value })}
            className="input font-mono flex-1"
            required
          />
          <button
            type="button"
            onClick={() => setForm({ ...form, secret: generatePassword() })}
            className="btn-secondary px-3"
            title="Gerar nova senha"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="label">Autenticacao</label>
        <select
          value={form.auth_type}
          onChange={(e) => setForm({ ...form, auth_type: e.target.value })}
          className="select"
        >
          <option value="credentials">Usuario/Senha</option>
          <option value="ip">Por IP</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      {form.auth_type !== 'credentials' && (
        <div>
          <label className="label">IPs Permitidos</label>
          <input
            type="text"
            value={form.allowed_ips}
            onChange={(e) => setForm({ ...form, allowed_ips: e.target.value })}
            className="input"
            placeholder="192.168.1.100,10.0.0.0/24"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">CallerID</label>
          <input
            type="text"
            value={form.callerid}
            onChange={(e) => setForm({ ...form, callerid: e.target.value })}
            className="input"
            placeholder="Recepcao <1001>"
          />
        </div>

        <div>
          <label className="label">Max Registros</label>
          <input
            type="number"
            value={form.max_contacts}
            onChange={(e) => setForm({ ...form, max_contacts: e.target.value })}
            className="input"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Context</label>
          <input
            type="text"
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Codecs</label>
          <input
            type="text"
            value={form.codecs}
            onChange={(e) => setForm({ ...form, codecs: e.target.value })}
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

export default function Extensions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExtension, setEditingExtension] = useState(null)
  const [search, setSearch] = useState('')
  const [showSecrets, setShowSecrets] = useState({})
  const queryClient = useQueryClient()

  const { data: extensions, isLoading } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => api.get('/extensions/').then(res => res.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/extensions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/extensions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extensions'])
      setIsModalOpen(false)
      setEditingExtension(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/extensions/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['extensions']),
  })

  const handleSubmit = (data) => {
    if (editingExtension) {
      updateMutation.mutate({ id: editingExtension.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (extension) => {
    setEditingExtension(extension)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este ramal?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleSecret = (id) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const filteredExtensions = (extensions || []).filter(e =>
    e.extension.includes(search) ||
    (e.name && e.name.toLowerCase().includes(search.toLowerCase()))
  )

  const getCustomerName = (customerId) => {
    const customer = customers?.find(c => c.id === customerId)
    return customer ? `${customer.code} - ${customer.name}` : '-'
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
          <h1 className="text-2xl font-bold text-white">Ramais</h1>
          <p className="text-gray-400 mt-1">Gerencie os ramais dos clientes</p>
        </div>
        <button
          onClick={() => {
            setEditingExtension(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Ramal
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar ramal..."
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
                <th>Ramal</th>
                <th>Cliente</th>
                <th>Senha</th>
                <th>CallerID</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredExtensions.map((ext) => (
                <tr key={ext.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-white">{ext.extension}</p>
                        <p className="text-xs text-gray-500">{ext.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{getCustomerName(ext.customer_id)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-dark-300 rounded text-sm">
                        {showSecrets[ext.id] ? ext.secret : '••••••••'}
                      </code>
                      <button
                        onClick={() => toggleSecret(ext.id)}
                        className="p-1 hover:bg-dark-300 rounded"
                      >
                        {showSecrets[ext.id] ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(ext.secret)}
                        className="p-1 hover:bg-dark-300 rounded"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                  <td className="text-sm">{ext.callerid || '-'}</td>
                  <td>
                    <span className={`badge ${statusLabels[ext.status]?.class || 'badge-info'}`}>
                      {statusLabels[ext.status]?.label || ext.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(ext)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(ext.id)}
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

          {filteredExtensions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum ramal encontrado
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingExtension(null)
        }}
        title={editingExtension ? 'Editar Ramal' : 'Novo Ramal'}
      >
        <ExtensionForm
          extension={editingExtension}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingExtension(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
