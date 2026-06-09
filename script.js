/* ============================================================
   Live TV Pro — script.js
   Full application logic: M3U parsing, stream checking,
   HLS playback, source management, UI, localStorage.
   ============================================================ */

"use strict";

// ─── Constants ────────────────────────────────────────────────────────────────
const LS_STREAMS = "ltvpro_streams";
const LS_THEME = "sp_theme";
const LS_DISCLAIMER = "ltvpro_disclaimer_ok";
const LS_TG = "tvpro_tg_joined";
const LS_VISITS = "ltvpro_visits";
const CONCURRENCY = 6;

const PUBLIC_SOURCES = [
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
  { label: "streams.re (PK)", url: "https://streams.re/pk.m3u", tag: null },
];

// ─── State ────────────────────────────────────────────────────────────────────
let streams = []; // array of stream objects
let activeTab = "all"; // all | playable | blocked | dead
let searchQuery = "";
let selectedIdxs = new Set();
let checkAbort = null; // AbortController for bulk checks
let currentStream = null; // currently playing stream
let hlsInstance = null; // hls.js instance

// ─── LocalStorage ─────────────────────────────────────────────────────────────
function saveStreams() {
  try {
    localStorage.setItem(LS_STREAMS, JSON.stringify(streams));
  } catch (e) {}
}
function loadStreams() {
  try {
    const r = localStorage.getItem(LS_STREAMS);
    return r ? JSON.parse(r).filter((s) => s && s.url) : [];
  } catch (e) {
    return [];
  }
}
function saveTheme(d) {
  try {
    localStorage.setItem(LS_THEME, d ? "dark" : "light");
  } catch (e) {}
}
function getVisitCount() {
  try {
    const n = parseInt(localStorage.getItem(LS_VISITS) || "2644", 10) + 1;
    localStorage.setItem(LS_VISITS, String(n));
    return n;
  } catch (e) {
    return 2644;
  }
}

// ─── URL helpers ─────────────────────────────────────────────────────────────
const SOCIAL_RE =
  /^https?:\/\/(?:[^/]*\.)?(?:t\.me|telegram\.(?:me|org|dog)|wa\.me|whatsapp\.com|fb\.com|facebook\.com|youtu\.be)/i;
const STATIC_RE =
  /\.(?:jpe?g|png|gif|webp|svg|ico|css|js|txt|md|html?|php)(?:[?#]|$)/i;
const MEDIA_DL =
  /\.(?:mkv|avi|wmv|flv|mov|iso|divx|mp3|aac|zip|rar|exe|apk|pdf)(?:[?#]|$)/i;

function isFiltered(url) {
  return SOCIAL_RE.test(url) || STATIC_RE.test(url) || MEDIA_DL.test(url);
}

function githubRaw(url) {
  return url.replace(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:raw|blob)\/(.+)$/i,
    "https://raw.githubusercontent.com/$1/$2/$3",
  );
}
function toCDN(url) {
  const raw = githubRaw(url);
  const m = raw.match(
    /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/(?:refs\/heads\/)?([^/]+)\/(.+)$/i,
  );
  return m
    ? `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${m[3]}/${m[4]}`
    : raw;
}

function extractName(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").filter(Boolean);
    return (
      (p[p.length - 1] || p[p.length - 2] || u.hostname)
        .replace(/\.(m3u8?|ts|mpd)$/i, "")
        .replace(/[-_]/g, " ")
        .trim() || u.hostname
    );
  } catch {
    return url.slice(0, 40);
  }
}

// ─── M3U Parser ───────────────────────────────────────────────────────────────
function parseInput(text, limit = 1500) {
  const lines = text.split(/\r?\n/);
  const result = [];
  const seen = new Set();
  let meta = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const nm = line.match(/,(.+)$/);
      const lg = line.match(/tvg-logo="([^"]+)"/i);
      const gr = line.match(/group-title="([^"]+)"/i);
      const tn = line.match(/tvg-name="([^"]+)"/i);
      meta = {
        name: nm ? nm[1].trim() : "",
        logo: lg ? lg[1] : "",
        group: gr ? gr[1] : "",
        tvgName: tn ? tn[1] : "",
      };
    } else if (/^(https?|rtmps?|rtsp):\/\//i.test(line)) {
      if (!isFiltered(line) && !seen.has(line)) {
        seen.add(line);
        result.push({
          url: line,
          name: meta?.name || meta?.tvgName || extractName(line),
          logo: meta?.logo || "",
          group: meta?.group || "",
          status: "idle",
        });
        meta = null;
        if (result.length >= limit) break;
      } else {
        meta = null;
      }
    } else if (!line.startsWith("#")) {
      const found = line.match(
        /https?:\/\/[^\s'"<>()]+?\.(?:m3u8?|mpd|ts)(?:\?[^\s'"<>()]*)?/gi,
      );
      if (found) {
        found.forEach((u) => {
          if (!isFiltered(u) && !seen.has(u) && result.length < limit) {
            seen.add(u);
            result.push({
              url: u,
              name: meta?.name || extractName(u),
              logo: meta?.logo || "",
              group: meta?.group || "",
              status: "idle",
            });
          }
        });
        meta = null;
      }
    }
  }
  return result;
}

