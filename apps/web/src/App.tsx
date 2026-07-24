import { useState } from 'react';
import { AppHeader } from './components/AppHeader.tsx';
import { NowPlayingBar } from './components/NowPlayingBar.tsx';
import { TabBar, type TabId } from './components/TabBar.tsx';
import { BrowseScreen } from './features/browse/BrowseScreen.tsx';
import { RemoteScreen } from './features/remote/RemoteScreen.tsx';
import { PlayersScreen } from './features/players/PlayersScreen.tsx';

export function App() {
  const [tab, setTab] = useState<TabId>('browse');

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <AppHeader onOpenPlayers={() => setTab('players')} />
      <main className="flex-1 pt-3">
        {tab === 'browse' && <BrowseScreen />}
        {tab === 'remote' && <RemoteScreen />}
        {tab === 'players' && <PlayersScreen onSelected={() => setTab('remote')} />}
      </main>
      {tab !== 'remote' && <NowPlayingBar onOpen={() => setTab('remote')} />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
