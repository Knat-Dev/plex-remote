import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" theme="dark" />
    </QueryClientProvider>
  </StrictMode>,
);
