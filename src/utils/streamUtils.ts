/**
 * Stream Validation Utilities
 * Functions to check stream status and validate URLs
 */

import type { Channel } from '../types/channel';

/**
 * Check if a stream URL is accessible (playable)
 * Uses a HEAD request with a timeout
 */
export const checkStreamStatus = async (
  url: string,
  timeoutMs: number = 5000
): Promise<Channel['status']> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response indicates stream is accessible
    if (response.ok || response.status === 206 || response.status === 404) {
      return 'playable';
    } else if (response.status === 403 || response.status === 451) {
      return 'blocked'; // Geo-blocked or unavailable
    } else {
      return 'dead'; // Other errors
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'dead'; // Timeout
      }
    }

    return 'dead';
  }
};

/**
 * Check multiple streams in parallel
 * Returns updated channels with statuses
 */
export const checkMultipleStreams = async (
  channels: Channel[],
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<Channel[]> => {
  const updated = [...channels];
  let completed = 0;

  // Process in batches to control concurrency
  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency).map((channel) =>
      checkStreamStatus(channel.url).then((status) => {
        const index = channels.indexOf(channel);
        if (index !== -1) {
          updated[index] = { ...channel, status };
        }
        completed++;
        onProgress?.(completed, channels.length);
      })
    );

    await Promise.all(batch);
  }

  return updated;
};

/**
 * Validate M3U8 URL format
 */
export const isValidStreamUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.protocol === 'http:' ||
      urlObj.protocol === 'https:' ||
      url.includes('.m3u') ||
      url.includes('.m3u8')
    );
  } catch {
    return false;
  }
};

/**
 * Export channels to M3U format
 */
export const exportToM3U = (channels: Channel[], filename: string = 'channels.m3u'): void => {
  let m3uContent = '#EXTM3U\n';

  channels.forEach((channel) => {
    // Build EXTINF line
    const attrs: string[] = [];

    if (channel.tvgId) attrs.push(`tvg-id="${channel.tvgId}"`);
    if (channel.tvgName) attrs.push(`tvg-name="${channel.tvgName}"`);
    if (channel.logo) attrs.push(`logo="${channel.logo}"`);
    if (channel.group) attrs.push(`group-title="${channel.group}"`);

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    m3uContent += `#EXTINF:-1${attrStr}, ${channel.name}\n${channel.url}\n`;
  });

  // Trigger download
  const blob = new Blob([m3uContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
