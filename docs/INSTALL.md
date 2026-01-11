# Guia de Instalação

## Instalação Rápida (Automatizada)

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/Asterisk-VoipGateway.git
cd Asterisk-VoipGateway

# 2. Execute o instalador como root
chmod +x install.sh
sudo ./install.sh

# 3. Selecione "Instalação Completa"

# 4. Aguarde a instalação (10-30 minutos)

# 5. Acesse o painel
# URL: http://SEU_IP
# Usuário: admin
# Senha: admin123 (altere após login)
```

## Instalação Manual

### 1. Preparar Sistema

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git gnupg2
```

### 2. Instalar PostgreSQL

```bash
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql << EOF
CREATE USER asterisk WITH PASSWORD 'sua_senha';
CREATE DATABASE asterisk_admin OWNER asterisk;
GRANT ALL PRIVILEGES ON DATABASE asterisk_admin TO asterisk;
EOF
```

### 3. Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 4. Instalar Nginx

```bash
apt-get install -y nginx
systemctl enable nginx
```

### 5. Instalar Asterisk

```bash
# Dependências
apt-get install -y build-essential libncurses5-dev libjansson-dev \
    libxml2-dev libsqlite3-dev uuid-dev libspeex-dev libedit-dev

# Download e compilação
cd /usr/src
wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
tar xzf asterisk-20-current.tar.gz
cd asterisk-20*/
contrib/scripts/install_prereq install
./configure --with-pjproject-bundled
make -j$(nproc)
make install
make samples
make config
```

### 6. Instalar Aplicação

```bash
# Copiar arquivos
mkdir -p /opt/asterisk-admin
cp -r * /opt/asterisk-admin/

# Backend
cd /opt/asterisk-admin/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install bcrypt==4.0.1

# Configurar .env
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://asterisk:sua_senha@localhost/asterisk_admin
SECRET_KEY=$(openssl rand -base64 32)
ASTERISK_CONFIG_PATH=/etc/asterisk
EOF

# Frontend
cd /opt/asterisk-admin/frontend
npm install
npm run build
```

### 7. Configurar Nginx

```bash
cat > /etc/nginx/sites-available/asterisk-admin << 'EOF'
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
EOF

ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### 8. Criar Serviço

```bash
cat > /etc/systemd/system/asterisk-admin.service << 'EOF'
[Unit]
Description=Asterisk Admin API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/asterisk-admin/backend
ExecStart=/opt/asterisk-admin/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable asterisk-admin
systemctl start asterisk-admin
```

### 9. Executar Migrações

```bash
cd /opt/asterisk-admin/database
PGPASSWORD=sua_senha psql -U asterisk -h localhost -d asterisk_admin -f schema.sql
PGPASSWORD=sua_senha psql -U asterisk -h localhost -d asterisk_admin -f migration_001_customer_trunk.sql
PGPASSWORD=sua_senha psql -U asterisk -h localhost -d asterisk_admin -f migration_002_tariffs.sql
PGPASSWORD=sua_senha psql -U asterisk -h localhost -d asterisk_admin -f migration_003_gateway_sip_fields.sql
PGPASSWORD=sua_senha psql -U asterisk -h localhost -d asterisk_admin -f migration_004_did_gateway.sql
```

## Verificação

```bash
# Verificar serviços
systemctl status asterisk-admin
systemctl status asterisk
systemctl status nginx
systemctl status postgresql

# Testar API
curl http://localhost:8000/api/v1/health
```

## Primeiro Acesso

1. Abra o navegador
2. Acesse: `http://SEU_IP`
3. Login: `admin` / `admin123`
4. **IMPORTANTE**: Altere a senha em Configurações
