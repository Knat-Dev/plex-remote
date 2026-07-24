import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TitleMarqueeProps {
  text: string;
  className?: string;
}

const EDGE = 2; // px of tolerance before a side counts as overflowing
const SPEED = 18; // px/s scroll speed — slow, Spotify-like glide
const PAUSE_MS = 2000; // dwell at each end
const FADE_RAMP = 24; // px of travel over which an edge fade ramps in/out

/**
 * Spotify-style title marquee: static (truncated) unless the text actually
 * overflows; when it does, it slowly scrolls end-to-end and back with dwell
 * pauses, and each edge shows a fade ONLY while more text continues past it.
 * Driven by the Web Animations API with the fade opacities updated outside
 * React (CSS variables via rAF) so there is zero re-render churn. Honors
 * prefers-reduced-motion by staying static.
 */
export function TitleMarquee({ text, className }: TitleMarqueeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animation: Animation | undefined;
    let raf = 0;

    const stop = () => {
      animation?.cancel();
      animation = undefined;
      cancelAnimationFrame(raf);
      outer.style.setProperty('--fade-l-w', '0px');
      outer.style.setProperty('--fade-r-w', '0px');
      inner.style.transform = '';
    };

    const start = () => {
      stop();
      const distance = inner.scrollWidth - outer.clientWidth;
      if (distance <= EDGE * 2) return;

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

      const tick = () => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(inner).transform);
        const tx = -matrix.m41; // 0 .. distance
        // The fade WIDTH is bound to the text edge itself: n px of text past
        // an edge ⇒ exactly n px of fade there (capped at FADE_RAMP). The
        // gradient grows/shrinks in lockstep with the glyphs crossing it —
        // nothing ever switches, so nothing can pop.
        const clamp = (v: number) => Math.min(FADE_RAMP, Math.max(0, v));
        outer.style.setProperty('--fade-l-w', `${clamp(tx).toFixed(1)}px`);
        outer.style.setProperty('--fade-r-w', `${clamp(distance - tx).toFixed(1)}px`);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    start();
    const observer = new ResizeObserver(start);
    observer.observe(outer);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [text]);

  // Mask-based fades work over any backdrop (solid, blurred artwork, …).
  // The gradient stops are the fade WIDTH variables the rAF loop drives, so
  // each fade's extent tracks the text edge exactly; width 0 = no fade.
  const mask =
    'linear-gradient(to right, transparent 0, #000 var(--fade-l-w, 0px), #000 calc(100% - var(--fade-r-w, 0px)), transparent 100%)';

  return (
    <div
      ref={outerRef}
      className={cn('relative overflow-hidden whitespace-nowrap', className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <span ref={innerRef} className="inline-block will-change-transform">
        {text}
      </span>
    </div>
  );
}
