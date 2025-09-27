from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import time
import os

from .models import (
    DocumentUploadResponse, 
    RuleExtractionResponse, 
    RuleSearchRequest,
    LegalDocument,
    ComplianceRule
)
from .document_extractor import DocumentExtractor
from .parser_engine import LegalParserEngine

router = APIRouter()

# Initialize components
document_extractor = DocumentExtractor()
parser_engine = LegalParserEngine()

# In-memory storage for demo purposes
# In production, this would be replaced with a database
documents_storage: dict[str, LegalDocument] = {}
rules_storage: dict[str, ComplianceRule] = {}


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
        documents_storage[document.id] = document
        
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


@router.post("/extract-rules/{document_id}", response_model=RuleExtractionResponse)
async def extract_rules(document_id: str):
    """Extract compliance rules from a document."""
    try:
        # Get document
        if document_id not in documents_storage:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = documents_storage[document_id]
        
        # Extract rules
        start_time = time.time()
        rules = parser_engine.extract_rules(document)
        processing_time = time.time() - start_time
        
        # Store rules
        for rule in rules:
            rules_storage[rule.rule_id] = rule
        
        # Mark document as processed
        document.processed = True
        
        return RuleExtractionResponse(
            document_id=document_id,
            rules=rules,
            total_rules=len(rules),
            processing_time=processing_time,
            message=f"Successfully extracted {len(rules)} rules from document"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting rules: {str(e)}")


@router.get("/rules/{rule_id}")
async def get_rule(rule_id: str):
    """Get a specific rule by ID."""
    if rule_id not in rules_storage:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return rules_storage[rule_id]


@router.get("/rules", response_model=List[ComplianceRule])
async def search_rules(
    query: Optional[str] = Query(None, description="Search query"),
    rule_type: Optional[str] = Query(None, description="Filter by rule type"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score"),
    source_document: Optional[str] = Query(None, description="Filter by source document")
):
    """Search and filter rules."""
    try:
        rules = list(rules_storage.values())
        
        # Apply filters
        if query:
            rules = [rule for rule in rules if query.lower() in rule.description.lower()]
        
        if rule_type:
            rules = [rule for rule in rules if rule.rule_type.value == rule_type]
        
        if min_confidence is not None:
            rules = [rule for rule in rules if rule.confidence_score >= min_confidence]
        
        if source_document:
            rules = [rule for rule in rules if source_document.lower() in rule.source_document.lower()]
        
        return rules
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching rules: {str(e)}")


@router.post("/validate-rule/{rule_id}")
async def validate_rule(rule_id: str):
    """Validate a specific rule."""
    if rule_id not in rules_storage:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule = rules_storage[rule_id]
    
    # Simple validation logic
    validation_result = {
        "rule_id": rule_id,
        "is_valid": True,
        "issues": [],
        "suggestions": []
    }
    
    # Check for missing information
    if not rule.requirements:
        validation_result["issues"].append("No requirements specified")
        validation_result["is_valid"] = False
    
    if rule.confidence_score < 0.5:
        validation_result["issues"].append("Low confidence score")
        validation_result["suggestions"].append("Review and refine rule description")
    
    if not rule.requirements[0].action:
        validation_result["issues"].append("No action specified in requirements")
        validation_result["is_valid"] = False
    
    return validation_result


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


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its associated rules."""
    if document_id not in documents_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove associated rules
    rules_to_remove = [
        rule_id for rule_id, rule in rules_storage.items() 
        if rule.source_document == documents_storage[document_id].filename
    ]
    
    for rule_id in rules_to_remove:
        del rules_storage[rule_id]
    
    # Remove document
    del documents_storage[document_id]
    
    return {"message": f"Document {document_id} and {len(rules_to_remove)} associated rules deleted"}


@router.get("/stats")
async def get_parser_stats():
    """Get parser statistics."""
    total_documents = len(documents_storage)
    processed_documents = sum(1 for doc in documents_storage.values() if doc.processed)
    total_rules = len(rules_storage)
    
    rule_types = {}
    for rule in rules_storage.values():
        rule_type = rule.rule_type.value
        rule_types[rule_type] = rule_types.get(rule_type, 0) + 1
    
    avg_confidence = sum(rule.confidence_score for rule in rules_storage.values()) / total_rules if total_rules > 0 else 0
    
    return {
        "total_documents": total_documents,
        "processed_documents": processed_documents,
        "total_rules": total_rules,
        "rule_types": rule_types,
        "average_confidence": round(avg_confidence, 3)
    }
