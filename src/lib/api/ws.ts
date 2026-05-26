/**
 * WebSocket client for our BFF at wss://exchange.walbi.cfd/ws.
 *
 * BFF envelope (matches walbi-exchange-proxy/src/ws-proxy.ts):
 *   client → server:
 *     {type:"request", uuid, event_name, data}
 *     {type:"subscribe", event_names: string[]}
 *     {type:"unsubscribe", event_names: string[]}
 *     {type:"ping"}
 *
 *   server → client:
 *     {type:"response", uuid, event_name, data, error?}
 *     {type:"push", event_id, event_name, ts?, data}
 *     {type:"ack", action, count}
 *     {type:"error", message, uuid?}
 *     {type:"pong"}
 *
 * Push events arrive ~5s polled (BFF uses walbi-mcp ws_subscribe windows).
 * Auto-reconnect with exponential backoff; subscriptions are re-established.
 */

import {WS_EVENT} from "./walbi-types";

interface OutFrame {
  type: "request" | "subscribe" | "unsubscribe" | "ping";
  uuid?: string;
  event_name?: string;
  event_names?: string[];
  data?: unknown;
}

interface InFrame {
  type: "response" | "push" | "ack" | "error" | "pong";
  uuid?: string;
  event_name?: string;
  event_id?: number;
  ts?: number;
  data?: unknown;
  error?: unknown;
  message?: string;
  action?: string;
  count?: number;
}

type PushListener = (data: unknown, ts?: number) => void;

const ENDPOINT = (() => {
  if (typeof window === "undefined") return "wss://exchange.walbi.cfd/ws";
  const env = import.meta.env.VITE_WALBI_BFF_WS;
  if (env) return env;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
})();

class BFFSocket {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private backoffMs = 500;
  private intentional = false;

  private pending = new Map<
    string,
    {resolve: (v: unknown) => void; reject: (e: Error) => void; timer: number}
  >();

  /** event_name → set of listeners */
  private listeners = new Map<string, Set<PushListener>>();
  /** event_names actively subscribed on the server */
  private activeSubs = new Set<string>();
  /** outbox while socket is opening */
  private outbox: string[] = [];

  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.intentional = false;
      const ws = new WebSocket(ENDPOINT);

      const safetyTimer = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          reject(new Error("WS open timeout"));
        }
      }, 10_000);

      ws.addEventListener("open", () => {
        window.clearTimeout(safetyTimer);
        this.backoffMs = 500;
        this.connectPromise = null;
        // flush outbox
        for (const payload of this.outbox) ws.send(payload);
        this.outbox = [];
        // re-establish subscriptions
        if (this.activeSubs.size > 0) {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              event_names: [...this.activeSubs],
            } satisfies OutFrame),
          );
        }
        resolve();
      });

      ws.addEventListener("message", (ev) => this.onMessage(ev.data as string));

      ws.addEventListener("close", () => {
        window.clearTimeout(safetyTimer);
        this.ws = null;
        this.connectPromise = null;
        for (const p of this.pending.values()) {
          window.clearTimeout(p.timer);
          p.reject(new Error("WS closed"));
        }
        this.pending.clear();
        if (this.intentional) return;
        window.setTimeout(() => void this.connect(), this.backoffMs);
        this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
      });

      ws.addEventListener("error", () => {
        try {
          ws.close();
        } catch {
          // ignore
        }
      });

      this.ws = ws;
    });

    return this.connectPromise;
  }

  private async sendRaw(frame: OutFrame): Promise<void> {
    const payload = JSON.stringify(frame);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.outbox.push(payload);
      await this.connect();
    }
  }

  private onMessage(raw: string): void {
    let frame: InFrame;
    try {
      frame = JSON.parse(raw) as InFrame;
    } catch {
      return;
    }

    if (frame.type === "response" && frame.uuid && this.pending.has(frame.uuid)) {
      const p = this.pending.get(frame.uuid)!;
      window.clearTimeout(p.timer);
      this.pending.delete(frame.uuid);
      if (frame.error) {
        p.reject(new Error(typeof frame.error === "string" ? frame.error : JSON.stringify(frame.error)));
      } else {
        p.resolve(frame.data);
      }
      return;
    }

    if (frame.type === "push" && frame.event_name) {
      const subs = this.listeners.get(frame.event_name);
      if (subs) {
        for (const cb of subs) {
          try {
            cb(frame.data, frame.ts);
          } catch (err) {
            console.error("WS listener threw", err);
          }
        }
      }
      return;
    }

    if (frame.type === "error") {
      console.warn("BFF WS error:", frame.message);
      if (frame.uuid && this.pending.has(frame.uuid)) {
        const p = this.pending.get(frame.uuid)!;
        window.clearTimeout(p.timer);
        this.pending.delete(frame.uuid);
        p.reject(new Error(frame.message ?? "WS error"));
      }
    }
  }

  /** REQ/RES — single round-trip. */
  async request<TReq = unknown, TRes = unknown>(
    event_name: string,
    data?: TReq,
    opts: {timeoutMs?: number} = {},
  ): Promise<TRes> {
    const uuid = rid();
    return new Promise<TRes>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(uuid);
        reject(new Error(`WS request ${event_name} timeout`));
      }, opts.timeoutMs ?? 20_000);
      this.pending.set(uuid, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      void this.sendRaw({type: "request", uuid, event_name, data}).catch((err) => {
        window.clearTimeout(timer);
        this.pending.delete(uuid);
        reject(err as Error);
      });
    });
  }

  /** Subscribe to one push event_name. Returns unsubscribe fn. Ref-counted. */
  subscribePush<T = unknown>(event_name: string, listener: PushListener): () => void {
    let set = this.listeners.get(event_name);
    if (!set) {
      set = new Set();
      this.listeners.set(event_name, set);
    }
    set.add(listener as PushListener);

    if (set.size === 1 && !this.activeSubs.has(event_name)) {
      this.activeSubs.add(event_name);
      void this.sendRaw({type: "subscribe", event_names: [event_name]});
    }

    // ensure socket is up
    void this.connect();

    return () => {
      const s = this.listeners.get(event_name);
      if (!s) return;
      s.delete(listener as PushListener);
      if (s.size === 0) {
        this.listeners.delete(event_name);
        this.activeSubs.delete(event_name);
        void this.sendRaw({type: "unsubscribe", event_names: [event_name]});
      }
    };
    void ({} as T); // type marker
  }

  close(): void {
    this.intentional = true;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
    this.outbox = [];
    this.pending.clear();
    this.listeners.clear();
    this.activeSubs.clear();
  }
}

