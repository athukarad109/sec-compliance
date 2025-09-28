import Layout from '@/components/Layout';
import SystemSettings from '@/components/SystemSettings';
import UserManagement from '@/components/UserManagement';
import SystemLogs from '@/components/SystemLogs';

export default function AdminPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-gray-500">
            System configuration, user management, and monitoring
          </p>
        </div>

        {/* System Settings */}
        <SystemSettings />

        {/* User Management */}
        <UserManagement />

        {/* System Logs */}
        <SystemLogs />
      </div>
    </Layout>
  );
}
