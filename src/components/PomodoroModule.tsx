import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Settings, Coffee, Target } from 'lucide-react';
import { useProductivity } from './ProductivityContext';

export const PomodoroModule: React.FC = () => {
  const { pomodoro, startPomodoro, pausePomodoro, resetPomodoro } = useProductivity();
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<Array<{date: Date, type: string, duration: number}>>([]);

  // Sound effects using Web Audio API
  const playSound = (type: 'start' | 'pause' | 'stop' | 'complete') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sound patterns for each action
      switch (type) {
        case 'start':
          // Ascending chime - motivating start sound
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
          
        case 'pause':
          // Gentle descending tone - soft pause
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15); // F4
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'stop':
          // Double beep - definitive stop
          oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime); // D4
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          
          // Second beep
          setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.setValueAtTime(293.66, audioContext.currentTime);
            gainNode2.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.1);
          }, 150);
          break;
          
        case 'complete':
          // Triumphant completion sound - reward feeling
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.3); // C6
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
          break;
      }
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  };

  const handleStart = () => {
    playSound('start');
    startPomodoro();
  };

  const handlePause = () => {
    playSound('pause');
    pausePomodoro();
  };

  const handleReset = () => {
    playSound('stop');
    resetPomodoro();
    setCompletedSessions(0);
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = pomodoro.mode === 'focus' 
      ? settings.focusTime * 60
      : pomodoro.mode === 'shortBreak' 
        ? settings.shortBreak * 60 
        : settings.longBreak * 60;
    
    const currentTime = pomodoro.minutes * 60 + pomodoro.seconds;
    return ((totalTime - currentTime) / totalTime) * 100;
  };

  const getModeIcon = () => {
    switch (pomodoro.mode) {
      case 'focus':
        return <Target className="h-5 w-5" />;
      case 'shortBreak':
      case 'longBreak':
        return <Coffee className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getModeText = () => {
    switch (pomodoro.mode) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  };

  return (
    <div className="bg-gradient-to-br from-coral-500 to-salmon-500 rounded-2xl shadow-lg p-6 text-white w-full h-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20">
        <div className="flex items-center space-x-2">
          {getModeIcon()}
          <div>
            <span className="font-medium">Session {pomodoro.session}</span>
            <div className="text-xs opacity-80">{getModeText()}</div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          title="Pomodoro settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <h4 className="text-sm font-medium mb-3">Timer Settings</h4>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <label className="block mb-1">Focus (min)</label>
              <input
                type="number"
                value={settings.focusTime}
                onChange={(e) => setSettings(prev => ({ ...prev, focusTime: parseInt(e.target.value) || 25 }))}
                className="w-full p-1 rounded bg-white/20 text-white placeholder-white/70"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block mb-1">Short Break (min)</label>
              <input
                type="number"
                value={settings.shortBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                className="w-full p-1 rounded bg-white/20 text-white placeholder-white/70"
                min="1"
                max="30"
              />
            </div>
            <div>
              <label className="block mb-1">Long Break (min)</label>
              <input
                type="number"
                value={settings.longBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                className="w-full p-1 rounded bg-white/20 text-white placeholder-white/70"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block mb-1">Sessions to Long Break</label>
              <input
                type="number"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(e.target.value) || 4 }))}
                className="w-full p-1 rounded bg-white/20 text-white placeholder-white/70"
                min="2"
                max="10"
              />
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => setSettings(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
                className="rounded"
              />
              <span>Auto-start breaks</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoStartPomodoros}
                onChange={(e) => setSettings(prev => ({ ...prev, autoStartPomodoros: e.target.checked }))}
                className="rounded"
              />
              <span>Auto-start focus sessions</span>
            </label>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold font-mono">
              {formatTime(pomodoro.minutes, pomodoro.seconds)}
            </div>
            <div className="text-xs opacity-80">
              {Math.round(getProgress())}% complete
            </div>
          </div>
        </div>

        <div className="text-sm mb-4">
          {pomodoro.mode === 'focus' ? `${settings.focusTime} min focus` : 
           pomodoro.mode === 'shortBreak' ? `${settings.shortBreak} min break` :
           `${settings.longBreak} min break`}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={pomodoro.isActive && !pomodoro.isPaused ? handlePause : handleStart}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {pomodoro.isActive && !pomodoro.isPaused ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <div className="text-center text-sm">
        <div className="mb-1">
          {pomodoro.isActive ? (pomodoro.isPaused ? 'Paused' : 'Active') : 'Ready to start'}
        </div>
        <div className="flex justify-between text-xs opacity-80">
          <span>Completed: {completedSessions}</span>
          <span>Today: {sessionHistory.filter(s => 
            s.date.toDateString() === new Date().toDateString()
          ).length}</span>
        </div>
      </div>
    </div>
  );
};