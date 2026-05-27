import {useEffect, useRef} from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

import {mockCandles, PAIRS} from "../../lib/mock/data";
import {fetchCandleHistory, walbiSocket} from "../../lib/api/ws";
import {WS_EVENT} from "../../lib/api/walbi-types";

// Timeframe in seconds. Default 1H — matches the Trade page toolbar.
interface Props {
  pair: string;
  height?: number;
  /** seconds: 60, 300, 900, 3600, 14400, 86400, 604800 */
  size?: number;
}

interface FxCandleChange {
  p?: string;
  tf?: number;
  candle?: {t: number; open: number; high: number; low: number; close: number; volume?: number};
}

export function CandleChart({pair, height = 380, size = 3600}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;
    // Pull colors from our design tokens so chart matches the rest of the UI.
    const css = getComputedStyle(document.documentElement);
    const success = css.getPropertyValue("--color-success").trim() || "#22c55e";
    const danger = css.getPropertyValue("--color-danger").trim() || "#ef4444";
    const mono = css.getPropertyValue("--font-mono").trim() || "JetBrains Mono, monospace";
    const muted = "oklch(60% 0.012 230)";
    const hairline = "oklch(28% 0.012 230 / 0.4)";

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: {color: "transparent"},
        textColor: muted,
        fontFamily: mono,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: {color: hairline, style: 0},
        horzLines: {color: hairline, style: 0},
      },
      rightPriceScale: {borderVisible: false},
      timeScale: {borderVisible: false, timeVisible: true},
      crosshair: {mode: 1},
      handleScale: true,
      handleScroll: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: success,
      downColor: danger,
      borderUpColor: success,
      borderDownColor: danger,
      wickUpColor: success,
      wickDownColor: danger,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.resize(containerRef.current.clientWidth, height);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Load history + subscribe to live updates when pair/tf changes
  useEffect(() => {
    if (!seriesRef.current) return;
    const series = seriesRef.current;
    let cancelled = false;
    let unsubscribePush: (() => void) | null = null;
    let unsubscribeFromServer: (() => Promise<void>) | null = null;
    let fallbackInterval: number | null = null;

    (async () => {
      try {
        const hist = await fetchCandleHistory(pair, size, 300);
        if (cancelled) return;
        const data: CandlestickData[] = (hist.candles ?? [])
          .map((c) => ({
            time: c.t as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
          .sort((a, b) => (a.time as number) - (b.time as number));
        if (data.length === 0) throw new Error("no candles");
        series.setData(data);
        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        console.warn("[CandleChart] history failed, falling back to mock", err);
        const pairData = PAIRS.find((p) => p.symbol === pair);
        if (!pairData || cancelled) return;
        const data: CandlestickData[] = mockCandles(pairData.price).map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        series.setData(data);
        chartRef.current?.timeScale().fitContent();
        fallbackInterval = window.setInterval(() => {
          const last = data[data.length - 1];
          const drift = (Math.random() - 0.5) * pairData.price * 0.0005;
          const updated: CandlestickData = {
            time: last.time,
            open: last.open,
            high: Math.max(last.high, last.close + Math.max(0, drift)),
            low: Math.min(last.low, last.close + Math.min(0, drift)),
            close: +(last.close + drift).toFixed(pairData.price < 1 ? 6 : 2),
          };
          data[data.length - 1] = updated;
          series.update(updated);
        }, 1000);
      }

      if (cancelled) return;

      // Live updates via WS — subscribe and listen for fx:candle:change
      try {
        await walbiSocket.request(WS_EVENT.FX_CANDLES_SUBSCRIBE.name, {pair, size});
        unsubscribeFromServer = async () => {
          try {
            await walbiSocket.request(WS_EVENT.FX_CANDLES_UNSUBSCRIBE.name, {pair, size});
          } catch {
            // ignore
          }
        };
      } catch (err) {
        console.warn("[CandleChart] subscribe failed", err);
      }

      unsubscribePush = walbiSocket.subscribePush<FxCandleChange>(
        WS_EVENT.FX_CANDLE_CHANGE.name,
        (raw) => {
          const msg = raw as FxCandleChange;
          if (!msg || msg.p !== pair || msg.tf !== size) return;
          const c = msg.candle;
          if (!c) return;
          series.update({
            time: c.t as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      if (fallbackInterval != null) window.clearInterval(fallbackInterval);
      if (unsubscribePush) unsubscribePush();
      if (unsubscribeFromServer) void unsubscribeFromServer();
    };
  }, [pair, size]);

  return <div ref={containerRef} className="h-full w-full" />;
}
