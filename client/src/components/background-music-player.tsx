import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackgroundMusicPlayerProps {
  musicUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export function BackgroundMusicPlayer({ 
  musicUrl, 
  autoPlay = true, 
  loop = true, 
  className = '' 
}: BackgroundMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasInteractedRef = useRef(false);

  // Handle user interaction to enable autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        setHasUserInteracted(true);
        setShowAutoplayPrompt(false);
        
        // Try to start playing music after user interaction
        if (audioRef.current && !isPlaying && autoPlay) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            setIsLoading(true);
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch((error) => {
                console.log('Playback failed after user interaction:', error);
                setIsLoading(false);
              });
          }
        }
      }
    };

    // Listen for various user interactions
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [autoPlay, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => setIsLoading(false));
      audioRef.current.addEventListener('error', () => setIsLoading(false));
      
      if (autoPlay && hasUserInteracted) {
        // Try to autoplay after user interaction
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          setIsLoading(true);
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.log('Autoplay prevented:', error);
              setIsPlaying(false);
              setIsLoading(false);
              setShowAutoplayPrompt(true);
            });
        }
      }
    }
  }, [musicUrl, autoPlay, loop, volume, hasUserInteracted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.log('Playback failed:', error);
              setIsLoading(false);
            });
        }
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      // Unmute if user adjusts volume
      if (isMuted && newVolume > 0) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleAudioEnded = () => {
    if (!loop) {
      setIsPlaying(false);
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleStartMusic = () => {
    setShowAutoplayPrompt(false);
    setHasUserInteracted(true);
    togglePlay();
  };

  if (!musicUrl) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={musicUrl}
        onEnded={handleAudioEnded}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        preload="metadata"
      />
      
      {/* Autoplay Prompt */}
      {showAutoplayPrompt && (
        <div className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 min-w-[250px]">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Background Music</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Click to start background music for this wedding
          </p>
          <Button
            onClick={handleStartMusic}
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Play className="w-3 h-3 mr-1" />
            Start Music
          </Button>
        </div>
      )}
      
      {/* Floating music controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-2">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <Button
            onClick={togglePlay}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 relative"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-gray-700" />
            ) : (
              <Play className="w-4 h-4 text-gray-700" />
            )}
          </Button>

          {/* Music Icon with playing indicator */}
          <div className="relative">
            <Music className={`w-4 h-4 ${isPlaying ? 'text-amber-500' : 'text-gray-600'}`} />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-1">
            <Button
              onClick={toggleMute}
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 hover:bg-gray-100"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-gray-600" />
              ) : (
                <Volume2 className="w-3 h-3 text-gray-600" />
              )}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #D4B08C 0%, #D4B08C ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded controls on hover */}
      <div 
        className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className="text-xs text-gray-600 mb-2">Background Music</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Volume</span>
            <span className="text-xs text-gray-500">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-400">
            {isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom CSS for the slider
const style = document.createElement('style');
style.textContent = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #D4B08C;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .slider::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #D4B08C;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(style); 