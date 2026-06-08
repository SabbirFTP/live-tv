import { useMemo } from "react";
import { useStreams } from "../context/StreamContext";

export default function StatsBar() {
  const { streams } = useStreams();

  const stats = useMemo(() => {
    const total    = streams.length;
    const playable = streams.filter((s) => s.status === "playable").length;
    const blocked  = streams.filter((s) => s.status === "blocked").length;
    const dead     = streams.filter((s) => s.status === "dead").length;
    const checking = streams.filter((s) => s.status === "checking").length;
    return { total, playable, blocked, dead, checking };
  }, [streams]);

  if (!streams.length) return null;

  const cards = [
    {
      value: stats.total,
      label: "মোট",
      icon: (
        <svg width="18" height="18" fill="#4f46e5" viewBox="0 0 24 24">
          <rect x="2" y="7"  width="20" height="2" rx="1" />
          <rect x="2" y="11" width="20" height="2" rx="1" />
          <rect x="2" y="15" width="20" height="2" rx="1" />
        </svg>
      ),
      color: "#4f46e5",
    },
    {
      value: stats.playable,
      label: "Live",
      icon: (
        <svg width="18" height="18" fill="#10b981" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="10" fill="none" stroke="#10b981" strokeWidth="2" opacity=".3" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      value: stats.blocked,
      label: "Blocked",
      icon: (
        <svg width="18" height="18" fill="none" stroke="#f97316" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.9 4.9l14.2 14.2" />
        </svg>
      ),
      color: "#f97316",
    },
    {
      value: stats.dead,
      label: "Dead",
      icon: (
        <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ),
      color: "#ef4444",
    },
  ];

  return (
    <div
      id="statsSection"
      className="glass-strong rounded-2xl p-5 mb-5 anim-slide-up"
      style={{ animationDelay: ".08s" }}
    >
      <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        ফলাফল সারসংক্ষেপ
      </label>

      <div className="flex gap-3">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="flex items-center justify-center mb-1">{c.icon}</div>
            <p
              className="text-2xl font-extrabold"
              style={{ color: c.color, lineHeight: 1.1 }}
            >
              {c.value}
            </p>
            <p className="text-xs text-gray-500 font-semibold mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar (live percentage) */}
      {stats.total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Live rate</span>
            <span className="font-bold text-indigo-500">
              {Math.round((stats.playable / stats.total) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(stats.playable / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Checking indicator */}
      {stats.checking > 0 && (
        <p className="text-xs text-yellow-500 font-semibold mt-3 flex items-center gap-1.5">
          <span
            style={{
              width: 10,
              height: 10,
              border: "2px solid #fde68a",
              borderTopColor: "#a16207",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin .7s linear infinite",
            }}
          />
          {stats.checking}টি চেক করা হচ্ছে...
        </p>
      )}
    </div>
  );
}
