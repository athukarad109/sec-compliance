# SEC Compliance Automation Backend

A comprehensive RegTech platform for automated SEC compliance processing, legal document parsing, and AI-powered requirement organization.

## 🎯 Overview

This backend provides a complete pipeline for:
- **Document Processing**: PDF, DOCX, TXT file upload and text extraction
- **AI-Powered Parsing**: LegalBERT-enhanced compliance requirement extraction
- **LLM Organization**: OpenAI GPT-4 powered requirement categorization and formatting
- **Semantic Clustering**: Intelligent grouping of related compliance requirements
- **Database Storage**: PostgreSQL with Prisma ORM for persistent data management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- CUDA-capable GPU (optional, for faster LegalBERT processing)

### Installation

1. **Clone and navigate to backend:**
```bash
cd services/backend
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
Create a `.env` file in `services/backend/`:
```env
# Database Configuration
DATABASE_URL="postgresql://compliance_user:your_secure_password@localhost:5432/sec_compliance_db"

# JWT Configuration
SECRET_KEY="your-super-secret-jwt-key-change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API Key (required for LLM organization)
OPENAI_API_KEY="your-openai-api-key-here"

# File Storage
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=10485760  # 10MB in bytes

# LegalBERT Configuration
MODEL_NAME="nlpaueb/legal-bert-base-uncased"
DEVICE="auto"  # auto, cpu, cuda, mps

# API Configuration
API_V1_STR="/api/v1"
PROJECT_NAME="SEC Compliance Automation"
```

4. **Set up database:**
```bash
# Install PostgreSQL and create database
createdb sec_compliance_db

# Run database migrations
python migrate_to_database.py
```

5. **Start the server:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:8001`
- **API Docs**: `http://localhost:8001/docs`
- **RegTech API**: `http://localhost:8001/regtech/docs`

### Core Endpoints

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "ok": true,
  "service": "backend"
}
```

#### Document Upload
```http
POST /regtech/upload-document
Content-Type: multipart/form-data
```
**Request:**
- `file`: Legal document file (PDF, DOCX, TXT)

**Response:**
```json
{
  "document_id": "cac163b3-ab47-476f-8599-10986c1cccd2",
  "filename": "sample_sec_compliance.txt",
  "document_type": "TXT",
  "file_size": 1234,
  "upload_date": "2024-01-01T00:00:00",
  "message": "Document uploaded successfully"
}
```

#### Extract Compliance Requirements
```http
POST /regtech/extract-requirements/{document_id}
```
**Response:**
```json
{
  "document_id": "cac163b3-ab47-476f-8599-10986c1cccd2",
  "requirements": [
    {
      "id": "req_1",
      "title": "Section 16(a) Reporting",
      "description": "Beneficial owners must file ownership reports within 10 days",
      "sourceText": "Section 16(a) requires beneficial owners to file ownership reports within 10 days of becoming a beneficial owner",
      "confidenceScore": 0.85,
      "entities": {
        "organizations": ["SEC"],
        "dates": ["10 days"],
        "money": [],
        "forms": ["ownership reports"]
      }
    }
  ],
  "total_requirements": 15,
  "processing_time": 2.5,
  "message": "Successfully extracted 15 compliance requirements"
}
```

#### Organize Requirements with LLM
```http
POST /regtech/organize-with-llm
```
**Response:**
```json
{
  "message": "Successfully organized 15 requirements using LLM",
  "organized_requirements": [
    {
      "group_id": "group_1",
      "category": "Insider Reporting",
      "group_description": "Requirements related to insider trading and ownership disclosure",
      "requirements": [
        {
          "id": "req_1",
          "policy": "Securities Exchange Act of 1934 - Section 16(a)",
          "actor": "Beneficial owner of >10% equity security",
          "requirement": "File ownership disclosure statement with SEC",
          "trigger": "At registration of security OR within 10 days of becoming beneficial owner",
          "deadline": "10 days",
          "penalty": "SEC enforcement action; potential fines and sanctions",
          "mapped_controls": [
            {
              "control_id": "SEC-16A-001",
              "category": "Insider Reporting",
              "status": "Pending"
            }
          ]
        }
      ]
    }
  ],
  "organization_metadata": {
    "total_requirements": 15,
    "total_groups": 3,
    "categories": ["Insider Reporting", "Financial Reporting", "Disclosure Requirements"],
    "processing_confidence": 0.95
  }
}
```

#### Format Individual Requirement
```http
POST /regtech/format-requirement/{requirement_id}
```
**Response:**
```json
{
  "requirement_id": "req_1",
  "formatted_requirement": {
    "policy": "Securities Exchange Act of 1934 - Section 16(a)",
    "actor": "Beneficial owner of >10% equity security",
    "requirement": "File ownership disclosure statement with SEC",
    "trigger": "At registration of security OR within 10 days of becoming beneficial owner",
    "deadline": "10 days",
    "penalty": "SEC enforcement action; potential fines and sanctions"
  },
  "confidence_score": 0.92,
  "processing_time": 1.2
}
```

#### Generate Control Mappings
```http
POST /regtech/generate-control-mappings/{requirement_id}
```
**Response:**
```json
{
  "requirement_id": "req_1",
  "control_mappings": [
    {
      "control_id": "SEC-16A-001",
      "category": "Insider Reporting",
      "description": "Beneficial ownership disclosure controls",
      "status": "Pending",
      "confidence": 0.88
    }
  ],
  "total_mappings": 1,
  "processing_time": 0.8
}
```

#### Complete Document Processing Pipeline
```http
POST /regtech/process-document-complete
Content-Type: multipart/form-data
```
**Description**: Single endpoint that handles the entire workflow:
1. Upload document
2. Extract requirements
3. Cluster requirements
4. Harmonize requirements
5. Organize with LLM
6. Return final organized requirements

**Perfect for frontend integration with single button click.**

#### Semantic Clustering
```http
POST /regtech/cluster-requirements
```
**Response:**
```json
{
  "message": "Successfully clustered 15 requirements",
  "clusters": [
    {
      "cluster_id": "cluster_1",
      "cluster_name": "Financial Reporting",
      "requirements": ["req_1", "req_2", "req_3"],
      "cluster_description": "Requirements related to financial reporting and disclosure",
      "confidence_score": 0.89
    }
  ],
  "total_clusters": 3,
  "processing_time": 1.5
}
```

#### Get Stored Data
```http
GET /regtech/stored-llm-organized
GET /regtech/stored-harmonized
GET /regtech/stored-clustered
```

## 🧪 Testing

### Automated Testing
```bash
# Run the main pipeline test
python test_llm_pipeline.py

