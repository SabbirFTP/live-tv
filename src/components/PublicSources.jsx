import { useRef, useState } from "react";
import { PUBLIC_SOURCES, fetchSource, parseInput, checkBulk, copyToClipboard } from "../script";
import { useStreams } from "../context/StreamContext";

export default function PublicSources({ showToast, onResultsReady }) {
  const [loading, setLoading] = useState(null); // label of currently loading source
  const { setStreams, updateStream } = useStreams();
  const abortRef = useRef(null);

  async function handleSourceClick(src) {
    if (loading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(src.label);
    try {
      const text = await fetchSource(src.url, ctrl.signal);
      const limit = src.label.toLowerCase().includes("bugsfree") ||
                    src.label.toLowerCase().includes("time2shine")
                    ? 1500 : undefined;
      const parsed = parseInput(text, limit);

      if (!parsed.length) {
        showToast?.("কোনো বৈধ URL পাওয়া যায়নি");
        setLoading(null);
        return;
      }

      const initial = parsed.map((s) => ({ ...s, status: "checking" }));
      setStreams(initial);
      onResultsReady?.();

      await checkBulk(initial, {
        signal: ctrl.signal,
        onProgress: (d, _t, stream) => updateStream(d - 1, stream),
      });

      if (!ctrl.signal.aborted) showToast?.("✅ লোড ও চেক সম্পন্ন!");
    } catch (err) {
      if (err.name !== "AbortError") showToast?.("❌ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(null);
    }
  }

  async function handleCopyAllUrls() {
    const urls = PUBLIC_SOURCES.map((s) => s.url).join("\n");
    await copyToClipboard(urls);
    showToast?.("✅ সব URL কপি হয়েছে!");
  }

  async function handleCopyUrl(e, url) {
    e.stopPropagation();
    await copyToClipboard(url);
    showToast?.("URL কপি হয়েছে!");
  }

  return (
    <div className="glass-strong rounded-2xl p-5 mb-5 anim-slide-down" style={{ animationDelay: ".1s" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" />
            <circle cx="5" cy="19" r="1.5" fill="currentColor" />
          </svg>
          পাবলিক সোর্স — ক্লিক করে লোড + চেক
        </label>

        <button
          className="btn-ghost"
          id="btnCopyAllSources"
          style={{ padding: "5px 11px", fontSize: 11.5 }}
          onClick={handleCopyAllUrls}
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          সব URL কপি
        </button>
      </div>

      {/* Pills */}
      <div
        id="sourcesWrap"
        className={`flex flex-wrap gap-2${loading ? " busy" : ""}`}
      >
        {PUBLIC_SOURCES.map((src) => {
          const isLoading = loading === src.label;
          return (
            <button
              key={src.label}
              className={`source-pill${isLoading ? " loading" : ""}`}
              onClick={() => handleSourceClick(src)}
              title={src.url}
            >
              {isLoading && <span className="pill-spin" />}

              {!isLoading && (
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" />
                  <circle cx="5" cy="19" r="1.5" fill="currentColor" />
                </svg>
              )}

              <span>{src.label}</span>

              {src.tag && (
                <span className={`src-tag ${src.tag}`}>{src.tag}</span>
              )}

              {src.hint && (
                <span className="hint-badge">{src.hint}</span>
              )}

              {/* Copy URL button */}
              <button
                className="src-copy"
                title="URL কপি করুন"
                onClick={(e) => handleCopyUrl(e, src.url)}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </button>
          );
        })}
      </div>

      <p className="text-gray-400 mt-3" style={{ fontSize: 11 }}>
        ⚠️ বড় list (time2shine/Bugsfree) থেকে প্রথম ১৫০০টা check হয়।
        Axsport referrer-locked — browser-এ ব্লকড দেখাবে, VLC-তে চলতে পারে।
      </p>
    </div>
  );
}