// ─── M3U Builder ─────────────────────────────────────────────────────────────
function buildM3U(list) {
  const lines = ["#EXTM3U"];
  list.forEach((s) => {
    const logo = s.logo ? ` tvg-logo="${s.logo}"` : "";
    const grp = s.group ? ` group-title="${s.group}"` : "";
    lines.push(`#EXTINF:-1${logo}${grp},${s.name || "Channel"}`);
    lines.push(s.url);
  });
  return lines.join("\n");
}

// ─── Clipboard ────────────────────────────────────────────────────────────────
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// ─── Download ────────────────────────────────────────────────────────────────
function downloadM3U(list, fname = "live-tv-pro.m3u") {
  const blob = new Blob([buildM3U(list)], { type: "application/x-mpegurl" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, dur = 2200) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), dur);
}

// ─── Single Stream Checker ────────────────────────────────────────────────────
async function checkStream(url, signal) {
  const t0 = Date.now();
  if (location.protocol === "https:" && /^http:\/\//i.test(url))
    return {
      status: "blocked",
      type: "Mixed-Content",
      proto: "HTTP",
      responseTime: "0ms",
    };

  const isHls = /\.m3u8?(\?|$)/i.test(url);
  const type = isHls
    ? "HLS"
    : /\.mpd(\?|$)/i.test(url)
      ? "DASH"
      : /\.ts(\?|$)/i.test(url)
        ? "Direct TS"
        : "Stream";
  const proto = /^https/i.test(url) ? "HTTPS" : "HTTP";

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    // merge signals
    if (signal) {
      signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }

    await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      mode: "no-cors",
      cache: "no-store",
    }).catch((e) => {
      if (e.name === "AbortError") throw e;
      return null;
    });
    clearTimeout(tid);

    if (isHls) {
      try {
        const gc = new AbortController();
        const gt = setTimeout(() => gc.abort(), 5000);
        const gr = await fetch(url, { signal: gc.signal, cache: "no-store" });
        clearTimeout(gt);
        const txt = await gr.text();
        if (!/#EXTM3U|#EXT-X/i.test(txt.slice(0, 500)))
          return {
            status: "dead",
            type,
            proto,
            responseTime: Date.now() - t0 + "ms",
          };
      } catch {}
    }
    return {
      status: "playable",
      type,
      proto,
      responseTime: Date.now() - t0 + "ms",
    };
  } catch (e) {
    if (e.name === "AbortError") throw e;
    const rt = Date.now() - t0;
    return {
      status: rt < 7500 ? "blocked" : "dead",
      type,
      proto,
      responseTime: rt + "ms",
    };
  }
}

// ─── Bulk Checker ─────────────────────────────────────────────────────────────
async function checkBulk(list, onProgress, signal) {
  let done = 0;
  async function worker(i) {
    if (signal?.aborted) return;
    try {
      const r = await checkStream(list[i].url, signal);
      Object.assign(list[i], r);
    } catch {
      list[i].status = "dead";
    }
    done++;
    onProgress(done, list.length, i);
  }
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, list.length - i) }, (_, k) =>
        worker(i + k),
      ),
    );
  }
}

