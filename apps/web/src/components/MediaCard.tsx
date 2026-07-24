import type { MediaItemDto } from '../api/types.ts';
import { ChevronIcon } from '../ui/icons.tsx';

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
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)] transition group-active:scale-[0.97]">
        {item.thumbUrl ? (
          <img
            src={item.thumbUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[var(--color-muted)]">
            {item.title}
          </div>
        )}
        {item.browsable && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur">
            <ChevronIcon width={14} height={14} />
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-1 text-sm font-medium">{item.title}</p>
      {(item.subtitle || item.year) && (
        <p className="line-clamp-1 text-xs text-[var(--color-muted)]">
          {item.subtitle ?? item.year}
        </p>
      )}
    </button>
  );
}
