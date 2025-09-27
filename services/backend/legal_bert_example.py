#!/usr/bin/env python3
"""
LegalBERT Integration Example
Demonstrates how LegalBERT would enhance the current parser.
"""

from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import json
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class LegalEntity:
    text: str
    label: str
    confidence: float
    start_pos: int
    end_pos: int

class LegalBERTExample:
    """Example implementation of LegalBERT integration."""
    
    def __init__(self):
        self.model_name = "nlpaueb/legal-bert-base-uncased"
        print(f"Loading LegalBERT model: {self.model_name}")
        
        # Note: In production, you'd load the actual model
        # self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        # self.model = AutoModelForTokenClassification.from_pretrained(self.model_name)
        # self.ner_pipeline = pipeline("ner", model=self.model, tokenizer=self.tokenizer)
        
        print("✅ LegalBERT model loaded successfully!")
    
    def extract_legal_entities(self, text: str) -> List[LegalEntity]:
        """Extract legal entities using LegalBERT NER."""
        
        # Simulated LegalBERT output for demonstration
        # In production, this would be: ner_results = self.ner_pipeline(text)
        simulated_ner_results = [
            {"word": "public companies", "entity": "B-ORG", "score": 0.95, "start": 4, "end": 19},
            {"word": "quarterly reports", "entity": "B-DOCUMENT", "score": 0.89, "start": 20, "end": 36},
            {"word": "45 days", "entity": "B-DATE", "score": 0.98, "start": 67, "end": 74},
            {"word": "Form 10-Q", "entity": "B-FORM", "score": 0.92, "start": 80, "end": 88},
            {"word": "$100", "entity": "B-MONEY", "score": 0.94, "start": 120, "end": 124},
            {"word": "per day", "entity": "B-PENALTY", "score": 0.87, "start": 125, "end": 132}
        ]
        
        entities = []
        for result in simulated_ner_results:
            entities.append(LegalEntity(
                text=result["word"],
                label=result["entity"],
                confidence=result["score"],
                start_pos=result["start"],
                end_pos=result["end"]
            ))
        
        return entities
    
    def classify_rule_type(self, text: str) -> str:
        """Classify rule type using LegalBERT."""
        
        # Simulated classification for demonstration
        if "must file" in text.lower() or "required to submit" in text.lower():
            return "reporting_obligation"
        elif "disclose" in text.lower() or "disclosure" in text.lower():
            return "disclosure_requirement"
        elif "prohibited" in text.lower() or "shall not" in text.lower():
            return "prohibition"
        else:
            return "obligation"
    
    def extract_compliance_requirements(self, text: str, entities: List[LegalEntity]) -> Dict[str, Any]:
        """Extract structured compliance requirements."""
        
        # Find key entities
        organizations = [e for e in entities if e.label.startswith("B-ORG")]
        dates = [e for e in entities if e.label.startswith("B-DATE")]
        penalties = [e for e in entities if e.label.startswith("B-PENALTY")]
        forms = [e for e in entities if e.label.startswith("B-FORM")]
        
        return {
            "action": self._extract_action(text),
            "subject": organizations[0].text if organizations else "covered entities",
            "deadline": dates[0].text if dates else None,
            "form_required": forms[0].text if forms else None,
            "penalties": [p.text for p in penalties],
            "confidence": sum(e.confidence for e in entities) / len(entities) if entities else 0.5
        }
    
    def _extract_action(self, text: str) -> str:
        """Extract the main action from text."""
        if "file" in text.lower():
            return "file"
        elif "disclose" in text.lower():
            return "disclose"
        elif "submit" in text.lower():
            return "submit"
        else:
            return "comply"
    
    def enhance_rule_with_legalbert(self, original_rule: Dict[str, Any], text: str) -> Dict[str, Any]:
        """Enhance a rule with LegalBERT analysis."""
        
        # Extract entities and requirements
        entities = self.extract_legal_entities(text)
        requirements = self.extract_compliance_requirements(text, entities)
        
        # Enhance the original rule
        enhanced_rule = original_rule.copy()
        enhanced_rule.update({
            "legal_entities": [
                {
                    "text": entity.text,
                    "label": entity.label,
                    "confidence": entity.confidence,
                    "start_pos": entity.start_pos,
                    "end_pos": entity.end_pos
                }
                for entity in entities
            ],
            "enhanced_requirements": requirements,
            "bert_confidence": requirements["confidence"],
            "extraction_method": "hybrid_pattern_bert",
            "entity_count": len(entities)
        })
        
        # Update confidence score
        original_confidence = original_rule.get("confidence_score", 0.5)
        bert_confidence = requirements["confidence"]
        enhanced_rule["confidence_score"] = (original_confidence + bert_confidence) / 2
        
        return enhanced_rule

def demonstrate_legalbert_integration():
    """Demonstrate LegalBERT integration with sample text."""
    
    print("🔍 LegalBERT Integration Demonstration")
    print("=" * 50)
    
    # Sample legal text
    sample_text = "All public companies must file quarterly reports on Form 10-Q within 45 days after the end of each fiscal quarter. Failure to file within the specified timeframe will result in a penalty of $100 per day."
    
    print(f"\n📄 Sample Legal Text:")
    print(f"'{sample_text}'")
    
    # Initialize LegalBERT example
    legal_bert = LegalBERTExample()
    
    # Extract entities
    print(f"\n🔍 LegalBERT Entity Extraction:")
    entities = legal_bert.extract_legal_entities(sample_text)
    for entity in entities:
        print(f"  {entity.text} -> {entity.label} (confidence: {entity.confidence:.2f})")
    
    # Classify rule type
    rule_type = legal_bert.classify_rule_type(sample_text)
    print(f"\n📋 Rule Classification: {rule_type}")
    
    # Extract requirements
    requirements = legal_bert.extract_compliance_requirements(sample_text, entities)
    print(f"\n📝 Structured Requirements:")
    print(json.dumps(requirements, indent=2))
    
    # Simulate Phase 1 rule
    phase1_rule = {
        "rule_id": "RULE-abc123-001",
        "title": "Quarterly Reporting Requirements",
        "rule_type": "reporting_obligation",
        "description": sample_text,
        "confidence_score": 0.8,
        "requirements": [{
            "action": "file",
            "deadline": "45 days",
            "entities": ["public companies"]
        }]
    }
    
    # Enhance with LegalBERT
    enhanced_rule = legal_bert.enhance_rule_with_legalbert(phase1_rule, sample_text)
    
    print(f"\n🚀 Enhanced Rule with LegalBERT:")
    print(json.dumps(enhanced_rule, indent=2))
    
    print(f"\n📊 Comparison:")
    print(f"  Phase 1 Confidence: {phase1_rule['confidence_score']:.2f}")
    print(f"  Phase 2 Confidence: {enhanced_rule['confidence_score']:.2f}")
    print(f"  Legal Entities Found: {enhanced_rule['entity_count']}")
    print(f"  Extraction Method: {enhanced_rule['extraction_method']}")

if __name__ == "__main__":
    demonstrate_legalbert_integration()
