/**
 * A Plex Media Server that hosts content and relays companion commands.
 * `connections` are ordered by preference (local before remote).
 */
export interface PlexConnection {
  readonly uri: string;
  readonly address: string;
  readonly port: number;
  readonly local: boolean;
}

export interface Server {
  readonly id: string;
  readonly name: string;
  readonly connections: readonly PlexConnection[];
}

export function preferredConnection(server: Server): PlexConnection | undefined {
  return [...server.connections].sort((a, b) => Number(b.local) - Number(a.local))[0];
}
