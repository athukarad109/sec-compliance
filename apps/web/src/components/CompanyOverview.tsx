'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CompanyData {
  company: {
    name: string;
    short_name: string;
    ticker: string;
    cik: string;
    exchange: string;
    jurisdiction: string;
    headquarters: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    fiscal_year_end: string;
    website: string;
  };
  cover: {
    well_known_seasoned_issuer: boolean;
    large_accelerated_filer: boolean;
    aggregate_market_value_non_affiliates_usd: number;
    shares_outstanding_basic: number;
    as_of_date: string;
  };
  part1: {
    item1_business: {
      overview: string;
      products_and_services: string[];
      distribution_and_logistics: string;
      seasonality: string;
    };
    item1a_risk_factors: string[];
    item1c_cybersecurity: {
      program: string;
      material_incidents: { occurred: boolean };
      incident_response: string;
    };
  };
  part2: {
    item5_stockholder_information: {
      common_stock_price_range: {
        '2024': { high: number; low: number; average: number };
        '2023': { high: number; low: number; average: number };
      };
      dividend_policy: {
        pays_dividends: boolean;
        statement: string;
      };
      holders_of_record: number;
      institutional_ownership_pct: number;
    };
    item7_mdna: {
      overview: string;
      yoy_highlights: {
        revenue_growth_2024_vs_2023_pct: number;
        revenue_growth_2023_vs_2022_pct: number;
      };
      non_gaap: {
        free_cash_flow_usd: number;
        constant_currency_revenue_growth_pct: number;
        adjusted_operating_income_usd: number;
      };
    };
    item8_financial_statements: {
      income_statements: Array<{
        year: number;
        net_sales: number;
        operating_income: number;
        net_income: number;
        eps_diluted: number;
      }>;
      balance_sheets: Array<{
        as_of: string;
        total_assets: number;
        total_liabilities: number;
        total_stockholders_equity: number;
        cash_and_equivalents: number;
      }>;
      cash_flows: Array<{
        year: number;
        net_cash_from_operations: number;
        free_cash_flow: number;
      }>;
    };
  };
  part3: {
    item10_directors_executives_governance: {
      board_size: number;
      independent_directors: number;
      committees: string[];
    };
    item11_executive_compensation: {
      summary_compensation_table: Array<{
        name: string;
        title: string;
        year: number;
        total: number;
      }>;
    };
  };
  segment_disclosures: {
    reportable_segments: Array<{
      name: string;
      net_sales: number;
      operating_income: number;
      assets: number;
    }>;
    revenue_breakdown: {
      online_stores: number;
      third_party_seller_services: number;
      advertising_services: number;
      cloud_services: number;
      subscription_services: number;
    };
  };
}

