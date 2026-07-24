import { useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MediaItemDto } from '../api/types.ts';
import { MediaCard } from './MediaCard.tsx';

interface VirtualPosterGridProps {
  items: MediaItemDto[];
  onOpen: (item: MediaItemDto) => void;
}

const GAP = 12;
const TEXT_BLOCK = 44; // title + subtitle under the poster

/**
 * Row-virtualized poster grid (TanStack Virtual): only the visible rows are
 * mounted, so a 5000-item library scrolls like a 20-item one. The component
 * owns its scroll container; columns adapt to the measured width.
 */
export function VirtualPosterGrid({ items, onOpen }: VirtualPosterGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = width >= 560 ? 4 : 3;
  const cardWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;
  const rowHeight = cardWidth * 1.5 + TEXT_BLOCK + GAP;
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight || 300,
    overscan: 3,
  });

  // Re-measure when the container resizes (row height depends on card width).
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {width > 0 && (
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
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
              {items
                .slice(row.index * columns, row.index * columns + columns)
                .map((item) => (
                  <MediaCard key={item.ratingKey} item={item} onOpen={onOpen} />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
