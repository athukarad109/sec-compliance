# Testing the Legal Parser Engine

## Quick Start

### 1. Start the Server
```bash
cd services/backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Test with Sample Document
```bash
python test_parser.py
```

### 3. Interactive API Testing
Visit: http://localhost:8001/docs

## Sample Document

The parser comes with a sample SEC compliance document (`test_documents/sample_sec_compliance.txt`) that contains various types of compliance rules:

- **Quarterly reporting obligations** (45-day deadline)
- **Annual report requirements** (60-day deadline)
- **Material information disclosure** (4 business days)
- **Insider trading prohibitions**
- **Late filing penalties** ($100-200 per day)
- **Record keeping requirements** (7 years)
- **Internal controls requirements**

## Expected Results

When you run the test, you should see rules extracted like:

```json
{
  "rule_id": "RULE-abc12345-001",
  "title": "All public companies must file quarterly reports",
  "rule_type": "reporting_obligation",
  "description": "All public companies must file quarterly reports on Form 10-Q within 45 days after the end of each fiscal quarter.",
  "requirements": [
    {
      "action": "file",
      "deadline": "45 days",
      "entities": ["public companies"],
      "thresholds": {"monetary": ["$75 million"]}
    }
  ],
  "penalties": {
    "late_filing": "$100 per day"
  },
  "confidence_score": 0.8
}
```

## API Endpoints

- `POST /parser/upload-document` - Upload a document
- `POST /parser/extract-rules/{document_id}` - Extract rules
- `GET /parser/rules` - Search/filter rules
- `GET /parser/stats` - Get parser statistics
- `GET /parser/documents` - List all documents

## Manual Testing

You can also test manually using curl:

```bash
# Upload document
curl -X POST "http://localhost:8001/parser/upload-document" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_documents/sample_sec_compliance.txt"

# Extract rules (replace {document_id} with actual ID)
curl -X POST "http://localhost:8001/parser/extract-rules/{document_id}"

# Search rules
curl -X GET "http://localhost:8001/parser/rules?query=quarterly"
```
