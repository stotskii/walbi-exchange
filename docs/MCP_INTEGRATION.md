# WALBI MCP Integration

**Status:** mapped, not yet wired. Frontend is on mocks. This doc explains how to flip from mocks to real WALBI data, what's available, what's missing, and where to get the gaps.

---

## 1. What WALBI exposes

Two surfaces (both go through `walbi-mcp` proxy):

### REST — `gw.walbi.com/api/<domain>/<action>/v<n>` (POST only)

| Domain | Endpoints | Purpose |
|---|---|---|
| **User** | `profile/v1` | Email, name, picture, wallet, user_id |
| **Auth** | `providers/v1` | Connected oauth providers, wallets — but requires already-auth'd session |
| **Agent** | `list/v1`, `get/v1`, `list/ids/v1`, `list/slugs/v1`, `mute/v1`, `muted/list/v1`, `unmute/v1`, `session/{create,list,start,stop,settings/save}/v1`, `laboratory/{create,update,get,list}/v1`, `backtest/{create,get,list,last,stop,events/list,defaults}/v1` | AI agents marketplace + lifecycle (start/stop sessions, backtest, mute alerts) |
| **Balance** | `account/create/v1`, `top-up/v1`, `operation/{up,last}/list/v1`, `operation/up/one/v1` | Spot balance accounts + operation history |
| **Trading** | `balance/account/create/v1` | Trading-specific account creation (separate from balance) |
| **Memepool** | `token/{list,get,search}/v1`, `portfolio/get/v1`, `order/market/{buy,sell,history,limits/get}/v1`, `commission/get/v1` | Solana memecoin trading |
| **Prediction** | `block/{instrument/list,one/uid}/v1`, `deal/{block/list,history/list,instrument/list}/v1`, `leaderboard/top/v1` | Binary up/down predictions + global leaderboard |
| **History** | `deals/fx/{,/highlights,/highlights/list,/terminal/list}/v1`, `deal/fx/v1`, `orders/fx/v1` | FX deals & orders history (read-only) |
| **Instruments** | `changes/fx/v1` | Instrument metadata delta — full list comes via WS push 1054 |
| **Constraints** | `deals/limits/v1` | Min/max amount, leverage per pair |
| **Chat** | `conversation/{list,delete,clear,meta/get}/v1`, `message/list/v1`, `suggestion/list/v1` | Agent chat surface (history + suggestions) |
| **Charts** | `tab/{get,set}/v1`, `tradingview/{save,list,delete,template/save,template/list,template/delete}/v1` | Save/load TradingView chart state per user |
| **Autotrading** | `session/{start,stop,get,user/get}/v1` | Autotrading session lifecycle |
| **Partner** | `balance/v1`, `external/partner/{accrual/daily/list,referral/list}/v1` | Affiliate balance + referral stats |
| **Sharing** | `deal/save/v1` | Generate share image for a deal |

**~70 REST endpoints total.** ALL require auth (auth_required: true).

### WS — `wss://ws.walbi.com/otp` (cerberus, single multiplexed connection)

**36 request events** (client → server):

