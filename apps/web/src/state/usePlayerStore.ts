import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NowPlayingMeta {
  ratingKey: string;
  title: string;
  thumbUrl: string | null;
  artUrl: string | null;
}

/** Which player commands target, which server we browse, and the last cast. */
interface RemoteState {
  activeClientId: string | undefined;
  activeServerId: string | undefined;
  nowPlaying: NowPlayingMeta | undefined;
  setActivePlayer: (clientId: string) => void;
  setActiveServer: (serverId: string) => void;
  setNowPlaying: (meta: NowPlayingMeta) => void;
}

export const usePlayerStore = create<RemoteState>()(
  persist(
    (set) => ({
      activeClientId: undefined,
      activeServerId: undefined,
      nowPlaying: undefined,
      setActivePlayer: (clientId) => set({ activeClientId: clientId }),
      setActiveServer: (serverId) => set({ activeServerId: serverId }),
      setNowPlaying: (meta) => set({ nowPlaying: meta }),
    }),
    { name: 'plex-remote-selection' },
  ),
);
