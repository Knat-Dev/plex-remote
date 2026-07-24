# Serving this project (wtproxy)

Branch dev servers are managed by the worktree-proxy skill (`wtproxy.sh up <branch>`
→ `http://<branch>.plex-remote.localhost`). Project specifics:

- **Web workspace only.** `.wtproxy` runs the Vite dev server
  (`npm run dev --workspace apps/web -- --port $PORT --strictPort`). There is no
  dev backend process: Vite proxies `/api` to a running app instance.
- **API target**: `http://127.0.0.1:31400` (local container) by default;
  override with `API_PROXY=<url>` (e.g. `http://plexremote.local:31400` for the
  media01 production instance) when the local container isn't running.
- **Hosts**: Vite's default allowedHosts covers `*.localhost` — no config needed.
- **Production is NOT served by wtproxy**: media01 runs the released image at
  `http://plexremote.local:31400` (see the homelab repo, `compose/media/`); this
  machine may run a secondary container at `http://plex-remote.localhost`
  (a plain wtproxy plumbing registration to port 31400).
- After merging/deleting branches: `wtproxy.sh reconcile`.