# Test database connection
python test_db_simple.py

# Check system status
python check_db_status.py
python check_gpu.py
python check_tables.py
```

### Manual Testing with curl

1. **Health Check:**
```bash
curl http://localhost:8001/health
```

2. **Upload Document:**
```bash
curl -X POST "http://localhost:8001/regtech/upload-document" \
  -F "file=@test_documents/sample_sec_compliance.txt"
```

3. **Extract Requirements:**
```bash
curl -X POST "http://localhost:8001/regtech/extract-requirements/{document_id}"
```

4. **Organize with LLM:**
```bash
curl -X POST "http://localhost:8001/regtech/organize-with-llm"
```

5. **Format Individual Requirement:**
```bash
curl -X POST "http://localhost:8001/regtech/format-requirement/{requirement_id}"
```

6. **Generate Control Mappings:**
```bash
curl -X POST "http://localhost:8001/regtech/generate-control-mappings/{requirement_id}"
```

## 🏗️ Architecture

### Core Components

1. **Document Extractor**: Handles PDF, DOCX, TXT file processing
2. **LegalBERT Engine**: AI-powered entity extraction and enhancement
3. **LLM Organization Engine**: OpenAI GPT-4 powered requirement categorization
4. **Semantic Clustering Engine**: Intelligent grouping of related requirements
5. **Database Layer**: PostgreSQL with Prisma ORM for data persistence

### Data Models

#### Legal Document
```python
class LegalDocument(BaseModel):
    id: str
    filename: str
    content: str
    document_type: DocumentType  # PDF, DOCX, TXT
    file_size: int
    upload_date: datetime
```

#### Compliance Requirement
```python
class ComplianceRequirement(BaseModel):
    id: str
    title: str
    description: str
    sourceText: str
    confidenceScore: float
    entities: Dict[str, List[str]]
    document_id: str
```

#### Organized Requirement
```python
class OrganizedRequirement(BaseModel):
    policy: str
    actor: str
    requirement: str
    trigger: str
    deadline: str
    penalty: str
    mapped_controls: List[ControlMapping]
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for LLM organization
- `SECRET_KEY`: JWT secret key
- `MODEL_NAME`: LegalBERT model name
- `DEVICE`: Processing device (auto, cpu, cuda, mps)

### Database Setup
The system uses PostgreSQL with Prisma ORM. Key tables include:
- `User`: User management
- `Document`: Uploaded documents
- `ComplianceRequirement`: Extracted requirements
- `LLMOrganizedRequirement`: AI-organized requirements
- `HarmonizedRequirement`: Standardized requirements

## 🚀 Deployment

### Development
```bash
uvicorn app.main:app --reload --port 8001
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 📊 Performance

- **Document Processing**: 1-3 seconds per document
- **LegalBERT Enhancement**: 2-5 seconds with GPU, 10-20 seconds with CPU
- **LLM Organization**: 5-15 seconds depending on requirement count
- **Database Operations**: <100ms for most queries

## 🔍 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 8001 is available
   - Verify all dependencies are installed

2. **OpenAI API error**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key validity and credits

3. **Database connection failed**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env` file
   - Run database migrations

4. **LegalBERT model loading issues**
   - Ensure sufficient disk space (440MB for model)
   - Check CUDA installation for GPU acceleration

5. **No requirements found**
   - Upload a document first
   - Extract requirements before organizing

### Debug Commands
```bash
# Check database connection
python -c "from app.database import db; print('DB OK')"

# Check OpenAI API
python -c "import openai; print('OpenAI OK')"

# Check GPU availability
python check_gpu.py

# Check database tables
python check_tables.py
```

## 📈 Future Enhancements

- **Multi-language Support**: Support for non-English legal documents
- **Advanced Analytics**: Compliance gap analysis and reporting
- **Integration APIs**: Connect with external compliance systems
- **Real-time Processing**: WebSocket support for live document processing
- **Enhanced Security**: Role-based access control and audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for SEC Compliance Automation**
