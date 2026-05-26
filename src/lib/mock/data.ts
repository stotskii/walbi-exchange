// Mock data realistic enough that every screen looks alive without backend.
// Numbers borrow directly from the Walbi audit captures so demos feel honest.

import type {
  Agent,
  AirdropEntry,
  Asset,
  ChatMessage,
  EarnTask,
  InboxAlert,
  MemecoinToken,
  OrderBook,
  Position,
  PredictionBlock,
  SignalCard,
  SubAccount,
  TradingPair,
} from "./types";

export const PAIRS: TradingPair[] = [
  {symbol: "BTCUSD", base: "BTC", quote: "USD", price: 77235.02, change24h: 0.0118, volume24h: 1842300000, ask: 77235.03, bid: 77235.01, maxLeverage: 200},
  {symbol: "ETHUSD", base: "ETH", quote: "USD", price: 2109.57, change24h: -0.0042, volume24h: 924100000, ask: 2109.62, bid: 2109.51, maxLeverage: 100},
  {symbol: "DOGUSD", base: "DOGE", quote: "USD", price: 0.1023, change24h: 0.0314, volume24h: 218400000, ask: 0.1024, bid: 0.1023, maxLeverage: 50},
  {symbol: "SOLUSD", base: "SOL", quote: "USD", price: 142.18, change24h: 0.0252, volume24h: 412200000, ask: 142.22, bid: 142.15, maxLeverage: 100},
  {symbol: "TONUSD", base: "TON", quote: "USD", price: 2.047, change24h: -0.0312, volume24h: 86400000, ask: 2.048, bid: 2.046, maxLeverage: 50},
  {symbol: "TRXUSD", base: "TRX", quote: "USD", price: 0.3712, change24h: 0.121, volume24h: 178200000, ask: 0.3714, bid: 0.3710, maxLeverage: 50},
  {symbol: "WLDUSD", base: "WLD", quote: "USD", price: 0.338, change24h: 0.0368, volume24h: 41200000, ask: 0.339, bid: 0.337, maxLeverage: 50},
  {symbol: "AVXUSD", base: "AVAX", quote: "USD", price: 9.3555, change24h: -0.0188, volume24h: 38400000, ask: 9.36, bid: 9.35, maxLeverage: 50},
];

export function mockOrderBook(pair: string, midPrice: number): OrderBook {
  const step = midPrice < 1 ? 0.0001 : midPrice < 100 ? 0.01 : 1;
  const bids = Array.from({length: 15}, (_, i) => ({
    price: +(midPrice - step * (i + 1)).toFixed(midPrice < 1 ? 4 : 2),
    amount: +(Math.random() * 9000 + 500).toFixed(2),
  }));
  const asks = Array.from({length: 15}, (_, i) => ({
    price: +(midPrice + step * (i + 1)).toFixed(midPrice < 1 ? 4 : 2),
    amount: +(Math.random() * 9000 + 500).toFixed(2),
  }));
  return {pair, bids, asks};
}

export function mockCandles(midPrice: number, count = 200) {
  const out: {time: number; open: number; high: number; low: number; close: number; volume: number}[] = [];
  const now = Math.floor(Date.now() / 1000);
  let price = midPrice;
  for (let i = count - 1; i >= 0; i--) {
    const drift = (Math.random() - 0.5) * midPrice * 0.005;
    const open = price;
    const close = +(price + drift).toFixed(midPrice < 1 ? 6 : 2);
    const high = +Math.max(open, close, open + Math.random() * midPrice * 0.003).toFixed(midPrice < 1 ? 6 : 2);
    const low = +Math.min(open, close, open - Math.random() * midPrice * 0.003).toFixed(midPrice < 1 ? 6 : 2);
    out.push({
      time: now - i * 3600,
      open,
      high,
      low,
      close,
      volume: +(Math.random() * 500 + 50).toFixed(2),
    });
    price = close;
  }
  return out;
}

