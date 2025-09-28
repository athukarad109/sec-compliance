'use client';

import { useState } from 'react';
import { 
  CogIcon,
  PlusIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Widget {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'metric' | 'alert';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
  config: any;
}

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: '1',
      title: 'Compliance Score',
      type: 'metric',
      size: 'small',
      position: { x: 0, y: 0 },
      visible: true,
      config: { value: '87.3%', trend: '+3.2%', color: 'green' }
    },
    {
      id: '2',
      title: 'Recent Filings',
      type: 'table',
      size: 'medium',
      position: { x: 1, y: 0 },
      visible: true,
      config: { 
        data: [
          { company: 'Apple Inc.', filing: '10-K', date: '2024-01-15', status: 'Filed' },
          { company: 'Microsoft Corp.', filing: '8-K', date: '2024-01-14', status: 'Filed' },
          { company: 'Tesla Inc.', filing: '10-Q', date: '2024-01-13', status: 'Late' }
        ]
      }
    },
    {
      id: '3',
      title: 'Risk Distribution',
      type: 'chart',
      size: 'large',
      position: { x: 0, y: 1 },
      visible: true,
      config: { chartType: 'doughnut', data: [45, 35, 15, 5] }
    },
    {
      id: '4',
      title: 'System Alerts',
      type: 'alert',
      size: 'medium',
      position: { x: 1, y: 1 },
      visible: true,
      config: { 
        alerts: [
          { message: 'High-risk compliance rule detected', severity: 'high' },
          { message: 'Document processing completed', severity: 'info' },
          { message: 'System maintenance scheduled', severity: 'warning' }
        ]
      }
    }
  ]);

  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  const availableWidgets = [
    { type: 'metric', title: 'Metric Widget', description: 'Display key performance indicators' },
    { type: 'chart', title: 'Chart Widget', description: 'Visualize data with charts and graphs' },
    { type: 'table', title: 'Table Widget', description: 'Show tabular data' },
    { type: 'alert', title: 'Alert Widget', description: 'Display system alerts and notifications' }
  ];

  const handleAddWidget = (widgetType: string) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      title: `${widgetType} Widget`,
      type: widgetType as any,
      size: 'medium',
      position: { x: 0, y: 0 },
      visible: true,
      config: {}
    };
    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  const handleToggleVisibility = (widgetId: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(widget => widget.id !== widgetId));
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
  };

  const getWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {widget.config.value}
            </div>
            <div className={`text-sm ${
              widget.config.color === 'green' ? 'text-green-600' : 
              widget.config.color === 'red' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {widget.config.trend}
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Filing</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {widget.config.data?.map((row: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.company}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.filing}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.status === 'Filed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'chart':
        return (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-600">Chart Widget</div>
              <div className="text-xs text-gray-500">Interactive visualization</div>
            </div>
          </div>
        );
      
      case 'alert':
        return (
          <div className="space-y-2">
            {widget.config.alerts?.map((alert: any, index: number) => (
              <div key={index} className={`p-2 rounded text-sm ${
                alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {alert.message}
              </div>
            ))}
          </div>
        );
      
      default:
        return <div className="text-center text-gray-500">Unknown widget type</div>;
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      default:
        return 'col-span-2';
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget Controls */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Dashboard Widgets</h3>
            <button
              onClick={() => setShowAddWidget(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Widget
            </button>
          </div>

          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.filter(widget => widget.visible).map((widget) => (
              <div
                key={widget.id}
                className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${getSizeClasses(widget.size)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">{widget.title}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleVisibility(widget.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title={widget.visible ? 'Hide widget' : 'Show widget'}
                    >
                      {widget.visible ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditWidget(widget)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit widget"
                    >
                      <CogIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete widget"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="h-32">
                  {getWidgetContent(widget)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Widget
                </h3>
                <button
                  onClick={() => setShowAddWidget(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {availableWidgets.map((widget) => (
                  <button
                    key={widget.type}
                    onClick={() => handleAddWidget(widget.type)}
                    className="p-4 border border-gray-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900">{widget.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{widget.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Widget Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Widget
                </h3>
                <button
                  onClick={() => setEditingWidget(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Widget Title
                  </label>
                  <input
                    type="text"
                    value={editingWidget.title}
                    onChange={(e) => setEditingWidget({...editingWidget, title: e.target.value})}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Widget Size
                  </label>
                  <select
                    value={editingWidget.size}
                    onChange={(e) => setEditingWidget({...editingWidget, size: e.target.value as any})}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingWidget(null)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setWidgets(widgets.map(w => w.id === editingWidget.id ? editingWidget : w));
                    setEditingWidget(null);
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
