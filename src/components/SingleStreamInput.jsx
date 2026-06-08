import { useState } from "react";
import { checkStream } from "../script";

export default function SingleStreamInput({ onPlay, onChecked, showToast }) {
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);

  function handlePlay() {
    if (!url.trim()) return;
    onPlay({ url: url.trim(), name: "", logo: "", group: "", status: "idle" });
  }

  async function handleCheck() {
    if (!url.trim() || checking) return;
    setChecking(true);
    try {
      const result = await checkStream(url.trim());
      onChecked?.(result);
      showToast?.(
        result.status === "playable"
          ? "✅ Stream চলবে!"
          : result.status === "blocked"
          ? "🔒 Blocked (CORS / Mixed-content)"
          : "❌ Dead / কোনো সাড়া নেই"
      );
    } catch {
      showToast?.("চেক করতে সমস্যা হয়েছে");
    } finally {
      setChecking(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handlePlay();
  }

  return (
    <div className="mb-5">
      <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Single Stream URL
      </label>

      <div className="single-row">
        <input
          id="singleUrl"
          className="input-field"
          placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="single-btns">
          <button className="btn-primary" id="btnPlaySingle" onClick={handlePlay}>
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            className="btn-secondary"
            id="btnCheckSingle"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? (
              <span
                style={{
                  width: 13,
                  height: 13,
                  border: "2px solid #c7d2fe",
                  borderTopColor: "#4f46e5",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin .7s linear infinite",
                }}
              />
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
            Check
          </button>
        </div>
      </div>
    </div>
  );
}
