#!/usr/bin/env python3
"""
Direct test of the parser engine without requiring the server to be running.
"""

from app.api.parser.document_extractor import DocumentExtractor
from app.api.parser.parser_engine import LegalParserEngine
from app.api.parser.models import DocumentType
from pathlib import Path

def test_parser_direct():
    """Test the parser engine directly."""
    
    print("🧪 Testing Legal Parser Engine (Direct)")
    print("=" * 50)
    
    # Initialize components
    document_extractor = DocumentExtractor()
    parser_engine = LegalParserEngine()
    
    # Test with sample document
    sample_file = Path("test_documents/sample_sec_compliance.txt")
    
    if not sample_file.exists():
        print(f"❌ Sample file not found: {sample_file}")
        return
    
    print("\n1. Reading sample document...")
    try:
        with open(sample_file, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"✅ Document read successfully ({len(content)} characters)")
    except Exception as e:
        print(f"❌ Error reading document: {e}")
        return
    
    print("\n2. Creating document record...")
    try:
        from app.api.parser.models import LegalDocument
        import uuid
        from datetime import datetime
        
        document = LegalDocument(
            id=str(uuid.uuid4()),
            filename="sample_sec_compliance.txt",
            content=content,
            document_type=DocumentType.TXT,
            file_size=len(content.encode('utf-8'))
        )
        print(f"✅ Document record created: {document.id}")
    except Exception as e:
        print(f"❌ Error creating document record: {e}")
        return
    
    print("\n3. Extracting rules...")
    try:
        import time
        start_time = time.time()
        rules = parser_engine.extract_rules(document)
        processing_time = time.time() - start_time
        
        print(f"✅ Rules extracted successfully!")
        print(f"   Total rules found: {len(rules)}")
        print(f"   Processing time: {processing_time:.2f} seconds")
        
        # Display extracted rules
        print("\n4. Extracted Rules:")
        print("-" * 30)
        for i, rule in enumerate(rules, 1):
            print(f"\nRule {i}: {rule.title}")
            print(f"  Type: {rule.rule_type}")
            print(f"  Description: {rule.description[:100]}...")
            print(f"  Confidence: {rule.confidence_score:.2f}")
            
            if rule.requirements:
                req = rule.requirements[0]
                print(f"  Action: {req.action}")
                if req.deadline:
                    print(f"  Deadline: {req.deadline}")
                if req.entities:
                    print(f"  Entities: {', '.join(req.entities)}")
            
            if rule.penalties:
                penalties = rule.penalties
                if penalties.late_filing:
                    print(f"  Penalty: {penalties.late_filing}")
        
        # Test rule search
        print("\n5. Testing rule search...")
        quarterly_rules = [rule for rule in rules if 'quarterly' in rule.description.lower()]
        print(f"✅ Found {len(quarterly_rules)} rules containing 'quarterly'")
        
        # Show statistics
        print("\n6. Parser Statistics:")
        rule_types = {}
        for rule in rules:
            rule_type = rule.rule_type.value
            rule_types[rule_type] = rule_types.get(rule_type, 0) + 1
        
        avg_confidence = sum(rule.confidence_score for rule in rules) / len(rules) if rules else 0
        
        print(f"   Total rules: {len(rules)}")
        print(f"   Rule types: {rule_types}")
        print(f"   Average confidence: {avg_confidence:.3f}")
        
    except Exception as e:
        print(f"❌ Error extracting rules: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n🎉 Parser test completed successfully!")
    print("\nThe parser is working correctly. You can now start the server with:")
    print("   uvicorn app.main:app --reload")

if __name__ == "__main__":
    test_parser_direct()
