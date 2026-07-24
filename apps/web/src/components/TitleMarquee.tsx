import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TitleMarqueeProps {
  text: string;
  className?: string;
  /** Fade zone width in px. */
  fade?: number;
  /**
   * 'overlay' (default): fades are gradient overlays INSIDE the box — the
   * marquee never renders outside its layout bounds (required in grids).
   * Overlay opacities are animated on the SAME timeline as the text, ramping
   * exactly while the glyphs traverse the fade zone. Needs a solid surface
   * color behind the text (`fadeFrom`).
   * 'bleed': static mask with the box widened by the fade width — for
   * surfaces where overlays can't match the backdrop (artwork). Only use
   * where the surrounding layout tolerates the bleed.
   */
  variant?: 'overlay' | 'bleed';
  /** Tailwind gradient-from class matching the surface (overlay variant). */
  fadeFrom?: string;
}

const EDGE = 4; // px of overflow tolerance before scrolling kicks in
const SPEED = 18; // px/s scroll speed — slow, Spotify-like glide
const PAUSE_MS = 2000; // dwell at each end

/**
 * Spotify-style title marquee: static unless the text overflows; scrolls
 * end-to-end and back with dwell pauses; each edge fades only while text
 * continues past it, in perfect sync with the glyph motion (all animations
 * share one WAAPI start time). Honors prefers-reduced-motion.
 */
export function TitleMarquee({
  text,
  className,
  fade = 12,
  variant = 'overlay',
  fadeFrom = 'from-background',
}: TitleMarqueeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animations: Animation[] = [];

    const stop = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (right) right.style.opacity = '0';
      if (left) left.style.opacity = '0';
    };

    const start = () => {
      stop();
      const usable = variant === 'bleed' ? outer.clientWidth - 2 * fade : outer.clientWidth;
      const distance = inner.scrollWidth - usable;
      const overflowing = distance > EDGE;

      // Static resting state: only the right fade, and only when clipped.
      if (right) right.style.opacity = overflowing && variant === 'overlay' ? '1' : '0';
      if (!overflowing) return;

      const travelMs = (distance / SPEED) * 1000;
      const total = travelMs * 2 + PAUSE_MS * 2;
      const pause = PAUSE_MS / total;
      const travel = travelMs / total;
      // Fraction of the timeline the glyphs spend crossing one fade zone.
      const ramp = travel * Math.min(1, fade / distance);

      const options: KeyframeAnimationOptions = {
        duration: total,
        iterations: Infinity,
        easing: 'linear',
      };

      animations.push(
        inner.animate(
          [
            { transform: 'translateX(0)', offset: 0 },
            { transform: 'translateX(0)', offset: pause },
            { transform: `translateX(-${distance}px)`, offset: pause + travel },
            { transform: `translateX(-${distance}px)`, offset: pause + travel + pause },
            { transform: 'translateX(0)', offset: 1 },
          ],
          options,
        ),
      );

      if (variant === 'overlay' && left && right) {
        // Left fade: appears while the first glyphs leave (first `fade` px of
        // travel), stays through the far dwell, dissolves as they return.
        animations.push(
          left.animate(
            [
              { opacity: 0, offset: 0 },
              { opacity: 0, offset: pause },
              { opacity: 1, offset: pause + ramp },
              { opacity: 1, offset: 1 - ramp },
              { opacity: 0, offset: 1 },
            ],
            options,
          ),
        );
        // Right fade: on while text continues past the right edge; releases
        // exactly as the tail crosses the zone, returns symmetrically.
        animations.push(
          right.animate(
            [
              { opacity: 1, offset: 0 },
              { opacity: 1, offset: pause + travel - ramp },
              { opacity: 0, offset: pause + travel },
              { opacity: 0, offset: pause + travel + pause },
              { opacity: 1, offset: pause + travel + pause + ramp },
              { opacity: 1, offset: 1 },
            ],
            options,
          ),
        );
      }

      // Lock every animation to one clock so the fades can never drift from
      // the glyph motion.
      const startTime = document.timeline.currentTime;
      animations.forEach((a) => {
        a.startTime = startTime;
      });
    };

    start();
    const observer = new ResizeObserver(start);
    observer.observe(outer);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [text, fade, variant]);

  const mask =
    variant === 'bleed'
      ? `linear-gradient(to right, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
      : undefined;

  return (
    <div
      ref={outerRef}
      className={cn('relative overflow-hidden whitespace-nowrap', className)}
      style={
        variant === 'bleed'
          ? { maskImage: mask, WebkitMaskImage: mask, paddingInline: fade, marginInline: -fade }
          : undefined
      }
    >
      <span ref={innerRef} className="inline-block will-change-transform">
        {text}
      </span>
      {variant === 'overlay' && (
        <>
          {/* Overlays overshoot the box by 2px and get cut by the container's
              own clip — fractional grid widths otherwise pixel-snap the
              overlay a hair inside the clip edge, leaving a bare column where
              moving glyphs flicker through. */}
          <span
            ref={leftRef}
            aria-hidden
            style={{ width: fade + 2, left: -2, opacity: 0 }}
            className={cn(
              'pointer-events-none absolute inset-y-0 bg-gradient-to-r to-transparent',
              fadeFrom,
            )}
          />
          <span
            ref={rightRef}
            aria-hidden
            style={{ width: fade + 2, right: -2, opacity: 0 }}
            className={cn(
              'pointer-events-none absolute inset-y-0 bg-gradient-to-l to-transparent',
              fadeFrom,
            )}
          />
        </>
      )}
    </div>
  );
}
