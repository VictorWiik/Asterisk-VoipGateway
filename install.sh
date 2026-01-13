#!/bin/bash
#
# ============================================================
# TRUNKFLOW - SCRIPT DE INSTALAÇÃO AUTOMATIZADA
# ============================================================
# Versão: 1.1.0
# Compatível: Debian 12 / Ubuntu 22.04+
# ============================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variáveis de configuração
INSTALL_DIR="/opt/asterisk-admin"
DB_NAME="asterisk_admin"
DB_USER="asterisk"
DB_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)
ADMIN_PASS="admin123"
SECRET_KEY=$(openssl rand -base64 32)

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              ████████╗██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗  ║"
    echo "║              ╚══██╔══╝██╔══██╗██║   ██║████╗  ██║██║ ██╔╝  ║"
    echo "║                 ██║   ██████╔╝██║   ██║██╔██╗ ██║█████╔╝   ║"
    echo "║                 ██║   ██╔══██╗██║   ██║██║╚██╗██║██╔═██╗   ║"
    echo "║                 ██║   ██║  ██║╚██████╔╝██║ ╚████║██║  ██╗  ║"
    echo "║                 ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝  ║"
    echo "║                        FLOW                                ║"
    echo "║                   VoIP Management                          ║"
    echo "║                     Versão 1.1.0                           ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "Sistema operacional não suportado"
        exit 1
    fi
    log_info "Sistema detectado: $OS $VER"
    if [[ "$ID" != "debian" && "$ID" != "ubuntu" ]]; then
        log_error "Este script suporta apenas Debian e Ubuntu"
        exit 1
    fi
}

update_system() {
    log_info "Atualizando sistema..."
    apt-get update -qq
    apt-get upgrade -y -qq
    log_success "Sistema atualizado"
}

install_dependencies() {
    log_info "Instalando dependências do sistema..."
    apt-get install -y -qq \
        curl wget git gnupg2 lsb-release ca-certificates \
        apt-transport-https software-properties-common \
        build-essential libssl-dev libffi-dev \
        python3 python3-pip python3-venv python3-dev \
        openssl sudo fail2ban iptables-persistent
    log_success "Dependências instaladas"
}

install_nodejs() {
    log_info "Instalando Node.js 18..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y -qq nodejs
    fi
    log_success "Node.js $(node -v) instalado"
}

install_postgresql() {
    log_info "Instalando PostgreSQL..."
    apt-get install -y -qq postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql

    log_info "Configurando banco de dados..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

    log_success "PostgreSQL instalado e configurado"
}

install_nginx() {
    log_info "Instalando Nginx..."
    apt-get install -y -qq nginx
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx instalado"
}

install_asterisk() {
    log_info "Instalando Asterisk..."
    if command -v asterisk &> /dev/null; then
        log_warning "Asterisk já está instalado"
        return
    fi

    apt-get install -y -qq \
        libncurses5-dev libjansson-dev libxml2-dev libsqlite3-dev \
        uuid-dev libspeex-dev libspeexdsp-dev libogg-dev libvorbis-dev \
        libasound2-dev portaudio19-dev libcurl4-openssl-dev libical-dev \
        libneon27-dev libsrtp2-dev unixodbc-dev freetds-dev libedit-dev libpq-dev

    cd /usr/src
    if [ ! -f asterisk-20-current.tar.gz ]; then
        wget -q https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
    fi
    tar xzf asterisk-20-current.tar.gz
    cd asterisk-20*/

    contrib/scripts/get_mp3_source.sh 2>/dev/null || true
    contrib/scripts/install_prereq install

    ./configure --with-pjproject-bundled --with-jansson-bundled

    make menuselect.makeopts
    menuselect/menuselect \
        --enable codec_opus \
        --enable res_pjsip \
        --enable res_pjsip_session \
        --enable res_pjsip_registrar \
        --enable res_pjsip_authenticator_digest \
        --enable res_pjsip_endpoint_identifier_ip \
        --enable res_pjsip_endpoint_identifier_user \
        --enable cdr_pgsql \
        --enable res_config_pgsql \
        menuselect.makeopts

    make -j$(nproc)
    make install
    make samples
    make config

    useradd -r -s /bin/false asterisk 2>/dev/null || true
    chown -R asterisk:asterisk /var/lib/asterisk
    chown -R asterisk:asterisk /var/log/asterisk
    chown -R asterisk:asterisk /var/spool/asterisk
    chown -R asterisk:asterisk /etc/asterisk

    log_success "Asterisk instalado"
}

