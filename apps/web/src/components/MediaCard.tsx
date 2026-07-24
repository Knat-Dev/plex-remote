import { ChevronRight } from 'lucide-react';
import { TitleMarquee } from './TitleMarquee.tsx';
import type { MediaItemDto } from '../api/types.ts';

interface MediaCardProps {
  item: MediaItemDto;
  onOpen: (item: MediaItemDto) => void;
}

/** A poster tile. Browsable items show a chevron; playables read as tappable. */
export function MediaCard({ item, onOpen }: MediaCardProps) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="group flex flex-col text-left focus:outline-none"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-secondary ring-1 ring-border transition group-active:scale-[0.97]">
        {item.thumbUrl ? (
          <img src={item.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {item.title}
          </div>
        )}
        {item.browsable && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur">
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
      <TitleMarquee text={item.title} className="mt-1.5 w-full text-sm font-medium" />
      {(item.subtitle || item.year) && (
        <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle ?? item.year}</p>
      )}
    </button>
  );
}
