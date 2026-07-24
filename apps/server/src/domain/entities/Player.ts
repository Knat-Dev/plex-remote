/**
 * A controllable Plex player (the "receiver"): HTPC, Apple TV, Shield, phone, etc.
 * `capabilities` mirror Plex's protocolCapabilities (timeline, playback, navigation…).
 */
export interface Player {
  readonly clientId: string;
  readonly name: string;
  readonly product: string;
  readonly platform: string;
  readonly capabilities: readonly PlayerCapability[];
  /**
   * Machine ids of every server this player is registered with, in discovery
   * order. Commands relay through any of them, but only the server the player
   * reports its timeline to answers timeline/poll — so routing must choose the
   * one that actually responds rather than assuming the first.
   */
  readonly viaServerIds: readonly string[];
}

export type PlayerCapability =
  | 'timeline'
  | 'playback'
  | 'navigation'
  | 'mirror'
  | 'playqueues'
  | 'provider-playback';

export function canPlay(player: Player): boolean {
  return player.capabilities.includes('playback');
}

export function canNavigate(player: Player): boolean {
  return player.capabilities.includes('navigation');
}
