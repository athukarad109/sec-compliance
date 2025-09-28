'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { documentApi } from '@/lib/api';
import { StoredLLMOrganizedGroup, ProcessedRequirement } from '@/types/api';

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  act: string;
  rule: string;
  framework: string;
  category: 'Regulatory' | 'Operational' | 'Financial' | 'Cybersecurity';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Superseded' | 'Pending';
  effectiveDate: string;
  lastUpdated: string;
  legalSources: {
    congressGov: string;
    regulationsGov: string;
    secGov: string;
  };
  harmonizedData: {
    linkedObligations: string[];
    impactAssessment: string;
    groupRequirements?: Array<{
      id: string;
      policy: string;
      actor: string;
      requirement: string;
      trigger: string;
      deadline: string;
      penalty: string;
      mapped_controls: Array<{
        status: string;
        category: string;
        control_id: string;
      }>;
    }>;
  };
}

export default function ComplianceRequirements() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<ComplianceRequirement[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    act: '',
    rule: '',
    framework: '',
    category: '',
    priority: '',
    status: ''
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [storedGroups, setStoredGroups] = useState<StoredLLMOrganizedGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequirements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requirements, searchTerm, filters]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      console.log('Loading requirements from API...');
      
      // Load stored LLM organized requirements from database
      const response = await documentApi.getStoredLLMOrganized();
      console.log('API Response:', response);
      
      if (response.organized_requirements && response.organized_requirements.length > 0) {
        setStoredGroups(response.organized_requirements);
        
        // Convert stored groups to compliance requirements format
        const convertedRequirements: ComplianceRequirement[] = [];
        
        response.organized_requirements.forEach((group) => {
          // Create a main card for the group
          convertedRequirements.push({
            id: group.id,
            title: group.category,
            description: group.groupDescription,
            act: group.category,
            rule: `${group.requirements.length} requirements`,
            framework: group.category,
            category: group.category as 'Regulatory' | 'Operational' | 'Financial' | 'Cybersecurity',
            priority: 'High',
            status: 'Active',
            effectiveDate: group.createdAt,
            lastUpdated: group.createdAt,
            legalSources: {
              congressGov: '#',
              regulationsGov: '#',
              secGov: '#'
            },
            harmonizedData: {
              linkedObligations: [],
              impactAssessment: `Confidence: ${(group.confidenceScore * 100).toFixed(1)}%`,
              // Store the actual requirements for expansion
              groupRequirements: group.requirements.map(req => ({
                id: req.id,
                policy: req.policy,
                actor: req.actor,
                requirement: req.requirement.replace(/[\u2610\u2611\u2612\u25a0\u25a1\u25a2\u25a3\u25a4\u25a5\u25a6\u25a7\u25a8\u25a9\u25aa\u25ab\u25ac\u25ad\u25ae\u25af\u25b0\u25b1\u25b2\u25b3\u25b4\u25b5\u25b6\u25b7\u25b8\u25b9\u25ba\u25bb\u25bc\u25bd\u25be\u25bf\u25c0\u25c1\u25c2\u25c3\u25c4\u25c5\u25c6\u25c7\u25c8\u25c9\u25ca\u25cb\u25cc\u25cd\u25ce\u25cf\u25d0\u25d1\u25d2\u25d3\u25d4\u25d5\u25d6\u25d7\u25d8\u25d9\u25da\u25db\u25dc\u25dd\u25de\u25df\u25e0\u25e1\u25e2\u25e3\u25e4\u25e5\u25e6\u25e7\u25e8\u25e9\u25ea\u25eb\u25ec\u25ed\u25ee\u25ef\u25f0\u25f1\u25f2\u25f3\u25f4\u25f5\u25f6\u25f7\u25f8\u25f9\u25fa\u25fb\u25fc\u25fd\u25fe\u25ff]/g, '').replace(/\s+/g, ' ').trim(),
                trigger: req.trigger,
                deadline: req.deadline,
                penalty: req.penalty,
                mapped_controls: req.mapped_controls
              }))
            }
          });
        });
        
        console.log('Converted requirements:', convertedRequirements.length);
        setRequirements(convertedRequirements);
      } else {
        console.log('No organized requirements found');
        setRequirements([]);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast.error('Failed to load compliance requirements');
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = requirements;
    console.log('Applying filters to requirements:', requirements.length);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(requirement =>
        requirement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.act.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.rule.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filters
    if (filters.act) {
      filtered = filtered.filter(requirement => requirement.act === filters.act);
    }
    if (filters.rule) {
      filtered = filtered.filter(requirement => requirement.rule === filters.rule);
    }
    if (filters.framework) {
      filtered = filtered.filter(requirement => requirement.framework === filters.framework);
    }
    if (filters.category) {
      filtered = filtered.filter(requirement => requirement.category === filters.category);
    }
    if (filters.priority) {
      filtered = filtered.filter(requirement => requirement.priority === filters.priority);
    }
    if (filters.status) {
      filtered = filtered.filter(requirement => requirement.status === filters.status);
    }

    console.log('Filtered requirements:', filtered.length);
    setFilteredRequirements(filtered);
  };

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploading(true);
    setProcessing(true);
    
    try {
      // Use the unified processing endpoint
      const response = await documentApi.processComplete(file);
      
      if (response.success) {
        toast.success(`Document "${response.filename}" processed successfully! Extracted ${response.pipeline_results.requirements_extracted} requirements.`);
        
        // Refresh the requirements list to show new data
        await loadRequirements();
      } else {
        throw new Error(response.message || 'Processing failed');
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process document and extract requirements');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading || processing
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRequirements();
      toast.success('Requirements refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh requirements');
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Superseded':
        return 'bg-gray-100 text-gray-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Regulatory':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'Operational':
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      case 'Financial':
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      case 'Cybersecurity':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Requirements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and explore harmonized compliance requirements with detailed legal sources
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* File Upload Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Legal Document</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a legal document to extract compliance requirements using AI-powered analysis
          </p>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading || processing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading || processing} />
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {uploading || processing ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {uploading ? 'Uploading document...' : 'Processing document with AI...'}
                </p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-sm text-indigo-600 font-medium">Drop the file here</p>
                <p className="text-xs text-gray-500 mt-1">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, or TXT files up to 10MB
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Supported formats: PDF, DOC, DOCX, TXT</p>
            <p>AI will extract compliance requirements and add them to your requirements list</p>
          </div>
        </div>
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
                    placeholder="Search obligations..."
                  />
                </div>
              </div>

              {/* Act Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Act
                </label>
                <select
                  value={filters.act}
                  onChange={(e) => setFilters({ ...filters, act: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Acts</option>
                  <option value="Securities Exchange Act">Securities Exchange Act</option>
                  <option value="Securities Act">Securities Act</option>
                  <option value="Investment Advisers Act">Investment Advisers Act</option>
                  <option value="Sarbanes-Oxley Act">Sarbanes-Oxley Act</option>
                </select>
              </div>

              {/* Rule Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule
                </label>
                <select
                  value={filters.rule}
                  onChange={(e) => setFilters({ ...filters, rule: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Rules</option>
                  <option value="Rule 16a-3">Rule 16a-3</option>
                  <option value="Item 1.05 of Form 8-K">Item 1.05 of Form 8-K</option>
                  <option value="Rule 204(b)-1">Rule 204(b)-1</option>
                </select>
              </div>

              {/* Framework Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Framework
                </label>
                <select
                  value={filters.framework}
                  onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Frameworks</option>
                  <option value="SEC Regulations">SEC Regulations</option>
                  <option value="SEC Cybersecurity Framework">SEC Cybersecurity Framework</option>
                  <option value="SEC Investment Management">SEC Investment Management</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  <option value="Regulatory">Regulatory</option>
                  <option value="Operational">Operational</option>
                  <option value="Financial">Financial</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
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
                  <option value="Active">Active</option>
                  <option value="Superseded">Superseded</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    act: '',
                    rule: '',
                    framework: '',
                    category: '',
                    priority: '',
                    status: ''
                  });
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> Total requirements: {requirements.length}, Filtered: {filteredRequirements.length}
            </p>
          </div>
          
          <div className="space-y-4">
            {filteredRequirements.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Requirements Found</h3>
                <p className="text-gray-500 mb-4">
                  {requirements.length === 0 
                    ? "No compliance requirements have been processed yet. Upload a document to get started."
                    : "No requirements match your current filters. Try adjusting your search criteria."
                  }
                </p>
                {requirements.length === 0 && (
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Page
                  </button>
                )}
              </div>
            ) : (
              filteredRequirements.map((requirement) => (
              <div key={requirement.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getCategoryIcon(requirement.category)}
                        <h3 className="text-lg font-medium text-gray-900">
                          {requirement.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(requirement.priority)}`}>
                          {requirement.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                          {requirement.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {requirement.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span><strong>Act:</strong> {requirement.act}</span>
                        <span><strong>Rule:</strong> {requirement.rule}</span>
                        <span><strong>Framework:</strong> {requirement.framework}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleCardExpansion(requirement.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                    >
                      {expandedCards.has(requirement.id) ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedCards.has(requirement.id) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {requirement.harmonizedData.groupRequirements && requirement.harmonizedData.groupRequirements.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-4">
                            Requirements ({requirement.harmonizedData.groupRequirements.length})
                          </h4>
                          <div className="space-y-4">
                            {requirement.harmonizedData.groupRequirements.map((req, index) => (
                              <div key={req.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                                      {req.policy}
                                    </h5>
                                    <p className="text-xs text-gray-600 mb-2">
                                      <strong>Actor:</strong> {req.actor} | 
                                      <strong> Trigger:</strong> {req.trigger} | 
                                      <strong> Deadline:</strong> {req.deadline}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                    {req.penalty}
                                  </span>
                                </div>
                                
                                <div className="mb-3">
                                  <h6 className="text-xs font-medium text-gray-700 mb-1">Requirement:</h6>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {req.requirement}
                                  </p>
                                </div>
                                
                                {req.mapped_controls && req.mapped_controls.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-700 mb-2">Mapped Controls:</h6>
                                    <div className="flex flex-wrap gap-1">
                                      {req.mapped_controls.map((control, controlIndex) => (
                                        <span key={controlIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                          {control.control_id}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No detailed requirements available</p>
                        </div>
                      )}
                      
                      {/* Confidence Score */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Confidence Score:</span>
                          <span className="text-sm text-gray-600">{requirement.harmonizedData.impactAssessment}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
