import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router.tsx';
import { Toaster } from '@/components/ui/sonner';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A transient backend hiccup must self-heal: retry with backoff, and
      // refetch when the PWA regains focus (phones background it constantly).
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      staleTime: 15_000,
      // Survive long enough to be persisted and rehydrated on the next open.
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: true,
      // 'always' — never pause on the online/offline signal. When iOS suspends
      // a backgrounded PWA, navigator.onLine can read false; the default
      // 'online' mode would then PAUSE fetches and fire them in a burst when it
      // flips back. We want each request to go out the instant it's made and
      // succeed or fail on its own (see request timeouts in the api client).
      networkMode: 'always',
    },
    mutations: {
      // Same reason, and this is the one that matters for controls: a paused
      // mutation is a button press that does nothing now and then replays late
      // in a burst. 'always' makes every command fire immediately on click.
      networkMode: 'always',
    },
  },
});

// Persist the small, high-value queries to localStorage so reopening the app
// paints the last-known player + Continue Watching INSTANTLY, then revalidates
// in the background — instead of a blank screen while a fresh fetch rides a
// stale iOS connection. Deliberately excludes big library lists (they'd blow
// the storage quota); those still load fresh.
const PERSISTED_KEYS = new Set(['players', 'servers', 'users', 'ondeck']);
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'plex-remote-query-cache',
});

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => PERSISTED_KEYS.has(String(query.queryKey[0])),
        },
      }}
    >
      <RouterProvider router={router} />
      <Toaster position="top-center" theme="dark" />
    </PersistQueryClientProvider>
  </StrictMode>,
);
