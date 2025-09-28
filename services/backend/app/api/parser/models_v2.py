from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"

class DocumentType(str, Enum):
    PDF = "PDF"
    DOCX = "DOCX"
    TXT = "TXT"

class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class RequirementType(str, Enum):
    OBLIGATION = "OBLIGATION"
    PROHIBITION = "PROHIBITION"
    REPORTING = "REPORTING"
    DISCLOSURE = "DISCLOSURE"
    DEADLINE = "DEADLINE"
    THRESHOLD = "THRESHOLD"
    PROCEDURE = "PROCEDURE"
    STANDARD = "STANDARD"

class EntityLabel(str, Enum):
    ORG = "ORG"
    DATE = "DATE"
    MONEY = "MONEY"
    FORM = "FORM"
    PENALTY = "PENALTY"

class PenaltyType(str, Enum):
    MONETARY = "MONETARY"
    REGULATORY = "REGULATORY"
    OPERATIONAL = "OPERATIONAL"
    REPUTATIONAL = "REPUTATIONAL"

class JobType(str, Enum):
    RULE_EXTRACTION = "RULE_EXTRACTION"
    ENTITY_EXTRACTION = "ENTITY_EXTRACTION"
    COMPLIANCE_CHECK = "COMPLIANCE_CHECK"

class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ReportType(str, Enum):
    COMPLIANCE_SUMMARY = "COMPLIANCE_SUMMARY"
    RULE_ANALYSIS = "RULE_ANALYSIS"
    ENTITY_REPORT = "ENTITY_REPORT"
    PERFORMANCE_METRICS = "PERFORMANCE_METRICS"

# Base Models
class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, description="User's full name")
    role: UserRole = Field(UserRole.USER, description="User role")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User password")

class UserResponse(UserBase):
    id: str = Field(..., description="User ID")
    is_active: bool = Field(True, description="Whether user is active")
    created_at: datetime = Field(..., description="User creation timestamp")
    updated_at: datetime = Field(..., description="User last update timestamp")

class DocumentBase(BaseModel):
    filename: str = Field(..., description="Document filename")
    original_filename: str = Field(..., description="Original filename")
    document_type: DocumentType = Field(..., description="Document type")
    file_size: Optional[int] = Field(None, description="File size in bytes")

class DocumentCreate(DocumentBase):
    content: Optional[str] = Field(None, description="Document content")

class DocumentResponse(DocumentBase):
    id: str = Field(..., description="Document ID")
    user_id: str = Field(..., description="User ID who uploaded the document")
    file_path: Optional[str] = Field(None, description="File storage path")
    content: Optional[str] = Field(None, description="Document content")
    upload_date: datetime = Field(..., description="Upload timestamp")
    processed: bool = Field(False, description="Whether document has been processed")
    processing_status: ProcessingStatus = Field(ProcessingStatus.PENDING, description="Processing status")
    processing_started_at: Optional[datetime] = Field(None, description="Processing start time")
    processing_completed_at: Optional[datetime] = Field(None, description="Processing completion time")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")

class ComplianceRequirementBase(BaseModel):
    title: str = Field(..., description="Requirement title")
    description: str = Field(..., description="Requirement description")
    requirement_type: RequirementType = Field(..., description="Type of compliance requirement")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    source_text: Optional[str] = Field(None, description="Source text from document")

class ComplianceRequirementCreate(ComplianceRequirementBase):
    document_id: str = Field(..., description="Document ID")
    bert_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="LegalBERT confidence score")
    extraction_method: str = Field("hybrid", description="Extraction method used")

class ComplianceRequirementResponse(ComplianceRequirementBase):
    id: str = Field(..., description="Requirement ID")
    document_id: str = Field(..., description="Document ID")
    bert_confidence: Optional[float] = Field(None, description="LegalBERT confidence score")
    extraction_method: str = Field(..., description="Extraction method used")
    created_at: datetime = Field(..., description="Creation timestamp")

