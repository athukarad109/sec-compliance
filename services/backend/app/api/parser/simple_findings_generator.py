"""
Simple Findings Generator
Generates compliance findings using chunking and OpenAI integration
"""

import os
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SimpleFindingsGenerator:
    """Simple findings generator using chunking and OpenAI."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.findings_prompt = self._load_findings_prompt()
        self.chunk_size = 1000  # Configurable chunk size
    
    def _load_findings_prompt(self) -> str:
        """Load the findings generation prompt."""
        return """
You are a SEC compliance expert analyzing company data for compliance findings.

Company Data Chunk:
{company_data}

Compliance Requirements:
{requirements}

Generate specific, actionable findings based on gaps between company data and regulatory requirements.

For each finding, provide:
1. Clear, specific title
2. Detailed description of the gap
3. Current state vs expected state
4. Specific recommendations
5. Priority level (1-5, where 5 is highest)
6. Business impact assessment
7. Responsible party

Focus on:
- Financial reporting completeness
- Risk disclosures
- Governance controls
- Executive compensation
- Cybersecurity
- Internal controls
- Segment reporting
- Related party transactions

Return ONLY valid JSON with this structure:
{{
  "findings": [
    {{
      "id": "finding_1",
      "title": "Missing segment revenue disclosure",
      "description": "Company has not provided detailed segment revenue breakdown as required by SEC regulations",
      "category": "Financial Reporting",
      "severity": "High",
      "current_state": "No segment revenue data provided",
      "expected_state": "Detailed segment revenue breakdown required",
      "recommendations": [
        "Implement segment revenue tracking system",
        "Create segment reporting procedures",
        "Train accounting team on segment reporting requirements"
      ],
      "priority": 5,
      "business_impact": "High - regulatory compliance risk and potential SEC enforcement",
      "responsible_party": "CFO and Accounting Team",
      "estimated_effort": "2-3 months",
      "deadline": "Next 10-K filing"
    }}
  ],
  "summary": {{
    "total_findings": 0,
    "high_priority": 0,
    "medium_priority": 0,
    "low_priority": 0
  }}
}}

