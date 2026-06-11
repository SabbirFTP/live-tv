import type { StreamStatus } from './types';

const config: Record<StreamStatus, { label: string; className: string }> = {
  live:     { label: 'Live',     className: 'text-green-500 bg-green-500/10 border-green-500/20' },
  dead:     { label: 'Dead',     className: 'text-red-500 bg-red-500/10 border-red-500/20' },
  blocked:  { label: 'Blocked',  className: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  checking: { label: 'Checking', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  idle:     { label: 'Idle',     className: 'text-muted-foreground bg-muted border-border' },
};

export function StatusBadge({ status }: { status: StreamStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono tracking-wide ${className}`}>
      {status === 'live' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
      )}
      {status === 'checking' && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {label}
    </span>
  );
}
