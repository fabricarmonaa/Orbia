import re
from datetime import datetime
from dateutil import parser as date_parser
from typing import Dict, Any, Tuple
from .tenant_context import TenantConfig

# Common entity patterns
AMOUNT_PATTERNS = [
    r'(\d+(?:\.\d+)?)\s*(?:mil|k)',  # "40 mil", "40k"
    r'(\d+(?:\.\d+)?)\s*pesos',       # "40000 pesos"
    r'\$\s*(\d+(?:\.\d+)?)',          # "$40000"
    r'(\d{4,})',                       # "40000" (4+ digits)
]

PAYMENT_METHOD_MAP = {
    'efectivo': 'CASH',
    'cash': 'CASH',
    'tarjeta': 'CARD',
    'transferencia': 'TRANSFER',
    'debito': 'DEBIT',
    'credito': 'CREDIT',
}

STATUS_MAP = {
    'pendiente': 'PENDING',
    'completado': 'COMPLETED',
    'entregado': 'DELIVERED',
    'en proceso': 'IN_PROGRESS',
    'cancelado': 'CANCELLED',
}

def extract_amount(text: str) -> float:
    """Extract monetary amount from text."""
    text_lower = text.lower()
    
    for pattern in AMOUNT_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            amount_str = match.group(1)
            amount = float(amount_str)
            # If using "mil" or "k", multiply by 1000
            if 'mil' in match.group(0) or 'k' in match.group(0):
                amount *= 1000
            return amount
    
    return 0.0

def extract_payment_method(text: str) -> str:
    """Extract payment method from text."""
    text_lower = text.lower()
    
    for keyword, code in PAYMENT_METHOD_MAP.items():
        if keyword in text_lower:
            return code
    
    return 'CASH'  # Default

def extract_status(text: str) -> str:
    """Extract order status from text."""
    text_lower = text.lower()
    
    # Check for explicit status mentions
    for keyword, code in STATUS_MAP.items():
        if keyword in text_lower:
            return code
    
    # Heuristics: if mentions "no entregué" or "todavía no", it's PENDING
    if any(phrase in text_lower for phrase in ['no entregué', 'todavía no', 'aún no', 'no se lo']):
        return 'PENDING'
    
    return 'PENDING'  # Default

def extract_client_dni(text: str) -> str | None:
    """Extract client DNI or identifier."""
    # Pattern: word followed by digits, e.g., "Nadia1234", "cliente123"
    match = re.search(r'(?:cliente\s+)?([a-zA-Z]+\d+)', text, re.IGNORECASE)
    if match:
        return match.group(1)
    
    # Pattern: pure DNI (8 digits for Argentina)
    match = re.search(r'\b(\d{7,8})\b', text)
    if match:
        return match.group(1)
    
    return None

def extract_product_description(text: str) -> str:
    """Extract product/service description."""
    text_lower = text.lower()
    
    # Look for patterns like "celular X", "módulo de X", etc.
    # This is simplified - you could use more advanced NLP
    product_keywords = ['celular', 'teléfono', 'módulo', 'pantalla', 'batería', 'cargador', 'moto', 'samsung', 'iphone']
    
    for keyword in product_keywords:
        if keyword in text_lower:
            # Extract surrounding context
            idx = text_lower.find(keyword)
            snippet = text[max(0, idx - 5):min(len(text), idx + 30)]
            return snippet.strip()
    
    return "Servicio/Producto"

def extract_date(text: str) -> str:
    """Extract date from text, default to today."""
    text_lower = text.lower()
    
    # Check for "hoy", "today"
    if 'hoy' in text_lower or 'today' in text_lower:
        return datetime.now().strftime('%Y-%m-%d')
    
    # Try to parse any date-like strings
    try:
        # Simple regex for dates like "26/12/2025" or "26-12-2025"
        date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', text)
        if date_match:
            day, month, year = date_match.groups()
            if len(year) == 2:
                year = f"20{year}"
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass
    
    return datetime.now().strftime('%Y-%m-%d')

def classify_intent(text: str) -> str:
    """Classify user intent from transcript."""
    text_lower = text.lower()
    
    # CREATE_USER intent
    if any(phrase in text_lower for phrase in ['crear usuario', 'nuevo usuario', 'agregar cliente', 'registrar cliente']):
        return 'CREATE_USER'
    
    # UPDATE_ORDER intent
    if any(phrase in text_lower for phrase in ['actualizar pedido', 'cambiar estado', 'modificar pedido']):
        return 'UPDATE_ORDER'
    
    # CREATE_ORDER intent (most common)
    if any(phrase in text_lower for phrase in ['pedido', 'trajo', 'reparación', 'arreglo', 'pagó', 'servicio']):
        return 'CREATE_ORDER'
    
    return 'UNKNOWN'

def parse_command(transcript: str, config: TenantConfig) -> Tuple[Dict[str, Any], str]:
    """
    Parse transcript into structured command.
    
    Args:
        transcript: Transcribed voice command
        config: Tenant-specific configuration
    
    Returns:
        Tuple of (structured_data, summary)
    """
    intent = classify_intent(transcript)
    
    if intent == 'CREATE_ORDER':
        return parse_create_order(transcript)
    elif intent == 'CREATE_USER':
        return parse_create_user(transcript)
    else:
        return {
            "action": "UNKNOWN",
            "data": {},
            "transcript": transcript
        }, "No se pudo interpretar el comando"

def parse_create_order(transcript: str) -> Tuple[Dict[str, Any], str]:
    """Parse CREATE_ORDER command."""
    client_dni = extract_client_dni(transcript) or "UNKNOWN"
    product_desc = extract_product_description(transcript)
    amount = extract_amount(transcript)
    payment_method = extract_payment_method(transcript)
    status = extract_status(transcript)
    date = extract_date(transcript)
    
    structured = {
        "action": "CREATE_ORDER",
        "data": {
            "user_dni": client_dni,
            "items": [{
                "sku": "AUTO",
                "description": product_desc,
                "quantity": 1,
                "price": amount
            }],
            "status_code": status,
            "internal_notes": f"Creado por voz: {transcript[:100]}",
            "user_notes": "",
            "payment": {
                "method_code": payment_method,
                "amount": amount
            },
            "date": date
        },
        "transcript": transcript
    }
    
    summary = f"Crear pedido para {client_dni} | {product_desc} | ${amount:,.0f} ({payment_method}) | Estado: {status}"
    
    return structured, summary

def parse_create_user(transcript: str) -> Tuple[Dict[str, Any], str]:
    """Parse CREATE_USER command."""
    # This is a simplified example - you'd extract name, phone, etc.
    dni = extract_client_dni(transcript) or "UNKNOWN"
    
    structured = {
        "action": "CREATE_USER",
        "data": {
            "dni": dni,
            "first_name": "Extraído",
            "last_name": "Voz",
            "email": f"{dni}@temp.com",
            "phone": "0000",
            "role": "USER",
            "password": "temporal123"
        },
        "transcript": transcript
    }
    
    summary = f"Crear usuario con DNI {dni}"
    
    return structured, summary
