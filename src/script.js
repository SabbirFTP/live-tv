/**
 * Live TV Pro — script.js
 * All application logic: stream checking, HLS playback, M3U parsing,
 * source management, UI interactions, localStorage persistence.
 */

// ─── Public Sources ───────────────────────────────────────────────────────────
export const PUBLIC_SOURCES = [
  {
    label: "Monjil (Pro)",
    url: "https://raw.githubusercontent.com/Monjil404/livetv/refs/heads/main/pro",
    tag: null,
  },
  {
    label: "Iptv-Org (BD)",
    url: "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/bd.m3u",
    tag: null,
  },
  {
    label: "Iptv-Org (IN)",
    url: "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u",
    tag: null,
  },
  {
    label: "Free-TV (Global)",
    url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8",
    tag: null,
  },
  {
    label: "Bugsfree",
    url: "https://raw.githubusercontent.com/Bugsfree-Hosts/Bugs-free-IPTV/main/channel.m3u",
    tag: null,
  },
  {
    label: "time2shine (BD)",
    url: "https://raw.githubusercontent.com/time2shine/bbc/refs/heads/main/bbc",
    tag: null,
  },
  {
    label: "Axsport",
    url: "https://raw.githubusercontent.com/byte-capsule/Toffee-Channels-Link-Headers/main/toffee_OTT_Navigator.m3u",
    tag: "sports",
    hint: "referrer-locked",
  },
  {
    label: "streams.re (PK)",
    url: "https://streams.re/pk.m3u",
    tag: null,
  },
];

