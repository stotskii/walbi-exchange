// Real WALBI API types — synced from narnia.gateway.yaml + cerberus.yaml via
// the walbi-mcp swagger introspection. Update these if the underlying API
// changes. Hand-typed for now because we don't have openapi-typescript wired,
// but field names + types match the actual schemas one-to-one.

// =============================================================================
// REST — gw.walbi.com/api/<domain>/<action>/v<n>  (POST only, all require auth)
// =============================================================================

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  user_id: number;
  wallet_address: string;
}

export interface AuthProvider {
  email: string;
  name: string;
  picture: string;
  provider: string; // "google", "apple", "telegram", ...
}

export interface AuthProvidersResponse {
  user_id: number;
  oauths: AuthProvider[];
  wallets: Array<{address: string}>;
}

export interface Agent {
  id: number;
  slug: string;
  name: string;
  summary: string;
  ton_of_voice: string;
  image: string;
  author_user_id: number;
  risk_level: "low" | "moderate" | "high";
  trading_mode: "single" | "dca";
  visibility: "public" | "private";
  instruments: string[];
  max_leverage: number;
  min_free_margin: string;
  actions: string[];
  created_at: number;
  updated_at: number;
  version: number;
  statistics: AgentStatistics;
  settings?: AgentSettings;
}

export interface AgentStatistics {
  apr?: number;
  roi_7d?: number;
  roi_14d?: number;
  roi_30d?: number;
  users: number;
  volume_usd: string;
  history: {
    roi_7d: Array<{date: number; value: number}>;
    roi_14d: Array<{date: number; value: number}>;
    roi_30d: Array<{date: number; value: number}>;
  };
}

export interface AgentSettings {
  instruments?: AgentSettingsSelectField;
  signals?: AgentSettingsSelectField;
  leverage?: AgentSettingsSliderField;
  max_open_positions?: AgentSettingsSliderField;
}

export interface AgentSettingsSelectField {
  title: string;
  description: string;
  options: Array<{label: string; value: string}>;
  selected: string[];
  min: number;
  max: number; // 0 = unlimited
}

export interface AgentSettingsSliderField {
  title: string;
  description: string;
  min: string;
  max: string;
  step: string;
  value: string;
}

export interface AgentSession {
  id: number;
  user_id: number;
  agent_id: number;
  account_id: number;
  conversation_uid: string;
  status: "stopped" | "started";
  stop_reason?: "initial" | "manual" | "liquidation";
  realized_pnl: string;
  total_realized_pnl: string;
  commission: string;
  swap_commission: string;
  total_commission: string;
  settings?: AgentSettingsValues;
  created_at: number;
  updated_at: number;
  started_at?: number;
  stopped_at?: number;
}

export interface AgentSettingsValues {
  instruments?: string[];
  signals?: string[];
  leverage?: number;
  max_open_positions?: number;
}

export type BalanceOpType =
  | "billing" | "voucher" | "ourpay" | "reward"
  | "knx_deposit" | "referral_reward" | "mining"
  | "xray_report_purchase" | "memepool_market_order"
  | "partner_withdrawal" | "spot_swap_in" | "spot_swap_out";

export interface BalanceOperation {
  id: number;
  op_id: number;
  account_id: number;
  amount: string;
  currency: string;
  time: number;
  type: BalanceOpType;
  deposit?: DepositInfo;
  knx_deposit?: KNXDepositInfo;
  voucher?: VoucherInfo;
  reward?: unknown;
  ourpay?: unknown;
}

export interface DepositInfo {
  id: number;
  account_id: number;
  currency: string;
  amount: string;
  amount_usd: string;
  network: string;
  address_target: string;
  transaction_id: string;
  confirmation_current: number;
  confirmation_target: number;
  status: "pending" | "success" | "failed";
  created: number;
  updated: number;
}

export interface KNXDepositInfo {
  id: number;
  uuid: string;
  account_id: number;
  user_id: number;
  amount: string;
  amount_usd: string;
  currency: string;
  redirect_url: string;
  status: "pending" | "success" | "failed";
  created_at: number;
  updated_at: number;
}

export interface VoucherInfo {
  id: number;
  title: string;
  description: string;
  currency: string;
  amount: string;
  accrued_amount: string;
  accrued_amount_usd: string;
  commission_return_rate: number;
  activate_deadline_dt: number;
  claim_deadline_dt: number;
  status: "new" | "activated" | "claimed" | "paid" | "expired" | "deleted";
  created_at: number;
}

