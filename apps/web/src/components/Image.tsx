import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * URLs already painted this session. Virtualized lists unmount/remount rows as
 * they scroll, so without this every re-mount would replay the fade even though
 * the bytes are HTTP-cached. Once an image has faded in, later mounts of the
 * same URL render it instantly.
 */
const shown = new Set<string>();

interface ImageProps {
  src: string | null | undefined;
  alt?: string;
  /** Wrapper classes — size, aspect, rounding, ring. Establishes the box. */
  className?: string;
  /** object-fit for the image; defaults to cover. */
  fit?: 'cover' | 'contain';
  /** Rendered (centred) when there is no src — an icon or short text. */
  fallback?: ReactNode;
  /** Overlays (badges, pills) that fade in together with the image. */
  children?: ReactNode;
}

/**
 * The one image primitive in the app: a clean first-load crossfade (a shimmering
 * skeleton fades out as the decoded image fades in) and instant re-display on
 * any later mount of the same URL. `decode()` reveals only once pixels are
 * paintable, and it's robust to cached images that fire `load` before React
 * attaches the handler. Use it for every remote image — posters, avatars,
 * thumbnails — so they all behave identically.
 */
export function Image({ src, alt = '', className, fit = 'cover', fallback, children }: ImageProps) {
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

  return (
    <span className={cn('relative block overflow-hidden', className)}>
      {!src ? (
        <>
          {fallback != null && (
            <span className="absolute inset-0 flex items-center justify-center text-center">
              {fallback}
            </span>
          )}
          {children}
        </>
      ) : (
        <>
          {/* Skeleton fades OUT (crossfade), never a hard unmount. */}
          <span
            className={cn(
              'absolute inset-0 bg-accent transition-opacity duration-500 ease-out',
              loaded ? 'opacity-0' : 'animate-pulse opacity-100',
            )}
          />
          {/* Image + overlays share one fading layer, so they appear in lockstep. */}
          <span
            className={cn(
              'absolute inset-0 block transition-opacity duration-500 ease-out',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
          >
            <img
              ref={ref}
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={() => {
                shown.add(src);
                setLoaded(true);
              }}
              className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover')}
            />
            {children}
          </span>
        </>
      )}
    </span>
  );
}
