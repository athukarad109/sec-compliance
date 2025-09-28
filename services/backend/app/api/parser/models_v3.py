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

class ControlStatus(str, Enum):
    IMPLEMENTED = "IMPLEMENTED"
    PENDING = "PENDING"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    PARTIAL = "PARTIAL"

class ControlCategory(str, Enum):
    INSIDER_REPORTING = "INSIDER_REPORTING"
    FINANCIAL_REPORTING = "FINANCIAL_REPORTING"
    DISCLOSURE = "DISCLOSURE"
    GOVERNANCE = "GOVERNANCE"
    RISK_MANAGEMENT = "RISK_MANAGEMENT"
    COMPLIANCE = "COMPLIANCE"

# New RegTech JSON Structure Models
class MappedControl(BaseModel):
    """Control mapping for compliance requirements."""
    control_id: str = Field(..., description="Unique control identifier")
    category: ControlCategory = Field(..., description="Control category")
    status: ControlStatus = Field(..., description="Current implementation status")
    description: Optional[str] = Field(None, description="Control description")
    responsible_party: Optional[str] = Field(None, description="Responsible party")
    last_reviewed: Optional[datetime] = Field(None, description="Last review date")

class ComplianceRequirement(BaseModel):
    """Enhanced compliance requirement with RegTech structure."""
    policy: str = Field(..., description="Regulatory policy/framework (e.g., 'Securities Exchange Act of 1934 - Section 16(a)')")
    actor: str = Field(..., description="Responsible party/entity (e.g., 'Beneficial owner of >10% equity security')")
    requirement: str = Field(..., description="Specific compliance requirement (e.g., 'File ownership disclosure statement with SEC')")
    trigger: str = Field(..., description="Event that triggers the requirement (e.g., 'At registration of security OR within 10 days of becoming beneficial owner')")
    deadline: Optional[str] = Field(None, description="Deadline for compliance (e.g., '10 days')")
    penalty: Optional[str] = Field(None, description="Penalty for non-compliance (e.g., 'SEC enforcement action; potential fines and sanctions')")
    mapped_controls: List[MappedControl] = Field(default_factory=list, description="Mapped organizational controls")
    
    # Additional metadata for analysis
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="Extraction confidence score")
    source_text: Optional[str] = Field(None, description="Original source text")
    regulatory_framework: Optional[str] = Field(None, description="Regulatory framework")
    risk_level: Optional[str] = Field(None, description="Risk level (High/Medium/Low)")
    business_impact: Optional[str] = Field(None, description="Business impact assessment")

class ComplianceRequirementExtractionResponse(BaseModel):
    """Response for compliance requirement extraction."""
    document_id: str = Field(..., description="Document ID")
    requirements: List[ComplianceRequirement] = Field(..., description="Extracted compliance requirements")
    total_requirements: int = Field(..., description="Total number of requirements")
    processing_time: float = Field(..., description="Processing time in seconds")
    message: str = Field(..., description="Success message")
    
    # Analysis metadata
    regulatory_frameworks: List[str] = Field(default_factory=list, description="Identified regulatory frameworks")
    actor_types: List[str] = Field(default_factory=list, description="Identified actor types")
    risk_assessment: Optional[dict] = Field(None, description="Overall risk assessment")

class SemanticCluster(BaseModel):
    """Semantic cluster for requirement harmonization."""
    cluster_id: str = Field(..., description="Unique cluster identifier")
    cluster_name: str = Field(..., description="Cluster name/description")
    requirements: List[ComplianceRequirement] = Field(..., description="Requirements in this cluster")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Cluster similarity score")
    harmonized_requirement: Optional[ComplianceRequirement] = Field(None, description="Harmonized requirement")
    cluster_metadata: Optional[dict] = Field(None, description="Additional cluster metadata")

class HarmonizationResponse(BaseModel):
    """Response for requirement harmonization."""
    original_requirements: List[ComplianceRequirement] = Field(..., description="Original requirements")
    clusters: List[SemanticCluster] = Field(..., description="Semantic clusters")
    harmonized_requirements: List[ComplianceRequirement] = Field(..., description="Harmonized requirements")
    total_clusters: int = Field(..., description="Total number of clusters")
    harmonization_ratio: float = Field(..., description="Ratio of harmonized to original requirements")

class OrganizationMapping(BaseModel):
    """Organization mapping for requirements."""
    requirement_id: str = Field(..., description="Requirement ID")
    actor: str = Field(..., description="Original actor")
    mapped_roles: List[str] = Field(..., description="Mapped organizational roles")
    responsible_unit: str = Field(..., description="Responsible business unit")
    existing_controls: List[str] = Field(default_factory=list, description="Existing control IDs")
    capability_assessment: Optional[dict] = Field(None, description="Capability assessment")

class GapAnalysis(BaseModel):
    """Gap analysis for compliance requirements."""
    requirement_id: str = Field(..., description="Requirement ID")
    requirement: ComplianceRequirement = Field(..., description="Compliance requirement")
    current_state: dict = Field(..., description="Current organizational state")
    gaps: dict = Field(..., description="Identified gaps")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")
    priority: str = Field(..., description="Priority level (High/Medium/Low)")
    estimated_effort: Optional[str] = Field(None, description="Estimated implementation effort")

class GapAnalysisResponse(BaseModel):
    """Response for gap analysis."""
    requirements: List[ComplianceRequirement] = Field(..., description="Analyzed requirements")
    gap_analyses: List[GapAnalysis] = Field(..., description="Gap analyses")
    total_gaps: int = Field(..., description="Total number of gaps")
    high_priority_gaps: int = Field(..., description="High priority gaps")
    medium_priority_gaps: int = Field(..., description="Medium priority gaps")
    low_priority_gaps: int = Field(..., description="Low priority gaps")
    overall_compliance_score: float = Field(..., description="Overall compliance score")

# Legacy models for backward compatibility
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

class DocumentUploadResponse(BaseModel):
    document_id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Document filename")
    document_type: DocumentType = Field(..., description="Document type")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    upload_date: datetime = Field(..., description="Upload timestamp")
    message: str = Field(..., description="Success message")

class PerformanceInfoResponse(BaseModel):
    device: str = Field(..., description="Current processing device")
    gpu_available: bool = Field(..., description="Whether GPU is available")
    gpu_name: Optional[str] = Field(None, description="GPU name if available")
    cuda_version: Optional[str] = Field(None, description="CUDA version if available")
    model_loaded: bool = Field(..., description="Whether LegalBERT model is loaded", alias="model_loaded")
    processing_speed: Optional[str] = Field(None, description="Processing speed information")
    
    class Config:
        protected_namespaces = ()

class ParserStatsResponse(BaseModel):
    total_documents: int = Field(..., description="Total number of documents")
    processed_documents: int = Field(..., description="Number of processed documents")
    total_requirements: int = Field(..., description="Total number of compliance requirements")
    regulatory_frameworks: dict = Field(..., description="Count by regulatory framework")
    actor_types: dict = Field(..., description="Count by actor type")
    average_confidence: float = Field(..., description="Average confidence score")
