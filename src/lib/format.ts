// Locale-aware formatters. All values shown to the user in ru-RU.

const nfUSD = new Intl.NumberFormat("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const nfUSDCompact = new Intl.NumberFormat("ru-RU", {notation: "compact", maximumFractionDigits: 1});
const nfPct = new Intl.NumberFormat("ru-RU", {style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero"});
const nfNumber = new Intl.NumberFormat("ru-RU");

export function usd(n: number, hidden = false): string {
  if (hidden) return "••••";
  return nfUSD.format(n);
}

export function usdCompact(n: number): string {
  if (n >= 1e6) return nfUSDCompact.format(n) + " $";
  if (n >= 1e3) return Math.round(n / 1e3) + " тыс. $";
  return nfUSD.format(n) + " $";
}

export function pct(n: number): string {
  return nfPct.format(n);
}

export function num(n: number): string {
  return nfNumber.format(n);
}

export function relativeTime(ts: number): string {
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff} сек. назад`;
  if (diff < 3600) return `${Math.round(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.round(diff / 3600)} ч. назад`;
  return `${Math.round(diff / 86400)} д. назад`;
}

export function priceFmt(price: number): string {
  if (price >= 100) return nfUSD.format(price);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.001) return price.toFixed(5);
  return price.toFixed(6);
}

export function clockFmt(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
