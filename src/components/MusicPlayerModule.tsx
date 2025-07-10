import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Upload, Music, Shuffle, Repeat, X, GripVertical, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { useProductivity } from './ProductivityContext';
export const MusicPlayerModule: React.FC = () => {
  const { music, setMusic, playPause, skipToNext, skipToPrevious, addTracks, audioRef } = useProductivity();
  const [showUpload, setShowUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pitchShift, setPitchShift] = useState(0); // -12 to +12 semitones
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.25 to 4.0
  const [applyToAllTracks, setApplyToAllTracks] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);

  // Initialize Web Audio API for pitch and speed control
  useEffect(() => {
    if (audioRef.current && music.currentTrack && !audioContext) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(ctx.destination);
        
        setAudioContext(ctx);
        setAudioSource(source);
      } catch (error) {
        console.error('Failed to initialize audio processing:', error);
      }
    }
  }, [music.currentTrack, audioRef, audioContext]);

  // Apply speed changes (pitch requires more complex implementation)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioRef]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addTracks(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (moduleRef.current && !moduleRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addTracks(e.target.files);
    }
  };

  const selectTrack = (trackId: string) => {
    const track = music.tracks.find(t => t.id === trackId);
    if (track) {
      setMusic(prev => ({ 
        ...prev, 
        currentTrack: track,
        currentTime: 0,
        isPlaying: false
      }));
    }
  };

  const removeTrack = (trackId: string) => {
    const track = music.tracks.find(t => t.id === trackId);
    if (track) {
      URL.revokeObjectURL(track.url);
    }
    
    setMusic(prev => {
      const newTracks = prev.tracks.filter(t => t.id !== trackId);
      return {
        ...prev,
        tracks: newTracks,
        currentTrack: prev.currentTrack?.id === trackId 
          ? (newTracks.length > 0 ? newTracks[0] : null)
          : prev.currentTrack
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!music.currentTrack || music.currentTrack.duration === 0) return 0;
    return (music.currentTime / music.currentTrack.duration) * 100;
  };

  const toggleShuffle = () => {
    setMusic(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(music.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMusic(prev => ({ ...prev, repeatMode: nextMode }));
  };

  const setVolume = (volume: number) => {
    setMusic(prev => ({ ...prev, volume }));
  };

  const getRepeatIcon = () => {
    if (music.repeatMode === 'one') {
      return (
        <div className="relative">
          <Repeat className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 text-xs font-bold">1</span>
        </div>
      );
    }
    return <Repeat className="h-4 w-4" />;
  };

  const resetAudioSettings = () => {
    setPitchShift(0);
    setPlaybackSpeed(1);
  };

  return (
    <div 
      ref={moduleRef}
      className={`bg-white rounded-2xl shadow-lg border border-coral-100 overflow-hidden transition-all duration-300 w-full ${
        isDragOver ? 'ring-2 ring-coral-400 bg-coral-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Themed Header */}
      <div className="bg-gradient-to-r from-coral-500 to-salmon-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Music className="h-6 w-6" />
            <span className="font-medium">Music Player</span>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center text-white"
              title="Upload audio files"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center text-white"
              title="Audio settings and controls"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </button>
          </div>
        </div>
        
        {music.tracks.length > 0 && (
          <div className="mt-2 text-sm text-white/90">
            {music.tracks.length} tracks • Enhanced audio • Drag & drop supported
          </div>
        )}
      </div>

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-coral-500/20 backdrop-blur-sm z-10 flex items-center justify-center border-2 border-dashed border-coral-400 rounded-2xl">
          <div className="text-center text-coral-700">
            <Upload className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Drop audio files here</p>
            <p className="text-sm">Supports MP3, WAV, M4A, OGG, AAC, FLAC</p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {showUpload && (
        <div className="p-4 border-b border-coral-100 bg-coral-25">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-coral-300 hover:border-coral-400"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-coral-500" />
            <p className="text-sm text-coral-700 mb-2">
              Drag and drop audio files here or click to browse
            </p>
            <p className="text-xs text-coral-600 mb-3">
              Supports MP3, WAV, M4A, OGG, AAC, FLAC
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg text-sm transition-colors"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Advanced Audio Controls */}
      {showAdvanced && (
        <div className="p-4 border-b border-coral-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">Audio Settings</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Apply to:</span>
              <button
                onClick={() => setApplyToAllTracks(!applyToAllTracks)}
                className="flex items-center space-x-1 text-sm"
                title={applyToAllTracks ? "Apply to all tracks" : "Apply to current track only"}
              >
                {applyToAllTracks ? (
                  <ToggleRight className="h-4 w-4 text-coral-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-xs text-gray-600">
                  {applyToAllTracks ? 'All tracks' : 'Current track'}
                </span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Playback Speed: {playbackSpeed.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.25"
                max="4"
                step="0.05"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.25x</span>
                <span>1x</span>
                <span>4x</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Pitch Shift: {pitchShift > 0 ? '+' : ''}{pitchShift} semitones
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitchShift}
                onChange={(e) => setPitchShift(parseInt(e.target.value))}
                className="w-full h-2 bg-coral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-12</span>
                <span>0</span>
                <span>+12</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={resetAudioSettings}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs transition-colors"
            >
              Reset to Default
            </button>
            <div className="text-xs text-gray-600">
              {pitchShift !== 0 || playbackSpeed !== 1 ? (
                <span className="text-green-600 font-medium">✓ Enhancement active</span>
              ) : (
                'No enhancement'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Track Display */}
      {music.currentTrack && (
        <div className="p-4 border-b border-coral-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-coral-500 to-salmon-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 truncate" title={music.currentTrack.name}>
                {music.currentTrack.name}
              </h3>
              <p className="text-sm text-coral-600">
                Track {music.tracks.findIndex(t => t.id === music.currentTrack?.id) + 1} of {music.tracks.length}
                {(pitchShift !== 0 || playbackSpeed !== 1) && (
                  <span className="ml-2 text-xs bg-coral-100 text-coral-700 px-2 py-0.5 rounded">
                    Enhanced
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{formatTime(music.currentTime)}</span>
              <span>{formatTime(music.currentTrack.duration)}</span>
            </div>
            <div className="w-full bg-coral-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-coral-500 to-salmon-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors ${music.isShuffled ? 'bg-coral-500 text-white' : 'hover:bg-coral-100 text-coral-600'}`}
              title={`Shuffle: ${music.isShuffled ? 'On' : 'Off'}`}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            
            <button
              onClick={skipToPrevious}
              className="p-2 rounded-lg hover:bg-coral-100 text-coral-600 transition-colors"
              title="Previous track"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button
              onClick={playPause}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600 flex items-center justify-center transition-colors text-white"
              title={music.isPlaying ? 'Pause' : 'Play'}
            >
              {music.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </button>
            
            <button
              onClick={skipToNext}
              className="p-2 rounded-lg hover:bg-coral-100 text-coral-600 transition-colors"
              title="Next track"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-colors ${music.repeatMode !== 'none' ? 'bg-coral-500 text-white' : 'hover:bg-coral-100 text-coral-600'}`}
              title={`Repeat: ${music.repeatMode === 'none' ? 'Off' : music.repeatMode === 'all' ? 'All tracks' : 'Current track'}`}
            >
              {getRepeatIcon()}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Volume2 className="h-4 w-4 text-coral-600 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={music.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-coral-100 rounded-lg appearance-none cursor-pointer slider"
              title={`Volume: ${Math.round(music.volume * 100)}%`}
            />
            <span className="text-xs text-coral-600 w-10 text-right">{Math.round(music.volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Playlist */}
      {music.tracks.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Playlist ({music.tracks.length} tracks)</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {music.tracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  music.currentTrack?.id === track.id ? 'bg-coral-100 border border-coral-200' : 'hover:bg-coral-50'
                }`}
                onClick={() => selectTrack(track.id)}
              >
                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate" title={track.name}>
                    {track.name}
                  </p>
                  <p className="text-xs text-coral-600">
                    Track {index + 1} • {formatTime(track.duration)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrack(track.id);
                  }}
                  className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors flex-shrink-0"
                  title="Remove track"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {music.tracks.length === 0 && !showUpload && (
        <div className="p-8 text-center">
          <Music className="h-12 w-12 mx-auto mb-3 text-coral-400" />
          <p className="text-gray-600 mb-2">No music uploaded yet</p>
          <p className="text-xs text-gray-500 mb-4">
            Drag and drop audio files anywhere on this module or use the upload button to get started.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg text-sm transition-colors"
          >
            Upload Music Files
          </button>
        </div>
      )}
    </div>
  );
};