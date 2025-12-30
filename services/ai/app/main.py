from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.speech_to_text import speech_to_text
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
    return {"status": "ok", "service": "orbia-ai"}

@app.post("/commands", response_model=CommandResponse)
async def process_command(payload: CommandRequest):
    try:
        print(f"[AI] Processing command for tenant: {payload.tenant_id}")
        
        tenant_config = get_tenant_context(payload.tenant_id)
        
        # Get transcript from text or audio
        if payload.command:
            transcript = payload.command
            print(f"[AI] Using provided text: {transcript}")
        elif payload.audio_base64:
            print(f"[AI] Transcribing audio...")
            transcript = speech_to_text(payload.audio_base64)
            if not transcript:
                raise HTTPException(status_code=400, detail="Failed to transcribe audio")
        else:
            raise HTTPException(status_code=400, detail="Either 'command' or 'audio_base64' must be provided")
        
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
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