// ─── URL Filtering Helpers ────────────────────────────────────────────────────
const SOCIAL_RE = /^https?:\/\/(?:[^/]*\.)?(?:t\.me|telegram\.(?:me|org|dog)|wa\.me|whatsapp\.com|chat\.whatsapp\.com|fb\.com|facebook\.com|youtu\.be)/i;
const STATIC_RE = /\.(?:jpe?g|png|gif|webp|svg|ico|css|js|txt|md|html?|php)(?:[?#]|$)/i;
const MEDIA_DOWNLOAD_RE = /\.(?:mkv|avi|wmv|flv|mov|iso|divx|rmvb|vob|mpe?g|m4v|3gp|zip|rar|7z|gz|exe|apk|pdf|docx?|xlsx?|mp3|aac|m4a|wav|ogg)(?:[?#]|$)/i;
const STREAM_URL_RE = /https?:\/\/[^\s'"<>()]+?\.(?:m3u8|mpd|ts)(?:\?[^\s'"<>()]*)?/i;

export function isFilteredOut(url) {
  return SOCIAL_RE.test(url) || STATIC_RE.test(url) || MEDIA_DOWNLOAD_RE.test(url);
}

// ─── GitHub Raw URL Normaliser ────────────────────────────────────────────────
function githubToRaw(url) {
  return url.replace(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:raw|blob)\/(.+)$/i,
    "https://raw.githubusercontent.com/$1/$2/$3"
  );
}
function normaliseSourceUrl(url) {
  const raw = githubToRaw(url);
  const m = raw.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/(?:refs\/heads\/)?([^/]+)\/(.+)$/i);
  if (m) return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${m[3]}/${m[4]}`;
  return raw;
}

// ─── M3U / URL Parsing ────────────────────────────────────────────────────────
/**
 * Parse an M3U/plain-URL text into an array of stream objects.
 * Each object: { url, name, logo, group }
 */
export function parseInput(text, limit = 1500) {
  const lines = text.split(/\r?\n/);
  const streams = [];
  let pending = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      // Parse metadata
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
      pending = {
        name: nameMatch ? nameMatch[1].trim() : "",
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "",
        tvgName: tvgNameMatch ? tvgNameMatch[1] : "",
      };
    } else if (/^(https?|rtmps?|rtsp):\/\//i.test(line)) {
      if (!isFilteredOut(line)) {
        streams.push({
          url: line,
          name: pending?.name || pending?.tvgName || extractName(line),
          logo: pending?.logo || "",
          group: pending?.group || "",
          status: "idle", // idle | checking | playable | blocked | dead
        });
        pending = null;
        if (streams.length >= limit) break;
      } else {
        pending = null;
      }
    } else if (!line.startsWith("#")) {
      // Try to find embedded stream URLs in HTML / raw text
      const found = line.match(new RegExp(STREAM_URL_RE.source, "gi"));
      if (found) {
        found.forEach((u) => {
          if (!isFilteredOut(u) && streams.length < limit) {
            streams.push({
              url: u,
              name: pending?.name || extractName(u),
              logo: pending?.logo || "",
              group: pending?.group || "",
              status: "idle",
            });
          }
        });
        pending = null;
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  return streams.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

function extractName(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || parts[parts.length - 2] || u.hostname;
    return last.replace(/\.(m3u8?|ts|mpd)$/i, "").replace(/[-_]/g, " ").trim() || u.hostname;
  } catch {
    return url.slice(0, 40);
  }
}

// ─── Single Stream Checker ────────────────────────────────────────────────────
/**
 * Check a single URL. Returns { status, type, proto, responseTime }.
 * status: 'playable' | 'blocked' | 'dead'
 */
export async function checkStream(url, signal) {
  const t0 = Date.now();

  // HTTP-only on HTTPS pages → blocked by browser
  if (location.protocol === "https:" && /^http:\/\//i.test(url)) {
    return { status: "blocked", type: "Mixed-Content", proto: "HTTP", responseTime: 0 };
  }

  const isHls = /\.(m3u8?)(\?|$)/i.test(url);
  const isMpd = /\.mpd(\?|$)/i.test(url);
  const isDirect = /\.(ts)(\?|$)/i.test(url);

  const type = isHls ? "HLS" : isMpd ? "DASH" : isDirect ? "Direct TS" : "Stream";
  const proto = /^https/i.test(url) ? "HTTPS" : "HTTP";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const merged = signal
      ? abortRace(controller.signal, signal)
      : controller.signal;

    const resp = await fetch(url, {
      method: "HEAD",
      signal: merged,
      mode: "no-cors",
      cache: "no-store",
    }).catch(() => null);

    clearTimeout(timeout);

    // With no-cors we only get opaque responses — treat as playable if no throw
    const responseTime = Date.now() - t0;

    if (resp !== null) {
      // Additional M3U8 content validation for HLS
      if (isHls) {
        try {
          const getCtrl = new AbortController();
          const getTimeout = setTimeout(() => getCtrl.abort(), 6000);
          const getResp = await fetch(url, { signal: getCtrl.signal, cache: "no-store" });
          clearTimeout(getTimeout);
          const text = await getResp.text();
          if (!/#EXTM3U|#EXT-X/i.test(text.slice(0, 500))) {
            return { status: "dead", type, proto, responseTime };
          }
        } catch {
          // If extra fetch fails, still consider playable from HEAD success
        }
      }
      return { status: "playable", type, proto, responseTime };
    }

    return { status: "dead", type, proto, responseTime: Date.now() - t0 };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    const responseTime = Date.now() - t0;

    // CORS / network errors usually mean the server responded (blocked by policy)
    // Timeout / DNS failure means dead
    if (err.name === "TypeError" && responseTime < 7500) {
      return { status: "blocked", type, proto, responseTime };
    }
    return { status: "dead", type, proto, responseTime };
  }
}

function abortRace(...signals) {
  const ctrl = new AbortController();
  signals.forEach((s) => {
    if (s.aborted) { ctrl.abort(); return; }
    s.addEventListener("abort", () => ctrl.abort(), { once: true });
  });
  return ctrl.signal;
}

// ─── Bulk Checker ─────────────────────────────────────────────────────────────
/**
 * Check an array of stream objects in parallel (concurrency = 6).
 * Calls onProgress(done, total, stream) after each stream completes.
 * Returns the updated streams array.
 */
export async function checkBulk(streams, { onProgress, signal } = {}) {
  const CONCURRENCY = 6;
  let done = 0;
  const results = [...streams];

  async function worker(idx) {
    if (signal?.aborted) return;
    const s = results[idx];
    try {
      const res = await checkStream(s.url, signal);
      results[idx] = { ...s, ...res };
    } catch {
      results[idx] = { ...s, status: "dead" };
    }
    done++;
    onProgress?.(done, streams.length, results[idx]);
  }

  // Run in batches of CONCURRENCY
  for (let i = 0; i < streams.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    const batch = Array.from(
      { length: Math.min(CONCURRENCY, streams.length - i) },
      (_, k) => worker(i + k)
    );
    await Promise.all(batch);
  }

  return results;
}

// ─── M3U Export ───────────────────────────────────────────────────────────────
export function buildM3U(streams) {
  const lines = ["#EXTM3U"];
  streams.forEach((s) => {
    const logo = s.logo ? ` tvg-logo="${s.logo}"` : "";
    const group = s.group ? ` group-title="${s.group}"` : "";
    lines.push(`#EXTINF:-1${logo}${group},${s.name || "Channel"}`);
    lines.push(s.url);
  });
  return lines.join("\n");
}

// ─── Clipboard Helper ─────────────────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// ─── M3U Download ─────────────────────────────────────────────────────────────
export function downloadM3U(streams, filename = "live-tv-pro.m3u") {
  const content = buildM3U(streams);
  const blob = new Blob([content], { type: "application/x-mpegurl" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
const LS_KEY = "ltvpro_streams";
const LS_THEME = "sp_theme";
const LS_DISCLAIMER = "ltvpro_disclaimer_ok";
const LS_TG = "tvpro_tg_joined";

export function saveStreams(streams) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(streams));
  } catch {}
}

export function loadStreams() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((s) => s && s.url && !isFilteredOut(s.url));
  } catch {
    return [];
  }
}

