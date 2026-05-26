// Domain types — mirror the WALBI MCP API response shapes so swapping mock
// for real data later is a one-line change in each `useQuery` hook.

export interface TradingPair {
  symbol: string; // BTCUSD, DOGUSD, ETHUSD…
  base: string;
  quote: string;
  price: number;
  change24h: number; // -1..1
  volume24h: number;
  ask: number;
  bid: number;
  maxLeverage: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
}

export interface OrderBook {
  pair: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  pair: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  pnl: number;
  pnlPct: number;
  liquidationPrice: number;
}

export interface SubAccount {
  id: "funding" | "trading" | "ai-agents" | "memepool";
  name: string;
  balance: number;
  shareUsd: number;
  color: string;
  actions: Array<"deposit" | "withdraw" | "transfer" | "swap">;
}

export interface Asset {
  symbol: string;
  name: string;
  iconColor: string;
  balance: number;
  priceUsd: number;
  changePct: number;
}

export type AgentRiskLevel = "low" | "medium" | "high";

export interface Agent {
  id: string;
  name: string;
  description: string;
  riskLevel: AgentRiskLevel;
  apr30d: number; // -0.21..+5.88
  followers: number;
  balanceUsdt: number;
  pnlUsdt: number;
  pnlPct: number;
  openPositions: number;
  avatarUrl?: string;
  badge?: "verified" | "trending" | "hiring";
  pinned?: boolean;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  role: "user" | "agent" | "system";
  text: string;
  timestamp: number;
  thinking?: string;
  actions?: Array<{label: string; onClick?: () => void}>;
}

export interface MemecoinToken {
  symbol: string;
  name: string;
  iconColor: string;
  priceUsd: number;
  changePct: number;
  marketCapUsd: number;
  volume24hUsd: number;
  verified: boolean;
  trending?: boolean;
}

export interface SignalCard {
  id: string;
  agentName: string;
  agentAvatar: string;
  pair: string;
  side: "long" | "short";
  text: string;
  postedAt: number;
  amountUsdt: number;
  leverage: number;
  takeProfitPct: number;
  stopLossPct: number;
  autoTrade: boolean;
}

export interface PredictionBlock {
  id: string;
  pair: string;
  timeframeSec: number;
  endsAt: number;
  longAmount: number;
  shortAmount: number;
  participants: number;
  myShare: number;
  myPayout: number;
  status: "active" | "settling" | "finished";
  outcome?: "long" | "short" | "draw";
}

export type AlertType = "price-anomaly" | "volume-spike" | "agent-position" | "order-executed";

export interface InboxAlert {
  id: string;
  type: AlertType;
  emoji: string;
  title: string;
  body: string;
  category: "Торговля" | "AI агент" | "Поддержка";
  agentName?: string;
  pair?: string;
  timestamp: number;
  read: boolean;
  deeplinkTo?: string;
}

export interface EarnTask {
  id: string;
  title: string;
  description: string;
  rewardPts: number;
  status: "active" | "completed";
  cta?: string;
}

export interface AirdropEntry {
  id: string;
  name: string;
  prizeUsd: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
}
