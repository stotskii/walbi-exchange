/**
 * Thin REST client targeting the WALBI MCP backend.
 *
 * All endpoints are POST-RPC versioned: `/api/<domain>/<action>/v<n>`.
 * We send a single JSON body and expect a single JSON response.
 *
 * Auth: bearer token from localStorage (set after login flow).
 */

const GATEWAY =
  import.meta.env.VITE_WALBI_GATEWAY ?? "https://gw.walbi.com";

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

export async function rpc<TReq, TRes>(
  domain: string,
  action: string,
  version: number,
  body: TReq,
  init?: RequestInit,
): Promise<TRes> {
  const url = `${GATEWAY}/api/${domain}/${action}/v${version}`;
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("walbi:token")
      : null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text();
    }
    throw new ApiError(res.status, `RPC ${domain}/${action} v${version} failed`, errBody);
  }

  return (await res.json()) as TRes;
}

/**
 * Typed shortcut helpers. Add domain-specific ones as features land.
 * Keeping them collocated with their corresponding query hooks keeps the
 * cache surface obvious.
 */
export const api = {
  user: {
    profile: () => rpc<Record<string, never>, unknown>("user", "profile", 1, {}),
  },
  agent: {
    listIds: () => rpc<Record<string, never>, unknown>("agent", "list/ids", 1, {}),
    sessionList: () => rpc<Record<string, never>, unknown>("agent", "session/list", 1, {}),
  },
  balance: {
    operationUpList: () =>
      rpc<Record<string, never>, unknown>("balance", "operation/up/list", 1, {}),
  },
  memepool: {
    tokenList: () =>
      rpc<Record<string, never>, unknown>("memepool", "token/list", 1, {}),
  },
};
