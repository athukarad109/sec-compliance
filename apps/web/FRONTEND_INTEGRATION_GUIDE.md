# Frontend Integration Guide - Unified Document Processing

## 🎯 **Overview**

The frontend has been updated to integrate with the new unified document processing endpoint. Users can now upload a document and get fully organized compliance requirements with a single button click.

## 🚀 **New Features**

### **1. Document Processor Component**
- **File Upload**: Drag & drop or click to upload PDF, DOCX, or TXT files
- **Complete Pipeline**: Single button processes entire workflow
- **Progress Tracking**: Real-time status updates during processing
- **Error Handling**: Graceful error handling with user-friendly messages

### **2. Organized Requirements Display**
- **Grouped by Category**: Requirements organized by regulatory framework
- **Expandable Sections**: Click to expand/collapse requirement groups
- **Risk Assessment**: Color-coded risk levels (High/Medium/Low)
- **Rich Details**: Full requirement details with controls and penalties
- **Processing Summary**: Statistics and confidence scores

### **3. Enhanced Compliance Dashboard**
- **Unified View**: Shows both legacy rules and processed requirements
- **Smart Statistics**: Combined metrics from all sources
- **Interactive Interface**: Easy navigation between different views

## 📁 **New Files Created**

### **Components**
- `DocumentProcessor.tsx` - File upload and processing interface
- `OrganizedRequirements.tsx` - Display organized requirements with rich UI

### **API Integration**
- Updated `api.ts` with new unified endpoint functions
- Updated `api.ts` types with new response structures

### **Types**
- Added comprehensive TypeScript types for unified processing
- Support for organized requirements and processing results

## 🔧 **API Endpoints Used**

### **Primary Endpoint**
```typescript
POST /parser/process-document-complete
```
- **Input**: File upload (multipart/form-data)
- **Output**: Complete processing results with organized requirements
- **Timeout**: 2 minutes for complete pipeline processing

### **Secondary Endpoint**
```typescript
GET /parser/final-organized-requirements
```
- **Input**: None
- **Output**: Previously processed and stored requirements
- **Use Case**: Load existing results without re-processing

## 🎨 **User Experience Flow**

### **1. Initial State**
- Clean interface with "Upload Document" button
- No requirements displayed
- Clear call-to-action for document processing

### **2. Document Upload**
- Drag & drop or click to select file
- File validation (PDF, DOCX, TXT only)
- File size and type display
- "Process Document" button enabled

### **3. Processing**
- Real-time status updates
- Progress indicators
- Processing time estimation
- Error handling with retry options

### **4. Results Display**
- Processing summary with statistics
- Organized requirements by category
- Expandable requirement details
- Risk assessment visualization
- Control mappings and penalties

## 📊 **Response Format Integration**

The frontend handles the complete response format:

```typescript
interface UnifiedProcessingResponse {
  success: boolean;
  message: string;
  document_id: string;
  filename: string;
  processing_time: number;
  pipeline_results: {
    requirements_extracted: number;
    clusters_created: number;
    harmonized_groups: number;
    llm_organized_groups: number;
    final_confidence: number;
  };
  organized_requirements: OrganizedRequirementGroup[];
  regulatory_frameworks: string[];
  actor_types: string[];
  risk_assessment: {
    high_risk_requirements: number;
    medium_risk_requirements: number;
    low_risk_requirements: number;
    average_confidence: number;
  };
}
```

## 🎯 **Key Benefits**

### **For Users**
- **One-Click Processing**: Upload → Get organized results
- **Rich Visualization**: Interactive requirement exploration
- **Risk Assessment**: Clear risk level indicators
- **Professional UI**: Modern, intuitive interface

### **For Developers**
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error management
- **Modular Design**: Reusable components
- **API Integration**: Clean separation of concerns

## 🚀 **Usage Instructions**

### **1. Start the Backend**
```bash
cd services/backend
python -m uvicorn app.main:app --reload
```

### **2. Start the Frontend**
```bash
cd apps/web
npm run dev
```

### **3. Navigate to Compliance Page**
- Go to `/compliance` in your browser
- Click "Upload Document" button
- Select a PDF, DOCX, or TXT file
- Click "Process Document"
- View organized requirements

## 🔧 **Configuration**

### **API Base URL**
Update in `apps/web/src/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### **Environment Variables**
Create `.env.local` in `apps/web/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📱 **Responsive Design**

The components are fully responsive and work on:
- **Desktop**: Full feature set with expandable sections
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Simplified view with essential information

## 🎨 **Styling**

Uses Tailwind CSS with:
- **Consistent Design**: Matches existing application theme
- **Color Coding**: Risk levels and status indicators
- **Interactive Elements**: Hover states and transitions
- **Accessibility**: Proper contrast and keyboard navigation

## 🔍 **Testing**

### **Manual Testing**
1. Upload a sample SEC compliance document
2. Verify processing completes successfully
3. Check that requirements are properly organized
4. Test expand/collapse functionality
5. Verify risk assessment accuracy

### **Error Scenarios**
1. Upload invalid file type
2. Upload empty file
3. Network timeout during processing
4. Backend service unavailable

## 🚀 **Future Enhancements**

### **Planned Features**
- **Batch Processing**: Multiple document upload
- **Export Functionality**: PDF/Excel export of requirements
- **Advanced Filtering**: Filter by risk level, category, etc.
- **Comparison Tools**: Compare requirements across documents
- **Integration**: Connect with existing compliance workflows

### **Performance Optimizations**
- **Caching**: Store processed results locally
- **Lazy Loading**: Load requirements on demand
- **Pagination**: Handle large requirement sets
- **Search**: Full-text search across requirements

## 📋 **Summary**

The frontend integration provides a complete, user-friendly interface for the unified document processing pipeline. Users can now:

1. **Upload** compliance documents easily
2. **Process** them through the complete AI pipeline
3. **View** organized requirements with rich details
4. **Assess** risk levels and compliance status
5. **Navigate** through structured requirement groups

The integration maintains the existing functionality while adding powerful new AI-driven document processing capabilities.
