"""
Gap Analyses API Routes
Simple endpoint to fetch all data from gap_analyses table
"""

import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ...database import db

router = APIRouter(prefix="/gap-analyses", tags=["gap-analyses"])

@router.get("/get-all")
async def get_all_gap_analyses():
    """
    Fetch all data from gap_analyses table
    Returns all gap analyses for frontend rendering
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Fetch all gap analyses from database - simple query
        analyses = await prisma.gapanalysis.find_many()
        
        # Convert Prisma objects to dictionaries
        analyses_data = []
        for analysis in analyses:
            analysis_dict = {
                "id": analysis.id,
                "companyData": analysis.companyData,
                "requirementsData": analysis.requirementsData,
                "analysisResults": analysis.analysisResults,
                "findings": analysis.findings,
                "tasks": analysis.tasks,
                "complianceScore": analysis.complianceScore,
                "createdAt": analysis.createdAt.isoformat() if analysis.createdAt else None
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
