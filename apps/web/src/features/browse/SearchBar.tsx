import { SearchIcon } from '../../ui/icons.tsx';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5 ring-1 ring-[var(--color-border)] focus-within:ring-[var(--color-brand)]">
      <SearchIcon width={18} height={18} className="text-[var(--color-muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search all libraries"
        inputMode="search"
        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-sm text-[var(--color-muted)]">
          Clear
        </button>
      )}
    </label>
  );
}
