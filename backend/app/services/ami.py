import socket
from typing import Dict

class AMIClient:
    def __init__(self, host: str = "127.0.0.1", port: int = 5038, username: str = "admin", secret: str = "admin123"):
        self.host = host
        self.port = port
        self.username = username
        self.secret = secret
        self.sock = None
    
    def connect(self) -> bool:
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(5)
            self.sock.connect((self.host, self.port))
            
            # Ler banner
            self.sock.recv(1024)
            
            # Login
            login_cmd = f"Action: Login\r\nUsername: {self.username}\r\nSecret: {self.secret}\r\n\r\n"
            self.sock.send(login_cmd.encode())
            response = self.sock.recv(1024).decode()
            
            return "Success" in response
        except Exception as e:
            print(f"AMI connection error: {e}")
            return False
    
    def disconnect(self):
        if self.sock:
            try:
                logoff_cmd = "Action: Logoff\r\n\r\n"
                self.sock.send(logoff_cmd.encode())
                self.sock.close()
            except:
                pass
            self.sock = None
    
    def get_pjsip_endpoints(self) -> Dict[str, str]:
        """Retorna status de todos os endpoints PJSIP"""
        endpoints = {}
        
        if not self.sock:
            if not self.connect():
                return endpoints
        
        try:
            # Comando para listar endpoints PJSIP
            cmd = "Action: PJSIPShowEndpoints\r\n\r\n"
            self.sock.send(cmd.encode())
            
            # Ler resposta completa
            response = ""
            while True:
                try:
                    chunk = self.sock.recv(4096).decode()
                    response += chunk
                    if "EventList: Complete" in chunk or not chunk:
                        break
                except socket.timeout:
                    break
            
            # Parsear resposta
            for block in response.split("\r\n\r\n"):
                if "Event: EndpointList" in block:
                    endpoint_name = ""
                    device_state = "Unavailable"
                    
                    for line in block.split("\r\n"):
                        if line.startswith("ObjectName:"):
                            endpoint_name = line.split(":", 1)[1].strip()
                        elif line.startswith("DeviceState:"):
                            device_state = line.split(":", 1)[1].strip()
                    
                    if endpoint_name:
                        # Filtrar apenas ramais numéricos
                        if endpoint_name.isdigit():
                            endpoints[endpoint_name] = device_state
            
        except Exception as e:
            print(f"AMI error getting endpoints: {e}")
        
        return endpoints


def get_extensions_status() -> Dict[str, str]:
    """Função helper para obter status de todos os ramais"""
    ami = AMIClient()
    try:
        if ami.connect():
            endpoints = ami.get_pjsip_endpoints()
            return endpoints
    except Exception as e:
        print(f"Error getting extensions status: {e}")
    finally:
        ami.disconnect()
    return {}


def check_extension_online(extension: str) -> bool:
    """Verifica se um ramal específico está online"""
    status = get_extensions_status()
    ext_status = status.get(extension, "Unavailable")
    # "Not in use" ou "In use" significa online
    return ext_status in ["Not in use", "In use", "Ringing", "On hold"]
