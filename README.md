# walbi-exchange

AI-first crypto exchange frontend, built on the WALBI MCP backend. Mirrors the production [app.walbi.com](https://app.walbi.com) UX (see audit in Notion) and targets sub-second load.

**Live:** [exchange.walbi.cfd](https://exchange.walbi.cfd)

## Stack

- **Vite 8** + **React 19** + **TypeScript 6** — Rolldown-powered build
- **HeroUI Pro v3** (`@heroui-pro/react`) + **Tailwind CSS v4**
- **TanStack Router** — file-based routing with `defaultPreload: "intent"`
- **TanStack Query v5** — stale-while-revalidate with **IndexedDB persistence** via `idb-keyval`
- **Workbox Service Worker** (`vite-plugin-pwa`) — pre-caches shell, runtime SWR for CDN + API GET lists
- **WebSocket** — single multiplexed connection to `wss://ws.walbi.com/otp` with custom event-code envelope (see audit insight #17)

## Caching strategy

| Layer | What | Storage | TTL |
|-------|------|---------|-----|
| Hashed `/assets/*` | Vite-produced JS/CSS/WOFF2 | Cache API (SW) + HTTP `Cache-Control: max-age=31536000, immutable` | 1y |
| `index.html`, `manifest.webmanifest`, `sw.js` | App shell | HTTP `Cache-Control: no-cache, must-revalidate` | always revalidate |
| `content.walbi.com/*` | Agent avatars, static media | SW StaleWhileRevalidate | 30d |
| `gw.walbi.com/api/*/list/v*` | Idempotent list endpoints | SW StaleWhileRevalidate | 60s freshness |
| All `useQuery` data | Per-domain queries | IndexedDB via TanStack persister | 24h |
| WebSocket subscriptions | Tickers, orderbook, candles | In-memory, lifecycle managed per route | session |

**Why this matters:** repeat visits hit cache for everything except a single 0.7 KB `index.html` revalidate. Cold starts hit ~135 KB gz JS + 38 KB gz CSS for the shell, then route chunks (1-1.5 KB gz each) load on demand and pre-fetch on link hover.

## Performance budget

- LCP < 1s on 4G mobile
- FCP < 500 ms
- TTI < 2s
- Initial bundle (entry + react + heroui + query) < 150 KB gz

## Develop

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173/

## Build & deploy

```bash
pnpm build           # produces dist/
./deploy/deploy.sh   # rsync to Hetzner + caddy reload
```

The deploy script targets `root@46.224.164.185:/srv/walbi-exchange/`. Caddy serves `exchange.walbi.cfd` from there with HTTP/3, Zstd/Gzip, and the cache-control matrix above (see [deploy/Caddyfile.fragment](deploy/Caddyfile.fragment)).

## Layout

```
src/
├─ components/
│  └─ Shell/          # AppShell, Topbar (desktop), BottomTabs (mobile)
├─ lib/
│  ├─ api/
│  │  ├─ rest.ts      # POST-RPC client (gw.walbi.com)
│  │  └─ ws.ts        # Single multiplexed WS (wss://ws.walbi.com/otp)
│  └─ cache/
│     └─ queryClient.ts  # TanStack Query + IndexedDB persister
├─ routes/            # File-based routing — one file per top-level page
│  ├─ __root.tsx
│  ├─ index.tsx       # /          — AI Hub (chat + agents + context)
│  ├─ signals.tsx     # /signals   — Tinder-style signal swipe
│  ├─ trade.tsx       # /trade     — 4-zone trading view
│  ├─ memepool.tsx    # /memepool  — memecoin spot
│  ├─ predictions.tsx # /predictions
│  ├─ wallet.tsx      # /wallet    — multi-sub-account
│  └─ earn.tsx        # /earn      — mobile "Экшены" hub (M+P+Earn)
├─ index.css
└─ main.tsx
```

## Source spec

This frontend implements the patterns documented in the [Walbi UX Audit](https://www.notion.so/36bdd8b70b7381d2bbf9f99d8fd6a352): 6 main views, 20 critical insights, P0/P1/P2/P3 backlog. See sub-pages for per-screen specifications, REST surface, WebSocket protocol.
