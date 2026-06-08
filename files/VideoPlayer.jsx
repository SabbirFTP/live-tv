import { useRef, useState, useEffect } from "react";
import { useHlsPlayer } from "../hooks/useHlsPlayer";

export default function VideoPlayer({ stream, onStop }) {
  const videoRef = useRef(null);
  const vidWrapRef = useRef(null);
  const containerRef = useRef(null);
  const { play, stop, playerInfo, toggleMute, togglePip, toggleFullscreen, setVolume } =
    useHlsPlayer(videoRef);

  const [showCtrl, setShowCtrl] = useState(false);
  const [paused, setPaused] = useState(false);
  const ctrlTimer = useRef(null);

  // Play whenever stream changes
  useEffect(() => {
    if (stream) play(stream);
  }, [stream]); // eslint-disable-line

  function handleStop() {
    stop();
    onStop?.();
  }

  function handleFullscreen() {
    toggleFullscreen(containerRef);
  }

  // Mouse/touch activity → show controls
  function handleActivity() {
    setShowCtrl(true);
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setShowCtrl(false), 2800);
  }

  function togglePlayPause() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); }
    else          { v.pause(); setPaused(true); }
  }

  const hasName = stream?.name && stream.name.trim();
  const hasLogo = stream?.logo && stream.logo.trim();

  return (
    <div
      id="playerSection"
      ref={containerRef}
      className="glass-strong rounded-2xl overflow-hidden mb-5 anim-pop"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-indigo-50 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {/* Logo / placeholder */}
          {hasLogo ? (
            <img
              id="playerLogo"
              src={stream.logo}
              alt={stream.name}
              className="channel-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : hasName ? (
            <div className="logo-placeholder" style={{ width: 32, height: 32, fontSize: 11, borderRadius: 7 }}>
              {stream.name.charAt(0).toUpperCase()}
            </div>
          ) : null}

          <div>
            {hasName && (
              <p id="playerChannelName" className="font-bold text-gray-800 text-sm">
                {stream.name}
              </p>
            )}
            <div className="flex items-center gap-2">
              <svg width="14" height="14" fill="#4f46e5" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                <path d="M10 8.5l5 3.5-5 3.5z" />
              </svg>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                Live Player
              </span>
              {playerInfo.playing && (
                <span id="liveBadgeText" className="tag tag-live">● LIVE</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="btn-ghost"
            id="btnFullscreen"
            style={{ padding: "6px 11px", fontSize: 12 }}
            onClick={handleFullscreen}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
            </svg>
            Full
          </button>
          <button
            className="btn-danger"
            id="btnStop"
            style={{ padding: "6px 11px", fontSize: 12 }}
            onClick={handleStop}
          >
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop
          </button>
        </div>
      </div>

      {/* Video area */}
      <div
        id="vidWrap"
        ref={vidWrapRef}
        className={`relative bg-black vid-wrap${showCtrl ? " show-ctrl" : ""}`}
        style={{ aspectRatio: "16/9" }}
        onMouseMove={handleActivity}
        onTouchStart={handleActivity}
        onClick={handleActivity}
      >
        <video
          id="mainVideo"
          ref={videoRef}
          playsInline
          className="w-full h-full block"
        />

        {/* Loading overlay */}
        {playerInfo.status === "Loading…" && (
          <div
            id="videoOverlay"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black bg-opacity-80"
          >
            <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 spinner" />
            <p className="text-white text-sm opacity-60">লোড হচ্ছে...</p>
          </div>
        )}

        {/* Custom controls */}
        <div id="playerCtrl" className="player-ctrl">
          {/* Play/Pause */}
          <button className="pc-btn" id="pcPlay" aria-label="Play/Pause" onClick={togglePlayPause}>
            {paused ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            )}
          </button>

          {/* Mute */}
          <button className="pc-btn" id="pcMute" aria-label="Mute" onClick={toggleMute}>
            {playerInfo.muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M15.5 8.5a5 5 0 010 7" />
              </svg>
            )}
          </button>

          {/* Volume slider */}
          <input
            id="pcVol"
            className="pc-vol"
            type="range"
            min="0"
            max="1"
            step="0.05"
            defaultValue="1"
            aria-label="Volume"
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />

          <span className="pc-live">LIVE</span>
          <span className="pc-spacer" />

          {/* PiP */}
          <button className="pc-btn" id="pcPip" aria-label="Picture in Picture" onClick={togglePip}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4.5" width="20" height="15" rx="2" />
              <rect x="12" y="11" width="8" height="6" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button className="pc-btn" id="pcFs" aria-label="Fullscreen" onClick={handleFullscreen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-indigo-50 border-t border-indigo-50">
        {[
          { label: "Type",     value: playerInfo.type },
          { label: "Status",   value: playerInfo.status },
          { label: "Protocol", value: playerInfo.proto },
          { label: "Response", value: playerInfo.responseTime },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="font-bold text-gray-700 text-sm" style={{ minHeight: 20 }}>{value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
