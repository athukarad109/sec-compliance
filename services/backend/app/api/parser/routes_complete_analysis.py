"""
Complete Gap Analysis API Route
Single endpoint that performs the entire gap analysis process and returns frontend-ready data
"""

import json
import uuid
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from .gap_analysis_engine import GapAnalysisEngine
from .simple_findings_generator import SimpleFindingsGenerator
from .comprehensive_analysis import ComprehensiveAnalysisEngine
from ...database import db

router = APIRouter(prefix="/complete-analysis", tags=["complete-analysis"])

@router.post("/run-full-analysis")
async def run_full_gap_analysis():
    """
    Complete gap analysis endpoint that performs the entire process:
    1. Loads Orion 10-K data
    2. Gets compliance requirements from database
    3. Performs gap analysis
    4. Generates findings
    5. Creates actionable tasks
    6. Returns frontend-ready data
    """
    try:
        start_time = time.time()
        print("🚀 Starting Complete Gap Analysis Process...")
        
        # Step 1: Load Orion 10-K data
        print("📊 Step 1: Loading Orion 10-K Data")
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        company_name = orion_data.get('company', {}).get('name', 'Unknown')
        print(f"✅ Loaded data for: {company_name}")
        
        # Step 2: Get compliance requirements from database
        print("📋 Step 2: Loading Compliance Requirements")
        await db.connect()
        prisma = db.get_client()
        
        requirements = await prisma.finalcompliancerequirement.find_many()
        if not requirements:
            # Create sample requirements if none exist
            requirements_data = _create_sample_requirements()
            print(f"✅ Created {len(requirements_data)} sample requirements")
        else:
            # Convert Prisma objects to dictionaries
            requirements_data = []
            for req in requirements:
                requirements_data.append({
                    "id": req.id,
                    "policy": req.policy,
                    "actor": req.actor,
                    "requirement": req.requirement,
                    "trigger": req.triggerCondition,
                    "deadline": req.deadline,
                    "penalty": req.penalty,
                    "mapped_controls": json.loads(req.mappedControls) if req.mappedControls else []
                })
            print(f"✅ Loaded {len(requirements_data)} requirements from database")
        
        # Step 3: Perform comprehensive analysis
        print("🔍 Step 3: Performing Comprehensive Analysis")
        comprehensive_engine = ComprehensiveAnalysisEngine()
        analysis_results = await comprehensive_engine.perform_comprehensive_analysis(orion_data, requirements_data)
        
        # Step 4: Generate additional findings using chunking
        print("📊 Step 4: Generating Chunked Findings")
        findings_generator = SimpleFindingsGenerator()
        chunked_results = await findings_generator.generate_findings_from_chunks(orion_data, requirements_data)
        
        # Step 5: Combine all findings
        print("🔄 Step 5: Combining All Findings")
        # Convert GapFinding objects to dictionaries
        analysis_findings = []
        for finding in analysis_results.get("findings", []):
            if hasattr(finding, '__dict__'):
                analysis_findings.append(finding.__dict__)
            else:
                analysis_findings.append(finding)
        
        chunked_findings = chunked_results.get("findings", [])
        all_findings = analysis_findings + chunked_findings
        unique_findings = _deduplicate_findings(all_findings)
        
        # Step 6: Generate comprehensive tasks
        print("📝 Step 6: Generating Comprehensive Tasks")
        all_tasks = analysis_results.get("tasks", [])
        
        # Step 7: Calculate final metrics
        print("📊 Step 7: Calculating Final Metrics")
        compliance_score = analysis_results.get("compliance_score", 0.0)
        
        # Step 8: Prepare frontend-ready response
        print("🎨 Step 8: Preparing Frontend Response")
        frontend_response = _prepare_frontend_response(
            analysis_results,
            unique_findings,
            all_tasks,
            compliance_score,
            company_name,
            time.time() - start_time
        )
        
        # Step 9: Store results in database
        print("💾 Step 9: Storing Results")
        analysis_id = str(uuid.uuid4())
        await prisma.gapanalysis.create(data={
            "id": analysis_id,
            "companyData": json.dumps(orion_data),
            "requirementsData": json.dumps(requirements_data),
            "analysisResults": json.dumps(analysis_results.get("gap_analysis", {})),
            "findings": json.dumps(unique_findings),
            "tasks": json.dumps(all_tasks),
            "complianceScore": compliance_score
        })
        
        print(f"✅ Complete gap analysis finished in {time.time() - start_time:.2f} seconds")
        
        return frontend_response
        
    except Exception as e:
        print(f"❌ Error in complete gap analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Complete gap analysis failed: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/analysis-status")
