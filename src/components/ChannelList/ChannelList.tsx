/**
 * Channel List Component
 * Main list view for channels with filtering and actions
 */

import React, { useMemo } from 'react';
import type { Channel, ChannelStatus } from '../../types/channel';
import ChannelItem from './ChannelItem';

interface ChannelListProps {
  channels: Channel[];
  selectedChannels: Set<string>;
  onSelectChannel: (id: string, selected: boolean) => void;
  activeTab?: ChannelStatus | 'all';
  searchTerm?: string;
  onPlayChannel?: (channel: Channel) => void;
  onCheckChannel?: (channel: Channel) => void;
  onDeleteChannel?: (id: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannels,
  onSelectChannel,

  activeTab = 'all',
  searchTerm = '',
  onPlayChannel,
  onCheckChannel,
  onDeleteChannel,
}) => {
  /**
   * Filter channels based on active tab and search term
   */
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter((ch) => ch.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ch) =>
          ch.name.toLowerCase().includes(term) ||
          ch.url.toLowerCase().includes(term) ||
          ch.group?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [channels, activeTab, searchTerm]);

  /**
   * Check if all filtered channels are selected
   */
  const allSelected = filteredChannels.length > 0 && filteredChannels.every((ch) => selectedChannels.has(ch.id));

  /**
   * Handle select all toggle
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      filteredChannels.forEach((ch) => onSelectChannel(ch.id, true));
    } else {
      filteredChannels.forEach((ch) => onSelectChannel(ch.id, false));
    }
  };

  if (filteredChannels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <div className="text-center">
          <p className="text-slate-600 font-medium">No channels found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All Header */}
      {filteredChannels.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-indigo-300 checked:bg-indigo-600 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700">
            {selectedChannels.size > 0
              ? `${selectedChannels.size} selected`
              : `Select all ${filteredChannels.length} channels`}
          </span>
        </div>
      )}

      {/* Channel Items */}
      <div className="space-y-2">
        {filteredChannels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isSelected={selectedChannels.has(channel.id)}
            onSelect={(selected) => onSelectChannel(channel.id, selected)}
            onPlay={() => onPlayChannel?.(channel)}
            onCheck={() => onCheckChannel?.(channel)}
            onDelete={() => onDeleteChannel?.(channel.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChannelList;
