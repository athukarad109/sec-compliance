'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  FireIcon,
  ShieldCheckIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { format, addDays } from 'date-fns';

interface RiskHeatmapData {
  category: string;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  trend: 'up' | 'down' | 'stable';
}

interface ComplianceScore {
  overall: number;
  trend: number;
  breakdown: {
    regulatory: number;
    operational: number;
    financial: number;
  };
}

interface Deadline {
  id: string;
  title: string;
  type: 'Form PF' | 'Form 4' | '10-K' | '8-K' | 'Other';
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'completed';
  priority: 'High' | 'Medium' | 'Low';
  entity: string;
}

interface Alert {
  id: string;
  type: 'insider_anomaly' | 'missing_filing' | 'compliance_breach' | 'system_alert';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export default function OverviewDashboard() {
  const [riskHeatmap, setRiskHeatmap] = useState<RiskHeatmapData[]>([]);
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Mock data - in a real app, this would come from APIs
    const mockRiskHeatmap: RiskHeatmapData[] = [
      { category: 'Insider Trading', level: 'Medium', score: 65, trend: 'down' },
      { category: 'Cybersecurity', level: 'High', score: 85, trend: 'up' },
      { category: 'Financial Reporting', level: 'Low', score: 25, trend: 'stable' },
      { category: 'Regulatory Compliance', level: 'Medium', score: 70, trend: 'up' },
      { category: 'Data Privacy', level: 'High', score: 80, trend: 'down' },
      { category: 'Operational Risk', level: 'Low', score: 30, trend: 'stable' }
    ];

    const mockComplianceScore: ComplianceScore = {
      overall: 87.3,
      trend: 3.2,
      breakdown: {
        regulatory: 92.1,
        operational: 85.7,
        financial: 84.2
      }
    };

    const mockDeadlines: Deadline[] = [
      {
        id: '1',
        title: 'Form PF Annual Report',
        type: 'Form PF',
        dueDate: addDays(new Date(), 15).toISOString(),
        status: 'upcoming',
        priority: 'High',
        entity: 'Investment Advisor LLC'
      },
      {
        id: '2',
        title: 'Form 4 - Executive Transactions',
        type: 'Form 4',
        dueDate: addDays(new Date(), 3).toISOString(),
        status: 'upcoming',
        priority: 'High',
        entity: 'CEO Holdings'
      },
      {
        id: '3',
        title: '10-K Annual Report',
        type: '10-K',
        dueDate: addDays(new Date(), 45).toISOString(),
        status: 'upcoming',
        priority: 'Medium',
        entity: 'Public Company Inc'
      },
      {
        id: '4',
        title: '8-K Current Report',
        type: '8-K',
        dueDate: addDays(new Date(), -2).toISOString(),
        status: 'overdue',
        priority: 'High',
        entity: 'Tech Corp'
      }
    ];

    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'insider_anomaly',
        severity: 'High',
        title: 'Unusual Trading Pattern Detected',
        description: 'Multiple transactions by executive within 30-day window',
        timestamp: new Date().toISOString(),
        status: 'new'
      },
      {
        id: '2',
        type: 'missing_filing',
        severity: 'Critical',
        title: 'Form 4 Filing Overdue',
        description: 'Executive transaction not reported within required timeframe',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'acknowledged'
      },
      {
        id: '3',
        type: 'compliance_breach',
        severity: 'Medium',
        title: 'Policy Violation Detected',
        description: 'Employee accessed restricted data outside business hours',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'new'
      }
    ];

    setRiskHeatmap(mockRiskHeatmap);
    setComplianceScore(mockComplianceScore);
    setUpcomingDeadlines(mockDeadlines);
    setAlerts(mockAlerts);
    setLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIntensity = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-green-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'High':
        return 'bg-orange-500';
      case 'Critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDeadlineStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <h1 className="text-2xl font-bold text-gray-900">Compliance Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Risk assessment, compliance monitoring, and critical deadlines
        </p>
      </div>

      {/* Top Section: Risk Heatmap + Compliance Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Risk Heatmap */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Heatmap</h3>
            <div className="grid grid-cols-2 gap-4">
              {riskHeatmap.map((risk, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{risk.category}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(risk.level)}`}>
                      {risk.level}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getRiskIntensity(risk.level)}`}
                        style={{ width: `${risk.score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{risk.score}%</span>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    {risk.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                    ) : risk.trend === 'down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                    )}
                    <span className="text-xs text-gray-500 ml-1 capitalize">{risk.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Score</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {complianceScore?.overall}%
              </div>
              <div className="flex items-center justify-center text-sm text-green-600 mb-4">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +{complianceScore?.trend}% from last month
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Regulatory</span>
                    <span>{complianceScore?.breakdown.regulatory}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${complianceScore?.breakdown.regulatory}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Operational</span>
                    <span>{complianceScore?.breakdown.operational}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${complianceScore?.breakdown.operational}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Financial</span>
                    <span>{complianceScore?.breakdown.financial}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${complianceScore?.breakdown.financial}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Upcoming Deadlines */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{deadline.title}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeadlineStatusColor(deadline.status)}`}>
                    {deadline.status}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  {deadline.type} • {deadline.entity}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Due: {format(new Date(deadline.dueDate), 'MMM d, yyyy')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    deadline.priority === 'High' ? 'bg-red-100 text-red-800' :
                    deadline.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Alerts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Alerts</h3>
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">{alerts.length} active alerts</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAlertSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(alert.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {alert.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600">
                      {alert.description}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}