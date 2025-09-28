'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CpuChipIcon, 
  BoltIcon,
  PlayIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentApi, ruleApi, systemApi } from '@/lib/api';
import { LegalDocument, PerformanceInfo } from '@/types/api';

type ProcessingMethod = 'pattern' | 'bert' | 'bert-gpu';

export default function RuleExtraction() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('bert-gpu');
  const [processing, setProcessing] = useState(false);
  const [performance, setPerformance] = useState<PerformanceInfo | null>(null);

  useEffect(() => {
    loadDocuments();
    loadPerformanceInfo();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await documentApi.list();
      setDocuments(docs);
    } catch (error: any) {
      toast.error(`Failed to load documents: ${error.message}`);
    }
  };

  const loadPerformanceInfo = async () => {
    try {
      const perf = await systemApi.getPerformanceInfo();
      setPerformance(perf);
    } catch (error) {
      console.error('Failed to load performance info:', error);
    }
  };

  const handleExtractRules = async () => {
    if (!selectedDocument) {
      toast.error('Please select a document');
      return;
    }

    setProcessing(true);
    try {
      let response;
      switch (processingMethod) {
        case 'pattern':
          response = await ruleApi.extract(selectedDocument);
          break;
        case 'bert':
          response = await ruleApi.extractWithBert(selectedDocument);
          break;
        case 'bert-gpu':
          response = await ruleApi.extractWithBertGpu(selectedDocument);
          break;
      }
      
      toast.success(`Successfully extracted ${response.total_rules} rules in ${response.processing_time.toFixed(2)}s`);
      
      // Store the extracted rules for display
      localStorage.setItem('extractedRules', JSON.stringify(response.rules));
      localStorage.setItem('extractionResponse', JSON.stringify(response));
      
      // Redirect to rules page to show the results
      window.location.href = '/rules';
    } catch (error: any) {
      toast.error(`Rule extraction failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getMethodDescription = (method: ProcessingMethod) => {
    switch (method) {
      case 'pattern':
        return 'Basic pattern matching - Fast but limited accuracy';
      case 'bert':
        return 'LegalBERT AI processing - High accuracy with CPU';
      case 'bert-gpu':
        return 'GPU-accelerated LegalBERT - Highest accuracy and speed';
    }
  };

  const getMethodIcon = (method: ProcessingMethod) => {
    switch (method) {
      case 'pattern':
        return DocumentTextIcon;
      case 'bert':
        return CpuChipIcon;
      case 'bert-gpu':
        return BoltIcon;
    }
  };

  const getMethodColor = (method: ProcessingMethod) => {
    switch (method) {
      case 'pattern':
        return 'text-blue-600 bg-blue-100';
      case 'bert':
        return 'text-green-600 bg-green-100';
      case 'bert-gpu':
        return 'text-purple-600 bg-purple-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Extract Compliance Rules
        </h3>

        {/* Document Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Document
          </label>
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Choose a document...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename} ({doc.document_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Processing Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Processing Method
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['pattern', 'bert', 'bert-gpu'] as ProcessingMethod[]).map((method) => {
              const Icon = getMethodIcon(method);
              const color = getMethodColor(method);
              const isSelected = processingMethod === method;
              const isDisabled = method === 'bert-gpu' && performance && !performance.cuda_available;

              return (
                <button
                  key={method}
                  onClick={() => setProcessingMethod(method)}
                  disabled={isDisabled}
                  className={`
                    relative rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:bg-gray-50'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${color.split(' ')[1]}`}>
                      <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {method.replace('-', ' ')}
                        </span>
                        {isSelected && (
                          <CheckCircleIcon className="ml-2 h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getMethodDescription(method)}
                      </p>
                      {isDisabled && (
                        <p className="text-xs text-red-500 mt-1">
                          GPU not available
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance Info */}
        {performance && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">System Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Device:</span>
                <span className="ml-2 font-medium capitalize">
                  {performance.device} {performance.gpu_name && `(${performance.gpu_name})`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">GPU:</span>
                <span className="ml-2 font-medium">
                  {performance.cuda_available ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Extract Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExtractRules}
            disabled={!selectedDocument || processing}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              ${!selectedDocument || processing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
              }
            `}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Extract Rules
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
