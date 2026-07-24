import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TitleMarqueeProps {
  text: string;
  className?: string;
  /** Fade zone width in px. */
  fade?: number;
}

const EDGE = 4; // px of overflow tolerance before scrolling kicks in
// GLOBAL phase clock: every marquee shares this fixed cycle, so all marquees
// on screen move, arrive and dwell in unison (each covers its own distance in
// the shared travel window). Unsynchronised marquees read as visual chaos.
const PAUSE_MS = 2000; // dwell at each end
const TRAVEL_MS = 6000; // one direction of travel
const TOTAL_MS = 2 * PAUSE_MS + 2 * TRAVEL_MS;

/**
 * Spotify-style title marquee: static unless the text overflows; scrolls
 * end-to-end and back with dwell pauses.
 *
 * Fades are a single full-width MASK whose edge alphas are driven every frame
 * from the text's actual transform — the approach is gap-proof by
 * construction (one mask function covers the whole box; there is no seam
 * between "fade element" and "clip edge" to mis-round), stays inside the
 * layout bounds (safe in grids), and works over any backdrop including
 * artwork. Each edge's alpha ramps in proportion to the pixels of text
 * hidden beyond it, so the fade is locked to the glyph motion.
 * Honors prefers-reduced-motion by staying static.
 */
export function TitleMarquee({ text, className, fade = 24 }: TitleMarqueeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animation: Animation | undefined;
    let raf = 0;
    let lastDistance = -1;

    const setAlphas = (fl: number, fr: number) => {
      outer.style.setProperty('--fl', fl.toFixed(3));
      outer.style.setProperty('--fr', fr.toFixed(3));
    };

    const stop = () => {
      animation?.cancel();
      animation = undefined;
      cancelAnimationFrame(raf);
      setAlphas(0, 0);
    };

    const start = () => {
      const raw = inner.scrollWidth - outer.clientWidth;
      // +1px slack: over-travel slightly so the tail fully clears the edge on
      // every DPR even when integer measurement under-counts.
      const distance = raw + 1;
      // Restart only on real geometry changes — the observer also fires for
      // sub-pixel churn while surrounding content loads.
      if (distance === lastDistance) return;
      lastDistance = distance;
      stop();
      if (raw <= EDGE) return;

      // Resting state before the first frame: text continues rightward.
      setAlphas(0, 1);

      const pause = PAUSE_MS / TOTAL_MS;
      const travel = TRAVEL_MS / TOTAL_MS;

      animation = inner.animate(
        [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: pause },
          { transform: `translateX(-${distance}px)`, offset: pause + travel },
          { transform: `translateX(-${distance}px)`, offset: pause + travel + pause },
          { transform: 'translateX(0)', offset: 1 },
        ],
        {
          duration: TOTAL_MS,
          iterations: Infinity,
          easing: 'linear',
          // Global phase baked in at creation: every marquee derives its
          // phase from the same clock, whenever it mounted.
          iterationStart: ((document.timeline.currentTime as number) % TOTAL_MS) / TOTAL_MS,
        },
      );

      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const tick = () => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(inner).transform);
        const tx = -matrix.m41; // 0 .. distance
        // Alpha follows the glyphs: n px of text hidden beyond an edge ⇒
        // n/fade of that edge's fade strength.
        setAlphas(clamp01(tx / fade), clamp01((distance - tx) / fade));
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
  }, [text, fade]);

  // Edge alphas are CSS vars the rAF loop drives; 1 - var flips "how much
  // text continues past this edge" into mask transparency at that edge.
  const mask = `linear-gradient(to right, rgba(0,0,0,calc(1 - var(--fl, 0))) 0, #000 ${fade}px, #000 calc(100% - ${fade}px), rgba(0,0,0,calc(1 - var(--fr, 0))) 100%)`;

  return (
    <div
      ref={outerRef}
      className={cn('overflow-hidden whitespace-nowrap', className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <span ref={innerRef} className="inline-block will-change-transform">
        {text}
      </span>
    </div>
  );
}
