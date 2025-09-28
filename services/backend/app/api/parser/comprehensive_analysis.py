"""
Comprehensive Analysis Engine
Integrates gap analysis, findings generation, and task creation with OpenAI
"""

import os
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv

from .gap_analysis_engine import GapAnalysisEngine, GapFinding, TaskItem
from .simple_findings_generator import SimpleFindingsGenerator

# Load environment variables
load_dotenv()

class ComprehensiveAnalysisEngine:
    """Comprehensive analysis engine that integrates all components."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.gap_engine = GapAnalysisEngine()
        self.findings_generator = SimpleFindingsGenerator()
        self.tasks_prompt = self._load_tasks_prompt()
    
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

Return ONLY valid JSON with this structure:
{{
  "tasks": [
    {{
      "id": "task_1",
      "title": "Implement segment revenue tracking system",
      "description": "Set up systems and procedures to track revenue by business segment",
      "category": "Financial Reporting",
      "priority": "High",
      "status": "Pending",
      "assigned_to": "CFO and Accounting Team",
      "due_date": "2024-06-30",
      "dependencies": [],
      "effort_estimate": "2-3 months",
      "business_value": "High - regulatory compliance"
    }}
  ],
  "summary": {{
    "total_tasks": 0,
    "high_priority": 0,
    "medium_priority": 0,
    "low_priority": 0
  }}
}}

Important: Return ONLY valid JSON. No additional text or explanations.
"""

    async def perform_comprehensive_analysis(self, orion_data: Dict[str, Any], requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform comprehensive analysis including gap analysis, findings, and tasks."""
        try:
            print("🚀 Starting comprehensive analysis...")
            
            # Step 1: Perform gap analysis
            print("📊 Step 1: Performing gap analysis...")
            gap_analysis = await self.gap_engine.perform_gap_analysis(orion_data, requirements)
            
            # Step 2: Generate detailed findings
            print("🔍 Step 2: Generating detailed findings...")
            findings = await self.gap_engine.generate_detailed_findings(gap_analysis)
            
            # Step 3: Generate findings using chunked approach
            print("📋 Step 3: Generating chunked findings...")
            chunked_findings = await self.findings_generator.generate_findings_from_chunks(orion_data, requirements)
            
            # Merge findings from both approaches
            # Convert GapFinding objects to dictionaries
            findings_dicts = []
            for finding in findings:
                if hasattr(finding, '__dict__'):
                    findings_dicts.append(finding.__dict__)
                else:
                    findings_dicts.append(finding)
            
            chunked_findings_list = chunked_findings.get("findings", [])
            all_findings = findings_dicts + chunked_findings_list
            unique_findings = self._deduplicate_findings(all_findings)
            
            # Step 4: Generate actionable tasks
            print("📝 Step 4: Generating actionable tasks...")
            tasks = await self._generate_comprehensive_tasks(unique_findings)
            
            # Step 5: Calculate compliance score
            compliance_score = self.gap_engine.calculate_compliance_score(unique_findings)
            
            # Step 6: Generate analysis summary
            analysis_summary = self._generate_analysis_summary(unique_findings, tasks, compliance_score)
            
            print("✅ Comprehensive analysis completed successfully")
            
            return {
                "analysis_id": str(uuid.uuid4()),
                "compliance_score": compliance_score,
                "gap_analysis": gap_analysis,
                "findings": unique_findings,
                "tasks": tasks,
                "summary": analysis_summary,
                "processing_metadata": {
                    "total_findings": len(unique_findings),
                    "total_tasks": len(tasks),
                    "chunked_findings": len(chunked_findings.get("findings", [])),
                    "gap_findings": len(findings)
                }
            }
            
        except Exception as e:
            print(f"❌ Error in comprehensive analysis: {e}")
            return {
                "error": str(e),
                "analysis_id": str(uuid.uuid4()),
                "compliance_score": 0.0,
                "findings": [],
                "tasks": [],
                "summary": {}
            }

    async def _generate_comprehensive_tasks(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate comprehensive tasks from findings."""
        try:
            # Prepare findings for LLM
            findings_data = []
            for finding in findings:
                findings_data.append({
                    "id": finding.get("id", str(uuid.uuid4())),
                    "title": finding.get("title", ""),
                    "description": finding.get("description", ""),
                    "category": finding.get("category", "General"),
                    "severity": finding.get("severity", "Medium"),
                    "priority": finding.get("priority", 3),
                    "recommendations": finding.get("recommendations", []),
                    "responsible_party": finding.get("responsible_party", "TBD")
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
                task = {
                    "id": task_data.get("id", str(uuid.uuid4())),
                    "title": task_data.get("title", ""),
                    "description": task_data.get("description", ""),
                    "category": task_data.get("category", "General"),
                    "priority": task_data.get("priority", "Medium"),
                    "status": task_data.get("status", "Pending"),
                    "assigned_to": task_data.get("assigned_to", "TBD"),
                    "due_date": task_data.get("due_date"),
                    "dependencies": task_data.get("dependencies", []),
                    "effort_estimate": task_data.get("effort_estimate", "TBD"),
                    "business_value": task_data.get("business_value", "Medium")
                }
                tasks.append(task)
            
            print(f"✅ Generated {len(tasks)} comprehensive tasks")
            return tasks
            
        except Exception as e:
            print(f"❌ Error generating comprehensive tasks: {e}")
            return []

    def _deduplicate_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate findings."""
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
        """Check if two titles are similar."""
        words1 = set(title1.split())
        words2 = set(title2.split())
        
        if not words1 or not words2:
            return False
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        similarity = len(intersection) / len(union)
        return similarity >= threshold

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

    def _generate_analysis_summary(self, findings: List[Dict[str, Any]], tasks: List[Dict[str, Any]], compliance_score: float) -> Dict[str, Any]:
        """Generate comprehensive analysis summary."""
        # Calculate findings statistics
        severity_counts = {"High": 0, "Medium": 0, "Low": 0}
        category_counts = {}
        priority_counts = {"High": 0, "Medium": 0, "Low": 0}
        
        for finding in findings:
            severity = finding.get("severity", "Medium")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            category = finding.get("category", "General")
            category_counts[category] = category_counts.get(category, 0) + 1
            
            priority = finding.get("priority", 3)
            if priority >= 4:
                priority_counts["High"] += 1
            elif priority >= 3:
                priority_counts["Medium"] += 1
            else:
                priority_counts["Low"] += 1
        
        # Calculate task statistics
        task_priority_counts = {"High": 0, "Medium": 0, "Low": 0}
        task_status_counts = {"Pending": 0, "In Progress": 0, "Completed": 0}
        
        for task in tasks:
            priority = task.get("priority", "Medium")
            task_priority_counts[priority] = task_priority_counts.get(priority, 0) + 1
            
            status = task.get("status", "Pending")
            task_status_counts[status] = task_status_counts.get(status, 0) + 1
        
        return {
            "compliance_score": compliance_score,
            "findings_summary": {
                "total_findings": len(findings),
                "severity_breakdown": severity_counts,
                "category_breakdown": category_counts,
                "priority_breakdown": priority_counts
            },
            "tasks_summary": {
                "total_tasks": len(tasks),
                "priority_breakdown": task_priority_counts,
                "status_breakdown": task_status_counts
            },
            "recommendations": self._generate_recommendations(findings, tasks),
            "next_steps": self._generate_next_steps(findings, tasks)
        }

    def _generate_recommendations(self, findings: List[Dict[str, Any]], tasks: List[Dict[str, Any]]) -> List[str]:
        """Generate high-level recommendations."""
        recommendations = []
        
        # High priority findings
        high_priority_findings = [f for f in findings if f.get("priority", 3) >= 4]
        if high_priority_findings:
            recommendations.append(f"Address {len(high_priority_findings)} high-priority findings immediately")
        
        # Category-based recommendations
        categories = {}
        for finding in findings:
            category = finding.get("category", "General")
            categories[category] = categories.get(category, 0) + 1
        
        for category, count in categories.items():
            if count > 0:
                recommendations.append(f"Focus on {category} improvements ({count} findings)")
        
        # Task-based recommendations
        pending_tasks = [t for t in tasks if t.get("status") == "Pending"]
        if pending_tasks:
            recommendations.append(f"Execute {len(pending_tasks)} pending tasks")
        
        return recommendations

    def _generate_next_steps(self, findings: List[Dict[str, Any]], tasks: List[Dict[str, Any]]) -> List[str]:
        """Generate next steps for implementation."""
        next_steps = []
        
        # Immediate actions
        high_priority_tasks = [t for t in tasks if t.get("priority") == "High"]
        if high_priority_tasks:
            next_steps.append("Execute high-priority tasks first")
        
        # Resource allocation
        categories = {}
        for task in tasks:
            category = task.get("category", "General")
            categories[category] = categories.get(category, 0) + 1
        
        for category, count in categories.items():
            if count > 0:
                next_steps.append(f"Allocate resources for {category} tasks ({count} tasks)")
        
        # Timeline
        next_steps.append("Create implementation timeline based on task priorities")
        next_steps.append("Assign responsible parties for each task")
        next_steps.append("Set up progress tracking and reporting")
        
        return next_steps
