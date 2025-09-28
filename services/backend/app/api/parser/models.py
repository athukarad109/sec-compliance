from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from enum import Enum


class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"


class RuleType(str, Enum):
    OBLIGATION = "obligation"
    PROHIBITION = "prohibition"
    CONDITION = "condition"
    REPORTING = "reporting_obligation"
    DISCLOSURE = "disclosure_requirement"


class LegalDocument(BaseModel):
    id: str = Field(..., description="Unique document identifier")
    filename: str = Field(..., description="Original filename")
    content: str = Field(..., description="Extracted text content")
    document_type: DocumentType = Field(..., description="Type of document")
    upload_date: datetime = Field(default_factory=datetime.now)
    processed: bool = Field(default=False, description="Whether document has been processed")
    file_size: Optional[int] = Field(None, description="File size in bytes")


class Requirement(BaseModel):
    action: str = Field(..., description="Required action to be taken")
    deadline: Optional[str] = Field(None, description="Deadline or timeframe")
    entities: List[str] = Field(default_factory=list, description="Entities subject to requirement")
    thresholds: Optional[Dict[str, Any]] = Field(None, description="Monetary or other thresholds")
    conditions: List[str] = Field(default_factory=list, description="Conditions for the requirement")


class PenaltyInfo(BaseModel):
    late_filing: Optional[str] = Field(None, description="Penalty for late filing")
    material_misstatement: Optional[str] = Field(None, description="Penalty for material misstatement")
    other: Optional[str] = Field(None, description="Other penalties")


class LegalEntity(BaseModel):
    text: str = Field(..., description="Extracted entity text")
    label: str = Field(..., description="Entity label (ORG, DATE, MONEY, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Entity confidence score")
    start_pos: int = Field(..., description="Start position in text")
    end_pos: int = Field(..., description="End position in text")


class ComplianceRule(BaseModel):
    rule_id: str = Field(..., description="Unique rule identifier")
    title: str = Field(..., description="Rule title")
    rule_type: RuleType = Field(..., description="Type of compliance rule")
    description: str = Field(..., description="Detailed rule description")
    requirements: List[Requirement] = Field(..., description="List of requirements")
    penalties: Optional[PenaltyInfo] = Field(None, description="Penalty information")
    exceptions: List[str] = Field(default_factory=list, description="List of exceptions")
    source_document: str = Field(..., description="Source document filename")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1)")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class EnhancedComplianceRule(ComplianceRule):
    legal_entities: List[LegalEntity] = Field(default_factory=list, description="Legal entities extracted by LegalBERT")
    bert_confidence: float = Field(0.0, ge=0.0, le=1.0, description="LegalBERT confidence score")
    extraction_method: str = Field("hybrid", description="Extraction method used")


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    document_type: DocumentType
    file_size: int
    upload_date: datetime
    message: str


class RuleExtractionResponse(BaseModel):
    document_id: str
    rules: List[ComplianceRule]
    total_rules: int
    processing_time: float
    message: str


class RuleSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    rule_type: Optional[RuleType] = Field(None, description="Filter by rule type")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum confidence score")
    source_document: Optional[str] = Field(None, description="Filter by source document")
