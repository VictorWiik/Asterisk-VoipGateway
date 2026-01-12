import { ExternalLink, Code, Key, Book, Webhook, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function Integrations() {
  const [copied, setCopied] = useState(null)
  
  const apiBaseUrl = window.location.origin + '/api/v1'
  const swaggerUrl = 'https://app.swaggerhub.com/apis/azuton/trunkflow-api/1.0.0'
  
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const endpoints = [
    { method: 'POST', path: '/auth/login', desc: 'Autenticação - obter token JWT' },
    { method: 'GET', path: '/customers/', desc: 'Listar clientes' },
    { method: 'POST', path: '/customers/', desc: 'Criar cliente' },
    { method: 'GET', path: '/dids/', desc: 'Listar DIDs' },
    { method: 'POST', path: '/dids/{id}/allocate', desc: 'Alocar DID a cliente' },
    { method: 'GET', path: '/gateways/', desc: 'Listar gateways' },
    { method: 'GET', path: '/routes/', desc: 'Listar rotas' },
    { method: 'GET', path: '/extensions/', desc: 'Listar ramais' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 mt-1">Conecte seus sistemas ao TrunkFlow via API REST</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documentação Swagger */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Documentação da API</h3>
              <p className="text-sm text-gray-400">Swagger / OpenAPI 3.0</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Acesse a documentação completa da API com todos os endpoints, schemas e exemplos de uso.
          </p>
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Swagger
          </a>
        </div>

        {/* Base URL */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Webhook className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Base URL da API</h3>
              <p className="text-sm text-gray-400">Endpoint principal</p>
            </div>
          </div>
          <div className="bg-dark-300 rounded-lg p-3 flex items-center justify-between">
            <code className="text-primary-400 text-sm">{apiBaseUrl}</code>
            <button
              onClick={() => copyToClipboard(apiBaseUrl, 'baseurl')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {copied === 'baseurl' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Autenticação */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Autenticação</h3>
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          A API usa autenticação JWT (Bearer Token). Primeiro faça login para obter o token:
        </p>

        <div className="bg-dark-300 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Request</span>
            <button
              onClick={() => copyToClipboard(`curl -X POST ${apiBaseUrl}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "sua_senha"}'`, 'auth')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {copied === 'auth' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${apiBaseUrl}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "sua_senha"}'`}
          </pre>
        </div>

        <div className="bg-dark-300 rounded-lg p-4">
          <span className="text-xs text-gray-500">Response</span>
          <pre className="text-sm text-emerald-400 mt-2">
{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}`}
          </pre>
        </div>

        <p className="text-gray-400 text-sm mt-4">
          Use o token no header de todas as requisições: <code className="text-primary-400">Authorization: Bearer {'{token}'}</code>
        </p>
      </div>

      {/* Endpoints principais */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <Code className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Endpoints Principais</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Método</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Endpoint</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i} className="border-b border-dark-100/50 hover:bg-dark-300/30">
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                      ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                      ep.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm text-gray-300">{ep.path}</code>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-100">
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center gap-1"
          >
            Ver todos os endpoints no Swagger
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Exemplo completo */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Exemplo: Criar cliente e alocar DID</h3>
        
        <div className="bg-dark-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Python</span>
            <button
              onClick={() => copyToClipboard(`import requests

BASE_URL = "${apiBaseUrl}"

# 1. Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "sua_senha"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Criar cliente
customer = requests.post(f"{BASE_URL}/customers/", headers=headers, json={
    "code": "CLI001",
    "name": "Novo Cliente",
    "type": "trunk",
    "trunk_ip": "10.0.0.1"
}).json()

# 3. Listar DIDs disponíveis
dids = requests.get(f"{BASE_URL}/dids/?status=available", headers=headers).json()

# 4. Alocar DID ao cliente
requests.post(f"{BASE_URL}/dids/{dids[0]['id']}/allocate", headers=headers, json={
    "customer_id": customer["id"],
    "destination": "1001"
})

print("Cliente criado e DID alocado!")`, 'python')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {copied === 'python' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`import requests

BASE_URL = "${apiBaseUrl}"

# 1. Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "sua_senha"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Criar cliente
customer = requests.post(f"{BASE_URL}/customers/", headers=headers, json={
    "code": "CLI001",
    "name": "Novo Cliente",
    "type": "trunk",
    "trunk_ip": "10.0.0.1"
}).json()

# 3. Listar DIDs disponíveis
dids = requests.get(f"{BASE_URL}/dids/?status=available", headers=headers).json()

# 4. Alocar DID ao cliente
requests.post(f"{BASE_URL}/dids/{dids[0]['id']}/allocate", headers=headers, json={
    "customer_id": customer["id"],
    "destination": "1001"
})

print("Cliente criado e DID alocado!")`}
          </pre>
        </div>
      </div>
    </div>
  )
}
