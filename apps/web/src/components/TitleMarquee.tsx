import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TitleMarqueeProps {
  text: string;
  className?: string;
  /** Fade zone width in px. Bleeds this far into surrounding space mid-scroll. */
  fade?: number;
}

const EDGE = 4; // px of overflow tolerance before scrolling kicks in
const SPEED = 18; // px/s scroll speed — slow, Spotify-like glide
const PAUSE_MS = 2000; // dwell at each end

/**
 * Spotify-style title marquee. The mask gradient is STATIC — the text is
 * inset by the fade width (padding) while the box extends beyond its layout
 * bounds by the same amount (negative margin), so the fade zones sit over
 * empty strips at rest and the glyphs dissolve exactly as they travel through
 * them during the scroll. Only the text moves; the fades cannot pop because
 * they never change. Honors prefers-reduced-motion by staying static.
 */
export function TitleMarquee({ text, className, fade = 12 }: TitleMarqueeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animation: Animation | undefined;

    const stop = () => {
      animation?.cancel();
      animation = undefined;
    };

    const start = () => {
      stop();
      // Usable text area = content box (outer minus the two fade paddings).
      const distance = inner.scrollWidth - (outer.clientWidth - 2 * fade);
      if (distance <= EDGE) return;

      const travelMs = (distance / SPEED) * 1000;
      const total = travelMs * 2 + PAUSE_MS * 2;
      const pauseFrac = PAUSE_MS / total;
      const travelFrac = travelMs / total;

      animation = inner.animate(
        [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: pauseFrac },
          { transform: `translateX(-${distance}px)`, offset: pauseFrac + travelFrac },
          { transform: `translateX(-${distance}px)`, offset: pauseFrac + travelFrac + pauseFrac },
          { transform: 'translateX(0)', offset: 1 },
        ],
        { duration: total, iterations: Infinity, easing: 'linear' },
      );
    };

    start();
    const observer = new ResizeObserver(start);
    observer.observe(outer);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [text, fade]);

  // Static mask: transparent over the two padding strips, opaque between.
  // The negative margin lets those strips live OUTSIDE the layout bounds, so
  // the resting text keeps its full width and normal alignment.
  const mask = `linear-gradient(to right, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`;

  return (
    <div
      ref={outerRef}
      className={cn('overflow-hidden whitespace-nowrap', className)}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        paddingInline: fade,
        marginInline: -fade,
      }}
    >
      <span ref={innerRef} className="inline-block will-change-transform">
        {text}
      </span>
    </div>
  );
}
