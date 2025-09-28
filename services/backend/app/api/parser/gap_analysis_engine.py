"""
Gap Analysis Engine for SEC Compliance
Compares Orion 10-K data against LLM organized requirements to identify gaps and generate findings
"""

import os
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class GapFinding:
    """Represents a gap finding from the analysis."""
    id: str
    category: str
    severity: str  # High, Medium, Low
    title: str
    description: str
    requirement_id: Optional[str]
    current_state: Dict[str, Any]
    expected_state: Dict[str, Any]
    recommendations: List[str]
    priority: int  # 1-5 scale
    estimated_effort: str
    responsible_party: str
    deadline: Optional[str]
    business_impact: str

@dataclass
class TaskItem:
    """Represents an actionable task from the gap analysis."""
    id: str
    title: str
    description: str
    category: str
    priority: str
    status: str  # Pending, In Progress, Completed
    assigned_to: str
    due_date: Optional[str]
    dependencies: List[str]
    effort_estimate: str
    business_value: str

class GapAnalysisEngine:
    """Engine for performing gap analysis between Orion 10-K data and compliance requirements."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.analysis_prompt = self._load_analysis_prompt()
        self.findings_prompt = self._load_findings_prompt()
        self.tasks_prompt = self._load_tasks_prompt()
    
    def _load_analysis_prompt(self) -> str:
        """Load the gap analysis prompt for LLM."""
        return """
You are a SEC compliance expert performing gap analysis between a company's 10-K filing and regulatory requirements.

Company 10-K Data:
{company_data}

Compliance Requirements:
{requirements}

Analyze the gaps between what the company has disclosed/implemented versus what regulatory requirements demand.

Focus on:
1. Financial reporting completeness and accuracy
2. Risk factor disclosures
3. Governance and control procedures
4. Executive compensation disclosures
5. Cybersecurity disclosures
6. Internal controls over financial reporting
7. Segment reporting
8. Related party transactions
9. Legal proceedings
10. Environmental and social disclosures

For each gap identified, provide:
- Gap category and severity
- Current state vs expected state
- Specific recommendations
- Business impact assessment
- Priority level (1-5 scale)

Return ONLY valid JSON with this structure:
{{
  "gap_analysis": {{
    "total_gaps": 0,
    "high_severity_gaps": 0,
    "medium_severity_gaps": 0,
    "low_severity_gaps": 0,
    "compliance_score": 0.0,
    "overall_assessment": "string"
  }},
  "findings": [
    {{
      "id": "finding_1",
      "category": "Financial Reporting",
      "severity": "High",
      "title": "Missing segment revenue breakdown",
      "description": "Detailed description of the gap",
      "current_state": {{"disclosed": false, "details": "No segment revenue breakdown provided"}},
      "expected_state": {{"required": true, "details": "SEC requires detailed segment reporting"}},
      "recommendations": ["Implement segment revenue tracking", "Create segment reporting procedures"],
      "priority": 5,
      "estimated_effort": "2-3 months",
      "responsible_party": "CFO and Accounting Team",
      "deadline": "Next 10-K filing",
      "business_impact": "High - regulatory compliance risk"
    }}
  ]
}}

Important: Return ONLY valid JSON. No additional text or explanations.
"""

    def _load_findings_prompt(self) -> str:
        """Load the findings generation prompt."""
        return """
You are a compliance expert generating detailed findings from gap analysis.

Gap Analysis Results:
{gap_analysis}

Generate detailed findings with:
1. Clear, actionable descriptions
2. Specific recommendations
3. Priority and effort estimates
4. Business impact assessment
5. Responsible parties

Return ONLY valid JSON with findings array.
"""

    def _load_tasks_prompt(self) -> str:
        """Load the tasks generation prompt."""
        return """
You are a project manager creating actionable tasks from compliance findings.

Findings:
{findings}

Create specific, actionable tasks that address each finding:
1. Clear task titles and descriptions
2. Realistic effort estimates
3. Dependencies between tasks
4. Priority levels
5. Responsible parties
6. Due dates