export interface MemepoolToken {
  address: string;
  chain: "solana"; // currently only Solana
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  price: string;
  price_24h_change_percent: number;
  market_cap: number;
  volume_24h_usd: number;
  holders: number;
  verified: boolean;
  buy_available: boolean;
  sell_available: boolean;
  trade_available: boolean;
  categories: Array<{code: string; name: string; emoji: string}>;
}

export interface MemepoolPortfolioBalance {
  token: {
    address: string;
    chain: string;
    symbol: string;
    name: string;
    icon: string;
    verified: boolean;
  };
  amount: string;
  amount_usd: string;
  average_price: string;
  unrealized_pnl_usd: string;
  unrealized_pnl_percent: number;
}

export interface MemepoolPortfolio {
  list: MemepoolPortfolioBalance[];
  total_amount_usd: string;
  total_unrealized_pnl_usd: string;
  total_unrealized_pnl_percent: number;
}

export interface ChatConversation {
  conversation_uid: string;
  summary?: string;
  users: Array<{id: number; role: "user" | "agent"}>;
  created_at: number;
}

// =============================================================================
// WS — wss://ws.walbi.com/otp  (cerberus)
//
// Envelope: [{ e: <event_id>, t: <1=res|2=req|3=ack>, uuid: <correlation>, d: <data> }]
// Codes are the integer id; cerberus also accepts/sends string event_name in
// some encodings — we use id+name pair to be safe.
// =============================================================================