configure_asterisk() {
    log_info "Configurando Asterisk..."

    # PJSIP
    cat > /etc/asterisk/pjsip.conf << 'PJSIPEOF'
[global]
type=global
user_agent=TrunkFlow PBX

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

[transport-tcp]
type=transport
protocol=tcp
bind=0.0.0.0:5060

#include pjsip_gateways.conf
#include pjsip_customer_trunks.conf
#include pjsip_extensions.conf
PJSIPEOF

    # Dialplan
    cat > /etc/asterisk/extensions.conf << 'DIALPLANEOF'
[general]
static=yes
writeprotect=no
clearglobalvars=no

[globals]

#include extensions_routes.conf
#include extensions_dids.conf

[from-internal]
exten => _1XXX,1,NoOp(Chamada interna para ${EXTEN})
 same => n,Dial(PJSIP/${EXTEN},60,tT)
 same => n,Hangup()

[from-trunk]
exten => _X.,1,NoOp(Chamada de entrada: ${EXTEN})
 same => n,Goto(dids,${EXTEN},1)
 same => n,Hangup()

[dids]
exten => _X.,1,NoOp(DID nao configurado: ${EXTEN})
 same => n,Playback(invalid)
 same => n,Hangup()
DIALPLANEOF

    # AMI (Asterisk Manager Interface)
    cat > /etc/asterisk/manager.conf << 'AMIEOF'
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1

[admin]
secret = admin123
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.0
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
AMIEOF

    # Criar arquivos vazios
    touch /etc/asterisk/pjsip_gateways.conf
    touch /etc/asterisk/pjsip_customer_trunks.conf
    touch /etc/asterisk/pjsip_extensions.conf
    touch /etc/asterisk/extensions_routes.conf
    touch /etc/asterisk/extensions_dids.conf

    mkdir -p /etc/asterisk/backups

    # CDR PostgreSQL
    cat > /etc/asterisk/cdr_pgsql.conf << CDRSQLEOF
[global]
hostname=localhost
port=5432
dbname=$DB_NAME
user=$DB_USER
password=$DB_PASS
table=cdr
encoding=UTF8
CDRSQLEOF

    chown -R asterisk:asterisk /etc/asterisk/
    chmod 640 /etc/asterisk/cdr_pgsql.conf
    chmod 640 /etc/asterisk/manager.conf

    systemctl restart asterisk 2>/dev/null || systemctl start asterisk
    systemctl enable asterisk

    log_success "Asterisk configurado"
}

install_application() {
    log_info "Instalando aplicação TrunkFlow..."
    mkdir -p $INSTALL_DIR

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [ -d "$SCRIPT_DIR/backend" ]; then
        cp -r "$SCRIPT_DIR/backend" $INSTALL_DIR/
        cp -r "$SCRIPT_DIR/frontend" $INSTALL_DIR/
        cp -r "$SCRIPT_DIR/database" $INSTALL_DIR/ 2>/dev/null || mkdir -p $INSTALL_DIR/database
    else
        log_error "Arquivos da aplicação não encontrados"
        exit 1
    fi
    log_success "Arquivos copiados"
}

setup_backend() {
    log_info "Configurando Backend..."
    cd $INSTALL_DIR/backend

    python3 -m venv venv
    source venv/bin/activate

    pip install --upgrade pip
    pip install -r requirements.txt
    pip install bcrypt==4.0.1

    cat > .env << ENVEOF
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$SECRET_KEY
ASTERISK_CONFIG_PATH=/etc/asterisk
ASTERISK_SPOOL_PATH=/var/spool/asterisk/outgoing
ENVEOF

    deactivate
    log_success "Backend configurado"
}

