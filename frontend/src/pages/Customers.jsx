import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  Mail,
  Phone,
  Server
} from 'lucide-react'
import { customers } from '../services/api'

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

function CustomerForm({ customer, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    code: customer?.code || '',
    name: customer?.name || '',
    type: customer?.type || 'extension',
    document: customer?.document || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    billing_type: customer?.billing_type || 'postpaid',
    credit_limit: customer?.credit_limit || 0,
    max_channels: customer?.max_channels || 10,
    notes: customer?.notes || '',
    // Campos trunk
    trunk_ip: customer?.trunk_ip || '',
    trunk_port: customer?.trunk_port || 5060,
    trunk_codecs: customer?.trunk_codecs || 'alaw,ulaw',
    trunk_auth_type: customer?.trunk_auth_type || 'ip',
    trunk_username: customer?.trunk_username || '',
    trunk_password: customer?.trunk_password || '',
    trunk_tech_prefix: customer?.trunk_tech_prefix || '',
    trunk_context: customer?.trunk_context || 'from-trunk',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Cliente */}
      <div className="flex gap-4 p-4 bg-dark-300 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="extension"
            checked={form.type === 'extension'}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-4 h-4 text-primary-500"
          />
          <Users className="w-5 h-5 text-primary-400" />
          <span className="text-white">Cliente Ramal</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="trunk"
            checked={form.type === 'trunk'}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-4 h-4 text-primary-500"
          />
          <Server className="w-5 h-5 text-amber-400" />
          <span className="text-white">Cliente Trunk</span>
        </label>
      </div>

      {/* Dados Básicos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">DADOS BÁSICOS</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Código</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="input"
              placeholder="CLI001"
              required
              disabled={!!customer}
            />
          </div>

          <div>
            <label className="label">Tipo Cobrança</label>
            <select
              value={form.billing_type}
              onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
              className="select"
            >
              <option value="postpaid">Pós-pago</option>
              <option value="prepaid">Pré-pago</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Nome / Razão Social</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <label className="label">CPF/CNPJ</label>
            <input
              type="text"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
              className="input"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="email@empresa.com"
            />
          </div>

          <div>
            <label className="label">Limite de Crédito (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.credit_limit}
              onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Max. Canais</label>
            <input
              type="number"
              value={form.max_channels}
              onChange={(e) => setForm({ ...form, max_channels: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Configurações Trunk */}
      {form.type === 'trunk' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">CONFIGURAÇÕES TRUNK</h3>
          <div className="grid grid-cols-2 gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div>
              <label className="label">IP de Destino</label>
              <input
                type="text"
                value={form.trunk_ip}
                onChange={(e) => setForm({ ...form, trunk_ip: e.target.value })}
                className="input"
                placeholder="200.200.200.200"
                required={form.type === 'trunk'}
              />
            </div>

            <div>
              <label className="label">Porta</label>
              <input
                type="number"
                value={form.trunk_port}
                onChange={(e) => setForm({ ...form, trunk_port: parseInt(e.target.value) || 5060 })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Codecs</label>
              <input
                type="text"
                value={form.trunk_codecs}
                onChange={(e) => setForm({ ...form, trunk_codecs: e.target.value })}
                className="input"
                placeholder="alaw,ulaw"
              />
            </div>

            <div>
              <label className="label">Autenticação</label>
              <select
                value={form.trunk_auth_type}
                onChange={(e) => setForm({ ...form, trunk_auth_type: e.target.value })}
                className="select"
              >
                <option value="ip">Por IP</option>
                <option value="credentials">Usuário/Senha</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            {form.trunk_auth_type !== 'ip' && (
              <>
                <div>
                  <label className="label">Usuário SIP</label>
                  <input
                    type="text"
                    value={form.trunk_username}
                    onChange={(e) => setForm({ ...form, trunk_username: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Senha SIP</label>
                  <input
                    type="password"
                    value={form.trunk_password}
                    onChange={(e) => setForm({ ...form, trunk_password: e.target.value })}
                    className="input"
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Tech Prefix</label>
              <input
                type="text"
                value={form.trunk_tech_prefix}
                onChange={(e) => setForm({ ...form, trunk_tech_prefix: e.target.value })}
                className="input"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="label">Context</label>
              <input
                type="text"
                value={form.trunk_context}
                onChange={(e) => setForm({ ...form, trunk_context: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="label">Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input"
          rows={3}
          placeholder="Notas internas sobre o cliente"
        />
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

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: customersList, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customers.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: customers.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      setIsModalOpen(false)
      setEditingCustomer(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: customers.delete,
    onSuccess: () => queryClient.invalidateQueries(['customers']),
  })

  const handleSubmit = (data) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredCustomers = (customersList || []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    const matchesType = !typeFilter || c.type === typeFilter
    return matchesSearch && matchesType
  })

  const statusLabels = {
    active: { label: 'Ativo', class: 'badge-success' },
    inactive: { label: 'Inativo', class: 'badge-warning' },
    suspended: { label: 'Suspenso', class: 'badge-danger' },
    blocked: { label: 'Bloqueado', class: 'badge-danger' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">Gerencie os clientes do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null)
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="select w-48"
        >
          <option value="">Todos os tipos</option>
          <option value="extension">Ramais</option>
          <option value="trunk">Trunks</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Contato</th>
                <th>Cobrança</th>
                <th>Saldo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${customer.type === 'trunk' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                        {customer.type === 'trunk' ? (
                          <Server className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Users className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.code}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${customer.type === 'trunk' ? 'badge-warning' : 'badge-info'}`}>
                      {customer.type === 'trunk' ? 'Trunk' : 'Ramal'}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {customer.type === 'trunk' && customer.trunk_ip ? (
                        <div className="flex items-center gap-1 text-sm text-gray-400 font-mono">
                          <Server className="w-3 h-3" />
                          {customer.trunk_ip}:{customer.trunk_port || 5060}
                        </div>
                      ) : (
                        <>
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {customer.billing_type === 'postpaid' ? 'Pós-pago' : 'Pré-pago'}
                    </span>
                  </td>
                  <td>
                    <span className={Number(customer.balance) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      R$ {Number(customer.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusLabels[customer.status]?.class || 'badge-info'}`}>
                      {statusLabels[customer.status]?.label || customer.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum cliente encontrado
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCustomer(null)
        }}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingCustomer(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  )
}
