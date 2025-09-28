'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  details?: string;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    // Mock logs data - in a real app, this would come from the API
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Document uploaded successfully',
        source: 'DocumentUpload',
        details: 'File: sec_compliance.pdf, Size: 2.4MB'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'info',
        message: 'Rule extraction completed',
        source: 'RuleExtraction',
        details: 'Extracted 16 rules using GPU-accelerated LegalBERT'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: 'warning',
        message: 'Low confidence rule detected',
        source: 'RuleValidation',
        details: 'Rule RULE-abc123-001 has confidence score 0.45'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: 'error',
        message: 'GPU processing failed, falling back to CPU',
        source: 'AIPipeline',
        details: 'CUDA error: Out of memory. Switching to CPU processing.'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        level: 'info',
        message: 'System health check completed',
        source: 'HealthCheck',
        details: 'All services operational'
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: 'success',
        message: 'Report generated successfully',
        source: 'ReportGenerator',
        details: 'Q4 2024 Compliance Report exported as PDF'
      }
    ];
    
    setLogs(mockLogs);
    setLoading(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return CheckCircleIcon;
      case 'info':
        return InformationCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'error':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Logs
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Levels</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-6">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No system logs match the current filter.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const LevelIcon = getLevelIcon(log.level);
                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <LevelIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getLevelColor(log.level).split(' ')[0]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                              {log.level}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.source}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mt-1">
                          {log.message}
                        </p>
                        
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Log Statistics */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.level === 'success').length}
              </div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(log => log.level === 'info').length}
              </div>
              <div className="text-xs text-gray-500">Info</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.level === 'warning').length}
              </div>
              <div className="text-xs text-gray-500">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.level === 'error').length}
              </div>
              <div className="text-xs text-gray-500">Error</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
