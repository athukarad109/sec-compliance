import Layout from '@/components/Layout';
import RuleExtraction from '@/components/RuleExtraction';
import RuleList from '@/components/RuleList';
import ExtractedRulesDisplay from '@/components/ExtractedRulesDisplay';

export default function RulesPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rule Extraction</h1>
          <p className="mt-1 text-sm text-gray-500">
            Extract compliance rules from uploaded documents using AI-powered processing
          </p>
        </div>

        {/* Rule Extraction */}
        <RuleExtraction />

        {/* Check if we have extracted rules to display */}
        <ExtractedRulesDisplay 
          rules={[]} // This will be populated by the component itself
          processingTime={0}
          documentId=""
        />

        {/* Rule List */}
        <RuleList />
      </div>
    </Layout>
  );
}
