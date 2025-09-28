'use client';

import { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { documentApi } from '@/lib/api';
import { UnifiedProcessingResponse, ProcessedRequirement } from '@/types/api';

interface DocumentProcessorProps {
  onProcessingComplete: (result: UnifiedProcessingResponse) => void;
  onRequirementsLoaded: (requirements: ProcessedRequirement[]) => void;
  onRefreshStoredData?: () => void;
}

export default function DocumentProcessor({ onProcessingComplete, onRequirementsLoaded, onRefreshStoredData }: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingStatus('Uploading document...');

    try {
      setProcessingStatus('Processing document through complete pipeline...');
      
      const result = await documentApi.processComplete(selectedFile);
      
      setProcessingStatus('Processing completed successfully!');
      
      // Extract all requirements from organized groups
      const allRequirements: ProcessedRequirement[] = [];
      result.organized_requirements.forEach(group => {
        allRequirements.push(...group.requirements);
      });
      
        onProcessingComplete(result);
        onRequirementsLoaded(allRequirements);
        
        // Refresh stored data if callback provided
        if (onRefreshStoredData) {
          onRefreshStoredData();
        }
      
    } catch (err: any) {
      console.error('Processing failed:', err);
      setError(err.response?.data?.detail || err.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadExisting = async () => {
    setIsProcessing(true);
    setError('');
    setProcessingStatus('Loading existing organized requirements...');

    try {
      const result = await documentApi.getFinalOrganized();
      
      if (result.success && result.organized_requirements.length > 0) {
        // Extract all requirements from organized groups
        const allRequirements: ProcessedRequirement[] = [];
        result.organized_requirements.forEach(group => {
          allRequirements.push(...group.requirements);
        });
        
        onRequirementsLoaded(allRequirements);
        setProcessingStatus('Existing requirements loaded successfully!');
        
        // Refresh stored data if callback provided
        if (onRefreshStoredData) {
          onRefreshStoredData();
        }
      } else {
        setError('No organized requirements found. Please process a document first.');
      }
    } catch (err: any) {
      console.error('Loading failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load existing requirements');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Document Processing
        </h3>
        
        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOCX, or TXT up to 10MB</p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-400 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                  <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-blue-400 mr-2 animate-spin" />
              <p className="text-sm text-blue-700">{processingStatus}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleProcessDocument}
            disabled={!selectedFile || isProcessing}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Process Document'}
          </button>
          
          <button
            onClick={handleLoadExisting}
            disabled={isProcessing}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Load Existing
          </button>
        </div>

        {/* Processing Info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            <strong>Complete Pipeline:</strong> Upload → Extract → Cluster → Harmonize → Organize with LLM
          </p>
          <p>
            <strong>Processing Time:</strong> Typically 30-120 seconds depending on document size
          </p>
        </div>
      </div>
    </div>
  );
}
