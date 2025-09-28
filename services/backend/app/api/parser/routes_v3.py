"""
Enhanced API Routes for RegTech Compliance Pipeline
Implements the new JSON structure for compliance requirements
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import time
import os

from .models_v3 import (
    DocumentUploadResponse,
    ComplianceRequirementExtractionResponse,
    HarmonizationResponse,
    GapAnalysisResponse,
    PerformanceInfoResponse,
    ParserStatsResponse,
    ComplianceRequirement
)
from .document_extractor import DocumentExtractor
from .enhanced_parser_engine import EnhancedComplianceParser
from .semantic_clustering_engine import SemanticClusteringEngine
from .organization_mapping_engine import OrganizationMappingEngine

router = APIRouter()

# Initialize components
document_extractor = DocumentExtractor()
enhanced_parser = EnhancedComplianceParser()
clustering_engine = SemanticClusteringEngine()
mapping_engine = OrganizationMappingEngine()

# In-memory storage for demo purposes
documents_storage: dict[str, dict] = {}
requirements_storage: dict[str, ComplianceRequirement] = {}

@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a legal document for processing."""
    try:
        # Validate file type
        document_type = document_extractor.get_document_type(file.filename)
        
        # Read file content
        file_content = await file.read()
        
        # Save file
        file_path, file_size = document_extractor.save_uploaded_file(file_content, file.filename)
        
        # Extract text content
        content = document_extractor.extract_text(file_path, document_type)
        
        # Create document record
        document = document_extractor.create_document_record(
            filename=file.filename,
            content=content,
            document_type=document_type,
            file_size=file_size
        )
        
        # Store document
        documents_storage[document.id] = {
            'id': document.id,
            'filename': document.filename,
            'content': content,
            'document_type': document.document_type,
            'file_size': document.file_size,
            'upload_date': document.upload_date,
            'processed': False
        }
        
        # Clean up temporary file
        os.remove(file_path)
        
        return DocumentUploadResponse(
            document_id=document.id,
            filename=document.filename,
            document_type=document.document_type,
            file_size=document.file_size,
            upload_date=document.upload_date,
            message=f"Document '{file.filename}' uploaded successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.post("/extract-requirements/{document_id}", response_model=ComplianceRequirementExtractionResponse)
async def extract_compliance_requirements(document_id: str):
    """Extract compliance requirements using the new RegTech structure."""
    try:
        if document_id not in documents_storage:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = documents_storage[document_id]
        
        print(f"\n🚀 Starting compliance requirement extraction for document: {document_id}")
        print(f"   → Document: {document['filename']}")
        print(f"   → Size: {len(document['content'])} characters")
        
        start_time = time.time()
        
        # Extract compliance requirements using enhanced parser
        requirements = enhanced_parser.extract_compliance_requirements(document['content'])
        
        processing_time = time.time() - start_time
        
        print(f"✅ Extracted {len(requirements)} compliance requirements in {processing_time:.2f} seconds!")
        
        # Store requirements
        for req in requirements:
            requirements_storage[req.policy] = req
        
        # Mark document as processed
        documents_storage[document_id]['processed'] = True
        
        # Extract metadata for analysis
        regulatory_frameworks = list(set([req.regulatory_framework for req in requirements if req.regulatory_framework]))
        actor_types = list(set([req.actor for req in requirements]))
        
        # Risk assessment
        risk_assessment = {
            'high_risk_requirements': len([req for req in requirements if req.risk_level == 'High']),
            'medium_risk_requirements': len([req for req in requirements if req.risk_level == 'Medium']),
            'low_risk_requirements': len([req for req in requirements if req.risk_level == 'Low']),
            'average_confidence': sum(req.confidence_score for req in requirements) / len(requirements) if requirements else 0
        }
        
        return ComplianceRequirementExtractionResponse(
            document_id=document_id,
            requirements=requirements,
            total_requirements=len(requirements),
            processing_time=processing_time,
            message=f"Successfully extracted {len(requirements)} compliance requirements",
            regulatory_frameworks=regulatory_frameworks,
            actor_types=actor_types,
            risk_assessment=risk_assessment
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting requirements: {str(e)}")

@router.post("/harmonize-requirements", response_model=HarmonizationResponse)
async def harmonize_requirements(requirements: List[ComplianceRequirement]):
    """Harmonize compliance requirements using semantic clustering."""
    try:
        print(f"\n🔄 Starting requirement harmonization for {len(requirements)} requirements")
        
        start_time = time.time()
        
        # Perform harmonization
        harmonization_result = clustering_engine.harmonize_requirements(requirements)
        
        processing_time = time.time() - start_time
        
        print(f"✅ Harmonization complete in {processing_time:.2f} seconds!")
        print(f"   → Original requirements: {len(requirements)}")
        print(f"   → Harmonized requirements: {len(harmonization_result.harmonized_requirements)}")
        print(f"   → Clusters created: {len(harmonization_result.clusters)}")
        print(f"   → Harmonization ratio: {harmonization_result.harmonization_ratio:.2%}")
        
        return harmonization_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error harmonizing requirements: {str(e)}")

@router.post("/map-to-organization", response_model=List[dict])
async def map_requirements_to_organization(requirements: List[ComplianceRequirement]):
    """Map compliance requirements to organizational structure."""
    try:
        print(f"\n🏢 Mapping {len(requirements)} requirements to organizational structure")
        
        start_time = time.time()
        
        # Map requirements to organization
        mappings = mapping_engine.map_requirements_to_organization(requirements)
        
        processing_time = time.time() - start_time
        
        print(f"✅ Organization mapping complete in {processing_time:.2f} seconds!")
        
        # Convert to dict for response
        mapping_dicts = []
        for mapping in mappings:
            mapping_dicts.append({
                'requirement_id': mapping.requirement_id,
                'actor': mapping.actor,
                'mapped_roles': mapping.mapped_roles,
                'responsible_unit': mapping.responsible_unit,
                'existing_controls': mapping.existing_controls,
                'capability_assessment': mapping.capability_assessment
            })
        
        return mapping_dicts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error mapping to organization: {str(e)}")

@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def perform_gap_analysis(requirements: List[ComplianceRequirement]):
    """Perform comprehensive gap analysis."""
    try:
        print(f"\n📊 Starting gap analysis for {len(requirements)} requirements")
        
        start_time = time.time()
        
        # Perform gap analysis
        gap_analysis_result = mapping_engine.perform_gap_analysis(requirements)
        
        processing_time = time.time() - start_time
        
        print(f"✅ Gap analysis complete in {processing_time:.2f} seconds!")
        print(f"   → Total gaps identified: {gap_analysis_result.total_gaps}")
        print(f"   → High priority gaps: {gap_analysis_result.high_priority_gaps}")
        print(f"   → Medium priority gaps: {gap_analysis_result.medium_priority_gaps}")
        print(f"   → Low priority gaps: {gap_analysis_result.low_priority_gaps}")
        print(f"   → Overall compliance score: {gap_analysis_result.overall_compliance_score:.2%}")
        
        return gap_analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing gap analysis: {str(e)}")

@router.get("/requirements", response_model=List[ComplianceRequirement])
async def get_all_requirements():
    """Get all extracted compliance requirements."""
    return list(requirements_storage.values())

@router.get("/requirements/{requirement_id}")
async def get_requirement(requirement_id: str):
    """Get a specific compliance requirement by ID."""
    if requirement_id not in requirements_storage:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    return requirements_storage[requirement_id]

@router.get("/documents")
async def list_documents():
    """List all uploaded documents."""
    return list(documents_storage.values())

@router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document by ID."""
    if document_id not in documents_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return documents_storage[document_id]

@router.get("/performance-info", response_model=PerformanceInfoResponse)
async def get_performance_info():
    """Get performance information."""
    return PerformanceInfoResponse(
        device="CPU",  # Placeholder
        gpu_available=False,
        gpu_name=None,
        cuda_version=None,
        model_loaded=True,
        processing_speed="Standard"
    )

@router.get("/stats", response_model=ParserStatsResponse)
async def get_parser_stats():
    """Get parser statistics."""
    total_documents = len(documents_storage)
    processed_documents = sum(1 for doc in documents_storage.values() if doc['processed'])
    total_requirements = len(requirements_storage)
    
    # Count by regulatory framework
    regulatory_frameworks = {}
    for req in requirements_storage.values():
        if req.regulatory_framework:
            regulatory_frameworks[req.regulatory_framework] = regulatory_frameworks.get(req.regulatory_framework, 0) + 1
    
    # Count by actor type
    actor_types = {}
    for req in requirements_storage.values():
        actor_types[req.actor] = actor_types.get(req.actor, 0) + 1
    
    avg_confidence = sum(req.confidence_score for req in requirements_storage.values()) / total_requirements if total_requirements > 0 else 0
    
    return ParserStatsResponse(
        total_documents=total_documents,
        processed_documents=processed_documents,
        total_requirements=total_requirements,
        regulatory_frameworks=regulatory_frameworks,
        actor_types=actor_types,
        average_confidence=round(avg_confidence, 3)
    )

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its associated requirements."""
    if document_id not in documents_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove associated requirements
    requirements_to_remove = [
        req_id for req_id, req in requirements_storage.items() 
        if req.source_text and document_id in req.source_text
    ]
    
    for req_id in requirements_to_remove:
        del requirements_storage[req_id]
    
    # Remove document
    del documents_storage[document_id]
    
    return {"message": f"Document {document_id} and {len(requirements_to_remove)} associated requirements deleted"}