| Code | Event | Purpose |
|---|---|---|
| 1 | `auth:login:request` | Send `{access_token}` → authenticate the socket |
| 2 | `auth:logout:request` | Drop session |
| 98/99 | `changes:{subscribe,unsubscribe}` | **Multiplexer:** subscribe to N push event_ids in one frame |
| 153 | `balance_account:list` | List balance accounts snapshot |
| 901/902 | `voucher:{activate,claim}:v1` | Voucher gamification (the only "earn" thing in the API) |
| 1000 | `time:v1` | Server clock |
| 1004 | `fx:candles:history` | Fetch historical candles `{pair, from, to, size, limit, solid}` |
| 1005-1008 | `fx:candles:{subscribe,unsubscribe,allsub,allunsub}` | Subscribe to live candle updates |
| 1010-1011 | `fx:ticks:{subscribe,unsubscribe}` | Live tick subscriptions per pair |
| 1012 | `fx:st:request` | Request server time |
| **1013/1014** | `fx:market:{subscribe,unsubscribe}` | **Order book subscription** `{pair, scale}` — scale ∈ {1,10,100,1000} |
| 1017/1018 | `fx:ticks:{allsub,allunsub}` | Subscribe to ALL pairs ticker stream |
| **1032** | `fx:deals:opening` | **Open position** `{account_id, amount, dir, group, margin_type, multiplicator, pair, stop_loss?, take_profit?, highlight_id?}` |
| **1033** | `fx:deals:closing` | Close position by id |
| 1034 | `fx:deals:changing` | Update stops on existing position |
| 1042 | `fx:deals:turning_trailing_off` | Cancel trailing stop |
| 1047 | `trading_account:list` | List trading accounts |
| 1048 | `fx:deals:cross_liquidation:calculate` | Pre-compute cross-margin liquidation price |
| **1065** | `fx:orders:opening:v2` | **Place limit order** |
| 1066-1068 | `fx:orders:{canceling:v2,change_limits,canceling_all:v1}` | Manage pending orders |
| 1078 | `fx:profile:setpositionmode` | Switch hedge/one-way |
| 1200 | `notification:read:v1` | Mark notification as read |
| **1703** | `prediction:deal:open:v1` | **Place prediction bet** `{account_id, amount, block_uid, direction: up\|down}` |
| **1901** | `chat:message:send:v1` | **Send chat to AI agent** `{agent_id, content, conversation_uid, external_uid}` |
| 2201/2202 | `leaderboard:stream:{subscribe,unsubscribe}:v1` | Live leaderboard |

**66 push events** (server → client) — used via `changes:subscribe`:

| Code | Event | Purpose |
|---|---|---|
| 2 | `auth:logout` | Session ended elsewhere |
| **55** | `balance:change:v3` | **Wallet update** `{account_id, amount, amount_free, group}` |
| 150-152 | `balance_account:{created,updated,closed}` | Account lifecycle |
| 220 | `connection:closing` | Server-initiated reconnect |
| 500/501 | `deposit:{v1,aggregator:v1}` | Deposit state changes |
| 600/601 | `withdrawal:{v1,commission:changed:v1}` | Withdrawal state changes |
| **700-704** | `highlight:{available:v1,available:v2,hidden:v1,blocked:v1,available:v3}` | **Lighthouse signals** — this is our Signals feature |
| 800 | `exchange_rates:usd_rates:changed:v1` | FX rates table |
| 900 | `voucher:v1` | Voucher state |
| **1001** | `fx:candle:change` | **Live candle tick** for chart |
| **1002** | `fx:tick:change` | **Live price tick** `{p, q, a, b, t, v, c}` (price, ask, bid, time, volume, commission) |
| 1003 | `fx:candles:all` | Snapshot of all candles |
| 1009 | `fx:st:change` | Server time heartbeat |
| **1015** | `fx:market:change` | **Order book update** `[{p, s, t, a:[{p,a}], b:[{p,a}], c:{a,b}}]` (sentiment in c) |
| 1016 | `fx:ticks:all` | Multi-pair tick batch |
| 1029-1045 | `fx:deals:{reconnect,proceed_min,closed,open,change,proceed:v1}` | Deal lifecycle (your open positions) |
| 1046 | `fx:balance:change` | Trading balance update |
| 1049 | `trading_account:created` | New trading account |
| 1054 | `fx:instrument:change:v2` | **Full instrument list** (live pairs definition) |
| 1063/1064 | `fx:orders:{reconnect,updated:v2}` | Pending orders lifecycle |
| 1076 | `fx:instrument:disable` | Pair stops trading |
| 1077 | `fx:profile:change` | Profile update |
| 1101 | `knx:v1` | KNX (special deposit type) |
| 1201/1202 | `notification:{new:v1,delete:v1}` | **Inbox push** |
| 1300-1303 | `autotrading:session:*` | Autotrading state |
| 1400-1402 | `xray:*:v1` | XRay reports |
| 1500 | `refresh:v1` | "Refetch everything" hint |
| **1600** | `memepool:market_order:executed:v1` | **Memepool buy/sell executed** |
| **1700-1704** | `prediction:{block:v1,block:update:v1,deal:update:v1,instrument:update:v1}` | **Predictions live state** |
| 1800 | `verification:v1` | KYC status |
| **1900/1902** | `chat:{message:update:v1,suggestion:update:v1}` | **Chat reply from agent** |
| 2000 | `spot:swap:executed:v1` | Swap done |
| 2100-2108 | `aitrading:*:v1` | AI agent lifecycle |
| 2200 | `leaderboard:stream:v1` | Leaderboard delta |
| 2300 | `dca:positions:v1` | DCA positions update |

