'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { format, addDays, isValid } from 'date-fns';

interface Report {
  id: string;
  title: string;
  type: 'Insider Trading Summary' | 'Form PF Compliance Report' | 'Cybersecurity Posture' | 'Risk Assessment' | 'Audit Log';
  status: 'Generated' | 'Scheduled' | 'Processing' | 'Failed';
  generatedDate: string;
  scheduledDate?: string;
  fileSize: string;
  format: 'PDF' | 'CSV' | 'XLS' | 'JSON';
  downloadUrl?: string;
  description: string;
  parameters: {
    dateRange: string;
    entities: string[];
    reportType: string;
    filters: string[];
  };
  scheduleType?: 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  nextScheduled?: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  entity: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed' | 'Warning';
}

export default function ReportsAudit() {
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [filteredAuditLogs, setFilteredAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    reportType: '',
    status: '',
    format: '',
    dateRange: ''
  });
  const [selectedTab, setSelectedTab] = useState<'reports' | 'audit'>('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, auditLogs, searchTerm, filters, selectedTab]);

  const loadData = async () => {
    // Mock data - in a real app, this would come from APIs
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Q4 2024 Insider Trading Summary',
        type: 'Insider Trading Summary',
        status: 'Generated',
        generatedDate: new Date().toISOString(),
        fileSize: '2.3 MB',
        format: 'PDF',
        downloadUrl: '/reports/insider-trading-q4-2024.pdf',
        description: 'Comprehensive summary of all insider trading activities for Q4 2024',
        parameters: {
          dateRange: '2024-10-01 to 2024-12-31',
          entities: ['All Executives', 'Board Members'],
          reportType: 'Quarterly Summary',
          filters: ['Form 4 Filings', 'Section 16 Reports']
        }
      },
      {
        id: '2',
        title: 'Form PF Annual Compliance Report',
        type: 'Form PF Compliance Report',
        status: 'Scheduled',
        scheduledDate: addDays(new Date(), 7).toISOString(),
        fileSize: 'N/A',
        format: 'XLS',
        description: 'Annual Form PF compliance report for private fund advisors',
        parameters: {
          dateRange: '2024-01-01 to 2024-12-31',
          entities: ['Private Fund Advisors'],
          reportType: 'Annual Compliance',
          filters: ['Form PF Filings', 'Risk Metrics']
        },
        scheduleType: 'Annual',
        nextScheduled: addDays(new Date(), 7).toISOString()
      },
      {
        id: '3',
        title: 'Cybersecurity Posture Assessment',
        type: 'Cybersecurity Posture',
        status: 'Processing',
        generatedDate: new Date().toISOString(),
        fileSize: 'N/A',
        format: 'PDF',
        description: 'Current cybersecurity posture assessment and recommendations',
        parameters: {
          dateRange: '2024-12-01 to 2024-12-31',
          entities: ['All Entities'],
          reportType: 'Security Assessment',
          filters: ['Incident Reports', 'Policy Compliance']
        }
      },
      {
        id: '4',
        title: 'Monthly Risk Assessment',
        type: 'Risk Assessment',
        status: 'Generated',
        generatedDate: addDays(new Date(), -5).toISOString(),
        fileSize: '1.8 MB',
        format: 'CSV',
        downloadUrl: '/reports/risk-assessment-nov-2024.csv',
        description: 'Monthly risk assessment and mitigation strategies',
        parameters: {
          dateRange: '2024-11-01 to 2024-11-30',
          entities: ['All Business Units'],
          reportType: 'Monthly Assessment',
          filters: ['Market Risk', 'Operational Risk', 'Compliance Risk']
        },
        scheduleType: 'Monthly',
        nextScheduled: addDays(new Date(), 25).toISOString()
      }
    ];

    const mockAuditLogs: AuditLog[] = [
      {
        id: '1',
        action: 'Report Generated',
        user: 'admin@company.com',
        timestamp: new Date().toISOString(),
        entity: 'Insider Trading Summary',
        details: 'Generated Q4 2024 Insider Trading Summary report',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'Success'
      },
      {
        id: '2',
        action: 'Report Downloaded',
        user: 'compliance@company.com',
        timestamp: addDays(new Date(), -1).toISOString(),
        entity: 'Form PF Compliance Report',
        details: 'Downloaded Form PF Annual Compliance Report',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'Success'
      },
      {
        id: '3',
        action: 'Report Generation Failed',
        user: 'system@company.com',
        timestamp: addDays(new Date(), -2).toISOString(),
        entity: 'Cybersecurity Posture',
        details: 'Failed to generate cybersecurity posture report due to data access issues',
        ipAddress: '192.168.1.102',
        userAgent: 'System Process',
        status: 'Failed'
      },
      {
        id: '4',
        action: 'Report Scheduled',
        user: 'admin@company.com',
        timestamp: addDays(new Date(), -3).toISOString(),
        entity: 'Monthly Risk Assessment',
        details: 'Scheduled monthly risk assessment report for automatic generation',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'Success'
      },
      {
        id: '5',
        action: 'Report Deleted',
        user: 'admin@company.com',
        timestamp: addDays(new Date(), -7).toISOString(),
        entity: 'Old Compliance Report',
        details: 'Deleted outdated compliance report from Q3 2023',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'Success'
      }
    ];

    setReports(mockReports);
    setAuditLogs(mockAuditLogs);
    setLoading(false);
  };

  const applyFilters = () => {
    if (selectedTab === 'reports') {
      let filtered = reports;

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(report =>
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Category filters
      if (filters.reportType) {
        filtered = filtered.filter(report => report.type === filters.reportType);
      }
      if (filters.status) {
        filtered = filtered.filter(report => report.status === filters.status);
      }
      if (filters.format) {
        filtered = filtered.filter(report => report.format === filters.format);
      }
      if (filters.dateRange) {
        const now = new Date();
        const filterDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(report => new Date(report.generatedDate) >= filterDate);
            break;
          case 'week':
            filterDate.setDate(filterDate.getDate() - 7);
            filtered = filtered.filter(report => new Date(report.generatedDate) >= filterDate);
            break;
          case 'month':
            filterDate.setMonth(filterDate.getMonth() - 1);
            filtered = filtered.filter(report => new Date(report.generatedDate) >= filterDate);
            break;
        }
      }

      setFilteredReports(filtered);
    } else {
      let filtered = auditLogs;

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(log =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredAuditLogs(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Generated':
        return 'bg-green-100 text-green-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Generated':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Scheduled':
        return <CalendarIcon className="h-4 w-4" />;
      case 'Processing':
        return <ClockIcon className="h-4 w-4" />;
      case 'Failed':
        return <TrashIcon className="h-4 w-4" />;
      case 'Success':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Warning':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'PDF':
        return 'bg-red-100 text-red-800';
      case 'CSV':
        return 'bg-green-100 text-green-800';
      case 'XLS':
        return 'bg-blue-100 text-blue-800';
      case 'JSON':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const safeFormatDate = (dateString: string, formatString: string) => {
    try {
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, formatString);
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate compliance reports and monitor system audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'reports'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setSelectedTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'audit'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Logs
          </button>
        </nav>
      </div>

      {/* Reports Tab */}
      {selectedTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Builder */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Builder</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Insider Trading Summary</div>
                    <div className="text-xs text-gray-500">Executive trading activities</div>
                  </div>
                </div>
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Form PF Compliance Report</div>
                    <div className="text-xs text-gray-500">Private fund advisor compliance</div>
                  </div>
                </div>
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Cybersecurity Posture</div>
                    <div className="text-xs text-gray-500">Security assessment report</div>
                  </div>
                </div>
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Risk Assessment</div>
                    <div className="text-xs text-gray-500">Comprehensive risk analysis</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>PDF</option>
                    <option>CSV</option>
                    <option>XLS</option>
                    <option>JSON</option>
                  </select>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>No Schedule</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </select>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {filteredReports.length} reports
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{report.status}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatColor(report.format)}`}>
                            {report.format}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {report.status === 'Generated' 
                              ? `Generated: ${safeFormatDate(report.generatedDate, 'MMM d, yyyy HH:mm')}`
                              : report.scheduledDate 
                                ? `Scheduled: ${safeFormatDate(report.scheduledDate, 'MMM d, yyyy HH:mm')}`
                                : 'Not scheduled'
                            }
                          </div>
                          <div className="flex items-center">
                            <span>Size: {report.fileSize}</span>
                          </div>
                          {report.scheduleType && (
                            <div className="flex items-center">
                              <span>Schedule: {report.scheduleType}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {report.downloadUrl && (
                            <a
                              href={report.downloadUrl}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            >
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          )}
                          <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {selectedTab === 'audit' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredAuditLogs.length} entries
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.user}</div>
                        <div className="text-sm text-gray-500">{log.ipAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.entity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {safeFormatDate(log.timestamp, 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {getStatusIcon(log.status)}
                          <span className="ml-1">{log.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.details}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {log.userAgent}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
