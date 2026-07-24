import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TitleMarqueeProps {
  text: string;
  className?: string;
}

const EDGE = 2; // px of tolerance before a side counts as overflowing
const SPEED = 18; // px/s scroll speed — slow, Spotify-like glide
const PAUSE_MS = 2000; // dwell at each end

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
      outer.style.setProperty('--fade-l', '0');
      outer.style.setProperty('--fade-r', '0');
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
        outer.style.setProperty('--fade-l', tx > EDGE ? '1' : '0');
        outer.style.setProperty('--fade-r', tx < distance - EDGE ? '1' : '0');
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

  // Mask-based fades work over any backdrop (solid, blurred artwork, …):
  // an edge is transparent only while its --fade-* var says text continues
  // past it. Vars are set imperatively in the rAF loop above.
  const mask =
    'linear-gradient(to right, rgba(0,0,0,calc(1 - var(--fade-l, 0))) 0, #000 1.5rem, #000 calc(100% - 1.5rem), rgba(0,0,0,calc(1 - var(--fade-r, 0))) 100%)';

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
