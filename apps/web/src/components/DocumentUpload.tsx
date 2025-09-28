'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentApi } from '@/lib/api';
import { DocumentType } from '@/types/api';

export default function DocumentUpload() {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await documentApi.upload(file);
      toast.success(`Document "${response.filename}" uploaded successfully!`);
      
      // Store the document ID for rule extraction
      localStorage.setItem('lastUploadedDocumentId', response.document_id);
      
      // Show success message with option to extract rules
      toast.success(
        `Document uploaded! Document ID: ${response.document_id}. You can now extract rules.`,
        { duration: 5000 }
      );
      
      // Refresh the page to show the new document
      window.location.reload();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Upload Legal Document
        </h3>
        
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-sm text-gray-600">Uploading document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <p>Drop the file here...</p>
                ) : (
                  <div>
                    <p className="font-medium">Drag and drop a document here, or click to select</p>
                    <p className="text-gray-500 mt-1">Supports PDF, DOCX, and TXT files</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Formats:</h4>
          <div className="flex space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">📄</span>
              PDF Documents
            </div>
            <div className="flex items-center">
              <span className="mr-1">📝</span>
              Word Documents
            </div>
            <div className="flex items-center">
              <span className="mr-1">📃</span>
              Text Files
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                AI-Powered Processing
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your documents will be processed using LegalBERT AI to extract compliance rules, 
                  identify legal entities, and provide confidence scores for each extracted rule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
