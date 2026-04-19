
export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function formatTimecode(currentTotalSeconds: number): string {
  const h = Math.floor(currentTotalSeconds / 3600);
  const m = Math.floor((currentTotalSeconds % 3600) / 60);
  const s = Math.floor(currentTotalSeconds % 60);
  const f = Math.floor((currentTotalSeconds % 1) * 24);

  const parts = [
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
    f.toString().padStart(2, '0')
  ];

  if (h > 0) {
    parts.unshift(h.toString().padStart(2, '0'));
  } else {
    parts.unshift('00');
  }

  return parts.join(':');
}

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
