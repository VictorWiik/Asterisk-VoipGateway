# 🚀 Asterisk Admin - VoIP Gateway Management

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-Proprietary-red.svg" alt="License">
  <img src="https://img.shields.io/badge/asterisk-20-orange.svg" alt="Asterisk">
  <img src="https://img.shields.io/badge/python-3.11+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/react-18+-61DAFB.svg" alt="React">
</p>

Sistema completo de gerenciamento VoIP para centrais Asterisk. Gerencie clientes, DIDs, provedores, gateways, rotas, ramais e tarifas através de uma interface web moderna.

![Dashboard](docs/images/dashboard.png)

## ✨ Funcionalidades

- 📊 **Dashboard** - Métricas em tempo real
- 👥 **Clientes** - Gerenciamento de clientes Trunk e Ramal
- 📞 **DIDs** - Inventário com alocação automática
- 🏢 **Provedores** - Cadastro de operadoras (Fixo, Móvel, LDI)
- 🔌 **Gateways** - Configuração SIP completa
- 🛤️ **Rotas** - Roteamento de saída com prioridade
- 📱 **Ramais** - Extensões para clientes
- 💰 **Tarifas** - Precificação com margem
- 📈 **Relatórios** - CDR e análises
- 🔄 **Sync Automático** - Integração com Asterisk

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│  React SPA  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   FastAPI   │
                   │   Backend   │
                   └──────┬──────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ PostgreSQL  │   │  Asterisk   │   │Config Files │
└─────────────┘   └─────────────┘   └─────────────┘
```

## 🛠️ Stack Tecnológico

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web async
- **SQLAlchemy 2.0** - ORM async
- **PostgreSQL** - Banco de dados
- **Pydantic** - Validação de dados
- **JWT** - Autenticação

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Query** - State management
- **Axios** - HTTP client
- **Lucide** - Ícones

### Infraestrutura
- **Debian 12 / Ubuntu 24**
- **Nginx** - Proxy reverso
- **Asterisk 20** - PBX (PJSIP)
- **Systemd** - Serviços

## 📋 Requisitos

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPUs | 4+ vCPUs |
| RAM | 2 GB | 4+ GB |
| Disco | 20 GB SSD | 50+ GB SSD |
| SO | Debian 12 / Ubuntu 22.04 | Debian 12 |

## 🚀 Instalação Rápida

### Opção 1: Script Automatizado (Recomendado)

```bash
# Download do repositório
git clone https://github.com/SEU_USUARIO/Asterisk-VoipGateway.git
cd Asterisk-VoipGateway

# Executar instalador
chmod +x install.sh
sudo ./install.sh
```

### Opção 2: Instalação Manual

```bash
# 1. Instalar dependências
apt-get update
apt-get install -y postgresql nginx python3 python3-pip python3-venv nodejs npm

# 2. Criar banco de dados
sudo -u postgres createuser asterisk
sudo -u postgres createdb -O asterisk asterisk_admin

# 3. Configurar backend
cd /opt/asterisk-admin/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configurar frontend
cd /opt/asterisk-admin/frontend
npm install
npm run build

# 5. Iniciar serviços
systemctl start asterisk-admin
systemctl start nginx
```

## 📁 Estrutura do Projeto

```
asterisk-admin/
├── backend/
│   ├── app/
│   │   ├── api/           # Endpoints REST
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Asterisk service
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Páginas
│   │   ├── services/      # API client
│   │   └── styles/        # CSS
│   └── package.json
├── database/
│   ├── schema.sql         # Schema principal
│   └── migration_*.sql    # Migrações
├── docs/
│   └── images/
├── install.sh             # Instalador
└── README.md
```

## ⚙️ Configuração

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://asterisk:senha@localhost/asterisk_admin
SECRET_KEY=sua-chave-secreta
ASTERISK_CONFIG_PATH=/etc/asterisk
```

### Nginx

```nginx
server {
    listen 80;
    
    location / {
        root /opt/asterisk-admin/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

## 📡 Integração Asterisk

O sistema gera automaticamente os seguintes arquivos:

| Arquivo | Módulo | Descrição |
|---------|--------|-----------|
| `pjsip_gateways.conf` | Gateways | Endpoints SIP |
| `pjsip_customer_trunks.conf` | Clientes | Trunks de clientes |
| `pjsip_extensions.conf` | Ramais | Extensões |
| `extensions_routes.conf` | Rotas | Dialplan saída |
| `extensions_dids.conf` | DIDs | Dialplan entrada |

## 🔧 Comandos Úteis

```bash
# Status dos serviços
systemctl status asterisk-admin
systemctl status asterisk

# Logs do backend
journalctl -u asterisk-admin -f

# Asterisk CLI
asterisk -rvvv

# PJSIP endpoints
asterisk -rx "pjsip show endpoints"

# Reload configs
asterisk -rx "pjsip reload"
asterisk -rx "dialplan reload"
```

## 📊 Capacidade Estimada

| Servidor | Canais Simultâneos | CPS |
|----------|-------------------|-----|
| 2 vCPU / 2GB | 60-80 | 10-15 |
| 4 vCPU / 8GB | 150-180 | 25-30 |
| 8 vCPU / 16GB | 300-400 | 50-60 |

*Baseado em codec G711 (alaw/ulaw) sem gravação*

## 🔐 Segurança

- Senhas com hash bcrypt
- Autenticação JWT
- Validação com Pydantic
- Queries parametrizadas
- CORS configurado

### Recomendações

- Configurar HTTPS/SSL
- Usar firewall (iptables/ufw)
- Habilitar fail2ban
- Backups regulares

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| 500 Internal Server Error | `journalctl -u asterisk-admin -n 50` |
| Tela branca | Console do browser (F12) |
| Gateway não aparece | Verificar `pjsip_gateways.conf` |
| Ramal não registra | Verificar senha e reload pjsip |

## 📄 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Autenticação |
| GET | `/api/v1/dashboard/stats` | Estatísticas |
| GET/POST | `/api/v1/customers/` | Clientes |
| GET/POST | `/api/v1/dids/` | DIDs |
| GET/POST | `/api/v1/gateways/` | Gateways |
| GET/POST | `/api/v1/routes/` | Rotas |
| GET/POST | `/api/v1/extensions/` | Ramais |
| GET | `/api/v1/reports/cdr` | Relatório CDR |

## 📝 Changelog

### v1.0.0 (2026-01-11)
- Release inicial
- Dashboard com métricas
- CRUD completo de entidades
- Sincronização automática com Asterisk
- Relatórios CDR e DIDs

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📜 Licença

Este projeto é proprietário. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📧 Suporte

- 📫 Email: suporte@exemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/SEU_USUARIO/Asterisk-VoipGateway/issues)

---

<p align="center">
  Feito com ❤️ para a comunidade VoIP
</p>
