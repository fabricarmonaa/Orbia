# 🤖 Configuración del Servicio de IA

## Estado Actual

El servicio de IA **NO está corriendo** porque Python no está instalado o configurado correctamente en tu sistema.

## ¿Qué hace el Servicio de IA?

- **Speech-to-Text**: Convierte tu voz a texto usando Whisper
- **Intent Recognition**: Detecta qué quieres hacer (crear pedido, crear usuario, etc.)
- **Entity Extraction**: Extrae datos (cliente, producto, monto, método de pago)
- **Confirmación**: Te muestra los datos para que confirmes antes de guardar

## Requisitos

### 1. Python 3.9+

**Verificar si ya lo tienes:**
```bash
python --version
```

**Si no está instalado:**
1. Descargar desde: https://www.python.org/downloads/
2. ⚠️ **CRÍTICO**: Durante instalación marcar **"Add Python to PATH"**
3. Reiniciar PowerShell después de instalar

### 2. ffmpeg (para Whisper)

**Descargar:**
https://ffmpeg.org/download.html

**Instalar:**
1. Extraer el ZIP
2. Copiar la carpeta `bin` (contiene `ffmpeg.exe`)
3. Agregar la ruta al PATH de Windows

**Verificar:**
```bash
ffmpeg -version
```

### 3. Dependencias Python

```bash
cd services/ai
pip install -r requirements.txt
```

Esto instalará:
- `fastapi` - Servidor web
- `uvicorn` - ASGI server
- `openai-whisper` - Speech-to-Text
- `spacy` - NLP (opcional, para mejorar extracción)
- `python-dateutil` - Manejo de fechas

**Nota**: La primera instalación puede tardar 5-10 minutos.

## Iniciar el Servicio

### Opción 1: Script Automático (Windows)

```bash
cd services/ai
start.bat
```

### Opción 2: Manual

```bash
cd services/ai
python app/main.py
```

**Salida esperada:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Verificar que Funciona

**1. Test de salud:**
Abrir en navegador: http://localhost:8000/health

Debería responder:
```json
{"status": "ok", "service": "orbia-ai"}
```

**2. Test con comando de texto:**
```bash
cd services/ai
python test_ai.py
```

## Uso desde el Frontend

Una vez que el servicio esté corriendo:

1. Ingresar como ADMIN o SUPER_ADMIN
2. Click en "🎤 Iniciar Grabación"
3. Hablar: *"El cliente Juan1234 trajo un Samsung A54, pagó 25 mil en efectivo"*
4. Detener grabación
5. Ver datos extraídos en pantalla
6. Confirmar para ejecutar

## Alternativa: Solo Texto (sin voz)

Si no puedes instalar Python ahora, puedes usar comandos de texto directamente.

El frontend ya tiene soporte para enviar texto plano al backend, que lo procesará igual que la voz.

**Temporalmente**, si no quieres instalar Python, puedo:
1. Deshabilitar la parte de grabación
2. Dejar solo input de texto
3. El texto se procesa con simple regex (sin IA avanzada)

## Errores Comunes

### "Python not found"
- Python no está en el PATH
- Reinstalar marcando "Add to PATH"
- Reiniciar terminal

### "pip not found"
- Generalmente se arregla reinstalando Python
- O usar: `python -m pip install ...`

### "No module named 'fastapi'"
- Ejecutar: `pip install -r requirements.txt`

### "ffmpeg not found" (al usar Whisper)
- Descargar ffmpeg y agregarlo al PATH
- Reiniciar terminal después de agregar

### Puerto 8000 en uso
- Otro servicio está usando el puerto
- Cambiar puerto en `.env`: `PORT=8001`
- Actualizar backend en `aiService.js`: `AI_SERVICE_URL=http://localhost:8001`

## Próximos Pasos

1. ¿Quieres instalar Python y usar voz real?
2. ¿O prefieres solo texto por ahora?

Dime qué prefieres y continuamos.