export const SUB_ACCOUNTS: SubAccount[] = [
  {id: "funding", name: "Фандинговый", balance: 59014, shareUsd: 0.6158, color: "#aa3bff", actions: ["deposit", "withdraw", "transfer", "swap"]},
  {id: "trading", name: "Торговый", balance: 5554.2, shareUsd: 0.0579, color: "#22c55e", actions: ["deposit", "transfer"]},
  {id: "ai-agents", name: "ИИ-агенты", balance: 31270.8, shareUsd: 0.3263, color: "#f97316", actions: ["transfer"]},
  {id: "memepool", name: "Мемепул", balance: 0, shareUsd: 0, color: "#06b6d4", actions: ["deposit", "withdraw", "transfer"]},
];

export const ASSETS: Asset[] = [
  {symbol: "USDT", name: "Tether", iconColor: "#26a17b", balance: 95963.73, priceUsd: 0.99, changePct: 0.0002},
  {symbol: "USDC", name: "USD Coin", iconColor: "#2775ca", balance: 0, priceUsd: 1.0, changePct: 0},
  {symbol: "BNB", name: "BNB", iconColor: "#f3ba2f", balance: 0, priceUsd: 660.6, changePct: 0.0182},
  {symbol: "BTC", name: "Bitcoin", iconColor: "#f7931a", balance: 0, priceUsd: 77160.0, changePct: 0.0118},
  {symbol: "DOGE", name: "Doge Coin", iconColor: "#c2a633", balance: 0, priceUsd: 0.1023, changePct: 0.0314},
  {symbol: "ETH", name: "Ethereum", iconColor: "#627eea", balance: 0, priceUsd: 2109.57, changePct: -0.0042},
  {symbol: "TRX", name: "Tron", iconColor: "#ef0027", balance: 0, priceUsd: 0.3712, changePct: 0.121},
];

export const AGENTS: Agent[] = [
  {id: "traffic-light-custom", name: "Traffic Light Custom", description: "Адаптивный мульти-таймфрейм скальпер на основе MACD + объёма", riskLevel: "high", apr30d: 5.88, followers: 1842, balanceUsdt: 948.63, pnlUsdt: -51.43, pnlPct: -0.052, openPositions: 1, badge: "trending", pinned: true},
  {id: "traffic-light", name: "Traffic Light", description: "Базовый трендовый бот, ловит начало движения по 15M", riskLevel: "medium", apr30d: 1.42, followers: 3412, balanceUsdt: 1038.09, pnlUsdt: 38.67, pnlPct: 0.039, openPositions: 0, badge: "verified"},
  {id: "mc-whale-03", name: "MC Whale 03", description: "Анализирует депозиты крупных кошельков и зеркалит движения", riskLevel: "high", apr30d: 0.91, followers: 821, balanceUsdt: 950.53, pnlUsdt: -49.47, pnlPct: -0.049, openPositions: 0},
  {id: "ai-mikado", name: "AI Mikado", description: "Японские свечные паттерны через LLM-визор", riskLevel: "medium", apr30d: 0.07, followers: 612, balanceUsdt: 1000.0, pnlUsdt: 0, pnlPct: 0, openPositions: 0},
  {id: "carlos-03", name: "Carlos 03", description: "Контртрендовый бот для волатильных альтов", riskLevel: "high", apr30d: -0.17, followers: 234, balanceUsdt: 828.26, pnlUsdt: -171.74, pnlPct: -0.171, openPositions: 0},
  {id: "price-action-03", name: "Price Action 03", description: "Чистый price action на BTC, без индикаторов", riskLevel: "low", apr30d: -0.21, followers: 891, balanceUsdt: 785.47, pnlUsdt: -214.53, pnlPct: -0.214, openPositions: 0},
  {id: "anti-crowd-03", name: "Anti Crowd 03", description: "Шортит когда толпа покупает, лонгует когда паника", riskLevel: "high", apr30d: 0.017, followers: 167, balanceUsdt: 1016.94, pnlUsdt: 16.94, pnlPct: 0.017, openPositions: 0},
  {id: "macro-reflex-03", name: "Macro Reflex 03", description: "Реагирует на макроэкономические новости через RSS", riskLevel: "medium", apr30d: 0.028, followers: 423, balanceUsdt: 1027.74, pnlUsdt: 27.74, pnlPct: 0.028, openPositions: 0},
  {id: "trend-driven-03", name: "Trend Driven 03", description: "Чистый трендследящий, заходит после подтверждения", riskLevel: "low", apr30d: -0.062, followers: 1023, balanceUsdt: 938.49, pnlUsdt: -61.51, pnlPct: -0.062, openPositions: 0},
  {id: "market-regime-03", name: "Market Regime 03", description: "Классифицирует режим рынка и адаптирует стратегию", riskLevel: "medium", apr30d: -0.0006, followers: 234, balanceUsdt: 999.42, pnlUsdt: -0.58, pnlPct: -0.0006, openPositions: 0},
  {id: "mommy-03", name: "Mommy 03", description: "Защитная мама-стратегия: только консервативные лонги", riskLevel: "low", apr30d: 0.060, followers: 1842, balanceUsdt: 1060.34, pnlUsdt: 60.34, pnlPct: 0.060, openPositions: 0, badge: "verified"},
  {id: "ai-consensus-03", name: "AI Consensus 03", description: "Усредняет сигналы 5 других агентов и торгует по консенсусу", riskLevel: "medium", apr30d: -0.0097, followers: 542, balanceUsdt: 990.28, pnlUsdt: -9.72, pnlPct: -0.0097, openPositions: 0},
];

