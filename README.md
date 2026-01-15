# Asterisk Admin

Sistema de gerenciamento de operadora VoIP com interface web moderna.

## 🚀 Funcionalidades

- **Dashboard** - Visão geral do sistema com gráficos e estatísticas
- **Provedores** - Gerenciamento de provedores SIP (Fixo, Móvel, LDI)
- **Gateways** - Configuração de troncos SIP
- **DIDs** - Inventário de números com alocação para clientes
- **Clientes** - Cadastro e gestão de clientes
- **Ramais** - Criação de ramais com autenticação IP ou senha
- **Rotas** - Configuração de rotas de saída
- **Relatórios** - CDR e consumo por cliente/rota

## 🛠 Tecnologias

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL
- SQLAlchemy (async)
- Pydantic

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Query
- Recharts

## 📦 Instalação

### Pré-requisitos
- Debian 12 ou Ubuntu 22.04+
- PostgreSQL 14+
- Node.js 18+
- Python 3.11+

### Instalação rápida

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/asterisk-admin.git
cd asterisk-admin

# Execute o script de instalação
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

### Instalação manual

#### 1. Banco de dados
```bash
sudo -u postgres psql
CREATE USER asterisk WITH PASSWORD 'asterisk';
CREATE DATABASE asterisk_admin OWNER asterisk;
\q

# Aplica schema
psql -U asterisk -d asterisk_admin -f database/schema.sql
```

#### 2. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configura variáveis
cp .env.example .env
nano .env

# Inicia
uvicorn app.main:app --reload
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Acesso padrão

- **URL**: http://localhost:3000
- **Usuário**: admin
- **Senha**: admin123

⚠️ **Troque a senha em produção!**

## 📁 Estrutura do projeto

```
asterisk-admin/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints da API
│   │   ├── core/         # Configurações e segurança
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic
│   │   └── services/     # Serviços (Asterisk, etc)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── services/     # Serviços de API
│   │   └── styles/       # CSS
│   └── package.json
├── database/
│   └── schema.sql        # Schema do banco
└── scripts/
    └── install.sh        # Script de instalação
```

## 🔧 Configuração

### Variáveis de ambiente (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://asterisk:asterisk@localhost:5432/asterisk_admin

# Security
SECRET_KEY=sua-chave-secreta-aqui

# Asterisk
AMI_HOST=127.0.0.1
AMI_PORT=5038
AMI_USERNAME=admin
AMI_SECRET=admin

ASTERISK_CONFIG_PATH=/etc/asterisk
ASTERISK_SPOOL_PATH=/var/spool/asterisk/outgoing
```

## 📡 API

A documentação da API está disponível em:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/v1/auth/login | Autenticação |
| GET | /api/v1/dashboard/stats | Estatísticas |
| GET | /api/v1/providers | Lista provedores |
| GET | /api/v1/customers | Lista clientes |
| GET | /api/v1/dids | Lista DIDs |

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
