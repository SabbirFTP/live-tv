/**
 * Channel Item Component
 * Single channel row/card in the list
 */

import React from 'react';
import type { Channel } from '../../types/channel';
import { Checkbox } from '../UI';

interface ChannelItemProps {
  channel: Channel;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onPlay?: () => void;
  onCheck?: () => void;
  onDelete?: () => void;
}

const getStatusColor = (status: Channel['status']): string => {
  switch (status) {
    case 'playable':
      return 'bg-emerald-100 text-emerald-700';
    case 'dead':
      return 'bg-red-100 text-red-600';
    case 'blocked':
      return 'bg-orange-100 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isSelected = false,
  onSelect,
  onPlay,
  onCheck,
  onDelete,
}) => {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 border rounded-lg transition-all
        ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'}
      `}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onChange={(e) => onSelect?.(e.target.checked)}
        className="flex-shrink-0"
      />

      {/* Channel Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 truncate">{channel.name}</h3>
          {channel.logo && (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-5 h-5 rounded object-contain"
            />
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-1">{channel.url}</p>
      </div>

      {/* Status Badge */}
      <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${getStatusColor(channel.status)}`}>
        {channel.status}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1">
        {onPlay && (
          <button
            onClick={onPlay}
            className="p-1.5 hover:bg-indigo-100 rounded transition-colors"
            title="Play"
          >
            ▶
          </button>
        )}
        {onCheck && (
          <button
            onClick={onCheck}
            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
            title="Check Status"
          >
            ✓
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded transition-colors"
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ChannelItem;
