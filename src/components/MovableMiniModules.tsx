import React, { useState, useRef, useEffect } from 'react';
import { Clock, Play, Pause, Music, Target, Coffee, Volume2, SkipForward, SkipBack, X, Maximize2, Minimize2, GripVertical, Move, Settings } from 'lucide-react';
import { useProductivity } from './ProductivityContext';

interface ModulePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ModuleState {
  id: string;
  isVisible: boolean;
  isMinimized: boolean;
  position: ModulePosition;
  zIndex: number;
}

export const MovableMiniModules: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { pomodoro, music, startPomodoro, pausePomodoro, playPause, skipToNext, skipToPrevious } = useProductivity();
  
  const [modules, setModules] = useState<ModuleState[]>([
    {
      id: 'time',
      isVisible: true,
      isMinimized: false,
      position: { x: 20, y: window.innerHeight - 200, width: 280, height: 120 },
      zIndex: 1000
    },
    {
      id: 'pomodoro',
      isVisible: true,
      isMinimized: false,
      position: { x: 320, y: window.innerHeight - 200, width: 300, height: 160 },
      zIndex: 1001
    },
    {
      id: 'music',
      isVisible: true,
      isMinimized: false,
      position: { x: 640, y: window.innerHeight - 200, width: 350, height: 180 },
      zIndex: 1002
    }
  ]);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    moduleId: string | null;
    startX: number;
    startY: number;
    startModuleX: number;
    startModuleY: number;
  }>({
    isDragging: false,
    moduleId: null,
    startX: 0,
    startY: 0,
    startModuleX: 0,
    startModuleY: 0
  });

  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    moduleId: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    isResizing: false,
    moduleId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging && dragState.moduleId) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        
        setModules(prev => prev.map(module => 
          module.id === dragState.moduleId 
            ? {
                ...module,
                position: {
                  ...module.position,
                  x: Math.max(0, Math.min(window.innerWidth - module.position.width, dragState.startModuleX + deltaX)),
                  y: Math.max(0, Math.min(window.innerHeight - module.position.height, dragState.startModuleY + deltaY))
                }
              }
            : module
        ));
      }

      if (resizeState.isResizing && resizeState.moduleId) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        
        setModules(prev => prev.map(module => 
          module.id === resizeState.moduleId 
            ? {
                ...module,
                position: {
                  ...module.position,
                  width: Math.max(200, resizeState.startWidth + deltaX),
                  height: Math.max(100, resizeState.startHeight + deltaY)
                }
              }
            : module
        ));
      }
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false, moduleId: null }));
      setResizeState(prev => ({ ...prev, isResizing: false, moduleId: null }));
    };

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState]);

  const handleMouseDown = (e: React.MouseEvent, moduleId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Bring module to front
    const maxZ = Math.max(...modules.map(m => m.zIndex));
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, zIndex: maxZ + 1 } : m
    ));

    if (action === 'drag') {
      setDragState({
        isDragging: true,
        moduleId,
        startX: e.clientX,
        startY: e.clientY,
        startModuleX: module.position.x,
        startModuleY: module.position.y
      });
    } else {
      setResizeState({
        isResizing: true,
        moduleId,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: module.position.width,
        startHeight: module.position.height
      });
    }
  };

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isVisible: !module.isVisible }
        : module
    ));
  };

  const toggleMinimize = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isMinimized: !module.isMinimized }
        : module
    ));
  };

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

  const renderTimeModule = (module: ModuleState) => (
    <div
      key={module.id}
      className="fixed bg-white/85 backdrop-blur-md border border-coral-200/50 rounded-xl shadow-lg transition-all duration-300"
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.position.width,
        height: module.isMinimized ? 40 : module.position.height,
        zIndex: module.zIndex,
        cursor: dragState.isDragging && dragState.moduleId === module.id ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 bg-gradient-to-r from-coral-500/80 to-salmon-500/80 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e, module.id, 'drag')}
      >
        <div className="flex items-center space-x-2 text-white">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Time</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => toggleMinimize(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title={module.isMinimized ? 'Expand' : 'Minimize'}
          >
            {module.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => toggleModule(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!module.isMinimized && (
        <div className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-1 font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-coral-600">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {!module.isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
          onMouseDown={(e) => handleMouseDown(e, module.id, 'resize')}
        >
          <GripVertical className="h-3 w-3 text-gray-400 rotate-45" />
        </div>
      )}
    </div>
  );

  const renderPomodoroModule = (module: ModuleState) => (
    <div
      key={module.id}
      className="fixed bg-white/85 backdrop-blur-md border border-coral-200/50 rounded-xl shadow-lg transition-all duration-300"
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.position.width,
        height: module.isMinimized ? 40 : module.position.height,
        zIndex: module.zIndex
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 bg-gradient-to-r from-coral-500/80 to-salmon-500/80 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e, module.id, 'drag')}
      >
        <div className="flex items-center space-x-2 text-white">
          {pomodoro.mode === 'focus' ? (
            <Target className="h-4 w-4" />
          ) : (
            <Coffee className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">Pomodoro</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => toggleMinimize(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title={module.isMinimized ? 'Expand' : 'Minimize'}
          >
            {module.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => toggleModule(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!module.isMinimized && (
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-xl font-bold text-gray-800 mb-1 font-mono">
              {formatPomodoroTime(pomodoro.minutes, pomodoro.seconds)}
            </div>
            <div className="text-sm text-coral-600">
              {pomodoro.mode === 'focus' ? 'Focus time' : 
               pomodoro.mode === 'shortBreak' ? 'Short break' : 'Long break'}
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-3">
            <button 
              onClick={handlePomodoroToggle}
              className="p-2 rounded-full bg-coral-500/80 text-white hover:bg-coral-600/80 transition-colors backdrop-blur-sm"
              title={pomodoro.isActive && !pomodoro.isPaused ? 'Pause' : 'Start'}
            >
              {pomodoro.isActive && !pomodoro.isPaused ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {!module.isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
          onMouseDown={(e) => handleMouseDown(e, module.id, 'resize')}
        >
          <GripVertical className="h-3 w-3 text-gray-400 rotate-45" />
        </div>
      )}
    </div>
  );

  const renderMusicModule = (module: ModuleState) => (
    <div
      key={module.id}
      className="fixed bg-white/85 backdrop-blur-md border border-coral-200/50 rounded-xl shadow-lg transition-all duration-300"
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.position.width,
        height: module.isMinimized ? 40 : module.position.height,
        zIndex: module.zIndex
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 bg-gradient-to-r from-coral-500/80 to-salmon-500/80 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e, module.id, 'drag')}
      >
        <div className="flex items-center space-x-2 text-white">
          <Music className="h-4 w-4" />
          <span className="text-sm font-medium">Music</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => toggleMinimize(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title={module.isMinimized ? 'Expand' : 'Minimize'}
          >
            {module.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => toggleModule(module.id)}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!module.isMinimized && (
        <div className="p-4">
          {music.currentTrack ? (
            <>
              <div className="text-center mb-3">
                <div className="font-medium text-gray-800 truncate text-sm" title={music.currentTrack.name}>
                  {music.currentTrack.name}
                </div>
                <div className="text-xs text-coral-600">
                  {formatMusicTime(music.currentTime)} / {formatMusicTime(music.currentTrack.duration)}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); skipToPrevious(); }}
                  disabled={!music.currentTrack}
                  className="p-1 rounded-full bg-coral-500/80 text-white hover:bg-coral-600/80 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title="Previous track"
                >
                  <SkipBack className="h-3 w-3" />
                </button>
                <button 
                  onClick={handleMusicToggle}
                  disabled={!music.currentTrack}
                  className="p-2 rounded-full bg-coral-500/80 text-white hover:bg-coral-600/80 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title={music.isPlaying ? 'Pause' : 'Play'}
                >
                  {music.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); skipToNext(); }}
                  disabled={!music.currentTrack}
                  className="p-1 rounded-full bg-coral-500/80 text-white hover:bg-coral-600/80 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title="Next track"
                >
                  <SkipForward className="h-3 w-3" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-coral-100 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-coral-500 to-salmon-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${music.currentTrack ? (music.currentTime / music.currentTrack.duration) * 100 : 0}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-600">
              No music loaded
            </div>
          )}
        </div>
      )}

      {/* Resize Handle */}
      {!module.isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
          onMouseDown={(e) => handleMouseDown(e, module.id, 'resize')}
        >
          <GripVertical className="h-3 w-3 text-gray-400 rotate-45" />
        </div>
      )}
    </div>
  );

  const visibleModules = modules.filter(module => module.isVisible);

  return (
    <>
      {visibleModules.map(module => {
        switch (module.id) {
          case 'time':
            return renderTimeModule(module);
          case 'pomodoro':
            return renderPomodoroModule(module);
          case 'music':
            return renderMusicModule(module);
          default:
            return null;
        }
      })}

      {/* Control Panel for Hidden Modules */}
      {modules.some(m => !m.isVisible) && (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-coral-200 rounded-lg shadow-lg p-2 z-[2000]">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Show:</span>
            {modules.filter(m => !m.isVisible).map(module => (
              <button
                key={module.id}
                onClick={() => toggleModule(module.id)}
                className="px-2 py-1 text-xs bg-coral-500 hover:bg-coral-600 text-white rounded transition-colors"
                title={`Show ${module.id} module`}
              >
                {module.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};