import React, { useState, useEffect } from 'react';
import { BookOpen, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DocumentFile } from '../types/documents';

interface DocumentViewerProps {
  document: DocumentFile;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handleReset = () => {
    setFontSize(16);
    setLineHeight(1.6);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2">
        {line.trim() || '\u00A0'}
      </p>
    ));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-coral-500 to-salmon-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg truncate max-w-md">
                {document.name}
              </h2>
              <p className="text-coral-100 text-sm">
                {document.type.toUpperCase()} • {(document.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-white text-sm font-medium px-2">
              {fontSize}px
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="h-96 overflow-y-auto p-6 bg-gradient-to-br from-orange-25 to-coral-25">
        <div 
          className="prose prose-salmon max-w-none"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: '#4a4a4a'
          }}
        >
          {formatContent(document.content)}
        </div>
      </div>
    </div>
  );
};