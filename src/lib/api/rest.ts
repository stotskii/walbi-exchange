/**
 * REST client for gw.walbi.com — narnia gateway.
 *
 * All endpoints are POST + JSON body + return JSON. EVERY endpoint requires
 * auth. The bearer token is sent via Authorization header.
 *
 * In direct-mode the browser hits gw.walbi.com directly (will probably hit
 * CORS unless Walbi whitelists exchange.walbi.cfd). In proxy-mode we point at
 * our own backend that injects the token server-side. Toggle via env var.
 *
 * Failed calls throw ApiError so TanStack Query's error states fire.
 */

import type {
  Agent,
  AgentSession,
  AuthProvidersResponse,
  BalanceOperation,
  ChatConversation,
  MemepoolPortfolio,
  MemepoolToken,
  UserProfile,
} from "./walbi-types";

const GATEWAY =
  import.meta.env.VITE_WALBI_GATEWAY ?? "https://gw.walbi.com";

const TOKEN_KEY = "walbi:access_token";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function rpc<TReq, TRes>(
  domain: string,
  action: string,
  version: number,
  body?: TReq,
): Promise<TRes> {
  const url = `${GATEWAY}/api/${domain}/${action}/v${version}`;
  const token = getAccessToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify(body ?? {}),
    credentials: "include", // walbi auth cookie if any
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text();
    }
    throw new ApiError(res.status, `${domain}/${action}/v${version}`, errBody);
  }

  return (await res.json()) as TRes;
}

interface ListResponse<T> {
  list: T[];
  next_cursor?: number;
  next_cursor_id?: number;
}

/**
 * Typed call surface. Add endpoints here as features come online.
 * Naming mirrors the path:  api.agent.list({cursor:0, limit:50})
 */
