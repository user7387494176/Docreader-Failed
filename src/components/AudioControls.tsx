import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Settings } from 'lucide-react';
import { useSpeechSynthesis, SpeechOptions } from '../hooks/useSpeechSynthesis';

interface AudioControlsProps {
  content: string;
  isEnabled: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ content, isEnabled }) => {
  const { isSupported, isPlaying, isPaused, voices, speak, pause, resume, stop } = useSpeechSynthesis();
  const [showSettings, setShowSettings] = useState(false);
  const [speechOptions, setSpeechOptions] = useState<SpeechOptions>({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: undefined
  });

  useEffect(() => {
    if (voices.length > 0 && !speechOptions.voice) {
      const defaultVoice = voices.find(voice => voice.default) || voices[0];
      setSpeechOptions(prev => ({ ...prev, voice: defaultVoice }));
    }
  }, [voices, speechOptions.voice]);

  const handlePlay = () => {
    if (!content) return;
    
    if (isPaused) {
      resume();
    } else {
      speak(content, speechOptions);
    }
  };

  const handlePause = () => {
    pause();
  };

  const handleStop = () => {
    stop();
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">
          Text-to-speech is not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-salmon-700 flex items-center">
          <Volume2 className="h-5 w-5 mr-2" />
          Audio Controls
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-coral-50 text-salmon-600 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handlePlay}
          disabled={!isEnabled || !content}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-coral-500 to-salmon-500 text-white hover:from-coral-600 hover:to-salmon-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isPlaying && !isPaused ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </button>
        
        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="h-5 w-5" />
        </button>
      </div>

      {/* Status */}
      <div className="text-center text-sm text-salmon-600 mb-4">
        {isPlaying ? (isPaused ? 'Paused' : 'Playing...') : 'Ready to play'}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-salmon-700 mb-2">
              Speech Rate: {speechOptions.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechOptions.rate}
              onChange={(e) => setSpeechOptions(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-salmon-700 mb-2">
              Pitch: {speechOptions.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechOptions.pitch}
              onChange={(e) => setSpeechOptions(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-salmon-700 mb-2">
              Volume: {(speechOptions.volume * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechOptions.volume}
              onChange={(e) => setSpeechOptions(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {voices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-salmon-700 mb-2">
                Voice
              </label>
              <select
                value={speechOptions.voice?.name || ''}
                onChange={(e) => {
                  const selectedVoice = voices.find(voice => voice.name === e.target.value);
                  setSpeechOptions(prev => ({ ...prev, voice: selectedVoice }));
                }}
                className="w-full p-2 border border-coral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500"
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
      )}
    </div>
  );
};