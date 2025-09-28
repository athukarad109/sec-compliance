'use client';

import { useState, useEffect } from 'react';
import { 
  CpuChipIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { format, addDays, addHours } from 'date-fns';

interface AgentAction {
  id: string;
  agentName: string;
  agentType: 'Disclosure Agent' | 'Trade Pattern Agent' | 'Harmonizer Agent' | 'Risk Assessment Agent' | 'Compliance Monitor Agent';
  action: string;
  description: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Error' | 'Processing';
  impact: 'High' | 'Medium' | 'Low';
  details: {
    documentsProcessed?: number;
    anomaliesDetected?: number;
    obligationsMerged?: number;
    rulesExtracted?: number;
    confidenceScore?: number;
    processingTime?: number;
  };
  relatedEntities: string[];
  tags: string[];
}

export default function AgentActivity() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<AgentAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    agentType: '',
    status: '',
    impact: '',
    dateRange: ''
  });
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentActions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [actions, searchTerm, filters]);

  const loadAgentActions = async () => {
    // Mock data - in a real app, this would come from APIs
    const mockActions: AgentAction[] = [
      {
        id: '1',
        agentName: 'Disclosure Agent',
        agentType: 'Disclosure Agent',
        action: 'Scanned 5 new 10-Ks',
        description: 'Automatically processed and analyzed 5 newly filed Form 10-K annual reports for compliance requirements',
        timestamp: new Date().toISOString(),
        status: 'Success',
        impact: 'High',
        details: {
          documentsProcessed: 5,
          rulesExtracted: 23,
          confidenceScore: 0.94,
          processingTime: 12.5
        },
        relatedEntities: ['Tech Corp Inc', 'Public Company LLC', 'Investment Holdings'],
        tags: ['Form 10-K', 'Annual Reports', 'Compliance Scanning']
      },
      {
        id: '2',
        agentName: 'Trade Pattern Agent',
        agentType: 'Trade Pattern Agent',
        action: 'Flagged 2 anomalies',
        description: 'Detected unusual trading patterns in executive transactions that may require additional disclosure',
        timestamp: addHours(new Date(), -2).toISOString(),
        status: 'Warning',
        impact: 'High',
        details: {
          anomaliesDetected: 2,
          confidenceScore: 0.87,
          processingTime: 3.2
        },
        relatedEntities: ['Executive Holdings', 'CEO Trading Account'],
        tags: ['Insider Trading', 'Anomaly Detection', 'Form 4']
      },
      {
        id: '3',
        agentName: 'Harmonizer Agent',
        agentType: 'Harmonizer Agent',
        action: 'Merged 3 duplicate obligations',
        description: 'Identified and merged 3 duplicate compliance obligations across different regulatory frameworks',
        timestamp: addHours(new Date(), -4).toISOString(),
        status: 'Success',
        impact: 'Medium',
        details: {
          obligationsMerged: 3,
          confidenceScore: 0.92,
          processingTime: 8.7
        },
        relatedEntities: ['SEC Regulations', 'State Compliance', 'Industry Standards'],
        tags: ['Obligation Harmonization', 'Duplicate Detection', 'Regulatory Mapping']
      },
      {
        id: '4',
        agentName: 'Risk Assessment Agent',
        agentType: 'Risk Assessment Agent',
        action: 'Updated risk factors',
        description: 'Analyzed market conditions and updated risk factor assessments for upcoming annual report',
        timestamp: addDays(new Date(), -1).toISOString(),
        status: 'Success',
        impact: 'Medium',
        details: {
          documentsProcessed: 1,
          rulesExtracted: 8,
          confidenceScore: 0.89,
          processingTime: 15.3
        },
        relatedEntities: ['Annual Report', 'Risk Management'],
        tags: ['Risk Assessment', 'Market Analysis', 'Form 10-K']
      },
      {
        id: '5',
        agentName: 'Compliance Monitor Agent',
        agentType: 'Compliance Monitor Agent',
        action: 'Detected policy violation',
        description: 'Identified potential violation of insider trading policy requiring immediate attention',
        timestamp: addHours(new Date(), -6).toISOString(),
        status: 'Error',
        impact: 'High',
        details: {
          anomaliesDetected: 1,
          confidenceScore: 0.95,
          processingTime: 2.1
        },
        relatedEntities: ['Insider Trading Policy', 'Employee Trading'],
        tags: ['Policy Violation', 'Compliance Monitoring', 'Alert']
      },
      {
        id: '6',
        agentName: 'Disclosure Agent',
        agentType: 'Disclosure Agent',
        action: 'Processed 3 Form 8-Ks',
        description: 'Automatically processed 3 current reports for material events and cybersecurity incidents',
        timestamp: addDays(new Date(), -2).toISOString(),
        status: 'Success',
        impact: 'Medium',
        details: {
          documentsProcessed: 3,
          rulesExtracted: 12,
          confidenceScore: 0.91,
          processingTime: 7.8
        },
        relatedEntities: ['Current Reports', 'Material Events', 'Cybersecurity'],
        tags: ['Form 8-K', 'Current Reports', 'Material Events']
      },
      {
        id: '7',
        agentName: 'Trade Pattern Agent',
        agentType: 'Trade Pattern Agent',
        action: 'Analyzed trading patterns',
        description: 'Completed quarterly analysis of all insider trading patterns and identified trends',
        timestamp: addDays(new Date(), -3).toISOString(),
        status: 'Success',
        impact: 'Low',
        details: {
          documentsProcessed: 15,
          anomaliesDetected: 0,
          confidenceScore: 0.88,
          processingTime: 25.4
        },
        relatedEntities: ['Quarterly Analysis', 'Trading Patterns'],
        tags: ['Quarterly Analysis', 'Pattern Recognition', 'Trend Analysis']
      },
      {
        id: '8',
        agentName: 'Harmonizer Agent',
        agentType: 'Harmonizer Agent',
        action: 'Updated regulatory mapping',
        description: 'Updated cross-reference mapping between SEC rules and state regulations',
        timestamp: addDays(new Date(), -5).toISOString(),
        status: 'Success',
        impact: 'Medium',
        details: {
          obligationsMerged: 0,
          confidenceScore: 0.93,
          processingTime: 18.9
        },
        relatedEntities: ['Regulatory Mapping', 'Cross-References'],
        tags: ['Regulatory Mapping', 'Cross-Reference', 'State Regulations']
      }
    ];

    setActions(mockActions);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = actions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(action =>
        action.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filters
    if (filters.agentType) {
      filtered = filtered.filter(action => action.agentType === filters.agentType);
    }
    if (filters.status) {
      filtered = filtered.filter(action => action.status === filters.status);
    }
    if (filters.impact) {
      filtered = filtered.filter(action => action.impact === filters.impact);
    }
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(action => new Date(action.timestamp) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(action => new Date(action.timestamp) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(action => new Date(action.timestamp) >= filterDate);
          break;
      }
    }

    setFilteredActions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'Error':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'Processing':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAgentTypeColor = (agentType: string) => {
    switch (agentType) {
      case 'Disclosure Agent':
        return 'bg-blue-100 text-blue-800';
      case 'Trade Pattern Agent':
        return 'bg-purple-100 text-purple-800';
      case 'Harmonizer Agent':
        return 'bg-green-100 text-green-800';
      case 'Risk Assessment Agent':
        return 'bg-orange-100 text-orange-800';
      case 'Compliance Monitor Agent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Agent Activity Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time monitoring of AI agent actions and compliance automation
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Filter Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search activities..."
                  />
                </div>
              </div>

              {/* Agent Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Type
                </label>
                <select
                  value={filters.agentType}
                  onChange={(e) => setFilters({ ...filters, agentType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Agents</option>
                  <option value="Disclosure Agent">Disclosure Agent</option>
                  <option value="Trade Pattern Agent">Trade Pattern Agent</option>
                  <option value="Harmonizer Agent">Harmonizer Agent</option>
                  <option value="Risk Assessment Agent">Risk Assessment Agent</option>
                  <option value="Compliance Monitor Agent">Compliance Monitor Agent</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Success">Success</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                  <option value="Processing">Processing</option>
                </select>
              </div>

              {/* Impact Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact
                </label>
                <select
                  value={filters.impact}
                  onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Impacts</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    agentType: '',
                    status: '',
                    impact: '',
                    dateRange: ''
                  });
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Activity Timeline */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredActions.map((action, index) => (
              <div key={action.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <CpuChipIcon className="h-5 w-5 text-gray-400" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentTypeColor(action.agentType)}`}>
                            {action.agentType}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                          {getStatusIcon(action.status)}
                          <span className="ml-1">{action.status}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(action.impact)}`}>
                          {action.impact} Impact
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {action.action}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                        {action.details.processingTime && (
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {action.details.processingTime}s processing time
                          </div>
                        )}
                        {action.details.confidenceScore && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">
                              {Math.round(action.details.confidenceScore * 100)}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Details */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {action.details.documentsProcessed && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Documents Processed:</span>
                            <span className="ml-1 text-gray-600">{action.details.documentsProcessed}</span>
                          </div>
                        )}
                        {action.details.anomaliesDetected && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Anomalies Detected:</span>
                            <span className="ml-1 text-gray-600">{action.details.anomaliesDetected}</span>
                          </div>
                        )}
                        {action.details.obligationsMerged && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Obligations Merged:</span>
                            <span className="ml-1 text-gray-600">{action.details.obligationsMerged}</span>
                          </div>
                        )}
                        {action.details.rulesExtracted && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Rules Extracted:</span>
                            <span className="ml-1 text-gray-600">{action.details.rulesExtracted}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Related Entities */}
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Related Entities</h4>
                        <div className="flex flex-wrap gap-1">
                          {action.relatedEntities.map((entity, entityIndex) => (
                            <span key={entityIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {action.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedAction(action)}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Agent Action Details</h3>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Action Summary</h4>
                <p className="text-sm text-gray-600">{selectedAction.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Agent</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentTypeColor(selectedAction.agentType)}`}>
                    {selectedAction.agentType}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAction.status)}`}>
                    {getStatusIcon(selectedAction.status)}
                    <span className="ml-1">{selectedAction.status}</span>
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedAction.details).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="ml-1 text-gray-600">
                        {typeof value === 'number' && key.includes('Score') 
                          ? `${Math.round(value * 100)}%`
                          : value
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
