import type { LibrarySection, MediaItem, MediaType } from '../../domain/entities/MediaItem.js';

export interface MetadataDto {
  ratingKey?: string;
  key?: string;
  title?: string;
  type?: string;
  thumb?: string;
  art?: string;
  year?: number;
  summary?: string;
  duration?: number;
  index?: number;
  parentTitle?: string;
  grandparentTitle?: string;
}

export interface DirectoryDto {
  key?: string;
  title?: string;
  type?: string;
}

const BROWSABLE: ReadonlySet<MediaType> = new Set([
  'show',
  'season',
  'artist',
  'album',
  'collection',
  'library',
]);

export function toMediaItem(dto: MetadataDto): MediaItem {
  const type = normaliseType(dto.type);
  return {
    ratingKey: dto.ratingKey ?? '',
    key: dto.key ?? '',
    title: dto.title ?? 'Untitled',
    type,
    ...(dto.thumb !== undefined ? { thumb: dto.thumb } : {}),
    ...(dto.art !== undefined ? { art: dto.art } : {}),
    ...(dto.year !== undefined ? { year: dto.year } : {}),
    ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
    ...(dto.duration !== undefined ? { durationMs: dto.duration } : {}),
    ...(dto.index !== undefined ? { index: dto.index } : {}),
    ...(dto.parentTitle !== undefined ? { parentTitle: dto.parentTitle } : {}),
    ...(dto.grandparentTitle !== undefined ? { grandparentTitle: dto.grandparentTitle } : {}),
    browsable: BROWSABLE.has(type),
  };
}

export function toSection(dto: DirectoryDto): LibrarySection {
  return {
    key: dto.key ?? '',
    title: dto.title ?? 'Library',
    type: normaliseType(dto.type),
  };
}

function normaliseType(type: string | undefined): MediaType {
  const known: readonly MediaType[] = [
    'movie', 'show', 'season', 'episode',
    'artist', 'album', 'track', 'collection',
  ];
  return known.find((t) => t === type) ?? 'movie';
}
