"""
LegalBERT Engine for enhanced legal document analysis.
Quick hackathon implementation focusing on entity extraction.
"""

import re
from typing import List, Optional
from .models import LegalEntity, ComplianceRule, EnhancedComplianceRule


class LegalBERTEngine:
    """Simple LegalBERT wrapper for entity extraction."""
    
    def __init__(self):
        self.model_name = "nlpaueb/legal-bert-base-uncased"
        self.model = None
        self.tokenizer = None
        self.ner_pipeline = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize LegalBERT model and tokenizer."""
        try:
            from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
            
            print(f"Loading LegalBERT model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForTokenClassification.from_pretrained(self.model_name)
            self.ner_pipeline = pipeline("ner", model=self.model, tokenizer=self.tokenizer)
            print("✅ LegalBERT model loaded successfully!")
            
        except ImportError:
            print("⚠️  LegalBERT dependencies not installed. Using fallback mode.")
            self.model = None
        except Exception as e:
            print(f"⚠️  Error loading LegalBERT: {e}. Using fallback mode.")
            self.model = None
    
    def extract_entities(self, text: str) -> List[LegalEntity]:
        """Extract legal entities from text using LegalBERT."""
        
        if not self.ner_pipeline:
            return self._fallback_entity_extraction(text)
        
        try:
            # Use LegalBERT NER pipeline
            ner_results = self.ner_pipeline(text)
            
            entities = []
            for result in ner_results:
                # Convert to our LegalEntity format
                entity = LegalEntity(
                    text=result['word'],
                    label=result['entity'],
                    confidence=result['score'],
                    start_pos=result.get('start', 0),
                    end_pos=result.get('end', len(result['word']))
                )
                entities.append(entity)
            
            return entities
            
        except Exception as e:
            print(f"Error in LegalBERT entity extraction: {e}")
            return self._fallback_entity_extraction(text)
    
    def _fallback_entity_extraction(self, text: str) -> List[LegalEntity]:
        """Fallback entity extraction using regex patterns."""
        
        entities = []
        
        # Organization patterns
        org_patterns = [
            r'\b(?:public companies?|issuers?|registrants?|filing entities?)\b',
            r'\b(?:SEC|Securities and Exchange Commission)\b',
            r'\b(?:[A-Z][a-z]+ (?:Corporation|Company|Inc|LLC))\b'
        ]
        
        # Date patterns
        date_patterns = [
            r'\b\d+\s*days?\b',
            r'\b\d+\s*business days?\b',
            r'\bwithin \d+\s*days?\b'
        ]
        
        # Money patterns
        money_patterns = [
            r'\$\d+(?:,\d{3})*(?:\.\d{2})?',
            r'\b\d+(?:,\d{3})*(?:\.\d{2})?\s*dollars?\b'
        ]
        
        # Form patterns
        form_patterns = [
            r'\bForm \d+[A-Z]?\b',
            r'\b(?:10-K|10-Q|8-K|S-1|S-3)\b'
        ]
        
        # Extract entities using patterns
        for pattern in org_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append(LegalEntity(
                    text=match.group(),
                    label="ORG",
                    confidence=0.8,
                    start_pos=match.start(),
                    end_pos=match.end()
                ))
        
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append(LegalEntity(
                    text=match.group(),
                    label="DATE",
                    confidence=0.9,
                    start_pos=match.start(),
                    end_pos=match.end()
                ))
        
        for pattern in money_patterns:
            for match in re.finditer(pattern, text):
                entities.append(LegalEntity(
                    text=match.group(),
                    label="MONEY",
                    confidence=0.85,
                    start_pos=match.start(),
                    end_pos=match.end()
                ))
        
        for pattern in form_patterns:
            for match in re.finditer(pattern, text):
                entities.append(LegalEntity(
                    text=match.group(),
                    label="FORM",
                    confidence=0.9,
                    start_pos=match.start(),
                    end_pos=match.end()
                ))
        
        return entities
    
    def enhance_rule(self, rule: ComplianceRule, text: str) -> EnhancedComplianceRule:
        """Enhance a rule with LegalBERT entity extraction."""
        
        # Extract entities
        entities = self.extract_entities(text)
        
        # Calculate BERT confidence
        bert_confidence = 0.5
        if entities:
            bert_confidence = sum(entity.confidence for entity in entities) / len(entities)
        
        # Create enhanced rule
        enhanced_rule = EnhancedComplianceRule(
            **rule.dict(),  # Copy all original rule fields
            legal_entities=entities,
            bert_confidence=bert_confidence,
            extraction_method="hybrid_pattern_bert"
        )
        
        # Update overall confidence score
        original_confidence = rule.confidence_score
        enhanced_rule.confidence_score = (original_confidence + bert_confidence) / 2
        
        return enhanced_rule
    
    def extract_entities_from_document(self, document_content: str) -> List[LegalEntity]:
        """Extract entities from entire document."""
        
        # Split into sentences for better processing
        sentences = re.split(r'[.!?]+', document_content)
        all_entities = []
        
        for sentence in sentences:
            if sentence.strip():
                entities = self.extract_entities(sentence.strip())
                all_entities.extend(entities)
        
        # Remove duplicates
        unique_entities = []
        seen_entities = set()
        
        for entity in all_entities:
            entity_key = (entity.text.lower(), entity.start_pos)
            if entity_key not in seen_entities:
                seen_entities.add(entity_key)
                unique_entities.append(entity)
        
        return unique_entities
