import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Square,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Clock,
  Server,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  Trash2
} from 'lucide-react'
import api from '../services/api'

// Componente de Status Badge
function StatusBadge({ status }) {
  const styles = {
    trying: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ringing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    answered: 'bg-green-500/20 text-green-400 border-green-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  
  const labels = {
    trying: 'Tentando',
    ringing: 'Tocando',
    answered: 'Atendida',
    ended: 'Finalizada',
    failed: 'Falhou',
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || styles.trying}`}>
      {labels[status] || status}
    </span>
  )
}

// Componente de Mensagem SIP
function SIPMessage({ message, isResponse }) {
  const [expanded, setExpanded] = useState(false)
  
  const getMethodColor = (method) => {
    const colors = {
      INVITE: 'text-green-400',
      ACK: 'text-blue-400',
      BYE: 'text-red-400',
      CANCEL: 'text-orange-400',
      RESPONSE: 'text-purple-400',
    }
    return colors[method] || 'text-gray-400'
  }
  
  return (
    <div className="border border-dark-100 rounded-lg p-3 hover:bg-dark-300/50 transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isResponse ? (
            <ArrowLeft className="w-4 h-4 text-purple-400" />
          ) : (
            <ArrowRight className="w-4 h-4 text-green-400" />
          )}
          <span className={`font-mono font-bold ${getMethodColor(message.method)}`}>
            {message.status_code ? `${message.status_code} ${message.status_text}` : message.method}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 p-3 bg-dark-500 rounded-lg font-mono text-xs overflow-x-auto">
          <pre className="text-gray-300 whitespace-pre-wrap">
            {message.raw_message || `From: ${message.from_uri}\nTo: ${message.to_uri}\nCall-ID: ${message.call_id}`}
          </pre>
        </div>
      )}
    </div>
  )
}

// Componente de Call Flow
function CallFlow({ call }) {
  if (!call) return null
  
  return (
    <div className="space-y-2">
      {call.messages?.map((msg, idx) => (
        <SIPMessage 
          key={idx} 
          message={msg} 
          isResponse={msg.status_code !== null}
        />
      ))}
    </div>
  )
}

// Componente Principal
export default function Debug() {
  const [capturing, setCapturing] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [messages, setMessages] = useState([])
  const [activeCalls, setActiveCalls] = useState([])
  const wsRef = useRef(null)
  
  // Query para status da captura
  const { data: captureStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['capture-status'],
    queryFn: () => api.get('/debug/capture/status').then(res => res.data),
    refetchInterval: 5000,
  })
  
  // Query para problemas detectados
  const { data: problems } = useQuery({
    queryKey: ['debug-problems'],
    queryFn: () => api.get('/debug/problems').then(res => res.data),
    refetchInterval: 10000,
  })
  
  // Query para histórico de chamadas
  const { data: callHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['call-history'],
    queryFn: () => api.get('/debug/call-history?limit=20').then(res => res.data),
  })
  
  // WebSocket para tempo real
  useEffect(() => {
    if (capturing) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/debug/ws/sip-monitor`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'sip_message') {
          setMessages(prev => [...prev.slice(-100), data.data])
        } else if (data.type === 'active_calls') {
          setActiveCalls(data.data)
        }
      }
      
      wsRef.current.onclose = () => {
        setCapturing(false)
      }
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close()
        }
      }
    }
  }, [capturing])
  
  // Iniciar captura
  const startCapture = async () => {
    try {
      await api.post('/debug/capture/start?interface=eth0')
      setCapturing(true)
      refetchStatus()
    } catch (err) {
      console.error('Erro ao iniciar captura:', err)
    }
  }
  
  // Parar captura
  const stopCapture = async () => {
    try {
      await api.post('/debug/capture/stop')
      setCapturing(false)
      if (wsRef.current) {
        wsRef.current.close()
      }
      refetchStatus()
    } catch (err) {
      console.error('Erro ao parar captura:', err)
    }
  }
  
  // Limpar mensagens
  const clearMessages = () => {
    setMessages([])
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Debug Center</h1>
          <p className="text-gray-400 mt-1">Monitor SIP em tempo real e análise de problemas</p>
        </div>
        <div className="flex items-center gap-3">
          {captureStatus?.capturing ? (
            <button 
              onClick={stopCapture}
              className="btn-danger flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Parar Captura
            </button>
          ) : (
            <button 
              onClick={startCapture}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Captura
            </button>
          )}
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              captureStatus?.capturing ? 'bg-green-500/20' : 'bg-gray-500/20'
            }`}>
              {captureStatus?.capturing ? (
                <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-lg font-bold text-white">
                {captureStatus?.capturing ? 'Capturando' : 'Parado'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Chamadas Ativas</p>
              <p className="text-lg font-bold text-white">{captureStatus?.active_calls || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Mensagens</p>
              <p className="text-lg font-bold text-white">{messages.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              problems?.length > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
            }`}>
              {problems?.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Problemas</p>
              <p className="text-lg font-bold text-white">{problems?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Problemas Detectados */}
      {problems?.length > 0 && (
        <div className="card border-red-500/30">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Problemas Detectados
          </h2>
          <div className="space-y-3">
            {problems.map((problem, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${
                  problem.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : problem.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium ${
                      problem.type === 'error' ? 'text-red-400' :
                      problem.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {problem.message}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      💡 {problem.suggestion}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {problem.call_id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Messages */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              Mensagens SIP
              {captureStatus?.capturing && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearMessages}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
                title="Limpar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={refetchHistory}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {messages.length > 0 ? (
              messages.slice(-20).reverse().map((msg, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-dark-300/50 rounded-lg border border-dark-100 hover:border-primary-500/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCall(msg.call_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {msg.status_code ? (
                        <ArrowLeft className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-mono text-sm text-white">
                        {msg.status_code ? `${msg.status_code} ${msg.status_text}` : msg.method}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 font-mono truncate">
                    {msg.from_uri} → {msg.to_uri}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                {captureStatus?.capturing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p>Aguardando mensagens SIP...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <WifiOff className="w-12 h-12 text-gray-600" />
                    <p>Clique em "Iniciar Captura" para começar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Call History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Histórico de Chamadas
          </h2>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {callHistory?.length > 0 ? (
              callHistory.map((call, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedCall === call.call_id 
                      ? 'bg-primary-500/10 border-primary-500/30' 
                      : 'bg-dark-300/50 border-dark-100 hover:border-primary-500/30'
                  }`}
                  onClick={() => setSelectedCall(selectedCall === call.call_id ? null : call.call_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-sm text-white font-mono">
                          {call.from_uri?.split('@')[0]?.replace('<sip:', '')} → {call.to_uri?.split('@')[0]?.replace('<sip:', '')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={call.status} />
                  </div>
                  
                  {selectedCall === call.call_id && (
                    <div className="mt-4 pt-4 border-t border-dark-100">
                      <p className="text-xs text-gray-400 mb-2">Call-ID: {call.call_id}</p>
                      <CallFlow call={call} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>Nenhuma chamada registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
