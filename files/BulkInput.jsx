import { useState, useRef } from "react";
import { parseInput, checkBulk } from "../script";
import { useStreams } from "../context/StreamContext";

const PLACEHOLDER = `#EXTINF:-1 tvg-name="Channel Name" tvg-logo="https://...logo.png" group-title="News",Channel Name
https://example.com/stream/index.m3u8

অথবা শুধু URL সমূহ:
https://stream1.example.com/index.m3u8
https://stream2.example.com/index.m3u8`;

export default function BulkInput({ showToast, onResultsReady }) {
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const { setStreams, updateStream } = useStreams();
  const abortRef = useRef(null);

  function handleClear() {
    setText("");
    setDone(0);
    setTotal(0);
    setChecking(false);
    abortRef.current?.abort();
  }

  async function handleBulkCheck() {
    if (!text.trim() || checking) return;

    const parsed = parseInput(text, 1500);
    if (!parsed.length) {
      showToast?.("কোনো বৈধ URL পাওয়া যায়নি");
      return;
    }

    // Mark all as checking
    const initial = parsed.map((s) => ({ ...s, status: "checking" }));
    setStreams(initial);
    setDone(0);
    setTotal(parsed.length);
    setChecking(true);
    onResultsReady?.();

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    await checkBulk(initial, {
      signal: ctrl.signal,
      onProgress: (d, t, stream) => {
        setDone(d);
        updateStream(d - 1, stream);
      },
    });

    if (!ctrl.signal.aborted) {
      setChecking(false);
      showToast?.("✅ চেক সম্পন্ন!");
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setChecking(false);
    showToast?.("⏹ থামানো হয়েছে");
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
          বাল্ক / M3U / HTML পেস্ট করুন
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
      </div>

      {/* Textarea */}
      <div className="mb-3">
        <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
          M3U List / URL / HTML কোড পেস্ট করুন
        </label>
        <textarea
          id="bulkInput"
          className="input-field"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          className="btn-primary"
          id="btnBulkCheck"
          onClick={handleBulkCheck}
          disabled={checking}
        >
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          সব চেক করুন
        </button>

        <button className="btn-ghost" id="btnClearAll" onClick={handleClear}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
          </svg>
          Clear
        </button>

        {checking && (
          <span id="bulkProgress" className="text-sm text-gray-400 ml-auto">
            <span id="doneCount">{done}</span> /{" "}
            <span id="totalCount">{total}</span>
          </span>
        )}
      </div>

      {/* Progress bar */}
      {checking && (
        <div id="progressWrap" className="mt-4">
          <div className="progress-bar">
            <div className="progress-fill" id="progressFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <p className="text-xs text-gray-400" id="progressLabel">
              চেক করা হচ্ছে... ({pct}%)
            </p>
            <button
              id="btnStopCheck"
              className="btn-danger"
              style={{ padding: "3px 11px", fontSize: 11 }}
              onClick={handleStop}
            >
              ⏹ থামান
            </button>
          </div>
        </div>
      )}
    </>
  );
}
