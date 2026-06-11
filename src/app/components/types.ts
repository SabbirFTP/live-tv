export type StreamStatus = 'idle' | 'checking' | 'live' | 'blocked' | 'dead';

export interface Stream {
  id: string;
  name: string;
  url: string;
  group: string;
  logo: string;
  status: StreamStatus;
  responseTime?: number;
  protocol?: string;
  isFavorite: boolean;
  lastPlayed?: number;
}

export interface PreloadedSource {
  name: string;
  url: string;
  description: string;
}

export const PRELOADED_SOURCES: PreloadedSource[] = [
  { name: 'Monjil Pro', url: 'https://raw.githubusercontent.com/Monjil404/livetv/refs/heads/main/pro', description: 'BD Premium' },
  { name: 'IPTV Org BD', url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/bd.m3u', description: 'Bangladesh' },
  { name: 'IPTV Org IN', url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u', description: 'India' },
  { name: 'Free-TV Global', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', description: 'Global' },
  { name: 'Bugsfree IPTV', url: 'https://raw.githubusercontent.com/Bugsfree-Hosts/Bugs-free-IPTV/main/channel.m3u', description: 'Multi-region' },
  { name: 'Time2Shine BD', url: 'https://raw.githubusercontent.com/time2shine/bbc/refs/heads/main/bbc', description: 'Bangladesh' },
  { name: 'Sports (Axsport)', url: 'https://raw.githubusercontent.com/byte-capsule/Toffee-Channels-Link-Headers/main/toffee_OTT_Navigator.m3u', description: 'Sports BD' },
  { name: 'Streams PK', url: 'https://streams.re/pk.m3u', description: 'Pakistan' },
];