// ─── Source Fetcher ───────────────────────────────────────────────────────────
async function fetchSource(url, signal) {
  const urls = [toCDN(url), url].filter((u, i, a) => a.indexOf(u) === i);
  for (const u of urls) {
    try {
      const r = await fetch(u, { signal, cache: "no-store" });
      if (!r.ok) continue;
      const txt = await r.text();
      if (/#EXT|https?:\/\//i.test(txt)) return txt;
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  throw new Error("Could not fetch: " + url);
}

// ─── HLS Player ───────────────────────────────────────────────────────────────
function destroyHls() {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
}

function playStream(stream) {
  const video = document.getElementById("mainVideo");
  const overlay = document.getElementById("videoOverlay");
  const section = document.getElementById("playerSection");
  const nameEl = document.getElementById("playerChannelName");
  const logoEl = document.getElementById("playerLogo");
  const liveBadge = document.getElementById("liveBadgeText");
  const infoType = document.getElementById("infoType");
  const infoStatus = document.getElementById("infoStatus");
  const infoProto = document.getElementById("infoProto");
  const infoResp = document.getElementById("infoResp");

  if (!video || !section) return;

  destroyHls();
  currentStream = stream;
  section.classList.remove("hidden");
  overlay.classList.remove("hidden");

  // Set channel name & logo
  if (stream.name) {
    nameEl.textContent = stream.name;
    nameEl.classList.remove("hidden");
  } else {
    nameEl.classList.add("hidden");
  }

  if (stream.logo) {
    logoEl.style.cssText = "";
    const img = document.createElement("img");
    img.src = stream.logo;
    img.alt = stream.name || "";
    img.className = "channel-logo";
    img.onerror = () => img.remove();
    logoEl.innerHTML = "";
    logoEl.appendChild(img);
    logoEl.classList.remove("hidden");
  } else if (stream.name) {
    logoEl.textContent = stream.name.charAt(0).toUpperCase();
    logoEl.classList.remove("hidden");
    logoEl.style.cssText = "";
  } else {
    logoEl.classList.add("hidden");
  }

  liveBadge.classList.add("hidden");
  infoType.textContent = "…";
  infoStatus.textContent = "Loading…";
  infoProto.textContent = "…";
  infoResp.textContent = "…";

  const url = stream.url;
  const isHls =
    /\.m3u8?(\?|$)/i.test(url) || !/\.(mp4|ts|webm)(\?|$)/i.test(url);
  const proto = /^https/i.test(url) ? "HTTPS" : "HTTP";
  const type = /\.m3u8/i.test(url)
    ? "HLS"
    : /\.mpd/i.test(url)
      ? "DASH"
      : "Stream";
  infoType.textContent = type;
  infoProto.textContent = proto;

  const t0 = Date.now();

  if (isHls && window.Hls && window.Hls.isSupported()) {
    const hls = new window.Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });
    hlsInstance = hls;
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
      overlay.classList.add("hidden");
      liveBadge.classList.remove("hidden");
      infoStatus.textContent = "Live ●";
      infoResp.textContent = Date.now() - t0 + "ms";
    });
    hls.on(window.Hls.Events.ERROR, (_, d) => {
      if (d.fatal) {
        infoStatus.textContent = "Error";
        overlay.classList.remove("hidden");
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play().catch(() => {});
    video.addEventListener(
      "loadedmetadata",
      () => {
        overlay.classList.add("hidden");
        liveBadge.classList.remove("hidden");
        infoStatus.textContent = "Live ●";
        infoResp.textContent = Date.now() - t0 + "ms";
      },
      { once: true },
    );
  } else {
    video.src = url;
    video.play().catch(() => {});
    overlay.classList.add("hidden");
    infoStatus.textContent = "Playing";
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stopPlayer() {
  destroyHls();
  const video = document.getElementById("mainVideo");
  const section = document.getElementById("playerSection");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  if (section) section.classList.add("hidden");
  currentStream = null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
  const total = streams.length;
  const playable = streams.filter((s) => s.status === "playable").length;
  const blocked = streams.filter((s) => s.status === "blocked").length;
  const dead = streams.filter((s) => s.status === "dead").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPlayable").textContent = playable;
  document.getElementById("statBlocked").textContent = blocked;
  document.getElementById("statDead").textContent = dead;
  document.getElementById("badgeAll").textContent = total;
  document.getElementById("badgePlayable").textContent = playable;
  document.getElementById("badgeBlocked").textContent = blocked;
  document.getElementById("badgeDead").textContent = dead;
  document.getElementById("resultsSection").classList.toggle("hidden", !total);
}

// ─── Stream Card Builder ──────────────────────────────────────────────────────
const STATUS_MAP = {
  playable: { cls: "tag-live", label: "● Live" },
  blocked: { cls: "tag-blocked", label: "⚠ Blocked" },
  dead: { cls: "tag-dead", label: "✕ Dead" },
  checking: { cls: "tag-checking", label: "… Checking" },
  idle: { cls: "tag-checking", label: "— Idle" },
};
const CARD_MAP = {
  playable: "playable-card",
  blocked: "blocked-card",
  dead: "dead-card",
};

function buildCard(stream, idx, animated = true) {
  const tag = STATUS_MAP[stream.status] || STATUS_MAP.idle;
  const cardCls = CARD_MAP[stream.status] || "";
  const sel = selectedIdxs.has(idx) ? "selected" : "";
  const noAnim = animated ? "" : "no-anim";
  const initial = (stream.name || "#").trim().charAt(0).toUpperCase();

  const logoHtml = stream.logo
    ? `<img src="${escHtml(stream.logo)}" alt="${escHtml(stream.name || "")}" class="channel-logo" onerror="this.style.display='none'">`
    : `<div class="logo-placeholder">${escHtml(initial)}</div>`;

  const groupHtml = stream.group
    ? `<span class="group-badge">${escHtml(stream.group)}</span>`
    : "";
  const respHtml =
    stream.responseTime && stream.responseTime !== "—"
      ? `<p class="text-xs" style="color:#9ca3af;margin-top:2px">${stream.type ? `<b>${escHtml(stream.type)}</b> ` : ""}${stream.proto || ""} ${stream.responseTime}</p>`
      : "";

  return `<div class="stream-card ${cardCls} ${sel} ${noAnim}" data-idx="${idx}" style="animation-delay:${Math.min((idx % 20) * 25, 400)}ms">
  <div class="checkbox-custom${selectedIdxs.has(idx) ? " checked" : ""}" data-check="${idx}"></div>
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div class="flex items-center gap-2 flex-wrap">
      <p class="font-semibold text-gray-800 text-sm truncate" style="max-width:260px">${escHtml(stream.name || "Unknown Channel")}</p>
      ${groupHtml}
    </div>
    <p class="text-xs truncate" style="color:#9ca3af;max-width:100%;margin-top:2px">${escHtml(stream.url)}</p>
    ${respHtml}
  </div>
  <span class="tag ${tag.cls}" style="flex-shrink:0">${tag.label}</span>
  <div class="flex gap-1" style="flex-shrink:0">
    <button class="btn-primary" style="padding:5px 10px;font-size:11px;border-radius:8px" data-play="${idx}">
      <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Play
    </button>
    <button class="btn-ghost" style="padding:5px 9px;font-size:11px;border-radius:8px" data-check-single="${idx}" title="Check">
      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    </button>
    <button class="btn-ghost" style="padding:5px 9px;font-size:11px;border-radius:8px" data-copy-url="${idx}" title="Copy URL">
      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
    </button>
    <button class="btn-danger" style="padding:5px 9px;font-size:11px;border-radius:8px" data-del="${idx}" title="Delete">
      <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 6h18M19 6l-1 14H6L5 6M8 6V4h8v2"/></svg>
    </button>
  </div>
</div>`;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
  const list = document.getElementById("streamList");
  const empty = document.getElementById("emptyState");
  const listCount = document.getElementById("listCount");
  if (!list) return;

  const visible = streams
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      if (activeTab !== "all" && s.status !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (s.name || "").toLowerCase().includes(q) ||
          (s.url || "").toLowerCase().includes(q) ||
          (s.group || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

  list.innerHTML = visible.map(({ s, i }) => buildCard(s, i)).join("");
  const none = visible.length === 0;
  empty.classList.toggle("hidden", !none);
  listCount.textContent = `${visible.length}টি দেখা যাচ্ছে`;
  updateStats();
  updateSelectBar();
}

// ─── Selection ────────────────────────────────────────────────────────────────
function updateSelectBar() {
  const bar = document.getElementById("selectBar");
  const cnt = document.getElementById("selectCount");
  const allBox = document.getElementById("selectAllBox");
  if (!bar) return;
  bar.classList.toggle("hidden", selectedIdxs.size === 0);
  if (cnt) cnt.textContent = `${selectedIdxs.size}টি নির্বাচিত`;
  if (allBox) {
    allBox.classList.toggle(
      "checked",
      selectedIdxs.size === streams.length && streams.length > 0,
    );
  }
}

// ─── Source Pills Renderer ────────────────────────────────────────────────────
function renderSources() {
  const wrap = document.getElementById("sourcesWrap");
  if (!wrap) return;
  wrap.innerHTML = PUBLIC_SOURCES.map((src) => {
    const tagHtml = src.tag
      ? `<span class="src-tag ${src.tag}">${src.tag}</span>`
      : "";
    const hintHtml = src.hint
      ? `<span class="hint-badge">${escHtml(src.hint)}</span>`
      : "";
    return `<button class="source-pill" data-src-url="${escHtml(src.url)}" data-src-label="${escHtml(src.label)}">
      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></svg>
      <span>${escHtml(src.label)}</span>${tagHtml}${hintHtml}
      <button class="src-copy" data-copy-src="${escHtml(src.url)}" title="URL কপি করুন">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </button>`;
  }).join("");
}

// ─── Bulk Check UI ────────────────────────────────────────────────────────────
function startBulkCheck(list) {
  const progWrap = document.getElementById("progressWrap");
  const progFill = document.getElementById("progressFill");
  const progLabel = document.getElementById("progressLabel");
  const bulkProg = document.getElementById("bulkProgress");
  const doneEl = document.getElementById("doneCount");
  const totalEl = document.getElementById("totalCount");

  progWrap.classList.remove("hidden");
  bulkProg.classList.remove("hidden");
  totalEl.textContent = list.length;
  doneEl.textContent = "0";

  checkAbort = new AbortController();

  checkBulk(
    list,
    (done, total, idx) => {
      const pct = Math.round((done / total) * 100);
      progFill.style.width = pct + "%";
      progLabel.textContent = `চেক করা হচ্ছে... (${pct}%)`;
      doneEl.textContent = done;
      // Update just this card in-place if possible
      const el = document.querySelector(`[data-idx="${idx}"]`);
      if (el) {
        el.outerHTML = buildCard(streams[idx], idx, false);
      }
      updateStats();
    },
    checkAbort.signal,
  ).then(() => {
    if (!checkAbort.signal.aborted) {
      progWrap.classList.add("hidden");
      bulkProg.classList.add("hidden");
      saveStreams();
      renderList();
      showToast("✅ চেক সম্পন্ন!");
    }
  });
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  const moon = document.getElementById("iconMoon");
  const sun = document.getElementById("iconSun");
  if (moon) moon.style.display = dark ? "none" : "";
  if (sun) sun.style.display = dark ? "" : "none";
  saveTheme(dark);
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────
function initDisclaimer() {
  const modal = document.getElementById("disclaimerModal");
  if (!modal) return;
  try {
    if (localStorage.getItem(LS_DISCLAIMER) === "1") {
      modal.style.display = "none";
      return;
    }
  } catch (e) {}
  modal.style.display = "flex";
  document.getElementById("disclaimerOk")?.addEventListener("click", () => {
    try {
      localStorage.setItem(LS_DISCLAIMER, "1");
    } catch (e) {}
    modal.style.display = "none";
  });
}

// ─── Player Controls ─────────────────────────────────────────────────────────
function initPlayerControls() {
  const vidWrap = document.getElementById("vidWrap");
  const video = document.getElementById("mainVideo");
  if (!vidWrap || !video) return;

  let ctrlTimer = null;
  function showCtrl() {
    vidWrap.classList.add("show-ctrl");
    clearTimeout(ctrlTimer);
    ctrlTimer = setTimeout(() => vidWrap.classList.remove("show-ctrl"), 2800);
  }
  vidWrap.addEventListener("mousemove", showCtrl);
  vidWrap.addEventListener("touchstart", showCtrl, { passive: true });
  vidWrap.addEventListener("click", showCtrl);

  // Play/Pause
  document.getElementById("pcPlay")?.addEventListener("click", () => {
    const btn = document.getElementById("pcPlay");
    if (video.paused) {
      video.play();
      btn.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    } else {
      video.pause();
      btn.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
  });

  // Mute
  document.getElementById("pcMute")?.addEventListener("click", () => {
    video.muted = !video.muted;
    const btn = document.getElementById("pcMute");
    btn.innerHTML = video.muted
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/></svg>';
  });

  // Volume
  document.getElementById("pcVol")?.addEventListener("input", (e) => {
    video.volume = parseFloat(e.target.value);
  });

  // PiP
  document.getElementById("pcPip")?.addEventListener("click", async () => {
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await video.requestPictureInPicture();
    } catch (e) {}
  });

  // Fullscreen (both buttons)
  function doFullscreen() {
    const el = document.getElementById("playerSection") || video;
    try {
      !document.fullscreenElement
        ? el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
        : document.exitFullscreen?.();
    } catch (e) {}
  }
  document.getElementById("pcFs")?.addEventListener("click", doFullscreen);
  document
    .getElementById("btnFullscreen")
    ?.addEventListener("click", doFullscreen);

  // Stop
  document.getElementById("btnStop")?.addEventListener("click", stopPlayer);
}

// ─── Main Init ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Load persisted streams
  streams = loadStreams();
  renderSources();
  renderList();

  // Visitor count
  const vc = document.getElementById("visitCount");
  if (vc) vc.textContent = getVisitCount().toLocaleString("en-US");

  // Theme
  const isDark = () => document.documentElement.classList.contains("dark");
  applyTheme(isDark());
  document
    .getElementById("themeToggle")
    ?.addEventListener("click", () => applyTheme(!isDark()));

  // Disclaimer
  initDisclaimer();

  // Player controls
  initPlayerControls();

  // ── Single Stream ──────────────────────────────────────────────────────────
  document.getElementById("btnPlaySingle")?.addEventListener("click", () => {
    const url = (document.getElementById("singleUrl")?.value || "").trim();
    if (!url) return;
    playStream({ url, name: "", logo: "", group: "", status: "idle" });
  });

  document.getElementById("singleUrl")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btnPlaySingle")?.click();
  });

  document
    .getElementById("btnCheckSingle")
    ?.addEventListener("click", async () => {
      const url = (document.getElementById("singleUrl")?.value || "").trim();
      if (!url) return;
      const btn = document.getElementById("btnCheckSingle");
      btn.disabled = true;
      btn.innerHTML = '<span class="pill-spin"></span>';
      try {
        const r = await checkStream(url);
        showToast(
          r.status === "playable"
            ? "✅ Stream চলবে!"
            : r.status === "blocked"
              ? "🔒 Blocked (CORS/Mixed)"
              : "❌ Dead / সাড়া নেই",
        );
      } catch {
        showToast("চেক করতে সমস্যা");
      } finally {
        btn.disabled = false;
        btn.innerHTML =
          '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Check';
      }
    });

  // ── Bulk Check ────────────────────────────────────────────────────────────
  document.getElementById("btnBulkCheck")?.addEventListener("click", () => {
    const text = (document.getElementById("bulkInput")?.value || "").trim();
    if (!text) return;
    const parsed = parseInput(text, 1500);
    if (!parsed.length) {
      showToast("কোনো বৈধ URL পাওয়া যায়নি");
      return;
    }
    streams = parsed.map((s) => ({ ...s, status: "checking" }));
    selectedIdxs.clear();
    saveStreams();
    renderList();
    document
      .getElementById("resultsSection")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    startBulkCheck(streams);
  });

  document.getElementById("btnClearAll")?.addEventListener("click", () => {
    document.getElementById("bulkInput").value = "";
    checkAbort?.abort();
    document.getElementById("progressWrap")?.classList.add("hidden");
    document.getElementById("bulkProgress")?.classList.add("hidden");
  });

  document.getElementById("btnStopCheck")?.addEventListener("click", () => {
    checkAbort?.abort();
    document.getElementById("progressWrap")?.classList.add("hidden");
    document.getElementById("bulkProgress")?.classList.add("hidden");
    showToast("⏹ থামানো হয়েছে");
  });

  // ── Source Pills ──────────────────────────────────────────────────────────
  document
    .getElementById("sourcesWrap")
    ?.addEventListener("click", async (e) => {
      // copy URL button inside pill
      const copyBtn = e.target.closest("[data-copy-src]");
      if (copyBtn) {
        e.stopPropagation();
        await copy(copyBtn.dataset.copySrc);
        showToast("URL কপি হয়েছে!");
        return;
      }

      const pill = e.target.closest(".source-pill");
      if (!pill) return;
      if (document.getElementById("sourcesWrap").classList.contains("busy"))
        return;

      const url = pill.dataset.srcUrl;
      const label = pill.dataset.srcLabel;
      document.getElementById("sourcesWrap").classList.add("busy");
      pill.classList.add("loading");
      pill.innerHTML = `<span class="pill-spin"></span><span>${escHtml(label)}</span>`;

      checkAbort?.abort();
      checkAbort = new AbortController();

      try {
        const text = await fetchSource(url, checkAbort.signal);
        const limit =
          label.includes("Bugsfree") || label.includes("time2shine")
            ? 1500
            : undefined;
        const parsed = parseInput(text, limit);
        if (!parsed.length) {
          showToast("কোনো বৈধ URL পাওয়া যায়নি");
          return;
        }
        streams = parsed.map((s) => ({ ...s, status: "checking" }));
        selectedIdxs.clear();
        saveStreams();
        renderList();
        document
          .getElementById("resultsSection")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        startBulkCheck(streams);
      } catch (err) {
        if (err.name !== "AbortError") showToast("❌ লোড করতে সমস্যা হয়েছে");
      } finally {
        document.getElementById("sourcesWrap").classList.remove("busy");
        renderSources(); // re-render to restore pill
      }
    });

  document
    .getElementById("btnCopyAllSources")
    ?.addEventListener("click", async () => {
      await copy(PUBLIC_SOURCES.map((s) => s.url).join("\n"));
      showToast("✅ সব URL কপি হয়েছে!");
    });

  // ── Tabs ──────────────────────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document
        .querySelectorAll(".tab-btn[data-tab]")
        .forEach((b) => b.classList.toggle("active", b === btn));
      renderList();
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const searchBox = document.getElementById("searchBox");
  const searchClear = document.getElementById("searchClear");
  searchBox?.addEventListener("input", () => {
    searchQuery = searchBox.value;
    searchClear?.classList.toggle("hidden", !searchQuery);
    renderList();
  });
  searchClear?.addEventListener("click", () => {
    searchBox.value = "";
    searchQuery = "";
    searchClear.classList.add("hidden");
    renderList();
  });

  // ── Stream List event delegation ──────────────────────────────────────────
  document
    .getElementById("streamList")
    ?.addEventListener("click", async (e) => {
      const card = e.target.closest(".stream-card");
      if (!card) return;
      const idx = parseInt(card.dataset.idx, 10);

      // Play
      if (e.target.closest("[data-play]")) {
        playStream(streams[idx]);
        return;
      }

      // Check single
      if (e.target.closest("[data-check-single]")) {
        const btn = e.target.closest("[data-check-single]");
        btn.disabled = true;
        btn.innerHTML = '<span class="pill-spin"></span>';
        streams[idx].status = "checking";
        const tagEl = card.querySelector(".tag");
        if (tagEl) {
          tagEl.className = "tag tag-checking";
          tagEl.textContent = "… Checking";
        }
        try {
          const r = await checkStream(streams[idx].url);
          Object.assign(streams[idx], r);
          saveStreams();
        } catch {
          streams[idx].status = "dead";
        }
        card.outerHTML = buildCard(streams[idx], idx, false);
        updateStats();
        return;
      }

      // Copy URL
      if (e.target.closest("[data-copy-url]")) {
        await copy(streams[idx].url);
        showToast("URL কপি হয়েছে!");
        return;
      }

      // Delete
      if (e.target.closest("[data-del]")) {
        streams.splice(idx, 1);
        selectedIdxs.delete(idx);
        // renumber selectedIdxs above idx
        const newSel = new Set();
        selectedIdxs.forEach((i) => {
          if (i < idx) newSel.add(i);
          else if (i > idx) newSel.add(i - 1);
        });
        selectedIdxs = newSel;
        saveStreams();
        renderList();
        return;
      }

      // Checkbox
      if (e.target.closest("[data-check]") || e.target === card) {
        const chkEl = e.target.closest("[data-check]");
        if (chkEl || e.target === card) {
          selectedIdxs.has(idx)
            ? selectedIdxs.delete(idx)
            : selectedIdxs.add(idx);
          const chk = card.querySelector(".checkbox-custom");
          if (chk) chk.classList.toggle("checked", selectedIdxs.has(idx));
          card.classList.toggle("selected", selectedIdxs.has(idx));
          updateSelectBar();
          return;
        }
      }
    });

  // ── Select All ────────────────────────────────────────────────────────────
  document.getElementById("selectAllBox")?.addEventListener("click", () => {
    if (selectedIdxs.size === streams.length) {
      selectedIdxs.clear();
    } else {
      streams.forEach((_, i) => selectedIdxs.add(i));
    }
    renderList();
  });

  document.getElementById("selectBarClose")?.addEventListener("click", () => {
    selectedIdxs.clear();
    renderList();
  });

  // ── Bulk actions (select bar) ─────────────────────────────────────────────
  document
    .getElementById("btnCopySelected")
    ?.addEventListener("click", async () => {
      const sel = streams.filter((_, i) => selectedIdxs.has(i));
      if (!sel.length) return;
      await copy(sel.map((s) => s.url).join("\n"));
      showToast("✅ URL সমূহ কপি হয়েছে!");
    });

  document
    .getElementById("btnCopySelectedM3U")
    ?.addEventListener("click", async () => {
      const sel = streams.filter((_, i) => selectedIdxs.has(i));
      if (!sel.length) return;
      await copy(buildM3U(sel));
      showToast("✅ M3U কপি হয়েছে!");
    });

  document
    .getElementById("btnDeleteSelected")
    ?.addEventListener("click", () => {
      streams = streams.filter((_, i) => !selectedIdxs.has(i));
      selectedIdxs.clear();
      saveStreams();
      renderList();
    });

  // ── Export buttons ────────────────────────────────────────────────────────
  document
    .getElementById("btnCopyPlayable")
    ?.addEventListener("click", async () => {
      const live = streams.filter((s) => s.status === "playable");
      if (!live.length) {
        showToast("কোনো live stream নেই");
        return;
      }
      await copy(buildM3U(live));
      showToast(`✅ ${live.length}টি live M3U কপি হয়েছে!`);
    });

  document.getElementById("btnExport")?.addEventListener("click", () => {
    if (!streams.length) return;
    downloadM3U(streams, "live-tv-pro.m3u");
  });

  document.getElementById("btnDeleteBlocked")?.addEventListener("click", () => {
    streams = streams.filter((s) => s.status !== "blocked");
    selectedIdxs.clear();
    saveStreams();
    renderList();
    showToast("Blocked stream মুছে ফেলা হয়েছে");
  });

  document.getElementById("btnDeleteDead")?.addEventListener("click", () => {
    streams = streams.filter((s) => s.status !== "dead");
    selectedIdxs.clear();
    saveStreams();
    renderList();
    showToast("Dead stream মুছে ফেলা হয়েছে");
  });
});
