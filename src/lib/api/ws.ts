/**
 * Single multiplexed WebSocket to wss://ws.walbi.com/otp.
 *
 * Wire format (observed during audit):
 *   [{ e: <event_code>, t: <type>, uuid: <correlation_id>, d: <payload> }]
 *
 *   t = 1 response, 2 request, 3 system/ack
 *   uuid = short correlation id (7 chars) for request↔response matching
 *
 * Event codes:
 *   1002 ticker tick           (recv)
 *   1004 candles               (send request / recv batch)
 *   1009 pair heartbeat        (recv)
 *   1010 ticker subscribe      (send / recv ack)
 *   1011 orderbook subscribe   (send / recv ack)
 *   1013 orderbook scale       (send)
 *   1014 unsubscribe pair      (send)
 *
 * Client owns subscription lifecycle: subscribe on mount, unsubscribe on
 * unmount or pair swap. The socket itself is shared across the whole app to
 * avoid wasteful reconnects.
 */

type EventCode = 1002 | 1004 | 1009 | 1010 | 1011 | 1013 | 1014;

interface WireFrame {
  e: EventCode;
  t: 1 | 2 | 3;
  uuid?: string;
  d?: unknown;
}

type Listener = (frame: WireFrame) => void;

const ENDPOINT =
  import.meta.env.VITE_WALBI_WS ?? "wss://ws.walbi.com/otp";

class WalbiSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private outbox: string[] = [];
  private backoffMs = 500;
  private connectPromise: Promise<void> | null = null;
  private intentionalClose = false;

  private async ensureOpen(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise<void>((resolve) => {
      this.intentionalClose = false;
      const ws = new WebSocket(ENDPOINT);
      ws.binaryType = "arraybuffer";

      ws.addEventListener("open", () => {
        this.backoffMs = 500;
        // flush queued sends
        for (const payload of this.outbox) ws.send(payload);
        this.outbox = [];
        this.connectPromise = null;
        resolve();
      });

      ws.addEventListener("message", (ev) => {
        try {
          const data: WireFrame[] = JSON.parse(ev.data as string);
          for (const frame of data) {
            for (const l of this.listeners) l(frame);
          }
        } catch {
          // tolerate malformed frames
        }
      });

      ws.addEventListener("close", () => {
        this.ws = null;
        this.connectPromise = null;
        if (this.intentionalClose) return;
        // exponential backoff w/ cap
        setTimeout(() => void this.ensureOpen(), this.backoffMs);
        this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
      });

      ws.addEventListener("error", () => {
        // close handler will re-connect
        ws.close();
      });

      this.ws = ws;
    });

    return this.connectPromise;
  }

  /** Send a single frame (auto-wrapped into the array envelope). */
  async send(frame: Omit<WireFrame, "uuid"> & {uuid?: string}): Promise<void> {
    const payload = JSON.stringify([frame]);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return;
    }
    this.outbox.push(payload);
    await this.ensureOpen();
  }

  /** Listen to all incoming frames. Returns an unsubscribe fn. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // ensure socket is up the moment somebody starts listening
    void this.ensureOpen();
    return () => {
      this.listeners.delete(listener);
    };
  }

  close(): void {
    this.intentionalClose = true;
    this.ws?.close();
    this.ws = null;
    this.outbox = [];
  }
}

export const walbiSocket = new WalbiSocket();

/** Helper: subscribe to a pair's ticker stream and get auto-cleanup. */
export function subscribeTicker(pair: string, onTick: (data: unknown) => void) {
  const uuid = Math.random().toString(36).slice(2, 9);
  void walbiSocket.send({e: 1010, t: 2, uuid, d: [{pair}]});

  const off = walbiSocket.subscribe((frame) => {
    if (frame.e === 1002 && Array.isArray(frame.d)) {
      for (const tick of frame.d as Array<{p: string}>) {
        if (tick.p === pair) onTick(tick);
      }
    }
  });

  return () => {
    void walbiSocket.send({e: 1014, t: 2, d: [{pair}]});
    off();
  };
}
