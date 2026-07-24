import type { Player } from '../entities/Player.js';

/**
 * Discovers controllable players across every reachable server / plex.tv.
 */
export interface PlayerDirectory {
  listPlayers(): Promise<Player[]>;
  findPlayer(clientId: string): Promise<Player | undefined>;
}
