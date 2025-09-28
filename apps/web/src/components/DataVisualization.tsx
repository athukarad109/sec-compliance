'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DataVisualization() {
  const [activeChart, setActiveChart] = useState<'compliance' | 'filings' | 'risk'>('compliance');

  // Compliance Trends Data
  const complianceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Compliance Score',
        data: [85, 87, 89, 88, 91, 90, 92, 89, 87, 88, 90, 87],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Risk Score',
        data: [15, 13, 11, 12, 9, 10, 8, 11, 13, 12, 10, 13],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // SEC Filings Data
  const filingsData = {
    labels: ['10-K', '10-Q', '8-K', 'DEF 14A', 'Form 4', 'Other'],
    datasets: [
      {
        label: 'Filings This Quarter',
        data: [45, 32, 28, 15, 12, 8],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 2,
      }
    ]
  };

  // Risk Distribution Data
  const riskData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
    datasets: [
      {
        data: [45, 35, 15, 5],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(127, 29, 29, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(127, 29, 29)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: activeChart === 'compliance' ? 'Compliance Trends' : 
              activeChart === 'filings' ? 'SEC Filings Distribution' : 
              'Risk Level Distribution',
      },
    },
    scales: activeChart === 'compliance' ? {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    } : undefined,
  };

  const metrics = [
    {
      name: 'Total Filings',
      value: '1,247',
      change: '+12.5%',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
    {
      name: 'Compliance Rate',
      value: '87.3%',
      change: '+3.2%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Risk Score',
      value: 'Medium',
      change: '-1.1%',
      changeType: 'positive',
      icon: ArrowTrendingDownIcon,
    },
    {
      name: 'Processing Time',
      value: '2.4s',
      change: '-15.2%',
      changeType: 'positive',
      icon: ArrowUpIcon,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-md bg-indigo-100">
                        <Icon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {metric.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {metric.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.changeType === 'positive' ? (
                              <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                            )}
                            <span className="sr-only">
                              {metric.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                            </span>
                            {metric.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Data Visualization</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveChart('compliance')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeChart === 'compliance'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compliance Trends
              </button>
              <button
                onClick={() => setActiveChart('filings')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeChart === 'filings'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Filings Distribution
              </button>
              <button
                onClick={() => setActiveChart('risk')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeChart === 'risk'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Risk Analysis
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-96">
            {activeChart === 'compliance' && (
              <Line data={complianceData} options={chartOptions} />
            )}
            {activeChart === 'filings' && (
              <Bar data={filingsData} options={chartOptions} />
            )}
            {activeChart === 'risk' && (
              <Doughnut data={riskData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Processing Performance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Performance</h3>
            <div className="h-64">
              <Line 
                data={{
                  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                  datasets: [
                    {
                      label: 'CPU Processing (s)',
                      data: [12, 15, 18, 14],
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                    {
                      label: 'GPU Processing (s)',
                      data: [2, 3, 2.5, 2.2],
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Processing Time (seconds)'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Rule Extraction Success Rate */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Extraction Success Rate</h3>
            <div className="h-64">
              <Doughnut 
                data={{
                  labels: ['Successful', 'Partial', 'Failed'],
                  datasets: [
                    {
                      data: [85, 12, 3],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                      ],
                      borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                      ],
                      borderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      position: 'bottom' as const,
                    },
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
