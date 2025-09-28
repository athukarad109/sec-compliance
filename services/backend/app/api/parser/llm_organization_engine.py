"""
LLM-Powered Requirement Organization Engine
Uses OpenAI API to organize and format compliance requirements
"""

import os
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import openai
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMRequirementOrganizer:
    """LLM-powered engine for organizing and formatting compliance requirements."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.organization_prompt = self._load_organization_prompt()
        self.formatting_prompt = self._load_formatting_prompt()
        self.control_mapping_prompt = self._load_control_mapping_prompt()
    
    def _load_organization_prompt(self) -> str:
        """Load the organization prompt for LLM."""
        return """
You are a compliance expert specializing in SEC regulations and financial compliance. 

Analyze the provided compliance requirements and organize them into logical groups with standardized formatting.

Requirements to organize:
{requirements}

Tasks:
1. Group similar requirements together based on regulatory framework and compliance area
2. Generate appropriate categories for each group (e.g., "Insider Reporting", "Financial Reporting", "Disclosure Requirements")
3. Create clean, standardized descriptions for each requirement
4. Maintain all regulatory details (triggers, deadlines, penalties) - DO NOT merge or combine them
5. Generate appropriate control IDs for each requirement

IMPORTANT: Return ONLY valid JSON. No additional text, explanations, or formatting.

Output format (JSON):
{
  "organized_requirements": [
    {
      "group_id": "group_1",
      "category": "Insider Reporting",
      "group_description": "Requirements related to insider trading and ownership disclosure",
      "requirements": [
        {
          "id": "req_1",
          "policy": "Securities Exchange Act of 1934 - Section 16(a)",
          "actor": "Beneficial owner of >10% equity security",
          "requirement": "File ownership disclosure statement with SEC",
          "trigger": "At registration of security OR within 10 days of becoming beneficial owner",
          "deadline": "10 days",
          "penalty": "SEC enforcement action; potential fines and sanctions",
          "mapped_controls": [
            {
              "control_id": "SEC-16A-001",
              "category": "Insider Reporting",
              "status": "Pending"
            }
          ]
        }
      ]
    }
  ],
  "organization_metadata": {
    "total_requirements": 0,
    "total_groups": 0,
    "categories": [],
    "processing_confidence": 0.95
  }
}

Important guidelines:
- Return ONLY valid JSON, no markdown, no explanations
- Keep each requirement separate - do not merge triggers, deadlines, or penalties
- Be specific with policy references (include section numbers)
- Make actors precise (not generic)
- Make requirements actionable and clear
- Generate meaningful control IDs following naming conventions
- Maintain regulatory accuracy
"""

    def _load_formatting_prompt(self) -> str:
        """Load the formatting prompt for individual requirements."""
        return """
You are a compliance expert. Format this raw compliance requirement into the standard structure.

Raw requirement:
{raw_requirement}

Format it as a JSON object with this exact structure:
{
  "policy": "Specific regulatory framework and section (e.g., 'Securities Exchange Act of 1934 - Section 16(a)')",
  "actor": "Who must comply (be specific, e.g., 'Beneficial owner of >10% equity security')",
  "requirement": "What must be done (clear, actionable statement)",
  "trigger": "When this requirement applies (specific conditions or events)",
  "deadline": "Timeframe for compliance (be specific, e.g., '10 days', 'within 30 days')",
  "penalty": "Consequences of non-compliance (comprehensive description)",
  "mapped_controls": [
    {
      "control_id": "Generated control ID (follow naming convention)",
      "category": "Control category (e.g., 'Insider Reporting', 'Financial Reporting')",
      "status": "Pending/Implemented/Not Applicable"
    }
  ]
}

