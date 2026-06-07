/**
 * Main App Component
 * Root component that orchestrates the entire Live TV application
 * 
 * Features:
 * - Load M3U/M3U8 playlists
 * - Play channels with HLS.js support
 * - Filter channels (All, Playable, Dead, Blocked)
 * - Check stream status
 * - Bulk operations (select, delete, export)
 * - Search functionality
 * - Developer profile display
 * 
 * Architecture:
 * - Component-based structure
 * - Custom hooks for state management
 * - Utility functions for stream operations
 * - Professional UI components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Player } from './components/Player';
import { ChannelList } from './components/ChannelList';
import { Button, Badge, Tabs, SearchInput } from './components/UI';
import { DisclaimerModal } from './components/Modals';
import { useChannels, useLocalStorage, useDebounce } from './hooks';
import { PUBLIC_SOURCES } from './constants/sources';
import { checkStreamStatus, checkMultipleStreams, exportToM3U, copyToClipboard } from './utils';
import type { Channel, ChannelStatus } from './types/channel';

const App: React.FC = () => {
  // ==================== STATE ====================

  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);
  const [showDisclaimer, setShowDisclaimer] = useLocalStorage('disclaimerSeen', false);
  const [currentChannel, setCurrentChannel] = useState<Channel | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ChannelStatus | 'all'>('all');
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
  const [isCheckingStreams, setIsCheckingStreams] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ completed: 0, total: 0 });

  // Custom hooks
  const { channels, loading, loadChannels, removeChannel, updateChannelStatus, getStats } = useChannels();
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ==================== STATISTICS ====================

  const stats = useMemo(() => getStats(), [channels, getStats]);

  const tabOptions = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'playable', label: 'Playable', count: stats.playable },
    { id: 'dead', label: 'Dead', count: stats.dead },
    { id: 'blocked', label: 'Blocked', count: stats.blocked },
  ];

  // ==================== EFFECTS ====================

  /**
   * Apply dark mode
   */
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ==================== HANDLERS ====================

  /**
   * Load playlist from URL
   */
  const handleLoadPlaylist = async (sourceUrl: string) => {
    const loadedChannels = await loadChannels(sourceUrl);
    if (loadedChannels.length > 0) {
      setSelectedChannelIds(new Set());
      setActiveTab('all');
    }
  };

  /**
   * Toggle disclaimer modal
   */
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(true);
  };

  /**
   * Select/deselect single channel
   */
  const handleSelectChannel = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedChannelIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedChannelIds(newSelected);
  };

  /**
   * Play channel
   */
  const handlePlayChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    setIsPlaying(true);
  };

  /**
   * Check single channel status
   */
  const handleCheckChannel = async (channel: Channel) => {
    const status = await checkStreamStatus(channel.url);
    updateChannelStatus(channel.id, status);
  };

  /**
   * Check all channels status
   */
  const handleBulkCheckStreams = async () => {
    if (channels.length === 0) return;

    setIsCheckingStreams(true);
    setCheckProgress({ completed: 0, total: channels.length });

    try {
      const channelsToCheck =
        selectedChannelIds.size > 0
          ? channels.filter((ch) => selectedChannelIds.has(ch.id))
          : channels;

      const updated = await checkMultipleStreams(
        channelsToCheck,
        5, // concurrency
        (completed, total) => {
          setCheckProgress({ completed, total });
        }
      );

      // Update each channel's status
      updated.forEach((ch) => {
        updateChannelStatus(ch.id, ch.status);
      });

      setSelectedChannelIds(new Set()); // Clear selection after checking
    } catch (error) {
      console.error('Error checking streams:', error);
    } finally {
      setIsCheckingStreams(false);
    }
  };

  /**
   * Delete channel
   */
  const handleDeleteChannel = (id: string) => {
    removeChannel(id);
    setSelectedChannelIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  /**
   * Delete selected channels
   */
  const handleDeleteSelected = () => {
    selectedChannelIds.forEach((id) => removeChannel(id));
    setSelectedChannelIds(new Set());
  };

  /**
   * Export channels to M3U
   */
  const handleExportChannels = () => {
    const channelsToExport =
      selectedChannelIds.size > 0
        ? channels.filter((ch) => selectedChannelIds.has(ch.id))
        : channels;

    exportToM3U(channelsToExport, 'live-tv-channels.m3u');
  };

  /**
   * Copy playable URLs to clipboard
   */
  const handleCopyPlayable = async () => {
    const playable = channels.filter((ch) => ch.status === 'playable');
    const urls = playable.map((ch) => ch.url).join('\n');
    const success = await copyToClipboard(urls);

    if (success) {
      alert(`Copied ${playable.length} playable stream URLs!`);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
        {/* Header */}
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          title="📺 Live TV"
        />

        {/* Disclaimer Modal */}
        <DisclaimerModal
          isOpen={!showDisclaimer}
          onAccept={handleAcceptDisclaimer}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
          {/* Section: Load Playlist */}
          <section className="bg-indigo-50 dark:bg-slate-800 rounded-lg p-6 border border-indigo-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Load Playlist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PUBLIC_SOURCES.slice(0, 6).map((source) => (
                <Button
                  key={source.url}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLoadPlaylist(source.url)}
                  disabled={loading}
                  className="text-left"
                >
                  <div className="font-semibold">{source.label}</div>
                  <div className="text-xs opacity-90">{source.description}</div>
                </Button>
              ))}
            </div>
          </section>

          {/* Section: Statistics */}
          {channels.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge label="Total" count={stats.total} variant="primary" />
                <Badge label="Playable" count={stats.playable} variant="success" />
                <Badge label="Dead" count={stats.dead} variant="danger" />
                <Badge label="Blocked" count={stats.blocked} variant="warning" />
              </div>
            </section>
          )}

          {/* Section: Controls */}
          {channels.length > 0 && (
            <section className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Controls</h2>

              {/* Search */}
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkCheckStreams}
                  disabled={isCheckingStreams}
                >
                  {isCheckingStreams ? `✓ ${checkProgress.completed}/${checkProgress.total}` : 'Check All'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportChannels}
                  disabled={channels.length === 0}
                >
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyPlayable}
                  disabled={stats.playable === 0}
                >
                  Copy Playable
                </Button>
                {selectedChannelIds.size > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    Delete ({selectedChannelIds.size})
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isCheckingStreams && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{
                      width: `${(checkProgress.completed / checkProgress.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {/* Section: Player */}
          {channels.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Player</h2>
              <Player
                channel={currentChannel}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onStop={() => setIsPlaying(false)}
              />
            </section>
          )}

          {/* Section: Channel List */}
          {channels.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Channels</h2>

              {/* Tabs */}
              <Tabs
                tabs={tabOptions}
                activeTab={activeTab}
                onTabChange={(id: string) => setActiveTab(id as ChannelStatus | 'all')}
              />

              {/* Channel List */}
              <ChannelList
                channels={channels}
                selectedChannels={selectedChannelIds}
                onSelectChannel={handleSelectChannel}
                activeTab={activeTab}
                searchTerm={debouncedSearch}
                onPlayChannel={handlePlayChannel}
                onCheckChannel={handleCheckChannel}
                onDeleteChannel={handleDeleteChannel}
              />
            </section>
          )}

          {/* Empty State */}
          {!loading && channels.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No Channels Loaded
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Select a playlist source above to get started
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin text-4xl">🔄</div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Loading playlist...</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer
          developer={{
            name: 'SabbirMMS',
            github: 'sabbirmms',
            avatar: 'https://avatars.githubusercontent.com/u/sabbirmms',
            description: 'Professional Live TV streaming application built with React',
          }}
        />
      </div>
    </div>
  );
};

export default App;