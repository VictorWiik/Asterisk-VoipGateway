import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  Upload,
  Link,
  Unlink,
  User
} from 'lucide-react'
import api, { dids, providers, customers } from '../services/api'

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

function DIDForm({ did, providersList, gatewaysList, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    number: did?.number || '',
    provider_id: did?.provider_id || '',
    gateway_id: did?.gateway_id || '',
    city: did?.city || '',
    state: did?.state || '',
    country: did?.country || 'Brasil',
    monthly_cost: did?.monthly_cost || 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      provider_id: form.provider_id || null,
      gateway_id: form.gateway_id || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Numero</label>
          <input
            type="text"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="input"
            placeholder="5511999999999"
            required
            disabled={!!did}
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
            {providersList?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Gateway Entrada</label>
          <select
            value={form.gateway_id}
            onChange={(e) => setForm({ ...form, gateway_id: e.target.value })}
            className="select"
            required
          >
            <option value="">Selecione...</option>
            {gatewaysList?.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.ip_address})</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Por qual gateway a chamada entra</p>
        </div>

        <div>
          <label className="label">Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="input"
            placeholder="Sao Paulo"
          />
        </div>

        <div>
          <label className="label">Estado</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="input"
            placeholder="SP"
          />
        </div>

        <div>
          <label className="label">Pais</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Custo Mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.monthly_cost}
            onChange={(e) => setForm({ ...form, monthly_cost: parseFloat(e.target.value) })}
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

function ImportForm({ providersList, gatewaysList, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    numbers: '',
    provider_id: '',
    gateway_id: '',
    city: '',
    state: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const numbers = form.numbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)
    
    onSubmit({
      numbers,
      provider_id: form.provider_id || null,
      gateway_id: form.gateway_id || null,
      city: form.city,
      state: form.state,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Numeros (um por linha)</label>
        <textarea
          value={form.numbers}
          onChange={(e) => setForm({ ...form, numbers: e.target.value })}
          className="input font-mono"
          rows={8}
          placeholder="5511999999999&#10;5511988888888&#10;5511977777777"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Provedor</label>
          <select
            value={form.provider_id}
            onChange={(e) => setForm({ ...form, provider_id: e.target.value })}
            className="select"
          >
            <option value="">Selecione...</option>
            {providersList?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Gateway Entrada</label>
          <select
            value={form.gateway_id}
            onChange={(e) => setForm({ ...form, gateway_id: e.target.value })}
            className="select"
          >
            <option value="">Selecione...</option>
            {gatewaysList?.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Estado</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
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
          Importar
        </button>
      </div>
    </form>
  )
}

function AllocateForm({ did, customersList, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    customer_id: '',
    destination_type: 'extension',
    destination: '',
    monthly_price: 0,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      did_id: did.id,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-300 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400">DID</p>
        <p className="text-xl font-bold text-white">{did.number}</p>
      </div>

      <div>
        <label className="label">Cliente</label>
        <select
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          className="select"
          required
        >
          <option value="">Selecione...</option>
          {customersList?.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Tipo de Destino</label>
        <select
          value={form.destination_type}
          onChange={(e) => setForm({ ...form, destination_type: e.target.value })}
          className="select"
        >
          <option value="extension">Ramal</option>
          <option value="trunk">Trunk (Encaminha para PBX cliente)</option>
          <option value="queue">Fila</option>
          <option value="ivr">URA/IVR</option>
        </select>
      </div>

      <div>
        <label className="label">Destino</label>
        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
          className="input"
          placeholder="1001 ou numero de encaminhamento"
        />
        <p className="text-xs text-gray-500 mt-1">
          Para trunk: deixe vazio para manter o numero original
        </p>
      </div>

      <div>
        <label className="label">Preco Mensal (R$)</label>
        <input
          type="number"
          step="0.01"
          value={form.monthly_price}
          onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) })}
          className="input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Alocar
        </button>
      </div>
    </form>
  )
}

export default function DIDs() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [editingDID, setEditingDID] = useState(null)
  const [allocatingDID, setAllocatingDID] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  // Usa o novo endpoint com alocacao
  const { data: didsList, isLoading } = useQuery({
    queryKey: ['dids-with-allocation', statusFilter],
    queryFn: () => api.get('/dids/with-allocation', { params: { status_filter: statusFilter || undefined } }).then(res => res.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['dids-summary'],
    queryFn: () => dids.summary().then(res => res.data),
  })

  const { data: providersList } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providers.list().then(res => res.data),
  })

  const { data: gatewaysList } = useQuery({
    queryKey: ['gateways'],
    queryFn: () => api.get('/gateways/').then(res => res.data),
  })

  const { data: customersList } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customers.list().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: dids.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      queryClient.invalidateQueries(['dids-summary'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dids.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      setIsModalOpen(false)
      setEditingDID(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: dids.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      queryClient.invalidateQueries(['dids-summary'])
    },
  })

  const importMutation = useMutation({
    mutationFn: dids.import,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      queryClient.invalidateQueries(['dids-summary'])
      setIsImportModalOpen(false)
      alert(`Importados: ${data.data.imported}, Duplicados: ${data.data.duplicated}`)
    },
  })

  const allocateMutation = useMutation({
    mutationFn: ({ id, data }) => dids.allocate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      queryClient.invalidateQueries(['dids-summary'])
      setIsAllocateModalOpen(false)
      setAllocatingDID(null)
    },
  })

  const deallocateMutation = useMutation({
    mutationFn: dids.deallocate,
    onSuccess: () => {
      queryClient.invalidateQueries(['dids-with-allocation'])
      queryClient.invalidateQueries(['dids-summary'])
    },
  })

  const handleSubmit = (data) => {
    if (editingDID) {
      updateMutation.mutate({ id: editingDID.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (did) => {
    setEditingDID(did)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este DID?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAllocate = (did) => {
    setAllocatingDID(did)
    setIsAllocateModalOpen(true)
  }

  const handleDeallocate = (id) => {
    if (confirm('Tem certeza que deseja desalocar este DID?')) {
      deallocateMutation.mutate(id)
    }
  }

  const filteredDIDs = didsList?.filter(d =>
    d.number.includes(search) ||
    (d.city && d.city.toLowerCase().includes(search.toLowerCase())) ||
    (d.customer_name && d.customer_name.toLowerCase().includes(search.toLowerCase()))
  ) || []

  const statusLabels = {
    available: { label: 'Disponivel', class: 'badge-success' },
    allocated: { label: 'Alocado', class: 'badge-info' },
    reserved: { label: 'Reservado', class: 'badge-warning' },
    porting: { label: 'Portando', class: 'badge-warning' },
    inactive: { label: 'Inativo', class: 'badge-danger' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DIDs</h1>
          <p className="text-gray-400 mt-1">Inventario de numeros</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Importar
          </button>
          <button
            onClick={() => {
              setEditingDID(null)
              setIsModalOpen(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo DID
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card py-4">
          <p className="text-2xl font-bold text-white">{summary?.available || 0}</p>
          <p className="text-sm text-gray-400">Disponiveis</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-primary-400">{summary?.allocated || 0}</p>
          <p className="text-sm text-gray-400">Alocados</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-amber-400">{summary?.reserved || 0}</p>
          <p className="text-sm text-gray-400">Reservados</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-violet-400">{summary?.porting || 0}</p>
          <p className="text-sm text-gray-400">Portando</p>
        </div>
        <div className="card py-4">
          <p className="text-2xl font-bold text-red-400">{summary?.inactive || 0}</p>
          <p className="text-sm text-gray-400">Inativos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por numero, cidade ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select w-48"
        >
          <option value="">Todos os status</option>
          <option value="available">Disponiveis</option>
          <option value="allocated">Alocados</option>
          <option value="reserved">Reservados</option>
          <option value="inactive">Inativos</option>
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
                <th>Numero</th>
                <th>Gateway</th>
                <th>Localidade</th>
                <th>Cliente</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredDIDs.map((did) => (
                <tr key={did.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary-400" />
                      </div>
                      <span className="font-mono font-medium text-white">{did.number}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{did.gateway_name || '-'}</span>
                  </td>
                  <td>
                    {did.city && did.state ? `${did.city}/${did.state}` : did.city || did.state || '-'}
                  </td>
                  <td>
                    {did.customer_name ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-sm text-white">{did.customer_name}</p>
                          <p className="text-xs text-gray-500">{did.customer_code}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td>
                    {did.destination ? (
                      <span className="font-mono text-sm text-emerald-400">{did.destination}</span>
                    ) : did.status === 'allocated' ? (
                      <span className="text-xs text-gray-500">Original</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusLabels[did.status]?.class || 'badge-info'}`}>
                      {statusLabels[did.status]?.label || did.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {did.status === 'available' && (
                        <button
                          onClick={() => handleAllocate(did)}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="Alocar"
                        >
                          <Link className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                      {did.status === 'allocated' && (
                        <button
                          onClick={() => handleDeallocate(did.id)}
                          className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
                          title="Desalocar"
                        >
                          <Unlink className="w-4 h-4 text-amber-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(did)}
                        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(did.id)}
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

          {filteredDIDs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum DID encontrado
            </div>
          )}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingDID(null)
        }}
        title={editingDID ? 'Editar DID' : 'Novo DID'}
      >
        <DIDForm
          did={editingDID}
          providersList={providersList}
          gatewaysList={gatewaysList}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingDID(null)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal Importar */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar DIDs"
      >
        <ImportForm
          providersList={providersList}
          gatewaysList={gatewaysList}
          onSubmit={(data) => importMutation.mutate(data)}
          onCancel={() => setIsImportModalOpen(false)}
          loading={importMutation.isPending}
        />
      </Modal>

      {/* Modal Alocar */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => {
          setIsAllocateModalOpen(false)
          setAllocatingDID(null)
        }}
        title="Alocar DID"
      >
        {allocatingDID && (
          <AllocateForm
            did={allocatingDID}
            customersList={customersList}
            onSubmit={(data) => allocateMutation.mutate({ id: allocatingDID.id, data })}
            onCancel={() => {
              setIsAllocateModalOpen(false)
              setAllocatingDID(null)
            }}
            loading={allocateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
