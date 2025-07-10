import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Music, Target, Coffee, Volume2, SkipForward, SkipBack, X, Maximize2, Upload } from 'lucide-react';
import { useProductivity } from './ProductivityContext';

interface MiniModulesProps {
  onExpand: (module: 'time' | 'pomodoro' | 'music') => void;
}

export const MiniModules: React.FC<MiniModulesProps> = ({ onExpand }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const { pomodoro, music, startPomodoro, pausePomodoro, playPause, skipToNext, skipToPrevious } = useProductivity();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPomodoroTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatMusicTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePomodoroToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pomodoro.isActive && !pomodoro.isPaused) {
      pausePomodoro();
    } else {
      startPomodoro();
    }
  };

  const handleMusicToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPause();
  };

  const handleSkipPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    skipToPrevious();
  };

  const handleSkipNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    skipToNext();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-coral-500/60 hover:bg-coral-600/60 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 backdrop-blur-sm"
        title="Show mini modules"
      >
        <Maximize2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Horizontal Layout for Mini Modules */}
      <div className="flex items-end space-x-3 mb-3">
        {/* Mini Time Module */}
        <div 
          className="bg-white/60 backdrop-blur-md border border-coral-200/40 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-white/70"
          onClick={() => onExpand('time')}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-coral-600" />
            <div className="text-sm">
              <div className="font-mono font-semibold text-gray-800">{formatTime(currentTime)}</div>
              <div className="text-xs text-coral-600">Click to expand</div>
            </div>
          </div>
        </div>

        {/* Mini Pomodoro Module */}
        <div 
          className="bg-white/60 backdrop-blur-md border border-coral-200/40 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-white/70"
          onClick={() => onExpand('pomodoro')}
        >
          <div className="flex items-center space-x-2">
            {pomodoro.mode === 'focus' ? (
              <Target className="h-4 w-4 text-coral-600" />
            ) : (
              <Coffee className="h-4 w-4 text-coral-600" />
            )}
            <div className="text-sm flex-1">
              <div className="font-semibold text-gray-800 font-mono">
                {formatPomodoroTime(pomodoro.minutes, pomodoro.seconds)}
              </div>
              <div className="text-xs text-coral-600">
                {pomodoro.mode === 'focus' ? 'Focus time' : 
                 pomodoro.mode === 'shortBreak' ? 'Short break' : 'Long break'}
              </div>
            </div>
            <button 
              onClick={handlePomodoroToggle}
              className="p-1 rounded-full bg-coral-500/60 text-white hover:bg-coral-600/60 transition-colors backdrop-blur-sm"
              title={pomodoro.isActive && !pomodoro.isPaused ? 'Pause' : 'Start'}
            >
              {pomodoro.isActive && !pomodoro.isPaused ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Mini Music Module */}
        <div 
          className="bg-white/60 backdrop-blur-md border border-coral-200/40 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-white/70"
          onClick={() => onExpand('music')}
        >
          <div className="flex items-center space-x-2">
            <Music className="h-4 w-4 text-coral-600" />
            <div className="text-sm flex-1 min-w-0">
              {music.currentTrack ? (
                <>
                  <div className="font-semibold text-gray-800 truncate">{music.currentTrack.name}</div>
                  <div className="text-xs text-coral-600">
                    {formatMusicTime(music.currentTime)} / {formatMusicTime(music.currentTrack.duration)}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-gray-800">No track</div>
                  <div className="text-xs text-coral-600 flex items-center">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload music
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={handleSkipPrevious}
                disabled={!music.currentTrack}
                className="p-1 rounded-full bg-coral-500/60 text-white hover:bg-coral-600/60 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous track"
              >
                <SkipBack className="h-3 w-3" />
              </button>
              <button 
                onClick={handleMusicToggle}
                disabled={!music.currentTrack}
                className="p-1 rounded-full bg-coral-500/60 text-white hover:bg-coral-600/60 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={music.isPlaying ? 'Pause' : 'Play'}
              >
                {music.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button 
                onClick={handleSkipNext}
                disabled={!music.currentTrack}
                className="p-1 rounded-full bg-coral-500/60 text-white hover:bg-coral-600/60 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next track"
              >
                <SkipForward className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapse Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsVisible(false)}
          className="w-8 h-8 bg-gray-500/40 hover:bg-gray-600/40 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
          title="Hide mini modules"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};