import { usePlayers } from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import { EmptyState, Spinner } from '../../ui/Spinner.tsx';
import { TvIcon } from '../../ui/icons.tsx';

interface PlayersScreenProps {
  onSelected: () => void;
}

export function PlayersScreen({ onSelected }: PlayersScreenProps) {
  const { data: players, isLoading } = usePlayers();
  const { activeClientId, setActivePlayer } = usePlayerStore();

  if (isLoading) return <Spinner label="Finding players…" />;
  if (!players || players.length === 0) {
    return <EmptyState message="No players found on your network." />;
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <p className="text-sm text-[var(--color-muted)]">
        Choose which player to control. Only players on your network appear here.
      </p>
      {players.map((player) => {
        const active = player.clientId === activeClientId;
        return (
          <button
            key={player.clientId}
            onClick={() => {
              setActivePlayer(player.clientId);
              onSelected();
            }}
            className={`flex items-center gap-3 rounded-2xl p-4 text-left ring-1 transition active:scale-[0.99] ${
              active
                ? 'bg-[var(--color-brand)]/10 ring-[var(--color-brand)]'
                : 'bg-[var(--color-surface)] ring-[var(--color-border)]'
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                active ? 'bg-[var(--color-brand)] text-black' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
              }`}
            >
              <TvIcon width={22} height={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{player.name}</p>
              <p className="truncate text-sm text-[var(--color-muted)]">{player.product}</p>
            </div>
            {active && <span className="text-sm font-medium text-[var(--color-brand)]">Active</span>}
          </button>
        );
      })}
    </div>
  );
}
