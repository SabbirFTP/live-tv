import { useState } from 'react';
import { Link2, Upload, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { PRELOADED_SOURCES } from './types';

interface Props {
  onImportUrl: (url: string) => void;
  onImportContent: (content: string) => void;
  loading: boolean;
}

export function StreamInput({ onImportUrl, onImportContent, loading }: Props) {
  const [url, setUrl] = useState('');
  const [showSources, setShowSources] = useState(false);

  const handleSubmit = () => {
    if (!url.trim()) return;
    onImportUrl(url.trim());
    setUrl('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (text) onImportContent(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Paste M3U / M3U8 URL or stream link…"
            className="w-full pl-9 pr-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors font-mono"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : <Plus className="w-4 h-4" />}
          Import
        </button>
        <label className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-accent cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap border border-border">
          <Upload className="w-4 h-4" />
          Upload
          <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFile} className="sr-only" />
        </label>
      </div>

      {/* Preloaded sources toggle */}
      <button
        onClick={() => setShowSources(s => !s)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Preloaded sources ({PRELOADED_SOURCES.length})
      </button>

      {showSources && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 bg-muted/30 border border-border rounded-lg">
          {PRELOADED_SOURCES.map(source => (
            <div
              key={source.url}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-card border border-border rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{source.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{source.description}</p>
              </div>
              <button
                onClick={() => onImportUrl(source.url)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded border border-border hover:bg-accent transition-colors disabled:opacity-40"
              >
                Import
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
