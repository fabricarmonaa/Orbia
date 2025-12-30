# Orbia AI Service

Voice-powered command processing using Whisper STT and Intent Recognition.

## Setup

### 1. Install Python Dependencies

```bash
cd services/ai
pip install -r requirements.txt
```

**Note**: Whisper requires `ffmpeg`. Install it:
- **Windows**: Download from https://ffmpeg.org/download.html
- **Linux**: `sudo apt install ffmpeg`
- **Mac**: `brew install ffmpeg`

### 2. Download Whisper Model

The first time the service runs, it will download the Whisper `base` model (~150MB).

### 3. Run the Service

```bash
python app/main.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /commands

Process voice command (audio or text).

**Request**:
```json
{
  "tenant_id": "t_root",
  "audio_base64": "BASE64_AUDIO_DATA",
  "user_context": {
    "user_id": "abc123",
    "role": "ADMIN"
  }
}
```

Or with text:
```json
{
  "tenant_id": "t_root",
  "command": "Hoy el cliente Nadia1234 trajo un Moto G32...",
  "user_context": {...}
}
```

**Response**:
```json
{
  "structured": {
    "action": "CREATE_ORDER",
    "data": {
      "user_dni": "Nadia1234",
      "items": [...],
      "status_code": "PENDING",
      "payment": {...}
    }
  },
  "summary": "Crear pedido para Nadia1234...",
  "transcript": "hoy el cliente nadia1234..."
}
```

## Architecture

- `app/main.py` - FastAPI server
- `core/speech_to_text.py` - Whisper integration
- `core/intent_parser.py` - NLP and entity extraction
- `core/tenant_context.py` - Tenant configuration

## Supported Intents

- `CREATE_ORDER` - Create new order/service
- `CREATE_USER` - Register new client
- `UPDATE_ORDER` - Modify order status

## Entity Extraction

Extracts:
- Client DNI/ID
- Product/Service description
- Amount (pesos, mil, k, $)
- Payment method (efectivo, tarjeta, etc.)
- Status (pendiente, completado, etc.)
- Date
