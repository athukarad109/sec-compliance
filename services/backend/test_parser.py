#!/usr/bin/env python3
"""
Test script for the Legal Parser Engine
This script demonstrates how to use the parser API endpoints.
"""

import requests
import json
import time
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8001"

def test_parser():
    """Test the parser with the sample document."""
    
    print("🧪 Testing Legal Parser Engine")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health/")
        print(f"✅ Health check: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure to start the server first:")
        print("   cd services/backend")
        print("   uvicorn app.main:app --reload")
        return
    
    # Upload sample document
    print("\n2. Uploading sample document...")
    sample_file = Path("test_documents/sample_sec_compliance.txt")
    
    if not sample_file.exists():
        print(f"❌ Sample file not found: {sample_file}")
        return
    
    with open(sample_file, 'rb') as f:
        files = {'file': ('sample_sec_compliance.txt', f, 'text/plain')}
        response = requests.post(f"{BASE_URL}/parser/upload-document", files=files)
    
    if response.status_code == 200:
        upload_data = response.json()
        document_id = upload_data['document_id']
        print(f"✅ Document uploaded successfully!")
        print(f"   Document ID: {document_id}")
        print(f"   Filename: {upload_data['filename']}")
        print(f"   File size: {upload_data['file_size']} bytes")
    else:
        print(f"❌ Upload failed: {response.status_code} - {response.text}")
        return
    
    # Extract rules
    print("\n3. Extracting rules from document...")
    response = requests.post(f"{BASE_URL}/parser/extract-rules/{document_id}")
    
    if response.status_code == 200:
        extraction_data = response.json()
        rules = extraction_data['rules']
        print(f"✅ Rules extracted successfully!")
        print(f"   Total rules found: {extraction_data['total_rules']}")
        print(f"   Processing time: {extraction_data['processing_time']:.2f} seconds")
        
        # Display extracted rules
        print("\n4. Extracted Rules:")
        print("-" * 30)
        for i, rule in enumerate(rules, 1):
            print(f"\nRule {i}: {rule['title']}")
            print(f"  Type: {rule['rule_type']}")
            print(f"  Description: {rule['description'][:100]}...")
            print(f"  Confidence: {rule['confidence_score']:.2f}")
            
            if rule['requirements']:
                req = rule['requirements'][0]
                print(f"  Action: {req['action']}")
                if req['deadline']:
                    print(f"  Deadline: {req['deadline']}")
                if req['entities']:
                    print(f"  Entities: {', '.join(req['entities'])}")
            
            if rule['penalties']:
                penalties = rule['penalties']
                if penalties.get('late_filing'):
                    print(f"  Penalty: {penalties['late_filing']}")
    else:
        print(f"❌ Rule extraction failed: {response.status_code} - {response.text}")
        return
    
    # Test rule search
    print("\n5. Testing rule search...")
    response = requests.get(f"{BASE_URL}/parser/rules?query=quarterly")
    
    if response.status_code == 200:
        search_results = response.json()
        print(f"✅ Search completed! Found {len(search_results)} rules matching 'quarterly'")
    else:
        print(f"❌ Search failed: {response.status_code} - {response.text}")
    
    # Get parser statistics
    print("\n6. Parser Statistics:")
    response = requests.get(f"{BASE_URL}/parser/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistics retrieved:")
        print(f"   Total documents: {stats['total_documents']}")
        print(f"   Processed documents: {stats['processed_documents']}")
        print(f"   Total rules: {stats['total_rules']}")
        print(f"   Rule types: {stats['rule_types']}")
        print(f"   Average confidence: {stats['average_confidence']:.3f}")
    
    print("\n🎉 Parser test completed successfully!")
    print("\nYou can also test the API interactively at:")
    print(f"   {BASE_URL}/docs")

if __name__ == "__main__":
    test_parser()