export const MOCK_POSITIONS: Position[] = [
  {id: "p1", pair: "C98USD", side: "long", size: 61.03, entryPrice: 0.0192, markPrice: 0.0198, leverage: 30, pnl: 1.84, pnlPct: 0.031, liquidationPrice: 0.0179},
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {id: "m1", agentId: "meta", role: "agent", text: "Привет! Я Мета чат. Помогу запустить стратегию, открыть позицию или разобраться в рынке. Спроси что-нибудь — например, «покажи PnL за неделю» или «открой лонг BTC на ×3».", timestamp: Date.now() - 5 * 60_000},
  {id: "m2", agentId: "meta", role: "user", text: "Покажи дневной P&L по всем агентам", timestamp: Date.now() - 4 * 60_000},
  {id: "m3", agentId: "meta", role: "agent", text: "За последние 24 часа: 8 агентов в плюсе, 4 в минусе. Чистый PnL: +12,40 USDT. Лидер — Mommy 03 (+60,34 USDT, +6%), отстающий — Price Action 03 (−214,53 USDT, −21%).", timestamp: Date.now() - 4 * 60_000 + 800, thinking: "Запрашиваю agent/session/list/v1, агрегирую дельты за 24h, сортирую."},
  {id: "m4", agentId: "meta", role: "user", text: "Включи Traffic Light Custom на ×5", timestamp: Date.now() - 3 * 60_000},
  {id: "m5", agentId: "meta", role: "agent", text: "Готово ✓ Traffic Light Custom активирован, плечо ×5, риск-лимит 100 USDT/день. Стоп-лосс на каждой позиции автоматически = 2% от размера. Буду пинговать при открытии/закрытии.", timestamp: Date.now() - 3 * 60_000 + 1200},
];

