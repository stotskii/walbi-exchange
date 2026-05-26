/**
 * Cerberus WebSocket client for wss://ws.walbi.com/otp.
 *
 * Wire format (single multiplexed connection):
 *   Outgoing:  [{ e: <event_id>, t: 2, uuid: <correlation>, d: <payload> }]
 *   Response:  [{ e: <same_id>, t: 1, uuid: <same_uuid>, d: <response> }]
 *   Push:      [{ e: <event_id>, t: 3, d: <payload> }]
 *
 * Flow:
 *   1. connect → wait for OPEN
 *   2. send auth:login:request with current access_token (event 1)
 *   3. wait for response — only then can other events fire
 *   4. components call subscribePush(eventId, cb) which internally bundles
 *      requested ids into one changes:subscribe (98) request
 *   5. components call request(eventId, payload) for one-shot REQ/RES
 *   6. on connection:closing (220) or socket close → reconnect with backoff
 *      and re-establish subscriptions
 */

import {WS_EVENT} from "./walbi-types";
import {getAccessToken} from "./rest";

interface WireFrame<T = unknown> {
  e: number;
  t: 1 | 2 | 3;
  uuid?: string;
  d?: T;
}

type PushListener<T = unknown> = (data: T) => void;

const ENDPOINT = import.meta.env.VITE_WALBI_WS ?? "wss://ws.walbi.com/otp";

class WalbiSocket {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private authPromise: Promise<void> | null = null;
  private backoffMs = 500;
  private intentional = false;

  /** Pending REQ/RES correlation by uuid */
  private pending = new Map<string, {resolve: (v: unknown) => void; reject: (e: Error) => void; timer: number}>();

  /** Push event listeners — many per event_id */
  private listeners = new Map<number, Set<PushListener>>();

  /** Server push subscriptions we should re-establish on reconnect */
  private activeSubs = new Set<number>();

  private outbox: string[] = [];

  // --- Connection lifecycle ---------------------------------------------

  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.intentional = false;
      const ws = new WebSocket(ENDPOINT);

      ws.addEventListener("open", () => {
        this.backoffMs = 500;
        this.connectPromise = null;
        // flush queued sends only AFTER auth completes
        resolve();
      });

      ws.addEventListener("message", (ev) => this.onMessage(ev.data));

      ws.addEventListener("close", () => {
        this.ws = null;
        this.connectPromise = null;
        this.authPromise = null;
        // fail all pending requests
        for (const p of this.pending.values()) {
          window.clearTimeout(p.timer);
          p.reject(new Error("WS closed"));
        }
        this.pending.clear();
        if (this.intentional) return;
        window.setTimeout(() => this.reconnect(), this.backoffMs);
        this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
      });

      ws.addEventListener("error", () => {
        // close handler will retry
        try { ws.close(); } catch {}
      });

      this.ws = ws;
      // safety timeout for the open event
      window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error("WS open timeout"));
        }
      }, 10_000);
    });

    return this.connectPromise;
  }

  private async reconnect(): Promise<void> {
    try {
      await this.connect();
      await this.authenticate();
      // re-subscribe everything we had
      if (this.activeSubs.size > 0) {
        await this.sendRaw({e: WS_EVENT.CHANGES_SUBSCRIBE.id, t: 2, uuid: rid(), d: [...this.activeSubs]});
      }
    } catch (err) {
      console.warn("WS reconnect failed", err);
    }
  }

  /** Send auth:login:request with the current access_token */
  private async authenticate(): Promise<void> {
    if (this.authPromise) return this.authPromise;
    const token = getAccessToken();
    if (!token) throw new Error("No access token — call setAccessToken() first");

    this.authPromise = this.request(WS_EVENT.AUTH_LOGIN.id, {access_token: token}, {skipAuth: true})
      .then(() => undefined);
    return this.authPromise;
  }

  // --- Frame I/O ---------------------------------------------------------

  private async sendRaw(frame: WireFrame): Promise<void> {
    const payload = JSON.stringify([frame]);
    await this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.outbox.push(payload);
    }
  }

  private onMessage(raw: string): void {
    let frames: WireFrame[];
    try {
      frames = JSON.parse(raw);
    } catch {
      return; // tolerate non-JSON
    }

    for (const f of frames) {
      // response to a REQ
      if (f.t === 1 && f.uuid && this.pending.has(f.uuid)) {
        const p = this.pending.get(f.uuid)!;
        window.clearTimeout(p.timer);
        this.pending.delete(f.uuid);
        p.resolve(f.d);
        continue;
      }

      // push to listeners
      const subs = this.listeners.get(f.e);
      if (subs) {
        for (const cb of subs) {
          try {
            cb(f.d);
          } catch (err) {
            console.error("WS listener threw", err);
          }
        }
      }

      // server told us to reconnect
      if (f.e === WS_EVENT.CONNECTION_CLOSING.id) {
        try { this.ws?.close(); } catch {}
      }
    }
  }

  // --- Public API --------------------------------------------------------

  /** One-shot REQ/RES. Auto-authenticates first unless skipAuth=true. */
  async request<TReq = unknown, TRes = unknown>(
    eventId: number,
    payload?: TReq,
    opts: {timeoutMs?: number; skipAuth?: boolean} = {},
  ): Promise<TRes> {
    if (!opts.skipAuth) await this.authenticate();

    const uuid = rid();
    const frame: WireFrame<TReq> = {e: eventId, t: 2, uuid, d: payload};

    return new Promise<TRes>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(uuid);
        reject(new Error(`WS request ${eventId} timeout`));
      }, opts.timeoutMs ?? 15_000);

      this.pending.set(uuid, {resolve: resolve as (v: unknown) => void, reject, timer});
      this.sendRaw(frame as WireFrame).catch((err) => {
        window.clearTimeout(timer);
        this.pending.delete(uuid);
        reject(err);
      });
    });
  }

  /**
   * Subscribe to a push event_id. Returns unsubscribe fn. Multiple listeners
   * on the same id share one server-side subscription via ref-counting.
   */
  subscribePush<T = unknown>(eventId: number, listener: PushListener<T>): () => void {
    let set = this.listeners.get(eventId);
    if (!set) {
      set = new Set();
      this.listeners.set(eventId, set);
    }
    set.add(listener as PushListener);

    // first listener for this id — open server-side sub
    if (set.size === 1 && !this.activeSubs.has(eventId)) {
      this.activeSubs.add(eventId);
      void this.authenticate().then(() =>
        this.sendRaw({e: WS_EVENT.CHANGES_SUBSCRIBE.id, t: 2, uuid: rid(), d: [eventId]}),
      );
    }

    return () => {
      const s = this.listeners.get(eventId);
      if (!s) return;
      s.delete(listener as PushListener);
      if (s.size === 0) {
        this.listeners.delete(eventId);
        this.activeSubs.delete(eventId);
        void this.sendRaw({e: WS_EVENT.CHANGES_UNSUBSCRIBE.id, t: 2, uuid: rid(), d: [eventId]});
      }
    };
  }

  close(): void {
    this.intentional = true;
    try { this.ws?.close(); } catch {}
    this.ws = null;
    this.authPromise = null;
    this.outbox = [];
    this.pending.clear();
    this.listeners.clear();
    this.activeSubs.clear();
  }
}