async def get_analysis_status():
    """Get the status of the gap analysis system."""
    try:
        # Check if Orion data is available
        orion_data = await _load_orion_data()
        orion_available = orion_data is not None
        
        # Check OpenAI API key
        import os
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_available = openai_key is not None and len(openai_key) > 0
        
        # Check database connection
        await db.connect()
        prisma = db.get_client()
        requirements_count = await prisma.finalcompliancerequirement.count()
        await db.disconnect()
        
        return {
            "system_status": "operational",
            "orion_data_available": orion_available,
            "openai_available": openai_available,
            "database_connected": True,
            "requirements_count": requirements_count,
            "company_name": orion_data.get("company", {}).get("name", "Unknown") if orion_available else None,
            "message": "Gap analysis system status retrieved successfully"
        }
        
    except Exception as e:
        print(f"❌ Error getting analysis status: {e}")
        return {
            "system_status": "error",
            "error": str(e),
            "message": "Failed to get analysis status"
        }

def _prepare_frontend_response(analysis_results, findings, tasks, compliance_score, company_name, processing_time):
    """Prepare frontend-ready response with all necessary data."""
    
    # Calculate summary statistics
    findings_summary = _calculate_findings_summary(findings)
    tasks_summary = _calculate_tasks_summary(tasks)
    
    # Prepare recommendations
    recommendations = _generate_recommendations(findings, tasks)
    
    # Prepare next steps
    next_steps = _generate_next_steps(findings, tasks)
    
    # Prepare priority matrix
    priority_matrix = _create_priority_matrix(findings, tasks)
    
    # Prepare compliance dashboard data
    dashboard_data = _create_dashboard_data(findings, tasks, compliance_score)
    
    return {
        "analysis_id": str(uuid.uuid4()),
        "company_name": company_name,
        "compliance_score": compliance_score,
        "processing_time": processing_time,
        "timestamp": datetime.now().isoformat(),
        
        # Findings data
        "findings": {
            "total": len(findings),
            "summary": findings_summary,
            "data": findings,
            "priority_breakdown": findings_summary.get("priority_breakdown", {}),
            "severity_breakdown": findings_summary.get("severity_breakdown", {}),
            "category_breakdown": findings_summary.get("category_breakdown", {})
        },
        
        # Tasks data
        "tasks": {
            "total": len(tasks),
            "summary": tasks_summary,
            "data": tasks,
            "priority_breakdown": tasks_summary.get("priority_breakdown", {}),
            "status_breakdown": tasks_summary.get("status_breakdown", {}),
            "category_breakdown": tasks_summary.get("category_breakdown", {})
        },
        
        # Analysis insights
        "insights": {
            "recommendations": recommendations,
            "next_steps": next_steps,
            "priority_matrix": priority_matrix,
            "risk_assessment": _assess_risks(findings),
            "compliance_gaps": _identify_compliance_gaps(findings)
        },
        
        # Dashboard data
        "dashboard": dashboard_data,
        
        # Metadata
        "metadata": {
            "analysis_type": "comprehensive_gap_analysis",
            "data_sources": ["orion_10k", "compliance_requirements"],
            "processing_methods": ["llm_analysis", "chunked_processing", "deduplication"],
            "confidence_level": "high"
        },
        
        "message": "Complete gap analysis completed successfully"
    }

