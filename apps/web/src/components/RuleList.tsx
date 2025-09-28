'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ruleApi } from '@/lib/api';
import { ComplianceRule, RuleType } from '@/types/api';

export default function RuleList() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RuleType | ''>('');
  const [minConfidence, setMinConfidence] = useState<number | ''>('');
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      // First check if we have extracted rules from localStorage
      const extractedRules = localStorage.getItem('extractedRules');
      if (extractedRules) {
        const rulesData = JSON.parse(extractedRules);
        setRules(rulesData);
        setLoading(false);
        return;
      }

      // Otherwise load from API
      const rulesData = await ruleApi.search();
      setRules(rulesData);
    } catch (error: any) {
      toast.error(`Failed to load rules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const rulesData = await ruleApi.search({
        query: searchQuery || undefined,
        rule_type: filterType || undefined,
        min_confidence: minConfidence || undefined,
      });
      setRules(rulesData);
    } catch (error: any) {
      toast.error(`Search failed: ${error.message}`);
    }
  };

  const getRuleTypeColor = (type: RuleType) => {
    switch (type) {
      case 'obligation':
        return 'bg-blue-100 text-blue-800';
      case 'prohibition':
        return 'bg-red-100 text-red-800';
      case 'reporting_obligation':
        return 'bg-green-100 text-green-800';
      case 'disclosure_requirement':
        return 'bg-yellow-100 text-yellow-800';
      case 'condition':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircleIcon;
    if (confidence >= 0.6) return ExclamationTriangleIcon;
    return ExclamationTriangleIcon;
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
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Search & Filter Rules
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Query
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rules..."
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as RuleType | '')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="obligation">Obligation</option>
                <option value="prohibition">Prohibition</option>
                <option value="reporting_obligation">Reporting Obligation</option>
                <option value="disclosure_requirement">Disclosure Requirement</option>
                <option value="condition">Condition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Confidence
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="0.0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Extracted Rules ({rules.length})
          </h3>
          
          {rules.length === 0 ? (
            <div className="text-center py-6">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rules found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Extract rules from documents to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const ConfidenceIcon = getConfidenceIcon(rule.confidence_score);
                return (
                  <div
                    key={rule.rule_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {rule.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRuleTypeColor(rule.rule_type)}`}>
                            {rule.rule_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {rule.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Source: {rule.source_document}</span>
                          <span>
                            {format(new Date(rule.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <div className={`flex items-center ${getConfidenceColor(rule.confidence_score)}`}>
                          <ConfidenceIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {(rule.confidence_score * 100).toFixed(1)}%
                          </span>
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
          )}
        </div>
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
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Title</h4>
                  <p className="text-sm text-gray-600">{selectedRule.title}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600">{selectedRule.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedRule.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{req.action}</span>
                        {req.deadline && <span className="ml-2 text-gray-500">({req.deadline})</span>}
                      </li>
                    ))}
                  </ul>
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
                    <p className={`${getConfidenceColor(selectedRule.confidence_score)}`}>
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
