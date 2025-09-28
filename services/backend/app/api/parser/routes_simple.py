"""
Simplified RegTech API Routes - No Heavy Dependencies
Implements the new JSON structure for compliance requirements
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import time
import os
import uuid
import re
import json
from datetime import datetime

from .models_v3 import (
    DocumentUploadResponse,
    ComplianceRequirementExtractionResponse,
    ComplianceRequirement,
    MappedControl,
    ControlCategory,
    ControlStatus
)
from ...database import db
from .llm_organization_engine import LLMRequirementOrganizer
from .routes_gap_analysis import router as gap_analysis_router
from .routes_test_analysis import router as test_analysis_router
from .routes_complete_analysis import router as complete_analysis_router
from .routes_requirement_clusters import router as requirement_clusters_router
from .routes_gap_status import router as gap_status_router
from .routes_gap_analyses import router as gap_analyses_router

router = APIRouter()

# Include gap analysis routes
router.include_router(gap_analysis_router)

# Include test analysis routes
router.include_router(test_analysis_router)

# Include complete analysis routes
router.include_router(complete_analysis_router)

# Include requirement clusters routes
router.include_router(requirement_clusters_router)

# Include gap status routes
router.include_router(gap_status_router)

# Include gap analyses routes
router.include_router(gap_analyses_router)

# Simple document extractor without dependencies
class SimpleDocumentExtractor:
    def __init__(self):
        self.upload_dir = "uploads"
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def get_document_type(self, filename: str) -> str:
        """Determine document type from filename."""
        extension = os.path.splitext(filename)[1].lower()
        
        if extension == '.txt':
            return 'TXT'
        elif extension == '.pdf':
            return 'PDF'
        elif extension in ['.docx', '.doc']:
            return 'DOCX'
        else:
            raise ValueError(f"Unsupported file type: {extension}")
    
    def save_uploaded_file(self, file_content: bytes, filename: str) -> tuple[str, int]:
        """Save uploaded file and return path and size."""
        file_path = os.path.join(self.upload_dir, f"{uuid.uuid4()}_{filename}")
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return file_path, len(file_content)
    
    def extract_text(self, file_path: str, document_type: str) -> str:
        """Extract text content from a document file."""
        try:
            if document_type == 'TXT':
                return self._extract_from_txt(file_path)
            elif document_type == 'PDF':
                return self._extract_from_pdf(file_path)
            elif document_type == 'DOCX':
                return self._extract_from_docx(file_path)
            else:
                raise ValueError(f"Unsupported document type: {document_type}")
        except Exception as e:
            raise Exception(f"Error extracting text from {file_path}: {str(e)}")
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from plain text file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except ImportError:
            raise Exception("PyPDF2 not installed. Please install with: pip install PyPDF2")
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            from docx import Document
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except ImportError:
            raise Exception("python-docx not installed. Please install with: pip install python-docx")
    
    def create_document_record(self, filename: str, content: str, document_type: str, file_size: int):
        """Create a simple document record."""
        return type('Document', (), {
            'id': str(uuid.uuid4()),
            'filename': filename,
            'content': content,
            'document_type': document_type,
            'file_size': file_size,
            'upload_date': datetime.now()
        })()

# Initialize components
document_extractor = SimpleDocumentExtractor()

@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a legal document for processing."""
    try:
        # Connect to database
        await db.connect()
        prisma = db.get_client()
        
        # Check if file is provided
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        print(f"📄 Uploading file: {file.filename}")
        
        # Validate file type
        try:
            document_type = document_extractor.get_document_type(file.filename)
            print(f"✅ File type detected: {document_type}")
        except ValueError as e:
            print(f"❌ File type validation failed: {e}")
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {e}")
        
        # Read file content
        file_content = await file.read()
        print(f"📊 File size: {len(file_content)} bytes")
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        # Save file
        try:
            file_path, file_size = document_extractor.save_uploaded_file(file_content, file.filename)
            print(f"💾 File saved to: {file_path}")
        except Exception as e:
            print(f"❌ File save failed: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
        # Extract text content
        try:
            content = document_extractor.extract_text(file_path, document_type)
            print(f"📝 Extracted {len(content)} characters")
        except Exception as e:
            print(f"❌ Text extraction failed: {e}")
            raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
        
        # Create document in database
        try:
            # For now, use a default user ID (in production, this would come from authentication)
            default_user_id = "00000000-0000-0000-0000-000000000000"
            
            # Create user if doesn't exist
            try:
                await prisma.user.create(data={
                    "id": default_user_id,
                    "email": "system@compliance.com",
                    "password": "default",
                    "fullName": "System User",
                    "role": "ADMIN"
                })
            except:
                pass  # User already exists
            
            # Create document record in database
            document = await prisma.document.create(data={
                "id": str(uuid.uuid4()),
                "userId": default_user_id,
                "filename": file.filename,
                "originalFilename": file.filename,
                "filePath": file_path,
                "fileSize": file_size,
                "documentType": document_type.upper(),
                "content": content,
                "processed": False,
                "processingStatus": "PENDING"
            })
            
            print(f"📋 Document saved to database: {document.id}")
            
        except Exception as e:
            print(f"❌ Database save failed: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")
        
        # Clean up temporary file
        try:
            os.remove(file_path)
            print(f"🗑️ Temporary file cleaned up: {file_path}")
        except Exception as e:
            print(f"⚠️ Warning: Could not clean up temporary file: {e}")
        
        print(f"✅ Document upload successful: {document.id}")
        
        return DocumentUploadResponse(
            document_id=document.id,
            filename=document.filename,
            document_type=document.documentType,
            file_size=document.fileSize,
            upload_date=document.uploadDate,
            message=f"Document '{file.filename}' uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/extract-requirements/{document_id}", response_model=ComplianceRequirementExtractionResponse)
async def extract_compliance_requirements(document_id: str):
    """Extract compliance requirements using the new RegTech structure."""
    try:
        # Connect to database
        await db.connect()
        prisma = db.get_client()
        
        # Get document from database
        document = await prisma.document.find_unique(where={"id": document_id})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        print(f"\n🚀 Starting compliance requirement extraction for document: {document_id}")
        print(f"   → Document: {document.filename}")
        print(f"   → Size: {len(document.content) if document.content else 0} characters")
        
        start_time = time.time()
        
        # Update document status to processing
        await prisma.document.update(
            where={"id": document_id},
            data={
                "processingStatus": "PROCESSING",
                "processingStartedAt": datetime.now()
            }
        )
        
        # Extract compliance requirements using simplified parser
        requirements = extract_requirements_simple(document.content or "")
        
        processing_time = time.time() - start_time
        
        print(f"✅ Extracted {len(requirements)} compliance requirements in {processing_time:.2f} seconds!")
        
        # Store requirements in database
        stored_requirements = []
        for req in requirements:
            try:
                # Create compliance requirement in database
                db_requirement = await prisma.compliancerequirement.create(data={
                    "id": str(uuid.uuid4()),
                    "documentId": document_id,
                    "title": req.policy,
                    "description": req.requirement,
                    "requirementType": "OBLIGATION",  # Default type
                    "confidenceScore": req.confidence_score,
                    "extractionMethod": "hybrid",
                    "sourceText": req.source_text
                })
                
                # Store deadlines if present
                if req.deadline:
                    await prisma.deadline.create(data={
                        "id": str(uuid.uuid4()),
                        "requirementId": db_requirement.id,
                        "description": req.deadline,
                        "isRecurring": False
                    })
                
                # Store penalties if present
                if req.penalty:
                    await prisma.penalty.create(data={
                        "id": str(uuid.uuid4()),
                        "requirementId": db_requirement.id,
                        "description": req.penalty,
                        "penaltyType": "REGULATORY"
                    })
                
                stored_requirements.append(req)
                
            except Exception as e:
                print(f"❌ Error storing requirement: {e}")
                continue
        
        # Mark document as processed
        await prisma.document.update(
            where={"id": document_id},
            data={
                "processed": True,
                "processingStatus": "COMPLETED",
                "processingCompletedAt": datetime.now()
            }
        )
        
        # Extract metadata for analysis
        regulatory_frameworks = list(set([req.regulatory_framework for req in stored_requirements if req.regulatory_framework]))
        actor_types = list(set([req.actor for req in stored_requirements]))
        
        # Risk assessment
        risk_assessment = {
            'high_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'High']),
            'medium_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'Medium']),
            'low_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'Low']),
            'average_confidence': sum(req.confidence_score for req in stored_requirements) / len(stored_requirements) if stored_requirements else 0
        }
        
        return ComplianceRequirementExtractionResponse(
            document_id=document_id,
            requirements=stored_requirements,
            total_requirements=len(stored_requirements),
            processing_time=processing_time,
            message=f"Successfully extracted {len(stored_requirements)} compliance requirements",
            regulatory_frameworks=regulatory_frameworks,
            actor_types=actor_types,
            risk_assessment=risk_assessment
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error extracting requirements: {e}")
        # Update document status to failed
        try:
            await prisma.document.update(
                where={"id": document_id},
                data={
                    "processingStatus": "FAILED",
                    "errorMessage": str(e)
                }
            )
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error extracting requirements: {str(e)}")
    finally:
        await db.disconnect()

def extract_requirements_simple(text: str) -> List[ComplianceRequirement]:
    """Simple requirement extraction without heavy dependencies."""
    requirements = []
    
    # Split text into sentences
    sentences = re.split(r'[.!?]+', text)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 20:
            continue
            
        # Check if sentence contains compliance requirements
        if is_compliance_requirement(sentence):
            requirement = extract_requirement_from_sentence(sentence)
            if requirement:
                requirements.append(requirement)
    
    return requirements

def is_compliance_requirement(sentence: str) -> bool:
    """Check if sentence contains compliance requirements."""
    sentence_lower = sentence.lower()
    
    # Check for requirement indicators
    requirement_indicators = [
        'must', 'shall', 'will', 'required', 'obligated', 'mandated',
        'file', 'furnish', 'submit', 'provide', 'disclose', 'report',
        'maintain', 'establish', 'implement', 'ensure', 'guarantee'
    ]
    
    return any(indicator in sentence_lower for indicator in requirement_indicators)

def extract_requirement_from_sentence(sentence: str) -> Optional[ComplianceRequirement]:
    """Extract structured requirement from sentence."""
    try:
        # Extract policy
        policy = extract_policy(sentence)
        
        # Extract actor
        actor = extract_actor(sentence)
        
        # Extract requirement
        requirement = sentence.strip()
        
        # Extract trigger
        trigger = extract_trigger(sentence)
        
        # Extract deadline
        deadline = extract_deadline(sentence)
        
        # Extract penalty
        penalty = extract_penalty(sentence)
        
        # Calculate confidence score
        confidence = calculate_confidence(sentence, policy, actor)
        
        # Generate mapped controls
        mapped_controls = generate_mapped_controls(requirement, policy)
        
        return ComplianceRequirement(
            policy=policy,
            actor=actor,
            requirement=requirement,
            trigger=trigger,
            deadline=deadline,
            penalty=penalty,
            mapped_controls=mapped_controls,
            confidence_score=confidence,
            source_text=sentence,
            regulatory_framework=identify_regulatory_framework(policy),
            risk_level=assess_risk_level(penalty, deadline),
            business_impact=assess_business_impact(requirement, actor)
        )
        
    except Exception as e:
        print(f"Error extracting requirement from sentence: {e}")
        return None

def extract_policy(sentence: str) -> str:
    """Extract regulatory policy from sentence."""
    # Look for common regulatory frameworks
    if 'Securities Exchange Act' in sentence:
        return "Securities Exchange Act of 1934"
    elif 'Sarbanes-Oxley' in sentence or 'SOX' in sentence:
        return "Sarbanes-Oxley Act"
    elif 'Dodd-Frank' in sentence:
        return "Dodd-Frank Act"
    elif 'Section' in sentence:
        section_match = re.search(r'Section \d+[a-z]?', sentence)
        if section_match:
            return section_match.group(0)
    
    return "General Compliance Requirement"

def extract_actor(sentence: str) -> str:
    """Extract responsible actor from sentence."""
    sentence_lower = sentence.lower()
    
    if 'beneficial owner' in sentence_lower:
        return "Beneficial owner of >10% equity security"
    elif 'executive officer' in sentence_lower:
        return "Executive officers"
    elif 'director' in sentence_lower:
        return "Directors"
    elif 'registrant' in sentence_lower:
        return "Registrants"
    elif 'issuer' in sentence_lower:
        return "Issuers"
    elif 'company' in sentence_lower:
        return "Public companies"
    
    return "Covered Entity"

def extract_trigger(sentence: str) -> str:
    """Extract trigger conditions from sentence."""
    if 'within' in sentence.lower():
        return "Within specified timeframe"
    elif 'at the time' in sentence.lower():
        return "At the time of occurrence"
    elif 'upon' in sentence.lower():
        return "Upon occurrence of event"
    
    return "Upon occurrence of triggering event"

def extract_deadline(sentence: str) -> Optional[str]:
    """Extract deadline from sentence."""
    # Look for time patterns
    time_patterns = [
        r'within \d+ days?',
        r'\d+ days? (?:after|before|of)',
        r'no later than \d+ days?',
        r'by \d+ days?'
    ]
    
    for pattern in time_patterns:
        match = re.search(pattern, sentence, re.IGNORECASE)
        if match:
            return match.group(0)
    
    return None

def extract_penalty(sentence: str) -> Optional[str]:
    """Extract penalty information from sentence."""
    penalty_indicators = ['penalty', 'fine', 'sanction', 'enforcement', 'violation']
    
    if any(indicator in sentence.lower() for indicator in penalty_indicators):
        return "Regulatory enforcement action and potential penalties"
    
    return None

def calculate_confidence(sentence: str, policy: str, actor: str) -> float:
    """Calculate confidence score for the extraction."""
    base_confidence = 0.5
    
    # Policy confidence
    if policy != "General Compliance Requirement":
        base_confidence += 0.2
    
    # Actor confidence
    if actor != "Covered Entity":
        base_confidence += 0.1
    
    # Legal language indicators
    legal_indicators = ['shall', 'must', 'required', 'obligated', 'mandated']
    if any(indicator in sentence.lower() for indicator in legal_indicators):
        base_confidence += 0.1
    
    return min(base_confidence, 1.0)

def generate_mapped_controls(requirement: str, policy: str) -> List[MappedControl]:
    """Generate mapped controls for the requirement."""
    controls = []
    
    # Map based on requirement type
    if 'report' in requirement.lower():
        controls.append(MappedControl(
            control_id=f"REP-{uuid.uuid4().hex[:8].upper()}",
            category=ControlCategory.FINANCIAL_REPORTING,
            status=ControlStatus.PENDING,
            description="Reporting control for compliance requirement"
        ))
    
    if 'disclose' in requirement.lower():
        controls.append(MappedControl(
            control_id=f"DIS-{uuid.uuid4().hex[:8].upper()}",
            category=ControlCategory.DISCLOSURE,
            status=ControlStatus.PENDING,
            description="Disclosure control for compliance requirement"
        ))
    
    if 'insider' in requirement.lower() or 'beneficial' in requirement.lower():
        controls.append(MappedControl(
            control_id=f"INS-{uuid.uuid4().hex[:8].upper()}",
            category=ControlCategory.INSIDER_REPORTING,
            status=ControlStatus.PENDING,
            description="Insider reporting control for compliance requirement"
        ))
    
    return controls

def identify_regulatory_framework(policy: str) -> Optional[str]:
    """Identify regulatory framework from policy."""
    if 'Securities Exchange Act' in policy:
        return 'SEC'
    elif 'Sarbanes-Oxley' in policy or 'SOX' in policy:
        return 'SOX'
    elif 'Dodd-Frank' in policy:
        return 'Dodd-Frank'
    
    return None

def assess_risk_level(penalty: Optional[str], deadline: Optional[str]) -> str:
    """Assess risk level based on penalty and deadline."""
    risk_score = 0
    
    if penalty:
        if 'criminal' in penalty.lower():
            risk_score += 3
        elif 'civil' in penalty.lower():
            risk_score += 2
        elif 'administrative' in penalty.lower():
            risk_score += 1
    
    if deadline:
        if 'immediately' in deadline.lower():
            risk_score += 3
        elif 'days' in deadline.lower():
            days = re.search(r'(\d+)', deadline)
            if days:
                days_num = int(days.group(1))
                if days_num <= 10:
                    risk_score += 3
                elif days_num <= 30:
                    risk_score += 2
                else:
                    risk_score += 1
    
    if risk_score >= 4:
        return "High"
    elif risk_score >= 2:
        return "Medium"
    else:
        return "Low"

def assess_business_impact(requirement: str, actor: str) -> str:
    """Assess business impact of the requirement."""
    impact_score = 0
    
    # High impact indicators
    high_impact_indicators = ['financial statement', 'audit', 'certification', 'governance']
    if any(indicator in requirement.lower() for indicator in high_impact_indicators):
        impact_score += 2
    
    # Medium impact indicators
    medium_impact_indicators = ['report', 'disclose', 'file', 'submit']
    if any(indicator in requirement.lower() for indicator in medium_impact_indicators):
        impact_score += 1
    
    # Actor impact
    if 'executive' in actor.lower() or 'director' in actor.lower():
        impact_score += 1
    
    if impact_score >= 3:
        return "High"
    elif impact_score >= 1:
        return "Medium"
    else:
        return "Low"

@router.get("/requirements")
async def get_all_requirements():
    """Get all extracted compliance requirements."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        requirements = await prisma.compliancerequirement.find_many(
            include={
                "deadlines": True,
                "penalties": True,
                "legalEntities": True
            }
        )
        
        return requirements
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requirements: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/requirements/{requirement_id}")
async def get_requirement(requirement_id: str):
    """Get a specific compliance requirement by ID."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        requirement = await prisma.compliancerequirement.find_unique(
            where={"id": requirement_id},
            include={
                "deadlines": True,
                "penalties": True,
                "legalEntities": True,
                "document": True
            }
        )
        
        if not requirement:
            raise HTTPException(status_code=404, detail="Requirement not found")
        
        return requirement
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching requirement: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/documents")
async def list_documents():
    """List all uploaded documents."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        documents = await prisma.document.find_many(
            include={
                "complianceRequirements": True
            }
        )
        
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document by ID."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        document = await prisma.document.find_unique(
            where={"id": document_id},
            include={
                "complianceRequirements": {
                    "include": {
                        "deadlines": True,
                        "penalties": True,
                        "legalEntities": True
                    }
                }
            }
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/stats")
async def get_parser_stats():
    """Get parser statistics."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get document stats
        total_documents = await prisma.document.count()
        processed_documents = await prisma.document.count(where={"processed": True})
        
        # Get requirement stats
        total_requirements = await prisma.compliancerequirement.count()
        
        # Get average confidence
        requirements = await prisma.compliancerequirement.find_many(select={"confidenceScore": True})
        avg_confidence = sum(req.confidenceScore for req in requirements) / len(requirements) if requirements else 0
        
        # Get regulatory framework stats
        regulatory_frameworks = {}
        # This would need to be implemented based on your data structure
        
        # Get actor type stats
        actor_types = {}
        # This would need to be implemented based on your data structure
        
        return {
            "total_documents": total_documents,
            "processed_documents": processed_documents,
            "total_requirements": total_requirements,
            "regulatory_frameworks": regulatory_frameworks,
            "actor_types": actor_types,
            "average_confidence": round(avg_confidence, 3)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
    finally:
        await db.disconnect()

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its associated requirements."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Check if document exists
        document = await prisma.document.find_unique(where={"id": document_id})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Count associated requirements
        requirements_count = await prisma.compliancerequirement.count(where={"documentId": document_id})
        
        # Delete associated requirements (cascade should handle this, but let's be explicit)
        await prisma.compliancerequirement.delete_many(where={"documentId": document_id})
        
        # Delete the document
        await prisma.document.delete(where={"id": document_id})
        
        return {"message": f"Document {document_id} and {requirements_count} associated requirements deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/cluster-requirements")
async def cluster_requirements():
    """Cluster compliance requirements for harmonization."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get all requirements from database
        requirements = await prisma.compliancerequirement.find_many()
        
        if not requirements:
            return {"message": "No requirements found to cluster", "clusters": []}
        
        print(f"🔍 Clustering {len(requirements)} compliance requirements...")
        
        # Simple clustering based on policy similarity
        clusters = {}
        for req in requirements:
            policy_key = req.title.split(' - ')[0] if ' - ' in req.title else req.title
            
            if policy_key not in clusters:
                clusters[policy_key] = []
            
            clusters[policy_key].append({
                "id": req.id,
                "title": req.title,
                "description": req.description,
                "confidence_score": req.confidenceScore,
                "document_id": req.documentId
            })
        
        # Convert to list format
        cluster_list = []
        for policy, reqs in clusters.items():
            cluster_list.append({
                "policy": policy,
                "requirements": reqs,
                "count": len(reqs),
                "average_confidence": sum(r["confidence_score"] for r in reqs) / len(reqs)
            })
        
        print(f"✅ Created {len(cluster_list)} clusters")
        
        # Store clusters in database
        try:
            for cluster in cluster_list:
                await prisma.requirementcluster.create(data={
                    "id": str(uuid.uuid4()),
                    "clusterId": f"cluster_{uuid.uuid4().hex[:8]}",
                    "policy": cluster["policy"],
                    "requirements": json.dumps(cluster["requirements"]),
                    "count": cluster["count"],
                    "averageConfidence": cluster["average_confidence"]
                })
            print(f"💾 Stored {len(cluster_list)} clusters in database")
        except Exception as e:
            print(f"⚠️ Warning: Could not store clusters in database: {e}")
        
        return {
            "message": f"Successfully clustered {len(requirements)} requirements into {len(cluster_list)} clusters",
            "total_requirements": len(requirements),
            "total_clusters": len(cluster_list),
            "clusters": cluster_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clustering requirements: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/harmonize-requirements")
async def harmonize_requirements():
    """Harmonize compliance requirements across documents."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get all requirements grouped by policy
        requirements = await prisma.compliancerequirement.find_many()
        
        if not requirements:
            return {"message": "No requirements found to harmonize", "harmonized": []}
        
        print(f"🔄 Harmonizing {len(requirements)} compliance requirements...")
        
        # Group by policy and harmonize
        harmonized_requirements = {}
        for req in requirements:
            policy_key = req.title.split(' - ')[0] if ' - ' in req.title else req.title
            
            if policy_key not in harmonized_requirements:
                harmonized_requirements[policy_key] = {
                    "policy": policy_key,
                    "requirements": [],
                    "harmonized_description": "",
                    "common_deadlines": [],
                    "common_penalties": []
                }
            
            harmonized_requirements[policy_key]["requirements"].append({
                "id": req.id,
                "description": req.description,
                "confidence_score": req.confidenceScore,
                "source_document": req.documentId
            })
        
        # Create harmonized descriptions
        harmonized_list = []
        for policy, data in harmonized_requirements.items():
            # Combine descriptions (simplified approach)
            descriptions = [r["description"] for r in data["requirements"]]
            harmonized_desc = " | ".join(set(descriptions))  # Remove duplicates
            
            harmonized_list.append({
                "policy": policy,
                "harmonized_description": harmonized_desc,
                "requirement_count": len(data["requirements"]),
                "average_confidence": sum(r["confidence_score"] for r in data["requirements"]) / len(data["requirements"]),
                "source_requirements": data["requirements"]
            })
        
        print(f"✅ Harmonized into {len(harmonized_list)} policy groups")
        
        return {
            "message": f"Successfully harmonized {len(requirements)} requirements into {len(harmonized_list)} policy groups",
            "total_requirements": len(requirements),
            "harmonized_groups": len(harmonized_list),
            "harmonized": harmonized_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error harmonizing requirements: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/organize-with-llm")
async def organize_requirements_with_llm():
    """Use OpenAI LLM to organize and format compliance requirements."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get all requirements from database
        requirements = await prisma.compliancerequirement.find_many()
        
        if not requirements:
            return {"message": "No requirements found to organize", "organized_requirements": []}
        
        print(f"Starting LLM organization of {len(requirements)} requirements...")
        
        # Initialize LLM organizer
        llm_organizer = LLMRequirementOrganizer()
        
        # Convert Prisma objects to dictionaries
        requirements_data = []
        for req in requirements:
            requirements_data.append({
                "id": req.id,
                "title": req.title,
                "description": req.description,
                "sourceText": req.sourceText,
                "confidenceScore": req.confidenceScore
            })
        
        # Organize requirements using LLM
        organized_data = await llm_organizer.organize_requirements(requirements_data)
        
        # Calculate confidence score
        confidence_score = llm_organizer.calculate_confidence_score(organized_data)
        
        print(f"LLM organization completed with confidence: {confidence_score:.2f}")
        
        # Store LLM organized data in database
        organized_groups = organized_data.get("organized_requirements", [])
        
        for i, group in enumerate(organized_groups):
            # Always generate a unique group ID to avoid constraint violations
            unique_group_id = f"group_{uuid.uuid4().hex[:8]}_{i}_{int(time.time())}"
            category = str(group.get("category", "General Compliance"))
            group_description = str(group.get("group_description", ""))
            requirements_json = json.dumps(group.get("requirements", []))
            confidence = float(confidence_score)
            
            await prisma.llmorganizedrequirement.create(data={
                "id": str(uuid.uuid4()),
                "groupId": unique_group_id,
                "category": category,
                "groupDescription": group_description,
                "requirements": requirements_json,
                "confidenceScore": confidence
            })
        
        return {
            "message": f"Successfully organized {len(requirements)} requirements using LLM",
            "organized_requirements": organized_data.get("organized_requirements", []),
            "organization_metadata": organized_data.get("organization_metadata", {}),
            "confidence_score": confidence_score,
            "total_requirements": len(requirements),
            "total_groups": len(organized_data.get("organized_requirements", []))
        }
        
    except Exception as e:
        print(f"❌ Error in LLM organization: {e}")
        raise HTTPException(status_code=500, detail=f"LLM organization failed: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/format-requirement/{requirement_id}")
async def format_individual_requirement(requirement_id: str):
    """Format a single requirement using LLM."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get requirement from database
        requirement = await prisma.compliancerequirement.find_unique(where={"id": requirement_id})
        if not requirement:
            raise HTTPException(status_code=404, detail="Requirement not found")
        
        print(f"🤖 Formatting individual requirement: {requirement_id}")
        
        # Initialize LLM organizer
        llm_organizer = LLMRequirementOrganizer()
        
        # Prepare requirement data
        requirement_data = {
            "id": requirement.id,
            "title": requirement.title,
            "description": requirement.description,
            "sourceText": requirement.sourceText,
            "confidenceScore": requirement.confidenceScore
        }
        
        # Format requirement using LLM
        formatted_requirement = await llm_organizer.format_individual_requirement(requirement_data)
        
        # Generate control mappings
        control_mappings = await llm_organizer.generate_control_mappings(formatted_requirement)
        formatted_requirement["mapped_controls"] = control_mappings
        
        print(f"✅ Individual requirement formatted successfully")
        
        return {
            "message": f"Successfully formatted requirement {requirement_id}",
            "formatted_requirement": formatted_requirement,
            "confidence_score": llm_organizer.calculate_confidence_score({"organized_requirements": [{"requirements": [formatted_requirement]}]})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error formatting individual requirement: {e}")
        raise HTTPException(status_code=500, detail=f"Individual requirement formatting failed: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/llm-organized-requirements")
async def get_llm_organized_requirements():
    """Get requirements organized by LLM (if stored in database)."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Retrieve stored LLM organized requirements from database
        organized = await prisma.llmorganizedrequirement.find_many()
        
        if not organized:
            return {
                "message": "No LLM organized requirements found in database. Use POST /organize-with-llm to organize requirements first.",
                "organized_requirements": [],
                "note": "Run POST /organize-with-llm to organize and store requirements first"
            }
        
        return {
            "message": f"Retrieved {len(organized)} stored LLM organized groups",
            "organized_requirements": organized,
            "total_groups": len(organized)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving organized requirements: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/generate-control-mappings/{requirement_id}")
async def generate_control_mappings(requirement_id: str):
    """Generate control mappings for a specific requirement using LLM."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get requirement from database
        requirement = await prisma.compliancerequirement.find_unique(where={"id": requirement_id})
        if not requirement:
            raise HTTPException(status_code=404, detail="Requirement not found")
        
        print(f"🤖 Generating control mappings for requirement: {requirement_id}")
        
        # Initialize LLM organizer
        llm_organizer = LLMRequirementOrganizer()
        
        # Prepare requirement data
        requirement_data = {
            "id": requirement.id,
            "title": requirement.title,
            "description": requirement.description,
            "sourceText": requirement.sourceText
        }
        
        # Generate control mappings using LLM
        control_mappings = await llm_organizer.generate_control_mappings(requirement_data)
        
        print(f"✅ Control mappings generated successfully")
        
        return {
            "message": f"Successfully generated control mappings for requirement {requirement_id}",
            "requirement_id": requirement_id,
            "control_mappings": control_mappings,
            "total_controls": len(control_mappings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating control mappings: {e}")
        raise HTTPException(status_code=500, detail=f"Control mapping generation failed: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/stored-clusters")
async def get_stored_clusters():
    """Get stored requirement clusters from database."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        clusters = await prisma.requirementcluster.find_many()
        
        return {
            "message": f"Retrieved {len(clusters)} stored clusters",
            "clusters": clusters
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving clusters: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/stored-llm-organized")
async def get_stored_llm_organized():
    """Get stored LLM organized requirements from database."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        organized = await prisma.llmorganizedrequirement.find_many()
        
        return {
            "message": f"Retrieved {len(organized)} stored LLM organized groups",
            "organized_requirements": organized
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving LLM organized data: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/final-organized-requirements")
async def get_final_organized_requirements():
    """
    Get the final organized requirements for frontend display.
    
    This endpoint returns the LLM-organized requirements in a format
    optimized for frontend rendering.
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Get all LLM organized requirements
        organized = await prisma.llmorganizedrequirement.find_many(
            order_by={"createdAt": "desc"}
        )
        
        if not organized:
            return {
                "message": "No organized requirements found. Process a document first using /process-document-complete",
                "organized_requirements": [],
                "total_groups": 0,
                "categories": []
            }
        
        # Parse and format the requirements for frontend
        formatted_requirements = []
        all_categories = set()
        
        for group in organized:
            try:
                # Parse the requirements JSON
                requirements_json = json.loads(group.requirements) if isinstance(group.requirements, str) else group.requirements
                
                formatted_group = {
                    "group_id": group.groupId,
                    "category": group.category,
                    "group_description": group.groupDescription,
                    "confidence_score": group.confidenceScore,
                    "created_at": group.createdAt.isoformat() if group.createdAt else None,
                    "requirements": requirements_json,
                    "requirement_count": len(requirements_json) if isinstance(requirements_json, list) else 0
                }
                
                formatted_requirements.append(formatted_group)
                all_categories.add(group.category)
                
            except Exception as e:
                print(f"⚠️ Warning: Could not parse requirements for group {group.groupId}: {e}")
                continue
        
        # Calculate summary statistics
        total_requirements = sum(group["requirement_count"] for group in formatted_requirements)
        avg_confidence = sum(group["confidence_score"] for group in formatted_requirements) / len(formatted_requirements) if formatted_requirements else 0
        
        return {
            "success": True,
            "message": f"Retrieved {len(formatted_requirements)} organized requirement groups",
            "organized_requirements": formatted_requirements,
            "summary": {
                "total_groups": len(formatted_requirements),
                "total_requirements": total_requirements,
                "categories": list(all_categories),
                "average_confidence": round(avg_confidence, 3),
                "last_updated": max(group["created_at"] for group in formatted_requirements) if formatted_requirements else None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving organized requirements: {str(e)}")
    finally:
        await db.disconnect()

@router.get("/stored-harmonized")
async def get_stored_harmonized():
    """Get stored harmonized requirements from database."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        harmonized = await prisma.harmonizedrequirement.find_many()
        
        return {
            "message": f"Retrieved {len(harmonized)} stored harmonized groups",
            "harmonized_requirements": harmonized
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving harmonized data: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/process-document-complete")
async def process_document_complete(file: UploadFile = File(...)):
    """
    Complete document processing pipeline in one endpoint.
    
    This endpoint handles the entire workflow:
    1. Upload document
    2. Extract requirements
    3. Cluster requirements
    4. Harmonize requirements
    5. Organize with LLM
    6. Return final organized requirements
    
    Perfect for frontend integration with single button click.
    """
    try:
        print(f"\n🚀 Starting complete document processing pipeline...")
        print(f"   → File: {file.filename}")
        
        # Connect to database
        await db.connect()
        prisma = db.get_client()
        
        # Step 1: Upload document
        print(f"\n📄 Step 1: Uploading document...")
        
        # Check if file is provided
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate file type
        try:
            document_type = document_extractor.get_document_type(file.filename)
            print(f"✅ File type detected: {document_type}")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {e}")
        
        # Read file content
        file_content = await file.read()
        print(f"📊 File size: {len(file_content)} bytes")
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        # Save file
        file_path, file_size = document_extractor.save_uploaded_file(file_content, file.filename)
        print(f"💾 File saved to: {file_path}")
        
        # Extract text content
        content = document_extractor.extract_text(file_path, document_type)
        print(f"📝 Extracted {len(content)} characters")
        
        # Create document in database
        default_user_id = "00000000-0000-0000-0000-000000000000"
        
        # Create user if doesn't exist
        try:
            await prisma.user.create(data={
                "id": default_user_id,
                "email": "system@compliance.com",
                "password": "default",
                "fullName": "System User",
                "role": "ADMIN"
            })
        except:
            pass  # User already exists
        
        # Create document record
        document = await prisma.document.create(data={
            "id": str(uuid.uuid4()),
            "userId": default_user_id,
            "filename": file.filename,
            "originalFilename": file.filename,
            "filePath": file_path,
            "fileSize": file_size,
            "documentType": document_type.upper(),
            "content": content,
            "processed": False,
            "processingStatus": "PROCESSING"
        })
        
        print(f"📋 Document saved to database: {document.id}")
        
        # Clean up temporary file
        try:
            os.remove(file_path)
            print(f"🗑️ Temporary file cleaned up")
        except Exception as e:
            print(f"⚠️ Warning: Could not clean up temporary file: {e}")
        
        # Step 2: Extract requirements
        print(f"\n🔍 Step 2: Extracting compliance requirements...")
        start_time = time.time()
        
        # Update document status
        await prisma.document.update(
            where={"id": document.id},
            data={
                "processingStatus": "PROCESSING",
                "processingStartedAt": datetime.now()
            }
        )
        
        # Extract compliance requirements
        requirements = extract_requirements_simple(content)
        print(f"✅ Extracted {len(requirements)} compliance requirements")
        
        # Store requirements in database
        stored_requirements = []
        for req in requirements:
            try:
                # Create compliance requirement in database
                db_requirement = await prisma.compliancerequirement.create(data={
                    "id": str(uuid.uuid4()),
                    "documentId": document.id,
                    "title": req.policy,
                    "description": req.requirement,
                    "requirementType": "OBLIGATION",
                    "confidenceScore": req.confidence_score,
                    "extractionMethod": "hybrid",
                    "sourceText": req.source_text
                })
                
                # Store deadlines if present
                if req.deadline:
                    await prisma.deadline.create(data={
                        "id": str(uuid.uuid4()),
                        "requirementId": db_requirement.id,
                        "description": req.deadline,
                        "isRecurring": False
                    })
                
                # Store penalties if present
                if req.penalty:
                    await prisma.penalty.create(data={
                        "id": str(uuid.uuid4()),
                        "requirementId": db_requirement.id,
                        "description": req.penalty,
                        "penaltyType": "REGULATORY"
                    })
                
                stored_requirements.append(req)
                
            except Exception as e:
                print(f"❌ Error storing requirement: {e}")
                continue
        
        # Step 3: Cluster requirements
        print(f"\n🔗 Step 3: Clustering requirements...")
        
        # Simple clustering based on policy similarity
        clusters = {}
        for req in stored_requirements:
            policy_key = req.policy.split(' - ')[0] if ' - ' in req.policy else req.policy
            
            if policy_key not in clusters:
                clusters[policy_key] = []
            
            clusters[policy_key].append({
                "id": req.id if hasattr(req, 'id') else str(uuid.uuid4()),
                "title": req.policy,
                "description": req.requirement,
                "confidence_score": req.confidence_score,
                "document_id": document.id
            })
        
        # Convert to list format
        cluster_list = []
        for policy, reqs in clusters.items():
            cluster_list.append({
                "policy": policy,
                "requirements": reqs,
                "count": len(reqs),
                "average_confidence": sum(r["confidence_score"] for r in reqs) / len(reqs)
            })
        
        print(f"✅ Created {len(cluster_list)} clusters")
        
        # Store clusters in database
        for cluster in cluster_list:
            try:
                await prisma.requirementcluster.create(data={
                    "id": str(uuid.uuid4()),
                    "clusterId": f"cluster_{uuid.uuid4().hex[:8]}",
                    "policy": cluster["policy"],
                    "requirements": json.dumps(cluster["requirements"]),
                    "count": cluster["count"],
                    "averageConfidence": cluster["average_confidence"]
                })
            except Exception as e:
                print(f"⚠️ Warning: Could not store cluster: {e}")
        
        # Step 4: Harmonize requirements
        print(f"\n🔄 Step 4: Harmonizing requirements...")
        
        # Group by policy and harmonize
        harmonized_requirements = {}
        for req in stored_requirements:
            policy_key = req.policy.split(' - ')[0] if ' - ' in req.policy else req.policy
            
            if policy_key not in harmonized_requirements:
                harmonized_requirements[policy_key] = {
                    "policy": policy_key,
                    "requirements": [],
                    "harmonized_description": "",
                    "common_deadlines": [],
                    "common_penalties": []
                }
            
            harmonized_requirements[policy_key]["requirements"].append({
                "id": req.id if hasattr(req, 'id') else str(uuid.uuid4()),
                "description": req.requirement,
                "confidence_score": req.confidence_score,
                "source_document": document.id
            })
        
        # Create harmonized descriptions
        harmonized_list = []
        for policy, data in harmonized_requirements.items():
            # Combine descriptions (simplified approach)
            descriptions = [r["description"] for r in data["requirements"]]
            harmonized_desc = " | ".join(set(descriptions))  # Remove duplicates
            
            harmonized_list.append({
                "policy": policy,
                "harmonized_description": harmonized_desc,
                "requirement_count": len(data["requirements"]),
                "average_confidence": sum(r["confidence_score"] for r in data["requirements"]) / len(data["requirements"]),
                "source_requirements": data["requirements"]
            })
        
        print(f"✅ Harmonized into {len(harmonized_list)} policy groups")
        
        # Step 5: Organize with LLM
        print(f"\n🤖 Step 5: Organizing with LLM...")
        
        # Initialize LLM organizer
        llm_organizer = LLMRequirementOrganizer()
        
        # Convert requirements to format expected by LLM
        requirements_data = []
        for req in stored_requirements:
            requirements_data.append({
                "id": req.id if hasattr(req, 'id') else str(uuid.uuid4()),
                "title": req.policy,
                "description": req.requirement,
                "sourceText": req.source_text,
                "confidenceScore": req.confidence_score
            })
        
        # Organize requirements using LLM
        organized_data = await llm_organizer.organize_requirements(requirements_data)
        
        # Calculate confidence score
        confidence_score = llm_organizer.calculate_confidence_score(organized_data)
        print(f"✅ LLM organization completed with confidence: {confidence_score:.2f}")
        
        # Store LLM organized data in database
        organized_groups = organized_data.get("organized_requirements", [])
        
        for i, group in enumerate(organized_groups):
            # Generate unique group ID
            unique_group_id = f"group_{uuid.uuid4().hex[:8]}_{i}_{int(time.time())}"
            category = str(group.get("category", "General Compliance"))
            group_description = str(group.get("group_description", ""))
            requirements_json = json.dumps(group.get("requirements", []))
            confidence = float(confidence_score)
            
            await prisma.llmorganizedrequirement.create(data={
                "id": str(uuid.uuid4()),
                "groupId": unique_group_id,
                "category": category,
                "groupDescription": group_description,
                "requirements": requirements_json,
                "confidenceScore": confidence
            })
        
        # Mark document as processed
        await prisma.document.update(
            where={"id": document.id},
            data={
                "processed": True,
                "processingStatus": "COMPLETED",
                "processingCompletedAt": datetime.now()
            }
        )
        
        processing_time = time.time() - start_time
        
        # Extract metadata for analysis
        regulatory_frameworks = list(set([req.regulatory_framework for req in stored_requirements if req.regulatory_framework]))
        actor_types = list(set([req.actor for req in stored_requirements]))
        
        # Risk assessment
        risk_assessment = {
            'high_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'High']),
            'medium_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'Medium']),
            'low_risk_requirements': len([req for req in stored_requirements if req.risk_level == 'Low']),
            'average_confidence': sum(req.confidence_score for req in stored_requirements) / len(stored_requirements) if stored_requirements else 0
        }
        
        print(f"\n🎯 Complete processing pipeline finished in {processing_time:.2f} seconds!")
        print(f"   → Document: {document.filename}")
        print(f"   → Requirements extracted: {len(stored_requirements)}")
        print(f"   → Clusters created: {len(cluster_list)}")
        print(f"   → Harmonized groups: {len(harmonized_list)}")
        print(f"   → LLM organized groups: {len(organized_groups)}")
        print(f"   → Final confidence: {confidence_score:.2f}")
        
        return {
            "success": True,
            "message": f"Complete document processing successful! Processed {len(stored_requirements)} requirements in {processing_time:.2f} seconds.",
            "document_id": document.id,
            "filename": document.filename,
            "processing_time": processing_time,
            "pipeline_results": {
                "requirements_extracted": len(stored_requirements),
                "clusters_created": len(cluster_list),
                "harmonized_groups": len(harmonized_list),
                "llm_organized_groups": len(organized_groups),
                "final_confidence": confidence_score
            },
            "organized_requirements": organized_data.get("organized_requirements", []),
            "organization_metadata": organized_data.get("organization_metadata", {}),
            "regulatory_frameworks": regulatory_frameworks,
            "actor_types": actor_types,
            "risk_assessment": risk_assessment,
            "clusters": cluster_list,
            "harmonized": harmonized_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in complete processing pipeline: {e}")
        # Update document status to failed
        try:
            await prisma.document.update(
                where={"id": document.id},
                data={
                    "processingStatus": "FAILED",
                    "errorMessage": str(e)
                }
            )
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Complete processing pipeline failed: {str(e)}")
    finally:
        await db.disconnect()

@router.post("/test-storage")
async def test_storage():
    """Test storage with mock data."""
    try:
        await db.connect()
        prisma = db.get_client()
        
        # Create mock organized data
        mock_data = {
            "id": str(uuid.uuid4()),
            "groupId": "test_group_123",
            "category": "Test Category",
            "groupDescription": "Test group for storage testing",
            "requirements": json.dumps([
                {
                    "id": "test_req_1",
                    "policy": "Test Policy",
                    "actor": "Test Actor",
                    "requirement": "Test requirement"
                }
            ]),
            "confidenceScore": 0.85
        }
        
        # Store the mock data
        result = await prisma.llmorganizedrequirement.create(data=mock_data)
        
        # Verify it was stored
        stored = await prisma.llmorganizedrequirement.find_unique(where={"id": result.id})
        
        return {
            "message": "Test storage successful",
            "stored_id": result.id,
            "verified": stored is not None,
            "category": stored.category if stored else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test storage failed: {str(e)}")
    finally:
        await db.disconnect()
