'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ComplianceReport {
  id: string;
  title: string;
  type: 'quarterly' | 'annual' | 'ad-hoc';
  status: 'draft' | 'review' | 'approved' | 'submitted';
  generatedDate: string;
  dueDate: string;
  format: 'pdf' | 'excel' | 'json';
  size: string;
  sections: string[];
}

export default function ReportList() {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    // Mock reports data - in a real app, this would come from the API
    const mockReports: ComplianceReport[] = [
      {
        id: '1',
        title: 'Q4 2024 Compliance Report',
        type: 'quarterly',
        status: 'approved',
        generatedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'pdf',
        size: '2.4 MB',
        sections: ['Executive Summary', 'Compliance Status', 'Key Metrics', 'Risk Assessment']
      },
      {
        id: '2',
        title: 'Annual Compliance Analysis 2024',
        type: 'annual',
        status: 'review',
        generatedDate: new Date(Date.now() - 86400000).toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'excel',
        size: '1.8 MB',
        sections: ['Rule Analysis', 'Entity Recognition', 'Confidence Scores', 'Recommendations']
      },
      {
        id: '3',
        title: 'Regulatory Submission - Form 10-K',
        type: 'ad-hoc',
        status: 'draft',
        generatedDate: new Date(Date.now() - 172800000).toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        format: 'pdf',
        size: '3.2 MB',
        sections: ['Cover Letter', 'Compliance Matrix', 'Supporting Documents', 'Attestations']
      }
    ];
    
    setReports(mockReports);
    setLoading(false);
  };

  const handleDownload = (reportId: string, title: string) => {
    toast.success(`Downloading "${title}"...`);
    // In a real app, this would trigger the actual download
  };

  const handleDelete = (reportId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    setReports(reports.filter(report => report.id !== reportId));
    toast.success('Report deleted successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircleIcon;
      case 'review':
        return ClockIcon;
      case 'draft':
        return DocumentIcon;
      case 'submitted':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quarterly':
        return 'bg-blue-100 text-blue-800';
      case 'annual':
        return 'bg-green-100 text-green-800';
      case 'ad-hoc':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Generated Reports ({reports.length})
        </h3>
        
        {reports.length === 0 ? (
          <div className="text-center py-6">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports generated</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate your first compliance report to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {reports.map((report) => {
                const StatusIcon = getStatusIcon(report.status);
                const isOverdue = new Date(report.dueDate) < new Date() && report.status !== 'submitted';
                
                return (
                  <li key={report.id} className="px-4 py-4 sm:px-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFormatIcon(report.format)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {report.title}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                              {report.type}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <StatusIcon className="h-4 w-4 mr-1" />
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                            </div>
                            <span>{report.size}</span>
                            <span>
                              {format(new Date(report.generatedDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Due: {format(new Date(report.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(report.id, report.title)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Download report"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        
                        <button
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="View report"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(report.id, report.title)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete report"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Report Sections */}
                    <div className="mt-2 ml-8">
                      <div className="flex flex-wrap gap-1">
                        {report.sections.map((section, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
