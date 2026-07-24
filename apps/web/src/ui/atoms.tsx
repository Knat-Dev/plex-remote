import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Atomic building blocks (shadcn-style: own-your-components + variant maps),
 * but Radix-free because this is a touch remote, not a form-heavy desktop app.
 * Everything higher-level composes these, so the visual language (radius,
 * surface, ring, brand, motion) lives in exactly one place.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const cx = (...parts: Array<string | false | undefined>): string =>
  parts.filter(Boolean).join(' ');

export type Variant = 'brand' | 'surface' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  brand: 'bg-[var(--color-brand)] text-black',
  surface: 'bg-[var(--color-surface-2)] text-[var(--color-text)] ring-1 ring-[var(--color-border)]',
  ghost: 'text-[var(--color-muted)]',
};

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-2xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]', className)}>
      {children}
    </div>
  );
}

export function Button({
  variant = 'surface',
  className,
  children,
  ...rest
}: ButtonProps & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  variant = 'surface',
  size = 44,
  className,
  children,
  ...rest
}: ButtonProps & { variant?: Variant; size?: number }) {
  return (
    <button
      {...rest}
      style={{ width: size, height: size }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-[var(--color-surface-2)] p-1 ring-1 ring-[var(--color-border)]">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cx(
            'flex-1 rounded-full py-2 text-sm font-medium capitalize transition',
            option === value ? 'bg-[var(--color-brand)] text-black' : 'text-[var(--color-muted)]',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
