import type { PublicSource } from '../types/stream';

/**
 * Publicly available M3U / M3U8 / HLS playlist sources.
 * Each pill in the Sources section loads and checks one of these.
 */
export const PUBLIC_SOURCES: PublicSource[] = [
  {
    label: 'iptv-org / All',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    tag: 'FREE',
    description: 'Global IPTV channels',
  },
  {
    label: 'iptv-org / BD',
    url: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    tag: 'FREE',
    description: 'Bangladesh channels',
  },
  {
    label: 'iptv-org / IN',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    tag: 'FREE',
    description: 'India channels',
  },
  {
    label: 'time2shine',
    url: 'https://raw.githubusercontent.com/mrgify/clean/refs/heads/main/Bangladesh/time2shine.m3u',
    tag: 'FREE',
    description: 'BD channels (large)',
  },
  {
    label: 'Bugsfree',
    url: 'https://raw.githubusercontent.com/Bugsfree/Bugsfree/main/BF.m3u8',
    tag: 'FREE',
    description: 'Multi-source list',
  },
  {
    label: 'GlobalIPTV',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    tag: 'FREE',
    description: 'Free TV worldwide',
  },
  {
    label: 'niptv',
    url: 'https://raw.githubusercontent.com/mrgify/clean/refs/heads/main/Bangladesh/niptv.m3u',
    tag: 'FREE',
    description: 'NI IPTV BD',
  },
  {
    label: 'Axsport-BD',
    url: 'https://raw.githubusercontent.com/mrgify/clean/refs/heads/main/Bangladesh/axsport.m3u8',
    tag: 'SPORTS',
    description: 'Sports BD (referrer-locked)',
  },
];

/** Max streams to check from large playlists (performance guard) */
export const MAX_BULK_CHECK_LIMIT = 1500;

/** How many streams to check concurrently */
export const CONCURRENT_CHECK_LIMIT = 4;

/** Fetch timeout for stream checks in milliseconds */
export const CHECK_TIMEOUT_MS = 8000;

/** localStorage key for saving streams between sessions */
export const STORAGE_KEY_STREAMS = 'livetvpro_streams_v2';

/** localStorage key for remembering dark/light theme */
export const STORAGE_KEY_THEME = 'sp_theme';

/** localStorage key for remembering disclaimer acknowledgment */
export const STORAGE_KEY_DISCLAIMER = 'livetvpro_disclaimer_ok';

/** localStorage key for telegram gate */
export const STORAGE_KEY_TG_JOINED = 'tvpro_tg_joined';

/** Telegram channel URL */
export const TELEGRAM_CHANNEL_URL = 'https://t.me/livetvprotel';

/** GitHub profile for SabbirMMS */
export const GITHUB_PROFILE_URL = 'https://github.com/sabbirmms';

/** GitHub avatar URL for SabbirMMS */
export const GITHUB_AVATAR_URL = 'https://avatars.githubusercontent.com/sabbirmms';
