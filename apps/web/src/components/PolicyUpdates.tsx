'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  LinkIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { format, addDays, addMonths } from 'date-fns';

interface PolicyUpdate {
  id: string;
  title: string;
  description: string;
  type: 'Amendment' | 'New Rule' | 'Guidance' | 'Enforcement Action';
  effectiveDate: string;
  publishedDate: string;
  status: 'Proposed' | 'Final' | 'Effective' | 'Superseded';
  impact: 'High' | 'Medium' | 'Low';
  source: {
    congressGov?: string;
    regulationsGov?: string;
    secGov?: string;
    federalRegister?: string;
  };
  legalText: string;
  jsonParse: any;
  harmonizerImpact: {
    affectedObligations: string[];
    changes: string[];
    newRequirements: string[];
    removedRequirements: string[];
  };
  tags: string[];
}

export default function PolicyUpdates() {
  const [updates, setUpdates] = useState<PolicyUpdate[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<PolicyUpdate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    impact: '',
    year: '',
    month: ''
  });
  const [selectedUpdate, setSelectedUpdate] = useState<PolicyUpdate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicyUpdates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [updates, searchTerm, filters]);

  const loadPolicyUpdates = async () => {
    // Mock data - in a real app, this would come from APIs
    const mockUpdates: PolicyUpdate[] = [
      {
        id: '1',
        title: 'Cybersecurity Incident Reporting Requirements',
        description: 'New requirements for public companies to report material cybersecurity incidents within 4 business days',
        type: 'New Rule',
        effectiveDate: '2023-12-18',
        publishedDate: '2023-12-15',
        status: 'Effective',
        impact: 'High',
        source: {
          secGov: 'https://www.sec.gov/rules/final/2023/33-11225.pdf',
          federalRegister: 'https://www.federalregister.gov/documents/2023/12/18/2023-27659/cybersecurity-risk-management-rule-for-brokers-and-dealers'
        },
        legalText: 'Public companies must disclose material cybersecurity incidents within four business days of determining that a cybersecurity incident is material...',
        jsonParse: {
          "rule_type": "cybersecurity_incident_reporting",
          "timeline": "4 business days",
          "materiality_threshold": "reasonable likelihood of material impact",
          "disclosure_requirements": ["nature", "scope", "timing", "impact"],
          "exemptions": ["national_security", "law_enforcement"]
        },
        harmonizerImpact: {
          affectedObligations: ['Form 8-K Filing', 'Risk Factor Updates', 'Cybersecurity Policies'],
          changes: ['Added Item 1.05 to Form 8-K', 'Updated risk factor requirements'],
          newRequirements: ['Incident response procedures', 'Materiality assessment framework'],
          removedRequirements: []
        },
        tags: ['Cybersecurity', 'Form 8-K', 'Incident Response']
      },
      {
        id: '2',
        title: 'Insider Trading Policy Amendments',
        description: 'Updated requirements for insider trading policies and blackout periods',
        type: 'Amendment',
        effectiveDate: '2024-01-15',
        publishedDate: '2024-01-10',
        status: 'Effective',
        impact: 'Medium',
        source: {
          secGov: 'https://www.sec.gov/rules/final/2024/34-12345.pdf',
          regulationsGov: 'https://www.regulations.gov/document/SEC-2024-001'
        },
        legalText: 'Companies must establish and maintain written insider trading policies that include blackout periods and pre-clearance procedures...',
        jsonParse: {
          "policy_requirements": ["blackout_periods", "pre_clearance", "training", "monitoring"],
          "blackout_periods": "quarterly earnings and major announcements",
          "pre_clearance": "all insider transactions",
          "training_frequency": "annual"
        },
        harmonizerImpact: {
          affectedObligations: ['Insider Trading Policies', 'Form 4 Filings', 'Section 16 Compliance'],
          changes: ['Extended blackout periods', 'Enhanced pre-clearance requirements'],
          newRequirements: ['Quarterly policy reviews', 'Enhanced monitoring procedures'],
          removedRequirements: []
        },
        tags: ['Insider Trading', 'Section 16', 'Policy Updates']
      },
      {
        id: '3',
        title: 'Form PF Reporting Enhancements',
        description: 'Enhanced reporting requirements for private fund advisors',
        type: 'Amendment',
        effectiveDate: '2024-03-01',
        publishedDate: '2024-02-15',
        status: 'Proposed',
        impact: 'Medium',
        source: {
          secGov: 'https://www.sec.gov/rules/proposed/2024/ia-6789.pdf',
          regulationsGov: 'https://www.regulations.gov/document/SEC-2024-002'
        },
        legalText: 'Private fund advisors with assets under management of $1.5 billion or more must provide enhanced reporting on fund performance and risk metrics...',
        jsonParse: {
          "reporting_threshold": "$1.5 billion AUM",
          "enhanced_metrics": ["performance_attribution", "risk_metrics", "liquidity_analysis"],
          "reporting_frequency": "quarterly",
          "filing_deadline": "15 days after quarter end"
        },
        harmonizerImpact: {
          affectedObligations: ['Form PF Annual Report', 'Risk Management Policies'],
          changes: ['Increased reporting frequency', 'Enhanced risk metrics'],
          newRequirements: ['Quarterly performance reporting', 'Risk management framework'],
          removedRequirements: []
        },
        tags: ['Form PF', 'Private Funds', 'Risk Management']
      },
      {
        id: '4',
        title: 'Climate Risk Disclosure Framework',
        description: 'New framework for climate-related risk disclosures in annual reports',
        type: 'New Rule',
        effectiveDate: '2024-06-01',
        publishedDate: '2024-05-15',
        status: 'Proposed',
        impact: 'High',
        source: {
          secGov: 'https://www.sec.gov/rules/proposed/2024/33-11275.pdf',
          federalRegister: 'https://www.federalregister.gov/documents/2024/05/15/2024-10667/enhanced-and-standardized-disclosure-of-climate-related-risks'
        },
        legalText: 'Public companies must disclose climate-related risks that are reasonably likely to have a material impact on their business, results of operations, or financial condition...',
        jsonParse: {
          "disclosure_requirements": ["climate_risks", "governance", "strategy", "risk_management", "metrics"],
          "materiality_threshold": "reasonably likely to have material impact",
          "reporting_location": "Form 10-K",
          "compliance_date": "fiscal year 2025"
        },
        harmonizerImpact: {
          affectedObligations: ['Form 10-K Annual Report', 'Risk Factor Disclosures', 'ESG Reporting'],
          changes: ['Added climate risk section', 'Enhanced risk factor requirements'],
          newRequirements: ['Climate risk assessment', 'ESG governance framework'],
          removedRequirements: []
        },
        tags: ['Climate Risk', 'ESG', 'Form 10-K', 'Sustainability']
      }
    ];

    setUpdates(mockUpdates);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = updates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(update =>
        update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filters
    if (filters.type) {
      filtered = filtered.filter(update => update.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(update => update.status === filters.status);
    }
    if (filters.impact) {
      filtered = filtered.filter(update => update.impact === filters.impact);
    }
    if (filters.year) {
      filtered = filtered.filter(update => new Date(update.publishedDate).getFullYear().toString() === filters.year);
    }
    if (filters.month) {
      filtered = filtered.filter(update => (new Date(update.publishedDate).getMonth() + 1).toString() === filters.month);
    }

    setFilteredUpdates(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Amendment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'New Rule':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Guidance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Enforcement Action':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proposed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Final':
        return 'bg-blue-100 text-blue-800';
      case 'Effective':
        return 'bg-green-100 text-green-800';
      case 'Superseded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Proposed':
        return <ClockIcon className="h-4 w-4" />;
      case 'Final':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'Effective':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Superseded':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Policy Updates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Timeline of regulatory changes, amendments, and new rules affecting compliance obligations
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
                    placeholder="Search updates..."
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="Amendment">Amendment</option>
                  <option value="New Rule">New Rule</option>
                  <option value="Guidance">Guidance</option>
                  <option value="Enforcement Action">Enforcement Action</option>
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
                  <option value="Proposed">Proposed</option>
                  <option value="Final">Final</option>
                  <option value="Effective">Effective</option>
                  <option value="Superseded">Superseded</option>
                </select>
              </div>

              {/* Impact Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact
                </label>
                <select
                  value={filters.impact}
                  onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Impacts</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
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

              {/* Month Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    type: '',
                    status: '',
                    impact: '',
                    year: '',
                    month: ''
                  });
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Timeline */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {filteredUpdates.map((update, index) => (
              <div key={update.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(update.type)}`}>
                          {update.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                          {getStatusIcon(update.status)}
                          <span className="ml-1">{update.status}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(update.impact)}`}>
                          {update.impact} Impact
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {update.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {update.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Published: {format(new Date(update.publishedDate), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Effective: {format(new Date(update.effectiveDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {update.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legal Sources */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Legal Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {update.source.secGov && (
                        <a
                          href={update.source.secGov}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          SEC.gov
                        </a>
                      )}
                      {update.source.regulationsGov && (
                        <a
                          href={update.source.regulationsGov}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Regulations.gov
                        </a>
                      )}
                      {update.source.congressGov && (
                        <a
                          href={update.source.congressGov}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Congress.gov
                        </a>
                      )}
                      {update.source.federalRegister && (
                        <a
                          href={update.source.federalRegister}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-orange-100 text-orange-800 hover:bg-orange-200"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Federal Register
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Harmonizer Impact */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Affected Obligations</h4>
                      <div className="space-y-1">
                        {update.harmonizerImpact.affectedObligations.map((obligation, obligationIndex) => (
                          <div key={obligationIndex} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {obligation}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Changes</h4>
                      <div className="space-y-1">
                        {update.harmonizerImpact.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {change}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
