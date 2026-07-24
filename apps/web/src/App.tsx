import { useState } from 'react';
import { LayoutGrid, Gamepad2, Tv } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from './components/AppHeader.tsx';
import { NowPlayingBar } from './components/NowPlayingBar.tsx';
import { BrowseScreen } from './features/browse/BrowseScreen.tsx';
import { RemoteScreen } from './features/remote/RemoteScreen.tsx';
import { PlayersScreen } from './features/players/PlayersScreen.tsx';

export type TabId = 'browse' | 'remote' | 'players';

const TAB_ITEMS = [
  { id: 'browse' as const, label: 'Browse', Icon: LayoutGrid },
  { id: 'remote' as const, label: 'Remote', Icon: Gamepad2 },
  { id: 'players' as const, label: 'Players', Icon: Tv },
];

export function App() {
  const [tab, setTab] = useState<TabId>('browse');

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabId)}
      className="mx-auto flex min-h-dvh max-w-lg flex-col gap-0"
    >
      <AppHeader onLogo={() => setTab('browse')} onOpenPlayers={() => setTab('players')} />

      <main className="flex flex-1 flex-col pt-3">
        <TabsContent value="browse" className="flex-1">
          <BrowseScreen onCasted={() => setTab('remote')} />
        </TabsContent>
        <TabsContent value="remote" className="flex flex-1 flex-col">
          <RemoteScreen />
        </TabsContent>
        <TabsContent value="players" className="flex-1">
          <PlayersScreen onSelected={() => setTab('remote')} />
        </TabsContent>
      </main>

      {tab !== 'remote' && <NowPlayingBar onOpen={() => setTab('remote')} />}

      <TabsList className="safe-bottom sticky bottom-0 z-40 h-auto w-full justify-around rounded-none border-t border-border bg-background/90 p-0 backdrop-blur">
        {TAB_ITEMS.map(({ id, label, Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex h-auto flex-1 flex-col items-center gap-1 rounded-none border-0 py-2.5 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Icon className="size-5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