function rid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const walbiSocket = new BFFSocket();

// -- High-level helpers (named for what they DO, not what event they use) --

import type {
  SimpleTick,
  OrderBookFrame,
  CandleHistoryRes,
  DealOpenReq,
  APIDeal,
  PredictionDealOpenReq,
  PredictionDeal,
  PredictionBlock,
  ChatMessageSendReq,
  ChatMessage,
  BalanceFrame,
} from "./walbi-types";

export async function subscribeTicker(
  pair: string,
  onTick: (t: SimpleTick) => void,
): Promise<() => Promise<void>> {
  await walbiSocket.request(WS_EVENT.FX_TICKS_SUBSCRIBE.name, {pair});
  const off = walbiSocket.subscribePush<SimpleTick>(WS_EVENT.FX_TICK_CHANGE.name, (data) => {
    const tick = data as SimpleTick;
    if (tick?.p === pair) onTick(tick);
  });
  return async () => {
    off();
    try {
      await walbiSocket.request(WS_EVENT.FX_TICKS_UNSUBSCRIBE.name, {pair});
    } catch {
      // ignore unsub failures
    }
  };
}

export async function subscribeOrderBook(
  pair: string,
  scale: 1 | 10 | 100 | 1000,
  onUpdate: (book: OrderBookFrame) => void,
): Promise<() => Promise<void>> {
  await walbiSocket.request(WS_EVENT.FX_MARKET_SUBSCRIBE.name, {pair, scale});
  const off = walbiSocket.subscribePush<OrderBookFrame[]>(WS_EVENT.FX_MARKET_CHANGE.name, (data) => {
    const books = data as OrderBookFrame[];
    if (!Array.isArray(books)) return;
    for (const b of books) {
      if (b?.p === pair && b?.s === scale) onUpdate(b);
    }
  });
  return async () => {
    off();
    try {
      await walbiSocket.request(WS_EVENT.FX_MARKET_UNSUBSCRIBE.name, {pair, scale});
    } catch {
      // ignore
    }
  };
}

export async function fetchCandleHistory(
  pair: string,
  size: number,
  limit = 200,
  to?: number,
): Promise<CandleHistoryRes> {
  return walbiSocket.request<unknown, CandleHistoryRes>(WS_EVENT.FX_CANDLES_HISTORY.name, {
    pair,
    size,
    limit,
    to,
    solid: false,
  });
}

export async function openDeal(req: DealOpenReq): Promise<APIDeal> {
  return walbiSocket.request<DealOpenReq, APIDeal>(WS_EVENT.FX_DEALS_OPENING.name, req);
}