def _calculate_findings_summary(findings):
    """Calculate summary statistics for findings."""
    if not findings:
        return {
            "total": 0,
            "priority_breakdown": {"High": 0, "Medium": 0, "Low": 0},
            "severity_breakdown": {"High": 0, "Medium": 0, "Low": 0},
            "category_breakdown": {}
        }
    
    priority_counts = {"High": 0, "Medium": 0, "Low": 0}
    severity_counts = {"High": 0, "Medium": 0, "Low": 0}
    category_counts = {}
    
    for finding in findings:
        # Priority (1-5 scale)
        priority = finding.get("priority", 3)
        if priority >= 4:
            priority_counts["High"] += 1
        elif priority >= 3:
            priority_counts["Medium"] += 1
        else:
            priority_counts["Low"] += 1
        
        # Severity
        severity = finding.get("severity", "Medium")
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Category
        category = finding.get("category", "General")
        category_counts[category] = category_counts.get(category, 0) + 1
    
    return {
        "total": len(findings),
        "priority_breakdown": priority_counts,
        "severity_breakdown": severity_counts,
        "category_breakdown": category_counts
    }

def _calculate_tasks_summary(tasks):
    """Calculate summary statistics for tasks."""
    if not tasks:
        return {
            "total": 0,
            "priority_breakdown": {"High": 0, "Medium": 0, "Low": 0},
            "status_breakdown": {"Pending": 0, "In Progress": 0, "Completed": 0},
            "category_breakdown": {}
        }
    
    priority_counts = {"High": 0, "Medium": 0, "Low": 0}
    status_counts = {"Pending": 0, "In Progress": 0, "Completed": 0}
    category_counts = {}
    
    for task in tasks:
        # Priority
        priority = task.get("priority", "Medium")
        priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        # Status
        status = task.get("status", "Pending")
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # Category
        category = task.get("category", "General")
        category_counts[category] = category_counts.get(category, 0) + 1
    
    return {
        "total": len(tasks),
        "priority_breakdown": priority_counts,
        "status_breakdown": status_counts,
        "category_breakdown": category_counts
    }

def _generate_recommendations(findings, tasks):
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

def _generate_next_steps(findings, tasks):
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

def _create_priority_matrix(findings, tasks):
    """Create priority matrix for findings and tasks."""
    matrix = {
        "high_priority_findings": [f for f in findings if f.get("priority", 3) >= 4],
        "medium_priority_findings": [f for f in findings if f.get("priority", 3) == 3],
        "low_priority_findings": [f for f in findings if f.get("priority", 3) < 3],
        "high_priority_tasks": [t for t in tasks if t.get("priority") == "High"],
        "medium_priority_tasks": [t for t in tasks if t.get("priority") == "Medium"],
        "low_priority_tasks": [t for t in tasks if t.get("priority") == "Low"]
    }
    
    return matrix

def _create_dashboard_data(findings, tasks, compliance_score):
    """Create dashboard data for frontend visualization."""
    return {
        "compliance_score": compliance_score,
        "total_findings": len(findings),
        "total_tasks": len(tasks),
        "high_priority_items": len([f for f in findings if f.get("priority", 3) >= 4]) + len([t for t in tasks if t.get("priority") == "High"]),
        "completion_rate": len([t for t in tasks if t.get("status") == "Completed"]) / len(tasks) if tasks else 0,
        "risk_level": "High" if compliance_score < 0.5 else "Medium" if compliance_score < 0.8 else "Low"
    }

