from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Optional
import asyncio
import json

from app.core.security import get_current_user
from app.services.sip_debug import sip_debug_service

router = APIRouter()

# Lista de WebSocket connections
active_connections: List[WebSocket] = []

async def broadcast_message(message: dict):
    """Envia mensagem para todos os clientes conectados"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass

@router.websocket("/ws/sip-monitor")
async def websocket_sip_monitor(websocket: WebSocket):
    """WebSocket para monitoramento SIP em tempo real"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Callback para enviar mensagens
        async def on_message(msg):
            await websocket.send_json({"type": "sip_message", "data": msg})
        
        # Iniciar captura se não estiver rodando
        if not sip_debug_service.capturing:
            asyncio.create_task(
                sip_debug_service.capture_with_tcpdump("eth0", on_message)
            )
        
        # Manter conexão aberta
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                msg = json.loads(data)
                
                if msg.get("action") == "get_active_calls":
                    calls = sip_debug_service.get_active_calls()
                    await websocket.send_json({"type": "active_calls", "data": calls})
                    
            except asyncio.TimeoutError:
                # Ping para manter conexão
                await websocket.send_json({"type": "ping"})
                
    except WebSocketDisconnect:
        pass
    finally:
        active_connections.remove(websocket)
        if len(active_connections) == 0:
            sip_debug_service.stop_capture()

@router.get("/active-calls")
async def get_active_calls(current_user = Depends(get_current_user)):
    """Retorna chamadas ativas"""
    return sip_debug_service.get_active_calls()

@router.get("/call-history")
async def get_call_history(
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Retorna histórico de chamadas"""
    return sip_debug_service.get_call_history(limit)

@router.get("/call-flow/{call_id}")
async def get_call_flow(
    call_id: str,
    current_user = Depends(get_current_user)
):
    """Retorna fluxo de uma chamada específica"""
    flow = sip_debug_service.get_call_flow(call_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Chamada não encontrada")
    return flow

@router.get("/problems")
async def get_problems(current_user = Depends(get_current_user)):
    """Retorna problemas detectados"""
    return sip_debug_service.analyze_problems()

@router.post("/capture/start")
async def start_capture(
    interface: str = "eth0",
    current_user = Depends(get_current_user)
):
    """Inicia captura de pacotes"""
    if sip_debug_service.capturing:
        return {"status": "already_running"}
    
    asyncio.create_task(
        sip_debug_service.capture_with_tcpdump(interface)
    )
    return {"status": "started", "interface": interface}

@router.post("/capture/stop")
async def stop_capture(current_user = Depends(get_current_user)):
    """Para captura de pacotes"""
    sip_debug_service.stop_capture()
    return {"status": "stopped"}

@router.get("/capture/status")
async def capture_status(current_user = Depends(get_current_user)):
    """Retorna status da captura"""
    return {
        "capturing": sip_debug_service.capturing,
        "active_calls": len(sip_debug_service.active_calls),
        "message_count": len(sip_debug_service.message_history)
    }