export async function closeDeal(deal_id: number): Promise<unknown> {
  return walbiSocket.request(WS_EVENT.FX_DEALS_CLOSING.name, {id: deal_id});
}

export async function openPredictionDeal(req: PredictionDealOpenReq): Promise<PredictionDeal> {
  return walbiSocket.request<PredictionDealOpenReq, PredictionDeal>(
    WS_EVENT.PREDICTION_DEAL_OPEN.name,
    req,
  );
}

export async function sendChatMessage(req: ChatMessageSendReq): Promise<unknown> {
  return walbiSocket.request(WS_EVENT.CHAT_MESSAGE_SEND.name, req);
}

export function subscribeBalanceChanges(cb: (b: BalanceFrame) => void): () => void {
  return walbiSocket.subscribePush<BalanceFrame>(WS_EVENT.BALANCE_CHANGE.name, (data) =>
    cb(data as BalanceFrame),
  );
}

export function subscribeDealEvents(cb: (deal: APIDeal, eventName: string) => void): () => void {
  const offs = [
    walbiSocket.subscribePush<APIDeal>(WS_EVENT.FX_DEALS_OPEN.name, (d) =>
      cb(d as APIDeal, WS_EVENT.FX_DEALS_OPEN.name),
    ),
    walbiSocket.subscribePush<APIDeal>(WS_EVENT.FX_DEALS_CLOSED.name, (d) =>
      cb(d as APIDeal, WS_EVENT.FX_DEALS_CLOSED.name),
    ),
    walbiSocket.subscribePush<APIDeal>(WS_EVENT.FX_DEALS_CHANGE.name, (d) =>
      cb(d as APIDeal, WS_EVENT.FX_DEALS_CHANGE.name),
    ),
    walbiSocket.subscribePush<APIDeal>(WS_EVENT.FX_DEALS_PROCEED_MIN.name, (d) =>
      cb(d as APIDeal, WS_EVENT.FX_DEALS_PROCEED_MIN.name),
    ),
  ];
  return () => offs.forEach((o) => o());
}

export function subscribePredictionUpdates(callbacks: {
  onBlockSnapshot?: (block: PredictionBlock) => void;
  onBlockUpdate?: (partial: Partial<PredictionBlock> & {uid: string}) => void;
  onDealUpdate?: (deal: PredictionDeal) => void;
}): () => void {
  const offs: Array<() => void> = [];
  if (callbacks.onBlockSnapshot) {
    offs.push(
      walbiSocket.subscribePush<PredictionBlock>(
        WS_EVENT.PREDICTION_BLOCK_SNAPSHOT.name,
        (d) => callbacks.onBlockSnapshot!(d as PredictionBlock),
      ),
    );
  }
  if (callbacks.onBlockUpdate) {
    offs.push(
      walbiSocket.subscribePush<Partial<PredictionBlock> & {uid: string}>(
        WS_EVENT.PREDICTION_BLOCK_UPDATE.name,
        (d) => callbacks.onBlockUpdate!(d as Partial<PredictionBlock> & {uid: string}),
      ),
    );
  }
  if (callbacks.onDealUpdate) {
    offs.push(
      walbiSocket.subscribePush<PredictionDeal>(
        WS_EVENT.PREDICTION_DEAL_UPDATE.name,
        (d) => callbacks.onDealUpdate!(d as PredictionDeal),
      ),
    );
  }
  return () => offs.forEach((o) => o());
}

export function subscribeChatMessages(cb: (msg: ChatMessage) => void): () => void {
  return walbiSocket.subscribePush<ChatMessage>(WS_EVENT.CHAT_MESSAGE_UPDATE.name, (d) =>
    cb(d as ChatMessage),
  );
}

export function subscribeNotifications(
  cb: (n: unknown, eventName: string) => void,
): () => void {
  const offs = [
    walbiSocket.subscribePush(WS_EVENT.NOTIFICATION_NEW.name, (d) =>
      cb(d, WS_EVENT.NOTIFICATION_NEW.name),
    ),
    walbiSocket.subscribePush(WS_EVENT.NOTIFICATION_DELETE.name, (d) =>
      cb(d, WS_EVENT.NOTIFICATION_DELETE.name),
    ),
  ];
  return () => offs.forEach((o) => o());
}

export function subscribeSignals(cb: (sig: unknown) => void): () => void {
  return walbiSocket.subscribePush(WS_EVENT.HIGHLIGHT_AVAILABLE_V3.name, cb);
}

export function subscribeInstrumentChanges(cb: (data: unknown) => void): () => void {
  return walbiSocket.subscribePush(WS_EVENT.FX_INSTRUMENT_CHANGE.name, cb);
}
