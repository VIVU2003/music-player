export function formatTime(totalSeconds?: number): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return '0:00';
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
