import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { LayoutGrid, Gamepad2, Tv } from 'lucide-react';
import { useRealtime } from '../realtime/useRealtime.ts';
import { AppHeader } from './AppHeader.tsx';
import { NowPlayingBar } from './NowPlayingBar.tsx';

const NAV = [
  { to: '/', label: 'Browse', Icon: LayoutGrid, exact: true },
  { to: '/remote', label: 'Remote', Icon: Gamepad2, exact: false },
  { to: '/players', label: 'Players', Icon: Tv, exact: false },
] as const;

/**
 * Fixed app shell around the router outlet: the page itself never scrolls;
 * each screen scrolls internally. Tabs are real routes, so the browser's
 * back/forward and deep links work everywhere.
 */
export function AppShell() {
  useRealtime();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden">
      <AppHeader />

      <main className="flex min-h-0 flex-1 flex-col pt-3">
        <Outlet />
      </main>

      {pathname !== '/remote' && <NowPlayingBar />}

      <nav className="flex w-full shrink-0 justify-around gap-2 border-t border-border bg-background/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur">
        {NAV.map(({ to, label, Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground transition-colors"
            activeProps={{ className: 'text-primary' }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
