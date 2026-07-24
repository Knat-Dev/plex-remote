import { useRef } from 'react';

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
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        firedLong.current = true;
        onLongPress();
      }, delayMs);
    },
    onPointerMove: (e) => {
      if (!start.current) return;
      const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
      if (moved > 10) clear(); // scrolling / dragging cancels the press
    },
    onPointerUp: () => {
      const wasLong = firedLong.current;
      clear();
      if (!wasLong) onTap();
    },
    onPointerCancel: clear,
    onContextMenu: (e) => e.preventDefault(),
  };
}
