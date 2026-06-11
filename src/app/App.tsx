import { useState, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Search, Sun, Moon, Download, Trash2, RotateCcw,
  Tv2, Command, Star, Clock, ChevronDown, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import type { Stream, StreamStatus } from './components/types';
import { StreamInput } from './components/StreamInput';
import { StreamCard } from './components/StreamCard';
import { VideoPlayer } from './components/VideoPlayer';
import { CommandPalette } from './components/CommandPalette';
import { StatsBar } from './components/StatsBar';
import {
  parseM3U, generateId, saveToStorage, loadFromStorage, exportM3U, detectProtocol
} from './components/utils';

/* MARKER-MAKE-KIT-INVOKED */

type TabFilter = 'all' | 'live' | 'blocked' | 'dead' | 'favorites' | 'recent';

const STORAGE_KEY = 'mms-tv-streams';
const THEME_KEY = 'mms-tv-theme';
const VISITS_KEY = 'mms-tv-visits';

async function checkStreamUrl(url: string): Promise<{ status: StreamStatus; responseTime: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    });
    clearTimeout(timer);
    const responseTime = Date.now() - start;
    return { status: 'live', responseTime };
  } catch (e: unknown) {
    const responseTime = Date.now() - start;
    if (e instanceof Error && e.name === 'AbortError') return { status: 'dead', responseTime };
    // no-cors fetch errors often mean CORS block (stream might be live but browser can't check)
    const responseTime2 = Date.now() - start;
    if (responseTime2 < 7000) return { status: 'blocked', responseTime: responseTime2 };
    return { status: 'dead', responseTime: responseTime2 };
  }
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    if (!pages.includes(total)) pages.push(total);
  }
  return pages;
}