export default function CompanyOverview() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const response = await fetch('/api/company-data');
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
      } else {
        // Fallback to mock data structure based on the JSON
        setCompanyData({
          company: {
            name: "Orion Retail & Cloud, Inc.",
            short_name: "Orion",
            ticker: "ORCC",
            cik: "0000000000",
            exchange: "NASDAQ",
            jurisdiction: "Delaware, USA",
            headquarters: {
              street: "1200 Innovation Way",
              city: "Seattle",
              state: "WA",
              zip: "98101",
              country: "USA"
            },
            fiscal_year_end: "2024-12-31",
            website: "https://ir.orion.example.com"
          },
          cover: {
            well_known_seasoned_issuer: true,
            large_accelerated_filer: true,
            aggregate_market_value_non_affiliates_usd: 1780000000000,
            shares_outstanding_basic: 10500000000,
            as_of_date: "2024-06-30"
          },
          part1: {
            item1_business: {
              overview: "Orion is a global omni-channel commerce and logistics platform with a hyperscale cloud services segment.",
              products_and_services: ["Online Stores", "Third-Party Seller Services", "Orion Web Services (OWS)", "Advertising Services", "Subscription Services"],
              distribution_and_logistics: "Owned and leased fulfillment, sortation, and delivery stations with last-mile partners.",
              seasonality: "Commerce demand peaks in Q4 holiday season and during promotional events; OWS demand is comparatively steady season-to-season."
            },
            item1a_risk_factors: [
              "Macroeconomic conditions and higher interest rates could reduce consumer and enterprise spend.",
              "Foreign exchange volatility impacts consolidated results.",
              "Intense competition across retail, advertising, and cloud services.",
              "Regulatory and tax scrutiny across multiple jurisdictions could increase costs and restrict operations."
            ],
            item1c_cybersecurity: {
              program: "Aligned to NIST CSF 2.0; 24x7 SOC; regular red/purple team exercises; third-party assessments; board-level risk oversight.",
              material_incidents: { occurred: false },
              incident_response: "Documented IR plan with external forensics; periodic tabletop exercises."
            }
          },
          part2: {
            item5_stockholder_information: {
              common_stock_price_range: {
                '2024': { high: 189.5, low: 102.3, average: 146.7 },
                '2023': { high: 168.2, low: 81.5, average: 124.8 }
              },
              dividend_policy: {
                pays_dividends: false,
                statement: "Earnings retained for growth; no dividends declared 2022-2024."
              },
              holders_of_record: 14800,
              institutional_ownership_pct: 68.4
            },
            item7_mdna: {
              overview: "Revenue growth driven by commerce and OWS; operating margin expansion from mix shift to OWS and fulfillment efficiencies.",
              yoy_highlights: {
                revenue_growth_2024_vs_2023_pct: 11.0,
                revenue_growth_2023_vs_2022_pct: 11.9
              },
              non_gaap: {
                free_cash_flow_usd: 38400000000,
                constant_currency_revenue_growth_pct: 10.9,
                adjusted_operating_income_usd: 69200000000
              }
            },
            item8_financial_statements: {
              income_statements: [
                {
                  year: 2024,
                  net_sales: 637800000000,
                  operating_income: 67900000000,
                  net_income: 58100000000,
                  eps_diluted: 5.4
                },
                {
                  year: 2023,
                  net_sales: 574800000000,
                  operating_income: 44600000000,
                  net_income: 36700000000,
                  eps_diluted: 3.42
                }
              ],
              balance_sheets: [
                {
                  as_of: "2024-12-31",
                  total_assets: 625400000000,
                  total_liabilities: 354300000000,
                  total_stockholders_equity: 271100000000,
                  cash_and_equivalents: 64300000000
                }
              ],
              cash_flows: [
                {
                  year: 2024,
                  net_cash_from_operations: 114900000000,
                  free_cash_flow: 38400000000
                }
              ]
            }
          },
          part3: {
            item10_directors_executives_governance: {
              board_size: 12,
              independent_directors: 10,
              committees: ["Audit", "Compensation", "Nominating & Governance", "Risk"]
            },
            item11_executive_compensation: {
              summary_compensation_table: [
                { name: "Alex Rivera", title: "Chair & CEO", year: 2024, total: 21000000 },
                { name: "Mei Chen", title: "CFO", year: 2024, total: 10480000 },
                { name: "Jordan Patel", title: "Controller", year: 2024, total: 4170000 }
              ]
            }
          },
          segment_disclosures: {
            reportable_segments: [
              { name: "North America Commerce", net_sales: 386600000000, operating_income: 24600000000, assets: 209900000000 },
              { name: "International Commerce", net_sales: 143400000000, operating_income: 3800000000, assets: 69600000000 },
              { name: "Orion Web Services (OWS)", net_sales: 107800000000, operating_income: 39500000000, assets: 157100000000 }
            ],
            revenue_breakdown: {
              online_stores: 247100000000,
              third_party_seller_services: 156400000000,
              advertising_services: 56000000000,
              cloud_services: 107800000000,
              subscription_services: 44300000000
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(1)}B`;
    } else if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(1)}M`;
    } else if (amount >= 1e3) {
      return `$${(amount / 1e3).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load company information.</p>
      </div>
    );
  }

  const latestFinancials = companyData.part2.item8_financial_statements.income_statements[0];
  const previousFinancials = companyData.part2.item8_financial_statements.income_statements[1];
  const latestBalanceSheet = companyData.part2.item8_financial_statements.balance_sheets[0];
  const latestCashFlow = companyData.part2.item8_financial_statements.cash_flows[0];

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{companyData.company.name}</h1>
              <p className="text-sm text-gray-700">
                {companyData.company.ticker} • {companyData.company.exchange} • {companyData.company.jurisdiction}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {companyData.company.headquarters.city}, {companyData.company.headquarters.state} • 
                Fiscal Year End: {companyData.company.fiscal_year_end}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(companyData.cover.aggregate_market_value_non_affiliates_usd)}
              </div>
              <div className="text-sm text-gray-700">Market Value</div>
              <div className="text-sm text-gray-700">
                {formatNumber(companyData.cover.shares_outstanding_basic)} shares outstanding
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(latestFinancials.net_sales)}
                </p>
                <p className="text-sm text-green-700 flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  +{companyData.part2.item7_mdna.yoy_highlights.revenue_growth_2024_vs_2023_pct}% YoY
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Net Income</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(latestFinancials.net_income)}
                </p>
                <p className="text-sm text-gray-700">
                  EPS: ${latestFinancials.eps_diluted}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Assets</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(latestBalanceSheet.total_assets)}
                </p>
                <p className="text-sm text-gray-700">
                  Cash: {formatCurrency(latestBalanceSheet.cash_and_equivalents)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Free Cash Flow</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(latestCashFlow.free_cash_flow)}
                </p>
                <p className="text-sm text-gray-700">
                  Operating Cash: {formatCurrency(latestCashFlow.net_cash_from_operations)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Overview & Risk Factors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Overview</h3>
            <p className="text-sm text-gray-800 mb-4">{companyData.part1.item1_business.overview}</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Products & Services</h4>
              <div className="flex flex-wrap gap-2">
                {companyData.part1.item1_business.products_and_services.map((service, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Distribution & Logistics</h4>
              <p className="text-sm text-gray-800">{companyData.part1.item1_business.distribution_and_logistics}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Risk Factors</h3>
            <div className="space-y-3">
              {companyData.part1.item1a_risk_factors.slice(0, 4).map((risk, index) => (
                <div key={index} className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-800">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business Segments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Segments</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {companyData.segment_disclosures.reportable_segments.map((segment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{segment.name}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Revenue:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(segment.net_sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Operating Income:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(segment.operating_income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Assets:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(segment.assets)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(companyData.segment_disclosures.revenue_breakdown).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</div>
                <div className="text-sm text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Governance & Leadership */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Governance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Board Size:</span>
                <span className="text-sm font-medium text-gray-900">{companyData.part3.item10_directors_executives_governance.board_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Independent Directors:</span>
                <span className="text-sm font-medium text-gray-900">{companyData.part3.item10_directors_executives_governance.independent_directors}</span>
              </div>
              <div>
                <span className="text-sm text-gray-700">Committees:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {companyData.part3.item10_directors_executives_governance.committees.map((committee, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {committee}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Leadership</h3>
            <div className="space-y-3">
              {companyData.part3.item11_executive_compensation.summary_compensation_table.map((executive, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{executive.name}</div>
                    <div className="text-xs text-gray-700">{executive.title}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(executive.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cybersecurity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cybersecurity Program</h3>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-700 font-medium">No Material Incidents</span>
            </div>
          </div>
          <p className="text-sm text-gray-800 mb-4">{companyData.part1.item1c_cybersecurity.program}</p>
          <div className="text-sm text-gray-700">
            <strong className="text-gray-900">Incident Response:</strong> {companyData.part1.item1c_cybersecurity.incident_response}
          </div>
        </div>
      </div>
    </div>
  );
}
