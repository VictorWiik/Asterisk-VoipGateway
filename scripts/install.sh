#!/bin/bash

# ============================================
# ASTERISK ADMIN - SCRIPT DE INSTALAÇÃO
# ============================================

set -e

echo "========================================"
echo "  Asterisk Admin - Instalação"
echo "========================================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor, execute como root${NC}"
  exit 1
fi

# ============================================
# 1. ATUALIZA SISTEMA
# ============================================
echo -e "\n${YELLOW}[1/7] Atualizando sistema...${NC}"
apt update && apt upgrade -y

# ============================================
# 2. INSTALA DEPENDÊNCIAS
# ============================================
echo -e "\n${YELLOW}[2/7] Instalando dependências...${NC}"
apt install -y \
  python3 \
  python3-pip \
  python3-venv \
  postgresql \
  postgresql-contrib \
  nodejs \
  npm \
  nginx \
  git \
  curl

# ============================================
# 3. CONFIGURA POSTGRESQL
# ============================================
echo -e "\n${YELLOW}[3/7] Configurando PostgreSQL...${NC}"

# Inicia PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Cria usuário e banco
sudo -u postgres psql <<EOF
CREATE USER asterisk WITH PASSWORD 'asterisk';
CREATE DATABASE asterisk_admin OWNER asterisk;
GRANT ALL PRIVILEGES ON DATABASE asterisk_admin TO asterisk;
EOF

echo -e "${GREEN}Banco de dados criado!${NC}"

# ============================================
# 4. CONFIGURA BACKEND
# ============================================
echo -e "\n${YELLOW}[4/7] Configurando backend...${NC}"

cd /opt
mkdir -p asterisk-admin
cd asterisk-admin

# Cria ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instala dependências (assumindo que os arquivos já foram copiados)
pip install --upgrade pip
pip install -r backend/requirements.txt

# Cria arquivo .env
cp backend/.env.example backend/.env

# Aplica schema do banco
PGPASSWORD=asterisk psql -U asterisk -d asterisk_admin -f database/schema.sql

echo -e "${GREEN}Backend configurado!${NC}"

# ============================================
# 5. CONFIGURA FRONTEND
# ============================================
echo -e "\n${YELLOW}[5/7] Configurando frontend...${NC}"

cd frontend
npm install
npm run build

echo -e "${GREEN}Frontend compilado!${NC}"

# ============================================
# 6. CONFIGURA NGINX
# ============================================
echo -e "\n${YELLOW}[6/7] Configurando Nginx...${NC}"

cat > /etc/nginx/sites-available/asterisk-admin <<EOF
server {
    listen 80;
    server_name _;

    root /opt/asterisk-admin/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}Nginx configurado!${NC}"

# ============================================
# 7. CRIA SERVIÇO SYSTEMD
# ============================================
echo -e "\n${YELLOW}[7/7] Criando serviço systemd...${NC}"

cat > /etc/systemd/system/asterisk-admin.service <<EOF
[Unit]
Description=Asterisk Admin API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/asterisk-admin/backend
Environment=PATH=/opt/asterisk-admin/venv/bin
ExecStart=/opt/asterisk-admin/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable asterisk-admin
systemctl start asterisk-admin

echo -e "${GREEN}Serviço criado e iniciado!${NC}"

# ============================================
# FINALIZAÇÃO
# ============================================
echo ""
echo "========================================"
echo -e "${GREEN}  Instalação concluída!${NC}"
echo "========================================"
echo ""
echo "Acesse: http://SEU_IP"
echo "Usuário: admin"
echo "Senha: admin123"
echo ""
echo "Comandos úteis:"
echo "  systemctl status asterisk-admin  - Status do backend"
echo "  journalctl -u asterisk-admin -f  - Logs do backend"
echo ""
