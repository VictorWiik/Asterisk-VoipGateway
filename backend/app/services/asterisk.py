import os
import subprocess
import shutil
from datetime import datetime
from typing import Optional, Dict, Any, List
from loguru import logger
from app.core.config import settings


class AsteriskService:
    """Serviço de integração com Asterisk via arquivos de configuração e call files"""
    
    def __init__(self):
        self.config_path = settings.ASTERISK_CONFIG_PATH
        self.spool_path = settings.ASTERISK_SPOOL_PATH
        self.providers_file = os.path.join(self.config_path, "pjsip_providers.conf")
        self.gateways_file = os.path.join(self.config_path, "pjsip_gateways.conf")
        self.customer_trunks_file = os.path.join(self.config_path, "pjsip_customer_trunks.conf")
        self.extensions_file = os.path.join(self.config_path, "extensions_custom.conf")
        self.backup_path = os.path.join(self.config_path, "backups")
        
        os.makedirs(self.backup_path, exist_ok=True)
    
    def _backup_file(self, filepath: str) -> Optional[str]:
        """Faz backup de um arquivo antes de modificar"""
        if not os.path.exists(filepath):
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(filepath)
        backup_name = f"{filename}.{timestamp}.bak"
        backup_filepath = os.path.join(self.backup_path, backup_name)
        
        try:
            shutil.copy2(filepath, backup_filepath)
            logger.info(f"Backup criado: {backup_filepath}")
            return backup_filepath
        except Exception as e:
            logger.error(f"Erro ao criar backup: {e}")
            return None
    
    async def reload_pjsip(self) -> bool:
        """Recarrega configuração PJSIP no Asterisk"""
        try:
            result = subprocess.run(
                ['/usr/sbin/asterisk', '-rx', 'pjsip reload'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info(f"PJSIP recarregado com sucesso")
                return True
            else:
                logger.error(f"Erro ao recarregar PJSIP: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Erro ao executar comando Asterisk: {e}")
            return False
    
    async def reload_dialplan(self) -> bool:
        """Recarrega dialplan no Asterisk"""
        try:
            result = subprocess.run(
                ['/usr/sbin/asterisk', '-rx', 'dialplan reload'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info("Dialplan recarregado com sucesso")
                return True
            else:
                logger.error(f"Erro ao recarregar dialplan: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Erro ao executar comando Asterisk: {e}")
            return False

    # ==========================================
    # GATEWAYS
    # ==========================================
    async def generate_gateways_config(self, gateways: List[Dict[str, Any]]) -> str:
        """Gera configuração PJSIP para todos os gateways"""
        
        config = "; =============================================\n"
        config += "; GATEWAYS - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        for gateway in gateways:
            if gateway.get('status') != 'active':
                continue
            
            if not gateway.get('ip_address'):
                continue
                
            name = gateway['name']
            ip = gateway['ip_address']
            port = gateway.get('port', 5060)
            codecs = gateway.get('codecs', 'alaw,ulaw')
            context = gateway.get('context', 'from-trunk')
            auth_type = gateway.get('auth_type', 'ip')
            username = gateway.get('username')
            password = gateway.get('password')
            
            config += f"; === Gateway: {name} ===\n"
            config += f"[{name}]\n"
            config += f"type=endpoint\n"
            config += f"context={context}\n"
            config += f"disallow=all\n"
            config += f"allow={codecs}\n"
            config += f"aors={name}\n"
            
            if auth_type in ['credentials', 'both'] and username:
                config += f"auth={name}\n"
            
            config += f"\n"
            
            config += f"[{name}]\n"
            config += f"type=aor\n"
            config += f"contact=sip:{ip}:{port}\n\n"
            
            config += f"[{name}]\n"
            config += f"type=identify\n"
            config += f"endpoint={name}\n"
            config += f"match={ip}\n\n"
            
            if auth_type in ['credentials', 'both'] and username and password:
                config += f"[{name}]\n"
                config += f"type=auth\n"
                config += f"auth_type=userpass\n"
                config += f"username={username}\n"
                config += f"password={password}\n\n"
        
        return config
    
    async def save_gateways_config(self, gateways: List[Dict[str, Any]]) -> bool:
        """Salva configuração de gateways no arquivo"""
        try:
            self._backup_file(self.gateways_file)
            config = await self.generate_gateways_config(gateways)
            
            with open(self.gateways_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Configuração de gateways salva em {self.gateways_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de gateways: {e}")
            return False

    # ==========================================
    # CUSTOMER TRUNKS
    # ==========================================
    async def generate_customer_trunks_config(self, customers: List[Dict[str, Any]]) -> str:
        """Gera configuração PJSIP para clientes trunk"""
        
        config = "; =============================================\n"
        config += "; CLIENTES TRUNK - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        for customer in customers:
            if customer.get('type') != 'trunk' or customer.get('status') != 'active':
                continue
            
            if not customer.get('trunk_ip'):
                continue
            
            name = f"CLI_{customer['code']}"
            ip = customer['trunk_ip']
            port = customer.get('trunk_port', 5060)
            codecs = customer.get('trunk_codecs', 'alaw,ulaw')
            auth_type = customer.get('trunk_auth_type', 'ip')
            username = customer.get('trunk_username')
            password = customer.get('trunk_password')
            context = customer.get('trunk_context', 'from-trunk')
            
            config += f"; === Cliente: {customer['name']} ({customer['code']}) ===\n"
            config += f"[{name}]\n"
            config += f"type=endpoint\n"
            config += f"context={context}\n"
            config += f"disallow=all\n"
            config += f"allow={codecs}\n"
            config += f"aors={name}\n"
            
            if auth_type in ['credentials', 'both'] and username:
                config += f"auth={name}\n"
            
            config += f"\n"
            
            config += f"[{name}]\n"
            config += f"type=aor\n"
            config += f"contact=sip:{ip}:{port}\n\n"
            
            config += f"[{name}]\n"
            config += f"type=identify\n"
            config += f"endpoint={name}\n"
            config += f"match={ip}\n\n"
            
            if auth_type in ['credentials', 'both'] and username and password:
                config += f"[{name}]\n"
                config += f"type=auth\n"
                config += f"auth_type=userpass\n"
                config += f"username={username}\n"
                config += f"password={password}\n\n"
        
        return config
    
    async def save_customer_trunks_config(self, customers: List[Dict[str, Any]]) -> bool:
        """Salva configuração de clientes trunk no arquivo"""
        try:
            self._backup_file(self.customer_trunks_file)
            config = await self.generate_customer_trunks_config(customers)
            
            with open(self.customer_trunks_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Configuração de clientes trunk salva em {self.customer_trunks_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de clientes trunk: {e}")
            return False

    # ==========================================
    # PROVIDERS (legado, não usado atualmente)
    # ==========================================
    async def generate_providers_config(self, providers: List[Dict[str, Any]]) -> str:
        """Gera configuração PJSIP para todos os provedores"""
        
        config = "; =============================================\n"
        config += "; PROVEDORES - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        for provider in providers:
            if provider.get('status') != 'active':
                continue
            
            if not provider.get('ip_address'):
                continue
                
            name = provider['name']
            ip = provider['ip_address']
            port = provider.get('port', 5060)
            codecs = provider.get('codecs', 'alaw,ulaw')
            auth_type = provider.get('auth_type', 'ip')
            username = provider.get('username')
            password = provider.get('password')
            
            config += f"; === {name} ===\n"
            config += f"[{name}]\n"
            config += f"type=endpoint\n"
            config += f"context=from-trunk\n"
            config += f"disallow=all\n"
            config += f"allow={codecs}\n"
            config += f"aors={name}\n"
            
            if auth_type in ['credentials', 'both'] and username:
                config += f"auth={name}\n"
            
            config += f"\n"
            
            config += f"[{name}]\n"
            config += f"type=aor\n"
            config += f"contact=sip:{ip}:{port}\n\n"
            
            config += f"[{name}]\n"
            config += f"type=identify\n"
            config += f"endpoint={name}\n"
            config += f"match={ip}\n\n"
            
            if auth_type in ['credentials', 'both'] and username and password:
                config += f"[{name}]\n"
                config += f"type=auth\n"
                config += f"auth_type=userpass\n"
                config += f"username={username}\n"
                config += f"password={password}\n\n"
        
        return config
    
    async def save_providers_config(self, providers: List[Dict[str, Any]]) -> bool:
        """Salva configuração de provedores no arquivo"""
        try:
            self._backup_file(self.providers_file)
            config = await self.generate_providers_config(providers)
            
            with open(self.providers_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Configuração de provedores salva em {self.providers_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de provedores: {e}")
            return False

    # ==========================================
    # EXTENSIONS (RAMAIS)
    # ==========================================
    async def generate_extensions_pjsip_config(self, extensions: List[Dict[str, Any]]) -> str:
        """Gera configuração PJSIP para ramais"""
        
        config = "; =============================================\n"
        config += "; RAMAIS - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        for ext in extensions:
            if ext.get('status') != 'active':
                continue
            
            exten = ext['extension']
            name = ext.get('name', exten)
            secret = ext.get('secret', '')
            context = ext.get('context', 'from-internal')
            codecs = ext.get('codecs', 'alaw,ulaw')
            max_contacts = ext.get('max_contacts', 1)
            callerid = ext.get('callerid', f'"{name}" <{exten}>')
            
            config += f"; === Ramal: {exten} - {name} ===\n"
            config += f"[{exten}]\n"
            config += f"type=endpoint\n"
            config += f"context={context}\n"
            config += f"disallow=all\n"
            config += f"allow={codecs}\n"
            config += f"auth={exten}\n"
            config += f"aors={exten}\n"
            config += f"callerid={callerid}\n"
            config += f"\n"
            
            config += f"[{exten}]\n"
            config += f"type=auth\n"
            config += f"auth_type=userpass\n"
            config += f"username={exten}\n"
            config += f"password={secret}\n\n"
            
            config += f"[{exten}]\n"
            config += f"type=aor\n"
            config += f"max_contacts={max_contacts}\n\n"
        
        return config
    
    async def save_extensions_pjsip_config(self, extensions: List[Dict[str, Any]]) -> bool:
        """Salva configuração PJSIP de ramais no arquivo"""
        extensions_pjsip_file = os.path.join(self.config_path, "pjsip_extensions.conf")
        try:
            self._backup_file(extensions_pjsip_file)
            config = await self.generate_extensions_pjsip_config(extensions)
            
            with open(extensions_pjsip_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Configuração PJSIP de ramais salva em {extensions_pjsip_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar configuração de ramais: {e}")
            return False

    # ==========================================
    # ROUTES (DIALPLAN SAÍDA)
    # ==========================================
    async def generate_outbound_routes_config(self, routes: List[Dict[str, Any]], gateways: List[Dict[str, Any]]) -> str:
        """Gera dialplan para rotas de saída"""
        
        config = "; =============================================\n"
        config += "; ROTAS DE SAIDA - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        config += "[from-internal]\n"
        config += "; Rotas de saída\n\n"
        
        # Ordena por prioridade
        sorted_routes = sorted(routes, key=lambda x: x.get('priority', 99))
        
        for route in sorted_routes:
            if route.get('status') != 'active':
                continue
            
            pattern = route.get('pattern', '_X.')
            gateway_id = route.get('gateway_id')
            route_name = route.get('name', 'Rota')
            
            # Encontra o gateway
            gateway = None
            for gw in gateways:
                if str(gw.get('id')) == str(gateway_id):
                    gateway = gw
                    break
            
            if not gateway:
                continue
            
            gateway_name = gateway.get('name')
            tech_prefix = gateway.get('tech_prefix', '')
            
            config += f"; {route_name}\n"
            if tech_prefix:
                config += f"exten => {pattern},1,NoOp(Rota: {route_name})\n"
                config += f" same => n,Dial(PJSIP/{tech_prefix}${{EXTEN}}@{gateway_name},60,tT)\n"
            else:
                config += f"exten => {pattern},1,NoOp(Rota: {route_name})\n"
                config += f" same => n,Dial(PJSIP/${{EXTEN}}@{gateway_name},60,tT)\n"
            config += f" same => n,Hangup()\n\n"
        
        return config
    
    async def save_outbound_routes_config(self, routes: List[Dict[str, Any]], gateways: List[Dict[str, Any]]) -> bool:
        """Salva dialplan de rotas de saída"""
        routes_file = os.path.join(self.config_path, "extensions_routes.conf")
        try:
            self._backup_file(routes_file)
            config = await self.generate_outbound_routes_config(routes, gateways)
            
            with open(routes_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Dialplan de rotas salvo em {routes_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar dialplan de rotas: {e}")
            return False

    # ==========================================
    # DIDS (DIALPLAN ENTRADA)
    # ==========================================
    async def generate_inbound_dids_config(self, dids: List[Dict[str, Any]], customers: List[Dict[str, Any]]) -> str:
        """Gera dialplan para DIDs de entrada"""
        
        config = "; =============================================\n"
        config += "; DIDS ENTRADA - Gerado automaticamente pelo Painel\n"
        config += f"; Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        config += "; NAO EDITE MANUALMENTE - Use o painel web\n"
        config += "; =============================================\n\n"
        
        config += "[from-trunk]\n"
        config += "; Roteamento de DIDs\n\n"
        
        for did in dids:
            if did.get('status') != 'allocated':
                continue
            
            number = did.get('number', '')
            customer_id = did.get('customer_id')
            destination = did.get('destination')
            destination_type = did.get('destination_type', 'extension')
            
            if not customer_id:
                continue
            
            # Encontra o cliente
            customer = None
            for c in customers:
                if str(c.get('id')) == str(customer_id):
                    customer = c
                    break
            
            if not customer:
                continue
            
            customer_name = customer.get('name', '')
            customer_type = customer.get('type', 'extension')
            
            config += f"; DID {number} -> {customer_name}\n"
            
            if customer_type == 'trunk':
                # Cliente trunk - encaminha para o IP do cliente
                trunk_ip = customer.get('trunk_ip')
                trunk_port = customer.get('trunk_port', 5060)
                trunk_name = f"CLI_{customer.get('code')}"
                
                if destination:
                    # Encaminha para destino específico
                    config += f"exten => {number},1,NoOp(DID {number} -> Cliente Trunk {customer_name})\n"
                    config += f" same => n,Dial(PJSIP/{destination}@{trunk_name},60,tT)\n"
                else:
                    # Encaminha mantendo o número original
                    config += f"exten => {number},1,NoOp(DID {number} -> Cliente Trunk {customer_name})\n"
                    config += f" same => n,Dial(PJSIP/${{EXTEN}}@{trunk_name},60,tT)\n"
            else:
                # Cliente ramal - encaminha para ramal interno
                if destination:
                    config += f"exten => {number},1,NoOp(DID {number} -> Ramal {destination})\n"
                    config += f" same => n,Dial(PJSIP/{destination},60,tT)\n"
                else:
                    config += f"exten => {number},1,NoOp(DID {number} -> Cliente {customer_name})\n"
                    config += f" same => n,Playback(invalid)\n"
            
            config += f" same => n,Hangup()\n\n"
        
        # Fallback para DIDs não configurados
        config += "; Fallback\n"
        config += "exten => _X.,1,NoOp(DID nao configurado: ${EXTEN})\n"
        config += " same => n,Playback(invalid)\n"
        config += " same => n,Hangup()\n"
        
        return config
    
    async def save_inbound_dids_config(self, dids: List[Dict[str, Any]], customers: List[Dict[str, Any]]) -> bool:
        """Salva dialplan de DIDs de entrada"""
        dids_file = os.path.join(self.config_path, "extensions_dids.conf")
        try:
            self._backup_file(dids_file)
            config = await self.generate_inbound_dids_config(dids, customers)
            
            with open(dids_file, 'w') as f:
                f.write(config)
            
            logger.info(f"Dialplan de DIDs salvo em {dids_file}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar dialplan de DIDs: {e}")
            return False

    # ==========================================
    # CONFERENCE
    # ==========================================
    def _get_provider_for_number(self, number: str, providers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Determina qual provedor usar baseado no número"""
        number = ''.join(filter(str.isdigit, number))
        
        if number.startswith('55'):
            if len(number) == 13 and number[4] == '9':
                for p in providers:
                    if p.get('type') == 'movel' and p.get('status') == 'active':
                        return p
            elif len(number) == 12:
                for p in providers:
                    if p.get('type') == 'fixo' and p.get('status') == 'active':
                        return p
        
        for p in providers:
            if p.get('type') == 'ldi' and p.get('status') == 'active':
                return p
        
        for p in providers:
            if p.get('status') == 'active':
                return p
        
        return None
    
    async def create_conference(
        self,
        number1: str,
        number2: str,
        conference_id: str,
        providers: List[Dict[str, Any]],
        callerid: str = "Conferencia"
    ) -> Dict[str, Any]:
        """Cria conferência entre dois números"""
        import tempfile
        
        try:
            provider1 = self._get_provider_for_number(number1, providers)
            provider2 = self._get_provider_for_number(number2, providers)
            
            if not provider1 or not provider2:
                return {"success": False, "error": "Provedor não encontrado para os números"}
            
            tech_prefix1 = provider1.get('tech_prefix', '')
            tech_prefix2 = provider2.get('tech_prefix', '')
            
            channel1 = f"PJSIP/{tech_prefix1}{number1}@{provider1['name']}"
            channel2 = f"PJSIP/{tech_prefix2}{number2}@{provider2['name']}"
            
            call1_content = f"""Channel: {channel1}
CallerID: "{callerid}" <0000>
MaxRetries: 0
RetryTime: 30
WaitTime: 45
Context: conferencia
Extension: {number1}
Priority: 1
Setvar: CONFID={conference_id}
"""
            
            call2_content = f"""Channel: {channel2}
CallerID: "{callerid}" <0000>
MaxRetries: 0
RetryTime: 30
WaitTime: 45
Context: conferencia
Extension: {number2}
Priority: 1
Setvar: CONFID={conference_id}
"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.call', delete=False) as f1:
                f1.write(call1_content)
                temp1 = f1.name
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.call', delete=False) as f2:
                f2.write(call2_content)
                temp2 = f2.name
            
            dest1 = os.path.join(self.spool_path, f"conf_{conference_id}_1.call")
            dest2 = os.path.join(self.spool_path, f"conf_{conference_id}_2.call")
            
            shutil.move(temp1, dest1)
            shutil.move(temp2, dest2)
            
            os.chmod(dest1, 0o666)
            os.chmod(dest2, 0o666)
            
            logger.info(f"Conferência {conference_id} criada entre {number1} e {number2}")
            
            return {
                "success": True,
                "conference_id": conference_id,
                "number1": number1,
                "number2": number2,
                "provider1": provider1['name'],
                "provider2": provider2['name']
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar conferência: {e}")
            return {"success": False, "error": str(e)}

    # ==========================================
    # CHANNELS
    # ==========================================
    async def get_active_channels(self) -> List[Dict[str, Any]]:
        """Obtém canais ativos no Asterisk"""
        try:
            result = subprocess.run(
                ['/usr/sbin/asterisk', '-rx', 'core show channels concise'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            channels = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split('!')
                    if len(parts) >= 7:
                        channels.append({
                            'channel': parts[0],
                            'context': parts[1],
                            'extension': parts[2],
                            'priority': parts[3],
                            'state': parts[4],
                            'application': parts[5],
                            'data': parts[6] if len(parts) > 6 else ''
                        })
            
            return channels
            
        except Exception as e:
            logger.error(f"Erro ao obter canais ativos: {e}")
            return []
    
    async def get_pjsip_endpoints(self) -> List[Dict[str, Any]]:
        """Obtém endpoints PJSIP"""
        try:
            result = subprocess.run(
                ['/usr/sbin/asterisk', '-rx', 'pjsip show endpoints'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            endpoints = []
            for line in result.stdout.split('\n'):
                if line.startswith(' Endpoint:'):
                    parts = line.split()
                    if len(parts) >= 2:
                        endpoints.append({
                            'name': parts[1],
                            'status': 'active'
                        })
            
            return endpoints
            
        except Exception as e:
            logger.error(f"Erro ao obter endpoints PJSIP: {e}")
            return []


# Instância global
asterisk_service = AsteriskService()
