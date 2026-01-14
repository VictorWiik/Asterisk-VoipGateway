#!/bin/bash
# ============================================
# TrunkFlow - Script de Instalação
# Sistema de Gerenciamento VoIP
# ============================================

set -e

echo "=========================================="
echo "  TrunkFlow - Instalação Automatizada"
echo "=========================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Execute como root: sudo ./install.sh${NC}"
    exit 1
fi

# Variáveis
INSTALL_DIR="/opt/asterisk-admin"
DB_NAME="asterisk_admin"
DB_USER="asterisk"
DB_PASS=$(openssl rand -base64 12)
ADMIN_PASS="admin123"

echo -e "${YELLOW}[1/8] Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/8] Instalando dependências...${NC}"
apt install -y \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    nginx \
    nodejs npm \
    git curl wget \
    asterisk

echo -e "${YELLOW}[3/8] Configurando PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${YELLOW}[4/8] Clonando repositório...${NC}"
rm -rf $INSTALL_DIR
git clone https://github.com/VictorWiik/Asterisk-VoipGateway.git $INSTALL_DIR
cd $INSTALL_DIR

echo -e "${YELLOW}[5/8] Configurando Backend...${NC}"
cd $INSTALL_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env
cat > .env << ENVEOF
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVEOF

echo -e "${YELLOW}[6/8] Executando migrations...${NC}"
cd $INSTALL_DIR/database
for migration in migration_*.sql; do
    if [ -f "$migration" ]; then
        echo "Executando $migration..."
        sudo -u postgres psql -d $DB_NAME -f "$migration"
    fi
done

# Criar usuário admin
ADMIN_HASH=$(python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('$ADMIN_PASS'))")
sudo -u postgres psql -d $DB_NAME -c "INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES ('admin', 'admin@trunkflow.local', '$ADMIN_HASH', 'Administrador', 'admin', 'active') ON CONFLICT (username) DO NOTHING;"

echo -e "${YELLOW}[7/8] Configurando Frontend...${NC}"
cd $INSTALL_DIR/frontend
npm install
npm run build

echo -e "${YELLOW}[8/8] Configurando serviços...${NC}"

# Serviço systemd
cat > /etc/systemd/system/asterisk-admin.service << SERVICEEOF
[Unit]
Description=TrunkFlow Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment=PATH=$INSTALL_DIR/backend/venv/bin
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Nginx
cat > /etc/nginx/sites-available/asterisk-admin << NGINXEOF
server {
    listen 80;
    server_name _;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
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
NGINXEOF

ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Iniciar serviços
systemctl daemon-reload
systemctl enable asterisk-admin
systemctl start asterisk-admin
systemctl restart nginx

echo ""
echo -e "${GREEN}=========================================="
echo "  Instalação Concluída!"
echo "==========================================${NC}"
echo ""
echo "Acesse: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Credenciais:"
echo "  Usuário: admin"
echo "  Senha: $ADMIN_PASS"
echo ""
echo "Banco de dados:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo -e "${YELLOW}IMPORTANTE: Guarde essas informações!${NC}"