Requirements:
- Policy must be specific and include section numbers when available
- Actor must be precise and not generic
- Requirement must be actionable and clear
- Trigger must be specific about when the requirement applies
- Deadline must be specific (not vague)
- Penalty must be comprehensive
- Control ID must follow naming convention (e.g., SEC-16A-001, FR-REP-001)
- Category must be appropriate for the requirement type
"""

    def _load_control_mapping_prompt(self) -> str:
        """Load the control mapping prompt."""
        return """
You are a compliance expert. Generate appropriate control mappings for this compliance requirement.

Requirement:
{requirement}

Generate control mappings that:
1. Follow naming conventions (e.g., SEC-16A-001, FR-REP-001, DIS-PUB-001)
2. Are appropriate for the requirement type
3. Include relevant categories
4. Have appropriate status

Output format:
{
  "mapped_controls": [
    {
      "control_id": "Generated control ID",
      "category": "Control category",
      "status": "Pending/Implemented/Not Applicable",
      "description": "Brief description of the control"
    }
  ]
}
"""

    async def organize_requirements(self, requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Organize requirements using LLM."""
        try:
            print(f"Starting LLM organization of {len(requirements)} requirements...")
            
            # Prepare requirements for LLM
            formatted_requirements = self._prepare_requirements_for_llm(requirements)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a compliance expert specializing in SEC regulations. Return ONLY valid JSON."},
                    {"role": "user", "content": self.organization_prompt.format(requirements=formatted_requirements)}
                ],
                temperature=0.1,  # Lower temperature for more consistent JSON
                max_tokens=4000
            )
            
            # Parse LLM response
            llm_output = response.choices[0].message.content
            organized_data = self._parse_llm_response(llm_output)
            
            print(f"LLM organization completed successfully")
            return organized_data
            
        except Exception as e:
            print(f"Error in LLM organization: {e}")
            # Fallback: Create simple organization
            print("Falling back to simple organization...")
            return self._create_fallback_organization(requirements)

    async def format_individual_requirement(self, raw_requirement: Dict[str, Any]) -> Dict[str, Any]:
        """Format a single requirement using LLM."""
        try:
            print(f"🤖 Formatting individual requirement: {raw_requirement.get('id', 'unknown')}")
            
            # Call OpenAI API for individual formatting
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a compliance expert."},
                    {"role": "user", "content": self.formatting_prompt.format(raw_requirement=raw_requirement)}
                ],
                temperature=0.2,
                max_tokens=1000
            )
            
            # Parse LLM response
            llm_output = response.choices[0].message.content
            formatted_requirement = self._parse_individual_requirement(llm_output)
            
            print(f"✅ Individual requirement formatted successfully")
            return formatted_requirement
            
        except Exception as e:
            print(f"❌ Error formatting individual requirement: {e}")
            raise Exception(f"Individual requirement formatting failed: {str(e)}")

    async def generate_control_mappings(self, requirement: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate control mappings for a requirement using LLM."""
        try:
            print(f"🤖 Generating control mappings for requirement: {requirement.get('id', 'unknown')}")
            
            # Call OpenAI API for control mapping
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a compliance expert."},
                    {"role": "user", "content": self.control_mapping_prompt.format(requirement=requirement)}
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            # Parse LLM response
            llm_output = response.choices[0].message.content
            control_mappings = self._parse_control_mappings(llm_output)
            
            print(f"✅ Control mappings generated successfully")
            return control_mappings
            
        except Exception as e:
            print(f"❌ Error generating control mappings: {e}")
            raise Exception(f"Control mapping generation failed: {str(e)}")

    def _prepare_requirements_for_llm(self, requirements: List[Dict[str, Any]]) -> str:
        """Prepare requirements data for LLM input."""
        formatted_requirements = []
        
        for req in requirements:
            formatted_req = {
                "id": req.get("id", ""),
                "title": req.get("title", ""),
                "description": req.get("description", ""),
                "source_text": req.get("sourceText", ""),
                "confidence_score": req.get("confidenceScore", 0.0)
            }
            formatted_requirements.append(formatted_req)
        
        return json.dumps(formatted_requirements, indent=2)

    def _parse_llm_response(self, llm_output: str) -> Dict[str, Any]:
        """Parse LLM response and validate structure."""
        try:
            # Clean the LLM output
            cleaned_output = llm_output.strip()
            
            # Try to find JSON block
            json_start = cleaned_output.find('{')
            json_end = cleaned_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                # Try alternative parsing
                lines = cleaned_output.split('\n')
                json_lines = []
                in_json = False
                
                for line in lines:
                    if line.strip().startswith('{'):
                        in_json = True
                    if in_json:
                        json_lines.append(line)
                    if line.strip().endswith('}') and in_json:
                        break
                
                if json_lines:
                    json_str = '\n'.join(json_lines)
                else:
                    raise ValueError("No valid JSON found in LLM response")
            else:
                json_str = cleaned_output[json_start:json_end]
            
            # Clean up the JSON string
            json_str = json_str.replace('\n', ' ').replace('\r', ' ')
            json_str = ' '.join(json_str.split())  # Remove extra whitespace
            
            # Parse JSON
            parsed_data = json.loads(json_str)
            
            # Validate structure
            self._validate_organized_data(parsed_data)
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            print(f"Raw LLM output: {llm_output[:500]}...")
            raise Exception(f"Failed to parse LLM JSON response: {str(e)}")
        except Exception as e:
            print(f"❌ Error parsing LLM response: {e}")
            print(f"Raw LLM output: {llm_output[:500]}...")
            raise Exception(f"Failed to parse LLM response: {str(e)}")

    def _parse_individual_requirement(self, llm_output: str) -> Dict[str, Any]:
        """Parse individual requirement formatting response."""
        try:
            # Extract JSON from LLM response
            json_start = llm_output.find('{')
            json_end = llm_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in LLM response")
            
            json_str = llm_output[json_start:json_end]
            parsed_data = json.loads(json_str)
            
            # Validate required fields
            required_fields = ["policy", "actor", "requirement", "trigger", "deadline", "penalty"]
            for field in required_fields:
                if field not in parsed_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return parsed_data
            
        except Exception as e:
            print(f"❌ Error parsing individual requirement: {e}")
            raise Exception(f"Failed to parse individual requirement: {str(e)}")

    def _parse_control_mappings(self, llm_output: str) -> List[Dict[str, Any]]:
        """Parse control mappings response."""
        try:
            # Extract JSON from LLM response
            json_start = llm_output.find('{')
            json_end = llm_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in LLM response")
            
            json_str = llm_output[json_start:json_end]
            parsed_data = json.loads(json_str)
            
            return parsed_data.get("mapped_controls", [])
            
        except Exception as e:
            print(f"❌ Error parsing control mappings: {e}")
            raise Exception(f"Failed to parse control mappings: {str(e)}")

    def _validate_organized_data(self, data: Dict[str, Any]) -> None:
        """Validate organized data structure."""
        if "organized_requirements" not in data:
            raise ValueError("Missing 'organized_requirements' in LLM response")
        
        if not isinstance(data["organized_requirements"], list):
            raise ValueError("'organized_requirements' must be a list")
        
        for group in data["organized_requirements"]:
            if "requirements" not in group:
                raise ValueError("Missing 'requirements' in group")
            
            if not isinstance(group["requirements"], list):
                raise ValueError("'requirements' must be a list")

    def calculate_confidence_score(self, llm_response: Dict[str, Any]) -> float:
        """Calculate confidence score for LLM response."""
        confidence_factors = {
            "completeness": self._check_completeness(llm_response),
            "specificity": self._check_specificity(llm_response),
            "regulatory_accuracy": self._check_regulatory_accuracy(llm_response)
        }
        
        # Weighted average
        weights = {"completeness": 0.4, "specificity": 0.3, "regulatory_accuracy": 0.3}
        confidence = sum(confidence_factors[factor] * weights[factor] for factor in confidence_factors)
        
        return min(confidence, 1.0)

    def _check_completeness(self, data: Dict[str, Any]) -> float:
        """Check completeness of LLM response."""
        if "organized_requirements" not in data:
            return 0.0
        
        total_requirements = sum(len(group.get("requirements", [])) for group in data["organized_requirements"])
        if total_requirements == 0:
            return 0.0
        
        # Check if all requirements have required fields
        complete_requirements = 0
        for group in data["organized_requirements"]:
            for req in group.get("requirements", []):
                required_fields = ["policy", "actor", "requirement", "trigger", "deadline", "penalty"]
                if all(field in req for field in required_fields):
                    complete_requirements += 1
        
        return complete_requirements / total_requirements

    def _check_specificity(self, data: Dict[str, Any]) -> float:
        """Check specificity of LLM response."""
        specificity_score = 0.0
        total_requirements = 0
        
        for group in data.get("organized_requirements", []):
            for req in group.get("requirements", []):
                total_requirements += 1
                
                # Check if policy includes section numbers
                if "Section" in req.get("policy", ""):
                    specificity_score += 0.3
                
                # Check if actor is specific
                if any(keyword in req.get("actor", "").lower() for keyword in ["beneficial owner", "executive officer", "director"]):
                    specificity_score += 0.3
                
                # Check if deadline is specific
                if any(keyword in req.get("deadline", "").lower() for keyword in ["days", "months", "years"]):
                    specificity_score += 0.4
        
        return specificity_score / total_requirements if total_requirements > 0 else 0.0

    def _check_regulatory_accuracy(self, data: Dict[str, Any]) -> float:
        """Check regulatory accuracy of LLM response."""
        accuracy_score = 0.0
        total_requirements = 0
        
        for group in data.get("organized_requirements", []):
            for req in group.get("requirements", []):
                total_requirements += 1
                
                # Check if policy references are accurate
                policy = req.get("policy", "").lower()
                if any(framework in policy for framework in ["securities exchange act", "sarbanes-oxley", "dodd-frank"]):
                    accuracy_score += 0.5
                
                # Check if penalty is comprehensive
                penalty = req.get("penalty", "").lower()
                if any(keyword in penalty for keyword in ["enforcement", "fine", "sanction", "penalty"]):
                    accuracy_score += 0.5
        
        return accuracy_score / total_requirements if total_requirements > 0 else 0.0

    def _create_fallback_organization(self, requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a simple fallback organization when LLM fails."""
        print("Creating fallback organization...")
        
        # Simple grouping by policy similarity
        groups = {}
        for req in requirements:
            policy = req.get('title', 'General Compliance')
            if policy not in groups:
                groups[policy] = []
            groups[policy].append(req)
        
        # Create organized structure
        organized_requirements = []
        for i, (policy, reqs) in enumerate(groups.items()):
            group = {
                "group_id": f"fallback_group_{i+1}",
                "category": "General Compliance",
                "group_description": f"Requirements related to {policy}",
                "requirements": []
            }
            
            for req in reqs:
                formatted_req = {
                    "id": req.get('id', ''),
                    "policy": policy,
                    "actor": "Covered Entity",
                    "requirement": req.get('description', ''),
                    "trigger": "Upon occurrence of triggering event",
                    "deadline": "As required",
                    "penalty": "Regulatory enforcement action",
                    "mapped_controls": [
                        {
                            "control_id": f"GEN-{req.get('id', '')[:8].upper()}",
                            "category": "General Compliance",
                            "status": "Pending"
                        }
                    ]
                }
                group["requirements"].append(formatted_req)
            
            organized_requirements.append(group)
        
        return {
            "organized_requirements": organized_requirements,
            "organization_metadata": {
                "total_requirements": len(requirements),
                "total_groups": len(organized_requirements),
                "categories": ["General Compliance"],
                "processing_confidence": 0.7
            }
        }
