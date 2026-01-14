import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.extension import Extension
from app.models.customer import Customer

PJSIP_EXTENSIONS_PATH = "/etc/asterisk/pjsip_extensions.conf"

async def generate_pjsip_extensions(db: AsyncSession) -> str:
    """Gera o arquivo pjsip_extensions.conf baseado no banco de dados"""
    
    query = select(Extension, Customer).join(Customer).where(
        Extension.status == 'active',
        Customer.status == 'active'
    )
    result = await db.execute(query)
    results = result.all()
    
    lines = [
        "; =============================================",
        "; PJSIP Extensions - Gerado automaticamente",
        "; NÃO EDITE MANUALMENTE - Use o painel web",
        "; =============================================",
        ""
    ]
    
    for ext, customer in results:
        lines.append(f"; === Ramal: {ext.extension} - {ext.name} ({customer.name}) ===")
        lines.append(f"[{ext.extension}]")
        lines.append("type=endpoint")
        lines.append(f"context={ext.context or 'from-internal'}")
        lines.append("disallow=all")
        lines.append(f"allow={ext.codecs or 'alaw,ulaw'}")
        lines.append(f"auth={ext.extension}")
        lines.append(f"aors={ext.extension}")
        
        if ext.callerid:
            lines.append(f"callerid={ext.callerid}")
        
        if ext.nat_enabled:
            lines.append("direct_media=no")
            lines.append("rtp_symmetric=yes")
            lines.append("force_rport=yes")
            lines.append("rewrite_contact=yes")
        
        lines.append("")
        lines.append(f"[{ext.extension}]")
        lines.append("type=auth")
        lines.append("auth_type=userpass")
        lines.append(f"username={ext.extension}")
        lines.append(f"password={ext.secret}")
        lines.append("")
        lines.append(f"[{ext.extension}]")
        lines.append("type=aor")
        lines.append(f"max_contacts={ext.max_contacts or 1}")
        lines.append("")
    
    return "\n".join(lines)


async def write_pjsip_extensions_async(db: AsyncSession) -> bool:
    """Escreve o arquivo e recarrega o Asterisk"""
    try:
        config = await generate_pjsip_extensions(db)
        
        if os.path.exists(PJSIP_EXTENSIONS_PATH):
            backup_path = f"{PJSIP_EXTENSIONS_PATH}.bak"
            with open(PJSIP_EXTENSIONS_PATH, 'r') as f:
                with open(backup_path, 'w') as fb:
                    fb.write(f.read())
        
        with open(PJSIP_EXTENSIONS_PATH, 'w') as f:
            f.write(config)
        
        os.system('asterisk -rx "pjsip reload" > /dev/null 2>&1')
        
        return True
    except Exception as e:
        print(f"Erro ao gerar pjsip_extensions.conf: {e}")
        return False
