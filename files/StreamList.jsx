import { useState, useMemo, useCallback } from "react";
import { useStreams } from "../context/StreamContext";
import { downloadM3U, copyToClipboard, buildM3U, checkBulk } from "../script";
import StreamCard from "./StreamCard";

const TABS = [
  { id: "all",      label: "সব",       icon: "☰" },
  { id: "playable", label: "Live",      icon: "●" },
  { id: "blocked",  label: "Blocked",  icon: "⚠" },
  { id: "dead",     label: "Dead",     icon: "✕" },
];

export default function StreamList({ onPlay, showToast }) {
  const { streams, updateStream, deleteStreams, deleteByStatus, clearStreams } = useStreams();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [recheckingAll, setRecheckingAll] = useState(false);

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: streams.length, playable: 0, blocked: 0, dead: 0 };
    streams.forEach((s) => {
      if (s.status === "playable") c.playable++;
      else if (s.status === "blocked") c.blocked++;
      else if (s.status === "dead") c.dead++;
    });
    return c;
  }, [streams]);

  // ── Filtered streams ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return streams
      .map((s, i) => ({ ...s, _idx: i }))
      .filter((s) => {
        if (activeTab !== "all" && s.status !== activeTab) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            s.name?.toLowerCase().includes(q) ||
            s.url?.toLowerCase().includes(q) ||
            s.group?.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [streams, activeTab, search]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSelect(realIdx) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(realIdx) ? next.delete(realIdx) : next.add(realIdx);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((s) => s._idx)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  function deleteSelected() {
    deleteStreams(selected);
    setSelected(new Set());
  }

  function deleteDeadAll() {
    deleteByStatus("dead");
    showToast?.("Dead স্ট্রিম মুছে ফেলা হয়েছে");
  }

  async function copySelectedM3U() {
    const sel = streams.filter((_, i) => selected.has(i));
    if (!sel.length) return;
    await copyToClipboard(buildM3U(sel));
    showToast?.("✅ M3U কপি হয়েছে!");
  }

  async function copySelectedURLs() {
    const sel = streams.filter((_, i) => selected.has(i));
    if (!sel.length) return;
    await copyToClipboard(sel.map((s) => s.url).join("\n"));
    showToast?.("✅ URL সমূহ কপি হয়েছে!");
  }

  function downloadSelected() {
    const sel = streams.filter((_, i) => selected.has(i));
    if (sel.length) downloadM3U(sel, "selected-streams.m3u");
  }

  function downloadAll() {
    if (streams.length) downloadM3U(streams, "live-tv-pro.m3u");
  }

  async function downloadByStatus(status) {
    const fil = streams.filter((s) => s.status === status);
    if (!fil.length) { showToast?.("কোনো stream নেই"); return; }
    downloadM3U(fil, `${status}-streams.m3u`);
  }

  async function recheckAll() {
    if (recheckingAll) return;
    setRecheckingAll(true);
    try {
      await checkBulk(streams, {
        onProgress: (d, _t, stream) => updateStream(d - 1, stream),
      });
      showToast?.("✅ পুনরায় চেক সম্পন্ন!");
    } finally {
      setRecheckingAll(false);
    }
  }

  // ── Copy ALL live as M3U ──────────────────────────────────────────────────
  async function copyAllLiveM3U() {
    const live = streams.filter((s) => s.status === "playable");
    if (!live.length) { showToast?.("কোনো live stream নেই"); return; }
    await copyToClipboard(buildM3U(live));
    showToast?.(`✅ ${live.length}টি live M3U কপি হয়েছে!`);
  }

  if (!streams.length) return null;

  return (
    <div className="glass-strong rounded-2xl p-5 mb-5 anim-slide-up" style={{ animationDelay: ".15s" }}>
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
          <svg width="16" height="16" fill="#4f46e5" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="2" rx="1" />
            <rect x="2" y="11" width="20" height="2" rx="1" />
            <rect x="2" y="15" width="20" height="2" rx="1" />
          </svg>
          স্ট্রিম লিস্ট
          <span className="badge-count" style={{ background: "#eef2ff", color: "#4f46e5" }}>
            {streams.length}
          </span>
        </h3>

        {/* Action buttons row */}
        <div className="flex gap-2 flex-wrap">
          {/* Download All */}
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            title="সব ডাউনলোড করুন"
            onClick={downloadAll}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            সব .m3u
          </button>

          {/* Copy Live M3U */}
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            title="Live M3U কপি"
            onClick={copyAllLiveM3U}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Live M3U কপি
          </button>

          {/* Download Live */}
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => downloadByStatus("playable")}
          >
            <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span style={{ color: "#10b981" }}>Live .m3u</span>
          </button>

          {/* Delete dead */}
          {counts.dead > 0 && (
            <button
              className="btn-danger"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={deleteDeadAll}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 6h18M19 6l-1 14H6L5 6" />
              </svg>
              Dead মুছুন ({counts.dead})
            </button>
          )}

          {/* Recheck all */}
          <button
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={recheckAll}
            disabled={recheckingAll}
            title="পুনরায় সব চেক করুন"
          >
            <svg
              width="12" height="12"
              fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              style={recheckingAll ? { animation: "spin .7s linear infinite" } : {}}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.5 9A9 9 0 0121 12M20.5 15A9 9 0 013 12" />
            </svg>
            Re-check
          </button>

          {/* Clear all */}
          <button
            className="btn-danger"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => { clearStreams(); setSelected(new Set()); }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M3 6h18M19 6l-1 14H6L5 6M8 6V4h8v2" />
            </svg>
            সব মুছুন
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span
              className="badge-count"
              style={{
                background: activeTab === tab.id ? "#eef2ff" : "rgba(0,0,0,.07)",
                color: activeTab === tab.id ? "#4f46e5" : "#6b7280",
              }}
            >
              {counts[tab.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="input-field"
          style={{ paddingLeft: 36, paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
          placeholder="চ্যানেলের নাম বা URL খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="select-bar mb-3">
          <svg width="15" height="15" fill="white" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>{selected.size}টি সিলেক্ট</span>
          <button onClick={selectAll}>সব সিলেক্ট</button>
          <button onClick={copySelectedURLs}>URL কপি</button>
          <button onClick={copySelectedM3U}>M3U কপি</button>
          <button onClick={downloadSelected}>Download</button>
          <button className="del" onClick={deleteSelected}>মুছুন</button>
          <button onClick={clearSelection} style={{ marginLeft: "auto" }}>
            ✕ বাতিল
          </button>
        </div>
      )}

      {/* Select all / deselect row */}
      {filtered.length > 0 && selected.size === 0 && (
        <div className="flex items-center gap-2 mb-2">
          <button
            className="text-xs text-indigo-400 hover:text-indigo-600 font-semibold"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
            onClick={selectAll}
          >
            সব সিলেক্ট করুন
          </button>
          <span className="text-gray-300 text-xs">({filtered.length}টি দেখা যাচ্ছে)</span>
        </div>
      )}

      {/* Stream cards */}
      <div className="flex flex-col gap-2.5" id="streamList">
        {filtered.map((stream, i) => (
          <StreamCard
            key={stream.url + stream._idx}
            stream={stream}
            index={stream._idx}
            selected={selected.has(stream._idx)}
            onToggleSelect={toggleSelect}
            onPlay={onPlay}
            onUpdate={updateStream}
            onDelete={(idx) => { deleteStreams(new Set([idx])); setSelected((p) => { const n = new Set(p); n.delete(idx); return n; }); }}
            showToast={showToast}
            animDelay={Math.min(i * 30, 300)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-2 opacity-30">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="font-semibold">কোনো রেজাল্ট নেই</p>
        </div>
      )}
    </div>
  );
}
