#!/bin/bash
# ============================================
# TrunkFlow - Script de Instalação
# Sistema de Gerenciamento VoIP
# Versão: 2.2
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║         TrunkFlow - Instalação             ║"
echo "║      Sistema de Gerenciamento VoIP         ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Execute como root: sudo ./install.sh${NC}"
    exit 1
fi

# Variáveis
INSTALL_DIR="/opt/asterisk-admin"
DB_NAME="asterisk_admin"
DB_USER="asterisk"
DB_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_PASS="admin123"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "${YELLOW}[1/11] Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/11] Instalando dependências...${NC}"
apt install -y \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    nginx \
    nodejs npm \
    git curl wget \
    asterisk \
    sngrep \
    tcpdump

echo -e "${YELLOW}[3/11] Configurando PostgreSQL...${NC}"
systemctl enable postgresql
systemctl start postgresql
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo -e "${YELLOW}[4/11] Clonando repositório...${NC}"
rm -rf $INSTALL_DIR
git clone https://github.com/VictorWiik/Asterisk-VoipGateway.git $INSTALL_DIR
cd $INSTALL_DIR

echo -e "${YELLOW}[5/11] Configurando Backend...${NC}"
cd $INSTALL_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cat > .env << ENVEOF
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVEOF

echo -e "${YELLOW}[6/11] Executando migrations...${NC}"
cd $INSTALL_DIR/database
for migration in migration_*.sql; do
    if [ -f "$migration" ]; then
        echo "  Executando $migration..."
        sudo -u postgres psql -d $DB_NAME -f "$migration" 2>/dev/null || true
    fi
done

# Criar usuário admin
ADMIN_HASH=$(python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('$ADMIN_PASS'))")
sudo -u postgres psql -d $DB_NAME -c "
INSERT INTO users (id, username, email, password_hash, full_name, role, status)
VALUES (uuid_generate_v4(), 'admin', 'admin@trunkflow.local', '$ADMIN_HASH', 'Administrador', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;
"

echo -e "${YELLOW}[7/11] Configurando Frontend...${NC}"
cd $INSTALL_DIR/frontend
npm install
npm run build

echo -e "${YELLOW}[8/11] Configurando Asterisk...${NC}"
# Configurar PJSIP com NAT
cat > /etc/asterisk/pjsip.conf << PJSIPEOF
[global]
type=global
user_agent=TrunkFlow PBX

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
external_media_address=$SERVER_IP
external_signaling_address=$SERVER_IP
local_net=10.0.0.0/8
local_net=172.16.0.0/12
local_net=192.168.0.0/16
local_net=127.0.0.1/32

#include pjsip_providers.conf
#include pjsip_customer_trunks.conf
#include pjsip_gateways.conf
#include pjsip_extensions.conf
PJSIPEOF

# Criar arquivos vazios
touch /etc/asterisk/pjsip_providers.conf
touch /etc/asterisk/pjsip_customer_trunks.conf
touch /etc/asterisk/pjsip_gateways.conf
touch /etc/asterisk/pjsip_extensions.conf

# Configurar RTP
cat > /etc/asterisk/rtp.conf << RTPEOF
[general]
rtpstart=10000
rtpend=20000
RTPEOF

# Configurar CDR PostgreSQL
cat > /etc/asterisk/cdr_pgsql.conf << CDREOF
[global]
hostname=127.0.0.1
port=5432
dbname=$DB_NAME
user=$DB_USER
password=$DB_PASS
table=cdr
encoding=UTF8
timezone=UTC
CDREOF

# Permissões
chown -R asterisk:asterisk /etc/asterisk/

echo -e "${YELLOW}[9/11] Configurando serviços systemd...${NC}"
cat > /etc/systemd/system/asterisk-admin.service << SERVICEEOF
[Unit]
Description=TrunkFlow Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment=PATH=$INSTALL_DIR/backend/venv/bin
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICEEOF

cat > /etc/nginx/sites-available/asterisk-admin << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /opt/asterisk-admin/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/debug/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo -e "${YELLOW}[10/11] Iniciando serviços...${NC}"
systemctl daemon-reload
systemctl enable asterisk-admin
systemctl enable asterisk
systemctl enable nginx
systemctl start postgresql
systemctl start asterisk
systemctl start asterisk-admin
systemctl restart nginx

# Carregar módulo CDR PostgreSQL
sleep 2
asterisk -rx "module load cdr_pgsql.so" 2>/dev/null || true

echo -e "${YELLOW}[11/11] Finalizando...${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Instalação Concluída com Sucesso!     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Acesse o painel:${NC} http://$SERVER_IP"
echo ""
echo -e "${YELLOW}Credenciais de acesso:${NC}"
echo "  Usuário: admin"
echo "  Senha:   $ADMIN_PASS"
echo ""
echo -e "${YELLOW}Banco de dados:${NC}"
echo "  Host:     localhost"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo -e "${RED}IMPORTANTE: Guarde essas informações em local seguro!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Acesse o painel e altere a senha do admin"
echo "  2. Configure os provedores SIP"
echo "  3. Crie os gateways e rotas"
echo "  4. Adicione os clientes e ramais"
echo ""
