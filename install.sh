#!/bin/bash
#
# ============================================================
# ASTERISK ADMIN - SCRIPT DE INSTALAÇÃO AUTOMATIZADA
# ============================================================
# Versão: 1.0.0
# Compatível: Debian 12 / Ubuntu 22.04+
# Autor: Asterisk Admin Team
# ============================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo "║     █████╗ ███████╗████████╗███████╗██████╗ ██╗███████╗   ║"
    echo "║    ██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗██║██╔════╝   ║"
    echo "║    ███████║███████╗   ██║   █████╗  ██████╔╝██║███████╗   ║"
    echo "║    ██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚════██║   ║"
    echo "║    ██║  ██║███████║   ██║   ███████╗██║  ██║██║███████║   ║"
    echo "║    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝   ║"
    echo "║                      ADMIN PANEL                          ║"
    echo "║                     Versão 1.0.0                          ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se é root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root"
        exit 1
    fi
}

# Verificar sistema operacional
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

# Atualizar sistema
update_system() {
    log_info "Atualizando sistema..."
    apt-get update -qq
    apt-get upgrade -y -qq
    log_success "Sistema atualizado"
}

# Instalar dependências do sistema
install_dependencies() {
    log_info "Instalando dependências do sistema..."
    
    apt-get install -y -qq \
        curl \
        wget \
        git \
        gnupg2 \
        lsb-release \
        ca-certificates \
        apt-transport-https \
        software-properties-common \
        build-essential \
        libssl-dev \
        libffi-dev \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        libnewt-dev \
        libncurses5-dev \
        libsqlite3-dev \
        uuid-dev \
        libjansson-dev \
        libxml2-dev \
        libxslt1-dev \
        openssl \
        sudo
    
    log_success "Dependências instaladas"
}

# Instalar Node.js
install_nodejs() {
    log_info "Instalando Node.js 18..."
    
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y -qq nodejs
    fi
    
    log_success "Node.js $(node -v) instalado"
}

# Instalar PostgreSQL
install_postgresql() {
    log_info "Instalando PostgreSQL..."
    
    apt-get install -y -qq postgresql postgresql-contrib
    
    systemctl start postgresql
    systemctl enable postgresql
    
    # Criar usuário e banco de dados
    log_info "Configurando banco de dados..."
    
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    log_success "PostgreSQL instalado e configurado"
}

# Instalar Nginx
install_nginx() {
    log_info "Instalando Nginx..."
    
    apt-get install -y -qq nginx
    
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx instalado"
}

# Instalar Asterisk
install_asterisk() {
    log_info "Instalando Asterisk..."
    
    # Verificar se já está instalado
    if command -v asterisk &> /dev/null; then
        log_warning "Asterisk já está instalado"
        return
    fi
    
    # Instalar dependências do Asterisk
    apt-get install -y -qq \
        libncurses5-dev \
        libjansson-dev \
        libxml2-dev \
        libsqlite3-dev \
        uuid-dev \
        libspeex-dev \
        libspeexdsp-dev \
        libogg-dev \
        libvorbis-dev \
        libasound2-dev \
        portaudio19-dev \
        libcurl4-openssl-dev \
        libical-dev \
        libneon27-dev \
        libsrtp2-dev \
        unixodbc-dev \
        libmyodbc \
        freetds-dev \
        libedit-dev \
        libpq-dev
    
    cd /usr/src
    
    # Download Asterisk 20 LTS
    if [ ! -f asterisk-20-current.tar.gz ]; then
        wget -q https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
    fi
    
    tar xzf asterisk-20-current.tar.gz
    cd asterisk-20*/
    
    # Instalar dependências do menuselect
    contrib/scripts/get_mp3_source.sh 2>/dev/null || true
    contrib/scripts/install_prereq install
    
    # Configurar
    ./configure --with-pjproject-bundled --with-jansson-bundled
    
    # Selecionar módulos
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
    
    # Compilar e instalar
    make -j$(nproc)
    make install
    make samples
    make config
    
    # Criar usuário asterisk
    useradd -r -s /bin/false asterisk 2>/dev/null || true
    chown -R asterisk:asterisk /var/lib/asterisk
    chown -R asterisk:asterisk /var/log/asterisk
    chown -R asterisk:asterisk /var/spool/asterisk
    chown -R asterisk:asterisk /etc/asterisk
    
    log_success "Asterisk instalado"
}

