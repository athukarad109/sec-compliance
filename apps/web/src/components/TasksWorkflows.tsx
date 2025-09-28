'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { format, addDays, isBefore } from 'date-fns';
import { clustersApi, gapAnalysesApi } from '@/lib/api';
import { RequirementCluster, GapAnalysis } from '@/types/api';

interface Task {
  id: string;
  title: string;
  description: string;
  obligation: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To-Do' | 'In Progress' | 'Completed';
  assignee: {
    type: 'team_member' | 'ai_agent';
    name: string;
    avatar?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  linkedObligation: {
    id: string;
    title: string;
    rule: string;
  };
}

export default function TasksWorkflows() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<{
    todo: Task[];
    inProgress: Task[];
    completed: Task[];
  }>({
    todo: [],
    inProgress: [],
    completed: []
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<RequirementCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(true);
  const [gapAnalyses, setGapAnalyses] = useState<GapAnalysis[]>([]);
  const [gapAnalysesLoading, setGapAnalysesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'clusters'>('tasks');

  const organizeTasks = useCallback(() => {
    const organized = {
      todo: tasks.filter(task => task.status === 'To-Do'),
      inProgress: tasks.filter(task => task.status === 'In Progress'),
      completed: tasks.filter(task => task.status === 'Completed')
    };
    setFilteredTasks(organized);
  }, [tasks]);

  useEffect(() => {
    loadTasks();
    loadGapAnalyses();
  }, []);

  useEffect(() => {
    organizeTasks();
  }, [organizeTasks]);

  // Load clusters only when user switches to clusters tab
  useEffect(() => {
    if (activeTab === 'clusters' && clusters.length === 0 && !clustersLoading) {
      loadClusters();
    }
  }, [activeTab, clusters.length, clustersLoading]);

  const loadTasks = async () => {
    // No static tasks - only dynamic regulatory requirements from API
    setTasks([]);
    setLoading(false);
  };

  const loadClusters = async () => {
    try {
      setClustersLoading(true);
      console.log('🔍 Loading clusters...');
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001');
      console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/regtech/requirement-clusters/all`);
      const response = await clustersApi.getAll();
      console.log('✅ Clusters response:', response);
      setClusters(response.clusters);
    } catch (error: unknown) {
      console.error('❌ Failed to load clusters:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number; headers?: unknown } };
        console.error('Error details:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);
        console.error('Error headers:', axiosError.response?.headers);
      }
    } finally {
      setClustersLoading(false);
    }
  };

  const loadGapAnalyses = async () => {
    try {
      setGapAnalysesLoading(true);
      console.log('🔍 Loading gap analyses...');
      const response = await gapAnalysesApi.getAll();
      console.log('✅ Gap analyses response:', response);
      console.log('📊 Sample analysis structure:', response.analyses[0]);
      setGapAnalyses(response.analyses);
    } catch (error: unknown) {
      console.error('❌ Failed to load gap analyses:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('Error details:', axiosError.response?.data);
      }
    } finally {
      setGapAnalysesLoading(false);
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: 'To-Do' | 'In Progress' | 'Completed') => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      )
    );
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

  const getAssigneeColor = (type: string) => {
    switch (type) {
      case 'team_member':
        return 'bg-blue-100 text-blue-800';
      case 'ai_agent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (deadline: string) => {
    return isBefore(new Date(deadline), new Date());
  };

  const isDueSoon = (deadline: string) => {
    const threeDaysFromNow = addDays(new Date(), 3);
    return isBefore(new Date(deadline), threeDaysFromNow) && !isOverdue(deadline);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
        selectedTask?.id === task.id ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={() => setSelectedTask(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {task.description}
      </p>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAssigneeColor(task.assignee.type)}`}>
            {task.assignee.avatar}
          </div>
          <span className="text-xs text-gray-600">{task.assignee.name}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {format(new Date(task.deadline), 'MMM d')}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
          )}
        </div>
        
        {isOverdue(task.deadline) && (
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
        )}
        {isDueSoon(task.deadline) && !isOverdue(task.deadline) && (
          <ClockIcon className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    </div>
  );

  const ClusterCard = ({ cluster }: { cluster: RequirementCluster }) => (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-medium text-gray-900">
            {cluster.policy}
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {cluster.requirements.length} requirements
        </span>
      </div>
      
      <div className="space-y-2">
        {cluster.requirements.slice(0, 3).map((requirement) => (
          <div key={requirement.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{requirement.title}</span>
              <span className="text-gray-500">
                {(requirement.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="line-clamp-2">{requirement.description}</p>
          </div>
        ))}
        {cluster.requirements.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{cluster.requirements.length - 3} more requirements
          </div>
        )}
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks & Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kanban-style task management for compliance obligations
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clusters'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Requirement Clusters
          </button>
        </nav>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Gap Analyses Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Gap Analyses</h2>
              <span className="text-sm text-gray-500">
                {gapAnalysesLoading ? 'Loading...' : `${gapAnalyses.length} analyses`}
              </span>
            </div>
            
            {gapAnalysesLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
                ))}
              </div>
            ) : gapAnalyses.length > 0 ? (
              <div className="space-y-6">
                {gapAnalyses.map((analysis, index) => (
                  <div key={analysis.id || index} className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Gap Analysis #{index + 1}</h4>
                          <p className="text-sm text-gray-500">Compliance Assessment</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{analysis.findings?.length || 0}</div>
                          <div className="text-xs text-gray-500">Total Findings</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (analysis.findings?.length || 0) <= 2 ? 'bg-green-100 text-green-800' :
                          (analysis.findings?.length || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(analysis.findings?.length || 0) <= 2 ? 'Low Risk' : 
                           (analysis.findings?.length || 0) <= 5 ? 'Medium Risk' : 'High Risk'}
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    {analysis.companyData && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Company Information</h5>
                        <div className="space-y-4">
                          {/* SEC Classifications */}
                          {analysis.companyData.cover && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-3">SEC Classifications</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {analysis.companyData.cover.accelerated_filer && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-xs font-medium text-blue-800">Accelerated Filer</div>
                                    <div className="text-xs text-blue-600">SEC Classification</div>
                                  </div>
                                )}
                                {analysis.companyData.cover.large_accelerated_filer && (
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <div className="text-xs font-medium text-purple-800">Large Accelerated</div>
                                    <div className="text-xs text-purple-600">SEC Classification</div>
                                  </div>
                                )}
                                {analysis.companyData.cover.emerging_growth_company && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="text-xs font-medium text-green-800">Emerging Growth</div>
                                    <div className="text-xs text-green-600">SEC Classification</div>
                                  </div>
                                )}
                                {analysis.companyData.cover.smaller_reporting_company && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="text-xs font-medium text-yellow-800">Smaller Reporting</div>
                                    <div className="text-xs text-yellow-600">SEC Classification</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Company Data */}
                          {Object.keys(analysis.companyData).length > 1 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-3">Additional Company Data</h6>
                              <div className="space-y-4">
                                {/* Metadata */}
                                {analysis.companyData.meta && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="text-sm font-medium text-blue-900 mb-3">Metadata</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Purpose</div>
                                        <div className="text-sm text-blue-900">{analysis.companyData.meta.purpose}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Generated At</div>
                                        <div className="text-sm text-blue-900">
                                          {new Date(analysis.companyData.meta.generated_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Schema Version</div>
                                        <div className="text-sm text-blue-900">{analysis.companyData.meta.schema_version}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Synthetic Data</div>
                                        <div className="text-sm text-blue-900">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            analysis.companyData.meta.synthetic ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                          }`}>
                                            {analysis.companyData.meta.synthetic ? 'Yes' : 'No'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* XBRL Financial Data */}
                                {analysis.companyData.xbrl && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-sm font-medium text-green-900 mb-3">Financial Data (XBRL)</div>
                                    
                                    {/* Financial Facts */}
                                    {analysis.companyData.xbrl.facts && (
                                      <div className="mb-4">
                                        <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Key Financial Metrics</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {Object.entries(analysis.companyData.xbrl.facts).map(([key, value]) => (
                                            <div key={key} className="bg-white border border-green-200 rounded p-3">
                                              <div className="text-xs font-medium text-green-700 uppercase tracking-wide">
                                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                              </div>
                                              <div className="text-sm font-semibold text-green-900">
                                                {typeof value === 'number' ? 
                                                  new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                  }).format(value) : 
                                                  String(value)
                                                }
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Units */}
                                    {analysis.companyData.xbrl.units && Object.keys(analysis.companyData.xbrl.units).length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Units</div>
                                        <div className="bg-white border border-green-200 rounded p-3">
                                          <pre className="text-xs text-green-800 whitespace-pre-wrap">
                                            {JSON.stringify(analysis.companyData.xbrl.units, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {/* Contexts */}
                                    {analysis.companyData.xbrl.contexts && analysis.companyData.xbrl.contexts.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Contexts</div>
                                        <div className="space-y-2">
                                          {analysis.companyData.xbrl.contexts.map((context: any, index: number) => (
                                            <div key={index} className="bg-white border border-green-200 rounded p-2">
                                              <div className="text-xs text-green-800">
                                                <strong>ID:</strong> {context.id} | 
                                                <strong> Start:</strong> {context.start} | 
                                                <strong> End:</strong> {context.end}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Findings */}
                    {analysis.findings && analysis.findings.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Key Findings</h5>
                        <div className="space-y-3">
                          {analysis.findings.map((finding: unknown, findingIndex: number) => (
                            <div key={findingIndex} className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h6 className="text-sm font-medium text-gray-900 mb-1">
                                    {(finding as any).title || `Finding ${findingIndex + 1}`}
                                  </h6>
                                  <p className="text-sm text-gray-600">
                                    {(finding as any).description || (finding as any).content || 'No description available'}
                                  </p>
                                </div>
                                {(finding as any).severity && (
                                  <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                                    (finding as any).severity === 'High' ? 'bg-red-100 text-red-800' :
                                    (finding as any).severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {(finding as any).severity}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required Actions */}
                    {analysis.tasks && analysis.tasks.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Required Actions</h5>
                        <div className="space-y-3">
                          {analysis.tasks.map((task: unknown, taskIndex: number) => (
                            <div key={taskIndex} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h6 className="text-sm font-medium text-gray-900 mb-1">
                                    {(task as any).title || (task as any).name || `Action ${taskIndex + 1}`}
                                  </h6>
                                  <p className="text-sm text-gray-600">
                                    {(task as any).description || (task as any).content || 'No description available'}
                                  </p>
                                </div>
                                {(task as any).priority && (
                                  <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                                    (task as any).priority === 'High' ? 'bg-red-100 text-red-800' :
                                    (task as any).priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {(task as any).priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements Data */}
                    {analysis.requirementsData && Object.keys(analysis.requirementsData).length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Regulatory Requirements</h5>
                        <div className="space-y-4">
                          {Array.isArray(analysis.requirementsData) ? (
                            analysis.requirementsData.map((req: any, reqIndex: number) => (
                              <div key={reqIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h6 className="text-sm font-semibold text-gray-900">
                                      Requirement {reqIndex + 1}
                                    </h6>
                                    {req.id && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {req.id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Actor */}
                                  {req.actor && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Responsible Party</div>
                                      <div className="text-sm text-gray-900">{req.actor}</div>
                                    </div>
                                  )}
                                  
                                  {/* Policy */}
                                  {req.policy && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Policy/Act</div>
                                      <div className="text-sm text-gray-900">{req.policy}</div>
                                    </div>
                                  )}
                                  
                                  {/* Trigger */}
                                  {req.trigger && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Trigger Event</div>
                                      <div className="text-sm text-gray-900">{req.trigger}</div>
                                    </div>
                                  )}
                                  
                                  {/* Deadline */}
                                  {req.deadline && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Deadline</div>
                                      <div className="text-sm text-gray-900 font-medium">{req.deadline}</div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Requirement Description */}
                                {req.requirement && (
                                  <div className="mt-4 space-y-1">
                                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Required Action</div>
                                    <div className="text-sm text-gray-900 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                      {req.requirement}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Penalty */}
                                {req.penalty && (
                                  <div className="mt-4 space-y-1">
                                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Penalties for Non-Compliance</div>
                                    <div className="text-sm text-red-700 bg-red-50 p-3 rounded border-l-4 border-red-500">
                                      {req.penalty}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <div className="text-sm text-gray-700">
                                <pre className="whitespace-pre-wrap text-xs max-h-96 overflow-y-auto">
                                  {JSON.stringify(analysis.requirementsData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Analysis Results Summary */}
                    {analysis.analysisResults && Object.keys(analysis.analysisResults).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Analysis Summary</h5>
                        <div className="bg-gray-50 border rounded-lg p-4">
                          <div className="text-sm text-gray-700">
                            {typeof analysis.analysisResults === 'object' && !Array.isArray(analysis.analysisResults) ? (
                              <div className="space-y-4">
                                {Object.entries(analysis.analysisResults).map(([key, value]) => (
                                  <div key={key} className="border-b border-gray-200 pb-3 last:border-b-0">
                                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                    <div className="text-sm text-gray-900">
                                      {typeof value === 'object' ? (
                                        <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border">
                                          {JSON.stringify(value, null, 2)}
                                        </pre>
                                      ) : (
                                        String(value)
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <pre className="whitespace-pre-wrap text-xs max-h-96 overflow-y-auto">
                                {JSON.stringify(analysis.analysisResults, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Gap Analyses Available</h3>
                <p className="text-sm">No gap analysis data has been generated yet.</p>
              </div>
            )}
          </div>

          {/* Tasks Kanban Board */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Task Management</h2>
            
            
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* To-Do Column */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">To-Do</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {filteredTasks.todo.length}
            </span>
          </div>
          <div className="space-y-3">
            {/* Regular Tasks */}
            {filteredTasks.todo.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {/* Regulatory Requirements */}
            {gapAnalyses.length > 0 && gapAnalyses[0].requirementsData && Array.isArray(gapAnalyses[0].requirementsData) && (
              <>
                {gapAnalyses[0].requirementsData.slice(0, 3).map((req: any, index: number) => (
                  <div key={`req-${index}`} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          Regulatory Requirement {index + 1}
                        </h4>
                      </div>
                      {req.id && (
                        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                          {req.id}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Actor */}
                      {req.actor && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Responsible Party</div>
                          <div className="text-sm text-gray-900">{req.actor}</div>
                        </div>
                      )}
                      
                      {/* Requirement Description */}
                      {req.requirement && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Required Action</div>
                          <div className="text-sm text-gray-900 bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                            {req.requirement}
                          </div>
                        </div>
                      )}
                      
                      {/* Deadline */}
                      {req.deadline && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Deadline:</span>
                          <span className="text-xs font-semibold text-blue-600">{req.deadline}</span>
                        </div>
                      )}
                      
                      {/* Policy */}
                      {req.policy && (
                        <div className="text-xs text-gray-500">
                          <strong>Policy:</strong> {req.policy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {filteredTasks.todo.length === 0 && (!gapAnalyses.length || !gapAnalyses[0].requirementsData) && (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No tasks in To-Do</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">In Progress</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {filteredTasks.inProgress.length}
            </span>
          </div>
          <div className="space-y-3">
            {/* Regular Tasks */}
            {filteredTasks.inProgress.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {/* Regulatory Requirements in Progress */}
            {gapAnalyses.length > 0 && gapAnalyses[0].requirementsData && Array.isArray(gapAnalyses[0].requirementsData) && (
              <>
                {gapAnalyses[0].requirementsData.slice(3, 5).map((req: any, index: number) => (
                  <div key={`req-progress-${index}`} className="bg-white border border-yellow-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          Regulatory Requirement {index + 4}
                        </h4>
                      </div>
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        In Progress
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Actor */}
                      {req.actor && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Responsible Party</div>
                          <div className="text-sm text-gray-900">{req.actor}</div>
                        </div>
                      )}
                      
                      {/* Requirement Description */}
                      {req.requirement && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Required Action</div>
                          <div className="text-sm text-gray-900 bg-yellow-50 p-2 rounded border-l-4 border-yellow-500">
                            {req.requirement}
                          </div>
                        </div>
                      )}
                      
                      {/* Deadline */}
                      {req.deadline && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Deadline:</span>
                          <span className="text-xs font-semibold text-yellow-600">{req.deadline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {filteredTasks.inProgress.length === 0 && (!gapAnalyses.length || !gapAnalyses[0].requirementsData) && (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No tasks in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Completed</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {filteredTasks.completed.length}
            </span>
          </div>
          <div className="space-y-3">
            {/* Regular Tasks */}
            {filteredTasks.completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {/* Completed Regulatory Requirements */}
            {gapAnalyses.length > 0 && gapAnalyses[0].requirementsData && Array.isArray(gapAnalyses[0].requirementsData) && (
              <>
                {gapAnalyses[0].requirementsData.slice(5, 7).map((req: any, index: number) => (
                  <div key={`req-completed-${index}`} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          Regulatory Requirement {index + 6}
                        </h4>
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Completed
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Actor */}
                      {req.actor && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Responsible Party</div>
                          <div className="text-sm text-gray-900">{req.actor}</div>
                        </div>
                      )}
                      
                      {/* Requirement Description */}
                      {req.requirement && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Required Action</div>
                          <div className="text-sm text-gray-900 bg-green-50 p-2 rounded border-l-4 border-green-500">
                            {req.requirement}
                          </div>
                        </div>
                      )}
                      
                      {/* Completion Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Status:</span>
                        <span className="text-xs font-semibold text-green-600">✓ Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {filteredTasks.completed.length === 0 && (!gapAnalyses.length || !gapAnalyses[0].requirementsData) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No completed tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Title</h4>
                <p className="text-sm text-gray-600">{selectedTask.title}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                  <select
                    value={selectedTask.status}
                        onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as 'To-Do' | 'In Progress' | 'Completed')}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="To-Do">To-Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assignee</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getAssigneeColor(selectedTask.assignee.type)}`}>
                    {selectedTask.assignee.avatar}
                  </div>
                  <span className="text-sm text-gray-600">{selectedTask.assignee.name}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Linked Obligation</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-900">{selectedTask.linkedObligation.title}</p>
                  <p className="text-xs text-gray-600">{selectedTask.linkedObligation.rule}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTask.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Clusters Tab */}
      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Requirement Clusters</h2>
              <p className="text-sm text-gray-500">
                {clustersLoading ? 'Loading clusters...' : `${clusters.length} clusters found`}
              </p>
            </div>
            {clusters.length === 0 && !clustersLoading && (
              <button 
                onClick={() => loadClusters()}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
              >
                Load Clusters
              </button>
            )}
          </div>

          {clustersLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clusters.map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          )}

          {!clustersLoading && clusters.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clusters found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No requirement clusters are available at the moment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}