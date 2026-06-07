/**
 * Player Component
 * HLS video player with controls for live TV streaming
 * Supports fullscreen, mute, volume, and Picture-in-Picture modes
 */

import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import type { Channel } from '../../types/channel';

interface PlayerProps {
  channel?: Channel;
  isPlaying: boolean;
  onPlay?: () => void;
  onStop?: () => void;
}

const Player: React.FC<PlayerProps> = ({ channel, isPlaying, onPlay, onStop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const hlsRef = useRef<Hls | null>(null);

  /**
   * Initialize HLS stream when channel URL changes
   */
  useEffect(() => {
    if (!videoRef.current || !channel?.url) return;

    const initializeHls = async () => {
      try {
        // Clean up previous HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        // Check if HLS.js is supported
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.loadSource(channel.url);
          hls.attachMedia(videoRef.current!);

          hlsRef.current = hls;

          // Log errors but don't crash
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('Fatal HLS error:', data);
              onStop?.();
            }
          });
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          if (videoRef.current) {
            videoRef.current.src = channel.url;
          }
        }

        videoRef.current?.play?.().catch((e) => {
          console.error('Playback error:', e);
          onStop?.();
        });
        onPlay?.();
      } catch (error) {
        console.error('Failed to initialize stream:', error);
        onStop?.();
      }
    };

    if (isPlaying) {
      initializeHls();
    } else {
      videoRef.current.pause();
    }

    return () => {
      if (hlsRef.current && !isPlaying) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.url, isPlaying, onPlay, onStop]);

  /**
   * Handle fullscreen toggle
   */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await videoRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  /**
   * Handle Picture-in-Picture toggle
   */
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current?.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Select a channel to play</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Video Player */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
        <video
          ref={videoRef}
          className="w-full h-full"
          crossOrigin="anonymous"
          controls={false}
        />

        {/* Player Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              {/* Volume Control */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                  }
                }}
                className="w-20 h-1 bg-white/30 rounded cursor-pointer"
              />

              <button
                onClick={togglePip}
                className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                title="Picture in Picture"
              >
                📱
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
              title="Fullscreen"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* Channel Info */}
      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
        {channel.logo && (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-12 h-12 rounded object-contain bg-white"
          />
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">{channel.name}</h2>
          <p className="text-xs text-slate-600">
            Status: <span className="font-semibold text-emerald-600">{channel.status}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Player;
