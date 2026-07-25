import { useEffect } from 'react';
import { usePlayers } from '../api/queries.ts';
import { usePlayerStore } from '../state/usePlayerStore.ts';

/**
 * Auto-connects to a player so the app is controllable the moment it opens —
 * no trip to the Players tab required. Picks a target only when there is no
 * valid selection: the persisted choice wins if it is still present, otherwise
 * the first available (playable-preferred) player. A deliberate selection is
 * never overridden, and because the server keeps a stable presence list
 * (bridging Plex's flaky `/clients`), this does not flap players in and out.
 */
export function useAutoSelectPlayer(): void {
  const { data: players } = usePlayers();
  const activeClientId = usePlayerStore((s) => s.activeClientId);
  const setActivePlayer = usePlayerStore((s) => s.setActivePlayer);

  useEffect(() => {
    if (!players || players.length === 0) return;
    const stillValid = players.some((p) => p.clientId === activeClientId);
    if (stillValid) return;
    const target = players.find((p) => p.canPlay) ?? players[0];
    if (target) setActivePlayer(target.clientId);
  }, [players, activeClientId, setActivePlayer]);
}
