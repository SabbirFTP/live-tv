# 📺 Live TV - M3U/M3U8 Streaming Application

A professional, component-based React application for streaming IPTV channels from M3U/M3U8 playlists. Built with TypeScript, Tailwind CSS, and HLS.js.

**Developer:** SabbirMMS ([@sabbirmms](https://github.com/sabbirmms))

---

## 🎯 Features

- ✅ **Playlist Loading** - Load M3U/M3U8 playlists from URLs with instant parsing
- ✅ **HLS Streaming** - Play channels using HLS.js with adaptive bitrate
- ✅ **Player Controls** - Fullscreen, Picture-in-Picture, volume control, mute
- ✅ **Channel Management** - View, search, filter, and organize channels
- ✅ **Stream Verification** - Check individual or bulk channel status
- ✅ **Bulk Operations** - Select multiple channels, delete, export, copy URLs
- ✅ **Dark/Light Theme** - Toggle theme with persistent preference
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Professional UI** - Component-based architecture with clean styling

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📦 Project Structure

```
src/
├── components/              # React components
│   ├── UI/                 # Reusable components (Button, Badge, Tabs, etc)
│   ├── Header/             # Top navigation
│   ├── Footer/             # Developer info section
│   ├── Player/             # HLS video player
│   ├── ChannelList/        # Channel display & filtering
│   └── Modals/             # Dialog components
├── hooks/                  # Custom React hooks
│   ├── useChannels.ts      # Channel state & M3U parsing
│   ├── useLocalStorage.ts  # Browser persistence
│   └── useDebounce.ts      # Debounce hook
├── types/                  # TypeScript definitions
│   └── channel.ts          # Channel type definitions
├── utils/                  # Utility functions
│   └── streamUtils.ts      # Stream checking, export, clipboard
├── constants/              # App constants
│   └── sources.ts          # Pre-configured M3U sources
├── App.tsx                 # Root component
└── index.css               # Global styles + Tailwind
```

See **ARCHITECTURE.md** for detailed technical documentation.

---

## 📚 Technology Stack

- **React 19.2** - UI library
- **TypeScript 6.0** - Type-safe development
- **Tailwind CSS 4.3** - Utility-first styling
- **HLS.js 1.6** - HLS streaming playback
- **Vite 8.0** - Fast build tool
- **ESLint** - Code quality

---

## 🎮 Quick Guide

1. **Load Playlist** - Click a preset source or add your own M3U URL
2. **Play Channel** - Click the play button on any channel
3. **Check Status** - Use "Check All" to verify streams
4. **Search & Filter** - Use tabs and search box to find channels
5. **Export** - Download channels or copy playable URLs
6. **Theme** - Toggle dark/light mode in header

---

## 📖 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🔗 Useful Links

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [HLS.js](https://github.com/video-dev/hls.js)
- [Vite Documentation](https://vitejs.dev)

---

## 👤 Developer

**SabbirMMS** - [@sabbirmms](https://github.com/sabbirmms)

Built with ❤️ using React + TypeScript
