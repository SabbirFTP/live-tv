/**
 * Possible statuses for a stream after checking
 */
export type StreamStatus = 'pending' | 'checking' | 'playable' | 'blocked' | 'dead';

/**
 * Represents a single TV stream entry
 */
export interface Stream {
  id: string;
  url: string;
  name: string | null;
  logoUrl: string | null;
  group: string | null;
  status: StreamStatus;
  responseTimeMs: number | null;
  errorReason: string | null;
  checkedAt: number | null;
}

/**
 * A public M3U source pill the user can click to load & check
 */
export interface PublicSource {
  label: string;
  url: string;
  tag: 'FREE' | 'SPORTS' | 'PREMIUM';
  description: string;
}

/**
 * Stats computed from the current stream list
 */
export interface StreamStats {
  total: number;
  playable: number;
  blocked: number;
  dead: number;
}

/**
 * Tab filter options for the results panel
 */
export type ResultTab = 'all' | 'playable' | 'blocked' | 'dead';

/**
 * Info shown in the video player metadata bar
 */
export interface PlayerInfo {
  streamType: string;
  status: string;
  protocol: string;
  responseMs: string;
}
