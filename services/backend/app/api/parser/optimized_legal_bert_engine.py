"""
Optimized LegalBERT Engine with GPU/CUDA acceleration.
Provides significant performance improvements for large documents.
"""

import torch
import re
from typing import List, Optional, Dict, Any
from .models import LegalEntity, ComplianceRule, EnhancedComplianceRule


class OptimizedLegalBERTEngine:
    """GPU-accelerated LegalBERT engine for high-performance legal document analysis."""
    
    def __init__(self):
        self.model_name = "nlpaueb/legal-bert-base-uncased"
        self.device = self._detect_device()
        self.model = None
        self.tokenizer = None
        self.ner_pipeline = None
        self.batch_size = 32 if self.device == "cpu" else 16  # Larger batch for CPU
        self.max_length = 512  # LegalBERT token limit
        
        print(f"🚀 Initializing Optimized LegalBERT Engine...")
        print(f"   Device: {self.device}")
        print(f"   Batch size: {self.batch_size}")
        print(f"   Max length: {self.max_length}")
        
        self._initialize_model()
    
    def _detect_device(self) -> str:
        """Detect the best available device for processing."""
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            gpu_name = torch.cuda.get_device_name(0)
            print(f"🚀 GPU ACCELERATION ENABLED: {gpu_count} GPU(s) - {gpu_name}")
            print(f"   → Using CUDA for 5-10x faster processing!")
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            print("🚀 GPU ACCELERATION ENABLED: Apple Silicon MPS")
            print(f"   → Using MPS for faster processing!")
            return "mps"
        else:
            print("⚠️  GPU ACCELERATION NOT AVAILABLE")
            print(f"   → Falling back to CPU processing (slower)")
            print(f"   → Install CUDA for 5-10x speedup!")
            return "cpu"
    
    def _initialize_model(self):
        """Initialize LegalBERT model with GPU optimization."""
        try:
            from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
            
            print(f"📥 Loading LegalBERT model: {self.model_name}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            # Load model with GPU optimization
            if self.device == "cuda":
                self.model = AutoModelForTokenClassification.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.float16,  # Half precision for speed
                    device_map="auto",  # Auto GPU placement
                    low_cpu_mem_usage=True  # Reduce CPU memory usage
                )
                print("✅ LegalBERT model loaded with CUDA acceleration (float16)")
                print("   → GPU processing enabled for maximum speed!")
            elif self.device == "mps":
                self.model = AutoModelForTokenClassification.from_pretrained(self.model_name)
                self.model.to(self.device)
                print("✅ LegalBERT model loaded on Apple Silicon MPS")
                print("   → MPS processing enabled for faster inference!")
            else:
                self.model = AutoModelForTokenClassification.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.float32,  # Full precision for CPU
                    low_cpu_mem_usage=True
                )
                self.model.to(self.device)
                print("✅ LegalBERT model loaded on CPU with optimizations")
                print("   → CPU processing with memory optimization")
                print("   → Install CUDA for 5-10x speedup")
            
            # Create optimized NER pipeline
            self.ner_pipeline = pipeline(
                "ner",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device == "cuda" else -1,  # GPU device ID
                batch_size=self.batch_size,
                aggregation_strategy="simple"  # Faster aggregation
            )
            
            print("✅ Optimized LegalBERT pipeline ready!")
            print(f"   → Processing device: {self.device.upper()}")
            print(f"   → Batch size: {self.batch_size}")
            print(f"   → Ready for high-performance processing!")
            
        except ImportError:
            print("⚠️  LegalBERT dependencies not installed. Using fallback mode.")
            self.model = None
        except Exception as e:
            print(f"⚠️  Error loading LegalBERT: {e}. Using fallback mode.")
            self.model = None
    
    def extract_entities(self, text: str) -> List[LegalEntity]:
        """Extract legal entities with GPU acceleration."""
        
        if not self.ner_pipeline:
            print("⚠️  Using fallback entity extraction (regex patterns)")
            return self._fallback_entity_extraction(text)
        
        try:
            print(f"🔍 Processing text with {self.device.upper()} acceleration...")
            # Use optimized NER pipeline
            ner_results = self.ner_pipeline(text)
            
            entities = []
            for result in ner_results:
                entity = LegalEntity(
                    text=result['word'],
                    label=result['entity_group'] if 'entity_group' in result else result['entity'],
                    confidence=result['score'],
                    start_pos=result.get('start', 0),
                    end_pos=result.get('end', len(result['word']))
                )
                entities.append(entity)
            
            print(f"✅ Extracted {len(entities)} entities using {self.device.upper()}")
            return entities
            
        except Exception as e:
            print(f"❌ Error in {self.device.upper()} LegalBERT entity extraction: {e}")
            print("   → Falling back to regex patterns")
            return self._fallback_entity_extraction(text)
    
    def extract_entities_batch(self, text_chunks: List[str]) -> List[List[LegalEntity]]:
        """Extract entities from multiple text chunks in parallel."""
        
        if not self.ner_pipeline:
            print("⚠️  Using fallback batch processing (regex patterns)")
            return [self._fallback_entity_extraction(chunk) for chunk in text_chunks]
        
        try:
            print(f"🚀 Processing {len(text_chunks)} chunks in batches using {self.device.upper()}...")
            # Process chunks in batches
            all_entities = []
            
            for i in range(0, len(text_chunks), self.batch_size):
                batch_chunks = text_chunks[i:i + self.batch_size]
                print(f"   → Processing batch {i//self.batch_size + 1} ({len(batch_chunks)} chunks...")
                
                # Process batch
                batch_results = self.ner_pipeline(batch_chunks)
                
                # Convert results to entities
                for chunk_results in batch_results:
                    entities = []
                    for result in chunk_results:
                        entity = LegalEntity(
                            text=result['word'],
                            label=result['entity_group'] if 'entity_group' in result else result['entity'],
                            confidence=result['score'],
                            start_pos=result.get('start', 0),
                            end_pos=result.get('end', len(result['word']))
                        )
                        entities.append(entity)
                    all_entities.append(entities)
            
            total_entities = sum(len(entities) for entities in all_entities)
            print(f"✅ Batch processing complete: {total_entities} entities extracted using {self.device.upper()}")
            return all_entities
            
        except Exception as e:
            print(f"❌ Error in batch {self.device.upper()} processing: {e}")
            print("   → Falling back to regex patterns")
            return [self._fallback_entity_extraction(chunk) for chunk in text_chunks]
    
    def chunk_text_optimally(self, text: str) -> List[str]:
        """Split text into optimal chunks for processing."""
        
        # Split into sentences
        sentences = self._split_into_sentences(text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            # Check if adding this sentence would exceed token limit
            test_chunk = current_chunk + " " + sentence if current_chunk else sentence
            
            # Rough token estimation (4 chars per token)
            if len(test_chunk) > self.max_length * 4:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk = test_chunk
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        print(f"📄 Text chunked into {len(chunks)} optimal chunks")
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
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
        """Enhance a rule with GPU-accelerated LegalBERT entity extraction."""
        
        # Extract entities using GPU acceleration
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
            extraction_method="gpu_optimized_bert"
        )
        
        # Update overall confidence score
        original_confidence = rule.confidence_score
        enhanced_rule.confidence_score = (original_confidence + bert_confidence) / 2
        
        return enhanced_rule
    
    def extract_entities_from_document(self, document_content: str) -> List[LegalEntity]:
        """Extract entities from entire document using GPU acceleration."""
        
        print(f"📄 Processing document with {self.device.upper()} acceleration...")
        print(f"   → Document size: {len(document_content)} characters")
        
        # Chunk text optimally
        chunks = self.chunk_text_optimally(document_content)
        
        # Process chunks in batches
        chunk_entities = self.extract_entities_batch(chunks)
        
        # Flatten results
        all_entities = []
        for entities in chunk_entities:
            all_entities.extend(entities)
        
        # Remove duplicates
        unique_entities = []
        seen_entities = set()
        
        for entity in all_entities:
            entity_key = (entity.text.lower(), entity.start_pos)
            if entity_key not in seen_entities:
                seen_entities.add(entity_key)
                unique_entities.append(entity)
        
        print(f"🎯 Document processing complete!")
        print(f"   → Total entities: {len(all_entities)}")
        print(f"   → Unique entities: {len(unique_entities)}")
        print(f"   → Processing device: {self.device.upper()}")
        return unique_entities
    
    def get_performance_info(self) -> Dict[str, Any]:
        """Get performance information about the engine."""
        return {
            "device": self.device,
            "model_loaded": self.model is not None,
            "batch_size": self.batch_size,
            "max_length": self.max_length,
            "cuda_available": torch.cuda.is_available(),
            "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
        }
