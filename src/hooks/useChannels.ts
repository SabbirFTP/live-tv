/**
 * useChannels Hook
 * Manages channel list state and operations
 * Handles loading from M3U/M3U8 sources and filtering
 */

import { useState, useCallback } from 'react';
import type { Channel, ChannelStats } from '../types/channel';

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load channels from M3U/M3U8 URL
   * Parses the playlist and extracts channel information
   */
  const loadChannels = useCallback(async (playlistUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error('Failed to fetch playlist');

      const text = await response.text();
      const parsedChannels = parseM3U(text);

      setChannels(parsedChannels);
      return parsedChannels;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error loading channels:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a single channel
   */
  const addChannel = useCallback((channel: Channel) => {
    setChannels((prev) => [...prev, channel]);
  }, []);

  /**
   * Remove a channel by ID
   */
  const removeChannel = useCallback((id: string) => {
    setChannels((prev) => prev.filter((ch) => ch.id !== id));
  }, []);

  /**
   * Update channel status
   */
  const updateChannelStatus = useCallback((id: string, status: Channel['status']) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === id
          ? { ...ch, status, checkedAt: Date.now() }
          : ch
      )
    );
  }, []);

  /**
   * Clear all channels
   */
  const clearChannels = useCallback(() => {
    setChannels([]);
  }, []);

  /**
   * Get channel statistics
   */
  const getStats = useCallback((): ChannelStats => {
    return {
      total: channels.length,
      playable: channels.filter((ch) => ch.status === 'playable').length,
      dead: channels.filter((ch) => ch.status === 'dead').length,
      blocked: channels.filter((ch) => ch.status === 'blocked').length,
      loading: channels.filter((ch) => ch.status === 'unknown').length,
    };
  }, [channels]);

  return {
    channels,
    loading,
    error,
    loadChannels,
    addChannel,
    removeChannel,
    updateChannelStatus,
    clearChannels,
    getStats,
  };
};

/**
 * Parse M3U/M3U8 playlist format
 * Extracts channel information from the playlist text
 */
function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');
  let currentExtInfo: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse channel metadata
      currentExtInfo = parseExtInfo(line);
    } else if (line && !line.startsWith('#')) {
      // This is the URL line
      const channel: Channel = {
        id: btoa(line), // Simple ID generation
        name: currentExtInfo.name || 'Unknown',
        url: line,
        status: 'unknown',
        logo: currentExtInfo.logo,
        group: currentExtInfo.group,
        tvgId: currentExtInfo.tvgId,
        tvgName: currentExtInfo.tvgName,
      };

      channels.push(channel);
      currentExtInfo = {}; // Reset for next channel
    }
  }

  return channels;
}

/**
 * Parse EXTINF line from M3U format
 * Example: #EXTINF:-1 tvg-id="id" tvg-name="name" group-title="group" logo="url", Channel Name
 */
function parseExtInfo(line: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Extract attributes
  const attrRegex = /(\w+(?:-\w+)*)="([^"]*)"/g;
  let match;

  while ((match = attrRegex.exec(line)) !== null) {
    const [, key, value] = match;
    result[toCamelCase(key)] = value;
  }

  // Extract channel name (after the last comma)
  const nameMatch = line.match(/,(.+)$/);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  return result;
}

/**
 * Convert kebab-case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
