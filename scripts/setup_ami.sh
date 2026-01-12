#!/bin/bash

# Configurar AMI (Asterisk Manager Interface)

AMI_USER="admin"
AMI_SECRET="admin123"

# Criar arquivo manager.conf
cat > /etc/asterisk/manager.conf << EOF
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1

[$AMI_USER]
secret = $AMI_SECRET
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.0
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
EOF

# Recarregar Asterisk
asterisk -rx "manager reload"

echo "AMI configurado!"
echo "Usuário: $AMI_USER"
echo "Porta: 5038"