---

## 2. Mapping our UI to WALBI API

| Our feature | WALBI source | Mock → Real |
|---|---|---|
| **AI Hub agents list** | REST `/api/agent/list/v1` (paginated) | Replace `AGENTS` |
| **Agent detail** | REST `/api/agent/get/v1` `{slug}` | Per-agent fetch |
| **Agent run/pause** | REST `/api/agent/session/{start,stop}/v1` + push 2100-2108 | Replace `useUI.runningAgents` |
| **Agent statistics** | Embedded in `AgentV1.statistics` (apr, roi_7d/14d/30d, users, volume_usd, history) | Real-time numbers |
| **Meta chat history** | REST `/api/chat/conversation/meta/get/v1` + `/api/chat/message/list/v1` | Replace `MOCK_MESSAGES` |
| **Send chat message** | WS `chat:message:send:v1` + push `chat:message:update:v1` | Real LLM agent replies |
| **Signals feed** | Push `highlight:available:v3` (subscribe via 98) | Replace `mockSignals()` |
| **Signal → open position** | WS `fx:deals:opening` with `highlight_id` set | Real trade execution |
| **Trade pair list** | Push `fx:instrument:change:v2` (full snapshot on connect) | Replace static `PAIRS` |
| **Trade tickers** | WS `fx:ticks:subscribe` per pair → push `fx:tick:change` | Replace random walk in CandleChart |
| **Trade candles** | WS `fx:candles:history` (initial), `fx:candles:subscribe` (live) → `fx:candle:change` | Replace `mockCandles()` |
| **Trade order book** | WS `fx:market:subscribe` `{pair, scale}` → `fx:market:change` | Replace `mockOrderBook()` |
| **Open position** | WS `fx:deals:opening` `{account_id, amount, dir: "long"\|"short", margin_type, multiplicator, pair, stop_loss?, take_profit?}` | Replace `OrderForm` submit |
| **Open positions** | Push `fx:deals:open` / `fx:deals:proceed_min` / `fx:deals:change` / `fx:deals:closed` | Live `usePositions` from WS |
| **Position PnL** | `APIDeal.floating_pnl` updates via push 1030/1039 | Real PnL ticking |
| **Close position** | WS `fx:deals:closing` `{id}` | Replace `closePosition` |
| **Limit order** | WS `fx:orders:opening:v2` → push `fx:orders:updated:v2` | New flow |
| **Memepool token list** | REST `/api/memepool/token/list/v1` `{chain: "solana"}` | Replace `MEMECOINS` |
| **Memepool token search** | REST `/api/memepool/token/search/v1` | Live search |
| **Memepool portfolio** | REST `/api/memepool/portfolio/get/v1` | Real holdings with unrealized PnL |
| **Memepool buy** | REST `/api/memepool/order/market/buy/v1` + push `memepool:market_order:executed:v1` | Replace TokenModal submit |
| **Predictions blocks** | Push `prediction:block:v1` (snapshot) + `prediction:block:update:v1` (delta) | Replace `mockPredictionBlocks()` |
| **Place prediction bet** | WS `prediction:deal:open:v1` `{account_id, amount, block_uid, direction: "up"\|"down"}` | Replace BetModal submit |
| **Prediction history** | REST `/api/prediction/deal/history/list/v1` | Personal stats |
| **Wallet balances** | WS push `balance:change:v3` (live) + REST `/api/balance/operation/up/list/v1` (history) | Replace `useBalances` |
| **Trading balance** | WS push `fx:balance:change` | Live |
| **Deposit history** | Push `deposit:v1` + `deposit:aggregator:v1` | Real-time |
| **Withdrawal** | Push `withdrawal:v1` | Real-time |
| **Inbox alerts** | Push `notification:new:v1` (live) — initial state via subscribe | Replace `INBOX_ALERTS` |
| **Mark notif read** | WS `notification:read:v1` `{id}` | Replace read state |
| **User profile** | REST `/api/user/profile/v1` | Replace hardcoded "Sergey Stotskii" in ProfilePanel |
| **Verification status** | Push `verification:v1` | KYC banner |
| **Vouchers** | Push `voucher:v1` + WS `voucher:{activate,claim}:v1` | Real voucher claim |

