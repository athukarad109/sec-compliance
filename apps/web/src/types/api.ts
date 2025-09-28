// API Types matching backend models
export type DocumentType = 'pdf' | 'docx' | 'txt';
export type RuleType = 'obligation' | 'prohibition' | 'condition' | 'reporting_obligation' | 'disclosure_requirement';

export interface LegalDocument {
  id: string;
  filename: string;
  content: string;
  document_type: DocumentType;
  upload_date: string;
  processed: boolean;
  file_size?: number;
}

export interface Requirement {
  action: string;
  deadline?: string;
  entities: string[];
  thresholds?: Record<string, any>;
  conditions: string[];
}

export interface PenaltyInfo {
  late_filing?: string;
  material_misstatement?: string;
  other?: string;
}

export interface LegalEntity {
  text: string;
  label: string;
  confidence: number;
  start_pos: number;
  end_pos: number;
}

export interface ComplianceRule {
  rule_id: string;
  title: string;
  rule_type: RuleType;
  description: string;
  requirements: Requirement[];
  penalties?: PenaltyInfo;
  exceptions: string[];
  source_document: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedComplianceRule extends ComplianceRule {
  legal_entities: LegalEntity[];
  bert_confidence: number;
  extraction_method: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  document_type: DocumentType;
  file_size: number;
  upload_date: string;
  message: string;
}

export interface RuleExtractionResponse {
  document_id: string;
  rules: ComplianceRule[];
  total_rules: number;
  processing_time: number;
  message: string;
}

export interface PerformanceInfo {
  device: string;
  model_loaded: boolean;
  batch_size: number;
  max_length: number;
  cuda_available: boolean;
  gpu_count: number;
  gpu_name?: string;
}

export interface ParserStats {
  total_documents: number;
  processed_documents: number;
  total_rules: number;
  rule_types: Record<string, number>;
  average_confidence: number;
}

export interface LegalEntitiesResponse {
  document_id: string;
  entities: LegalEntity[];
  total_entities: number;
  entity_types: string[];
}

export interface RuleValidationResult {
  rule_id: string;
  is_valid: boolean;
  issues: string[];
  suggestions: string[];
}

// New types for unified endpoint
export interface UnifiedProcessingResponse {
  success: boolean;
  message: string;
  document_id: string;
  filename: string;
  processing_time: number;
  pipeline_results: {
    requirements_extracted: number;
    clusters_created: number;
    harmonized_groups: number;
    llm_organized_groups: number;
    final_confidence: number;
  };
  organized_requirements: OrganizedRequirementGroup[];
  organization_metadata: {
    total_requirements: number;
    total_groups: number;
    categories: string[];
    processing_confidence: number;
  };
  regulatory_frameworks: string[];
  actor_types: string[];
  risk_assessment: {
    high_risk_requirements: number;
    medium_risk_requirements: number;
    low_risk_requirements: number;
    average_confidence: number;
  };
  clusters: any[];
  harmonized: any[];
}

export interface OrganizedRequirementGroup {
  group_id: string;
  category: string;
  group_description: string;
  requirements: ProcessedRequirement[];
}

export interface ProcessedRequirement {
  id: string;
  policy: string;
  actor: string;
  requirement: string;
  trigger: string;
  deadline: string;
  penalty: string;
  mapped_controls: MappedControl[];
}

export interface MappedControl {
  control_id: string;
  category: string;
  status: string;
  description?: string;
}

export interface FinalOrganizedResponse {
  success: boolean;
  message: string;
  organized_requirements: StoredOrganizedGroup[];
  summary: {
    total_groups: number;
    total_requirements: number;
    categories: string[];
    average_confidence: number;
    last_updated: string | null;
  };
}

export interface StoredOrganizedGroup {
  group_id: string;
  category: string;
  group_description: string;
  confidence_score: number;
  created_at: string | null;
  requirements: ProcessedRequirement[];
  requirement_count: number;
}

// Types for stored LLM organized requirements response
export interface StoredLLMOrganizedResponse {
  message: string;
  organized_requirements: StoredLLMOrganizedGroup[];
}

export interface StoredLLMOrganizedGroup {
  id: string;
  groupId: string;
  category: string;
  groupDescription: string;
  requirements: ProcessedRequirement[];
  confidenceScore: number;
  createdAt: string;
}

// Types for requirement clusters API
export interface RequirementCluster {
  id: string;
  clusterId: string;
  policy: string;
  requirements: ClusterRequirement[];
}

export interface ClusterRequirement {
  id: string;
  title: string;
  description: string;
  document_id: string;
  confidence_score: number;
}

export interface RequirementClustersResponse {
  success: boolean;
  total_clusters: number;
  clusters: RequirementCluster[];
}

// Types for gap analyses API
export interface GapAnalysis {
  id: string;
  companyData: any;
  requirementsData: any;
  analysisResults: any;
  findings: any[];
  tasks: any[];
  complianceScore: number;
  createdAt: string;
}

export interface GapAnalysesResponse {
  success: boolean;
  total_analyses: number;
  analyses: GapAnalysis[];
}