function rid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const walbiSocket = new WalbiSocket();

// -- Convenience hooks the components will use ----------------------------

export async function subscribeTicker(pair: string, onTick: (tick: import("./walbi-types").SimpleTick) => void) {
  // Subscribe at the server for this pair specifically, then listen to the
  // generic fx:tick:change push and filter by pair.
  await walbiSocket.request(WS_EVENT.FX_TICKS_SUBSCRIBE.id, {pair});
  const off = walbiSocket.subscribePush<import("./walbi-types").SimpleTick>(
    WS_EVENT.FX_TICK_CHANGE.id,
    (t) => { if (t.p === pair) onTick(t); },
  );
  return async () => {
    off();
    await walbiSocket.request(WS_EVENT.FX_TICKS_UNSUBSCRIBE.id, {pair});
  };
}

export async function subscribeOrderBook(
  pair: string,
  scale: 1 | 10 | 100 | 1000,
  onUpdate: (book: import("./walbi-types").OrderBookFrame) => void,
) {
  await walbiSocket.request(WS_EVENT.FX_MARKET_SUBSCRIBE.id, {pair, scale});
  const off = walbiSocket.subscribePush<import("./walbi-types").OrderBookFrame[]>(
    WS_EVENT.FX_MARKET_CHANGE.id,
    (books) => {
      for (const b of books) if (b.p === pair && b.s === scale) onUpdate(b);
    },
  );
  return async () => {
    off();
    await walbiSocket.request(WS_EVENT.FX_MARKET_UNSUBSCRIBE.id, {pair, scale});
  };
}

export async function fetchCandleHistory(
  pair: string,
  size: number,
  limit = 200,
  to?: number,
): Promise<import("./walbi-types").CandleHistoryRes> {
  return walbiSocket.request<unknown, import("./walbi-types").CandleHistoryRes>(
    WS_EVENT.FX_CANDLES_HISTORY.id,
    {pair, size, limit, to, solid: false},
  );
}

export async function openDeal(req: import("./walbi-types").DealOpenReq) {
  return walbiSocket.request<import("./walbi-types").DealOpenReq, import("./walbi-types").APIDeal>(
    WS_EVENT.FX_DEALS_OPENING.id,
    req,
  );
}

export async function closeDeal(deal_id: number) {
  return walbiSocket.request(WS_EVENT.FX_DEALS_CLOSING.id, {id: deal_id});
}

export async function openPredictionDeal(req: import("./walbi-types").PredictionDealOpenReq) {
  return walbiSocket.request<import("./walbi-types").PredictionDealOpenReq, import("./walbi-types").PredictionDeal>(
    WS_EVENT.PREDICTION_DEAL_OPEN.id,
    req,
  );
}

export async function sendChatMessage(req: import("./walbi-types").ChatMessageSendReq) {
  return walbiSocket.request(WS_EVENT.CHAT_MESSAGE_SEND.id, req);
}