export default function App() {
  const [streams, setStreams] = useState<Stream[]>(() => loadFromStorage(STORAGE_KEY, []));
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(THEME_KEY, true));
  const [tab, setTab] = useState<TabFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, tab]);

  const [visits] = useState(() => {
    const v = loadFromStorage<number>(VISITS_KEY, 0) + 1;
    saveToStorage(VISITS_KEY, v);
    return v;
  });

  // Derived filtered list
  const allGroups = [...new Set(streams.map(s => s.group).filter(Boolean))].sort();

  const filtered = streams.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.url.toLowerCase().includes(search.toLowerCase()) &&
        !s.group.toLowerCase().includes(search.toLowerCase())) return false;
    if (groupFilter && s.group !== groupFilter) return false;
    if (tab === 'live') return s.status === 'live';
    if (tab === 'blocked') return s.status === 'blocked';
    if (tab === 'dead') return s.status === 'dead';
    if (tab === 'favorites') return s.isFavorite;
    if (tab === 'recent') return !!s.lastPlayed;
    return true;
  }).sort((a, b) => {
    if (tab === 'recent') return (b.lastPlayed || 0) - (a.lastPlayed || 0);
    return 0;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedStreams = filtered.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );

  // Auto-check visible idle streams on the current page
  const visibleKey = paginatedStreams.map(s => `${s.id}-${s.status}`).join(',');

  useEffect(() => {
    const idleVisible = paginatedStreams.filter(s => s.status === 'idle');
    if (idleVisible.length === 0) return;

    // Mark visible idle streams as checking
    setStreams(prev => prev.map(s => {
      const isIdleVisible = idleVisible.some(iv => iv.id === s.id);
      return isIdleVisible ? { ...s, status: 'checking' } : s;
    }));

    // Check them
    idleVisible.forEach(async (stream) => {
      const result = await checkStreamUrl(stream.url);
      setStreams(prev => prev.map(s => s.id === stream.id ? { ...s, ...result } : s));
    });
  }, [visibleKey]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveToStorage(THEME_KEY, darkMode);
  }, [darkMode]);

  // Persist streams
  useEffect(() => { saveToStorage(STORAGE_KEY, streams); }, [streams]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchAndParse = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      processContent(text);
    } catch {
      // try via proxy
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error();
        const text = await resp.text();
        processContent(text);
      } catch {
        toast.error('Failed to fetch playlist. Check the URL or try uploading the file directly.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const processContent = (content: string) => {
    const parsed = parseM3U(content);
    if (!parsed.length) { toast.error('No streams found in this playlist.'); return; }
    const newStreams: Stream[] = parsed.map(s => ({
      ...s,
      id: generateId(),
      status: 'idle' as StreamStatus,
      isFavorite: false,
      protocol: detectProtocol(s.url),
    }));
    setStreams(prev => {
      const existingUrls = new Set(prev.map(s => s.url));
      const unique = newStreams.filter(s => !existingUrls.has(s.url));
      const total = unique.length;
      if (total === 0) { toast.info('All streams already imported.'); return prev; }
      toast.success(`${total} stream${total !== 1 ? 's' : ''} imported`);
      return [...prev, ...unique];
    });
  };

  const handleCheckStream = useCallback(async (id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'checking' } : s));
    const stream = streams.find(s => s.id === id);
    if (!stream) return;
    const result = await checkStreamUrl(stream.url);
    setStreams(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
    toast.success(`${stream.name}: ${result.status}`);
  }, [streams]);

  const handleCheckAll = useCallback(async () => {
    const toCheck = filtered.filter(s => s.status !== 'checking');
    if (!toCheck.length) return;
    toast.info(`Checking ${toCheck.length} streams…`);
    setStreams(prev => prev.map(s => toCheck.find(c => c.id === s.id) ? { ...s, status: 'checking' } : s));

    const queue = [...toCheck];
    const concurrency = 10;
    const worker = async () => {
      while (queue.length > 0) {
        const stream = queue.shift();
        if (!stream) break;
        const result = await checkStreamUrl(stream.url);
        setStreams(prev => prev.map(s => s.id === stream.id ? { ...s, ...result } : s));
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, worker);
    await Promise.all(workers);
    toast.success('Check complete');
  }, [filtered]);

  const handlePlay = (stream: Stream) => {
    setActiveStream(stream);
    setStreams(prev => prev.map(s => s.id === stream.id ? { ...s, lastPlayed: Date.now() } : s));
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  const handleDelete = (id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    toast.success('Stream removed');
  };

  const handleFavorite = (id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleBulkDelete = () => {
    setStreams(prev => prev.filter(s => !selected.has(s.id)));
    toast.success(`${selected.size} streams removed`);
    setSelected(new Set());
  };

  const handleBulkCheck = useCallback(async () => {
    const toCheck = streams.filter(s => selected.has(s.id));
    if (!toCheck.length) return;
    toast.info(`Checking ${toCheck.length} selected streams…`);
    setStreams(prev => prev.map(s => selected.has(s.id) ? { ...s, status: 'checking' } : s));

    const queue = [...toCheck];
    const concurrency = 10;
    const worker = async () => {
      while (queue.length > 0) {
        const stream = queue.shift();
        if (!stream) break;
        const result = await checkStreamUrl(stream.url);
        setStreams(prev => prev.map(s => s.id === stream.id ? { ...s, ...result } : s));
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, worker);
    await Promise.all(workers);
    toast.success('Bulk check complete');
    setSelected(new Set());
  }, [streams, selected]);

  const handleExport = () => {
    const toExport = selected.size > 0 ? streams.filter(s => selected.has(s.id)) : streams;
    const content = exportM3U(toExport);
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mms-studio-tv.m3u';
    a.click();
    toast.success('Playlist exported');
  };

  const handleClearAll = () => {
    setStreams([]);
    setSelected(new Set());
    toast.success('All streams cleared');
  };

  // Derived configuration

  const TABS: { id: TabFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'dead', label: 'Dead' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'recent', label: 'Recent' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toaster */}
      <Toaster
        position="bottom-right"
        theme={darkMode ? 'dark' : 'light'}
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            fontSize: '13px',
          },
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        streams={streams}
        onPlay={handlePlay}
        onCheckAll={handleCheckAll}
        onExport={handleExport}
        onClearAll={handleClearAll}
        onToggleFavorites={() => setTab('favorites')}
        onToggleTheme={() => setDarkMode(d => !d)}
      />

      {/* Video Player */}
      <VideoPlayer stream={activeStream} onClose={() => setActiveStream(null)} />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Tv2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">MMS Studio TV</span>
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">M3U Player</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative hidden sm:block">
            {searchInput !== search ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            )}
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search channels…"
              className="w-full pl-8 pr-3 py-1.5 bg-input-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex-1" />

          {/* Visit counter */}
          <span className="hidden md:block text-xs font-mono text-muted-foreground">
            Session #{visits}
          </span>

          {/* Cmd+K */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono">K</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Input Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium text-foreground">Import Streams</h2>
            <span className="text-xs text-muted-foreground font-mono">M3U / M3U8 / HLS / DASH</span>
          </div>
          <StreamInput
            onImportUrl={fetchAndParse}
            onImportContent={processContent}
            loading={loading}
          />
        </section>

        {/* Stats */}
        {streams.length > 0 && <StatsBar streams={streams} />}

        {/* Stream List */}
        {streams.length > 0 && (
          <section>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-medium text-foreground">Channels</h2>
              <span className="text-xs font-mono text-muted-foreground">{filtered.length} of {streams.length}</span>
              <div className="flex-1" />

              {/* Group filter */}
              {allGroups.length > 1 && (
                <div className="relative">
                  <select
                    value={groupFilter}
                    onChange={e => setGroupFilter(e.target.value)}
                    className="appearance-none pl-2.5 pr-7 py-1.5 bg-input-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">All groups</option>
                    {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              )}

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>

              {/* Check All */}
              <button
                onClick={handleCheckAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {filtered.length === streams.length ? 'Check All' : 'Check Showing'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-0 border-b border-border">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs transition-colors relative ${
                    tab === t.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                  )}
                  {t.id === 'favorites' && <Star className="inline w-3 h-3 ml-1 mb-0.5" />}
                  {t.id === 'recent' && <Clock className="inline w-3 h-3 ml-1 mb-0.5" />}
                </button>
              ))}
            </div>

            {/* Mobile search */}
            <div className="sm:hidden mt-3">
              <div className="relative">
                {searchInput !== search ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                )}
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search channels…"
                  className="w-full pl-8 pr-3 py-2 bg-input-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2 mt-3 px-4 py-2.5 bg-accent/50 border border-border rounded-lg">
                <span className="text-xs text-foreground font-mono">{selected.size} selected</span>
                <div className="flex-1" />
                <button
                  onClick={handleBulkCheck}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border rounded hover:bg-card transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Check
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border rounded hover:bg-card transition-colors"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-destructive/40 text-red-500 rounded hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Stream list */}
            <div className="mt-3 border border-border rounded-lg overflow-hidden">
              {/* List header */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border">
                <div className="w-4" />
                <div className="w-8" />
                <span className="flex-1 text-xs text-muted-foreground font-mono">Channel</span>
                <span className="w-24 text-xs text-muted-foreground font-mono text-center">Status</span>
                <span className="hidden md:block w-16 text-xs text-muted-foreground font-mono text-right">Latency</span>
                <span className="w-28 text-xs text-muted-foreground font-mono text-right">Actions</span>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Tv2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    {tab !== 'all' ? `No ${tab} channels` : 'No channels match your search'}
                  </p>
                </div>
              ) : (
                <div className="divide-y-0">
                  {paginatedStreams.map(stream => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      selected={selected.has(stream.id)}
                      onSelect={handleSelect}
                      onPlay={handlePlay}
                      onCheck={handleCheckStream}
                      onCopy={handleCopy}
                      onDelete={handleDelete}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filtered.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/20 border border-border rounded-lg">
                {/* Left: Info */}
                <span className="text-xs text-muted-foreground font-mono">
                  Showing <span className="font-semibold text-foreground font-mono">{(activePage - 1) * pageSize + 1}</span>-
                  <span className="font-semibold text-foreground font-mono">{Math.min(activePage * pageSize, totalItems)}</span> of{' '}
                  <span className="font-semibold text-foreground font-mono">{totalItems}</span> channels
                </span>

                {/* Center: Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:hover:bg-card transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers(activePage, totalPages).map((p, idx) => (
                    <button
                      key={idx}
                      disabled={p === '...'}
                      onClick={() => typeof p === 'number' && setCurrentPage(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                        p === activePage
                          ? 'bg-primary text-primary-foreground font-semibold font-mono'
                          : p === '...'
                          ? 'text-muted-foreground cursor-default font-mono'
                          : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer font-mono'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:hover:bg-card transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">Per page:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-2.5 pr-7 py-1 bg-input-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer font-mono"
                    >
                      {[10, 20, 50, 100].map(sz => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {filtered.length > 0 && (
              <p className="text-xs text-muted-foreground font-mono mt-2 text-center">
                {filtered.length} channel{filtered.length !== 1 ? 's' : ''} · MMS Studio TV
              </p>
            )}
          </section>
        )}

        {/* Empty state */}
        {streams.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tv2 className="w-8 h-8 text-muted-foreground opacity-60" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">No streams yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Paste an M3U URL above, upload a file, or choose from the preloaded sources to get started.
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-6 opacity-60">
              Watch Smarter. Stream Cleaner.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">MMS Studio TV</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {streams.length} streams · {visits} session{visits !== 1 ? 's' : ''}
          </span>
        </div>
      </footer>
    </div>
  );
}