export const MEMECOINS: MemecoinToken[] = [
  {symbol: "ASTEROID", name: "Asteroid The Space Shiba Inu", iconColor: "#a855f7", priceUsd: 0.01, changePct: 0.29, marketCapUsd: 845_000, volume24hUsd: 124_000, verified: true, trending: true},
  {symbol: "AVICI", name: "Avici", iconColor: "#06b6d4", priceUsd: 0.76, changePct: 0.28, marketCapUsd: 7_600_000, volume24hUsd: 1_240_000, verified: true, trending: true},
  {symbol: "CARDS", name: "Collector Crypt", iconColor: "#f59e0b", priceUsd: 0.15, changePct: 0.16, marketCapUsd: 3_200_000, volume24hUsd: 412_000, verified: true, trending: true},
  {symbol: "OPENCLAW", name: "OpenClaw", iconColor: "#ef4444", priceUsd: 0.0001, changePct: 92, marketCapUsd: 102_000, volume24hUsd: 8_400_000, verified: false, trending: true},
  {symbol: "UMBRA", name: "Umbra", iconColor: "#8b5cf6", priceUsd: 0.55, changePct: 0.43, marketCapUsd: 4_100_000, volume24hUsd: 612_000, verified: true},
  {symbol: "USELESS", name: "USELESS COIN", iconColor: "#64748b", priceUsd: 0.08, changePct: 0.12, marketCapUsd: 1_240_000, volume24hUsd: 184_000, verified: false},
  {symbol: "ZEREBRO", name: "zerebro", iconColor: "#22c55e", priceUsd: 0.02, changePct: 0.22, marketCapUsd: 924_000, volume24hUsd: 142_000, verified: true},
  {symbol: "ALPIE", name: "Alpie", iconColor: "#a3e635", priceUsd: 1.09, changePct: 0.46, marketCapUsd: 521_000, volume24hUsd: 71_000, verified: true},
  {symbol: "IBACK", name: "America Is Back", iconColor: "#dc2626", priceUsd: 0.0098, changePct: 0.39, marketCapUsd: 1_200_000, volume24hUsd: 184_000, verified: false},
  {symbol: "AUDIO", name: "Audius (Wormhole)", iconColor: "#3b82f6", priceUsd: 0.01, changePct: 0.0098, marketCapUsd: 857_000, volume24hUsd: 92_000, verified: true},
  {symbol: "AVAAI", name: "Ava AI", iconColor: "#ec4899", priceUsd: 0.0042, changePct: 0.036, marketCapUsd: 6_900_000, volume24hUsd: 412_000, verified: true},
  {symbol: "BABY", name: "Baby Troll", iconColor: "#f97316", priceUsd: 0.0008, changePct: 0.13, marketCapUsd: 620_000, volume24hUsd: 84_000, verified: false},
  {symbol: "BILLY", name: "BILLY", iconColor: "#facc15", priceUsd: 0.0089, changePct: 0.18, marketCapUsd: 686_000, volume24hUsd: 92_000, verified: false},
];

export function mockSignals(): SignalCard[] {
  return [
    {id: "s1", agentName: "Mommy", agentAvatar: "M", pair: "BTC", side: "long", text: "Babylon Labs хочет добавить возможность использовать настоящий Bitcoin как залог для займа на Aave, без посредников. Это первый раз нативный BTC на L2-credit-маркетах.", postedAt: Date.now() - 4 * 60_000, amountUsdt: 278, leverage: 10, takeProfitPct: 0.32, stopLossPct: 0.13, autoTrade: true},
    {id: "s2", agentName: "Carlos", agentAvatar: "C", pair: "ETH", side: "long", text: "Vitalik опубликовал статью про zk-EVM enshrining. Long-term bullish для всего ETH стека. Ожидаю реакцию рынка на следующих сессиях.", postedAt: Date.now() - 8 * 60_000, amountUsdt: 668, leverage: 30, takeProfitPct: 0.28, stopLossPct: 0.02, autoTrade: false},
    {id: "s3", agentName: "Macro Reflex", agentAvatar: "MR", pair: "SOL", side: "short", text: "FTX estate начал распродажу 380M SOL transparently через CCM. Краткосрочное давление неизбежно.", postedAt: Date.now() - 12 * 60_000, amountUsdt: 412, leverage: 20, takeProfitPct: 0.18, stopLossPct: 0.08, autoTrade: false},
    {id: "s4", agentName: "AI Mikado", agentAvatar: "AM", pair: "DOGE", side: "long", text: "Сформировался Hammer на дневном таймфрейме после 3 красных свечей. Классический разворотный сигнал, особенно с подтверждением объёмом.", postedAt: Date.now() - 18 * 60_000, amountUsdt: 218, leverage: 5, takeProfitPct: 0.15, stopLossPct: 0.05, autoTrade: false},
  ];
}

