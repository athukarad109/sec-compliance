'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { systemApi } from '@/lib/api';
import { ParserStats, PerformanceInfo } from '@/types/api';

export default function DashboardOverview() {
  const [stats, setStats] = useState<ParserStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, performanceData] = await Promise.all([
        systemApi.getStats().catch(() => ({
          total_documents: 0,
          processed_documents: 0,
          total_rules: 0,
          rule_types: {},
          average_confidence: 0
        })),
        systemApi.getPerformanceInfo().catch(() => ({
          device: 'unknown',
          model_loaded: false,
          batch_size: 16,
          max_length: 512,
          cuda_available: false,
          gpu_count: 0,
          gpu_name: 'Unknown'
        }))
      ]);
      setStats(statsData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data
      setStats({
        total_documents: 0,
        processed_documents: 0,
        total_rules: 0,
        rule_types: {},
        average_confidence: 0
      });
      setPerformance({
        device: 'unknown',
        model_loaded: false,
        batch_size: 16,
        max_length: 512,
        cuda_available: false,
        gpu_count: 0,
        gpu_name: 'Unknown'
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock external data for demonstration
  const externalMetrics = {
    secFilings: 1247,
    secFilingsChange: 12.5,
    marketCap: 2.4e12,
    marketCapChange: -2.3,
    complianceScore: 87.3,
    complianceScoreChange: 3.2,
    riskLevel: 'Medium',
    riskLevelChange: -1.1
  };

  const requiredActions = [
    { id: 1, title: 'Q4 2024 10-K Filing', dueDate: '2024-03-31', priority: 'High', status: 'Pending' },
    { id: 2, title: 'Annual Compliance Review', dueDate: '2024-02-15', priority: 'Medium', status: 'In Progress' },
    { id: 3, title: 'Risk Assessment Update', dueDate: '2024-01-30', priority: 'High', status: 'Overdue' },
    { id: 4, title: 'Board Meeting Preparation', dueDate: '2024-02-01', priority: 'Low', status: 'Pending' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'text-red-600';
      case 'In Progress': return 'text-blue-600';
      case 'Pending': return 'text-yellow-600';
      case 'Completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* System Metrics */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-blue-100">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Documents Processed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.total_documents || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-green-100">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Rules Extracted
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.total_rules || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-purple-100">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Compliance Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {externalMetrics.complianceScore}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-orange-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Risk Level
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {externalMetrics.riskLevel}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Data Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">External Data Integration</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">SEC Filings</p>
                  <p className="text-2xl font-bold text-gray-900">{externalMetrics.secFilings.toLocaleString()}</p>
                </div>
                <div className="flex items-center text-green-600">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{externalMetrics.secFilingsChange}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Market Cap</p>
                  <p className="text-2xl font-bold text-gray-900">${(externalMetrics.marketCap / 1e12).toFixed(1)}T</p>
                </div>
                <div className="flex items-center text-red-600">
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">{externalMetrics.marketCapChange}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">{externalMetrics.complianceScore}%</p>
                </div>
                <div className="flex items-center text-green-600">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{externalMetrics.complianceScoreChange}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Risk Level</p>
                  <p className="text-2xl font-bold text-gray-900">{externalMetrics.riskLevel}</p>
                </div>
                <div className="flex items-center text-green-600">
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">{externalMetrics.riskLevelChange}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Required Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Required Actions</h3>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {requiredActions.map((action) => (
                <li key={action.id} className="px-4 py-4 sm:px-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {action.status === 'Overdue' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        ) : action.status === 'In Progress' ? (
                          <ClockIcon className="h-5 w-5 text-blue-500" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {action.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">
                            Due: {new Date(action.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
