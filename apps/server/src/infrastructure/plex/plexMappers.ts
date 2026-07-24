import type { LibrarySection, MediaItem, MediaType } from '../../domain/entities/MediaItem.js';

export interface MetadataDto {
  ratingKey?: string;
  key?: string;
  title?: string;
  type?: string;
  thumb?: string;
  grandparentThumb?: string;
  art?: string;
  year?: number;
  summary?: string;
  duration?: number;
  index?: number;
  parentIndex?: number;
  parentTitle?: string;
  grandparentTitle?: string;
  viewOffset?: number;
  viewCount?: number;
  leafCount?: number;
  viewedLeafCount?: number;
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
    ...(dto.grandparentThumb !== undefined ? { showThumb: dto.grandparentThumb } : {}),
    ...(dto.art !== undefined ? { art: dto.art } : {}),
    ...(dto.year !== undefined ? { year: dto.year } : {}),
    ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
    ...(dto.duration !== undefined ? { durationMs: dto.duration } : {}),
    ...(dto.index !== undefined ? { index: dto.index } : {}),
    ...(dto.parentIndex !== undefined ? { seasonIndex: dto.parentIndex } : {}),
    ...(dto.parentTitle !== undefined ? { parentTitle: dto.parentTitle } : {}),
    ...(dto.grandparentTitle !== undefined ? { grandparentTitle: dto.grandparentTitle } : {}),
    browsable: BROWSABLE.has(type),
    ...(dto.viewOffset !== undefined ? { viewOffsetMs: dto.viewOffset } : {}),
    ...(dto.viewCount !== undefined ? { viewCount: dto.viewCount } : {}),
    ...(dto.leafCount !== undefined ? { leafCount: dto.leafCount } : {}),
    ...(dto.viewedLeafCount !== undefined ? { viewedLeafCount: dto.viewedLeafCount } : {}),
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
