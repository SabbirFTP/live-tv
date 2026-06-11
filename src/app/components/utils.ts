import type { Stream } from './types';

export function parseM3U(content: string): Omit<Stream, 'id' | 'status' | 'isFavorite'>[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const streams: Omit<Stream, 'id' | 'status' | 'isFavorite'>[] = [];

  if (!lines[0]?.includes('#EXTM3U') && !lines[0]?.includes('#EXT')) {
    // Might be a plain URL or different format — try treating each line as a URL
    for (const line of lines) {
      if (line.startsWith('http')) {
        streams.push({ name: extractDomain(line), url: line, group: 'Ungrouped', logo: '' });
      }
    }
    return streams;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      const name = extractAttr(line, 'tvg-name') || extractAfterComma(line) || 'Unknown Channel';
      const logo = extractAttr(line, 'tvg-logo') || '';
      const group = extractAttr(line, 'group-title') || 'General';
      const protocol = detectProtocol(lines[i + 1] || '');
      const url = lines[i + 1] || '';
      if (url.startsWith('http') || url.startsWith('rtmp')) {
        streams.push({ name, url, group, logo, protocol });
      }
      i += 2;
    } else {
      i++;
    }
  }
  return streams;
}

function extractAttr(line: string, attr: string): string {
  const match = line.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
  return match ? match[1].trim() : '';
}

function extractAfterComma(line: string): string {
  const idx = line.lastIndexOf(',');
  return idx >= 0 ? line.slice(idx + 1).trim() : '';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 40);
  }
}

export function detectProtocol(url: string): string {
  if (!url) return 'Unknown';
  if (url.includes('.m3u8') || url.includes('hls')) return 'HLS';
  if (url.includes('.mpd') || url.includes('dash')) return 'DASH';
  if (url.startsWith('rtmp')) return 'RTMP';
  if (url.includes('.ts')) return 'MPEG-TS';
  return 'HLS';
}

export function truncateUrl(url: string, maxLen = 48): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function saveToStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function exportM3U(streams: Stream[]): string {
  let out = '#EXTM3U\n';
  for (const s of streams) {
    out += `#EXTINF:-1 tvg-name="${s.name}" tvg-logo="${s.logo}" group-title="${s.group}",${s.name}\n${s.url}\n`;
  }
  return out;
}
