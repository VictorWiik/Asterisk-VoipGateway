import asyncio
import subprocess
import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class SIPMethod(Enum):
    INVITE = "INVITE"
    ACK = "ACK"
    BYE = "BYE"
    CANCEL = "CANCEL"
    REGISTER = "REGISTER"
    OPTIONS = "OPTIONS"
    PRACK = "PRACK"
    UPDATE = "UPDATE"
    INFO = "INFO"
    REFER = "REFER"
    MESSAGE = "MESSAGE"
    NOTIFY = "NOTIFY"
    SUBSCRIBE = "SUBSCRIBE"

@dataclass
class SIPMessage:
    timestamp: str
    source_ip: str
    source_port: int
    dest_ip: str
    dest_port: int
    method: str
    call_id: str
    from_uri: str
    to_uri: str
    cseq: str
    status_code: Optional[int] = None
    status_text: Optional[str] = None
    raw_message: str = ""
    
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
    status: str  # trying, ringing, answered, ended
    messages: List[Dict]
    
    def to_dict(self):
        return asdict(self)

class SIPDebugService:
    def __init__(self):
        self.active_calls: Dict[str, ActiveCall] = {}
        self.message_history: List[SIPMessage] = []
        self.max_history = 1000
        self.capturing = False
        self.capture_process = None
        
    def parse_sip_message(self, raw: str) -> Optional[SIPMessage]:
        """Parse uma mensagem SIP raw"""
        try:
            lines = raw.strip().split('\n')
            if not lines:
                return None
                
            first_line = lines[0].strip()
            
            # Request ou Response?
            method = None
            status_code = None
            status_text = None
            
            if first_line.startswith('SIP/2.0'):
                # Response: SIP/2.0 200 OK
                parts = first_line.split(' ', 2)
                status_code = int(parts[1])
                status_text = parts[2] if len(parts) > 2 else ""
                method = "RESPONSE"
            else:
                # Request: INVITE sip:... SIP/2.0
                parts = first_line.split(' ')
                method = parts[0]
            
            # Parse headers
            headers = {}
            for line in lines[1:]:
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.strip().lower()] = value.strip()
            
            call_id = headers.get('call-id', '')
            from_uri = headers.get('from', '')
            to_uri = headers.get('to', '')
            cseq = headers.get('cseq', '')
            
            # Extrair IPs do Via header
            via = headers.get('via', '')
            
            return SIPMessage(
                timestamp=datetime.now().isoformat(),
                source_ip="",
                source_port=5060,
                dest_ip="",
                dest_port=5060,
                method=method,
                call_id=call_id,
                from_uri=from_uri,
                to_uri=to_uri,
                cseq=cseq,
                status_code=status_code,
                status_text=status_text,
                raw_message=raw
            )
        except Exception as e:
            print(f"Erro ao parsear SIP: {e}")
            return None
    
    def update_call_status(self, msg: SIPMessage):
        """Atualiza status da chamada baseado na mensagem"""
        if not msg.call_id:
            return
            
        if msg.call_id not in self.active_calls:
            if msg.method == "INVITE":
                self.active_calls[msg.call_id] = ActiveCall(
                    call_id=msg.call_id,
                    from_uri=msg.from_uri,
                    to_uri=msg.to_uri,
                    source_ip=msg.source_ip,
                    dest_ip=msg.dest_ip,
                    start_time=msg.timestamp,
                    status="trying",
                    messages=[]
                )
        
        if msg.call_id in self.active_calls:
            call = self.active_calls[msg.call_id]
            call.messages.append(msg.to_dict())
            
            # Atualizar status baseado na resposta
            if msg.status_code:
                if msg.status_code == 180 or msg.status_code == 183:
                    call.status = "ringing"
                elif msg.status_code == 200:
                    if "invite" in msg.cseq.lower():
                        call.status = "answered"
                elif msg.status_code >= 400:
                    call.status = "failed"
            
            if msg.method == "BYE":
                call.status = "ended"
    
    async def capture_with_tcpdump(self, interface: str = "eth0", callback=None):
        """Captura pacotes SIP com tcpdump"""
        self.capturing = True
        cmd = [
            "tcpdump", "-i", interface, "-n", "-l",
            "-A", "port", "5060"
        ]
        
        try:
            self.capture_process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            buffer = ""
            async for line in self.capture_process.stdout:
                if not self.capturing:
                    break
                    
                decoded = line.decode('utf-8', errors='ignore')
                buffer += decoded
                
                # Detectar fim de mensagem SIP
                if '\r\n\r\n' in buffer or decoded.strip() == '':
                    if buffer.strip():
                        msg = self.parse_sip_message(buffer)
                        if msg:
                            self.message_history.append(msg)
                            if len(self.message_history) > self.max_history:
                                self.message_history.pop(0)
                            self.update_call_status(msg)
                            if callback:
                                await callback(msg.to_dict())
                    buffer = ""
                    
        except Exception as e:
            print(f"Erro na captura: {e}")
        finally:
            self.capturing = False
    
    def stop_capture(self):
        """Para a captura"""
        self.capturing = False
        if self.capture_process:
            self.capture_process.terminate()
    
    def get_active_calls(self) -> List[Dict]:
        """Retorna chamadas ativas"""
        return [call.to_dict() for call in self.active_calls.values() 
                if call.status not in ["ended", "failed"]]
    
    def get_call_history(self, limit: int = 50) -> List[Dict]:
        """Retorna histórico de chamadas"""
        return [call.to_dict() for call in list(self.active_calls.values())[-limit:]]
    
    def get_call_flow(self, call_id: str) -> Optional[Dict]:
        """Retorna fluxo de uma chamada específica"""
        if call_id in self.active_calls:
            return self.active_calls[call_id].to_dict()
        return None
    
    def analyze_problems(self) -> List[Dict]:
        """Analisa problemas comuns nas chamadas"""
        problems = []
        
        for call in self.active_calls.values():
            # Verificar timeouts
            if call.status == "trying":
                # Se está em trying há muito tempo
                problems.append({
                    "type": "warning",
                    "call_id": call.call_id,
                    "message": "Chamada em TRYING por muito tempo",
                    "suggestion": "Verificar conectividade com gateway"
                })
            
            # Verificar erros
            for msg in call.messages:
                if msg.get('status_code'):
                    code = msg['status_code']
                    if code == 403:
                        problems.append({
                            "type": "error",
                            "call_id": call.call_id,
                            "message": f"403 Forbidden - Acesso negado",
                            "suggestion": "Verificar autenticação e ACL"
                        })
                    elif code == 404:
                        problems.append({
                            "type": "error",
                            "call_id": call.call_id,
                            "message": f"404 Not Found - Destino não encontrado",
                            "suggestion": "Verificar número discado e rotas"
                        })
                    elif code == 408:
                        problems.append({
                            "type": "error",
                            "call_id": call.call_id,
                            "message": f"408 Timeout - Tempo esgotado",
                            "suggestion": "Verificar conectividade de rede"
                        })
                    elif code == 486:
                        problems.append({
                            "type": "info",
                            "call_id": call.call_id,
                            "message": f"486 Busy - Destino ocupado",
                            "suggestion": "Destino está em outra chamada"
                        })
                    elif code == 503:
                        problems.append({
                            "type": "error",
                            "call_id": call.call_id,
                            "message": f"503 Service Unavailable",
                            "suggestion": "Gateway ou provedor indisponível"
                        })
        
        return problems

# Instância global
sip_debug_service = SIPDebugService()
