/**
 * LIVE TV - M3U/M3U8 STREAMING APPLICATION
 * =========================================
 * 
 * A professional React-based IPTV streaming player with channel management,
 * playlist loading, status checking, and bulk operations.
 * 
 * Built by: SabbirMMS (@sabbirmms)
 * Repository: https://github.com/sabbirmms/live-tv
 * 
 * =========================================
 * PROJECT STRUCTURE
 * =========================================
 * 
 * /src/
 *   ├── components/              # React components organized by feature
 *   │   ├── UI/                  # Reusable UI components
 *   │   │   ├── Button.tsx       # Versatile button component (4 variants)
 *   │   │   ├── Badge.tsx        # Status badge with counts
 *   │   │   ├── Tabs.tsx         # Tab navigation component
 *   │   │   ├── Checkbox.tsx     # Custom styled checkbox
 *   │   │   ├── SearchInput.tsx  # Search input with clear button
 *   │   │   └── index.ts         # Barrel export
 *   │   │
 *   │   ├── Header/              # Top navigation bar
 *   │   │   ├── Header.tsx       # Header component with branding
 *   │   │   └── index.ts
 *   │   │
 *   │   ├── Footer/              # Bottom section with developer info
 *   │   │   ├── Footer.tsx       # Developer profile display
 *   │   │   └── index.ts
 *   │   │
 *   │   ├── Player/              # Video player component
 *   │   │   ├── Player.tsx       # HLS player with fullscreen, PiP, etc
 *   │   │   └── index.ts
 *   │   │
 *   │   ├── ChannelList/         # Channel management components
 *   │   │   ├── ChannelList.tsx  # Main list with filtering & search
 *   │   │   ├── ChannelItem.tsx  # Individual channel row
 *   │   │   └── index.ts
 *   │   │
 *   │   └── Modals/              # Dialog/Modal components
 *   │       ├── Modal.tsx        # Generic modal dialog
 *   │       ├── DisclaimerModal.tsx # Welcome disclaimer
 *   │       └── index.ts
 *   │
 *   ├── hooks/                   # Custom React hooks
 *   │   ├── useChannels.ts       # Channel state management & M3U parsing
 *   │   ├── useLocalStorage.ts   # Persistent browser storage
 *   │   ├── useDebounce.ts       # Debounce hook for search
 *   │   └── index.ts             # Barrel export
 *   │
 *   ├── types/                   # TypeScript type definitions
 *   │   ├── channel.ts           # Channel, Playlist, Stats types
 *   │   └── stream.ts            # Stream-related types (inherited)
 *   │
 *   ├── utils/                   # Utility functions
 *   │   ├── streamUtils.ts       # Stream checking, M3U export, clipboard
 *   │   └── index.ts
 *   │
 *   ├── constants/               # Application constants
 *   │   └── sources.ts           # Pre-configured M3U source URLs
 *   │
 *   ├── App.tsx                  # Root application component
 *   ├── main.tsx                 # Application entry point
 *   └── index.css                # Global styles + Tailwind
 * 
 * =========================================
 * KEY FEATURES
 * =========================================
 * 
 * 1. PLAYLIST LOADING
 *    - Load M3U/M3U8 playlists from URLs
 *    - Parse channel metadata (name, logo, group, tvg-id)
 *    - Support for EXTINF format
 * 
 * 2. VIDEO PLAYER
 *    - HLS.js integration for adaptive streaming
 *    - Fullscreen support
 *    - Picture-in-Picture (PiP) mode
 *    - Volume control with mute
 *    - Safari native HLS support
 * 
 * 3. CHANNEL MANAGEMENT
 *    - View all channels or filter by status (Playable, Dead, Blocked)
 *    - Search channels by name, URL, or group
 *    - Bulk select/deselect channels
 *    - Individual or batch operations
 * 
 * 4. STREAM VERIFICATION
 *    - Check individual channel status
 *    - Bulk check all channels with progress tracking
 *    - Configurable timeout and concurrency
 *    - Status categories: playable, dead, blocked, unknown
 * 
 * 5. EXPORT & IMPORT
 *    - Export channels to M3U format file
 *    - Copy playable URLs to clipboard
 *    - Preserve channel metadata on export
 * 
 * 6. USER EXPERIENCE
 *    - Dark/Light theme toggle
 *    - Persistent user preferences (localStorage)
 *    - Responsive design (mobile to desktop)
 *    - Smooth animations and transitions
 *    - Statistics dashboard
 * 
 * =========================================
 * COMPONENT ARCHITECTURE
 * =========================================
 * 
 * App (Root)
 * ├── Header
 * │   └── Theme toggle
 * ├── DisclaimerModal
 * │   └── First-time disclaimer
 * ├── PlaylistSection
 * │   └── Source buttons
 * ├── StatisticsSection
 * │   └── Badge counts
 * ├── ControlsSection
 * │   ├── SearchInput
 * │   └── Action buttons
 * ├── PlayerSection
 * │   └── Player
 * │       └── Video element + Controls
 * ├── ChannelSection
 * │   ├── Tabs (All, Playable, Dead, Blocked)
 * │   └── ChannelList
 * │       └── ChannelItem (repeating)
 * └── Footer
 *     └── Developer profile
 * 
 * =========================================
 * STATE MANAGEMENT
 * =========================================
 * 
 * Global State (using custom hooks):
 * - channels: Channel[] - All loaded channels
 * - selectedChannelIds: Set<string> - User selections
 * - currentChannel: Channel - Now playing
 * - searchTerm: string - Search filter
 * - activeTab: 'all' | ChannelStatus - Active filter
 * - isDarkMode: boolean - Theme preference
 * - isCheckingStreams: boolean - Check progress state
 * - checkProgress: {completed, total} - Progress tracking
 * 
 * Persisted State (localStorage):
 * - darkMode - Theme preference
 * - disclaimerSeen - First-time flag
 * 
 * =========================================
 * HOOKS EXPLAINED
 * =========================================
 * 
 * useChannels()
 * - Manages channel list state
 * - Parses M3U format with parseM3U()
 * - Handles CRUD operations
 * - Calculates statistics
 * 
 * useLocalStorage<T>(key, initialValue)
 * - Wrapper for browser localStorage
 * - Syncs state with disk
 * - Survives page refresh
 * 
 * useDebounce<T>(value, delay)
 * - Delays state updates
 * - Prevents excessive renders on search
 * - Default delay: 300ms
 * 
 * =========================================
 * UTILITIES EXPLAINED
 * =========================================
 * 
 * checkStreamStatus(url, timeout)
 * - Validates if stream is accessible
 * - Returns: 'playable' | 'dead' | 'blocked'
 * - Uses HEAD request for quick check
 * 
 * checkMultipleStreams(channels, concurrency, onProgress)
 * - Batch checks multiple channels
 * - Controls concurrency (default: 5)
 * - Calls progress callback
 * 
 * parseM3U(content)
 * - Parses M3U/M3U8 playlist format
 * - Extracts metadata from EXTINF lines
 * - Returns Channel array
 * 
 * exportToM3U(channels, filename)
 * - Generates M3U format content
 * - Triggers download
 * - Preserves all metadata
 * 
 * copyToClipboard(text)
 * - Uses Clipboard API
 * - Returns success boolean
 * 
 * =========================================
 * STYLING APPROACH
 * =========================================
 * 
 * Framework: Tailwind CSS 4.3
 * - Utility-first CSS
 * - Responsive breakpoints
 * - Dark mode support
 * - No custom CSS burden
 * 
 * Key Utilities Used:
 * - Flexbox: flex, gap, items-center
 * - Grid: grid, grid-cols-N
 * - Responsive: md:, lg: prefixes
 * - Colors: indigo, slate, emerald, red, orange
 * - Spacing: px, py, mb, mt, gap
 * - Borders: rounded, border
 * - Effects: shadow, opacity, transitions
 * 
 * Custom Additions (index.css):
 * - .gradient-text - Gradient text effect
 * - .glass, .glass-dark - Glassmorphism
 * - Custom scrollbar styling
 * - Animation keyframes
 * - Dark mode CSS
 * 
 * =========================================
 * DATA FLOW
 * =========================================
 * 
 * 1. USER LOADS PLAYLIST
 *    User clicks source button
 *    → handleLoadPlaylist(url)
 *    → loadChannels(url)
 *    → parseM3U(response)
 *    → Store in state
 *    → Update UI with channels
 * 
 * 2. USER CHECKS STREAMS
 *    User clicks "Check All"
 *    → handleBulkCheckStreams()
 *    → checkMultipleStreams(channels, 5)
 *    → Loop with concurrency control
 *    → updateChannelStatus() for each
 *    → Update progress bar
 *    → Final state reflects all statuses
 * 
 * 3. USER PLAYS CHANNEL
 *    User clicks play button
 *    → handlePlayChannel(channel)
 *    → setCurrentChannel(channel)
 *    → setIsPlaying(true)
 *    → Player effect triggered
 *    → initializeHls(url)
 *    → HLS.js loads stream
 *    → Video plays
 * 
 * 4. USER FILTERS/SEARCHES
 *    User types in search
 *    → setSearchTerm(value)
 *    → Debounce: 300ms delay
 *    → debouncedSearch updates
 *    → ChannelList re-filters
 *    → activeTab combined with search
 *    → Filtered results displayed
 * 
 * =========================================
 * PERFORMANCE OPTIMIZATIONS
 * =========================================
 * 
 * 1. Memoization
 *    - useMemo for stats calculation
 *    - useCallback for event handlers
 * 
 * 2. Debouncing
 *    - Search input debounced 300ms
 *    - Reduces render thrashing
 * 
 * 3. Concurrent Stream Checking
 *    - Checks 5 streams at a time
 *    - Prevents browser freeze
 * 
 * 4. Code Splitting
 *    - Component-based structure
 *    - Lazy loading potential
 * 
 * 5. Image Optimization
 *    - Channel logos: object-contain
 *    - Profile image: rounded caching
 * 
 * =========================================
 * BROWSER SUPPORT
 * =========================================
 * 
 * Required APIs:
 * - ES6+ JavaScript
 * - Fetch API
 * - localStorage
 * - Clipboard API
 * - HLS.js (included via npm)
 * 
 * Fallbacks:
 * - Safari native HLS support (video/mp4)
 * - Graceful error handling
 * 
 * Tested on:
 * - Chrome/Edge 90+
 * - Firefox 88+
 * - Safari 14+
 * - Mobile browsers
 * 
 * =========================================
 * USAGE INSTRUCTIONS
 * =========================================
 * 
 * INSTALLATION:
 *   npm install
 * 
 * DEVELOPMENT:
 *   npm run dev
 *   Opens at http://localhost:5173
 * 
 * BUILD:
 *   npm run build
 *   Generates /dist folder
 * 
 * LINTING:
 *   npm run lint
 *   Checks code quality
 * 
 * DEPLOYMENT:
 *   npm run build && npm run preview
 *   Ready for production upload
 * 
 * =========================================
 * FUTURE ENHANCEMENTS
 * =========================================
 * 
 * [ ] Save favorite channels
 * [ ] Create custom playlists
 * [ ] EPG (Electronic Program Guide)
 * [ ] Advanced filtering/sorting
 * [ ] Stream recording feature
 * [ ] Subtitle support
 * [ ] Multi-language UI
 * [ ] Channel recommendations
 * [ ] User authentication
 * [ ] Cloud sync playlists
 * [ ] History/watch time tracking
 * 
 * =========================================
 */

// This is a documentation file explaining the entire application architecture.
// For quick setup, see the README.md file.
