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

/**
 * Fixed app shell: the page itself never scrolls (h-dvh + overflow-hidden);
 * each screen scrolls internally. Header and tab bar are anchored, so no
 * sticky positioning or page scrollbars are ever involved.
 */
export function App() {
  const [tab, setTab] = useState<TabId>('browse');

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabId)}
      className="mx-auto flex h-dvh max-w-lg flex-col gap-0 overflow-hidden"
    >
      <AppHeader onLogo={() => setTab('browse')} onOpenPlayers={() => setTab('players')} />

      <main className="flex min-h-0 flex-1 flex-col">
        <TabsContent value="browse" className="flex min-h-0 flex-1 flex-col pt-3">
          <BrowseScreen onCasted={() => setTab('remote')} />
        </TabsContent>
        <TabsContent value="remote" className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-3">
          <RemoteScreen />
        </TabsContent>
        <TabsContent value="players" className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-3">
          <PlayersScreen onSelected={() => setTab('remote')} />
        </TabsContent>
      </main>

      {tab !== 'remote' && <NowPlayingBar onOpen={() => setTab('remote')} />}

      {/* group-data variant override: the base TabsList pins h-9 via
          group-data-[orientation=horizontal]/tabs:h-9, which a plain h-auto
          cannot beat — the taller triggers would overflow the 36px list. */}
      <TabsList className="h-auto w-full shrink-0 justify-around gap-2 rounded-none border-t border-border bg-background/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur group-data-[orientation=horizontal]/tabs:h-auto">
        {TAB_ITEMS.map(({ id, label, Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex h-auto flex-1 flex-col items-center gap-1.5 rounded-lg border-0 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground shadow-none transition-colors data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Icon className="size-5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