Return ONLY valid JSON with tasks array.
"""

    async def perform_gap_analysis(self, orion_data: Dict[str, Any], requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform comprehensive gap analysis between Orion data and requirements."""
        try:
            print("🔍 Starting gap analysis between Orion 10-K data and compliance requirements...")
            
            # Prepare data for LLM analysis
            company_data = self._prepare_company_data(orion_data)
            requirements_data = self._prepare_requirements_data(requirements)
            
            # Call OpenAI API for gap analysis
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a SEC compliance expert. Return ONLY valid JSON."},
                    {"role": "user", "content": self.analysis_prompt.format(
                        company_data=company_data,
                        requirements=requirements_data
                    )}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            # Parse LLM response
            llm_output = response.choices[0].message.content
            analysis_results = self._parse_analysis_response(llm_output)
            
            print(f"✅ Gap analysis completed successfully")
            return analysis_results
            
        except Exception as e:
            print(f"❌ Error in gap analysis: {e}")
            return self._create_fallback_analysis(orion_data, requirements)

    async def generate_detailed_findings(self, gap_analysis: Dict[str, Any]) -> List[GapFinding]:
        """Generate detailed findings from gap analysis results."""
        try:
            print("📋 Generating detailed findings from gap analysis...")
            
            # Call OpenAI API for findings generation
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a compliance expert. Return ONLY valid JSON."},
                    {"role": "user", "content": self.findings_prompt.format(gap_analysis=json.dumps(gap_analysis))}
                ],
                temperature=0.2,
                max_tokens=3000
            )
            
            # Parse findings
            llm_output = response.choices[0].message.content
            findings_data = self._parse_findings_response(llm_output)
            
            # Convert to GapFinding objects
            findings = []
            for finding_data in findings_data.get("findings", []):
                finding = GapFinding(
                    id=finding_data.get("id", str(uuid.uuid4())),
                    category=finding_data.get("category", "General"),
                    severity=finding_data.get("severity", "Medium"),
                    title=finding_data.get("title", ""),
                    description=finding_data.get("description", ""),
                    requirement_id=finding_data.get("requirement_id"),
                    current_state=finding_data.get("current_state", {}),
                    expected_state=finding_data.get("expected_state", {}),
                    recommendations=finding_data.get("recommendations", []),
                    priority=finding_data.get("priority", 3),
                    estimated_effort=finding_data.get("estimated_effort", "TBD"),
                    responsible_party=finding_data.get("responsible_party", "TBD"),
                    deadline=finding_data.get("deadline"),
                    business_impact=finding_data.get("business_impact", "Medium")
                )
                findings.append(finding)
            
            print(f"✅ Generated {len(findings)} detailed findings")
            return findings
            
        except Exception as e:
            print(f"❌ Error generating findings: {e}")
            return []

    async def generate_actionable_tasks(self, findings: List[GapFinding]) -> List[TaskItem]:
        """Generate actionable tasks from findings."""
        try:
            print("📝 Generating actionable tasks from findings...")
            
            # Prepare findings data for LLM
            findings_data = []
            for finding in findings:
                findings_data.append({
                    "id": finding.id,
                    "category": finding.category,
                    "severity": finding.severity,
                    "title": finding.title,
                    "description": finding.description,
                    "recommendations": finding.recommendations,
                    "priority": finding.priority,
                    "responsible_party": finding.responsible_party
                })
            
            # Call OpenAI API for task generation
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a project manager. Return ONLY valid JSON."},
                    {"role": "user", "content": self.tasks_prompt.format(findings=json.dumps(findings_data))}
                ],
                temperature=0.2,
                max_tokens=3000
            )
            
            # Parse tasks
            llm_output = response.choices[0].message.content
            tasks_data = self._parse_tasks_response(llm_output)
            
            # Convert to TaskItem objects
            tasks = []
            for task_data in tasks_data.get("tasks", []):
                task = TaskItem(
                    id=task_data.get("id", str(uuid.uuid4())),
                    title=task_data.get("title", ""),
                    description=task_data.get("description", ""),
                    category=task_data.get("category", "General"),
                    priority=task_data.get("priority", "Medium"),
                    status=task_data.get("status", "Pending"),
                    assigned_to=task_data.get("assigned_to", "TBD"),
                    due_date=task_data.get("due_date"),
                    dependencies=task_data.get("dependencies", []),
                    effort_estimate=task_data.get("effort_estimate", "TBD"),
                    business_value=task_data.get("business_value", "Medium")
                )
                tasks.append(task)
            
            print(f"✅ Generated {len(tasks)} actionable tasks")
            return tasks
            
        except Exception as e:
            print(f"❌ Error generating tasks: {e}")
            return []

    def _prepare_company_data(self, orion_data: Dict[str, Any]) -> str:
        """Prepare Orion 10-K data for LLM analysis."""
        # Extract key sections for analysis
        key_sections = {
            "company_info": orion_data.get("company", {}),
            "financial_statements": orion_data.get("part2", {}).get("item8_financial_statements", {}),
            "risk_factors": orion_data.get("part1", {}).get("item1a_risk_factors", []),
            "governance": orion_data.get("part3", {}).get("item10_directors_executives_governance", {}),
            "executive_compensation": orion_data.get("part3", {}).get("item11_executive_compensation", {}),
            "controls": orion_data.get("part2", {}).get("item9a_controls_and_procedures", {}),
            "segment_disclosures": orion_data.get("segment_disclosures", {}),
            "notes_to_financials": orion_data.get("notes_to_financials", {})
        }
        
        return json.dumps(key_sections, indent=2)

    def _prepare_requirements_data(self, requirements: List[Dict[str, Any]]) -> str:
        """Prepare compliance requirements for LLM analysis."""
        formatted_requirements = []
        
        for req in requirements:
            formatted_req = {
                "id": req.get("id", ""),
                "policy": req.get("policy", ""),
                "actor": req.get("actor", ""),
                "requirement": req.get("requirement", ""),
                "trigger": req.get("trigger", ""),
                "deadline": req.get("deadline", ""),
                "penalty": req.get("penalty", "")
            }
            formatted_requirements.append(formatted_req)
        
        return json.dumps(formatted_requirements, indent=2)

    def _parse_analysis_response(self, llm_output: str) -> Dict[str, Any]:
        """Parse gap analysis response from LLM."""
        try:
            # Clean and extract JSON
            cleaned_output = llm_output.strip()
            json_start = cleaned_output.find('{')
            json_end = cleaned_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in LLM response")
            
            json_str = cleaned_output[json_start:json_end]
            return json.loads(json_str)
            
        except Exception as e:
            print(f"❌ Error parsing analysis response: {e}")
            return {"gap_analysis": {}, "findings": []}

    def _parse_findings_response(self, llm_output: str) -> Dict[str, Any]:
        """Parse findings response from LLM."""
        try:
            json_start = llm_output.find('{')
            json_end = llm_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in LLM response")
            
            json_str = llm_output[json_start:json_end]
            return json.loads(json_str)
            
        except Exception as e:
            print(f"❌ Error parsing findings response: {e}")
            return {"findings": []}

    def _parse_tasks_response(self, llm_output: str) -> Dict[str, Any]:
        """Parse tasks response from LLM."""
        try:
            json_start = llm_output.find('{')
            json_end = llm_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in LLM response")
            
            json_str = llm_output[json_start:json_end]
            return json.loads(json_str)
            
        except Exception as e:
            print(f"❌ Error parsing tasks response: {e}")
            return {"tasks": []}

    def _create_fallback_analysis(self, orion_data: Dict[str, Any], requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create fallback analysis when LLM fails."""
        print("Creating fallback gap analysis...")
        
        # Simple gap analysis based on data availability
        gaps = []
        
        # Check for missing financial disclosures
        financial_data = orion_data.get("part2", {}).get("item8_financial_statements", {})
        if not financial_data.get("income_statements"):
            gaps.append({
                "id": "gap_1",
                "category": "Financial Reporting",
                "severity": "High",
                "title": "Missing income statements",
                "description": "Income statements not found in 10-K data",
                "current_state": {"disclosed": False},
                "expected_state": {"required": True},
                "recommendations": ["Implement income statement reporting"],
                "priority": 5,
                "estimated_effort": "1-2 months",
                "responsible_party": "CFO and Accounting Team",
                "business_impact": "High - regulatory compliance risk"
            })
        
        return {
            "gap_analysis": {
                "total_gaps": len(gaps),
                "high_severity_gaps": len([g for g in gaps if g["severity"] == "High"]),
                "medium_severity_gaps": len([g for g in gaps if g["severity"] == "Medium"]),
                "low_severity_gaps": len([g for g in gaps if g["severity"] == "Low"]),
                "compliance_score": 0.7,
                "overall_assessment": "Basic compliance with some gaps identified"
            },
            "findings": gaps
        }

    def chunk_data_for_analysis(self, data: Dict[str, Any], chunk_size: int = 1000) -> List[Dict[str, Any]]:
        """Chunk large datasets for efficient processing."""
        chunks = []
        
        # Simple chunking by section
        sections = ["company", "part1", "part2", "part3", "part4", "segment_disclosures", "notes_to_financials"]
        
        for section in sections:
            if section in data:
                section_data = data[section]
                if isinstance(section_data, dict):
                    # Chunk large dictionaries
                    items = list(section_data.items())
                    for i in range(0, len(items), chunk_size):
                        chunk = dict(items[i:i + chunk_size])
                        chunks.append({
                            "section": section,
                            "data": chunk,
                            "chunk_id": f"{section}_chunk_{i//chunk_size + 1}"
                        })
                else:
                    chunks.append({
                        "section": section,
                        "data": section_data,
                        "chunk_id": f"{section}_single"
                    })
        
        return chunks

    def calculate_compliance_score(self, findings: List[GapFinding]) -> float:
        """Calculate overall compliance score based on findings."""
        if not findings:
            return 1.0
        
        # Weight findings by severity
        severity_weights = {"High": 0.5, "Medium": 0.3, "Low": 0.2}
        
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for finding in findings:
            weight = severity_weights.get(finding.severity, 0.2)
            # Convert priority to score (1-5 scale, higher is worse)
            score = (6 - finding.priority) / 5.0  # Invert priority to score
            total_weighted_score += score * weight
            total_weight += weight
        
        return total_weighted_score / total_weight if total_weight > 0 else 1.0
