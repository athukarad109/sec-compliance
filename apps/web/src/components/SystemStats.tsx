'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  BoltIcon 
} from '@heroicons/react/24/outline';
import { systemApi } from '@/lib/api';
import { ParserStats, PerformanceInfo } from '@/types/api';

export default function SystemStats() {
  const [stats, setStats] = useState<ParserStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const [statsData, performanceData] = await Promise.all([
        systemApi.getStats().catch(() => ({
          total_documents: 0,
          processed_documents: 0,
          total_rules: 0,
          rule_types: {},
          average_confidence: 0
        })),
        systemApi.getPerformanceInfo().catch(() => ({
          device: 'unknown',
          model_loaded: false,
          batch_size: 16,
          max_length: 512,
          cuda_available: false,
          gpu_count: 0,
          gpu_name: 'Unknown'
        }))
      ]);
      setStats(statsData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Failed to load system info:', error);
      // Set fallback data
      setStats({
        total_documents: 0,
        processed_documents: 0,
        total_rules: 0,
        rule_types: {},
        average_confidence: 0
      });
      setPerformance({
        device: 'unknown',
        model_loaded: false,
        batch_size: 16,
        max_length: 512,
        cuda_available: false,
        gpu_count: 0,
        gpu_name: 'Unknown'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
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
    );
  }

  const statsCards = [
    {
      name: 'Total Documents',
      value: stats?.total_documents || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Processed Documents',
      value: stats?.processed_documents || 0,
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Rules',
      value: stats?.total_rules || 0,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Avg Confidence',
      value: stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : '0%',
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* System Stats */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${card.bgColor}`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Info */}
      {performance && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CpuChipIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Processing Device</p>
                  <p className="text-sm text-gray-900 capitalize">
                    {performance.device} {performance.gpu_name && `(${performance.gpu_name})`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">GPU Acceleration</p>
                  <p className="text-sm text-gray-900">
                    {performance.cuda_available ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${performance.model_loaded ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Model Status</p>
                  <p className="text-sm text-gray-900">
                    {performance.model_loaded ? 'Loaded' : 'Not Loaded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Types Distribution */}
      {stats?.rule_types && Object.keys(stats.rule_types).length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Types Distribution</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(stats.rule_types).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
