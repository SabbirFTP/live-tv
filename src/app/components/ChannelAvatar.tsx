import { useState } from 'react';
import { getInitials } from './utils';

const PALETTE = [
  'bg-zinc-700 text-zinc-300',
  'bg-neutral-700 text-neutral-300',
  'bg-stone-700 text-stone-300',
  'bg-slate-700 text-slate-300',
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % PALETTE.length;
  return PALETTE[h];
}

export function ChannelAvatar({ name, logo, size = 36 }: { name: string; logo: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name) || '?';
  const colorClass = hashColor(name);

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded object-contain bg-muted"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      className={`rounded flex items-center justify-center text-xs font-mono font-medium select-none ${colorClass}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {initials}
    </div>
  );
}