# Configurar Asterisk para PJSIP
configure_asterisk() {
    log_info "Configurando Asterisk..."
    
    # Backup das configs originais
    cp /etc/asterisk/pjsip.conf /etc/asterisk/pjsip.conf.bak 2>/dev/null || true
    cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.bak 2>/dev/null || true
    
    # Configurar PJSIP básico
    cat > /etc/asterisk/pjsip.conf << 'PJSIPEOF'
[global]
type=global
user_agent=AsteriskAdmin PBX

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

[transport-tcp]
type=transport
protocol=tcp
bind=0.0.0.0:5060

; Includes dos arquivos gerados pelo painel
#include pjsip_gateways.conf
#include pjsip_customer_trunks.conf
#include pjsip_extensions.conf
PJSIPEOF

    # Configurar Dialplan básico
    cat > /etc/asterisk/extensions.conf << 'DIALPLANEOF'
[general]
static=yes
writeprotect=no
clearglobalvars=no

[globals]

; Includes dos arquivos gerados pelo painel
#include extensions_routes.conf
#include extensions_dids.conf

[from-internal]
; Chamadas entre ramais
exten => _1XXX,1,NoOp(Chamada interna para ${EXTEN})
 same => n,Dial(PJSIP/${EXTEN},60,tT)
 same => n,Hangup()

[from-trunk]
; Chamadas de entrada - processadas pelo extensions_dids.conf
exten => _X.,1,NoOp(Chamada de entrada: ${EXTEN})
 same => n,Goto(dids,${EXTEN},1)
 same => n,Hangup()

[dids]
; Fallback para DIDs não configurados
exten => _X.,1,NoOp(DID nao configurado: ${EXTEN})
 same => n,Playback(invalid)
 same => n,Hangup()
DIALPLANEOF

    # Criar arquivos vazios para includes
    touch /etc/asterisk/pjsip_gateways.conf
    touch /etc/asterisk/pjsip_customer_trunks.conf
    touch /etc/asterisk/pjsip_extensions.conf
    touch /etc/asterisk/extensions_routes.conf
    touch /etc/asterisk/extensions_dids.conf
    
    # Criar diretório de backups
    mkdir -p /etc/asterisk/backups
    
    # Configurar CDR para PostgreSQL
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

    # Ajustar permissões
    chown -R asterisk:asterisk /etc/asterisk/
    chmod 640 /etc/asterisk/cdr_pgsql.conf
    
    # Reiniciar Asterisk
    systemctl restart asterisk 2>/dev/null || systemctl start asterisk
    systemctl enable asterisk
    
    log_success "Asterisk configurado"
}

