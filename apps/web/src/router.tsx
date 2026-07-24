import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { AppShell } from './components/AppShell.tsx';
import { BrowseScreen } from './features/browse/BrowseScreen.tsx';
import { DrillScreen } from './features/browse/DrillScreen.tsx';
import { RemoteScreen } from './features/remote/RemoteScreen.tsx';
import { PlayersScreen } from './features/players/PlayersScreen.tsx';

// NOTE: screens must never import from this module (routes/router) — that
// creates a circular import that crashes the minified production bundle with
// a TDZ ReferenceError. Screens use getRouteApi('<path>') instead.

/** All optional so plain links to '/' need no search params; defaults at use. */
export interface BrowseSearch {
  /** Selected server id, or __all__ for the cross-server view. */
  server?: string;
  /** Section key (per-server) or type-filter id (All mode), __all__ default. */
  lib?: string;
  /** Search query; empty means browsing. */
  q?: string;
}

const rootRoute = createRootRoute({ component: AppShell });

export const browseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (raw: Record<string, unknown>): BrowseSearch => ({
    ...(typeof raw.server === 'string' ? { server: raw.server } : {}),
    ...(typeof raw.lib === 'string' ? { lib: raw.lib } : {}),
    ...(typeof raw.q === 'string' && raw.q ? { q: raw.q } : {}),
  }),
  component: BrowseScreen,
});

export const drillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/browse/$serverId/$ratingKey',
  validateSearch: (raw: Record<string, unknown>) => ({
    t: typeof raw.t === 'string' ? raw.t : '',
  }),
  component: DrillScreen,
});

export const remoteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/remote',
  component: RemoteScreen,
});

export const playersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/players',
  component: PlayersScreen,
});

const routeTree = rootRoute.addChildren([browseRoute, drillRoute, remoteRoute, playersRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
