"""
Gap Analysis API Routes
Provides endpoints for performing gap analysis between company data and compliance requirements
"""

import json
import uuid
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from .gap_analysis_engine import GapAnalysisEngine, GapFinding, TaskItem
from .comprehensive_analysis import ComprehensiveAnalysisEngine
from .models_v3 import GapAnalysisResponse
from ...database import db

router = APIRouter(prefix="/gap-analysis", tags=["gap-analysis"])

@router.post("/analyze-orion-data")
async def analyze_orion_data():
    """Perform gap analysis using Orion 10-K data and existing compliance requirements."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        print("🔍 Starting Orion 10-K gap analysis...")
        
        # Load Orion 10-K data
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        # Get existing compliance requirements
        requirements = await prisma.finalcompliancerequirement.find_many()
        if not requirements:
            raise HTTPException(status_code=404, detail="No compliance requirements found")
        
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
        
        # Initialize gap analysis engine
        gap_engine = GapAnalysisEngine()
        
        # Perform gap analysis
        analysis_results = await gap_engine.perform_gap_analysis(orion_data, requirements_data)
        
        # Generate detailed findings
        findings = await gap_engine.generate_detailed_findings(analysis_results)
        
        # Generate actionable tasks
        tasks = await gap_engine.generate_actionable_tasks(findings)
        
        # Calculate compliance score
        compliance_score = gap_engine.calculate_compliance_score(findings)
        
        # Store results in database
        analysis_id = str(uuid.uuid4())
        await prisma.gapanalysis.create(data={
            "id": analysis_id,
            "companyData": json.dumps(orion_data),
            "requirementsData": json.dumps(requirements_data),
            "analysisResults": json.dumps(analysis_results),
            "findings": json.dumps([finding.__dict__ for finding in findings]),
            "tasks": json.dumps([task.__dict__ for task in tasks]),
            "complianceScore": compliance_score,
            "createdAt": datetime.now()
        })
        
        print(f"✅ Gap analysis completed successfully")
        
        return {
            "analysis_id": analysis_id,
            "compliance_score": compliance_score,
            "total_findings": len(findings),
            "total_tasks": len(tasks),
            "findings": [finding.__dict__ for finding in findings],
            "tasks": [task.__dict__ for task in tasks],
            "analysis_summary": analysis_results.get("gap_analysis", {}),
            "message": "Gap analysis completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Error in gap analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/findings/{analysis_id}")
async def get_findings(analysis_id: str):
    """Get findings for a specific gap analysis."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get analysis record
        analysis = await prisma.gapanalysis.find_unique(where={"id": analysis_id})
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        findings = json.loads(analysis.findings) if analysis.findings else []
        
        return {
            "analysis_id": analysis_id,
            "findings": findings,
            "total_findings": len(findings),
            "compliance_score": analysis.complianceScore
        }
        
    except Exception as e:
        print(f"❌ Error getting findings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get findings: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/tasks/{analysis_id}")
async def get_tasks(analysis_id: str):
    """Get tasks for a specific gap analysis."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get analysis record
        analysis = await prisma.gapanalysis.find_unique(where={"id": analysis_id})
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        tasks = json.loads(analysis.tasks) if analysis.tasks else []
        
        return {
            "analysis_id": analysis_id,
            "tasks": tasks,
            "total_tasks": len(tasks)
        }
        
    except Exception as e:
        print(f"❌ Error getting tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/chunk-analysis")
async def perform_chunked_analysis():
    """Perform gap analysis using chunked data for large datasets."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        print("🔍 Starting chunked gap analysis...")
        
        # Load Orion 10-K data
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        # Get existing compliance requirements
        requirements = await prisma.finalcompliancerequirement.find_many()
        if not requirements:
            raise HTTPException(status_code=404, detail="No compliance requirements found")
        
        # Initialize gap analysis engine
        gap_engine = GapAnalysisEngine()
        
        # Chunk the data for processing
        data_chunks = gap_engine.chunk_data_for_analysis(orion_data, chunk_size=1000)
        
        all_findings = []
        all_tasks = []
        
        # Process each chunk
        for i, chunk in enumerate(data_chunks):
            print(f"Processing chunk {i+1}/{len(data_chunks)}: {chunk['chunk_id']}")
            
            # Convert requirements to dictionaries
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
            
            # Perform analysis on this chunk
            analysis_results = await gap_engine.perform_gap_analysis(chunk["data"], requirements_data)
            findings = await gap_engine.generate_detailed_findings(analysis_results)
            tasks = await gap_engine.generate_actionable_tasks(findings)
            
            all_findings.extend(findings)
            all_tasks.extend(tasks)
        
        # Calculate overall compliance score
        compliance_score = gap_engine.calculate_compliance_score(all_findings)
        
        # Store results
        analysis_id = str(uuid.uuid4())
        await prisma.gapanalysis.create(data={
            "id": analysis_id,
            "companyData": json.dumps(orion_data),
            "requirementsData": json.dumps(requirements_data),
            "analysisResults": json.dumps({"chunked_analysis": True, "total_chunks": len(data_chunks)}),
            "findings": json.dumps([finding.__dict__ for finding in all_findings]),
            "tasks": json.dumps([task.__dict__ for task in all_tasks]),
            "complianceScore": compliance_score,
            "createdAt": datetime.now()
        })
        
        print(f"✅ Chunked gap analysis completed successfully")
        
        return {
            "analysis_id": analysis_id,
            "compliance_score": compliance_score,
            "total_findings": len(all_findings),
            "total_tasks": len(all_tasks),
            "total_chunks": len(data_chunks),
            "findings": [finding.__dict__ for finding in all_findings],
            "tasks": [task.__dict__ for task in all_tasks],
            "message": "Chunked gap analysis completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Error in chunked analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Chunked analysis failed: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/analysis-summary/{analysis_id}")