class LegalEntityBase(BaseModel):
    text: str = Field(..., description="Entity text")
    label: EntityLabel = Field(..., description="Entity label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Entity confidence score")
    start_pos: int = Field(..., description="Start position in text")
    end_pos: int = Field(..., description="End position in text")

class LegalEntityCreate(LegalEntityBase):
    requirement_id: str = Field(..., description="Compliance requirement ID")

class LegalEntityResponse(LegalEntityBase):
    id: str = Field(..., description="Entity ID")
    requirement_id: str = Field(..., description="Compliance requirement ID")
    created_at: datetime = Field(..., description="Creation timestamp")

class DeadlineBase(BaseModel):
    description: str = Field(..., description="Deadline description")
    due_date: Optional[datetime] = Field(None, description="Due date")
    frequency: Optional[str] = Field(None, description="Frequency (monthly, quarterly, annually)")
    is_recurring: bool = Field(False, description="Whether deadline is recurring")

class DeadlineCreate(DeadlineBase):
    requirement_id: str = Field(..., description="Compliance requirement ID")

class DeadlineResponse(DeadlineBase):
    id: str = Field(..., description="Deadline ID")
    requirement_id: str = Field(..., description="Compliance requirement ID")

class PenaltyBase(BaseModel):
    description: str = Field(..., description="Penalty description")
    amount: Optional[float] = Field(None, description="Penalty amount")
    currency: Optional[str] = Field(None, description="Currency code")
    penalty_type: PenaltyType = Field(..., description="Type of penalty")

class PenaltyCreate(PenaltyBase):
    requirement_id: str = Field(..., description="Compliance requirement ID")

class PenaltyResponse(PenaltyBase):
    id: str = Field(..., description="Penalty ID")
    requirement_id: str = Field(..., description="Compliance requirement ID")

# API Response Models
class DocumentUploadResponse(BaseModel):
    document_id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Document filename")
    document_type: DocumentType = Field(..., description="Document type")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    upload_date: datetime = Field(..., description="Upload timestamp")
    message: str = Field(..., description="Success message")

class ComplianceRequirementExtractionResponse(BaseModel):
    document_id: str = Field(..., description="Document ID")
    requirements: List[ComplianceRequirementResponse] = Field(..., description="Extracted compliance requirements")
    total_requirements: int = Field(..., description="Total number of requirements")
    processing_time: float = Field(..., description="Processing time in seconds")
    message: str = Field(..., description="Success message")

class ComplianceRequirementSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    requirement_type: Optional[RequirementType] = Field(None, description="Filter by requirement type")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum confidence score")
    source_document: Optional[str] = Field(None, description="Filter by source document")

class ProcessingJobResponse(BaseModel):
    id: str = Field(..., description="Job ID")
    document_id: str = Field(..., description="Document ID")
    job_type: JobType = Field(..., description="Job type")
    status: JobStatus = Field(..., description="Job status")
    started_at: Optional[datetime] = Field(None, description="Job start time")
    completed_at: Optional[datetime] = Field(None, description="Job completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    processing_device: Optional[str] = Field(None, description="Processing device used")
    processing_time_seconds: Optional[int] = Field(None, description="Processing time in seconds")

class PerformanceInfoResponse(BaseModel):
    device: str = Field(..., description="Current processing device")
    gpu_available: bool = Field(..., description="Whether GPU is available")
    gpu_name: Optional[str] = Field(None, description="GPU name if available")
    cuda_version: Optional[str] = Field(None, description="CUDA version if available")
    model_loaded: bool = Field(..., description="Whether LegalBERT model is loaded")
    processing_speed: Optional[str] = Field(None, description="Processing speed information")

class ParserStatsResponse(BaseModel):
    total_documents: int = Field(..., description="Total number of documents")
    processed_documents: int = Field(..., description="Number of processed documents")
    total_requirements: int = Field(..., description="Total number of compliance requirements")
    requirement_types: dict = Field(..., description="Count by requirement type")
    average_confidence: float = Field(..., description="Average confidence score")
