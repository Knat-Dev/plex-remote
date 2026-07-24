import { useNavigate } from '@tanstack/react-router';
import { Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePlayers } from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';

export function PlayersScreen() {
  const navigate = useNavigate();
  const onSelected = () => void navigate({ to: '/remote' });
  const { data: players, isLoading } = usePlayers();
  const { activeClientId, setActivePlayer } = usePlayerStore();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!players || players.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No players found on your network.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <p className="text-sm text-muted-foreground">
        Choose which player to control. Only players on your network appear here.
      </p>
      {players.map((player) => {
        const active = player.clientId === activeClientId;
        return (
          <Card
            key={player.clientId}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActivePlayer(player.clientId);
              onSelected();
            }}
            className={cn(
              'flex-row items-center gap-3 p-4 transition active:scale-[0.99]',
              active && 'bg-primary/10 ring-1 ring-primary',
            )}
          >
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
              )}
            >
              <Tv className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{player.name}</p>
              <p className="truncate text-sm text-muted-foreground">{player.product}</p>
            </div>
            {active && <Badge>Active</Badge>}
          </Card>
        );
      })}
    </div>
  );
}
