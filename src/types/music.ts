export type RepeatMode = 'off' | 'one' | 'all';

export type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  artworkUrl?: string;
  streamUrl: string;
};
