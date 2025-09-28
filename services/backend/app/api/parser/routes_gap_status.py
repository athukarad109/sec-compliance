"""
Gap Analysis Status API Routes
Simple endpoints to manage gap analysis statuses
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ...database import db

router = APIRouter(prefix="/gap-status", tags=["gap-status"])

@router.get("/all")
async def get_all_gap_analyses():
    """
    Fetch all gap analyses with their statuses
    Returns all gap analyses for frontend rendering
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Fetch all gap analyses from database
        analyses = await prisma.gapanalysis.find_many()
        
        # Convert Prisma objects to dictionaries
        analyses_data = []
        for analysis in analyses:
            analysis_dict = {
                "id": analysis.id,
                "compliance_score": analysis.complianceScore,
                "created_at": analysis.createdAt.isoformat() if analysis.createdAt else None,
                "status": "Completed",  # Default status since analysis is done
                "findings_count": len(analysis.findings) if analysis.findings else 0,
                "tasks_count": len(analysis.tasks) if analysis.tasks else 0
            }
            analyses_data.append(analysis_dict)
        
        await db.disconnect()
        
        return {
            "success": True,
            "total_analyses": len(analyses_data),
            "analyses": analyses_data
        }
        
    except Exception as e:
        print(f"Error fetching gap analyses: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gap analyses: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/status-summary")
async def get_status_summary():
    """
    Get summary of gap analysis statuses
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get all analyses
        analyses = await prisma.gapanalysis.find_many()
        
        # Count by status (for now, all are "Completed" since they're finished analyses)
        status_counts = {
            "To-do": 0,
            "In-progress": 0,
            "Completed": len(analyses)
        }
        
        # Calculate average compliance score
        total_score = sum(analysis.complianceScore for analysis in analyses)
        avg_score = total_score / len(analyses) if analyses else 0
        
        await db.disconnect()
        
        return {
            "success": True,
            "status_counts": status_counts,
            "total_analyses": len(analyses),
            "average_compliance_score": round(avg_score, 2)
        }
        
    except Exception as e:
        print(f"Error getting status summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status summary: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/{analysis_id}")
async def get_gap_analysis_by_id(analysis_id: str):
    """
    Get specific gap analysis by ID
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Fetch specific gap analysis
        analysis = await prisma.gapanalysis.find_unique(where={"id": analysis_id})
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Gap analysis not found")
        
        # Convert to dictionary
        analysis_data = {
            "id": analysis.id,
            "compliance_score": analysis.complianceScore,
            "created_at": analysis.createdAt.isoformat() if analysis.createdAt else None,
            "status": "Completed",
            "company_data": analysis.companyData,
            "requirements_data": analysis.requirementsData,
            "analysis_results": analysis.analysisResults,
            "findings": analysis.findings,
            "tasks": analysis.tasks
        }
        
        await db.disconnect()
        
        return {
            "success": True,
            "analysis": analysis_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching gap analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gap analysis: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/recent/{limit}")
async def get_recent_analyses(limit: int = 5):
    """
    Get recent gap analyses
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Fetch recent analyses (limit the number)
        analyses = await prisma.gapanalysis.find_many(
            take=limit
        )
        
        # Convert to dictionaries
        analyses_data = []
        for analysis in analyses:
            analysis_dict = {
                "id": analysis.id,
                "compliance_score": analysis.complianceScore,
                "created_at": analysis.createdAt.isoformat() if analysis.createdAt else None,
                "status": "Completed",
                "findings_count": len(analysis.findings) if analysis.findings else 0,
                "tasks_count": len(analysis.tasks) if analysis.tasks else 0
            }
            analyses_data.append(analysis_dict)
        
        await db.disconnect()
        
        return {
            "success": True,
            "total_analyses": len(analyses_data),
            "analyses": analyses_data
        }
        
    except Exception as e:
        print(f"Error fetching recent analyses: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent analyses: {str(e)}")
    finally:
        await db.disconnect()
