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
