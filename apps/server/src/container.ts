import type { Environment } from './config/environment.js';
import { TokenProvider } from './config/TokenProvider.js';
import { PlexHttpClient } from './infrastructure/plex/PlexHttpClient.js';
import { ConnectionResolver } from './infrastructure/plex/ConnectionResolver.js';
import { ServerRegistry } from './infrastructure/plex/ServerRegistry.js';
import { RelayResolver } from './infrastructure/plex/RelayResolver.js';
import { CommandSequence } from './infrastructure/plex/CommandSequence.js';
import { PlexContentGateway } from './infrastructure/plex/PlexContentGateway.js';
import { PlexPlayerDirectory } from './infrastructure/plex/PlexPlayerDirectory.js';
import { PlexPlayerController } from './infrastructure/plex/PlexPlayerController.js';
import { DiscoverPlayers } from './application/usecases/DiscoverPlayers.js';
import { PlayersWatcher } from './application/services/PlayersWatcher.js';
import { PlaybackWatchers } from './application/services/PlaybackWatchers.js';
import { ResolvePlayer } from './application/usecases/ResolvePlayer.js';
import { CastMedia } from './application/usecases/CastMedia.js';
import { ControlPlayback } from './application/usecases/ControlPlayback.js';
import { BrowseContent } from './application/usecases/BrowseContent.js';

/**
 * Composition root: constructs the object graph once and hands the HTTP layer
 * a small set of use cases. This is the only place that knows concrete classes,
 * keeping every other module dependency-inverted and unit-testable.
 */
export interface Container {
  readonly discoverPlayers: DiscoverPlayers;
  readonly castMedia: CastMedia;
  readonly controlPlayback: ControlPlayback;
  readonly browseContent: BrowseContent;
  readonly playersWatcher: PlayersWatcher;
  readonly playbackWatchers: PlaybackWatchers;
}

export function createContainer(env: Environment): Container {
  const tokens = new TokenProvider(env);
  const http = new PlexHttpClient();
  const resolver = new ConnectionResolver(env, tokens, http);
  const registry = new ServerRegistry(env, tokens, http, resolver);

  const commandSequence = new CommandSequence();
  const relays = new RelayResolver(env, tokens, http, registry, commandSequence);

  const content = new PlexContentGateway(env, tokens, http, registry);
  const directory = new PlexPlayerDirectory(env, tokens, http, registry);
  const controller = new PlexPlayerController(
    env, tokens, http, registry, relays, commandSequence,
  );

  const resolvePlayer = new ResolvePlayer(directory);

  const discoverPlayers = new DiscoverPlayers(directory);
  const controlPlayback = new ControlPlayback(resolvePlayer, controller);

  return {
    discoverPlayers,
    castMedia: new CastMedia(resolvePlayer, controller),
    controlPlayback,
    browseContent: new BrowseContent(content),
    playersWatcher: new PlayersWatcher(discoverPlayers),
    playbackWatchers: new PlaybackWatchers(controlPlayback),
  };
}
