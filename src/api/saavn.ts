const BASE_URL = 'https://saavn.sumit.co';

type SaavnImage = { quality?: string; link?: string; url?: string };
type SaavnDownloadUrl = { quality?: string; link?: string; url?: string };

type SaavnSongLike = {
  id: string;
  name: string;
  duration?: string | number;
  primaryArtists?: string;
  artists?: { primary?: Array<{ name: string }> };
  album?: { name?: string };
  image?: SaavnImage[];
  downloadUrl?: SaavnDownloadUrl[];
};

type SearchResponse =
  | {
      status?: string;
      data?: { results?: SaavnSongLike[]; total?: number; start?: number };
    }
  | {
      success?: boolean;
      data?: { results?: SaavnSongLike[]; total?: number; start?: number };
    };

function pickBestUrl(items?: Array<{ quality?: string; link?: string; url?: string }>) {
  if (!items?.length) return undefined;
  const sorted = [...items].sort((a, b) => {
    const aq = parseInt((a.quality ?? '').replace(/\D/g, ''), 10) || 0;
    const bq = parseInt((b.quality ?? '').replace(/\D/g, ''), 10) || 0;
    return bq - aq;
  });
  return sorted[0].url ?? sorted[0].link;
}

export type SaavnSong = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  artworkUrl?: string;
  streamUrl?: string;
};

function normalizeSong(s: SaavnSongLike): SaavnSong {
  const durationNum =
    typeof s.duration === 'string' ? parseInt(s.duration, 10) : typeof s.duration === 'number' ? s.duration : undefined;
  const artist =
    s.primaryArtists ??
    (s.artists?.primary?.map((a) => a.name).filter(Boolean).join(', ') || '') ??
    '';

  return {
    id: s.id,
    title: s.name,
    artist,
    album: s.album?.name,
    durationSec: Number.isFinite(durationNum) ? durationNum : undefined,
    artworkUrl: pickBestUrl(s.image),
    streamUrl: pickBestUrl(s.downloadUrl),
  };
}

export type SearchSongsResult = {
  results: SaavnSong[];
  total?: number;
  start?: number;
};

export async function searchSongs(params: {
  query: string;
  page?: number;
  limit?: number;
}): Promise<SearchSongsResult> {
  const url = new URL('/api/search/songs', BASE_URL);
  url.searchParams.set('query', params.query);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Saavn search failed: ${res.status}`);
  const json = (await res.json()) as SearchResponse;

  const data = (json as any)?.data ?? {};
  const raw = (data?.results ?? []) as SaavnSongLike[];
  const results = raw.map(normalizeSong).filter((x) => !!x.streamUrl);

  return {
    results,
    total: data?.total,
    start: data?.start,
  };
}

type SaavnArtistLike = {
  id: string;
  name: string;
  image?: SaavnImage[];
  followers?: number;
  songs?: SaavnSongLike[];
};

export type SaavnArtist = {
  id: string;
  name: string;
  imageUrl?: string;
  followers?: number;
};

export type SearchArtistsResult = {
  results: SaavnArtist[];
  total?: number;
};

function normalizeArtist(a: SaavnArtistLike): SaavnArtist {
  return {
    id: a.id,
    name: a.name,
    imageUrl: pickBestUrl(a.image),
    followers: a.followers,
  };
}

export async function searchArtists(params: {
  query: string;
  page?: number;
  limit?: number;
}): Promise<SearchArtistsResult> {
  const url = new URL('/api/search/artists', BASE_URL);
  url.searchParams.set('query', params.query);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Saavn artist search failed: ${res.status}`);
  const json = (await res.json()) as any;

  const data = json?.data ?? {};
  const raw = (data?.results ?? []) as SaavnArtistLike[];
  const results = raw.map(normalizeArtist);

  return {
    results,
    total: data?.total,
  };
}

type SaavnAlbumLike = {
  id: string;
  name: string;
  year?: string;
  image?: SaavnImage[];
  primaryArtists?: string;
  artists?: { primary?: Array<{ name: string }> };
  songs?: SaavnSongLike[];
};

export type SaavnAlbum = {
  id: string;
  name: string;
  artist: string;
  year?: number;
  imageUrl?: string;
  songCount?: number;
};

export type SearchAlbumsResult = {
  results: SaavnAlbum[];
  total?: number;
};

function normalizeAlbum(a: SaavnAlbumLike): SaavnAlbum {
  const artist =
    a.primaryArtists ??
    (a.artists?.primary?.map((ar) => ar.name).filter(Boolean).join(', ') || '') ??
    '';

  return {
    id: a.id,
    name: a.name,
    artist,
    year: a.year ? parseInt(a.year, 10) : undefined,
    imageUrl: pickBestUrl(a.image),
    songCount: a.songs?.length,
  };
}

export async function searchAlbums(params: {
  query: string;
  page?: number;
  limit?: number;
}): Promise<SearchAlbumsResult> {
  const url = new URL('/api/search/albums', BASE_URL);
  url.searchParams.set('query', params.query);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Saavn album search failed: ${res.status}`);
  const json = (await res.json()) as any;

  const data = json?.data ?? {};
  const raw = (data?.results ?? []) as SaavnAlbumLike[];
  const results = raw.map(normalizeAlbum);

  return {
    results,
    total: data?.total,
  };
}
