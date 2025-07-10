import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Settings, Play, Pause, Square, ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react';

interface VerticalTTSPanelProps {
  width: number;
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

export const VerticalTTSPanel: React.FC<VerticalTTSPanelProps> = ({
  width,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [textToRead, setTextToRead] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedText) {
      setTextToRead(selectedText);
    }
  }, [selectedText]);

  const handleCopyText = () => {
    if (textToRead) {
      navigator.clipboard.writeText(textToRead);
    }
  };

  const handleResetSettings = () => {
    setSpeechOptions({
      rate: 1,
      pitch: 1,
      volume: 1,
      voice: voices.find(v => v.default) || voices[0]
    });
  };

  const getProgress = () => {
    if (!readingHighlight || !fullText) return 0;
    return (readingHighlight.start / fullText.length) * 100;
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">
          Text-to-speech is not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-coral-500 to-salmon-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Volume2 className="h-5 w-5" />
            <span className="font-medium">Text-to-Speech</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Speech settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {/* Reading Status */}
        {isPlaying && currentReadingText && (
          <div className="mt-2 text-sm text-white/90 bg-white/10 rounded px-2 py-1">
            Reading: "{currentReadingText}"
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Text Selection Area */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Text to Read
              </label>
              <div className="flex space-x-1">
                <button
                  onClick={handleCopyText}
                  disabled={!textToRead}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Copy text"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTextToRead(fullText)}
                  className="px-2 py-1 text-xs bg-coral-100 hover:bg-coral-200 text-coral-700 rounded transition-colors"
                  title="Use full document"
                >
                  Full Text
                </button>
              </div>
            </div>
            <textarea
              ref={textAreaRef}
              value={textToRead}
              onChange={(e) => setTextToRead(e.target.value)}
              placeholder="Select text from the document or type here..."
              className="w-full h-24 p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
            {selectedText && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                Selected: {selectedText.substring(0, 100)}...
              </div>
            )}
          </div>

          {/* Reading Progress */}
          {isPlaying && readingHighlight && (
            <div className="p-4 border-b border-gray-100 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Reading Progress</span>
                <span className="text-xs text-green-600">{Math.round(getProgress())}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              {currentReadingText && (
                <div className="mt-2 text-sm text-green-700 font-medium">
                  Current: "{currentReadingText}"
                </div>
              )}
            </div>
          )}

          {/* Playback Controls */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <button
                onClick={onPlay}
                disabled={!textToRead}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-coral-500 to-salmon-500 text-white hover:from-coral-600 hover:to-salmon-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                title={isPlaying && !isPaused ? 'Pause speech' : 'Play speech'}
              >
                {isPlaying && !isPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </button>
              
              <button
                onClick={onStop}
                disabled={!isPlaying}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Stop speech"
              >
                <Square className="h-5 w-5" />
              </button>
            </div>

            {/* Status */}
            <div className="text-center text-sm text-gray-600">
              {isPlaying ? (
                isPaused ? 'Paused' : 'Reading...'
              ) : (
                textToRead ? 'Ready to read' : 'Select text to start'
              )}
            </div>
          </div>

          {/* Speech Settings */}
          {showSettings && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Speech Settings</h4>
                  <button
                    onClick={handleResetSettings}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Reset to defaults"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
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
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
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
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5</span>
                    <span>1.0</span>
                    <span>2.0</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Volume: {Math.round((speechOptions.volume || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={speechOptions.volume || 1}
                    onChange={(e) => setSpeechOptions({ ...speechOptions, volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {voices.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Voice
                    </label>
                    <select
                      value={speechOptions.voice?.name || ''}
                      onChange={(e) => {
                        const selectedVoice = voices.find(voice => voice.name === e.target.value);
                        setSpeechOptions({ ...speechOptions, voice: selectedVoice });
                      }}
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500"
                    >
                      {voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-medium text-blue-800 mb-2">Enhanced Features</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Visual highlighting shows reading position</li>
                  <li>• Select text for targeted reading</li>
                  <li>• Progress tracking and word highlighting</li>
                  <li>• Improved error handling</li>
                  <li>• Real-time reading feedback</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};