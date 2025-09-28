"""
Test Analysis API Routes
Provides endpoints for testing the gap analysis functionality
"""

import json
import uuid
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from .gap_analysis_engine import GapAnalysisEngine
from .simple_findings_generator import SimpleFindingsGenerator
from .comprehensive_analysis import ComprehensiveAnalysisEngine

router = APIRouter(prefix="/test-analysis", tags=["test-analysis"])

@router.post("/run-gap-analysis")
async def run_gap_analysis():
    """Run gap analysis test with Orion 10-K data."""
    try:
        print("🧪 Starting gap analysis test...")
        
        # Load Orion 10-K data
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        # Create sample compliance requirements
        sample_requirements = [
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
            }
        ]
        
        # Test 1: Basic Gap Analysis
        print("🔍 Running basic gap analysis...")
        gap_engine = GapAnalysisEngine()
        analysis_results = await gap_engine.perform_gap_analysis(orion_data, sample_requirements)
        
        # Test 2: Simple Findings Generation
        print("📋 Generating simple findings...")
        findings_generator = SimpleFindingsGenerator()
        simple_findings = await findings_generator.generate_simple_findings(orion_data, sample_requirements)
        
        # Test 3: Chunked Findings Generation
        print("📊 Generating chunked findings...")
        chunked_results = await findings_generator.generate_findings_from_chunks(orion_data, sample_requirements)
        
        # Test 4: Comprehensive Analysis
        print("🚀 Running comprehensive analysis...")
        comprehensive_engine = ComprehensiveAnalysisEngine()
        comprehensive_results = await comprehensive_engine.perform_comprehensive_analysis(orion_data, sample_requirements)
        
        print("✅ All tests completed successfully!")
        
        return {
            "test_id": str(uuid.uuid4()),
            "company_name": orion_data.get("company", {}).get("name", "Unknown"),
            "total_requirements": len(sample_requirements),
            "basic_analysis": {
                "total_gaps": analysis_results.get("gap_analysis", {}).get("total_gaps", 0),
                "compliance_score": analysis_results.get("gap_analysis", {}).get("compliance_score", 0.0)
            },
            "simple_findings": {
                "count": len(simple_findings),
                "findings": simple_findings[:5]  # First 5 findings
            },
            "chunked_findings": {
                "count": len(chunked_results.get("findings", [])),
                "chunks_processed": chunked_results.get("processing_metadata", {}).get("total_chunks", 0)
            },
            "comprehensive_analysis": {
                "analysis_id": comprehensive_results.get("analysis_id"),
                "compliance_score": comprehensive_results.get("compliance_score", 0.0),
                "total_findings": len(comprehensive_results.get("findings", [])),
                "total_tasks": len(comprehensive_results.get("tasks", [])),
                "summary": comprehensive_results.get("summary", {})
            },
            "message": "Gap analysis test completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Error in gap analysis test: {e}")
        raise HTTPException(status_code=500, detail=f"Gap analysis test failed: {str(e)}")

@router.post("/run-findings-test")
async def run_findings_test():
    """Run findings generation test."""
    try:
        print("📋 Starting findings generation test...")
        
        # Load Orion 10-K data
        orion_data = await _load_orion_data()
        if not orion_data:
            raise HTTPException(status_code=404, detail="Orion 10-K data not found")
        
        # Create sample requirements
        sample_requirements = [
            {
                "id": "req_1",
                "policy": "SEC Regulation S-X",
                "actor": "Public company",
                "requirement": "Present financial statements in accordance with GAAP",
                "trigger": "Filing of periodic reports",
                "deadline": "At time of filing",
                "penalty": "SEC enforcement action, restatement requirements"
            },
            {
                "id": "req_2",
                "policy": "Securities Act of 1933 - Item 503",
                "actor": "Public company",
                "requirement": "Disclose material risk factors",
                "trigger": "Filing of registration statements",
                "deadline": "At time of filing",
                "penalty": "SEC enforcement action, potential liability"
            }
        ]
        
        # Test findings generation
        findings_generator = SimpleFindingsGenerator()
        
        # Test on financial data
        financial_data = orion_data.get("part2", {}).get("item8_financial_statements", {})
        financial_findings = await findings_generator.generate_simple_findings(
            {"financial_statements": financial_data}, 
            sample_requirements
        )
        
        # Test on risk factors
        risk_factors = orion_data.get("part1", {}).get("item1a_risk_factors", [])
        risk_findings = await findings_generator.generate_simple_findings(
            {"risk_factors": risk_factors}, 
            sample_requirements
        )
        
        print("✅ Findings generation test completed!")
        
        return {
            "test_id": str(uuid.uuid4()),
            "financial_findings": {
                "count": len(financial_findings),
                "findings": financial_findings[:3]  # First 3 findings
            },
            "risk_findings": {
                "count": len(risk_findings),
                "findings": risk_findings[:3]  # First 3 findings
            },
            "message": "Findings generation test completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Error in findings test: {e}")
        raise HTTPException(status_code=500, detail=f"Findings test failed: {str(e)}")

@router.get("/analysis-status")
async def get_analysis_status():
    """Get the status of gap analysis system."""
    try:
        # Check if Orion data is available
        orion_data = await _load_orion_data()
        orion_available = orion_data is not None
        
        # Check OpenAI API key
        import os
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_available = openai_key is not None and len(openai_key) > 0
        
        return {
            "system_status": "operational",
            "orion_data_available": orion_available,
            "openai_available": openai_available,
            "company_name": orion_data.get("company", {}).get("name", "Unknown") if orion_available else None,
            "data_sections": list(orion_data.keys()) if orion_available else [],
            "message": "Gap analysis system status retrieved successfully"
        }
        
    except Exception as e:
        print(f"❌ Error getting analysis status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis status: {str(e)}")

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
