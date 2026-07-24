import { usePlayers, usePlaybackState, usePlayerCommands } from '../api/queries.ts';
import { usePlayerStore } from '../state/usePlayerStore.ts';
import type { PlayerDto, PlaybackStateDto } from '../api/types.ts';

export interface ActivePlayer {
  player: PlayerDto | undefined;
  clientId: string | undefined;
  state: PlaybackStateDto | undefined;
  commands: ReturnType<typeof usePlayerCommands>;
  isReady: boolean;
}

/**
 * Composes the persisted selection, the players query and the live playback
 * state into one cohesive hook. Components consume this instead of wiring the
 * three sources themselves — composition over inheritance, one seam to test.
 */
export function useActivePlayer(): ActivePlayer {
  const { activeClientId } = usePlayerStore();
  const { data: players } = usePlayers();
  const { data: state } = usePlaybackState(activeClientId);
  const commands = usePlayerCommands(activeClientId);
  const player = players?.find((p) => p.clientId === activeClientId);

  return {
    player,
    clientId: activeClientId,
    state,
    commands,
    isReady: Boolean(activeClientId && player),
  };
}
