"""
Enhanced Parser Engine for RegTech Compliance Requirements
Extracts structured compliance requirements in the new JSON format
"""

import re
import uuid
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import spacy
from transformers import pipeline

from .models_v3 import (
    ComplianceRequirement, 
    MappedControl, 
    ControlCategory, 
    ControlStatus
)

class EnhancedComplianceParser:
    """Enhanced parser for extracting structured compliance requirements."""
    
    def __init__(self):
        self.nlp = None
        self.classifier = None
        self._initialize_models()
        
        # Enhanced patterns for RegTech structure
        self.policy_patterns = [
            r'(?:Securities Exchange Act of \d{4}|Exchange Act)',
            r'(?:Securities Act of \d{4}|Securities Act)',
            r'(?:Sarbanes-Oxley Act|SOX)',
            r'(?:Dodd-Frank Act|Dodd-Frank)',
            r'(?:Investment Company Act of \d{4})',
            r'(?:Investment Advisers Act of \d{4})',
            r'(?:Section \d+[a-z]? of [^,]+)',
            r'(?:Rule \d+-\d+[a-z]?)',
            r'(?:Regulation [A-Z]+)',
            r'(?:Form \d+-[A-Z])',
            r'(?:17 CFR \d+\.\d+)',
            r'(?:OMB Number \d+-\d+)'
        ]
        
        self.actor_patterns = [
            r'(?:beneficial owner(?:s)? of (?:more than )?\d+% equity security)',
            r'(?:executive officer(?:s)?)',
            r'(?:director(?:s)?)',
            r'(?:registrant(?:s)?)',
            r'(?:issuer(?:s)?)',
            r'(?:reporting company(?:ies)?)',
            r'(?:public company(?:ies)?)',
            r'(?:accelerated filer(?:s)?)',
            r'(?:large accelerated filer(?:s)?)',
            r'(?:smaller reporting company(?:ies)?)',
            r'(?:foreign private issuer(?:s)?)',
            r'(?:asset-backed issuer(?:s)?)',
            r'(?:investment company(?:ies)?)',
            r'(?:investment adviser(?:s)?)',
            r'(?:broker-dealer(?:s)?)',
            r'(?:transfer agent(?:s)?)',
            r'(?:clearing agency(?:ies)?)',
            r'(?:self-regulatory organization(?:s)?)',
            r'(?:covered person(?:s)?)',
            r'(?:covered entity(?:ies)?)'
        ]
        
        self.requirement_patterns = [
            r'(?:file|furnish|submit|provide|disclose|report|maintain|establish|implement)',
            r'(?:annual report(?:s)?)',
            r'(?:quarterly report(?:s)?)',
            r'(?:current report(?:s)?)',
            r'(?:proxy statement(?:s)?)',
            r'(?:information statement(?:s)?)',
            r'(?:ownership disclosure)',
            r'(?:beneficial ownership)',
            r'(?:insider trading)',
            r'(?:financial statement(?:s)?)',
            r'(?:internal control(?:s)?)',
            r'(?:risk management)',
            r'(?:governance)',
            r'(?:compliance)',
            r'(?:audit)',
            r'(?:certification)',
            r'(?:attestation)',
            r'(?:disclosure)',
            r'(?:transparency)',
            r'(?:accountability)'
        ]
        
        self.trigger_patterns = [
            r'(?:within \d+ days? of)',
            r'(?:at the time of)',
            r'(?:upon)',
            r'(?:when)',
            r'(?:if)',
            r'(?:unless)',
            r'(?:prior to)',
            r'(?:after)',
            r'(?:before)',
            r'(?:during)',
            r'(?:following)',
            r'(?:subsequent to)',
            r'(?:in connection with)',
            r'(?:as a result of)',
            r'(?:in the event of)',
            r'(?:in case of)',
            r'(?:subject to)',
            r'(?:contingent upon)',
            r'(?:dependent upon)',
            r'(?:conditional upon)'
        ]
        
        self.deadline_patterns = [
            r'(?:\d+ days? (?:after|before|of|from))',
            r'(?:within \d+ days?)',
            r'(?:no later than \d+ days?)',
            r'(?:by \d+ days?)',
            r'(?:within \d+ months?)',
            r'(?:annually)',
            r'(?:quarterly)',
            r'(?:monthly)',
            r'(?:weekly)',
            r'(?:daily)',
            r'(?:immediately)',
            r'(?:promptly)',
            r'(?:as soon as practicable)',
            r'(?:in a timely manner)',
            r'(?:without delay)',
            r'(?:forthwith)',
            r'(?:expeditiously)',
            r'(?:swiftly)',
            r'(?:quickly)',
            r'(?:rapidly)'
        ]
        
        self.penalty_patterns = [
            r'(?:penalty|penalties)',
            r'(?:fine|fines)',
            r'(?:sanction|sanctions)',
            r'(?:enforcement action)',
            r'(?:civil penalty)',
            r'(?:criminal penalty)',
            r'(?:administrative penalty)',
            r'(?:monetary penalty)',
            r'(?:non-monetary penalty)',
            r'(?:suspension)',
            r'(?:revocation)',
            r'(?:disqualification)',
            r'(?:cease and desist)',
            r'(?:injunction)',
            r'(?:restraining order)',
            r'(?:temporary restraining order)',
            r'(?:preliminary injunction)',
            r'(?:permanent injunction)',
            r'(?:consent decree)',
            r'(?:settlement)'
        ]
    
    def _initialize_models(self):
        """Initialize NLP models."""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
            print("✅ spaCy model loaded successfully")
        except OSError:
            print("⚠️ spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        try:
            # Load BERT classifier for requirement classification
            self.classifier = pipeline(
                "text-classification",
                model="nlpaueb/legal-bert-base-uncased",
                return_all_scores=True
            )
            print("✅ LegalBERT classifier loaded successfully")
        except Exception as e:
            print(f"⚠️ LegalBERT classifier not available: {e}")
            self.classifier = None
    
    def extract_compliance_requirements(self, text: str) -> List[ComplianceRequirement]:
        """Extract compliance requirements in the new RegTech structure."""
        requirements = []
        
        # Split text into sentences
        sentences = self._split_into_sentences(text)
        
        for sentence in sentences:
            # Check if sentence contains compliance requirements
            if self._is_compliance_requirement(sentence):
                requirement = self._extract_requirement_from_sentence(sentence)
                if requirement:
                    requirements.append(requirement)
        
        return requirements
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        if self.nlp:
            doc = self.nlp(text)
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
        else:
            # Fallback to regex-based sentence splitting
            sentences = re.split(r'[.!?]+', text)
            return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def _is_compliance_requirement(self, sentence: str) -> bool:
        """Check if sentence contains compliance requirements."""
        sentence_lower = sentence.lower()
        
        # Check for requirement indicators
        requirement_indicators = [
            'must', 'shall', 'will', 'required', 'obligated', 'mandated',
            'file', 'furnish', 'submit', 'provide', 'disclose', 'report',
            'maintain', 'establish', 'implement', 'ensure', 'guarantee'
        ]
        
        return any(indicator in sentence_lower for indicator in requirement_indicators)
    
    def _extract_requirement_from_sentence(self, sentence: str) -> Optional[ComplianceRequirement]:
        """Extract structured requirement from sentence."""
        try:
            # Extract policy
            policy = self._extract_policy(sentence)
            
            # Extract actor
            actor = self._extract_actor(sentence)
            
            # Extract requirement
            requirement = self._extract_requirement_text(sentence)
            
            # Extract trigger
            trigger = self._extract_trigger(sentence)
            
            # Extract deadline
            deadline = self._extract_deadline(sentence)
            
            # Extract penalty
            penalty = self._extract_penalty(sentence)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(sentence, policy, actor, requirement)
            
            # Generate mapped controls
            mapped_controls = self._generate_mapped_controls(requirement, policy)
            
            return ComplianceRequirement(
                policy=policy,
                actor=actor,
                requirement=requirement,
                trigger=trigger,
                deadline=deadline,
                penalty=penalty,
                mapped_controls=mapped_controls,
                confidence_score=confidence,
                source_text=sentence,
                regulatory_framework=self._identify_regulatory_framework(policy),
                risk_level=self._assess_risk_level(penalty, deadline),
                business_impact=self._assess_business_impact(requirement, actor)
            )
            
        except Exception as e:
            print(f"Error extracting requirement from sentence: {e}")
            return None
    
    def _extract_policy(self, sentence: str) -> str:
        """Extract regulatory policy from sentence."""
        for pattern in self.policy_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                return match.group(0)
        
        # Fallback: extract any section reference
        section_match = re.search(r'(?:Section|Rule|Regulation)\s+\d+[a-z]?', sentence, re.IGNORECASE)
        if section_match:
            return section_match.group(0)
        
        return "General Compliance Requirement"
    
    def _extract_actor(self, sentence: str) -> str:
        """Extract responsible actor from sentence."""
        for pattern in self.actor_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                return match.group(0)
        
        # Fallback: extract any entity reference
        entity_match = re.search(r'(?:company|corporation|entity|person|individual|organization)', sentence, re.IGNORECASE)
        if entity_match:
            return entity_match.group(0)
        
        return "Covered Entity"
    
    def _extract_requirement_text(self, sentence: str) -> str:
        """Extract the specific requirement from sentence."""
        # Clean up the sentence
        cleaned = re.sub(r'\s+', ' ', sentence).strip()
        
        # Remove common prefixes
        prefixes_to_remove = [
            r'^\d+\.\s*',
            r'^\([a-z]\)\s*',
            r'^\([A-Z]\)\s*',
            r'^[A-Z]\.\s*',
            r'^[a-z]\)\s*'
        ]
        
        for prefix in prefixes_to_remove:
            cleaned = re.sub(prefix, '', cleaned)
        
        return cleaned
    
    def _extract_trigger(self, sentence: str) -> str:
        """Extract trigger conditions from sentence."""
        for pattern in self.trigger_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                # Extract the full trigger context
                start = max(0, match.start() - 50)
                end = min(len(sentence), match.end() + 50)
                return sentence[start:end].strip()
        
        return "Upon occurrence of triggering event"
    
    def _extract_deadline(self, sentence: str) -> Optional[str]:
        """Extract deadline from sentence."""
        for pattern in self.deadline_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None
    
    def _extract_penalty(self, sentence: str) -> Optional[str]:
        """Extract penalty information from sentence."""
        penalty_indicators = []
        
        for pattern in self.penalty_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                penalty_indicators.append(match.group(0))
        
        if penalty_indicators:
            return "; ".join(penalty_indicators)
        
        return None
    
    def _calculate_confidence(self, sentence: str, policy: str, actor: str, requirement: str) -> float:
        """Calculate confidence score for the extraction."""
        base_confidence = 0.5
        
        # Policy confidence
        if policy != "General Compliance Requirement":
            base_confidence += 0.2
        
        # Actor confidence
        if actor != "Covered Entity":
            base_confidence += 0.1
        
        # Requirement confidence
        if len(requirement) > 20:
            base_confidence += 0.1
        
        # Legal language indicators
        legal_indicators = ['shall', 'must', 'required', 'obligated', 'mandated']
        if any(indicator in sentence.lower() for indicator in legal_indicators):
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def _generate_mapped_controls(self, requirement: str, policy: str) -> List[MappedControl]:
        """Generate mapped controls for the requirement."""
        controls = []
        
        # Map based on requirement type
        if 'report' in requirement.lower():
            controls.append(MappedControl(
                control_id=f"REP-{uuid.uuid4().hex[:8].upper()}",
                category=ControlCategory.FINANCIAL_REPORTING,
                status=ControlStatus.PENDING,
                description="Reporting control for compliance requirement"
            ))
        
        if 'disclose' in requirement.lower():
            controls.append(MappedControl(
                control_id=f"DIS-{uuid.uuid4().hex[:8].upper()}",
                category=ControlCategory.DISCLOSURE,
                status=ControlStatus.PENDING,
                description="Disclosure control for compliance requirement"
            ))
        
        if 'insider' in requirement.lower() or 'beneficial' in requirement.lower():
            controls.append(MappedControl(
                control_id=f"INS-{uuid.uuid4().hex[:8].upper()}",
                category=ControlCategory.INSIDER_REPORTING,
                status=ControlStatus.PENDING,
                description="Insider reporting control for compliance requirement"
            ))
        
        return controls
    
    def _identify_regulatory_framework(self, policy: str) -> Optional[str]:
        """Identify regulatory framework from policy."""
        if 'Securities Exchange Act' in policy:
            return 'SEC'
        elif 'Sarbanes-Oxley' in policy or 'SOX' in policy:
            return 'SOX'
        elif 'Dodd-Frank' in policy:
            return 'Dodd-Frank'
        elif 'Investment Company Act' in policy:
            return 'Investment Company Act'
        elif 'Investment Advisers Act' in policy:
            return 'Investment Advisers Act'
        
        return None
    
    def _assess_risk_level(self, penalty: Optional[str], deadline: Optional[str]) -> str:
        """Assess risk level based on penalty and deadline."""
        risk_score = 0
        
        if penalty:
            if 'criminal' in penalty.lower():
                risk_score += 3
            elif 'civil' in penalty.lower():
                risk_score += 2
            elif 'administrative' in penalty.lower():
                risk_score += 1
        
        if deadline:
            if 'immediately' in deadline.lower():
                risk_score += 3
            elif 'days' in deadline.lower():
                days = re.search(r'(\d+)', deadline)
                if days:
                    days_num = int(days.group(1))
                    if days_num <= 10:
                        risk_score += 3
                    elif days_num <= 30:
                        risk_score += 2
                    else:
                        risk_score += 1
        
        if risk_score >= 4:
            return "High"
        elif risk_score >= 2:
            return "Medium"
        else:
            return "Low"
    
    def _assess_business_impact(self, requirement: str, actor: str) -> str:
        """Assess business impact of the requirement."""
        impact_score = 0
        
        # High impact indicators
        high_impact_indicators = ['financial statement', 'audit', 'certification', 'governance']
        if any(indicator in requirement.lower() for indicator in high_impact_indicators):
            impact_score += 2
        
        # Medium impact indicators
        medium_impact_indicators = ['report', 'disclose', 'file', 'submit']
        if any(indicator in requirement.lower() for indicator in medium_impact_indicators):
            impact_score += 1
        
        # Actor impact
        if 'executive' in actor.lower() or 'director' in actor.lower():
            impact_score += 1
        
        if impact_score >= 3:
            return "High"
        elif impact_score >= 1:
            return "Medium"
        else:
            return "Low"