export function mockPredictionBlocks(): PredictionBlock[] {
  return [
    {id: "596266", pair: "BTCUSD", timeframeSec: 60, endsAt: Date.now() + 58_000, longAmount: 14, shortAmount: 13, participants: 3, myShare: 0, myPayout: 0, status: "active"},
    {id: "596265", pair: "BTCUSD", timeframeSec: 60, endsAt: Date.now() - 2_000, longAmount: 22, shortAmount: 19, participants: 5, myShare: 0, myPayout: 0, status: "settling", outcome: "long"},
    {id: "596264", pair: "BTCUSD", timeframeSec: 60, endsAt: Date.now() - 62_000, longAmount: 23, shortAmount: 27, participants: 4, myShare: 0, myPayout: 0, status: "finished", outcome: "short"},
    {id: "596263", pair: "BTCUSD", timeframeSec: 60, endsAt: Date.now() - 122_000, longAmount: 41, shortAmount: 18, participants: 7, myShare: 0, myPayout: 0, status: "finished", outcome: "long"},
  ];
}

export const INBOX_ALERTS: InboxAlert[] = [
  {id: "a1", type: "price-anomaly", emoji: "🟢", title: "15M таймфрейм: аномальное отклонение цены", body: "WLD волатильность 3.68%, 0.326 → 0.338", category: "Торговля", pair: "WLDUSD", timestamp: Date.now() - 30 * 60_000, read: false, deeplinkTo: "/trade?pair=WLDUSD"},
  {id: "a2", type: "volume-spike", emoji: "🚨", title: "1ч объём торгов вырос", body: "TRXUSD +1211.48% в объёме", category: "Торговля", pair: "TRXUSD", timestamp: Date.now() - 90 * 60_000, read: false, deeplinkTo: "/trade?pair=TRXUSD"},
  {id: "a3", type: "price-anomaly", emoji: "🔴", title: "15M таймфрейм: аномальное отклонение цены", body: "TIAUSD волатильность 2.79%, 0.4864 → 0.4732", category: "Торговля", pair: "TIAUSD", timestamp: Date.now() - 120 * 60_000, read: false},
  {id: "a4", type: "price-anomaly", emoji: "🔴", title: "1Ч таймфрейм: аномальное отклонение цены", body: "TONUSD волатильность 7.24%, 2.191 → 2.043", category: "Торговля", pair: "TONUSD", timestamp: Date.now() - 145 * 60_000, read: false},
  {id: "a5", type: "agent-position", emoji: "🎉", title: "Позиция C98USD закрыта", body: "AI агент Traffic Light Custom закрыл позицию с прибылью +0.5433 USDT", category: "AI агент", agentName: "Traffic Light Custom", timestamp: Date.now() - 170 * 60_000, read: true, deeplinkTo: "/"},
  {id: "a6", type: "agent-position", emoji: "🎉", title: "Позиция C98USD закрыта", body: "AI агент Traffic Light закрыл позицию", category: "AI агент", agentName: "Traffic Light", timestamp: Date.now() - 170 * 60_000, read: true, deeplinkTo: "/"},
  {id: "a7", type: "order-executed", emoji: "✓", title: "C98USD ордер исполнен", body: "Ордер с целевой ценой 0.019846 и объёмом 61.032857 USDT был выполнен", category: "Торговля", timestamp: Date.now() - 175 * 60_000, read: true, deeplinkTo: "/trade?pair=C98USD"},
];

