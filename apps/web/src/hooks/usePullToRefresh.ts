import { type RefObject, useEffect, useRef, useState } from 'react';

/** Finger travel (px) past which a release triggers a refresh. */
const THRESHOLD = 70;
/** Hard cap on how far the list rubber-bands down. */
const MAX_PULL = 120;
/** Resistance: the list follows the finger at this fraction (native feel). */
const DAMP = 0.5;

export interface PullState {
  /** Current pull offset in px (what to translate the list by). */
  pull: number;
  /** 0..1 toward the trigger threshold — drives the spinner reveal/rotation. */
  progress: number;
  /** A refresh is in flight (spinner spins, list held open). */
  refreshing: boolean;
  /** Finger is actively dragging — disable the snap transition while true. */
  dragging: boolean;
}

/**
 * Native-iOS-style pull to refresh for a scroll container. Engages only when
 * the container is already at the very top and the finger drags down, so normal
 * scrolling is untouched; past the threshold on release it runs `onRefresh` and
 * holds the spinner open until it settles. Touch-only (the gesture doesn't
 * exist with a mouse), and it reads live values through refs so the listeners
 * attach once, not on every frame.
 */
export function usePullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<unknown>,
  enabled = true,
): PullState {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  // Keep the latest onRefresh without re-attaching listeners each render, so
  // callers can pass an inline closure over live query state.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;

    const setPullValue = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || e.touches.length !== 1 || el.scrollTop > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]!.clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null || refreshingRef.current) return;
      const dy = e.touches[0]!.clientY - startY.current;
      // Cancel if scrolled off the top or the finger moved upward.
      if (dy <= 0 || el.scrollTop > 0) {
        if (pullRef.current !== 0) setPullValue(0);
        setDragging(false);
        startY.current = el.scrollTop > 0 ? null : startY.current;
        return;
      }
      // Hijack the gesture: no native rubber-band while we own the pull.
      e.preventDefault();
      setDragging(true);
      setPullValue(Math.min(MAX_PULL, dy * DAMP));
    };

    const onEnd = () => {
      if (startY.current === null) return;
      const triggered = pullRef.current >= THRESHOLD;
      startY.current = null;
      setDragging(false);
      if (!triggered) {
        setPullValue(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setPullValue(THRESHOLD); // hold the spinner open
      void Promise.resolve(onRefreshRef.current()).finally(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullValue(0);
      });
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [scrollRef, enabled]);

  return { pull, progress: Math.min(1, pull / THRESHOLD), refreshing, dragging };
}
