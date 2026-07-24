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
type ServerMsg = PlayersMsg | StateMsg;

/**
 * The single app-wide realtime connection. It pushes server events straight
 * into the TanStack Query cache, so components keep reading `usePlayers` /
 * `usePlaybackState` exactly as before — but with socket-fresh data and zero
 * client polling. Auto-reconnects with backoff; re-subscribes to the active
 * player whenever it changes.
 */
export function useRealtime(): void {
  const qc = useQueryClient();
  const activeClientId = usePlayerStore((s) => s.activeClientId);
  const socketRef = useRef<WebSocket | null>(null);
  const watchedRef = useRef<string | undefined>(undefined);
  // Last seen status per player, to detect the play→stop transition.
  const statusRef = useRef<Record<string, PlaybackStateDto['status']>>({});

  // One connection for the app's lifetime, with reconnect.
  useEffect(() => {
    let closed = false;
    let backoff = 500;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        backoff = 500;
        // (Re)assert the current subscription after a reconnect.
        watchedRef.current = undefined;
        syncWatch();
      };

      socket.onmessage = (event) => {
        let msg: ServerMsg;
        try {
          msg = JSON.parse(event.data as string) as ServerMsg;
        } catch {
          return;
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

      socket.onclose = () => {
        socketRef.current = null;
        if (closed) return;
        backoff = Math.min(backoff * 2, 5000);
        reconnectTimer = setTimeout(connect, backoff);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, [qc]);

  // Tell the server which player to stream whenever the selection changes.
  useEffect(syncWatch, [activeClientId]);

  function syncWatch() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (watchedRef.current === activeClientId) return;
    watchedRef.current = activeClientId;
    socket.send(JSON.stringify({ type: 'watch', clientId: activeClientId ?? null }));
  }
}