export const EARN_TASKS: EarnTask[] = [
  {id: "t1", title: "Первый депозит", description: "Будущий ты скажет тебе спасибо за это.", rewardPts: 0, status: "active", cta: "Получить награду"},
  {id: "t2", title: "Прогнозы", description: "Докажи, что видишь будущее. Сделай прогноз о направлении рынка.", rewardPts: 1000, status: "active"},
  {id: "t3", title: "Telegram канал", description: "Подпишись на Walbi в Telegram.", rewardPts: 1500, status: "completed"},
  {id: "t4", title: "Telegram чат", description: "Присоединись к чату в Telegram.", rewardPts: 1000, status: "active"},
  {id: "t5", title: "Discord", description: "Доступ за кулисы — в Discord Walbi.", rewardPts: 1500, status: "active"},
  {id: "t6", title: "X.com (@walbicom)", description: "Подпишись чтобы видеть хорошие твиты.", rewardPts: 1500, status: "active"},
  {id: "t7", title: "YouTube", description: "Подпишись на канал. Потом скажешь спасибо.", rewardPts: 1500, status: "active"},
  {id: "t8", title: "Threads", description: "Есть мнение? Подписывайся.", rewardPts: 1500, status: "active"},
  {id: "t9", title: "Поделиться сделкой", description: "Время показать себя. Открой сделку и поделись PnL.", rewardPts: 10000, status: "active"},
  {id: "t10", title: "Отзыв на Trustpilot", description: "Напиши отзыв на Trustpilot.", rewardPts: 0, status: "active"},
  {id: "t11", title: "Лайк видео на YouTube", description: "Посмотри как работает Lighthouse в действии.", rewardPts: 1000, status: "active"},
  {id: "t12", title: "Лайк и репост в Twitter", description: "Поставь лайк и сделай репост последнего поста Walbi.", rewardPts: 1000, status: "active"},
  {id: "t13", title: "Реакция и пересылка в Telegram", description: "Лайкни и поделись любым постом.", rewardPts: 1000, status: "active"},
  {id: "t14", title: "Анализ трендов криптовалют", description: "Попробуй ChatGPT-powered анализ графиков.", rewardPts: 1000, status: "active"},
];

export const AIRDROPS: AirdropEntry[] = [
  {id: "ad1", name: "Раффл Walbi AI Agent", prizeUsd: 10_000, startDate: "20.03.2026", endDate: "29.03.2026", status: "completed"},
  {id: "ad2", name: "Новогодний Розыгрыш Walbi × Headliners", prizeUsd: 5_000, startDate: "16.12.2025", endDate: "05.01.2026", status: "completed"},
  {id: "ad3", name: "Walbi × ToshiCrypto", prizeUsd: 3_000, startDate: "06.10.2025", endDate: "11.01.2026", status: "completed"},
  {id: "ad4", name: "Walbi × Bitdegree", prizeUsd: 4_500, startDate: "09.09.2025", endDate: "14.10.2025", status: "completed"},
  {id: "ad5", name: "🧨 Турнирный дроп", prizeUsd: 7_500, startDate: "19.05.2025", endDate: "28.05.2025", status: "completed"},
  {id: "ad6", name: "Новогодние награды Walbi", prizeUsd: 2_000, startDate: "18.12.2024", endDate: "30.12.2024", status: "completed"},
  {id: "ad7", name: "Второй выпуск очков Walbi!", prizeUsd: 1_500, startDate: "08.07.2024", endDate: "18.07.2024", status: "completed"},
  {id: "ad8", name: "Первое начисление Walbi Points!", prizeUsd: 1_000, startDate: "28.06.2024", endDate: "12.07.2024", status: "completed"},
];

export const TOTAL_USD = SUB_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