---

## 3. What's MISSING from WALBI

These features in our UI have NO equivalent in the WALBI API. Decisions per item:

| Feature | Status | Where to get it |
|---|---|---|
| **Referral two-tier program (10%/5%)** | Partial — only `partner/external/referral/list/v1` for affiliate stats, no two-tier signup logic | Build ourselves on `partner` endpoints + custom backend |
| **Miner (PTS mining)** | Not in API | Our own gamification service — small Postgres table tracking PTS/hour of activity |
| **Airdrops list/history** | Not in API | Static config in our backend OR Notion-driven CMS |
| **Tasks (Telegram subscribe, etc.)** | Not in API | Our own tasks engine + reward distribution. Telegram subscribe verification via Telegram Bot API |
| **Tasks rewards (PTS)** | Not in API | Same as miner — our gamification |
| **Token PTS itself** | Not in API | Our own ERC20/SPL token OR off-chain point system |
| **Onramper fiat deposit** | Not in API | Integrate Onramper SDK directly client-side (or MoonPay/Transak/Mercuryo) |
| **Crypto deposit address** | Not in obvious place | Likely separate endpoint — search more or get from Walbi team |
| **Withdrawal initiation REST** | Not surfaced | Could be WS-only (similar to deals) — investigate |
| **AppStores QR generation** | N/A — UI-only | Done client-side |
| **2FA enable/disable** | Not in our scope of swagger | Walbi profile endpoint, needs Walbi team to expose |
| **KYC start flow** | Only `verification:v1` push exists | Need a `verification/start/v1` or similar — ask Walbi |
| **API keys management** | Not in API | Build ourselves with backend |
| **Settings (orderbook visibility, default leverage)** | Not in API | localStorage / our own user-settings table |
| **Trading commission breakdown** | Embedded in deals but not in OrderForm preview | Compute from `fx:instrument:change:v2` data |
| **Language switch** | Frontend i18n — no backend involvement needed | i18n bundle (we already lazy-load locale chunks) |
| **Crisp support widget** | Walbi has `crisp/verification/v1` endpoint but it's not in the swagger we see | Likely separate yaml — ask Walbi |
| **Lighthouse text + reasoning** | Highlights only have core fields — chat-style reasoning may be Lighthouse-specific | Check `highlight:available:v3` model |

**Summary:** ~70% of UI maps cleanly to WALBI API. ~20% needs our own backend service (gamification, settings, Onramper). ~10% needs Walbi to expose more endpoints (KYC, 2FA, deposit addresses).

---

## 4. The auth problem

**Every WALBI endpoint requires auth.** No public read-only routes.

WALBI's auth model (inferred from swagger + walbi-mcp behavior):

```
1. User on Walbi mobile app generates a one-time login code (QR)
2. Some external service exchanges code → access_token + refresh_token
3. REST: send `Authorization: Bearer <access_token>` header
4. WS: open socket, immediately send event 1 `auth:login:request {access_token}`
5. Token expires (probably 1h) → refresh via internal endpoint we haven't seen
```

**The browser at `exchange.walbi.cfd` cannot do this directly because:**
- No public OAuth client registration for Walbi
- CORS on `gw.walbi.com` almost certainly only allows `app.walbi.com`
- Refresh token storage in browser localStorage is a security smell

### Three viable paths

#### Path A — Proxy backend with QR auth (matches walbi-mcp)

