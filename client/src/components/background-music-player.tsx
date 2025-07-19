import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      
      if (autoPlay) {
        // Try to autoplay, but handle browser restrictions
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.log('Autoplay prevented:', error);
              setIsPlaying(false);
            });
        }
      }
    }
  }, [musicUrl, autoPlay, loop, volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
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
    }
  };

  const handleAudioEnded = () => {
    if (!loop) {
      setIsPlaying(false);
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
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
      
      {/* Floating music controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-2">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <Button
            onClick={togglePlay}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-gray-700" />
            ) : (
              <Play className="w-4 h-4 text-gray-700" />
            )}
          </Button>

          {/* Music Icon */}
          <Music className="w-4 h-4 text-gray-600" />

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

      {/* Auto-hide controls after 3 seconds */}
      {showControls && (
        <div className="absolute bottom-12 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
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
          </div>
        </div>
      )}
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