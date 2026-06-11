import { Play, RotateCcw, Copy, Trash2, Star, CheckCircle } from 'lucide-react';
import type { Stream } from './types';
import { StatusBadge } from './StatusBadge';
import { ChannelAvatar } from './ChannelAvatar';
import { truncateUrl } from './utils';

interface Props {
  stream: Stream;
  selected: boolean;
  onSelect: (id: string) => void;
  onPlay: (stream: Stream) => void;
  onCheck: (id: string) => void;
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
}

export function StreamCard({ stream, selected, onSelect, onPlay, onCheck, onCopy, onDelete, onFavorite }: Props) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-accent/50 ${selected ? 'bg-accent/30' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onSelect(stream.id)}
        className="shrink-0 w-4 h-4 rounded border border-border flex items-center justify-center transition-colors hover:border-primary"
        aria-label="Select stream"
      >
        {selected && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
      </button>

      {/* Avatar */}
      <ChannelAvatar name={stream.name} logo={stream.logo} size={32} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-foreground">{stream.name}</span>
          {stream.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
          {/* Status badge for mobile */}
          <span className="sm:hidden shrink-0">
            <StatusBadge status={stream.status} />
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono text-muted-foreground truncate">{truncateUrl(stream.url)}</span>
          {stream.group && (
            <span className="hidden sm:inline text-xs px-1.5 py-0 rounded border border-border text-muted-foreground font-mono shrink-0">
              {stream.group}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="w-24 flex justify-center shrink-0 hidden sm:flex">
        <StatusBadge status={stream.status} />
      </div>

      {/* Response time */}
      {stream.responseTime !== undefined && (
        <span className="hidden md:block text-xs font-mono text-muted-foreground w-16 text-right shrink-0">
          {stream.responseTime}ms
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onPlay(stream)}
          className="p-1.5 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Play"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onCheck(stream.id)}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Check status"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onCopy(stream.url)}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Copy URL"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onFavorite(stream.id)}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Favorite"
        >
          <Star className={`w-3.5 h-3.5 ${stream.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
        </button>
        <button
          onClick={() => onDelete(stream.id)}
          className="p-1.5 rounded hover:bg-destructive/20 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
