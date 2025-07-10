import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ZoomIn, ZoomOut, RotateCcw, Search, Download, Printer as Print, ChevronLeft, ChevronRight, Grid3X3, Maximize, Minimize, Highlighter, PenTool, MessageSquare, Trash2, Settings, Play, Pause, Square, Volume2, SkipForward, SkipBack, Menu, X, GripVertical, Copy } from 'lucide-react';
import { DocumentFile, AnnotationData, SearchResult } from '../types/documents';
import { useSpeechSynthesis, SpeechOptions } from '../hooks/useSpeechSynthesis';
import { PDFRenderer, PDFPageData } from '../utils/pdfRenderer';
import { PDFPageRenderer } from './PDFPageRenderer';
import { ResizableTTSPanel } from './ResizableTTSPanel';
import { TimeGreetingModule } from './TimeGreetingModule';
import { PomodoroModule } from './PomodoroModule';
import { MusicPlayerModule } from './MusicPlayerModule';
import { MovableMiniModules } from './MovableMiniModules';

interface AdvancedDocumentViewerProps {
  document: DocumentFile;
}

export const AdvancedDocumentViewer: React.FC<AdvancedDocumentViewerProps> = ({ document: docFile }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [fitMode, setFitMode] = useState<'width' | 'height' | 'page' | 'custom'>('page');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'highlight' | 'draw' | 'comment'>('select');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [ttsHeight, setTtsHeight] = useState(180); // Reduced default height
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{x: number, y: number}[]>([]);
  const [currentReadingText, setCurrentReadingText] = useState('');
  const [readingHighlight, setReadingHighlight] = useState<{start: number, end: number} | null>(null);
  
  // PDF-specific state
  const [pdfRenderer, setPdfRenderer] = useState<PDFRenderer | null>(null);
  const [pdfPages, setPdfPages] = useState<Map<number, PDFPageData>>(new Map());
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 1200, height: 800 });
  const [pdfFullText, setPdfFullText] = useState('');
  const [ttsWidth, setTtsWidth] = useState(320); // TTS panel width
  
  // Speech synthesis with better error handling
  const { isSupported, isPlaying, isPaused, voices, currentWordIndex, currentText, speak, pause, resume, stop } = useSpeechSynthesis();
  const [speechOptions, setSpeechOptions] = useState<SpeechOptions>({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: undefined
  });

  const viewerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const textSelectionRef = useRef<string>('');

  const totalPages = docFile.type === 'pdf' 
    ? pdfRenderer?.getPageCount() || 1
    : Math.ceil(docFile.content.length / 2000);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlePageChange(currentPage - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlePageChange(currentPage + 1);
          break;
        case 'ArrowLeft':
          if (viewMode === 'double') {
            e.preventDefault();
            handlePageChange(currentPage - 2);
          } else {
            e.preventDefault();
            handlePageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (viewMode === 'double') {
            e.preventDefault();
            handlePageChange(currentPage + 2);
          } else {
            e.preventDefault();
            handlePageChange(currentPage + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            handlePageChange(currentPage - 1);
          } else {
            handlePageChange(currentPage + 1);
          }
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const searchInput = window.document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, viewMode]);

  // Initialize PDF renderer
  useEffect(() => {
    if (docFile.type === 'pdf') {
      const initPDF = async () => {
        setIsLoadingPDF(true);
        try {
          const renderer = new PDFRenderer();
          await renderer.loadPDF(docFile.file);
          setPdfRenderer(renderer);
          
          const fullText = await renderer.getAllTextContent();
          setPdfFullText(fullText);
          
          const firstPage = await renderer.renderPage(1);
          setPdfPages(new Map([[1, firstPage]]));
        } catch (error) {
          console.error('Failed to initialize PDF:', error);
        } finally {
          setIsLoadingPDF(false);
        }
      };
      initPDF();
    }
  }, [docFile]);

  // Load PDF pages as needed
  useEffect(() => {
    if (docFile.type === 'pdf' && pdfRenderer) {
      const loadPage = async () => {
        if (!pdfPages.has(currentPage)) {
          try {
            const pageData = await pdfRenderer.renderPage(currentPage);
            setPdfPages(prev => new Map(prev.set(currentPage, pageData)));
          } catch (error) {
            console.error('Failed to render PDF page:', error);
          }
        }
        
        if (currentPage < totalPages && !pdfPages.has(currentPage + 1)) {
          try {
            const nextPageData = await pdfRenderer.renderPage(currentPage + 1);
            setPdfPages(prev => new Map(prev.set(currentPage + 1, nextPageData)));
          } catch (error) {
            console.error('Failed to pre-load next page:', error);
          }
        }
      };
      loadPage();
    }
  }, [currentPage, docFile.type, pdfRenderer, totalPages, pdfPages]);

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width - ttsWidth, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [ttsWidth]);

  useEffect(() => {
    if (voices.length > 0 && !speechOptions.voice) {
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('google') && 
        voice.lang.includes('en-GB') && 
        voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => 
        voice.lang.includes('en-GB')
      ) || voices.find(voice => 
        voice.lang.includes('en-US')
      ) || voices[0];
      
      setSpeechOptions(prev => ({ ...prev, voice: preferredVoice }));
    }
  }, [voices, speechOptions.voice]);

  // Track reading progress and highlight current text
  useEffect(() => {
    if (isPlaying && currentText && currentWordIndex >= 0) {
      const words = currentText.split(' ');
      if (currentWordIndex < words.length) {
        const currentWord = words[currentWordIndex];
        setCurrentReadingText(currentWord);
        
        // Calculate character position for highlighting
        const wordsBeforeCurrent = words.slice(0, currentWordIndex);
        const charStart = wordsBeforeCurrent.join(' ').length + (currentWordIndex > 0 ? 1 : 0);
        const charEnd = charStart + currentWord.length;
        
        setReadingHighlight({ start: charStart, end: charEnd });
      }
    } else {
      setCurrentReadingText('');
      setReadingHighlight(null);
    }
  }, [isPlaying, currentWordIndex, currentText]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
    setFitMode('custom');
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
    setFitMode('custom');
  };

  const handleFitToWidth = () => {
    setFitMode('width');
    setZoomLevel(100);
  };

  const handleFitToHeight = () => {
    setFitMode('height');
    setZoomLevel(100);
  };

  const handleFitToPage = () => {
    setFitMode('page');
    setZoomLevel(100);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const regex = new RegExp(searchQuery, 'gi');
    let match;
    const searchText = docFile.type === 'pdf' ? pdfFullText : docFile.content;

    while ((match = regex.exec(searchText)) !== null) {
      const page = docFile.type === 'pdf' 
        ? Math.ceil(match.index / (pdfFullText.length / totalPages))
        : Math.ceil(match.index / 2000);
      results.push({
        page,
        text: match[0],
        position: { x: 0, y: match.index }
      });
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      setCurrentPage(results[0].page);
    }
  }, [searchQuery, docFile.content, docFile.type, pdfFullText, totalPages]);

  const navigateSearchResult = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    const newIndex = direction === 'next' 
      ? (currentSearchIndex + 1) % searchResults.length
      : (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    
    setCurrentSearchIndex(newIndex);
    setCurrentPage(searchResults[newIndex].page);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([docFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = docFile.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTextSelection = (text: string) => {
    setSelectedText(text);
    textSelectionRef.current = text;
  };

  const handleSpeechPlay = () => {
    try {
      let textToSpeak = textSelectionRef.current || selectedText || (docFile.type === 'pdf' ? pdfFullText : docFile.content);
      
      if (isPaused) {
        resume();
      } else {
        speak(textToSpeak, speechOptions);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Reset speech state on error
      stop();
    }
  };

  const handleSpeechStop = () => {
    try {
      stop();
      setCurrentReadingText('');
      setReadingHighlight(null);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  // Annotation handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'comment') {
      const comment = prompt('Enter your comment:');
      if (comment) {
        addAnnotation('comment', { x, y }, comment);
      }
    } else if (selectedTool === 'highlight') {
      addAnnotation('highlight', { x: x - 50, y: y - 10 }, undefined, { width: 100, height: 20 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingPath([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && selectedTool === 'draw') {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingPath(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'draw' && drawingPath.length > 1) {
      addAnnotation('drawing', drawingPath[0], undefined, undefined, drawingPath);
      setIsDrawing(false);
      setDrawingPath([]);
    }
  };

  const addAnnotation = (
    type: AnnotationData['type'], 
    position: { x: number; y: number }, 
    content?: string,
    dimensions?: { width: number; height: number },
    path?: {x: number, y: number}[]
  ) => {
    const newAnnotation: AnnotationData = {
      id: Date.now().toString(),
      type,
      page: currentPage,
      position: {
        ...position,
        width: dimensions?.width,
        height: dimensions?.height
      },
      content: content || (type === 'comment' ? 'New comment' : undefined),
      color: type === 'highlight' ? '#ffff00' : '#ff0000',
      path
    };
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  const renderPDFContent = () => {
    if (isLoadingPDF) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      );
    }

    const currentPageData = pdfPages.get(currentPage);
    if (!currentPageData) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Loading page {currentPage}...</p>
        </div>
      );
    }

    if (viewMode === 'double' && currentPage < totalPages) {
      const nextPageData = pdfPages.get(currentPage + 1);
      return (
        <div className="flex justify-center space-x-4 relative">
          <div className="relative">
            <PDFPageRenderer
              pageData={currentPageData}
              zoomLevel={zoomLevel}
              fitMode={fitMode}
              containerWidth={containerDimensions.width / 2}
              containerHeight={containerDimensions.height}
              onTextSelect={handleTextSelection}
              searchQuery={searchQuery}
              searchResults={searchResults.filter(r => r.page === currentPage)}
              readingHighlight={readingHighlight}
              currentReadingText={currentReadingText}
            />
            {renderAnnotationOverlay(currentPage)}
          </div>
          {nextPageData && (
            <div className="relative">
              <PDFPageRenderer
                pageData={nextPageData}
                zoomLevel={zoomLevel}
                fitMode={fitMode}
                containerWidth={containerDimensions.width / 2}
                containerHeight={containerDimensions.height}
                onTextSelect={handleTextSelection}
                searchQuery={searchQuery}
                searchResults={searchResults.filter(r => r.page === currentPage + 1)}
                readingHighlight={readingHighlight}
                currentReadingText={currentReadingText}
              />
              {renderAnnotationOverlay(currentPage + 1)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <PDFPageRenderer
          pageData={currentPageData}
          zoomLevel={zoomLevel}
          fitMode={fitMode}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
          onTextSelect={handleTextSelection}
          searchQuery={searchQuery}
          searchResults={searchResults.filter(r => r.page === currentPage)}
          readingHighlight={readingHighlight}
          currentReadingText={currentReadingText}
        />
        {renderAnnotationOverlay(currentPage)}
      </div>
    );
  };

  const renderAnnotationOverlay = (pageNum: number) => {
    const pageAnnotations = annotations.filter(ann => ann.page === pageNum);
    
    return (
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 pointer-events-auto cursor-crosshair"
        width={containerDimensions.width}
        height={containerDimensions.height}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          display: selectedTool !== 'select' ? 'block' : 'none',
          zIndex: 10
        }}
      />
    );
  };

  const renderTextContent = () => {
    const startIndex = (currentPage - 1) * 2000;
    const endIndex = startIndex + (viewMode === 'double' ? 4000 : 2000);
    let content = docFile.content.slice(startIndex, endIndex);

    // Enhanced reading highlighting
    if (isPlaying && currentText && readingHighlight) {
      const beforeHighlight = content.slice(0, readingHighlight.start);
      const highlightedText = content.slice(readingHighlight.start, readingHighlight.end);
      const afterHighlight = content.slice(readingHighlight.end);
      
      content = beforeHighlight + 
        `<span class="bg-yellow-300 text-black font-bold border-2 border-yellow-500 px-1 rounded shadow-lg animate-pulse">${highlightedText}</span>` + 
        afterHighlight;
    }

    if (searchQuery && searchResults.length > 0) {
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      content = content.replace(regex, '<mark class="bg-yellow-400 text-black font-semibold border border-yellow-600 px-1 rounded">$1</mark>');
    }

    return (
      <div className="w-full max-w-none p-8 bg-white shadow-lg rounded-lg" style={{ margin: '40px auto' }}>
        <div className={`prose prose-salmon max-w-none ${viewMode === 'double' ? 'columns-2 gap-8' : ''}`}>
          {content.split('\n').map((line, index) => (
            <p 
              key={index} 
              className="mb-3 leading-relaxed text-gray-800 select-text cursor-text" 
              onMouseUp={() => handleTextSelection(window.getSelection()?.toString() || '')}
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            >
              <span dangerouslySetInnerHTML={{ __html: line.trim() || '\u00A0' }} />
            </p>
          ))}
        </div>
      </div>
    );
  };

  const scrollToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Create double page icon
  const DoublePagesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <rect x="9" y="2" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="1" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="0.5"/>
      <line x1="1" y1="6" x2="7" y2="6" stroke="currentColor" strokeWidth="0.5"/>
      <line x1="9" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="0.5"/>
      <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  );

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar - Productivity Modules - Fixed width */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0 flex flex-col">
        <div className="p-4 space-y-4 flex-1 flex flex-col">
          <TimeGreetingModule />
          <PomodoroModule />
          <MusicPlayerModule />
        </div>
      </div>

      {/* Main Document Viewer */}
      <div ref={viewerRef} className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col flex-1">
        {/* Toolbar */}
        <div className="bg-gradient-to-r from-coral-500 to-salmon-500 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
            <span className="text-white font-medium truncate max-w-48">{docFile.name}</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white disabled:opacity-50"
              aria-label="Previous page"
              title="Previous page (Arrow Up/Left)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-1 text-white text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                className="w-12 px-1 py-0.5 text-center bg-white/20 rounded text-white placeholder-white/70"
                min="1"
                max={totalPages}
                aria-label="Current page number"
                title="Jump to page"
              />
              <span>/ {totalPages}</span>
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white disabled:opacity-50"
              aria-label="Next page"
              title="Next page (Arrow Down/Right)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label="Zoom out"
              title="Zoom out (25% steps)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <select
              value={fitMode}
              onChange={(e) => {
                const mode = e.target.value as typeof fitMode;
                setFitMode(mode);
                if (mode !== 'custom') {
                  if (mode === 'width') handleFitToWidth();
                  else if (mode === 'height') handleFitToHeight();
                  else if (mode === 'page') handleFitToPage();
                }
              }}
              className="px-2 py-1 text-xs bg-white/20 text-black rounded border-none"
              style={{ color: 'black' }}
              aria-label="Zoom mode"
              title="Select zoom mode"
            >
              <option value="width" style={{ color: 'black' }}>Fit Width</option>
              <option value="height" style={{ color: 'black' }}>Fit Height</option>
              <option value="page" style={{ color: 'black' }}>Fit Page</option>
              <option value="custom" style={{ color: 'black' }}>{zoomLevel}%</option>
            </select>
            
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label="Zoom in"
              title="Zoom in (25% steps)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'single' ? 'double' : 'single')}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label={viewMode === 'single' ? 'Switch to double page view' : 'Switch to single page view'}
              title={viewMode === 'single' ? 'Double page view' : 'Single page view'}
            >
              <DoublePagesIcon />
            </button>
            
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label="Toggle thumbnails"
              title={showThumbnails ? 'Hide page thumbnails' : 'Show page thumbnails'}
            >
              {showThumbnails ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label="Print document"
              title="Print document (Ctrl+P)"
            >
              <Print className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white"
              aria-label="Download document"
              title="Download document as text file"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between flex-wrap gap-2">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search in document... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8 pr-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500"
                aria-label="Search document content"
              />
            </div>
            
            <button
              onClick={handleSearch}
              className="px-3 py-1 bg-coral-500 text-white text-sm rounded-lg hover:bg-coral-600"
              aria-label="Execute search"
              title="Search document content"
            >
              Search
            </button>
            
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateSearchResult('prev')}
                  className="p-1 rounded hover:bg-gray-200"
                  aria-label="Previous search result"
                  title="Previous search result"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                
                <button
                  onClick={() => navigateSearchResult('next')}
                  className="p-1 rounded hover:bg-gray-200"
                  aria-label="Next search result"
                  title="Next search result"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Annotation Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTool('select')}
              className={`p-2 rounded ${selectedTool === 'select' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
              aria-label="Select tool"
              title="Select tool (Arrow keys: navigate pages)"
            >
              <span className="text-sm">Select</span>
            </button>
            
            <button
              onClick={() => setSelectedTool('highlight')}
              className={`p-2 rounded ${selectedTool === 'highlight' ? 'bg-yellow-200' : 'hover:bg-gray-200'}`}
              aria-label="Highlight tool"
              title="Highlight text - click to add highlights"
            >
              <Highlighter className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setSelectedTool('draw')}
              className={`p-2 rounded ${selectedTool === 'draw' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
              aria-label="Draw tool"
              title="Draw annotations - click and drag to draw"
            >
              <PenTool className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setSelectedTool('comment')}
              className={`p-2 rounded ${selectedTool === 'comment' ? 'bg-green-200' : 'hover:bg-gray-200'}`}
              aria-label="Comment tool"
              title="Add comments - click to add text comments"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            {annotations.length > 0 && (
              <button
                onClick={() => setAnnotations([])}
                className="p-2 rounded hover:bg-red-100 text-red-600"
                aria-label="Clear all annotations"
                title="Clear all annotations from document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden w-full">
          {/* Thumbnails Sidebar */}
          <div className={`${showThumbnails ? 'w-48' : 'w-12'} bg-gray-50 border-r overflow-y-auto transition-all duration-300 flex-shrink-0`}>
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                {showThumbnails && <h3 className="text-sm font-medium text-gray-700">Pages</h3>}
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-600"
                  aria-label={showThumbnails ? 'Collapse thumbnails' : 'Expand thumbnails'}
                  title={showThumbnails ? 'Hide page thumbnails' : 'Show page thumbnails'}
                >
                  {showThumbnails ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
                </button>
              </div>
              
              {showThumbnails ? (
                <div className="space-y-2 max-h-full overflow-y-auto">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => scrollToPage(page)}
                      className={`w-full p-2 text-left text-sm rounded border ${
                        currentPage === page 
                          ? 'bg-coral-100 border-coral-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      aria-label={`Go to page ${page}`}
                      title={`Jump to page ${page}`}
                    >
                      Page {page}
                      {annotations.filter(ann => ann.page === page).length > 0 && (
                        <span className="ml-1 text-xs text-coral-600">
                          ({annotations.filter(ann => ann.page === page).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 max-h-full overflow-y-auto">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => scrollToPage(page)}
                      className={`w-full p-1 text-xs rounded ${
                        currentPage === page 
                          ? 'bg-coral-100 text-coral-700' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      aria-label={`Go to page ${page}`}
                      title={`Jump to page ${page}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area with Navigation Arrows */}
          <div className="flex-1 flex w-full relative">
            <div className="flex-1 flex flex-col relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div 
              ref={contentRef}
              className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 w-full h-full"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="w-full">
                {docFile.type === 'pdf' ? renderPDFContent() : renderTextContent()}
              </div>
            </div>
            </div>

            {/* Vertical TTS Panel on Right */}
            <div 
              className="bg-white border-l border-gray-200 flex flex-col"
              style={{ width: `${ttsWidth}px`, minWidth: '280px', maxWidth: '500px' }}
            >
              {/* TTS Resize Handle */}
              <div
                className="w-4 h-full bg-gray-100 hover:bg-gray-200 cursor-col-resize flex items-center justify-center group transition-colors border-r border-gray-200 absolute left-0 top-0 z-10"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = ttsWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = startX - e.clientX;
                    const newWidth = Math.max(280, Math.min(500, startWidth + deltaX));
                    setTtsWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                  e.preventDefault();
                }}
                title="Drag to resize TTS panel"
              >
                <div className="flex flex-col space-y-1">
                  <div className="w-1 h-8 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors"></div>
                  <div className="w-1 h-8 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors"></div>
                  <div className="w-1 h-8 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors"></div>
                </div>
              </div>
              
              {/* TTS Content */}
              <div className="flex-1 flex flex-col pl-4">
                <VerticalTTSPanel
                  width={ttsWidth}
                  selectedText={selectedText}
                  fullText={docFile.type === 'pdf' ? pdfFullText : docFile.content}
                  isSupported={isSupported}
                  isPlaying={isPlaying}
                  isPaused={isPaused}
                  voices={voices}
                  speechOptions={speechOptions}
                  setSpeechOptions={setSpeechOptions}
                  onPlay={handleSpeechPlay}
                  onStop={handleSpeechStop}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                  currentReadingText={currentReadingText}
                  readingHighlight={readingHighlight}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Annotations Display */}
        {annotations.map((annotation) => (
          annotation.page === currentPage && (
            <div
              key={annotation.id}
              className="absolute pointer-events-auto z-20"
              style={{
                left: annotation.position.x,
                top: annotation.position.y,
                width: annotation.position.width,
                height: annotation.position.height,
                backgroundColor: annotation.type === 'highlight' ? annotation.color : 'transparent',
                opacity: annotation.type === 'highlight' ? 0.3 : 1
              }}
            >
              {annotation.type === 'comment' && (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-2 shadow-lg min-w-32">
                  <p className="text-sm">{annotation.content}</p>
                  <button
                    onClick={() => removeAnnotation(annotation.id)}
                    className="mt-1 text-red-500 hover:text-red-700"
                    aria-label="Delete annotation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              {annotation.type === 'drawing' && annotation.path && (
                <svg className="absolute inset-0 pointer-events-none">
                  <path
                    d={`M ${annotation.path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    stroke={annotation.color}
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              )}
            </div>
          )
        ))}

        {/* Keyboard shortcuts help */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs p-2 rounded opacity-0 hover:opacity-100 transition-opacity">
          <div className="space-y-1">
            <div>↑↓ Previous/Next page</div>
            <div>←→ Navigate pages</div>
            <div>Space: Next page</div>
            <div>Ctrl+F: Search</div>
            <div>Home/End: First/Last page</div>
          </div>
        </div>
      </div>

      {/* Movable Mini Modules for Fullscreen */}
      {isFullscreen && <MovableMiniModules />}
    </div>
  );
};