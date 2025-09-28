"""
Semantic Clustering Engine for Compliance Requirement Harmonization
Uses NLP to cluster similar requirements and create harmonized compliance framework
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from sklearn.cluster import KMeans, DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import re
from collections import defaultdict

from .models_v3 import (
    ComplianceRequirement, 
    SemanticCluster, 
    HarmonizationResponse
)

class SemanticClusteringEngine:
    """Engine for semantic clustering and harmonization of compliance requirements."""
    
    def __init__(self):
        self.sentence_model = None
        self.vectorizer = None
        self._initialize_models()
        
        # Clustering parameters
        self.min_cluster_size = 2
        self.similarity_threshold = 0.7
        self.max_clusters = 20
    
    def _initialize_models(self):
        """Initialize NLP models for semantic analysis."""
        try:
            # Load sentence transformer for semantic similarity
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Sentence transformer model loaded successfully")
        except Exception as e:
            print(f"⚠️ Sentence transformer not available: {e}")
            self.sentence_model = None
        
        # Initialize TF-IDF vectorizer as fallback
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3)
        )
    
    def cluster_requirements(self, requirements: List[ComplianceRequirement]) -> List[SemanticCluster]:
        """Cluster requirements based on semantic similarity."""
        if not requirements:
            return []
        
        # Prepare text for clustering
        texts = self._prepare_texts_for_clustering(requirements)
        
        # Generate embeddings
        embeddings = self._generate_embeddings(texts)
        
        # Perform clustering
        cluster_labels = self._perform_clustering(embeddings)
        
        # Create clusters
        clusters = self._create_clusters(requirements, cluster_labels, embeddings)
        
        return clusters
    
    def harmonize_requirements(self, requirements: List[ComplianceRequirement]) -> HarmonizationResponse:
        """Harmonize requirements by clustering and creating unified requirements."""
        # Cluster requirements
        clusters = self.cluster_requirements(requirements)
        
        # Create harmonized requirements
        harmonized_requirements = []
        for cluster in clusters:
            if cluster.requirements:
                harmonized_req = self._create_harmonized_requirement(cluster.requirements)
                harmonized_requirements.append(harmonized_req)
                cluster.harmonized_requirement = harmonized_req
        
        # Calculate harmonization ratio
        original_count = len(requirements)
        harmonized_count = len(harmonized_requirements)
        harmonization_ratio = harmonized_count / original_count if original_count > 0 else 0
        
        return HarmonizationResponse(
            original_requirements=requirements,
            clusters=clusters,
            harmonized_requirements=harmonized_requirements,
            total_clusters=len(clusters),
            harmonization_ratio=harmonization_ratio
        )
    
    def _prepare_texts_for_clustering(self, requirements: List[ComplianceRequirement]) -> List[str]:
        """Prepare text representations for clustering."""
        texts = []
        
        for req in requirements:
            # Combine key elements for clustering
            text_parts = [
                req.policy,
                req.actor,
                req.requirement,
                req.trigger
            ]
            
            # Filter out None values and join
            text = " ".join([part for part in text_parts if part])
            texts.append(text)
        
        return texts
    
    def _generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for text clustering."""
        if self.sentence_model:
            # Use sentence transformer for better semantic understanding
            embeddings = self.sentence_model.encode(texts)
            return embeddings
        else:
            # Fallback to TF-IDF
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            return tfidf_matrix.toarray()
    
    def _perform_clustering(self, embeddings: np.ndarray) -> np.ndarray:
        """Perform clustering on embeddings."""
        if len(embeddings) < 2:
            return np.zeros(len(embeddings), dtype=int)
        
        # Try DBSCAN first for automatic cluster detection
        dbscan = DBSCAN(
            eps=0.3,
            min_samples=self.min_cluster_size,
            metric='cosine'
        )
        cluster_labels = dbscan.fit_predict(embeddings)
        
        # If DBSCAN doesn't find clusters, use KMeans
        if len(set(cluster_labels)) <= 1:
            n_clusters = min(len(embeddings) // 2, self.max_clusters)
            if n_clusters > 1:
                kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                cluster_labels = kmeans.fit_predict(embeddings)
        
        return cluster_labels
    
    def _create_clusters(self, requirements: List[ComplianceRequirement], 
                        cluster_labels: np.ndarray, 
                        embeddings: np.ndarray) -> List[SemanticCluster]:
        """Create semantic clusters from clustering results."""
        clusters = []
        cluster_dict = defaultdict(list)
        
        # Group requirements by cluster
        for i, label in enumerate(cluster_labels):
            cluster_dict[label].append((i, requirements[i]))
        
        # Create cluster objects
        for cluster_id, req_indices in cluster_dict.items():
            if cluster_id == -1:  # Skip noise points
                continue
            
            cluster_requirements = [req for _, req in req_indices]
            
            # Calculate cluster similarity
            similarity_score = self._calculate_cluster_similarity(
                cluster_requirements, embeddings, req_indices
            )
            
            # Generate cluster name
            cluster_name = self._generate_cluster_name(cluster_requirements)
            
            cluster = SemanticCluster(
                cluster_id=f"CLUSTER-{cluster_id}",
                cluster_name=cluster_name,
                requirements=cluster_requirements,
                similarity_score=similarity_score
            )
            
            clusters.append(cluster)
        
        return clusters
    
    def _calculate_cluster_similarity(self, requirements: List[ComplianceRequirement], 
                                     embeddings: np.ndarray, 
                                     req_indices: List[Tuple[int, ComplianceRequirement]]) -> float:
        """Calculate average similarity within cluster."""
        if len(req_indices) < 2:
            return 1.0
        
        # Get embeddings for this cluster
        cluster_embeddings = np.array([embeddings[i] for i, _ in req_indices])
        
        # Calculate pairwise similarities
        similarities = cosine_similarity(cluster_embeddings)
        
        # Return average similarity (excluding diagonal)
        mask = np.ones(similarities.shape, dtype=bool)
        np.fill_diagonal(mask, False)
        return float(np.mean(similarities[mask]))
    
    def _generate_cluster_name(self, requirements: List[ComplianceRequirement]) -> str:
        """Generate descriptive name for cluster."""
        if not requirements:
            return "Unknown Cluster"
        
        # Extract common themes
        policies = [req.policy for req in requirements]
        actors = [req.actor for req in requirements]
        requirements_text = [req.requirement for req in requirements]
        
        # Find most common policy
        policy_counts = defaultdict(int)
        for policy in policies:
            # Extract framework name
            if 'Securities Exchange Act' in policy:
                policy_counts['SEC'] += 1
            elif 'Sarbanes-Oxley' in policy or 'SOX' in policy:
                policy_counts['SOX'] += 1
            elif 'Dodd-Frank' in policy:
                policy_counts['Dodd-Frank'] += 1
            else:
                policy_counts['Other'] += 1
        
        most_common_policy = max(policy_counts, key=policy_counts.get)
        
        # Find most common actor type
        actor_counts = defaultdict(int)
        for actor in actors:
            if 'beneficial owner' in actor.lower():
                actor_counts['Beneficial Owners'] += 1
            elif 'executive' in actor.lower():
                actor_counts['Executive Officers'] += 1
            elif 'director' in actor.lower():
                actor_counts['Directors'] += 1
            elif 'registrant' in actor.lower():
                actor_counts['Registrants'] += 1
            else:
                actor_counts['Other'] += 1
        
        most_common_actor = max(actor_counts, key=actor_counts.get)
        
        # Find common requirement type
        req_counts = defaultdict(int)
        for req_text in requirements_text:
            if 'report' in req_text.lower():
                req_counts['Reporting'] += 1
            elif 'disclose' in req_text.lower():
                req_counts['Disclosure'] += 1
            elif 'file' in req_text.lower():
                req_counts['Filing'] += 1
            elif 'maintain' in req_text.lower():
                req_counts['Maintenance'] += 1
            else:
                req_counts['Other'] += 1
        
        most_common_req = max(req_counts, key=req_counts.get)
        
        return f"{most_common_policy} - {most_common_actor} - {most_common_req}"
    
    def _create_harmonized_requirement(self, requirements: List[ComplianceRequirement]) -> ComplianceRequirement:
        """Create harmonized requirement from cluster."""
        if not requirements:
            return None
        
        if len(requirements) == 1:
            return requirements[0]
        
        # Harmonize policy (use most specific)
        policies = [req.policy for req in requirements]
        harmonized_policy = self._harmonize_policy(policies)
        
        # Harmonize actor (use most specific)
        actors = [req.actor for req in requirements]
        harmonized_actor = self._harmonize_actor(actors)
        
        # Harmonize requirement (combine common elements)
        req_texts = [req.requirement for req in requirements]
        harmonized_requirement = self._harmonize_requirement_text(req_texts)
        
        # Harmonize trigger (use most restrictive)
        triggers = [req.trigger for req in requirements]
        harmonized_trigger = self._harmonize_trigger(triggers)
        
        # Harmonize deadline (use most restrictive)
        deadlines = [req.deadline for req in requirements if req.deadline]
        harmonized_deadline = self._harmonize_deadline(deadlines)
        
        # Harmonize penalty (combine all penalties)
        penalties = [req.penalty for req in requirements if req.penalty]
        harmonized_penalty = self._harmonize_penalty(penalties)
        
        # Calculate average confidence
        avg_confidence = sum(req.confidence_score for req in requirements) / len(requirements)
        
        # Combine mapped controls
        all_controls = []
        for req in requirements:
            all_controls.extend(req.mapped_controls)
        
        # Remove duplicates
        unique_controls = list({control.control_id: control for control in all_controls}.values())
        
        return ComplianceRequirement(
            policy=harmonized_policy,
            actor=harmonized_actor,
            requirement=harmonized_requirement,
            trigger=harmonized_trigger,
            deadline=harmonized_deadline,
            penalty=harmonized_penalty,
            mapped_controls=unique_controls,
            confidence_score=avg_confidence,
            source_text=f"Harmonized from {len(requirements)} requirements",
            regulatory_framework=self._identify_common_framework(requirements),
            risk_level=self._assess_harmonized_risk(requirements),
            business_impact=self._assess_harmonized_impact(requirements)
        )
    
    def _harmonize_policy(self, policies: List[str]) -> str:
        """Harmonize policy names."""
        # Use the most specific policy
        if not policies:
            return "General Compliance Requirement"
        
        # Prefer policies with specific sections
        specific_policies = [p for p in policies if 'Section' in p or 'Rule' in p]
        if specific_policies:
            return specific_policies[0]
        
        return policies[0]
    
    def _harmonize_actor(self, actors: List[str]) -> str:
        """Harmonize actor descriptions."""
        if not actors:
            return "Covered Entity"
        
        # Use the most specific actor
        specific_actors = [a for a in actors if len(a) > 20]
        if specific_actors:
            return specific_actors[0]
        
        return actors[0]
    
    def _harmonize_requirement_text(self, req_texts: List[str]) -> str:
        """Harmonize requirement text."""
        if not req_texts:
            return "Compliance requirement"
        
        # Find common elements
        common_words = set(req_texts[0].lower().split())
        for text in req_texts[1:]:
            common_words &= set(text.lower().split())
        
        # Use the longest text that contains common elements
        longest_text = max(req_texts, key=len)
        return longest_text
    
    def _harmonize_trigger(self, triggers: List[str]) -> str:
        """Harmonize trigger conditions."""
        if not triggers:
            return "Upon occurrence of triggering event"
        
        # Use the most restrictive trigger
        restrictive_triggers = [t for t in triggers if 'within' in t.lower() or 'immediately' in t.lower()]
        if restrictive_triggers:
            return restrictive_triggers[0]
        
        return triggers[0]
    
    def _harmonize_deadline(self, deadlines: List[str]) -> Optional[str]:
        """Harmonize deadlines."""
        if not deadlines:
            return None
        
        # Use the most restrictive deadline
        restrictive_deadlines = [d for d in deadlines if 'immediately' in d.lower()]
        if restrictive_deadlines:
            return restrictive_deadlines[0]
        
        # Look for shortest time period
        time_deadlines = [d for d in deadlines if re.search(r'\d+', d)]
        if time_deadlines:
            return min(time_deadlines, key=lambda x: int(re.search(r'\d+', x).group()))
        
        return deadlines[0]
    
    def _harmonize_penalty(self, penalties: List[str]) -> Optional[str]:
        """Harmonize penalty information."""
        if not penalties:
            return None
        
        # Combine all penalties
        return "; ".join(penalties)
    
    def _identify_common_framework(self, requirements: List[ComplianceRequirement]) -> Optional[str]:
        """Identify common regulatory framework."""
        frameworks = [req.regulatory_framework for req in requirements if req.regulatory_framework]
        if not frameworks:
            return None
        
        # Return most common framework
        from collections import Counter
        framework_counts = Counter(frameworks)
        return framework_counts.most_common(1)[0][0]
    
    def _assess_harmonized_risk(self, requirements: List[ComplianceRequirement]) -> str:
        """Assess risk level for harmonized requirement."""
        risk_levels = [req.risk_level for req in requirements if req.risk_level]
        if not risk_levels:
            return "Medium"
        
        # Use highest risk level
        risk_priority = {"High": 3, "Medium": 2, "Low": 1}
        max_risk = max(risk_levels, key=lambda x: risk_priority.get(x, 2))
        return max_risk
    
    def _assess_harmonized_impact(self, requirements: List[ComplianceRequirement]) -> str:
        """Assess business impact for harmonized requirement."""
        impacts = [req.business_impact for req in requirements if req.business_impact]
        if not impacts:
            return "Medium"
        
        # Use highest impact level
        impact_priority = {"High": 3, "Medium": 2, "Low": 1}
        max_impact = max(impacts, key=lambda x: impact_priority.get(x, 2))
        return max_impact
