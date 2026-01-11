import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Settings as SettingsIcon,
  Key,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.post('/auth/change-password', data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Erro ao alterar senha' 
      })
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' })
      return
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie suas configurações de conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alterar Senha */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-500" />
            Alterar Senha
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="Digite sua senha atual"
                required
              />
            </div>

            <div>
              <label className="label">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Digite a nova senha"
                required
              />
            </div>

            <div>
              <label className="label">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirme a nova senha"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Alterar Senha
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info do Sistema */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            Informações do Sistema
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-dark-100">
              <span className="text-gray-400">Versão</span>
              <span className="text-white font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between py-3 border-b border-dark-100">
              <span className="text-gray-400">Sistema</span>
              <span className="text-white">Asterisk Admin</span>
            </div>
            <div className="flex justify-between py-3 border-b border-dark-100">
              <span className="text-gray-400">Backend</span>
              <span className="text-white">FastAPI + PostgreSQL</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-400">Asterisk</span>
              <span className="text-white">20 LTS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
