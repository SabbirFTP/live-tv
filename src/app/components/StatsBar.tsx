import type { Stream } from './types';

export function StatsBar({ streams }: { streams: Stream[] }) {
  const total = streams.length;
  const live = streams.filter(s => s.status === 'live').length;
  const blocked = streams.filter(s => s.status === 'blocked').length;
  const dead = streams.filter(s => s.status === 'dead').length;
  const checking = streams.filter(s => s.status === 'checking').length;
  const idle = total - live - blocked - dead - checking;

  if (total === 0) return null;

  const stats = [
    { label: 'Total', value: total, color: 'text-foreground' },
    { label: 'Live', value: live, color: 'text-green-500' },
    { label: 'Blocked', value: blocked, color: 'text-amber-500' },
    { label: 'Dead', value: dead, color: 'text-red-500' },
    { label: 'Idle', value: idle + checking, color: 'text-muted-foreground' },
  ];

  return (
    <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex-1 flex flex-col items-center py-3 ${i < stats.length - 1 ? 'border-r border-border' : ''} bg-card`}
        >
          <span className={`text-lg font-mono ${s.color}`}>{s.value}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{s.label}</span>
        </div>
      ))}

      {/* Progress bar */}
      {total > 0 && live + blocked + dead > 0 && (
        <div className="hidden" aria-hidden />
      )}
    </div>
  );
}
