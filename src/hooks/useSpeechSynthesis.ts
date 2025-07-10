import { useState, useEffect, useRef } from 'react';

export interface SpeechOptions {
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
}

export const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs to track state across re-renders
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        try {
          const availableVoices = window.speechSynthesis.getVoices();
          setVoices(availableVoices);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to load voices:', error);
        }
      };
      
      // Load voices immediately if available
      loadVoices();
      
      // Also listen for the voiceschanged event
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Cleanup function
      return () => {
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const speak = (text: string, options: SpeechOptions = { rate: 1, pitch: 1, volume: 1 }) => {
    if (!isSupported || !text || !isInitialized) {
      console.warn('Speech synthesis not available or not initialized');
      return;
    }
    
    try {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      // Reset state
      setCurrentText(text);
      setCurrentWordIndex(0);
      setIsPlaying(false);
      setIsPaused(false);
      
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.1, Math.min(10, options.rate || 1));
      utterance.pitch = Math.max(0, Math.min(2, options.pitch || 1));
      utterance.volume = Math.max(0, Math.min(1, options.volume || 1));
      
      if (options.voice) {
        utterance.voice = options.voice;
      }
      
      // Enhanced word boundary tracking
      utterance.onboundary = (event) => {
        try {
          if (event.name === 'word') {
            const words = text.split(/\s+/);
            let charCount = 0;
            let wordIndex = 0;
            
            for (let i = 0; i < words.length; i++) {
              if (charCount + words[i].length >= event.charIndex) {
                wordIndex = i;
                break;
              }
              charCount += words[i].length + 1; // +1 for space
            }
            
            setCurrentWordIndex(wordIndex);
          }
        } catch (error) {
          console.warn('Error in boundary event:', error);
        }
      };
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        isPlayingRef.current = true;
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentUtterance(null);
        setCurrentWordIndex(0);
        isPlayingRef.current = false;
        utteranceRef.current = null;
      };
      
      utterance.onpause = () => {
        setIsPaused(true);
      };
      
      utterance.onresume = () => {
        setIsPaused(false);
      };
      
      utterance.onerror = (event) => {
        // Handle interruption errors gracefully
        if (event.error === 'interrupted') {
          console.warn('Speech synthesis interrupted:', event.error);
        } else {
          console.error('Speech synthesis error:', event.error);
          // Reset state on other errors
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentUtterance(null);
          setCurrentWordIndex(0);
          isPlayingRef.current = false;
          utteranceRef.current = null;
        }
      };
      
      // Store references
      setCurrentUtterance(utterance);
      utteranceRef.current = utterance;
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Failed to start speech synthesis:', error);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const pause = () => {
    if (!isSupported) return;
    
    try {
      if (isPlaying && !isPaused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Failed to pause speech:', error);
    }
  };

  const resume = () => {
    if (!isSupported) return;
    
    try {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Failed to resume speech:', error);
    }
  };

  const stop = () => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
      setCurrentWordIndex(0);
      isPlayingRef.current = false;
      utteranceRef.current = null;
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  };

  return {
    isSupported,
    isPlaying,
    isPaused,
    voices,
    currentWordIndex,
    currentText,
    speak,
    pause,
    resume,
    stop
  };
};