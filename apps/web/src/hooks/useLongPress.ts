import { useRef } from 'react';
import { haptic } from '../lib/haptics.ts';

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Distinguishes a tap from a long-press with the platform's own gesture rules:
 * a press that lasts past `delayMs` (and hasn't drifted) fires `onLongPress`
 * and suppresses the following tap; a quick release fires `onTap`. The native
 * context menu / iOS callout is always prevented so a long-press opens OUR
 * sheet, never the browser's.
 */
export function useLongPress(
  onTap: () => void,
  onLongPress: () => void,
  delayMs = 450,
): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firedLong = useRef(false);
  const moved = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    start.current = null;
  };

  return {
    onPointerDown: (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      firedLong.current = false;
      moved.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        firedLong.current = true;
        haptic(); // Android/Chromium buzz on recognise; no-op on iOS.
        onLongPress();
      }, delayMs);
    },
    onPointerMove: (e) => {
      if (!start.current) return;
      const dist = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
      // A drag (scroll, pull-to-refresh, swipe) is not a tap or a long-press.
      // Mark it moved so pointerup can't fire onTap — during pull-to-refresh we
      // preventDefault the scroll, so the browser never sends pointercancel and
      // this is the only thing stopping a pull from casting the poster.
      if (dist > 10) {
        moved.current = true;
        clear();
      }
    },
    onPointerUp: () => {
      const wasLong = firedLong.current;
      const didMove = moved.current;
      clear();
      if (!wasLong && !didMove) onTap();
    },
    onPointerCancel: () => {
      moved.current = true;
      clear();
    },
    onContextMenu: (e) => e.preventDefault(),
  };
}
