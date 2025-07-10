import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  isPaused: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  session: number;
}

interface Track {
  id: string;
  name: string;
  duration: number;
  url: string;
  file: File;
}

interface MusicState {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

interface ProductivityContextType {
  // Pomodoro
  pomodoro: PomodoroState;
  setPomodoro: React.Dispatch<React.SetStateAction<PomodoroState>>;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  
  // Music
  music: MusicState;
  setMusic: React.Dispatch<React.SetStateAction<MusicState>>;
  playPause: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  addTracks: (files: FileList) => void;
  
  // Audio ref for persistence
  audioRef: React.RefObject<HTMLAudioElement>;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
};

export const ProductivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    isActive: false,
    isPaused: false,
    mode: 'focus',
    session: 1
  });

  const [music, setMusic] = useState<MusicState>({
    tracks: [],
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 0.7,
    isShuffled: false,
    repeatMode: 'none'
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro timer logic
  useEffect(() => {
    if (pomodoro.isActive && !pomodoro.isPaused) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoro(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else {
            // Timer finished
            return { ...prev, isActive: false };
          }
        });
      }, 1000);
    } else {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    }

    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    };
  }, [pomodoro.isActive, pomodoro.isPaused]);

  // Simple timer update for music
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (music.isPlaying && music.currentTrack) {
      interval = setInterval(() => {
        setMusic(prev => ({
          ...prev,
          currentTime: Math.min(prev.currentTime + 1, prev.currentTrack?.duration || 0)
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [music.isPlaying, music.currentTrack]);

  const startPomodoro = () => {
    setPomodoro(prev => ({ ...prev, isActive: true, isPaused: false }));
  };

  const pausePomodoro = () => {
    setPomodoro(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetPomodoro = () => {
    setPomodoro({
      minutes: 25,
      seconds: 0,
      isActive: false,
      isPaused: false,
      mode: 'focus',
      session: 1
    });
  };

  const playPause = () => {
    if (!audioRef.current || !music.currentTrack) return;

    if (music.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
    }
    setMusic(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skipToNext = () => {
    if (music.tracks.length === 0) return;
    
    const currentIndex = music.tracks.findIndex(track => track.id === music.currentTrack?.id);
    let nextIndex;
    
    if (music.isShuffled) {
      // For shuffle, pick a random track that's not the current one
      const availableIndices = music.tracks.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
    } else {
      nextIndex = (currentIndex + 1) % music.tracks.length;
    }
    
    const wasPlaying = music.isPlaying;
    setMusic(prev => ({ 
      ...prev, 
      currentTrack: prev.tracks[nextIndex],
      currentTime: 0,
      isPlaying: false // Will be set to true after audio loads if it was playing
    }));

    // Resume playing if music was playing before skip
    if (wasPlaying && audioRef.current) {
      setTimeout(() => {
        audioRef.current?.play().then(() => {
          setMusic(prev => ({ ...prev, isPlaying: true }));
        }).catch(error => {
          console.error('Failed to play next track:', error);
        });
      }, 100);
    }
  };

  const skipToPrevious = () => {
    if (music.tracks.length === 0) return;
    
    const currentIndex = music.tracks.findIndex(track => track.id === music.currentTrack?.id);
    let prevIndex;
    
    if (music.isShuffled) {
      // For shuffle, pick a random track that's not the current one
      const availableIndices = music.tracks.map((_, i) => i).filter(i => i !== currentIndex);
      prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
    } else {
      prevIndex = (currentIndex - 1 + music.tracks.length) % music.tracks.length;
    }
    
    const wasPlaying = music.isPlaying;
    setMusic(prev => ({ 
      ...prev, 
      currentTrack: prev.tracks[prevIndex],
      currentTime: 0,
      isPlaying: false // Will be set to true after audio loads if it was playing
    }));

    // Resume playing if music was playing before skip
    if (wasPlaying && audioRef.current) {
      setTimeout(() => {
        audioRef.current?.play().then(() => {
          setMusic(prev => ({ ...prev, isPlaying: true }));
        }).catch(error => {
          console.error('Failed to play previous track:', error);
        });
      }, 100);
    }
  };

  const addTracks = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        audio.addEventListener('loadedmetadata', () => {
          const track: Track = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ''),
            duration: audio.duration,
            url,
            file
          };
          
          setMusic(prev => {
            const newTracks = [...prev.tracks, track];
            return {
              ...prev,
              tracks: newTracks,
              currentTrack: prev.currentTrack || track
            };
          });
        });

        audio.addEventListener('error', () => {
          console.error('Failed to load audio file:', file.name);
          URL.revokeObjectURL(url);
        });
      }
    });
  };

  return (
    <ProductivityContext.Provider value={{
      pomodoro,
      setPomodoro,
      startPomodoro,
      pausePomodoro,
      resetPomodoro,
      music,
      setMusic,
      playPause,
      skipToNext,
      skipToPrevious,
      addTracks,
      audioRef
    }}>
      {children}
      {/* Global audio element for music persistence */}
      {music.currentTrack && (
        <audio
          ref={audioRef}
          src={music.currentTrack.url}
          onLoadedData={() => {
            if (music.isPlaying && audioRef.current) {
              audioRef.current.play().catch(error => {
                console.error('Failed to auto-play audio:', error);
              });
            }
          }}
          preload="metadata"
        />
      )}
    </ProductivityContext.Provider>
  );
};