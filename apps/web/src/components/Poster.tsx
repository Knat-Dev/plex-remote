import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PosterProps {
  src: string | null;
  /** Fallback text when there's no image. */
  fallback: string;
  /** Poster overlays (badges, progress pill) — fade in together with the image. */
  children?: ReactNode;
}

/**
 * URLs already painted this session. The virtualized grid unmounts and remounts
 * rows as they scroll in and out, so without this every re-mount would replay
 * the fade even though the bytes are HTTP-cached. Once a poster has faded in,
 * later mounts of the same URL render it instantly.
 */
const shown = new Set<string>();

/**
 * Poster with a clean first-load crossfade and instant re-display: a shimmering
 * skeleton fades OUT as the decoded image — and its overlays — fade IN together
 * the first time a URL is seen; any later mount of that URL shows it instantly
 * (no skeleton, no fade). `decode()` reveals only once pixels are paintable.
 * Robust to cached images that fire `load` before React attaches the handler.
 */
export function Poster({ src, fallback, children }: PosterProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => Boolean(src && shown.has(src)));

  useEffect(() => {
    if (!src) return;
    if (shown.has(src)) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const img = ref.current;
    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      shown.add(src);
      setLoaded(true);
    };
    if (img && img.complete && img.naturalWidth > 0) {
      img.decode().then(reveal).catch(reveal);
    }
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return (
      <>
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
          {fallback}
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      {/* Skeleton fades OUT (crossfade), never a hard unmount. */}
      <div
        className={cn(
          'absolute inset-0 bg-accent transition-opacity duration-500 ease-out',
          loaded ? 'opacity-0' : 'animate-pulse opacity-100',
        )}
      />
      {/* Image + overlays share one fading layer, so they appear in lockstep. */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500 ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      >
        <img
          ref={ref}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            const img = e.currentTarget;
            const reveal = () => {
              shown.add(src);
              setLoaded(true);
            };
            img.decode().then(reveal).catch(reveal);
          }}
          className="h-full w-full object-cover"
        />
        {children}
      </div>
    </>
  );
}
