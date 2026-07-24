import type { Player } from '../../domain/entities/Player.js';
import type { PlayerDirectory } from '../../domain/ports/PlayerDirectory.js';
import { NotFoundError } from '../../shared/errors.js';

/**
 * Shared collaborator: turns a clientId into a Player or throws NotFound.
 * Keeps every player-targeting use case free of lookup duplication (DRY/SRP).
 */
export class ResolvePlayer {
  constructor(private readonly directory: PlayerDirectory) {}

  async execute(clientId: string): Promise<Player> {
    const player = await this.directory.findPlayer(clientId);
    if (!player) throw new NotFoundError(`Player ${clientId}`);
    return player;
  }
}
