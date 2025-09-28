# SEC Compliance Automation Frontend

A modern React.js frontend for the SEC Compliance Automation Platform, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Document Upload**: Drag-and-drop interface for PDF, DOCX, and TXT files
- **AI-Powered Rule Extraction**: Three processing modes (Pattern, LegalBERT, GPU-accelerated)
- **Compliance Monitoring**: Real-time status tracking and risk assessment
- **Report Generation**: Automated compliance reports with multiple formats
- **Admin Panel**: System configuration and user management

### Key Components
- **DocumentUpload**: File upload with progress tracking
- **RuleExtraction**: AI processing with method selection
- **ComplianceDashboard**: Status monitoring and alerts
- **ReportGenerator**: Template-based report creation
- **SystemSettings**: Configuration management

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Headless UI, Heroicons
- **State Management**: React hooks
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Chart.js with React Chart.js 2
- **File Handling**: React Dropzone

## 📦 Installation

```bash
cd apps/web
npm install
```

## 🚀 Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page (Document Upload)
│   ├── rules/             # Rule extraction page
│   ├── compliance/        # Compliance monitoring page
│   ├── reports/           # Report generation page
│   └── admin/             # Admin panel page
├── components/            # React components
│   ├── Layout.tsx         # Main layout with navigation
│   ├── DocumentUpload.tsx # File upload interface
│   ├── DocumentList.tsx   # Document management
│   ├── RuleExtraction.tsx # AI processing interface
│   ├── RuleList.tsx       # Rule management
│   ├── ComplianceDashboard.tsx # Status monitoring
│   ├── ComplianceAlerts.tsx # Alert management
│   ├── ReportGenerator.tsx # Report creation
│   ├── ReportList.tsx   # Report management
│   ├── SystemSettings.tsx # Configuration
│   ├── UserManagement.tsx # User administration
│   └── SystemLogs.tsx     # System monitoring
├── lib/                   # Utilities and API client
│   └── api.ts            # Backend API integration
├── types/                 # TypeScript type definitions
│   └── api.ts            # API response types
└── components/           # Shared components
```

## 🔌 API Integration

The frontend integrates with the FastAPI backend through a centralized API client (`src/lib/api.ts`):

### Document Management
- `POST /parser/upload-document` - Upload documents
- `GET /parser/documents` - List documents
- `DELETE /parser/documents/{id}` - Delete documents

### Rule Extraction
- `POST /parser/extract-rules/{id}` - Pattern matching
- `POST /parser/extract-rules-bert/{id}` - LegalBERT processing
- `POST /parser/extract-rules-bert-gpu/{id}` - GPU-accelerated processing

### System Information
- `GET /parser/performance-info` - GPU/CPU status
- `GET /parser/stats` - Processing statistics
- `GET /health/` - System health

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Collapsible sidebar for mobile devices
- Responsive grid layouts

### User Experience
- Real-time processing status
- Drag-and-drop file uploads
- Interactive rule cards with confidence scores
- Toast notifications for user feedback
- Loading states and skeleton screens

### Data Visualization
- System performance metrics
- Compliance status indicators
- Risk assessment charts
- Processing time comparisons

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Backend Integration
The frontend expects the FastAPI backend to be running on `http://localhost:8001` by default.

## 📱 Pages Overview

### 1. Document Upload (`/`)
- File upload interface with drag-and-drop
- System statistics dashboard
- Document list with processing status

### 2. Rule Extraction (`/rules`)
- Document selection for processing
- AI processing method selection (Pattern/LegalBERT/GPU)
- Extracted rules display with confidence scores

### 3. Compliance Monitoring (`/compliance`)
- Compliance status overview
- Risk assessment dashboard
- Alert management system

### 4. Reports (`/reports`)
- Report template selection
- Custom report configuration
- Generated reports management

### 5. Admin Panel (`/admin`)
- System settings and configuration
- User management
- System logs and monitoring

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Development Notes

### Type Safety
- Full TypeScript integration
- API response types matching backend models
- Component prop validation

### Performance
- Lazy loading for large components
- Optimized bundle size
- Efficient state management

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new components
3. Maintain consistent styling with Tailwind CSS
4. Add proper error handling and loading states
5. Test with the backend API integration

## 📄 License

This project is part of the SEC Compliance Automation Platform.