import type { Player } from '../../domain/entities/Player.js';
import type { PlayerDirectory } from '../../domain/ports/PlayerDirectory.js';

/** Lists every controllable player currently visible to the account. */
export class DiscoverPlayers {
  constructor(private readonly directory: PlayerDirectory) {}

  execute(): Promise<Player[]> {
    return this.directory.listPlayers();
  }
}