export function saveTheme(isDark) {
  try {
    localStorage.setItem(LS_THEME, isDark ? "dark" : "light");
  } catch {}
}

export function loadTheme() {
  try {
    return localStorage.getItem(LS_THEME) === "dark";
  } catch {
    return false;
  }
}

export function hasAcceptedDisclaimer() {
  try {
    return localStorage.getItem(LS_DISCLAIMER) === "1";
  } catch {
    return false;
  }
}
export function acceptDisclaimer() {
  try {
    localStorage.setItem(LS_DISCLAIMER, "1");
  } catch {}
}

export function hasTgJoined() {
  try {
    return localStorage.getItem(LS_TG) === "1";
  } catch {
    return false;
  }
}
export function setTgJoined() {
  try {
    localStorage.setItem(LS_TG, "1");
  } catch {}
}

// ─── Visitor Count (localStorage based) ──────────────────────────────────────
const LS_VISIT = "ltvpro_visits";
export function getVisitCount() {
  try {
    const n = parseInt(localStorage.getItem(LS_VISIT) || "2644", 10);
    const next = n + 1;
    localStorage.setItem(LS_VISIT, String(next));
    return next;
  } catch {
    return 2644;
  }
}

// ─── Source Fetcher ───────────────────────────────────────────────────────────
/**
 * Fetch a public source URL, try CDN-normalised URL first, then raw.
 * Returns the raw text content.
 */
export async function fetchSource(url, signal) {
  const urls = [normaliseSourceUrl(url), url].filter(
    (u, i, a) => a.indexOf(u) === i
  );

  for (const u of urls) {
    try {
      const resp = await fetch(u, { signal, cache: "no-store" });
      if (!resp.ok) continue;
      const text = await resp.text();
      if (/#EXT|https?:\/\//i.test(text)) return text;
    } catch (err) {
      if (err.name === "AbortError") throw err;
    }
  }
  throw new Error("Could not fetch source: " + url);
}

// ─── Initialisation Helper (called once on app boot) ─────────────────────────
export function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
