import { useEffect, useState } from "react";
import { getVisitCount, formatCount } from "../script";

export default function Header() {
  const [visitCount, setVisitCount] = useState("2,644");

  useEffect(() => {
    const n = getVisitCount();
    setVisitCount(n.toLocaleString("en-US"));
  }, []);

  return (
    <div className="text-center mb-7 anim-slide-down">
      {/* Logo + Title */}
      <div className="inline-flex items-center gap-3 mb-2">
        <svg
          className="hdr-mark"
          width="44"
          height="44"
          viewBox="0 0 64 64"
          aria-label="Live TV Pro"
          style={{
            overflow: "visible",
            filter: "drop-shadow(0 3px 6px rgba(79,70,229,.35))",
          }}
        >
          <defs>
            <linearGradient id="ltvB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4f46e5" />
              <stop offset=".55" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          {/* Antenna lines */}
          <g fill="none" stroke="url(#ltvB)" strokeWidth="3" strokeLinecap="round" opacity=".9">
            <path d="M14 18 q-7 -7 0 -14" />
            <path d="M9 21 q-12 -12 0 -24" />
          </g>
          {/* TV body */}
          <rect x="8" y="16" width="48" height="38" rx="10" fill="url(#ltvB)" />
          {/* Play button */}
          <path
            d="M27 26.5 L43 35 L27 43.5 Z"
            fill="#fff"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Stand */}
          <rect x="27" y="54" width="10" height="4.5" rx="2" fill="url(#ltvB)" />
          {/* Live dot ring */}
          <circle cx="50" cy="14" r="7" fill="#fff" />
          <circle cx="50" cy="14" r="4.5" fill="#ef4444" />
        </svg>

        <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
          Live TV Pro
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm font-medium">
        M3U / M3U8 / HLS লাইভ স্ট্রিম ম্যানেজার
      </p>

      {/* Visit count badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
        <div className="visit-badge">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          মোট ভিজিটর:{" "}
          <span id="visitCount">{visitCount}</span>
        </div>

        {/* Telegram Join Badge */}
        <a
          className="tg-join-badge"
          href="https://t.me/livetvprotel"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join our Telegram channel"
        >
          <svg viewBox="0 0 24 24">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
          Join Telegram
        </a>
      </div>
    </div>
  );
}