export const api = {
  user: {
    profile: () => rpc<Record<string, never>, UserProfile>("user", "profile", 1, {}),
  },

  auth: {
    providers: () => rpc<Record<string, never>, AuthProvidersResponse>("auth", "providers", 1, {}),
  },

  agent: {
    list: (cursor = 0, limit = 50) =>
      rpc<{cursor: number; limit: number}, ListResponse<Agent>>("agent", "list", 1, {cursor, limit}),
    get: (slug: string) =>
      rpc<{slug: string}, {agent: Agent}>("agent", "get", 1, {slug}),
    listByIds: (ids: number[]) =>
      rpc<{ids: number[]}, ListResponse<Agent>>("agent", "list/ids", 1, {ids}),
    listBySlugs: (slugs: string[]) =>
      rpc<{slugs: string[]}, ListResponse<Agent>>("agent", "list/slugs", 1, {slugs}),
    mute: (agent_id: number) => rpc("agent", "mute", 1, {agent_id}),
    unmute: (agent_id: number) => rpc("agent", "unmute", 1, {agent_id}),
    mutedList: () => rpc<Record<string, never>, ListResponse<{agent_id: number}>>("agent", "muted/list", 1, {}),

    session: {
      create: (agent_id: number, account_id: number) =>
        rpc("agent", "session/create", 1, {agent_id, account_id}),
      list: () => rpc<Record<string, never>, {list: AgentSession[]}>("agent", "session/list", 1, {}),
      start: (session_id: number) => rpc("agent", "session/start", 1, {session_id}),
      stop: (session_id: number) => rpc("agent", "session/stop", 1, {session_id}),
      saveSettings: (session_id: number, settings: unknown) =>
        rpc("agent", "session/settings/save", 1, {session_id, settings}),
    },
  },

  balance: {
    accountCreate: (currency: string) =>
      rpc<{currency: string}, {account_id: number}>("balance", "account/create", 1, {currency}),
    topUp: (account_id: number, amount: string) =>
      rpc("balance", "top-up", 1, {account_id, amount}),
    operationList: (account_id: number, cursor_id = 0, limit = 50) =>
      rpc<{account_id: number; cursor_id: number; limit: number}, ListResponse<BalanceOperation>>(
        "balance", "operation/up/list", 1, {account_id, cursor_id, limit},
      ),
    operationLastList: (account_id: number, limit = 10) =>
      rpc<{account_id: number; limit: number}, ListResponse<BalanceOperation>>(
        "balance", "operation/last/list", 1, {account_id, limit},
      ),
  },

  trading: {
    accountCreate: (currency: string) =>
      rpc("trading", "balance/account/create", 1, {currency}),
  },

  memepool: {
    tokenList: (chain: "solana" = "solana") =>
      rpc<{chain: string}, {list: MemepoolToken[]}>("memepool", "token/list", 1, {chain}),
    tokenGet: (address: string, chain: "solana" = "solana") =>
      rpc<{address: string; chain: string}, {token: MemepoolToken}>("memepool", "token/get", 1, {address, chain}),
    tokenSearch: (query: string, chain: "solana" = "solana") =>
      rpc<{query: string; chain: string}, {list: MemepoolToken[]}>("memepool", "token/search", 1, {query, chain}),
    portfolio: () =>
      rpc<Record<string, never>, MemepoolPortfolio>("memepool", "portfolio/get", 1, {}),
    buy: (token_address: string, amount_usdt: string, account_id: number) =>
      rpc("memepool", "order/market/buy", 1, {token_address, amount: amount_usdt, account_id}),
    sell: (token_address: string, amount: string, account_id: number) =>
      rpc("memepool", "order/market/sell", 1, {token_address, amount, account_id}),
    orderHistory: (cursor_id = 0, limit = 50) =>
      rpc("memepool", "order/market/history", 1, {cursor_id, limit}),
    limits: (token_address: string) =>
      rpc("memepool", "order/market/limits/get", 1, {token_address}),
    commission: (amount_usdt: string) =>
      rpc("memepool", "commission/get", 1, {amount: amount_usdt}),
  },

  prediction: {
    blockList: (instrument_id: number, from_n?: number, to_n?: number) =>
      rpc("prediction", "block/instrument/list", 1, {instrument_id, from_n, to_n}),
    blockByUid: (uid: string) =>
      rpc("prediction", "block/one/uid", 1, {uid}),
    dealsInBlock: (block_uid: string, cursor?: string, limit = 50) =>
      rpc("prediction", "deal/block/list", 1, {block_uid, cursor, limit}),
    myDealHistory: (cursor?: string, limit = 50) =>
      rpc("prediction", "deal/history/list", 1, {cursor, limit}),
    leaderboardTop: (frame: "day" | "week" | "month" | "all" = "day") =>
      rpc("prediction", "leaderboard/top", 1, {frame}),
  },

  chat: {
    conversationList: () => rpc("chat", "conversation/list", 1, {}),
    metaConversation: () => rpc<Record<string, never>, {conversation: ChatConversation}>("chat", "conversation/meta/get", 1, {}),
    messageList: (conversation_uid: string, cursor?: string, limit = 50) =>
      rpc("chat", "message/list", 1, {conversation_uid, cursor, limit}),
    suggestionList: (conversation_uid: string) =>
      rpc("chat", "suggestion/list", 1, {conversation_uid}),
    clearConversation: (conversation_uid: string) =>
      rpc("chat", "conversation/clear", 1, {conversation_uid}),
    deleteConversation: (conversation_uid: string) =>
      rpc("chat", "conversation/delete", 1, {conversation_uid}),
  },

  history: {
    fxDeal: (id: number) => rpc("history", "deal/fx", 1, {id}),
    fxDeals: (account_id: number, cursor?: string, limit = 50) =>
      rpc("history", "deals/fx", 1, {account_id, cursor, limit}),
    fxOrders: (account_id: number, cursor?: string, limit = 50) =>
      rpc("history", "orders/fx", 1, {account_id, cursor, limit}),
  },

  instruments: {
    fxChanges: (since?: number) => rpc("instrument", "changes/fx", 1, {since}),
  },

  constraints: {
    dealLimits: (pair: string) => rpc("constraints", "deals/limits", 1, {pair}),
  },

  autotrading: {
    sessionStart: (agent_id: number, account_id: number) =>
      rpc("autotrading", "session/start", 1, {agent_id, account_id}),
    sessionStop: (session_id: number) =>
      rpc("autotrading", "session/stop", 1, {session_id}),
    sessionGet: (session_id: number) =>
      rpc("autotrading", "session/get", 1, {session_id}),
    sessionByUser: () => rpc("autotrading", "session/user/get", 1, {}),
  },

  partner: {
    balance: () => rpc("partner", "balance", 1, {}),
    referralList: (cursor?: string, limit = 50) =>
      rpc("api/external/partner", "referral/list", 1, {cursor, limit}),
    dailyAccrual: (date_from?: number, date_to?: number) =>
      rpc("api/external/partner", "accrual/daily/list", 1, {date_from, date_to}),
  },
};
