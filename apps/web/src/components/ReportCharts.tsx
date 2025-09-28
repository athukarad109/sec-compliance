'use client';

import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface ReportChartsProps {
  financialData: any;
  gapAnalyses: any[];
}

export default function ReportCharts({ financialData, gapAnalyses }: ReportChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Revenue breakdown data
  const revenueBreakdown: ChartData[] = [
    { label: 'Online Stores', value: financialData?.revenue_breakdown?.online_stores || 0, color: 'bg-blue-500' },
    { label: 'Physical Stores', value: financialData?.revenue_breakdown?.physical_stores || 0, color: 'bg-green-500' },
    { label: 'Third Party Services', value: financialData?.revenue_breakdown?.third_party_seller_services || 0, color: 'bg-purple-500' },
    { label: 'Advertising', value: financialData?.revenue_breakdown?.advertising_services || 0, color: 'bg-yellow-500' },
    { label: 'Subscriptions', value: financialData?.revenue_breakdown?.subscription_services || 0, color: 'bg-red-500' },
    { label: 'Cloud Services', value: financialData?.revenue_breakdown?.cloud_services || 0, color: 'bg-indigo-500' },
  ];

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

  // Compliance scores from gap analyses
  const complianceScores = gapAnalyses.map(analysis => analysis.complianceScore);
  const avgComplianceScore = complianceScores.length > 0 
    ? complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Revenue Breakdown Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Revenue Breakdown</h3>
          <p className="text-sm text-gray-500">Distribution of revenue across business segments</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => {
              const percentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color.replace('bg-', 'bg-')}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quarterly Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quarterly Performance Trend</h3>
          <p className="text-sm text-gray-500">Revenue and net income by quarter</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(financialData?.quarterly_financial_data?.['2024'] || {}).map(([quarter, data]: [string, any]) => (
              <div key={quarter} className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-3">{quarter}</h4>
                <div className="space-y-2">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(data.revenue)}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(data.net_income)}</div>
                    <div className="text-xs text-gray-600">Net Income</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">${data.eps_diluted}</div>
                    <div className="text-xs text-gray-600">EPS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Score Visualization */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Compliance Score Distribution</h3>
          <p className="text-sm text-gray-500">Average compliance score across gap analyses</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${avgComplianceScore >= 80 ? 'text-green-500' : avgComplianceScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${avgComplianceScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${avgComplianceScore >= 80 ? 'text-green-600' : avgComplianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {avgComplianceScore.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Compliance</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Based on {gapAnalyses.length} gap analysis{gapAnalyses.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Geographic Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Geographic Revenue Distribution</h3>
          <p className="text-sm text-gray-500">Revenue by geographic region</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(financialData?.geographic_net_sales?.[0] || {})
              .filter(([key]) => key !== 'year')
              .map(([region, revenue]: [string, any]) => {
                const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={region} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">{region.replace('_', ' ')}</h4>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(revenue)}</div>
                    <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
