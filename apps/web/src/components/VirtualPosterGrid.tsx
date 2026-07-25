import { useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import type { MediaItemDto } from '../api/types.ts';
import { MediaCard } from './MediaCard.tsx';
import { usePullToRefresh } from '../hooks/usePullToRefresh.ts';
import { cn } from '@/lib/utils';

interface VirtualPosterGridProps {
  items: MediaItemDto[];
  /** Render skeleton cells in the exact same layout instead of items. */
  loading?: boolean;
  /** Enables native-style pull-to-refresh; resolves when the refetch settles. */
  onRefresh?: () => Promise<unknown>;
  onOpen: (item: MediaItemDto) => void;
  onLongPress: (item: MediaItemDto) => void;
}

const GAP = 12;
// Exact MediaCard text block: mt-1.5 (6) + title h-5 (20) + subtitle h-4 (16).
const TEXT_BLOCK = 42;
const SKELETON_COUNT = 12;

/**
 * Row-virtualized poster grid (TanStack Virtual): only visible rows mount, so a
 * 5000-item library scrolls like a 20-item one. It also renders its OWN loading
 * skeleton (same container, measurement, columns, gap and row height), so the
 * grid element never unmounts between loading and loaded — the swap is
 * pixel-identical with no reflow, remeasure flash or column jump.
 */
export function VirtualPosterGrid({
  items,
  loading,
  onRefresh,
  onOpen,
  onLongPress,
}: VirtualPosterGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const noop = useRef(() => Promise.resolve()).current;
  const { pull, progress, refreshing, dragging } = usePullToRefresh(
    scrollRef,
    onRefresh ?? noop,
    Boolean(onRefresh),
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Measure the content width (inside the container's own px-4) SYNCHRONOUSLY
    // before first paint — the ResizeObserver's first callback lands after
    // paint, so without this the grid shows one empty (black) frame.
    const measure = () => {
      const cs = getComputedStyle(el);
      setWidth(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = width >= 560 ? 4 : 3;
  const cardWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;
  const rowHeight = cardWidth * 1.5 + TEXT_BLOCK + GAP;
  const count = loading ? SKELETON_COUNT : items.length;
  const rowCount = Math.ceil(count / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight || 300,
    overscan: 3,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  return (
    <div
      ref={scrollRef}
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 [scrollbar-gutter:stable]"
    >
      {(pull > 0 || refreshing) && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
          style={{
            transform: `translateY(${Math.max(0, pull - 26)}px)`,
            transition: dragging ? 'none' : 'transform 0.25s ease-out',
            opacity: refreshing ? 1 : progress,
          }}
        >
          <Loader2
            className={cn('size-5 text-muted-foreground', refreshing && 'animate-spin')}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </div>
      )}
      {width > 0 && (
        <div
          className="relative w-full"
          style={{
            height: virtualizer.getTotalSize(),
            transform: pull > 0 ? `translateY(${pull}px)` : undefined,
            transition: dragging ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          {virtualizer.getVirtualItems().map((row) => (
            <div
              key={row.key}
              className="absolute left-0 top-0 grid w-full"
              style={{
                transform: `translateY(${row.start}px)`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: GAP,
              }}
            >
              {Array.from({ length: columns }).map((_, col) => {
                const index = row.index * columns + col;
                if (index >= count) return null;
                if (loading) return <SkeletonCard key={col} />;
                const item = items[index];
                return item ? (
                  <MediaCard
                    key={item.ratingKey}
                    item={item}
                    onOpen={onOpen}
                    onLongPress={onLongPress}
                  />
                ) : null;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A skeleton cell with byte-identical geometry to a MediaCard: the poster box
 * mirrors MediaCard's exactly (aspect, radius, bg-secondary AND the ring-1
 * ring-border — the ring is an outset 1px shadow that widens the poster's
 * visible extent, so omitting it made skeletons read ~2px narrower). The two
 * text lines occupy the same 20px + 16px under a 6px top margin.
 */
function SkeletonCard() {
  return (
    <div className="flex flex-col">
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
        <div className="absolute inset-0 animate-pulse bg-accent" />
      </div>
      <div className="mt-1.5 flex h-5 items-center">
        <div className="h-3 w-4/5 animate-pulse rounded bg-accent" />
      </div>
      <div className="flex h-4 items-center">
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-accent" />
      </div>
    </div>
  );
}
