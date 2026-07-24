export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-16 text-center text-sm text-[var(--color-muted)]">{message}</p>;
}
