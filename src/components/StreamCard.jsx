import { useState, memo } from "react";
import { checkStream, copyToClipboard } from "../script";

const STATUS_TAG = {
  playable: { cls: "tag-live",     label: "● Live"    },
  blocked:  { cls: "tag-blocked",  label: "⚠ Blocked" },
  dead:     { cls: "tag-dead",     label: "✕ Dead"    },
  checking: { cls: "tag-checking", label: "… Checking"},
  idle:     { cls: "tag-checking", label: "— Idle"    },
};

const CARD_CLS = {
  playable: "playable-card",
  blocked:  "blocked-card",
  dead:     "dead-card",
};

function StreamCard({
  stream,
  index,
  selected,
  onToggleSelect,
  onPlay,
  onUpdate,
  onDelete,
  showToast,
  animDelay = 0,
}) {
  const [checking, setChecking] = useState(false);

  const tag     = STATUS_TAG[stream.status] ?? STATUS_TAG.idle;
  const cardCls = CARD_CLS[stream.status] ?? "";
  const hasLogo = stream.logo && stream.logo.trim();
  const initial = stream.name
    ? stream.name.trim().charAt(0).toUpperCase()
    : "#";

  async function handleCheck(e) {
    e.stopPropagation();
    if (checking) return;
    setChecking(true);
    onUpdate(index, { status: "checking" });
    try {
      const result = await checkStream(stream.url);
      onUpdate(index, result);
    } catch {
      onUpdate(index, { status: "dead" });
    } finally {
      setChecking(false);
    }
  }

  async function handleCopy(e) {
    e.stopPropagation();
    await copyToClipboard(stream.url);
    showToast?.("URL কপি হয়েছে!");
  }

  function handlePlay(e) {
    e.stopPropagation();
    onPlay(stream);
  }

  function handleDelete(e) {
    e.stopPropagation();
    onDelete(index);
  }

  return (
    <div
      className={`stream-card${cardCls ? " " + cardCls : ""}${selected ? " selected" : ""}`}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={() => onToggleSelect(index)}
    >
      {/* Checkbox */}
      <div
        className={`checkbox-custom${selected ? " checked" : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(index); }}
      />

      {/* Logo / Placeholder */}
      {hasLogo ? (
        <img
          src={stream.logo}
          alt={stream.name}
          className="channel-logo"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div className="logo-placeholder">{initial}</div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm truncate max-w-xs">
            {stream.name || "Unknown Channel"}
          </p>
          {stream.group && (
            <span className="group-badge">{stream.group}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5" style={{ maxWidth: "100%" }}>
          {stream.url}
        </p>
        {stream.responseTime && stream.responseTime !== "—" && (
          <p className="text-xs text-gray-300 mt-0.5">
            {stream.type && <span className="mr-1 font-semibold">{stream.type}</span>}
            {stream.proto && <span className="mr-1">{stream.proto}</span>}
            {stream.responseTime}
          </p>
        )}
      </div>

      {/* Status tag */}
      <div className="flex-shrink-0">
        {checking ? (
          <span className="tag tag-checking">
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
            Checking
          </span>
        ) : (
          <span className={`tag ${tag.cls}`}>{tag.label}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Play */}
        <button
          className="btn-primary"
          style={{ padding: "5px 10px", fontSize: 11, borderRadius: 8 }}
          title="Play"
          onClick={handlePlay}
        >
          <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play
        </button>

        {/* Check */}
        <button
          className="btn-ghost"
          style={{ padding: "5px 9px", fontSize: 11, borderRadius: 8 }}
          title="Check"
          onClick={handleCheck}
          disabled={checking}
        >
          {checking ? (
            <span
              style={{
                width: 10,
                height: 10,
                border: "2px solid #c7d2fe",
                borderTopColor: "#4f46e5",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin .7s linear infinite",
              }}
            />
          ) : (
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
        </button>

        {/* Copy */}
        <button
          className="btn-ghost"
          style={{ padding: "5px 9px", fontSize: 11, borderRadius: 8 }}
          title="Copy URL"
          onClick={handleCopy}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>

        {/* Delete */}
        <button
          className="btn-danger"
          style={{ padding: "5px 9px", fontSize: 11, borderRadius: 8 }}
          title="Delete"
          onClick={handleDelete}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(StreamCard);
