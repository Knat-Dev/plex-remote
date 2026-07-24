import type { MediaItemDto } from '../api/types.ts';
import { MediaCard } from './MediaCard.tsx';

interface PosterGridProps {
  items: MediaItemDto[];
  onOpen: (item: MediaItemDto) => void;
}

export function PosterGrid({ items, onOpen }: PosterGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <MediaCard key={item.ratingKey} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
