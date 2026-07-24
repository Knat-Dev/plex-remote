import type { MediaType } from '../../domain/entities/MediaItem.js';
import type { MediaKind, PlayerController } from '../../domain/ports/PlayerController.js';
import type { ResolvePlayer } from './ResolvePlayer.js';

export interface CastCommand {
  readonly clientId: string;
  readonly serverId: string;
  readonly ratingKey: string;
  readonly mediaType: MediaType;
}

/** Starts playback of a library item on a chosen player. */
export class CastMedia {
  constructor(
    private readonly resolvePlayer: ResolvePlayer,
    private readonly controller: PlayerController,
  ) {}

  async execute(command: CastCommand): Promise<void> {
    const player = await this.resolvePlayer.execute(command.clientId);
    await this.controller.cast(player, {
      serverId: command.serverId,
      ratingKey: command.ratingKey,
      kind: kindOf(command.mediaType),
    });
  }
}

function kindOf(type: MediaType): MediaKind {
  if (type === 'artist' || type === 'album' || type === 'track') return 'audio';
  return 'video';
}
