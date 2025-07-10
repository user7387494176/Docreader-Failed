import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface DropZoneProps {
  onFilesDrop: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDrop, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesDrop(files);
    }
  }, [onFilesDrop]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesDrop(files);
    }
  }, [onFilesDrop]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out
        ${isDragOver 
          ? 'border-coral-400 bg-coral-50 scale-105 shadow-lg' 
          : 'border-coral-200 hover:border-coral-300 hover:bg-coral-25'
        }
        ${isProcessing ? 'pointer-events-none opacity-50' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.epub,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
        aria-label="Upload document files"
      />
      
      <div className="flex flex-col items-center space-y-4">
        {isProcessing ? (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-coral-500" aria-label="Processing file"></div>
        ) : (
          <div className={`transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
            <Upload className="h-16 w-16 text-coral-400" aria-hidden="true" />
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-salmon-700">
            {isProcessing ? 'Processing...' : 'Drop your documents here'}
          </h3>
          <p className="text-salmon-600 max-w-md">
            {isProcessing 
              ? 'Please wait while we process your document...'
              : 'Drag and drop PDF, EPUB, or TXT files, or click to browse'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-salmon-500">
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>PDF</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>EPUB</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>TXT</span>
          </div>
        </div>
      </div>
    </div>
  );
};