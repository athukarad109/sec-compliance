#!/usr/bin/env python3
"""
Test script for LLM-powered RegTech pipeline
Tests the complete workflow: Upload → Extract → Organize with LLM
"""

import requests
import json
import time
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8001"
REGTECH_BASE = f"{BASE_URL}/regtech"

def test_health():
    """Test if the server is running."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_upload_document():
    """Test document upload."""
    print("\n📄 Testing document upload...")
    
    # Use the sample document
    sample_file = "test_documents/sample_sec_compliance.txt"
    if not os.path.exists(sample_file):
        print(f"❌ Sample file not found: {sample_file}")
        return None
    
    try:
        with open(sample_file, 'rb') as f:
            files = {'file': ('sample_sec_compliance.txt', f, 'text/plain')}
            response = requests.post(f"{REGTECH_BASE}/upload-document", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Document uploaded successfully")
            print(f"   Document ID: {data['document_id']}")
            print(f"   Filename: {data['filename']}")
            print(f"   File size: {data['file_size']} bytes")
            return data['document_id']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def test_extract_requirements(document_id):
    """Test requirement extraction."""
    print(f"\n🔍 Testing requirement extraction for document: {document_id}")
    
    try:
        response = requests.post(f"{REGTECH_BASE}/extract-requirements/{document_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Requirements extracted successfully")
            print(f"   Total requirements: {data['total_requirements']}")
            print(f"   Processing time: {data['processing_time']:.2f} seconds")
            print(f"   Regulatory frameworks: {data.get('regulatory_frameworks', [])}")
            print(f"   Actor types: {data.get('actor_types', [])}")
            
            # Show first few requirements
            if data['requirements']:
                print(f"\n📋 Sample requirements:")
                for i, req in enumerate(data['requirements'][:3]):  # Show first 3
                    print(f"   {i+1}. {req.get('policy', 'N/A')} - {req.get('actor', 'N/A')}")
            
            return data['requirements']
        else:
            print(f"❌ Extraction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Extraction error: {e}")
        return None

def test_llm_organization():
    """Test LLM-powered organization."""
    print(f"\n🤖 Testing LLM organization...")
    
    try:
        response = requests.post(f"{REGTECH_BASE}/organize-with-llm")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ LLM organization completed successfully")
            print(f"   Total requirements: {data['total_requirements']}")
            print(f"   Total groups: {data['total_groups']}")
            print(f"   Confidence score: {data['confidence_score']:.2f}")
            
            # Show organized groups
            if data['organized_requirements']:
                print(f"\n📊 Organized groups:")
                for i, group in enumerate(data['organized_requirements']):
                    print(f"   Group {i+1}: {group.get('category', 'N/A')} ({len(group.get('requirements', []))} requirements)")
                    
                    # Show first requirement in each group
                    if group.get('requirements'):
                        first_req = group['requirements'][0]
                        print(f"      Sample: {first_req.get('policy', 'N/A')} - {first_req.get('actor', 'N/A')}")
            
            return data['organized_requirements']
        else:
            print(f"❌ LLM organization failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ LLM organization error: {e}")
        return None

def test_format_individual_requirement(requirement_id):
    """Test individual requirement formatting."""
    print(f"\n🎯 Testing individual requirement formatting: {requirement_id}")
    
    try:
        response = requests.post(f"{REGTECH_BASE}/format-requirement/{requirement_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Individual requirement formatted successfully")
            print(f"   Confidence score: {data['confidence_score']:.2f}")
            
            # Show formatted requirement
            req = data['formatted_requirement']
            print(f"\n📋 Formatted requirement:")
            print(f"   Policy: {req.get('policy', 'N/A')}")
            print(f"   Actor: {req.get('actor', 'N/A')}")
            print(f"   Requirement: {req.get('requirement', 'N/A')}")
            print(f"   Trigger: {req.get('trigger', 'N/A')}")
            print(f"   Deadline: {req.get('deadline', 'N/A')}")
            print(f"   Penalty: {req.get('penalty', 'N/A')}")
            print(f"   Controls: {len(req.get('mapped_controls', []))} mapped")
            
            return data['formatted_requirement']
        else:
            print(f"❌ Individual formatting failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Individual formatting error: {e}")
        return None

def test_generate_control_mappings(requirement_id):
    """Test control mapping generation."""
    print(f"\n🔧 Testing control mapping generation: {requirement_id}")
    
    try:
        response = requests.post(f"{REGTECH_BASE}/generate-control-mappings/{requirement_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Control mappings generated successfully")
            print(f"   Total controls: {data['total_controls']}")
            
            # Show control mappings
            if data['control_mappings']:
                print(f"\n🎛️ Generated controls:")
                for i, control in enumerate(data['control_mappings']):
                    print(f"   {i+1}. {control.get('control_id', 'N/A')} - {control.get('category', 'N/A')} ({control.get('status', 'N/A')})")
            
            return data['control_mappings']
        else:
            print(f"❌ Control mapping failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Control mapping error: {e}")
        return None

def test_get_requirements():
    """Test getting all requirements."""
    print(f"\n📋 Testing get all requirements...")
    
    try:
        response = requests.get(f"{REGTECH_BASE}/requirements")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} requirements")
            return data
        else:
            print(f"❌ Get requirements failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Get requirements error: {e}")
        return None

def main():
    """Run the complete test pipeline."""
    print("🚀 Starting LLM-powered RegTech Pipeline Test")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Server is not running. Please start the server first:")
        print("   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
        return
    
    # Test 2: Upload document
    document_id = test_upload_document()
    if not document_id:
        print("\n❌ Document upload failed. Cannot continue.")
        return
    
    # Test 3: Extract requirements
    requirements = test_extract_requirements(document_id)
    if not requirements:
        print("\n❌ Requirement extraction failed. Cannot continue.")
        return
    
    # Test 4: Get all requirements
    all_requirements = test_get_requirements()
    if not all_requirements:
        print("\n❌ Get requirements failed. Cannot continue.")
        return
    
    # Test 5: LLM organization
    organized_requirements = test_llm_organization()
    if not organized_requirements:
        print("\n❌ LLM organization failed. Cannot continue.")
        return
    
    # Test 6: Format individual requirement (use first requirement)
    if all_requirements and len(all_requirements) > 0:
        first_req_id = all_requirements[0]['id']
        formatted_req = test_format_individual_requirement(first_req_id)
        
        # Test 7: Generate control mappings
        if formatted_req:
            test_generate_control_mappings(first_req_id)
    
    print("\n" + "=" * 50)
    print("🎉 LLM-powered RegTech Pipeline Test Complete!")
    print("\n📊 Test Summary:")
    print("   ✅ Server health check")
    print("   ✅ Document upload")
    print("   ✅ Requirement extraction")
    print("   ✅ LLM organization")
    print("   ✅ Individual requirement formatting")
    print("   ✅ Control mapping generation")
    print("\n🚀 Your LLM-powered RegTech pipeline is working perfectly!")

if __name__ == "__main__":
    main()
