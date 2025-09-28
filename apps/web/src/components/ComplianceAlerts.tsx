'use client';

import { useState, useEffect } from 'react';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ComplianceAlert {
  id: string;
  type: 'deadline' | 'violation' | 'risk' | 'update';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  ruleId: string;
  createdAt: string;
  acknowledged: boolean;
}

export default function ComplianceAlerts() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    // Mock alerts data - in a real app, this would come from the API
    const mockAlerts: ComplianceAlert[] = [
      {
        id: '1',
        type: 'deadline',
        severity: 'warning',
        message: 'Quarterly report deadline approaching in 5 days',
        ruleId: 'RULE-001',
        createdAt: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: '2',
        type: 'risk',
        severity: 'error',
        message: 'High-risk compliance rule requires immediate attention',
        ruleId: 'RULE-002',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        acknowledged: false,
      },
      {
        id: '3',
        type: 'update',
        severity: 'info',
        message: 'New compliance rules extracted from uploaded document',
        ruleId: 'RULE-003',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        acknowledged: true,
      },
    ];
    
    setAlerts(mockAlerts);
    setLoading(false);
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
    toast.success('Alert acknowledged');
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    toast.success('Alert dismissed');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return ExclamationTriangleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return '⏰';
      case 'violation':
        return '⚠️';
      case 'risk':
        return '🚨';
      case 'update':
        return '📢';
      default:
        return 'ℹ️';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

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
      {/* Active Alerts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Active Alerts ({unacknowledgedAlerts.length})
            </h3>
            {unacknowledgedAlerts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unacknowledgedAlerts.length} unread
              </span>
            )}
          </div>
          
          {unacknowledgedAlerts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500">
                No active compliance alerts at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unacknowledgedAlerts.map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <SeverityIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getTypeIcon(alert.type)}</span>
                            <span className="text-sm font-medium capitalize">
                              {alert.type} Alert
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
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

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acknowledged Alerts ({acknowledgedAlerts.length})
            </h3>
            
            <div className="space-y-3">
              {acknowledgedAlerts.map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(alert.type)}</span>
                          <span className="text-sm font-medium capitalize">
                            {alert.type} Alert
                          </span>
                          <span className="text-xs text-gray-500">(Acknowledged)</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