async def get_analysis_summary(analysis_id: str):
    """Get summary of gap analysis results."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get analysis record
        analysis = await prisma.gapanalysis.find_unique(where={"id": analysis_id})
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        findings = json.loads(analysis.findings) if analysis.findings else []
        tasks = json.loads(analysis.tasks) if analysis.tasks else []
        
        # Calculate summary statistics
        severity_counts = {"High": 0, "Medium": 0, "Low": 0}
        priority_counts = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        
        for finding in findings:
            severity = finding.get("severity", "Medium")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            priority = str(finding.get("priority", 3))
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        task_status_counts = {"Pending": 0, "In Progress": 0, "Completed": 0}
        for task in tasks:
            status = task.get("status", "Pending")
            task_status_counts[status] = task_status_counts.get(status, 0) + 1
        
        return {
            "analysis_id": analysis_id,
            "compliance_score": analysis.complianceScore,
            "total_findings": len(findings),
            "total_tasks": len(tasks),
            "severity_breakdown": severity_counts,
            "priority_breakdown": priority_counts,
            "task_status_breakdown": task_status_counts,
            "created_at": analysis.createdAt.isoformat() if analysis.createdAt else None
        }
        
    except Exception as e:
        print(f"❌ Error getting analysis summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis summary: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/all-analyses")
async def get_all_analyses():
    """Get all gap analyses."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        analyses = await prisma.gapanalysis.find_many(
            order_by={"createdAt": "desc"}
        )
        
        analysis_summaries = []
        for analysis in analyses:
            findings = json.loads(analysis.findings) if analysis.findings else []
            tasks = json.loads(analysis.tasks) if analysis.tasks else []
            
            analysis_summaries.append({
                "id": analysis.id,
                "compliance_score": analysis.complianceScore,
                "total_findings": len(findings),
                "total_tasks": len(tasks),
                "created_at": analysis.createdAt.isoformat() if analysis.createdAt else None
            })
        
        return {
            "analyses": analysis_summaries,
            "total_analyses": len(analysis_summaries)
        }
        
    except Exception as e:
        print(f"❌ Error getting all analyses: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analyses: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/comprehensive-analysis")
async def perform_comprehensive_analysis():
    """Perform comprehensive analysis including gap analysis, findings, and tasks."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        print("🚀 Starting comprehensive analysis...")
        
        # Load Orion 10-K data
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        # Get existing compliance requirements
        requirements = await prisma.finalcompliancerequirement.find_many()
        if not requirements:
            raise HTTPException(status_code=404, detail="No compliance requirements found")
        
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
        
        # Initialize comprehensive analysis engine
        analysis_engine = ComprehensiveAnalysisEngine()
        
        # Perform comprehensive analysis
        analysis_results = await analysis_engine.perform_comprehensive_analysis(orion_data, requirements_data)
        
        # Store results in database
        analysis_id = analysis_results.get("analysis_id", str(uuid.uuid4()))
        await prisma.gapanalysis.create(data={
            "id": analysis_id,
            "companyData": json.dumps(orion_data),
            "requirementsData": json.dumps(requirements_data),
            "analysisResults": json.dumps(analysis_results.get("gap_analysis", {})),
            "findings": json.dumps(analysis_results.get("findings", [])),
            "tasks": json.dumps(analysis_results.get("tasks", [])),
            "complianceScore": analysis_results.get("compliance_score", 0.0),
            "createdAt": datetime.now()
        })
        
        print(f"✅ Comprehensive analysis completed successfully")
        
        return {
            "analysis_id": analysis_id,
            "compliance_score": analysis_results.get("compliance_score", 0.0),
            "findings": analysis_results.get("findings", []),
            "tasks": analysis_results.get("tasks", []),
            "summary": analysis_results.get("summary", {}),
            "processing_metadata": analysis_results.get("processing_metadata", {}),
            "message": "Comprehensive analysis completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {str(e)}")
    finally:
        await db.disconnect()

async def _load_orion_data() -> Optional[Dict[str, Any]]:
    """Load Orion 10-K data from the JSON file."""
    try:
        import os
        orion_file_path = os.path.join(os.path.dirname(__file__), "../../../organization_data/orion_10k_full_v2.json")
        
        with open(orion_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading Orion data: {e}")
        return None
