import React, { useState } from 'react';
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, Upload, X, Info, Clock, FileCheck } from 'lucide-react';
import { ConversionJob } from '../types/documents';
import { convertFileEnhanced } from '../utils/fileConverter';

interface FileConverterProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FileConverter: React.FC<FileConverterProps> = ({ isVisible, onClose }) => {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionMethod, setConversionMethod] = useState<'advanced' | 'simple'>('advanced');

  const handleFilesDrop = async (files: File[]) => {
    for (const file of files) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension === 'epub' || extension === 'azw3') {
        const job: ConversionJob = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          inputFile: file,
          inputFormat: extension,
          outputFormat: 'pdf',
          status: 'pending',
          progress: 0
        };
        
        setJobs(prev => [...prev, job]);
        
        try {
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, status: 'processing' } : j
          ));

          const outputUrl = await convertFileEnhanced(job, (progress) => {
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, progress } : j
            ));
          });
          
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, status: 'completed', outputUrl, progress: 100 } : j
          ));
        } catch (error) {
          setJobs(prev => prev.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Conversion failed',
              progress: 0
            } : j
          ));
        }
      } else {
        // Show error for unsupported files
        const errorJob: ConversionJob = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          inputFile: file,
          inputFormat: extension || 'unknown',
          outputFormat: 'pdf',
          status: 'error',
          progress: 0,
          error: `Unsupported file format: ${extension}. Only EPUB and AZW3 files are supported.`
        };
        setJobs(prev => [...prev, errorJob]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFilesDrop(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesDrop(files);
  };

  const downloadFile = (job: ConversionJob) => {
    if (job.outputUrl && job.status === 'completed') {
      const link = document.createElement('a');
      link.href = job.outputUrl;
      link.download = job.inputFile.name.replace(/\.[^/.]+$/, '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearJobs = () => {
    // Clean up blob URLs to prevent memory leaks
    jobs.forEach(job => {
      if (job.outputUrl) {
        URL.revokeObjectURL(job.outputUrl);
      }
    });
    setJobs([]);
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearJobs();
    onClose();
  };

  const retryJob = async (job: ConversionJob) => {
    setJobs(prev => prev.map(j => 
      j.id === job.id ? { ...j, status: 'processing', progress: 0, error: undefined } : j
    ));

    try {
      const outputUrl = await convertFileEnhanced(job, (progress) => {
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, progress } : j
        ));
      });
      
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'completed', outputUrl, progress: 100 } : j
      ));
    } catch (error) {
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Conversion failed',
          progress: 0
        } : j
      ));
    }
  };

  const removeJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job?.outputUrl) {
      URL.revokeObjectURL(job.outputUrl);
    }
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (job: ConversionJob) => {
    switch (job.status) {
      case 'pending':
        return 'Waiting...';
      case 'processing':
        return `Converting... ${job.progress}%`;
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (!isVisible) return null;

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'error').length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-coral-500 to-salmon-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 text-white" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-white">Enhanced File Converter</h2>
              <p className="text-coral-100 text-sm">Convert EPUB & AZW3 to PDF with advanced formatting</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            aria-label="Close file converter"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Statistics */}
          {jobs.length > 0 && (
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
                <div className="text-sm text-blue-700">Total Jobs</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{processingJobs}</div>
                <div className="text-sm text-yellow-700">Processing</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Convert EPUB & AZW3 to PDF</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload your EPUB or AZW3 files to convert them to PDF format with enhanced formatting and layout preservation.
            </p>

            {/* Conversion Method Selection */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Conversion Method</h4>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="advanced"
                    checked={conversionMethod === 'advanced'}
                    onChange={(e) => setConversionMethod(e.target.value as 'advanced')}
                    className="mr-2"
                  />
                  <span className="text-sm text-blue-700">Advanced (Better formatting, slower)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="simple"
                    checked={conversionMethod === 'simple'}
                    onChange={(e) => setConversionMethod(e.target.value as 'simple')}
                    className="mr-2"
                  />
                  <span className="text-sm text-blue-700">Simple (Faster, basic formatting)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 relative
              ${isDragOver 
                ? 'border-coral-400 bg-coral-50 scale-105' 
                : 'border-gray-300 hover:border-coral-300 hover:bg-coral-25'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".epub,.azw3"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload EPUB or AZW3 files for conversion"
            />
            
            <Upload className="h-12 w-12 text-coral-400 mx-auto mb-4" aria-hidden="true" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Drop EPUB or AZW3 files here
            </h4>
            <p className="text-gray-600 mb-4">or click to browse</p>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-green-500" />
                <span>EPUB supported</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>AZW3 (limited)</span>
              </div>
            </div>
          </div>

          {/* Conversion Jobs */}
          {jobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-800">Conversion Jobs</h4>
                <button
                  onClick={clearJobs}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  type="button"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {job.inputFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {job.inputFormat.toUpperCase()} → PDF • {(job.inputFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <span className="text-sm text-gray-600 min-w-20">
                          {getStatusText(job)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'processing' && (
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-coral-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {job.status === 'error' && job.error && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {job.error}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2">
                      {job.status === 'completed' && job.outputUrl && (
                        <button
                          onClick={() => downloadFile(job)}
                          className="px-3 py-1 bg-coral-500 hover:bg-coral-600 text-white text-sm rounded-lg transition-colors flex items-center"
                          aria-label={`Download converted PDF: ${job.inputFile.name}`}
                          type="button"
                        >
                          <Download className="h-3 w-3 mr-1" aria-hidden="true" />
                          Download PDF
                        </button>
                      )}
                      
                      {job.status === 'error' && (
                        <button
                          onClick={() => retryJob(job)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center"
                          aria-label={`Retry conversion: ${job.inputFile.name}`}
                          type="button"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                          Retry
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeJob(job.id)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                        aria-label={`Remove job: ${job.inputFile.name}`}
                        type="button"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Supported Features
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Chapter titles and headings</li>
                <li>• Paragraph formatting</li>
                <li>• Text justification</li>
                <li>• Metadata preservation</li>
                <li>• Table of contents</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Limitations
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Images are not converted</li>
                <li>• Complex layouts may be simplified</li>
                <li>• AZW3 files with DRM cannot be converted</li>
                <li>• Large files may take several minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};