from dataclasses import dataclass
from typing import List, Dict

@dataclass
class TenantConfig:
    tenant_id: str
    invoice_template: List[Dict]

TENANT_CONFIG_CACHE: dict[str, TenantConfig] = {}

def get_tenant_context(tenant_id: str) -> TenantConfig:
    if tenant_id not in TENANT_CONFIG_CACHE:
        TENANT_CONFIG_CACHE[tenant_id] = TenantConfig(
            tenant_id=tenant_id,
            invoice_template=[{"name": "CLIENTE", "type": "string", "required": True}]
        )
    return TENANT_CONFIG_CACHE[tenant_id]
