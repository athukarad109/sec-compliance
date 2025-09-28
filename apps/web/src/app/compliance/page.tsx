import Layout from '@/components/Layout';
import ComplianceDashboard from '@/components/ComplianceDashboard';
import ComplianceAlerts from '@/components/ComplianceAlerts';

export default function CompliancePage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor compliance status, track deadlines, and manage alerts
          </p>
        </div>

        {/* Compliance Dashboard */}
        <ComplianceDashboard />

        {/* Compliance Alerts */}
        <ComplianceAlerts />
      </div>
    </Layout>
  );
}
