# Plex Remote

A command-based remote control platform for **any Plex player in the world** —
no Google Cast, no mDNS tricks, no phone-app dependency. Pick a video and it
plays on your player instantly; pause, seek, navigate and control volume from a
mobile-first PWA.

It works by driving the **Plex Companion command API** through the media
server's relay (`/player/...` + `X-Plex-Target-Client-Identifier`), which every
Plex player supports regardless of what discovery mechanisms the official apps
have dropped.

## Quick start

```sh
docker compose up -d --build
# open http://plexremote.local:31400 (or http://<host-ip>:31400)
```

The Plex token is read at runtime from the mounted PMS `Preferences.xml`
(read-only). No secret is baked into the image; set `PLEX_TOKEN` instead if
your server config lives elsewhere.

## Architecture (apps/server)

Clean/hexagonal layering, dependency-inverted, one class per concern:

- `domain/` — entities (`Player`, `Server`, `MediaItem`, `PlaybackState`) and
  ports (`PlayerController`, `PlayerDirectory`, `ContentGateway`).
- `application/usecases/` — `CastMedia`, `ControlPlayback`, `BrowseContent`,
  `DiscoverPlayers`, `ResolvePlayer`.
- `infrastructure/plex/` — HTTP client with timeout/retry, server discovery
  (`ServerRegistry` + identity-verified `ConnectionResolver`), player relay
  routing (`RelayResolver`), the companion `PlexPlayerController`, XML timeline
  parsing.
- `interface/http/` — Fastify routes, input whitelisting, LAN guard, DTO
  mapping (tokens never reach the browser; images are proxied).

## Hard-won Plex Companion invariants

These are enforced in code and worth knowing before touching the controller:

1. **Transport commands must carry `type=` (video/music/photo).** Players
   silently ignore untyped pause/play/seek while the relay answers 200.
2. **Deliver each command through exactly one relay server.** Players
   registered with several servers execute a broadcast command once per server.
3. `commandID` must fit int32 and increase per controller identity; a fresh
   identity per process keeps the server-side high-water mark clean.
4. `playMedia` needs a server-side **playQueue** (`containerKey`) to start
   reliably, and works even where transport commands are rejected — do not use
   it as evidence the command channel works.
5. Timeline reads (`/player/timeline/poll`) are only answered by the server
   the player reports to; commands relay more widely. Route accordingly.

## Security

- **LAN-only by construction**: every request is checked against RFC1918 +
  loopback at the raw socket (no spoofable headers). Tailscale's CGNAT range
  (100.64/10) and public addresses are denied — other tailnet members cannot
  control your players. Each household runs its own instance for its own LAN.
- Host networking is required so the guard sees real client IPs.

## Web app (apps/web)

React 19 + Vite + Tailwind v4 + TanStack Query + Zustand PWA. Token-driven
design system (`styles/index.css` + `ui/atoms.tsx`), composition-style hooks
(`useActivePlayer`), poster-grid browsing with skeletons, live now-playing
mini-bar, artwork remote with scrubber, D-pad navigation, and volume.

## Releases & updating

Conventional commits drive everything: `fix:` → patch, `feat:` → minor,
`feat!:`/`BREAKING CHANGE` → major.

- **release-please** maintains a rolling release PR on `master`; merging it
  tags `vX.Y.Z`, writes the changelog and cuts the GitHub Release.
- The docker workflow publishes `ghcr.io/knat-dev/plex-remote` with the full
  semver tag set (`X.Y.Z`, `X.Y`, `X`, `latest`) on release, and `:edge` +
  `sha-…` on every master push.
- Deployments pin a semver tag; Renovate (in the homelab repo) proposes
  version bumps as PRs — merging the PR and converging is the whole update
  flow.

## Local domain

`plexremote.local` is published via an avahi alias (systemd unit
`plexremote-mdns.service`) — resolvable by phones on the LAN, colliding with
nothing in the arr-stack or NAS.
