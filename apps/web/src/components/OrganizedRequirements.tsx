'use client';

import { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ProcessedRequirement, MappedControl } from '@/types/api';

interface OrganizedRequirementsProps {
  requirements: ProcessedRequirement[];
  processingResult?: {
    pipeline_results: {
      requirements_extracted: number;
      clusters_created: number;
      harmonized_groups: number;
      llm_organized_groups: number;
      final_confidence: number;
    };
    processing_time: number;
    regulatory_frameworks: string[];
    risk_assessment: {
      high_risk_requirements: number;
      medium_risk_requirements: number;
      low_risk_requirements: number;
      average_confidence: number;
    };
  };
}

export default function OrganizedRequirements({ requirements, processingResult }: OrganizedRequirementsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());

  // Group requirements by category
  const groupedRequirements = requirements.reduce((groups, req) => {
    const category = req.policy || 'General Compliance';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(req);
    return groups;
  }, {} as Record<string, ProcessedRequirement[]>);

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleRequirement = (reqId: string) => {
    const newExpanded = new Set(expandedRequirements);
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId);
    } else {
      newExpanded.add(reqId);
    }
    setExpandedRequirements(newExpanded);
  };

  const getRiskLevel = (requirement: ProcessedRequirement) => {
    const penalty = requirement.penalty?.toLowerCase() || '';
    const deadline = requirement.deadline?.toLowerCase() || '';
    
    if (penalty.includes('criminal') || deadline.includes('immediately')) return 'high';
    if (penalty.includes('civil') || deadline.includes('days')) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return ExclamationTriangleIcon;
      case 'medium': return ClockIcon;
      case 'low': return ShieldCheckIcon;
      default: return ShieldCheckIcon;
    }
  };

  if (requirements.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-6">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requirements found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Process a document to see organized compliance requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Summary */}
      {processingResult && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Summary</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Requirements</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {processingResult.pipeline_results.requirements_extracted}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Groups</p>
                    <p className="text-2xl font-bold text-green-600">
                      {processingResult.pipeline_results.llm_organized_groups}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Processing Time</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {processingResult.processing_time.toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(processingResult.pipeline_results.final_confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Risk Assessment */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Assessment</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {processingResult.risk_assessment.high_risk_requirements}
                  </div>
                  <div className="text-sm text-gray-500">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {processingResult.risk_assessment.medium_risk_requirements}
                  </div>
                  <div className="text-sm text-gray-500">Medium Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {processingResult.risk_assessment.low_risk_requirements}
                  </div>
                  <div className="text-sm text-gray-500">Low Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organized Requirements */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Organized Compliance Requirements ({requirements.length} total)
          </h3>
          
          <div className="space-y-4">
            {Object.entries(groupedRequirements).map(([category, reqs]) => {
              const isExpanded = expandedGroups.has(category);
              const RiskIcon = getRiskIcon('medium'); // Default icon
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleGroup(category)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <RiskIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{category}</h4>
                        <p className="text-xs text-gray-500">{reqs.length} requirements</p>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {reqs.map((req) => {
                        const risk = getRiskLevel(req);
                        const RiskIcon = getRiskIcon(risk);
                        const isReqExpanded = expandedRequirements.has(req.id);
                        
                        return (
                          <div key={req.id} className="border-b border-gray-100 last:border-b-0">
                            <button
                              onClick={() => toggleRequirement(req.id)}
                              className="w-full px-6 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                {isReqExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                )}
                                <RiskIcon className="h-4 w-4 text-gray-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {req.requirement.substring(0, 100)}
                                    {req.requirement.length > 100 && '...'}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk)}`}>
                                      {risk} risk
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Actor: {req.actor}
                                    </span>
                                    {req.deadline && (
                                      <span className="text-xs text-gray-500">
                                        Deadline: {req.deadline}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                            
                            {isReqExpanded && (
                              <div className="px-6 py-3 bg-gray-50">
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Policy</h5>
                                    <p className="text-sm text-gray-900">{req.policy}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Actor</h5>
                                    <p className="text-sm text-gray-900">{req.actor}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Requirement</h5>
                                    <p className="text-sm text-gray-900">{req.requirement}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Trigger</h5>
                                    <p className="text-sm text-gray-900">{req.trigger}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Deadline</h5>
                                    <p className="text-sm text-gray-900">{req.deadline}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Penalty</h5>
                                    <p className="text-sm text-gray-900">{req.penalty}</p>
                                  </div>
                                  
                                  {req.mapped_controls && req.mapped_controls.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Controls</h5>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {req.mapped_controls.map((control: MappedControl, index: number) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                          >
                                            {control.control_id}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
