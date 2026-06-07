/**
 * Channel type definitions for IPTV streaming
 * Defines the structure for M3U/M3U8 channels and their metadata
 */

/**
 * Status of a channel stream
 * - playable: Stream is working correctly
 * - dead: Stream is not responding
 * - blocked: Stream is region-blocked or unavailable
 * - unknown: Status not yet checked
 */
export type ChannelStatus = 'playable' | 'dead' | 'blocked' | 'unknown';

/**
 * Represents a single TV channel from M3U/M3U8 playlist
 */
export interface Channel {
  id: string; // Unique identifier (usually URL hash)
  name: string;
  logo?: string; // Channel logo URL
  url: string; // Stream URL
  status: ChannelStatus;
  duration?: number;
  group?: string; // Category/Group
  tvgId?: string;
  tvgName?: string;
  checkedAt?: number; // Timestamp of last status check
}

/**
 * Playlist source configuration
 */
export interface PlaylistSource {
  label: string;
  url: string;
  tag?: string;
  description?: string;
}

/**
 * Channel list statistics
 */
export interface ChannelStats {
  total: number;
  playable: number;
  dead: number;
  blocked: number;
  loading: number;
}
