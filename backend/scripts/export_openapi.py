#!/usr/bin/env python3
"""
Export OpenAPI specification to JSON file
"""
import json
from app.main import app

def export_openapi():
    openapi_schema = app.openapi()
    
    with open('openapi.json', 'w') as f:
        json.dump(openapi_schema, f, indent=2)
    
    print("✓ OpenAPI specification exported to openapi.json")
    print(f"  Title: {openapi_schema['info']['title']}")
    print(f"  Version: {openapi_schema['info']['version']}")
    print(f"  Endpoints: {len(openapi_schema['paths'])}")

if __name__ == "__main__":
    export_openapi()
