# Requisitos de Sistema

## Hardware Mínimo
- CPU: 2 vCPUs
- RAM: 2 GB
- Disco: 20 GB SSD
- Rede: 100 Mbps

## Hardware Recomendado
- CPU: 4+ vCPUs
- RAM: 4+ GB
- Disco: 50+ GB SSD NVMe
- Rede: 1 Gbps

## Sistema Operacional
- Debian 12 (Bookworm) - Recomendado
- Ubuntu 22.04 LTS ou superior
- Ubuntu 24.04 LTS

## Software Necessário
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Nginx 1.18+
- Asterisk 20 LTS

## Portas Necessárias
| Porta | Protocolo | Serviço |
|-------|-----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 5060 | UDP/TCP | SIP |
| 5061 | TCP | SIP TLS |
| 8000 | TCP | API (interno) |
| 5432 | TCP | PostgreSQL (interno) |
| 10000-20000 | UDP | RTP |

## Capacidade Estimada
| Configuração | Canais | CPS |
|--------------|--------|-----|
| 2 vCPU / 2GB | 60-80 | 10-15 |
| 4 vCPU / 8GB | 150-180 | 25-30 |
| 8 vCPU / 16GB | 300-400 | 50-60 |
| 16 vCPU / 32GB | 600-800 | 100-120 |
| 32 vCPU / 64GB | 1500-2000 | 150-200 |

*Baseado em codec G711 (alaw/ulaw) sem gravação*
