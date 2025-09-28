'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ComplianceRule } from '@/types/api';

interface ExtractedRulesDisplayProps {
  rules?: ComplianceRule[];
  processingTime?: number;
  documentId?: string;
}

export default function ExtractedRulesDisplay({ rules: propRules, processingTime: propProcessingTime, documentId: propDocumentId }: ExtractedRulesDisplayProps) {
  const [rules, setRules] = useState<ComplianceRule[]>(propRules || []);
  const [processingTime, setProcessingTime] = useState<number>(propProcessingTime || 0);
  const [documentId, setDocumentId] = useState<string>(propDocumentId || '');
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);
  const [filteredRules, setFilteredRules] = useState<ComplianceRule[]>(propRules || []);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('confidence');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractedRules();
  }, []);

  const loadExtractedRules = () => {
    try {
      // Check if we have extracted rules from localStorage
      const extractedRules = localStorage.getItem('extractedRules');
      const extractionResponse = localStorage.getItem('extractionResponse');
      
      if (extractedRules) {
        const rulesData = JSON.parse(extractedRules);
        setRules(rulesData);
        setFilteredRules(rulesData);
      }
      
      if (extractionResponse) {
        const response = JSON.parse(extractionResponse);
        setProcessingTime(response.processing_time);
        setDocumentId(response.document_id);
      }
    } catch (error) {
      console.error('Failed to load extracted rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredRules(rules);
  }, [rules]);

  const handleFilter = (type: string) => {
    setFilterType(type);
    if (type === 'all') {
      setFilteredRules(rules);
    } else {
      setFilteredRules(rules.filter(rule => rule.rule_type === type));
    }
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    const sorted = [...filteredRules].sort((a, b) => {
      switch (sortType) {
        case 'confidence':
          return b.confidence_score - a.confidence_score;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.rule_type.localeCompare(b.rule_type);
        default:
          return 0;
      }
    });
    setFilteredRules(sorted);
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'obligation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prohibition':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reporting_obligation':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disclosure_requirement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'condition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircleIcon;
    if (confidence >= 0.6) return ExclamationTriangleIcon;
    return ExclamationTriangleIcon;
  };

  const handleExportRules = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `extracted-rules-${documentId || 'export'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Rules exported successfully');
  };

  const ruleTypes = [
    { value: 'all', label: 'All Types', count: rules.length },
    { value: 'obligation', label: 'Obligations', count: rules.filter(r => r.rule_type === 'obligation').length },
    { value: 'prohibition', label: 'Prohibitions', count: rules.filter(r => r.rule_type === 'prohibition').length },
    { value: 'reporting_obligation', label: 'Reporting', count: rules.filter(r => r.rule_type === 'reporting_obligation').length },
    { value: 'disclosure_requirement', label: 'Disclosure', count: rules.filter(r => r.rule_type === 'disclosure_requirement').length },
  ];

  // Don't render if no rules are available
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

  if (rules.length === 0) {
    return null; // Don't render anything if no rules
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Extracted Rules ({rules.length})
              </h3>
              {processingTime && (
                <p className="text-sm text-gray-500">
                  Processed in {processingTime.toFixed(2)} seconds
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportRules}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Rules
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ruleTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleFilter(type.value)}
                className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  filterType === type.value
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {type.label} ({type.count})
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="confidence">Confidence Score</option>
              <option value="title">Title</option>
              <option value="type">Rule Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => {
          const ConfidenceIcon = getConfidenceIcon(rule.confidence_score);
          return (
            <div
              key={rule.rule_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {rule.title}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRuleTypeColor(rule.rule_type)}`}>
                      {rule.rule_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {rule.description}
                  </p>
                  
                  {/* Requirements */}
                  {rule.requirements && rule.requirements.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h5>
                      <ul className="space-y-1">
                        {rule.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                              <strong>Action:</strong> {req.action}
                              {req.deadline && <span className="ml-2 text-gray-500">(Due: {req.deadline})</span>}
                              {req.entities.length > 0 && (
                                <span className="ml-2 text-gray-500">
                                  Entities: {req.entities.join(', ')}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Exceptions */}
                  {rule.exceptions && rule.exceptions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Exceptions:</h5>
                      <ul className="space-y-1">
                        {rule.exceptions.map((exception, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{exception}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Source: {rule.source_document}</span>
                    <span>
                      Created: {format(new Date(rule.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rule.confidence_score)}`}>
                    <ConfidenceIcon className="h-3 w-3 mr-1" />
                    <span>{(rule.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedRule(rule)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="View details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rule Details Modal */}
      {selectedRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Rule Details
                </h3>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Title</h4>
                  <p className="text-sm text-gray-600">{selectedRule.title}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedRule.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Requirements</h4>
                  <div className="space-y-2">
                    {selectedRule.requirements.map((req, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm">
                          <strong>Action:</strong> {req.action}
                        </div>
                        {req.deadline && (
                          <div className="text-sm text-gray-600">
                            <strong>Deadline:</strong> {req.deadline}
                          </div>
                        )}
                        {req.entities.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Entities:</strong> {req.entities.join(', ')}
                          </div>
                        )}
                        {req.conditions.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Conditions:</strong> {req.conditions.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedRule.penalties && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Penalties</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedRule.penalties.late_filing && (
                        <p>Late Filing: {selectedRule.penalties.late_filing}</p>
                      )}
                      {selectedRule.penalties.material_misstatement && (
                        <p>Material Misstatement: {selectedRule.penalties.material_misstatement}</p>
                      )}
                      {selectedRule.penalties.other && (
                        <p>Other: {selectedRule.penalties.other}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Confidence Score</h4>
                    <p className={`${getConfidenceColor(selectedRule.confidence_score).split(' ')[0]}`}>
                      {(selectedRule.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Source Document</h4>
                    <p className="text-gray-600">{selectedRule.source_document}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