```
Browser → our backend (Node/Go on Hetzner) → gw.walbi.com / ws.walbi.com
                ↑
         User-scoped session cookie
                ↑
         Auth flow: backend generates QR → user scans in Walbi app → token landed
```

- **Pros:** secure (no token in browser), works for unlimited users, CORS not an issue, can persist tokens server-side
- **Cons:** need to run a backend (Node-Express or Go-Fiber, small), session storage, WS pass-through
- **Effort:** ~1 day for backend skeleton + auth, ~2 days to proxy all 70 REST + WS pass-through with auth injection
- **This is what walbi-mcp itself does** — we'd basically expose walbi-mcp's functions over HTTP

#### Path B — Single-user mode (your token in env)

```
You log into app.walbi.com → copy your JWT from devtools → paste into our env
Frontend uses that token directly (or backend uses it for all calls)
```

- **Pros:** zero new code beyond reading env var
- **Cons:** only you can use it, token expires (1h?), need refresh
- **Effort:** ~2 hours
- **Use for:** rapid prototyping the integration before building auth properly

#### Path C — Read-only public view via screen scraping

Doesn't work — no public endpoints.

### Recommendation

**Start with Path B today** to prove the integration works end-to-end (live ticker, real positions for your account). Then build Path A as Phase 4.5 for multi-user.

---

## 5. Concrete next steps

### Phase 4.1 — Schema sync (now, ~1 hour)

Replace `src/lib/mock/types.ts` with TypeScript types **generated from the real swagger**. Use `openapi-typescript` against the two swagger files (`narnia.gateway.yaml`, `cerberus.yaml`) — that gets us `AgentV1`, `MemepoolTokenV1`, `APIDeal`, `Tick`, `Orders`, etc. with zero hand-typing risk.

### Phase 4.2 — WS client rewrite (~2 hours)

`src/lib/api/ws.ts` is currently a thin wrapper. Real cerberus needs:
1. Auth-first: open → send event 1 `auth:login:request` → wait for response → then user code can subscribe
2. `changes:subscribe` multiplexer — single sub for many push event_ids at once
3. UUID correlation table for request/response matching
4. Reconnect on `connection:closing` (event 220)
5. Per-subscription ref-counting (so two components subscribed to same pair share one server-side sub)

### Phase 4.3 — Auth flow (Path B, ~2 hours)

1. Add settings panel to paste your `access_token`
2. Store in localStorage + use in `Authorization` header
3. Add a refresh mechanism (catch 401 → try `auth_login_wait` flow or just prompt re-paste)

### Phase 4.4 — Wire one slice end-to-end (~3 hours)

Pick **Trade page** as proof:
1. REST `user/profile` on load (show real name in ProfilePanel)
2. WS subscribe `fx:instrument:change:v2` → real PAIRS list
3. WS `fx:ticks:subscribe` for current pair → live tick in PairStrip header
4. WS `fx:candles:history` then `fx:candles:subscribe` → real chart
5. WS `fx:market:subscribe` → real order book
6. WS `fx:deals:opening` → real OrderForm submit
7. WS subscribe `fx:deals:open` etc. → real positions table

If this slice works end-to-end with your token, the remaining routes are mechanical: each one swaps `const data = MOCK_FOO` → `const {data} = useQuery({queryKey, queryFn: api.foo.bar})`.

### Phase 4.5 — Path A backend + multi-user (next sprint)

Build the proxy backend. Standalone repo `walbi-exchange-proxy`. Node-Express or Go-Fiber. ~1 day.

---

## 6. Open questions for Walbi team

If we can ping them:

1. Is there an OAuth client registration flow for external integrations?
2. Where's the `crisp/verification/v1` endpoint? (Mentioned in audit but not in swagger.)
3. Where's the deposit address endpoint? (Need for crypto deposit modal.)
4. Where's withdrawal initiation? (REST or WS?)
5. CORS policy on `gw.walbi.com` — what origins?
6. Token refresh endpoint?
7. Lighthouse "highlight" — what fields/text format for signal description?
8. KYC start flow?

If they're cool with us building on top, the proxy backend (Path A) can be a clean integration. If they're not, we stay single-user (Path B) for our own use.
