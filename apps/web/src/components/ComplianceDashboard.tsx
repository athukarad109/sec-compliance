'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ruleApi, documentApi } from '@/lib/api';
import { ComplianceRule, ProcessedRequirement, UnifiedProcessingResponse, StoredLLMOrganizedGroup } from '@/types/api';
import DocumentProcessor from './DocumentProcessor';
import OrganizedRequirements from './OrganizedRequirements';

export default function ComplianceDashboard() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedRequirements, setProcessedRequirements] = useState<ProcessedRequirement[]>([]);
  const [processingResult, setProcessingResult] = useState<UnifiedProcessingResponse | null>(null);
  const [showDocumentProcessor, setShowDocumentProcessor] = useState(false);
  const [storedGroups, setStoredGroups] = useState<StoredLLMOrganizedGroup[]>([]);
  const [loadingStoredData, setLoadingStoredData] = useState(true);
  const [refreshingData, setRefreshingData] = useState(false);

  useEffect(() => {
    loadRules();
    loadStoredRequirements();
  }, []);

  const loadRules = async () => {
    try {
      const rulesData = await ruleApi.search();
      setRules(rulesData);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredRequirements = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshingData(true);
      } else {
        setLoadingStoredData(true);
      }
      
      const response = await documentApi.getStoredLLMOrganized();
      
      if (response.organized_requirements && response.organized_requirements.length > 0) {
        setStoredGroups(response.organized_requirements);
        
        // Extract all requirements from stored groups
        const allRequirements: ProcessedRequirement[] = [];
        response.organized_requirements.forEach(group => {
          allRequirements.push(...group.requirements);
        });
        
        setProcessedRequirements(allRequirements);
        console.log(`Loaded ${allRequirements.length} requirements from ${response.organized_requirements.length} stored groups`);
      } else {
        console.log('No stored requirements found');
      }
    } catch (error) {
      console.error('Failed to load stored requirements:', error);
    } finally {
      setLoadingStoredData(false);
      setRefreshingData(false);
    }
  };

  const handleProcessingComplete = (result: UnifiedProcessingResponse) => {
    setProcessingResult(result);
    setShowDocumentProcessor(false);
    // Refresh stored data after processing
    loadStoredRequirements();
  };

  const handleRequirementsLoaded = (requirements: ProcessedRequirement[]) => {
    setProcessedRequirements(requirements);
  };

  // Mock compliance status calculation
  const getComplianceStatus = (rule: ComplianceRule) => {
    const confidence = rule.confidence_score;
    if (confidence >= 0.8) return 'compliant';
    if (confidence >= 0.6) return 'pending';
    return 'non-compliant';
  };

  const getRiskLevel = (rule: ComplianceRule) => {
    const confidence = rule.confidence_score;
    if (confidence >= 0.8) return 'low';
    if (confidence >= 0.6) return 'medium';
    return 'high';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'non-compliant':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return CheckCircleIcon;
      case 'pending':
        return ClockIcon;
      case 'non-compliant':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const complianceStats = {
    total: rules.length + processedRequirements.length,
    compliant: rules.filter(rule => getComplianceStatus(rule) === 'compliant').length + 
               processedRequirements.filter(req => getRiskLevel(req) === 'low').length,
    pending: rules.filter(rule => getComplianceStatus(rule) === 'pending').length + 
             processedRequirements.filter(req => getRiskLevel(req) === 'medium').length,
    nonCompliant: rules.filter(rule => getComplianceStatus(rule) === 'non-compliant').length + 
                  processedRequirements.filter(req => getRiskLevel(req) === 'high').length,
  };

  const getRiskLevel = (req: ProcessedRequirement) => {
    const penalty = req.penalty?.toLowerCase() || '';
    const deadline = req.deadline?.toLowerCase() || '';
    
    if (penalty.includes('criminal') || deadline.includes('immediately')) return 'high';
    if (penalty.includes('civil') || deadline.includes('days')) return 'medium';
    return 'low';
  };

  const riskStats = {
    low: processedRequirements.filter(req => getRiskLevel(req) === 'low').length,
    medium: processedRequirements.filter(req => getRiskLevel(req) === 'medium').length,
    high: processedRequirements.filter(req => getRiskLevel(req) === 'high').length,
  };

  if (loading || loadingStoredData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Processing Section */}
      {showDocumentProcessor && (
        <DocumentProcessor
          onProcessingComplete={handleProcessingComplete}
          onRequirementsLoaded={handleRequirementsLoaded}
          onRefreshStoredData={loadStoredRequirements}
        />
      )}

      {/* Processed Requirements Display */}
      {processedRequirements.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Organized Compliance Requirements ({processedRequirements.length} total)
            </h3>
            <button
              onClick={() => loadStoredRequirements(true)}
              disabled={refreshingData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshingData ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          <OrganizedRequirements
            requirements={processedRequirements}
            processingResult={processingResult}
          />
        </div>
      )}

      {/* Upload Button */}
      {!showDocumentProcessor && processedRequirements.length === 0 && storedGroups.length === 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Process Compliance Documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a document to extract and organize compliance requirements using AI.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowDocumentProcessor(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Overview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Overview</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-blue-100">
                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Rules
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {complianceStats.total}
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
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Compliant
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {complianceStats.compliant}
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
                  <div className="p-3 rounded-md bg-yellow-100">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {complianceStats.pending}
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
                  <div className="p-3 rounded-md bg-red-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Non-Compliant
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {complianceStats.nonCompliant}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Low Risk</p>
                <p className="text-sm text-gray-500">{riskStats.low} rules</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Medium Risk</p>
                <p className="text-sm text-gray-500">{riskStats.medium} rules</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">High Risk</p>
                <p className="text-sm text-gray-500">{riskStats.high} rules</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Compliance Rules List */}
      {rules.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Legacy Compliance Rules ({rules.length})</h3>
            
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {rules.map((rule) => {
                  const status = getComplianceStatus(rule);
                  const risk = getRiskLevel(rule);
                  const StatusIcon = getStatusIcon(status);
                  
                  return (
                    <li key={rule.rule_id} className="px-4 py-4 sm:px-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(status).split(' ')[0]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {rule.title}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {status.replace('-', ' ')}
                              </span>
                              <span className={`text-xs font-medium ${getRiskColor(risk)}`}>
                                {risk} risk
                              </span>
                              <span>
                                {format(new Date(rule.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {(rule.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
