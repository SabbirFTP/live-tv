import { useEffect, useRef, useState } from 'react';
import { Search, Play, RotateCcw, Download, Trash2, Star, Sun, Moon, Loader2 } from 'lucide-react';
import type { Stream } from './types';

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  streams: Stream[];
  onPlay: (s: Stream) => void;
  onCheckAll: () => void;
  onExport: () => void;
  onClearAll: () => void;
  onToggleFavorites: () => void;
  onToggleTheme: () => void;
}

export function CommandPalette({ open, onClose, streams, onPlay, onCheckAll, onExport, onClearAll, onToggleFavorites, onToggleTheme }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const staticActions: Action[] = [
    { id: 'check', label: 'Check All Streams', icon: <RotateCcw className="w-4 h-4" />, run: () => { onCheckAll(); onClose(); } },
    { id: 'export', label: 'Export Playlist (M3U)', icon: <Download className="w-4 h-4" />, run: () => { onExport(); onClose(); } },
    { id: 'favs', label: 'Show Favorites', icon: <Star className="w-4 h-4" />, run: () => { onToggleFavorites(); onClose(); } },
    { id: 'clear', label: 'Clear All Streams', description: 'Removes all imported streams', icon: <Trash2 className="w-4 h-4" />, run: () => { onClearAll(); onClose(); } },
    { id: 'theme', label: 'Toggle Theme', icon: <Sun className="w-4 h-4" />, run: () => { onToggleTheme(); onClose(); } },
  ];

  const streamActions: Action[] = streams
    .filter(s => s.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .slice(0, 8)
    .map(s => ({
      id: s.id,
      label: s.name,
      description: s.group,
      icon: <Play className="w-4 h-4" />,
      run: () => { onPlay(s); onClose(); },
    }));

  const filtered = query
    ? [...streamActions, ...staticActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))]
    : [...staticActions, ...streamActions.slice(0, 5)];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          {query !== debouncedQuery ? (
            <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search channels, actions…"
            className="flex-1 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-xs font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results</p>
          )}
          {filtered.map(action => (
            <button
              key={action.id}
              onClick={action.run}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
            >
              <span className="text-muted-foreground">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground">{action.label}</span>
                {action.description && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{action.description}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span><kbd className="border border-border rounded px-1 py-0.5">↑↓</kbd> navigate</span>
          <span><kbd className="border border-border rounded px-1 py-0.5">↵</kbd> select</span>
        </div>
      </div>
    </div>
  );
}
