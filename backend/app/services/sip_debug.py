import asyncio
import subprocess
import re
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass 
class SIPMessage:
    timestamp: str
    source_ip: str
    dest_ip: str
    method: str
    call_id: str
    raw_line: str

    def to_dict(self):
        return asdict(self)

@dataclass
class ActiveCall:
    call_id: str
    from_uri: str
    to_uri: str
    source_ip: str
    dest_ip: str
    start_time: str
    status: str
    messages: List[Dict]

    def to_dict(self):
        return asdict(self)

class SIPDebugService:
    def __init__(self):
        self.active_calls: Dict[str, ActiveCall] = {}
        self.message_history: List[SIPMessage] = []
        self.max_history = 500
        self.capturing = False
        self.capture_process = None

    async def capture_with_tcpdump(self, interface: str = "eth0", callback=None):
        """Captura pacotes SIP com tcpdump"""
        self.capturing = True
        cmd = [
            "/usr/bin/tcpdump", "-i", interface, "-n", "-l",
            "-A", "port", "5060"
        ]

        try:
            self.capture_process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            current_packet = []
            
            async for line in self.capture_process.stdout:
                if not self.capturing:
                    break

                decoded = line.decode('utf-8', errors='ignore').strip()
                
                # Nova linha de pacote começa com timestamp
                if re.match(r'^\d{2}:\d{2}:\d{2}', decoded):
                    # Processar pacote anterior
                    if current_packet:
                        await self._process_packet(current_packet, callback)
                    current_packet = [decoded]
                elif decoded:
                    current_packet.append(decoded)

        except Exception as e:
            print(f"Erro na captura: {e}")
        finally:
            self.capturing = False

    async def _process_packet(self, lines: List[str], callback=None):
        """Processa um pacote SIP capturado"""
        try:
            if not lines:
                return
                
            first_line = lines[0]
            
            # Extrair IPs do cabeçalho tcpdump
            # Formato: 08:18:46.219507 IP 187.109.88.49.41738 > 159.223.159.183.5060: SIP: INVITE...
            ip_match = re.search(r'IP (\d+\.\d+\.\d+\.\d+)\.\d+ > (\d+\.\d+\.\d+\.\d+)\.\d+', first_line)
            source_ip = ip_match.group(1) if ip_match else ""
            dest_ip = ip_match.group(2) if ip_match else ""
            
            # Detectar método SIP
            method = ""
            call_id = ""
            
            full_text = '\n'.join(lines)
            
            # Método SIP
            if 'INVITE' in first_line:
                method = 'INVITE'
            elif 'SIP/2.0 100' in full_text:
                method = '100 Trying'
            elif 'SIP/2.0 180' in full_text:
                method = '180 Ringing'
            elif 'SIP/2.0 183' in full_text:
                method = '183 Progress'
            elif 'SIP/2.0 200' in full_text:
                method = '200 OK'
            elif 'SIP/2.0 401' in full_text:
                method = '401 Unauthorized'
            elif 'SIP/2.0 403' in full_text:
                method = '403 Forbidden'
            elif 'SIP/2.0 404' in full_text:
                method = '404 Not Found'
            elif 'SIP/2.0 486' in full_text:
                method = '486 Busy'
            elif 'SIP/2.0 487' in full_text:
                method = '487 Cancelled'
            elif 'SIP/2.0 503' in full_text:
                method = '503 Unavailable'
            elif 'ACK' in first_line:
                method = 'ACK'
            elif 'BYE' in first_line:
                method = 'BYE'
            elif 'CANCEL' in first_line:
                method = 'CANCEL'
            elif 'REGISTER' in first_line:
                method = 'REGISTER'
            elif 'OPTIONS' in first_line:
                method = 'OPTIONS'
            
            # Call-ID
            call_id_match = re.search(r'Call-ID:\s*([^\s\r\n]+)', full_text, re.IGNORECASE)
            if call_id_match:
                call_id = call_id_match.group(1)
            
            if method:
                msg = SIPMessage(
                    timestamp=datetime.now().isoformat(),
                    source_ip=source_ip,
                    dest_ip=dest_ip,
                    method=method,
                    call_id=call_id,
                    raw_line=first_line[:100]
                )
                
                self.message_history.append(msg)
                if len(self.message_history) > self.max_history:
                    self.message_history.pop(0)
                
                # Atualizar chamadas ativas
                self._update_call(msg, full_text)
                
                if callback:
                    await callback(msg.to_dict())
                    
        except Exception as e:
            print(f"Erro ao processar pacote: {e}")

    def _update_call(self, msg: SIPMessage, full_text: str):
        """Atualiza o status das chamadas"""
        if not msg.call_id:
            return
            
        # Extrair From e To
        from_match = re.search(r'From:\s*([^\r\n]+)', full_text, re.IGNORECASE)
        to_match = re.search(r'To:\s*([^\r\n]+)', full_text, re.IGNORECASE)
        from_uri = from_match.group(1) if from_match else ""
        to_uri = to_match.group(1) if to_match else ""
        
        if msg.call_id not in self.active_calls:
            if 'INVITE' in msg.method:
                self.active_calls[msg.call_id] = ActiveCall(
                    call_id=msg.call_id,
                    from_uri=from_uri,
                    to_uri=to_uri,
                    source_ip=msg.source_ip,
                    dest_ip=msg.dest_ip,
                    start_time=msg.timestamp,
                    status="trying",
                    messages=[]
                )
        
        if msg.call_id in self.active_calls:
            call = self.active_calls[msg.call_id]
            call.messages.append(msg.to_dict())
            
            # Atualizar status
            if '180' in msg.method or '183' in msg.method:
                call.status = "ringing"
            elif '200' in msg.method:
                call.status = "answered"
            elif '4' in msg.method or '5' in msg.method:
                call.status = "failed"
            elif 'BYE' in msg.method:
                call.status = "ended"

    def stop_capture(self):
        """Para a captura"""
        self.capturing = False
        if self.capture_process:
            try:
                self.capture_process.terminate()
            except:
                pass

    def get_active_calls(self) -> List[Dict]:
        """Retorna chamadas ativas"""
        return [call.to_dict() for call in self.active_calls.values()
                if call.status not in ["ended", "failed"]]

    def get_call_history(self, limit: int = 50) -> List[Dict]:
        """Retorna histórico de chamadas"""
        calls = list(self.active_calls.values())[-limit:]
        return [call.to_dict() for call in calls]

    def get_messages(self, limit: int = 50) -> List[Dict]:
        """Retorna últimas mensagens"""
        return [msg.to_dict() for msg in self.message_history[-limit:]]

    def get_call_flow(self, call_id: str) -> Optional[Dict]:
        """Retorna fluxo de uma chamada específica"""
        if call_id in self.active_calls:
            return self.active_calls[call_id].to_dict()
        return None

    def analyze_problems(self) -> List[Dict]:
        """Analisa problemas comuns nas chamadas"""
        problems = []

        for call in self.active_calls.values():
            for msg in call.messages:
                method = msg.get('method', '')
                if '401' in method:
                    problems.append({
                        "type": "warning",
                        "call_id": call.call_id,
                        "message": "401 Unauthorized - Autenticação necessária",
                        "suggestion": "Normal se seguido de re-INVITE com credenciais"
                    })
                elif '403' in method:
                    problems.append({
                        "type": "error",
                        "call_id": call.call_id,
                        "message": "403 Forbidden - Acesso negado",
                        "suggestion": "Verificar autenticação e ACL"
                    })
                elif '404' in method:
                    problems.append({
                        "type": "error",
                        "call_id": call.call_id,
                        "message": "404 Not Found - Destino não encontrado",
                        "suggestion": "Verificar número discado e rotas"
                    })
                elif '486' in method:
                    problems.append({
                        "type": "info",
                        "call_id": call.call_id,
                        "message": "486 Busy - Destino ocupado",
                        "suggestion": "Destino está em outra chamada"
                    })
                elif '503' in method:
                    problems.append({
                        "type": "error",
                        "call_id": call.call_id,
                        "message": "503 Service Unavailable",
                        "suggestion": "Gateway ou provedor indisponível"
                    })

        return problems

    def clear(self):
        """Limpa histórico"""
        self.message_history = []
        self.active_calls = {}

# Instância global
sip_debug_service = SIPDebugService()
