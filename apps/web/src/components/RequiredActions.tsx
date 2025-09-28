'use client';

import { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface RequiredAction {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  category: 'Filing' | 'Compliance' | 'Review' | 'Meeting' | 'Other';
  assignedTo: string;
  createdAt: string;
  completedAt?: string;
}

export default function RequiredActions() {
  const [actions, setActions] = useState<RequiredAction[]>([
    {
      id: '1',
      title: 'Q4 2024 10-K Annual Report Filing',
      description: 'Prepare and file annual report with SEC including financial statements and MD&A',
      dueDate: '2024-03-31',
      priority: 'Critical',
      status: 'In Progress',
      category: 'Filing',
      assignedTo: 'John Smith',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      title: 'Annual Compliance Review',
      description: 'Conduct comprehensive compliance review and update policies',
      dueDate: '2024-02-15',
      priority: 'High',
      status: 'Not Started',
      category: 'Compliance',
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      title: 'Risk Assessment Update',
      description: 'Update enterprise risk assessment and mitigation strategies',
      dueDate: '2024-01-30',
      priority: 'High',
      status: 'Overdue',
      category: 'Review',
      assignedTo: 'Mike Wilson',
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      title: 'Board Meeting Preparation',
      description: 'Prepare materials and agenda for quarterly board meeting',
      dueDate: '2024-02-01',
      priority: 'Medium',
      status: 'Not Started',
      category: 'Meeting',
      assignedTo: 'Lisa Brown',
      createdAt: '2024-01-01'
    },
    {
      id: '5',
      title: 'Internal Audit Review',
      description: 'Review and approve internal audit findings and recommendations',
      dueDate: '2024-01-25',
      priority: 'Medium',
      status: 'Completed',
      category: 'Review',
      assignedTo: 'David Lee',
      createdAt: '2024-01-01',
      completedAt: '2024-01-20'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAction, setEditingAction] = useState<RequiredAction | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-100';
      case 'In Progress':
        return 'text-blue-600 bg-blue-100';
      case 'Overdue':
        return 'text-red-600 bg-red-100';
      case 'Not Started':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return CheckCircleIcon;
      case 'In Progress':
        return ClockIcon;
      case 'Overdue':
        return ExclamationTriangleIcon;
      case 'Not Started':
        return FlagIcon;
      default:
        return FlagIcon;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Filing':
        return '📄';
      case 'Compliance':
        return '⚖️';
      case 'Review':
        return '🔍';
      case 'Meeting':
        return '👥';
      case 'Other':
        return '📋';
      default:
        return '📋';
    }
  };

  const isOverdue = (dueDate: string) => {
    return isBefore(new Date(dueDate), new Date());
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusChange = (actionId: string, newStatus: string) => {
    setActions(actions.map(action => 
      action.id === actionId 
        ? { 
            ...action, 
            status: newStatus,
            completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined
          }
        : action
    ));
    toast.success('Action status updated');
  };

  const handleDelete = (actionId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    setActions(actions.filter(action => action.id !== actionId));
    toast.success('Action deleted successfully');
  };

  const overdueActions = actions.filter(action => isOverdue(action.dueDate) && action.status !== 'Completed');
  const upcomingActions = actions.filter(action => {
    const daysUntilDue = getDaysUntilDue(action.dueDate);
    return daysUntilDue <= 7 && daysUntilDue > 0 && action.status !== 'Completed';
  });

  return (
    <div className="space-y-6">
      {/* Action Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
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
                    Overdue Actions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {overdueActions.length}
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
                    Due This Week
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {upcomingActions.length}
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
                <div className="p-3 rounded-md bg-blue-100">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {actions.filter(a => a.status === 'In Progress').length}
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
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {actions.filter(a => a.status === 'Completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Required Actions</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Action
            </button>
          </div>
          
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {actions.map((action) => {
                const StatusIcon = getStatusIcon(action.status);
                const daysUntilDue = getDaysUntilDue(action.dueDate);
                const isActionOverdue = isOverdue(action.dueDate);
                
                return (
                  <li key={action.id} className="px-4 py-4 sm:px-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={`h-5 w-5 ${getStatusColor(action.status).split(' ')[0]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getCategoryIcon(action.category)}</span>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {action.title}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(action.status)}`}>
                              {action.priority}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span>
                                Due: {format(new Date(action.dueDate), 'MMM d, yyyy')}
                                {isActionOverdue && action.status !== 'Completed' && (
                                  <span className="text-red-600 ml-1">(Overdue)</span>
                                )}
                                {!isActionOverdue && daysUntilDue <= 7 && action.status !== 'Completed' && (
                                  <span className="text-yellow-600 ml-1">({daysUntilDue} days)</span>
                                )}
                              </span>
                            </div>
                            <span>Assigned to: {action.assignedTo}</span>
                            <span>Category: {action.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={action.status}
                          onChange={(e) => handleStatusChange(action.id, e.target.value)}
                          className={`text-xs rounded-md border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(action.status)}`}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                        
                        <button
                          onClick={() => setEditingAction(action)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit action"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(action.id, action.title)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete action"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
