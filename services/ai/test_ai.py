import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_text_command():
    print("Testing text command (CREATE_ORDER)...")
    
    payload = {
        "tenant_id": "t_root",
        "command": "Hoy el cliente Nadia1234 trajo un celular Moto G32, le cambié el módulo pero todavía no se lo entregué. Pagó en efectivo cuarenta mil pesos.",
        "user_context": {
            "user_id": "test_user",
            "role": "ADMIN"
        }
    }
    
    response = requests.post(f"{BASE_URL}/commands", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Transcript: {result['transcript']}")
        print(f"Action: {result['structured']['action']}")
        print(f"Summary: {result['summary']}")
        print(f"Data: {json.dumps(result['structured']['data'], indent=2)}")
    else:
        print(f"Error: {response.text}")
    
    print()

def test_create_user_command():
    print("Testing text command (CREATE_USER)...")
    
    payload = {
        "tenant_id": "t_root",
        "command": "Crear usuario nuevo con DNI Juan4567",
        "user_context": {
            "user_id": "test_user",
            "role": "ADMIN"
        }
    }
    
    response = requests.post(f"{BASE_URL}/commands", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Action: {result['structured']['action']}")
        print(f"Summary: {result['summary']}")
        print(f"Data: {json.dumps(result['structured']['data'], indent=2)}")
    else:
        print(f"Error: {response.text}")
    
    print()

if __name__ == "__main__":
    try:
        test_health()
        test_text_command()
        test_create_user_command()
        print("✅ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to AI service. Make sure it's running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
