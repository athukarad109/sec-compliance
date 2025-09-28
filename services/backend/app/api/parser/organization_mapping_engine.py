"""
Organization Mapping and Gap Analysis Engine
Maps compliance requirements to organizational structure and performs gap analysis
"""

from typing import List, Dict, Optional, Tuple
import re
from datetime import datetime
from collections import defaultdict

from .models_v3 import (
    ComplianceRequirement,
    OrganizationMapping,
    GapAnalysis,
    GapAnalysisResponse,
    MappedControl,
    ControlStatus,
    ControlCategory
)

class OrganizationMappingEngine:
    """Engine for mapping compliance requirements to organizational structure and gap analysis."""
    
    def __init__(self):
        # Static organizational data (as specified - static for now)
        self.organizational_data = self._initialize_organizational_data()
        
        # Mapping rules for actors to organizational roles
        self.actor_role_mapping = {
            'beneficial owner': ['Board Members', 'Executive Officers', 'Major Shareholders'],
            'executive officer': ['CEO', 'CFO', 'COO', 'CCO', 'CRO'],
            'director': ['Board Members', 'Independent Directors', 'Audit Committee Members'],
            'registrant': ['Public Company', 'Issuer', 'Reporting Entity'],
            'issuer': ['Public Company', 'Issuer', 'Reporting Entity'],
            'reporting company': ['Public Company', 'Issuer', 'Reporting Entity'],
            'public company': ['Public Company', 'Issuer', 'Reporting Entity'],
            'accelerated filer': ['Large Public Company', 'Accelerated Filer'],
            'large accelerated filer': ['Large Public Company', 'Large Accelerated Filer'],
            'smaller reporting company': ['Small Public Company', 'Smaller Reporting Company'],
            'foreign private issuer': ['Foreign Company', 'Foreign Private Issuer'],
            'asset-backed issuer': ['Asset-Backed Issuer', 'Securitization Entity'],
            'investment company': ['Investment Company', 'Mutual Fund', 'ETF'],
            'investment adviser': ['Investment Adviser', 'Asset Manager'],
            'broker-dealer': ['Broker-Dealer', 'Securities Firm'],
            'transfer agent': ['Transfer Agent', 'Securities Services'],
            'clearing agency': ['Clearing Agency', 'Settlement Services'],
            'self-regulatory organization': ['SRO', 'Exchange', 'SRO Member'],
            'covered person': ['Covered Person', 'Regulated Entity'],
            'covered entity': ['Covered Entity', 'Regulated Entity']
        }
        
        # Business unit mapping
        self.role_unit_mapping = {
            'CEO': 'Executive Office',
            'CFO': 'Finance & Accounting',
            'COO': 'Operations',
            'CCO': 'Legal & Compliance',
            'CRO': 'Risk Management',
            'Board Members': 'Board of Directors',
            'Executive Officers': 'Executive Office',
            'Audit Committee Members': 'Audit Committee',
            'Public Company': 'Corporate',
            'Issuer': 'Corporate',
            'Reporting Entity': 'Corporate',
            'Large Public Company': 'Corporate',
            'Small Public Company': 'Corporate',
            'Foreign Company': 'International',
            'Investment Company': 'Investment Management',
            'Investment Adviser': 'Investment Management',
            'Broker-Dealer': 'Trading & Sales',
            'Transfer Agent': 'Securities Services',
            'Clearing Agency': 'Settlement Services',
            'SRO': 'Regulatory Affairs',
            'Covered Person': 'Compliance',
            'Covered Entity': 'Compliance'
        }
        
        # Existing controls database (static for now)
        self.existing_controls = self._initialize_existing_controls()
    
    def _initialize_organizational_data(self) -> Dict:
        """Initialize static organizational data."""
        return {
            'roles': [
                'CEO', 'CFO', 'COO', 'CCO', 'CRO', 'Board Members', 
                'Executive Officers', 'Audit Committee Members',
                'Public Company', 'Issuer', 'Reporting Entity',
                'Large Public Company', 'Small Public Company',
                'Foreign Company', 'Investment Company', 'Investment Adviser',
                'Broker-Dealer', 'Transfer Agent', 'Clearing Agency',
                'SRO', 'Covered Person', 'Covered Entity'
            ],
            'business_units': [
                'Executive Office', 'Finance & Accounting', 'Operations',
                'Legal & Compliance', 'Risk Management', 'Board of Directors',
                'Audit Committee', 'Corporate', 'International',
                'Investment Management', 'Trading & Sales', 'Securities Services',
                'Settlement Services', 'Regulatory Affairs', 'Compliance'
            ],
            'governance_structure': [
                'Board of Directors', 'Audit Committee', 'Risk Committee',
                'Compensation Committee', 'Nominating Committee',
                'Executive Committee', 'Compliance Committee'
            ],
            'capabilities': {
                'reporting': ['Financial Reporting', 'Regulatory Reporting', 'Disclosure Management'],
                'compliance': ['Policy Management', 'Training', 'Monitoring', 'Testing'],
                'governance': ['Board Management', 'Committee Management', 'Policy Governance'],
                'risk_management': ['Risk Assessment', 'Risk Monitoring', 'Risk Reporting'],
                'audit': ['Internal Audit', 'External Audit', 'Audit Management']
            }
        }
    
    def _initialize_existing_controls(self) -> List[MappedControl]:
        """Initialize existing controls database."""
        return [
            MappedControl(
                control_id="SEC-001",
                category=ControlCategory.FINANCIAL_REPORTING,
                status=ControlStatus.IMPLEMENTED,
                description="Annual 10-K filing process",
                responsible_party="CFO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="SEC-002",
                category=ControlCategory.DISCLOSURE,
                status=ControlStatus.IMPLEMENTED,
                description="Quarterly 10-Q filing process",
                responsible_party="CFO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="SEC-003",
                category=ControlCategory.INSIDER_REPORTING,
                status=ControlStatus.IMPLEMENTED,
                description="Section 16 insider trading reporting",
                responsible_party="CCO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="SOX-001",
                category=ControlCategory.GOVERNANCE,
                status=ControlStatus.IMPLEMENTED,
                description="SOX 404 internal controls",
                responsible_party="CFO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="SOX-002",
                category=ControlCategory.GOVERNANCE,
                status=ControlStatus.IMPLEMENTED,
                description="CEO/CFO certification process",
                responsible_party="CEO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="RISK-001",
                category=ControlCategory.RISK_MANAGEMENT,
                status=ControlStatus.IMPLEMENTED,
                description="Enterprise risk management framework",
                responsible_party="CRO",
                last_reviewed=datetime.now()
            ),
            MappedControl(
                control_id="COMP-001",
                category=ControlCategory.COMPLIANCE,
                status=ControlStatus.IMPLEMENTED,
                description="Compliance monitoring and testing",
                responsible_party="CCO",
                last_reviewed=datetime.now()
            )
        ]
    
    def map_requirements_to_organization(self, requirements: List[ComplianceRequirement]) -> List[OrganizationMapping]:
        """Map compliance requirements to organizational structure."""
        mappings = []
        
        for req in requirements:
            mapping = self._map_single_requirement(req)
            mappings.append(mapping)
        
        return mappings
    
    def _map_single_requirement(self, requirement: ComplianceRequirement) -> OrganizationMapping:
        """Map a single requirement to organizational structure."""
        # Map actor to organizational roles
        mapped_roles = self._map_actor_to_roles(requirement.actor)
        
        # Determine responsible business unit
        responsible_unit = self._determine_responsible_unit(mapped_roles)
        
        # Find existing controls
        existing_controls = self._find_existing_controls(requirement)
        
        # Assess capabilities
        capability_assessment = self._assess_capabilities(requirement, mapped_roles)
        
        return OrganizationMapping(
            requirement_id=requirement.policy,  # Using policy as ID for now
            actor=requirement.actor,
            mapped_roles=mapped_roles,
            responsible_unit=responsible_unit,
            existing_controls=existing_controls,
            capability_assessment=capability_assessment
        )
    
    def _map_actor_to_roles(self, actor: str) -> List[str]:
        """Map actor to organizational roles."""
        actor_lower = actor.lower()
        mapped_roles = []
        
        for key, roles in self.actor_role_mapping.items():
            if key in actor_lower:
                mapped_roles.extend(roles)
        
        # If no specific mapping found, use default
        if not mapped_roles:
            mapped_roles = ['Covered Entity']
        
        return list(set(mapped_roles))  # Remove duplicates
    
    def _determine_responsible_unit(self, roles: List[str]) -> str:
        """Determine responsible business unit based on roles."""
        for role in roles:
            if role in self.role_unit_mapping:
                return self.role_unit_mapping[role]
        
        return 'Compliance'  # Default unit
    
    def _find_existing_controls(self, requirement: ComplianceRequirement) -> List[str]:
        """Find existing controls that might apply to the requirement."""
        applicable_controls = []
        
        # Check for policy matches
        for control in self.existing_controls:
            if self._is_control_applicable(requirement, control):
                applicable_controls.append(control.control_id)
        
        return applicable_controls
    
    def _is_control_applicable(self, requirement: ComplianceRequirement, control: MappedControl) -> bool:
        """Check if a control is applicable to a requirement."""
        # Check policy alignment
        if 'SEC' in requirement.policy and 'SEC' in control.control_id:
            return True
        
        if 'SOX' in requirement.policy and 'SOX' in control.control_id:
            return True
        
        # Check requirement type alignment
        req_lower = requirement.requirement.lower()
        if 'report' in req_lower and control.category == ControlCategory.FINANCIAL_REPORTING:
            return True
        
        if 'disclose' in req_lower and control.category == ControlCategory.DISCLOSURE:
            return True
        
        if 'insider' in req_lower and control.category == ControlCategory.INSIDER_REPORTING:
            return True
        
        return False
    
    def _assess_capabilities(self, requirement: ComplianceRequirement, roles: List[str]) -> Dict:
        """Assess organizational capabilities for the requirement."""
        capabilities = {
            'current_capability': 'Unknown',
            'required_capability': 'High',
            'gap_identified': False,
            'capability_gaps': [],
            'readiness_level': 'Low'
        }
        
        # Assess based on requirement type
        req_lower = requirement.requirement.lower()
        
        if 'report' in req_lower:
            capabilities['required_capability'] = 'High'
            capabilities['capability_gaps'] = ['Automated Reporting', 'Data Quality Controls']
        
        if 'disclose' in req_lower:
            capabilities['required_capability'] = 'Medium'
            capabilities['capability_gaps'] = ['Disclosure Management', 'Review Process']
        
        if 'file' in req_lower:
            capabilities['required_capability'] = 'High'
            capabilities['capability_gaps'] = ['Filing Process', 'Deadline Management']
        
        # Assess based on roles
        if 'CEO' in roles or 'CFO' in roles:
            capabilities['current_capability'] = 'High'
            capabilities['readiness_level'] = 'High'
        elif 'Board Members' in roles:
            capabilities['current_capability'] = 'Medium'
            capabilities['readiness_level'] = 'Medium'
        else:
            capabilities['current_capability'] = 'Low'
            capabilities['readiness_level'] = 'Low'
        
        # Identify gaps
        if capabilities['current_capability'] != capabilities['required_capability']:
            capabilities['gap_identified'] = True
        
        return capabilities
    
    def perform_gap_analysis(self, requirements: List[ComplianceRequirement]) -> GapAnalysisResponse:
        """Perform comprehensive gap analysis."""
        gap_analyses = []
        
        for req in requirements:
            gap_analysis = self._analyze_single_requirement_gap(req)
            gap_analyses.append(gap_analysis)
        
        # Calculate summary statistics
        total_gaps = len(gap_analyses)
        high_priority_gaps = len([g for g in gap_analyses if g.priority == 'High'])
        medium_priority_gaps = len([g for g in gap_analyses if g.priority == 'Medium'])
        low_priority_gaps = len([g for g in gap_analyses if g.priority == 'Low'])
        
        # Calculate overall compliance score
        compliance_score = self._calculate_compliance_score(gap_analyses)
        
        return GapAnalysisResponse(
            requirements=requirements,
            gap_analyses=gap_analyses,
            total_gaps=total_gaps,
            high_priority_gaps=high_priority_gaps,
            medium_priority_gaps=medium_priority_gaps,
            low_priority_gaps=low_priority_gaps,
            overall_compliance_score=compliance_score
        )
    
    def _analyze_single_requirement_gap(self, requirement: ComplianceRequirement) -> GapAnalysis:
        """Analyze gap for a single requirement."""
        # Map to organization
        mapping = self._map_single_requirement(requirement)
        
        # Assess current state
        current_state = self._assess_current_state(requirement, mapping)
        
        # Identify gaps
        gaps = self._identify_gaps(requirement, mapping, current_state)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(requirement, gaps)
        
        # Determine priority
        priority = self._determine_priority(requirement, gaps)
        
        # Estimate effort
        effort = self._estimate_effort(requirement, gaps)
        
        return GapAnalysis(
            requirement_id=requirement.policy,
            requirement=requirement,
            current_state=current_state,
            gaps=gaps,
            recommendations=recommendations,
            priority=priority,
            estimated_effort=effort
        )
    
    def _assess_current_state(self, requirement: ComplianceRequirement, mapping: OrganizationMapping) -> Dict:
        """Assess current organizational state for the requirement."""
        return {
            'existing_controls': mapping.existing_controls,
            'control_status': 'Partial' if mapping.existing_controls else 'None',
            'responsible_unit': mapping.responsible_unit,
            'capability_level': mapping.capability_assessment.get('current_capability', 'Unknown'),
            'readiness_level': mapping.capability_assessment.get('readiness_level', 'Low'),
            'implementation_status': 'Partial' if mapping.existing_controls else 'Not Started'
        }
    
    def _identify_gaps(self, requirement: ComplianceRequirement, mapping: OrganizationMapping, current_state: Dict) -> Dict:
        """Identify gaps for the requirement."""
        gaps = {
            'missing_controls': [],
            'control_gaps': [],
            'process_gaps': [],
            'technology_gaps': [],
            'capability_gaps': mapping.capability_assessment.get('capability_gaps', []),
            'governance_gaps': []
        }
        
        # Check for missing controls
        if not mapping.existing_controls:
            gaps['missing_controls'].append(f"Control for {requirement.policy}")
        
        # Check for process gaps
        if 'deadline' in requirement.requirement.lower():
            gaps['process_gaps'].append('Automated deadline tracking')
        
        if 'report' in requirement.requirement.lower():
            gaps['process_gaps'].append('Automated reporting process')
        
        # Check for technology gaps
        if requirement.risk_level == 'High':
            gaps['technology_gaps'].append('Real-time monitoring system')
        
        # Check for governance gaps
        if 'board' in requirement.actor.lower() or 'director' in requirement.actor.lower():
            gaps['governance_gaps'].append('Board oversight process')
        
        return gaps
    
    def _generate_recommendations(self, requirement: ComplianceRequirement, gaps: Dict) -> List[str]:
        """Generate recommendations for addressing gaps."""
        recommendations = []
        
        # Control recommendations
        if gaps['missing_controls']:
            recommendations.append("Implement missing controls for compliance requirement")
        
        # Process recommendations
        if gaps['process_gaps']:
            recommendations.append("Establish automated processes for compliance monitoring")
        
        # Technology recommendations
        if gaps['technology_gaps']:
            recommendations.append("Implement technology solutions for real-time monitoring")
        
        # Governance recommendations
        if gaps['governance_gaps']:
            recommendations.append("Strengthen governance oversight and accountability")
        
        # Capability recommendations
        if gaps['capability_gaps']:
            recommendations.append("Enhance organizational capabilities through training and resources")
        
        return recommendations
    
    def _determine_priority(self, requirement: ComplianceRequirement, gaps: Dict) -> str:
        """Determine priority level for the gap."""
        priority_score = 0
        
        # Risk level impact
        if requirement.risk_level == 'High':
            priority_score += 3
        elif requirement.risk_level == 'Medium':
            priority_score += 2
        else:
            priority_score += 1
        
        # Business impact
        if requirement.business_impact == 'High':
            priority_score += 3
        elif requirement.business_impact == 'Medium':
            priority_score += 2
        else:
            priority_score += 1
        
        # Gap severity
        total_gaps = sum(len(gap_list) for gap_list in gaps.values())
        if total_gaps > 5:
            priority_score += 2
        elif total_gaps > 2:
            priority_score += 1
        
        if priority_score >= 6:
            return 'High'
        elif priority_score >= 4:
            return 'Medium'
        else:
            return 'Low'
    
    def _estimate_effort(self, requirement: ComplianceRequirement, gaps: Dict) -> str:
        """Estimate implementation effort."""
        total_gaps = sum(len(gap_list) for gap_list in gaps.values())
        
        if total_gaps > 5:
            return 'High (6+ months)'
        elif total_gaps > 2:
            return 'Medium (3-6 months)'
        else:
            return 'Low (1-3 months)'
    
    def _calculate_compliance_score(self, gap_analyses: List[GapAnalysis]) -> float:
        """Calculate overall compliance score."""
        if not gap_analyses:
            return 0.0
        
        total_score = 0.0
        
        for gap in gap_analyses:
            # Base score
            base_score = 0.5
            
            # Adjust for existing controls
            if gap.current_state.get('existing_controls'):
                base_score += 0.3
            
            # Adjust for capability level
            capability = gap.current_state.get('capability_level', 'Unknown')
            if capability == 'High':
                base_score += 0.2
            elif capability == 'Medium':
                base_score += 0.1
            
            # Adjust for priority (lower priority = higher score)
            if gap.priority == 'Low':
                base_score += 0.2
            elif gap.priority == 'Medium':
                base_score += 0.1
            
            total_score += min(base_score, 1.0)
        
        return total_score / len(gap_analyses)