# Instalar aplicação
install_application() {
    log_info "Instalando aplicação Asterisk Admin..."
    
    # Criar diretório
    mkdir -p $INSTALL_DIR
    
    # Copiar arquivos (assumindo que estamos no diretório do pacote)
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

# Configurar Backend
setup_backend() {
    log_info "Configurando Backend..."
    
    cd $INSTALL_DIR/backend
    
    # Criar ambiente virtual
    python3 -m venv venv
    source venv/bin/activate
    
    # Instalar dependências
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install bcrypt==4.0.1
    
    # Criar arquivo .env
    cat > .env << ENVEOF
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$SECRET_KEY
ASTERISK_CONFIG_PATH=/etc/asterisk
ASTERISK_SPOOL_PATH=/var/spool/asterisk/outgoing
ENVEOF
    
    deactivate
    
    log_success "Backend configurado"
}

# Configurar banco de dados
setup_database() {
    log_info "Configurando banco de dados..."
    
    # Executar schema principal
    PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -f $INSTALL_DIR/database/schema.sql
    
    # Executar migrações
    for migration in $INSTALL_DIR/database/migration_*.sql; do
        if [ -f "$migration" ]; then
            log_info "Executando migração: $(basename $migration)"
            PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -f "$migration"
        fi
    done
    
    # Criar tabela CDR se não existir
    PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME << 'CDRTABLE'
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
    
    log_success "Banco de dados configurado"
}

# Configurar Frontend
setup_frontend() {
    log_info "Configurando Frontend..."
    
    cd $INSTALL_DIR/frontend
    
    # Criar configs se não existirem
    cat > postcss.config.js << 'POSTCSSEOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSSEOF

    cat > vite.config.js << 'VITEEOF'
const { defineConfig } = require("vite")
const react = require("@vitejs/plugin-react")

module.exports = defineConfig({
  plugins: [react()],
})
VITEEOF
    
    # Instalar dependências e buildar
    npm install
    npm run build
    
    log_success "Frontend configurado"
}

# Configurar Nginx
setup_nginx() {
    log_info "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/asterisk-admin << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Frontend
    location / {
        root /opt/asterisk-admin/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
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

    # Logs
    access_log /var/log/nginx/asterisk-admin.access.log;
    error_log /var/log/nginx/asterisk-admin.error.log;
}
NGINXEOF

    # Remover site default e habilitar asterisk-admin
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/asterisk-admin /etc/nginx/sites-enabled/
    
    # Testar e reiniciar
    nginx -t
    systemctl restart nginx
    
    log_success "Nginx configurado"
}

# Criar serviço systemd
setup_systemd() {
    log_info "Criando serviço systemd..."
    
    cat > /etc/systemd/system/asterisk-admin.service << 'SYSTEMDEOF'
[Unit]
Description=Asterisk Admin API
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

# Configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw allow 5060/udp  # SIP
        ufw allow 5060/tcp  # SIP TCP
        ufw allow 10000:20000/udp  # RTP
        ufw --force enable
        log_success "UFW configurado"
    else
        log_warning "UFW não instalado, pulando configuração de firewall"
    fi
}

# Mostrar informações finais
show_final_info() {
    # Obter IP do servidor
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
    echo -e "  Porta:             5432"
    echo -e "  Database:          $DB_NAME"
    echo -e "  Usuário:           $DB_USER"
    echo -e "  Senha:             ${YELLOW}$DB_PASS${NC}"
    echo ""
    echo -e "${BLUE}=== COMANDOS ÚTEIS ===${NC}"
    echo ""
    echo "  Verificar status:"
    echo "    systemctl status asterisk-admin"
    echo "    systemctl status asterisk"
    echo "    systemctl status nginx"
    echo "    systemctl status postgresql"
    echo ""
    echo "  Ver logs:"
    echo "    journalctl -u asterisk-admin -f"
    echo ""
    echo "  Asterisk CLI:"
    echo "    asterisk -rvvv"
    echo ""
    echo -e "${BLUE}=== ARQUIVOS IMPORTANTES ===${NC}"
    echo ""
    echo "  Aplicação:         $INSTALL_DIR"
    echo "  Configs Asterisk:  /etc/asterisk/"
    echo "  Logs Nginx:        /var/log/nginx/"
    echo ""
    echo -e "${YELLOW}IMPORTANTE: Altere a senha do admin após o primeiro login!${NC}"
    echo ""
    
    # Salvar informações em arquivo
    cat > /root/asterisk-admin-install.info << INFOEOF
===========================================
ASTERISK ADMIN - INFORMAÇÕES DE INSTALAÇÃO
===========================================
Data: $(date)
Versão: 1.0.0

URL: http://$SERVER_IP
Admin User: admin
Admin Pass: $ADMIN_PASS

Database Host: localhost
Database Port: 5432
Database Name: $DB_NAME
Database User: $DB_USER
Database Pass: $DB_PASS

Secret Key: $SECRET_KEY

Diretório: $INSTALL_DIR
===========================================
INFOEOF
    
    echo -e "${GREEN}Informações salvas em: /root/asterisk-admin-install.info${NC}"
    echo ""
}

# Menu principal
main_menu() {
    echo ""
    echo -e "${BLUE}Selecione o tipo de instalação:${NC}"
    echo ""
    echo "  1) Instalação Completa (Recomendado)"
    echo "     - Instala tudo: PostgreSQL, Nginx, Asterisk, Aplicação"
    echo ""
    echo "  2) Apenas Aplicação"
    echo "     - Asterisk já instalado, apenas configura o painel"
    echo ""
    echo "  3) Sair"
    echo ""
    read -p "Opção [1-3]: " choice
    
    case $choice in
        1)
            full_install
            ;;
        2)
            app_only_install
            ;;
        3)
            echo "Instalação cancelada."
            exit 0
            ;;
        *)
            log_error "Opção inválida"
            main_menu
            ;;
    esac
}

# Instalação completa
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

# Instalação apenas da aplicação
app_only_install() {
    log_info "Iniciando instalação da aplicação..."
    
    # Verificar se Asterisk está instalado
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
    show_final_info
}

# Execução principal
main() {
    print_banner
    check_root
    check_os
    main_menu
}

# Executar
main "$@"
