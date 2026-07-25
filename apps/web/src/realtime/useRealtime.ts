import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pollHold } from '../api/optimistic.ts';
import type { PlaybackStateDto, PlayerDto } from '../api/types.ts';
import { usePlayerStore } from '../state/usePlayerStore.ts';

interface PlayersMsg {
  type: 'players';
  players: PlayerDto[];
}
interface StateMsg {
  type: 'state';
  clientId: string;
  state: PlaybackStateDto;
}
interface PingMsg {
  type: 'ping';
}
type ServerMsg = PlayersMsg | StateMsg | PingMsg;

/** No server frame (state change OR heartbeat) for this long ⇒ dead socket. */
const STALE_MS = 30_000;
/** How long a just-foregrounded OPEN socket may be quiet before we bounce it. */
const WAKE_STALE_MS = 10_000;

/**
 * The single app-wide realtime connection, built to never silently die. It
 * pushes server events straight into the TanStack Query cache, so components
 * keep reading `usePlayers` / `usePlaybackState` unchanged — but socket-fresh
 * and with zero client polling.
 *
 * Reliability layers, because a mobile PWA WILL background/suspend the socket:
 * - a server heartbeat (`ping` every 15s) proves liveness even when idle;
 * - a watchdog force-reconnects when no frame arrives within STALE_MS (iOS
 *   suspends the socket on background and the `close` event often never fires);
 * - visibility/focus/online events wake and, if stale, bounce the socket so the
 *   app reconnects the instant it returns to the foreground;
 * - every (re)connect re-primes players + the active player's state over HTTP,
 *   so the UI is correct immediately, not one poll later.
 */
export function useRealtime(): void {
  const qc = useQueryClient();
  const activeClientId = usePlayerStore((s) => s.activeClientId);
  const socketRef = useRef<WebSocket | null>(null);
  const watchedRef = useRef<string | null | undefined>(undefined);
  // Last seen status per player, to detect the play→stop transition.
  const statusRef = useRef<Record<string, PlaybackStateDto['status']>>({});

  useEffect(() => {
    let closed = false;
    let backoff = 500;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let lastMessageAt = Date.now();

    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`;

    const connect = () => {
      if (closed) return;
      const existing = socketRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
      ) {
        return; // already live or dialing — don't stack sockets
      }

      const socket = new WebSocket(url);
      socketRef.current = socket;
      lastMessageAt = Date.now();

      socket.onopen = () => {
        backoff = 500;
        lastMessageAt = Date.now();
        // Re-assert the subscription and refresh over HTTP so a reconnect (e.g.
        // after the app was suspended) shows correct state without waiting for
        // the next pushed frame.
        watchedRef.current = undefined;
        syncWatch();
        void qc.invalidateQueries({ queryKey: ['players'] });
        const active = usePlayerStore.getState().activeClientId;
        if (active) void qc.invalidateQueries({ queryKey: ['state', active] });
      };

      socket.onmessage = (event) => {
        lastMessageAt = Date.now();
        let msg: ServerMsg;
        try {
          msg = JSON.parse(event.data as string) as ServerMsg;
        } catch {
          return;
        }
        if (msg.type === 'ping') {
          return; // heartbeat: liveness only, already recorded above
        }
        if (msg.type === 'players') {
          qc.setQueryData(['players'], msg.players);
        } else if (msg.type === 'state') {
          // A finished/stopped session changes watch state (Continue Watching,
          // progress strips, watched badges) — refetch content once, on the
          // play→stop edge, so those views self-heal without polling.
          const prev = statusRef.current[msg.clientId];
          statusRef.current[msg.clientId] = msg.state.status;
          if (prev && prev !== 'stopped' && msg.state.status === 'stopped') {
            void qc.invalidateQueries({ queryKey: ['ondeck'] });
            void qc.invalidateQueries({ queryKey: ['everything'] });
            void qc.invalidateQueries({ queryKey: ['all-items'] });
            void qc.invalidateQueries({ queryKey: ['items'] });
            void qc.invalidateQueries({ queryKey: ['children'] });
          }
          // Respect the optimistic hold: don't let a socket frame overwrite a
          // just-issued command's predicted state.
          if (pollHold.remainingMs() > 0) return;
          qc.setQueryData(['state', msg.clientId], msg.state);
        }
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          /* already closing */
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (closed) return;
        clearTimeout(reconnectTimer);
        backoff = Math.min(backoff * 2, 5000);
        reconnectTimer = setTimeout(connect, backoff);
      };
    };

    // Watchdog: catch the silent death a `close` event never reports.
    const watchdog = setInterval(() => {
      if (closed) return;
      const socket = socketRef.current;
      if (!socket) {
        connect();
      } else if (socket.readyState === WebSocket.OPEN && Date.now() - lastMessageAt > STALE_MS) {
        try {
          socket.close(); // onclose schedules the reconnect
        } catch {
          /* noop */
        }
      }
    }, 5000);

    // Foreground/network wake: reconnect now instead of on the backoff timer.
    const wake = () => {
      if (closed) return;
      const socket = socketRef.current;
      if (
        !socket ||
        socket.readyState === WebSocket.CLOSING ||
        socket.readyState === WebSocket.CLOSED
      ) {
        backoff = 500;
        clearTimeout(reconnectTimer);
        connect();
      } else if (
        socket.readyState === WebSocket.OPEN &&
        Date.now() - lastMessageAt > WAKE_STALE_MS
      ) {
        try {
          socket.close();
        } catch {
          /* noop */
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') wake();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      clearInterval(watchdog);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', wake);
      window.removeEventListener('online', wake);
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc]);

  // Tell the server which player to stream whenever the selection changes.
  useEffect(syncWatch, [activeClientId]);

  function syncWatch() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const active = usePlayerStore.getState().activeClientId ?? null;
    if (watchedRef.current === active) return;
    watchedRef.current = active;
    socket.send(JSON.stringify({ type: 'watch', clientId: active }));
  }
}
