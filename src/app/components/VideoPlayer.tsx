import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, X, Minimize2, Radio, Loader2
} from 'lucide-react';
import type { Stream } from './types';
import { ChannelAvatar } from './ChannelAvatar';
import { detectProtocol } from './utils';

interface Props {
  stream: Stream | null;
  onClose: () => void;
}

export function VideoPlayer({ stream, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMini, setIsMini] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadStream = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream unavailable or blocked by CORS policy.');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        });
      }, { once: true });
    } else {
      video.src = url;
      video.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setError('Unable to play this stream format.');
        setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (stream) loadStream(stream.url);
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [stream, loadStream]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolume = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!stream) return null;

  const protocol = detectProtocol(stream.url);

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 bg-black border border-border shadow-2xl transition-all duration-300 ${
        isMini
          ? 'bottom-4 right-4 w-72 rounded-xl overflow-hidden'
          : 'bottom-4 right-4 w-[420px] rounded-xl overflow-hidden'
      }`}
    >
      {/* Video */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-4">
            <Radio className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground text-center">{error}</p>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <ChannelAvatar name={stream.name} logo={stream.logo} size={20} />
            {!isMini && <span className="text-white text-xs truncate max-w-[180px]">{stream.name}</span>}
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {!isMini && 'LIVE'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMini(m => !m)}
              className="p-1 rounded text-white/60 hover:text-white transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-white/60 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      {!isMini && (
        <div className="px-3 py-2.5 bg-[#0d0d0d] border-t border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={e => handleVolume(Number(e.target.value))}
              className="flex-1 h-0.5 accent-white bg-white/20 rounded cursor-pointer"
            />
            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Stream info */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
            <span className="text-xs font-mono text-white/30">{protocol}</span>
            {stream.responseTime && (
              <span className="text-xs font-mono text-white/30">{stream.responseTime}ms</span>
            )}
            <span className="text-xs font-mono text-white/20 truncate">{stream.group}</span>
          </div>
        </div>
      )}
    </div>
  );
}
