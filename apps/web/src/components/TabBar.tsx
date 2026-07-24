import type { ReactNode } from 'react';
import { cx } from '../ui/atoms.tsx';
import { GridIcon, RemoteIcon, TvIcon } from '../ui/icons.tsx';

export type TabId = 'browse' | 'remote' | 'players';

const TABS: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'browse', label: 'Browse', icon: <GridIcon width={22} height={22} /> },
  { id: 'remote', label: 'Remote', icon: <RemoteIcon width={22} height={22} /> },
  { id: 'players', label: 'Players', icon: <TvIcon width={22} height={22} /> },
];

interface TabBarProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition',
              active === tab.id ? 'text-[var(--color-brand)]' : 'text-[var(--color-muted)]',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
