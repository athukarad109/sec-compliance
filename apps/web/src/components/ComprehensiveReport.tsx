'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { gapAnalysesApi } from '@/lib/api';
import { GapAnalysis } from '@/types/api';
import ReportCharts from './ReportCharts';

// Organization data will be fetched from the public directory

interface ReportMetrics {
  totalRevenue: number;
  netIncome: number;
  totalAssets: number;
  complianceScore: number;
  gapAnalysesCount: number;
  criticalFindings: number;
  completedTasks: number;
  pendingTasks: number;
}

interface FinancialMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  netIncome: {
    current: number;
    previous: number;
    growth: number;
  };
  assets: {
    current: number;
    previous: number;
    growth: number;
  };
}

export default function ComprehensiveReport() {
  const [gapAnalyses, setGapAnalyses] = useState<GapAnalysis[]>([]);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load organization data
      console.log('Loading organization data...');
      const orgResponse = await fetch('/orion_10k_data.json');
      
      if (!orgResponse.ok) {
        console.error('Failed to load organization data:', orgResponse.status, orgResponse.statusText);
        setLoading(false);
        return;
      }
      
      const orgData = await orgResponse.json();
      console.log('Organization data loaded:', orgData);
      setOrganizationData(orgData);
      
      // Load gap analyses data
      console.log('Loading gap analyses data...');
      let gapAnalysesData: any[] = [];
      try {
        const gapResponse = await gapAnalysesApi.getAll();
        gapAnalysesData = gapResponse.analyses;
        setGapAnalyses(gapAnalysesData);
      } catch (error) {
        console.error('Failed to load gap analyses:', error);
        setGapAnalyses([]);
      }
      
      // Calculate metrics from organization data
      if (!orgData?.part2?.item8_financial_statements) {
        console.error('Organization data structure is missing required financial statements');
        console.error('Available data structure:', Object.keys(orgData || {}));
        
        // Set default metrics if organization data is not available
        setMetrics({
          totalRevenue: 0,
          netIncome: 0,
          totalAssets: 0,
          complianceScore: 0,
          gapAnalysesCount: gapAnalysesData.length,
          criticalFindings: 0,
          completedTasks: 0,
          pendingTasks: 0
        });
        
        setLoading(false);
        return;
      }

      const currentYear = orgData.part2.item8_financial_statements.income_statements[0];
      const previousYear = orgData.part2.item8_financial_statements.income_statements[1];
      const currentAssets = orgData.part2.item8_financial_statements.balance_sheets[0];
      
      // Calculate compliance score from gap analyses
      const analyses = gapAnalysesData || [];
      const avgComplianceScore = analyses.length > 0 
        ? analyses.reduce((sum, analysis) => sum + analysis.complianceScore, 0) / analyses.length
        : 0;
      
      const criticalFindings = analyses.reduce((sum, analysis) => 
        sum + (analysis.findings?.filter((finding: any) => finding.severity === 'critical').length || 0), 0
      );
      
      const completedTasks = analyses.reduce((sum, analysis) => 
        sum + (analysis.tasks?.filter((task: any) => task.status === 'completed').length || 0), 0
      );
      
      const pendingTasks = analyses.reduce((sum, analysis) => 
        sum + (analysis.tasks?.filter((task: any) => task.status === 'pending').length || 0), 0
      );

      setMetrics({
        totalRevenue: currentYear.net_sales,
        netIncome: currentYear.net_income,
        totalAssets: currentAssets.total_assets,
        complianceScore: Math.round(avgComplianceScore),
        gapAnalysesCount: gapAnalysesData.length,
        criticalFindings,
        completedTasks,
        pendingTasks
      });

      // Calculate financial metrics
      const revenueGrowth = ((currentYear.net_sales - previousYear.net_sales) / previousYear.net_sales) * 100;
      const netIncomeGrowth = ((currentYear.net_income - previousYear.net_income) / previousYear.net_income) * 100;
      const assetsGrowth = ((currentAssets.total_assets - orgData.part2.item8_financial_statements.balance_sheets[1].total_assets) / orgData.part2.item8_financial_statements.balance_sheets[1].total_assets) * 100;

      setFinancialMetrics({
        revenue: {
          current: currentYear.net_sales,
          previous: previousYear.net_sales,
          growth: revenueGrowth
        },
        netIncome: {
          current: currentYear.net_income,
          previous: previousYear.net_income,
          growth: netIncomeGrowth
        },
        assets: {
          current: currentAssets.total_assets,
          previous: organizationData.part2.item8_financial_statements.balance_sheets[1].total_assets,
          growth: assetsGrowth
        }
      });

    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading || !organizationData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comprehensive Compliance Report</h1>
            <p className="mt-2 text-indigo-100">
              {organizationData?.company?.name || 'Company'} - {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex space-x-3">
            
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'compliance', label: 'Compliance Status', icon: ShieldCheckIcon },
              { id: 'gaps', label: 'Gap Analysis', icon: DocumentChartBarIcon },
              { id: 'visualizations', label: 'Data Visualizations', icon: DocumentTextIcon },
              { id: 'recommendations', label: 'Recommendations', icon: ExclamationTriangleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSection(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedSection === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Section */}
      {selectedSection === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Net Income</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(metrics?.netIncome || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Assets</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(metrics?.totalAssets || 0)}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Company Details</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900"><strong>Name:</strong> {organizationData?.company?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-900"><strong>Ticker:</strong> {organizationData?.company?.ticker || 'N/A'}</p>
                    <p className="text-sm text-gray-900"><strong>Exchange:</strong> {organizationData?.company?.exchange || 'N/A'}</p>
                    <p className="text-sm text-gray-900"><strong>Jurisdiction:</strong> {organizationData?.company?.jurisdiction || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Headquarters</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">{organizationData?.company?.headquarters?.street || 'N/A'}</p>
                    <p className="text-sm text-gray-900">
                      {organizationData?.company?.headquarters?.city || 'N/A'}, {organizationData?.company?.headquarters?.state || 'N/A'} {organizationData?.company?.headquarters?.zip || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-900">{organizationData?.company?.headquarters?.country || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Filing Information</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900"><strong>Fiscal Year End:</strong> {organizationData?.company?.fiscal_year_end || 'N/A'}</p>
                    <p className="text-sm text-gray-900"><strong>Filer Status:</strong> {organizationData?.cover?.large_accelerated_filer ? 'Large Accelerated Filer' : 'Accelerated Filer'}</p>
                    <p className="text-sm text-gray-900"><strong>Market Value:</strong> {formatCurrency(organizationData?.cover?.aggregate_market_value_non_affiliates_usd || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gap Analysis Summary */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Gap Analysis Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{metrics?.gapAnalysesCount || 0}</div>
                  <div className="text-sm text-gray-500">Total Analyses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{metrics?.criticalFindings || 0}</div>
                  <div className="text-sm text-gray-500">Critical Findings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{metrics?.completedTasks || 0}</div>
                  <div className="text-sm text-gray-500">Completed Tasks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="px-6 py-4 border-b border-blue-200">
              <h3 className="text-lg font-medium text-blue-900">Executive Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-3">Financial Highlights</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Revenue: {formatCurrency(metrics?.totalRevenue || 0)} (11.0% YoY growth)</li>
                    <li>• Net Income: {formatCurrency(metrics?.netIncome || 0)} (58.3% YoY growth)</li>
                    <li>• Total Assets: {formatCurrency(metrics?.totalAssets || 0)} (4.3% YoY growth)</li>
                    <li>• Free Cash Flow: {formatCurrency(organizationData?.part2?.item7_mdna?.non_gaap?.free_cash_flow_usd || 0)}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-3">Compliance Status</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Gap Analyses Completed: {metrics?.gapAnalysesCount || 0}</li>
                    <li>• Critical Issues: {metrics?.criticalFindings || 0}</li>
                    <li>• Tasks Completed: {metrics?.completedTasks || 0} of {metrics ? metrics.completedTasks + metrics.pendingTasks : 0}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Performance Section */}
      {selectedSection === 'financials' && financialMetrics && (
        <div className="space-y-6">
          {/* Financial Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenue Growth</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(financialMetrics.revenue.current)}
                  </p>
                  <p className="text-sm text-gray-500">
                    vs {formatCurrency(financialMetrics.revenue.previous)} (Previous Year)
                  </p>
                </div>
                <div className="flex items-center">
                  {getGrowthIcon(financialMetrics.revenue.growth)}
                  <span className={`ml-1 text-sm font-medium ${getGrowthColor(financialMetrics.revenue.growth)}`}>
                    {Math.abs(financialMetrics.revenue.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Income Growth</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(financialMetrics.netIncome.current)}
                  </p>
                  <p className="text-sm text-gray-500">
                    vs {formatCurrency(financialMetrics.netIncome.previous)} (Previous Year)
                  </p>
                </div>
                <div className="flex items-center">
                  {getGrowthIcon(financialMetrics.netIncome.growth)}
                  <span className={`ml-1 text-sm font-medium ${getGrowthColor(financialMetrics.netIncome.growth)}`}>
                    {Math.abs(financialMetrics.netIncome.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Assets Growth</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(financialMetrics.assets.current)}
                  </p>
                  <p className="text-sm text-gray-500">
                    vs {formatCurrency(financialMetrics.assets.previous)} (Previous Year)
                  </p>
                </div>
                <div className="flex items-center">
                  {getGrowthIcon(financialMetrics.assets.growth)}
                  <span className={`ml-1 text-sm font-medium ${getGrowthColor(financialMetrics.assets.growth)}`}>
                    {Math.abs(financialMetrics.assets.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Visualizations */}
          <ReportCharts 
            financialData={organizationData?.part2?.item8_financial_statements} 
            gapAnalyses={gapAnalyses} 
          />
        </div>
      )}

      {/* Compliance Status Section */}
      {selectedSection === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Overview */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Compliance Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Internal Controls</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Disclosure Controls & Procedures</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Effective
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Internal Control over Financial Reporting</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Effective
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Audit Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Auditor</span>
                      <span className="text-sm text-gray-900">{organizationData?.part2?.item9a_controls_and_procedures?.icfr?.auditor_attestation?.auditor || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Opinion</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {organizationData?.part2?.item9a_controls_and_procedures?.icfr?.auditor_attestation?.opinion || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Report Date</span>
                      <span className="text-sm text-gray-900">
                        {organizationData?.part2?.item9a_controls_and_procedures?.icfr?.auditor_attestation?.report_date 
                          ? format(new Date(organizationData.part2.item9a_controls_and_procedures.icfr.auditor_attestation.report_date), 'MMM d, yyyy')
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cybersecurity */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Cybersecurity Program</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Program Details</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Framework:</strong> {organizationData?.part1?.item1c_cybersecurity?.program || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Material Incidents:</strong> {organizationData?.part1?.item1c_cybersecurity?.material_incidents?.occurred ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Response Plan:</strong> {organizationData?.part1?.item1c_cybersecurity?.incident_response || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Risk Factors</h4>
                  <div className="space-y-1">
                    {organizationData?.part1?.item1a_risk_factors?.slice(0, 3).map((risk: string, index: number) => (
                      <p key={index} className="text-sm text-gray-700">• {risk}</p>
                    )) || <p className="text-sm text-gray-500">No risk factors available</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gap Analysis Section */}
      {selectedSection === 'gaps' && (
        <div className="space-y-6">
          {gapAnalyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gap Analyses Available</h3>
              <p className="text-gray-500">Gap analyses will appear here once they are generated.</p>
            </div>
          ) : (
            gapAnalyses.map((analysis, index) => (
              <div key={analysis.id} className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Gap Analysis #{index + 1}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Created: {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        analysis.complianceScore >= 80 ? 'bg-green-100 text-green-800' :
                        analysis.complianceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.complianceScore}% Compliant
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Findings</h4>
                      <div className="space-y-2">
                        {analysis.findings?.slice(0, 3).map((finding: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-700">
                            • {finding.description || finding.title || 'Finding ' + (idx + 1)}
                          </div>
                        ))}
                        {analysis.findings?.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{analysis.findings.length - 3} more findings
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Tasks</h4>
                      <div className="space-y-2">
                        {analysis.tasks?.slice(0, 3).map((task: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{task.title || task.description || 'Task ' + (idx + 1)}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status || 'pending'}
                            </span>
                          </div>
                        ))}
                        {analysis.tasks?.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{analysis.tasks.length - 3} more tasks
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Compliance Score:</span>
                          <span className="font-medium">{analysis.complianceScore}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Total Findings:</span>
                          <span className="font-medium">{analysis.findings?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Total Tasks:</span>
                          <span className="font-medium">{analysis.tasks?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Data Visualizations Section */}
      {selectedSection === 'visualizations' && (
        <div className="space-y-6">
          <ReportCharts 
            financialData={organizationData?.part2?.item8_financial_statements} 
            gapAnalyses={gapAnalyses} 
          />
        </div>
      )}

      {/* Recommendations Section */}
      {selectedSection === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Key Recommendations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Address Critical Findings</h4>
                    <p className="text-sm text-gray-600">
                      {metrics?.criticalFindings || 0} critical findings require immediate attention to maintain compliance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Complete Pending Tasks</h4>
                    <p className="text-sm text-gray-600">
                      {metrics?.pendingTasks || 0} pending tasks need to be completed to improve compliance score.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Monitor Financial Performance</h4>
                    <p className="text-sm text-gray-600">
                      Continue monitoring revenue growth and ensure compliance requirements are met as the business scales.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Strengthen Cybersecurity</h4>
                    <p className="text-sm text-gray-600">
                      Maintain robust cybersecurity program and ensure incident response procedures are regularly tested.
                    </p>
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
