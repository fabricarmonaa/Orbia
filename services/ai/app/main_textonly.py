from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.intent_parser import parse_command
from core.tenant_context import get_tenant_context

app = FastAPI(title="Orbia AI Command Service")

# Enable CORS for Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    tenant_id: str
    command: str | None = None
    audio_base64: str | None = None
    user_context: dict

class CommandResponse(BaseModel):
    structured: dict
    summary: str
    transcript: str

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "orbia-ai", "note": "Running in TEXT-ONLY mode (Whisper not installed)"}

@app.post("/commands", response_model=CommandResponse)
async def process_command(payload: CommandRequest):
    try:
        print(f"[AI] Processing command for tenant: {payload.tenant_id}")
        
        tenant_config = get_tenant_context(payload.tenant_id)
        
        # Get transcript from text ONLY (audio disabled for now)
        if payload.command:
            transcript = payload.command
            print(f"[AI] Using provided text: {transcript}")
        elif payload.audio_base64:
            # Whisper not available yet
            raise HTTPException(
                status_code=400, 
                detail="Audio transcription temporalmente deshabilitado. Usa 'command' con texto por ahora. Instala faster-whisper para habilitar voz."
            )
        else:
            raise HTTPException(status_code=400, detail="'command' (texto) es requerido")
        
        # Parse intent and extract entities
        print(f"[AI] Parsing intent from transcript...")
        structured, summary = parse_command(transcript, tenant_config)
        
        print(f"[AI] Intent: {structured.get('action')}")
        print(f"[AI] Summary: {summary}")
        
        return CommandResponse(
            structured=structured,
            summary=summary,
            transcript=transcript
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"\n🚀 Starting Orbia AI Service (TEXT-ONLY MODE)")
    print(f"📝 Audio transcription disabled - use text commands only")
    print(f"⚡ Install 'faster-whisper' to enable voice recognition\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
