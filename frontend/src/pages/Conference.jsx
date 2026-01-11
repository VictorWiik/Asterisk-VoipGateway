import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  PhoneCall,
  Phone,
  Loader2,
  Users,
  Play,
  RefreshCw
} from 'lucide-react'
import api from '../services/api'

export default function Conference() {
  const [number1, setNumber1] = useState('')
  const [number2, setNumber2] = useState('')
  const [callerid, setCallerid] = useState('Conferencia')
  const [result, setResult] = useState(null)

  const { data: activeConferences, refetch, isLoading: loadingActive } = useQuery({
    queryKey: ['active-conferences'],
    queryFn: () => api.get('/conference/active').then(res => res.data),
    refetchInterval: 5000,
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/conference/create', data),
    onSuccess: (response) => {
      setResult(response.data)
      if (response.data.success) {
        setNumber1('')
        setNumber2('')
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        error: error.response?.data?.detail || 'Erro ao criar conferência'
      })
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setResult(null)
    createMutation.mutate({
      number1: number1.replace(/\D/g, ''),
      number2: number2.replace(/\D/g, ''),
      callerid
    })
  }

  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    return numbers
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Conferência</h1>
        <p className="text-gray-400 mt-1">Conecte dois números em uma chamada</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary-500" />
            Nova Conferência
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Número 1</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={number1}
                  onChange={(e) => setNumber1(formatPhone(e.target.value))}
                  className="input pl-12 font-mono"
                  placeholder="5511999999999"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Formato: código país + DDD + número</p>
            </div>

            <div>
              <label className="label">Número 2</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={number2}
                  onChange={(e) => setNumber2(formatPhone(e.target.value))}
                  className="input pl-12 font-mono"
                  placeholder="5511988888888"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">CallerID (nome exibido)</label>
              <input
                type="text"
                value={callerid}
                onChange={(e) => setCallerid(e.target.value)}
                className="input"
                placeholder="Conferencia"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Iniciar Conferência
                </>
              )}
            </button>
          </form>

          {/* Resultado */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {result.success ? (
                <div>
                  <p className="text-emerald-400 font-medium mb-2">✓ Conferência criada com sucesso!</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>ID: <span className="text-white font-mono">{result.conference_id}</span></p>
                    <p>Número 1: <span className="text-white">{result.number1}</span> → {result.provider1}</p>
                    <p>Número 2: <span className="text-white">{result.number2}</span> → {result.provider2}</p>
                  </div>
                </div>
              ) : (
                <p className="text-red-400">✗ {result.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Conferências Ativas */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Conferências Ativas
            </h2>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loadingActive ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingActive ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : activeConferences && activeConferences.length > 0 ? (
            <div className="space-y-4">
              {activeConferences.map((conf, index) => (
                <div key={index} className="bg-dark-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-primary-400">{conf.conference_id}</span>
                    <span className="badge badge-success">
                      {conf.participants?.length || 0} participantes
                    </span>
                  </div>
                  {conf.participants?.map((p, i) => (
                    <div key={i} className="text-sm text-gray-400">
                      {p.channel} - {p.state}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <PhoneCall className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhuma conferência ativa</p>
            </div>
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="card bg-dark-300/50">
        <h3 className="text-lg font-semibold text-white mb-4">Como funciona</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold mb-2">1</div>
            <p className="text-gray-400">Informe os dois números que deseja conectar (com código do país)</p>
          </div>
          <div>
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold mb-2">2</div>
            <p className="text-gray-400">O sistema irá ligar simultaneamente para ambos os números</p>
          </div>
          <div>
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold mb-2">3</div>
            <p className="text-gray-400">Quando atenderem, serão conectados automaticamente em conferência</p>
          </div>
        </div>
      </div>
    </div>
  )
}
