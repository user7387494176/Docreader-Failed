import React, { useState } from 'react';
import { FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { DropZone } from './components/DropZone';
import { AdvancedDocumentViewer } from './components/AdvancedDocumentViewer';
import { FileConverter } from './components/FileConverter';
import { MiniModules } from './components/MiniModules';
import { ProductivityProvider } from './components/ProductivityContext';
import { DocumentFile } from './types/documents';
import { readDocumentFile } from './utils/fileReaders';

function App() {
  const [currentDocument, setCurrentDocument] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [expandedModule, setExpandedModule] = useState<'time' | 'pomodoro' | 'music' | null>(null);

  const handleFilesDrop = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Process first file only
    setIsProcessing(true);
    setError(null);
    
    try {
      const documentFile = await readDocumentFile(file);
      setCurrentDocument(documentFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewDocument = () => {
    setCurrentDocument(null);
    setError(null);
  };

  const handleConverterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConverter(true);
  };

  const handleExpandModule = (module: 'time' | 'pomodoro' | 'music') => {
    setExpandedModule(module);
  };

  return (
    <ProductivityProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-coral-50 to-salmon-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-coral-100">
          <div className="w-full px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-coral-500 to-salmon-500 rounded-xl">
                  <FileText className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-salmon-800">Document Reader</h1>
                  <p className="text-salmon-600">Advanced document reader with text-to-speech</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleConverterClick}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center"
                  aria-label="Open file converter"
                >
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  File Converter
                </button>
                
                {currentDocument && (
                  <button
                    onClick={handleNewDocument}
                    className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-colors font-medium"
                    aria-label="Load new document"
                  >
                    New Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="w-full px-6 py-8 h-[calc(100vh-120px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 max-w-6xl mx-auto">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="text-red-700">
                <p className="font-medium">Error processing file</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!currentDocument ? (
            <div className="max-w-6xl mx-auto">
              <DropZone onFilesDrop={handleFilesDrop} isProcessing={isProcessing} />
              
              <div className="mt-8 text-center">
                <h2 className="text-xl font-semibold text-salmon-700 mb-4">
                  Advanced Document Reader Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">File Support</h3>
                    <p className="text-sm text-salmon-600">PDF, EPUB, TXT with drag & drop</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">Advanced Navigation</h3>
                    <p className="text-sm text-salmon-600">Page thumbnails, search, bookmarks</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">Annotation Tools</h3>
                    <p className="text-sm text-salmon-600">Highlight, draw, comment, markup</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">Smart Text-to-Speech</h3>
                    <p className="text-sm text-salmon-600">Select text and listen with highlighting</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">View Modes</h3>
                    <p className="text-sm text-salmon-600">Single/double page, fit options</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">Zoom & Print</h3>
                    <p className="text-sm text-salmon-600">Advanced zoom, print, download</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">File Converter</h3>
                    <p className="text-sm text-salmon-600">EPUB/AZW3 to PDF conversion</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-coral-100">
                    <h3 className="font-medium text-salmon-700 mb-2">Productivity Tools</h3>
                    <p className="text-sm text-salmon-600">Pomodoro timer, music player, time tracking</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Need to convert EPUB or AZW3 files? 
                    <button 
                      onClick={handleConverterClick}
                      className="ml-1 text-blue-800 font-medium hover:underline"
                      aria-label="Open file converter"
                    >
                      Use our File Converter!
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <AdvancedDocumentViewer document={currentDocument} />
            </div>
          )}

          {/* Mini Modules - Always visible when document is loaded */}
          {currentDocument && (
            <MiniModules onExpand={handleExpandModule} />
          )}
        </main>

        {/* File Converter Modal */}
        <FileConverter 
          isVisible={showConverter} 
          onClose={() => setShowConverter(false)} 
        />

        {/* Expanded Module Modal */}
        {expandedModule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {expandedModule === 'time' && 'Time & Greeting'}
                    {expandedModule === 'pomodoro' && 'Pomodoro Timer'}
                    {expandedModule === 'music' && 'Music Player'}
                  </h3>
                  <button
                    onClick={() => setExpandedModule(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center text-gray-600">
                  <p>Full module interface coming soon!</p>
                  <p className="text-sm mt-2">Use the mini controls for now.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProductivityProvider>
  );
}

export default App;