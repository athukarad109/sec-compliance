'use client';

import { useState, useEffect } from 'react';
import { 
  CogIcon,
  CpuChipIcon,
  BoltIcon,
  CircleStackIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { systemApi } from '@/lib/api';
import { PerformanceInfo } from '@/types/api';

export default function SystemSettings() {
  const [performance, setPerformance] = useState<PerformanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    gpuAcceleration: true,
    batchSize: 16,
    maxLength: 512,
    autoProcessing: false,
    emailNotifications: true,
    retentionDays: 90,
  });

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const perf = await systemApi.getPerformanceInfo();
      setPerformance(perf);
    } catch (error) {
      console.error('Failed to load performance info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
    // In a real app, this would save to the backend
  };

  const handleResetSettings = () => {
    setSettings({
      gpuAcceleration: true,
      batchSize: 16,
      maxLength: 512,
      autoProcessing: false,
      emailNotifications: true,
      retentionDays: 90,
    });
    toast.success('Settings reset to defaults');
  };

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
      {/* System Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Performance
          </h3>
          
          {performance && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <CircleStackIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Batch Size</p>
                  <p className="text-sm text-gray-900">{performance.batch_size}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Model Status</p>
                  <p className="text-sm text-gray-900">
                    {performance.model_loaded ? 'Loaded' : 'Not Loaded'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Configuration
          </h3>
          
          <div className="space-y-6">
            {/* AI Processing Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">AI Processing</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                    GPU Acceleration
                    </label>
                    <p className="text-xs text-gray-500">
                      Use GPU for faster AI processing (requires CUDA)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.gpuAcceleration}
                    onChange={(e) => setSettings({...settings, gpuAcceleration: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={settings.batchSize}
                      onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Length
                    </label>
                    <input
                      type="number"
                      min="128"
                      max="1024"
                      value={settings.maxLength}
                      onChange={(e) => setSettings({...settings, maxLength: parseInt(e.target.value)})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Workflow</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Auto Processing
                    </label>
                    <p className="text-xs text-gray-500">
                      Automatically process uploaded documents
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoProcessing}
                    onChange={(e) => setSettings({...settings, autoProcessing: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Send email alerts for compliance issues
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Data Management</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Retention (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Documents and rules will be automatically deleted after this period
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleResetSettings}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
