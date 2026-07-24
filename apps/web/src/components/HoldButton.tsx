import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

interface HoldButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Fires once on tap, then repeatedly while held. */
  onTrigger: () => void;
  /** Delay before auto-repeat begins (ms). */
  holdDelayMs?: number;
  /** Interval between repeats once repeating (ms). */
  repeatMs?: number;
}

/**
 * A button that fires once immediately on press and then auto-repeats while
 * held — for D-pad arrows and seek steps, where holding should keep moving.
 * Uses pointer events (works for touch, mouse and pen), and suppresses the
 * long-press context menu / iOS callout so a hold never interrupts with a
 * menu. Release, leave, or cancel stops the repeat.
 */
export function HoldButton({
  onTrigger,
  holdDelayMs = 400,
  repeatMs = 120,
  onContextMenu,
  ...rest
}: HoldButtonProps) {
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;

  const clear = useCallback(() => {
    clearTimeout(delayRef.current);
    clearInterval(intervalRef.current);
    delayRef.current = undefined;
    intervalRef.current = undefined;
  }, []);

  const begin = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Ignore secondary/right buttons; capture so we still get pointerup even
      // if the finger drifts off the button.
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      triggerRef.current();
      delayRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => triggerRef.current(), repeatMs);
      }, holdDelayMs);
    },
    [holdDelayMs, repeatMs],
  );

  useEffect(() => clear, [clear]);

  return (
    <Button
      {...rest}
      onPointerDown={begin}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', ...rest.style }}
    />
  );
}