Important: Return ONLY valid JSON. No additional text or explanations.
"""

    async def generate_findings_from_chunks(self, company_data: Dict[str, Any], requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate findings using chunked data processing."""
        try:
            print("🔍 Starting chunked findings generation...")
            
            # Chunk the company data
            data_chunks = self._chunk_company_data(company_data)
            
            all_findings = []
            total_chunks = len(data_chunks)
            
            # Process each chunk
            for i, chunk in enumerate(data_chunks):
                print(f"Processing chunk {i+1}/{total_chunks}: {chunk['section']}")
                
                # Generate findings for this chunk
                chunk_findings = await self._generate_findings_for_chunk(chunk, requirements)
                all_findings.extend(chunk_findings)
            
            # Deduplicate findings
            unique_findings = self._deduplicate_findings(all_findings)
            
            # Calculate summary statistics
            summary = self._calculate_summary(unique_findings)
            
            print(f"✅ Generated {len(unique_findings)} unique findings from {total_chunks} chunks")
            
            return {
                "findings": unique_findings,
                "summary": summary,
                "processing_metadata": {
                    "total_chunks": total_chunks,
                    "total_findings": len(unique_findings),
                    "deduplication_ratio": len(all_findings) / len(unique_findings) if unique_findings else 1.0
                }
            }
            
        except Exception as e:
            print(f"❌ Error in chunked findings generation: {e}")
            return {"findings": [], "summary": {}, "error": str(e)}

    async def _generate_findings_for_chunk(self, chunk: Dict[str, Any], requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate findings for a specific data chunk."""
        try:
            # Prepare data for LLM
            company_data_str = json.dumps(chunk["data"], indent=2)
            requirements_str = json.dumps(requirements, indent=2)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a SEC compliance expert. Return ONLY valid JSON."},
                    {"role": "user", "content": self.findings_prompt.format(
                        company_data=company_data_str,
                        requirements=requirements_str
                    )}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            # Parse response
            llm_output = response.choices[0].message.content
            findings_data = self._parse_findings_response(llm_output)
            
            # Add chunk metadata to findings
            for finding in findings_data.get("findings", []):
                finding["chunk_section"] = chunk["section"]
                finding["chunk_id"] = chunk["chunk_id"]
                finding["id"] = finding.get("id", str(uuid.uuid4()))
            
            return findings_data.get("findings", [])
            
        except Exception as e:
            print(f"❌ Error generating findings for chunk {chunk.get('chunk_id', 'unknown')}: {e}")
            return []

    def _chunk_company_data(self, company_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk company data into manageable sections."""
        chunks = []
        
        # Define key sections to analyze
        key_sections = {
            "company_info": company_data.get("company", {}),
            "financial_statements": company_data.get("part2", {}).get("item8_financial_statements", {}),
            "risk_factors": company_data.get("part1", {}).get("item1a_risk_factors", []),
            "governance": company_data.get("part3", {}).get("item10_directors_executives_governance", {}),
            "executive_compensation": company_data.get("part3", {}).get("item11_executive_compensation", {}),
            "controls": company_data.get("part2", {}).get("item9a_controls_and_procedures", {}),
            "segment_disclosures": company_data.get("segment_disclosures", {}),
            "notes_to_financials": company_data.get("notes_to_financials", {})
        }
        
        # Create chunks for each section
        for section_name, section_data in key_sections.items():
            if section_data:
                # For large sections, create sub-chunks
                if isinstance(section_data, dict) and len(str(section_data)) > self.chunk_size:
                    sub_chunks = self._create_sub_chunks(section_data, section_name)
                    chunks.extend(sub_chunks)
                else:
                    chunks.append({
                        "section": section_name,
                        "data": section_data,
                        "chunk_id": f"{section_name}_single"
                    })
        
        return chunks

    def _create_sub_chunks(self, data: Dict[str, Any], section_name: str) -> List[Dict[str, Any]]:
        """Create sub-chunks for large data sections."""
        chunks = []
        items = list(data.items())
        
        for i in range(0, len(items), 5):  # 5 items per chunk
            chunk_items = items[i:i + 5]
            chunk_data = dict(chunk_items)
            
            chunks.append({
                "section": section_name,
                "data": chunk_data,
                "chunk_id": f"{section_name}_chunk_{i//5 + 1}"
            })
        
        return chunks

    def _parse_findings_response(self, llm_output: str) -> Dict[str, Any]:
        """Parse findings response from LLM."""
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
            print(f"❌ Error parsing findings response: {e}")
            return {"findings": []}

    def _deduplicate_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate findings based on title similarity."""
        unique_findings = []
        seen_titles = set()
        
        for finding in findings:
            title = finding.get("title", "").lower().strip()
            
            # Check for similarity with existing findings
            is_duplicate = False
            for seen_title in seen_titles:
                if self._titles_similar(title, seen_title):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_findings.append(finding)
                seen_titles.add(title)
        
        return unique_findings

    def _titles_similar(self, title1: str, title2: str, threshold: float = 0.8) -> bool:
        """Check if two titles are similar using simple word overlap."""
        words1 = set(title1.split())
        words2 = set(title2.split())
        
        if not words1 or not words2:
            return False
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        similarity = len(intersection) / len(union)
        return similarity >= threshold

    def _calculate_summary(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics for findings."""
        if not findings:
            return {
                "total_findings": 0,
                "high_priority": 0,
                "medium_priority": 0,
                "low_priority": 0,
                "categories": {}
            }
        
        priority_counts = {"high": 0, "medium": 0, "low": 0}
        category_counts = {}
        severity_counts = {"High": 0, "Medium": 0, "Low": 0}
        
        for finding in findings:
            # Count by priority (1-5 scale)
            priority = finding.get("priority", 3)
            if priority >= 4:
                priority_counts["high"] += 1
            elif priority >= 3:
                priority_counts["medium"] += 1
            else:
                priority_counts["low"] += 1
            
            # Count by category
            category = finding.get("category", "General")
            category_counts[category] = category_counts.get(category, 0) + 1
            
            # Count by severity
            severity = finding.get("severity", "Medium")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_findings": len(findings),
            "high_priority": priority_counts["high"],
            "medium_priority": priority_counts["medium"],
            "low_priority": priority_counts["low"],
            "categories": category_counts,
            "severity_breakdown": severity_counts
        }

    async def generate_simple_findings(self, company_data: Dict[str, Any], requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate simple findings without chunking for smaller datasets."""
        try:
            print("🔍 Generating simple findings...")
            
            # Prepare data for LLM
            company_data_str = json.dumps(company_data, indent=2)
            requirements_str = json.dumps(requirements, indent=2)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a SEC compliance expert. Return ONLY valid JSON."},
                    {"role": "user", "content": self.findings_prompt.format(
                        company_data=company_data_str,
                        requirements=requirements_str
                    )}
                ],
                temperature=0.2,
                max_tokens=3000
            )
            
            # Parse response
            llm_output = response.choices[0].message.content
            findings_data = self._parse_findings_response(llm_output)
            
            # Add IDs to findings
            for finding in findings_data.get("findings", []):
                finding["id"] = finding.get("id", str(uuid.uuid4()))
            
            print(f"✅ Generated {len(findings_data.get('findings', []))} simple findings")
            return findings_data.get("findings", [])
            
        except Exception as e:
            print(f"❌ Error generating simple findings: {e}")
            return []
