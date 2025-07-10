import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Settings, Play, Pause, Square, GripVertical } from 'lucide-react';

interface ResizableTTSPanelProps {
  height: number;
  onHeightChange: (height: number) => void;
  selectedText: string;
  fullText: string;
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  speechOptions: any;
  setSpeechOptions: (options: any) => void;
  onPlay: () => void;
  onStop: () => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  currentReadingText?: string;
  readingHighlight?: {start: number, end: number} | null;
}

export const ResizableTTSPanel: React.FC<ResizableTTSPanelProps> = ({
  height,
  onHeightChange,
  selectedText,
  fullText,
  isSupported,
  isPlaying,
  isPaused,
  voices,
  speechOptions,
  setSpeechOptions,
  onPlay,
  onStop,
  showSettings,
  setShowSettings,
  currentReadingText,
  readingHighlight
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = height;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaY = startY.current - e.clientY;
      const newHeight = Math.max(60, Math.min(600, startHeight.current + deltaY));
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, height, onHeightChange]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      onHeightChange(60);
    } else {
      onHeightChange(180);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border-t border-red-200 p-4">
        <p className="text-red-600 text-sm">
          Text-to-speech is not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="bg-white border-t border-gray-200 flex flex-col"
      style={{ height: `${height}px`, minHeight: '60px' }}
    >
      {/* Enhanced Resize Handle */}
      <div
        className={`h-4 bg-gray-100 hover:bg-gray-200 cursor-row-resize flex items-center justify-center group transition-colors border-b border-gray-200 ${
          isResizing ? 'bg-coral-200' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize TTS panel"
      >
        <div className="flex space-x-1">
          <div className={`w-8 h-1 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors ${
            isResizing ? 'bg-coral-600' : ''
          }`}></div>
          <div className={`w-8 h-1 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors ${
            isResizing ? 'bg-coral-600' : ''
          }`}></div>
          <div className={`w-8 h-1 bg-gray-400 group-hover:bg-gray-600 rounded-full transition-colors ${
            isResizing ? 'bg-coral-600' : ''
          }`}></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Volume2 className="h-5 w-5 mr-2" aria-hidden="true" />
          Text-to-Speech
          {isPlaying && currentReadingText && (
            <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Reading: "{currentReadingText}"
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </h3>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle speech settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Selection Info */}
          {selectedText && (
            <div className="p-3 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-800 font-medium">Selected text:</p>
              <p className="text-sm text-blue-700 truncate max-w-full">{selectedText}</p>
            </div>
          )}

          {/* Reading Progress */}
          {isPlaying && readingHighlight && (
            <div className="p-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-800 font-medium">Reading Progress:</p>
                <p className="text-xs text-green-600">
                  {Math.round((readingHighlight.start / fullText.length) * 100)}% complete
                </p>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(readingHighlight.start / fullText.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-4 p-4">
            <button
              onClick={onPlay}
              disabled={!fullText}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-coral-500 to-salmon-500 text-white hover:from-coral-600 hover:to-salmon-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label={isPlaying && !isPaused ? 'Pause speech' : 'Play speech'}
              title={isPlaying && !isPaused ? 'Pause speech' : 'Play speech'}
            >
              {isPlaying && !isPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </button>
            
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Stop speech"
              title="Stop speech"
            >
              <Square className="h-5 w-5" />
            </button>
          </div>

          {/* Speech Status */}
          <div className="text-center text-sm text-gray-600 px-4 pb-4">
            {isPlaying ? (
              isPaused ? 'Paused' : `Reading... ${currentReadingText ? `"${currentReadingText}"` : ''}`
            ) : (
              'Select text and click play to start reading'
            )}
          </div>

          {/* Speech Settings */}
          {showSettings && (
            <div className="border-t border-gray-100 p-4 bg-gray-50 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate: {speechOptions.rate?.toFixed(1) || '1.0'}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechOptions.rate || 1}
                    onChange={(e) => setSpeechOptions({ ...speechOptions, rate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
                    aria-label="Speech rate"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pitch: {speechOptions.pitch?.toFixed(1) || '1.0'}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechOptions.pitch || 1}
                    onChange={(e) => setSpeechOptions({ ...speechOptions, pitch: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
                    aria-label="Speech pitch"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voice
                  </label>
                  <select
                    value={speechOptions.voice?.name || ''}
                    onChange={(e) => {
                      const selectedVoice = voices.find(voice => voice.name === e.target.value);
                      setSpeechOptions({ ...speechOptions, voice: selectedVoice });
                    }}
                    className="w-full p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-coral-500"
                    aria-label="Select voice"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Enhanced TTS Features</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Visual highlighting shows current reading position</li>
                  <li>• Select text to read specific sections</li>
                  <li>• Progress bar shows reading completion</li>
                  <li>• Improved error handling and interruption recovery</li>
                  <li>• Real-time word tracking and highlighting</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};