def _assess_risks(findings):
    """Assess overall risk level based on findings."""
    if not findings:
        return {"level": "Low", "description": "No significant risks identified"}
    
    high_risk_findings = [f for f in findings if f.get("severity") == "High"]
    medium_risk_findings = [f for f in findings if f.get("severity") == "Medium"]
    
    if len(high_risk_findings) > 0:
        return {"level": "High", "description": f"{len(high_risk_findings)} high-risk findings require immediate attention"}
    elif len(medium_risk_findings) > 0:
        return {"level": "Medium", "description": f"{len(medium_risk_findings)} medium-risk findings need attention"}
    else:
        return {"level": "Low", "description": "Low risk level with manageable findings"}

def _identify_compliance_gaps(findings):
    """Identify key compliance gaps."""
    gaps = []
    
    # Group findings by category
    categories = {}
    for finding in findings:
        category = finding.get("category", "General")
        if category not in categories:
            categories[category] = []
        categories[category].append(finding)
    
    # Identify gaps by category
    for category, category_findings in categories.items():
        if category_findings:
            gaps.append({
                "category": category,
                "count": len(category_findings),
                "severity": max([f.get("severity", "Low") for f in category_findings]),
                "description": f"{len(category_findings)} findings in {category}"
            })
    
    return gaps

def _deduplicate_findings(findings):
    """Remove duplicate findings based on title similarity."""
    unique_findings = []
    seen_titles = set()
    
    for finding in findings:
        title = finding.get("title", "").lower().strip()
        
        # Check for similarity with existing findings
        is_duplicate = False
        for seen_title in seen_titles:
            if _titles_similar(title, seen_title):
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique_findings.append(finding)
            seen_titles.add(title)
    
    return unique_findings

def _titles_similar(title1, title2, threshold=0.8):
    """Check if two titles are similar."""
    words1 = set(title1.split())
    words2 = set(title2.split())
    
    if not words1 or not words2:
        return False
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    similarity = len(intersection) / len(union)
    return similarity >= threshold

def _create_sample_requirements():
    """Create sample compliance requirements if none exist in database."""
    return [
        {
            "id": "req_1",
            "policy": "Securities Exchange Act of 1934 - Section 13(a)",
            "actor": "Public company",
            "requirement": "File annual reports on Form 10-K",
            "trigger": "End of fiscal year",
            "deadline": "60-90 days after fiscal year end",
            "penalty": "SEC enforcement action, potential delisting"
        },
        {
            "id": "req_2", 
            "policy": "Securities Exchange Act of 1934 - Section 16(a)",
            "actor": "Beneficial owner of >10% equity security",
            "requirement": "File ownership disclosure statement with SEC",
            "trigger": "At registration of security OR within 10 days of becoming beneficial owner",
            "deadline": "10 days",
            "penalty": "SEC enforcement action; potential fines and sanctions"
        },
        {
            "id": "req_3",
            "policy": "Sarbanes-Oxley Act - Section 302",
            "actor": "CEO and CFO",
            "requirement": "Certify quarterly and annual reports",
            "trigger": "Filing of periodic reports",
            "deadline": "At time of filing",
            "penalty": "Criminal penalties, fines up to $5M, imprisonment up to 20 years"
        },
        {
            "id": "req_4",
            "policy": "SEC Regulation S-X",
            "actor": "Public company",
            "requirement": "Present financial statements in accordance with GAAP",
            "trigger": "Filing of periodic reports",
            "deadline": "At time of filing",
            "penalty": "SEC enforcement action, restatement requirements"
        },
        {
            "id": "req_5",
            "policy": "Securities Act of 1933 - Item 503",
            "actor": "Public company",
            "requirement": "Disclose material risk factors",
            "trigger": "Filing of registration statements",
            "deadline": "At time of filing",
            "penalty": "SEC enforcement action, potential liability"
        }
    ]

async def _load_orion_data():
    """Load Orion 10-K data from the JSON file."""
    try:
        import os
        orion_file_path = os.path.join(os.path.dirname(__file__), "../../../organization_data/orion_10k_full_v2.json")
        
        with open(orion_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading Orion data: {e}")
        return None