export const WS_EVENT = {
  // Auth
  AUTH_LOGIN: {id: 1, name: "auth:login:request"},
  AUTH_LOGOUT_REQ: {id: 2, name: "auth:logout:request"},
  AUTH_LOGOUT_PUSH: {id: 2, name: "auth:logout"},

  // Multiplexed sub
  CHANGES_SUBSCRIBE: {id: 98, name: "changes:subscribe"},
  CHANGES_UNSUBSCRIBE: {id: 99, name: "changes:unsubscribe"},

  // Balance
  BALANCE_ACCOUNT_LIST: {id: 153, name: "balance_account:list"},
  BALANCE_CHANGE: {id: 55, name: "balance:change:v3"},
  BALANCE_ACCOUNT_CREATED: {id: 150, name: "balance_account:created"},
  BALANCE_ACCOUNT_UPDATED: {id: 151, name: "balance_account:updated"},
  BALANCE_ACCOUNT_CLOSED: {id: 152, name: "balance_account:closed"},

  // FX server time
  TIME: {id: 1000, name: "time:v1"},
  FX_ST_REQUEST: {id: 1012, name: "fx:st:request"},
  FX_ST_CHANGE: {id: 1009, name: "fx:st:change"},

  // FX candles
  FX_CANDLES_HISTORY: {id: 1004, name: "fx:candles:history"},
  FX_CANDLES_SUBSCRIBE: {id: 1005, name: "fx:candles:subscribe"},
  FX_CANDLES_UNSUBSCRIBE: {id: 1006, name: "fx:candles:unsubscribe"},
  FX_CANDLES_ALLSUB: {id: 1007, name: "fx:candles:allsub"},
  FX_CANDLES_ALLUNSUB: {id: 1008, name: "fx:candles:allunsub"},
  FX_CANDLE_CHANGE: {id: 1001, name: "fx:candle:change"},
  FX_CANDLES_ALL: {id: 1003, name: "fx:candles:all"},

  // FX ticks
  FX_TICKS_SUBSCRIBE: {id: 1010, name: "fx:ticks:subscribe"},
  FX_TICKS_UNSUBSCRIBE: {id: 1011, name: "fx:ticks:unsubscribe"},
  FX_TICKS_ALLSUB: {id: 1017, name: "fx:ticks:allsub"},
  FX_TICKS_ALLUNSUB: {id: 1018, name: "fx:ticks:allunsub"},
  FX_TICK_CHANGE: {id: 1002, name: "fx:tick:change"},
  FX_TICKS_ALL: {id: 1016, name: "fx:ticks:all"},

  // FX order book (scale 1, 10, 100, 1000)
  FX_MARKET_SUBSCRIBE: {id: 1013, name: "fx:market:subscribe"},
  FX_MARKET_UNSUBSCRIBE: {id: 1014, name: "fx:market:unsubscribe"},
  FX_MARKET_CHANGE: {id: 1015, name: "fx:market:change"},

  // FX deals (positions)
  FX_DEALS_OPENING: {id: 1032, name: "fx:deals:opening"},
  FX_DEALS_CLOSING: {id: 1033, name: "fx:deals:closing"},
  FX_DEALS_CHANGING: {id: 1034, name: "fx:deals:changing"},
  FX_DEALS_CROSS_LIQ_CALC: {id: 1048, name: "fx:deals:cross_liquidation:calculate"},
  FX_DEALS_OPEN: {id: 1038, name: "fx:deals:open"},
  FX_DEALS_CLOSED: {id: 1037, name: "fx:deals:closed"},
  FX_DEALS_CHANGE: {id: 1039, name: "fx:deals:change"},
  FX_DEALS_PROCEED_MIN: {id: 1030, name: "fx:deals:proceed_min"},

  // FX orders (limit orders)
  FX_ORDERS_OPENING: {id: 1065, name: "fx:orders:opening:v2"},
  FX_ORDERS_CANCELING: {id: 1066, name: "fx:orders:canceling:v2"},
  FX_ORDERS_CANCELING_ALL: {id: 1068, name: "fx:orders:canceling_all:v1"},
  FX_ORDERS_UPDATED: {id: 1064, name: "fx:orders:updated:v2"},

  // FX instruments
  FX_INSTRUMENT_CHANGE: {id: 1054, name: "fx:instrument:change:v2"},
  FX_INSTRUMENT_DISABLE: {id: 1076, name: "fx:instrument:disable"},

  // Trading account
  TRADING_ACCOUNT_LIST: {id: 1047, name: "trading_account:list"},
  TRADING_ACCOUNT_CREATED: {id: 1049, name: "trading_account:created"},
  FX_BALANCE_CHANGE: {id: 1046, name: "fx:balance:change"},

  // Lighthouse signals
  HIGHLIGHT_AVAILABLE_V3: {id: 704, name: "highlight:available:v3"},
  HIGHLIGHT_HIDDEN: {id: 702, name: "highlight:hidden:v1"},
  HIGHLIGHT_BLOCKED: {id: 703, name: "highlight:blocked:v1"},

  // Predictions
  PREDICTION_DEAL_OPEN: {id: 1703, name: "prediction:deal:open:v1"},
  PREDICTION_BLOCK_SNAPSHOT: {id: 1700, name: "prediction:block:v1"},
  PREDICTION_BLOCK_UPDATE: {id: 1701, name: "prediction:block:update:v1"},
  PREDICTION_DEAL_UPDATE: {id: 1702, name: "prediction:deal:update:v1"},
  PREDICTION_INSTRUMENT_UPDATE: {id: 1704, name: "prediction:instrument:update:v1"},

  // Chat
  CHAT_MESSAGE_SEND: {id: 1901, name: "chat:message:send:v1"},
  CHAT_MESSAGE_UPDATE: {id: 1900, name: "chat:message:update:v1"},
  CHAT_SUGGESTION_UPDATE: {id: 1902, name: "chat:suggestion:update:v1"},

  // Inbox
  NOTIFICATION_READ: {id: 1200, name: "notification:read:v1"},
  NOTIFICATION_NEW: {id: 1201, name: "notification:new:v1"},
  NOTIFICATION_DELETE: {id: 1202, name: "notification:delete:v1"},

  // Memepool execution events
  MEMEPOOL_MARKET_ORDER_EXECUTED: {id: 1600, name: "memepool:market_order:executed:v1"},

  // Swap
  SPOT_SWAP_EXECUTED: {id: 2000, name: "spot:swap:executed:v1"},

  // AI agent lifecycle (autotrading sessions)
  AITRADING_SESSION_CREATED: {id: 2100, name: "aitrading:session:created:v1"},
  AITRADING_SESSION_UPDATED: {id: 2101, name: "aitrading:session:updated:v1"},

  // System
  CONNECTION_CLOSING: {id: 220, name: "connection:closing"},
  REFRESH: {id: 1500, name: "refresh:v1"},
  EXCHANGE_RATES_USD_CHANGED: {id: 800, name: "exchange_rates:usd_rates:changed:v1"},
  VERIFICATION: {id: 1800, name: "verification:v1"},
} as const;

// -- WS payload shapes ---------------------------------------------------

