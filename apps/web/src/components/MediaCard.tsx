import { Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TitleMarquee } from './TitleMarquee.tsx';
import type { MediaItemDto } from '../api/types.ts';

interface MediaCardProps {
  item: MediaItemDto;
  onOpen: (item: MediaItemDto) => void;
}

/**
 * A poster tile with Plex-style watch state: an in-progress strip along the
 * poster's bottom edge, a check for fully watched items, and the remaining
 * episode count on containers. Browsable items show a chevron.
 */
export function MediaCard({ item, onOpen }: MediaCardProps) {
  const progress =
    item.progressMs && item.durationMs ? (item.progressMs / item.durationMs) * 100 : 0;

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

        {item.watched ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary p-1 text-primary-foreground shadow">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : item.unwatchedCount != null ? (
          <Badge className="absolute left-1.5 top-1.5 h-5 min-w-5 justify-center px-1.5 text-[10px] shadow">
            {item.unwatchedCount}
          </Badge>
        ) : null}

        {progress > 0 && (
          <Progress
            value={progress}
            className="absolute inset-x-0 bottom-0 h-1 rounded-none bg-black/50"
          />
        )}
      </div>
      <TitleMarquee
        text={item.showTitle ?? item.title}
        className="mt-1.5 w-full text-sm font-medium"
      />
      {(item.showTitle ? item.subtitle : item.subtitle || item.year) && (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {item.showTitle ? item.subtitle : (item.subtitle ?? item.year)}
        </p>
      )}
    </button>
  );
}
