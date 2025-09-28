'use client';

import { useState, useEffect } from 'react';
import { 
  GlobeAltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ExternalDataSource {
  id: string;
  name: string;
  type: 'SEC' | 'Market' | 'News' | 'Regulatory';
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: string;
  dataPoints: number;
  description: string;
}

interface DataTableRow {
  id: string;
  company: string;
  filing: string;
  date: string;
  status: string;
  risk: 'Low' | 'Medium' | 'High';
}

export default function ExternalDataIntegration() {
  const [dataSources, setDataSources] = useState<ExternalDataSource[]>([]);
  const [tableData, setTableData] = useState<DataTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExternalData();
  }, []);

  const loadExternalData = async () => {
    // Mock external data sources
    const mockDataSources: ExternalDataSource[] = [
      {
        id: '1',
        name: 'SEC EDGAR Database',
        type: 'SEC',
        status: 'connected',
        lastUpdate: new Date().toISOString(),
        dataPoints: 1247,
        description: 'Real-time SEC filing data and compliance information'
      },
      {
        id: '2',
        name: 'Market Data API',
        type: 'Market',
        status: 'connected',
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        dataPoints: 892,
        description: 'Live market data and financial metrics'
      },
      {
        id: '3',
        name: 'News API',
        type: 'News',
        status: 'error',
        lastUpdate: new Date(Date.now() - 3600000).toISOString(),
        dataPoints: 0,
        description: 'Financial news and regulatory updates'
      },
      {
        id: '4',
        name: 'Regulatory Database',
        type: 'Regulatory',
        status: 'connected',
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        dataPoints: 456,
        description: 'Regulatory compliance and rule updates'
      }
    ];

    const mockTableData: DataTableRow[] = [
      {
        id: '1',
        company: 'Apple Inc.',
        filing: '10-K Annual Report',
        date: '2024-01-15',
        status: 'Filed',
        risk: 'Low'
      },
      {
        id: '2',
        company: 'Microsoft Corp.',
        filing: '8-K Current Report',
        date: '2024-01-14',
        status: 'Filed',
        risk: 'Low'
      },
      {
        id: '3',
        company: 'Tesla Inc.',
        filing: '10-Q Quarterly Report',
        date: '2024-01-13',
        status: 'Late',
        risk: 'High'
      },
      {
        id: '4',
        company: 'Amazon.com Inc.',
        filing: 'DEF 14A Proxy Statement',
        date: '2024-01-12',
        status: 'Filed',
        risk: 'Medium'
      },
      {
        id: '5',
        company: 'Meta Platforms Inc.',
        filing: '8-K Current Report',
        date: '2024-01-11',
        status: 'Filed',
        risk: 'Low'
      }
    ];

    setDataSources(mockDataSources);
    setTableData(mockTableData);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    await loadExternalData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return CheckCircleIcon;
      case 'disconnected':
        return ClockIcon;
      case 'error':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'High':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SEC':
        return '📊';
      case 'Market':
        return '📈';
      case 'News':
        return '📰';
      case 'Regulatory':
        return '⚖️';
      default:
        return '📋';
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
    <div className="space-y-6">
      {/* Data Sources */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">External Data Sources</h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dataSources.map((source) => {
              const StatusIcon = getStatusIcon(source.status);
              return (
                <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(source.type)}</span>
                      <h4 className="text-sm font-medium text-gray-900">{source.name}</h4>
                    </div>
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(source.status).split(' ')[0]}`} />
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-2">{source.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                      {source.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {source.dataPoints.toLocaleString()} points
                    </span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated: {new Date(source.lastUpdate).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent SEC Filings</h3>
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Live Data</span>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filing Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{row.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{row.filing}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(row.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Filed' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(row.risk)}`}>
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
