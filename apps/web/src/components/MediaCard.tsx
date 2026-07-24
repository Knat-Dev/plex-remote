import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TitleMarquee } from './TitleMarquee.tsx';
import { useLongPress } from '../hooks/useLongPress.ts';
import type { MediaItemDto } from '../api/types.ts';

interface MediaCardProps {
  item: MediaItemDto;
  onOpen: (item: MediaItemDto) => void;
  onLongPress: (item: MediaItemDto) => void;
}

/**
 * A poster tile with Plex-style watch state: an inset rounded progress pill
 * near the poster's bottom for in-progress items, a check for fully watched,
 * and the remaining-episode count on containers. Heading shows the show title
 * for episodes (Continue Watching), the item title otherwise; the line below
 * is "S2 · E1" for episodes and the year for movies.
 */
export function MediaCard({ item, onOpen, onLongPress }: MediaCardProps) {
  const progress =
    item.progressMs && item.durationMs ? (item.progressMs / item.durationMs) * 100 : 0;

  const heading = item.showTitle ?? item.title;
  const line = item.subtitle ?? (item.year != null ? String(item.year) : null);
  const press = useLongPress(() => onOpen(item), () => onLongPress(item));
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      {...press}
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none' }}
      className="group flex cursor-pointer flex-col text-left focus:outline-none"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-secondary ring-1 ring-border transition group-active:scale-[0.97]">
        {item.thumbUrl ? (
          <>
            {/* Skeleton shimmer until the poster paints, then fade it in. */}
            {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
            <img
              src={item.thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-500',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {heading}
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

        {/* Inset rounded progress pill with a track, Plex-style. */}
        {progress > 0 && (
          <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-black/55 backdrop-blur-sm">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <TitleMarquee text={heading} className="mt-1.5 w-full text-sm font-medium" />
      {line && <p className="line-clamp-1 text-xs text-muted-foreground">{line}</p>}
    </div>
  );
}
