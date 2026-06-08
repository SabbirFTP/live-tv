import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Manages HLS.js / native HLS playback for a <video> element.
 * Returns { play, stop, playerInfo }.
 */
export function useHlsPlayer(videoRef) {
  const hlsRef = useRef(null);
  const [playerInfo, setPlayerInfo] = useState({
    type: "—",
    status: "—",
    proto: "—",
    responseTime: "—",
    playing: false,
    muted: false,
  });

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    destroyHls();
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    setPlayerInfo((p) => ({ ...p, playing: false, status: "Stopped" }));
  }, [videoRef, destroyHls]);

  const play = useCallback(
    (stream) => {
      const video = videoRef.current;
      if (!video) return;

      destroyHls();
      const url = stream.url;
      const isHls = /\.(m3u8?)(\?|$)/i.test(url) || !/\.(mp4|ts|webm)(\?|$)/i.test(url);
      const proto = /^https/i.test(url) ? "HTTPS" : "HTTP";
      const type = /\.m3u8/i.test(url) ? "HLS" : /\.mpd/i.test(url) ? "DASH" : "Stream";

      setPlayerInfo({
        type,
        status: "Loading…",
        proto,
        responseTime: "…",
        playing: true,
        muted: video.muted,
      });

      if (isHls && window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        const t0 = Date.now();
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setPlayerInfo((p) => ({
            ...p,
            status: "Live ●",
            responseTime: Date.now() - t0 + " ms",
          }));
        });
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setPlayerInfo((p) => ({ ...p, status: "Error" }));
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari)
        const t0 = Date.now();
        video.src = url;
        video.play().catch(() => {});
        video.addEventListener(
          "loadedmetadata",
          () => {
            setPlayerInfo((p) => ({
              ...p,
              status: "Live ●",
              responseTime: Date.now() - t0 + " ms",
            }));
          },
          { once: true }
        );
      } else {
        // Fallback direct src
        video.src = url;
        video.play().catch(() => {});
        setPlayerInfo((p) => ({ ...p, status: "Playing" }));
      }
    },
    [videoRef, destroyHls]
  );

  // Cleanup on unmount
  useEffect(() => () => destroyHls(), [destroyHls]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setPlayerInfo((p) => ({ ...p, muted: video.muted }));
  }, [videoRef]);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {}
  }, [videoRef]);

  const toggleFullscreen = useCallback((containerRef) => {
    const el = containerRef?.current || videoRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      }
    } catch {}
  }, [videoRef]);

  const setVolume = useCallback((val) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
  }, [videoRef]);

  return { play, stop, playerInfo, toggleMute, togglePip, toggleFullscreen, setVolume };
}