setup_database() {
    log_info "Configurando banco de dados..."

    # Schema principal
    sudo -u postgres psql -d $DB_NAME -f $INSTALL_DIR/database/schema.sql

    # Migrações
    for migration in $INSTALL_DIR/database/migration_*.sql; do
        if [ -f "$migration" ]; then
            log_info "Executando migração: $(basename $migration)"
            sudo -u postgres psql -d $DB_NAME -f "$migration"
        fi
    done

    # Dar permissões após criar tabelas
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

    # Tabela CDR
    sudo -u postgres psql -d $DB_NAME << 'CDRTABLE'
CREATE TABLE IF NOT EXISTS cdr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calldate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    clid VARCHAR(80),
    src VARCHAR(80),
    dst VARCHAR(80),
    dcontext VARCHAR(80),
    channel VARCHAR(80),
    dstchannel VARCHAR(80),
    lastapp VARCHAR(80),
    lastdata VARCHAR(80),
    duration INTEGER DEFAULT 0,
    billsec INTEGER DEFAULT 0,
    disposition VARCHAR(45),
    amaflags INTEGER DEFAULT 0,
    accountcode VARCHAR(20),
    uniqueid VARCHAR(150),
    userfield VARCHAR(255),
    peeraccount VARCHAR(20),
    linkedid VARCHAR(150),
    sequence INTEGER,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answer_time TIMESTAMP,
    end_time TIMESTAMP,
    customer_id UUID,
    provider_id UUID,
    gateway_id UUID,
    route_id UUID,
    price NUMERIC(10,4) DEFAULT 0,
    cost NUMERIC(10,4) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cdr_start ON cdr(start_time);
CREATE INDEX IF NOT EXISTS idx_cdr_src ON cdr(src);
CREATE INDEX IF NOT EXISTS idx_cdr_dst ON cdr(dst);
CREATE INDEX IF NOT EXISTS idx_cdr_customer ON cdr(customer_id);
CDRTABLE

    # Criar usuário admin
    log_info "Criando usuário admin..."
    cd $INSTALL_DIR/backend
    source venv/bin/activate
    python3 << ADMINEOF
import asyncio
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = pwd_context.hash("$ADMIN_PASS")

async def create_admin():
    engine = create_async_engine("postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME")
    async with engine.begin() as conn:
        # Verificar se admin existe
        result = await conn.execute(text("SELECT id FROM users WHERE username = 'admin'"))
        if result.fetchone() is None:
            await conn.execute(text(
                "INSERT INTO users (id, username, email, password_hash, role, status) "
                "VALUES (gen_random_uuid(), 'admin', 'admin@localhost', :pwd, 'admin', 'active')"
            ), {"pwd": password_hash})
            print("Admin criado com sucesso")
        else:
            await conn.execute(text(
                "UPDATE users SET password_hash = :pwd WHERE username = 'admin'"
            ), {"pwd": password_hash})
            print("Senha do admin atualizada")
    await engine.dispose()

asyncio.run(create_admin())
ADMINEOF
    deactivate

    log_success "Banco de dados configurado"
}

setup_frontend() {
    log_info "Configurando Frontend..."
    cd $INSTALL_DIR/frontend

    npm install
    npm run build

    log_success "Frontend configurado"
}

setup_nginx() {
    log_info "Configurando Nginx..."

    cat > /etc/nginx/sites-available/asterisk-admin << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /opt/asterisk-admin/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    access_log /var/log/nginx/asterisk-admin.access.log;
    error_log /var/log/nginx/asterisk-admin.error.log;
}
NGINXEOF

    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/

    nginx -t
    systemctl restart nginx

    log_success "Nginx configurado"
}

setup_systemd() {
    log_info "Criando serviço systemd..."

    cat > /etc/systemd/system/asterisk-admin.service << 'SYSTEMDEOF'
[Unit]
Description=TrunkFlow API
After=network.target postgresql.service asterisk.service
Wants=postgresql.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/asterisk-admin/backend
Environment="PATH=/opt/asterisk-admin/backend/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/opt/asterisk-admin/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMDEOF

    systemctl daemon-reload
    systemctl enable asterisk-admin
    systemctl start asterisk-admin

    log_success "Serviço systemd criado"
}

