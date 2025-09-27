import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from .models import LegalDocument, ComplianceRule, RuleType, Requirement, PenaltyInfo


class LegalParserEngine:
    """Core parsing engine for extracting compliance rules from legal documents."""
    
    def __init__(self):
        self.rule_patterns = {
            "reporting_obligation": [
                r"must file.*report.*within.*days?",
                r"required to submit.*within.*days?",
                r"quarterly report.*due.*days?",
                r"annual report.*filing.*deadline"
            ],
            "disclosure_requirement": [
                r"must disclose.*information",
                r"required to disclose.*",
                r"public disclosure.*required",
                r"material information.*disclosure"
            ],
            "prohibition": [
                r"shall not.*",
                r"prohibited from.*",
                r"not permitted to.*",
                r"forbidden to.*"
            ],
            "obligation": [
                r"must.*",
                r"required to.*",
                r"shall.*",
                r"obligated to.*"
            ]
        }
        
        self.deadline_patterns = [
            r"within (\d+)\s*days?",
            r"(\d+)\s*days? after",
            r"no later than (\d+)\s*days?",
            r"within (\d+)\s*business days?"
        ]
        
        self.penalty_patterns = [
            r"\$([\d,]+)\s*per\s*day",
            r"fine of \$([\d,]+)",
            r"penalty.*\$([\d,]+)",
            r"up to \$([\d,]+)"
        ]
    
    def extract_rules(self, document: LegalDocument) -> List[ComplianceRule]:
        """Extract compliance rules from a legal document."""
        rules = []
        content = document.content.lower()
        
        # Split content into sentences for better processing
        sentences = self._split_into_sentences(document.content)
        
        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()
            
            # Check for different rule types
            for rule_type, patterns in self.rule_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, sentence_lower):
                        rule = self._create_rule_from_sentence(
                            sentence, rule_type, document, i
                        )
                        if rule:
                            rules.append(rule)
        
        # Remove duplicates and merge similar rules
        rules = self._deduplicate_rules(rules)
        
        return rules
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting - can be enhanced with NLP libraries
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _create_rule_from_sentence(self, sentence: str, rule_type: str, 
                                  document: LegalDocument, sentence_index: int) -> Optional[ComplianceRule]:
        """Create a compliance rule from a sentence."""
        try:
            # Extract deadline information
            deadline = self._extract_deadline(sentence)
            
            # Extract penalty information
            penalties = self._extract_penalties(sentence)
            
            # Create requirements
            requirements = [Requirement(
                action=self._extract_action(sentence),
                deadline=deadline,
                entities=self._extract_entities(sentence),
                thresholds=self._extract_thresholds(sentence),
                conditions=self._extract_conditions(sentence)
            )]
            
            # Create penalty info if found
            penalty_info = None
            if penalties:
                penalty_info = PenaltyInfo(
                    late_filing=penalties.get("late_filing"),
                    material_misstatement=penalties.get("material_misstatement"),
                    other=penalties.get("other")
                )
            
            # Generate rule ID
            rule_id = f"RULE-{document.id[:8]}-{sentence_index:03d}"
            
            # Calculate confidence score (simple heuristic)
            confidence = self._calculate_confidence(sentence, rule_type)
            
            return ComplianceRule(
                rule_id=rule_id,
                title=self._generate_rule_title(sentence, rule_type),
                rule_type=RuleType(rule_type),
                description=sentence.strip(),
                requirements=requirements,
                penalties=penalty_info,
                exceptions=self._extract_exceptions(sentence),
                source_document=document.filename,
                confidence_score=confidence
            )
            
        except Exception as e:
            print(f"Error creating rule from sentence: {e}")
            return None
    
    def _extract_deadline(self, sentence: str) -> Optional[str]:
        """Extract deadline information from sentence."""
        for pattern in self.deadline_patterns:
            match = re.search(pattern, sentence.lower())
            if match:
                days = match.group(1)
                return f"{days} days"
        return None
    
    def _extract_penalties(self, sentence: str) -> Dict[str, str]:
        """Extract penalty information from sentence."""
        penalties = {}
        for pattern in self.penalty_patterns:
            match = re.search(pattern, sentence.lower())
            if match:
                amount = match.group(1)
                if "per day" in sentence.lower():
                    penalties["late_filing"] = f"${amount} per day"
                elif "material" in sentence.lower():
                    penalties["material_misstatement"] = f"${amount}"
                else:
                    penalties["other"] = f"${amount}"
        return penalties
    
    def _extract_action(self, sentence: str) -> str:
        """Extract the main action from sentence."""
        # Simple extraction - can be enhanced with NLP
        action_verbs = ["file", "submit", "disclose", "report", "notify", "maintain"]
        for verb in action_verbs:
            if verb in sentence.lower():
                return verb
        return "comply"
    
    def _extract_entities(self, sentence: str) -> List[str]:
        """Extract entities subject to the rule."""
        entities = []
        entity_patterns = [
            r"public companies?",
            r"issuers?",
            r"registrants?",
            r"filing entities?",
            r"reporting companies?"
        ]
        
        for pattern in entity_patterns:
            if re.search(pattern, sentence.lower()):
                entities.append(pattern.replace("?", "").replace("(", "").replace(")", ""))
        
        return entities if entities else ["covered entities"]
    
    def _extract_thresholds(self, sentence: str) -> Optional[Dict[str, Any]]:
        """Extract monetary or other thresholds."""
        thresholds = {}
        
        # Look for monetary amounts
        money_pattern = r"\$([\d,]+(?:\.\d{2})?)"
        money_matches = re.findall(money_pattern, sentence)
        if money_matches:
            thresholds["monetary"] = [f"${amount}" for amount in money_matches]
        
        # Look for revenue thresholds
        if "revenue" in sentence.lower():
            thresholds["revenue"] = "specified threshold"
        
        return thresholds if thresholds else None
    
    def _extract_conditions(self, sentence: str) -> List[str]:
        """Extract conditions for the requirement."""
        conditions = []
        
        # Look for conditional phrases
        conditional_patterns = [
            r"if.*",
            r"when.*",
            r"unless.*",
            r"provided that.*"
        ]
        
        for pattern in conditional_patterns:
            matches = re.findall(pattern, sentence.lower())
            conditions.extend(matches)
        
        return conditions
    
    def _extract_exceptions(self, sentence: str) -> List[str]:
        """Extract exceptions from the rule."""
        exceptions = []
        
        exception_patterns = [
            r"except.*",
            r"unless.*",
            r"excluding.*",
            r"other than.*"
        ]
        
        for pattern in exception_patterns:
            matches = re.findall(pattern, sentence.lower())
            exceptions.extend(matches)
        
        return exceptions
    
    def _calculate_confidence(self, sentence: str, rule_type: str) -> float:
        """Calculate confidence score for the rule."""
        base_confidence = 0.5
        
        # Increase confidence based on specific indicators
        if any(word in sentence.lower() for word in ["must", "required", "shall"]):
            base_confidence += 0.2
        
        if any(word in sentence.lower() for word in ["penalty", "fine", "violation"]):
            base_confidence += 0.1
        
        if any(word in sentence.lower() for word in ["days", "deadline", "filing"]):
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def _generate_rule_title(self, sentence: str, rule_type: str) -> str:
        """Generate a title for the rule."""
        # Extract key words for title
        words = sentence.split()[:8]  # First 8 words
        title = " ".join(words)
        
        if len(title) > 50:
            title = title[:47] + "..."
        
        return title
    
    def _deduplicate_rules(self, rules: List[ComplianceRule]) -> List[ComplianceRule]:
        """Remove duplicate and very similar rules."""
        unique_rules = []
        seen_descriptions = set()
        
        for rule in rules:
            # Simple deduplication based on description similarity
            description_key = rule.description.lower().strip()
            if description_key not in seen_descriptions:
                seen_descriptions.add(description_key)
                unique_rules.append(rule)
        
        return unique_rules
