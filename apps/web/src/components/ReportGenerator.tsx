'use client';

import { useState } from 'react';
import { 
  DocumentIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type ReportType = 'quarterly' | 'annual' | 'ad-hoc';
type ReportFormat = 'pdf' | 'excel' | 'json';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  sections: string[];
}

export default function ReportGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>('quarterly');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'compliance-overview',
      name: 'Compliance Overview',
      description: 'High-level compliance status and key metrics',
      type: 'quarterly',
      sections: ['Executive Summary', 'Compliance Status', 'Key Metrics', 'Risk Assessment']
    },
    {
      id: 'detailed-analysis',
      name: 'Detailed Analysis',
      description: 'Comprehensive compliance analysis with rule details',
      type: 'annual',
      sections: ['Rule Analysis', 'Entity Recognition', 'Confidence Scores', 'Recommendations']
    },
    {
      id: 'regulatory-submission',
      name: 'Regulatory Submission',
      description: 'Formatted report for regulatory submission',
      type: 'ad-hoc',
      sections: ['Cover Letter', 'Compliance Matrix', 'Supporting Documents', 'Attestations']
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a report template');
      return;
    }

    setGenerating(true);
    try {
      // Mock report generation - in a real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      toast.success(`Report "${template?.name}" generated successfully!`);
      
      // Reset form
      setSelectedTemplate('');
      setReportTitle('');
    } catch (error: any) {
      toast.error(`Report generation failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Generate Compliance Report
        </h3>

        <div className="space-y-6">
          {/* Report Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Template
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {reportTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`
                    relative rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${selectedTemplate === template.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <DocumentIcon className="h-6 w-6 text-indigo-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.description}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {template.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Configuration */}
          {selectedTemplate && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Report Configuration
              </h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="ad-hoc">Ad-hoc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="json">JSON Data</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Report Sections */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Sections
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedTemplateData?.sections.map((section, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        {section}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Include charts and visualizations
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Include raw data and technical details
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || generating}
              className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                ${!selectedTemplate || generating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }
              `}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