setup_firewall() {
    log_info "Configurando firewall..."

    # iptables
    iptables -F INPUT 2>/dev/null || true
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    iptables -A INPUT -p udp --dport 5060 -j ACCEPT
    iptables -A INPUT -p tcp --dport 5060 -j ACCEPT
    iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
    iptables -A INPUT -j DROP

    netfilter-persistent save 2>/dev/null || true

    # fail2ban
    cat > /etc/fail2ban/jail.local << 'F2BEOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[asterisk]
enabled = true
port = 5060
filter = asterisk
logpath = /var/log/asterisk/messages
F2BEOF

    systemctl enable fail2ban
    systemctl restart fail2ban

    log_success "Firewall configurado"
}

show_final_info() {
    SERVER_IP=$(hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        INSTALAÇÃO CONCLUÍDA COM SUCESSO!                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}=== INFORMAÇÕES DE ACESSO ===${NC}"
    echo ""
    echo -e "  URL do Painel:     ${GREEN}http://$SERVER_IP${NC}"
    echo -e "  Usuário:           ${GREEN}admin${NC}"
    echo -e "  Senha:             ${GREEN}$ADMIN_PASS${NC}"
    echo ""
    echo -e "${BLUE}=== BANCO DE DADOS ===${NC}"
    echo ""
    echo -e "  Host:              localhost"
    echo -e "  Database:          $DB_NAME"
    echo -e "  Usuário:           $DB_USER"
    echo -e "  Senha:             ${YELLOW}$DB_PASS${NC}"
    echo ""
    echo -e "${BLUE}=== COMANDOS ÚTEIS ===${NC}"
    echo ""
    echo "  systemctl status asterisk-admin"
    echo "  systemctl status asterisk"
    echo "  journalctl -u asterisk-admin -f"
    echo "  asterisk -rvvv"
    echo ""
    echo -e "${YELLOW}IMPORTANTE: Altere a senha do admin após o primeiro login!${NC}"
    echo ""

    cat > /root/trunkflow-install.info << INFOEOF
===========================================
TRUNKFLOW - INFORMAÇÕES DE INSTALAÇÃO
===========================================
Data: $(date)
URL: http://$SERVER_IP
Admin: admin / $ADMIN_PASS
Database: $DB_NAME / $DB_USER / $DB_PASS
Secret: $SECRET_KEY
===========================================
INFOEOF

    echo -e "${GREEN}Informações salvas em: /root/trunkflow-install.info${NC}"
}

full_install() {
    log_info "Iniciando instalação completa..."
    update_system
    install_dependencies
    install_nodejs
    install_postgresql
    install_nginx
    install_asterisk
    configure_asterisk
    install_application
    setup_backend
    setup_database
    setup_frontend
    setup_nginx
    setup_systemd
    setup_firewall
    show_final_info
}

app_only_install() {
    log_info "Iniciando instalação da aplicação..."
    if ! command -v asterisk &> /dev/null; then
        log_error "Asterisk não encontrado. Use a instalação completa."
        exit 1
    fi
    update_system
    install_dependencies
    install_nodejs
    install_postgresql
    install_nginx
    configure_asterisk
    install_application
    setup_backend
    setup_database
    setup_frontend
    setup_nginx
    setup_systemd
    setup_firewall
    show_final_info
}

main_menu() {
    echo ""
    echo -e "${BLUE}Selecione o tipo de instalação:${NC}"
    echo ""
    echo "  1) Instalação Completa (Recomendado)"
    echo "  2) Apenas Aplicação (Asterisk já instalado)"
    echo "  3) Sair"
    echo ""
    read -p "Opção [1-3]: " choice

    case $choice in
        1) full_install ;;
        2) app_only_install ;;
        3) exit 0 ;;
        *) log_error "Opção inválida"; main_menu ;;
    esac
}

main() {
    print_banner
    check_root
    check_os
    main_menu
}

main "$@"
