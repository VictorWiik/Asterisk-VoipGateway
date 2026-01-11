# 🚀 TrunkFlow - VoIP Gateway Management

<p align="center">
  <img src="docs/images/logo.png" alt="TrunkFlow Logo" width="300">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-Proprietary-red.svg" alt="License">
  <img src="https://img.shields.io/badge/asterisk-20-orange.svg" alt="Asterisk">
  <img src="https://img.shields.io/badge/python-3.11+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/react-18+-61DAFB.svg" alt="React">
</p>

<p align="center">
  <strong>Sistema completo de gerenciamento VoIP para centrais Asterisk</strong>
</p>

---

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
- 🔄 **Sync Automático** - Integração direta com Asterisk

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

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL |
| **Frontend** | React 18, Vite, TailwindCSS, React Query |
| **Infra** | Debian 12, Nginx, Asterisk 20, Systemd |

## 📋 Requisitos

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPUs | 4+ vCPUs |
| RAM | 2 GB | 4+ GB |
| Disco | 20 GB SSD | 50+ GB SSD |
| SO | Debian 12 / Ubuntu 22.04 | Debian 12 |

## 🚀 Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/VictorWiik/Asterisk-VoipGateway.git
cd Asterisk-VoipGateway

# Execute o instalador
chmod +x install.sh
sudo ./install.sh
```

O script oferece instalação completa (PostgreSQL, Nginx, Asterisk) ou apenas a aplicação.

## 📁 Estrutura do Projeto

```
trunkflow/
├── backend/           # API FastAPI
├── frontend/          # React SPA
├── database/          # Schema e migrações
├── docs/              # Documentação
├── install.sh         # Instalador automático
└── README.md
```

## 📡 Integração Asterisk

O sistema gera automaticamente:

| Arquivo | Descrição |
|---------|-----------|
| `pjsip_gateways.conf` | Endpoints SIP dos gateways |
| `pjsip_customer_trunks.conf` | Trunks de clientes |
| `pjsip_extensions.conf` | Ramais |
| `extensions_routes.conf` | Dialplan de saída |
| `extensions_dids.conf` | Dialplan de entrada |

## 🔧 Comandos Úteis

```bash
# Status dos serviços
systemctl status trunkflow
systemctl status asterisk

# Logs
journalctl -u trunkflow -f

# Asterisk CLI
asterisk -rx "pjsip show endpoints"
```

## 📊 Capacidade Estimada

| Servidor | Canais | CPS |
|----------|--------|-----|
| 2 vCPU / 2GB | 60-80 | 10-15 |
| 4 vCPU / 8GB | 150-180 | 25-30 |
| 8 vCPU / 16GB | 300-400 | 50-60 |

*Codec G711 (alaw/ulaw) sem gravação*

## 📄 Documentação

- [Guia de Instalação](docs/AsteriskAdmin_Guia_Instalacao.pdf)
- [Documentação Técnica](docs/AsteriskAdmin_Documentacao_Tecnica.pdf)

## 📜 Licença

Este projeto é proprietário. Veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>TrunkFlow</strong> - VoIP Management<br>
  Feito com ❤️ para profissionais de telecomunicações
</p>
