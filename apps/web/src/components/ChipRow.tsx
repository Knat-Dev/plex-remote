interface Chip {
  id: string;
  label: string;
}

interface ChipRowProps {
  chips: Chip[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

/** Horizontally scrollable single-select pill row (servers, libraries). */
export function ChipRow({ chips, activeId, onSelect }: ChipRowProps) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            onClick={() => onSelect(chip.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? 'bg-[var(--color-brand)] text-black'
                : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] ring-1 ring-[var(--color-border)]'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
