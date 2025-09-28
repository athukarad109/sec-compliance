import Layout from '@/components/Layout';
import DashboardOverview from '@/components/DashboardOverview';
import ExternalDataIntegration from '@/components/ExternalDataIntegration';
import RequiredActions from '@/components/RequiredActions';
import DataVisualization from '@/components/DataVisualization';
import DashboardWidgets from '@/components/DashboardWidgets';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time compliance monitoring, external data integration, and actionable insights
          </p>
        </div>

        {/* Dashboard Overview */}
        <DashboardOverview />

        {/* External Data Integration */}
        <ExternalDataIntegration />

        {/* Required Actions */}
        <RequiredActions />

        {/* Data Visualization */}
        <DataVisualization />

        {/* Dashboard Widgets */}
        <DashboardWidgets />
      </div>
    </Layout>
  );
}
