'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { format, addDays, isAfter, isBefore } from 'date-fns';

interface Filing {
  id: string;
  company: string;
  filingType: 'Form 10-K' | 'Form 8-K' | 'Form 4' | 'Form PF' | 'Proxy Statement' | 'Other';
  dueDate: string;
  status: 'On Time' | 'Pending' | 'Late' | 'Filed';
  linkedObligation: {
    id: string;
    title: string;
    rule: string;
  };
  filingDate?: string;
  secUrl?: string;
  documentUrl?: string;
  quarter: string;
  year: number;
  entity: string;
  priority: 'High' | 'Medium' | 'Low';
}

export default function FilingsDisclosures() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [filteredFilings, setFilteredFilings] = useState<Filing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    entity: '',
    filingType: '',
    status: '',
    quarter: '',
    year: '',
    priority: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filings, searchTerm, filters]);

  const loadFilings = async () => {
    // Mock data - in a real app, this would come from APIs
    const mockFilings: Filing[] = [
      {
        id: '1',
        company: 'Tech Corp Inc',
        filingType: 'Form 10-K',
        dueDate: addDays(new Date(), 45).toISOString(),
        status: 'Pending',
        linkedObligation: {
          id: '1',
          title: 'Annual Report Requirements',
          rule: 'Section 13(a)'
        },
        quarter: 'Q4',
        year: 2024,
        entity: 'Public Company',
        priority: 'High'
      },
      {
        id: '2',
        company: 'Investment Advisor LLC',
        filingType: 'Form PF',
        dueDate: addDays(new Date(), 15).toISOString(),
        status: 'Pending',
        linkedObligation: {
          id: '2',
          title: 'Form PF Annual Reporting',
          rule: 'Rule 204(b)-1'
        },
        quarter: 'Q4',
        year: 2024,
        entity: 'Private Fund Advisor',
        priority: 'High'
      },
      {
        id: '3',
        company: 'Executive Holdings',
        filingType: 'Form 4',
        dueDate: addDays(new Date(), -2).toISOString(),
        status: 'Late',
        linkedObligation: {
          id: '3',
          title: 'Insider Trading Reporting',
          rule: 'Rule 16a-3'
        },
        quarter: 'Q4',
        year: 2024,
        entity: 'Executive',
        priority: 'High'
      },
      {
        id: '4',
        company: 'Public Corp',
        filingType: 'Form 8-K',
        dueDate: addDays(new Date(), 1).toISOString(),
        status: 'Pending',
        linkedObligation: {
          id: '4',
          title: 'Current Report Requirements',
          rule: 'Item 1.05'
        },
        quarter: 'Q4',
        year: 2024,
        entity: 'Public Company',
        priority: 'High'
      },
      {
        id: '5',
        company: 'Tech Corp Inc',
        filingType: 'Form 10-K',
        dueDate: addDays(new Date(), -30).toISOString(),
        status: 'Filed',
        linkedObligation: {
          id: '5',
          title: 'Annual Report Requirements',
          rule: 'Section 13(a)'
        },
        filingDate: addDays(new Date(), -25).toISOString(),
        secUrl: 'https://www.sec.gov/Archives/edgar/data/1234567/000123456724000001/techcorp-10k-20231231.htm',
        quarter: 'Q3',
        year: 2024,
        entity: 'Public Company',
        priority: 'Medium'
      },
      {
        id: '6',
        company: 'Investment Fund LP',
        filingType: 'Form PF',
        dueDate: addDays(new Date(), -10).toISOString(),
        status: 'On Time',
        linkedObligation: {
          id: '6',
          title: 'Form PF Annual Reporting',
          rule: 'Rule 204(b)-1'
        },
        filingDate: addDays(new Date(), -5).toISOString(),
        quarter: 'Q4',
        year: 2024,
        entity: 'Private Fund',
        priority: 'Medium'
      }
    ];

    setFilings(mockFilings);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = filings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(filing =>
        filing.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filing.filingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filing.entity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filters
    if (filters.entity) {
      filtered = filtered.filter(filing => filing.entity === filters.entity);
    }
    if (filters.filingType) {
      filtered = filtered.filter(filing => filing.filingType === filters.filingType);
    }
    if (filters.status) {
      filtered = filtered.filter(filing => filing.status === filters.status);
    }
    if (filters.quarter) {
      filtered = filtered.filter(filing => filing.quarter === filters.quarter);
    }
    if (filters.year) {
      filtered = filtered.filter(filing => filing.year.toString() === filters.year);
    }
    if (filters.priority) {
      filtered = filtered.filter(filing => filing.priority === filters.priority);
    }

    setFilteredFilings(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time':
        return 'text-green-600 bg-green-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Late':
        return 'text-red-600 bg-red-100';
      case 'Filed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Time':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'Late':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'Filed':
        return <DocumentTextIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    return isBefore(new Date(dueDate), new Date());
  };

  const isDueSoon = (dueDate: string) => {
    const threeDaysFromNow = addDays(new Date(), 3);
    return isBefore(new Date(dueDate), threeDaysFromNow) && !isOverdue(dueDate);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Filings & Disclosures</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track filing deadlines, status, and linked compliance obligations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Filter Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search filings..."
                  />
                </div>
              </div>

              {/* Entity Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity
                </label>
                <select
                  value={filters.entity}
                  onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Entities</option>
                  <option value="Public Company">Public Company</option>
                  <option value="Private Fund Advisor">Private Fund Advisor</option>
                  <option value="Private Fund">Private Fund</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              {/* Filing Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filing Type
                </label>
                <select
                  value={filters.filingType}
                  onChange={(e) => setFilters({ ...filters, filingType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="Form 10-K">Form 10-K</option>
                  <option value="Form 8-K">Form 8-K</option>
                  <option value="Form 4">Form 4</option>
                  <option value="Form PF">Form PF</option>
                  <option value="Proxy Statement">Proxy Statement</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="On Time">On Time</option>
                  <option value="Pending">Pending</option>
                  <option value="Late">Late</option>
                  <option value="Filed">Filed</option>
                </select>
              </div>

              {/* Quarter Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarter
                </label>
                <select
                  value={filters.quarter}
                  onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Quarters</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    entity: '',
                    filingType: '',
                    status: '',
                    quarter: '',
                    year: '',
                    priority: ''
                  });
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filings Table</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {filteredFilings.length} filings
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filing Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Linked Obligation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFilings.map((filing) => (
                      <tr key={filing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  {filing.company.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {filing.company}
                              </div>
                              <div className="text-sm text-gray-500">
                                {filing.entity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(filing.priority)}">
                              {filing.filingType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {format(new Date(filing.dueDate), 'MMM d, yyyy')}
                              </div>
                              {isOverdue(filing.dueDate) && (
                                <div className="text-xs text-red-600">
                                  {Math.abs(Math.floor((new Date().getTime() - new Date(filing.dueDate).getTime()) / (1000 * 60 * 60 * 24)))} days overdue
                                </div>
                              )}
                              {isDueSoon(filing.dueDate) && !isOverdue(filing.dueDate) && (
                                <div className="text-xs text-yellow-600">
                                  Due soon
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(filing.status)}`}>
                            {getStatusIcon(filing.status)}
                            <span className="ml-1">{filing.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {filing.linkedObligation.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {filing.linkedObligation.rule}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {filing.secUrl && (
                              <a
                                href={filing.secUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </a>
                            )}
                            {filing.documentUrl && (
                              <button className="text-gray-600 hover:text-gray-900">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