export interface SimpleTick {
  /** pair, e.g. "BTCUSD" */
  p: string;
  /** quote price */
  q: number;
  /** ask */
  a: number;
  /** bid */
  b: number;
  /** time (unix seconds, float) */
  t: number;
  /** volume */
  v: number;
  /** commission rate */
  c: number;
}

export interface CandleHistoryReq {
  pair: string;
  /** unix seconds */
  from?: number;
  /** unix seconds */
  to?: number;
  /** timeframe in seconds (60, 300, 900, 3600, 14400, 86400, 604800) */
  size?: number;
  limit?: number;
  /** if true, include current incomplete candle */
  solid?: boolean;
}

export interface Candle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleHistoryRes {
  p: string;
  tf: number;
  candles: Candle[];
  quotes?: Array<{t: number; q: number}>;
}

export interface MarketSubscriptionReq {
  pair: string;
  /** 1, 10, 100, or 1000 */
  scale: number;
}

export interface OrderBookLevel {
  /** price */
  p: number;
  /** amount */
  a: number;
}

export interface OrderBookFrame {
  /** pair */
  p: string;
  /** scale */
  s: number;
  /** time (ms) */
  t: number;
  /** asks */
  a: OrderBookLevel[];
  /** bids */
  b: OrderBookLevel[];
  /** sentiment {a: ask%, b: bid%} */
  c: {a: number; b: number};
}

export type DealDir = "long" | "short";
export type MarginType = "isolated" | "cross";

export interface DealOpenReq {
  account_id: number;
  pair: string;
  amount: string;
  dir: DealDir;
  multiplicator: number; // leverage
  margin_type: MarginType;
  group: string;
  highlight_id?: number;
  stop_loss?: APIStopLoss;
  take_profit?: APITakeProfit;
}

export interface APIStopLoss {
  type: string; // "price", "amount", "percent"
  value: string;
  trailing: boolean;
  trailing_step: number;
}

export interface APITakeProfit {
  type: string;
  value: string;
}

export interface APIDeal {
  id: number;
  user_id: number;
  account_id: number;
  pair: string;
  currency: string;
  dir: string;
  margin_type: string;
  multiplicator: number;
  amount: string;
  volume: string;
  price_open: number;
  price_current: number;
  price_close: number;
  floating_pnl: string;
  realized_pnl: string;
  commission: string;
  commission_open: string;
  commission_close: string;
  commission_swap: string;
  next_swap: string;
  success_fee: string;
  success_fee_rate: number;
  stop_out_price: number;
  status: string;
  closing_reason: string;
  source_type?: "highlight" | "autotrading" | "copytrading" | "aitrading";
  source_id?: number;
  highlight_id?: number;
  autotrading_session_id?: number;
  stop_loss?: APIStopLoss;
  take_profit?: APITakeProfit;
  group: string;
  time_open: number;
  time_close: number;
  time_course_open: number;
}

export interface BalanceFrame {
  account_id: number;
  amount: string;
  amount_free: string;
  group: string;
}

export interface PredictionBlock {
  uid: string;
  n: number;
  instrument_id: number;
  status: "announced" | "opened" | "closed" | "settled";
  open_at: number;
  lock_at: number;
  close_at: number;
  open_price?: string;
  open_price_time?: number;
  close_price?: string;
  close_price_time?: number;
  up_count: number;
  down_count: number;
  up_amount_usd: string;
  down_amount_usd: string;
  commission_rate: string;
  v: number; // version
}

export interface PredictionDealOpenReq {
  account_id: number;
  block_uid: string;
  amount: string;
  direction: "up" | "down";
}

export interface PredictionDeal {
  uid: string;
  account_id: number;
  block_uid: string;
  instrument_id: number;
  direction: "up" | "down";
  amount: string;
  amount_usd: string;
  currency: string;
  realized_pnl: string;
  realized_pnl_usd: string;
  status: "opened" | "closed";
  close_reason?: "win" | "lose" | "flat" | "no_liquidity";
  created_at: number;
}

export interface ChatMessageSendReq {
  agent_id: number;
  conversation_uid: string;
  content: string;
  external_uid: string; // client-generated dedup id
}

export interface ChatMessage {
  message_uid: string;
  conversation_uid: string;
  external_uid: string;
  reply_message_uid?: string;
  sender: {id: number; role: "user" | "agent"};
  content: string;
  suggestions: Array<{text: string}>;
  widget?: string;
  widget_payload?: string;
  created_at: number;
}
